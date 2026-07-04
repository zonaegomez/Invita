import { notFound } from "next/navigation";
import { getInvitationById } from "@/services/invitationService";
import { verifyEditToken } from "@/services/guestAdminService";
import { formatDateInputValue, toDate } from "@/utils/date";
import { EditInvitationForm } from "@/features/dashboard/EditInvitationForm";
import { Card } from "@/components/ui";

export default async function EditarInvitacionPage({
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

  const bride = invitation.categoryFields?.categoryId === "boda" ? invitation.categoryFields.brideAndGroom : undefined;
  const dressCode = invitation.categoryFields?.categoryId === "boda" ? invitation.categoryFields.dressCode : undefined;
  const giftRegistryUrl =
    invitation.categoryFields?.categoryId === "boda" ? invitation.categoryFields.giftRegistryUrl : undefined;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <a href={`/dashboard/${id}?editToken=${editToken}`} className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Volver al dashboard
      </a>
      <h1 className="mt-4 text-center text-2xl font-semibold">Editar invitación</h1>
      <p className="mt-2 text-center text-neutral-600">
        Los cambios se reflejan de inmediato en el enlace público — no se puede cambiar la plantilla ni la categoría.
      </p>

      <Card className="mt-8">
        <EditInvitationForm
          invitationId={id}
          editToken={editToken}
          categoryId={invitation.categoryId}
          initial={{
            hostName: invitation.hostName,
            age: invitation.age,
            theme: invitation.theme,
            brideAndGroom: bride,
            dressCode,
            giftRegistryUrl,
            date: formatDateInputValue(toDate(invitation.date)),
            time: invitation.time,
            venueName: invitation.venueName,
            venueAddress: invitation.venueAddress,
            mapsUrl: invitation.mapsUrl,
            message: invitation.message,
            contactPhone: invitation.contactPhone,
            images: invitation.images,
            music: invitation.music,
          }}
        />
      </Card>
    </main>
  );
}
