# Socia

Socia is a mobile-first social networking app built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, and Prisma ORM with SQLite. It includes text, image, and video posts; likes, comments and replies, bookmarks, stories, profiles, follow requests, direct messages, notifications, and video viewing.

## Run locally

Prerequisites: Node.js 20.9.0 or newer and npm.

From the repository root, run these commands in PowerShell:

```powershell
npm ci
Copy-Item .env.example .env
npx prisma db init
npm run seed
npm run dev
```

Open the local URL printed by Next.js (usually `http://localhost:3000`). Seeding is optional; it adds six demo users, twelve posts, and their likes. The seed script does not clear unrelated data. To start without demo data, omit `npm run seed`.

The local SQLite file is `dev.db`, selected by `DATABASE_URL` in `.env`. Keep `.env` and local database files private. Password-reset emails require `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_URL`; without Resend, the app provides a short-lived reset link only in local development. Production must use an HTTPS `APP_URL` and a strong `AUTH_SECRET` of at least 32 characters.

## Data model

The Prisma contract is [`src/prisma/contract.prisma`](./src/prisma/contract.prisma). It defines users and posts, unique user/post likes and bookmarks, threaded comments and comment likes, follows with request status, stories and story views, conversations and messages with reactions, notifications, video views, password-reset tokens, and authentication rate-limit buckets. Stories may reference an existing post and expire after 24 hours. Passwords are stored as bcrypt hashes; password-reset tokens are stored as hashes.

## Checks

```powershell
npm test
npm run lint
npm run build
```

## Assignment status and limitations

- Implemented: local authentication and password reset, SQLite-backed user/post data, demo seed data, feed and persistent likes, profiles, navigation, and the social and bonus flows listed above.
- Not implemented: live streaming and a Live badge; voice and video calling are visible as coming-soon controls.
- Not deployed or production-ready. The local SQLite database is not suitable for serverless persistence. Uploaded media is stored under `public/uploads` and is therefore local to the development machine; uploaded videos are transcoded to MP4 with FFmpeg. A production deployment needs persistent database and cloud media storage, configured email delivery, and shared rate limiting.

Repository: [github.com/PranayBhajbhuje/socia](https://github.com/PranayBhajbhuje/socia). [`PROMPTS.md`](./PROMPTS.md) contains a curated, non-verbatim summary of the prompt history available in the retained Copilot context, one saved Gemini export, and Gemini prompts supplied by the project owner; it is not a complete export of unavailable sessions or other AI tools.

## AI reflection

An initial video fix used a CC0 WebM sample that the target Chromium browser could not open. Playback testing and the browser media error exposed the issue; I replaced it with a tested MP4 and confirmed that playback time advanced.
