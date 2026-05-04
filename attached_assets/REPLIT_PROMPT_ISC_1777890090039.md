# 🚀 REPLIT PROMPT — ISC Mbujimayi Digital Platform
## Context Engineering Method — Full Specs

---

## ⚡ INSTRUCTIONS POUR REPLIT AGENT

Tu es un ingénieur full-stack senior. Tu dois construire une plateforme numérique
complète pour l'**Institut Supérieur de Commerce (ISC) de Mbujimayi** (RDC).
Tu dois **d'abord** créer les fichiers de contexte et de specs avant d'écrire
une seule ligne de code applicatif. Suis les étapes dans l'ordre exact ci-dessous.

---

## ÉTAPE 0 — CRÉER LES FICHIERS DE CONTEXTE EN PREMIER

**Avant tout code, crée ces 3 fichiers à la racine du projet :**

### → `CONTEXT.md`
Ce fichier est la **bible du projet**. Tout agent ou développeur qui rejoint le projet
doit lire ce fichier en premier. Il contient :

```markdown
# CONTEXT.md — ISC Mbujimayi Platform

## Project Identity
- Name: ISC Mbujimayi Digital Platform
- Client: Institut Supérieur de Commerce de Mbujimayi, Kasaï-Oriental, DRC
- Purpose: E-learning + academic management + mobile payments
- Inspired by: Coursera, LinkedIn Learning
- Languages: French (primary) + English (secondary)

## Tech Stack
- Framework: Next.js 14 (App Router)
- Database: PostgreSQL 16 via Prisma ORM
- Auth: NextAuth.js v5 + JWT + Google OAuth
- Styling: Tailwind CSS + shadcn/ui
- PWA: next-pwa (Workbox)
- Payments: MTN MoMo API + Airtel Money API + Orange Money API
- AI Chatbot: OpenAI GPT-4o API (fallback: Google Gemini)
- File Storage: Cloudinary (videos + PDFs + images)
- i18n: next-intl (fr + en)
- Testing: Jest + Playwright

## Architecture Rules — NEVER VIOLATE THESE
1. STRICT MVC separation — Models in /prisma, Views in /app & /components, 
   Controllers in /app/api
2. NEVER mix business logic in React components — use /lib/services/
3. NEVER write raw SQL — use Prisma ORM only
4. NEVER store secrets in code — use .env only
5. NEVER put frontend and backend logic in the same file
6. ALL API routes must validate input with Zod schemas
7. ALL API routes must check authentication and authorization via middleware
8. Use TypeScript EVERYWHERE — no .js files, only .ts and .tsx

## User Roles (RBAC)
- VISITOR: public pages only
- STUDENT: e-learning, payments, evaluations, forum
- TEACHER: course management, evaluations, forum moderation
- ACADEMIC_SERVICE: inscription validation, academic reports
- FINANCIAL_SERVICE: payment verification, financial reports
- ADMIN: full platform management
- DIRECTOR: read-only dashboards and consolidated reports

## Branding
- Extract primary color palette from the ISC logo provided
- Use the logo's dominant color as --color-primary
- Use a complementary dark shade as --color-secondary
- Typography: Inter (headings) + Source Sans 3 (body)
- Design language: Professional, clean, academic — inspired by Coursera + LinkedIn Learning
- All UI must feel premium and trustworthy

## Naming Conventions
- Files: kebab-case (e.g., user-profile.tsx)
- Components: PascalCase (e.g., UserProfile)
- Functions: camelCase (e.g., getUserById)
- Database models: PascalCase (e.g., Student)
- API routes: /api/[resource]/[action] (e.g., /api/payments/initiate)
- Environment variables: UPPER_SNAKE_CASE

## Key Business Rules
1. A student can only access course content AFTER payment of academic fees is confirmed
2. Inscription requires document upload + Academic Service validation
3. A certificate is generated automatically when a student completes 100% of a course
4. Payments are verified via operator API callback — never trust client-side confirmation
5. Chatbot FAQ answers first; if confidence < 0.7, escalate to AI API
6. PWA must cache course content for offline reading after first load
```

### → `SPECS.md`
```markdown
# SPECS.md — Technical Specifications

## Module 1: Authentication & User Management
- NextAuth.js with Credentials + Google providers
- JWT with 7-day expiry + refresh token rotation
- Role assignment by Admin after email verification
- Password reset via email token (15min expiry)
- Rate limiting: max 5 login attempts per 10 minutes

## Module 2: Public Site (Visitor)
- Landing page with hero, stats counter, featured courses, testimonials
- About page: history, mission, organizational chart
- Programs page: filières with descriptions
- News/Blog with pagination
- Contact form + Google Maps embed
- Chatbot widget on all pages

## Module 3: Student Registration
- Multi-step form: personal info → document upload → filière choice → review
- Documents: national ID, high school diploma, passport photo
- Status flow: PENDING → UNDER_REVIEW → APPROVED | REJECTED
- Email notification at each status change
- Auto-generate student number on approval: ISC-YYYY-NNNN

## Module 4: E-Learning
- Course catalog with filters (filière, level, teacher, duration)
- Full-text search with debouncing
- Course structure: Course → Modules → Chapters
- Chapter types: VIDEO | PDF | PRESENTATION | TEXT
- Video player: custom HTML5 player with progress tracking
- Progress: tracked per chapter, aggregated per module and course
- Completion: 100% progress → auto-generate certificate
- Certificate: PDF with student name, course, date, unique hash (verifiable)

## Module 5: Evaluations
- Types: QCM | TRUE_FALSE | SHORT_ANSWER | ESSAY
- QCM: auto-corrected immediately
- Essay: teacher manual grading interface
- Time limit configurable per evaluation
- Anti-cheat: tab-switch detection, timer enforcement
- Results: stored immediately on submission

## Module 6: Forum (per course)
- Threaded discussions per course
- Teacher can pin/unpin posts
- Markdown support for posts
- Notification on reply to your thread

## Module 7: Mobile Money Payments
- Operators: MTN MoMo, Airtel Money, Orange Money
- Payment types: INSCRIPTION | MINERVAL | EXAM_FEES | OTHER
- Flow: Student initiates → Platform calls operator API → Operator sends callback → 
  Platform verifies → Updates student status → Sends receipt
- Receipt: auto-generated PDF with unique reference
- All transactions logged immutably in DB
- Retry mechanism for failed API calls (max 3 retries with exponential backoff)

## Module 8: Chatbot
- Widget: floating bottom-right bubble, expandable chat interface
- FAQ mode: keyword matching + intent classification against pre-loaded KB
- AI mode: send conversation history + context to OpenAI API when FAQ confidence < 0.7
- System prompt for AI: "You are the official ISC Mbujimayi assistant. 
  Answer only about the institution, academic programs, fees, and registration. 
  Always be polite and professional. Language: match user's language (fr/en)."
- Persist conversation history per authenticated user

## Module 9: Dashboards
- Student: courses progress, pending payments, certificates, upcoming evaluations
- Teacher: courses engagement rate, evaluation averages, student activity heatmap
- Academic Service: inscriptions pipeline (kanban view), enrollment stats by filière
- Financial Service: transactions chart, pending payments, revenue by period
- Director: consolidated KPIs, enrollment growth chart, revenue overview

## Module 10: PWA
- Service Worker via next-pwa (Workbox strategy)
- Cache: static assets (cache-first), API data (stale-while-revalidate), 
  course content (explicit cache on first load)
- Offline page: graceful degradation with cached content access
- Install prompt: custom banner on mobile after 3rd visit
- Push notifications via Web Push API
- Background sync for actions taken offline
```

### → `.env.example`
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/isc_mbujimayi"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Mobile Money APIs
MTN_MOMO_API_KEY=""
MTN_MOMO_SUBSCRIPTION_KEY=""
MTN_MOMO_TARGET_ENVIRONMENT="sandbox"
AIRTEL_API_CLIENT_ID=""
AIRTEL_API_CLIENT_SECRET=""
ORANGE_API_KEY=""
ORANGE_API_SECRET=""

# AI
OPENAI_API_KEY=""
GEMINI_API_KEY=""

# Email
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply@isc-mbujimayi.cd"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ISC Mbujimayi"
```

---

## ÉTAPE 1 — STRUCTURE DES FICHIERS (créer exactement cette structure)

```
isc-mbujimayi-platform/
│
├── CONTEXT.md                    ← Fichier de contexte (créé à l'étape 0)
├── SPECS.md                      ← Spécifications techniques
├── .env.example                  ← Template variables d'environnement
├── .env.local                    ← Variables réelles (gitignored)
├── next.config.ts                ← Config Next.js + PWA
├── tailwind.config.ts            ← Config Tailwind + design tokens ISC
├── tsconfig.json
├── package.json
│
├── prisma/                       ← MODÈLES (couche Model du MVC)
│   ├── schema.prisma             ← Schéma complet de la base de données
│   ├── migrations/               ← Migrations automatiques
│   └── seed.ts                   ← Données de test réalistes
│
├── src/
│   ├── app/                      ← VUES + ROUTEUR (App Router Next.js)
│   │   │
│   │   ├── (public)/             ← Route group: pages publiques
│   │   │   ├── page.tsx          ← Landing page
│   │   │   ├── about/page.tsx
│   │   │   ├── programs/page.tsx
│   │   │   ├── news/page.tsx
│   │   │   └── contact/page.tsx
│   │   │
│   │   ├── (auth)/               ← Route group: authentification
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── verify/page.tsx
│   │   │
│   │   ├── (dashboard)/          ← Route group: espaces privés
│   │   │   ├── layout.tsx        ← Layout avec sidebar selon rôle
│   │   │   ├── student/
│   │   │   │   ├── page.tsx      ← Dashboard étudiant
│   │   │   │   ├── courses/
│   │   │   │   ├── payments/
│   │   │   │   ├── evaluations/
│   │   │   │   └── certificates/
│   │   │   ├── teacher/
│   │   │   │   ├── page.tsx      ← Dashboard enseignant
│   │   │   │   ├── courses/
│   │   │   │   └── evaluations/
│   │   │   ├── academic/
│   │   │   │   ├── page.tsx
│   │   │   │   └── inscriptions/
│   │   │   ├── financial/
│   │   │   │   ├── page.tsx
│   │   │   │   └── transactions/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx
│   │   │   │   └── users/
│   │   │   └── director/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                  ← CONTRÔLEURS (couche Controller du MVC)
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── users/
│   │   │   │   ├── route.ts      ← GET /api/users, POST /api/users
│   │   │   │   └── [id]/route.ts ← GET/PUT/DELETE /api/users/:id
│   │   │   ├── inscriptions/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── validate/route.ts
│   │   │   ├── courses/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── modules/route.ts
│   │   │   │       ├── progress/route.ts
│   │   │   │       └── certificate/route.ts
│   │   │   ├── payments/
│   │   │   │   ├── initiate/route.ts
│   │   │   │   ├── verify/route.ts
│   │   │   │   └── callback/
│   │   │   │       ├── mtn/route.ts
│   │   │   │       ├── airtel/route.ts
│   │   │   │       └── orange/route.ts
│   │   │   ├── evaluations/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/submit/route.ts
│   │   │   ├── chatbot/
│   │   │   │   └── message/route.ts
│   │   │   └── analytics/
│   │   │       └── [role]/route.ts
│   │   │
│   │   ├── layout.tsx            ← Root layout
│   │   └── globals.css
│   │
│   ├── components/               ← Composants réutilisables (VUES)
│   │   ├── ui/                   ← shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── course/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CoursePlayer.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── CourseCatalog.tsx
│   │   ├── payment/
│   │   │   ├── PaymentModal.tsx
│   │   │   └── OperatorSelector.tsx
│   │   ├── chatbot/
│   │   │   ├── ChatWidget.tsx
│   │   │   └── ChatBubble.tsx
│   │   ├── charts/
│   │   │   └── (Recharts-based components)
│   │   └── shared/
│   │       ├── CertificateCard.tsx
│   │       ├── LoadingSkeleton.tsx
│   │       └── OfflineBanner.tsx
│   │
│   ├── lib/                      ← Logique métier & utilitaires
│   │   ├── prisma.ts             ← Instance Prisma singleton
│   │   ├── auth.ts               ← Config NextAuth
│   │   ├── validations/          ← Schémas Zod par entité
│   │   │   ├── user.schema.ts
│   │   │   ├── course.schema.ts
│   │   │   └── payment.schema.ts
│   │   ├── services/             ← Services métier (logique réutilisable)
│   │   │   ├── user.service.ts
│   │   │   ├── course.service.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── certificate.service.ts
│   │   │   ├── chatbot.service.ts
│   │   │   └── notification.service.ts
│   │   ├── payments/             ← Intégrations opérateurs Mobile Money
│   │   │   ├── mtn-momo.ts
│   │   │   ├── airtel-money.ts
│   │   │   └── orange-money.ts
│   │   ├── pdf/                  ← Génération PDF (certificats, reçus)
│   │   │   └── generator.ts
│   │   ├── email/                ← Templates & envoi emails
│   │   │   └── sender.ts
│   │   └── utils/
│   │       ├── format.ts
│   │       └── constants.ts
│   │
│   ├── middleware.ts              ← Auth middleware + RBAC
│   │
│   ├── hooks/                    ← Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCourseProgress.ts
│   │   └── useOfflineSync.ts
│   │
│   ├── store/                    ← Zustand global state
│   │   ├── authStore.ts
│   │   └── notificationStore.ts
│   │
│   ├── types/                    ← TypeScript types & interfaces
│   │   ├── next-auth.d.ts        ← Extend NextAuth session types
│   │   └── index.ts
│   │
│   └── i18n/                     ← Internationalisation
│       ├── routing.ts
│       ├── messages/
│       │   ├── fr.json
│       │   └── en.json
│       └── request.ts
│
├── public/
│   ├── manifest.json             ← PWA manifest
│   ├── icons/                    ← PWA icons (toutes tailles)
│   ├── images/
│   │   └── logo-isc.png          ← Logo officiel ISC (fourni)
│   └── offline.html              ← Page offline PWA
│
└── tests/
    ├── unit/
    │   └── services/
    └── e2e/
        └── (Playwright tests)
```

---

## ÉTAPE 2 — SCHÉMA PRISMA COMPLET

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  VISITOR
  STUDENT
  TEACHER
  ACADEMIC_SERVICE
  FINANCIAL_SERVICE
  ADMIN
  DIRECTOR
}

enum InscriptionStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
}

enum PaymentStatus {
  INITIATED
  PENDING
  CONFIRMED
  FAILED
  CANCELLED
}

enum PaymentType {
  INSCRIPTION
  MINERVAL
  EXAM_FEES
  OTHER
}

enum MobileOperator {
  MTN
  AIRTEL
  ORANGE
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum ChapterType {
  VIDEO
  PDF
  PRESENTATION
  TEXT
}

enum EvaluationType {
  QCM
  TRUE_FALSE
  SHORT_ANSWER
  ESSAY
  MIXED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  role          Role      @default(VISITOR)
  isActive      Boolean   @default(true)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  student       Student?
  teacher       Teacher?
  accounts      Account[]
  sessions      Session[]
  chatHistory   ChatMessage[]
}

model Student {
  id              String            @id @default(cuid())
  userId          String            @unique
  user            User              @relation(fields: [userId], references: [id])
  numEtudiant     String?           @unique
  firstName       String
  lastName        String
  phone           String?
  birthDate       DateTime?
  address         String?
  filiereId       String?
  filiere         Filiere?          @relation(fields: [filiereId], references: [id])
  
  inscriptions    Inscription[]
  payments        Payment[]
  enrollments     Enrollment[]
  certificates    Certificate[]
  results         EvaluationResult[]
}

model Teacher {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  code         String   @unique
  firstName    String
  lastName     String
  specialty    String?
  grade        String?
  
  courses      Course[]
}

model Filiere {
  id          String    @id @default(cuid())
  name        String
  code        String    @unique
  description String?
  duration    Int       // years
  
  students    Student[]
  courses     Course[]
}

model Inscription {
  id          String           @id @default(cuid())
  studentId   String
  student     Student          @relation(fields: [studentId], references: [id])
  status      InscriptionStatus @default(PENDING)
  documents   Json             // array of { type, url, uploadedAt }
  notes       String?
  reviewedBy  String?          // userId of reviewer
  reviewedAt  DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model Course {
  id          String       @id @default(cuid())
  title       String
  titleEn     String?
  description String
  thumbnail   String?
  teacherId   String
  teacher     Teacher      @relation(fields: [teacherId], references: [id])
  filiereId   String?
  filiere     Filiere?     @relation(fields: [filiereId], references: [id])
  status      CourseStatus @default(DRAFT)
  level       String?      // L1, L2, L3, G1, G2
  duration    Int?         // hours
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  modules     Module[]
  enrollments Enrollment[]
  evaluations Evaluation[]
  certificates Certificate[]
  forumPosts  ForumPost[]
}

model Module {
  id       String    @id @default(cuid())
  courseId String
  course   Course    @relation(fields: [courseId], references: [id])
  title    String
  order    Int
  
  chapters Chapter[]
}

model Chapter {
  id        String      @id @default(cuid())
  moduleId  String
  module    Module      @relation(fields: [moduleId], references: [id])
  title     String
  type      ChapterType
  content   String?     // text content or URL
  duration  Int?        // seconds for videos
  order     Int
  
  progress  ChapterProgress[]
}

model Enrollment {
  id         String   @id @default(cuid())
  studentId  String
  student    Student  @relation(fields: [studentId], references: [id])
  courseId   String
  course     Course   @relation(fields: [courseId], references: [id])
  enrolledAt DateTime @default(now())
  
  progress   ChapterProgress[]
  
  @@unique([studentId, courseId])
}

model ChapterProgress {
  id           String     @id @default(cuid())
  enrollmentId String
  enrollment   Enrollment @relation(fields: [enrollmentId], references: [id])
  chapterId    String
  chapter      Chapter    @relation(fields: [chapterId], references: [id])
  completedAt  DateTime?
  watchedSeconds Int?     // for videos
  
  @@unique([enrollmentId, chapterId])
}

model Payment {
  id          String         @id @default(cuid())
  studentId   String
  student     Student        @relation(fields: [studentId], references: [id])
  amount      Decimal        @db.Decimal(10, 2)
  currency    String         @default("CDF")
  type        PaymentType
  operator    MobileOperator
  phoneNumber String
  status      PaymentStatus  @default(INITIATED)
  reference   String         @unique @default(cuid())
  operatorRef String?        // operator transaction ID
  metadata    Json?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model Certificate {
  id         String   @id @default(cuid())
  studentId  String
  student    Student  @relation(fields: [studentId], references: [id])
  courseId   String
  course     Course   @relation(fields: [courseId], references: [id])
  issuedAt   DateTime @default(now())
  hash       String   @unique  // for verification
  pdfUrl     String?
  
  @@unique([studentId, courseId])
}

model Evaluation {
  id         String         @id @default(cuid())
  courseId   String
  course     Course         @relation(fields: [courseId], references: [id])
  title      String
  type       EvaluationType
  duration   Int            // minutes
  passMark   Int            @default(50)
  createdAt  DateTime       @default(now())
  
  questions  Question[]
  results    EvaluationResult[]
}

model Question {
  id           String   @id @default(cuid())
  evaluationId String
  evaluation   Evaluation @relation(fields: [evaluationId], references: [id])
  text         String
  options      Json?    // for QCM: [{text, isCorrect}]
  correctAnswer String?
  points       Int      @default(1)
  order        Int
}

model EvaluationResult {
  id           String     @id @default(cuid())
  studentId    String
  student      Student    @relation(fields: [studentId], references: [id])
  evaluationId String
  evaluation   Evaluation @relation(fields: [evaluationId], references: [id])
  score        Int
  answers      Json       // submitted answers
  submittedAt  DateTime   @default(now())
  gradedAt     DateTime?
  
  @@unique([studentId, evaluationId])
}

model ForumPost {
  id        String     @id @default(cuid())
  courseId  String
  course    Course     @relation(fields: [courseId], references: [id])
  authorId  String
  content   String
  isPinned  Boolean    @default(false)
  parentId  String?
  parent    ForumPost? @relation("Replies", fields: [parentId], references: [id])
  replies   ForumPost[] @relation("Replies")
  createdAt DateTime   @default(now())
}

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  role      String   // 'user' | 'assistant'
  content   String
  usedAI    Boolean  @default(false)
  sessionId String
  createdAt DateTime @default(now())
}

// NextAuth required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## ÉTAPE 3 — DESIGN SYSTEM & BRANDING

```typescript
// tailwind.config.ts — Design tokens ISC Mbujimayi

// ⚠️ IMPORTANT: Extraire les couleurs du logo ISC fourni.
// Utiliser un outil comme Coolors ou ColorThief pour extraire la palette.
// Remplacer les valeurs ci-dessous avec les couleurs réelles du logo.

export default {
  theme: {
    extend: {
      colors: {
        // Extraire ces valeurs du logo ISC fourni
        primary: {
          50:  '#EBF5FF',  // ← Remplacer avec teinte claire du logo
          100: '#D6EAFF',
          500: '#1a3c6e',  // ← Remplacer avec couleur principale du logo
          600: '#163264',
          700: '#0f2347',
          900: '#071628',
        },
        secondary: {
          500: '#E67E22',  // ← Remplacer avec couleur secondaire du logo
          600: '#CA6F1E',
        },
        academic: {
          green: '#27AE60',
          red:   '#E74C3C',
          gold:  '#F39C12',
        }
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body:    ['Source Sans 3', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient':    'linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-500) 100%)',
        'card-gradient':    'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
      }
    }
  }
}
```

### Design inspiration references:
- **Coursera**: https://www.coursera.org — Card-based course catalog, progress bars, certificates
- **LinkedIn Learning**: https://learning.linkedin.com — Clean sidebar navigation, skill tracking
- **Key UI patterns to replicate**:
  - Hero section with ISC imagery + enrollment CTA
  - Course cards with thumbnail, teacher name, progress bar, duration
  - Dashboard with KPI cards + charts (Recharts)
  - Video player with chapter sidebar (like Coursera)
  - Mobile-first bottom navigation for PWA
  - Skeleton loading states everywhere

---

## ÉTAPE 4 — MIDDLEWARE RBAC

```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const ROLE_ROUTES = {
  '/student':   ['STUDENT'],
  '/teacher':   ['TEACHER'],
  '/academic':  ['ACADEMIC_SERVICE', 'ADMIN'],
  '/financial': ['FINANCIAL_SERVICE', 'ADMIN'],
  '/admin':     ['ADMIN'],
  '/director':  ['DIRECTOR', 'ADMIN'],
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    
    for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
      if (path.startsWith(`/dashboard${route}`)) {
        if (!token || !roles.includes(token.role as string)) {
          return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
        }
      }
    }
    return NextResponse.next()
  },
  { callbacks: { authorized: ({ token }) => !!token } }
)

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

---

## ÉTAPE 5 — PWA CONFIGURATION

```typescript
// next.config.ts
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'course-media',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      }
    },
    {
      urlPattern: /\/api\/courses\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'api-courses' }
    }
  ],
  disable: process.env.NODE_ENV === 'development'
})

export default config({
  images: {
    domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
  },
})
```

---

## ÉTAPE 6 — RÈGLES DE QUALITÉ (à respecter sur CHAQUE fichier généré)

### Code Quality Rules
```
✅ TypeScript strict mode — zero `any` types
✅ Zod validation on ALL API inputs
✅ Error handling with try/catch on ALL async operations
✅ Loading + error + empty states for ALL data-fetching components
✅ Optimistic UI updates for key user actions
✅ Proper HTTP status codes in ALL API responses
✅ Pagination on ALL list endpoints (default: 20 items/page)
✅ Input sanitization before DB queries
✅ Proper indexes on frequently queried columns in Prisma schema

❌ NO `console.log` in production code (use a logger)
❌ NO hardcoded strings visible to users — use i18n keys
❌ NO inline styles — use Tailwind classes only
❌ NO useEffect for data fetching — use React Query or Server Components
❌ NO secret values in client-side code
❌ NO direct DB calls from React components — go through API routes
```

### API Response Format (standardized)
```typescript
// ALL API routes must return this format:
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
```

---

## ÉTAPE 7 — SEED DATA (données de test réalistes)

```typescript
// prisma/seed.ts — Crée des données représentatives
// Filières: Comptabilité, Marketing, Informatique de Gestion, GRH, Fiscalité
// Enseignants: 5 profils avec vrais noms congolais
// Cours: 3 cours par filière avec modules et chapitres
// Étudiants: 20 étudiants avec progression variée
// Paiements: Historique sur 6 mois
// Évaluations: 2 par cours avec questions réalistes
```

---

## RÉSUMÉ — ORDRE D'IMPLÉMENTATION

```
Phase 1 (Fondations):
  [x] Créer CONTEXT.md, SPECS.md, .env.example
  [x] Setup Next.js 14 + TypeScript + Tailwind + shadcn/ui
  [x] Schéma Prisma complet + migrations + seed
  [x] NextAuth + JWT + Google OAuth
  [x] Middleware RBAC
  [x] next-pwa configuration
  [x] next-intl (fr/en)

Phase 2 (Site Vitrine):
  [x] Landing page (hero, stats, cours en vedette, CTA)
  [x] Pages About, Programs, News, Contact
  [x] Chatbot widget (FAQ mode d'abord)

Phase 3 (Core Académique):
  [x] Inscription multi-étapes + upload documents
  [x] Dashboard Service Académique (validation workflow)
  [x] Catalogue de cours + lecteur vidéo
  [x] Progression + certificats PDF

Phase 4 (Paiements):
  [x] Intégration MTN MoMo API
  [x] Intégration Airtel Money API
  [x] Intégration Orange Money API
  [x] Reçus PDF + historique transactions

Phase 5 (Dashboards + IA):
  [x] Dashboards par rôle avec Recharts
  [x] Chatbot IA (escalade OpenAI)
  [x] Notifications push (PWA)
  [x] Évaluations + forum par cours

Phase 6 (Finitions):
  [x] Tests Jest + Playwright
  [x] Audit Lighthouse PWA > 90
  [x] Documentation API (Swagger)
  [x] Guide de déploiement
```

---

## NOTE FINALE POUR REPLIT AGENT

> **Quand tu reçois le logo ISC Mbujimayi**, utilise-le pour :
> 1. Extraire la palette de couleurs dominantes avec ColorThief
> 2. Mettre à jour les tokens Tailwind avec ces couleurs exactes
> 3. Générer toutes les tailles d'icônes PWA (72, 96, 128, 144, 152, 192, 384, 512px)
>    depuis ce logo
> 4. Utiliser le logo dans la Navbar, le footer, le manifest PWA et les certificats PDF
>
> **Si une API Mobile Money n'est pas disponible en sandbox**, crée un mock service
> réaliste dans `/lib/payments/mock-*.ts` qui simule le comportement de l'API
> (délai aléatoire, taux de succès 90%, callbacks simulées).
>
> **La plateforme doit être belle.** S'inspirer visuellement de Coursera et
> LinkedIn Learning. Chaque page doit avoir des états de chargement (skeleton),
> des états d'erreur (toast + fallback UI), et des états vides (illustrations).
> Pas de pages blanches, pas de spinners génériques, pas d'UI par défaut non stylisée.
