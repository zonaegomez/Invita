import "server-only";
import { getAdminDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/collections";
import type { Guest } from "@/types/guest";

/**
 * Acceso server-only a invitados y al secreto de edición — se usa
 * exclusivamente desde route handlers (app/api/**) y Server Components del
 * dashboard, después de validar el editToken del organizador. Nunca se
 * importa desde un componente cliente: usa firebase-admin, que bypassa
 * firestore.rules por diseño.
 */

export async function verifyEditToken(invitationId: string, editToken: string): Promise<boolean> {
  const db = await getAdminDb();
  const snap = await db.collection(COLLECTIONS.invitationSecrets).doc(invitationId).get();
  if (!snap.exists) return false;
  return snap.data()?.editToken === editToken;
}

export async function listGuests(invitationId: string): Promise<Guest[]> {
  const db = await getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.invitations)
    .doc(invitationId)
    .collection(COLLECTIONS.guests)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Guest, "id">) }));
}
