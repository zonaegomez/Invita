import "server-only";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getVercelOidcToken } from "@vercel/oidc";

/**
 * SDK de administrador -- bypassa firestore.rules. Solo debe importarse desde
 * route handlers (app/api) o Server Components de solo lectura confiable,
 * nunca desde un componente cliente ni desde services/ que se usen en el navegador.
 *
 * La inicializacion es perezosa (lazy) y asíncrona: Next.js ejecuta un paso de
 * "collecting page data" en build time que importa cada route handler para
 * inspeccionar sus exports, sin invocarlos. Si cert() corriera a nivel de
 * modulo, el build fallaria en cuanto las credenciales no estuvieran
 * disponibles (por ejemplo en CI con variables dummy). Por eso getAdminDb()
 * solo construye la app la primera vez que una funcion realmente la necesita.
 *
 * Credenciales: soporta tres modos, elegidos automaticamente segun lo que
 * haya en el entorno.
 *   1. Cert explicito (FIREBASE_ADMIN_*) -- para entornos donde SI se puede
 *      generar una clave de service account.
 *   2. Workload Identity Federation (GCP_WORKLOAD_IDENTITY_*) -- usado en
 *      Vercel, donde no se puede generar una clave de service account (la
 *      politica de la organizacion bloquea `disableServiceAccountKeyCreation`).
 *      IMPORTANTE: Firestore usa gRPC internamente y firebase-admin solo
 *      acepta credenciales creadas por cert() o applicationDefault() para
 *      construir el canal gRPC -- un objeto Credential "a mano" (con solo
 *      getAccessToken()) es suficiente para Storage/Auth (REST) pero
 *      Firestore lo rechaza con "Must initialize the SDK with a certificate
 *      credential or application default credentials". Por eso, en vez de
 *      envolver el cliente de Workload Identity en un Credential custom,
 *      escribimos un archivo de configuracion "external_account" estandar
 *      (con el token OIDC de Vercel ya canjeado, vía credential_source de
 *      tipo file) y apuntamos GOOGLE_APPLICATION_CREDENTIALS a el ANTES de
 *      llamar a applicationDefault() -- así el SDK de Google Auth construye
 *      el mismo tipo de cliente que usa para ADC real, compatible con gRPC.
 *   3. Application Default Credentials (ADC) -- fallback para desarrollo
 *      local: `gcloud auth application-default login` deja credenciales en
 *      el disco del desarrollador que el SDK detecta solas.
 */
let cachedApp: App | Promise<App> | null = null;

/**
 * Escribe en /tmp (el único directorio con permiso de escritura en una
 * función serverless de Vercel) un archivo de credenciales tipo
 * "external_account" que apunta, vía credential_source.file, al token OIDC
 * que Vercel firma para esta invocación. Devuelve la ruta del archivo de
 * configuración para asignarla a GOOGLE_APPLICATION_CREDENTIALS.
 */
async function writeWorkloadIdentityCredentialFile(): Promise<string> {
  const projectNumber = process.env.GCP_PROJECT_NUMBER;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_PROVIDER_ID;
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;

  const oidcToken = await getVercelOidcToken();
  const dir = mkdtempSync(join(tmpdir(), "wif-"));
  const tokenPath = join(dir, "vercel-oidc-token");
  writeFileSync(tokenPath, oidcToken, { mode: 0o600 });

  const credentialConfig = {
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    credential_source: { file: tokenPath },
  };
  const configPath = join(dir, "wif-credentials.json");
  writeFileSync(configPath, JSON.stringify(credentialConfig), { mode: 0o600 });
  return configPath;
}

async function buildAdminApp(): Promise<App> {
  if (getApps().length) return getApps()[0]!;

  const hasExplicitCert =
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  const hasWorkloadIdentity =
    process.env.GCP_PROJECT_NUMBER &&
    process.env.GCP_WORKLOAD_IDENTITY_POOL_ID &&
    process.env.GCP_WORKLOAD_IDENTITY_PROVIDER_ID &&
    process.env.GCP_SERVICE_ACCOUNT_EMAIL;

  let credential;
  if (hasExplicitCert) {
    credential = cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    });
  } else if (hasWorkloadIdentity) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = await writeWorkloadIdentityCredentialFile();
    credential = applicationDefault();
  } else {
    credential = applicationDefault();
  }

  return initializeApp({
    credential,
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

function getAdminApp(): Promise<App> {
  if (!cachedApp) {
    cachedApp = buildAdminApp().catch((err) => {
      cachedApp = null; // permitir reintentar si la construcción falló
      throw err;
    });
  }
  return Promise.resolve(cachedApp);
}

export async function getAdminDb(): Promise<Firestore> {
  return getFirestore(await getAdminApp());
}

/**
 * Bucket de Storage vía admin SDK -- usado solo por features/ai-design para
 * subir la imagen generada por IA (el resto de la app sube archivos desde el
 * cliente con firebase/storage, ver services/storageService.ts). El nombre
 * del bucket viene de la misma variable pública que usa el cliente, para
 * garantizar que ambos apuntan exactamente al mismo bucket.
 */
export async function getAdminBucket() {
  return getStorage(await getAdminApp()).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
}
