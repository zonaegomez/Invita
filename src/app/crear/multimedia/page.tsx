"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardDraft } from "@/features/invitation-builder/useWizardDraft";
import { WizardProgress } from "@/features/invitation-builder/WizardProgress";
import { uploadInvitationAsset } from "@/services/storageService";
import { Button } from "@/components/ui";
import { MAX_GALLERY_IMAGES } from "@/lib/constants";

type UploadingState = "hero" | "cover" | "gallery" | "music" | null;

export default function MultimediaStepPage() {
  const router = useRouter();
  const { draft, updateDraft, hydrated } = useWizardDraft();
  const [uploading, setUploading] = useState<UploadingState>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !draft.date) router.replace("/crear/detalles");
  }, [hydrated, draft.date, router]);

  if (!hydrated || !draft.date) return null;

  async function handleImageUpload(kind: "hero" | "cover", e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(kind);
    try {
      const url = await uploadInvitationAsset(draft.id, kind, file);
      updateDraft({ images: { ...draft.images, gallery: draft.images?.gallery ?? [], [kind]: url } });
    } catch {
      setError("No pudimos subir el archivo. Intenta con uno más ligero.");
    } finally {
      setUploading(null);
    }
  }

  async function handleGalleryUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_GALLERY_IMAGES);
    if (!files.length) return;
    setError(null);
    setUploading("gallery");
    try {
      const urls = await Promise.all(files.map((file) => uploadInvitationAsset(draft.id, "gallery", file)));
      updateDraft({
        images: {
          ...draft.images,
          gallery: [...(draft.images?.gallery ?? []), ...urls].slice(0, MAX_GALLERY_IMAGES),
        },
      });
    } catch {
      setError("No pudimos subir algunas imágenes.");
    } finally {
      setUploading(null);
    }
  }

  async function handleMusicUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading("music");
    try {
      const url = await uploadInvitationAsset(draft.id, "music", file);
      updateDraft({ music: { url, title: file.name } });
    } catch {
      setError("No pudimos subir el archivo de música.");
    } finally {
      setUploading(null);
    }
  }

  function handleContinue() {
    if (!draft.images?.hero) {
      setError("Sube al menos la imagen principal para continuar.");
      return;
    }
    router.push("/crear/preview");
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <WizardProgress current="multimedia" />
      <h1 className="text-center text-2xl font-semibold">Fotos y música</h1>
      <p className="mt-2 text-center text-neutral-600">
        La imagen principal es obligatoria; el resto es opcional.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <UploadField
          label="Imagen principal"
          currentUrl={draft.images?.hero}
          uploading={uploading === "hero"}
          onChange={(e) => handleImageUpload("hero", e)}
        />
        {draft.images?.hero && (
          <label className="-mt-3 flex items-start gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={draft.heroTextBaked ?? false}
              onChange={(e) => updateDraft({ heroTextBaked: e.target.checked })}
            />
            <span>
              Mi imagen principal ya incluye el texto (título, nombre, edad) dibujado dentro —
              no lo pongas de nuevo encima.
            </span>
          </label>
        )}
        <UploadField
          label="Imagen de portada"
          currentUrl={draft.images?.cover}
          uploading={uploading === "cover"}
          onChange={(e) => handleImageUpload("cover", e)}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-700">
            Galería (opcional, hasta {MAX_GALLERY_IMAGES})
          </p>
          <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="text-sm" />
          {uploading === "gallery" && <p className="mt-1 text-xs text-neutral-500">Subiendo...</p>}
          {!!draft.images?.gallery?.length && (
            <p className="mt-1 text-xs text-neutral-500">{draft.images.gallery.length} imagen(es) cargada(s)</p>
          )}
        </div>
        <UploadField
          label="Música de fondo (opcional)"
          currentUrl={draft.music?.url}
          uploading={uploading === "music"}
          accept="audio/*"
          onChange={handleMusicUpload}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mt-2 flex justify-between">
          <Button variant="ghost" onClick={() => router.push("/crear/detalles")}>
            ← Atrás
          </Button>
          <Button onClick={handleContinue}>Continuar →</Button>
        </div>
      </div>
    </main>
  );
}

function UploadField({
  label,
  currentUrl,
  uploading,
  accept = "image/*",
  onChange,
}: {
  label: string;
  currentUrl?: string;
  uploading: boolean;
  accept?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-neutral-700">{label}</p>
      <input type="file" accept={accept} onChange={onChange} className="text-sm" />
      {uploading && <p className="mt-1 text-xs text-neutral-500">Subiendo...</p>}
      {currentUrl && !uploading && <p className="mt-1 text-xs text-emerald-600">Listo ✓</p>}
    </div>
  );
}
