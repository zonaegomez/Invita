import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore as getFirebaseAdminFirestore } from "firebase-admin/firestore";
import { getStorage as getFirebaseAdminStorage } from "firebase-admin/storage";
import { Firestore } from "@google-cloud/firestore";
import { Storage, type Bucket } from "@google-cloud/storage";
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
 *      generar una clave de service account. Usa firebase-admin normalmente.
 *   2. Workload Identity Federation (GCP_WORKLOAD_IDENTITY_*) -- usado en
 *      Vercel, donde no se puede generar una clave de service account (la
 *      politica de la organizacion bloquea `disableServiceAccountKeyCreation`).
 *      IMPORTANTE: firebase-admin-node (tanto Firestore como Storage) solo
 *      acepta credenciales de tipo "service_account", "authorized_user",
 *      "impersonated_service_account" o Application Default "implícita" (ver
 *      node_modules/firebase-admin/lib/app/credential-internal.js, funciones
 *      credentialFromFile/isApplicationDefault) -- "external_account"
 *      (Workload Identity Federation) NO esta en esa lista, asi que
 *      firebase-admin SIEMPRE lo rechaza con "Must initialize the SDK with a
 *      certificate credential or application default credentials", sin
 *      importar si se pasa como Credential a mano o como archivo apuntado
 *      por GOOGLE_APPLICATION_CREDENTIALS. Por eso, para este modo, NO usamos
 *      firebase-admin/firestore ni firebase-admin/storage: instanciamos
 *      @google-cloud/firestore y @google-cloud/storage DIRECTAMENTE (son las
 *      mismas clases que firebase-admin usa por debajo), pasandoles nuestro
 *      ExternalAccountClient ya autenticado vía la opción `authClient` --
 *      esa capa sí acepta cualquier cliente de google-auth-library, sin la
 *      lista blanca de firebase-admin.
 *   3. Application Default Credentials (ADC) -- fallback para desarrollo
 *      local: `gcloud auth application-default login` deja credenciales en
 *      el disco del desarrollador que el SDK detecta solas.
 */
let cachedApp: App | null = null;
let cachedWifAuthClient: ReturnType<typeof ExternalAccountClient.fromJSON> | null = null;
let cachedWifDb: Firestore | null = null;
let cachedWifBucket: Bucket | null = null;

function hasWorkloadIdentityConfig(): boolean {
  return Boolean(
    process.env.GCP_PROJECT_NUMBER &&
      process.env.GCP_WORKLOAD_IDENTITY_POOL_ID &&
      process.env.GCP_WORKLOAD_IDENTITY_PROVIDER_ID &&
      process.env.GCP_SERVICE_ACCOUNT_EMAIL
  );
}

function getWifAuthClient() {
  if (cachedWifAuthClient) return cachedWifAuthClient;

  const projectNumber = process.env.GCP_PROJECT_NUMBER;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_PROVIDER_ID;
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;

  cachedWifAuthClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  });

  if (!cachedWifAuthClient) {
    throw new Error("No se pudo construir el cliente de Workload Identity Federation.");
  }
  return cachedWifAuthClient;
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

  cachedApp = initializeApp({
    credential: hasExplicitCert
      ? cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        })
      : applicationDefault(),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  return cachedApp;
}

function getProjectId(): string | undefined {
  return process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

// Ambos modos deben ignorar propiedades `undefined` en los payloads que se
// escriben, igual que el cliente (ver firebase/client.ts) -- si no, cualquier
// campo opcional ausente (age/theme en categoria "boda", music sin definir)
// hace que Firestore lance "Cannot use 'undefined' as a Firestore value" de
// forma sincrona, y updateInvitationAdmin() nunca llega a escribir nada. Este
// fue el bug detras de "no guarda cambios" al editar una invitacion publicada
// desde dashboard/[id]/editar.
let adminFirestoreSettingsApplied = false;

export async function getAdminDb(): Promise<Firestore> {
  if (hasWorkloadIdentityConfig()) {
    if (!cachedWifDb) {
      cachedWifDb = new Firestore({
        projectId: getProjectId(),
        authClient: getWifAuthClient(),
        ignoreUndefinedProperties: true,
      });
    }
    return cachedWifDb;
  }
  const db = getFirebaseAdminFirestore(getAdminApp());
  if (!adminFirestoreSettingsApplied) {
    db.settings({ ignoreUndefinedProperties: true });
    adminFirestoreSettingsApplied = true;
  }
  return db;
}

/**
 * Bucket de Storage vía admin SDK -- usado solo por features/ai-design para
 * subir la imagen generada por IA (el resto de la app sube archivos desde el
 * cliente con firebase/storage, ver services/storageService.ts). El nombre
 * del bucket viene de la misma variable pública que usa el cliente, para
 * garantizar que ambos apuntan exactamente al mismo bucket.
 */
export async function getAdminBucket(): Promise<Bucket> {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (hasWorkloadIdentityConfig()) {
    if (!cachedWifBucket) {
      const storage = new Storage({ projectId: getProjectId(), authClient: getWifAuthClient() });
      cachedWifBucket = storage.bucket(bucketName!);
    }
    return cachedWifBucket;
  }
  return getFirebaseAdminStorage(getAdminApp()).bucket(bucketName);
}
