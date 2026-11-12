import type { ReactNode } from "react";
import { CV_DOCUMENT_CSS } from "@/backend/cv-document/styles";
import type {
  CvDocumentInput,
  CvDocumentLabels,
} from "@/backend/cv-document/types";

/**
 * CV hujjati: ekrandagi ko'rinish va PDF uchun yagona shablon.
 * Talaba sahifasi, PDF va (2-kunda) kompaniya ko'rishi shu komponentdan foydalanadi.
 * Hook va brauzer API si yo'q: renderToStaticMarkup bilan ham ishlaydi.
 * Bo'sh maydon va bo'limlar chiqarilmaydi.
 */
export function CvDocument({
  cv,
  labels,
}: {
  cv: CvDocumentInput;
  labels: CvDocumentLabels;
}) {
  const { data } = cv;
  const contact = [data.contact.email, data.contact.phone, data.location];

  return (
    <article className="cvdoc" lang={cv.language}>
      <style>{CV_DOCUMENT_CSS}</style>
      <header className="cvdoc-header">
        {data.fullName ? <h1 className="cvdoc-name">{data.fullName}</h1> : null}
        <p className="cvdoc-contact">
          {contact.filter(Boolean).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </p>
      </header>

      {data.goal ? (
        <Section title={labels.sections.profile}>
          <p className="cvdoc-text">{data.goal}</p>
        </Section>
      ) : null}

      {data.experience.length > 0 ? (
        <Section title={labels.sections.experience}>
          {data.experience.map((item, index) => (
            <div className="cvdoc-entry" key={index}>
              <Head
                title={item.position ?? item.organization}
                dates={range(item.startDate, item.endDate)}
              />
              {item.position ? (
                <p className="cvdoc-entry-sub">{item.organization}</p>
              ) : null}
              {item.description ? (
                <p className="cvdoc-text">{item.description}</p>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      {data.education.length > 0 ? (
        <Section title={labels.sections.education}>
          {data.education.map((item, index) => {
            const details = [item.degree, item.field].filter(Boolean);
            return (
              <div className="cvdoc-entry" key={index}>
                <Head
                  title={item.institution}
                  dates={range(item.startYear, item.endYear)}
                />
                {details.length > 0 ? (
                  <p className="cvdoc-entry-sub">{details.join(", ")}</p>
                ) : null}
              </div>
            );
          })}
        </Section>
      ) : null}

      {data.skills.length > 0 ? (
        <Section title={labels.sections.skills}>
          <ul className="cvdoc-tags">
            {data.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {data.languages.length > 0 ? (
        <Section title={labels.sections.languages}>
          <ul className="cvdoc-tags">
            {data.languages.map((item) => (
              <li key={item.name}>
                {item.level ? `${item.name} — ${item.level}` : item.name}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {data.certificates.length > 0 ? (
        <Section title={labels.sections.certificates}>
          <ul className="cvdoc-list">
            {data.certificates.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {cv.workTypes.length > 0 ? (
        <Section title={labels.sections.workTypes}>
          <p>{cv.workTypes.map((type) => labels.workTypes[type]).join(", ")}</p>
        </Section>
      ) : null}
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cvdoc-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Head({ title, dates }: { title: string; dates: string | null }) {
  return (
    <div className="cvdoc-entry-head">
      <p className="cvdoc-entry-title">{title}</p>
      {dates ? <p className="cvdoc-dates">{dates}</p> : null}
    </div>
  );
}

function range(start: string | null, end: string | null): string | null {
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}
