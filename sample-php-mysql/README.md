# Sample Laravel PHP & MySQL Project

A production-ready Laravel 11 / PHP & MySQL web application designed for testing hosting deployments, LXC/VPS servers, Apache/Nginx web server stacks, and database connectivity.

---

## Features

- **Laravel 11 Project Architecture**: Standard directory structure (`app/`, `bootstrap/`, `config/`, `database/`, `routes/`, `public/`).
- **Artisan CLI Tool**: Included `artisan` script supporting database migration execution (`php artisan migrate`).
- **MySQL PDO Integration**: Auto-connects to MySQL, auto-creates target database, and migrates `test_records` table on first run.
- **Interactive Health Dashboard**: Glassmorphic UI displaying server uptime, PHP version, MySQL query ping latency (ms), process details, and interactive CRUD operations.

---

## Project Structure

```
sample-php-mysql/
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
│   └── database.php                       # MySQL database configuration
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

1. Configure `.env` with your target MySQL database credentials:
   ```ini
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sample_laravel_db
   DB_USERNAME=root
   DB_PASSWORD=rootpassword
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
| `GET` | `/api/health` | Server status, PHP version, environment, & MySQL status. |
| `GET` | `/api/db-status` | Database PDO query ping timing (ms), version, & table count. |
| `GET` | `/api/items` | Fetch all records from `test_records` MySQL table. |
| `POST` | `/api/items` | Insert a new record into `test_records`. |
| `DELETE` | `/api/items/{id}` | Remove a record by ID. |
