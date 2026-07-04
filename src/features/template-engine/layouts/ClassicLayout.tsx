import { Hero } from "../sections/Hero";
import { Countdown } from "../sections/Countdown";
import { EventInfo } from "../sections/EventInfo";
import { MapEmbed } from "../sections/MapEmbed";
import { Gallery } from "../sections/Gallery";
import { RsvpCta } from "../sections/RsvpCta";
import type { LayoutProps } from "./PlayfulLayout";

/** Variante "classic": la información del evento precede a la cuenta
 * regresiva — más apropiada para categorías formales (boda, corporativo). */
export function ClassicLayout({ invitation, theme, onRsvpClick }: LayoutProps) {
  return (
    <>
      <Hero invitation={invitation} variant={theme.sectionVariants.hero} fontStack={theme.fonts.stack} />
      <EventInfo invitation={invitation} />
      <Countdown target={invitation.date} variant={theme.sectionVariants.countdown} />
      <MapEmbed mapsUrl={invitation.mapsUrl} venueName={invitation.venueName} />
      <Gallery images={invitation.images.gallery} variant={theme.sectionVariants.gallery} />
      <div className="h-24" />
      <RsvpCta onClick={onRsvpClick} />
    </>
  );
}
