# Socia

A mobile-first social app built with Next.js, TypeScript, Prisma, and SQLite.

## Run locally

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

In another terminal, run `npm run seed` to load six sample users and twelve posts. Seed data is for local development only. Do not run the seed script against production data.

## Data model

The Prisma contract is [`src/prisma/contract.prisma`](./src/prisma/contract.prisma). `User` owns `Post` records; likes are stored as `PostLike` relations with a unique user/post pair. Passwords are stored as bcrypt hashes. The local database is SQLite, configured by `DATABASE_URL`.

## Included

Signup, login, logout, protected feed, database-backed likes, profiles, posts, bookmarks, comments, stories, follows, messaging, notifications, settings, and video viewing.

Run checks with `npm test`, `npm run lint`, and `npm run build`.

## Assignment status

- The must-have authentication, database, seed-data, feed, and likes requirements are implemented and were exercised locally. The profile, navigation, and listed bonus flows are also implemented.
- Known gap: Stories do not have a live-stream status or Live badge.
- The public repository is [github.com/PranayBhajbhuje/socia](https://github.com/PranayBhajbhuje/socia). See [`PROMPTS.md`](./PROMPTS.md) for the professionally consolidated prompt history available from Copilot and one Gemini export.
- Not deployed or production-ready. Vercel deployment needs a persistent database; the current local SQLite file is not suitable for serverless persistence. Production email, media storage, and shared rate limiting are also not configured.

## AI reflection

The initial video fix included a CC0 WebM sample that the target Chromium browser could not open. I caught this by testing playback and checking the media error, then moved that seed to a tested MP4 and confirmed that its playback time advanced.
