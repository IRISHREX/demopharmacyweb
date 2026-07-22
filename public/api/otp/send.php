<?php
declare(strict_types=1);

$envPath = dirname(__DIR__, 3) . '/whatsapp-env.php';
if (is_file($envPath)) {
  require_once $envPath;
}

header('Content-Type: application/json; charset=utf-8');

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
  || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_set_cookie_params([
  'lifetime' => 300,
  'path' => '/',
  'secure' => $isHttps,
  'httponly' => true,
  'samesite' => 'Lax',
]);
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
$mobile = is_array($payload) ? (string)($payload['mobile'] ?? '') : '';

if (!preg_match('/^\d{10}$/', $mobile)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid mobile number']);
  exit;
}

$apiKey = getenv('CLOUD_WHATSAPP_API_KEY');

if (!$apiKey) {
  http_response_code(500);
  echo json_encode(['error' => 'WhatsApp API key is not configured']);
  exit;
}

$otp = (string) random_int(100000, 999999);
$_SESSION['zaxia_otp'] = [
  'code' => $otp,
  'mobile' => $mobile,
  'expires_at' => time() + 300,
];

$url = 'https://web.cloudwhatsapp.com/wapp/api/send?' . http_build_query([
  'apikey' => $apiKey,
  'mobile' => $mobile,
  'msg' => 'OTP ' . $otp,
]);

$status = 0;
$body = '';

if (function_exists('curl_init')) {
  $curl = curl_init($url);
  curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
  ]);
  $body = (string) curl_exec($curl);
  $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
  curl_close($curl);
} else {
  $context = stream_context_create(['http' => ['timeout' => 20]]);
  $body = (string) @file_get_contents($url, false, $context);
  $statusLine = $http_response_header[0] ?? '';
  if (preg_match('/\s(\d{3})\s/', $statusLine, $matches)) {
    $status = (int) $matches[1];
  }
}

if ($status < 200 || $status >= 300) {
  unset($_SESSION['zaxia_otp']);
  http_response_code(502);
  echo json_encode([
    'error' => 'Could not send OTP',
    'upstream_status' => $status,
    'upstream_body' => mb_substr($body, 0, 300),
  ]);
  exit;
}

echo json_encode(['sent' => true]);
