interface MapEmbedProps {
  mapsUrl: string;
  venueName: string;
}

/**
 * El embed real de Google Maps (iframe) requiere una Maps Embed API key
 * propia del organizador/plataforma — queda como mejora futura (ver
 * arquitectura-invitaciones-saas.md, sección 11). Por ahora se linkea
 * directo a Maps, que funciona con cualquier link que el organizador pegue.
 */
export function MapEmbed({ mapsUrl, venueName }: MapEmbedProps) {
  if (!mapsUrl) return null;
  return (
    <section className="mx-auto max-w-lg px-6 py-6">
      <div className="flex items-center justify-between rounded-2xl border border-neutral-100 p-5">
        <div>
          <p className="text-sm font-medium text-neutral-900">{venueName}</p>
          <p className="text-xs text-neutral-500">Toca para ver la ubicación</p>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-[var(--theme-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          Cómo llegar
        </a>
      </div>
    </section>
  );
}
