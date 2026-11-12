// DEV uchun: 1000 ta namunaviy CV, 50 ta kompaniya, 200 ta talab va 100 ta tayyor sessiya.
// AI chaqirilmaydi, ma'lumotlar soxta. Ishga tushirish: docs/LOAD-TEST.md.
import { createHash, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { PrismaClient, type Lang, type WorkType } from "@prisma/client";
import { buildSearchText } from "../../src/backend/cv/service";
import type { CvData } from "../../src/backend/cv/schema";
import { hashPassword } from "../../src/backend/auth/password";
import { assertDevDatabase } from "./guard";

assertDevDatabase();
const db = new PrismaClient();

const STUDENTS = 1000;
const COMPANIES = 50;
const VACANCIES_PER_COMPANY = 4;
const SESSIONS = { student: 60, company: 35, admin: 5 };
const OUT = process.argv[2] ?? "load-sessions.json";

// Bir xil tasodif: har ishga tushirishda bir xil ma'lumot.
let seed = 42;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const pick = <T>(items: readonly T[]) =>
  items[Math.floor(rand() * items.length)];
const some = <T>(items: readonly T[], min: number, max: number) =>
  [...items]
    .sort(() => rand() - 0.5)
    .slice(0, min + Math.floor(rand() * (max - min + 1)));

const SKILLS = [
  "React",
  "TypeScript",
  "JavaScript",
  "Python",
  "Django",
  "SQL",
  "PostgreSQL",
  "Excel",
  "1C",
  "Java",
  "Spring",
  "Figma",
  "Photoshop",
  "Git",
  "Docker",
  "Linux",
  "C#",
  ".NET",
  "PHP",
  "Laravel",
  "Node.js",
  "HTML",
  "CSS",
  "Marketing",
  "SMM",
  "Buxgalteriya",
  "Ingliz tili tarjima",
  "Power BI",
  "Flutter",
  "Kotlin",
] as const;
const LANGS = [
  "Ingliz tili",
  "Rus tili",
  "O'zbek tili",
  "Qoraqalpoq tili",
  "English",
  "Русский",
  "Inglis tili",
  "Nemis tili",
] as const;
const CITIES = [
  "Nukus",
  "Nókis",
  "Нукус",
  "Toshkent",
  "Xiva",
  "Urganch",
  "Samarqand",
  "Buxoro",
  "Qo'ng'irot",
  null,
] as const;
const WORK: WorkType[] = ["FULL_TIME", "PART_TIME", "REMOTE", "INTERNSHIP"];
const UNIS = [
  "Qoraqalpoq davlat universiteti",
  "TATU Nukus filiali",
  "Toshkent davlat iqtisodiyot universiteti",
  "Urganch davlat universiteti",
];
const ORGS = [
  "IT Park",
  "Nukus Soft",
  "Aral Tech",
  "Bank",
  "Davlat xizmatlari markazi",
  "Online do'kon",
];
const NAMES = [
  "Aziza",
  "Bekzod",
  "Gulnora",
  "Dilshod",
  "Jasur",
  "Malika",
  "Nodira",
  "Rustam",
  "Sardor",
  "Zarina",
  "Ayjamal",
  "Baxtiyar",
];
const SURNAMES = [
  "Karimova",
  "Qudaybergenov",
  "Seytmuratova",
  "Aliyev",
  "Tursunova",
  "Yusupov",
  "Ismoilov",
  "Saparova",
];
const LOCALES: Lang[] = ["kk", "uz", "ru", "en"];

function cvData(i: number): CvData {
  const skills = some(SKILLS, 2, 7);
  return {
    fullName: `${pick(NAMES)} ${pick(SURNAMES)}`,
    contact: {
      email: `load.student${i}@test.local`,
      phone: `+998 90 ${String(1000000 + i).slice(1)}`,
    },
    goal: `${skills[0]} bo'yicha ishlash`,
    location: pick(CITIES),
    education: [
      {
        institution: pick(UNIS),
        degree: "Bakalavr",
        field: pick(["Informatika", "Iqtisodiyot", "Dizayn", "Filologiya"]),
        startYear: String(2019 + Math.floor(rand() * 5)),
        endYear: null,
      },
    ],
    experience:
      rand() < 0.6
        ? [
            {
              organization: pick(ORGS),
              position: pick(["Stajyor", "Dasturchi", "Yordamchi", "Operator"]),
              startDate: "2024",
              endDate: null,
              description: `${skills.slice(0, 3).join(", ")} bilan loyiha ishlari.`,
            },
          ]
        : [],
    skills,
    languages: some(LANGS, 1, 3).map((name) => ({
      name,
      level: pick([null, "B1", "B2", "C1"]),
    })),
    certificates: rand() < 0.3 ? ["IELTS 6.5"] : [],
  };
}

function token() {
  const value = randomBytes(32).toString("base64url");
  return { value, hash: createHash("sha256").update(value).digest("hex") };
}

async function main() {
  console.log("Tozalash (faqat load bazasi)...");
  await db.$executeRawUnsafe(
    'TRUNCATE "AdminLog", "AiLog", "CvView", "Match", "Vacancy", "Company", "Cv", "EmailCode", "Session", "Setting", "User" CASCADE',
  );

  // argon2 sekin: bitta xesh hamma uchun (parol: load-parol-123).
  const passwordHash = await hashPassword("load-parol-123");
  const now = new Date();

  const students = Array.from({ length: STUDENTS }, (_, i) => ({
    id: `load_s_${i}`,
    email: `load.student${i}@test.local`,
    passwordHash,
    role: "STUDENT" as const,
    emailVerifiedAt: now,
    locale: pick(LOCALES),
    createdAt: new Date(now.getTime() - i * 60_000),
  }));
  const companies = Array.from({ length: COMPANIES }, (_, i) => ({
    id: `load_c_${i}`,
    email: `load.company${i}@test.local`,
    passwordHash,
    role: "COMPANY" as const,
    emailVerifiedAt: now,
    createdAt: new Date(now.getTime() - i * 3_600_000),
  }));
  const admins = Array.from({ length: SESSIONS.admin }, (_, i) => ({
    id: `load_a_${i}`,
    email: `load.admin${i}@test.local`,
    passwordHash,
    role: "ADMIN" as const,
    emailVerifiedAt: now,
  }));
  await db.user.createMany({ data: [...students, ...companies, ...admins] });

  const cvs = students.map((student, i) => {
    const data = cvData(i);
    const saved = i % 20 !== 0; // 5% hech saqlanmagan
    return {
      id: `load_cv_${i}`,
      userId: student.id,
      language: pick(LOCALES),
      data,
      missingFields: [],
      isVisible: saved && i % 5 !== 0, // ~76% ochiq
      savedAt: saved ? new Date(now.getTime() - i * 30_000) : null,
      skills: data.skills.map((s: string) => s.toLowerCase()),
      languages: data.languages.map((l: { name: string }) =>
        l.name.toLowerCase(),
      ),
      location: data.location,
      workTypes: some(WORK, 0, 2),
      searchText: buildSearchText(data),
    };
  });
  await db.cv.createMany({ data: cvs });

  await db.company.createMany({
    data: companies.map((user, i) => ({
      id: `load_co_${i}`,
      userId: user.id,
      name: `Yuklama kompaniya ${i}`,
      country: "Oʻzbekiston",
      industry: pick(["IT", "Bank", "Savdo", "Ta'lim"]),
      size: pick(["1-10", "11-50", "51-200"]),
      contactPerson: `${pick(NAMES)} ${pick(SURNAMES)}`,
      // 40 tasi tasdiqlangan, 10 tasi kutmoqda. Obuna YO'Q: saralash AI siz (kalit so'z) ishlaydi.
      approval: i < 40 ? "APPROVED" : "PENDING",
      approvedAt: i < 40 ? now : null,
      subscriptionUntil: null,
    })),
  });

  const vacancies = companies.flatMap((_, ci) =>
    Array.from({ length: VACANCIES_PER_COMPANY }, (_, vi) => {
      const skills = some(SKILLS, 2, 4);
      return {
        id: `load_v_${ci}_${vi}`,
        companyId: `load_co_${ci}`,
        title: `${skills[0]} mutaxassisi`,
        rawText:
          vi % 2
            ? `Bizga ${skills.join(", ")} biladigan xodim kerak. ${pick(CITIES) ?? ""}`
            : null,
        skills,
        languages: rand() < 0.4 ? [pick(["Ingliz tili", "Rus tili"])] : [],
        minExperienceYears: rand() < 0.3 ? 1 : null,
        location: rand() < 0.5 ? "Nukus" : null,
        workType: rand() < 0.5 ? pick(WORK) : null,
      };
    }),
  );
  await db.vacancy.createMany({ data: vacancies });

  // Tayyor sessiyalar: yuklama sinovi login rate-limit iga urilmasin.
  const expiresAt = new Date(now.getTime() + 24 * 3_600_000);
  const sessions: Array<{
    role: string;
    cookie: string;
    vacancyId?: string;
    cvId?: string;
  }> = [];
  const rows: Array<{ userId: string; tokenHash: string; expiresAt: Date }> =
    [];
  const add = (role: string, userId: string, extra: object = {}) => {
    const t = token();
    rows.push({ userId, tokenHash: t.hash, expiresAt });
    sessions.push({ role, cookie: `jumis_session=${t.value}`, ...extra });
  };
  for (let i = 0; i < SESSIONS.student; i++)
    add("student", students[i * 7 + 1].id);
  for (let i = 0; i < SESSIONS.company; i++)
    add("company", companies[i % 40].id, {
      vacancyId: `load_v_${i % 40}_0`,
      cvId: cvs.find((cv, k) => k > i && cv.isVisible)!.id,
    });
  for (let i = 0; i < SESSIONS.admin; i++) add("admin", admins[i].id);
  await db.session.createMany({ data: rows });

  writeFileSync(OUT, JSON.stringify(sessions, null, 2));
  console.log(
    `Tayyor: ${STUDENTS} talaba (${cvs.filter((c) => c.isVisible).length} ochiq CV), ${COMPANIES} kompaniya, ${vacancies.length} talab, ${sessions.length} sessiya → ${OUT}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
