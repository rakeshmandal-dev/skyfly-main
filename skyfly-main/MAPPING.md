# EduVault AI — Complete Feature to Route to API to Database Mapping

This document provides a mapping of all 34 educational modules and system features in EduVault AI, detailing the frontend route, user controls, backend API endpoints, and corresponding PostgreSQL tables.

---

| # | Feature / Module | Frontend Route | User Controls & Interactivity | Backend API Endpoint | Database Tables / Entities |
|---|---|---|---|---|---|
| **1** | **Landing & Hero** | `/` | 3D Hero stage, orbit controls, "Start Learning" CTA, feature overview, social impact preview | `GET /api/impact` | `profiles`, `learning_credits_ledger` |
| **2** | **Authentication** | `/auth` | Sign in, sign up, email verification awaiting state, resend confirmation, password reset, OAuth | `POST /auth/v1/signup`, `POST /auth/v1/token` | `auth.users`, `profiles`, `user_preferences` |
| **3** | **Student Dashboard** | `/dashboard` | Welcome greeting, streak counter, study planner widget, quick action cards, resume learning | `GET /api/me`, `GET /api/progress`, `GET /api/planner` | `profiles`, `planner_tasks`, `learning_credits_ledger` |
| **4** | **3D Classroom** | `/classroom` | Procedural 3D Teacher avatar, speech synthesis, blackboard notes, section navigation, controls | `POST /api/ai/lesson`, `POST /api/credits/award` | `subjects`, `topics`, `learning_credits_ledger` |
| **5** | **AI Tutor & Chat** | `/chat` | Contextual conversational AI, prompt recommendations, LaTeX math rendering, copy/save note | `POST /api/ai/chat` | `notes`, `user_preferences` |
| **6** | **AI Mentor** | `/mentor` | Academic roadmap guidance, goal-setting conversation, motivation check-ins | `POST /api/ai/mentor` | `career_plans`, `profiles` |
| **7** | **Personal Teacher** | `/teacher` | Subject-specific deep inquiry, step-by-step Socratic teaching, teacher personality select | `POST /api/ai/chat` | `subjects`, `notes` |
| **8** | **Voice Assistant** | `/voice` | Real-time speech recognition, live audio waveform, spoken response with interruption | `POST /api/ai/voice/session` | `learning_sessions`, `user_preferences` |
| **9** | **Camera Solver** | `/camera` | Image upload/webcam capture, OCR formula detection, editable text input, step-by-step solution | `POST /api/ai/solve-image` | `mistake_book`, `notes` |
| **10** | **Subjects Directory** | `/subjects` | Track selector (JEE/NEET/Boards), subject cards, chapter accordion, topic progress indicators | `GET /api/subjects` | `subjects`, `chapters`, `topics` |
| **11** | **Learn & Topics** | `/learn` | Interactive reading mode, key concepts highlights, embedded formula sheets, complete topic button | `GET /api/subjects`, `POST /api/progress` | `topics`, `learning_sessions` |
| **12** | **Smart Notes** | `/notes` | Markdown editor, autosave, tag filtering, subject categorisation, export to PDF/Markdown | `GET/POST/PATCH/DELETE /api/notes` | `notes` |
| **13** | **Student Vault** | `/vault` | Document drag-and-drop, PDF viewer, secure cloud storage, AI document summarization | `POST /api/ai/solve-document`, Storage API | `vault_documents` |
| **14** | **Bookmarks** | `/bookmarks` | Saved questions, bookmarked notes, filter by subject, quick jump to source | `GET/POST/DELETE /api/bookmarks` | `bookmarks` |
| **15** | **Quizzes** | `/quiz` | Multiple-choice options, instant feedback, timer, score calculation, auto-credit reward | `GET /api/quizzes`, `POST /api/quizzes/:id/attempts` | `quizzes`, `quiz_questions`, `quiz_attempts` |
| **16** | **Exam Simulation** | `/exam` | Timed full-length paper, question palette, marked for review, submission summary, result analysis | `GET /api/mock-tests`, `POST /api/mock-tests/:id/attempts` | `mock_tests`, `mock_test_attempts` |
| **17** | **Mock Tests** | `/mock-tests` | Test library, difficulty filter, past attempt history, percentile and accuracy breakdown | `GET /api/mock-tests` | `mock_tests`, `mock_test_attempts` |
| **18** | **PYQs Bank** | `/pyqs` | Filter by exam (JEE Main/Adv, NEET), year (2018–2025), subject, with verified solutions | `GET /api/pyqs` | `pyqs` |
| **19** | **Oral Viva** | `/viva` | Spoken or typed response, AI examiner questioning, confidence evaluation, feedback | `POST /api/viva-sessions` | `viva_sessions` |
| **20** | **Mistake Book** | `/mistakes` | Auto-logged incorrect answers from quizzes, error categorisation, retry question, mastery state | `GET /api/mistakes`, `PATCH /api/mistakes/:id` | `mistake_book` |
| **21** | **Study Planner** | `/planner` | Daily/weekly study calendar, task creation, deadline reminders, priority levels, completion toggle | `GET/POST/PATCH/DELETE /api/planner` | `planner_tasks` |
| **22** | **Career Guidance** | `/career` | Interest & skill inputs, AI roadmap generation, milestones, recommended university exams | `GET/POST /api/career-plans` | `career_plans` |
| **23** | **Analytics & Progress** | `/progress` | Study hours chart, subject distribution radar, syllabus completion percentage | `GET /api/progress` | `learning_sessions`, `quiz_attempts` |
| **24** | **Exam Readiness** | `/readiness` | Multi-factor readiness score derived from accuracy, syllabus coverage, and consistency | `GET /api/progress` | `quiz_attempts`, `topics` |
| **25** | **Credits & Rewards** | `/credits` | Balance display, daily streak, earning rules, transaction ledger, claim rewards button | `GET /api/credits`, `POST /api/credits/award` | `learning_credits_ledger`, `profiles` |
| **26** | **Leaderboard** | `/leaderboard` | Weekly/all-time study ranking, privacy-safe display names, school/college filters | `GET /api/leaderboard` | `profiles`, `learning_credits_ledger` |
| **27** | **Profile & Settings** | `/settings` | Update full name, bio, student type, academic grade, UI theme switcher, preferred language | `GET/PATCH /api/me`, `GET/PATCH /api/settings` | `profiles`, `user_preferences` |
| **28** | **Certificates** | `/certificates` | Verifiable completion certificates, QR code verification, PDF download | `GET /api/certificates` | `certificates` |
| **29** | **Study Network** | `/network` | Peer study groups, shared public notes, privacy-respecting collaboration | `GET /api/network` | `profiles`, `notes` |
| **30** | **Feedback** | `/feedback` | Star rating, category selector (bug, feature, content), user submission history | `GET/POST /api/feedback` | `platform_feedback` |
| **31** | **Mood & Reflection** | `/mood` | Private daily mood tracker, study stress reflection, personalized mindfulness tips | `GET/POST/DELETE /api/mood` | `mood_logs` |
| **32** | **Low-Resource Mode** | `/low-resource` | Lightweight text-first UI, bandwidth saver, offline notes cache, reduced animation mode | LocalStorage + `GET /api/notes` | Client-side cache + `notes` |
| **33** | **Social Impact** | `/impact` | Aggregate hours learned, underprivileged students reached, partner metrics | `GET /api/impact` | `profiles`, `ngo_partners` |
| **34** | **NGO Portal** | `/ngo-portal` | Partner registration, batch student email import, access code generation and monitoring | `POST /api/ngo/partners`, `POST /api/ngo/import-students` | `ngo_partners`, `impact_access_codes` |
