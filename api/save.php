<?php
/* POST {key, value}: saves one block of website content (courses, students, gallery, certs ...). Admin only. */
require_once __DIR__ . '/db.php';
require_admin_post();

$ALLOWED = ['home', 'about', 'coursesPage', 'services', 'pcontent', 'gallery', 'contact', 'site', 'courses', 'certs', 'students', 'testi'];

$raw = file_get_contents('php://input');
if (strlen($raw) > 5 * 1024 * 1024) json_out(['ok' => false, 'error' => 'Data too large'], 413);

$in = json_decode($raw);
if (!is_object($in) || !isset($in->key) || !is_string($in->key) || !in_array($in->key, $ALLOWED, true)
    || !property_exists($in, 'value') || $in->value === null) {
    json_out(['ok' => false, 'error' => 'Invalid data'], 400);
}

$json = json_encode($in->value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
try {
    $st = db()->prepare('INSERT INTO site_content (k, v) VALUES (:k, :v) ON DUPLICATE KEY UPDATE v = :v2');
    $st->execute([':k' => $in->key, ':v' => $json, ':v2' => $json]);
    json_out(['ok' => true]);
} catch (Throwable $e) {
    json_out(['ok' => false, 'error' => 'Database error'], 500);
}
