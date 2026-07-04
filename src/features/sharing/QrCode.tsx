"use client";

import { useEffect, useState } from "react";
import { generateQrDataUrl } from "@/lib/qr";
import { Skeleton } from "@/components/ui";

export function QrCode({ data }: { data: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    generateQrDataUrl(data).then((url) => {
      if (active) setDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [data]);

  if (!dataUrl) return <Skeleton className="h-40 w-40" />;

  // Data URL generado localmente (no una imagen remota) — next/image no aplica aquí.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="Código QR de la invitación" className="h-40 w-40 rounded-xl" />;
}
