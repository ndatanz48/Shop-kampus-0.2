<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Metode permintaan tidak diizinkan.']);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    // Mendukung formulir POST biasa sebagai fallback.
    $data = $_POST;
}

$nama = trim((string)($data['nama'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$telepon = trim((string)($data['telepon'] ?? ''));
$penerimaan = trim((string)($data['penerimaan'] ?? ''));
$catatan = trim((string)($data['catatan'] ?? $data['alamat'] ?? ''));
$items = $data['items'] ?? null;

if ($nama === '' || mb_strlen($nama) > 120) respond(422, ['success'=>false, 'message'=>'Nama wajib diisi dan maksimal 120 karakter.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) respond(422, ['success'=>false, 'message'=>'Alamat email tidak valid.']);
if (strlen($telepon) > 30) respond(422, ['success'=>false, 'message'=>'Nomor WhatsApp terlalu panjang.']);
if (!in_array($penerimaan, ['Ambil di kampus', 'Kirim'], true)) respond(422, ['success'=>false, 'message'=>'Pilihan penerimaan tidak valid.']);
if (mb_strlen($catatan) > 3000) respond(422, ['success'=>false, 'message'=>'Catatan maksimal 3000 karakter.']);
if (is_string($items)) $items = json_decode($items, true);
if (!is_array($items) || count($items) < 1 || count($items) > 8) respond(422, ['success'=>false, 'message'=>'Keranjang kosong atau berisi data yang tidak valid.']);

// Harga ditentukan ulang di server; harga dari browser tidak pernah dipercaya.
$catalog = [
    'Tote Bag' => 65000,
    'Lanyard' => 25000,
    'Tas Ransel' => 125000,
    'Pulpen Mekanik' => 5000,
    'Tumbler' => 25000,
    'Gantungan Kunci' => 10000,
    'Jaket Almamater' => 250000,
    'Kaos' => 85000,
];
$validated = [];
$totalItems = 0;
$totalPrice = 0;
foreach ($items as $item) {
    if (!is_array($item)) respond(422, ['success'=>false, 'message'=>'Format produk tidak valid.']);
    $product = trim((string)($item['produk'] ?? $item['name'] ?? ''));
    $qty = filter_var($item['jumlah'] ?? $item['qty'] ?? null, FILTER_VALIDATE_INT);
    if (!isset($catalog[$product]) || $qty === false || $qty < 1 || $qty > 100) {
        respond(422, ['success'=>false, 'message'=>'Produk atau jumlah tidak valid. Silakan periksa keranjang.']);
    }
    $price = $catalog[$product];
    $subtotal = $price * $qty;
    $validated[] = ['produk'=>$product, 'harga'=>$price, 'jumlah'=>$qty, 'subtotal'=>$subtotal];
    $totalItems += $qty;
    $totalPrice += $subtotal;
}

require __DIR__ . '/koneksi.php';
$summaryParts = [];
foreach ($validated as $item) $summaryParts[] = $item['produk'] . ' x ' . $item['jumlah'];
$produkSummary = implode(', ', $summaryParts);

$conn->begin_transaction();
try {
    // Kolom ini mengikuti tabel pesanan lama agar data lama tetap kompatibel.
    $stmt = $conn->prepare('INSERT INTO pesanan (nama, email, produk, jumlah, penerimaan, catatan) VALUES (?, ?, ?, ?, ?, ?)');
    if (!$stmt) throw new RuntimeException('Gagal menyiapkan penyimpanan pesanan.');
    $stmt->bind_param('sssiss', $nama, $email, $produkSummary, $totalItems, $penerimaan, $catatan);
    // Beberapa versi PHP/MySQL tidak menerima spasi dalam signature bind_param.
    if (!$stmt->execute()) throw new RuntimeException('Gagal menyimpan pesanan.');
    $orderId = (int)$conn->insert_id;
    $stmt->close();

    $detail = $conn->prepare('INSERT INTO detail_pesanan (pesanan_id, produk, harga, jumlah, subtotal) VALUES (?, ?, ?, ?, ?)');
    if (!$detail) throw new RuntimeException('Tabel detail pesanan belum tersedia. Jalankan file database.sql terlebih dahulu.');
    foreach ($validated as $item) {
        $product = $item['produk']; $price = $item['harga']; $qty = $item['jumlah']; $subtotal = $item['subtotal'];
        $detail->bind_param('isiii', $orderId, $product, $price, $qty, $subtotal);
        if (!$detail->execute()) throw new RuntimeException('Gagal menyimpan rincian produk.');
    }
    $detail->close();
    $conn->commit();
    respond(200, ['success'=>true, 'message'=>'Pesanan Berhasil Disimpan!', 'order_id'=>$orderId, 'total_item'=>$totalItems, 'total'=>$totalPrice]);
} catch (Throwable $e) {
    $conn->rollback();
    error_log('Shop Kampus order error: ' . $e->getMessage());
    respond(500, ['success'=>false, 'message'=>'Pesanan belum berhasil disimpan. Pastikan struktur database sudah disiapkan, lalu coba lagi.']);
}
