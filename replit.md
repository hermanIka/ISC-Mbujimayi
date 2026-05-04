# ISC Mbujimayi — Digital Platform

## Overview

Full-stack digital platform for **Institut Supérieur de Commerce (ISC) Mbujimayi** (DRC).
Combines e-learning, academic management (inscriptions/filieres), and mobile-money payments.

pnpm workspace monorepo using TypeScript throughout.

## Architecture

| Layer | Package | Notes |
|---|---|---|
| Frontend | `artifacts/isc-platform` | React + Vite, Clerk auth, shadcn/ui |
| Backend API | `artifacts/api-server` | Express 5, Clerk middleware |
| Database | `lib/db` | PostgreSQL + Drizzle ORM |
| API Spec | `lib/api-spec` | OpenAPI 3.0 YAML + Orval codegen |
| API Client | `lib/api-client-react` | Orval-generated React Query hooks |
| API Zod | `lib/api-zod` | Orval-generated Zod schemas |

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: Clerk (`@clerk/express` on backend, `@clerk/react` on frontend)
- **UI**: shadcn/ui + Tailwind CSS
- **Routing**: react-router-dom v7 (frontend) — wouter-compatible shim at `src/lib/router.tsx`
- **State/data**: TanStack Query (via Orval-generated hooks)

## Branding

- Primary: navy `#1a3c6e` (HSL 215 61% 27%)
- Accent: gold `#E67E22` (HSL 28 78% 52%)
- Dark navy sidebar
- Fonts: Inter (headings), Source Sans 3 (body)
- Logo: `artifacts/isc-platform/public/images/logo-isc.jpg`

## User Roles (7)

`VISITOR` · `STUDENT` · `TEACHER` · `ACADEMIC_SERVICE` · `FINANCIAL_SERVICE` · `ADMIN` · `DIRECTOR`

Each role has a dedicated dashboard route:
- `/dashboard/student` — enrolled courses, progress, stats
- `/dashboard/teacher` — course management, evaluations
- `/dashboard/academic` — inscriptions management
- `/dashboard/financial` — payment analytics
- `/dashboard/admin` — user & system management
- `/dashboard/director` — consolidated KPIs

## Functional Modules (10)

1. **Authentication** — Clerk-managed sign-in/sign-up
2. **Users & Roles** — `GET/PATCH /api/users`, role management
3. **Filieres** — Academic programs CRUD
4. **Students & Teachers** — Profile management
5. **Inscriptions** — Application workflow (PENDING → UNDER_REVIEW → APPROVED/REJECTED)
6. **Courses** — Catalogue with modules & chapters (VIDEO/PDF/TEXT)
7. **Enrollments & Progress** — Chapter progress tracking, certificate auto-generation
8. **Evaluations** — Quiz/assignment creation, answer submission, grading
9. **Payments** — Mobile money (MTN, Airtel, Orange) with async simulation + PDF receipts (`GET /payments/:id/receipt`)
10. **Forum & Chatbot** — Per-course discussion forum, FAQ chatbot

## Backend Services

- **Mobile Money Mock** — `src/lib/mobileMoneyService.ts`: Per-operator adapters (MTN/Airtel/Orange) with distinct delay ranges (2–4 sec) and operatorRef prefixes. 90% success rate. On CONFIRMED, calls `postPaymentService`.
- **Post-Payment Service** — `src/lib/postPaymentService.ts`: Called by both async simulator and webhook callback on payment confirmation. Resolves student email from `usersTable` via `student.userId`. Logs full receipt email content to console (SMTP-ready). If `COURSE_FEE` + `courseId` in payment metadata, creates enrollment row in DB automatically.
- **PDF Service** — `src/lib/pdfService.ts`: Generates branded PDFs using pdfkit. Two functions:
  - `generatePaymentReceiptPDF(data, res)` — for `GET /payments/:id/receipt`
  - `generateCertificatePDF(data, res)` — for `GET /certificates/:id/download` (A4 landscape, gold border, QR code)
- **Swagger UI** — Served at `/api/docs` (swagger-ui-express). Full OpenAPI 3.0 spec in `src/swagger.ts`.

## Key Commands

```bash
# Typecheck
pnpm run typecheck

# Build all
pnpm run build

# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
# ⚠️ After codegen: manually reset lib/api-zod/src/index.ts to:
#   export * from "./generated/api";

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Seed database
pnpm --filter @workspace/api-server run seed

# Run API server
pnpm --filter @workspace/api-server run dev

# Run frontend
pnpm --filter @workspace/isc-platform run dev
```

## API Response Shape Reference

| Endpoint | Response field |
|---|---|
| `GET /api/courses` | `.courses[]` |
| `GET /api/users` | `.users[]`, `.total` |
| `GET /api/teachers` | direct array |
| `GET /api/modules/:courseId` | direct array |
| `GET /api/chapters/:moduleId` | direct array |
| `GET /api/certificates` | direct array |
| `GET /api/forum/:courseId` | `.posts[]` |
| `GET /api/inscriptions` | `.inscriptions[]`, `.total` |
| `GET /api/payments` | `.payments[]`, `.total` |
| `GET /api/enrollments` | `.enrollments[]` |
| `GET /api/certificates/verify/:code` | `.valid`, `.certificate`, `.studentName` |

## Seeded Data (Dev)

Run: `pnpm --filter @workspace/api-server run seed`

- 5 filieres: Comptabilité, Marketing, Informatique de Gestion, GRH, Fiscalité
- 4 staff users + 7 teachers + 20 students (across all filières)
- 15 courses (3 per filière, mix PUBLISHED/DRAFT), 13 modules, 16 chapters
- 12 inscriptions (all statuses: APPROVED, PENDING, UNDER_REVIEW, REJECTED)
- 8 enrollments (students linked to courses)
- 36 payments spanning 6 months — all 3 operators, all types (INSCRIPTION_FEE, COURSE_FEE, EXAM_FEE), all statuses

## Important Notes

- `lib/api-zod/src/index.ts` is **overwritten by Orval** on each codegen run — must manually restore to `export * from "./generated/api";`
- Orval config: `schemas` option **removed** from zod config to prevent duplicate type exports
- Frontend uses `(data as any)` casts for analytics fields where API response shape differs from generated types
- Course modules/chapters are loaded from `useGetCourseById` (which returns nested modules+chapters), not separate calls in the learn page
