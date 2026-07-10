import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getInvitationBySlug } from "@/services/invitationService";
import { getTemplate } from "@/lib/templates/registry";
import { toInvitationViewModel } from "@/utils/invitationView";
import { PublicInvitationView } from "@/features/public-invitation/PublicInvitationView";

/** ISR corto: la página debe reflejar cambios recientes del organizador sin
 * sacrificar el cacheo necesario para picos de tráfico por WhatsApp. */
export const revalidate = 60;

// cache() dedupea la lectura entre generateMetadata y el Server Component --
// ambos corren en el mismo request, sin esto se leeria Firestore dos veces.
const loadInvitation = cache(getInvitationBySlug);

/**
 * Vista previa de WhatsApp/redes para invitaciones genericas (/i/[slug]).
 * Usa la imagen que el organizador subio como portada/principal -- para que
 * la miniatura se vea bien en WhatsApp conviene que esa imagen sea horizontal
 * y liviana (ver caso Marbet Anahi: una imagen vertical de 2.5MB no generaba
 * vista previa).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await loadInvitation(slug);
  if (!invitation) return {};

  const title = `${invitation.hostName} — ¡Estás invitado! 🎉`;
  const description = invitation.message || `Acompáñanos a celebrar a ${invitation.hostName}.`;
  const image = invitation.images.cover || invitation.images.hero;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicInvitationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invitation = await loadInvitation(slug);
  if (!invitation) notFound();

  // customTheme tiene prioridad sobre el registry -- ver types/invitation.ts.
  const theme = invitation.customTheme ?? getTemplate(invitation.templateId);
  if (!theme) notFound();

  return (
    <PublicInvitationView
      invitationId={invitation.id}
      invitation={toInvitationViewModel(invitation)}
      theme={theme}
    />
  );
}
