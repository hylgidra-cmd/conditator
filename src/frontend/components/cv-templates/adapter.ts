import type { CvDocumentInput } from "@/backend/cv-document/types";
import type { RawCvTemplateData } from "./cv-templates";

export function adaptCvDocumentToTemplateData(
  cv: CvDocumentInput,
  overrides?: { position?: string; photo?: string },
): RawCvTemplateData {
  const { data } = cv;

  const certificates = (data.certificates || []).map((c) => {
    if (typeof c === "string") {
      return { name: c, issuer: "", year: "" };
    }
    return {
      name: c.name || "",
      issuer: c.issuer || "",
      year: c.year || "",
    };
  });

  return {
    fullName: data.fullName || "",
    position: overrides?.position || cv.title || data.goal?.slice(0, 50) || "",
    photo: overrides?.photo || data.photo || "",
    email: data.contact?.email || "",
    phone: data.contact?.phone || "",
    address: data.location || "",
    telegram: data.contact?.telegram || data.telegram || "",
    github: data.contact?.github || data.github || "",
    linkedin: data.contact?.linkedin || data.linkedin || "",
    website: data.contact?.website || data.website || "",
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
    projects: (data.projects || []).map((p) => ({
      name: p.name || "",
      link: p.link || "",
      year: p.year || "",
      description: p.description || "",
    })),
    certificates,
    skills: (data.skills || []).map((s) => ({
      name: s,
    })),
    languages: (data.languages || []).map((l) => ({
      name: l.name,
      level: l.level || "",
    })),
    hobbies: data.hobbies || [],
  };
}
