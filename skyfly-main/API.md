# EduVault AI — REST API Documentation

The EduVault AI API is built with Node.js, Express, TypeScript, and Zod. It provides centralized authentication verification via Supabase JWTs, input validation, structured JSON responses, rate limiting, and access control.

Base URL: `http://localhost:4000/api` (Development) or `/api` (Production reverse proxy)

---

## 1. Global Standards & Conventions

### 1.1 Authentication & Authorization
- Protected endpoints require an `Authorization: Bearer <supabase_jwt_access_token>` header.
- Token validation is executed via Supabase Auth. Unauthenticated requests receive `401 Unauthorized`.
- Endpoints enforcing resource ownership ensure users can only read, update, or delete their own data (`owner_id === auth_user_id`).
- Administrative or privileged roles (e.g., NGO partner verification) are validated server-side.

### 1.2 Common Response Envelope
All API endpoints return standard JSON responses:

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | INTERNAL_ERROR",
    "message": "Human-readable error description",
    "details": [ ... ]
  }
}
```

### 1.3 Rate Limits
- **Standard API Endpoints**: 120 requests per minute per IP.
- **AI Endpoints (`/api/ai/*`)**: 30 requests per minute per IP.
- **Auth/Sensitive Endpoints**: 20 requests per 15 minutes.

---

## 2. Core Endpoints

### 2.1 System Health
- **`GET /api/health`**
  - **Auth**: Public
  - **Description**: Verifies service status, uptime, and database connectivity.
  - **Response**: `200 OK`
    ```json
    {
      "status": "healthy",
      "service": "EduVault AI Express API",
      "version": "1.0.0",
      "timestamp": "2026-10-09T14:00:00.000Z"
    }
    ```

### 2.2 User Profile & Account
- **`GET /api/me`**
  - **Auth**: Required
  - **Description**: Retrieves profile, preferences, student metadata, and credit balance.
  - **Response**: `200 OK`
    ```json
    {
      "success": true,
      "user": {
        "id": "uuid",
        "email": "student@example.com",
        "fullName": "Pooja Sharma",
        "avatarUrl": null,
        "studentType": "school",
        "institution": "Delhi Public School",
        "gradeOrYear": "Class 12",
        "bio": "JEE 2026 aspirant",
        "preferredLanguage": "en",
        "credits": 45,
        "streakDays": 7
      }
    }
    ```

- **`PATCH /api/me`**
  - **Auth**: Required
  - **Body**:
    ```json
    {
      "fullName": "Pooja Sharma",
      "bio": "Updated bio text",
      "studentType": "college",
      "institution": "IIT Delhi",
      "gradeOrYear": "1st Year",
      "preferredLanguage": "hi",
      "skills": ["Python", "Mechanics"]
    }
    ```
  - **Response**: `200 OK`

---

## 3. Academic & Content Endpoints

### 3.1 Notes & Vault Documents
- **`GET /api/notes?search=&subject=&limit=20&page=1`**
  - **Auth**: Required
  - **Description**: Returns paginated list of notes owned by the caller.

- **`POST /api/notes`**
  - **Auth**: Required
  - **Body**:
    ```json
    {
      "title": "Quantum Mechanics Wave Functions",
      "content": "Notes content in Markdown...",
      "subject": "Physics",
      "tags": ["jee", "quantum", "physics"]
    }
    ```

- **`PATCH /api/notes/:id`**
  - **Auth**: Required (Owner verification)
  - **Body**: `{ "title": "Updated Title", "content": "Updated content..." }`

- **`DELETE /api/notes/:id`**
  - **Auth**: Required (Owner verification)
  - **Response**: `200 OK`

### 3.2 Bookmarks
- **`GET /api/bookmarks`**
  - **Auth**: Required
  - **Description**: Returns all saved bookmarked questions, notes, and topics.

- **`POST /api/bookmarks`**
  - **Auth**: Required
  - **Body**:
    ```json
    {
      "itemType": "question | note | topic | pyq",
      "itemId": "string",
      "title": "Wave Optics Single Slit Diffraction",
      "metadata": { "subject": "Physics", "year": 2024 }
    }
    ```

- **`DELETE /api/bookmarks/:id`**
  - **Auth**: Required

### 3.3 Subjects & Topic Directory
- **`GET /api/subjects`**
  - **Auth**: Public or Authenticated
  - **Description**: Returns all supported curriculum tracks, subjects, chapters, and topic completion counts.

---

## 4. Quizzes, Exams & Analytics

### 4.1 Quizzes
- **`GET /api/quizzes?subject=Physics`**
  - **Auth**: Optional / Required for personal history
- **`POST /api/quizzes/:id/attempts`**
  - **Auth**: Required
  - **Body**:
    ```json
    {
      "answers": { "q1": "B", "q2": "D" },
      "timeSpentSeconds": 240,
      "score": 85,
      "totalQuestions": 10
    }
    ```
  - **Response**: Triggers credit rewards via server rules.

### 4.2 Mock Tests & PYQs
- **`GET /api/mock-tests`** & **`POST /api/mock-tests/:id/attempts`**
  - Simulates timed exam conditions with question status tracking (answered, marked for review, unvisited).
- **`GET /api/pyqs?subject=Chemistry&year=2023&exam=JEE`**
  - Searchable previous year questions with verified solutions and difficulty tagging.

### 4.3 Mistakes Book & Viva
- **`GET /api/mistakes`**
  - Aggregates incorrect answers from quizzes and mock tests for targeted revision.
- **`POST /api/viva-sessions`**
  - Initiates or submits oral viva voce examinations with spoken/typed responses and AI teacher evaluation.

---

## 5. AI Teaching & Multimodal Services

All AI endpoints enforce server-authoritative rate limits and validate that API keys are never exposed to browser bundles.

### 5.1 Interactive AI Tutor
- **`POST /api/ai/chat`**
  - **Auth**: Required
  - **Body**:
    ```json
    {
      "message": "Explain Lenz's Law with practical examples",
      "subject": "Physics",
      "conversationHistory": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
      ]
    }
    ```
  - **Response**: Formatted markdown explanation, follow-up questions, and speech-ready text.

### 5.2 3D Classroom Lesson Generation
- **`POST /api/ai/lesson`**
  - **Auth**: Required
  - **Body**:
    ```json
    {
      "topic": "Newton's Laws of Motion",
      "subject": "Physics",
      "gradeLevel": "Class 11",
      "language": "en"
    }
    ```
  - **Response**: Structured lesson with sections, blackboard text highlights, and teacher speech script synchronized for the 3D Avatar.

### 5.3 Vision Problem Solver (Camera)
- **`POST /api/ai/solve-image`**
  - **Auth**: Required
  - **Body**:
    ```json
    {
      "imageBase64": "data:image/jpeg;base64,...",
      "subject": "Mathematics",
      "userHint": "Need step-by-step calculus integration"
    }
    ```
  - **Response**: OCR extracted equation, step-by-step mathematical proof, and final answer.

### 5.4 Document Analysis (Vault)
- **`POST /api/ai/solve-document`**
  - **Auth**: Required
  - **Body**:
    ```json
    {
      "documentText": "Extracted text chunk...",
      "query": "Summarize key formulas in chapter 3"
    }
    ```

---

## 6. Credits, Impact & NGO System

### 6.1 Server-Authoritative Credits
- **`GET /api/credits`**
  - **Auth**: Required
  - **Response**: Current balance, today's earned points, daily cap status (60 points/day), and ledger history.
- **`POST /api/credits/award`**
  - **Auth**: Required (Enforces idempotency key and server-side eligibility checks).

### 6.2 Verified Impact
- **`GET /api/impact`**
  - **Auth**: Public
  - **Description**: Returns verified aggregate learning statistics (total hours learned, quizzes completed, NGO students sponsored). Never displays fake or unverified stats.

### 6.3 NGO Portal
- **`POST /api/ngo/partners`**
  - **Auth**: Required (Partner authorization)
- **`POST /api/ngo/import-students`**
  - **Auth**: Required (Partner authorization)
  - Bulk provisions access codes for underprivileged learning centers with deduplication.
