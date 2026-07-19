<?php
// 投稿窓口(Googleフォーム)の回答スプレッドシートを、サーバー側からGoogle Sheets APIで取得して返す
// (api/news.js のPHP版)。フロントエンド側は変更不要 -- "/api/news" を叩けば同じ形式で返る。
// APIキーは同じフォルダの config.php(Gitには含めない)にのみ存在する。

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

$SHEET_ID = '1XySdy-4mA60sUlF5ONDQJO_8aNgWl8dhLoVgDORkqo4';
$SHEET_RANGE = 'フォームの回答 1!A2:G';

if (!defined('GOOGLE_SHEETS_API_KEY') || GOOGLE_SHEETS_API_KEY === '') {
    http_response_code(500);
    echo json_encode(['error' => 'server not configured']);
    exit;
}

$url = 'https://sheets.googleapis.com/v4/spreadsheets/' . $SHEET_ID .
    '/values/' . rawurlencode($SHEET_RANGE) . '?key=' . urlencode(GOOGLE_SHEETS_API_KEY);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$hasError = curl_errno($ch) !== 0;
curl_close($ch);

if ($hasError || $httpCode < 200 || $httpCode >= 300) {
    http_response_code(502);
    echo json_encode(['error' => 'upstream failed']);
    exit;
}

$data = json_decode($response, true);
$values = isset($data['values']) ? $data['values'] : [];

header('Cache-Control: s-maxage=15, stale-while-revalidate=30');
echo json_encode(['values' => $values]);
