import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Hand, Mic, Sparkles } from "lucide-react";
import type { ClassroomParticipant } from "./types";

interface StudentAvatar3DProps {
  participant: ClassroomParticipant;
  position: [number, number, number];
  isMe?: boolean;
}

const SKIN_TONE = "#d49b72";
const HAIR_COLORS = ["#1c1512", "#2e1c14", "#0f172a", "#3b2518", "#172554"];

export function StudentAvatar3D({
  participant,
  position,
  isMe = false,
}: StudentAvatar3DProps) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const rightForearm = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Mesh>(null);

  const armRaiseProgress = useRef(0);
  const hairColor = HAIR_COLORS[Math.abs(participant.seatNumber) % HAIR_COLORS.length] || "#1c1512";

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime + participant.seatNumber * 1.7;
    const dt = Math.min(0.1, delta);

    // Smooth hand raise animation transition
    const targetRaise = participant.isHandRaised ? 1 : 0;
    armRaiseProgress.current += (targetRaise - armRaiseProgress.current) * Math.min(1, dt * 6.5);
    const raise = armRaiseProgress.current;

    // Breathing & subtle idle fidget
    if (root.current) {
      root.current.position.y = position[1] + Math.sin(t * 1.6) * 0.005;
    }

    // Head looking towards the front blackboard/teacher with natural micro-rotations
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.5) * 0.08 + (participant.isSpeaking ? Math.sin(t * 3) * 0.06 : 0);
      head.current.rotation.x = -0.05 + Math.sin(t * 0.7) * 0.03 + (raise > 0.5 ? 0.08 : 0);
    }

    // Right Arm: Raises high in the air when hand is raised!
    if (rightArm.current && rightForearm.current) {
      // Idle sitting rest position on desk vs raised high hand
      const idleArmX = -0.3 + Math.sin(t * 1.2) * 0.04;
      const idleArmZ = -0.15;
      const idleForeX = -0.6;

      // Raised hand position: arm straight up with slight waving gesture
      const raisedArmX = -2.7 + Math.sin(t * 3.5) * 0.12;
      const raisedArmZ = 0.25;
      const raisedForeX = -0.2;

      rightArm.current.rotation.x = THREE.MathUtils.lerp(idleArmX, raisedArmX, raise);
      rightArm.current.rotation.z = THREE.MathUtils.lerp(idleArmZ, raisedArmZ, raise);
      rightForearm.current.rotation.x = THREE.MathUtils.lerp(idleForeX, raisedForeX, raise);
    }

    // Left arm resting naturally on the desk
    if (leftArm.current) {
      leftArm.current.rotation.x = -0.35 + Math.sin(t * 1.1 + 1.2) * 0.03;
      leftArm.current.rotation.z = 0.15;
    }

    // Speaking mouth animation
    if (jaw.current) {
      const open = participant.isSpeaking ? 0.05 + Math.abs(Math.sin(t * 15)) * 0.6 : 0.05;
      jaw.current.scale.set(1, open, 1);
    }
  });

  return (
    <group ref={root} position={position}>
      {/* 1. Seated Legs (Tucked under student desk) */}
      {[-0.14, 0.14].map((x) => (
        <group key={x} position={[x, 0.42, 0.52]}>
          {/* Thigh (horizontal sitting) */}
          <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.32, 6, 14]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* Shin (vertical down to floor) */}
          <mesh position={[0, -0.22, -0.38]} castShadow>
            <capsuleGeometry args={[0.068, 0.36, 6, 14]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* Student Sneaker / Shoe */}
          <mesh position={[0, -0.4, -0.34]} castShadow>
            <boxGeometry args={[0.11, 0.06, 0.2]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 2. Seated Torso & Shoulders (Hidden for local user in 1st person view) */}
      {!isMe && (
        <>
          <mesh position={[0, 0.78, 0.54]} scale={[1, 1, 0.7]} castShadow>
            <capsuleGeometry args={[0.19, 0.36, 8, 18]} />
            <meshStandardMaterial
              color={participant.avatarColor}
              roughness={0.7}
              emissive={participant.isSpeaking ? participant.avatarColor : "#000000"}
              emissiveIntensity={participant.isSpeaking ? 0.4 : 0}
            />
          </mesh>

          {/* Shoulders */}
          <mesh position={[0, 0.96, 0.54]} scale={[1, 0.4, 0.65]} castShadow>
            <sphereGeometry args={[0.24, 18, 18]} />
            <meshStandardMaterial color={participant.avatarColor} roughness={0.7} />
          </mesh>
        </>
      )}

      {/* 3. Left Arm (Resting on Desk) */}
      <group ref={leftArm} position={[0.22, 0.94, 0.54]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.22, 6, 14]} />
          <meshStandardMaterial color={participant.avatarColor} roughness={0.7} />
        </mesh>
        <group position={[0, -0.26, 0]} rotation={[-0.55, 0, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.2, 6, 14]} />
            <meshStandardMaterial color={participant.avatarColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.22, 0]} castShadow>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* 4. Right Arm (Animated Hand-Raise) */}
      <group ref={rightArm} position={[-0.22, 0.94, 0.54]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.22, 6, 14]} />
          <meshStandardMaterial color={participant.avatarColor} roughness={0.7} />
        </mesh>
        <group ref={rightForearm} position={[0, -0.26, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.2, 6, 14]} />
            <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
          </mesh>
          {/* Hand Palm with Fingers */}
          <group position={[0, -0.24, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.055, 14, 14]} />
              <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
            </mesh>
            {/* Glowing Aura if hand raised */}
            {participant.isHandRaised && (
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.09, 14, 14]} />
                <meshStandardMaterial
                  color="#f59e0b"
                  emissive="#f59e0b"
                  emissiveIntensity={1.2}
                  transparent
                  opacity={0.5}
                />
              </mesh>
            )}
          </group>
        </group>
      </group>

      {/* 5. Student Head & Face (Hidden for local user in 1st person view) */}
      {!isMe && (
        <group ref={head} position={[0, 1.15, 0.54]}>
          {/* Head */}
          <mesh castShadow>
            <sphereGeometry args={[0.155, 24, 24]} />
            <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
          </mesh>

          {/* Student Hair */}
          <mesh position={[0, 0.06, -0.01]} scale={[1.05, 1.04, 1.08]} castShadow>
            <sphereGeometry args={[0.155, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>

          {/* Eyes */}
          {[-0.055, 0.055].map((x) => (
            <group key={x} position={[x, 0.03, -0.13]}>
              <mesh>
                <sphereGeometry args={[0.022, 14, 14]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, -0.016]}>
                <sphereGeometry args={[0.012, 12, 12]} />
                <meshStandardMaterial color="#1e293b" roughness={0.2} />
              </mesh>
            </group>
          ))}

          {/* Mouth/Jaw for speaking */}
          <mesh ref={jaw} position={[0, -0.06, -0.13]} scale={[1, 0.05, 1]}>
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshStandardMaterial color="#682329" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* 6. Glowing Seat Aura when Student is Selected to Speak */}
      {participant.isSpeaking && (
        <mesh position={[0, 0.05, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.75, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={1.5}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 7. Hovering Live Student Name Tag & Badges HUD (Rendered for other students only) */}
      {!isMe && (
        <Html
          transform
          distanceFactor={6.5}
          position={[0, 1.62, 0.54]}
          className="pointer-events-none select-none"
        >
          <div className="flex flex-col items-center gap-1 -translate-x-1/2">
            {/* Status Badges */}
            {participant.isHandRaised && (
              <div className="animate-bounce flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-slate-950 shadow-lg border border-amber-300">
                <Hand className="h-3 w-3 fill-slate-950" /> Hand Raised
              </div>
            )}

            {participant.isSpeaking && (
              <div className="animate-pulse flex items-center gap-1 rounded-full bg-cyan-500 px-2.5 py-0.5 text-[10px] font-bold text-slate-950 shadow-lg border border-cyan-300">
                <Mic className="h-3 w-3" /> Speaking
              </div>
            )}

            {/* Name Tag */}
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-950/90 text-slate-100 px-2.5 py-1 text-xs font-bold shadow-xl border border-white/20">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: participant.avatarColor }}
              />
              <span className="whitespace-nowrap">
                {participant.displayName}
              </span>
              <span className="text-[9px] font-mono text-white/60">
                #{participant.seatNumber + 1}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
