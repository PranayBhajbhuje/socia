import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/prisma/db";

const COOKIE_NAME = "socia_session";
function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters in production.");
  }
  return secret || "dev-socia-secret-change-in-prod";
}

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  fullName: string;
  sessionVersion?: number;
  exp: number;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64").toString("utf8");
}

export function signSession(
  payload: Omit<SessionPayload, "exp">,
  maxAgeSeconds = 60 * 60 * 24 * 7
): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = base64UrlEncode(
    crypto.createHmac("sha256", getSecret()).update(encodedPayload).digest()
  );
  return `${encodedPayload}.${signature}`;
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSig] = parts;
  const expectedSig = base64UrlEncode(
    crypto.createHmac("sha256", getSecret()).update(encodedPayload).digest()
  );

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<SessionPayload>;
    if (typeof parsed.userId !== "string" || typeof parsed.email !== "string" ||
        typeof parsed.username !== "string" || typeof parsed.fullName !== "string" ||
        typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp) ||
        (parsed.sessionVersion !== undefined && !Number.isInteger(parsed.sessionVersion)) ||
        parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = verifySession(token);
  if (!session) return null;
  const user = await db.orm.User.where({ id: session.userId }).first();
  if (!user || (session.sessionVersion ?? 0) !== user.sessionVersion) return null;
  return session;
}

export const sessionCookieConfig = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  },
};
