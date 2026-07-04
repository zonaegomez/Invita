import type { Timestamp } from "firebase/firestore";

export type AttendingStatus = "yes" | "no";

export interface Guest {
  id: string;
  invitationId: string;
  name: string;
  attending: AttendingStatus;
  adults: number;
  children: number;
  comments?: string;
  createdAt: Timestamp;
}

export type CreateGuestInput = Omit<Guest, "id" | "createdAt">;

/**
 * No incluye "pending": el modelo del MVP solo registra invitados que ya
 * respondieron el RSVP, no existe una lista pre-cargada de invitados
 * esperados. Ver nota de diseño en README.md.
 */
export interface GuestStats {
  totalGuests: number;
  confirmed: number;
  declined: number;
  totalAdults: number;
  totalChildren: number;
  totalPeople: number;
}
