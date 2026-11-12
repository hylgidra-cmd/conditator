import type { CvData } from "@/backend/cv/schema";

export type CvLanguage = "kk" | "uz" | "ru" | "en";
export type WorkTypeValue = "FULL_TIME" | "PART_TIME" | "REMOTE" | "INTERNSHIP";
export type CvTemplateId =
  | "modern"
  | "classic"
  | "minimal"
  | "modern-1"
  | "modern-2"
  | "modern-3"
  | "modern-4"
  | "modern-5"
  | "classic-1"
  | "classic-2"
  | "classic-3"
  | "classic-4"
  | "classic-5"
  | "minimal-1"
  | "minimal-2"
  | "minimal-3"
  | "minimal-4"
  | "minimal-5"
  | (string & {});

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
    contact: {
      email,
      phone: null,
      telegram: null,
      github: null,
      linkedin: null,
      website: null,
    },
    photo: null,
    goal: null,
    location: null,
    education: [],
    experience: [],
    projects: [],
    skills: [],
    languages: [],
    certificates: [],
    hobbies: [],
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
  const certsText = (data.certificates || [])
    .map((c) =>
      typeof c === "string"
        ? c
        : [c.name, c.issuer, c.year].filter(Boolean).join(" · "),
    )
    .join("\n");

  return {
    ...otherRest,
    title: rest.title || "Mening rezyumem",
    templateId: rest.templateId || "modern-1",
    privacy: {
      hideName: Boolean(userPrivacy?.hideName),
      hidePhone: Boolean(userPrivacy?.hidePhone),
      hideEmail: Boolean(userPrivacy?.hideEmail),
      hideAddress: Boolean(userPrivacy?.hideAddress),
      hidePhoto: Boolean(userPrivacy?.hidePhoto),
    },
    data: {
      ...data,
      projects: data.projects || [],
      hobbies: data.hobbies || [],
      certificates: data.certificates || [],
    },
    skillsText: (data.skills || []).join(", "),
    certificatesText: certsText,
  };
}

/** Matn ko'rinishidagi ro'yxatlarni CvData ga qaytaradi. */
export function dataFromDraft(draft: CvDraft): CvData {
  const skills = draft.skillsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const certificates =
    draft.data.certificates && draft.data.certificates.length > 0
      ? draft.data.certificates
      : draft.certificatesText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);

  return {
    ...draft.data,
    skills,
    certificates,
  };
}
