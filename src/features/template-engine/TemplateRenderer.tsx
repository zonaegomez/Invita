import { PlayfulLayout } from "./layouts/PlayfulLayout";
import { ClassicLayout } from "./layouts/ClassicLayout";
import { ElegantLayout } from "./layouts/ElegantLayout";
import { themeToCssVars } from "./theme";
import type { ThemeConfig } from "@/types/template";
import type { InvitationViewModel } from "@/types/invitationView";

interface TemplateRendererProps {
  invitation: InvitationViewModel;
  theme: ThemeConfig;
  onRsvpClick: () => void;
}

const LAYOUTS = {
  playful: PlayfulLayout,
  classic: ClassicLayout,
  elegant: ElegantLayout,
} as const;

/**
 * Único punto donde se decide la composición visual a partir de un
 * ThemeConfig. Agregar una plantilla nueva casi nunca debería tocar este
 * archivo: solo agregar una entrada al registry (lib/templates/registry.ts)
 * y, si el layout ya existe, listo — ver sección 5 de
 * arquitectura-invitaciones-saas.md.
 */
export function TemplateRenderer({ invitation, theme, onRsvpClick }: TemplateRendererProps) {
  const Layout = LAYOUTS[theme.layout];
  return (
    <div style={themeToCssVars(theme)} className="min-h-screen bg-[var(--theme-background)]">
      <Layout invitation={invitation} theme={theme} onRsvpClick={onRsvpClick} />
    </div>
  );
}
