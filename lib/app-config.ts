export const DEFAULT_FAMILY_NAME = "Keluarga Kecil";
export const DEFAULT_CHILD_NAME = "Si Kecil";
export const DEFAULT_ROLE_LABELS = {
  owner: "Baba",
  member: "Bubu",
} as const;

export const appCopy = {
  familyNamePlaceholder: "Contoh: Keluarga Kecil",
  childNamePlaceholder: "Contoh: Si Kecil",
  timelineGreeting: (ownerLabel: string, memberLabel: string) => `Halo, ${ownerLabel} dan ${memberLabel}`,
  timelinePrompt: "Simpan satu momen kecil hari ini.",
} as const;
