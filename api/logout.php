<?php
require_once __DIR__ . '/db.php';
start_session();
$_SESSION = [];
session_destroy();
json_out(['ok' => true]);
