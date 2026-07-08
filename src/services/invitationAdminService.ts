import "server-only";
// Ver nota en app/api/invitations/[id]/route.ts: debe ser @google-cloud/firestore,
// no firebase-admin/firestore, para que coincida con la clase Timestamp que
// espera la instancia de Firestore que realmente usa getAdminDb() en producción (WIF).
import { Timestamp } from "@google-cloud/firestore";
import { getAdminDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/collections";
import type { CategoryFields, InvitationImages, InvitationMusic } from "@/types/invitation";

export interface InvitationUpdatePayload {
  hostName: string;
  age?: number;
  theme?: string;
  date: Timestamp;
  time: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  message: string;
  contactPhone: string;
  images: InvitationImages;
  music?: InvitationMusic;
  categoryFields?: CategoryFields;
}

/**
 * Único camino para modificar una invitación ya publicada. Firestore rules
 * bloquea `update` desde el cliente a propósito (ver firestore.rules) — solo
 * el admin SDK, invocado desde app/api/invitations/[id]/route.ts después de
 * validar editToken, puede escribir aquí. categoryId, templateId y slug NO
 * son editables: cambiar de plantilla/categoría después de publicar queda
 * fuera de alcance del MVP (ver mensaje en el paso de preview del wizard).
 */
export async function updateInvitationAdmin(id: string, payload: InvitationUpdatePayload): Promise<void> {
  const db = await getAdminDb();
  await db
    .collection(COLLECTIONS.invitations)
    .doc(id)
    .update({ ...payload, updatedAt: Timestamp.now() });
}
