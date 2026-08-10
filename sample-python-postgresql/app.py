import os
import sys
import time
import platform
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, jsonify, request
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'default_secret_key')

START_TIME = time.time()
db_connected = False
last_db_error = None

def get_db_config():
    return {
        'host': os.environ.get('DB_HOST', '127.0.0.1'),
        'port': int(os.environ.get('DB_PORT', 5432)),
        'user': os.environ.get('DB_USER', 'postgres'),
        'password': os.environ.get('DB_PASSWORD', 'postgrespassword'),
        'database': os.environ.get('DB_NAME', 'sample_python_pg_db'),
        'connect_timeout': 5
    }

def get_connection():
    config = get_db_config()
    return psycopg2.connect(
        host=config['host'],
        port=config['port'],
        user=config['user'],
        password=config['password'],
        dbname=config['database'],
        connect_timeout=config['connect_timeout'],
        cursor_factory=RealDictCursor
    )

def init_database():
    global db_connected, last_db_error
    config = get_db_config()
    print(f"[PostgreSQL] Attempting connection to {config['user']}@{config['host']}:{config['port']}/{config['database']}...")
    
    try:
        # 1. Try to connect to root "postgres" DB to create target DB if missing
        try:
            root_conn = psycopg2.connect(
                host=config['host'],
                port=config['port'],
                user=config['user'],
                password=config['password'],
                dbname='postgres',
                connect_timeout=5
            )
            root_conn.autocommit = True
            with root_conn.cursor() as cursor:
                cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (config['database'],))
                if not cursor.fetchone():
                    cursor.execute(f'CREATE DATABASE "{config["database"]}";')
                    print(f"[PostgreSQL] Created database \"{config['database']}\".")
            root_conn.close()
        except Exception as root_err:
            pass  # User might not have root privileges to check/create databases

        # 2. Connect to database & create test_records table
        conn = get_connection()
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS test_records (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    details TEXT NULL,
                    status VARCHAR(50) DEFAULT 'Active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        conn.close()

        db_connected = True
        last_db_error = None
        print(f"[PostgreSQL] ✅ Database connected and table 'test_records' verified successfully!")
    except Exception as e:
        db_connected = False
        last_db_error = str(e)
        print(f"[PostgreSQL] ⚠️ Database connection pending or failed: {e}")

# Trigger DB setup on launch
init_database()

# --- ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    global db_connected, last_db_error
    if not db_connected:
        init_database()

    uptime_seconds = int(time.time() - START_TIME)
    config = get_db_config()

    return jsonify({
        'status': 'OK',
        'framework': 'Python / Flask',
        'pythonVersion': sys.version.split(' ')[0],
        'platform': platform.platform(),
        'environment': os.environ.get('FLASK_ENV', 'production'),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'uptimeSeconds': uptime_seconds,
        'database': {
            'connected': db_connected,
            'driver': 'psycopg2-binary',
            'host': config['host'],
            'port': config['port'],
            'user': config['user'],
            'database': config['database'],
            'error': last_db_error
        }
    })

@app.route('/api/db-status', methods=['GET'])
def db_status():
    global db_connected, last_db_error
    if not db_connected:
        init_database()

    if not db_connected:
        return jsonify({'connected': False, 'error': last_db_error or 'Database unreachable'}), 503

    try:
        conn = get_connection()
        ping_start = time.time()
        with conn.cursor() as cursor:
            cursor.execute("SELECT VERSION() as version, NOW() as server_time;")
            row = cursor.fetchone()
            
            cursor.execute("SELECT COUNT(*) as total FROM test_records;")
            count_row = cursor.fetchone()

            cursor.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
            tables_row = cursor.fetchone()
            
        ping_ms = round((time.time() - ping_start) * 1000, 2)
        conn.close()

        return jsonify({
            'connected': True,
            'pingMs': ping_ms,
            'pgVersion': row['version'],
            'serverTime': str(row['server_time']),
            'tableCount': tables_row['count'],
            'recordsCount': count_row['total']
        })
    except Exception as e:
        db_connected = False
        last_db_error = str(e)
        return jsonify({'connected': False, 'error': str(e)}), 503

@app.route('/api/items', methods=['GET'])
def get_items():
    if not db_connected:
        return jsonify({'success': False, 'error': 'Database disconnected.', 'items': []}), 503

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM test_records ORDER BY id DESC;")
            items = cursor.fetchall()
        conn.close()

        # Convert DictRow to standard dict and format timestamps
        formatted_items = []
        for item in items:
            record = dict(item)
            if record.get('created_at'):
                record['created_at'] = str(record['created_at'])
            formatted_items.append(record)

        return jsonify({'success': True, 'count': len(formatted_items), 'items': formatted_items})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e), 'items': []}), 500

@app.route('/api/items', methods=['POST'])
def create_item():
    if not db_connected:
        return jsonify({'error': 'Database disconnected.'}), 503

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    details = data.get('details', '').strip()
    status = data.get('status', 'Active').strip()

    if not title:
        return jsonify({'error': 'Title is required.'}), 400

    try:
        conn = get_connection()
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO test_records (title, details, status) VALUES (%s, %s, %s) RETURNING *;",
                (title, details, status)
            )
            new_item = dict(cursor.fetchone())

        conn.close()

        if new_item and new_item.get('created_at'):
            new_item['created_at'] = str(new_item['created_at'])

        return jsonify({'success': True, 'item': new_item}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    if not db_connected:
        return jsonify({'error': 'Database disconnected.'}), 503

    try:
        conn = get_connection()
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM test_records WHERE id = %s RETURNING id;", (item_id,))
            deleted = cursor.fetchone()
        conn.close()

        if not deleted:
            return jsonify({'error': 'Record not found.'}), 404

        return jsonify({'success': True, 'message': f'Record #{item_id} deleted successfully.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"=======================================================")
    print(f" 🐍 Python Flask & PostgreSQL Testing App is Running!")
    print(f" 🌐 Local Access: http://localhost:{port}")
    print(f"=======================================================")
    app.run(host='0.0.0.0', port=port, debug=True)
