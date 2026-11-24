import type { WorkType } from "@prisma/client";
import type { CvData } from "@/backend/cv/schema";

export type CvDocumentLanguage = "kk" | "uz" | "ru" | "en";

export type CvPersonalityBlock = {
  typeName: string;
  groupName: string;
  strengths: string;
  description: string;
  createdAt: string;
  scales: Array<{
    key: string;
    leftLabel: string;
    rightLabel: string;
    leftPct: number;
    rightPct: number;
  }>;
};

/** CV hujjatidagi sarlavhalar. CV tilida bo'ladi (interfeys tilida emas). */
export type CvDocumentLabels = {
  sections: Record<
    | "profile"
    | "experience"
    | "education"
    | "skills"
    | "languages"
    | "certificates"
    | "workTypes",
    string
  >;
  workTypes: Record<WorkType, string>;
};

export type CvDocumentInput = {
  data: CvData;
  language: CvDocumentLanguage;
  workTypes: WorkType[];
  templateId?: string;
  title?: string;
  personality?: CvPersonalityBlock | null;
};
