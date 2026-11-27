# Socia prompt-history summary

This is a professionally edited, consolidated summary of project prompts recoverable from the retained Copilot conversation and one saved Google Gemini conversation. The wording is normalized for clarity and professionalism; these entries are not verbatim prompts or a complete transcript. Brief troubleshooting exchanges and pasted terminal output are omitted. No other AI-tool exports were present in the available project files. Add the original prompt history from any other tools or unavailable sessions before treating this as a complete submission record.

## Google Gemini

1. **Project schema and seed data**  
   Design the Prisma schema and seed script for Socia, a mobile-first social application using Next.js, TypeScript, Prisma, and SQLite. Model users, posts (text, image, and video), and post likes. Enforce unique emails and usernames, hash sample passwords with bcrypt, prevent duplicate likes with a compound unique constraint, and seed at least six users and twelve varied posts. Explain the relationships.

2. **Project setup guidance**  
   Provide a clear, beginner-friendly sequence for creating and running the Socia project in Visual Studio Code, including the folder structure, required commands, dependencies, and where each command should be run.

3. **Prisma and SQLite configuration**  
   Help configure the project for SQLite with the installed Prisma version. Explain the correct initialization workflow and dependencies, and resolve the version-specific CLI setup issue without replacing the existing project.

## Additional Gemini prompts supplied by the project owner

The following five prompts were supplied by the project owner as a professionally rewritten record of prompts used during the build.

4. **Architecture continuation and priority-ordered feature implementation**
   Continue building the Socia mobile social media web application on top of the existing codebase: Next.js 16 App Router, TypeScript, Tailwind CSS 4, Prisma 8 with `@prisma/orm-sqlite`, SQLite, and `bcryptjs`. Preserve existing database contracts (`User`, `Post`, and `PostLike`), seed data, and working components.

   Implement requirements in this priority order:
   - **Authentication and route protection:** Create mobile-constrained `/login` and `/signup` pages with client-side validation, password visibility toggles, bcryptjs password hashing, duplicate-email handling, and clear error states. Add `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`, and `/api/auth/me` endpoints using signed `HttpOnly` cookies, and protect `/` by redirecting unauthenticated users to `/login`.
   - **Feed and persistent likes:** Implement `POST /api/posts/[id]/like` and feed-card interactions so like/unlike changes persist in `PostLike`, prevent duplicate user/post entries, and remain accurate after a page reload. Ensure `POST /api/posts` associates each post with the authenticated user and returns `201 Created`.
   - **Profile screen and UI states:** Build `/profile` with the authenticated user’s `fullName`, `@username`, `bio`, `avatarUrl`, and `websiteUrl`; aggregate counts; a Post tab; a two-column Video grid; a Tag empty state; and explicit loading, empty, and error states.
   - **Navigation and extended screens:** Add persistent mobile bottom navigation for Home, Video, create, Inbox, and Profile. Implement the video viewer, comments, inbox, edit profile, settings, and followers/following views with SQLite persistence.

5. **Automated workspace scaffolding via PowerShell**
   Generate one idempotent PowerShell script to scaffold the required directories (`src/lib`, `src/app/api/auth/*`, `src/app/api/posts/[id]/like`, `src/app/login`, `src/app/signup`, `src/app/profile`, and `src/components`) and write the corresponding TypeScript and TSX modules from the project root without requiring manual directory creation.

6. **Route guard integration and file architecture alignment**
   Separate Client Components (including `src/app/login/page.tsx`) from Server Components (including `src/app/page.tsx`). Provide a complete `src/app/page.tsx` implementation that integrates `getSessionUser()` route protection, `LogoutButton`, feed hydration from `User`, `Post`, and `PostLike`, and `BottomNav`.

7. **Path resolution, duplicate route audit, and UTF-8 file generation**
   Diagnose Next.js App Router path conflicts caused by duplicate `page.tsx` files or encoding mismatches. Provide a PowerShell diagnostic and file-writing script that audits all `page.tsx` locations, writes `src/app/page.tsx` as UTF-8 without a BOM, and verifies the authentication, profile, and navigation modules.

8. **End-to-end codebase verification and runtime audit**
   Audit the Socia repository to verify route structure (`/` redirect guard, `/login`, `/signup`, `/profile`), compatibility of `@prisma/orm-sqlite` (`db.orm`) methods across API routes and Server Components, SQLite (`./dev.db`) seeding and like persistence after reloads, TypeScript using `npx tsc --noEmit`, and development-server startup with browser verification.

## Copilot

1. **End-to-end account-flow verification**  
   Test Socia from account creation through login and inspect the signup and login fields and validation behavior. Use disposable data and remove anything created for testing.

2. **Credential handling**  
   Explain which account identifiers the application stores and how passwords are protected. Never reveal, retrieve, or attempt to recover users' passwords.

3. **Theme switching**  
   Diagnose why switching from dark mode to light mode does not apply the light theme, fix the root cause, and verify both directions.

4. **Sign-out and header actions**  
   Remove the duplicate Sign Out control, keep sign-out placement consistent across accounts, and make the New Post and Sign Out actions visually balanced with the existing UI.

5. **Video-link diagnosis and guidance**  
   Investigate why YouTube links and previously added videos do not play. Explain Socia's supported video requirements, distinguish embed failures from direct-media failures, and provide a clear fallback to the original YouTube page.

6. **Assignment and project readiness review**  
   Review the assignment PDF and screen references, summarize the requirements, assess project readiness, and identify the remaining implementation and submission work.

7. **Full-stack QA and assignment completion**  
   Act as a senior full-stack engineer and QA lead. Audit the numbered 13-screen scope, prioritizing secure authentication, a real database, at least five seeded users and ten posts, and database-backed likes that persist and cannot be duplicated. Verify profile data and posts; loading, empty, error, and success states; bonus video/comments, messaging, navigation, and remaining screens; responsive layouts and keyboard use. Fix verified gaps surgically, add focused tests, run the relevant checks, preserve existing user data, and document anything unverified or incomplete. Do not claim production readiness without verifying deployment services.

8. **Video playback remediation**  
   Diagnose YouTube embeds and direct media separately, check browser codec support and media response headers, replace inaccessible seeded videos with licensed browser-compatible local samples where appropriate, verify actual playback, and keep a useful failure state.

9. **Submission deliverables**  
   Prepare a public GitHub repository link, a professional prompt-history document covering the AI tools used, and a concise README describing how to run the project, its schema, and completed versus incomplete requirements. Do not publish credentials, local databases, or private chat exports.

10. **Run the application**  
    Start the Socia application locally and confirm it is reachable.

11. **Review assignment completeness:** Compare the technical requirements and submission checklist with the finished project. Identify what is complete, what remains, and the next actions needed before submission.

12. **Hosting and repository handoff:** Guide the project owner through publishing the repository and assess whether the current SQLite setup and local media storage are appropriate for Vercel. Do not recommend deployment until persistent database and storage requirements are addressed.

## Completeness note

The first three Gemini entries are consolidated from the saved export in the workspace; the original export is excluded because it contains private account metadata. The next five Gemini prompts were supplied by the project owner in this conversation. Copilot entries summarize project requests available in the retained conversation. This document cannot account for prompts from other AI tools or unavailable sessions unless their owners provide those exports.
