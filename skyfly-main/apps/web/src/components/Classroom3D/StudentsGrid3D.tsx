import { useMemo } from "react";
import { StudentAvatar3D } from "./StudentAvatar3D";
import { DESK_COLUMNS, DESK_ROWS } from "./DesksInstanced";
import type { ClassroomParticipant } from "./types";

interface StudentsGrid3DProps {
  participants: ClassroomParticipant[];
  myUserId?: string | null;
}

export function StudentsGrid3D({ participants = [], myUserId }: StudentsGrid3DProps) {
  // Pre-calculate desk world positions for each seat (0 to 39)
  const seatCoordinates = useMemo(() => {
    const map = new Map<number, [number, number, number]>();
    let idx = 0;
    for (const r of DESK_ROWS) {
      for (const c of DESK_COLUMNS) {
        map.set(idx, [c, 0, r]);
        idx++;
      }
    }
    return map;
  }, []);

  return (
    <group>
      {participants.map((participant) => {
        const coords = seatCoordinates.get(participant.seatNumber) || [0, 0, 0];
        const isMe = participant.userId === myUserId;

        return (
          <StudentAvatar3D
            key={participant.userId || participant.id}
            participant={participant}
            position={coords}
            isMe={isMe}
          />
        );
      })}
    </group>
  );
}
