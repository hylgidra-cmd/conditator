import type { CvDocumentInput } from "@/backend/cv-document/types";
import type { RawCvTemplateData } from "./cv-templates";

export function adaptCvDocumentToTemplateData(
  cv: CvDocumentInput,
  overrides?: { position?: string; photo?: string }
): RawCvTemplateData {
  const { data } = cv;

  return {
    fullName: data.fullName || "",
    position: overrides?.position || data.goal || "",
    photo: overrides?.photo || "",
    email: data.contact?.email || "",
    phone: data.contact?.phone || "",
    address: data.location || "",
    summary: data.goal || "",
    experience: (data.experience || []).map((e) => ({
      position: e.position || "",
      company: e.organization || "",
      startDate: e.startDate || "",
      endDate: e.endDate || "",
      description: e.description || "",
    })),
    education: (data.education || []).map((e) => ({
      degree: [e.degree, e.field].filter(Boolean).join(" - ") || "",
      school: e.institution || "",
      startYear: e.startYear || "",
      endYear: e.endYear || "",
      description: "",
    })),
    skills: (data.skills || []).map((s) => ({
      name: s,
    })),
    languages: (data.languages || []).map((l) => ({
      name: l.name,
      level: l.level || "",
    })),
    certificates: (data.certificates || []).map((c) => ({
      name: c,
    })),
  };
}
