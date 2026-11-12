import type {
  CvDocumentInput,
  CvDocumentLabels,
} from "@/backend/cv-document/types";
import {
  renderCvTemplate,
  CV_TEMPLATES_CSS,
  CV_TEMPLATE_LABELS,
  normalizeTemplateId,
} from "@/frontend/components/cv-templates/cv-templates";
import { adaptCvDocumentToTemplateData } from "@/frontend/components/cv-templates/adapter";

/**
 * CV hujjati: 15 ta shablon (Modern / Classic / Minimal × 5 ta) asosida
 * ekrandagi jonli ko'rinish va PDF uchun yagona shablon rendereri.
 */
export function CvDocument({
  cv,
  labels,
}: {
  cv: CvDocumentInput;
  labels?: CvDocumentLabels;
}) {
  const normalizedId = normalizeTemplateId(cv.templateId);
  const templateData = adaptCvDocumentToTemplateData(cv);
  const langKey = cv.language || "uz";
  const defaultLabels = CV_TEMPLATE_LABELS[langKey] || CV_TEMPLATE_LABELS.uz;
  const customLabels = {
    ...defaultLabels,
    ...(labels?.sections?.profile ? { about: labels.sections.profile } : {}),
    ...(labels?.sections?.experience
      ? { experience: labels.sections.experience }
      : {}),
    ...(labels?.sections?.education
      ? { education: labels.sections.education }
      : {}),
    ...(labels?.sections?.skills ? { skills: labels.sections.skills } : {}),
    ...(labels?.sections?.languages
      ? { languages: labels.sections.languages }
      : {}),
    ...(labels?.sections?.certificates
      ? { certificates: labels.sections.certificates }
      : {}),
  };

  const html = renderCvTemplate(normalizedId, templateData, {
    labels: customLabels,
  });

  return (
    <div className="cv-document-container flex w-full justify-center overflow-x-auto">
      <style dangerouslySetInnerHTML={{ __html: CV_TEMPLATES_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
