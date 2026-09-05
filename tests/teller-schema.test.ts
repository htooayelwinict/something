import { describe, expect, it } from "vitest";
import { tellerCreateSchema, tellerEditorSchema, tellerProfileSchema } from "@/lib/schemas/teller";

const profile = {
  name: "သီရိလမင်း", initials: "TL", specialty: "Tarot & Relationship Guidance", experience: "အတွေ့အကြုံ ၆ နှစ်",
  displayRate: "၃၀ မိနစ် · ၂၅,၀၀၀ ကျပ်", availabilityLabel: "စနေ · တနင်္ဂနွေ", tags: "ချစ်ရေး၊ အလုပ်အကိုင်, စိတ်ခံစားမှု ",
  location: "ရန်ကုန် · ကမာရွတ်", sessionMinutes: 30, bio: "", photoUrl: "",
};

describe("tellerProfileSchema", () => {
  it("splits tags on comma or Burmese comma and normalises empty urls to null", () => {
    const parsed = tellerProfileSchema.parse(profile);
    expect(parsed.tags).toEqual(["ချစ်ရေး", "အလုပ်အကိုင်", "စိတ်ခံစားမှု"]);
    expect(parsed.photoUrl).toBeNull();
    expect(tellerProfileSchema.parse({ ...profile, tags: ["a", "b"], photoUrl: "https://cdn.example/p.jpg" })).toMatchObject({ tags: ["a", "b"], photoUrl: "https://cdn.example/p.jpg" });
  });

  it("rejects non-https photos, bad minutes, too many tags, and editor-only keys", () => {
    expect(tellerProfileSchema.safeParse({ ...profile, photoUrl: "http://x/p.jpg" }).success).toBe(false);
    expect(tellerProfileSchema.safeParse({ ...profile, sessionMinutes: 10 }).success).toBe(false);
    expect(tellerProfileSchema.safeParse({ ...profile, tags: "a,b,c,d,e,f,g" }).success).toBe(false);
    expect(tellerProfileSchema.safeParse({ ...profile, isActive: false }).success).toBe(false);
    expect(tellerProfileSchema.safeParse({ ...profile, loginEmail: "x@y.com" }).success).toBe(false);
  });
});

describe("tellerEditorSchema / tellerCreateSchema", () => {
  it("lower-cases the login email, allows it empty, and validates the slug", () => {
    const editor = tellerEditorSchema.parse({ ...profile, loginEmail: " Thiri@Gmail.com ", isActive: true, sortOrder: 2 });
    expect(editor.loginEmail).toBe("thiri@gmail.com");
    expect(tellerEditorSchema.parse({ ...profile, loginEmail: "", isActive: false, sortOrder: 0 }).loginEmail).toBeNull();
    expect(tellerEditorSchema.safeParse({ ...profile, loginEmail: "nope", isActive: true, sortOrder: 0 }).success).toBe(false);
    expect(tellerCreateSchema.parse({ ...profile, id: "aye-aye-2", loginEmail: "", isActive: true, sortOrder: 0 }).id).toBe("aye-aye-2");
    for (const id of ["Aye", "a", "-aye", "aye aye", "a".repeat(41)]) {
      expect(tellerCreateSchema.safeParse({ ...profile, id, loginEmail: "", isActive: true, sortOrder: 0 }).success, id).toBe(false);
    }
  });
});
