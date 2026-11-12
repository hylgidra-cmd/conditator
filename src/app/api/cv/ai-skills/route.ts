import { NextResponse } from "next/server";
import { z } from "zod";
import { getSuggestedSkillsForTitle } from "@/frontend/components/cv/profession-skills";
import { runJsonTask } from "@/backend/ai/run";

const requestSchema = z.object({
  jobTitle: z.string().default(""),
  language: z.enum(["kk", "uz", "ru", "en"]).default("uz"),
});

const skillsResponseSchema = z.object({
  skills: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(rawBody);
    const jobTitle = parsed.success ? parsed.data.jobTitle.trim() : "";
    const language = parsed.success ? parsed.data.language : "uz";

    const presetSkills = getSuggestedSkillsForTitle(jobTitle);

    // Agar kasb nomi kiritilmagan bo'lsa, standart ko'nikmalar
    if (
      !jobTitle ||
      jobTitle.length < 2 ||
      jobTitle.toLowerCase() === "mening rezyumem"
    ) {
      return NextResponse.json({ ok: true, skills: presetSkills });
    }

    // AI orqali yanada aniq va dolzarb ko'nikmalarni so'raymiz
    try {
      const hasKey = Boolean(
        process.env.GEMINI_API_KEY ||
        process.env.GROQ_API_KEY ||
        process.env.ANTHROPIC_API_KEY,
      );

      if (hasKey) {
        const langPrompt =
          language === "kk"
            ? "Qaraqalpaq tilinde (Latin jazıwında hám xalıqaralıq atamalarda)"
            : language === "ru"
              ? "на русском языке (и общепринятых международных терминах)"
              : language === "en"
                ? "in English"
                : "o'zbek tilida (Lotin yozuvida va xalqaro atamalarda)";

        const aiResult = await runJsonTask({
          task: "CV_GEN",
          system: `You are an expert HR and recruitment AI specialist. Given a job title/profession, provide exactly 12 to 16 of the most modern, relevant, and in-demand skills (tools, technologies, methodologies) for this profession. You MUST write them in: ${langPrompt}. Output valid JSON with key "skills" as an array of strings.`,
          input: `Kasb / Yo'nalish: "${jobTitle}"\nTil / Language: ${language}`,
          schema: skillsResponseSchema,
          maxTokens: 500,
        });

        if (aiResult.skills && aiResult.skills.length > 0) {
          return NextResponse.json({
            ok: true,
            skills: aiResult.skills.slice(0, 16),
            source: "ai",
          });
        }
      }
    } catch {
      // AI xatolik berganda yoki limit tugaganda darhol aqlli bazaga qaytadi
    }

    return NextResponse.json({
      ok: true,
      skills: presetSkills,
      source: "preset",
    });
  } catch {
    return NextResponse.json({
      ok: true,
      skills: getSuggestedSkillsForTitle(""),
      source: "fallback",
    });
  }
}
