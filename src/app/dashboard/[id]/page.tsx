import { notFound } from "next/navigation";
import { getInvitationById } from "@/services/invitationService";
import { verifyEditToken, listGuests } from "@/services/guestAdminService";
import { listFamilies } from "@/services/familyListAdminService";
import { listPhotos } from "@/services/photoAdminService";
import { computeGuestStats } from "@/services/guestService";
import { formatEventDate, toDate } from "@/utils/date";
import { DashboardView, type SerializedGuest } from "@/features/dashboard/DashboardView";

const SITE_URL = "https://invita-theta.vercel.app";
// Excepcion: esta invitacion usa una landing estatica a medida en vez del
// renderer generico /i/[slug] -- ver public/cumple-marbet-anahi/index.html.
const CUSTOM_PUBLIC_URLS: Record<string, string> = {
  "marbet-anahi-8-2026": `${SITE_URL}/cumple-marbet-anahi/index.html`,
};

/**
 * Server Component: valida editToken con el admin SDK (bypassa
 * firestore.rules) antes de leer nada. No hay sesion de usuario en el MVP --
 * la posesion del link con editToken ES la autorizacion. Ver riesgo tecnico
 * "Ausencia de autenticacion en el MVP" en arquitectura-invitaciones-saas.md.
 */
export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editToken?: string }>;
}) {
  const { id } = await params;
  const { editToken } = await searchParams;

  if (!editToken || !(await verifyEditToken(id, editToken))) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">No autorizado</h1>
        <p className="mt-2 text-neutral-600">
          El enlace de administración no es válido. Revisa el enlace que guardaste al crear tu invitación.
        </p>
      </main>
    );
  }

  const invitation = await getInvitationById(id);
  if (!invitation) notFound();

  const guests = await listGuests(id);
  const stats = computeGuestStats(guests);
  const families = await listFamilies(id);
  const photos = await listPhotos(id);

  const serializedGuests: SerializedGuest[] = guests.map((g) => ({
    id: g.id,
    name: g.name,
    attending: g.attending,
    adults: g.adults,
    children: g.children,
    comments: g.comments,
    createdAtLabel: formatEventDate(toDate(g.createdAt)),
    familyId: g.familyId,
  }));

  const publicUrl = CUSTOM_PUBLIC_URLS[id] ?? `${SITE_URL}/i/${invitation.slug}`;

  return (
    <DashboardView
      hostName={invitation.hostName}
      dateLabel={formatEventDate(invitation.date)}
      slug={invitation.slug}
      guests={serializedGuests}
      stats={stats}
      editarHref={`/dashboard/${id}/editar?editToken=${editToken}`}
      invitationId={id}
      editToken={editToken}
      initialFamilies={families}
      publicUrl={publicUrl}
      initialPhotos={photos}
    />
  );
}
