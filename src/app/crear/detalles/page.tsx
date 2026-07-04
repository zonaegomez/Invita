"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardDraft } from "@/features/invitation-builder/useWizardDraft";
import { WizardProgress } from "@/features/invitation-builder/WizardProgress";
import { infantilDetallesSchema, bodaDetallesSchema } from "@/features/invitation-builder/schema";
import { Button, Input } from "@/components/ui";

interface FormState {
  // infantil
  hostName: string;
  age: string;
  theme: string;
  // boda
  brideName: string;
  groomName: string;
  dressCode: string;
  giftRegistryUrl: string;
  // comunes
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  message: string;
  contactPhone: string;
}

const EMPTY_FORM: FormState = {
  hostName: "",
  age: "",
  theme: "",
  brideName: "",
  groomName: "",
  dressCode: "",
  giftRegistryUrl: "",
  date: "",
  time: "",
  venueName: "",
  venueAddress: "",
  mapsUrl: "",
  message: "",
  contactPhone: "",
};

export default function DetallesStepPage() {
  const router = useRouter();
  const { draft, updateDraft, hydrated } = useWizardDraft();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!draft.templateId) {
      router.replace("/crear/plantilla");
      return;
    }
    setForm({
      hostName: draft.hostName ?? "",
      age: draft.age?.toString() ?? "",
      theme: draft.theme ?? "",
      brideName: draft.brideAndGroom?.[0] ?? "",
      groomName: draft.brideAndGroom?.[1] ?? "",
      dressCode: draft.dressCode ?? "",
      giftRegistryUrl: draft.giftRegistryUrl ?? "",
      date: draft.date ?? "",
      time: draft.time ?? "",
      venueName: draft.venueName ?? "",
      venueAddress: draft.venueAddress ?? "",
      mapsUrl: draft.mapsUrl ?? "",
      message: draft.message ?? "",
      contactPhone: draft.contactPhone ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, draft.templateId]);

  if (!hydrated || !draft.templateId || !draft.categoryId) return null;

  const isBoda = draft.categoryId === "boda";

  function handleChange(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (isBoda) {
      const parsed = bodaDetallesSchema.safeParse(form);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
        return;
      }
      updateDraft({
        hostName: `${parsed.data.brideName} & ${parsed.data.groomName}`,
        brideAndGroom: [parsed.data.brideName, parsed.data.groomName],
        dressCode: parsed.data.dressCode,
        giftRegistryUrl: parsed.data.giftRegistryUrl,
        age: undefined,
        theme: undefined,
        date: parsed.data.date,
        time: parsed.data.time,
        venueName: parsed.data.venueName,
        venueAddress: parsed.data.venueAddress,
        mapsUrl: parsed.data.mapsUrl,
        message: parsed.data.message,
        contactPhone: parsed.data.contactPhone,
      });
    } else {
      const parsed = infantilDetallesSchema.safeParse({
        ...form,
        age: form.age ? Number(form.age) : undefined,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
        return;
      }
      updateDraft({ ...parsed.data, brideAndGroom: undefined, dressCode: undefined, giftRegistryUrl: undefined });
    }

    router.push("/crear/multimedia");
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <WizardProgress current="detalles" />
      <h1 className="text-center text-2xl font-semibold">Cuéntanos del evento</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {isBoda ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre de la novia" value={form.brideName} onChange={handleChange("brideName")} />
              <Input label="Nombre del novio" value={form.groomName} onChange={handleChange("groomName")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Código de vestimenta (opcional)"
                value={form.dressCode}
                onChange={handleChange("dressCode")}
                placeholder="Formal, etiqueta rigurosa..."
              />
              <Input
                label="Link de mesa de regalos (opcional)"
                value={form.giftRegistryUrl}
                onChange={handleChange("giftRegistryUrl")}
                placeholder="https://..."
              />
            </div>
          </>
        ) : (
          <>
            <Input label="Nombre del festejado" value={form.hostName} onChange={handleChange("hostName")} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Edad (opcional)" type="number" value={form.age} onChange={handleChange("age")} />
              <Input
                label="Tema (opcional)"
                value={form.theme}
                onChange={handleChange("theme")}
                placeholder="Safari Aventura"
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Fecha" type="date" value={form.date} onChange={handleChange("date")} />
          <Input label="Hora" type="time" value={form.time} onChange={handleChange("time")} />
        </div>
        <Input label="Lugar" value={form.venueName} onChange={handleChange("venueName")} placeholder="Salón Los Pinos" />
        <Input label="Dirección" value={form.venueAddress} onChange={handleChange("venueAddress")} />
        <Input
          label="Link de Google Maps"
          value={form.mapsUrl}
          onChange={handleChange("mapsUrl")}
          placeholder="https://maps.google.com/..."
        />
        <Input
          label="Teléfono de contacto"
          value={form.contactPhone}
          onChange={handleChange("contactPhone")}
          placeholder="55 1234 5678"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="message" className="text-sm font-medium text-neutral-700">
            Mensaje personalizado
          </label>
          <textarea
            id="message"
            value={form.message}
            onChange={handleChange("message")}
            rows={3}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            placeholder="Nos encantaría contar con tu presencia..."
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mt-2 flex justify-between">
          <Button type="button" variant="ghost" onClick={() => router.push("/crear/plantilla")}>
            ← Atrás
          </Button>
          <Button type="submit">Continuar →</Button>
        </div>
      </form>
    </main>
  );
}
