import type { Invitation } from "@/types/invitation";
import type { InvitationViewModel } from "@/types/invitationView";
import { toDate } from "./date";

export function toInvitationViewModel(invitation: Invitation): InvitationViewModel {
  return {
    hostName: invitation.hostName,
    age: invitation.age,
    theme: invitation.theme,
    date: toDate(invitation.date),
    time: invitation.time,
    venueName: invitation.venueName,
    venueAddress: invitation.venueAddress,
    mapsUrl: invitation.mapsUrl,
    message: invitation.message,
    contactPhone: invitation.contactPhone,
    images: invitation.images,
    music: invitation.music,
  };
}
