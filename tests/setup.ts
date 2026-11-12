import { afterAll, beforeEach, vi } from "vitest";
import { resetRateLimits } from "@/backend/auth/rate-limit";
import { db } from "@/backend/db";
import { sentMails } from "./mail-outbox";

vi.mock("@/backend/email/mailer", async () => {
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
    'TRUNCATE "AdminLog", "AiLog", "Match", "Vacancy", "Company", "Cv", "EmailCode", "Session", "Setting", "User" CASCADE',
  );
});

afterAll(async () => {
  await db.$disconnect();
});
