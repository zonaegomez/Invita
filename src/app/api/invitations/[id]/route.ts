import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getInvitationById } from "@/services/invitationService";
import { verifyEditToken } from "@/services/guestAdminService";
import { updateInvitationAdmin } from "@/services/invitationAdminService";
import { infantilDetallesSchema, bodaDetallesSchema } from "@/features/invitation-builder/schema";
import type { CategoryFields } from "@/types/invitation";

/**
 * PATCH /api/invitations/:id
 * Body: { editToken, ...camposEditables, images, music? }
 *
 * Reutiliza los MISMOS esquemas de zod que el wizard (Fase 2) para validar
 * los campos comunes/por-categoria -- evita mantener dos definiciones de
 * "que es un dato valido" para crear vs. editar.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { editToken, images, music, ...detalles } = body ?? {};

  if (!editToken || typeof editToken !== "string" || !(await verifyEditToken(id, editToken))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const current = await getInvitationById(id);
  if (!current) {
    return NextResponse.json({ error: "Invitacion no encontrada" }, { status: 404 });
  }

  interface CommonFields {
    date: string;
    time: string;
    venueName: string;
    venueAddress: string;
    mapsUrl: string;
    message: string;
    contactPhone: string;
  }

  let hostName: string;
  let age: number | undefined;
  let theme: string | undefined;
  let categoryFields: CategoryFields | undefined;
  let common: CommonFields;

  if (current.categoryId === "boda") {
    const parsed = bodaDetallesSchema.safeParse(detalles);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
    }
    hostName = `${parsed.data.brideName} & ${parsed.data.groomName}`;
    categoryFields = {
      categoryId: "boda",
      brideAndGroom: [parsed.data.brideName, parsed.data.groomName],
      dressCode: parsed.data.dressCode,
      giftRegistryUrl: parsed.data.giftRegistryUrl || undefined,
    };
    common = parsed.data;
  } else {
    const parsed = infantilDetallesSchema.safeParse({
      ...detalles,
      age: detalles.age === "" || detalles.age === undefined ? undefined : Number(detalles.age),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
    }
    hostName = parsed.data.hostName;
    age = parsed.data.age;
    theme = parsed.data.theme;
    categoryFields = { categoryId: "infantil", theme: theme ?? "", age: age ?? 0 };
    common = parsed.data;
  }

  const { date, time, venueName, venueAddress, mapsUrl, message, contactPhone } = common;

  if (!images?.hero || typeof images.hero !== "string") {
    return NextResponse.json({ error: "Falta la imagen principal" }, { status: 400 });
  }

  await updateInvitationAdmin(id, {
    hostName,
    age,
    theme,
    date: Timestamp.fromDate(new Date(`${date}T${time}`)),
    time,
    venueName,
    venueAddress,
    mapsUrl,
    message,
    contactPhone,
    images: {
      hero: images.hero,
      cover: images.cover || images.hero,
      gallery: Array.isArray(images.gallery) ? images.gallery : [],
    },
    music: music?.url ? { url: music.url, title: music.title } : undefined,
    categoryFields,
  });

  return NextResponse.json({ ok: true });
}
