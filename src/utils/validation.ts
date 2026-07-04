import { z } from "zod";

/**
 * Esquema compartido entre el formulario RSVP del cliente y cualquier
 * validación server-side futura — una sola fuente de verdad para las reglas.
 */
export const rsvpSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre completo").max(80),
  attending: z.enum(["yes", "no"]),
  adults: z.number().int().min(0).max(20),
  children: z.number().int().min(0).max(20),
  comments: z.string().trim().max(280).optional(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
