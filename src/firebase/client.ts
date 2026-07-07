import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
}

/**
 * Varios campos de Invitation son opcionales (music, categoryFields, age,
 * theme) y el wizard los deja como `undefined` cuando el usuario no los
 * llena (por ejemplo, casi nadie agrega musica). El SDK cliente de Firestore
 * lanza una excepcion SINCRONA ("Unsupported field value: undefined") en
 * cuanto detecta una key con valor undefined en batch.set()/setDoc(), a menos
 * que se habilite ignoreUndefinedProperties -- por eso "Publicar invitacion"
 * fallaba siempre que la invitacion no tuviera musica: el error ocurria
 * antes de tocar la red (por eso no aparecia ni en los logs de Firestore ni
 * en la consola, ver el catch en app/crear/preview/page.tsx).
 */
function getFirebaseFirestore(app: FirebaseApp): Firestore {
  if (getApps().length > 1) return getFirestore(app);
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    // Ya se inicializo (p. ej. Fast Refresh en dev) -- reutiliza la instancia existente.
    return getFirestore(app);
  }
}

export const app = getFirebaseApp();
export const db: Firestore = getFirebaseFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
/** Preparado para Firebase Authentication (Fase 5) -- no se usa en el MVP. */
export const auth: Auth = getAuth(app);
