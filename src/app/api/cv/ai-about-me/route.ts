import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { generateAboutMe } from "@/backend/ai/cv";
import { errorResponse } from "@/backend/http/errors";
import { Lang } from "@prisma/client";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { skills, education, experience, language, jobTitle, fullName } = body;

    const aboutMe = await generateAboutMe({
      userId: user.id,
      language: (language as Lang) || (user.locale as Lang) || "uz",
      jobTitle: typeof jobTitle === "string" ? jobTitle : undefined,
      fullName: typeof fullName === "string" ? fullName : undefined,
      skills: Array.isArray(skills) ? skills : [],
      education: Array.isArray(education) ? education : [],
      experience: Array.isArray(experience) ? experience : [],
    });

    return NextResponse.json({ ok: true, aboutMe });
  } catch (err) {
    return errorResponse(err, req);
  }
}
