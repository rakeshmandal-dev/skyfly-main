# EduVault AI — Full-Stack Implementation Plan

**Target Architecture:** Full-Stack TypeScript Monorepo  
**Target Date:** October 2026  
**Objective:** Production-grade 3D Educational Platform with Node.js Express API, Supabase Auth, Drizzle ORM, Three.js Virtual Teacher, and 34 integrated learning modules.

---

## 1. Monorepo Architecture

```
eduvault-ai/
├── apps/
│   ├── web/                     # React + Vite + Three.js + Tailwind CSS
│   │   ├── src/
│   │   │   ├── components/      # UI components & 3D Avatar (Procedural & GLTF)
│   │   │   ├── routes/          # 34 Educational routes + Landing + Auth
│   │   │   ├── hooks/           # useSpeech, useMobile, useAuth, etc.
│   │   │   ├── lib/             # API client, PDF parser, audio visualizer
│   │   │   └── styles.css       # OKLCH tokens, glassmorphism, brand gradients
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                     # Node.js + Express + TypeScript Backend
│       ├── src/
│       │   ├── middleware/      # Auth (Supabase getUser JWT verification), rate limits, error handler
│       │   ├── routes/          # Health, Notes, Quizzes, AI, Credits, Leaderboard, NGO, etc.
│       │   ├── services/        # AI Gateway (Gemini/OpenAI/Mock fallback), PDF chunking
│       │   ├── config/          # Environment validation (Zod)
│       │   └── index.ts         # Express app bootstrap
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                  # Shared TypeScript contracts & schemas
│       ├── src/
│       │   ├── types.ts         # User, Note, Quiz, Attempt, Credit, Session types
│       │   └── schemas.ts       # Zod validation schemas
│       ├── tsconfig.json
│       └── package.json
│
├── database/                    # Drizzle ORM & PostgreSQL migrations
│   ├── migrations/              # Migrations 0000 through 0008
│   ├── schema.ts                # Drizzle schema definitions
│   ├── seed.ts                  # Safe development seed script
│   └── drizzle.config.ts
│
├── tests/                       # Automated test suites
│   ├── auth.test.ts             # Sign-in, sign-up, JWT validation, negative tests
│   ├── api.test.ts              # Express API integration tests
│   ├── credits.test.ts          # Server-authoritative credit rules & daily cap
│   └── 3d.test.ts               # WebGL fallback and responsive rendering tests
│
├── AUDIT.md
├── IMPLEMENTATION_PLAN.md
├── .env.example                 # Safe placeholders
└── package.json                 # Monorepo root workspaces
```

---

## 2. Phase-by-Phase Execution Checklist

### Phase 1: Repository Audit & Planning [COMPLETED]
- [x] Complete feature inventory across all 34 modules
- [x] Root cause analysis of auth issues (`brokeredPreviewStorage`, `getClaims` non-existent function)
- [x] Inspect 3D asset metadata and procedural teacher models
- [x] Generate `AUDIT.md` and `IMPLEMENTATION_PLAN.md`

### Phase 2: Monorepo Foundation & Shared Contracts
- [ ] Initialize root workspace structure (`apps/web`, `apps/api`, `packages/shared`, `database`, `tests`)
- [ ] Implement `packages/shared` with typed DTOs and Zod validation schemas
- [ ] Ensure strict TypeScript compilation across all packages

### Phase 3: Authentication Fix First
- [ ] Replace `brokeredPreviewStorage` with robust, fallback-safe `localStorage` wrapper
- [ ] Fix server-side token validation: replace nonexistent `getClaims` with `supabase.auth.getUser(token)`
- [ ] Support email confirmation flow with resend verification option
- [ ] Build forgot password / reset password modal
- [ ] Add password visibility toggles and accessible input styling
- [ ] Provide comprehensive auth test matrix

### Phase 4: Node.js Express Backend (`apps/api`)
- [ ] Centralized error handling, Zod validation, helmet, CORS, request IDs, and structured logging
- [ ] Supabase JWT authentication middleware with user extraction and role checks
- [ ] Endpoints:
  - `GET /api/health`
  - `GET /api/me`, `PATCH /api/me`
  - `GET/POST/PATCH/DELETE /api/notes`
  - `GET/POST/DELETE /api/bookmarks`
  - `GET /api/subjects`
  - `GET /api/progress`
  - `GET/POST /api/planner`
  - `GET /api/quizzes`, `POST /api/quizzes/:id/attempts`
  - `GET /api/mock-tests`, `POST /api/mock-tests/:id/attempts`
  - `GET /api/pyqs`
  - `GET/POST /api/learning-sessions`
  - `GET /api/mistakes`
  - `GET/POST /api/career-plans`
  - `GET/POST /api/viva-sessions`
  - `POST /api/ai/chat` (streaming)
  - `POST /api/ai/mentor`
  - `POST /api/ai/lesson`
  - `POST /api/ai/solve-image`
  - `POST /api/ai/solve-document`
  - `POST /api/ai/voice/session`
  - `GET /api/credits`, `POST /api/credits/award`, `POST /api/credits/spend`
  - `GET /api/leaderboard`
  - `GET/POST /api/feedback`
  - `GET /api/impact`
  - `GET /api/certificates`
  - `GET/PATCH /api/settings`
  - `GET /api/network`
  - `POST /api/ngo/partners`, `POST /api/ngo/import-students`
- [ ] Implement safe mock/fallback responses when external AI keys are not configured

### Phase 5: Database & Drizzle ORM (`database`)
- [ ] Consolidate migrations 0000–0008 (Core, Storage, AI, Mood, Credits, Impact, Feedback)
- [ ] Define comprehensive Drizzle schema in `database/schema.ts`
- [ ] Write non-destructive seed script for demo/development environments

### Phase 6: Complete 3D Design System & Teacher (`apps/web`)
- [ ] Interactive 3D Virtual Teacher with Three.js / React Three Fiber
- [ ] Procedural avatar with articulation: head, eyes, eyelids, expressive eyebrows, jaw, arms, smile
- [ ] States: idle, listening, thinking, speaking, and disconnected
- [ ] Controls: start, pause, resume, mute, replay, speech rate
- [ ] WebGL detection & non-WebGL fallback banner/poster
- [ ] Premium midnight navy + electric cyan/violet theme tokens, glassmorphism, responsive navigation

### Phase 7: All 34 Learning Modules Implementation
- [ ] Dashboard, AI Assistant, AI Mentor, Personal Teacher, 3D Classroom
- [ ] Voice AI, Camera AI, Subjects, Learn, Notes, Vault, Bookmarks
- [ ] Quiz, Exam Simulation, Mock Tests, PYQs, Viva Examiner, Mistake Book
- [ ] Planner, Career Plan, Progress, Credits & Rewards, Leaderboard
- [ ] Profile, Settings, Certificates, Network, Feedback, Mood Logs
- [ ] Low-Resource Mode, Impact Dashboard, NGO Portal, Impact Access
- [ ] Landing Page with 3D Teacher Hero & Accessible Navigation

### Phase 8: Verification, Testing & Acceptance
- [ ] Unit tests for credit accounting, validation, and scoring
- [ ] API integration tests (health, auth, notes CRUD, quiz attempt, unauthorized checks)
- [ ] Frontend build verification (`npm run build`)
- [ ] End-to-end acceptance report

---

## 3. Risk Mitigation & Architecture Rules
1. **Never commit secrets:** Keep `.env` strictly in `.gitignore`. Expose only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to client.
2. **Never break existing data:** Preserve PostgreSQL schemas and run additive migrations.
3. **Always provide AI fallback:** When `LOVABLE_API_KEY` or `GEMINI_API_KEY` is absent, return structured, helpful, educational guidance rather than crashing.
4. **100% 3D Uptime:** The procedural 3D teacher avatar requires zero external asset downloads, ensuring instant loading on any network.
