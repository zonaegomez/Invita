"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "@/components/ui";
import { rsvpSchema, type RsvpInput } from "@/utils/validation";

interface RsvpFormProps {
  onSubmit: (data: RsvpInput) => Promise<void>;
}

export function RsvpForm({ onSubmit }: RsvpFormProps) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const result = rsvpSchema.safeParse({
      name,
      attending,
      adults,
      children,
      comments: comments || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch {
      setError("No pudimos guardar tu confirmación. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">¿Asistirás?</span>
        <div className="flex gap-2">
          {(["yes", "no"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAttending(value)}
              className={`h-11 flex-1 rounded-xl text-sm font-medium transition-colors ${
                attending === value ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {value === "yes" ? "Sí, ahí estaré" : "No podré ir"}
            </button>
          ))}
        </div>
      </div>

      {attending === "yes" && (
        <div className="grid grid-cols-2 gap-4">
          <Counter label="Adultos" value={adults} onChange={setAdults} />
          <Counter label="Niños" value={children} onChange={setChildren} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="comments" className="text-sm font-medium text-neutral-700">
          Comentarios (opcional)
        </label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          placeholder="Alergias, restricciones, mensaje para el organizador..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" isLoading={submitting} className="mt-2">
        Confirmar
      </Button>
    </form>
  );
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-7 w-7 rounded-lg bg-neutral-100 text-neutral-700"
        >
          −
        </button>
        <span className="text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="h-7 w-7 rounded-lg bg-neutral-100 text-neutral-700"
        >
          +
        </button>
      </div>
    </div>
  );
}
