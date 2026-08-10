# Sample Python Flask & MySQL Project

A production-ready Python Flask & MySQL web application designed for testing web hosting deployments, VPS/LXC servers, WSGI/Gunicorn web server stacks, and database connection pooling.

---

## Features

- **Flask Web Engine**: Lightweight, fast Python WSGI framework (`Flask>=3.0.0`, `PyMySQL>=1.1.0`).
- **PyMySQL Database Integration**: Auto-connects to MySQL via pure Python driver, auto-creates database if missing, and initializes `test_records` table on first run.
- **Production WSGI Ready**: Ships with `gunicorn` configuration for production application deployment.
- **Interactive Health Dashboard**: Glassmorphic UI displaying server uptime, Python version, PyMySQL query ping latency (ms), process details, and interactive CRUD operations.

---

## Project Structure

```
sample-python-mysql/
├── app.py                      # Main Flask application & MySQL API routes
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

2. Configure `.env` with your target MySQL database credentials:
   ```ini
   PORT=5000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=rootpassword
   DB_NAME=sample_python_mysql_db
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
| `GET` | `/api/health` | Server status, Python version, environment, & MySQL status. |
| `GET` | `/api/db-status` | PyMySQL query ping timing (ms), version, & table count. |
| `GET` | `/api/items` | Fetch all records from `test_records` MySQL table. |
| `POST` | `/api/items` | Insert a new record into `test_records`. |
| `DELETE` | `/api/items/<id>` | Remove a record by ID. |
