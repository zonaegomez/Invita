import type { EventCategoryId } from "./eventCategory";

export type TemplateLayout = "classic" | "playful" | "elegant";

export type FontStack = "modern" | "playful" | "elegant";

export interface ThemeConfig {
  id: string;
  categoryId: EventCategoryId;
  name: string;
  layout: TemplateLayout;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  fonts: {
    stack: FontStack;
  };
  assets: {
    heroIllustration?: string;
    pattern?: string;
    icons?: Record<string, string>;
  };
  sectionVariants: {
    hero: "centered" | "split" | "fullBleed" | "poster";
    countdown: "cards" | "minimal" | "flip";
    gallery: "grid" | "carousel" | "masonry";
  };
}
