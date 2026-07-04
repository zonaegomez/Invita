"use client";

import { useState } from "react";
import { TemplateRenderer } from "@/features/template-engine/TemplateRenderer";
import { MusicPlayer } from "@/features/template-engine/sections/MusicPlayer";
import { RsvpModal } from "@/features/rsvp/RsvpModal";
import type { ThemeConfig } from "@/types/template";
import type { InvitationViewModel } from "@/types/invitationView";

interface PublicInvitationViewProps {
  invitationId: string;
  invitation: InvitationViewModel;
  theme: ThemeConfig;
}

/** Composición cliente de la página pública: conecta el TemplateRenderer
 * (puramente visual) con el estado de apertura del modal de RSVP. */
export function PublicInvitationView({ invitationId, invitation, theme }: PublicInvitationViewProps) {
  const [rsvpOpen, setRsvpOpen] = useState(false);

  return (
    <>
      {invitation.music?.url && <MusicPlayer src={invitation.music.url} />}
      <TemplateRenderer invitation={invitation} theme={theme} onRsvpClick={() => setRsvpOpen(true)} />
      <RsvpModal open={rsvpOpen} onClose={() => setRsvpOpen(false)} invitationId={invitationId} />
    </>
  );
}
