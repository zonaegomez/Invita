import { NextRequest, NextResponse } from "next/server";
import { listWishes, addWish } from "@/services/wishAdminService";

/**
 * GET  /api/invitations/:id/wishes  -- pública, sin editToken: el muro de
 *   felicitaciones que ve cualquiera con el link, desde el momento en que
 *   lo reciben (no espera al día del evento, a diferencia de /photos).
 * POST /api/invitations/:id/wishes  -- pública, sin editToken: agrega un
 *   mensaje. Body: { name?, message, website? }. `website` es honeypot --
 *   si viene lleno, se responde ok sin escribir nada.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wishes = await listWishes(id);
  return NextResponse.json({ wishes });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body.message !== "string") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true, id: "skipped" });
  }

  const result = await addWish(id, {
    name: typeof body.name === "string" ? body.name : undefined,
    message: body.message,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
