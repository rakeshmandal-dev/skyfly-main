import type { HologramSegment, UniversalHologramScene } from "@/lib/classroom-ai.server";

export type CameraPreset =
  | "overview"
  | "teacher"
  | "blackboard"
  | "front_seat"
  | "back_seat"
  | "podium"
  | "free";

export type LessonTopic = {
  id: string;
  title: string;
  subject: string;
  subtitle: string;
  boardHeading: string;
  boardFormulas: string[];
  boardNotes: string[];
  speechText: string;
  speechTextHindi?: string;
  hologramSegments?: HologramSegment[];
  followUpQuestions?: string[];
  disclaimer?: string;
  isSafetyWarning?: boolean;
};

export interface ClassroomParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatarColor: string;
  seatNumber: number; // 0 to 39
  isHandRaised: boolean;
  handRaisedAt?: string | null;
  isSpeaking: boolean;
  joinedAt: string;
}

export interface ClassroomRoomState {
  id: string;
  name: string;
  description?: string;
  maxCapacity: number;
  activeTopicId: string;
  speakingStudentId: string | null;
}

export interface ClassroomSceneProps {
  currentTopic: LessonTopic;
  speaking: boolean;
  thinking: boolean;
  cameraPreset: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
  onDeskSelect?: (deskIndex: number) => void;
  selectedDesk?: number | null;
  mouthLevel?: React.RefObject<number>;
  nodAt?: number;
  // Multi-user Realtime Props
  participants?: ClassroomParticipant[];
  myUserId?: string | null;
  mySeat?: number | null;
  speakingStudentId?: string | null;
  // Hologram Props
  activeHologramSegment?: HologramSegment | UniversalHologramScene | null;
  showHologram?: boolean;
  onNextHologramStep?: () => void;
  onPrevHologramStep?: () => void;
  onReplayHologramStep?: () => void;
  onToggleHologramSpeech?: () => void;
}
