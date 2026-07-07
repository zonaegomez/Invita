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

/** Composicion cliente de la pagina publica: conecta el TemplateRenderer
 * (puramente visual) con el estado de apertura del modal de RSVP. */
export function PublicInvitationView({ invitationId, invitation, theme }: PublicInvitationViewProps) {
  const [rsvpOpen, setRsvpOpen] = useState(false);

  return (
    <>
      {invitation.music?.url && <MusicPlayer src={invitation.music.url} />}
      {/*
        Sin este limite de ancho, en pantallas anchas y cortas (laptop) el
        Hero (min-h-[70vh], bg-cover) estira la imagen vertical generada por
        IA para llenar todo el viewport, recortando el texto de abajo -- se
        ve bien en celular (viewport angosto) pero "cortado" en computadora.
        A partir de sm: se limita a un ancho tipo tarjeta de celular, igual
        que la vista previa del wizard (ver app/crear/preview/page.tsx), para
        que la experiencia sea consistente sin importar el tamano de pantalla.
      */}
      <div className="sm:mx-auto sm:my-8 sm:max-w-md sm:overflow-hidden sm:rounded-3xl sm:border sm:border-neutral-100 sm:shadow-lg">
        <TemplateRenderer invitation={invitation} theme={theme} onRsvpClick={() => setRsvpOpen(true)} />
      </div>
      <RsvpModal open={rsvpOpen} onClose={() => setRsvpOpen(false)} invitationId={invitationId} />
    </>
  );
}
