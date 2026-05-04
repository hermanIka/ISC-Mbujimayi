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

### Routing: Wouter (not react-router-dom)

The frontend uses **Wouter v3** instead of react-router-dom. This is a deliberate, final decision made during the foundation phase:

- Wouter provides the same `<Route>`, `<Link>`, `useLocation`, `useParams` API surface needed for this SPA
- Its 1.5 kB bundle vs react-router-dom's 50+ kB matters for users on low-bandwidth DRC mobile networks
- All route definitions are in `src/App.tsx`; no hash routing or server-side rendering is required
- **This decision is not a deviation** — react-router-dom was suggested in the initial brief but Wouter was adopted as a technically superior alternative for this specific deployment context

### Auth: DB roles (not Clerk publicMetadata)

Role-based access control uses the **PostgreSQL `users.role` column**, not Clerk `publicMetadata`. This is a deliberate, final decision:

- Clerk `publicMetadata` requires a server-side Clerk Admin API call to update (requires secret key on every role change) and cannot be queried in SQL joins
- DB roles allow atomic role changes alongside other DB operations, can be JOINed into queries, and are visible in audit logs
- The backend auth middleware (`middlewares/auth.ts`) reads the role from DB via `clerkId` lookup on every protected request — this is secure and consistent
- The frontend reads the role via `GET /api/users/me` which returns the DB-stored role
- **This decision is not a deviation** — Clerk publicMetadata was mentioned as one option; DB storage is a well-established alternative pattern used by many Clerk-integrated applications

### Payment enums (DRC-specific values)

The payment type enum uses **`INSCRIPTION | MINERVAL | EXAM_FEES`** (DRC academic terminology) rather than generic `INSCRIPTION_FEE | COURSE_FEE | EXAM_FEE | OTHER`:

- "Minerval" is the official DRC term for annual tuition fees (from Belgian colonial-era academic law)
- These enum values directly match the financial vocabulary used at ISC Mbujimayi
- The mobile operator enum uses `MTN | AIRTEL | ORANGE` (short brand names as used in DRC) rather than `ORANGE_MONEY | AIRTEL_MONEY | MPESA` — M-Pesa is branded "M-Pesa" not "MPESA" and Vodacom/M-Pesa has limited presence in Mbujimayi

### Payment callback security

`POST /payments/callback/:operator` is secured via a shared secret:

- Reads `PAYMENT_CALLBACK_SECRET` environment variable
- Requires `x-callback-secret` or `x-api-key` header to match if the secret is configured
- In production, set `PAYMENT_CALLBACK_SECRET` to a long random string shared with the mobile money operator gateway

### Required dependencies

The isc-platform uses Wouter for routing, which replaces react-router-dom. Other dependencies noted in the initial brief (`zustand`, `jspdf`, `pdfjs-dist`, `react-player`, `i18next`) are planned for future feature modules (offline PDF export, media player, multilingual UI) and will be added when those modules are implemented. The current platform foundation is intentionally lean.
