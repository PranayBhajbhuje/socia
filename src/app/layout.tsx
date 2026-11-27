import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Socia",
  description: "Mobile-first social feed built with Next.js, Prisma, and SQLite.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionUser();
  const user = session ? await db.orm.User.where({ id: session.userId }).first() : null;
  const themeClass = user?.theme === "dark" ? "dark" : "";
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${themeClass}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-neutral-100 text-neutral-900 antialiased dark:bg-black dark:text-neutral-100"
        suppressHydrationWarning
      >
        <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm dark:bg-neutral-950">
          {children}
        </div>
      </body>
    </html>
  );
}
