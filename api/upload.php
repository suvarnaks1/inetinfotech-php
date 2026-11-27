<?php
/* POST multipart file=<image>: stores it in /uploads and returns {ok:true, path:"uploads/xxx.jpg"}. Admin only. */
require_once __DIR__ . '/db.php';
require_admin_post();

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $e = $_FILES['file']['error'] ?? -1;
    $msg = ($e === UPLOAD_ERR_INI_SIZE || $e === UPLOAD_ERR_FORM_SIZE) ? 'File is bigger than the server upload limit' : 'Upload failed';
    json_out(['ok' => false, 'error' => $msg], 400);
}
$f = $_FILES['file'];
if ($f['size'] > 8 * 1024 * 1024) json_out(['ok' => false, 'error' => 'Image must be under 8 MB'], 413);

$info = @getimagesize($f['tmp_name']);           // checks the real file content, not the name
$types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif', IMAGETYPE_WEBP => 'webp'];
if (!$info || !isset($types[$info[2]])) json_out(['ok' => false, 'error' => 'Only JPG, PNG, GIF or WEBP images are allowed'], 415);

$dir = dirname(__DIR__) . '/uploads';
if (!is_dir($dir)) @mkdir($dir, 0755, true);
$name = date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $types[$info[2]];
if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) {
    json_out(['ok' => false, 'error' => 'Could not save the file. Check that the uploads folder is writable'], 500);
}
json_out(['ok' => true, 'path' => 'uploads/' . $name]);
