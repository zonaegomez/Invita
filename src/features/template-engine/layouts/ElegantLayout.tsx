import { Hero } from "../sections/Hero";
import { Countdown } from "../sections/Countdown";
import { EventInfo } from "../sections/EventInfo";
import { MapEmbed } from "../sections/MapEmbed";
import { Gallery } from "../sections/Gallery";
import { RsvpCta } from "../sections/RsvpCta";
import type { LayoutProps } from "./PlayfulLayout";

/** Variante "elegant": prioriza la galería antes que los detalles
 * logísticos — pensada para bodas y XV años con fotografía de alta calidad. */
export function ElegantLayout({ invitation, theme, onRsvpClick }: LayoutProps) {
  return (
    <>
      <Hero invitation={invitation} variant={theme.sectionVariants.hero} fontStack={theme.fonts.stack} />
      <Countdown target={invitation.date} variant={theme.sectionVariants.countdown} />
      <Gallery images={invitation.images.gallery} variant={theme.sectionVariants.gallery} />
      <EventInfo invitation={invitation} />
      <MapEmbed mapsUrl={invitation.mapsUrl} venueName={invitation.venueName} />
      <div className="h-24" />
      <RsvpCta onClick={onRsvpClick} />
    </>
  );
}
