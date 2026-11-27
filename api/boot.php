<?php
/* Loaded as <script src="api/boot.php"> on every page. Prints window.INET_DATA = { courses, certs, students, gallery, ... }.
   With ?admin=1 (admin pages) it also checks the login and returns drafts and hidden items. Never breaks the site: on any DB problem it prints {}. */
require_once __DIR__ . '/db.php';
header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store');

$admin = isset($_GET['admin']);
if ($admin) {
    if (!is_admin()) { echo "location.replace('login.html');"; exit; }
    echo 'window.INET_CSRF=' . json_encode(csrf_token()) . ";\n";
}

$data = [];
try {
    $rows = db()->query('SELECT k, v FROM site_content')->fetchAll(PDO::FETCH_KEY_PAIR);
    foreach ($rows as $k => $v) {
        $d = json_decode($v);
        if (json_last_error() === JSON_ERROR_NONE) $data[$k] = $d;
    }
} catch (Throwable $e) {
    if ($admin) echo "window.INET_ERR='Database is not connected. Check api/config.php and run api/install.php';\n";
}

if (!$admin) { // visitors never receive drafts or hidden photos
    $keep = function ($arr, $fn) { return is_array($arr) ? array_values(array_filter($arr, $fn)) : $arr; };
    if (isset($data['courses'])) $data['courses'] = $keep($data['courses'], function ($c) { return !isset($c->status) || $c->status !== 'draft'; });
    if (isset($data['certs']))   $data['certs']   = $keep($data['certs'],   function ($c) { return !isset($c->status) || $c->status !== 'draft'; });
    if (isset($data['students'])) $data['students'] = $keep($data['students'], function ($s) { return !isset($s->show) || $s->show !== false; });
}

echo 'window.INET_DATA=' . json_encode((object)$data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . ';';
