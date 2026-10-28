<?php
declare(strict_types=1);

mysqli_report(MYSQLI_REPORT_OFF);
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'shop_kampus';

$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_errno) {
    http_response_code(500);
    exit('Koneksi database gagal. Periksa konfigurasi MySQL dan database shop_kampus.');
}
if (!$conn->set_charset('utf8mb4')) {
    http_response_code(500);
    exit('Pengaturan karakter database gagal.');
}
