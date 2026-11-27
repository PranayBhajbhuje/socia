# Socia prompt history

This is a professionally edited, consolidated record of the project prompts recoverable from the retained Copilot conversation and one saved Google Gemini conversation. The wording is normalized for clarity and professionalism; it is not a verbatim transcript. Brief troubleshooting exchanges and pasted terminal output are omitted. No other AI-tool exports were present in the available project files, so add any other tools or sessions used before describing this as exhaustive.

## Google Gemini

1. **Project schema and seed data**  
   Design the Prisma schema and seed script for Socia, a mobile-first social application using Next.js, TypeScript, Prisma, and SQLite. Model users, posts (text, image, and video), and post likes. Enforce unique emails and usernames, hash sample passwords with bcrypt, prevent duplicate likes with a compound unique constraint, and seed at least six users and twelve varied posts. Explain the relationships.

2. **Project setup guidance**  
   Provide a clear, beginner-friendly sequence for creating and running the Socia project in Visual Studio Code, including the folder structure, required commands, dependencies, and where each command should be run.

3. **Prisma and SQLite configuration**  
   Help configure the project for SQLite with the installed Prisma version. Explain the correct initialization workflow and dependencies, and resolve the version-specific CLI setup issue without replacing the existing project.

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

The Gemini entries are consolidated from the saved export in the workspace; the original export is excluded because it contains private account metadata. Copilot entries consolidate the project requests available in the retained conversation. This document cannot account for prompts from other AI tools or unavailable sessions unless their owners provide those exports.
