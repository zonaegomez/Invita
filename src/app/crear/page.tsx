"use client";

import { useRouter } from "next/navigation";
import { EVENT_CATEGORIES } from "@/lib/templates/categories";
import { getTemplatesByCategory } from "@/lib/templates/registry";
import { useWizardDraft } from "@/features/invitation-builder/useWizardDraft";
import { WizardProgress } from "@/features/invitation-builder/WizardProgress";
import { Card, Badge } from "@/components/ui";
import type { EventCategoryId } from "@/types/eventCategory";

export default function CategoriaStepPage() {
  const router = useRouter();
  const { updateDraft, hydrated } = useWizardDraft();

  if (!hydrated) return null;

  function handleSelect(categoryId: EventCategoryId) {
    updateDraft({ categoryId, templateId: undefined });
    router.push("/crear/plantilla");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <WizardProgress current="categoria" />
      <h1 className="text-center text-2xl font-semibold">¿Qué vas a celebrar?</h1>
      <p className="mt-2 text-center text-neutral-600">Elige el tipo de evento para empezar.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {EVENT_CATEGORIES.map((category) => {
          const available = getTemplatesByCategory(category.id).length > 0;
          return (
            <Card
              key={category.id}
              onClick={() => available && handleSelect(category.id)}
              className={`flex flex-col items-start gap-1 transition-shadow ${
                available ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed opacity-50"
              }`}
            >
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
    </main>
  );
}
