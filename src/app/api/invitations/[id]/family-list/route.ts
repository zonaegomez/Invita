import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { verifyEditToken } from "@/services/guestAdminService";
import { importFamilyList, listFamilies, clearFamilyList } from "@/services/familyListAdminService";
import type { FamilyImportRow } from "@/types/family";

/**
 * GET /api/invitations/:id/family-list?editToken=...
 * Devuelve la lista de familias cargada -- solo para el dashboard del organizador.
 *
 * POST /api/invitations/:id/family-list?editToken=...
 * Sube un CSV/XLSX (multipart, campo "file") y reemplaza la lista vigente.
 * Columnas esperadas: Familia | Integrantes (separados por coma) | Máximo de
 * invitados | Teléfono (WhatsApp, opcional). Ver plantilla en /plantillas.
 *
 * DELETE /api/invitations/:id/family-list?editToken=...
 * Vacía la lista sin subir una nueva -- el RSVP vuelve a modo abierto (ver
 * clearFamilyList en familyListAdminService.ts). El feature sigue disponible
 * para volver a activarlo subiendo un archivo en otro momento.
 */

function readCell(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const editToken = request.nextUrl.searchParams.get("editToken");

  if (!editToken || !(await verifyEditToken(id, editToken))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const families = await listFamilies(id);
  return NextResponse.json({ families });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const editToken = request.nextUrl.searchParams.get("editToken");

  if (!editToken || !(await verifyEditToken(id, editToken))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo es demasiado grande (máx. 2MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let rows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
    if (!sheet) throw new Error("empty workbook");
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo. Usa .csv o .xlsx." }, { status: 400 });
  }

  const parsed: FamilyImportRow[] = rows
    .map((row): FamilyImportRow => {
      const familyLabel = readCell(row, ["Familia", "familia"]);
      const namesRaw = readCell(row, ["Integrantes (separados por coma)", "Integrantes", "integrantes"]);
      const maxGuestsRaw = readCell(row, ["Máximo de invitados", "Maximo de invitados", "maxGuests"]);
      const phone = readCell(row, ["Teléfono (WhatsApp, opcional)", "Telefono", "telefono", "Teléfono"]);

      return {
        familyLabel,
        names: namesRaw.split(",").map((n) => n.trim()).filter(Boolean),
        maxGuests: parseInt(maxGuestsRaw, 10) || 0,
        phone: phone || undefined,
      };
    })
    .filter((r) => r.familyLabel && r.names.length > 0 && r.maxGuests > 0);

  if (!parsed.length) {
    return NextResponse.json(
      { error: "El archivo no tiene filas válidas. Revisa que tenga las columnas Familia, Integrantes y Máximo de invitados." },
      { status: 400 }
    );
  }

  const result = await importFamilyList(id, parsed);
  return NextResponse.json({ ok: true, imported: result.imported });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const editToken = request.nextUrl.searchParams.get("editToken");

  if (!editToken || !(await verifyEditToken(id, editToken))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await clearFamilyList(id);
  return NextResponse.json({ ok: true });
}
