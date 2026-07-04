import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/firebase/admin";

/**
 * Limite simple de generaciones de IA por IP y por hora. El wizard no tiene
 * autenticacion en el MVP (ver riesgo tecnico en arquitectura-invitaciones-saas.md),
 * asi que sin esto cualquiera podria refrescar la pagina y vaciar el saldo de
 * OpenAI. Vive en su propia coleccion (`aiRateLimits`), bloqueada por completo
 * en firestore.rules -- solo el admin SDK la toca.
 */
const LIMIT_PER_HOUR = 5;

export async function checkAiRateLimit(ip: string): Promise<boolean> {
  const db = getAdminDb();
  const bucket = new Date().toISOString().slice(0, 13); // yyyy-mm-ddThh
  const docId = `${ip.replace(/[^a-zA-Z0-9]/g, "_")}_${bucket}`;
  const ref = db.collection("aiRateLimits").doc(docId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? ((snap.data()?.count as number) ?? 0) : 0;
    if (count >= LIMIT_PER_HOUR) return false;
    tx.set(ref, { count: count + 1, updatedAt: Timestamp.now() }, { merge: true });
    return true;
  });
}
