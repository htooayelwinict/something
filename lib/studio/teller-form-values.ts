import type { TarotSpecialistRow } from "@/db/schema";

export type TellerFormMode = "create" | "editor" | "self";
export type TellerFormValues = {
  id: string; name: string; initials: string; specialty: string; experience: string; displayRate: string; availabilityLabel: string;
  tags: string; location: string; sessionMinutes: number; bio: string; photoUrl: string; loginEmail: string; isActive: boolean; sortOrder: number;
};

export const emptyTeller: TellerFormValues = {
  id: "", name: "", initials: "", specialty: "", experience: "", displayRate: "၃၀ မိနစ် · ၂၅,၀၀၀ ကျပ်", availabilityLabel: "",
  tags: "", location: "ရန်ကုန်", sessionMinutes: 30, bio: "", photoUrl: "", loginEmail: "", isActive: true, sortOrder: 0,
};

export function tellerFormValues(row: TarotSpecialistRow): TellerFormValues {
  return {
    id: row.id, name: row.name, initials: row.initials, specialty: row.specialty, experience: row.experience, displayRate: row.displayRate,
    availabilityLabel: row.availabilityLabel, tags: row.tags.join("၊ "), location: row.location, sessionMinutes: row.sessionMinutes,
    bio: row.bio, photoUrl: row.photoUrl ?? "", loginEmail: row.loginEmail ?? "", isActive: row.isActive, sortOrder: row.sortOrder,
  };
}
