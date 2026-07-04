"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="secondary" onClick={handleCopy} className="flex-1">
      {copied ? "¡Copiado!" : "Copiar enlace"}
    </Button>
  );
}
