// Soxta Anthropic API: faqat qabul sinovi uchun (docs/ACCEPTANCE.md). Server kodi o'zgarishsiz ishlaydi,
// ANTHROPIC_BASE_URL shu yerga qaraydi. Kelgan so'rovlar argv[2] fayliga yoziladi (AI ga nima ketganini tekshirish uchun).
import http from "node:http";
import { appendFileSync } from "node:fs";
const LOG = process.argv[2];
const SKILLS = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "SQL",
  "Git",
  "CSS",
  "HTML",
  "Python",
  "Figma",
  "Excel",
  "Docker",
];
function cvDraft(text) {
  const t = text.toLowerCase();
  return {
    goal: t.includes("frontend")
      ? "Frontend dasturchi sifatida ishlash."
      : null,
    location: t.includes("nukus") || t.includes("nókis") ? "Nukus" : null,
    education: t.includes("qdu")
      ? [
          {
            institution: "Qoraqalpoq davlat universiteti",
            degree: "Bakalavr",
            field: "Informatika",
            startYear: "2021",
            endYear: null,
          },
        ]
      : [],
    experience: t.includes("amaliyot")
      ? [
          {
            organization: "IT Park Nukus",
            position: "Amaliyotchi",
            startDate: "2024",
            endDate: "2024",
            description: "Veb-sahifalar ustida ishlagan",
          },
        ]
      : [],
    skills: SKILLS.filter((s) => t.includes(s.toLowerCase())),
    languages: [
      t.includes("ingliz") && { name: "Ingliz tili", level: "B2" },
      t.includes("rus") && { name: "Rus tili", level: null },
    ].filter(Boolean),
    certificates: [],
  };
}
function scores(input) {
  const vacancy = JSON.parse(
    input.match(/<vacancy>\n([\s\S]*?)\n<\/vacancy>/)[1],
  );
  const cands = JSON.parse(
    input.match(/<candidates>\n([\s\S]*?)\n<\/candidates>/)[1],
  );
  const req = vacancy.requiredSkills.map((s) => s.toLowerCase());
  return {
    results: cands.map((c) => {
      const have = c.skills.filter((s) => req.includes(s.toLowerCase()));
      const missing = vacancy.requiredSkills.filter(
        (s) => !have.some((h) => h.toLowerCase() === s.toLowerCase()),
      );
      const score = Math.min(
        98,
        Math.round(
          30 +
            (60 * have.length) / Math.max(1, req.length) +
            (c.experience.length ? 8 : 0),
        ),
      );
      const reason = [
        have.length
          ? `Talabdagi ko'nikmalar bor: ${have.join(", ")}.`
          : "Talabdagi ko'nikmalar CV da yo'q.",
        missing.length ? `Yo'q: ${missing.join(", ")}.` : "",
        c.experience.length
          ? "Amaliy tajribasi bor."
          : "Ish tajribasi ko'rsatilmagan.",
      ]
        .filter(Boolean)
        .join(" ");
      return { id: c.id, score, reason };
    }),
  };
}
http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      appendFileSync(LOG, body + "\n");
      const r = JSON.parse(body);
      const input = r.messages[0].content;
      const json = r.system.includes("structured CV data")
        ? cvDraft(
            input.match(/<student_text>\n([\s\S]*?)\n<\/student_text>/)[1],
          )
        : scores(input);
      const text = JSON.stringify(json);
      res.writeHead(200, {
        "content-type": "application/json",
        "request-id": "req_mock",
      });
      res.end(
        JSON.stringify({
          id: "msg_mock",
          type: "message",
          role: "assistant",
          model: r.model,
          content: [{ type: "text", text }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: {
            input_tokens: Math.ceil(body.length / 4),
            output_tokens: Math.ceil(text.length / 4),
          },
        }),
      );
    });
  })
  .listen(4010, "127.0.0.1", () => console.log("mock 4010"));
