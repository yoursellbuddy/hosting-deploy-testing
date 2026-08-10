# Sample Node.js & MySQL Testing Project

A complete, production-grade Node.js + MySQL web application designed for testing hosting deployments, container setups (Docker), and database connection pooling.

---

## Features

- **Express.js API Engine**: Fast HTTP REST API endpoints (`/api/health`, `/api/db-status`, `/api/items`).
- **MySQL Connection Pool**: Built using `mysql2/promise` with auto-reconnection and database schema auto-migrations on startup.
- **Graceful Fault Tolerance**: Does not crash if MySQL is unreachable—displays real-time diagnostic reporting and connection advice.
- **Interactive Health Dashboard**: Glassmorphic UI displaying server uptime, MySQL ping latency, version info, process details, and interactive CRUD operations.
- **Docker Ready**: Includes `Dockerfile` and `docker-compose.yml` pre-configured with Node 20 and MySQL 8.

---

## Project Structure

```
sample-nodejs-mysql/
├── server.js            # Express server & MySQL connection manager
├── package.json         # Project dependencies & launch scripts
├── Dockerfile           # Alpine Node container build script
├── docker-compose.yml   # Multi-container setup (Node.js + MySQL 8)
├── .env                 # Active environment configurations
├── .env.example         # Environment template
├── README.md            # Documentation
└── public/
    ├── index.html       # Diagnostic Dashboard UI
    ├── style.css        # Responsive Design System
    └── app.js           # Interactive Client API Logic
```

---

## How to Run

### Option 1: Docker (Recommended - Zero Setup)
Runs both Node.js server and MySQL 8 container automatically:

```bash
cd /home/jose/Desktop/docker/hosting-deploy-testing/sample-nodejs-mysql
docker compose up -d --build
```
Access the application at `http://localhost:3000`.

---

### Option 2: Local Node.js Execution

1. Make sure MySQL server is running locally on port `3306`.
2. Configure `.env` with your MySQL credentials:
   ```ini
   PORT=3000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=sample_db
   ```
3. Install dependencies and start:
   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:3000` in your web browser.

---

## API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server uptime, Node version, environment, & DB status. |
| `GET` | `/api/db-status` | Database ping timing (ms), version, and table counts. |
| `GET` | `/api/items` | Fetch all records from `test_records` MySQL table. |
| `POST` | `/api/items` | Insert a new record into `test_records`. |
| `DELETE` | `/api/items/:id` | Remove a record by ID. |
