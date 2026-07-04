import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/client";
import { COLLECTIONS } from "@/firebase/collections";
import type { CreateGuestInput, Guest, GuestStats } from "@/types/guest";

/**
 * Servicio cliente-seguro: solo expone la creación de RSVP (coincide con
 * firestore.rules, que permite `create` público en la subcolección `guests`
 * pero bloquea `read`). La lectura para el dashboard vive en
 * guestAdminService.ts (server-only, detrás de un route handler).
 */
export async function submitRsvp(
  invitationId: string,
  input: Omit<CreateGuestInput, "invitationId">
): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.invitations, invitationId, COLLECTIONS.guests), {
    ...input,
    invitationId,
    createdAt: serverTimestamp(),
  });
}

/**
 * Función pura (sin I/O) — se puede usar tanto en el cliente como en el
 * route handler del dashboard sobre los mismos datos ya cargados.
 */
export function computeGuestStats(guests: Guest[]): GuestStats {
  const confirmed = guests.filter((g) => g.attending === "yes");
  const declined = guests.filter((g) => g.attending === "no");
  const totalAdults = confirmed.reduce((sum, g) => sum + g.adults, 0);
  const totalChildren = confirmed.reduce((sum, g) => sum + g.children, 0);

  return {
    totalGuests: guests.length,
    confirmed: confirmed.length,
    declined: declined.length,
    totalAdults,
    totalChildren,
    totalPeople: totalAdults + totalChildren,
  };
}
