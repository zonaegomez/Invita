import { formatEventDate } from "@/utils/date";
import type { InvitationViewModel } from "@/types/invitationView";

interface EventInfoProps {
  invitation: InvitationViewModel;
}

export function EventInfo({ invitation }: EventInfoProps) {
  return (
    <section className="mx-auto max-w-lg px-6 py-8 text-center">
      <div className="space-y-2 text-neutral-700">
        <p className="text-lg font-medium capitalize">{formatEventDate(invitation.date)}</p>
        <p>{invitation.time} hrs</p>
        <p className="font-medium">{invitation.venueName}</p>
        <p className="text-sm text-neutral-500">{invitation.venueAddress}</p>
      </div>
      {invitation.message && (
        <p className="mt-6 text-neutral-600">&ldquo;{invitation.message}&rdquo;</p>
      )}
    </section>
  );
}
