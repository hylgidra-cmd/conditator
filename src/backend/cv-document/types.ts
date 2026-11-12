import type { WorkType } from "@prisma/client";
import type { CvData } from "@/backend/cv/schema";

export type CvDocumentLanguage = "kk" | "uz" | "ru" | "en";

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
};
