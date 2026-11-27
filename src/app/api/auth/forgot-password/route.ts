import { NextResponse } from "next/server";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { createPasswordResetToken, getLocalDevelopmentOrigin, passwordResetEmailConfig } from "@/lib/password-reset";
import { db } from "@/prisma/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE = "If an account exists and email delivery is available, password reset instructions will be sent.";
const UNAVAILABLE_MESSAGE = "Password reset email is not configured in this environment. Please contact the administrator.";
const TOKEN_LIFETIME_MS = 5 * 60 * 1000;

function genericResponse(deliveryAvailable = true, developmentResetUrl?: string) {
  return NextResponse.json({ message: GENERIC_MESSAGE, deliveryAvailable, ...(developmentResetUrl ? { developmentResetUrl } : {}) });
}

async function storeResetToken(userId: string, tokenHash: string, now: Date) {
  await db.transaction(async (tx) => {
    const previousTokens = await tx.orm.PasswordResetToken.where({ userId }).all();
    for (const previous of previousTokens) {
      if (!previous.usedAt) await tx.orm.PasswordResetToken.where({ id: previous.id }).update({ usedAt: now });
    }
    await tx.orm.PasswordResetToken.create({
      userId,
      tokenHash,
      expiresAt: new Date(now.getTime() + TOKEN_LIFETIME_MS),
      usedAt: null,
    });
  });
}

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const localOrigin = getLocalDevelopmentOrigin(request.url);
  if (!localOrigin && !(await checkAuthRateLimit(request, "password-reset-request", email))) return genericResponse();

  const config = passwordResetEmailConfig();
  if (!config) {
    if (!localOrigin) return NextResponse.json({ message: UNAVAILABLE_MESSAGE, deliveryAvailable: false });

    const user = await db.orm.User.where({ email }).first();
    if (!user) return genericResponse(false);

    const { token, tokenHash } = createPasswordResetToken();
    await storeResetToken(user.id, tokenHash, new Date());
    const resetUrl = new URL("/reset-password", localOrigin);
    resetUrl.searchParams.set("token", token);
    return NextResponse.json({ message: UNAVAILABLE_MESSAGE, deliveryAvailable: false, developmentResetUrl: resetUrl.toString() });
  }

  const user = await db.orm.User.where({ email }).first();
  if (!user) return genericResponse();

  const { token, tokenHash } = createPasswordResetToken();
  const now = new Date();
  await storeResetToken(user.id, tokenHash, now);

  const resetUrl = new URL("/reset-password", config.appUrl);
  resetUrl.searchParams.set("token", token);
  let delivered = false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: config.from,
        to: [user.email],
        subject: "Reset your Socia password",
        text: `Use this link within 5 minutes to reset your Socia password: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error("Password reset email delivery failed with HTTP status", response.status);
    else delivered = true;
  } catch {
    console.error("Password reset email delivery failed due to a provider or network error.");
  }

  if (!delivered) {
    await db.orm.PasswordResetToken.where({ tokenHash }).update({ usedAt: new Date() });
  }
  return genericResponse();
}
