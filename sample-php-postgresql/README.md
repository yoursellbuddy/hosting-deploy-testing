# Sample Laravel PHP & PostgreSQL Project

A production-ready Laravel 11 / PHP & PostgreSQL web application designed for testing web hosting deployments, VPS/LXC servers, Apache/Nginx web server stacks, and database connection pooling.

---

## Features

- **Laravel 11 Project Architecture**: Standard directory structure (`app/`, `bootstrap/`, `config/`, `database/`, `routes/`, `public/`).
- **Artisan CLI Tool**: Executable `artisan` script supporting database migration execution (`php artisan migrate`).
- **PostgreSQL PDO Integration**: Auto-connects to PostgreSQL (`pdo_pgsql`), auto-creates target database, and migrates `test_records` table on first run.
- **Interactive Health Dashboard**: Glassmorphic UI displaying server uptime, PHP version, PostgreSQL query ping latency (ms), process details, and interactive CRUD operations.

---

## Project Structure

```
sample-php-postgresql/
├── artisan                                # Laravel Artisan CLI entrypoint
├── composer.json                          # Laravel Composer configuration
├── .env                                   # Active environment config
├── .env.example                           # Environment configuration template
├── README.md                              # Guide & reference documentation
├── app/
│   ├── Http/
│   │   └── Controllers/                   # Health & CRUD Controllers
│   └── Models/
│       └── TestRecord.php                 # Eloquent Model for test_records
├── bootstrap/
│   └── app.php                            # Laravel Application bootstrap
├── config/
│   ├── app.php                            # Application configuration
│   └── database.php                       # PostgreSQL database configuration
├── database/
│   └── migrations/                        # Database migrations
├── public/
│   ├── index.php                          # Front Controller entrypoint
│   ├── index.html                         # Diagnostic UI Dashboard
│   ├── style.css                          # Responsive Design System
│   └── app.js                             # Interactive Client API Logic
└── routes/
    ├── api.php                            # API routes
    └── web.php                            # Web routes
```

---

## How to Run & Deploy

### Local Development / Web Server Test

1. Configure `.env` with your target PostgreSQL database credentials:
   ```ini
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=sample_laravel_pg_db
   DB_USERNAME=postgres
   DB_PASSWORD=postgrespassword
   ```

2. Run built-in PHP web server:
   ```bash
   php -S 0.0.0.0:8000 -t public
   ```
   Or serve with Laravel Artisan:
   ```bash
   php artisan serve
   ```

3. Open `http://localhost:8000` in your web browser.

---

## API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server status, PHP version, environment, & PostgreSQL status. |
| `GET` | `/api/db-status` | Database PDO query ping timing (ms), version, & table count. |
| `GET` | `/api/items` | Fetch all records from `test_records` PostgreSQL table. |
| `POST` | `/api/items` | Insert a new record into `test_records`. |
| `DELETE` | `/api/items/{id}` | Remove a record by ID. |
