"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui";
import { EVENT_CATEGORIES } from "@/lib/templates/categories";
import { TEMPLATE_REGISTRY, getTemplatesByCategory } from "@/lib/templates/registry";

const STEPS = [
  {
    n: "1",
    title: "Crea tu invitación",
    body: "Elige una plantilla, captura los datos del evento y sube tus fotos. Todo en un wizard de 5 pasos.",
  },
  {
    n: "2",
    title: "Comparte por WhatsApp",
    body: "Un enlace único y un código QR listos para enviar — sin apps que tus invitados tengan que instalar.",
  },
  {
    n: "3",
    title: "Sigue las confirmaciones",
    body: "Cada RSVP llega a tu dashboard en tiempo real: quién va, cuántos adultos y niños, comentarios.",
  },
] as const;

const FEATURES = [
  { title: "RSVP en tiempo real", body: "Los invitados confirman desde su teléfono; tú ves los números al instante." },
  { title: "Dashboard de invitados", body: "Busca, filtra y exporta tu lista completa cuando la necesites." },
  { title: "Enlace + QR", body: "Comparte por WhatsApp, copia el link o imprime el QR — lo que te sea más cómodo." },
  { title: "Diseño para cada evento", body: "Fiestas infantiles, bodas, XV años y más — cada categoría con su propia identidad visual." },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const templates = Object.values(TEMPLATE_REGISTRY);

  return (
    <main>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-neutral-500">
            Invitaciones digitales premium
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Crea una invitación inolvidable en minutos
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
            Fiestas infantiles, bodas, XV años y más. Comparte por WhatsApp y
            lleva el control de tus invitados en un solo lugar.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" onClick={() => router.push("/crear")}>
              Crear mi invitación
            </Button>
            <Button size="lg" variant="secondary" onClick={() => router.push("/plantillas")}>
              Ver plantillas
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50/60 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-sm font-medium uppercase tracking-widest text-neutral-500">
            Cómo funciona
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <Card key={step.n}>
                <p className="text-2xl font-semibold text-neutral-300">{step.n}</p>
                <p className="mt-2 font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-neutral-600">{step.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-sm font-medium uppercase tracking-widest text-neutral-500">
            Para cada tipo de evento
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {EVENT_CATEGORIES.map((category) => {
              const available = getTemplatesByCategory(category.id).length > 0;
              return (
                <Card key={category.id} className="flex flex-col items-start gap-1">
                  <p className="font-medium">{category.label}</p>
                  <p className="text-xs text-neutral-500">{category.description}</p>
                  {!available && (
                    <Badge variant="neutral" className="mt-2">
                      Próximamente
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50/60 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-sm font-medium uppercase tracking-widest text-neutral-500">
            Plantillas destacadas
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {templates.map((theme) => (
              <Card
                key={theme.id}
                onClick={() => router.push("/plantillas")}
                className="cursor-pointer overflow-hidden p-0 transition-shadow hover:shadow-md"
              >
                <div
                  className="flex h-28 items-center justify-center"
                  style={{ backgroundColor: theme.palette.background }}
                >
                  <span className="text-sm font-medium" style={{ color: theme.palette.primary }}>
                    {theme.name}
                  </span>
                </div>
                <p className="px-4 py-3 text-sm font-medium">{theme.name}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" onClick={() => router.push("/plantillas")}>
              Ver todas las plantillas →
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-sm font-medium uppercase tracking-widest text-neutral-500">
            Todo lo que necesitas
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <p className="font-medium">{feature.title}</p>
                <p className="mt-1 text-sm text-neutral-600">{feature.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-100 py-16">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="text-2xl font-semibold">Empieza gratis, publica en minutos</h2>
          <p className="mt-2 text-neutral-600">Sin tarjeta de crédito. Publica tu primera invitación ahora mismo.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="lg" onClick={() => router.push("/crear")}>
              Crear mi invitación
            </Button>
            <Button size="lg" variant="ghost" onClick={() => router.push("/precios")}>
              Ver precios
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
