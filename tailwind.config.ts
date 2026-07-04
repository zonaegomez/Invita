import type { Config } from "tailwindcss";

/**
 * Tokens base del design system. La paleta "de marca" real llega con cada
 * plantilla (lib/templates/registry.ts) vía CSS custom properties inline
 * (ver features/template-engine/theme.ts) — estos valores son los
 * neutrales de la UI de producto (wizard, dashboard, landing).
 *
 * font-playful / font-elegant corresponden a los FontStack de
 * types/template.ts, cargados en app/layout.tsx.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        playful: ["var(--font-playful)", "system-ui", "sans-serif"],
        elegant: ["var(--font-elegant)", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
