import { describe, expect, it } from "vitest";
import {
  CODE_MAX_ATTEMPTS,
  CODE_TTL_MS,
  consumeCode,
  hashCode,
  issueCode,
} from "@/lib/auth/email-code";
import { db } from "@/lib/db";

async function createUser() {
  return db.user.create({
    data: {
      email: `u${Date.now()}@test.local`,
      passwordHash: "x",
      role: "STUDENT",
    },
  });
}

describe("email kodlari", () => {
  it("bazada kod emas, faqat uning xeshi saqlanadi", async () => {
    const user = await createUser();
    const code = await issueCode(user.id, "VERIFY");

    expect(code).toMatch(/^\d{6}$/);
    const stored = await db.emailCode.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(stored.codeHash).not.toContain(code);
    expect(stored.codeHash).toBe(hashCode(user.id, "VERIFY", code));
    expect(stored.codeHash).toHaveLength(64);
  });

  it("muddati 10 daqiqa", async () => {
    const user = await createUser();
    const before = Date.now();
    await issueCode(user.id, "VERIFY");
    const stored = await db.emailCode.findFirstOrThrow({
      where: { userId: user.id },
    });

    expect(CODE_TTL_MS).toBe(10 * 60_000);
    expect(stored.expiresAt.getTime() - before).toBeGreaterThanOrEqual(
      CODE_TTL_MS - 1000,
    );
    expect(stored.expiresAt.getTime() - before).toBeLessThanOrEqual(
      CODE_TTL_MS + 1000,
    );
  });

  it("to'g'ri kod bir marta ishlaydi", async () => {
    const user = await createUser();
    const code = await issueCode(user.id, "VERIFY");

    await expect(consumeCode(user.id, "VERIFY", code)).resolves.toBeUndefined();
    await expect(consumeCode(user.id, "VERIFY", code)).rejects.toMatchObject({
      code: "CODE_EXPIRED",
    });
  });

  it("muddati o'tgan kod rad etiladi", async () => {
    const user = await createUser();
    const code = await issueCode(user.id, "VERIFY");
    await db.emailCode.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(consumeCode(user.id, "VERIFY", code)).rejects.toMatchObject({
      code: "CODE_EXPIRED",
    });
  });

  it("noto'g'ri urinishlar sanaladi, 5 tadan keyin to'g'ri kod ham ishlamaydi", async () => {
    const user = await createUser();
    const code = await issueCode(user.id, "VERIFY");
    const wrong = code === "000000" ? "111111" : "000000";

    for (let attempt = 1; attempt < CODE_MAX_ATTEMPTS; attempt++) {
      await expect(consumeCode(user.id, "VERIFY", wrong)).rejects.toMatchObject(
        {
          code: "CODE_INVALID",
        },
      );
    }
    await expect(consumeCode(user.id, "VERIFY", wrong)).rejects.toMatchObject({
      code: "CODE_LOCKED",
    });
    const stored = await db.emailCode.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(stored.attempts).toBe(CODE_MAX_ATTEMPTS);

    await expect(consumeCode(user.id, "VERIFY", code)).rejects.toMatchObject({
      code: "CODE_LOCKED",
    });
  });

  it("yangi kod avvalgisini bekor qiladi, 60 soniyadan oldin yangi kod berilmaydi", async () => {
    const user = await createUser();
    const first = await issueCode(user.id, "VERIFY");
    await expect(issueCode(user.id, "VERIFY")).rejects.toMatchObject({
      code: "RESEND_TOO_SOON",
    });

    await db.emailCode.updateMany({
      where: { userId: user.id },
      data: { createdAt: new Date(Date.now() - 61_000) },
    });
    const second = await issueCode(user.id, "VERIFY");

    if (first !== second) {
      await expect(consumeCode(user.id, "VERIFY", first)).rejects.toMatchObject(
        {
          code: "CODE_INVALID",
        },
      );
    }
    await expect(
      consumeCode(user.id, "VERIFY", second),
    ).resolves.toBeUndefined();
  });
});
