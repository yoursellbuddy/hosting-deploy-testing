import os
import sys
import time
import platform
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, jsonify, request
import pymysql

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
        'port': int(os.environ.get('DB_PORT', 3306)),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', 'rootpassword'),
        'database': os.environ.get('DB_NAME', 'sample_python_mysql_db'),
        'connect_timeout': 5,
        'cursorclass': pymysql.cursors.DictCursor
    }

def get_connection():
    config = get_db_config()
    return pymysql.connect(
        host=config['host'],
        port=config['port'],
        user=config['user'],
        password=config['password'],
        database=config['database'],
        connect_timeout=config['connect_timeout'],
        cursorclass=pymysql.cursors.DictCursor
    )

def init_database():
    global db_connected, last_db_error
    config = get_db_config()
    print(f"[MySQL] Attempting connection to {config['user']}@{config['host']}:{config['port']}/{config['database']}...")
    
    try:
        # 1. Connect without database to auto-create if missing
        root_conn = pymysql.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            connect_timeout=5
        )
        with root_conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{config['database']}`;")
        root_conn.close()

        # 2. Connect to database & create table
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `test_records` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `title` VARCHAR(255) NOT NULL,
                    `details` TEXT NULL,
                    `status` VARCHAR(50) DEFAULT 'Active',
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
        conn.commit()
        conn.close()

        db_connected = True
        last_db_error = None
        print(f"[MySQL] ✅ Database connected and table 'test_records' verified successfully!")
    except Exception as e:
        db_connected = False
        last_db_error = str(e)
        print(f"[MySQL] ⚠️ Database connection pending or failed: {e}")

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
            'driver': 'PyMySQL',
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
            
            cursor.execute("SELECT COUNT(*) as total FROM `test_records`;")
            count_row = cursor.fetchone()

            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            
        ping_ms = round((time.time() - ping_start) * 1000, 2)
        conn.close()

        return jsonify({
            'connected': True,
            'pingMs': ping_ms,
            'mysqlVersion': row['version'],
            'serverTime': str(row['server_time']),
            'tableCount': len(tables),
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
            cursor.execute("SELECT * FROM `test_records` ORDER BY id DESC;")
            items = cursor.fetchall()
        conn.close()

        # Format timestamps to string for JSON serialization
        for item in items:
            if item.get('created_at'):
                item['created_at'] = str(item['created_at'])

        return jsonify({'success': True, 'count': len(items), 'items': items})
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
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO `test_records` (title, details, status) VALUES (%s, %s, %s);",
                (title, details, status)
            )
            item_id = cursor.lastrowid
            
            cursor.execute("SELECT * FROM `test_records` WHERE id = %s;", (item_id,))
            new_item = cursor.fetchone()

        conn.commit()
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
        with conn.cursor() as cursor:
            affected = cursor.execute("DELETE FROM `test_records` WHERE id = %s;", (item_id,))
        conn.commit()
        conn.close()

        if affected == 0:
            return jsonify({'error': 'Record not found.'}), 404

        return jsonify({'success': True, 'message': f'Record #{item_id} deleted successfully.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"=======================================================")
    print(f" 🐍 Python Flask & MySQL Testing App is Running!")
    print(f" 🌐 Local Access: http://localhost:{port}")
    print(f"=======================================================")
    app.run(host='0.0.0.0', port=port, debug=True)
