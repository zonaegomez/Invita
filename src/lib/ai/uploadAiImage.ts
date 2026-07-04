import "server-only";
import { getAdminBucket } from "@/firebase/admin";

/**
 * Sube una imagen generada por IA (base64) al mismo Storage y bajo el mismo
 * prefijo de ruta que usan las subidas manuales del wizard
 * (invitations/{id}/...), para que storage.rules (que ya permite lectura
 * publica de ese prefijo) la sirva sin configuracion adicional.
 *
 * Se construye la URL de descarga "estilo Firebase" a mano porque el admin
 * SDK no tiene un getDownloadURL() como el SDK de cliente -- como las reglas
 * ya permiten lectura publica para este path, no hace falta el token de
 * descarga que normalmente acompana esa URL.
 */
export async function uploadAiImage(base64Png: string, invitationId: string): Promise<string> {
  const bucket = getAdminBucket();
  const buffer = Buffer.from(base64Png, "base64");
  const path = `invitations/${invitationId}/ai/hero-${Date.now()}.png`;
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: { contentType: "image/png", cacheControl: "public, max-age=31536000" },
  });

  const encodedPath = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
}
