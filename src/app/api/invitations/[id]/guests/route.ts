import { NextRequest, NextResponse } from "next/server";
import { listGuests, verifyEditToken } from "@/services/guestAdminService";
import { computeGuestStats } from "@/services/guestService";

/**
 * GET /api/invitations/:id/guests?editToken=...
 * Único punto de lectura de invitados para el dashboard del organizador.
 * Valida editToken con el admin SDK (server-only) antes de devolver datos —
 * ver firestore.rules, que bloquea la lectura directa de esta subcolección.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const editToken = request.nextUrl.searchParams.get("editToken");

  if (!editToken || !(await verifyEditToken(id, editToken))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const guests = await listGuests(id);
  return NextResponse.json({ guests, stats: computeGuestStats(guests) });
}
