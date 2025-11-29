Project Documentation: job scheduler project
1. Project Overview

The Job Scheduling is a simplified dashboard designed to manage background tasks so called jobs. It allows users to create jobs with specific payloads, time periods and priorities, execute them with simulated processing times, and trigger outbound webhooks upon completion.

The application was built with an idea on observability and modularity, providing more than simple CRUD operations to visualize the lifecycle of a background process.

2. Architecture & Design Decisions
Backend: Class-Based Logic

Instead of writing business logic directly inside Express routes, I implemented a JobProcessor Class.

This mimics a microservices pattern where the "Runner" is separate from the "API". It allows for better error handling.

Concurrency Control: The processor checks `if (job.status === 'running')` before execution. This prevents race conditions where a user might double-click the run button, triggering the same job twice.

Fire-and-Forget Pattern: The API route triggers the job but does not wait for it to finish. It returns 200 OK immediately, while the job runs in the background. This prevents the browser from timing out on long-running tasks.

for frontEnd i used tech-noir ui theam
The black-and-white palette reduces eye strain and uses borders/depth to highlight active data without relying on distracting colors.

Data Visualization: Instead of a static table, I implemented a Live Terminal and Execution Timeline. This provides a visual feedback (e.g., progress bars syncing with job duration) so the user knows the system is alive.

Database Strategy

I used MySQL for creating data integrity which is important for job queues.

Improvement: The status field is an ENUM. This restricts the state to valid transitions (pending -> running -> completed), preventing invalid data states.

3. Technical Challenges & Solutions

During development, several engineering challenges were encountered. Here is how they were solved:

Challenge 1: Handling Variable Job Durations

The Problem: Real-world jobs take different amounts of time. A static "loading spinner" isn't accurate for a job that takes 10 seconds vs. 100 milliseconds.
The Solution: I added a duration column to the database. The frontend reads this value and dynamically calculates the CSS animation speed for the progress bar (animation-duration: ${job.duration}ms). This ensures the UI accurately reflects the server-side process.

Challenge 2: Real-Time State Synchronization

The Problem: When a job completes on the server, the browser doesn't know immediately.
The Solution: While WebSockets (Socket.io) would be the enterprise solution, they introduce significant infrastructure overhead. For this scope, I implemented Short Polling (every 1-2 seconds) using React useEffect.

Optimization: The poll rate is increased only when the window is in focus to save resources.

Challenge 3: Database Connectivity on Linux (Arch/Localhost)

The Problem: Modern MySQL/MariaDB installations often disable TCP networking by default, relying on Unix Sockets. This causes ECONNREFUSED errors in Node.js.
The Solution:

Created a dedicated database user (dotix_user) instead of using root.

Ensured bind-address was configured correctly in my.cnf.

Used explicit port definitions in the connection string to bypass socket issues.


4. Database Schema (ER Diagram Description)

The system uses a single normalized table structure:

code SQL
`
TABLE jobs (
    id          INT PK AUTO_INCREMENT,
    taskName    VARCHAR(255) NOT NULL,
    payload     TEXT,                 
    priority    ENUM('Low', 'Medium', 'High'),
    status      ENUM('pending', 'running', 'completed', 'failed'),
    duration    INT DEFAULT 3000,     
    createdAt   TIMESTAMP DEFAULT NOW(),
    updatedAt   TIMESTAMP ON UPDATE NOW()
);`
5. API Reference

Method	Endpoint	    Description
`POST`	/jobs           Creates a new job. Accepts taskName, priority, duration, payload.
`GET`	/jobs	        Returns all jobs, sorted by creation date.
`POST`	/run-job/:id	Triggers the background worker for a specific ID.
`POST`	/webhook-test	A local endpoint to receive and log outbound webhooks (for testing).

6. Setup Instructions
Backend bash
`
cd backend
npm install
node server.js
`

Frontend Bash
`
cd frontend
npm install
npm run dev
`
7. .ENV file format

WEB_URL = 'your/webhook/link'
DBUSER= 'mysqluser'
DBPORT = integer value of mysql port on which it runs
DBPASSWORD = 'passwordForDBUSER'
DATABAE = 'dotix_scheduler'

8. File Structure (uploading the .env file to git for reference otherwise .gitignore would have the env file)

ASSIGNMENT
|->Backend
|  |->.env
|  |->server.js
|
|->frontend
|  |->App.cdd
|  |->App.jsx
|  |->index.css
|  |->main.jsx
|  
|->README.md

AI Usage 

Tools Used: ChatGPT, Gemini for boilerplate generation and debugging.

Used to generate the initial Tailwind CSS grid structure and debug a specific MariaDB connection error on Arch Linux like setting up ports for database server and generating a ui theam. 

Used Gemini for the API code to generate proper output which matched the database schema and constraints

All logic and architecture decisions were majourly done manually, coded and improved with help from LLMs for debuging.
