import { Hero } from "../sections/Hero";
import { Countdown } from "../sections/Countdown";
import { EventInfo } from "../sections/EventInfo";
import { MapEmbed } from "../sections/MapEmbed";
import { Gallery } from "../sections/Gallery";
import { RsvpCta } from "../sections/RsvpCta";
import type { ThemeConfig } from "@/types/template";
import type { InvitationViewModel } from "@/types/invitationView";

export interface LayoutProps {
  invitation: InvitationViewModel;
  theme: ThemeConfig;
  onRsvpClick: () => void;
}

/** Variante "playful": la cuenta regresiva llega justo después del Hero —
 * pensada para fiestas infantiles, donde la expectativa es el gancho. */
export function PlayfulLayout({ invitation, theme, onRsvpClick }: LayoutProps) {
  return (
    <>
      <Hero invitation={invitation} variant={theme.sectionVariants.hero} fontStack={theme.fonts.stack} />
      <Countdown target={invitation.date} variant={theme.sectionVariants.countdown} />
      <EventInfo invitation={invitation} />
      <MapEmbed mapsUrl={invitation.mapsUrl} venueName={invitation.venueName} />
      <Gallery images={invitation.images.gallery} variant={theme.sectionVariants.gallery} />
      <div className="h-24" />
      <RsvpCta onClick={onRsvpClick} />
    </>
  );
}
