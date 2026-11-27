import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/prisma/db";
import { isUniqueViolation } from "@/lib/errors";
import { checkAuthRateLimit } from "@/lib/rate-limit";

function makeBaseUsername(fullName: string, email: string): string {
  const source = fullName.trim() || email.split("@")[0] || "user";
  const cleaned = source
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 18);
  return cleaned || "socia_user";
}

export async function POST(req: Request) {
  try {
    let body: { fullName?: unknown; email?: unknown; password?: unknown };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid signup request." }, { status: 400 }); }
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (fullName.length < 2 || fullName.length > 80) {
      return NextResponse.json(
        { error: "Full name must be at least 2 characters." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (password.length < 10 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 10 and 128 characters." },
        { status: 400 }
      );
    }
    if (!(await checkAuthRateLimit(req, "signup", email))) {
      return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429 });
    }

    const baseHandle = makeBaseUsername(fullName, email);
    const passwordHash = await bcrypt.hash(password, 10);
    let created: Awaited<ReturnType<typeof db.orm.User.create>> | undefined;
    for (let suffix = 0; suffix < 100; suffix++) {
      const username = suffix === 0 ? baseHandle : `${baseHandle.slice(0, 14)}${suffix}`;
      try {
        created = await db.orm.User.create({
          fullName,
          email,
          username,
          passwordHash,
          bio: null,
          avatarUrl: null,
          websiteUrl: null,
        });
        break;
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        // An email collision cannot be fixed by trying another username.
        if (String(err).toLowerCase().includes("email")) throw err;
      }
    }
    if (!created) return NextResponse.json({ error: "Could not choose an available username." }, { status: 409 });

    return NextResponse.json(
      {
        message: "Account created. Please sign in.",
        user: {
          id: created.id,
          fullName: created.fullName,
          email: created.email,
          username: created.username,
          bio: created.bio,
          avatarUrl: created.avatarUrl,
          websiteUrl: created.websiteUrl,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: "An account with this email or username already exists." }, { status: 409 });
    }
    console.error("Signup error:", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json(
      { error: "Could not create account." },
      { status: 500 }
    );
  }
}
