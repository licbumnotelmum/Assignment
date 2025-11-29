// backend/server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

// setuped a new user dotix_user because linux didnt like root user

const DB_CONFIG = {
    host: 'localhost',
    user: process.env.DBUSER, 
    port : process.env.DBPORT,
    password: process.env.DBPASSWORD,
    database: process.env.DATABAE
};
const WEBHOOK_URL = process.env.WEB_URL;

// Mysql pool connection
const pool = mysql.createPool(DB_CONFIG);

// job processor class
class JobProcessor {
    // Updates status in DB
    static async updateStatus(id, status) {
        await pool.query('UPDATE jobs SET status = ? WHERE id = ?', [status, id]);
    }

    // The core runner 
    static async run(jobId) {
        try {
            // Fetch Job
            const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
            if (rows.length === 0) throw new Error('Job not found');
            const job = rows[0];

            if (job.status === 'running') throw new Error('Job is already running');

            console.log(`[Job ${jobId}] Started: ${job.taskName}`);
            
            // Set Status -> Running
            await this.updateStatus(jobId, 'running');

            // Simulate Processing
            await new Promise(resolve => setTimeout(resolve, job.duration || 3000));

            // Set Status -> Completed
            await this.updateStatus(jobId, 'completed');

            // Trigger Webhook
            await this.triggerWebhook(job);
            
            return { success: true, message: "Job completed successfully" };
        } catch (error) {
            console.error(`[Job ${jobId}] Failed:`, error.message);
            await this.updateStatus(jobId, 'failed'); // Error handling
            throw error;
        }
    }

    static async triggerWebhook(job) {
        const payload = {
            jobId: job.id,
            taskName: job.taskName,
            priority: job.priority,
            data: JSON.parse(job.payload || '{}'),
            completedAt: new Date().toISOString()
        };

        console.log(`[Job ${job.id}] 🚀 Attempting to send webhook to: ${WEBHOOK_URL}`);
        
        try {
            const response = await axios.post(WEBHOOK_URL, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000 // Fail if it takes longer than 5000 ms
            });
            console.log(`[Job ${job.id}] Webhook Success, Status: ${response.status}`);
        } catch (err) {
            console.error("------------------------------------------------");
            console.error(`[Job ${job.id}] WEBHOOK FAILED`);
            if (err.response) {
                // respondes with a status code other than 200
                console.error(`Status Code: ${err.response.status}`);
                console.error(`Response Data:`, err.response.data);
            } else if (err.request) {
                console.error("No response received. Is the target URL correct?");
            } else {
                console.error("Error Message:", err.message);
            }
            console.error("------------------------------------------------");
        }
    }
}

// / API

// job creation
app.post('/jobs', async (req, res) => {
    const { taskName, payload, priority, duration } = req.body;
    try {
        try { JSON.parse(payload); } catch (e) { return res.status(400).json({ error: "Invalid JSON payload" }); }

        const [result] = await pool.query(
            'INSERT INTO jobs (taskName, payload, priority, duration) VALUES (?, ?, ?, ?)',
            [taskName, payload, priority, duration || 3000]
        );
        res.status(201).json({ id: result.insertId, message: 'Job created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// job listing
app.get('/jobs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM jobs ORDER BY createdAt DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Run Job
app.post('/run-job/:id', async (req, res) => {  
    const jobId = req.params.id;
    
    JobProcessor.run(jobId).catch(err => console.error(err));

    res.json({ message: `Job ${jobId} execution started` });
});

// Test Webhook Receiver
app.post('/webhook-test', (req, res) => {
    const event = req.body;
    console.log("WEBHOOK RECEIVED:", JSON.stringify(event, null, 2));
 
    res.json({ received: true });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend running on `,WEBHOOK_URL);
});