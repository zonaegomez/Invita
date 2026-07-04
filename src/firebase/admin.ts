import "server-only";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type Credential,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";

/**
 * SDK de administrador -- bypassa firestore.rules. Solo debe importarse desde
 * route handlers (app/api) o Server Components de solo lectura confiable,
 * nunca desde un componente cliente ni desde services/ que se usen en el navegador.
 *
 * La inicializacion es perezosa (lazy): Next.js ejecuta un paso de "collecting
 * page data" en build time que importa cada route handler para inspeccionar
 * sus exports, sin invocarlos. Si cert() corriera a nivel de modulo, el
 * build fallaria en cuanto las credenciales no estuvieran disponibles (por
 * ejemplo en CI con variables dummy). Por eso getAdminDb() solo construye la
 * app la primera vez que una funcion realmente la necesita.
 *
 * Credenciales: soporta tres modos, elegidos automaticamente segun lo que
 * haya en el entorno.
 *   1. Cert explicito (FIREBASE_ADMIN_*) -- para entornos donde SI se puede
 *      generar una clave de service account.
 *   2. Workload Identity Federation (GCP_WORKLOAD_IDENTITY_*) -- usado en
 *      Vercel, donde no se puede generar una clave de service account (la
 *      politica de la organizacion bloquea `disableServiceAccountKeyCreation`)
 *      pero Vercel expone un token OIDC firmado por función/deploy que GCP
 *      puede canjear por credenciales de corta duración sin ningún secreto
 *      descargable -- ver GUIA-DEPLOY.md, sección "Autenticación sin clave".
 *   3. Application Default Credentials (ADC) -- fallback para desarrollo
 *      local: `gcloud auth application-default login` deja credenciales en
 *      el disco del desarrollador que el SDK detecta solas.
 */
let cachedApp: App | null = null;

/**
 * Construye una Credential de firebase-admin respaldada por Workload Identity
 * Federation: intercambia el token OIDC que Vercel firma para cada
 * invocación (getVercelOidcToken) por un access token de Google mediante STS,
 * impersonando a la service account de Firebase Admin. No requiere ningún
 * archivo ni variable secreta -- todos los valores de entorno involucrados
 * son identificadores públicos (número de proyecto, IDs de pool/proveedor,
 * correo de la service account).
 */
function buildWorkloadIdentityCredential(): Credential {
  const projectNumber = process.env.GCP_PROJECT_NUMBER;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_PROVIDER_ID;
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;

  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  });

  if (!authClient) {
    throw new Error("No se pudo construir el cliente de Workload Identity Federation.");
  }

  return {
    async getAccessToken() {
      const response = await authClient.getAccessToken();
      const token = typeof response === "string" ? response : response?.token;
      if (!token) {
        throw new Error("Workload Identity Federation no devolvió un access token válido.");
      }
      return { access_token: token, expires_in: 3600 };
    },
  };
}

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

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
    credential = buildWorkloadIdentityCredential();
  } else {
    credential = applicationDefault();
  }

  cachedApp = initializeApp({
    credential,
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  return cachedApp;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Bucket de Storage vía admin SDK -- usado solo por features/ai-design para
 * subir la imagen generada por IA (el resto de la app sube archivos desde el
 * cliente con firebase/storage, ver services/storageService.ts). El nombre
 * del bucket viene de la misma variable pública que usa el cliente, para
 * garantizar que ambos apuntan exactamente al mismo bucket.
 */
export function getAdminBucket() {
  return getStorage(getAdminApp()).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
}
