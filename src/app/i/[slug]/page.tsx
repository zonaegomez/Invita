import { notFound } from "next/navigation";
import { getInvitationBySlug } from "@/services/invitationService";
import { getTemplate } from "@/lib/templates/registry";
import { toInvitationViewModel } from "@/utils/invitationView";
import { PublicInvitationView } from "@/features/public-invitation/PublicInvitationView";

/** ISR corto: la página debe reflejar cambios recientes del organizador sin
 * sacrificar el cacheo necesario para picos de tráfico por WhatsApp. */
export const revalidate = 60;

export default async function PublicInvitationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invitation = await getInvitationBySlug(slug);
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
