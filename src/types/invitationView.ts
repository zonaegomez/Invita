/**
 * Vista de invitación desacoplada de Firestore: `date` es un `Date` nativo,
 * no un `Timestamp`. El motor de plantillas (features/template-engine) y el
 * wizard de creación consumen este tipo — así el TemplateRenderer puede
 * usarse tanto para el preview en vivo (que aún no tiene un Invitation real)
 * como para la página pública ya publicada, sin acoplarse al SDK de Firebase.
 */
export interface InvitationViewModel {
  hostName: string;
  age?: number;
  theme?: string;
  date: Date;
  time: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  message: string;
  contactPhone: string;
  images: { hero: string; cover: string; gallery: string[] };
  music?: { url: string; title?: string };
}
