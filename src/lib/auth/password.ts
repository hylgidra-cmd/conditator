import { hash, verify } from "@node-rs/argon2";

// argon2id, kutubxonaning standart parametrlari (OWASP tavsiyasiga mos: m=19 MiB, t=2, p=1).
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
