export type ProfileLike = { id: string; authProvider: "chatgpt" | "google"; authSubject: string | null };
export type GoogleProfileInput = { sub: string; email: string; name: string | null };

export type ProfileResolution =
  | { action: "update"; id: string; displayName: string; email: string }
  | { action: "adopt"; id: string; authSubject: string; displayName: string; email: string }
  | { action: "create"; authSubject: string; displayName: string; email: string };

export function resolveGoogleProfile(
  input: GoogleProfileInput,
  existing: { bySubject: ProfileLike | null; legacyByEmail: ProfileLike | null },
): ProfileResolution {
  const displayName = input.name ?? input.email;
  if (existing.bySubject) return { action: "update", id: existing.bySubject.id, displayName, email: input.email };
  if (existing.legacyByEmail?.authProvider === "chatgpt") {
    return { action: "adopt", id: existing.legacyByEmail.id, authSubject: input.sub, displayName, email: input.email };
  }
  return { action: "create", authSubject: input.sub, displayName, email: input.email };
}
