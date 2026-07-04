import { formatWhatsAppNumber } from "@/utils/format";

/** Construye un deep link de WhatsApp con mensaje prellenado. Si `phone` se
 * omite, abre el selector de contactos de WhatsApp (comportamiento nativo de wa.me). */
export function buildWhatsAppLink(message: string, phone?: string): string {
  const text = encodeURIComponent(message);
  return phone ? `https://wa.me/${formatWhatsAppNumber(phone)}?text=${text}` : `https://wa.me/?text=${text}`;
}
