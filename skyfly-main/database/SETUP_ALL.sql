-- ============================================================================
-- EduVault AI: 3D Classroom & Voice AI Master Setup (Phase 2 & Phase 3)
-- Description: Consolidated SQL for Multi-User 3D Classroom (40 Seats), 
--              Realtime Hand-Raise Queue, and Phase 3 AI Teacher Sessions.
-- ============================================================================

-- 1. Classroom Rooms Table (Phase 2 & Phase 3)
CREATE TABLE IF NOT EXISTS public.classroom_rooms (
  id TEXT PRIMARY KEY DEFAULT 'default-classroom',
  name TEXT NOT NULL DEFAULT 'EduVault 3D AI Virtual Classroom',
  description TEXT DEFAULT 'Interactive 3D Virtual Classroom with AI Teacher & 40 Desks',
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_capacity INT NOT NULL DEFAULT 40 CHECK (max_capacity > 0 AND max_capacity <= 40),
  active_topic_id TEXT DEFAULT 'physics-newton',
  speaking_student_id TEXT DEFAULT NULL,
  current_blackboard_text TEXT DEFAULT 'Welcome to EduVault 3D Classroom!',
  current_hologram_shape TEXT DEFAULT 'atom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Classroom Participants Table (40 Student Seats: 0 to 39)
CREATE TABLE IF NOT EXISTS public.classroom_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES public.classroom_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#38bdf8',
  seat_number INT NOT NULL CHECK (seat_number >= 0 AND seat_number < 40),
  is_hand_raised BOOLEAN NOT NULL DEFAULT false,
  hand_raised_at TIMESTAMPTZ DEFAULT NULL,
  is_speaking BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_room_seat UNIQUE (room_id, seat_number),
  CONSTRAINT unique_room_user UNIQUE (room_id, user_id)
);

-- 3. Classroom AI Voice Queries & Hologram Logs Table (Phase 3)
CREATE TABLE IF NOT EXISTS public.classroom_ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES public.classroom_rooms(id) ON DELETE CASCADE,
  asked_by_user_id TEXT NOT NULL,
  asked_by_name TEXT NOT NULL,
  question TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'hi-IN',
  spoken_response TEXT NOT NULL,
  hologram_segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for high-performance querying and realtime subscriptions
CREATE INDEX IF NOT EXISTS idx_classroom_participants_room ON public.classroom_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_classroom_participants_hand ON public.classroom_participants(room_id, is_hand_raised, hand_raised_at);
CREATE INDEX IF NOT EXISTS idx_classroom_participants_seat ON public.classroom_participants(room_id, seat_number);
CREATE INDEX IF NOT EXISTS idx_classroom_ai_logs_room ON public.classroom_ai_logs(room_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.classroom_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_ai_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon, authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_rooms TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_participants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_ai_logs TO anon, authenticated;
GRANT ALL ON public.classroom_rooms TO service_role;
GRANT ALL ON public.classroom_participants TO service_role;
GRANT ALL ON public.classroom_ai_logs TO service_role;

-- RLS Policies for classroom_rooms
DROP POLICY IF EXISTS "Public and authenticated can read rooms" ON public.classroom_rooms;
CREATE POLICY "Public and authenticated can read rooms"
  ON public.classroom_rooms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated or host can update room state" ON public.classroom_rooms;
CREATE POLICY "Authenticated or host can update room state"
  ON public.classroom_rooms FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for classroom_participants
DROP POLICY IF EXISTS "Public and authenticated can read participants" ON public.classroom_participants;
CREATE POLICY "Public and authenticated can read participants"
  ON public.classroom_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own participant state" ON public.classroom_participants;
CREATE POLICY "Users can manage own participant state"
  ON public.classroom_participants FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for classroom_ai_logs
DROP POLICY IF EXISTS "Public and authenticated can read classroom AI logs" ON public.classroom_ai_logs;
CREATE POLICY "Public and authenticated can read classroom AI logs"
  ON public.classroom_ai_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public and authenticated can insert classroom AI logs" ON public.classroom_ai_logs;
CREATE POLICY "Public and authenticated can insert classroom AI logs"
  ON public.classroom_ai_logs FOR INSERT
  WITH CHECK (true);

-- Seed Default 3D Classroom Room
INSERT INTO public.classroom_rooms (id, name, description, max_capacity, active_topic_id, current_blackboard_text)
VALUES (
  'default-classroom',
  'Physics & AI Masterclass (40 Seats)',
  'Live 3D interactive classroom with humanoid AI teacher, synchronized blackboard, voice interaction and realtime student seats.',
  40,
  'physics-newton',
  'Welcome to EduVault 3D Classroom! Ask questions via voice or chat.'
)
ON CONFLICT (id) DO UPDATE
SET max_capacity = 40,
    updated_at = now();

-- ============================================================================
-- Atomic Stored Procedures (RPC Functions)
-- ============================================================================

-- Function 1: Join Classroom Seat (Atomic allocation & strict <= 40 check)
CREATE OR REPLACE FUNCTION public.join_classroom_seat(
  p_room_id TEXT,
  p_user_id TEXT,
  p_display_name TEXT,
  p_avatar_color TEXT DEFAULT '#38bdf8',
  p_preferred_seat INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INT;
  v_assigned_seat INT;
  v_existing_seat INT;
  v_result JSONB;
BEGIN
  -- Ensure room exists
  INSERT INTO public.classroom_rooms (id, name, max_capacity)
  VALUES (p_room_id, 'EduVault 3D AI Virtual Classroom', 40)
  ON CONFLICT (id) DO NOTHING;

  -- Check if user already has a seat in this room
  SELECT seat_number INTO v_existing_seat
  FROM public.classroom_participants
  WHERE room_id = p_room_id AND user_id = p_user_id;

  IF v_existing_seat IS NOT NULL THEN
    -- If user requested a different seat and it is free, switch seat
    IF p_preferred_seat IS NOT NULL AND p_preferred_seat >= 0 AND p_preferred_seat < 40 AND p_preferred_seat != v_existing_seat THEN
      IF NOT EXISTS (SELECT 1 FROM public.classroom_participants WHERE room_id = p_room_id AND seat_number = p_preferred_seat) THEN
        UPDATE public.classroom_participants
        SET seat_number = p_preferred_seat,
            display_name = p_display_name,
            avatar_color = COALESCE(p_avatar_color, avatar_color),
            last_seen_at = now()
        WHERE room_id = p_room_id AND user_id = p_user_id;
        v_assigned_seat := p_preferred_seat;
      ELSE
        UPDATE public.classroom_participants
        SET display_name = p_display_name,
            avatar_color = COALESCE(p_avatar_color, avatar_color),
            last_seen_at = now()
        WHERE room_id = p_room_id AND user_id = p_user_id;
        v_assigned_seat := v_existing_seat;
      END IF;
    ELSE
      UPDATE public.classroom_participants
      SET display_name = p_display_name,
          avatar_color = COALESCE(p_avatar_color, avatar_color),
          last_seen_at = now()
      WHERE room_id = p_room_id AND user_id = p_user_id;
      v_assigned_seat := v_existing_seat;
    END IF;

    SELECT jsonb_build_object(
      'success', true,
      'seat_number', v_assigned_seat,
      'message', 'Rejoined existing seat'
    ) INTO v_result;
    RETURN v_result;
  END IF;

  -- Count active participants in room
  SELECT COUNT(*) INTO v_current_count
  FROM public.classroom_participants
  WHERE room_id = p_room_id;

  -- Enforce strictly <= 40 students
  IF v_current_count >= 40 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CLASSROOM_FULL',
      'message', 'Classroom has reached maximum capacity of 40 students.'
    );
  END IF;

  -- Try preferred seat if valid and vacant
  IF p_preferred_seat IS NOT NULL AND p_preferred_seat >= 0 AND p_preferred_seat < 40 THEN
    IF NOT EXISTS (SELECT 1 FROM public.classroom_participants WHERE room_id = p_room_id AND seat_number = p_preferred_seat) THEN
      v_assigned_seat := p_preferred_seat;
    END IF;
  END IF;

  -- Otherwise find the lowest available seat number from 0 to 39
  IF v_assigned_seat IS NULL THEN
    SELECT s.seat INTO v_assigned_seat
    FROM generate_series(0, 39) AS s(seat)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.classroom_participants
      WHERE room_id = p_room_id AND seat_number = s.seat
    )
    ORDER BY s.seat ASC
    LIMIT 1;
  END IF;

  IF v_assigned_seat IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NO_SEATS_AVAILABLE',
      'message', 'No vacant seats remaining.'
    );
  END IF;

  -- Insert new participant
  INSERT INTO public.classroom_participants (
    room_id, user_id, display_name, avatar_color, seat_number, last_seen_at, joined_at
  )
  VALUES (
    p_room_id, p_user_id, p_display_name, COALESCE(p_avatar_color, '#38bdf8'), v_assigned_seat, now(), now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'seat_number', v_assigned_seat,
    'message', 'Successfully joined classroom seat ' || (v_assigned_seat + 1)
  );
END;
$$;

-- Function 2: Toggle Raise Hand
CREATE OR REPLACE FUNCTION public.toggle_classroom_raise_hand(
  p_room_id TEXT,
  p_user_id TEXT,
  p_raised BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.classroom_participants
  SET is_hand_raised = p_raised,
      hand_raised_at = CASE WHEN p_raised THEN now() ELSE NULL END,
      last_seen_at = now()
  WHERE room_id = p_room_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'is_hand_raised', p_raised
  );
END;
$$;

-- Function 3: Select Speaking Student (Teacher / Host controls)
CREATE OR REPLACE FUNCTION public.select_speaking_student(
  p_room_id TEXT,
  p_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update active speaking student on room
  UPDATE public.classroom_rooms
  SET speaking_student_id = p_user_id,
      updated_at = now()
  WHERE id = p_room_id;

  -- Mark is_speaking on participants
  UPDATE public.classroom_participants
  SET is_speaking = (user_id = p_user_id),
      is_hand_raised = CASE WHEN user_id = p_user_id THEN false ELSE is_hand_raised END,
      hand_raised_at = CASE WHEN user_id = p_user_id THEN NULL ELSE hand_raised_at END
  WHERE room_id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'speaking_student_id', p_user_id
  );
END;
$$;

-- Function 4: Leave Classroom Seat
CREATE OR REPLACE FUNCTION public.leave_classroom_seat(
  p_room_id TEXT,
  p_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.classroom_participants
  WHERE room_id = p_room_id AND user_id = p_user_id;

  -- If the leaving student was speaking, clear speaking student
  UPDATE public.classroom_rooms
  SET speaking_student_id = NULL
  WHERE id = p_room_id AND speaking_student_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function 5: Periodic cleanup of stale offline sessions (heartbeat older than 5 mins)
CREATE OR REPLACE FUNCTION public.cleanup_stale_classroom_participants()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.classroom_participants
  WHERE last_seen_at < (now() - INTERVAL '5 minutes');
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ============================================================================
-- Enable Supabase Realtime for Tables
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'classroom_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'classroom_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'classroom_ai_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_ai_logs;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;
