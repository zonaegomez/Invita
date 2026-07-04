"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function Header() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-neutral-900">
          Invitaciones
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-600">
          <Link href="/plantillas" className="hidden hover:text-neutral-900 sm:inline">
            Plantillas
          </Link>
          <Link href="/precios" className="hidden hover:text-neutral-900 sm:inline">
            Precios
          </Link>
          <Button size="sm" onClick={() => router.push("/crear")}>
            Crear invitación
          </Button>
        </nav>
      </div>
    </header>
  );
}
