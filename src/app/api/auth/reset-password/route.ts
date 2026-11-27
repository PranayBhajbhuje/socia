import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { hashPasswordResetToken, isPasswordResetTokenExpired, isValidPasswordResetToken } from "@/lib/password-reset";
import { db } from "@/prisma/db";

const INVALID_TOKEN_MESSAGE = "This reset link is invalid or expired.";

export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
  }

  const token = body.token;
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidPasswordResetToken(token)) return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
  if (password.length < 10 || password.length > 128) return NextResponse.json({ error: "Use a password between 10 and 128 characters." }, { status: 400 });
  if (!(await checkAuthRateLimit(request, "password-reset", token))) return NextResponse.json({ error: "Too many reset attempts. Try again later." }, { status: 429 });

  const tokenHash = hashPasswordResetToken(token);
  const passwordHash = await bcrypt.hash(password, 10);
  const updated = await db.transaction(async (tx) => {
    const reset = await tx.orm.PasswordResetToken.where({ tokenHash }).first();
    if (!reset || reset.usedAt || isPasswordResetTokenExpired(reset.expiresAt)) return false;

    const user = await tx.orm.User.where({ id: reset.userId }).first();
    if (!user) return false;

    const now = new Date();
    await tx.orm.PasswordResetToken.where({ id: reset.id }).update({ usedAt: now });
    await tx.orm.User.where({ id: user.id }).update({ passwordHash, sessionVersion: user.sessionVersion + 1 });
    const otherTokens = await tx.orm.PasswordResetToken.where({ userId: user.id }).all();
    for (const other of otherTokens) {
      if (other.id !== reset.id && !other.usedAt) await tx.orm.PasswordResetToken.where({ id: other.id }).update({ usedAt: now });
    }
    return true;
  });

  if (!updated) return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
  return NextResponse.json({ message: "Password updated. Sign in with your new password." });
}
