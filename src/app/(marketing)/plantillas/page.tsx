"use client";

import { useRouter } from "next/navigation";
import { EVENT_CATEGORIES } from "@/lib/templates/categories";
import { getTemplatesByCategory } from "@/lib/templates/registry";
import { useWizardDraft } from "@/features/invitation-builder/useWizardDraft";
import { Card, Button } from "@/components/ui";
import type { ThemeConfig } from "@/types/template";

/**
 * Catálogo público de plantillas. Elegir una precarga el draft del wizard
 * (categoría + plantilla) y salta directo al paso de detalles — evita
 * hacer repetir al usuario los pasos 1-2 si ya sabe lo que quiere.
 */
export default function PlantillasPage() {
  const router = useRouter();
  const { updateDraft, hydrated } = useWizardDraft();

  const categoriesWithTemplates = EVENT_CATEGORIES.map((category) => ({
    category,
    templates: getTemplatesByCategory(category.id),
  })).filter((group) => group.templates.length > 0);

  function handleSelect(theme: ThemeConfig) {
    updateDraft({ categoryId: theme.categoryId, templateId: theme.id });
    router.push("/crear/detalles");
  }

  if (!hydrated) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-center text-2xl font-semibold">Plantillas</h1>
      <p className="mt-2 text-center text-neutral-600">
        Elige una para empezar directo desde ahí, o vuelve más tarde a comparar.
      </p>

      {categoriesWithTemplates.map(({ category, templates }) => (
        <section key={category.id} className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">
            {category.label}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {templates.map((theme) => (
              <Card
                key={theme.id}
                onClick={() => handleSelect(theme)}
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
        </section>
      ))}

      <div className="mt-10 flex justify-center">
        <Button variant="ghost" onClick={() => router.push("/crear")}>
          O empieza eligiendo la categoría →
        </Button>
      </div>
    </main>
  );
}
