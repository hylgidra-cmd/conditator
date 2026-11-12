/*
 * Dashboard uchun namunaviy (mock) maʼlumotlar. TODO: real maʼlumot — bazadan olinadi.
 * Lavozim va tavsiflar oʻzbekcha maʼlumot sifatida saqlanadi (UI matnlari esa messages/ da).
 * Kompaniyalar nomi oʻylab topilmagan: faqat soha va shahar koʻrsatiladi.
 */

export const ROLES = ["candidate", "employer"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export const CITIES = [
  "tashkent",
  "samarkand",
  "bukhara",
  "andijan",
  "namangan",
  "fergana",
  "nukus",
] as const;
export type City = (typeof CITIES)[number];

export const JOB_TYPES = ["full", "part", "remote", "intern"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const CATEGORIES = [
  "marketing",
  "design",
  "pm",
  "business",
  "graphic",
  "web",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type VacancyStatus = "active" | "paused" | "closed";

export type Vacancy = {
  id: string;
  title: string;
  /** Kompaniya nomi emas, soha tavsifi. */
  company: string;
  city: City;
  type: JobType;
  category: Category;
  salaryFrom: number;
  salaryTo: number;
  /** ISO sana. */
  posted: string;
  /** Nomzod profiliga moslik, %. */
  match: number;
  /** Ish beruvchi koʻrinishi: arizalar soni va holat. */
  applicants: number;
  status: VacancyStatus;
};

export const VACANCIES: Vacancy[] = [
  {
    id: "v1",
    title: "UI/UX dizayner",
    company: "IT startap",
    city: "tashkent",
    type: "full",
    category: "design",
    salaryFrom: 8_000_000,
    salaryTo: 12_000_000,
    posted: "2026-10-24T09:00:00Z",
    match: 92,
    applicants: 34,
    status: "active",
  },
  {
    id: "v2",
    title: "Frontend dasturchi (React)",
    company: "Fintex kompaniyasi",
    city: "tashkent",
    type: "remote",
    category: "web",
    salaryFrom: 12_000_000,
    salaryTo: 18_000_000,
    posted: "2026-10-23T09:00:00Z",
    match: 81,
    applicants: 57,
    status: "active",
  },
  {
    id: "v3",
    title: "SMM mutaxassisi",
    company: "Chakana savdo tarmogʻi",
    city: "samarkand",
    type: "full",
    category: "marketing",
    salaryFrom: 5_000_000,
    salaryTo: 7_000_000,
    posted: "2026-10-22T09:00:00Z",
    match: 76,
    applicants: 21,
    status: "active",
  },
  {
    id: "v4",
    title: "Loyiha menejeri",
    company: "Qurilish kompaniyasi",
    city: "bukhara",
    type: "full",
    category: "pm",
    salaryFrom: 9_000_000,
    salaryTo: 13_000_000,
    posted: "2026-10-20T09:00:00Z",
    match: 68,
    applicants: 12,
    status: "paused",
  },
  {
    id: "v5",
    title: "Grafik dizayner",
    company: "Reklama agentligi",
    city: "andijan",
    type: "part",
    category: "graphic",
    salaryFrom: 4_000_000,
    salaryTo: 6_000_000,
    posted: "2026-10-19T09:00:00Z",
    match: 73,
    applicants: 18,
    status: "active",
  },
  {
    id: "v6",
    title: "Biznes tahlilchi",
    company: "Bank sohasi",
    city: "tashkent",
    type: "full",
    category: "business",
    salaryFrom: 10_000_000,
    salaryTo: 15_000_000,
    posted: "2026-10-17T09:00:00Z",
    match: 64,
    applicants: 40,
    status: "active",
  },
  {
    id: "v7",
    title: "Marketing amaliyotchisi",
    company: "Taʼlim markazi",
    city: "namangan",
    type: "intern",
    category: "marketing",
    salaryFrom: 2_500_000,
    salaryTo: 3_500_000,
    posted: "2026-10-15T09:00:00Z",
    match: 70,
    applicants: 9,
    status: "closed",
  },
  {
    id: "v8",
    title: "Backend dasturchi (Node.js)",
    company: "Logistika kompaniyasi",
    city: "fergana",
    type: "remote",
    category: "web",
    salaryFrom: 11_000_000,
    salaryTo: 16_000_000,
    posted: "2026-10-14T09:00:00Z",
    match: 59,
    applicants: 26,
    status: "active",
  },
];

export type CandidateAppStatus =
  "sent" | "viewed" | "interview" | "offer" | "rejected";
export type EmployerAppStatus =
  "new" | "review" | "interview" | "offer" | "rejected";

export type CandidateApplication = {
  id: string;
  vacancyId: string;
  applied: string;
  status: CandidateAppStatus;
};

export const CANDIDATE_APPLICATIONS: CandidateApplication[] = [
  {
    id: "a1",
    vacancyId: "v1",
    applied: "2026-10-24T11:20:00Z",
    status: "interview",
  },
  {
    id: "a2",
    vacancyId: "v2",
    applied: "2026-10-23T08:10:00Z",
    status: "viewed",
  },
  {
    id: "a3",
    vacancyId: "v3",
    applied: "2026-10-22T14:45:00Z",
    status: "sent",
  },
  {
    id: "a4",
    vacancyId: "v5",
    applied: "2026-10-19T10:00:00Z",
    status: "offer",
  },
  {
    id: "a5",
    vacancyId: "v6",
    applied: "2026-10-18T07:30:00Z",
    status: "rejected",
  },
];

export type EmployerApplication = {
  id: string;
  name: string;
  initials: string;
  vacancyId: string;
  applied: string;
  match: number;
  experience: number;
  status: EmployerAppStatus;
};

/** Namunaviy nomzodlar (haqiqiy odamlar emas). */
export const EMPLOYER_APPLICATIONS: EmployerApplication[] = [
  {
    id: "e1",
    name: "Madina Karimova",
    initials: "MK",
    vacancyId: "v1",
    applied: "2026-10-25T09:15:00Z",
    match: 94,
    experience: 3,
    status: "new",
  },
  {
    id: "e2",
    name: "Jasur Toshmatov",
    initials: "JT",
    vacancyId: "v2",
    applied: "2026-10-25T06:40:00Z",
    match: 88,
    experience: 5,
    status: "interview",
  },
  {
    id: "e3",
    name: "Nilufar Yusupova",
    initials: "NY",
    vacancyId: "v3",
    applied: "2026-10-24T12:05:00Z",
    match: 79,
    experience: 2,
    status: "review",
  },
  {
    id: "e4",
    name: "Bekzod Aliyev",
    initials: "BA",
    vacancyId: "v2",
    applied: "2026-10-23T15:30:00Z",
    match: 72,
    experience: 4,
    status: "offer",
  },
  {
    id: "e5",
    name: "Shahzoda Ergasheva",
    initials: "SE",
    vacancyId: "v5",
    applied: "2026-10-22T10:00:00Z",
    match: 65,
    experience: 1,
    status: "rejected",
  },
  {
    id: "e6",
    name: "Akmal Rasulov",
    initials: "AR",
    vacancyId: "v6",
    applied: "2026-10-21T08:20:00Z",
    match: 83,
    experience: 6,
    status: "new",
  },
];

export type Interview = {
  id: string;
  /** Nomzod uchun: vakansiya; ish beruvchi uchun: nomzod ismi. */
  vacancyId: string;
  with?: string;
  at: string;
  format: "online" | "office";
};

export const INTERVIEWS: Record<Role, Interview[]> = {
  candidate: [
    { id: "i1", vacancyId: "v1", at: "2026-10-28T06:00:00Z", format: "online" },
    { id: "i2", vacancyId: "v5", at: "2026-10-30T09:30:00Z", format: "office" },
  ],
  employer: [
    {
      id: "i3",
      vacancyId: "v2",
      with: "Jasur Toshmatov",
      at: "2026-10-27T05:00:00Z",
      format: "online",
    },
    {
      id: "i4",
      vacancyId: "v1",
      with: "Madina Karimova",
      at: "2026-10-28T08:00:00Z",
      format: "office",
    },
    {
      id: "i5",
      vacancyId: "v6",
      with: "Akmal Rasulov",
      at: "2026-10-29T10:30:00Z",
      format: "online",
    },
  ],
};

/** Profil toʻliqligi: kalitlar i18n da. */
export type ProfileStepKey =
  | "personal"
  | "education"
  | "experience"
  | "skills"
  | "languages"
  | "resume"
  | "company"
  | "logo"
  | "about"
  | "contacts"
  | "firstVacancy";

export const PROFILE_STEPS: Record<
  Role,
  { key: ProfileStepKey; done: boolean }[]
> = {
  candidate: [
    { key: "personal", done: true },
    { key: "education", done: true },
    { key: "experience", done: true },
    { key: "skills", done: false },
    { key: "languages", done: true },
    { key: "resume", done: false },
  ],
  employer: [
    { key: "company", done: true },
    { key: "logo", done: false },
    { key: "about", done: true },
    { key: "contacts", done: true },
    { key: "firstVacancy", done: true },
  ],
};

export type StatKey =
  | "applications"
  | "interviews"
  | "views"
  | "saved"
  | "activeVacancies"
  | "newApplications"
  | "avgMatch";

export const STATS: Record<
  Role,
  { key: StatKey; value: number; suffix?: "%"; delta: number }[]
> = {
  candidate: [
    { key: "applications", value: 12, delta: 3 },
    { key: "interviews", value: 2, delta: 1 },
    { key: "views", value: 148, delta: 24 },
    { key: "saved", value: 9, delta: 0 },
  ],
  employer: [
    { key: "activeVacancies", value: 6, delta: 1 },
    { key: "newApplications", value: 42, delta: 12 },
    { key: "interviews", value: 8, delta: 2 },
    { key: "avgMatch", value: 78, suffix: "%", delta: 4 },
  ],
};

export const NOTIFICATIONS = {
  candidate: [
    { key: "interview", unread: true },
    { key: "viewed", unread: true },
    { key: "match", unread: false },
  ],
  employer: [
    { key: "newApplication", unread: true },
    { key: "interview", unread: true },
    { key: "expiring", unread: false },
  ],
} as const satisfies Record<Role, readonly { key: string; unread: boolean }[]>;

export const PERSON: Record<Role, { name: string; initials: string }> = {
  candidate: { name: "Madina Karimova", initials: "MK" },
  employer: { name: "HR menejer", initials: "HR" },
};

export function vacancyById(id: string) {
  return VACANCIES.find((v) => v.id === id);
}

/** 5000000 → "5 000 000" (boʻlinmas boʻshliq bilan, qator uzilmaydi). */
export function formatSom(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
