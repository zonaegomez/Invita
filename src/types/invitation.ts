import type { Timestamp } from "firebase/firestore";
import type { EventCategoryId } from "./eventCategory";
import type { ThemeConfig } from "./template";

export type InvitationStatus = "draft" | "published" | "archived";

/**
 * Campos específicos por categoría de evento, tipados como unión
 * discriminada. Permite que boda/XV años/baby shower agreguen sus propios
 * campos sin que el esquema base de Invitation ni las queries del dashboard
 * cambien — solo el formulario y el TemplateRenderer interpretan este mapa.
 */
export type CategoryFields =
  | { categoryId: "infantil"; theme: string; age: number }
  | {
      categoryId: "boda";
      brideAndGroom: [string, string];
      dressCode?: string;
      giftRegistryUrl?: string;
    }
  | {
      categoryId: "xv";
      parentsNames: string[];
      churchTime?: string;
      receptionTime?: string;
    }
  | {
      categoryId: "baby-shower";
      parentsNames: string[];
      babyGender?: "niño" | "niña" | "sorpresa";
    }
  | { categoryId: "graduacion"; institution?: string; degree?: string }
  | {
      categoryId: "corporativo";
      companyName: string;
      dressCode?: string;
      agendaUrl?: string;
    };

export interface InvitationImages {
  hero: string;
  cover: string;
  gallery: string[];
}

export interface InvitationMusic {
  url: string;
  title?: string;
}

/**
 * Entidad pública. NO incluye editToken a propósito: ese secreto vive en la
 * colección `invitationSecrets`, con lectura bloqueada por firestore.rules.
 * Guardarlo aquí sería un hueco de seguridad — cualquiera que lea /i/[slug]
 * recibe el documento completo vía el SDK de cliente, y las reglas de
 * Firestore no pueden ocultar campos individuales dentro de un documento
 * cuya lectura está permitida.
 */
export interface Invitation {
  id: string;
  slug: string;
  ownerId: string | null;

  categoryId: EventCategoryId;
  templateId: string;

  /**
   * Presente solo cuando el diseño se generó con IA (features/ai-design).
   * Si existe, tiene prioridad sobre el lookup de `templateId` en
   * lib/templates/registry.ts al momento de renderizar — ver
   * TemplateRenderer y su uso en app/i/[slug] y app/crear/preview. Sigue
   * siendo un ThemeConfig normal (paleta + layout + variantes ya
   * existentes), nunca HTML/CSS libre: la IA llena datos, no código.
   */
  customTheme?: ThemeConfig;

  hostName: string;
  age?: number;
  theme?: string;

  date: Timestamp;
  time: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;

  message: string;
  contactPhone: string;

  images: InvitationImages;
  music?: InvitationMusic;

  categoryFields?: CategoryFields;

  status: InvitationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Datos que recolecta el wizard antes de publicar (sin campos server-generated). */
export type CreateInvitationInput = Omit<
  Invitation,
  "id" | "slug" | "createdAt" | "updatedAt" | "status" | "ownerId"
>;
