#!/bin/bash
# Arma web/ (celular: PWA y base del APK). Sin 3D, con CSP estricta.
cd "$(dirname "$0")"
PARTS="parts/03-js-data.js parts/03b-js-store.js parts/03c-js-merge.js parts/03d-js-cloud.js parts/04-js-scene.web.js parts/05-js-stage.js parts/05b-js-inicio.js parts/05c-js-room2d.js parts/06-js-nueva-foto.js parts/07-js-informes.js parts/07b-js-cuidados.js parts/07c-js-visor.js parts/07d-js-costos.js parts/07e-js-calendario.js parts/07f-js-cuenta.js parts/08-js-init.js"
# escena 3D reemplazada por un esqueleto vacío (sin three.js ni modelos)
{ head -3 parts/04-js-scene.js; echo 'function initScene(){return false}'; } > parts/04-js-scene.web.js
BUILD=$(cat $PARTS parts/01-head.html parts/02-body.html pwa/sw.js | md5sum | cut -c1-10)
rm -rf web && mkdir -p web/vendor
cp src/vendor/supabase.js src/vendor/*.woff2 web/vendor/
cp pwa/icon-*.png pwa/apple-touch-icon.png pwa/favicon-32.png pwa/manifest.webmanifest web/
sed "s/__BUILD__/$BUILD/" pwa/sw.js > web/sw.js
node -e "const c=require('./cloud.config.json');require('fs').writeFileSync('web/config.js','/* Datos publicos del proyecto Supabase (la anonKey es publica por diseno). */\nwindow.CLOUD_CFG='+JSON.stringify({url:c.url||'',anonKey:c.anonKey||''})+';\n')"
{
cat <<'HEAD'
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; manifest-src 'self'; worker-src 'self'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#EEE9DB" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0C120E" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Mi Cultivo">
<meta name="format-detection" content="telephone=no">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
HEAD
cat parts/01-head.html
echo '</head><body>'
cat parts/02-body.html
echo '<script src="config.js"></script><script src="vendor/supabase.js"></script><script src="app.js"></script>'
echo '</body></html>'
} > web/index.html
# el JS va en un archivo aparte (la CSP no permite scripts dentro del HTML)
{ echo "window.__BUILD__='$BUILD';"; cat $PARTS | sed -e '/^<script src=/d' -e '/^<script>$/d' -e '/^<\/script>$/d'; echo "if('serviceWorker' in navigator&&location.protocol==='https:'){addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}"; } > web/app.js
node --check web/app.js && echo "web OK build=$BUILD" && ls -la web | awk '{print $5, $9}'
