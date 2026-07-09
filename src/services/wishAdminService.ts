import "server-only";
// Ver nota en app/api/invitations/[id]/route.ts: debe ser @google-cloud/firestore,
// no firebase-admin/firestore, para que coincida con la clase Timestamp que
// espera la instancia de Firestore que realmente usa getAdminDb() en producción (WIF).
import { Timestamp } from "@google-cloud/firestore";
import { getAdminDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/collections";
import type { WishEntry } from "@/types/wish";

/**
 * Server-only: muro de felicitaciones para la festejada (ver
 * public/cumple-marbet-anahi/index.html). A diferencia de la galería de
 * fotos, este muro esta disponible desde el inicio (no espera al dia del
 * evento) -- los invitados pueden dejar su mensaje en cuanto reciben el
 * link. Nunca se lee/escribe esta coleccion directo desde el cliente (ver
 * firestore.rules) -- solo via app/api/invitations/[id]/wishes/route.ts.
 */

const MAX_WISHES = 500;
const MAX_MESSAGE_LEN = 300;
const MAX_NAME_LEN = 60;

function formatLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function listWishes(invitationId: string): Promise<WishEntry[]> {
  const db = await getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.invitations)
    .doc(invitationId)
    .collection(COLLECTIONS.wishes)
    .orderBy("createdAt", "desc")
    .limit(MAX_WISHES)
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
    return {
      id: d.id,
      name: data.name ? String(data.name) : null,
      message: String(data.message ?? ""),
      createdAtLabel: formatLabel(createdAt),
    };
  });
}

export type AddWishResult = { ok: true; id: string } | { ok: false; error: string };

export async function addWish(
  invitationId: string,
  input: { name?: string | null; message: string }
): Promise<AddWishResult> {
  const message = input.message.trim().slice(0, MAX_MESSAGE_LEN);
  if (!message) {
    return { ok: false, error: "Escribe un mensaje." };
  }

  const db = await getAdminDb();
  const col = db.collection(COLLECTIONS.invitations).doc(invitationId).collection(COLLECTIONS.wishes);

  const countSnap = await col.count().get();
  if (countSnap.data().count >= MAX_WISHES) {
    return { ok: false, error: "Ya se alcanzó el máximo de mensajes." };
  }

  const name = input.name?.trim().slice(0, MAX_NAME_LEN) || null;

  const ref = await col.add({
    name,
    message,
    createdAt: Timestamp.now(),
  });

  return { ok: true, id: ref.id };
}
