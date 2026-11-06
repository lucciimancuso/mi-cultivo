#!/bin/bash
# Arma src/index.html (ESCRITORIO) a partir de las partes
cd "$(dirname "$0")"
PARTS="parts/03-js-data.js parts/03b-js-store.js parts/03c-js-merge.js parts/03d-js-cloud.js parts/04-js-scene.js parts/05-js-stage.js parts/05b-js-inicio.js parts/05c-js-room2d.js parts/06-js-nueva-foto.js parts/07-js-informes.js parts/07b-js-cuidados.js parts/07c-js-visor.js parts/07d-js-costos.js parts/07e-js-calendario.js parts/07f-js-cuenta.js parts/07g-js-curado.js parts/07h-js-avisos.js parts/08-js-init.js"
node -e "const c=require('./cloud.config.json');require('fs').writeFileSync('src/config.js','window.CLOUD_CFG='+JSON.stringify({url:c.url||'',anonKey:c.anonKey||''})+';\n')"
{
cat <<'HEAD'
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: file:; font-src 'self'; connect-src blob: https://*.supabase.co wss://*.supabase.co; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
HEAD
cat parts/01-head.html
echo '</head><body>'
cat parts/02-body.html
echo '<script src="config.js"></script><script src="vendor/supabase.js"></script><script src="vendor/three.min.js"></script><script src="vendor/models.js"></script>'
cat $PARTS
echo '</body></html>'
} > src/index.html
cat $PARTS | sed -e '/^<script src=/d' -e '/^<script>$/d' -e '/^<\/script>$/d' > /tmp/check-app.js
node --check /tmp/check-app.js && echo "sintaxis OK" && wc -c src/index.html
