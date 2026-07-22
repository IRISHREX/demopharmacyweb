<?php
declare(strict_types=1);

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
  echo json_encode(['verified' => false]);
  exit;
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
$code = is_array($payload) ? (string)($payload['code'] ?? '') : '';
$challenge = $_SESSION['zaxia_otp'] ?? null;

$verified = is_array($challenge)
  && isset($challenge['code'], $challenge['expires_at'])
  && time() <= (int) $challenge['expires_at']
  && hash_equals((string) $challenge['code'], $code);

unset($_SESSION['zaxia_otp']);

if (!$verified) {
  http_response_code(400);
}

echo json_encode(['verified' => $verified]);
