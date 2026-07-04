import { Button } from "@/components/ui";

interface RsvpCtaProps {
  onClick: () => void;
}

export function RsvpCta({ onClick }: RsvpCtaProps) {
  return (
    <div className="sticky bottom-4 z-10 mx-auto flex max-w-lg justify-center px-6 py-4">
      <Button size="lg" className="w-full shadow-lg" onClick={onClick}>
        ✔ Confirmar asistencia
      </Button>
    </div>
  );
}
