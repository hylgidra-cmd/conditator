/**
 * CV Templates — 3 kategoriya × 5 shablon (Modern / Classic / Minimal) = 15 ta shablon.
 * Next.js SSR, Client Component va PDF (Puppeteer / HTML) uchun to'liq moslashtirilgan.
 */

export interface CvTemplateCategory {
  id: "modern" | "classic" | "minimal";
  name: string;
  color: string;
}

export interface CvTemplateItem {
  id: string;
  category: "modern" | "classic" | "minimal";
  name: string;
}

export interface CvTemplateLabels {
  contact: string;
  about: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
  certificates: string;
  projects: string;
  hobbies: string;
  present: string;
}

export const CV_TEMPLATE_LABELS: Record<string, CvTemplateLabels> = {
  uz: {
    contact: "Aloqa",
    about: "Haqimda",
    experience: "Ish tajribasi",
    education: "Ta'lim",
    skills: "Ko'nikmalar",
    languages: "Tillar",
    certificates: "Sertifikatlar",
    projects: "Loyihalar",
    hobbies: "Qiziqishlar",
    present: "Hozirgacha",
  },
  kk: {
    contact: "Baylanıs",
    about: "Men haqqımda",
    experience: "Jumıs tájiriybesi",
    education: "Bilimlendiriw",
    skills: "Kónlikpeler",
    languages: "Tiller",
    certificates: "Sertifikatlar",
    projects: "Joybarlar",
    hobbies: "Qızıǵıwshılıqlar",
    present: "Házirge shekem",
  },
  ru: {
    contact: "Контакты",
    about: "О себе",
    experience: "Опыт работы",
    education: "Образование",
    skills: "Навыки",
    languages: "Языки",
    certificates: "Сертификаты",
    projects: "Проекты",
    hobbies: "Интересы",
    present: "По настоящее время",
  },
  en: {
    contact: "Contact",
    about: "About Me",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    certificates: "Certificates",
    projects: "Projects",
    hobbies: "Hobbies",
    present: "Present",
  },
};

export const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=swap";

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const esc = (v: unknown): string =>
  String(v == null ? "" : v).replace(/[&<>"']/g, (ch) => ESC[ch] || ch);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v.filter(Boolean) as T[]) : []);
const join = (a: unknown[], s = " · "): string =>
  a
    .filter(Boolean)
    .map((x) => esc(x))
    .join(s);

function rich(t: unknown): string {
  if (!t) return "";
  const lines = String(t)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const isBullet = (l: string) => /^[-•*]\s+/.test(l);
  if (lines.length && lines.every(isBullet)) {
    return (
      "<ul>" +
      lines.map((l) => "<li>" + esc(l.replace(/^[-•*]\s+/, "")) + "</li>").join("") +
      "</ul>"
    );
  }
  return lines.map(esc).join("<br>");
}

function levelPct(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  if (!isNaN(n)) return Math.max(0, Math.min(100, n <= 5 ? n * 20 : n));
  const s = String(v).toLowerCase().trim();
  const cefr: Record<string, number> = { a1: 20, a2: 35, b1: 50, b2: 65, c1: 80, c2: 95 };
  if (cefr[s]) return cefr[s];
  if (/ona|native|родн/.test(s)) return 100;
  if (/yuqori|advanced|fluent|erkin|свобод|высок/.test(s)) return 85;
  if (/o.?rta|intermediate|средн/.test(s)) return 60;
  if (/boshlang|beginner|basic|начал/.test(s)) return 30;
  return null;
}

export interface TemplateExperienceItem {
  position?: string;
  title?: string;
  company?: string;
  organization?: string;
  location?: string;
  start?: string;
  start_date?: string;
  from?: string;
  startDate?: string;
  end?: string;
  end_date?: string;
  to?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  year?: string;
  date?: string;
}

export interface TemplateEducationItem {
  degree?: string;
  field?: string;
  school?: string;
  institution?: string;
  location?: string;
  start?: string;
  start_date?: string;
  from?: string;
  startYear?: string;
  end?: string;
  end_date?: string;
  to?: string;
  endYear?: string;
  current?: boolean;
  description?: string;
  year?: string;
  date?: string;
}

export interface TemplateProjectItem {
  name?: string;
  link?: string;
  year?: string;
  description?: string;
}

export interface TemplateCertificateItem {
  name?: string;
  issuer?: string;
  year?: string;
  date?: string;
}

export interface TemplateSkillItem {
  name: string;
  level: number | null;
}

export interface TemplateLanguageItem {
  name: string;
  level: string;
  pct: number | null;
}

export interface ItemEntry {
  t?: string;
  s?: string;
  d?: string;
  x?: string;
}

export interface RawCvTemplateData {
  fullName?: string;
  full_name?: string;
  position?: string;
  title?: string;
  photo?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  telegram?: string;
  summary?: string;
  about?: string;
  experience?: TemplateExperienceItem[];
  education?: TemplateEducationItem[];
  projects?: TemplateProjectItem[];
  certificates?: Array<string | TemplateCertificateItem>;
  skills?: Array<string | { name: string; level?: unknown }>;
  languages?: Array<string | { name: string; level?: unknown }>;
  hobbies?: Array<string | { name?: string }>;
}

function norm(d: RawCvTemplateData | undefined) {
  d = d || {};
  return {
    fullName: d.fullName || d.full_name || "",
    position: d.position || d.title || "",
    photo: d.photo || "",
    email: d.email || "",
    phone: d.phone || "",
    address: d.address || d.location || "",
    website: d.website || "",
    linkedin: d.linkedin || "",
    github: d.github || "",
    telegram: d.telegram || "",
    summary: d.summary || d.about || "",
    experience: arr<TemplateExperienceItem>(d.experience),
    education: arr<TemplateEducationItem>(d.education),
    projects: arr<TemplateProjectItem>(d.projects),
    certificates: arr<TemplateCertificateItem | string>(d.certificates).map((c) =>
      typeof c === "string" ? { name: c, issuer: "", year: "" } : c
    ),
    skills: arr<TemplateSkillItem | { name: string; level?: unknown } | string>(d.skills).map((s) =>
      typeof s === "string"
        ? { name: s, level: null }
        : { name: s.name, level: levelPct(s.level) }
    ),
    languages: arr<TemplateLanguageItem | { name: string; level?: unknown } | string>(d.languages).map((s) =>
      typeof s === "string"
        ? { name: s, level: "", pct: null }
        : { name: s.name, level: s.level == null ? "" : String(s.level), pct: levelPct(s.level) }
    ),
    hobbies: arr<string | { name?: string }>(d.hobbies).map((h) => (typeof h === "string" ? h : h.name || "")),
  };
}

function period(
  x: {
    start?: string;
    start_date?: string;
    from?: string;
    startDate?: string;
    end?: string;
    end_date?: string;
    to?: string;
    endDate?: string;
    current?: boolean;
    year?: string;
    date?: string;
    startYear?: string;
  },
  L: CvTemplateLabels
) {
  const s = x.start || x.start_date || x.from || x.startDate || "";
  let e = x.end || x.end_date || x.to || x.endDate || "";
  if (!e && (x.current || s)) e = L.present;
  if (s || e) return [s, e].filter(Boolean).map(esc).join(" — ");
  return esc(x.year || x.date || x.startYear || "");
}

const ICONS: Record<string, string> = {
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  web: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  in: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" r="2"/>',
  gh: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  tg: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',
};
const ico = (n: string) =>
  '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  (ICONS[n] || "") +
  "</svg>";

const initials = (n: unknown) =>
  String(n || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();

const photo = (d: ReturnType<typeof norm>) =>
  d.photo
    ? `<img class="ph" src="${esc(d.photo)}" alt="">`
    : `<div class="ph">${esc(initials(d.fullName))}</div>`;

const sec = (t: string, b: string, cls = "") =>
  b ? `<section class="s ${cls}"><h3 class="s-t">${esc(t)}</h3><div class="s-b">${b}</div></section>` : "";

function items(list: ItemEntry[], mode = "") {
  if (!list.length) return "";
  const row = mode.split(" ").includes("row");
  return (
    `<div class="items ${mode}">` +
    list
      .map((i) => {
        const t = i.t ? `<div class="it-t">${esc(i.t)}</div>` : "";
        const s = i.s ? `<div class="it-s">${i.s}</div>` : "";
        const x = i.x ? `<div class="it-x">${rich(i.x)}</div>` : "";
        const d = `<div class="it-d">${i.d || ""}</div>`;
        return row
          ? `<div class="it">${d}<div class="it-b">${t}${s}${x}</div></div>`
          : `<div class="it"><div class="it-h">${t}${i.d ? d : ""}</div>${s}${x}</div>`;
      })
      .join("") +
    "</div>"
  );
}

const dots = (p: number) =>
  '<span class="dots">' +
  [1, 2, 3, 4, 5].map((i) => `<i class="${i * 20 <= p + 10 ? "on" : ""}"></i>`).join("") +
  "</span>";

function skills(list: TemplateSkillItem[], mode: string) {
  if (!list.length) return "";
  switch (mode) {
    case "bars":
      return (
        '<div class="sks">' +
        list
          .map(
            (s) =>
              `<div class="sk"><div class="sk-n">${esc(s.name)}</div>${
                s.level != null ? `<div class="bar"><i style="width:${s.level}%"></i></div>` : ""
              }</div>`
          )
          .join("") +
        "</div>"
      );
    case "dots":
      return (
        '<div class="sks">' +
        list
          .map(
            (s) =>
              `<div class="sk-r"><span>${esc(s.name)}</span>${
                s.level != null ? dots(s.level) : ""
              }</div>`
          )
          .join("") +
        "</div>"
      );
    case "chips":
      return (
        '<div class="chips">' +
        list.map((s) => `<span class="chip">${esc(s.name)}</span>`).join("") +
        "</div>"
      );
    case "cols":
      return '<ul class="cols3">' + list.map((s) => `<li>${esc(s.name)}</li>`).join("") + "</ul>";
    default:
      return `<p class="inl">${list.map((s) => esc(s.name)).join(" · ")}</p>`;
  }
}

function langs(list: TemplateLanguageItem[], mode: string) {
  if (!list.length) return "";
  const lv = (l: TemplateLanguageItem) => (l.level !== "" && isNaN(Number(l.level)) ? esc(l.level) : "");
  if (mode === "bars") {
    return skills(
      list.map((l) => ({
        name: l.name + (lv(l) ? " — " + l.level : ""),
        level: l.pct,
      })),
      "bars"
    );
  }
  if (mode === "dots") {
    return (
      '<div class="sks">' +
      list
        .map(
          (l) =>
            `<div class="sk-r"><span>${esc(l.name)}</span>${
              l.pct != null ? dots(l.pct) : `<span class="lv">${lv(l)}</span>`
            }</div>`
        )
        .join("") +
      "</div>"
    );
  }
  if (mode === "inline") {
    return `<p class="inl">${list
      .map((l) => esc(l.name) + (lv(l) ? ` (${lv(l)})` : ""))
      .join(" · ")}</p>`;
  }
  return (
    '<div class="sks">' +
    list
      .map(
        (l) => `<div class="sk-r"><span>${esc(l.name)}</span><span class="lv">${lv(l)}</span></div>`
      )
      .join("") +
    "</div>"
  );
}

function contacts(d: ReturnType<typeof norm>, mode: string) {
  const c = [
    ["mail", d.email],
    ["phone", d.phone],
    ["pin", d.address],
    ["web", d.website],
    ["in", d.linkedin],
    ["gh", d.github],
    ["tg", d.telegram],
  ].filter((x) => x[1]);
  if (!c.length) return "";
  if (mode === "text")
    return '<div class="cts">' + c.map((x) => `<span class="ct">${esc(x[1])}</span>`).join("") + "</div>";
  if (mode === "lines")
    return '<div class="cts">' + c.map((x) => `<div class="ct">${esc(x[1])}</div>`).join("") + "</div>";
  if (mode === "iconsInline")
    return (
      '<div class="cts">' +
      c.map((x) => `<span class="ct">${ico(x[0])}<span>${esc(x[1])}</span></span>`).join("") +
      "</div>"
    );
  return (
    '<div class="cts">' +
    c.map((x) => `<div class="ct">${ico(x[0])}<span>${esc(x[1])}</span></div>`).join("") +
    "</div>"
  );
}

function ctx(raw: RawCvTemplateData | undefined, opts?: { labels?: Partial<CvTemplateLabels> }) {
  opts = opts || {};
  const defaultLabels = CV_TEMPLATE_LABELS.uz;
  const L = Object.assign({}, defaultLabels, opts.labels) as CvTemplateLabels;
  const d = norm(raw);
  const parts = d.fullName.trim().split(/\s+/);
  return {
    d,
    L,
    name: esc(d.fullName),
    name2: `<span class="n1">${esc(parts[0] || "")}</span> <span class="n2">${esc(
      parts.slice(1).join(" ")
    )}</span>`,
    pos: esc(d.position),
    ph: photo(d),
    hasPhoto: !!d.photo,
    ini: esc(initials(d.fullName)),
    sum: () => (d.summary ? `<p class="sum">${rich(d.summary)}</p>` : ""),
    exp: (m = "") =>
      items(
        d.experience.map((e) => ({
          t: e.position || e.title,
          s: join([e.company || e.organization, e.location]),
          d: period(e, L),
          x: e.description,
        })),
        m
      ),
    edu: (m = "") =>
      items(
        d.education.map((e) => ({
          t: e.degree || e.field,
          s: join([e.school || e.institution, e.location]),
          d: period(e, L),
          x: e.description,
        })),
        m
      ),
    prj: (m = "") =>
      items(
        d.projects.map((p) => ({
          t: p.name,
          s: esc(p.link || ""),
          d: esc(p.year || ""),
          x: p.description,
        })),
        m
      ),
    crt: (m = "") =>
      items(
        d.certificates.map((x) => ({
          t: x.name,
          s: esc(x.issuer || ""),
          d: esc(x.year || x.date || ""),
        })),
        m
      ),
    sk: (m: string) => skills(d.skills, m),
    lg: (m: string) => langs(d.languages, m),
    hb: (m?: string) =>
      !d.hobbies.length
        ? ""
        : m === "chips"
        ? '<div class="chips">' + d.hobbies.map((h) => `<span class="chip">${esc(h)}</span>`).join("") + "</div>"
        : `<p class="inl">${d.hobbies.map(esc).join(" · ")}</p>`,
    ct: (m: string) => contacts(d, m),
  };
}

/* ------------------------------------------------------------------ */
/*  15 Shablonlar generatorlari                                        */
/* ------------------------------------------------------------------ */
type ContextType = ReturnType<typeof ctx>;
const T: Record<string, (c: ContextType, L?: CvTemplateLabels) => string> = {};

// Modern 1 — Sidebar
T["modern-1"] = (c, L = c.L) => `
<div class="cv cv-m1">
  <aside>
    ${c.ph}
    ${sec(L.contact, c.ct("icons"))}
    ${sec(L.skills, c.sk("bars"))}
    ${sec(L.languages, c.lg("bars"))}
    ${sec(L.hobbies, c.hb("chips"))}
  </aside>
  <main>
    <header><h1>${c.name}</h1><div class="pos">${c.pos}</div></header>
    ${sec(L.about, c.sum())}
    ${sec(L.experience, c.exp("tl"))}
    ${sec(L.education, c.edu("tl"))}
    ${sec(L.projects, c.prj())}
    ${sec(L.certificates, c.crt())}
  </main>
</div>`;

// Modern 2 — Gradient
T["modern-2"] = (c, L = c.L) => {
  const cts = c.ct("iconsInline");
  return `
<div class="cv cv-m2">
  <div class="hd">${c.ph}<div><h1>${c.name}</h1><div class="pos">${c.pos}</div></div></div>
  ${cts ? `<div class="cbar">${cts}</div>` : ""}
  <div class="cols">
    <main>
      ${sec(L.about, c.sum())}
      ${sec(L.experience, c.exp())}
      ${sec(L.projects, c.prj())}
    </main>
    <aside>
      ${sec(L.skills, c.sk("chips"))}
      ${sec(L.education, c.edu())}
      ${sec(L.languages, c.lg("dots"))}
      ${sec(L.certificates, c.crt())}
      ${sec(L.hobbies, c.hb("chips"))}
    </aside>
  </div>
</div>`;
};

// Modern 3 — Timeline
T["modern-3"] = (c, L = c.L) => `
<div class="cv cv-m3">
  <header class="hd">${c.ph}<h1>${c.name}</h1><div class="pos">${c.pos}</div>${c.ct("iconsInline")}</header>
  ${c.sum()}
  ${sec(L.experience, c.exp("row tl"))}
  ${sec(L.projects, c.prj("row"))}
  <div class="grid2">
    <div>${sec(L.education, c.edu())}${sec(L.certificates, c.crt())}</div>
    <div>${sec(L.skills, c.sk("chips"))}${sec(L.languages, c.lg("bars"))}${sec(L.hobbies, c.hb())}</div>
  </div>
</div>`;

// Modern 4 — Split
T["modern-4"] = (c, L = c.L) => `
<div class="cv cv-m4">
  <main>
    <header><h1>${c.name2}</h1><div class="pos">${c.pos}</div><div class="ln"></div></header>
    ${sec(L.about, c.sum())}
    ${sec(L.experience, c.exp())}
    ${sec(L.education, c.edu())}
    ${sec(L.projects, c.prj())}
  </main>
  <aside>
    ${c.ph}
    ${sec(L.contact, c.ct("icons"))}
    ${sec(L.skills, c.sk("dots"))}
    ${sec(L.languages, c.lg("rows"))}
    ${sec(L.certificates, c.crt())}
    ${sec(L.hobbies, c.hb("chips"))}
  </aside>
</div>`;

// Modern 5 — Geometric
T["modern-5"] = (c, L = c.L) => `
<div class="cv cv-m5">
  <header class="hd">
    <div class="hd-l"><h1>${c.name}</h1><div class="pos">${c.pos}</div>${c.ct("icons")}</div>
    ${c.ph}
  </header>
  <div class="body">
    <div>
      ${sec(L.about, c.sum())}
      ${sec(L.experience, c.exp())}
      ${sec(L.projects, c.prj())}
    </div>
    <div>
      ${sec(L.skills, c.sk("bars"))}
      ${sec(L.education, c.edu())}
      ${sec(L.languages, c.lg("dots"))}
      ${sec(L.certificates, c.crt())}
      ${sec(L.hobbies, c.hb("chips"))}
    </div>
  </div>
</div>`;

// Classic 1 — Traditional
T["classic-1"] = (c, L = c.L) => `
<div class="cv cv-c1">
  <header class="hd"><h1>${c.name}</h1><div class="pos">${c.pos}</div>${c.ct("text")}</header>
  ${sec(L.about, c.sum())}
  ${sec(L.experience, c.exp())}
  ${sec(L.education, c.edu())}
  ${sec(L.projects, c.prj())}
  ${sec(L.skills, c.sk("list"))}
  ${sec(L.languages, c.lg("inline"))}
  ${sec(L.certificates, c.crt())}
  ${sec(L.hobbies, c.hb())}
</div>`;

// Classic 2 — Navy
T["classic-2"] = (c, L = c.L) => `
<div class="cv cv-c2">
  <aside>
    ${c.ph}
    <h1>${c.name}</h1><div class="pos">${c.pos}</div>
    ${sec(L.contact, c.ct("icons"))}
    ${sec(L.skills, c.sk("bars"))}
    ${sec(L.languages, c.lg("rows"))}
    ${sec(L.hobbies, c.hb())}
  </aside>
  <main>
    ${sec(L.about, c.sum())}
    ${sec(L.experience, c.exp())}
    ${sec(L.education, c.edu())}
    ${sec(L.projects, c.prj())}
    ${sec(L.certificates, c.crt())}
  </main>
</div>`;

// Classic 3 — Executive
T["classic-3"] = (c, L = c.L) => `
<div class="cv cv-c3">
  <header class="hd">
    <div class="hd-l">${c.ph}<div><h1>${c.name}</h1><div class="pos">${c.pos}</div></div></div>
    ${c.ct("icons")}
  </header>
  <div class="strip"></div>
  <div class="body">
    <main>
      ${sec(L.about, c.sum())}
      ${sec(L.experience, c.exp())}
      ${sec(L.projects, c.prj())}
    </main>
    <aside>
      ${sec(L.education, c.edu())}
      ${sec(L.skills, c.sk("dots"))}
      ${sec(L.languages, c.lg("rows"))}
      ${sec(L.certificates, c.crt())}
      ${sec(L.hobbies, c.hb())}
    </aside>
  </div>
</div>`;

// Classic 4 — Academic
T["classic-4"] = (c, L = c.L) => `
<div class="cv cv-c4">
  <header class="hd">
    <div><h1>${c.name}</h1><div class="pos">${c.pos}</div></div>
    ${c.ct("lines")}
  </header>
  ${sec(L.about, c.sum())}
  ${sec(L.experience, c.exp())}
  ${sec(L.education, c.edu())}
  ${sec(L.projects, c.prj())}
  ${sec(L.skills, c.sk("chips"))}
  ${sec(L.languages, c.lg("inline"))}
  ${sec(L.certificates, c.crt())}
  ${sec(L.hobbies, c.hb())}
</div>`;

// Classic 5 — Elegant
T["classic-5"] = (c, L = c.L) => `
<div class="cv cv-c5">
  <div class="frame">
    <header class="hd">
      ${c.hasPhoto ? c.ph : `<div class="mono">${c.ini}</div>`}
      <h1>${c.name}</h1><div class="pos">${c.pos}</div>
      <div class="orn"><span>&#10070;</span></div>
      ${c.ct("text")}
    </header>
    ${c.sum()}
    <div class="body">
      <div>
        ${sec(L.experience, c.exp())}
        ${sec(L.projects, c.prj())}
      </div>
      <div>
        ${sec(L.education, c.edu())}
        ${sec(L.skills, c.sk("dots"))}
        ${sec(L.languages, c.lg("rows"))}
        ${sec(L.certificates, c.crt())}
        ${sec(L.hobbies, c.hb())}
      </div>
    </div>
  </div>
</div>`;

// Minimal 1 — Clean
T["minimal-1"] = (c, L = c.L) => `
<div class="cv cv-n1">
  <header class="hd"><h1>${c.name}</h1><div class="pos">${c.pos}</div>${c.ct("text")}</header>
  ${sec(L.about, c.sum())}
  ${sec(L.experience, c.exp())}
  ${sec(L.education, c.edu())}
  ${sec(L.projects, c.prj())}
  ${sec(L.skills, c.sk("list"))}
  ${sec(L.languages, c.lg("inline"))}
  ${sec(L.certificates, c.crt())}
  ${sec(L.hobbies, c.hb())}
</div>`;

// Minimal 2 — Grid
T["minimal-2"] = (c, L = c.L) => `
<div class="cv cv-n2">
  <header class="hd">
    <div><h1>${c.name}</h1><div class="pos">${c.pos}</div></div>
    ${c.hasPhoto ? c.ph : ""}
  </header>
  ${sec(L.contact, c.ct("lines"))}
  ${sec(L.about, c.sum())}
  ${sec(L.experience, c.exp())}
  ${sec(L.education, c.edu())}
  ${sec(L.projects, c.prj())}
  ${sec(L.skills, c.sk("chips"))}
  ${sec(L.languages, c.lg("inline"))}
  ${sec(L.certificates, c.crt())}
  ${sec(L.hobbies, c.hb())}
</div>`;

// Minimal 3 — Mono
T["minimal-3"] = (c, L = c.L) => `
<div class="cv cv-n3">
  <header class="hd"><h1>${c.name}</h1><div class="pos">${c.pos}</div></header>
  <div class="body">
    <main>
      ${sec(L.about, c.sum())}
      ${sec(L.experience, c.exp())}
      ${sec(L.projects, c.prj())}
    </main>
    <aside>
      ${sec(L.contact, c.ct("lines"))}
      ${sec(L.skills, c.sk("chips"))}
      ${sec(L.education, c.edu())}
      ${sec(L.languages, c.lg("rows"))}
      ${sec(L.certificates, c.crt())}
      ${sec(L.hobbies, c.hb())}
    </aside>
  </div>
</div>`;

// Minimal 4 — Swiss
T["minimal-4"] = (c, L = c.L) => `
<div class="cv cv-n4">
  <header class="hd">
    <h1>${c.name2}</h1>
    <div class="hd-r"><div class="pos">${c.pos}</div>${c.ct("lines")}</div>
  </header>
  <div class="body">
    <main>
      ${sec(L.about, c.sum())}
      ${sec(L.experience, c.exp())}
      ${sec(L.projects, c.prj())}
    </main>
    <aside>
      ${sec(L.education, c.edu())}
      ${sec(L.skills, c.sk("list"))}
      ${sec(L.languages, c.lg("rows"))}
      ${sec(L.certificates, c.crt())}
      ${sec(L.hobbies, c.hb())}
    </aside>
  </div>
</div>`;

// Minimal 5 — Compact
T["minimal-5"] = (c, L = c.L) => `
<div class="cv cv-n5">
  <header class="hd"><h1>${c.name}</h1><div class="pos">${c.pos}</div>${c.ct("text")}</header>
  ${sec(L.about, c.sum())}
  ${sec(L.experience, c.exp())}
  ${sec(L.education, c.edu())}
  ${sec(L.skills, c.sk("cols"))}
  ${sec(L.projects, c.prj())}
  <div class="grid2">
    ${sec(L.languages, c.lg("inline"))}
    ${sec(L.certificates, c.crt())}
  </div>
  ${sec(L.hobbies, c.hb())}
</div>`;

/* ------------------------------------------------------------------ */
/*  CSS                                                                */
/* ------------------------------------------------------------------ */
const SERIF = "Merriweather,Georgia,'Times New Roman',serif";
const MONO = "'JetBrains Mono','IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace";

export const CV_TEMPLATES_CSS = `
.cv{width:794px;min-height:1122px;box-sizing:border-box;background:#fff;color:#1f2937;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.5;position:relative;overflow:hidden;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cv *,.cv *:before,.cv *:after{box-sizing:border-box;margin:0;padding:0}
.cv ul{padding-left:16px}.cv li{margin:2px 0}
.cv .ic{width:14px;height:14px;flex:none}
.cv .ct{display:flex;align-items:center;gap:8px;overflow-wrap:anywhere}
.cv span.ct{display:inline-flex}
.cv .ph{display:flex;align-items:center;justify-content:center;object-fit:cover;font-weight:700;overflow:hidden}
.cv .it{margin-bottom:12px;break-inside:avoid}.cv .it:last-child{margin-bottom:0}
.cv .it-h{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.cv .it-t{font-weight:700}
.cv .it-d{font-size:11.5px;white-space:nowrap;color:#6b7280}
.cv .it-s{font-size:12px;color:#4b5563}
.cv .it-x{margin-top:4px;font-size:12.5px}
.cv .row .it{display:grid;grid-template-columns:110px 1fr;gap:18px}
.cv .row .it-d{white-space:normal}
.cv .sk{margin-bottom:9px}.cv .sk:last-child{margin-bottom:0}
.cv .sk-r{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:7px}
.cv .sk-r:last-child{margin-bottom:0}
.cv .lv{font-size:11.5px;opacity:.75;text-align:right}
.cv .bar{height:5px;border-radius:3px;background:#e5e7eb;overflow:hidden;margin-top:4px}
.cv .bar i{display:block;height:100%;border-radius:3px;background:var(--a,#111)}
.cv .dots{display:inline-flex;gap:4px;flex:none}
.cv .dots i{width:8px;height:8px;border-radius:50%;background:#e5e7eb}
.cv .dots i.on{background:var(--a,#111)}
.cv .chips{display:flex;flex-wrap:wrap;gap:6px}
.cv .chip{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11.5px;background:#f3f4f6}
.cv .cols3{columns:3;column-gap:24px}.cv .cols3 li{break-inside:avoid}

/* ---------- Modern 1 ---------- */
.cv-m1{--a:#F97316;display:flex}
.cv-m1 aside{width:270px;flex:none;background:#1C1C1E;color:#E5E5E5;padding:40px 26px}
.cv-m1 aside .ph{width:132px;height:132px;border-radius:50%;margin:0 auto 30px;border:4px solid var(--a);background:#2C2C2E;color:#fff;font-size:42px}
.cv-m1 aside .s{margin-bottom:26px}
.cv-m1 aside .s-t{display:inline-block;color:#fff;font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding-bottom:6px;margin-bottom:14px;border-bottom:2px solid var(--a)}
.cv-m1 aside .ct{font-size:12px;margin-bottom:9px}.cv-m1 aside .ic{color:var(--a)}
.cv-m1 aside .bar{background:rgba(255,255,255,.12)}
.cv-m1 aside .chip{background:rgba(249,115,22,.16);color:#FDBA74}
.cv-m1 main{flex:1;padding:46px 40px}
.cv-m1 header{margin-bottom:30px}
.cv-m1 h1{font-size:36px;font-weight:800;line-height:1.1;color:#111;letter-spacing:-.01em}
.cv-m1 .pos{color:var(--a);font-weight:600;font-size:15px;margin-top:8px;letter-spacing:.03em}
.cv-m1 main .s{margin-bottom:24px}
.cv-m1 main .s-t{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:800;color:#111;margin-bottom:12px}
.cv-m1 main .s-t:before{content:'';width:22px;height:4px;border-radius:2px;background:var(--a)}
.cv-m1 .tl .it{position:relative;padding:0 0 4px 18px;border-left:2px solid #F1F1F1;margin-left:4px}
.cv-m1 .tl .it:before{content:'';position:absolute;left:-7px;top:4px;width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid var(--a)}
.cv-m1 main .it-d{color:var(--a);font-weight:600}

/* ---------- Modern 2 ---------- */
.cv-m2{--a:#F97316}
.cv-m2 .hd{display:flex;align-items:center;gap:26px;padding:42px 44px;background:linear-gradient(135deg,#EA580C,#F97316 55%,#FB923C);color:#fff}
.cv-m2 .ph{width:114px;height:114px;flex:none;border-radius:22px;border:4px solid rgba(255,255,255,.55);background:rgba(255,255,255,.18);color:#fff;font-size:38px}
.cv-m2 h1{font-size:36px;font-weight:800;line-height:1.1}
.cv-m2 .pos{font-size:15px;font-weight:500;margin-top:6px;opacity:.95}
.cv-m2 .cbar{background:#1C1C1E;color:#E5E5E5;padding:12px 44px;font-size:12px}
.cv-m2 .cbar .cts{display:flex;flex-wrap:wrap;gap:6px 22px}.cv-m2 .cbar .ic{color:#FB923C}
.cv-m2 .cols{display:grid;grid-template-columns:1fr 236px;gap:34px;padding:32px 44px 40px}
.cv-m2 .s{margin-bottom:24px}
.cv-m2 .s-t{color:var(--a);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;padding-bottom:6px;margin-bottom:12px;border-bottom:2px solid #FFE4D1}
.cv-m2 .chip{background:#FFF1E6;color:#C2410C;font-weight:600}
.cv-m2 .it-d{color:var(--a);font-weight:600}
.cv-m2 aside .it-h{display:block}.cv-m2 aside .it-d{white-space:normal}

/* ---------- Modern 3 ---------- */
.cv-m3{--a:#EA580C;padding:46px 54px}
.cv-m3 .hd{text-align:center;margin-bottom:26px}
.cv-m3 .ph{width:98px;height:98px;border-radius:50%;margin:0 auto 14px;background:#FFF1E6;color:var(--a);font-size:32px;box-shadow:0 0 0 4px #fff,0 0 0 6px var(--a)}
.cv-m3 h1{font-size:32px;font-weight:800;color:#111;letter-spacing:-.01em}
.cv-m3 .pos{color:var(--a);text-transform:uppercase;letter-spacing:.18em;font-size:12px;font-weight:700;margin-top:4px}
.cv-m3 .hd .cts{display:flex;justify-content:center;flex-wrap:wrap;gap:6px 18px;margin-top:14px;font-size:12px;color:#555}
.cv-m3 .ic{color:var(--a)}
.cv-m3 .sum{background:#FFF7F0;border-left:4px solid var(--a);padding:14px 18px;border-radius:0 10px 10px 0;margin-bottom:26px}
.cv-m3 .s{margin-bottom:24px}
.cv-m3 .s-t{display:flex;align-items:center;gap:12px;font-size:13.5px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#111;margin-bottom:14px}
.cv-m3 .s-t:after{content:'';flex:1;height:1px;background:#F3D3BE}
.cv-m3 .row .it-d{color:var(--a);font-weight:700;font-size:11.5px}
.cv-m3 .tl .it-b{position:relative;padding-left:18px;border-left:2px solid #FBE3D3}
.cv-m3 .tl .it-b:before{content:'';position:absolute;left:-6px;top:5px;width:10px;height:10px;border-radius:50%;background:var(--a)}
.cv-m3 .tl .it{margin-bottom:0;padding-bottom:14px}
.cv-m3 .grid2{display:grid;grid-template-columns:1fr 1fr;gap:34px}
.cv-m3 .chip{background:#fff;border:1.5px solid var(--a);color:var(--a);font-weight:600}
.cv-m3 .grid2 .it-h{display:block}

/* ---------- Modern 4 ---------- */
.cv-m4{--a:#F97316;display:grid;grid-template-columns:1fr 262px}
.cv-m4 main{padding:52px 38px 48px 50px}
.cv-m4 header{margin-bottom:30px}
.cv-m4 h1{font-size:42px;font-weight:800;line-height:1.02;color:#111;letter-spacing:-.02em}
.cv-m4 h1 .n2{color:var(--a)}
.cv-m4 .pos{font-size:15px;color:#555;margin-top:10px;font-weight:500}
.cv-m4 .ln{width:64px;height:5px;border-radius:3px;background:var(--a);margin-top:18px}
.cv-m4 main .s{margin-bottom:24px}
.cv-m4 main .s-t{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;color:#111;margin-bottom:12px}
.cv-m4 main .s-t:before{content:'';width:10px;height:10px;border-radius:3px;background:var(--a)}
.cv-m4 main .it{padding-bottom:12px;border-bottom:1px dashed #E5E7EB}.cv-m4 main .it:last-child{border:0;padding:0}
.cv-m4 main .it-s{color:var(--a);font-weight:600}
.cv-m4 aside{background:#FFF4EC;padding:52px 28px 40px}
.cv-m4 aside .ph{width:100%;aspect-ratio:1;border-radius:18px;background:#FFE1CC;color:var(--a);font-size:54px;margin-bottom:28px}
.cv-m4 aside .s{margin-bottom:24px}
.cv-m4 aside .s-t{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:var(--a);margin-bottom:12px}
.cv-m4 aside .ct{font-size:12px;margin-bottom:9px}
.cv-m4 aside .ic{width:26px;height:26px;padding:6px;border-radius:50%;background:var(--a);color:#fff}
.cv-m4 aside .dots i{background:#FBD5B8}.cv-m4 aside .dots i.on{background:var(--a)}
.cv-m4 aside .chip{background:#fff;color:#C2410C}
.cv-m4 aside .it-h{display:block}.cv-m4 aside .it-d{white-space:normal}

/* ---------- Modern 5 ---------- */
.cv-m5{--a:#F97316;--k:#18181B;background:#fff}
.cv-m5 .hd{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:44px 50px 78px;color:#fff;background:linear-gradient(115deg,var(--k) 0 64%,var(--a) 64% 100%);clip-path:polygon(0 0,100% 0,100% 76%,0 100%)}
.cv-m5 h1{font-size:36px;font-weight:800;line-height:1.1}
.cv-m5 .pos{color:var(--a);font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:.12em;margin:6px 0 16px}
.cv-m5 .hd .cts{display:grid;grid-template-columns:auto auto;gap:6px 22px;font-size:11.5px;color:#D4D4D8}
.cv-m5 .hd .ic{color:var(--a);width:13px;height:13px}
.cv-m5 .ph{width:132px;height:132px;flex:none;border-radius:50%;border:5px solid #fff;background:var(--k);color:#fff;font-size:42px}
.cv-m5 .body{display:grid;grid-template-columns:1.55fr 1fr;gap:18px;padding:0 44px 40px;margin-top:-14px}
.cv-m5 .s{background:#FAFAFA;border-top:4px solid var(--a);border-radius:14px;padding:18px 20px;margin-bottom:18px}
.cv-m5 .s-t{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--k);margin-bottom:12px}
.cv-m5 .it-d{color:var(--a);font-weight:600}
.cv-m5 .body > div:last-child .it-h{display:block}
.cv-m5 .body > div:last-child .it-d{white-space:normal}
.cv-m5 .chip{background:var(--k);color:#fff}

/* ---------- Classic 1 ---------- */
.cv-c1{--a:#1E3A8A;font-family:${SERIF};padding:56px 66px;color:#1f2937;font-size:12.5px}
.cv-c1 .hd{text-align:center;margin-bottom:26px}
.cv-c1 h1{font-size:30px;letter-spacing:.08em;text-transform:uppercase;color:var(--a);font-weight:700}
.cv-c1 .pos{font-style:italic;font-size:14.5px;color:#4b5563;margin-top:4px}
.cv-c1 .hd .cts{margin-top:14px;padding:8px 0;border-top:2px solid var(--a);border-bottom:1px solid var(--a);font-size:11.5px;display:flex;justify-content:center;flex-wrap:wrap;gap:4px 0}
.cv-c1 .hd .ct+.ct:before{content:'•';margin:0 10px;color:var(--a)}
.cv-c1 .s{margin-bottom:20px}
.cv-c1 .s-t{font-size:13px;text-transform:uppercase;letter-spacing:.16em;color:var(--a);font-weight:700;padding-bottom:4px;margin-bottom:10px;border-bottom:1px solid #CBD5E1}
.cv-c1 .it-s{font-style:italic}
.cv-c1 .it-d{font-style:italic}

/* ---------- Classic 2 ---------- */
.cv-c2{--a:#1E3A8A;display:flex;font-family:${SERIF};font-size:12.5px}
.cv-c2 aside{width:262px;flex:none;background:var(--a);color:#E0E7FF;padding:42px 26px}
.cv-c2 aside .ph{width:124px;height:124px;border-radius:50%;margin:0 auto 18px;border:3px solid #fff;background:#3554B0;color:#fff;font-size:38px}
.cv-c2 h1{color:#fff;font-size:23px;text-align:center;line-height:1.25}
.cv-c2 .pos{text-align:center;color:#C7D2FE;font-style:italic;margin:6px 0 28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.25)}
.cv-c2 aside .s{margin-bottom:24px}
.cv-c2 aside .s-t{color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:.16em;padding-bottom:6px;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,.3)}
.cv-c2 aside .ct{font-size:11.5px;margin-bottom:8px}
.cv-c2 aside .bar{background:rgba(255,255,255,.2)}.cv-c2 aside .bar i{background:#fff}
.cv-c2 main{flex:1;padding:46px 42px}
.cv-c2 main .s{margin-bottom:24px}
.cv-c2 main .s-t{font-size:18px;color:var(--a);font-weight:700;margin-bottom:12px;padding-bottom:6px;position:relative;border-bottom:1px solid #E2E8F0}
.cv-c2 main .s-t:after{content:'';position:absolute;left:0;bottom:-2px;width:48px;height:3px;background:var(--a)}
.cv-c2 main .it-d{color:var(--a);font-style:italic}
.cv-c2 main .it-s{font-style:italic}

/* ---------- Classic 3 ---------- */
.cv-c3{--a:#172554;--g:#C9A227;font-size:12.5px}
.cv-c3 .hd{display:flex;justify-content:space-between;align-items:center;gap:24px;background:var(--a);color:#fff;padding:34px 48px}
.cv-c3 .hd-l{display:flex;align-items:center;gap:20px}
.cv-c3 .ph{width:88px;height:88px;flex:none;border-radius:8px;border:2px solid var(--g);background:#1E3A8A;color:#fff;font-size:30px;font-family:${SERIF}}
.cv-c3 h1{font-family:${SERIF};font-size:28px;line-height:1.2}
.cv-c3 .pos{color:#E7D08A;text-transform:uppercase;letter-spacing:.2em;font-size:11.5px;margin-top:6px;font-weight:600}
.cv-c3 .hd .cts{font-size:11.5px;color:#DBEAFE}
.cv-c3 .hd .ct{flex-direction:row-reverse;justify-content:flex-start;text-align:right;margin-bottom:5px}
.cv-c3 .hd .ic{color:var(--g);width:13px;height:13px}
.cv-c3 .strip{height:5px;background:var(--g)}
.cv-c3 .body{display:grid;grid-template-columns:1fr 228px;gap:36px;padding:32px 48px 40px}
.cv-c3 .s{margin-bottom:24px}
.cv-c3 .s-t{display:inline-block;font-family:${SERIF};font-variant:small-caps;font-size:18px;color:var(--a);letter-spacing:.04em;padding-bottom:3px;margin-bottom:12px;border-bottom:2px solid var(--g)}
.cv-c3 .it-t{color:var(--a)}
.cv-c3 aside .it-h{display:block}.cv-c3 aside .it-d{white-space:normal}
.cv-c3 aside .dots i.on{background:var(--a)}

/* ---------- Classic 4 ---------- */
.cv-c4{--a:#1E3A8A;font-family:${SERIF};padding:56px 60px;font-size:12.5px}
.cv-c4 .hd{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding-bottom:18px;margin-bottom:26px;border-bottom:4px double var(--a)}
.cv-c4 h1{font-size:34px;color:var(--a);font-weight:400;line-height:1.1}
.cv-c4 .pos{font-family:Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.2em;font-size:11.5px;color:#64748B;margin-top:8px;font-weight:600}
.cv-c4 .hd .cts{text-align:right;font-size:11.5px;color:#334155;line-height:1.7}
.cv-c4 .s{display:grid;grid-template-columns:140px 1fr;gap:22px;margin-bottom:22px}
.cv-c4 .s-t{font-family:Inter,system-ui,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:var(--a);font-weight:700;text-align:right;padding-top:2px}
.cv-c4 .it-s{font-style:italic}
.cv-c4 .chip{background:#fff;border:1px solid #93A3C8;border-radius:4px;color:var(--a);font-family:Inter,system-ui,sans-serif}

/* ---------- Classic 5 ---------- */
.cv-c5{--a:#1E3A8A;padding:26px;font-size:12.5px}
.cv-c5 .frame{min-height:1070px;border:3px double var(--a);padding:42px 46px}
.cv-c5 .hd{text-align:center;margin-bottom:22px}
.cv-c5 .mono,.cv-c5 .ph{width:74px;height:74px;border-radius:50%;margin:0 auto 14px;border:1.5px solid var(--a);color:var(--a);font-family:${SERIF};font-size:26px;display:flex;align-items:center;justify-content:center;background:#fff}
.cv-c5 .ph{width:96px;height:96px}
.cv-c5 h1{font-family:${SERIF};font-size:28px;letter-spacing:.2em;text-transform:uppercase;font-weight:400;color:var(--a)}
.cv-c5 .pos{font-family:${SERIF};font-style:italic;color:#475569;margin-top:6px;font-size:14px}
.cv-c5 .orn{display:flex;align-items:center;gap:14px;margin:14px auto;max-width:360px;color:var(--a);font-size:12px}
.cv-c5 .orn:before,.cv-c5 .orn:after{content:'';flex:1;height:1px;background:#93A3C8}
.cv-c5 .hd .cts{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 0;font-size:11.5px;color:#334155}
.cv-c5 .hd .ct+.ct:before{content:'|';margin:0 10px;color:#93A3C8}
.cv-c5 .sum{text-align:center;font-family:${SERIF};font-style:italic;color:#334155;max-width:600px;margin:0 auto 26px}
.cv-c5 .body{display:grid;grid-template-columns:1.5fr 1fr;gap:34px}
.cv-c5 .s{margin-bottom:22px}
.cv-c5 .s-t{display:flex;align-items:center;gap:8px;font-size:12px;text-transform:uppercase;letter-spacing:.18em;color:var(--a);font-weight:700;margin-bottom:12px}
.cv-c5 .s-t:before{content:'';width:7px;height:7px;background:var(--a);transform:rotate(45deg)}
.cv-c5 .it-t{font-family:${SERIF}}
.cv-c5 .body > div:last-child .it-h{display:block}
.cv-c5 .body > div:last-child .it-d{white-space:normal}

/* ---------- Minimal 1 ---------- */
.cv-n1{--a:#111;padding:68px 76px;color:#222}
.cv-n1 .hd{margin-bottom:40px}
.cv-n1 h1{font-size:38px;font-weight:300;letter-spacing:-.02em;color:#111;line-height:1.1}
.cv-n1 .pos{font-size:16px;color:#6B7280;margin-top:6px}
.cv-n1 .hd .cts{display:flex;flex-wrap:wrap;gap:4px 0;margin-top:16px;font-size:12px;color:#6B7280}
.cv-n1 .hd .ct+.ct:before{content:'/';margin:0 12px;color:#D1D5DB}
.cv-n1 .s{margin-bottom:30px}
.cv-n1 .s-t{font-size:11px;text-transform:uppercase;letter-spacing:.22em;color:#9CA3AF;font-weight:600;margin-bottom:14px}
.cv-n1 .it-t{font-weight:600}
.cv-n1 .it{margin-bottom:16px}

/* ---------- Minimal 2 ---------- */
.cv-n2{--a:#111;padding:60px 62px;color:#222}
.cv-n2 .hd{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-bottom:34px}
.cv-n2 h1{font-size:34px;font-weight:700;letter-spacing:-.02em;color:#111;line-height:1.1}
.cv-n2 .pos{font-size:15px;color:#6B7280;margin-top:6px}
.cv-n2 .ph{width:86px;height:86px;border-radius:6px;filter:grayscale(1);background:#F3F4F6;color:#111;font-size:26px}
.cv-n2 .s{display:grid;grid-template-columns:150px 1fr;gap:20px;padding:18px 0;border-top:1px solid #E5E7EB}
.cv-n2 .s-t{font-size:11.5px;text-transform:uppercase;letter-spacing:.14em;color:#6B7280;font-weight:600;padding-top:2px}
.cv-n2 .s-b .cts{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;font-size:12.5px}
.cv-n2 .chip{border-radius:4px}

/* ---------- Minimal 3 ---------- */
.cv-n3{--a:#374151;padding:56px 56px;color:#1f2937}
.cv-n3 .hd{padding-bottom:22px;margin-bottom:28px;border-bottom:1px solid #E5E7EB}
.cv-n3 h1{font-family:${MONO};font-size:28px;font-weight:600;color:#111;letter-spacing:-.02em}
.cv-n3 .pos{font-family:${MONO};font-size:13px;color:#6B7280;margin-top:6px}
.cv-n3 .pos:before{content:'// '}
.cv-n3 .body{display:grid;grid-template-columns:1fr 226px;gap:34px}
.cv-n3 aside{border-left:1px solid #E5E7EB;padding-left:26px}
.cv-n3 .s{margin-bottom:26px}
.cv-n3 .s-t{font-family:${MONO};font-size:12.5px;font-weight:600;color:#111;margin-bottom:12px;text-transform:lowercase}
.cv-n3 .s-t:before{content:'# ';color:#9CA3AF}
.cv-n3 .it-d{font-family:${MONO};font-size:11px}
.cv-n3 .chip{font-family:${MONO};font-size:11px;background:#fff;border:1px solid #D1D5DB;border-radius:4px;padding:2px 8px}
.cv-n3 aside .ct{font-size:12px;margin-bottom:5px}
.cv-n3 aside .it-h{display:block}.cv-n3 aside .it-d{white-space:normal}

/* ---------- Minimal 4 ---------- */
.cv-n4{--a:#111;padding:60px 58px;color:#111}
.cv-n4 .hd{display:grid;grid-template-columns:1fr 250px;gap:24px;align-items:end;padding-bottom:22px;border-bottom:4px solid #111;margin-bottom:28px}
.cv-n4 h1{font-size:58px;font-weight:800;letter-spacing:-.045em;line-height:.92}
.cv-n4 h1 span{display:block}
.cv-n4 .hd-r{font-size:12px;color:#374151}
.cv-n4 .pos{font-weight:700;color:#111;font-size:13px;margin-bottom:8px}
.cv-n4 .body{display:grid;grid-template-columns:1fr 250px;gap:24px}
.cv-n4 .s{margin-bottom:26px}
.cv-n4 .s-t{font-size:10.5px;text-transform:uppercase;letter-spacing:.18em;font-weight:700;padding-top:6px;margin-bottom:12px;border-top:1px solid #111}
.cv-n4 .sum{font-size:15px;line-height:1.55;font-weight:500}
.cv-n4 aside .it-h{display:block}.cv-n4 aside .it-d{white-space:normal}

/* ---------- Minimal 5 ---------- */
.cv-n5{--a:#111;padding:42px 50px;font-size:12px;color:#222}
.cv-n5 .hd{text-align:center;margin-bottom:20px}
.cv-n5 h1{font-size:26px;font-weight:600;color:#111;letter-spacing:.02em}
.cv-n5 .pos{color:#4B5563;font-size:13px;margin-top:2px}
.cv-n5 .hd .cts{display:flex;justify-content:center;flex-wrap:wrap;gap:3px 0;margin-top:8px;font-size:11.5px;color:#4B5563}
.cv-n5 .hd .ct+.ct:before{content:'•';margin:0 9px;color:#9CA3AF}
.cv-n5 .s{margin-bottom:16px}
.cv-n5 .s-t{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#111;padding-bottom:3px;margin-bottom:8px;border-bottom:1px solid #111}
.cv-n5 .it{margin-bottom:9px}
.cv-n5 .it-x{font-size:12px;margin-top:2px}
.cv-n5 .grid2{display:grid;grid-template-columns:1fr 1fr;gap:28px}

@media print{
  @page{size:A4;margin:0}
  .cv{box-shadow:none!important;margin:0!important;transform:none!important;break-after:page}
}
`;

export const CV_TEMPLATE_CATEGORIES: CvTemplateCategory[] = [
  { id: "modern", name: "Modern", color: "#F97316" },
  { id: "classic", name: "Classic", color: "#1E3A8A" },
  { id: "minimal", name: "Minimal", color: "#27272A" },
];

export const CV_TEMPLATE_NAMES: Record<string, string> = {
  "modern-1": "Sidebar",
  "modern-2": "Gradient",
  "modern-3": "Timeline",
  "modern-4": "Split",
  "modern-5": "Geometric",
  "classic-1": "Traditional",
  "classic-2": "Navy",
  "classic-3": "Executive",
  "classic-4": "Academic",
  "classic-5": "Elegant",
  "minimal-1": "Clean",
  "minimal-2": "Grid",
  "minimal-3": "Mono",
  "minimal-4": "Swiss",
  "minimal-5": "Compact",
};

export const CV_TEMPLATE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "modern-1": {
    uz: "Qora yon panel va toʻq sariq urgʻular",
    kk: "Qara qaptal panel hám qızǵısh-sarı túsler",
    ru: "Тёмная боковая панель с яркими акцентами",
    en: "Dark sidebar layout with vivid orange highlights",
  },
  "modern-2": {
    uz: "Yorqin gradient sarlavha va zamonaviy ustunlar",
    kk: "Gradientli bas bet hám zamanagóy qatarlar",
    ru: "Градиентная шапка и выразительные карточки",
    en: "Vibrant gradient header with multi-column grid",
  },
  "modern-3": {
    uz: "Markazlashgan portret va vaqt chizigʻi (Timeline)",
    kk: "Oraylastırılǵan portret hám waqıt sızıǵı",
    ru: "Центрированный портрет и хронология событий",
    en: "Centered portrait header with timeline history",
  },
  "modern-4": {
    uz: "Oʻng panelli split tuzilma va ajratilgan profil",
    kk: "Oń qaptal panel hám bólisiwli profil",
    ru: "Разделённый макет со светлой правой панелью",
    en: "Split view with right accent panel",
  },
  "modern-5": {
    uz: "Geometrik sarlavha va alohida modul kartalar",
    kk: "Geometriyalıq sarlavha hám modul kartalar",
    ru: "Геометрическая шапка и модульные блоки",
    en: "Geometric header clip with modular card sections",
  },
  "classic-1": {
    uz: "Anʼanaviy bir ustunli rasmiy rezyume",
    kk: "Dástúriy bir qatarlı rásmiy rezyume",
    ru: "Традиционное одноколоночное строгое резюме",
    en: "Traditional single-column formal resume",
  },
  "classic-2": {
    uz: "Toʻq koʻk yon panelli korporativ uslub",
    kk: "Toq kók qaptal panelli korporativlik stil",
    ru: "Глубокая синяя боковая панель для корпораций",
    en: "Navy corporate sidebar design",
  },
  "classic-3": {
    uz: "Executive: koʻk va oltin chiziqli nufuzli dizayn",
    kk: "Executive: kók hám altın sızıqlı abıroylı dizayn",
    ru: "Executive: статусная шапка с золотой полосой",
    en: "Executive leadership layout with gold accent",
  },
  "classic-4": {
    uz: "Akademik: sarlavhalar chapda, matn oʻngda",
    kk: "Akademiyalıq: atamalar shepke, tekst ońǵa",
    ru: "Академический формат с левыми маркерами",
    en: "Academic structure with left-aligned headers",
  },
  "classic-5": {
    uz: "Nafis hoshiyali va monogrammali klassik dizayn",
    kk: "Nápis hoshiyalı hám monogrammalı klassikalıq",
    ru: "Изящная рамка с вензелем и симметрией",
    en: "Elegant double-framed layout with monogram",
  },
  "minimal-1": {
    uz: "Ultra toza bir ustunli skandinav minimalizmi",
    kk: "Taza hám ápiwayı skandinav minimalizmi",
    ru: "Предельно чистый скандинавский минимализм",
    en: "Ultra clean distraction-free single column",
  },
  "minimal-2": {
    uz: "Gorizontal chiziqli va aniq blokli toʻr (Grid)",
    kk: "Gorizontal sızıqlı hám anıq bloklı tor",
    ru: "Чёткая горизонтальная сетка с серыми разделителями",
    en: "Grid structure with horizontal rule dividers",
  },
  "minimal-3": {
    uz: "Dasturchilar va IT mutaxassislar uchun Monospace",
    kk: "IT qánigeleri ushın Monospace kod stili",
    ru: "Моноширинный хакерский шрифт для IT",
    en: "Developer monospace code aesthetics",
  },
  "minimal-4": {
    uz: "Swiss: Shveytsariya tipografikasi va yirik ism",
    kk: "Swiss: Shveycariya tipografiyası hám úlken at",
    ru: "Swiss: швейцарская типографика с крупным именем",
    en: "Swiss bold typographic focus",
  },
  "minimal-5": {
    uz: "Bir sahifaga zich sigʻadigan ixcham (Compact) dizayn",
    kk: "Bir betke sıyatuǵın yqsham dizayn",
    ru: "Компактный дизайн для гарантированного умещения в 1 страницу",
    en: "Compact one-page condensed layout",
  },
};

/** Normalize legacy "modern" | "classic" | "minimal" to specific default templates */
export function normalizeTemplateId(id?: string | null): string {
  if (!id) return "modern-1";
  if (id === "modern") return "modern-1";
  if (id === "classic") return "classic-1";
  if (id === "minimal") return "minimal-1";
  if (T[id]) return id;
  return "modern-1";
}

export function getCategoryForTemplate(id?: string | null): "modern" | "classic" | "minimal" {
  const normId = normalizeTemplateId(id);
  const cat = normId.split("-")[0];
  if (cat === "classic" || cat === "minimal") return cat;
  return "modern";
}

export function listTemplates(category?: "modern" | "classic" | "minimal"): CvTemplateItem[] {
  return Object.keys(T)
    .filter((id) => !category || id.startsWith(category + "-"))
    .map((id) => ({
      id,
      category: (id.split("-")[0] as "modern" | "classic" | "minimal") || "modern",
      name: CV_TEMPLATE_NAMES[id] || id,
    }));
}

export function renderCvTemplate(
  id: string,
  data: RawCvTemplateData,
  opts?: { labels?: Partial<CvTemplateLabels> }
): string {
  const normalizedId = normalizeTemplateId(id);
  const tpl = T[normalizedId] || T["modern-1"];
  return tpl(ctx(data, opts)).replace(/\n\s*/g, "");
}

export const CVTemplates = {
  render: renderCvTemplate,
  list: listTemplates,
  categories: CV_TEMPLATE_CATEGORIES,
  CSS: CV_TEMPLATES_CSS,
  FONTS_URL,
  LABELS: CV_TEMPLATE_LABELS,
  normalizeId: normalizeTemplateId,
  getCategory: getCategoryForTemplate,
};
