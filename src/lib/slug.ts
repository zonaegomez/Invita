import { SLUG_LENGTH } from "./constants";

/**
 * Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L) para que un slug leído
 * en voz alta o escrito a mano no genere confusión.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Genera un slug corto, aleatorio y criptográficamente seguro, ej. "AB72KJ". */
export function generateSlug(length: number = SLUG_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function isValidSlugFormat(slug: string): boolean {
  return new RegExp(`^[${ALPHABET}]{6,10}$`).test(slug);
}
