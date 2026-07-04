import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/firebase/client";
import { MAX_IMAGE_SIZE_MB } from "@/lib/constants";

export type UploadKind = "hero" | "cover" | "gallery" | "music";

/**
 * Sube un archivo al Storage de la invitación y devuelve su URL pública.
 * Asume que el archivo ya viene comprimido/optimizado desde el cliente —
 * ver riesgo técnico "Imágenes sin optimizar" en arquitectura-invitaciones-saas.md.
 */
export async function uploadInvitationAsset(
  invitationId: string,
  kind: UploadKind,
  file: File
): Promise<string> {
  const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  if (kind !== "music" && file.size > maxBytes) {
    throw new Error(`El archivo excede el límite de ${MAX_IMAGE_SIZE_MB}MB.`);
  }

  const path = `invitations/${invitationId}/${kind}/${crypto.randomUUID()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
