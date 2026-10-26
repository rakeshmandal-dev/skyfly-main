# EduVault AI — Local Setup, Configuration & Production Deployment Guide

This guide provides step-by-step instructions for setting up, running, configuring, and deploying EduVault AI across local and production environments.

---

## 1. Prerequisites

- **Node.js**: v20+ or v24+ (`node -v`)
- **Package Manager**: npm v10+ or v11+ (`npm -v`)
- **Git** installed and configured
- **Supabase Account**: (Free or Pro tier) for PostgreSQL and Supabase Auth
- **AI API Keys**: Google Gemini API key or OpenAI API key (optional: platform includes intelligent educational fallback engine if keys are omitted).

---

## 2. Local Environment Setup

### 2.1 Clone and Install Monorepo Dependencies
From the repository root:
```bash
# Install dependencies across all workspaces (@eduvault/web, @eduvault/api, @eduvault/shared, @eduvault/database)
npm install
```

### 2.2 Configure Environment Variables
Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
```
Fill in your configuration values:
```ini
# Supabase Configuration (Required for Database and Auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Server & Client Configuration
PORT=4000
VITE_API_URL=http://localhost:4000/api
NODE_ENV=development

# AI Providers (Optional - EduVault AI includes built-in offline educational fallback)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 2.3 Initialize & Migrate Database
Apply the versioned Drizzle migrations (0000–0008) to your PostgreSQL database:
```bash
# Apply migrations
npm run db:migrate --workspace=@eduvault/database

# (Optional) Seed sample subjects, questions, and test data
npm run db:seed --workspace=@eduvault/database
```

### 2.4 Run Development Servers
You can run both web frontend and Node.js backend concurrently:
```bash
# Run both frontend and backend
npm run dev:all

# OR run individually:
npm run dev:api   # Runs Node.js Express API on port 4000
npm run dev:web   # Runs Vite / TanStack frontend on port 8080 (or 5173)
```

---

## 3. Supabase Auth, Google OAuth & Email Configuration

### 3.1 Email Verification Setup
1. In the Supabase Dashboard, navigate to **Authentication** -> **Providers** -> **Email**.
2. **Confirm email**: Enable if you wish users to confirm their email before logging in.
   - *Note*: If enabled, EduVault AI automatically shows the "Waiting for Email Verification" state with a "Resend Confirmation Email" action on `/auth`.
3. In **Authentication** -> **URL Configuration**, add your Redirect URLs:
   - `http://localhost:8080/auth` (Development)
   - `http://localhost:5173/auth` (Alternative Vite port)
   - `https://your-domain.com/auth` (Production)

### 3.2 Google OAuth Setup (Optional)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** with Application Type: **Web Application**.
3. Under **Authorized redirect URIs**, add your Supabase Auth callback:
   - `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret** into your Supabase Dashboard under **Authentication** -> **Providers** -> **Google**.
5. Save changes and toggle Google Auth to **Enabled**.

---

## 4. Testing Suite Execution

EduVault AI includes automated unit and integration tests for validation, credits, API endpoints, and 3D fallbacks:
```bash
# Execute all automated test suites
npm test
```

Test coverage includes:
- `tests/auth.test.ts`: Profile and authentication payload validation rules.
- `tests/credits.test.ts`: Server-authoritative credit eligibility, daily caps, and anti-fraud checks.
- `tests/api.test.ts`: Express API routing, status codes, health checks, and 401 unauthorized rejection.
- `tests/3d.test.ts`: Procedural 3D teacher rendering bounds, WebGL context loss handling, and non-WebGL poster fallbacks.

---

## 5. Production Deployment

### 5.1 Frontend Deployment (Vercel, Netlify, Cloudflare Pages)
1. **Build Command**: `npm run build:web`
2. **Output Directory**: `apps/web/dist`
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon Key.
   - `VITE_API_URL`: Your deployed backend API URL (e.g., `https://api.eduvault.ai/api`).

### 5.2 Backend API Deployment (Render, Railway, Fly.io, Docker)
1. **Build Command**: `npm run build:api`
2. **Start Command**: `npm run start --workspace=@eduvault/api` (or `node apps/api/dist/index.js`)
3. **Port**: Set `PORT` environment variable (defaults to 4000 or platform `$PORT`).
4. **Environment Variables**:
   - `NODE_ENV=production`
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY` / `OPENAI_API_KEY`
   - `CORS_ORIGIN`: Your production frontend domain (e.g., `https://eduvault.ai`).

### 5.3 Docker Containerization (Optional)
A standard production container for the backend API can be launched via:
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
RUN npm install --omit=dev
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
RUN npm run build:api
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace=@eduvault/api"]
```

---

## 6. External Services & Third-Party Requirements

| Service | Purpose | Credentials / Billing Requirements |
| :--- | :--- | :--- |
| **Supabase** | PostgreSQL Database & JWT Auth | Free Tier available (up to 50,000 MAU and 500MB database storage) |
| **Google Cloud** | Optional Google OAuth 2.0 | Free quota |
| **Google Gemini API** | AI Tutor, Lesson Generation, Camera OCR | Free tier available in Google AI Studio; Pay-as-you-go for high volume |
| **OpenAI API** | Optional alternative AI engine | Paid API credits required if used |
| **Web Speech API** | Voice recognition & synthesis | Built natively into modern web browsers (Chrome, Edge, Safari); zero cost |
