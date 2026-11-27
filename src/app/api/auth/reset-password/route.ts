import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { checkAuthRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid reset request." }, { status: 400 }); }
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
  if (password.length < 10 || password.length > 128) return NextResponse.json({ error: "Use a password between 10 and 128 characters." }, { status: 400 });
  if (!(await checkAuthRateLimit(request, "password-reset", token))) return NextResponse.json({ error: "Too many reset attempts. Try again later." }, { status: 429 });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const passwordHash = await bcrypt.hash(password, 12);
  const updated = await db.transaction(async (tx) => {
    const reset = await tx.orm.PasswordResetToken.where({ tokenHash }).first();
    if (!reset || reset.usedAt || reset.expiresAt.getTime() <= Date.now()) return false;
    const user = await tx.orm.User.where({ id: reset.userId }).first();
    if (!user) return false;
    const now = new Date();
    await tx.orm.PasswordResetToken.where({ id: reset.id }).update({ usedAt: now });
    await tx.orm.User.where({ id: reset.userId }).update({ passwordHash, sessionVersion: user.sessionVersion + 1 });
    const outstanding = await tx.orm.PasswordResetToken.where({ userId: reset.userId }).all();
    for (const item of outstanding) {
      if (item.id !== reset.id && !item.usedAt) await tx.orm.PasswordResetToken.where({ id: item.id }).update({ usedAt: now });
    }
    return true;
  });
  if (!updated) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });

  return NextResponse.json({ message: "Password updated. Sign in with your new password." });
}
