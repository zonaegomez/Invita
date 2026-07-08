import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/collections";
import { findFamilyByName, countConfirmedForFamily, hasFamilyList } from "@/services/familyListAdminService";

/**
 * POST /api/invitations/:id/rsvp
 * Punto de escritura server-side para invitaciones con lista de invitados
 * cargada (ver family-list/route.ts). Usa el admin SDK, así que puede leer
 * familyList (bloqueado para el cliente) para: 1) exigir que el nombre haga
 * match con alguien de la lista, 2) aplicar el tope fijo de esa familia.
 *
 * Si la invitación NO tiene lista cargada, se comporta como un RSVP abierto
 * normal (compatibilidad con invitaciones sin este feature activado).
 */

function slugifyName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || `invitado-${Date.now()}`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request", message: "Solicitud inválida." }, { status: 400 });
  }

  // Honeypot anti-bot: si el campo trampa viene lleno, respondemos "éxito" sin escribir nada.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const attending = body.attending;
  const adults = Number(body.adults);
  const children = Number(body.children);
  const comments = typeof body.comments === "string" ? body.comments.trim().slice(0, 500) : "";

  if (!name || name.length > 80) {
    return NextResponse.json({ error: "invalid_name", message: "Escribe tu nombre completo." }, { status: 400 });
  }
  if (attending !== "yes" && attending !== "no") {
    return NextResponse.json({ error: "invalid_attending", message: "Indica si asistirás." }, { status: 400 });
  }
  if (!Number.isFinite(adults) || adults < 0 || adults > 20 || !Number.isFinite(children) || children < 0 || children > 20) {
    return NextResponse.json({ error: "invalid_count", message: "Cantidad de invitados inválida." }, { status: 400 });
  }

  const listActive = await hasFamilyList(id);
  let familyId: string | undefined;
  let familyLabel: string | undefined;

  if (listActive) {
    const family = await findFamilyByName(id, name);
    if (!family) {
      return NextResponse.json(
        {
          error: "not_on_list",
          message: "No encontramos tu nombre en la lista de invitados. Por favor contacta a los anfitriones.",
        },
        { status: 403 }
      );
    }

    if (attending === "yes") {
      const requested = adults + children;
      if (requested > family.maxGuests) {
        return NextResponse.json(
          {
            error: "over_capacity",
            message: `Tu familia tiene un máximo de ${family.maxGuests} invitado(s) en total.`,
            maxGuests: family.maxGuests,
          },
          { status: 409 }
        );
      }

      const alreadyConfirmed = await countConfirmedForFamily(id, family.id);
      if (alreadyConfirmed + requested > family.maxGuests) {
        const remaining = Math.max(family.maxGuests - alreadyConfirmed, 0);
        return NextResponse.json(
          {
            error: "over_capacity",
            message:
              remaining > 0
                ? `Tu familia ya tiene ${alreadyConfirmed} confirmado(s) de ${family.maxGuests}. Quedan ${remaining} lugar(es) disponibles.`
                : `Tu familia ya completó su cupo de ${family.maxGuests} invitado(s).`,
            maxGuests: family.maxGuests,
            alreadyConfirmed,
          },
          { status: 409 }
        );
      }
    }

    familyId = family.id;
    familyLabel = family.familyLabel;
  }

  const db = await getAdminDb();
  const slug = slugifyName(name);
  const ref = db
    .collection(COLLECTIONS.invitations)
    .doc(id)
    .collection(COLLECTIONS.guests)
    .doc(slug);

  const existing = await ref.get();
  if (existing.exists) {
    return NextResponse.json(
      {
        error: "duplicate",
        message: "Ya registramos una confirmación con ese nombre. Si necesitas corregirla, contacta a los anfitriones.",
      },
      { status: 409 }
    );
  }

  await ref.set({
    invitationId: id,
    name,
    attending,
    adults,
    children,
    comments,
    ...(familyId ? { familyId, familyLabel } : {}),
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
