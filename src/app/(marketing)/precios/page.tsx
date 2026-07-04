"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui";

/**
 * Placeholder de precios: comunica el modelo (freemium por evento, no
 * suscripción) descrito en la sección 12 de arquitectura-invitaciones-saas.md.
 * No hay billing real todavía — el botón "Premium" no cobra nada, solo
 * comunica intención. Conectar Stripe queda en el roadmap (Fase 7).
 */
export default function PreciosPage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-center text-2xl font-semibold">Precios simples, por evento</h1>
      <p className="mt-2 text-center text-neutral-600">
        Sin suscripción mensual — pagas cuando publicas, no por mes que no usas.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div>
            <p className="font-medium">Gratis</p>
            <p className="mt-1 text-3xl font-semibold">$0</p>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-neutral-600">
            <li>Hasta 30 confirmaciones</li>
            <li>Plantillas base</li>
            <li>RSVP y dashboard incluidos</li>
            <li>Con marca de agua discreta</li>
          </ul>
          <Button variant="secondary" onClick={() => router.push("/crear")} className="mt-auto">
            Empezar gratis
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 border-neutral-900">
          <div className="flex items-center justify-between">
            <p className="font-medium">Premium</p>
            <Badge variant="neutral">Próximamente</Badge>
          </div>
          <p className="text-3xl font-semibold">
            $299 <span className="text-sm font-normal text-neutral-500">MXN / evento</span>
          </p>
          <ul className="flex flex-col gap-2 text-sm text-neutral-600">
            <li>Invitados ilimitados</li>
            <li>Sin marca de agua</li>
            <li>Plantillas premium</li>
            <li>Exportar a Excel</li>
          </ul>
          <Button variant="ghost" disabled className="mt-auto">
            Disponible pronto
          </Button>
        </Card>
      </div>
    </main>
  );
}
