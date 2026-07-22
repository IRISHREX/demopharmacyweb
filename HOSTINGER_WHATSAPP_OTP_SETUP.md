# Hostinger WhatsApp OTP Setup

This project is uploaded to Hostinger as static `dist` files. Because Hostinger is serving the frontend statically, `src/server.ts` and the Vite dev proxy do not run in production.

The deployed OTP flow uses PHP files copied into `dist/api/otp/` during build:

- `api/otp/send.php`
- `api/otp/verify.php`

These PHP endpoints run on Hostinger, call the Cloud WhatsApp API from the server, and avoid browser CORS issues.

## Required Upload

After running:

```bash
npm run build
```

Upload the full contents of `dist` to Hostinger `public_html`.

Make sure these files exist on Hostinger:

```text
public_html/api/otp/send.php
public_html/api/otp/verify.php
```

## Environment File

Create this file one level above `public_html`:

```text
whatsapp-env.php
```

Recommended Hostinger location:

```text
/home/YOUR_HOSTINGER_USER/whatsapp-env.php
```

Example content:

```php
<?php
putenv('CLOUD_WHATSAPP_API_KEY=6b881f3ae19647b5a1d9a2f19e175a86');
```

Do not put `whatsapp-env.php` inside `public_html`. Keeping it above `public_html` prevents direct public access.

## send.php Env Loading

The top of `public_html/api/otp/send.php` should include:

```php
<?php
declare(strict_types=1);

$envPath = dirname(__DIR__, 3) . '/whatsapp-env.php';
if (is_file($envPath)) {
  require_once $envPath;
}

header('Content-Type: application/json; charset=utf-8');
```

Because `send.php` is located at:

```text
public_html/api/otp/send.php
```

this line:

```php
dirname(__DIR__, 3)
```

goes up to the folder above `public_html`, where `whatsapp-env.php` should live.

## Full send.php

```php
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
  $context = stream_context_create([
    'http' => [
      'timeout' => 20,
    ],
  ]);

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
```

## Test URLs

Do not open `send.php` directly in the browser and expect it to send an OTP. It only accepts `POST`.

After deployment, the React app calls:

```text
/api/otp/send.php
/api/otp/verify.php
```

from the same domain, so CORS should not be a problem.

## Security Note

If this API key has already been shared publicly or committed to a public repo, regenerate it from the WhatsApp provider dashboard and update `whatsapp-env.php`.
