# Node.js + MySQL Sample Deployment Setup with Migrations

A production-grade Node.js + Express + MySQL database application designed for testing hosting deployments, LXC containers, Docker compose setups, database connection pooling, and automated schema migrations.

---

## Features

- **Express.js API Engine**: Fast HTTP REST API endpoints (`/api/health`, `/api/db-status`, `/api/items`, `/api/migrations`).
- **Database Schema Migration System**: Automated `.sql` migration runner that tracks applied scripts inside the `schema_migrations` tracking table.
- **MySQL Connection Pool**: Built using `mysql2/promise` with auto-reconnection and database schema auto-migrations on startup.
- **Graceful Fault Tolerance**: Does not crash if MySQL is unreachable—displays real-time diagnostic reporting and troubleshooting advice.
- **Interactive Health & Migration Dashboard**: Glassmorphic UI displaying server uptime, MySQL ping latency, version info, migration status, and interactive CRUD operations.

---

## Project Structure

```
sample-nodejs-mysql/
├── server.js            # Express server & REST API endpoints
├── migrator.js          # Migration runner and status inspection module
├── package.json         # Project dependencies & launch scripts
├── Dockerfile           # Alpine Node container build script
├── docker-compose.yml   # Multi-container setup (Node.js + MySQL 8)
├── .env.example         # Environment template
├── README.md            # Documentation
├── migrations/          # SQL Migration Scripts
│   ├── 001_create_test_records_table.sql
│   ├── 002_create_users_table.sql
│   ├── 003_create_logs_table.sql
│   └── 004_add_category_to_test_records.sql
└── public/
    ├── index.html       # Diagnostic Dashboard & Migrations UI
    ├── style.css        # Responsive Design System
    └── app.js           # Interactive Client API Logic
```

---

## Migration Commands

Run migrations manually using npm scripts:

```bash
# Execute all pending migrations
npm run migrate

# Inspect migration execution status table
npm run migrate:status
```

---

## How to Run

### Option 1: Docker (Recommended)
```bash
cd /home/jose/Desktop/docker/hosting-deploy-testing/sample-nodejs-mysql
docker compose up -d --build
```
Access the application at `http://localhost:3000`.

---

### Option 2: Local Execution

1. Make sure MySQL server is running on port `3306`.
2. Configure `.env` with your credentials:
   ```ini
   PORT=3000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
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
| `GET` | `/api/health` | Server uptime, Node version, environment, & MySQL status. |
| `GET` | `/api/db-status` | Database query ping timing (ms), version, and table counts. |
| `GET` | `/api/migrations` | Migration status, total count, applied list, and pending scripts. |
| `POST` | `/api/migrations/run` | Triggers execution of pending SQL migrations. |
| `GET` | `/api/items` | Fetch all records from `test_records` MySQL table. |
| `POST` | `/api/items` | Insert a new record into `test_records`. |
| `DELETE` | `/api/items/:id` | Remove a record by ID. |
