"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardDraft } from "@/features/invitation-builder/useWizardDraft";
import { WizardProgress } from "@/features/invitation-builder/WizardProgress";
import { Button, Card, Textarea } from "@/components/ui";
import type { AiDesignResult } from "@/features/ai-design/schema";

interface GenerateResponse {
  design: AiDesignResult;
  heroImageUrl?: string;
}

export default function GenerarConIaPage() {
  const router = useRouter();
  const { draft, updateDraft, hydrated } = useWizardDraft();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  useEffect(() => {
    if (hydrated && !draft.categoryId) router.replace("/crear");
  }, [hydrated, draft.categoryId, router]);

  if (!hydrated || !draft.categoryId) return null;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: draft.categoryId,
          description,
          hostName: draft.hostName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos generar el diseño. Intenta de nuevo.");
        return;
      }
      setResult(data);
    } catch {
      setError("No pudimos conectar con el servicio de IA. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleUse() {
    if (!result || !draft.categoryId) return;
    const { design, heroImageUrl } = result;
    updateDraft({
      templateId: "ai-generado",
      customTheme: {
        id: "ai-generado",
        categoryId: draft.categoryId,
        name: design.title,
        layout: design.layout,
        palette: design.palette,
        fonts: { stack: design.fontStack },
        assets: {},
        sectionVariants: design.sectionVariants,
      },
      theme: design.theme,
      message: design.message,
      images: {
        hero: heroImageUrl ?? draft.images?.hero ?? "",
        cover: heroImageUrl ?? draft.images?.cover ?? draft.images?.hero ?? "",
        gallery: draft.images?.gallery ?? [],
      },
    });
    router.push("/crear/detalles");
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <WizardProgress current="plantilla" />
      <h1 className="text-center text-2xl font-semibold">Genera tu diseño con IA</h1>
      <p className="mt-2 text-center text-neutral-600">
        Describe tu evento y la IA propone título, mensaje, colores e imagen de fondo. Podrás
        revisar y ajustar todo antes de publicar.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <Textarea
          label="Describe tu evento"
          placeholder="Ej. Cumple de Sofía, 5 años, tema unicornios, colores rosa y dorado"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button isLoading={loading} disabled={description.trim().length < 5} onClick={handleGenerate}>
          {result ? "Generar otra vez" : "Generar con IA"}
        </Button>
      </div>

      {result && (
        <>
          <Card className="mt-8 overflow-hidden p-0">
            {result.heroImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.heroImageUrl}
                alt="Vista previa de tu invitación generada con IA"
                className="w-full object-contain"
              />
            )}
            <div className="p-5" style={{ backgroundColor: result.design.palette.background }}>
              <p
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: result.design.palette.primary }}
              >
                {result.design.theme}
              </p>
              <h2 className="mt-1 text-xl font-semibold" style={{ color: result.design.palette.primary }}>
                {result.design.title}
              </h2>
              <p className="mt-2 text-sm text-neutral-700">{result.design.message}</p>
              <div className="mt-4 flex gap-2">
                {Object.values(result.design.palette).map((color) => (
                  <span
                    key={color}
                    className="h-6 w-6 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </Card>

          <div className="mt-6 flex justify-center">
            <Button size="lg" onClick={handleUse}>
              Usar este diseño →
            </Button>
          </div>
        </>
      )}

      <div className="mt-8 flex justify-center">
        <Button variant="ghost" onClick={() => router.push("/crear/plantilla")}>
          ← Elegir una plantilla manualmente
        </Button>
      </div>
    </main>
  );
}
