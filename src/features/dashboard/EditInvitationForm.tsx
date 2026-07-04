"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { uploadInvitationAsset } from "@/services/storageService";
import { MAX_GALLERY_IMAGES } from "@/lib/constants";
import type { EventCategoryId } from "@/types/eventCategory";

export interface EditInvitationFormProps {
  invitationId: string;
  editToken: string;
  categoryId: EventCategoryId;
  initial: {
    hostName: string;
    age?: number;
    theme?: string;
    brideAndGroom?: [string, string];
    dressCode?: string;
    giftRegistryUrl?: string;
    date: string; // YYYY-MM-DD
    time: string;
    venueName: string;
    venueAddress: string;
    mapsUrl: string;
    message: string;
    contactPhone: string;
    images: { hero: string; cover: string; gallery: string[] };
    music?: { url: string; title?: string };
  };
}

/**
 * Reutiliza la misma forma de datos que el wizard (Fase 2) — categoría
 * "boda" pide novia/novio, cualquier otra pide festejado/edad/tema — pero
 * en una sola pantalla en vez de pasos, precargada con los valores actuales.
 */
export function EditInvitationForm({ invitationId, editToken, categoryId, initial }: EditInvitationFormProps) {
  const router = useRouter();
  const isBoda = categoryId === "boda";

  const [hostName, setHostName] = useState(initial.hostName);
  const [age, setAge] = useState(initial.age?.toString() ?? "");
  const [theme, setTheme] = useState(initial.theme ?? "");
  const [brideName, setBrideName] = useState(initial.brideAndGroom?.[0] ?? "");
  const [groomName, setGroomName] = useState(initial.brideAndGroom?.[1] ?? "");
  const [dressCode, setDressCode] = useState(initial.dressCode ?? "");
  const [giftRegistryUrl, setGiftRegistryUrl] = useState(initial.giftRegistryUrl ?? "");

  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [venueName, setVenueName] = useState(initial.venueName);
  const [venueAddress, setVenueAddress] = useState(initial.venueAddress);
  const [mapsUrl, setMapsUrl] = useState(initial.mapsUrl);
  const [message, setMessage] = useState(initial.message);
  const [contactPhone, setContactPhone] = useState(initial.contactPhone);

  const [images, setImages] = useState(initial.images);
  const [music, setMusic] = useState(initial.music);
  const [uploading, setUploading] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleImageUpload(kind: "hero" | "cover", e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadInvitationAsset(invitationId, kind, file);
      setImages((prev) => ({ ...prev, [kind]: url }));
    } catch {
      setError("No pudimos subir el archivo.");
    } finally {
      setUploading(null);
    }
  }

  async function handleGalleryUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_GALLERY_IMAGES);
    if (!files.length) return;
    setUploading("gallery");
    try {
      const urls = await Promise.all(files.map((file) => uploadInvitationAsset(invitationId, "gallery", file)));
      setImages((prev) => ({ ...prev, gallery: [...prev.gallery, ...urls].slice(0, MAX_GALLERY_IMAGES) }));
    } catch {
      setError("No pudimos subir algunas imágenes.");
    } finally {
      setUploading(null);
    }
  }

  function removeGalleryImage(url: string) {
    setImages((prev) => ({ ...prev, gallery: prev.gallery.filter((g) => g !== url) }));
  }

  async function handleMusicUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("music");
    try {
      const url = await uploadInvitationAsset(invitationId, "music", file);
      setMusic({ url, title: file.name });
    } catch {
      setError("No pudimos subir el archivo de música.");
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!images.hero) {
      setError("Sube al menos la imagen principal.");
      return;
    }

    const body = isBoda
      ? { editToken, brideName, groomName, dressCode, giftRegistryUrl, date, time, venueName, venueAddress, mapsUrl, message, contactPhone, images, music }
      : { editToken, hostName, age, theme, date, time, venueName, venueAddress, mapsUrl, message, contactPhone, images, music };

    setSaving(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No pudimos guardar los cambios.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("No pudimos guardar los cambios. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isBoda ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre de la novia" value={brideName} onChange={(e) => setBrideName(e.target.value)} />
            <Input label="Nombre del novio" value={groomName} onChange={(e) => setGroomName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código de vestimenta" value={dressCode} onChange={(e) => setDressCode(e.target.value)} />
            <Input label="Link mesa de regalos" value={giftRegistryUrl} onChange={(e) => setGiftRegistryUrl(e.target.value)} />
          </div>
        </>
      ) : (
        <>
          <Input label="Nombre del festejado" value={hostName} onChange={(e) => setHostName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Edad" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            <Input label="Tema" value={theme} onChange={(e) => setTheme(e.target.value)} />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <Input label="Lugar" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
      <Input label="Dirección" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />
      <Input label="Link de Google Maps" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
      <Input label="Teléfono de contacto" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-message" className="text-sm font-medium text-neutral-700">
          Mensaje personalizado
        </label>
        <textarea
          id="edit-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      <div className="mt-2 border-t border-neutral-100 pt-4">
        <p className="mb-3 text-sm font-medium text-neutral-700">Fotos y música</p>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-600">Imagen principal</p>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload("hero", e)} className="text-sm" />
            {uploading === "hero" && <p className="mt-1 text-xs text-neutral-500">Subiendo...</p>}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-600">Imagen de portada</p>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload("cover", e)} className="text-sm" />
            {uploading === "cover" && <p className="mt-1 text-xs text-neutral-500">Subiendo...</p>}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-600">
              Galería ({images.gallery.length}/{MAX_GALLERY_IMAGES})
            </p>
            <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="text-sm" />
            {uploading === "gallery" && <p className="mt-1 text-xs text-neutral-500">Subiendo...</p>}
            {!!images.gallery.length && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {images.gallery.map((url) => (
                  <li key={url}>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(url)}
                      className="rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
                    >
                      Quitar imagen
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-600">Música de fondo</p>
            <input type="file" accept="audio/*" onChange={handleMusicUpload} className="text-sm" />
            {uploading === "music" && <p className="mt-1 text-xs text-neutral-500">Subiendo...</p>}
            {music?.url && (
              <button
                type="button"
                onClick={() => setMusic(undefined)}
                className="mt-1 text-xs text-neutral-500 underline"
              >
                Quitar música
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Cambios guardados.</p>}

      <Button type="submit" isLoading={saving} className="mt-2">
        Guardar cambios
      </Button>
    </form>
  );
}
