import type { CvData } from "@/backend/cv/schema";

export type CvLanguage = "kk" | "uz" | "ru" | "en";
export type WorkTypeValue = "FULL_TIME" | "PART_TIME" | "REMOTE" | "INTERNSHIP";
export type CvTemplateId = "modern" | "classic" | "minimal";

export type CvPrivacyState = {
  hideName: boolean;
  hidePhone: boolean;
  hideEmail: boolean;
  hideAddress: boolean;
  hidePhoto: boolean;
};

/** Tahrir oynasidagi holat. Ko'nikmalar va sertifikatlar matn ko'rinishida tahrirlanadi. */
export type CvDraft = {
  title: string;
  templateId: CvTemplateId;
  privacy: CvPrivacyState;
  language: CvLanguage;
  workTypes: WorkTypeValue[];
  sourceText: string;
  data: CvData;
  skillsText: string;
  certificatesText: string;
};

export type SavedCvMeta = {
  savedAt: string | null;
  isVisible: boolean;
  id?: string;
};

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
  rest: Pick<CvDraft, "language" | "workTypes" | "sourceText"> & {
    title?: string;
    templateId?: CvTemplateId;
    privacy?: Partial<CvPrivacyState>;
  },
): CvDraft {
  const { privacy: userPrivacy, ...otherRest } = rest;
  return {
    ...otherRest,
    title: rest.title || "Mening rezyumem",
    templateId: rest.templateId || "modern",
    privacy: {
      hideName: Boolean(userPrivacy?.hideName),
      hidePhone: Boolean(userPrivacy?.hidePhone),
      hideEmail: Boolean(userPrivacy?.hideEmail),
      hideAddress: Boolean(userPrivacy?.hideAddress),
      hidePhoto: Boolean(userPrivacy?.hidePhoto),
    },
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
