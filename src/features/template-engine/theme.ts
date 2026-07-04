import type { CSSProperties } from "react";
import type { ThemeConfig } from "@/types/template";

/** Convierte un ThemeConfig en CSS custom properties aplicables a un contenedor. */
export function themeToCssVars(theme: ThemeConfig): CSSProperties {
  return {
    "--theme-primary": theme.palette.primary,
    "--theme-secondary": theme.palette.secondary,
    "--theme-accent": theme.palette.accent,
    "--theme-background": theme.palette.background,
  } as CSSProperties;
}
