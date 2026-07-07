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
 * Contrato de acceso a datos de invitaciones desde el cliente. Es el unico
 * modulo (junto a guestService) que UI/features pueden usar para tocar
 * `invitations` -- nadie mas importa firebase/client directamente.
 *
 * El estado intermedio del wizard (pasos 1-4) vive en localStorage, no en
 * Firestore (ver features/invitation-builder). Este servicio solo escribe
 * una vez, en el paso final "Publicar", con el documento completo.
 */

export async function getInvitationBySlug(slug: string): Promise<Invitation | null> {
  // firestore.rules solo permite leer invitations con status == "published"
  // (ver allow read). Para una query (list), Firestore exige que esa
  // condicion este expresada como filtro explicito en la propia query --
  // si no, rechaza la consulta ENTERA con "Missing or insufficient
  // permissions", sin importar si los documentos que existen de verdad
  // cumplen la regla. Como ninguna invitacion en Firestore tiene otro status
  // (los borradores del wizard viven en localStorage, nunca en Firestore),
  // este filtro no cambia que se puede leer, solo hace que Firestore pueda
  // verificar la regla en tiempo de consulta.
  const q = query(
    collection(db, COLLECTIONS.invitations),
    where("slug", "==", slug),
    where("status", "==", "published"),
    limit(1)
  );
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
 * Crea y publica una invitacion en un solo paso. El ID se elige en el
 * cliente (no con addDoc autogenerado) para que coincida con el prefijo ya
 * usado al subir imagenes en el paso de multimedia del wizard.
 *
 * El editToken se escribe en un documento separado (`invitationSecrets/{id}`)
 * dentro del mismo batch atomico -- nunca en el documento publico. Ver el
 * comentario en types/invitation.ts para el porque.
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
