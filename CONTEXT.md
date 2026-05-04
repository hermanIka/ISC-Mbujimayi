# ISC Mbujimayi Digital Platform — Context

## What this project is

A complete digital platform for **Institut Supérieur de Commerce (ISC) Mbujimayi**, a higher education institution in Mbujimayi, Democratic Republic of Congo. The platform combines:

- **E-learning** — course catalogue, video/PDF/text chapters, progress tracking, certificates
- **Academic management** — inscription (enrollment application) workflow, filière (program) management
- **Financial management** — mobile money payments (Orange Money, Airtel Money, M-Pesa), payment confirmation
- **Communication** — per-course discussion forums, FAQ chatbot

## Why it was built

ISC Mbujimayi needed to modernise its administrative and teaching operations. Students previously registered and paid in person. Courses were delivered physically with no digital tracking. This platform moves all these workflows online.

## Who uses it

| Role | Who | What they do |
|---|---|---|
| VISITOR | Anyone | Browse the catalogue, verify certificates |
| STUDENT | Enrolled students | Access courses, track progress, pay fees, view certificates |
| TEACHER | Professors | Create and manage courses, evaluations, and forum |
| ACADEMIC_SERVICE | Registrar staff | Review and process inscription applications, manage students and filieres |
| FINANCIAL_SERVICE | Finance staff | Confirm or reject mobile money payments |
| ADMIN | Platform administrator | Manage all users, system configuration |
| DIRECTOR | Institution director | Read-only consolidated KPIs and analytics |

## Key domain concepts

- **Filière** — an academic program/track (e.g. Commerce, Finance, Informatique)
- **Inscription** — a student's formal application to enroll in the institution (distinct from course enrollment)
- **Enrollment** — a student's enrollment in a specific course (e-learning enrollment)
- **Certificat** — auto-generated when a student completes all chapters of a course
- **Mobile Money** — mobile payment system used in DRC; operators: Orange Money, Airtel Money, M-Pesa

## Architectural decisions

- **Stack**: React+Vite frontend, Express 5 backend, PostgreSQL+Drizzle ORM, Clerk authentication
- **Routing**: Wouter (lightweight alternative to react-router-dom; chosen for simplicity in this SPA)
- **API design**: OpenAPI 3.1 spec → Orval codegen → typed React Query hooks + Zod validators
- **Auth**: Clerk manages identity; role stored in the PostgreSQL `users` table keyed on `clerkId`
- **Language**: French throughout (the institution's language of instruction)
