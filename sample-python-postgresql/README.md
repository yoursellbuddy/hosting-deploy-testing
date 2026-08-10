# Sample Python Flask & PostgreSQL Project

A production-ready Python Flask & PostgreSQL web application designed for testing web hosting deployments, VPS/LXC servers, WSGI/Gunicorn web server stacks, and database connection pooling.

---

## Features

- **Flask Web Engine**: Lightweight, fast Python WSGI framework (`Flask>=3.0.0`, `psycopg2-binary>=2.9.9`).
- **PostgreSQL Integration**: Auto-connects to PostgreSQL via `psycopg2`, auto-creates target database, and initializes `test_records` table on first run.
- **Production WSGI Ready**: Ships with `gunicorn` configuration for production application deployment.
- **Interactive Health Dashboard**: Glassmorphic UI displaying server uptime, Python version, PostgreSQL query ping latency (ms), process details, and interactive CRUD operations.

---

## Project Structure

```
sample-python-postgresql/
├── app.py                      # Main Flask application & PostgreSQL API routes
├── requirements.txt            # Python dependencies
├── .env                        # Active environment config
├── .env.example                # Environment configuration template
├── README.md                   # Setup & deployment documentation
├── static/
│   ├── style.css               # Responsive Design System
│   └── app.js                  # Interactive Client API Logic
└── templates/
    └── index.html              # Diagnostic UI Dashboard
```

---

## How to Run & Deploy

### Local Development Test

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure `.env` with your target PostgreSQL database credentials:
   ```ini
   PORT=5000
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgrespassword
   DB_NAME=sample_python_pg_db
   ```

3. Run Flask server:
   ```bash
   python app.py
   ```
   Or run using Gunicorn:
   ```bash
   gunicorn --bind 0.0.0.0:5000 app:app
   ```

4. Open `http://localhost:5000` in your web browser.

---

## API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server status, Python version, environment, & PostgreSQL status. |
| `GET` | `/api/db-status` | psycopg2 query ping timing (ms), version, & table count. |
| `GET` | `/api/items` | Fetch all records from `test_records` PostgreSQL table. |
| `POST` | `/api/items` | Insert a new record into `test_records`. |
| `DELETE` | `/api/items/<id>` | Remove a record by ID. |
