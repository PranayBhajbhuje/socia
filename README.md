# Socia

Socia is a mobile-first social networking app built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, and Prisma ORM with SQLite. It includes text, image, and video posts; likes, comments and replies, bookmarks, stories, profiles, follow requests, direct messages, notifications, and video viewing.

## Run locally

These steps let a reviewer run the project from a fresh clone. Prerequisites: Git, Node.js 20.9.0 or newer, and npm.

1. Clone the public repository and enter its folder:

   ```powershell
   git clone https://github.com/PranayBhajbhuje/socia.git
   cd socia
   ```

2. Install the locked dependencies:

   ```powershell
   npm ci
   ```

3. Create local environment configuration and initialize the SQLite database from the Prisma contract:

   ```powershell
   Copy-Item .env.example .env
   npx prisma db init
   ```

   On macOS/Linux, use `cp .env.example .env` instead of `Copy-Item`.

4. (Optional) Add demo data, then start the development server:

   ```powershell
   npm run seed
   npm run dev
   ```

5. Open the URL printed in the terminal, usually `http://localhost:3000`. Without seed data, create an account from the signup page. The demo seed includes six users, twelve posts, and likes. A demo account is `rohan.deshmukh@socia.app` with password `SociaPass123!`; this shared password is only for local demo data and must never be used for a real account.

The database file is `dev.db`, selected by `DATABASE_URL` in `.env`. Keep `.env` and local database files private. Password-reset emails require `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_URL`; without Resend, the app provides a short-lived reset link only in local development. Production must use an HTTPS `APP_URL` and a strong `AUTH_SECRET` of at least 32 characters. Do not configure production credentials or deploy this local SQLite setup for the review.

## Data model

The Prisma contract is [`src/prisma/contract.prisma`](./src/prisma/contract.prisma). It defines users and posts, unique user/post likes and bookmarks, threaded comments and comment likes, follows with request status, stories and story views, conversations and messages with reactions, notifications, video views, password-reset tokens, and authentication rate-limit buckets. Stories may reference an existing post and expire after 24 hours. Passwords are stored as bcrypt hashes; password-reset tokens are stored as hashes.

## Checks

Run these from the repository root:

```powershell
npm test
npm run lint
npm run build
```

For a quick reviewer cross-check after opening the app:

1. Sign up for a fresh local account, sign out, then sign back in.
2. Create a text post and confirm it appears in the feed.
3. Like and unlike a post; reload the page and confirm the final like state is unchanged.
4. Add a comment or reply, then verify it appears on the post.
5. Stop and restart the development server; confirm the account, post, and like remain in the local database.

These are manual review steps, not a claim that every possible flow or deployment environment has been independently verified.

## Assignment status and limitations

- Implemented: local authentication and password reset, SQLite-backed user/post data, demo seed data, feed and persistent likes, profiles, navigation, and the social and bonus flows listed above.
- Not implemented: live streaming and a Live badge; voice and video calling are visible as coming-soon controls.
- Not deployed or production-ready. The local SQLite database is not suitable for serverless persistence. Uploaded media is stored under `public/uploads` and is therefore local to the development machine; uploaded videos are transcoded to MP4 with FFmpeg. A production deployment needs persistent database and cloud media storage, configured email delivery, and shared rate limiting.

Repository: [github.com/PranayBhajbhuje/socia](https://github.com/PranayBhajbhuje/socia). [`PROMPTS.md`](./PROMPTS.md) contains a curated, non-verbatim summary of the prompt history available in the retained Copilot context, one saved Gemini export, and Gemini prompts supplied by the project owner; it is not a complete export of unavailable sessions or other AI tools.

## AI reflection

An initial video fix used a CC0 WebM sample that the target Chromium browser could not open. Playback testing and the browser media error exposed the issue; I replaced it with a tested MP4 and confirmed that playback time advanced.
