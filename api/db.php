<?php
require_once __DIR__ . '/config.php';

function db(): PDO {
    static $pdo = null;
    if (!$pdo) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    }
    return $pdo;
}

function start_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.gc_maxlifetime', '28800'); // stay logged in for 8 hours of activity
        session_name('inet_admin');
        session_set_cookie_params([
            'lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        ]);
        session_start();
    }
}

function is_admin(): bool { start_session(); return !empty($_SESSION['admin']); }

function csrf_token(): string {
    start_session();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function json_out($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* every write endpoint starts with this: POST only, logged in, valid CSRF token */
function require_admin_post(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'POST only'], 405);
    if (!is_admin()) json_out(['ok' => false, 'error' => 'Not logged in'], 401);
    $t = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals(csrf_token(), $t)) json_out(['ok' => false, 'error' => 'Security token expired. Reload the page.'], 403);
}
