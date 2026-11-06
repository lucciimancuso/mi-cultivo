"""Endurece el proyecto Android generado por Capacitor: sin backups, sin trafico sin cifrar,
solo permiso de internet, iconos y splash propios."""
import os, re, shutil, sys
base = sys.argv[1] if len(sys.argv) > 1 else 'android'
res = os.path.join(base, 'app/src/main/res')
mf = os.path.join(base, 'app/src/main/AndroidManifest.xml')
s = open(mf, encoding='utf-8').read()
s = s.replace('android:allowBackup="true"', 'android:allowBackup="false"\n        android:fullBackupContent="false"\n        android:usesCleartextTraffic="false"\n        android:networkSecurityConfig="@xml/network_security_config"')
# solo INTERNET: se sacan los demas permisos si hubiera
s = re.sub(r'\s*<uses-permission android:name="(?!android\.permission\.INTERNET")[^"]*"\s*/>', '', s)
open(mf, 'w', encoding='utf-8').write(s)
assert 'allowBackup="false"' in s and 'networkSecurityConfig' in s
# iconos / splash / red
shutil.rmtree(os.path.join(res, 'mipmap-anydpi-v26'), ignore_errors=True)
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, 'android-res')
for root, _, files in os.walk(src):
    for f in files:
        rel = os.path.relpath(os.path.join(root, f), src)
        dst = os.path.join(res, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(os.path.join(root, f), dst)
# el icono "foreground" suelto no hace falta
for d in os.listdir(res):
    if d.startswith('mipmap-'):
        p = os.path.join(res, d, 'ic_launcher_foreground.png')
        if os.path.exists(p): os.remove(p)
print('android endurecido OK')
