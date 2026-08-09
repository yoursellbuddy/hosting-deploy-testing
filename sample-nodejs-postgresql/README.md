# Node.js + PostgreSQL Sample Deployment App

A lightweight, production-ready Express Node.js web application designed to verify Node.js LXC container deployment and PostgreSQL database connectivity.

## Features
- **Automatic Database Connection & Table Creation**: Creates `test_items` table automatically upon first load via `pg` connection pool.
- **Live CRUD Verification**: Form input to add and delete test records via Express REST API.
- **Environment Driven**: Reads credentials from `.env` or system environment variables.
- **PM2 / Production Ready**: Ready to run with `npm start` or `pm2 start index.js`.

## Deployment Instructions
1. Upload/Import repository to your Node.js hosting site.
2. Install dependencies: `npm install`.
3. Link or inject PostgreSQL database credentials (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
4. Open domain in browser to test Node.js & PostgreSQL connectivity.
