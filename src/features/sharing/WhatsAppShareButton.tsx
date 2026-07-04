"use client";

import { Button } from "@/components/ui";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export function WhatsAppShareButton({ message }: { message: string }) {
  return (
    <Button onClick={() => window.open(buildWhatsAppLink(message), "_blank")} className="flex-1">
      Compartir por WhatsApp
    </Button>
  );
}
