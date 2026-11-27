import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in to update settings." }, { status: 401 });
  let body: { theme?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid settings." }, { status: 400 }); }
  if (body.theme !== "light" && body.theme !== "dark") return NextResponse.json({ error: "Choose light or dark theme." }, { status: 400 });
  const user = await db.orm.User.where({ id: session.userId }).update({ theme: body.theme });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  return NextResponse.json({ theme: user.theme });
}
