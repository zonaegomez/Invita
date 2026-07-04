"use client";

import { useEffect, useState } from "react";
import type { EventCategoryId } from "@/types/eventCategory";
import type { ThemeConfig } from "@/types/template";

const STORAGE_KEY = "invitacion-wizard-draft";

export interface WizardDraft {
  /** Generado al iniciar el wizard; se usa como ID del documento de
   * Firestore Y como prefijo de las rutas de Storage, para que las imágenes
   * subidas durante el wizard ya apunten al ID final de la invitación. */
  id: string;
  categoryId?: EventCategoryId;
  templateId?: string;
  /** Presente solo si el usuario generó el diseño con IA (features/ai-design). */
  customTheme?: ThemeConfig;

  // Campos comunes / categoría "infantil"
  hostName?: string;
  age?: number;
  theme?: string;

  // Campos específicos de categoría "boda" (ver CategoryFields en types/invitation.ts)
  brideAndGroom?: [string, string];
  dressCode?: string;
  giftRegistryUrl?: string;

  // Comunes a cualquier categoría
  date?: string; // YYYY-MM-DD, del <input type="date">
  time?: string; // HH:mm
  venueName?: string;
  venueAddress?: string;
  mapsUrl?: string;
  message?: string;
  contactPhone?: string;
  images?: { hero?: string; cover?: string; gallery: string[] };
  music?: { url?: string; title?: string };
}

function createEmptyDraft(): WizardDraft {
  return { id: crypto.randomUUID(), images: { gallery: [] } };
}

export function useWizardDraft() {
  const [draft, setDraft] = useState<WizardDraft>(createEmptyDraft);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setDraft(JSON.parse(raw));
      } catch {
        // localStorage corrupto -- se descarta y se sigue con un draft nuevo
      }
    }
    setHydrated(true);
  }, []);

  function updateDraft(patch: Partial<WizardDraft>) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { draft, updateDraft, clearDraft, hydrated };
}
