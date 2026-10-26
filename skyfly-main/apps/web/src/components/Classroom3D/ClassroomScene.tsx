import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { Suspense, useRef, useEffect } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { ClassroomEnvironment } from "./ClassroomEnvironment";
import { Blackboard3D } from "./Blackboard3D";
import { DesksInstanced, DESK_COLUMNS, DESK_ROWS } from "./DesksInstanced";
import { HumanoidTeacher } from "./HumanoidTeacher";
import { StudentsGrid3D } from "./StudentsGrid3D";
import { Hologram3D } from "./Hologram3D";
import type { ClassroomSceneProps, CameraPreset } from "./types";

export const CAMERA_TARGETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  overview: {
    pos: [0, 5.0, 14.5],
    target: [0, 1.6, -2.5],
  },
  teacher: {
    pos: [0, 1.72, -4.8],
    target: [0, 1.65, -7.8],
  },
  blackboard: {
    pos: [0, 2.3, -4.2],
    target: [0, 2.5, -9.8],
  },
  front_seat: {
    // Front row center desk (Row 0: z = -3.2, x = 0) sitting eye height
    pos: [0, 1.22, -2.82],
    target: [0, 1.65, -7.8],
  },
  back_seat: {
    // Back row center desk (Row 7: z = 10.8, x = 0) sitting eye height
    pos: [0, 1.28, 11.18],
    target: [0, 1.75, -7.8],
  },
  podium: {
    pos: [0, 1.82, -7.4],
    target: [0, 1.2, 4.5],
  },
  free: {
    pos: [0, 3.8, 8.5],
    target: [0, 1.6, -2.0],
  },
};

function CameraController({
  preset,
  selectedDesk,
  controlsRef,
}: {
  preset: CameraPreset;
  selectedDesk?: number | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(...CAMERA_TARGETS.overview.pos));
  const targetLook = useRef(new THREE.Vector3(...CAMERA_TARGETS.overview.target));
  const isTransitioning = useRef(true);
  const isSeatedMode = useRef(false);

  useEffect(() => {
    // 1. If explicit non-seated presets are chosen
    if (preset === "overview" || preset === "teacher" || preset === "blackboard" || preset === "podium") {
      const config = CAMERA_TARGETS[preset];
      targetPos.current.set(...config.pos);
      targetLook.current.set(...config.target);
      isTransitioning.current = true;
      isSeatedMode.current = false;
      return;
    }

    // 2. If Front Row preset chosen
    if (preset === "front_seat") {
      const config = CAMERA_TARGETS.front_seat;
      targetPos.current.set(...config.pos);
      targetLook.current.set(...config.target);
      isTransitioning.current = true;
      isSeatedMode.current = true;
      return;
    }

    // 3. If Back Row preset chosen
    if (preset === "back_seat") {
      const config = CAMERA_TARGETS.back_seat;
      targetPos.current.set(...config.pos);
      targetLook.current.set(...config.target);
      isTransitioning.current = true;
      isSeatedMode.current = true;
      return;
    }

    // 4. If a specific student desk (0 - 39) is chosen
    if (selectedDesk !== undefined && selectedDesk !== null) {
      const colIdx = selectedDesk % DESK_COLUMNS.length;
      const rowIdx = Math.floor(selectedDesk / DESK_COLUMNS.length);
      const deskX = DESK_COLUMNS[colIdx] ?? 0;
      const deskZ = DESK_ROWS[rowIdx] ?? 0;

      // Sitting eye position: at desk X, natural human seated eye height 1.22m, z + 0.38m
      targetPos.current.set(deskX, 1.22, deskZ + 0.38);
      // Looking towards teacher & blackboard
      targetLook.current.set(deskX * 0.1, 1.65, -7.8);
      isTransitioning.current = true;
      isSeatedMode.current = true;
      return;
    }

    // 5. Default free roam mode
    if (preset === "free") {
      const config = CAMERA_TARGETS.free;
      targetPos.current.set(...config.pos);
      targetLook.current.set(...config.target);
      isTransitioning.current = true;
      isSeatedMode.current = false;
    }
  }, [preset, selectedDesk]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioning.current) {
      const t = Math.min(1, delta * 5.0);
      camera.position.lerp(targetPos.current, t);
      controlsRef.current.target.lerp(targetLook.current, t);
      controlsRef.current.update();

      if (
        camera.position.distanceTo(targetPos.current) < 0.02 &&
        controlsRef.current.target.distanceTo(targetLook.current) < 0.02
      ) {
        isTransitioning.current = false;
      }
    } else if (isSeatedMode.current) {
      // In seated mode: lock camera position firmly to the student's chair eye level
      // while allowing smooth rotational look-around with OrbitControls
      camera.position.copy(targetPos.current);
    }
  });

  return null;
}

export function ClassroomScene({
  currentTopic,
  speaking,
  thinking,
  cameraPreset,
  onDeskSelect,
  selectedDesk,
  mouthLevel,
  nodAt,
  participants = [],
  myUserId,
  mySeat,
  activeHologramSegment,
  showHologram = true,
  onNextHologramStep,
  onPrevHologramStep,
  onReplayHologramStep,
  onToggleHologramSpeech,
}: ClassroomSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isSeated = selectedDesk !== null && selectedDesk !== undefined || cameraPreset === "front_seat" || cameraPreset === "back_seat";

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5.0, 14.5], fov: 44, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      className="w-full h-full"
    >
      <color attach="background" args={["#0c121e"]} />

      <Suspense fallback={null}>
        {/* 1. Classroom Architecture & Lighting */}
        <ClassroomEnvironment />

        {/* 2. Front Smart Blackboard */}
        <Blackboard3D topic={currentTopic} speaking={speaking} />

        {/* 3. 3D Holographic Display Station (In 3D space next to teacher) */}
        <Hologram3D
          segment={activeHologramSegment || null}
          active={Boolean(showHologram && activeHologramSegment)}
          speaking={speaking}
          onNextStep={onNextHologramStep}
          onPrevStep={onPrevHologramStep}
          onReplayStep={onReplayHologramStep}
          onToggleSpeech={onToggleHologramSpeech}
        />

        {/* 4. Instanced 40 Desks & 40 Chairs */}
        <DesksInstanced
          onDeskSelect={onDeskSelect}
          selectedDesk={selectedDesk}
        />

        {/* 5. Live Multi-User 3D Seated Students Avatars */}
        <StudentsGrid3D
          participants={participants}
          myUserId={myUserId}
        />

        {/* 6. Humanoid AI Teacher Avatar */}
        <HumanoidTeacher
          speaking={speaking}
          thinking={thinking}
          nodAt={nodAt}
          mouthLevel={mouthLevel}
          position={[0, 0.3, -7.8]}
        />

        {/* Floor Contact Shadows under teacher & podium */}
        <ContactShadows
          position={[0, 0.31, -7.8]}
          opacity={0.4}
          scale={4}
          blur={1.2}
          far={2}
        />

        {/* Camera Transition Controller */}
        <CameraController
          preset={cameraPreset}
          selectedDesk={selectedDesk}
          controlsRef={controlsRef}
        />
      </Suspense>

      {/* Interactive OrbitControls for 360 Classroom Roaming and Seated Look-Around */}
      <OrbitControls
        ref={controlsRef}
        enablePan={!isSeated}
        enableZoom={true}
        minDistance={0.1}
        maxDistance={24}
        minPolarAngle={Math.PI / 14}
        maxPolarAngle={Math.PI * 0.62} // Prevent clipping below floor/seat
        target={[0, 1.6, -2.5]}
        dampingFactor={0.08}
        enableDamping={true}
        rotateSpeed={0.7}
      />
    </Canvas>
  );
}
