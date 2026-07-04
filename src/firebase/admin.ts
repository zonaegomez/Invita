import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

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
 * Credenciales: soporta dos modos, elegidos automaticamente segun lo que haya
 * en el entorno.
 *   1. Cert explicito (FIREBASE_ADMIN_*) -- para entornos donde SI se puede
 *      generar una clave de service account.
 *   2. Application Default Credentials (ADC) -- usado cuando las variables
 *      FIREBASE_ADMIN_* no estan presentes. Cubre dos casos sin necesitar un
 *      archivo .json de clave:
 *        - Local: `gcloud auth application-default login` deja credenciales
 *          en el disco del desarrollador que el SDK detecta solas.
 *        - Produccion (Vercel u otro entorno no-GCP): apunta la variable
 *          GOOGLE_APPLICATION_CREDENTIALS a un archivo de configuracion de
 *          Workload Identity Federation (un JSON tipo "external_account" que
 *          NO contiene secretos, solo referencia al proveedor de identidad)
 *          -- ver GUIA-DEPLOY.md, seccion "Autenticacion sin clave".
 */
let cachedApp: App | null = null;

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
