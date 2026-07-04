"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTemplatesByCategory } from "@/lib/templates/registry";
import { useWizardDraft } from "@/features/invitation-builder/useWizardDraft";
import { WizardProgress } from "@/features/invitation-builder/WizardProgress";
import { Card, Button } from "@/components/ui";

export default function PlantillaStepPage() {
  const router = useRouter();
  const { draft, updateDraft, hydrated } = useWizardDraft();

  useEffect(() => {
    if (hydrated && !draft.categoryId) router.replace("/crear");
  }, [hydrated, draft.categoryId, router]);

  if (!hydrated || !draft.categoryId) return null;

  const templates = getTemplatesByCategory(draft.categoryId);

  function handleSelect(templateId: string) {
    updateDraft({ templateId });
    router.push("/crear/detalles");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <WizardProgress current="plantilla" />
      <h1 className="text-center text-2xl font-semibold">Elige una plantilla</h1>
      <p className="mt-2 text-center text-neutral-600">Podrás verla completa antes de publicar.</p>

      <Card
        onClick={() => router.push("/crear/plantilla/ia")}
        className="mt-6 cursor-pointer border-neutral-900/10 bg-gradient-to-r from-violet-50 to-pink-50 transition-shadow hover:shadow-md"
      >
        <p className="font-medium">✨ Generar con IA</p>
        <p className="mt-1 text-xs text-neutral-600">
          Describe tu evento y deja que la IA proponga título, mensaje, colores e imagen de fondo.
        </p>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {templates.map((theme) => (
          <Card
            key={theme.id}
            onClick={() => handleSelect(theme.id)}
            className="cursor-pointer overflow-hidden p-0 transition-shadow hover:shadow-md"
          >
            <div
              className="flex h-32 items-center justify-center"
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

      <div className="mt-8 flex justify-center">
        <Button variant="ghost" onClick={() => router.push("/crear")}>
          ← Atrás
        </Button>
      </div>
    </main>
  );
}
