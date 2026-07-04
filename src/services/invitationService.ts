import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { COLLECTIONS } from "@/firebase/collections";
import { generateSlug } from "@/lib/slug";
import type { CreateInvitationInput, Invitation } from "@/types/invitation";

/**
 * Contrato de acceso a datos de invitaciones desde el cliente. Es el único
 * módulo (junto a guestService) que UI/features pueden usar para tocar
 * `invitations` — nadie más importa firebase/client directamente.
 *
 * El estado intermedio del wizard (pasos 1-4) vive en localStorage, no en
 * Firestore (ver features/invitation-builder). Este servicio solo escribe
 * una vez, en el paso final "Publicar", con el documento completo.
 */

export async function getInvitationBySlug(slug: string): Promise<Invitation | null> {
  const q = query(collection(db, COLLECTIONS.invitations), where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0]!;
  return { id: docSnap.id, ...(docSnap.data() as Omit<Invitation, "id">) };
}

export async function getInvitationById(id: string): Promise<Invitation | null> {
  const docSnap = await getDoc(doc(db, COLLECTIONS.invitations, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...(docSnap.data() as Omit<Invitation, "id">) };
}

/**
 * Crea y publica una invitación en un solo paso. El ID se elige en el
 * cliente (no con addDoc autogenerado) para que coincida con el prefijo ya
 * usado al subir imágenes en el paso de multimedia del wizard.
 *
 * El editToken se escribe en un documento separado (`invitationSecrets/{id}`)
 * dentro del mismo batch atómico — nunca en el documento público. Ver el
 * comentario en types/invitation.ts para el porqué.
 */
export async function createAndPublishInvitation(
  id: string,
  input: CreateInvitationInput
): Promise<{ id: string; slug: string; editToken: string }> {
  const editToken = crypto.randomUUID();
  let slug = generateSlug();

  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await getInvitationBySlug(slug);
    if (!existing) break;
    slug = generateSlug();
  }

  const batch = writeBatch(db);
  batch.set(doc(db, COLLECTIONS.invitations, id), {
    ...input,
    slug,
    ownerId: null,
    status: "published",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, COLLECTIONS.invitationSecrets, id), { editToken });
  await batch.commit();

  return { id, slug, editToken };
}
