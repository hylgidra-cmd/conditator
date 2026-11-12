import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { PUT as putCv } from "@/app/api/cv/me/route";
import { GET as getPdf } from "@/app/api/cv/me/pdf/route";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
import { getCvDocumentLabels } from "@/backend/cv-document/labels";
import { pdfContentDisposition } from "@/backend/cv-document/load";
import { closePdfBrowser } from "@/backend/cv-document/pdf";
import type { CvData } from "@/backend/cv/schema";
import { getRequest, jsonRequest, sessionCookie } from "./helpers";

const ctx = undefined as never;

afterAll(() => closePdfBrowser());

const sample: CvData = {
  fullName: "Ǵárezsiz Nókisov",
  contact: { email: "talaba@test.local", phone: "+998 90 000 00 00" },
  goal: "<script>alert(1)</script> Junior dasturchi",
  location: "Nókis",
  education: [
    {
      institution: "Qaraqalpaq mámleketlik universiteti",
      degree: null,
      field: "Informatika",
      startYear: "2021",
      endYear: "2025",
    },
  ],
  experience: [],
  skills: ["React", "SQL"],
  languages: [{ name: "Inglis tili", level: "B2" }],
  certificates: [],
};

async function loggedIn(role: "STUDENT" | "COMPANY") {
  const email = `${role.toLowerCase()}@test.local`;
  await register(
    jsonRequest("/api/auth/register", {
      email,
      password: "parol-12345",
      role,
      consent: true,
      locale: "uz",
    }),
    ctx,
  );
  const res = await login(
    jsonRequest("/api/auth/login", { email, password: "parol-12345" }),
    ctx,
  );
  return sessionCookie(res)!;
}

describe("CV hujjati (umumiy shablon)", () => {
  it("sarlavhalar CV tilida, bo'sh bo'limlar chiqmaydi, matn ekranlanadi", async () => {
    const html = renderToStaticMarkup(
      <CvDocument
        cv={{ data: sample, language: "ru", workTypes: ["REMOTE"] }}
        labels={await getCvDocumentLabels("ru")}
      />,
    );
    expect(html).toContain("Образование");
    expect(html).toContain("Удалённо");
    expect(html).toContain("Ǵárezsiz Nókisov");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    // Tajriba va sertifikatlar bo'sh: sarlavhasi ham yo'q.
    expect(html).not.toContain("Опыт работы");
    expect(html).not.toContain("Сертификаты");
  });

  it("fayl nomi faqat ASCII", () => {
    expect(pdfContentDisposition("Ǵárezsiz Nókisov")).toBe(
      'attachment; filename="CV-Garezsiz-Nokisov.pdf"',
    );
    expect(pdfContentDisposition("Айгерим Жумабаева")).toBe(
      'attachment; filename="CV-Aygerim-Zhumabaeva.pdf"',
    );
    expect(pdfContentDisposition('Ali "x"; y')).toBe(
      'attachment; filename="CV-Ali-x-y.pdf"',
    );
    expect(pdfContentDisposition(null)).toBe('attachment; filename="CV.pdf"');
  });
});

describe("GET /api/cv/me/pdf", () => {
  it("sessiyasiz 401, kompaniya 403, saqlanmagan CV 409", async () => {
    expect((await getPdf(getRequest("/api/cv/me/pdf"), ctx)).status).toBe(401);
    const company = await loggedIn("COMPANY");
    expect(
      (await getPdf(getRequest("/api/cv/me/pdf", company), ctx)).status,
    ).toBe(403);
    const student = await loggedIn("STUDENT");
    const res = await getPdf(getRequest("/api/cv/me/pdf", student), ctx);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("CV_NOT_SAVED");
  });

  it("saqlangan CV dan Noto Sans shriftli PDF qaytaradi", async () => {
    const cookie = await loggedIn("STUDENT");
    await putCv(
      jsonRequest(
        "/api/cv/me",
        { language: "kk", workTypes: [], data: sample },
        { cookie, method: "PUT" },
      ),
      ctx,
    );
    const res = await getPdf(getRequest("/api/cv/me/pdf", cookie), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("cache-control")).toContain("no-store");
    const bytes = Buffer.from(await res.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.toString("latin1")).toMatch(/NotoSans/);
  }, 60_000);
});
