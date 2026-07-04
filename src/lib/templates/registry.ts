import type { ThemeConfig } from "@/types/template";

/**
 * Catálogo de plantillas. Cada entrada es SOLO configuración — el
 * TemplateRenderer (features/template-engine) decide cómo renderizarla.
 * Agregar una plantilla nueva no debería requerir tocar páginas ni lógica
 * de negocio, solo agregar una entrada aquí + assets.
 *
 * Nota de producto: los nombres son deliberadamente genéricos (sin
 * personajes con copyright/marca registrada, aunque el brief original los
 * mencionara como ejemplos ilustrativos tipo "Frozen" o "Spider-Man").
 * Vender invitaciones con personajes con licencia sin un acuerdo con el
 * titular de esa marca es un riesgo legal real para el negocio.
 */
export const TEMPLATE_REGISTRY: Record<string, ThemeConfig> = {
  "guerreras-pop": {
    id: "guerreras-pop",
    categoryId: "infantil",
    name: "Guerreras Pop",
    layout: "playful",
    palette: {
      primary: "#E11D74",
      secondary: "#7C3AED",
      accent: "#FACC15",
      background: "#FFF7FB",
    },
    fonts: { stack: "playful" },
    assets: {},
    sectionVariants: { hero: "centered", countdown: "cards", gallery: "grid" },
  },
  "safari-aventura": {
    id: "safari-aventura",
    categoryId: "infantil",
    name: "Safari Aventura",
    layout: "classic",
    palette: {
      primary: "#B45309",
      secondary: "#166534",
      accent: "#FDE68A",
      background: "#FFFBEB",
    },
    fonts: { stack: "modern" },
    assets: {},
    sectionVariants: { hero: "centered", countdown: "minimal", gallery: "grid" },
  },
  "elegancia-blush": {
    id: "elegancia-blush",
    categoryId: "boda",
    name: "Elegancia Blush",
    layout: "elegant",
    palette: {
      primary: "#9F1239",
      secondary: "#78716C",
      accent: "#F5D0C5",
      background: "#FFF7F5",
    },
    fonts: { stack: "elegant" },
    assets: {},
    sectionVariants: { hero: "centered", countdown: "minimal", gallery: "masonry" },
  },
};

export function getTemplate(templateId: string): ThemeConfig | undefined {
  return TEMPLATE_REGISTRY[templateId];
}

export function getTemplatesByCategory(categoryId: string): ThemeConfig[] {
  return Object.values(TEMPLATE_REGISTRY).filter((t) => t.categoryId === categoryId);
}
