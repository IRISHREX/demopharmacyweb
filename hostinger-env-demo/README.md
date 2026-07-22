# Hostinger Env Demo

Copy `whatsapp-env.php` from this folder to the folder above Hostinger `public_html`.

Example final location:

```text
/home/YOUR_HOSTINGER_USER/whatsapp-env.php
```

Do not upload this file inside `public_html`.

`public_html/api/otp/send.php` loads it with:

```php
$envPath = dirname(__DIR__, 3) . '/whatsapp-env.php';
if (is_file($envPath)) {
  require_once $envPath;
}
```
