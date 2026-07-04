import { z } from "zod";

const commonEventFields = {
  date: z.string().min(1, "Selecciona una fecha"),
  time: z.string().min(1, "Selecciona una hora"),
  venueName: z.string().trim().min(2, "Ingresa el nombre del lugar"),
  venueAddress: z.string().trim().min(2, "Ingresa la dirección"),
  mapsUrl: z
    .string()
    .trim()
    .url("Ingresa un link válido de Google Maps (con https://)")
    .or(z.literal("")),
  message: z.string().trim().min(1, "Escribe un mensaje para tus invitados").max(400),
  contactPhone: z.string().trim().min(10, "Ingresa un teléfono de contacto"),
};

/** Categoría "infantil": festejado + edad + tema. */
export const infantilDetallesSchema = z.object({
  hostName: z.string().trim().min(2, "Ingresa el nombre del festejado"),
  age: z.number().int().min(0).max(120).optional(),
  theme: z.string().trim().max(60).optional(),
  ...commonEventFields,
});

/**
 * Categoría "boda": novia + novio en vez de un solo "festejado", sin edad,
 * con código de vestimenta y mesa de regalos opcionales. Es la prueba de que
 * CategoryFields (types/invitation.ts) realmente permite formularios
 * distintos por categoría sin tocar el esquema base de Invitation.
 */
export const bodaDetallesSchema = z.object({
  brideName: z.string().trim().min(2, "Ingresa el nombre de la novia"),
  groomName: z.string().trim().min(2, "Ingresa el nombre del novio"),
  dressCode: z.string().trim().max(60).optional(),
  giftRegistryUrl: z.string().trim().url("Ingresa un link válido").or(z.literal("")).optional(),
  ...commonEventFields,
});

export type InfantilDetallesInput = z.infer<typeof infantilDetallesSchema>;
export type BodaDetallesInput = z.infer<typeof bodaDetallesSchema>;
