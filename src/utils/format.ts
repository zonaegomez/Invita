export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Deja solo dígitos — formato que espera el deep link de WhatsApp (wa.me/<numero>). */
export function formatWhatsAppNumber(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}
