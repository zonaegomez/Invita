import { NextRequest, NextResponse } from "next/server";
import { listPhotos, addPhoto } from "@/services/photoAdminService";

/**
 * GET  /api/invitations/:id/photos  -- pública, sin editToken: es la galería
 *   que ven los invitados en la página estática el día del evento.
 * POST /api/invitations/:id/photos  -- pública, sin editToken: registra una
 *   foto que el navegador YA subió directo a Firebase Storage (ver
 *   public/cumple-marbet-anahi/index.html). Body: { url, uploaderName?, website? }
 *   `website` es honeypot -- si viene lleno, se responde ok sin escribir nada.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photos = await listPhotos(id);
  return NextResponse.json({ photos });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body.url !== "string") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true, id: "skipped" });
  }

  const result = await addPhoto(id, {
    url: body.url,
    uploaderName: typeof body.uploaderName === "string" ? body.uploaderName : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
