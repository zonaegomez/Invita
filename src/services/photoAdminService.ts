import "server-only";
// Ver nota en app/api/invitations/[id]/route.ts: debe ser @google-cloud/firestore,
// no firebase-admin/firestore, para que coincida con la clase Timestamp que
// espera la instancia de Firestore que realmente usa getAdminDb() en producción (WIF).
import { Timestamp } from "@google-cloud/firestore";
import { getAdminDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/collections";
import type { PhotoEntry } from "@/types/photo";

/**
 * Server-only: galería de fotos del recuerdo, subidas por los invitados el
 * día del evento (ver public/cumple-marbet-anahi/index.html). El archivo en
 * sí se sube DIRECTO del navegador a Firebase Storage (storage.rules ya
 * permite escritura pública en invitations/{id}/{kind}/{fileName} con tope
 * de 8MB y solo imágenes) -- lo único que pasa por aquí es el registro de
 * metadatos (url + nombre de quien subió) en Firestore, igual que
 * familyListAdminService: nunca se lee/escribe esta colección directo desde
 * el cliente (ver firestore.rules), solo vía
 * app/api/invitations/[id]/photos/route.ts con el admin SDK.
 */

const MAX_PHOTOS = 300;

function isValidPhotoUrl(url: string): boolean {
  if (typeof url !== "string" || url.length > 2000) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "firebasestorage.googleapis.com" || parsed.hostname === "storage.googleapis.com")
    );
  } catch {
    return false;
  }
}

function formatLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function listPhotos(invitationId: string): Promise<PhotoEntry[]> {
  const db = await getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.invitations)
    .doc(invitationId)
    .collection(COLLECTIONS.photos)
    .orderBy("createdAt", "desc")
    .limit(MAX_PHOTOS)
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
    return {
      id: d.id,
      url: String(data.url ?? ""),
      uploaderName: data.uploaderName ? String(data.uploaderName) : null,
      createdAtLabel: formatLabel(createdAt),
    };
  });
}

export interface AddPhotoResult {
  ok: true;
  id: string;
}

export type AddPhotoError = { ok: false; error: string };

/** Registra una foto ya subida a Storage. Valida forma y aplica un tope simple anti-spam. */
export async function addPhoto(
  invitationId: string,
  input: { url: string; uploaderName?: string | null }
): Promise<AddPhotoResult | AddPhotoError> {
  if (!isValidPhotoUrl(input.url)) {
    return { ok: false, error: "URL de imagen inválida." };
  }

  const db = await getAdminDb();
  const col = db.collection(COLLECTIONS.invitations).doc(invitationId).collection(COLLECTIONS.photos);

  const countSnap = await col.count().get();
  if (countSnap.data().count >= MAX_PHOTOS) {
    return { ok: false, error: "Ya se alcanzó el máximo de fotos para esta galería." };
  }

  const uploaderName = input.uploaderName?.trim().slice(0, 60) || null;

  const ref = await col.add({
    url: input.url,
    uploaderName,
    createdAt: Timestamp.now(),
  });

  return { ok: true, id: ref.id };
}
