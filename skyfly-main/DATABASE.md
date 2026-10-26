# EduVault AI — Database Architecture & Migrations

EduVault AI utilizes PostgreSQL managed through Supabase and typed using **Drizzle ORM**. This document outlines the schema design, row-level security (RLS), migration history (0000–0008), credit accounting constraints, and backup/restore procedures.

---

## 1. Schema Overview

The database contains 22 specialized tables organized into distinct functional domains:

| Domain | Tables | Description |
| :--- | :--- | :--- |
| **Authentication & Profiles** | `profiles`, `user_preferences` | User profiles, student grades, bio, UI themes, and learning preferences |
| **Curriculum & Content** | `subjects`, `chapters`, `topics` | Academic syllabus hierarchy across competitive exams (JEE, NEET, CBSE) |
| **Study Management** | `notes`, `vault_documents`, `bookmarks` | User-authored markdown notes, uploaded PDFs/materials, saved items |
| **Assessment & Exams** | `quizzes`, `quiz_questions`, `quiz_attempts`, `mock_tests`, `mock_test_attempts`, `pyqs` | Question banks, simulated full-length tests, previous year papers |
| **Mastery & Reflection** | `mistake_book`, `viva_sessions`, `mood_logs` | Incorrect answer tracking for spaced repetition, oral viva records, well-being |
| **Planning & Goals** | `planner_tasks`, `career_plans` | Task scheduling, calendar events, AI-generated multi-year career roadmaps |
| **Gamification & Rewards** | `learning_credits_ledger`, `daily_credit_caps`, `certificates` | Server-authoritative credit balances, daily caps, verifiable achievement certificates |
| **Social & Impact** | `ngo_partners`, `impact_access_codes`, `platform_feedback` | NGO student sponsorship, referral tracking, platform feedback |

---

## 2. Row Level Security (RLS) & Ownership Rules

Every private table includes explicit RLS policies to guarantee data isolation:
- **Tenant Isolation**: Private records have an `owner_id` or `user_id` column referencing `auth.users(id)`.
- **Policy Enforcement**:
  - `SELECT`: Only where `auth.uid() = user_id` (or public for published subjects/quizzes).
  - `INSERT`: Strictly enforces `auth.uid() = user_id`.
  - `UPDATE`: Only where `auth.uid() = user_id`.
  - `DELETE`: Only where `auth.uid() = user_id`.
- **Server Bypass**: Privileged operations (credit calculations, NGO batch imports, AI usage metering) execute through the Node.js Express backend using trusted database connections or Supabase Service Role credentials.

---

## 3. Migration History (0000–0008)

All schema changes are tracked in versioned SQL migrations in `database/migrations`:

- **`0000_initial_schema.sql`**: Core user profiles, notes, subjects, and study planner tables.
- **`0001_quizzes_and_tests.sql`**: Quiz questions, mock tests, attempts, and scoring tables.
- **`0002_vault_and_storage.sql`**: File metadata storage and RLS for student vault documents.
- **`0003_pyq_and_mistakes.sql`**: Previous year questions database and Mistake Book tracking.
- **`0004_viva_and_career.sql`**: Oral viva voce records and structured career roadmap schemas.
- **`0005_mood_and_reflection.sql`**: Student well-being logs with encrypted sentiment values.
- **`0006_credit_rewards_system.sql`**: Stored procedure `award_learning_credits`, ledger transactions, daily capping of 60 points, and anti-fraud deduplication via unique reference keys (`ref_key`).
- **`0007_ngo_and_impact.sql`**: NGO partner organization records and access code provisioning.
- **`0008_certificates_and_feedback.sql`**: Certificate issuance hashes and user feedback submission tracking.

---

## 4. Server-Authoritative Credit Stored Procedure

Credit rewards are calculated and verified through the PostgreSQL function `award_learning_credits`:

```sql
CREATE OR REPLACE FUNCTION public.award_learning_credits(
  p_user_id UUID,
  p_activity VARCHAR,
  p_points INTEGER,
  p_ref_key VARCHAR,
  p_description TEXT
) RETURNS JSONB AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_daily_earned INTEGER := 0;
  v_cap INTEGER := 60;
  v_awarded INTEGER := 0;
BEGIN
  -- Check for duplicate awards using idempotent reference key
  IF EXISTS (SELECT 1 FROM public.learning_credits_ledger WHERE ref_key = p_ref_key) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate_reference_key');
  END IF;

  -- Calculate current daily earned total
  SELECT COALESCE(SUM(points), 0) INTO v_daily_earned
  FROM public.learning_credits_ledger
  WHERE user_id = p_user_id AND created_at >= v_today;

  -- Clamp award to remaining daily cap
  IF v_daily_earned >= v_cap THEN
    RETURN jsonb_build_object('success', false, 'reason', 'daily_cap_exceeded');
  END IF;

  v_awarded := LEAST(p_points, v_cap - v_daily_earned);

  -- Record transaction in immutable ledger
  INSERT INTO public.learning_credits_ledger (user_id, activity, points, ref_key, description)
  VALUES (p_user_id, p_activity, v_awarded, p_ref_key, p_description);

  -- Update aggregate profile balance
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + v_awarded,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'awarded', v_awarded, 'total_today', v_daily_earned + v_awarded);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Local Database Execution & Drizzle Migration

### Running Migrations
To apply migrations against your configured PostgreSQL database:
```bash
npm run db:migrate --workspace=@eduvault/database
```

### Seeding Development Data
To seed initial academic subjects, sample JEE/NEET topics, and test quizzes:
```bash
npm run db:seed --workspace=@eduvault/database
```

---

## 6. Backup & Recovery Procedure

### 6.1 Database Dump (Logical Backup)
Run `pg_dump` with custom format:
```bash
pg_dump -h <db_host> -p 5432 -U postgres -d postgres -F c -b -v -f eduvault_backup_$(date +%Y%m%d).dump
```

### 6.2 Restoration
To restore into a clean staging or production database:
```bash
pg_restore -h <db_host> -p 5432 -U postgres -d postgres -v eduvault_backup_20261009.dump
```
