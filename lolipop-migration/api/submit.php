<?php
// 投稿窓口の送信を代理で受け取り、Googleフォームへ転送する(api/submit.js のPHP版)。
// ロジックはNode.js版と同じにしてある。フロントエンド(koushin-55901123.html)側は
// 変更不要 -- "/api/submit" というURLに、同じ形式のJSONを送るだけ。

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

$GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc81T0wM91qnmgqYJulaUoqWA-IxqnB5lGDpDatl3BU1NKPjg/formResponse';

$ENTRY = [
    'name' => 'entry.328992978',
    'category' => 'entry.1448683413',
    'title' => 'entry.756854158',
    'dateYear' => 'entry.336099288_year',
    'dateMonth' => 'entry.336099288_month',
    'dateDay' => 'entry.336099288_day',
    'body' => 'entry.1105532969',
];

$ALLOWED_CATEGORIES = ['ニュース', '公演情報', 'チケットURL更新', 'プロフィール変更依頼', 'その他・要望'];

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = [];
}

// ハニーポット: 人間には見えない項目。自動送信スクリプトはよく埋めてしまうため検出に使う。
if (!empty($data['hp'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$name = isset($data['name']) ? trim((string) $data['name']) : '';
$title = isset($data['title']) ? trim((string) $data['title']) : '';
$body = isset($data['body']) ? trim((string) $data['body']) : '';
$category = isset($data['category']) ? trim((string) $data['category']) : '';
$date = isset($data['date']) ? trim((string) $data['date']) : '';

if ($name === '' || $title === '' || $body === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'required fields missing']);
    exit;
}

if (mb_strlen($name) > 100 || mb_strlen($title) > 200 || mb_strlen($body) > 20000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'input too long']);
    exit;
}

if ($category !== '' && !in_array($category, $ALLOWED_CATEGORIES, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid category']);
    exit;
}

$params = [
    $ENTRY['name'] => $name,
    $ENTRY['category'] => $category !== '' ? $category : $ALLOWED_CATEGORIES[0],
    $ENTRY['title'] => $title,
    $ENTRY['body'] => $body,
];

if ($date !== '') {
    $parts = explode('-', $date);
    if (count($parts) === 3) {
        $params[$ENTRY['dateYear']] = $parts[0];
        $params[$ENTRY['dateMonth']] = $parts[1];
        $params[$ENTRY['dateDay']] = $parts[2];
    }
}

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
