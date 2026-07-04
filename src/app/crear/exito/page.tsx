"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { CopyLinkButton } from "@/features/sharing/CopyLinkButton";
import { WhatsAppShareButton } from "@/features/sharing/WhatsAppShareButton";
import { QrCode } from "@/features/sharing/QrCode";

interface PublishedResult {
  id: string;
  slug: string;
  editToken: string;
}

export default function ExitoStepPage() {
  const router = useRouter();
  const [result, setResult] = useState<PublishedResult | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    const raw = localStorage.getItem("ultima-invitacion-publicada");
    if (!raw) {
      router.replace("/crear");
      return;
    }
    setResult(JSON.parse(raw));
    localStorage.removeItem("ultima-invitacion-publicada");
  }, [router]);

  if (!result || !origin) return null;

  const publicLink = `${origin}/i/${result.slug}`;
  const dashboardLink = `${origin}/dashboard/${result.id}?editToken=${result.editToken}`;

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <p className="text-3xl">🎉</p>
      <h1 className="mt-4 text-2xl font-semibold">¡Tu invitación está lista!</h1>
      <p className="mt-2 text-neutral-600">Compártela por WhatsApp o copia el enlace.</p>

      <Card className="mt-8 flex flex-col items-center gap-4">
        <QrCode data={publicLink} />
        <p className="break-all text-sm text-neutral-500">{publicLink}</p>
        <div className="flex w-full gap-2">
          <WhatsAppShareButton message={`¡Estás invitado! ${publicLink}`} />
          <CopyLinkButton link={publicLink} />
        </div>
      </Card>

      <Card className="mt-4 border-amber-200 bg-amber-50 text-left">
        <p className="text-sm font-medium text-amber-900">Guarda este enlace de administración</p>
        <p className="mt-1 text-xs text-amber-800">
          Es la única forma de ver tus confirmaciones. No se puede recuperar si lo pierdes.
        </p>
        <a href={dashboardLink} className="mt-3 block break-all text-xs font-medium text-amber-900 underline">
          {dashboardLink}
        </a>
      </Card>

      <Button className="mt-6 w-full" onClick={() => window.location.assign(dashboardLink)}>
        Ir a mi dashboard
      </Button>
    </main>
  );
}
