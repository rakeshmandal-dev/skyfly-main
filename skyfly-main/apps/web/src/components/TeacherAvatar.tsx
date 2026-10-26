import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

const BASE_Y = -0.92;
const SKIN = "#c98d63";
const SKIN_DARK = "#a9713f";
const HAIR = "#241a16";
const SHIRT = "#3f6fa8";
const JACKET = "#26364d";
const TROUSER = "#2b2f3a";

type Props = {
  speaking: boolean;
  thinking?: boolean | undefined;
  listening?: boolean | undefined;
  /** Bump this number to play a "that's it, well done" nod + warm smile. */
  nodAt?: number | undefined;
  mouthLevel?: React.RefObject<number> | undefined;
};

function Teacher({ speaking, thinking, nodAt, listening, mouthLevel }: Props) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Mesh>(null);
  const smile = useRef<THREE.Mesh>(null);
  const lidL = useRef<THREE.Mesh>(null);
  const lidR = useRef<THREE.Mesh>(null);
  const browL = useRef<THREE.Mesh>(null);
  const browR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const talk = useRef(0);
  const think = useRef(0);
  const blink = useRef(0);
  const nod = useRef(0);
  const lastNod = useRef(nodAt ?? 0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const step = Math.min(1, delta * 6);
    talk.current += ((speaking ? 1 : 0) - talk.current) * step;
    think.current += ((thinking ? 1 : 0) - think.current) * Math.min(1, delta * 4);
    const a = talk.current;
    const th = think.current;

    // "Finished explaining" nod + warm smile, triggered from outside.
    if ((nodAt ?? 0) !== lastNod.current) {
      lastNod.current = nodAt ?? 0;
      nod.current = 1.6;
    }
    if (nod.current > 0) nod.current = Math.max(0, nod.current - delta);
    const nodPhase = nod.current > 0 ? Math.sin((1.6 - nod.current) * Math.PI * 2.2) : 0;
    const praise = nod.current > 0 ? Math.min(1, nod.current / 0.5) : 0;

    // Mouth: layered oscillators approximate syllables.
    const syllable = Math.max(
      0,
      Math.sin(t * 13) * 0.5 + Math.sin(t * 7.3 + 1.2) * 0.35 + Math.sin(t * 21) * 0.15,
    );
    // Emphasis peaks: the loudest syllables drive brows and gestures.
    const emphasis = a * Math.max(0, (syllable - 0.55) / 0.45);

    if (jaw.current) {
      const live = mouthLevel?.current ?? 0;
      const open = live > 0 ? (0.06 + live * 0.9) : (0.06 + a * syllable * 0.95);
      jaw.current.scale.set(1 + a * 0.12 * syllable, open, 1);
      jaw.current.position.y = 0.08 - open * 0.03;
    }

    // Smile curve: warm when idle, softer while talking, widest when praising.
    if (smile.current) {
      const warmth = 0.62 * (1 - a * 0.55) + praise * 0.45 - th * 0.25;
      smile.current.scale.set(0.9 + warmth * 0.35, 0.6 + warmth * 0.75, 1);
      smile.current.position.y = 0.045 - warmth * 0.006 - a * 0.004;
      smile.current.rotation.z = Math.PI + warmth * 0.06;
    }

    // Breathing + weight shift.
    if (root.current) {
      root.current.position.y = BASE_Y + Math.sin(t * 1.2) * 0.012;
      root.current.rotation.y = Math.sin(t * 0.35) * 0.08 + th * 0.14;
    }

    // Head: nods and turns while speaking, tilts into a thinking pose on questions.
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.7) * 0.16 + a * Math.sin(t * 2.1) * 0.08 - th * 0.1;
      head.current.rotation.x =
        Math.sin(t * 0.9) * 0.03 +
        a * Math.sin(t * 3.4) * 0.05 +
        th * (0.16 + Math.sin(t * 1.1) * 0.05) +
        nodPhase * 0.13;
      head.current.rotation.z = Math.sin(t * 0.5) * 0.03 + th * 0.22;
    }

    // Blinking — slower, longer blinks while thinking.
    blink.current -= delta;
    if (blink.current < -0.12) blink.current = (th > 0.5 ? 1.6 : 2.4) + Math.random() * 3;
    const lidScale = blink.current < 0 ? 1 : 0.06 + th * 0.25;
    if (lidL.current) lidL.current.scale.y = lidScale;
    if (lidR.current) lidR.current.scale.y = lidScale;

    // Brows: raise on emphasis, lift on praise, one brow up while thinking.
    const lift = emphasis * 0.03 + praise * 0.022;
    if (browL.current) {
      browL.current.position.y = 0.255 + lift + th * 0.016;
      browL.current.rotation.z = 0.1 + emphasis * 0.05 + th * 0.12;
    }
    if (browR.current) {
      browR.current.position.y = 0.255 + lift * 0.8 - th * 0.008;
      browR.current.rotation.z = -0.1 - emphasis * 0.05 + th * 0.05;
    }

    // Hand gestures while explaining; hand toward the chin while thinking.
    if (armR.current && foreR.current) {
      armR.current.rotation.x = -0.1 - a * (0.45 + Math.sin(t * 1.8) * 0.35) - th * 0.55;
      armR.current.rotation.z = -0.18 - a * 0.25 - th * 0.35;
      foreR.current.rotation.x =
        -0.25 - a * (0.7 + Math.sin(t * 2.6 + 0.8) * 0.5) - emphasis * 0.3 - th * 1.5;
      foreR.current.rotation.y = a * Math.sin(t * 1.4) * 0.4 + th * 0.5;
    }
    if (armL.current && foreL.current) {
      armL.current.rotation.x = -0.08 - a * (0.3 + Math.sin(t * 1.5 + 2) * 0.3);
      armL.current.rotation.z = 0.2 + a * 0.2;
      foreL.current.rotation.x = -0.2 - a * (0.5 + Math.sin(t * 2.2 + 1.7) * 0.4);
    }
  });

  const skin = <meshStandardMaterial color={SKIN} roughness={0.75} />;

  return (
    <group ref={root} position={[0, BASE_Y, 0]}>
      {/* Legs */}
      {[-0.16, 0.16].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.72, 6, 16]} />
            <meshStandardMaterial color={TROUSER} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.03, 0.06]} castShadow>
            <boxGeometry args={[0.16, 0.07, 0.3]} />
            <meshStandardMaterial color="#1b1b1f" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Hips */}
      <mesh position={[0, 0.92, -0.01]} scale={[1, 1, 0.62]} castShadow>
        <capsuleGeometry args={[0.155, 0.08, 6, 20]} />
        <meshStandardMaterial color={TROUSER} roughness={0.9} />
      </mesh>
      {/* Torso (jacket) */}
      <mesh position={[0, 1.18, 0]} scale={[1, 1, 0.7]} castShadow>
        <capsuleGeometry args={[0.235, 0.44, 8, 24]} />
        <meshStandardMaterial color={JACKET} roughness={0.9} />
      </mesh>
      {/* Shirt front */}
      <mesh position={[0, 1.2, 0.1]} scale={[0.5, 1.05, 0.3]} castShadow>
        <capsuleGeometry args={[0.15, 0.3, 8, 20]} />
        <meshStandardMaterial color={SHIRT} roughness={0.85} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.44, 0]}>
        <cylinderGeometry args={[0.072, 0.09, 0.16, 16]} />
        {skin}
      </mesh>
      {/* Shoulders */}
      <mesh position={[0, 1.38, 0]} scale={[1, 0.42, 0.62]} castShadow>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color={JACKET} roughness={0.9} />
      </mesh>

      {/* Arms */}
      <group ref={armL} position={[0.275, 1.36, 0]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.26, 6, 16]} />
          <meshStandardMaterial color={JACKET} roughness={0.9} />
        </mesh>
        <group ref={foreL} position={[0, -0.34, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.24, 6, 16]} />
            <meshStandardMaterial color={SKIN_DARK} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.33, 0]} castShadow>
            <sphereGeometry args={[0.075, 20, 20]} />
            {skin}
          </mesh>
        </group>
      </group>
      <group ref={armR} position={[-0.275, 1.36, 0]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.26, 6, 16]} />
          <meshStandardMaterial color={JACKET} roughness={0.9} />
        </mesh>
        <group ref={foreR} position={[0, -0.34, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.24, 6, 16]} />
            <meshStandardMaterial color={SKIN_DARK} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.33, 0]} castShadow>
            <sphereGeometry args={[0.075, 20, 20]} />
            {skin}
          </mesh>
        </group>
      </group>

      {/* Head */}
      <group ref={head} position={[0, 1.52, 0]}>
        <mesh position={[0, 0.16, 0]} scale={[1, 1.18, 1.02]} castShadow>
          <sphereGeometry args={[0.19, 40, 40]} />
          {skin}
        </mesh>
        {/* Hair */}
        <mesh position={[0, 0.23, -0.01]} scale={[1.04, 1.02, 1.06]}>
          <sphereGeometry args={[0.19, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color={HAIR} roughness={0.95} />
        </mesh>
        {/* Ears */}
        {[-0.19, 0.19].map((x) => (
          <mesh key={x} position={[x, 0.16, 0]} scale={[0.5, 1, 0.6]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            {skin}
          </mesh>
        ))}
        {/* Eyes */}
        {[-0.07, 0.07].map((x, i) => (
          <group key={x} position={[x, 0.2, 0.163]}>
            <mesh>
              <sphereGeometry args={[0.032, 20, 20]} />
              <meshStandardMaterial color="#f7f4f0" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.024]}>
              <sphereGeometry args={[0.016, 16, 16]} />
              <meshStandardMaterial color="#2d1a10" roughness={0.2} />
            </mesh>
            <mesh ref={i === 0 ? lidL : lidR} position={[0, 0.006, 0.012]}>
              <sphereGeometry args={[0.034, 16, 16]} />
              {skin}
            </mesh>
          </group>
        ))}
        {/* Brows */}
        <mesh ref={browL} position={[-0.07, 0.255, 0.17]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.07, 0.014, 0.02]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        <mesh ref={browR} position={[0.07, 0.255, 0.17]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.07, 0.014, 0.02]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 0.15, 0.185]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.032, 0.075, 16]} />
          {skin}
        </mesh>
        {/* Mouth (jaw opens with speech) */}
        <mesh ref={jaw} position={[0, 0.08, 0.168]} scale={[1, 0.1, 1]}>
          <sphereGeometry args={[0.048, 24, 24]} />
          <meshStandardMaterial color="#5c2027" roughness={0.5} />
        </mesh>
        {/* Smile curve: an upturned arc under the mouth */}
        <mesh ref={smile} position={[0, 0.045, 0.176]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.045, 0.006, 8, 24, Math.PI]} />
          <meshStandardMaterial color={SKIN_DARK} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

export function TeacherAvatar({ speaking, thinking, nodAt, listening, mouthLevel }: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.2, 3.3], fov: 38 }}
      dpr={[1, 1.6]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#101826"]} />
      <fog attach="fog" args={["#101826", 4, 9]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.6} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#8fb9ff" />
      <Suspense fallback={null}>
        <Teacher speaking={speaking} thinking={thinking} nodAt={nodAt} listening={listening} mouthLevel={mouthLevel} />
        <ContactShadows position={[0, -0.92, 0]} opacity={0.45} scale={5} blur={2.6} far={3} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={5}
        minPolarAngle={Math.PI / 2.4}
        maxPolarAngle={Math.PI / 1.85}
        target={[0, 0.05, 0]}
      />
    </Canvas>
  );
}
