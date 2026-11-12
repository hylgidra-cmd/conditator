/**
 * Kasblar bo'yicha ko'p qo'llaniladigan va talabgir ko'nikmalar (Skills) bazasi.
 * Foydalanuvchi "Kasbiy unvon" (draft.title) ni to'ldirganda darhol moslashadi.
 */

export const DEFAULT_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Git",
  "Figma",
  "UI/UX",
  "SMM",
  "Sales",
  "Excel",
  "Buxgalteriya",
];

type ProfessionRule = {
  keywords: string[];
  skills: string[];
};

export const PROFESSION_SKILLS_MAP: ProfessionRule[] = [
  // 1. Frontend
  {
    keywords: [
      "frontend",
      "front-end",
      "front end",
      "react",
      "vue",
      "angular",
      "html",
      "css",
      "web dasturchi",
    ],
    skills: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Vue.js",
      "Tailwind CSS",
      "Redux Toolkit",
      "REST API",
      "Git",
      "Figma",
      "Responsive Design",
      "Vite",
    ],
  },
  // 2. Backend
  {
    keywords: [
      "backend",
      "back-end",
      "back end",
      "node",
      "django",
      "fastapi",
      "spring",
      "nest",
      "laravel",
      "php",
      "golang",
      "go dasturchi",
    ],
    skills: [
      "Node.js",
      "Express.js",
      "NestJS",
      "Python",
      "FastAPI / Django",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Docker",
      "REST API",
      "GraphQL",
      "Git",
      "Linux",
      "Microservices",
    ],
  },
  // 3. Fullstack
  {
    keywords: ["fullstack", "full-stack", "full stack"],
    skills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "NestJS",
      "PostgreSQL",
      "Prisma ORM",
      "Tailwind CSS",
      "Docker",
      "REST API",
      "Git",
      "CI/CD",
    ],
  },
  // 4. Mobile (Flutter, React Native, iOS, Android)
  {
    keywords: [
      "mobile",
      "mobil",
      "flutter",
      "android",
      "ios",
      "react native",
      "swift",
      "kotlin",
      "dart",
    ],
    skills: [
      "Flutter",
      "Dart",
      "React Native",
      "Kotlin",
      "Swift",
      "Android Studio",
      "Xcode",
      "Firebase",
      "REST API",
      "State Management (Bloc / Riverpod)",
      "App Store / Google Play",
      "Git",
    ],
  },
  // 5. Dizayn (UI/UX, Grafik, 3D, Web design)
  {
    keywords: [
      "dizayn",
      "design",
      "ui",
      "ux",
      "grafik",
      "illustrator",
      "photoshop",
      "figma",
      "3d",
      "art",
    ],
    skills: [
      "Figma",
      "UI/UX Design",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Wireframing",
      "Prototyping",
      "Design Systems",
      "User Research",
      "Typography",
      "Mobile App Design",
      "Web Design",
      "Brand Identity",
    ],
  },
  // 6. QA / Tester
  {
    keywords: ["qa", "tester", "testlash", "quality assurance", "test"],
    skills: [
      "Manual Testing",
      "Automation Testing",
      "Selenium",
      "Playwright / Cypress",
      "Postman",
      "API Testing",
      "Jira",
      "Test Cases",
      "Bug Reporting",
      "Git",
      "SQL",
    ],
  },
  // 7. DevOps & System Administration
  {
    keywords: [
      "devops",
      "cloud",
      "admin",
      "administrator",
      "linux",
      "aws",
      "infrastructure",
      "server",
    ],
    skills: [
      "Linux (Ubuntu, CentOS)",
      "Docker",
      "Kubernetes",
      "CI/CD (GitLab, GitHub Actions)",
      "AWS / Cloud",
      "Nginx",
      "Terraform",
      "Ansible",
      "Bash Scripting",
      "Monitoring (Prometheus, Grafana)",
      "Git",
    ],
  },
  // 8. Data Science, Data Analytics & AI
  {
    keywords: [
      "data",
      "sun'iy intellekt",
      "ai",
      "machine learning",
      "ml",
      "analitik",
      "analytics",
      "tahlil",
    ],
    skills: [
      "Python",
      "SQL",
      "Pandas",
      "NumPy",
      "Power BI",
      "Data Visualization",
      "Machine Learning",
      "Tableau",
      "Excel (Advanced)",
      "Statistical Analysis",
      "Data Cleaning",
      "Scikit-Learn",
    ],
  },
  // 9. Kiberxavfsizlik (Cybersecurity)
  {
    keywords: [
      "kiber",
      "cyber",
      "xavfsizlik",
      "security",
      "axborot xavfsizligi",
      "pentest",
    ],
    skills: [
      "Network Security",
      "Penetration Testing",
      "Linux",
      "Wireshark",
      "SIEM",
      "Cryptography",
      "Firewalls",
      "Vulnerability Assessment",
      "Python",
      "OWASP Top 10",
      "Risk Management",
    ],
  },
  // 10. Buxgalteriya & Moliya
  {
    keywords: [
      "buxgalter",
      "moliya",
      "iqtisod",
      "hisobchi",
      "auditor",
      "bank",
      "kassir",
      "finance",
      "accounting",
    ],
    skills: [
      "1C: Korxona 8.3",
      "Buxgalteriya hisobi",
      "Soliq hisoboti",
      "Excel (VLOOKUP, Pivot tables)",
      "Bank-Mijoz tizimi",
      "Moliyaviy tahlil",
      "Kassa va hisob-kitoblar",
      "Didox elektron hisob-faktura",
      "Mehnat haqi hisobi",
      "Audit",
    ],
  },
  // 11. Marketing, SMM & Reklama
  {
    keywords: [
      "marketing",
      "smm",
      "target",
      "reklama",
      "kopirayter",
      "seo",
      "kontent",
      "media",
      "pr",
    ],
    skills: [
      "SMM (Instagram, Telegram)",
      "Targeting reklama (Facebook Ads)",
      "Kopiraytlik & Matn yozish",
      "SEO optimizatsiya",
      "Google Ads",
      "Canva / Grafik tahrirlash",
      "Mobilografiya va Reels",
      "Raqamli tahlil (Google Analytics)",
      "Influencer Marketing",
      "Savdo voronkasi",
    ],
  },
  // 12. Sotuv & Savdo (Sales)
  {
    keywords: [
      "sales",
      "sotuv",
      "savdo",
      "menejer",
      "operator",
      "call center",
      "kassir",
      "savdo agenti",
    ],
    skills: [
      "B2B va B2C Savdo",
      "Muzokara olib borish",
      "Mijozlar bilan ishlash",
      "CRM (Bitrix24, AmoCRM)",
      "Sovuq qo'ng'iroqlar",
      "Taqdimot qilish mahorati",
      "E'tirozlar bilan ishlash",
      "Savdo rejasini bajarish",
      "Hujjatlar bilan ishlash",
    ],
  },
  // 13. HR & Rekruting
  {
    keywords: [
      "hr",
      "rekruter",
      "kadr",
      "xodimlar",
      "recruitment",
      "human resources",
    ],
    skills: [
      "Nomzodlarni saralash (Sourcing)",
      "Intervyu va suhbat o'tkazish",
      "Mehnat qonunchiligi",
      "Onboarding & Adaptatsiya",
      "KPI va baholash tizimlari",
      "Korporativ madaniyat",
      "HeadHunter bilan ishlash",
      "Xodimlar hisobi",
    ],
  },
  // 14. O'qituvchi / Ta'lim / Tarjimon
  {
    keywords: [
      "o'qituvchi",
      "ustoz",
      "muallim",
      "pedagog",
      "tarjimon",
      "repetitor",
      "ingliz tili",
      "matematika",
    ],
    skills: [
      "Dars berish metodikasi",
      "Pedagogik mahorat",
      "Sinxron va yozma tarjima",
      "Onlayn ta'lim (Zoom, Google Classroom)",
      "Taqdimotlar tayyorlash",
      "Grammatika va fonetika",
      "Interfaol ta'lim usullari",
      "O'quv dasturlarini tuzish",
    ],
  },
];

/**
 * Kasbiy unvon (jobTitle) ga qarab eng mos ko'nikmalar ro'yxatini chiqaradi.
 * Agar mos kelmasa, DEFAULT_SKILLS qaytariladi.
 */
export function getSuggestedSkillsForTitle(jobTitle: string): string[] {
  if (!jobTitle || typeof jobTitle !== "string") {
    return DEFAULT_SKILLS;
  }

  const query = jobTitle.trim().toLowerCase();
  if (!query || query === "mening rezyumem" || query.length < 2) {
    return DEFAULT_SKILLS;
  }

  // Kalit so'z bo'yicha mos keladigan qoidani topish
  for (const rule of PROFESSION_SKILLS_MAP) {
    if (rule.keywords.some((k) => query.includes(k))) {
      return rule.skills;
    }
  }

  return DEFAULT_SKILLS;
}
