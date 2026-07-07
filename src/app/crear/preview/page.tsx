"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useWizardDraft } from "@/features/invitation-builder/useWizardDraft";
import { WizardProgress } from "@/features/invitation-builder/WizardProgress";
import { TemplateRenderer } from "@/features/template-engine/TemplateRenderer";
import { getTemplate } from "@/lib/templates/registry";
import { createAndPublishInvitation } from "@/services/invitationService";
import { Button } from "@/components/ui";
import type { InvitationViewModel } from "@/types/invitationView";
import type { CategoryFields, CreateInvitationInput } from "@/types/invitation";

export default function PreviewStepPage() {
  const router = useRouter();
  const { draft, clearDraft, hydrated } = useWizardDraft();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !draft.images?.hero) router.replace("/crear/multimedia");
  }, [hydrated, draft.images?.hero, router]);

  // customTheme tiene prioridad: es el ThemeConfig que arma features/ai-design
  // cuando el usuario genero el diseno con IA (ver app/crear/plantilla/ia).
  const theme = draft.customTheme ?? (draft.templateId ? getTemplate(draft.templateId) : undefined);

  const viewModel: InvitationViewModel | null = useMemo(() => {
    if (!draft.date || !draft.time || !draft.hostName) return null;
    return {
      hostName: draft.hostName,
      age: draft.age,
      theme: draft.theme,
      date: new Date(`${draft.date}T${draft.time}`),
      time: draft.time,
      venueName: draft.venueName ?? "",
      venueAddress: draft.venueAddress ?? "",
      mapsUrl: draft.mapsUrl ?? "",
      message: draft.message ?? "",
      contactPhone: draft.contactPhone ?? "",
      images: {
        hero: draft.images?.hero ?? "",
        cover: draft.images?.cover ?? draft.images?.hero ?? "",
        gallery: draft.images?.gallery ?? [],
      },
      music: draft.music?.url ? { url: draft.music.url, title: draft.music.title } : undefined,
    };
  }, [draft]);

  if (!hydrated || !theme || !viewModel) return null;

  function buildCategoryFields(): CategoryFields | undefined {
    if (draft.categoryId === "infantil") {
      return { categoryId: "infantil", theme: draft.theme ?? "", age: draft.age ?? 0 };
    }
    if (draft.categoryId === "boda" && draft.brideAndGroom) {
      return {
        categoryId: "boda",
        brideAndGroom: draft.brideAndGroom,
        dressCode: draft.dressCode,
        giftRegistryUrl: draft.giftRegistryUrl || undefined,
      };
    }
    return undefined;
  }

  async function handlePublish() {
    if (!theme || !viewModel || !draft.categoryId) return;
    setPublishing(true);
    setError(null);
    try {
      const input: CreateInvitationInput = {
        categoryId: draft.categoryId,
        templateId: theme.id,
        customTheme: draft.customTheme,
        hostName: viewModel.hostName,
        age: viewModel.age,
        theme: viewModel.theme,
        date: Timestamp.fromDate(viewModel.date),
        time: viewModel.time,
        venueName: viewModel.venueName,
        venueAddress: viewModel.venueAddress,
        mapsUrl: viewModel.mapsUrl,
        message: viewModel.message,
        contactPhone: viewModel.contactPhone,
        images: viewModel.images,
        music: viewModel.music,
        categoryFields: buildCategoryFields(),
      };

      const result = await createAndPublishInvitation(draft.id, input);
      localStorage.setItem("ultima-invitacion-publicada", JSON.stringify(result));
      clearDraft();
      router.push("/crear/exito");
    } catch (err) {
      console.error("Fallo al publicar la invitacion:", err);
      setError("No pudimos publicar tu invitación. Intenta de nuevo.");
      setPublishing(false);
    }
  }

  return (
    <main className="pb-24">
      <div className="px-6 pt-12">
        <WizardProgress current="preview" />
        <h1 className="text-center text-2xl font-semibold">Así se verá tu invitación</h1>
        <p className="mt-2 text-center text-neutral-600">
          Revisa todo antes de publicar — después no se puede editar el diseño.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-neutral-100 shadow-sm sm:mx-auto sm:max-w-md">
        <TemplateRenderer invitation={viewModel} theme={theme} onRsvpClick={() => {}} />
      </div>

      <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 px-6">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button size="lg" className="w-full" isLoading={publishing} onClick={handlePublish}>
          Publicar invitación
        </Button>
        <Button variant="ghost" onClick={() => router.push("/crear/multimedia")}>
          ← Atrás
        </Button>
      </div>
    </main>
  );
}
