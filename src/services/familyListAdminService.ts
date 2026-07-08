import "server-only";
import { getAdminDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/collections";
import type { FamilyEntry, FamilyImportRow } from "@/types/family";

/**
 * Server-only: gestiona la lista de invitados esperados (cargada por el
 * organizador desde Excel/CSV) usada para validar y limitar los RSVP de una
 * invitación. Nunca se lee/escribe desde el cliente -- ver firestore.rules
 * (familyList: allow read, write: if false) y
 * app/api/invitations/[id]/family-list/route.ts (único punto de escritura,
 * detrás de verifyEditToken) y app/api/invitations/[id]/rsvp/route.ts (único
 * punto de lectura para hacer el match).
 */

export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyFamily(label: string): string {
  const slug = normalizeName(label).replace(/\s+/g, "-").slice(0, 60);
  return slug || `familia-${Date.now()}`;
}

/** Reemplaza por completo la lista existente con las filas nuevas (una subida = la lista vigente). */
export async function importFamilyList(
  invitationId: string,
  rows: FamilyImportRow[]
): Promise<{ imported: number }> {
  const db = await getAdminDb();
  const col = db
    .collection(COLLECTIONS.invitations)
    .doc(invitationId)
    .collection(COLLECTIONS.familyList);

  const existing = await col.get();
  if (existing.size) {
    const deleteBatch = db.batch();
    existing.docs.forEach((d) => deleteBatch.delete(d.ref));
    await deleteBatch.commit();
  }

  const usedIds = new Set<string>();
  const writeBatch = db.batch();
  let count = 0;

  for (const row of rows) {
    const names = row.names.map((n) => n.trim()).filter(Boolean);
    if (!row.familyLabel.trim() || !names.length || !(row.maxGuests > 0)) continue;

    const base = slugifyFamily(row.familyLabel);
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${base}-${suffix++}`;
    }
    usedIds.add(id);

    writeBatch.set(col.doc(id), {
      familyLabel: row.familyLabel.trim(),
      names,
      normalizedNames: names.map(normalizeName),
      maxGuests: Math.floor(row.maxGuests),
      phone: row.phone?.trim() || null,
      createdAt: new Date(),
    });
    count++;
  }

  await writeBatch.commit();
  return { imported: count };
}

export async function listFamilies(invitationId: string): Promise<FamilyEntry[]> {
  const db = await getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.invitations)
    .doc(invitationId)
    .collection(COLLECTIONS.familyList)
    .orderBy("familyLabel")
    .get();

  // Solo se seleccionan los campos declarados en FamilyEntry -- el documento
  // tambien tiene `createdAt` (un Timestamp de Firestore, una clase, no un
  // objeto plano). Este arreglo se pasa como prop a DashboardView, que es un
  // Client Component: React Server Components exige que las props sean
  // objetos planos serializables, y un Timestamp filtrado rompe el render con
  // "Only plain objects... can be passed to Client Components" (fue la causa
  // real del crash reportado por la organizadora al entrar al dashboard).
  return snap.docs.map((d) => {
    const data = d.data() as Omit<FamilyEntry, "id">;
    return {
      id: d.id,
      familyLabel: data.familyLabel,
      names: data.names,
      normalizedNames: data.normalizedNames,
      maxGuests: data.maxGuests,
      phone: data.phone ?? null,
    };
  });
}

/**
 * Match flexible "por familia": cualquier nombre listado para esa familia
 * hace match con el nombre escrito en el RSVP (comparación normalizada,
 * insensible a acentos/mayúsculas). Si no hay match exacto, intenta un
 * match parcial como red de seguridad ante variaciones menores.
 */
export async function findFamilyByName(invitationId: string, typedName: string): Promise<FamilyEntry | null> {
  const target = normalizeName(typedName);
  if (!target) return null;

  const families = await listFamilies(invitationId);
  if (!families.length) return null;

  const exact = families.find((f) => f.normalizedNames?.includes(target));
  if (exact) return exact;

  const partial = families.find((f) =>
    f.normalizedNames?.some((n) => n.length > 2 && (n.includes(target) || target.includes(n)))
  );
  return partial ?? null;
}

/** Suma personas ya confirmadas (attending = "yes") para una familia, para aplicar el tope. */
export async function countConfirmedForFamily(invitationId: string, familyId: string): Promise<number> {
  const db = await getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.invitations)
    .doc(invitationId)
    .collection(COLLECTIONS.guests)
    .where("familyId", "==", familyId)
    .where("attending", "==", "yes")
    .get();

  return snap.docs.reduce((sum, d) => {
    const data = d.data();
    return sum + (Number(data.adults) || 0) + (Number(data.children) || 0);
  }, 0);
}

/** true si la invitación tiene una lista cargada (activa el modo "solo lista"). */
export async function hasFamilyList(invitationId: string): Promise<boolean> {
  const db = await getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.invitations)
    .doc(invitationId)
    .collection(COLLECTIONS.familyList)
    .limit(1)
    .get();
  return !snap.empty;
}
