import React, { Component, useRef, useMemo, useState, useEffect, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface HumanoidTeacherProps {
  speaking: boolean;
  thinking?: boolean;
  listening?: boolean;
  nodAt?: number;
  mouthLevel?: React.RefObject<number>;
  position?: [number, number, number];
  rotation?: [number, number, number];
  showLaserPointer?: boolean;
  modelUrl?: string;
}

const SKIN_TONE = "#e4a77e";
const SKIN_SHADOW = "#bd7e54";
const SKIN_BLUSH = "#fb7185";
const HAIR_COLOR = "#1f1612";
const BLAZER_COLOR = "#1b2838";
const SHIRT_COLOR = "#f8fafc";
const TIE_COLOR = "#dc2626";
const TROUSER_COLOR = "#0f172a";
const SHOE_COLOR = "#020617";
const GOLD_ACCENT = "#f59e0b";
const LASER_COLOR = "#f43f5e";

// ==========================================
// 1. Realistic Rigged GLB Humanoid Teacher Model
// ==========================================
function GLBAvatarTeacher({
  modelUrl = "/models/teacher.glb",
  speaking,
  thinking = false,
  listening = false,
  nodAt,
  mouthLevel,
  position = [0, 0.3, -7.8],
  rotation = [0, 0, 0],
  showLaserPointer = true,
}: HumanoidTeacherProps) {
  const { scene } = useGLTF(modelUrl);
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const rootRef = useRef<THREE.Group>(null);
  const laserDot = useRef<THREE.Mesh>(null);
  const laserBeam = useRef<THREE.Mesh>(null);
  const laserTarget = useRef({ x: -1.2, y: 2.6 });

  // Animation interpolation state
  const talkFactor = useRef(0);
  const thinkFactor = useRef(0);
  const nodProgress = useRef(0);
  const lastNodTime = useRef(nodAt ?? 0);
  const blinkTimer = useRef(2.8);

  // Discover and cache skeleton bones
  const bones = useMemo(() => {
    const map: Record<string, THREE.Bone> = {};
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Bone).isBone) {
        map[obj.name] = obj as THREE.Bone;
        const lower = obj.name.toLowerCase();
        if (lower.includes("head")) map["head"] = obj as THREE.Bone;
        if (lower.includes("neck")) map["neck"] = obj as THREE.Bone;
        if (lower.includes("spine2") || lower.includes("chest") || lower.includes("upperchest")) map["chest"] = obj as THREE.Bone;
        if (lower.includes("spine1") || lower.includes("spine")) map["spine"] = obj as THREE.Bone;
        if (lower.includes("rightarm") || lower.includes("arm_r") || lower.includes("rightupperarm")) map["armR"] = obj as THREE.Bone;
        if (lower.includes("rightforearm") || lower.includes("forearm_r") || lower.includes("rightlowerarm")) map["foreR"] = obj as THREE.Bone;
        if (lower.includes("righthand") || lower.includes("hand_r")) map["handR"] = obj as THREE.Bone;
        if (lower.includes("leftarm") || lower.includes("arm_l") || lower.includes("leftupperarm")) map["armL"] = obj as THREE.Bone;
        if (lower.includes("leftforearm") || lower.includes("forearm_l") || lower.includes("leftlowerarm")) map["foreL"] = obj as THREE.Bone;
        if (lower.includes("lefthand") || lower.includes("hand_l")) map["handL"] = obj as THREE.Bone;
      }
    });
    return map;
  }, [clonedScene]);

  // Discover SkinnedMeshes with ARKit / Oculus / ReadyPlayerMe morph targets
  const morphMeshes = useMemo(() => {
    const list: THREE.SkinnedMesh[] = [];
    clonedScene.traverse((obj) => {
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh && (obj as THREE.SkinnedMesh).morphTargetDictionary) {
        list.push(obj as THREE.SkinnedMesh);
      }
    });
    return list;
  }, [clonedScene]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(0.1, delta);

    talkFactor.current += ((speaking ? 1 : 0) - talkFactor.current) * Math.min(1, dt * 8);
    thinkFactor.current += ((thinking ? 1 : 0) - thinkFactor.current) * Math.min(1, dt * 5);
    const talk = talkFactor.current;
    const think = thinkFactor.current;

    // Nodding on acknowledgement
    if ((nodAt ?? 0) !== lastNodTime.current) {
      lastNodTime.current = nodAt ?? 0;
      nodProgress.current = 1.6;
    }
    if (nodProgress.current > 0) {
      nodProgress.current = Math.max(0, nodProgress.current - dt);
    }
    const nodWave = nodProgress.current > 0 ? Math.sin((1.6 - nodProgress.current) * Math.PI * 2) * 0.14 : 0;

    // Organic syllable waveforms for real-time lip-sync
    const syllableWave = Math.max(
      0,
      Math.sin(t * 15.2) * 0.45 +
      Math.sin(t * 8.6 + 0.8) * 0.35 +
      Math.sin(t * 22.0) * 0.2
    );
    const liveMouth = mouthLevel?.current ?? 0;
    const mouthOpen = liveMouth > 0 ? Math.min(1, liveMouth) : talk * syllableWave;

    // Blinking timer
    blinkTimer.current -= dt;
    if (blinkTimer.current < -0.1) {
      blinkTimer.current = 2.4 + Math.random() * 2.8;
    }
    const isBlinking = blinkTimer.current < 0;

    // 1. Update Blend Shapes / Visemes Morph Targets
    morphMeshes.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;
      if (!dict || !influences) return;

      const setMorph = (name: string, val: number) => {
        const idx = dict[name];
        if (idx !== undefined) influences[idx] = val;
      };

      // Real lip-sync via visemes & jawOpen
      setMorph("jawOpen", mouthOpen * 0.95);
      setMorph("mouthOpen", mouthOpen * 0.9);
      setMorph("viseme_aa", mouthOpen * 0.85);
      setMorph("viseme_O", mouthOpen * 0.5 * (Math.sin(t * 11) > 0 ? 1 : 0));
      setMorph("viseme_E", mouthOpen * 0.4 * (Math.cos(t * 9) > 0 ? 1 : 0));
      setMorph("viseme_I", mouthOpen * 0.3 * (Math.sin(t * 13) > 0 ? 1 : 0));

      // Warm smile
      const smileAmount = 0.4 * (1 - talk * 0.3) - think * 0.2;
      setMorph("mouthSmile", smileAmount);
      setMorph("mouthSmileLeft", smileAmount);
      setMorph("mouthSmileRight", smileAmount);

      // Eye blinking
      setMorph("eyeBlinkLeft", isBlinking ? 1 : 0);
      setMorph("eyeBlinkRight", isBlinking ? 1 : 0);
      setMorph("eyesClosed", isBlinking ? 1 : 0);

      // Eyebrows
      setMorph("browInnerUp", talk * 0.3 + (think ? 0.25 : 0));
    });

    // 2. Bone Skeletal Animation (Idle Breathing, Head Scanning & Hand Gestures)
    // Idle Breathing
    if (bones.chest) {
      const breath = 1 + Math.sin(t * 1.8) * 0.015;
      bones.chest.scale.set(breath, 1, breath);
    }

    // Head micro-movements & scanning
    if (bones.head) {
      bones.head.rotation.y = Math.sin(t * 0.6) * 0.08 + (talk > 0.2 ? Math.sin(t * 2.2) * 0.05 : 0) - think * 0.15;
      bones.head.rotation.x = Math.sin(t * 0.8) * 0.02 + nodWave + (talk > 0.2 ? Math.sin(t * 2.8) * 0.03 : 0);
      bones.head.rotation.z = Math.sin(t * 0.5) * 0.015 + think * 0.08;
    }

    // Right Arm: Dynamic teaching gestures, chalkboard & hologram pointing
    const isPointingBoard = talk > 0.3 && Math.sin(t * 0.8) > 0.1;
    const isPointingHologram = talk > 0.3 && Math.sin(t * 0.8) <= -0.3;

    if (bones.armR && bones.foreR) {
      if (isPointingBoard) {
        // Pointing to Blackboard
        bones.armR.rotation.x = -1.1 - Math.sin(t * 1.4) * 0.12;
        bones.armR.rotation.z = -0.55;
        bones.foreR.rotation.x = -0.45;
      } else if (isPointingHologram) {
        // Pointing to Hologram on Right
        bones.armR.rotation.x = -0.65;
        bones.armR.rotation.z = -0.75;
        bones.foreR.rotation.x = -0.35;
      } else {
        // Natural Conversational Gesturing
        bones.armR.rotation.x = -0.35 - talk * (0.4 + Math.sin(t * 1.5) * 0.22) - think * 0.6;
        bones.armR.rotation.z = -0.25 - talk * 0.15;
        bones.foreR.rotation.x = -0.35 - talk * (0.5 + Math.sin(t * 2.2) * 0.25) - think * 1.2;
      }
    }

    // Left Arm: Supportive Gesturing
    if (bones.armL && bones.foreL) {
      bones.armL.rotation.x = -0.2 - talk * (0.3 + Math.sin(t * 1.2 + 1.2) * 0.18);
      bones.armL.rotation.z = 0.22 + talk * 0.12;
      bones.foreL.rotation.x = -0.3 - talk * (0.4 + Math.sin(t * 1.9 + 0.8) * 0.22);
    }

    // Interactive Blackboard Laser Pointer
    if (laserBeam.current && laserDot.current && showLaserPointer) {
      const laserActive = talk > 0.15 && isPointingBoard;
      const targetScale = laserActive ? 1 : 0.001;

      laserBeam.current.scale.set(targetScale, 1, targetScale);
      laserDot.current.scale.set(targetScale, targetScale, targetScale);

      if (laserActive) {
        laserTarget.current.x = -1.2 + Math.sin(t * 1.8) * 1.6;
        laserTarget.current.y = 2.7 + Math.cos(t * 2.4) * 0.45;
        laserDot.current.position.set(laserTarget.current.x, laserTarget.current.y, -9.72);
        const pulse = 1.2 + Math.sin(t * 18) * 0.4;
        (laserDot.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 2.2;
      }
    }
  });

  return (
    <group ref={rootRef} position={position} rotation={rotation}>
      {/* 3D Realistic Rigged Humanoid GLB Model */}
      <primitive object={clonedScene} />

      {/* Blackboard Laser Beam & Pulsing Target Dot */}
      {showLaserPointer && (
        <group>
          <mesh ref={laserDot} position={[-1.2, 2.6, -9.72]}>
            <circleGeometry args={[0.038, 24]} />
            <meshStandardMaterial
              color={LASER_COLOR}
              emissive={LASER_COLOR}
              emissiveIntensity={2.5}
            />
          </mesh>
          <mesh position={[-1.2, 2.6, -9.71]}>
            <ringGeometry args={[0.05, 0.058, 24]} />
            <meshBasicMaterial color={LASER_COLOR} transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ==========================================
// 2. High-Detail Procedural Fallback Teacher
// ==========================================
function ProceduralTeacherAvatar({
  speaking,
  thinking = false,
  listening = false,
  nodAt,
  mouthLevel,
  position = [0, 0.3, -7.8],
  rotation = [0, 0, 0],
  showLaserPointer = true,
}: HumanoidTeacherProps) {
  const root = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Mesh>(null);
  const lips = useRef<THREE.Mesh>(null);
  const smile = useRef<THREE.Mesh>(null);
  const blushL = useRef<THREE.Mesh>(null);
  const blushR = useRef<THREE.Mesh>(null);
  const lidL = useRef<THREE.Mesh>(null);
  const lidR = useRef<THREE.Mesh>(null);
  const eyesGroup = useRef<THREE.Group>(null);
  const browL = useRef<THREE.Mesh>(null);
  const browR = useRef<THREE.Mesh>(null);

  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const handR = useRef<THREE.Group>(null);

  const laserBeam = useRef<THREE.Mesh>(null);
  const laserDot = useRef<THREE.Mesh>(null);

  const talkFactor = useRef(0);
  const thinkFactor = useRef(0);
  const blinkTimer = useRef(2.5);
  const eyeScanTimer = useRef(1.8);
  const eyeTarget = useRef({ x: 0, y: 0 });
  const nodProgress = useRef(0);
  const lastNodTime = useRef(nodAt ?? 0);
  const laserTarget = useRef({ x: -1.2, y: 2.6 });

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(0.1, delta);

    talkFactor.current += ((speaking ? 1 : 0) - talkFactor.current) * Math.min(1, dt * 7.5);
    thinkFactor.current += ((thinking ? 1 : 0) - thinkFactor.current) * Math.min(1, dt * 5);
    const talk = talkFactor.current;
    const think = thinkFactor.current;

    if ((nodAt ?? 0) !== lastNodTime.current) {
      lastNodTime.current = nodAt ?? 0;
      nodProgress.current = 1.8;
    }
    if (nodProgress.current > 0) {
      nodProgress.current = Math.max(0, nodProgress.current - dt);
    }
    const nodWave = nodProgress.current > 0 ? Math.sin((1.8 - nodProgress.current) * Math.PI * 2) * 0.16 : 0;
    const praiseSmile = nodProgress.current > 0 ? Math.min(1, nodProgress.current / 0.6) : 0;

    const syllableWave = Math.max(
      0,
      Math.sin(t * 14.8) * 0.42 +
      Math.sin(t * 8.4 + 0.9) * 0.38 +
      Math.sin(t * 22.4) * 0.2
    );
    const emphasis = talk * Math.max(0, (syllableWave - 0.45) / 0.55);

    const liveMouth = mouthLevel?.current ?? 0;
    const mouthOpen = liveMouth > 0 ? (0.05 + liveMouth * 0.95) : (0.05 + talk * syllableWave * 0.95);

    if (jaw.current) {
      jaw.current.scale.set(1 + talk * 0.12 * syllableWave, mouthOpen, 1);
      jaw.current.position.y = 0.082 - mouthOpen * 0.03;
    }

    if (lips.current) {
      lips.current.scale.set(1 + talk * 0.18, 0.38 + mouthOpen * 0.85, 1);
    }

    if (smile.current) {
      const smileAmount = 0.65 * (1 - talk * 0.45) + praiseSmile * 0.4 - think * 0.3;
      smile.current.scale.set(0.92 + smileAmount * 0.32, 0.5 + smileAmount * 0.7, 1);
      smile.current.position.y = 0.046 - smileAmount * 0.006;
    }

    if (blushL.current && blushR.current) {
      const blushOpacity = (praiseSmile * 0.6 + (1 - think) * 0.2) * (1 - talk * 0.3);
      (blushL.current.material as THREE.MeshStandardMaterial).opacity = blushOpacity;
      (blushR.current.material as THREE.MeshStandardMaterial).opacity = blushOpacity;
    }

    if (root.current) {
      root.current.position.y = position[1] + Math.sin(t * 1.4) * 0.008;
      root.current.rotation.y = rotation[1] + Math.sin(t * 0.35) * 0.04 + think * 0.14;
      root.current.rotation.z = Math.sin(t * 0.35) * 0.015;
    }

    if (chest.current) {
      const breathScale = 1 + Math.sin(t * 1.8) * 0.015 + talk * 0.01;
      chest.current.scale.set(breathScale, 1, breathScale);
    }

    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.65) * 0.1 + talk * Math.sin(t * 2.1) * 0.06 - think * 0.2;
      head.current.rotation.x = Math.sin(t * 0.8) * 0.02 + talk * Math.sin(t * 2.8) * 0.035 + think * 0.1 + nodWave;
      head.current.rotation.z = Math.sin(t * 0.5) * 0.02 + think * 0.12;
    }

    eyeScanTimer.current -= dt;
    if (eyeScanTimer.current < 0) {
      eyeScanTimer.current = 1.2 + Math.random() * 2.4;
      eyeTarget.current = {
        x: (Math.random() - 0.5) * 0.018 + (talk > 0.5 ? -0.008 : 0),
        y: (Math.random() - 0.5) * 0.012,
      };
    }
    if (eyesGroup.current) {
      eyesGroup.current.position.x += (eyeTarget.current.x - eyesGroup.current.position.x) * dt * 8;
      eyesGroup.current.position.y += (eyeTarget.current.y - eyesGroup.current.position.y) * dt * 8;
    }

    blinkTimer.current -= dt;
    if (blinkTimer.current < -0.09) {
      blinkTimer.current = (think > 0.5 ? 1.9 : 2.8) + Math.random() * 2.6;
    }
    const blinkScale = blinkTimer.current < 0 ? 1 : 0.05 + think * 0.16;
    if (lidL.current) lidL.current.scale.y = blinkScale;
    if (lidR.current) lidR.current.scale.y = blinkScale;

    const browLift = emphasis * 0.028 + praiseSmile * 0.022;
    if (browL.current) {
      browL.current.position.y = 0.258 + browLift + think * 0.02;
      browL.current.rotation.z = 0.08 + emphasis * 0.04 + think * 0.14;
    }
    if (browR.current) {
      browR.current.position.y = 0.258 + browLift * 0.85 - think * 0.01;
      browR.current.rotation.z = -0.08 - emphasis * 0.04 + think * 0.06;
    }

    const isPointingBoard = talk > 0.3 && Math.sin(t * 0.9) > -0.2;
    const pointIntensity = isPointingBoard ? 0.85 : 0.15;

    if (armR.current && foreR.current) {
      armR.current.rotation.x = -0.18 - talk * (0.6 + Math.sin(t * 1.5) * 0.25) - think * 0.7 - pointIntensity * 0.45;
      armR.current.rotation.z = -0.22 - talk * (0.28 + Math.sin(t * 0.8) * 0.12) - think * 0.4 + pointIntensity * 0.55;
      foreR.current.rotation.x = -0.28 - talk * (0.65 + Math.sin(t * 2.2 + 0.5) * 0.35) - emphasis * 0.25 - think * 1.55 - pointIntensity * 0.35;
      foreR.current.rotation.y = talk * Math.sin(t * 1.4) * 0.3 + think * 0.55 + pointIntensity * 0.5;
    }

    if (handR.current) {
      handR.current.rotation.x = Math.sin(t * 2.2) * 0.12 * talk;
      handR.current.rotation.y = pointIntensity * 0.2;
    }

    if (armL.current && foreL.current) {
      armL.current.rotation.x = -0.14 - talk * (0.35 + Math.sin(t * 1.3 + 1.6) * 0.22);
      armL.current.rotation.z = 0.24 + talk * 0.16;
      foreL.current.rotation.x = -0.26 - talk * (0.5 + Math.sin(t * 2.0 + 1.1) * 0.3);
      foreL.current.rotation.y = -talk * Math.sin(t * 1.1) * 0.22;
    }

    if (laserBeam.current && laserDot.current && showLaserPointer) {
      const laserActive = talk > 0.15 && isPointingBoard;
      const targetScale = laserActive ? 1 : 0.001;

      laserBeam.current.scale.set(targetScale, 1, targetScale);
      laserDot.current.scale.set(targetScale, targetScale, targetScale);

      if (laserActive) {
        laserTarget.current.x = -1.2 + Math.sin(t * 1.8) * 1.6;
        laserTarget.current.y = 2.7 + Math.cos(t * 2.4) * 0.45;
        laserDot.current.position.set(laserTarget.current.x, laserTarget.current.y, -9.72);
        const pulse = 1.2 + Math.sin(t * 18) * 0.4;
        (laserDot.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 2.2;
      }
    }
  });

  return (
    <group ref={root} position={position} rotation={rotation}>
      {/* 1. Legs & Shoes */}
      {[-0.17, 0.17].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
            <capsuleGeometry args={[0.105, 0.78, 8, 18]} />
            <meshStandardMaterial color={TROUSER_COLOR} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.04, 0.06]} castShadow>
            <boxGeometry args={[0.15, 0.08, 0.28]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.35} metalness={0.25} />
          </mesh>
        </group>
      ))}

      {/* 2. Hips & Belt */}
      <mesh position={[0, 0.95, -0.01]} scale={[1, 1, 0.65]} castShadow>
        <capsuleGeometry args={[0.165, 0.09, 8, 20]} />
        <meshStandardMaterial color={TROUSER_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.99, 0.01]} scale={[1, 0.15, 0.7]}>
        <boxGeometry args={[0.34, 0.2, 0.25]} />
        <meshStandardMaterial color="#020617" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.99, 0.105]}>
        <boxGeometry args={[0.048, 0.028, 0.01]} />
        <meshStandardMaterial color={GOLD_ACCENT} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 3. Torso & Chest Rig */}
      <group ref={chest}>
        <mesh position={[0, 1.25, 0]} scale={[1, 1, 0.72]} castShadow>
          <capsuleGeometry args={[0.245, 0.46, 10, 24]} />
          <meshStandardMaterial color={BLAZER_COLOR} roughness={0.78} />
        </mesh>
        <mesh position={[0, 1.28, 0.11]} scale={[0.52, 1.05, 0.3]} castShadow>
          <capsuleGeometry args={[0.15, 0.32, 8, 20]} />
          <meshStandardMaterial color={SHIRT_COLOR} roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.26, 0.16]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.055, 0.32, 0.02]} />
          <meshStandardMaterial color={TIE_COLOR} roughness={0.45} metalness={0.15} />
        </mesh>
        <mesh position={[0, 1.29, 0.174]}>
          <boxGeometry args={[0.038, 0.007, 0.008]} />
          <meshStandardMaterial color={GOLD_ACCENT} metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[-0.09, 1.34, 0.13]} rotation={[0, 0, 0.25]} castShadow>
          <boxGeometry args={[0.07, 0.28, 0.03]} />
          <meshStandardMaterial color={BLAZER_COLOR} roughness={0.78} />
        </mesh>
        <mesh position={[0.09, 1.34, 0.13]} rotation={[0, 0, -0.25]} castShadow>
          <boxGeometry args={[0.07, 0.28, 0.03]} />
          <meshStandardMaterial color={BLAZER_COLOR} roughness={0.78} />
        </mesh>
        <mesh position={[0.13, 1.38, 0.14]}>
          <cylinderGeometry args={[0.024, 0.024, 0.008, 18]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.54, 0]}>
          <cylinderGeometry args={[0.075, 0.095, 0.16, 18]} />
          <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.48, 0]} scale={[1, 0.44, 0.65]} castShadow>
          <sphereGeometry args={[0.31, 24, 24]} />
          <meshStandardMaterial color={BLAZER_COLOR} roughness={0.78} />
        </mesh>
      </group>

      {/* 4. Left Arm */}
      <group ref={armL} position={[0.29, 1.46, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.078, 0.28, 8, 18]} />
          <meshStandardMaterial color={BLAZER_COLOR} roughness={0.78} />
        </mesh>
        <group ref={foreL} position={[0, -0.36, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.26, 8, 18]} />
            <meshStandardMaterial color={BLAZER_COLOR} roughness={0.78} />
          </mesh>
          <group position={[0, -0.35, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.068, 18, 18]} />
              <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
            </mesh>
            <mesh position={[0.02, -0.04, 0.08]} rotation={[0.4, -0.2, 0.1]} castShadow>
              <boxGeometry args={[0.18, 0.26, 0.02]} />
              <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.7} />
            </mesh>
            <mesh position={[0.02, -0.04, 0.092]} rotation={[0.4, -0.2, 0.1]}>
              <planeGeometry args={[0.16, 0.23]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.65} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 5. Right Arm */}
      <group ref={armR} position={[-0.29, 1.46, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.078, 0.28, 8, 18]} />
          <meshStandardMaterial color={BLAZER_COLOR} roughness={0.78} />
        </mesh>
        <group ref={foreR} position={[0, -0.36, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.26, 8, 18]} />
            <meshStandardMaterial color={BLAZER_COLOR} roughness={0.78} />
          </mesh>
          <group ref={handR} position={[0, -0.35, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.068, 18, 18]} />
              <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
            </mesh>
            <mesh position={[-0.02, -0.08, 0.06]} rotation={[-0.3, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.007, 0.007, 0.32, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
            </mesh>
            <mesh position={[-0.02, -0.24, 0.11]} rotation={[-0.3, 0.2, 0]}>
              <sphereGeometry args={[0.014, 14, 14]} />
              <meshStandardMaterial color={LASER_COLOR} emissive={LASER_COLOR} emissiveIntensity={2.5} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 6. Humanoid Head & Face Rig */}
      <group ref={head} position={[0, 1.63, 0]}>
        <mesh position={[0, 0.17, 0]} scale={[1, 1.18, 1.04]} castShadow>
          <sphereGeometry args={[0.195, 36, 36]} />
          <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.24, -0.01]} scale={[1.05, 1.04, 1.08]} castShadow>
          <sphereGeometry args={[0.195, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.64]} />
          <meshStandardMaterial color={HAIR_COLOR} roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.32, 0.08]} rotation={[0.3, 0, 0]} scale={[1.02, 0.3, 0.8]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color={HAIR_COLOR} roughness={0.88} />
        </mesh>
        <mesh position={[-0.09, 0.28, 0.11]} rotation={[0.2, 0.3, -0.2]} scale={[0.4, 0.25, 0.3]}>
          <sphereGeometry args={[0.14, 18, 18]} />
          <meshStandardMaterial color={HAIR_COLOR} roughness={0.88} />
        </mesh>

        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.16, 0]} scale={[0.45, 1, 0.55]}>
            <sphereGeometry args={[0.052, 16, 16]} />
            <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
          </mesh>
        ))}

        {/* Eyes & Blinking */}
        <group ref={eyesGroup} position={[0, 0, 0]}>
          {[-0.072, 0.072].map((x, i) => (
            <group key={x} position={[x, 0.21, 0.168]}>
              <mesh>
                <sphereGeometry args={[0.033, 20, 20]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.25} />
              </mesh>
              <mesh position={[0, 0, 0.025]}>
                <sphereGeometry args={[0.018, 18, 18]} />
                <meshStandardMaterial color="#2d1b13" roughness={0.2} metalness={0.15} />
              </mesh>
              <mesh position={[0, 0, 0.032]}>
                <sphereGeometry args={[0.009, 16, 16]} />
                <meshStandardMaterial color="#020617" roughness={0.1} />
              </mesh>
              <mesh position={[0.006, 0.006, 0.034]}>
                <sphereGeometry args={[0.003, 10, 10]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh ref={i === 0 ? lidL : lidR} position={[0, 0.007, 0.013]}>
                <sphereGeometry args={[0.035, 18, 18]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
              </mesh>
            </group>
          ))}
        </group>

        <mesh ref={blushL} position={[-0.11, 0.14, 0.165]} rotation={[0, -0.2, 0]}>
          <circleGeometry args={[0.032, 16]} />
          <meshStandardMaterial color={SKIN_BLUSH} transparent opacity={0.25} roughness={1} />
        </mesh>
        <mesh ref={blushR} position={[0.11, 0.14, 0.165]} rotation={[0, 0.2, 0]}>
          <circleGeometry args={[0.032, 16]} />
          <meshStandardMaterial color={SKIN_BLUSH} transparent opacity={0.25} roughness={1} />
        </mesh>

        <mesh ref={browL} position={[-0.072, 0.265, 0.178]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.075, 0.016, 0.022]} />
          <meshStandardMaterial color={HAIR_COLOR} roughness={0.88} />
        </mesh>
        <mesh ref={browR} position={[0.072, 0.265, 0.178]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[0.075, 0.016, 0.022]} />
          <meshStandardMaterial color={HAIR_COLOR} roughness={0.88} />
        </mesh>

        <mesh position={[0, 0.16, 0.192]} rotation={[0.42, 0, 0]}>
          <coneGeometry args={[0.034, 0.08, 16]} />
          <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
        </mesh>

        <mesh ref={jaw} position={[0, 0.085, 0.174]} scale={[1, 0.1, 1]}>
          <sphereGeometry args={[0.048, 24, 24]} />
          <meshStandardMaterial color="#682329" roughness={0.45} />
        </mesh>
        <mesh ref={lips} position={[0, 0.098, 0.182]}>
          <boxGeometry args={[0.065, 0.012, 0.018]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.6} />
        </mesh>
        <mesh ref={smile} position={[0, 0.048, 0.182]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.048, 0.007, 10, 24, Math.PI]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.6} />
        </mesh>

        {/* Glasses */}
        <group position={[0, 0.21, 0.18]}>
          <mesh position={[-0.072, 0, 0]}>
            <torusGeometry args={[0.042, 0.004, 12, 28]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0.072, 0, 0]}>
            <torusGeometry args={[0.042, 0.004, 12, 28]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.038, 0.005, 0.005]} />
            <meshStandardMaterial color={GOLD_ACCENT} metalness={0.9} roughness={0.2} />
          </mesh>
          {[-0.072, 0.072].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <circleGeometry args={[0.038, 20]} />
              <meshStandardMaterial color="#e0f2fe" transparent opacity={0.18} roughness={0.1} metalness={0.3} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 7. Laser Pointer */}
      {showLaserPointer && (
        <group>
          <mesh ref={laserDot} position={[-1.2, 2.6, -9.72]}>
            <circleGeometry args={[0.038, 24]} />
            <meshStandardMaterial color={LASER_COLOR} emissive={LASER_COLOR} emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[-1.2, 2.6, -9.71]}>
            <ringGeometry args={[0.05, 0.058, 24]} />
            <meshBasicMaterial color={LASER_COLOR} transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ==========================================
// 3. Resilient Error Boundary for GLTF Models
// ==========================================
interface AvatarBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface AvatarBoundaryState {
  hasError: boolean;
}

class AvatarErrorBoundary extends Component<AvatarBoundaryProps, AvatarBoundaryState> {
  constructor(props: AvatarBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Model not found or unsupported - cleanly fall back to procedural teacher
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ==========================================
// 4. Main Exported HumanoidTeacher Component
// ==========================================
export function HumanoidTeacher(props: HumanoidTeacherProps) {
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null);
  const modelUrl = props.modelUrl || "/models/teacher.glb";

  useEffect(() => {
    // Probe if GLB model is present in public assets
    fetch(modelUrl, { method: "HEAD" })
      .then((res) => {
        if (res.ok && res.headers.get("content-type")?.includes("gltf") || res.ok) {
          setModelAvailable(true);
        } else {
          setModelAvailable(false);
        }
      })
      .catch(() => {
        setModelAvailable(false);
      });
  }, [modelUrl]);

  // If model is confirmed not available, render procedural teacher directly
  if (modelAvailable === false) {
    return <ProceduralTeacherAvatar {...props} />;
  }

  return (
    <AvatarErrorBoundary fallback={<ProceduralTeacherAvatar {...props} />}>
      <Suspense fallback={<ProceduralTeacherAvatar {...props} />}>
        <GLBAvatarTeacher {...props} modelUrl={modelUrl} />
      </Suspense>
    </AvatarErrorBoundary>
  );
}
