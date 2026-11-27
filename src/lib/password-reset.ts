import { createHash, randomBytes } from "node:crypto";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function createPasswordResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashPasswordResetToken(token) };
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidPasswordResetToken(token: unknown): token is string {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}

export function isPasswordResetTokenExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function getLocalDevelopmentOrigin(requestUrl: string, nodeEnv = process.env.NODE_ENV): string | null {
  if (nodeEnv === "production") return null;
  try {
    const url = new URL(requestUrl);
    return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ? url.origin : null;
  } catch {
    return null;
  }
}

export function passwordResetEmailConfig(env: NodeJS.ProcessEnv = process.env): { apiKey: string; from: string; appUrl: string } | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.EMAIL_FROM?.trim();
  const appUrl = env.APP_URL?.trim() || (env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!apiKey || !from || !appUrl) return null;

  let url: URL;
  try {
    url = new URL(appUrl);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol) || (env.NODE_ENV === "production" && url.protocol !== "https:")) return null;

  return { apiKey, from, appUrl: url.origin };
}
