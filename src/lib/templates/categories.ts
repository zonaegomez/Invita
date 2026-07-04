import type { EventCategoryDefinition } from "@/types/eventCategory";

/**
 * Catálogo de categorías de evento. Vive en código en el MVP; se migra a
 * Firestore/CMS cuando exista un panel de administración (roadmap Fase 7).
 */
export const EVENT_CATEGORIES: EventCategoryDefinition[] = [
  { id: "infantil", label: "Fiesta infantil", description: "Cumpleaños y fiestas para niños." },
  { id: "boda", label: "Boda", description: "Invitaciones para bodas civiles y religiosas." },
  { id: "xv", label: "XV años", description: "Quinceañeras." },
  { id: "baby-shower", label: "Baby shower", description: "Celebración de bienvenida al bebé." },
  { id: "graduacion", label: "Graduación", description: "Ceremonias de graduación." },
  { id: "corporativo", label: "Evento corporativo", description: "Eventos empresariales y networking." },
];

export function getCategoryById(id: string) {
  return EVENT_CATEGORIES.find((c) => c.id === id);
}
