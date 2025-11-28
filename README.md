Project Documentation: job scheduler project
1. Project Overview

The Dotix Automation Engine is a simplified job scheduling dashboard designed to manage asynchronous background tasks. It allows users to create jobs with specific payloads and priorities, execute them with simulated processing times, and trigger outbound webhooks upon completion.

The application was built with a focus on observability and modularity, moving beyond simple CRUD operations to visualize the lifecycle of a background process.

2. Architecture & Design Decisions
Backend: Class-Based Logic

Instead of writing business logic directly inside Express routes, I implemented a JobProcessor Class.

Why? This mimics a microservices pattern where the "Runner" is separate from the "API". It allows for better error handling and makes the code testable.

Concurrency Control: The processor explicitly checks if (job.status == 'running') before execution. This prevents race conditions where a user might double-click the run button, triggering the same job twice.

Fire-and-Forget Pattern: The API route triggers the job but does not wait for it to finish. It returns 200 OK immediately, while the job runs in the background. This prevents the browser from timing out on long-running tasks.

Frontend: "Tech-Noir" Brutalist UI

The UI deviates from standard dashboards by using a high-contrast, monochrome aesthetic.

Why? Dashboard tools are often used in low-light environments (NOCs, server rooms). The strict black-and-white palette reduces eye strain and uses borders/depth to highlight active data without relying on distracting colors.

Data Visualization: Instead of a static table, I implemented a Live Terminal and Execution Timeline. This provides immediate visual feedback (e.g., progress bars syncing with job duration) so the user knows the system is alive.

Database Strategy

I used MySQL with a robust schema.

Why? Relational data integrity is crucial for job queues.

Optimization: The status field is an ENUM. This restricts the state to valid transitions (pending -> running -> completed), preventing invalid data states.

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

Challenge 4: Visual Depth without Color

The Problem: Creating a "Modern" UI without using standard colors (Blue/Purple) is difficult because you lose the easiest way to show hierarchy.
The Solution: I utilized CSS Borders and Shadows to create depth layers.

Background: Pure Black (#000000)

Mid-ground: Zinc-950 with white borders.

Foreground: White accents.

This "Wireframe" style creates a distinct, engineering-focused look.

4. Database Schema (ER Diagram Description)

The system uses a single normalized table structure:

code
SQL
download
content_copy
expand_less
TABLE jobs (
    id          INT PK AUTO_INCREMENT,
    taskName    VARCHAR(255) NOT NULL, -- User defined identifier
    payload     TEXT,                  -- JSON payload for the webhook
    priority    ENUM('Low', 'Medium', 'High'),
    status      ENUM('pending', 'running', 'completed', 'failed'),
    duration    INT DEFAULT 3000,      -- Simulation time in ms
    createdAt   TIMESTAMP DEFAULT NOW(),
    updatedAt   TIMESTAMP ON UPDATE NOW()
);
5. API Reference

Method	Endpoint	Description
POST	/jobs	Creates a new job. Accepts taskName, priority, duration, payload.
GET	    /jobs	Returns all jobs, sorted by creation date.
POST	/run-job/:id	Triggers the background worker for a specific ID.
POST	/webhook-test	A local endpoint to receive and log outbound webhooks (for testing).

6. Setup Instructions
Backend
bash`
cd backend
npm install
node server.js`

Frontend

Bash
`
cd frontend
npm install
npm run dev`


AI Usage Disclosure

In compliance with the assignment requirements:

Tools Used: Large Language Models (LLM) for boilerplate generation and debugging.

Specifics: Used to generate the initial Tailwind CSS grid structure and debug a specific MariaDB connection error on Arch Linux. All business logic and architecture decisions were manually reviewed and refined.