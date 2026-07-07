"use client";

import { useEffect, useState } from "react";
import type { EventCategoryId } from "@/types/eventCategory";
import type { ThemeConfig } from "@/types/template";

const STORAGE_KEY = "invitacion-wizard-draft";

export interface WizardDraft {
  /** Generado al iniciar el wizard; se usa como ID del documento de
   * Firestore Y como prefijo de las rutas de Storage, para que las imagenes
   * subidas durante el wizard ya apunten al ID final de la invitacion. */
  id: string;
  categoryId?: EventCategoryId;
  templateId?: string;
  /** Presente solo si el usuario genero el diseno con IA (features/ai-design). */
  customTheme?: ThemeConfig;
  /**
   * true si el usuario subio su propia imagen principal (hecha afuera de la
   * app, ej. con otra IA) y esa imagen ya trae el texto del evento dibujado
   * dentro. En ese caso el Hero no debe superponer nombre/edad/tema en HTML
   * encima -- se verian duplicados. Ver app/crear/multimedia/page.tsx (donde
   * se marca) y app/crear/preview/page.tsx (donde se aplica, forzando
   * sectionVariants.hero a "poster" en el theme que se publica).
   */
  heroTextBaked?: boolean;

  // Campos comunes / categoria "infantil"
  hostName?: string;
  age?: number;
  theme?: string;

  // Campos especificos de categoria "boda" (ver CategoryFields en types/invitation.ts)
  brideAndGroom?: [string, string];
  dressCode?: string;
  giftRegistryUrl?: string;

  // Comunes a cualquier categoria
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
