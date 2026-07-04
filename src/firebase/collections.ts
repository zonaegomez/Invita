/** Nombres de colecciones centralizados — evita strings mágicos repetidos. */
export const COLLECTIONS = {
  invitations: "invitations",
  invitationSecrets: "invitationSecrets", // editToken -- lectura bloqueada, ver firestore.rules
  guests: "guests", // subcolección de invitations/{id}/guests
  templates: "templates",
  eventCategories: "eventCategories",
} as const;
