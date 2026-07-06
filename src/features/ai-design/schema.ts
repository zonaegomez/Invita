import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Debe ser un color hex de 6 digitos, ej. #E11D74");

export const aiGenerateRequestSchema = z.object({
  categoryId: z.enum(["infantil", "boda", "xv", "baby-shower", "graduacion", "corporativo"]),
  description: z.string().min(5, "Cuéntanos un poco más de tu evento.").max(500),
  hostName: z.string().max(120).optional(),
});
export type AiGenerateRequest = z.infer<typeof aiGenerateRequestSchema>;

export const aiDesignSchema = z.object({
  title: z.string().min(3).max(80),
  message: z.string().min(10).max(500),
  theme: z.string().min(2).max(60),
  palette: z.object({
    primary: hexColor,
    secondary: hexColor,
    accent: hexColor,
    background: hexColor,
  }),
  layout: z.enum(["classic", "playful", "elegant"]),
  fontStack: z.enum(["modern", "playful", "elegant"]),
  sectionVariants: z.object({
    hero: z.enum(["centered", "split", "fullBleed"]),
    countdown: z.enum(["cards", "minimal", "flip"]),
    gallery: z.enum(["grid", "carousel", "masonry"]),
  }),
  imagePrompt: z.string().min(10).max(2000),
});
export type AiDesignResult = z.infer<typeof aiDesignSchema>;
