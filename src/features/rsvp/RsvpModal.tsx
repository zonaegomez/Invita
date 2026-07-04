"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import { RsvpForm } from "./RsvpForm";
import { submitRsvp } from "@/services/guestService";
import type { RsvpInput } from "@/utils/validation";

interface RsvpModalProps {
  open: boolean;
  onClose: () => void;
  invitationId: string;
}

export function RsvpModal({ open, onClose, invitationId }: RsvpModalProps) {
  const [confirmed, setConfirmed] = useState<RsvpInput | null>(null);

  async function handleSubmit(data: RsvpInput) {
    await submitRsvp(invitationId, data);
    setConfirmed(data);
  }

  function handleClose() {
    onClose();
    // Se limpia tras la animación de cierre para no mostrar el estado
    // anterior si el invitado vuelve a abrir el modal.
    setTimeout(() => setConfirmed(null), 200);
  }

  return (
    <Modal open={open} onClose={handleClose} title={confirmed ? undefined : "Confirma tu asistencia"}>
      {confirmed ? (
        <div className="py-6 text-center">
          <p className="text-lg font-semibold">
            {confirmed.attending === "yes"
              ? `¡Gracias, ${confirmed.name}! 🎉`
              : `Gracias por avisar, ${confirmed.name}`}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {confirmed.attending === "yes" ? "Te esperamos ese día." : "Lamentamos que no puedas acompañarnos."}
          </p>
        </div>
      ) : (
        <RsvpForm onSubmit={handleSubmit} />
      )}
    </Modal>
  );
}
