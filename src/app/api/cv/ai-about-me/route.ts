import { Lang } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAboutMe } from "@/backend/ai/cv";
import { requireRole } from "@/backend/auth/session";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const aboutMeRequestSchema = z.object({
  skills: z.array(z.string().trim().max(80)).max(30).default([]),
  education: z.array(z.string().trim().max(200)).max(15).default([]),
  experience: z.array(z.string().trim().max(200)).max(15).default([]),
  language: z.nativeEnum(Lang).optional(),
  jobTitle: z.string().trim().max(120).optional(),
});

export const POST = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  rateLimit(`ai-about:${user.id}`, LIMITS.cvGenerate);
  const body = await parseJson(request, aboutMeRequestSchema);

  const aboutMe = await generateAboutMe({
    userId: user.id,
    language: body.language || (user.locale as Lang) || "uz",
    jobTitle: body.jobTitle,
    skills: body.skills,
    education: body.education,
    experience: body.experience,
  });

  return NextResponse.json({ ok: true, aboutMe });
});
