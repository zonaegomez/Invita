const STEPS = [
  { key: "categoria", label: "Categoría" },
  { key: "plantilla", label: "Plantilla" },
  { key: "detalles", label: "Detalles" },
  { key: "multimedia", label: "Multimedia" },
  { key: "preview", label: "Preview" },
] as const;

export type WizardStepKey = (typeof STEPS)[number]["key"];

export function WizardProgress({ current }: { current: WizardStepKey }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="mx-auto mb-10 flex max-w-md items-center justify-center gap-2">
      {STEPS.map((step, i) => (
        <div
          key={step.key}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i <= currentIndex ? "bg-neutral-900" : "bg-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}
