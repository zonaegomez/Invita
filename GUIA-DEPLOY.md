# Guía paso a paso: de tu computadora a producción

Esta guía asume que ya descomprimiste `invitaciones-saas.zip` en tu computadora y tienes Node.js 20+ instalado. Vamos a: crear un proyecto real de Firebase, conectarlo al código, probarlo en local, subirlo a GitHub y desplegarlo en Vercel.

Tiempo estimado: 30–45 minutos la primera vez.

---

## Paso 1 — Crear el proyecto de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) e inicia sesión con tu cuenta de Google.
2. Clic en **Crear proyecto** (o **Add project**).
3. Dale un nombre (ej. `invitaciones-mx`). Firebase le agrega un sufijo aleatorio al ID del proyecto — anótalo, lo vas a necesitar.
4. Puedes desactivar Google Analytics si no lo vas a usar todavía (no lo necesita este proyecto).
5. Espera a que termine de crearse.

### 1.1 Habilitar Firestore

1. En el menú lateral: **Build → Firestore Database**.
2. Clic en **Crear base de datos**.
3. Elige **modo producción** (no modo de prueba — nuestras `firestore.rules` ya están escritas para producción).
4. Elige una región cercana a tus usuarios (para México, `us-central1` o `southamerica-east1` son opciones razonables; no se puede cambiar después).

### 1.2 Habilitar Storage

1. En el menú lateral: **Build → Storage**.
2. Clic en **Comenzar** y sigue el asistente (misma región que Firestore, idealmente).

---

## Paso 2 — Registrar la app web y obtener credenciales públicas

1. En la página principal del proyecto (ícono de engranaje → **Project settings**, o el ícono `</>` en el resumen).
2. Sección **Tus apps** → clic en el ícono web `</>`.
3. Ponle un nombre (ej. `web`). No necesitas Firebase Hosting.
4. Firebase te muestra un bloque `firebaseConfig` como este:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "invitaciones-mx-xxxxx.firebaseapp.com",
  projectId: "invitaciones-mx-xxxxx",
  storageBucket: "invitaciones-mx-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

Guarda estos valores — van al archivo `.env.local` en el paso 4.

---

## Paso 3 — Credenciales de administrador (Service Account)

Esta es la credencial que usa el servidor (route handlers) para leer/escribir sin pasar por `firestore.rules` — necesaria para el dashboard y la validación de `editToken`. Hay dos caminos: elige el que aplique a tu organización.

### Opción A — Clave de Service Account (si tu organización lo permite)

1. **Project settings → Service accounts**.
2. Clic en **Generate new private key** → confirma.
3. Se descarga un archivo `.json`. Ábrelo — contiene `project_id`, `client_email` y `private_key`.

**No subas este archivo a GitHub.** Es una credencial completa de administrador de tu proyecto.

Si al hacer clic ves el error *"No se permite crear claves en esta cuenta de servicio. Verifica si las políticas de la organización restringen la creación de claves"*, tu organización (Google Workspace/Cloud) tiene activa la política `constraints/iam.disableServiceAccountKeyCreation`. En ese caso salta a la Opción B — no hace falta desactivar esa política solo para este proyecto.

### Opción B — Sin clave (Application Default Credentials)

`src/firebase/admin.ts` ya detecta automáticamente si faltan `FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` en el entorno, y si es así usa `applicationDefault()` en su lugar. No necesitas tocar código — solo dejar esas 3 variables vacías en `.env.local` / Vercel.

**Local (para el Paso 6 de esta guía):**

```bash
npm install -g @google-cloud/cli   # si no tienes gcloud instalado
gcloud auth application-default login
```

Esto abre el navegador, inicias sesión con tu cuenta de `zonaluz.com.mx`, y guarda credenciales en tu disco que el SDK detecta solo. Como ya eres dueño/editor del proyecto de Firebase, esa identidad ya tiene permisos de sobra para Firestore y Storage — no se requiere ningún permiso adicional.

**Producción en Vercel:** Vercel no corre dentro de Google Cloud, así que no hay metadata server del que leer credenciales automáticamente. La forma sin clave de resolver esto es **Workload Identity Federation (WIF)** con el proveedor OIDC nativo de Vercel:

1. En Vercel: **Project Settings → Security → OIDC Federation** → actívalo. Vercel emite un JWT firmado (`VERCEL_OIDC_TOKEN`) en cada request de forma automática, sin que tengas que generar nada.
2. En Google Cloud Console (no en Firebase console): **IAM & Admin → Workload Identity Federation → Create pool**. Configura un proveedor OIDC apuntando al issuer de Vercel (`https://oidc.vercel.com/<tu-team>`) — Vercel muestra el issuer exacto en esa misma pantalla de OIDC Federation.
3. **IAM & Admin → IAM**, busca la cuenta de servicio `firebase-adminsdk-...@invitaciones-mx-74a3f.iam.gserviceaccount.com` y agrégale el rol **Workload Identity User**, con principal restringido al pool/proveedor que acabas de crear. Esto es una asignación de permisos (IAM binding), no una clave — no lo bloquea la misma política.
4. Descarga el archivo de configuración que genera el asistente de WIF (`gcloud iam workload-identity-pools create-cred-config`) — es un JSON sin secretos, solo referencias al pool/proveedor. Súbelo como variable de entorno en Vercel (`GOOGLE_APPLICATION_CREDENTIALS` apuntando a su contenido, escrito a `/tmp` en un pequeño helper de arranque, o usando la variable `GOOGLE_APPLICATION_CREDENTIALS_JSON` con el contenido inline si prefieres no escribir a disco).

Este último paso (2-4) requiere permisos de **IAM Admin** en el proyecto de Google Cloud — probablemente los mismos que gestionan la política que bloqueó la Opción A. Si no los tienes, es el mensaje exacto para pedirle a tu administrador de TI:

> "Necesito que me des el rol IAM Admin (o que configures tú mismo) Workload Identity Federation en el proyecto `invitaciones-mx-74a3f`, vinculado al proveedor OIDC de Vercel, para que la app pueda autenticarse con Firebase sin usar una clave de service account (bloqueada por la política `constraints/iam.disableServiceAccountKeyCreation`)."

Mientras tanto, el Paso 6 (prueba en local) funciona perfectamente con `gcloud auth application-default login` — no necesitas resolver WIF para probar la app hoy mismo.

### Opcional — Generación de diseño con IA

Si quieres usar el botón "✨ Generar con IA" del wizard (features/ai-design), necesitas una API key de [platform.openai.com](https://platform.openai.com) con saldo/facturación activa. Agrégala como `OPENAI_API_KEY` en `.env.local` (Paso 4) y en Vercel (Paso 8). Sin esta variable, el resto de la app funciona igual — esa sección del wizard simplemente devolverá un error si se usa.

---

## Paso 4 — Configurar las variables de entorno

Dentro de la carpeta del proyecto (`invitaciones-saas/`), copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Ábrelo y llena los valores:

```bash
# Del bloque firebaseConfig del Paso 2
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=invitaciones-mx-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=invitaciones-mx-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=invitaciones-mx-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Del archivo .json del Paso 3 (Opción A) — deja vacías si usas Opción B (sin clave)
FIREBASE_ADMIN_PROJECT_ID=invitaciones-mx-xxxxx
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@invitaciones-mx-xxxxx.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...resto de la clave...\n-----END PRIVATE KEY-----\n"

# Opcional, solo si vas a usar "Generar con IA" (platform.openai.com)
OPENAI_API_KEY=sk-...
```

**Cuidado con `FIREBASE_ADMIN_PRIVATE_KEY`:** en el `.json` descargado, la clave tiene saltos de línea reales. Cópiala completa entre comillas dobles tal cual viene en el JSON (con los `\n` literales) — el código ya la convierte correctamente (`firebase/admin.ts` hace `.replace(/\\n/g, "\n")`). Si la pegas sin comillas o le quitas los `\n`, vas a ver el error `Failed to parse private key` al arrancar.

**Si usas Opción B (sin clave):** deja las 3 variables `FIREBASE_ADMIN_*` completamente vacías (o bórralas) en `.env.local`. El código las detecta ausentes y usa automáticamente las credenciales de `gcloud auth application-default login` (ver Paso 3, Opción B).

---

## Paso 5 — Desplegar las reglas de seguridad

Las reglas (`firestore.rules`, `storage.rules`) ya están escritas en el proyecto — solo falta subirlas a tu proyecto de Firebase real. **Sin este paso, todo fallará con "Missing or insufficient permissions".**

```bash
npm install -g firebase-tools
firebase login
```

Dentro de la carpeta del proyecto:

```bash
firebase use --add
```

Elige tu proyecto de la lista y ponle un alias (ej. `default`). Luego:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

Deberías ver `✔ Deploy complete!`.

---

## Paso 6 — Probar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` y haz una prueba de punta a punta:

1. **Crear** → elige "Fiesta infantil" → elige una plantilla (o "✨ Generar con IA") → llena los datos → sube al menos la imagen principal → publica.
2. Anota o guarda el enlace de administración que te muestra la pantalla de éxito (`/dashboard/...?editToken=...`) — **no hay forma de recuperarlo si lo pierdes**, es el modelo del MVP (ver `arquitectura-invitaciones-saas.md`, sección de riesgos técnicos).
3. Abre el enlace público (`/i/AB72KJ`) en otra pestaña (o en el navegador de tu teléfono) y confirma asistencia.
4. Vuelve al dashboard y confirma que la respuesta aparece en la tabla y en las estadísticas.
5. Prueba **Editar** desde el dashboard y guarda un cambio.
6. Prueba **Exportar (CSV)**.

Si algo falla, revisa la consola del navegador y la terminal donde corre `npm run dev` — casi siempre es una variable de entorno mal copiada o las reglas no desplegadas (Paso 5).

---

## Paso 7 — Subir el código a GitHub

Si el proyecto no es ya un repositorio git:

```bash
git init
git add .
git commit -m "Invitaciones SaaS: scaffold inicial"
```

Crea un repositorio vacío en [github.com/new](https://github.com/new) (no lo inicialices con README) y conéctalo:

```bash
git remote add origin https://github.com/TU-USUARIO/invitaciones-saas.git
git branch -M main
git push -u origin main
```

`.env.local` no se sube — ya está en `.gitignore`. Perfecto: esas credenciales son solo tuyas.

---

## Paso 8 — Desplegar en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new) e inicia sesión (puedes usar tu cuenta de GitHub directamente).
2. Importa el repositorio que acabas de crear.
3. Vercel detecta automáticamente que es un proyecto Next.js — no cambies el build command.
4. Antes de darle a **Deploy**, abre **Environment Variables** y agrega las mismas variables de tu `.env.local` (Paso 4). Cópialas y pégalas tal cual — para `FIREBASE_ADMIN_PRIVATE_KEY`, pega el valor completo incluyendo los `\n` literales.
5. Clic en **Deploy**.

En 1-2 minutos tendrás una URL pública (`https://tu-proyecto.vercel.app`). Repite el checklist del Paso 6 pero contra esa URL.

---

## Checklist rápido de verificación post-deploy

- [ ] `/` carga y el botón "Crear mi invitación" funciona
- [ ] El wizard completo (5 pasos) publica sin errores
- [ ] `/i/[slug]` de la invitación recién creada carga y se ve bien en un celular
- [ ] El RSVP se guarda (probarlo desde otro dispositivo/navegador, no el mismo donde creaste la invitación)
- [ ] El dashboard muestra la confirmación y las estadísticas correctas
- [ ] "Editar" guarda cambios y se reflejan en `/i/[slug]`
- [ ] El QR de la pantalla de éxito escanea correctamente al link público
- [ ] (si usas IA) "✨ Generar con IA" propone un diseño y respeta el límite de generaciones

---

## Problemas comunes

**"Missing or insufficient permissions" en cualquier operación de Firestore.**
Las reglas no se desplegaron (Paso 5), o el proyecto activo de `firebase use` no es el correcto. Corre `firebase projects:list` y `firebase use --add` de nuevo.

**"Failed to parse private key" al crear una invitación o entrar al dashboard.**
`FIREBASE_ADMIN_PRIVATE_KEY` está mal copiada — revisa el Paso 4. Debe incluir `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----` completos.

**"No se permite crear claves en esta cuenta de servicio" en Firebase console.**
Política de organización `constraints/iam.disableServiceAccountKeyCreation` activa. Usa la Opción B del Paso 3 (Application Default Credentials) — no requiere esa clave.

**"Could not load the default credentials" al arrancar `npm run dev`.**
Estás en la Opción B (sin clave) pero no corriste `gcloud auth application-default login`, o cerraste sesión. Vuelve a correr ese comando.

**Las imágenes no suben (error de Storage).**
Verifica que `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` coincida exactamente con el bucket que ves en Firebase Console → Storage (normalmente termina en `.appspot.com` o `.firebasestorage.app` según la fecha de creación del proyecto — copia el valor real, no lo adivines).

**El dashboard dice "No autorizado" aunque el link es el correcto.**
El `editToken` en la URL no coincide con el guardado en `invitationSecrets/{id}` — usualmente pasa si se creó la invitación contra un proyecto de Firebase distinto al que estás consultando ahora (por ejemplo, la creaste en local contra un proyecto de prueba y ahora consultas producción). Crea una invitación nueva contra el proyecto correcto.

**El build de Vercel falla pero `npm run build` local funciona.**
Casi siempre son variables de entorno faltantes en Vercel (Paso 8.4) — revisa que estén todas cargadas, incluida `FIREBASE_ADMIN_PRIVATE_KEY` con los `\n`.

**"Generar con IA" responde "Alcanzaste el límite de generaciones".**
Es el límite anti-abuso de `lib/ai/rateLimit.ts` (5 por hora por IP) — pensado para el wizard público sin autenticación. Espera una hora o ajusta `LIMIT_PER_HOUR` en ese archivo si necesitas probarlo más seguido.

---

## Qué sigue después de esto

Con el deploy funcionando, lo natural es: probar el flujo completo con gente real (compartir un enlace de prueba por WhatsApp), revisar `arquitectura-invitaciones-saas.md` sección 9 (roadmap) para decidir la siguiente fase, y — antes de compartirlo ampliamente — activar [Firebase App Check](https://firebase.google.com/docs/app-check) para mitigar spam en el formulario de RSVP, que hoy está abierto públicamente por diseño (ver `firestore.rules`).
