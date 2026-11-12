import "server-only";
import type { WorkType } from "@prisma/client";
import { createTranslator } from "next-intl";
import type { CvDocumentLabels, CvDocumentLanguage } from "./types";

const SECTIONS = [
  "profile",
  "experience",
  "education",
  "skills",
  "languages",
  "certificates",
  "workTypes",
] as const;
const WORK_TYPES: WorkType[] = [
  "FULL_TIME",
  "PART_TIME",
  "REMOTE",
  "INTERNSHIP",
];

/** Sarlavhalar CV tilidagi tarjima faylidan olinadi (messages/<til>.json → CvDocument). */
export async function getCvDocumentLabels(
  language: CvDocumentLanguage,
): Promise<CvDocumentLabels> {
  const messages = (await import(`../../../messages/${language}.json`)).default;
  const t = createTranslator({
    locale: language,
    messages,
    namespace: "CvDocument",
  });
  return {
    sections: Object.fromEntries(
      SECTIONS.map((key) => [key, t(`sections.${key}`)]),
    ) as CvDocumentLabels["sections"],
    workTypes: Object.fromEntries(
      WORK_TYPES.map((key) => [key, t(`workTypes.${key}`)]),
    ) as CvDocumentLabels["workTypes"],
  };
}
