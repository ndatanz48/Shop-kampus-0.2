<?php
declare(strict_types=1);
require __DIR__ . '/koneksi.php';

$result = $conn->query('SELECT id, nama, email, produk, jumlah, penerimaan, catatan FROM pesanan ORDER BY id DESC');
if (!$result) {
    http_response_code(500);
    exit('Data pesanan tidak dapat dimuat.');
}
function e(mixed $value): string {
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Data Pesanan | Shop Kampus</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .admin-wrap{max-width:1200px;margin:48px auto;padding:0 22px}.admin-wrap h1{margin-bottom:8px}.admin-table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden}.admin-table th,.admin-table td{padding:13px 15px;text-align:left;border-bottom:1px solid #e8e9e3;vertical-align:top}.admin-table th{background:#173f32;color:#fff}.admin-table tr:last-child td{border-bottom:0}.admin-scroll{overflow-x:auto;margin-top:24px}.admin-note{color:#65736c}
  </style>
</head>
<body>
  <div class="announcement">SHOP KAMPUS UIN SYAHADA · Admin</div>
  <main class="admin-wrap">
    <a class="text-link" href="index.html">← Kembali ke toko</a>
    <h1>Data pesanan</h1>
    <p class="admin-note">Halaman administrasi sederhana. Batasi akses halaman ini melalui konfigurasi hosting atau autentikasi admin sebelum dipublikasikan.</p>
    <div class="admin-scroll"><table class="admin-table">
      <thead><tr><th>ID</th><th>Nama</th><th>Email</th><th>Produk</th><th>Jumlah item</th><th>Penerimaan</th><th>Catatan</th></tr></thead>
      <tbody>
      <?php if ($result->num_rows === 0): ?>
        <tr><td colspan="7">Belum ada pesanan.</td></tr>
      <?php else: while ($row = $result->fetch_assoc()): ?>
        <tr>
          <td><?= e($row['id']) ?></td><td><?= e($row['nama']) ?></td><td><?= e($row['email']) ?></td>
          <td><?= e($row['produk']) ?></td><td><?= e($row['jumlah']) ?></td><td><?= e($row['penerimaan']) ?></td><td><?= nl2br(e($row['catatan'])) ?></td>
        </tr>
      <?php endwhile; endif; ?>
      </tbody>
    </table></div>
  </main>
</body>
</html>
