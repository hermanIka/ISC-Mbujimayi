# ISC Mbujimayi Digital Platform — Specifications

## Module Specifications

### 1. Authentication (Clerk-managed)
- Sign-in via Clerk (email/password, OAuth)
- On first login, a user record is created in PostgreSQL with role `VISITOR`
- Role is stored in `users.role` (not Clerk `publicMetadata`) — backend reads DB role on each request
- Frontend reads role from `/api/users/me` response to determine which dashboard to show

### 2. User & Role Management
- **Endpoints**: `GET /api/users/me`, `PUT /api/users/me`, `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`
- Admin can change any user's role via `PUT /api/users/:id { role }`
- Role changes take effect immediately on next API request

### 3. Filieres (Academic Programs)
- **Endpoints**: `GET /api/filieres`, `POST /api/filieres`, `GET /api/filieres/:id`, `PUT /api/filieres/:id`, `DELETE /api/filieres/:id`
- Restricted: create/update/delete requires ADMIN or DIRECTOR role
- Each filiere has: name, code, description, duration (years), level (LICENCE/MASTER/DOCTORAT)

### 4. Students & Teachers
- **Student endpoints**: `GET /api/students`, `POST /api/students`, `GET /api/students/:id`, `PUT /api/students/:id`
- **Teacher endpoints**: `GET /api/teachers`, `POST /api/teachers`, `GET /api/teachers/:id`, `PUT /api/teachers/:id`
- Students are linked to a filiere; teachers have a grade and specialisation
- Restricted: write operations require ACADEMIC_SERVICE, ADMIN, or DIRECTOR

### 5. Inscriptions (Application Workflow)
- **Endpoints**: `GET /api/inscriptions`, `POST /api/inscriptions`, `GET /api/inscriptions/:id`, `PATCH /api/inscriptions/:id`
- Status flow: `PENDING` → `UNDER_REVIEW` → `APPROVED` | `REJECTED`
- Students submit inscriptions; ACADEMIC_SERVICE staff review them
- `PATCH /api/inscriptions/:id` restricted to ACADEMIC_SERVICE, ADMIN, DIRECTOR

### 6. Courses, Modules & Chapters
- **Course endpoints**: `GET /api/courses`, `POST /api/courses`, `GET /api/courses/:id`, `PUT /api/courses/:id`, `DELETE /api/courses/:id`
- **Module endpoints**: `GET /api/courses/:courseId/modules`, `POST /api/courses/:courseId/modules`, etc.
- **Chapter endpoints**: `GET /api/modules/:moduleId/chapters`, `POST /api/modules/:moduleId/chapters`, etc.
- Courses have status: `DRAFT` | `PUBLISHED` | `ARCHIVED`
- Chapters have type: `VIDEO` | `PDF` | `TEXT`
- Write operations restricted to TEACHER (own courses), ADMIN, DIRECTOR

### 7. Enrollments & Progress
- **Endpoints**: `GET /api/enrollments`, `POST /api/enrollments`, `GET /api/enrollments/:id`, `POST /api/chapters/:chapterId/progress`
- Students enroll in courses; progress tracked per-chapter
- Certificate auto-generated when all chapters marked complete
- `progressPercent` calculated as completed chapters / total chapters × 100

### 8. Evaluations & Results
- **Endpoints**: `GET /api/courses/:courseId/evaluations`, `POST /api/courses/:courseId/evaluations`, `GET /api/evaluations/:id`, `POST /api/evaluations/:id/submit`, `GET /api/evaluations/:id/results`
- Types: `QUIZ` | `ASSIGNMENT` | `EXAM`
- Answer format: `{ questionId, answer }` (answer is text — either option text or free text)
- Results include score, maxScore, passed boolean

### 9. Payments (Mobile Money)
- **Endpoints**: `GET /api/payments`, `POST /api/payments/initiate`, `PATCH /api/payments/:id/status`
- Operators: `ORANGE_MONEY` | `AIRTEL_MONEY` | `MPESA`
- Types: `INSCRIPTION_FEE` | `COURSE_FEE` | `EXAM_FEE` | `OTHER`
- Status flow: `PENDING` → `CONFIRMED` | `FAILED` | `CANCELLED`
- `PATCH /api/payments/:id/status` restricted to FINANCIAL_SERVICE, ADMIN, DIRECTOR

### 10. Certificates
- **Endpoints**: `GET /api/certificates`, `GET /api/certificates/:id`, `GET /api/certificates/verify/:hash`
- Auto-generated on course completion (all chapters done)
- Verification is public — anyone can verify a certificate code
- Certificate hash is a unique identifier used for public verification

### 11. Forum
- **Endpoints**: `GET /api/courses/:courseId/forum`, `POST /api/courses/:courseId/forum`, `PATCH /api/forum/:postId`, `DELETE /api/forum/:postId`
- Per-course discussion threads
- Enrolled students and teachers can post

### 12. Chatbot (FAQ)
- **Endpoint**: `POST /api/chatbot`
- FAQ-based responses; no AI — keyword matching against seeded FAQ pairs

### 13. Analytics
- `GET /api/analytics/student` — personal student KPIs
- `GET /api/analytics/teacher` — teacher's courses and engagement
- `GET /api/analytics/academic` — inscription counts and filiere stats (ACADEMIC_SERVICE+)
- `GET /api/analytics/financial` — revenue and payment stats (FINANCIAL_SERVICE+)
- `GET /api/analytics/director` — consolidated institution KPIs (DIRECTOR+)

## Security Requirements

- All write endpoints require authentication (Clerk JWT)
- Role-based access control enforced server-side via `requireRole()` middleware
- Analytics endpoints restricted to appropriate roles
- Certificate verification (`/api/certificates/verify/:hash`) is public
- Course listing (`GET /api/courses?status=PUBLISHED`) is public

## Database Schema Key Tables

| Table | Purpose |
|---|---|
| `users` | Clerk-linked user accounts with role |
| `filieres` | Academic programs |
| `students` | Student profiles linked to users + filieres |
| `teachers` | Teacher profiles linked to users |
| `inscriptions` | Enrollment applications |
| `courses` | Course catalogue |
| `modules` | Course modules (ordered) |
| `chapters` | Chapter content within modules |
| `enrollments` | Student ↔ course enrollments |
| `chapter_progress` | Per-chapter completion tracking |
| `payments` | Mobile money transactions |
| `certificates` | Auto-generated completion certificates |
| `evaluations` | Quizzes and assignments |
| `questions` | Questions per evaluation |
| `evaluation_results` | Student evaluation submissions and scores |
| `forum_posts` | Per-course forum messages |
