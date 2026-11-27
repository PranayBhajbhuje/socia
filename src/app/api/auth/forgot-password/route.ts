import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { checkAuthRateLimit } from "@/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE = "If an account exists for that email, password reset instructions will be sent.";

export async function POST(request: Request) {
  let body: { email?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!(await checkAuthRateLimit(request, "password-reset-request", email))) {
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && (!apiKey || !from || !process.env.APP_URL?.startsWith("https://"))) {
    console.error("Password reset delivery is not configured for production.");
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const user = await db.orm.User.where({ email }).first();
  if (!user) return NextResponse.json({ message: GENERIC_MESSAGE });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now = new Date();
  const priorTokens = await db.orm.PasswordResetToken.where({ userId: user.id }).all();
  await Promise.all(priorTokens.filter((token) => !token.usedAt).map((token) => db.orm.PasswordResetToken.where({ id: token.id }).update({ usedAt: now })));
  await db.orm.PasswordResetToken.create({ userId: user.id, tokenHash, expiresAt: new Date(now.getTime() + 30 * 60 * 1000), usedAt: null });

  const baseUrl = process.env.APP_URL || new URL(request.url).origin;
  const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;
  if (apiKey && from) {
    try {
      const mail = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [user.email], subject: "Reset your Socia password", text: `Use this link within 30 minutes to reset your Socia password: ${resetUrl}\n\nIf you did not request this, you can ignore this email.` }),
      });
      if (!mail.ok) {
        console.error("Password reset email delivery failed with status", mail.status);
        await db.orm.PasswordResetToken.where({ tokenHash }).update({ usedAt: new Date() });
        return NextResponse.json({ message: GENERIC_MESSAGE });
      }
    } catch (error) {
      console.error("Password reset email delivery failed", error instanceof Error ? error.message : "unknown error");
      await db.orm.PasswordResetToken.where({ tokenHash }).update({ usedAt: new Date() });
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.info("Development password reset link:", resetUrl);
  } else {
    console.error("Password reset email is unavailable: configure RESEND_API_KEY and EMAIL_FROM.");
  }

  return NextResponse.json({
    message: GENERIC_MESSAGE,
    ...(!isProduction && !(apiKey && from) ? { developmentResetUrl: resetUrl } : {}),
  });
}
