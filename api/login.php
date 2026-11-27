<?php
require_once __DIR__ . '/db.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'POST only'], 405);

$in = json_decode(file_get_contents('php://input'));
$u = (is_object($in) && isset($in->user)) ? (string)$in->user : '';
$p = (is_object($in) && isset($in->pass)) ? (string)$in->pass : '';

$userOk = hash_equals(ADMIN_USER, $u);
$passOk = (substr(ADMIN_PASS, 0, 4) === '$2y$') ? password_verify($p, ADMIN_PASS) : hash_equals(ADMIN_PASS, $p);

if ($userOk && $passOk) {
    start_session();
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    csrf_token();
    json_out(['ok' => true]);
}
usleep(800000); // slows down password guessing
json_out(['ok' => false, 'error' => 'Wrong username or password'], 401);
