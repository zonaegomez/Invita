/** Nombres de colecciones centralizados — evita strings mágicos repetidos. */
export const COLLECTIONS = {
  invitations: "invitations",
  invitationSecrets: "invitationSecrets", // editToken -- lectura bloqueada, ver firestore.rules
  guests: "guests", // subcolección de invitations/{id}/guests
  familyList: "familyList", // subcolección de invitations/{id}/familyList -- lista de invitados esperados, admin-only
  photos: "photos", // subcolección de invitations/{id}/photos -- galería del día del evento, admin-only
  templates: "templates",
  eventCategories: "eventCategories",
} as const;
