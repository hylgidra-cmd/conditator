import { afterAll, beforeEach, vi } from "vitest";
import { resetRateLimits } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { sentMails } from "./mail-outbox";

vi.mock("@/lib/email/mailer", async () => {
  const { sentMails: outbox } = await import("./mail-outbox");
  return {
    sendMail: async (message: {
      to: string;
      subject: string;
      text: string;
    }) => {
      outbox.push(message);
    },
  };
});

beforeEach(async () => {
  sentMails.length = 0;
  resetRateLimits();
  await db.$executeRawUnsafe(
    'TRUNCATE "AiLog", "Match", "Vacancy", "Company", "Cv", "EmailCode", "Session", "Setting", "User" CASCADE',
  );
});

afterAll(async () => {
  await db.$disconnect();
});
