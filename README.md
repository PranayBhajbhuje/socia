# Socia

A mobile-first social network built with Next.js 16, React 19, and Prisma 8 over SQLite.

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env`. The local database path is set by `DATABASE_URL` (the supplied example uses `./dev.db`). The app does not need sample data to start. To insert or refresh the sample dataset, run `npm run seed`; it creates sample users, posts, and likes. Seed accounts are development fixtures and must not be used in a deployed environment.

## Environment configuration

- `DATABASE_URL`: SQLite connection string used by the app and Prisma.
- `AUTH_SECRET`: required in production; use a randomly generated secret of at least 32 characters. Changing it invalidates existing sessions.
- `APP_URL`: canonical application URL. Production must use HTTPS.
- `RESEND_API_KEY`, `EMAIL_FROM`: configure a verified Resend sender for password reset delivery. In development, an unconfigured reset request may display the reset URL locally. Production never returns the token; without working delivery configuration, reset cannot complete.

## Implemented

- Signup with password hashing and database uniqueness, login with password verification, logout, protected sessions, rate limits, and one-time expiring password reset links.
- Feed backed by SQLite, text/image/video posts, likes, post deletion by owner, saved posts, and a video viewer with comments, replies, likes, sharing, and view counts.
- People directory, follow/unfollow, follower/following lists, and the option to remove a follower from your own account.
- Stories with 24-hour expiry and view tracking.
- Notifications for social activity.
- Conversations with message sending, read state, and heart reactions.
- Profile editing, light/dark theme preference, settings, and responsive navigation.
- Repeatable sample-data seed script.

## Data model

The Prisma contract is in `src/prisma/contract.prisma`. It defines users and posts plus relational records for likes, bookmarks, follows, stories and story views, comments and replies, notifications, video views, conversations, messages, and message reactions. Passwords are stored as bcrypt hashes. The local application uses SQLite through Prisma ORM.

## Video samples

Seeded video posts use bundled MP4 samples from [MDN Interactive Examples](https://github.com/mdn/interactive-examples/tree/main/live-examples/media/cc0-videos), released under the repository's [CC0 1.0 license](https://github.com/mdn/interactive-examples/blob/main/LICENSE). Both samples were verified in the local Chromium browser: media metadata loaded and playback time advanced. The local server returns `video/mp4` with byte-range support. Keeping samples local avoids relying on demo URLs that may be removed or deny access. User-submitted videos still require a publicly reachable direct media URL with a codec supported by the viewer's browser; YouTube links use an embed with a link to open the original video if embedding fails.

## Assignment status

- Implemented locally: the numbered 13-screen scope, database-backed auth/feed/profile/social flows, seed script, and empty/error/loading states where applicable.
- Known assignment gap: Stories support 24-hour posts and view tracking, but do not implement the screenshot's Live badge or any live-stream status/model. No story is labeled live without that functionality.
- Remaining submission check: the configured Git remote is `PranayBhajbhuje/Alinsure`, not a Socia repository. This workspace has not been published to a public Socia repository.
- Prompt-history limitation: `PROMPTS.md` is a professionally edited, consolidated record based on the retained Copilot conversation and one saved Gemini export. Add any other AI tools or sessions used before claiming it is exhaustive. The original Gemini export is excluded from publication because it contains private account metadata.
- Not production-deployed: configure a production database, email delivery, shared rate limiting, managed media storage, backups, and monitoring as described below.

## Before production deployment

This repository is a working application build, not yet a complete production deployment. Before exposing it to consumers:

1. Choose a production database and hosting setup. The current app and Prisma contract target SQLite; a local SQLite file is not appropriate for many multi-instance/serverless deployments. Plan and review a data-preserving database migration before changing providers.
2. Generate a unique `AUTH_SECRET`; configure HTTPS `APP_URL`, a verified sender, and working Resend credentials. Verify delivery and reset behavior using controlled test accounts.
3. Move authentication rate limits to a shared production-safe store and configure trusted proxy IP handling. The present rate limiter stores hashed client keys in SQLite and is intended for the current single-database app.
4. Add managed object storage and upload validation for user media. Current post/story media accepts URLs; production needs safe upload limits, content-type verification, access policy, and malware/content moderation strategy.
5. Configure backups, restore exercises, monitoring, structured redacted logs, CSP/security headers, dependency scanning, and operational alerts.
6. Add an isolated automated test suite for authentication, authorization, follows, posts, reset token lifecycle, and concurrent duplicate signup. Run it against disposable test data, never the user database.

## Build and lint

```bash
npm run build
npm run lint
npm test
```

The current Prisma 8 setup uses its contract and migration workflow. Review the Prisma 8 migration guide under `node_modules/@prisma/orm-sqlite/skills/prisma-8/references/migrations.md` before changing the schema. Do not reset or drop an existing database to apply schema updates.
