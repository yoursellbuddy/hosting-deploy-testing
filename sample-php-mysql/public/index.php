<?php
/**
 * Laravel Front Controller & MySQL API Router
 * Sample PHP & MySQL Hosting Deployment Test Suite
 */

define('LARAVEL_START', microtime(true));

// Maintenance mode check
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register Composer autoloader & Bootstrap Laravel if installed
if (file_exists(__DIR__.'/../vendor/autoload.php') && file_exists(__DIR__.'/../bootstrap/app.php')) {
    require __DIR__.'/../vendor/autoload.php';
    $app = require_once __DIR__.'/../bootstrap/app.php';
    $app->handleRequest(\Illuminate\Http\Request::capture());
    exit;
}

// Helper: Simple dotenv loader
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2) + [null, null];
        if ($name && $value !== null) {
            $name = trim($name);
            $value = trim(trim($value), '"\'');
            if (!getenv($name)) {
                putenv("{$name}={$value}");
                $_ENV[$name] = $value;
            }
        }
    }
}

loadEnv(__DIR__ . '/../.env');

// PDO Database Helper
function getPDO() {
    static $pdo = null;
    if ($pdo === null) {
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $port = getenv('DB_PORT') ?: '3306';
        $db   = getenv('DB_DATABASE') ?: 'sample_laravel_db';
        $user = getenv('DB_USERNAME') ?: 'root';
        $pass = getenv('DB_PASSWORD') ?: 'rootpassword';

        // Connect without DB to auto-create if missing
        $rootPdo = new PDO("mysql:host={$host};port={$port}", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
        $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `{$db}`;");

        $pdo = new PDO("mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);

        // Auto-migration for test_records table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `test_records` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `title` VARCHAR(255) NOT NULL,
                `details` TEXT NULL,
                `status` VARCHAR(50) DEFAULT 'Active',
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }
    return $pdo;
}

// Request Routing
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Serve static index.html for root route
if ($uri === '/' || $uri === '/index.php') {
    if (file_exists(__DIR__ . '/index.html')) {
        header('Content-Type: text/html; charset=utf-8');
        readfile(__DIR__ . '/index.html');
        exit;
    }
}

// REST API Endpoints
if (strpos($uri, '/api/') === 0) {
    header('Content-Type: application/json; charset=utf-8');
    
    // GET /api/health
    if ($uri === '/api/health' && $method === 'GET') {
        $dbConnected = false;
        $dbError = null;
        try {
            getPDO();
            $dbConnected = true;
        } catch (\Exception $e) {
            $dbError = $e->getMessage();
        }

        echo json_encode([
            'status' => 'OK',
            'framework' => 'Laravel / PHP 8.2',
            'phpVersion' => PHP_VERSION,
            'environment' => getenv('APP_ENV') ?: 'production',
            'timestamp' => date('c'),
            'database' => [
                'connected' => $dbConnected,
                'driver' => 'mysql',
                'host' => getenv('DB_HOST') ?: '127.0.0.1',
                'port' => getenv('DB_PORT') ?: '3306',
                'database' => getenv('DB_DATABASE') ?: 'sample_laravel_db',
                'user' => getenv('DB_USERNAME') ?: 'root',
                'error' => $dbError
            ]
        ]);
        exit;
    }

    // GET /api/db-status
    if ($uri === '/api/db-status' && $method === 'GET') {
        try {
            $pdo = getPDO();
            $pingStart = microtime(true);
            $stmt = $pdo->query("SELECT VERSION() as version, NOW() as server_time");
            $pingMs = round((microtime(true) - $pingStart) * 1000, 2);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            $countStmt = $pdo->query("SELECT COUNT(*) as total FROM test_records");
            $totalRecords = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            $tablesStmt = $pdo->query("SHOW TABLES");
            $tableCount = $tablesStmt->rowCount();

            echo json_encode([
                'connected' => true,
                'pingMs' => $pingMs,
                'mysqlVersion' => $row['version'],
                'serverTime' => $row['server_time'],
                'tableCount' => $tableCount,
                'recordsCount' => (int)$totalRecords
            ]);
        } catch (\Exception $e) {
            http_response_code(503);
            echo json_encode(['connected' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // GET /api/items
    if ($uri === '/api/items' && $method === 'GET') {
        try {
            $pdo = getPDO();
            $stmt = $pdo->query("SELECT * FROM test_records ORDER BY id DESC");
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'count' => count($items), 'items' => $items]);
        } catch (\Exception $e) {
            http_response_code(503);
            echo json_encode(['success' => false, 'error' => $e->getMessage(), 'items' => []]);
        }
        exit;
    }

    // POST /api/items
    if ($uri === '/api/items' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $title = isset($input['title']) ? trim($input['title']) : '';
        $details = isset($input['details']) ? trim($input['details']) : '';
        $status = isset($input['status']) ? trim($input['status']) : 'Active';

        if (empty($title)) {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            exit;
        }

        try {
            $pdo = getPDO();
            $stmt = $pdo->prepare("INSERT INTO test_records (title, details, status) VALUES (:title, :details, :status)");
            $stmt->execute([':title' => $title, ':details' => $details, ':status' => $status]);
            $id = $pdo->lastInsertId();

            $fetch = $pdo->prepare("SELECT * FROM test_records WHERE id = :id");
            $fetch->execute([':id' => $id]);
            $record = $fetch->fetch(PDO::FETCH_ASSOC);

            http_response_code(201);
            echo json_encode(['success' => true, 'item' => $record]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit;
    }

    // DELETE /api/items/{id}
    if (preg_match('#^/api/items/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
        $id = (int)$matches[1];
        try {
            $pdo = getPDO();
            $stmt = $pdo->prepare("DELETE FROM test_records WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(['success' => true, 'message' => "Record #{$id} deleted successfully."]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit;
    }
}

// Fallback to static asset check or index.html
if (file_exists(__DIR__ . $uri) && is_file(__DIR__ . $uri)) {
    return false;
}

readfile(__DIR__ . '/index.html');
