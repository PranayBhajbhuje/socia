import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/prisma/db";
import { signSession, sessionCookieConfig } from "@/lib/auth";
import { checkAuthRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    let body: { email?: unknown; password?: unknown };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid login request." }, { status: 400 }); }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 128) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    if (!(await checkAuthRateLimit(req, "login", email))) {
      return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429 });
    }

    const user = await db.orm.User.where({ email }).first();

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = signSession({
      userId: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      sessionVersion: user.sessionVersion,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        websiteUrl: user.websiteUrl,
      },
    });

    res.cookies.set(sessionCookieConfig.name, token, sessionCookieConfig.options);
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Unable to sign in right now." },
      { status: 500 }
    );
  }
}
