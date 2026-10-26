import { useEffect, useState, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { ClassroomParticipant, ClassroomRoomState, LessonTopic } from "@/components/Classroom3D/types";

const AVATAR_COLORS = [
  "#38bdf8", // Sky Blue
  "#ec4899", // Pink
  "#a855f7", // Purple
  "#10b981", // Emerald Green
  "#f59e0b", // Amber
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#e11d48", // Rose
];

// Initial demo simulated peers so classroom feels lively even before other students connect
const INITIAL_DEMO_PEERS: ClassroomParticipant[] = [
  {
    id: "demo-p1",
    userId: "demo-u1",
    displayName: "Aarav Sharma",
    avatarColor: "#38bdf8",
    seatNumber: 1,
    isHandRaised: false,
    isSpeaking: false,
    joinedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "demo-p2",
    userId: "demo-u2",
    displayName: "Ananya Iyer",
    avatarColor: "#ec4899",
    seatNumber: 3,
    isHandRaised: true,
    handRaisedAt: new Date(Date.now() - 1000 * 45).toISOString(),
    isSpeaking: false,
    joinedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "demo-p3",
    userId: "demo-u3",
    displayName: "Rohan Verma",
    avatarColor: "#10b981",
    seatNumber: 6,
    isHandRaised: false,
    isSpeaking: false,
    joinedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "demo-p4",
    userId: "demo-u4",
    displayName: "Priya Patel",
    avatarColor: "#a855f7",
    seatNumber: 12,
    isHandRaised: false,
    isSpeaking: false,
    joinedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "demo-p5",
    userId: "demo-u5",
    displayName: "Devansh Nair",
    avatarColor: "#f59e0b",
    seatNumber: 22,
    isHandRaised: true,
    handRaisedAt: new Date(Date.now() - 1000 * 20).toISOString(),
    isSpeaking: false,
    joinedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "demo-p6",
    userId: "demo-u6",
    displayName: "Sneha Mukherjee",
    avatarColor: "#06b6d4",
    seatNumber: 34,
    isHandRaised: false,
    isSpeaking: false,
    joinedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
];

export function useClassroomRealtime(
  roomId: string = "default-classroom",
  onTopicSync?: (topic: LessonTopic, stepIndex: number) => void
) {
  const [participants, setParticipants] = useState<ClassroomParticipant[]>(INITIAL_DEMO_PEERS);
  const [roomState, setRoomState] = useState<ClassroomRoomState>({
    id: roomId,
    name: "Physics & AI Masterclass (40 Seats)",
    maxCapacity: 40,
    activeTopicId: "physics-newton",
    speakingStudentId: null,
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("eduvault_classroom_uid");
      if (stored) return stored;
      const newUid = "student_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("eduvault_classroom_uid", newUid);
      return newUid;
    }
    return "student_guest";
  });

  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("eduvault_student_name") || "You (Student)";
    }
    return "You (Student)";
  });

  const [currentUserColor] = useState<string>(() => {
    const idx = Math.floor(Math.random() * AVATAR_COLORS.length);
    return AVATAR_COLORS[idx] || "#38bdf8";
  });

  const channelRef = useRef<any>(null);
  const onTopicSyncRef = useRef(onTopicSync);
  onTopicSyncRef.current = onTopicSync;

  const myParticipant = participants.find((p) => p.userId === currentUserId) || null;
  const mySeat = myParticipant?.seatNumber ?? null;
  const isHandRaised = myParticipant?.isHandRaised ?? false;
  const isFull = participants.length >= 40;

  // Hand-raise queue sorted by timestamp
  const handRaiseQueue = participants
    .filter((p) => p.isHandRaised)
    .sort((a, b) => {
      const timeA = a.handRaisedAt ? new Date(a.handRaisedAt).getTime() : 0;
      const timeB = b.handRaisedAt ? new Date(b.handRaisedAt).getTime() : 0;
      return timeA - timeB;
    });

  // Fetch initial room & participants from Supabase if configured
  const fetchRoomData = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      // Check auth user
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setCurrentUserId(authData.user.id);
        const name =
          authData.user.user_metadata?.full_name ||
          authData.user.email?.split("@")[0] ||
          "Student";
        setCurrentUserDisplayName(name);
      }

      // Fetch room
      const { data: rData } = await supabase
        .from("classroom_rooms" as any)
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (rData) {
        setRoomState({
          id: (rData as any).id,
          name: (rData as any).name,
          description: (rData as any).description,
          maxCapacity: (rData as any).max_capacity || 40,
          activeTopicId: (rData as any).active_topic_id || "physics-newton",
          speakingStudentId: (rData as any).speaking_student_id || null,
        });
      }

      // Fetch participants
      const { data: pData } = await supabase
        .from("classroom_participants" as any)
        .select("*")
        .eq("room_id", roomId);

      if (pData && (pData as any[]).length > 0) {
        const mapped: ClassroomParticipant[] = (pData as any[]).map((row) => ({
          id: row.id,
          userId: row.user_id,
          displayName: row.display_name,
          avatarColor: row.avatar_color,
          seatNumber: row.seat_number,
          isHandRaised: row.is_hand_raised,
          handRaisedAt: row.hand_raised_at,
          isSpeaking: row.is_speaking,
          joinedAt: row.joined_at,
        }));
        setParticipants(mapped);
      }
    } catch (err) {
      console.warn("[ClassroomRealtime] Initial fetch fallback:", err);
    }
  }, [roomId]);

  useEffect(() => {
    void fetchRoomData();
  }, [fetchRoomData]);

  // Subscribe to Supabase Realtime Channel
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel(`classroom_${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUserId },
      },
    });

    channelRef.current = channel;

    channel
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "classroom_participants",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const row = payload.new;
            const updatedItem: ClassroomParticipant = {
              id: row.id,
              userId: row.user_id,
              displayName: row.display_name,
              avatarColor: row.avatar_color,
              seatNumber: row.seat_number,
              isHandRaised: row.is_hand_raised,
              handRaisedAt: row.hand_raised_at,
              isSpeaking: row.is_speaking,
              joinedAt: row.joined_at,
            };

            setParticipants((prev) => {
              const existingIdx = prev.findIndex((p) => p.userId === row.user_id || p.id === row.id);
              if (existingIdx >= 0) {
                const copy = [...prev];
                copy[existingIdx] = updatedItem;
                return copy;
              }
              return [...prev, updatedItem];
            });
          } else if (payload.eventType === "DELETE") {
            const row = payload.old;
            setParticipants((prev) => prev.filter((p) => p.userId !== row.user_id && p.id !== row.id));
          }
        }
      )
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "classroom_rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setRoomState((prev) => ({
              ...prev,
              activeTopicId: payload.new.active_topic_id || prev.activeTopicId,
              speakingStudentId: payload.new.speaking_student_id,
            }));
          }
        }
      )
      // Listen for Live AI Teacher Lesson & Hologram Broadcasts
      .on("broadcast", { event: "topic_sync" }, ({ payload }: any) => {
        if (payload?.topic && onTopicSyncRef.current) {
          onTopicSyncRef.current(payload.topic, payload.stepIndex || 0);
        }
      })
      // Realtime Presence Track
      .on("presence", { event: "sync" }, () => {
        // Active participants synced
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && mySeat !== null) {
          channel.track({
            userId: currentUserId,
            displayName: currentUserDisplayName,
            seatNumber: mySeat,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, currentUserId, mySeat, currentUserDisplayName, fetchRoomData]);

  // Actions
  // 1. Join or switch seat
  const joinSeat = useCallback(
    async (preferredSeat?: number, customName?: string, customColor?: string) => {
      const name = customName || currentUserDisplayName;
      const color = customColor || currentUserColor;

      // Find available seat
      let assignedSeat = preferredSeat;
      const occupiedSeats = new Set(participants.map((p) => p.seatNumber));

      if (assignedSeat === undefined || occupiedSeats.has(assignedSeat)) {
        for (let s = 0; s < 40; s++) {
          if (!occupiedSeats.has(s)) {
            assignedSeat = s;
            break;
          }
        }
      }

      if (assignedSeat === undefined || assignedSeat >= 40) {
        return { success: false, error: "Classroom is full (40/40 seats occupied)." };
      }

      // Local optimistic update
      const newParticipant: ClassroomParticipant = {
        id: `p-${currentUserId}`,
        userId: currentUserId,
        displayName: name,
        avatarColor: color,
        seatNumber: assignedSeat,
        isHandRaised: false,
        isSpeaking: false,
        joinedAt: new Date().toISOString(),
      };

      setParticipants((prev) => {
        const filtered = prev.filter((p) => p.userId !== currentUserId);
        return [...filtered, newParticipant];
      });

      // Server update if configured
      if (isSupabaseConfigured) {
        try {
          await supabase.rpc("join_classroom_seat" as any, {
            p_room_id: roomId,
            p_user_id: currentUserId,
            p_display_name: name,
            p_avatar_color: color,
            p_preferred_seat: assignedSeat,
          });
        } catch (err) {
          console.warn("[ClassroomRealtime] RPC join fallback:", err);
        }
      }

      return { success: true, seatNumber: assignedSeat };
    },
    [currentUserId, currentUserDisplayName, currentUserColor, participants, roomId]
  );

  // 2. Leave seat
  const leaveSeat = useCallback(async () => {
    setParticipants((prev) => prev.filter((p) => p.userId !== currentUserId));

    if (isSupabaseConfigured) {
      try {
        await supabase.rpc("leave_classroom_seat" as any, {
          p_room_id: roomId,
          p_user_id: currentUserId,
        });
      } catch (err) {
        console.warn("[ClassroomRealtime] RPC leave fallback:", err);
      }
    }
  }, [currentUserId, roomId]);

  // 3. Toggle Hand Raise
  const toggleRaiseHand = useCallback(async () => {
    const nextRaised = !isHandRaised;
    const nowIso = nextRaised ? new Date().toISOString() : null;

    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === currentUserId
          ? {
              ...p,
              isHandRaised: nextRaised,
              handRaisedAt: nowIso,
            }
          : p
      )
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.rpc("toggle_classroom_raise_hand" as any, {
          p_room_id: roomId,
          p_user_id: currentUserId,
          p_raised: nextRaised,
        });
      } catch (err) {
        console.warn("[ClassroomRealtime] RPC hand raise fallback:", err);
      }
    }
  }, [currentUserId, isHandRaised, roomId]);

  // 4. Select student to speak (Teacher / Host control)
  const selectStudentToSpeak = useCallback(
    async (targetUserId: string) => {
      setRoomState((prev) => ({
        ...prev,
        speakingStudentId: targetUserId,
      }));

      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          isSpeaking: p.userId === targetUserId,
          // Lower hand once called on
          isHandRaised: p.userId === targetUserId ? false : p.isHandRaised,
          handRaisedAt: p.userId === targetUserId ? null : p.handRaisedAt,
        }))
      );

      if (isSupabaseConfigured) {
        try {
          await supabase.rpc("select_speaking_student" as any, {
            p_room_id: roomId,
            p_user_id: targetUserId,
          });
        } catch (err) {
          console.warn("[ClassroomRealtime] RPC select speaking fallback:", err);
        }
      }
    },
    [roomId]
  );

  // 5. Clear speaking student
  const clearSpeakingStudent = useCallback(async () => {
    setRoomState((prev) => ({
      ...prev,
      speakingStudentId: null,
    }));

    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        isSpeaking: false,
      }))
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.rpc("select_speaking_student" as any, {
          p_room_id: roomId,
          p_user_id: null,
        });
      } catch (err) {
        console.warn("[ClassroomRealtime] RPC clear speaking fallback:", err);
      }
    }
  }, [roomId]);

  // 6. Broadcast active topic and scene to all students in the room
  const broadcastTopic = useCallback(
    (topic: LessonTopic, stepIndex: number = 0) => {
      if (channelRef.current && isSupabaseConfigured) {
        try {
          channelRef.current.send({
            type: "broadcast",
            event: "topic_sync",
            payload: { topic, stepIndex },
          });
        } catch (err) {
          console.warn("[ClassroomRealtime] Broadcast topic error:", err);
        }
      }
    },
    []
  );

  return {
    participants,
    roomState,
    currentUserId,
    currentUserDisplayName,
    myParticipant,
    mySeat,
    isHandRaised,
    isFull,
    handRaiseQueue,
    joinSeat,
    leaveSeat,
    toggleRaiseHand,
    selectStudentToSpeak,
    clearSpeakingStudent,
    setCurrentUserDisplayName,
    broadcastTopic,
  };
}
