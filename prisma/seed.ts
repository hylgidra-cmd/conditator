// Seed: admin akkaunt va boshlang'ich sozlamalar.
// Admin email va paroli faqat .env dan olinadi (ADMIN_EMAIL, ADMIN_PASSWORD), kodda yo'q.
// Ishga tushirish: npm run db:seed (Docker'da migrate xizmati avtomatik bajaradi).
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { hashPassword } from "../src/backend/auth/password";

const db = new PrismaClient();

const adminEmail = z.email().transform((value) => value.trim().toLowerCase());
const adminPassword = z.string().min(12, "kamida 12 belgi bo'lishi kerak");

const DEFAULT_SETTINGS: Record<string, string> = {
  monthlyAiLimitUsd: process.env.AI_MONTHLY_LIMIT_USD ?? "50",
};

async function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    // Mavjud qiymat (admin o'zgartirgan bo'lishi mumkin) ustiga yozilmaydi.
    await db.setting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }
  console.log(`Sozlamalar: ${Object.keys(DEFAULT_SETTINGS).join(", ")}`);
}

async function seedAdmin() {
  if (!process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD) {
    console.warn(
      "ADMIN_EMAIL va ADMIN_PASSWORD .env da yo'q: admin yaratilmadi.",
    );
    return;
  }

  const parsedEmail = adminEmail.safeParse(process.env.ADMIN_EMAIL);
  if (!parsedEmail.success)
    throw new Error("Admin sozlamasi noto'g'ri: ADMIN_EMAIL email emas");
  const email = parsedEmail.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Parol ataylab qayta yozilmaydi: seed qayta ishga tushganda admin o'zgartirgan parol saqlanib qoladi.
    // Shuning uchun admin yaratilgach ADMIN_PASSWORD ni .env dan o'chirish mumkin.
    if (existing.role !== "ADMIN" || existing.status !== "ACTIVE") {
      await db.user.update({
        where: { email },
        data: { role: "ADMIN", status: "ACTIVE" },
      });
      console.log(`Admin huquqi berildi: ${email}`);
      return;
    }
    console.log(`Admin allaqachon mavjud: ${email}`);
    return;
  }

  const parsedPassword = adminPassword.safeParse(process.env.ADMIN_PASSWORD);
  if (!parsedPassword.success)
    throw new Error(
      `Admin sozlamasi noto'g'ri: ADMIN_PASSWORD ${parsedPassword.error.issues[0]?.message}`,
    );
  const password = parsedPassword.data;

  await db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      consentAt: new Date(),
    },
  });
  console.log(`Admin yaratildi: ${email}`);
}

// MVP demo akkauntlari (buyurtmachi so'rovi, 2026-10-26). Parollar ataylab oddiy va kodda:
// faqat namoyish uchun. Haqiqiy foydalanuvchilar kelishidan oldin o'chiring yoki parollarni almashtiring.
const DEMO_USERS = [
  { email: "admin@gmail.com", password: "admin1234", role: "ADMIN" },
  { email: "talaba@gmail.com", password: "talaba1234", role: "STUDENT" },
  { email: "biznes@gmail.com", password: "biznes1234", role: "COMPANY" },
] as const;

async function seedDemoUsers() {
  for (const demo of DEMO_USERS) {
    const existing = await db.user.findUnique({ where: { email: demo.email } });
    if (existing) {
      // Parol qayta yozilmaydi (foydalanuvchi o'zgartirgan bo'lishi mumkin).
      console.log(`Demo akkaunt mavjud: ${demo.email}`);
      continue;
    }
    const now = new Date();
    await db.user.create({
      data: {
        email: demo.email,
        passwordHash: await hashPassword(demo.password),
        role: demo.role,
        emailVerifiedAt: now,
        consentAt: now,
        ...(demo.role === "COMPANY"
          ? {
              company: {
                create: {
                  name: "Demo biznes",
                  approval: "APPROVED",
                  approvedAt: now,
                  // Obuna 1 yil: AI saralash ham ishlaydi.
                  subscriptionUntil: new Date(
                    now.getTime() + 365 * 24 * 60 * 60_000,
                  ),
                },
              },
            }
          : {}),
      },
    });
    console.log(`Demo akkaunt yaratildi: ${demo.email} (${demo.role})`);
  }
}

const DEMO_COMPANIES = [
  {
    email: "firma1@gmail.com",
    password: "firma1234",
    company: {
      name: "Qaraqalpaq IT Park",
      country: "O'zbekiston, Qaraqalpaqstan, Nukus",
      industry: "IT va dasturlash",
      size: "11-50",
      contactPerson: "Azamat Yusupov",
    },
    vacancy: {
      title: "Frontend Developer (React / Next.js)",
      rawText:
        "React, Next.js va TypeScript bo'yicha kamida 1 yillik tajribaga ega Frontend dasturchi kerak. Tailwind CSS va REST API bilan ishlash ko'nikmasi talab qilinadi.",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      languages: ["uz", "kk", "ru"],
      minExperienceYears: 1,
      location: "Nukus, Qaraqalpaqstan",
      workType: "FULL_TIME" as const,
      salaryFrom: 5000000,
      salaryTo: 10000000,
    },
  },
  {
    email: "firma2@gmail.com",
    password: "firma1234",
    company: {
      name: "Aral Digital Studio",
      country: "O'zbekiston, Qaraqalpaqstan, Nukus",
      industry: "Dizayn va marketing",
      size: "1-10",
      contactPerson: "Dilnoza Karimova",
    },
    vacancy: {
      title: "UI/UX Designer",
      rawText:
        "Veb va mobil ilovalar uchun zamonaviy interfeyslar yaratish. Figma va Design System bo'yicha portfolio bo'lishi shart.",
      skills: ["Figma", "UI/UX", "Prototyping", "Design System"],
      languages: ["uz", "ru"],
      minExperienceYears: 1,
      location: "Nukus (Masofaviy)",
      workType: "REMOTE" as const,
      salaryFrom: 4000000,
      salaryTo: 8000000,
    },
  },
  {
    email: "firma3@gmail.com",
    password: "firma1234",
    company: {
      name: "UzTech Solutions",
      country: "O'zbekiston, Toshkent",
      industry: "Dasturiy ta'minot",
      size: "51-200",
      contactPerson: "Sardorbek Alimov",
    },
    vacancy: {
      title: "Backend Node.js Developer",
      rawText:
        "Node.js, PostgreSQL va Prisma ORM bilan yuqori yuklamali API lar yozish. Docker va Git tajribasi ustunlik beradi.",
      skills: ["Node.js", "PostgreSQL", "TypeScript", "Prisma"],
      languages: ["uz", "ru", "en"],
      minExperienceYears: 2,
      location: "Toshkent, Chilonzor",
      workType: "FULL_TIME" as const,
      salaryFrom: 8000000,
      salaryTo: 15000000,
    },
  },
  {
    email: "firma4@gmail.com",
    password: "firma1234",
    company: {
      name: "Turon FinTech",
      country: "O'zbekiston, Toshkent",
      industry: "Moliya va IT",
      size: "201-1000",
      contactPerson: "Jasur Toshmatov",
    },
    vacancy: {
      title: "Data Analyst (SQL / Python)",
      rawText:
        "Ma'lumotlar bazasi bilan ishlash, SQL so'rovlar tuzish, Python va Power BI da hisobotlar tayyorlash.",
      skills: ["SQL", "Python", "Power BI", "Excel"],
      languages: ["uz", "en"],
      minExperienceYears: 1,
      location: "Toshkent, Yunusobod",
      workType: "FULL_TIME" as const,
      salaryFrom: 7000000,
      salaryTo: 12000000,
    },
  },
  {
    email: "firma5@gmail.com",
    password: "firma1234",
    company: {
      name: "Orol Agro Tech",
      country: "O'zbekiston, Qaraqalpaqstan, Nukus",
      industry: "Agrotech",
      size: "11-50",
      contactPerson: "Berdaq Qurbanov",
    },
    vacancy: {
      title: "SMM & Digital Marketing Manager",
      rawText:
        "Ijtimoiy tarmoqlarni yuritish, kontent reja tuzish va target reklama sozlash. Qaraqalpaq va o'zbek tillarini bilish zarur.",
      skills: ["SMM", "Targeting", "Copywriting", "Instagram"],
      languages: ["kk", "uz"],
      minExperienceYears: 0,
      location: "Nukus, Qaraqalpaqstan",
      workType: "PART_TIME" as const,
      salaryFrom: 3000000,
      salaryTo: 5000000,
    },
  },
] as const;

const DEMO_STUDENT_PROFILES = [
  {
    name: "Madiyar Doshmanov",
    title: "Frontend Developer",
    skills: ["React", "Next.js", "TypeScript"],
    location: "Nukus",
  },
  {
    name: "Aysuluw Tursınbaeva",
    title: "UI/UX Designer",
    skills: ["Figma", "UI/UX", "Adobe XD"],
    location: "Nukus",
  },
  {
    name: "Javohir Rahimov",
    title: "Backend Developer",
    skills: ["Node.js", "PostgreSQL", "Docker"],
    location: "Toshkent",
  },
  {
    name: "Madina Karimova",
    title: "Data Analyst",
    skills: ["Python", "SQL", "Power BI"],
    location: "Toshkent",
  },
  {
    name: "Timur Bekmuratov",
    title: "Full-Stack Developer",
    skills: ["React", "Node.js", "TypeScript"],
    location: "Nukus",
  },
  {
    name: "Zulfiya Qodirova",
    title: "SMM Manager",
    skills: ["SMM", "Targeting", "Copywriting"],
    location: "Nukus",
  },
  {
    name: "Bobur Xolmatov",
    title: "Python Developer",
    skills: ["Python", "Django", "PostgreSQL"],
    location: "Samarqand",
  },
  {
    name: "Gulnora Saparbaeva",
    title: "QA Engineer",
    skills: ["Manual QA", "Playwright", "Postman"],
    location: "Nukus",
  },
  {
    name: "Shahzod Ismoilov",
    title: "Mobile Developer",
    skills: ["Flutter", "Dart", "Firebase"],
    location: "Toshkent",
  },
  {
    name: "Dilafruz Umarova",
    title: "Graphic Designer",
    skills: ["Photoshop", "Illustrator", "Figma"],
    location: "Buxoro",
  },
  {
    name: "Nurlan Joldasbaev",
    title: "React Developer",
    skills: ["React", "JavaScript", "Tailwind CSS"],
    location: "Nukus",
  },
  {
    name: "Sevara Rustamova",
    title: "Project Manager",
    skills: ["Agile", "Scrum", "Jira"],
    location: "Toshkent",
  },
  {
    name: "Otabek Nurmatov",
    title: "DevOps Engineer",
    skills: ["Linux", "Docker", "CI/CD"],
    location: "Toshkent",
  },
  {
    name: "Kamola Abdullaeva",
    title: "Frontend Intern",
    skills: ["HTML", "CSS", "JavaScript"],
    location: "Nukus",
  },
  {
    name: "Alisher Muminov",
    title: "Java Developer",
    skills: ["Java", "Spring Boot", "SQL"],
    location: "Andijon",
  },
  {
    name: "Malika Ergasheva",
    title: "Digital Marketer",
    skills: ["SEO", "Google Ads", "SMM"],
    location: "Toshkent",
  },
  {
    name: "Baxtiyar Reymov",
    title: "Node.js Developer",
    skills: ["Node.js", "Express", "MongoDB"],
    location: "Nukus",
  },
  {
    name: "Nigora Sobirova",
    title: "HR Specialist",
    skills: ["Recruiting", "Interviewing", "HR"],
    location: "Toshkent",
  },
  {
    name: "Sanjar Tursunov",
    title: "PHP / Laravel Developer",
    skills: ["PHP", "Laravel", "MySQL"],
    location: "Farg'ona",
  },
  {
    name: "Dinara Allambergenova",
    title: "Content Creator",
    skills: ["Copywriting", "Reels", "SMM"],
    location: "Nukus",
  },
] as const;

async function seedDemoCompaniesAndVacancies() {
  const now = new Date();
  const subUntil = new Date(now.getTime() + 365 * 24 * 60 * 60_000);
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60_000);

  for (const item of DEMO_COMPANIES) {
    let user = await db.user.findUnique({
      where: { email: item.email },
      include: { company: { include: { vacancies: true } } },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: item.email,
          passwordHash: await hashPassword(item.password),
          role: "COMPANY",
          emailVerifiedAt: now,
          consentAt: now,
          company: {
            create: {
              ...item.company,
              approval: "APPROVED",
              approvedAt: now,
              subscriptionUntil: subUntil,
            },
          },
        },
        include: { company: { include: { vacancies: true } } },
      });
      console.log(`Demo firma yaratildi: ${item.email}`);
    }

    if (user.company && user.company.vacancies.length === 0) {
      await db.vacancy.create({
        data: {
          companyId: user.company.id,
          title: item.vacancy.title,
          rawText: item.vacancy.rawText,
          skills: [...item.vacancy.skills],
          languages: [...item.vacancy.languages],
          minExperienceYears: item.vacancy.minExperienceYears,
          location: item.vacancy.location,
          workType: item.vacancy.workType,
          salaryFrom: item.vacancy.salaryFrom,
          salaryTo: item.vacancy.salaryTo,
          currency: "UZS",
          status: "ACTIVE",
          expiresAt,
        },
      });
      console.log(`Demo vakansiya yaratildi: ${item.vacancy.title}`);
    }
  }
}

async function seedDemoStudents() {
  const now = new Date();
  const passwordHash = await hashPassword("student1234");

  for (let i = 0; i < DEMO_STUDENT_PROFILES.length; i++) {
    const profile = DEMO_STUDENT_PROFILES[i];
    const email = `student${i + 1}@gmail.com`;
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) continue;

    await db.user.create({
      data: {
        email,
        passwordHash,
        role: "STUDENT",
        emailVerifiedAt: now,
        consentAt: now,
        cvs: {
          create: {
            title: profile.title,
            isVisible: true,
            savedAt: now,
            language: "uz",
            skills: [...profile.skills],
            languages: ["uz", "ru"],
            location: profile.location,
            workTypes: ["FULL_TIME"],
            searchText:
              `${profile.title} ${profile.skills.join(" ")} ${profile.location}`.toLowerCase(),
            data: {
              fullName: profile.name,
              email,
              location: profile.location,
              desiredRole: profile.title,
              skills: [...profile.skills],
              languages: ["uz", "ru"],
            },
          },
        },
      },
    });
  }
  console.log("20 ta demo talaba tekshirildi/yaratildi.");
}

async function main() {
  await seedSettings();
  await seedAdmin();
  if (process.env.SEED_DEMO === "true") {
    await seedDemoUsers();
    await seedDemoCompaniesAndVacancies();
    await seedDemoStudents();
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
