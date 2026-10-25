import type { CvData } from "@/lib/cv/schema";

export type CvLanguage = "kk" | "uz" | "ru" | "en";
export type WorkTypeValue = "FULL_TIME" | "PART_TIME" | "REMOTE" | "INTERNSHIP";

/** Tahrir oynasidagi holat. Ko'nikmalar va sertifikatlar matn ko'rinishida tahrirlanadi. */
export type CvDraft = {
  language: CvLanguage;
  workTypes: WorkTypeValue[];
  sourceText: string;
  data: CvData;
  skillsText: string;
  certificatesText: string;
};

export type SavedCvMeta = { savedAt: string | null; isVisible: boolean };

export function emptyCvData(email: string): CvData {
  return {
    fullName: null,
    contact: { email, phone: null },
    goal: null,
    location: null,
    education: [],
    experience: [],
    skills: [],
    languages: [],
    certificates: [],
  };
}

export function draftFromData(
  data: CvData,
  rest: Pick<CvDraft, "language" | "workTypes" | "sourceText">,
): CvDraft {
  return {
    ...rest,
    data,
    skillsText: data.skills.join(", "),
    certificatesText: data.certificates.join("\n"),
  };
}

/** Matn ko'rinishidagi ro'yxatlarni CvData ga qaytaradi. */
export function dataFromDraft(draft: CvDraft): CvData {
  return {
    ...draft.data,
    skills: draft.skillsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    certificates: draft.certificatesText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}
