<?php
// お問い合わせフォーム(contact.html)の送信を代理で受け取り、Googleフォームへ転送する
// (api/contact-submit.js のPHP版)。フロントエンド側は変更不要。

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

$GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdOg6zbTtdCX56vm1HeFXkpBuPY4-su8JR_quhNTBOd8JWI3Q/formResponse';

$ENTRY = [
    'name' => 'entry.618737199',
    'email' => 'entry.364837156',
    'category' => 'entry.647223899',
    'message' => 'entry.1855476971',
];

$ALLOWED_CATEGORIES = ['公演について', '取材・メディア', 'ワークショップについて', 'その他'];

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = [];
}

// ハニーポット
if (!empty($data['hp'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$name = isset($data['name']) ? trim((string) $data['name']) : '';
$email = isset($data['email']) ? trim((string) $data['email']) : '';
$category = isset($data['category']) ? trim((string) $data['category']) : '';
$message = isset($data['message']) ? trim((string) $data['message']) : '';

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'required fields missing']);
    exit;
}

if (mb_strlen($name) > 100 || mb_strlen($email) > 200 || mb_strlen($message) > 20000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'input too long']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid email']);
    exit;
}

if ($category !== '' && !in_array($category, $ALLOWED_CATEGORIES, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid category']);
    exit;
}

$params = [
    $ENTRY['name'] => $name,
    $ENTRY['email'] => $email,
    $ENTRY['category'] => $category !== '' ? $category : $ALLOWED_CATEGORIES[0],
    $ENTRY['message'] => $message,
];

$postData = http_build_query($params);

$ch = curl_init($GOOGLE_FORM_URL);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_exec($ch);
$hasError = curl_errno($ch) !== 0;
curl_close($ch);

if ($hasError) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'upstream failed']);
    exit;
}

echo json_encode(['ok' => true]);
