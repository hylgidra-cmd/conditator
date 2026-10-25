// CV hujjati uslublari: ekranda ham, PDF da ham aynan shu CSS ishlatiladi.
// Barcha klasslar .cvdoc ichida, sayt uslublari bilan aralashmaydi.
// Shrift: Noto Sans (qoraqalpoq lotin harflari va kirillni to'liq qo'llaydi).

export const CV_DOCUMENT_CSS = `
.cvdoc {
  --cv-ink: #111827;
  --cv-muted: #4b5563;
  --cv-line: #d1d5db;
  --cv-accent: #0f766e;
  font-family: "Noto Sans Variable", "Noto Sans", sans-serif;
  color: var(--cv-ink);
  background: #fff;
  font-size: 10.5pt;
  line-height: 1.45;
  overflow-wrap: anywhere;
  text-align: left;
}
.cvdoc * { box-sizing: border-box; margin: 0; padding: 0; }
.cvdoc-header { padding-bottom: 10pt; border-bottom: 2pt solid var(--cv-accent); margin-bottom: 12pt; }
.cvdoc-name { font-size: 21pt; font-weight: 700; line-height: 1.2; }
.cvdoc-contact { margin-top: 4pt; color: var(--cv-muted); font-size: 9.5pt; }
.cvdoc-contact span { display: inline-block; }
.cvdoc-contact span + span::before { content: "·"; margin: 0 6pt; color: var(--cv-line); }
.cvdoc-section { margin-top: 12pt; }
.cvdoc-section > h2 {
  font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--cv-accent); border-bottom: 0.75pt solid var(--cv-line); padding-bottom: 3pt; margin-bottom: 6pt;
  break-after: avoid; page-break-after: avoid;
}
.cvdoc-entry { margin-top: 7pt; break-inside: avoid; page-break-inside: avoid; }
.cvdoc-entry:first-of-type { margin-top: 0; }
.cvdoc-entry-head { display: flex; justify-content: space-between; gap: 12pt; align-items: baseline; }
.cvdoc-entry-title { font-weight: 700; }
.cvdoc-entry-sub { color: var(--cv-muted); }
.cvdoc-dates { color: var(--cv-muted); font-size: 9.5pt; white-space: nowrap; flex-shrink: 0; }
.cvdoc-text { white-space: pre-line; margin-top: 2pt; orphans: 3; widows: 3; }
.cvdoc-tags { display: flex; flex-wrap: wrap; gap: 4pt; }
.cvdoc-tags li { list-style: none; border: 0.75pt solid var(--cv-line); border-radius: 3pt; padding: 1pt 6pt; font-size: 9.5pt; }
.cvdoc-list { padding-left: 14pt; }
.cvdoc-list li { margin-top: 2pt; break-inside: avoid; page-break-inside: avoid; }
`;
