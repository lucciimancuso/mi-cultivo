# Mi Cultivo en el celu y con tus amigos — paso a paso

Todo es gratis. Son 5 partes, en este orden. Tiempo total: ~40 minutos la primera vez.

Cómo funciona: cada persona tiene **su propia cuenta** (mail + contraseña). Vos creás un **grupo** y te da un **código de 10 letras**; tus amigos crean su cuenta, ponen el código y ven **lo mismo que vos** (plantas, riegos, fotos, costos, guía). Los datos están en un Supabase nuevo que es solo tuyo. Las fotos van a un almacenamiento privado que solo ve el grupo. La clave de la IA vive en el servidor: los celus nunca la ven.

---

## 1) Supabase (la base de datos compartida)

1. Entrá a https://supabase.com → **Start your project** → creá una **cuenta nueva** (podés usar "Continue with GitHub" con la cuenta nueva de GitHub de la parte 4).
2. **New project**: nombre `mi-cultivo`, una contraseña de base de datos (guardala), región **South America (São Paulo)**, plan **Free**.
3. Cuando termine de crearse, menú izquierdo → **SQL Editor** → **New query** → pegá **todo** el contenido del archivo `cloud/schema.sql` → **Run**. Tiene que decir "Success".
4. Menú **Authentication** → **Sign In / Providers** (o "Providers") → **Email** → apagá **"Confirm email"** → **Save**.
   (Así tus amigos entran apenas crean la cuenta, sin tener que confirmar un mail.)
5. Menú **Project Settings** → **API Keys** (o "API"): copiá
   - **Project URL** (algo como `https://abcdxyz.supabase.co`)
   - la clave **anon / publishable** (la larga que empieza con `eyJ…` o `sb_publishable_…`). **No** uses la `service_role`/secret.
6. Abrí el archivo `cloud.config.json` y pegá los dos datos:
   ```json
   { "url": "https://abcdxyz.supabase.co", "anonKey": "eyJ..." }
   ```
   Esos dos datos **son públicos por diseño** (la seguridad está en las reglas de la base, ya incluidas en `schema.sql`).

## 2) La IA gratis (Gemini)

1. Entrá a https://aistudio.google.com/apikey con una cuenta de Google → **Create API key** → copiala.
2. En Supabase: **Edge Functions** → **Deploy a new function** → **Via Editor** → nombre exacto: `ai` → borrá lo que trae y pegá **todo** `cloud/functions/ai/index.ts` → **Deploy**. Dejá la opción "Verify JWT" como viene.
3. En Supabase: **Edge Functions** → **Secrets** (o Project Settings → Edge Functions) → **Add new secret**: nombre `GEMINI_API_KEY`, valor = la clave del paso 1.
4. Listo. Cada persona tiene un tope de **60 pedidos de IA por día** (para que nadie gaste de más). Se puede cambiar con un secreto `AI_DAILY_LIMIT`.

> La IA hace: analizar fotos, buscar semillas/fertilizantes/sustratos en internet, leer tu **guía de cultivo en PDF** y responder preguntas siguiendo esa guía (pestaña **Cuidados → Guía e IA**).

## 3) La firma del APK (una sola vez)

Está en la carpeta `SECRETOS-GITHUB` (aparte del proyecto, **no la subas a GitHub**). Tiene 3 datos que vas a pegar en el paso 4.

## 4) GitHub (arma el APK y publica la web solo)

1. Creá una cuenta en https://github.com (si no tenés) y un repositorio **público** llamado `mi-cultivo`.
   (Tiene que ser público para que GitHub Pages sea gratis. No hay nada secreto adentro.)
2. Subí **todo el contenido de la carpeta del proyecto** al repositorio. Lo más fácil es con **GitHub Desktop** (https://desktop.github.com): *File → Add local repository* → elegí la carpeta → *Publish repository*. O por consola dentro de la carpeta:
   ```
   git init
   git add .
   git commit -m "Mi Cultivo"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/mi-cultivo.git
   git push -u origin main
   ```
   (Importante que suba la carpeta oculta `.github`.)
3. En el repo: **Settings → Pages → Source: GitHub Actions**.
4. En el repo: **Settings → Secrets and variables → Actions → Secrets → New repository secret**, y cargá los 3 de `SECRETOS-GITHUB.txt`: `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_BASE64`.
5. Pestaña **Actions** → "Mi Cultivo (celu + APK)" → **Run workflow**. Tarda ~8–12 min.
6. Cuando termina (tilde verde):
   - Tu **web para iPhone** queda en `https://TU-USUARIO.github.io/mi-cultivo/`
   - Tu **APK** está al final de la ejecución, en **Artifacts → MiCultivo-apk** (se baja un zip con `MiCultivo.apk`).

## 5) Instalarla y compartirla

**iPhone** (la web instalable): abrí el link en **Safari** → botón **Compartir** → **Agregar a pantalla de inicio**. Queda como app, sin barra del navegador.

**Android**: mandales el `MiCultivo.apk` por WhatsApp/Drive. Al abrirlo, Android pide permitir "instalar apps de esta fuente" (una vez). También pueden usar el mismo link web desde Chrome → ⋮ → *Instalar app*.

**Primera vez (vos)**: abrís la app → **Crear cuenta** → mail y contraseña (mínimo 8) → ponés tu nombre y un nombre de grupo → **Crear grupo**. En **Ajustes → Cuenta y grupo** vas a ver el **código de 10 letras**. Tocá **Copiar** y mandáselo a tus amigos.

**Tus amigos**: abren la app → **Crear cuenta** → su nombre → **Unirme con código** → pegan el código. Ya ven todo lo del grupo y lo que carguen aparece en todos los celus en segundos.

Desde **Ajustes → Cuenta y grupo** podés: cambiar el código (si se filtró), sacar a alguien, o borrar el grupo. Máximo 6 personas por grupo, y cada persona pertenece a un solo grupo.

---

## Avisos al celu (riego, frascos, cosecha lista)
Cada celu calcula qué toca en los próximos días y lo manda a la hora que elijas en **Ajustes > Avisos**.
- **iPhone** (iOS 16.4 o más): instalá la web con *Compartir > Agregar a inicio*, abrila desde el ícono y activá el aviso. Va por push, aunque la app esté cerrada.
- **Android**: en el **APK** son notificaciones del propio celu (pide permiso la primera vez). Si usás la web instalada desde Chrome, va por push igual que en iPhone.
- **Windows**: notificación de siempre, mientras la app está abierta.

Para que el push funcione hay que preparar el servidor **una sola vez** (el APK y Windows no lo necesitan):
1. En Supabase > SQL Editor corré `cloud/push.sql`.
2. En Edge Functions creá una función llamada `notify`, pegá `cloud/functions/notify/index.ts` y **apagá "Verify JWT"** (la protege una clave propia, no el login).
3. Cargá los 4 secretos (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`). Los valores te los pasan aparte y **no se suben nunca al repo**.
4. Corré el SQL del "reloj" (pg_cron) que viene con esas claves: llama a la función cada 5 minutos.

El servidor solo guarda, por celu, la dirección de push y los próximos avisos (título y texto). Los celus que salen de la cuenta se dan de baja solos.

## Qué cambia en el celu
- **Sin 3D**: en *Invernadero* ves tus tarjetas; al entrar, los **9 casilleros**; tocás una planta y se abre su ficha desde abajo. Liviano, sin animaciones pesadas (pensado para iPhone 14/15 y Android de gama alta).
- **Barra de abajo**: Inicio · Invernadero · Nueva planta · Cuidados · Más (el resto de las secciones).
- **Costos**: ahora tiene **cantidad de coolers**, consumo de cada uno (W) y horas por día; suma su energía al total (y su precio de compra, si lo cargás).
- **Guía de cultivo**: en *Cuidados → Guía e IA* subís un PDF; la IA arma un plan y lo usa en el análisis de fotos y en las preguntas.
- **PIN** (Ajustes): se pide al abrir y si dejás la app más de 1 minuto en segundo plano.

## Seguridad (lo que se hizo)
- Contraseñas manejadas por Supabase Auth (nunca las vemos). PIN local con hash PBKDF2 (210.000 vueltas) y bloqueo tras 5 intentos fallidos.
- Base de datos con **RLS**: cada persona solo lee lo de su grupo; todas las escrituras pasan por funciones controladas; el código de invitación tiene límite de intentos (anti fuerza bruta).
- Fotos en un bucket **privado**, solo para miembros del grupo.
- La clave de Gemini es secreta del servidor; la IA exige login, membresía y tiene tope diario.
- La web corre con una política de seguridad estricta (CSP): solo carga código propio y solo habla con tu Supabase.
- El APK pide **solo el permiso de Internet** (no accede a contactos, archivos, ubicación, cámara ni micrófono; las fotos se eligen con el selector del sistema), sin backups de Android, sin tráfico sin cifrar, y firmado con tu llave.

## Cosas a tener en cuenta
- **Supabase Free pausa el proyecto si pasa 1 semana sin ningún uso.** Con uso normal no pasa; si pasara, entrás al panel y lo reactivás con un click (los datos no se pierden).
- Sin internet la app sigue funcionando con lo último guardado y **sube los cambios cuando vuelve la conexión**. Si dos personas editan lo mismo a la vez, se fusionan los cambios (no se pisan).
- Cámara en Android (APK): para no pedir permiso de cámara, la app abre el selector de fotos del sistema. Sacá la foto con la cámara del celu y elegila. En iPhone (web) el selector ya ofrece "Tomar foto".
- Si cambiás `cloud.config.json` o el código, volvé a subir al repo y corré el workflow de nuevo (o hacé un `push`: corre solo).
- **App de Windows**: si querés que también entre al grupo, pasame la URL y la anon key y te armo el .exe nuevo.
