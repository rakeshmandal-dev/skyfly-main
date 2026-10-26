import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ClassroomEnvironment() {
  const clockSecHand = useRef<THREE.Mesh>(null);
  const clockMinHand = useRef<THREE.Mesh>(null);
  const clockHourHand = useRef<THREE.Mesh>(null);

  // Animate the classroom wall clock with real time
  useFrame(() => {
    const now = new Date();
    const secs = now.getSeconds() + now.getMilliseconds() / 1000;
    const mins = now.getMinutes() + secs / 60;
    const hours = (now.getHours() % 12) + mins / 60;

    if (clockSecHand.current) clockSecHand.current.rotation.z = -secs * (Math.PI / 30);
    if (clockMinHand.current) clockMinHand.current.rotation.z = -mins * (Math.PI / 30);
    if (clockHourHand.current) clockHourHand.current.rotation.z = -hours * (Math.PI / 6);
  });

  return (
    <group>
      {/* 1. Main Classroom Floor (Warm Oak Wood Parquet) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 2]}
        receiveShadow
      >
        <planeGeometry args={[18, 26]} />
        <meshStandardMaterial
          color="#3b2b1d"
          roughness={0.65}
          metalness={0.08}
        />
      </mesh>

      {/* Decorative Floor Inset Board & Aisles */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 3.5]}
        receiveShadow
      >
        <planeGeometry args={[14.5, 18]} />
        <meshStandardMaterial
          color="#4e3725"
          roughness={0.58}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Raised Front Podium Platform for Teacher */}
      <mesh position={[0, 0.15, -8.2]} receiveShadow castShadow>
        <boxGeometry args={[12, 0.3, 3.6]} />
        <meshStandardMaterial
          color="#2e1f14"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Brass Edge Trim for Podium */}
      <mesh position={[0, 0.29, -6.42]}>
        <boxGeometry args={[12.02, 0.03, 0.04]} />
        <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 3. Teacher's Podium / Lecture Desk */}
      <group position={[-2.4, 0.3, -7.2]}>
        {/* Desk Body */}
        <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.92, 0.8]} />
          <meshStandardMaterial color="#3a2719" roughness={0.65} />
        </mesh>
        {/* Desk Top Surface */}
        <mesh position={[0, 0.93, 0]} castShadow>
          <boxGeometry args={[1.62, 0.05, 0.9]} />
          <meshStandardMaterial color="#553822" roughness={0.5} />
        </mesh>
        {/* Teacher's Laptop */}
        <mesh position={[-0.2, 0.96, -0.05]} rotation={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.34, 0.015, 0.24]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Laptop Screen */}
        <mesh position={[-0.2, 1.09, -0.15]} rotation={[-0.3, 0.2, 0]} castShadow>
          <boxGeometry args={[0.34, 0.22, 0.012]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Glowing Screen Face */}
        <mesh position={[-0.2, 1.09, -0.14]} rotation={[-0.3, 0.2, 0]}>
          <planeGeometry args={[0.32, 0.2]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.8}
          />
        </mesh>
        {/* Stack of Academic Books */}
        <mesh position={[0.42, 0.98, 0.08]} rotation={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.26, 0.08, 0.2]} />
          <meshStandardMaterial color="#991b1b" roughness={0.8} />
        </mesh>
        <mesh position={[0.42, 1.04, 0.08]} rotation={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.24, 0.04, 0.19]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
        </mesh>
        {/* Globe / Science Flask Model */}
        <group position={[0.45, 0.95, -0.22]}>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.07, 0.04, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.14, 0]} castShadow>
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshStandardMaterial
              color="#0284c7"
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
        </group>
        {/* Goose-neck Podium Microphone */}
        <group position={[-0.55, 0.95, 0.2]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.03, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[0.04, 0.18, -0.04]} rotation={[0.4, 0, -0.3]}>
            <cylinderGeometry args={[0.008, 0.008, 0.32, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
          <mesh position={[0.08, 0.3, -0.09]}>
            <capsuleGeometry args={[0.016, 0.04, 6, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* 4. Walls & Architecture */}
      {/* Front Wall (behind Blackboard) */}
      <mesh position={[0, 3.2, -10]} receiveShadow>
        <planeGeometry args={[18, 6.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {/* Wainscoting Wood Panel Lower Front Wall */}
      <mesh position={[0, 0.6, -9.95]} receiveShadow>
        <planeGeometry args={[18, 1.2]} />
        <meshStandardMaterial color="#2d1c13" roughness={0.7} />
      </mesh>

      {/* Back Wall of Classroom */}
      <mesh position={[0, 3.2, 14]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[18, 6.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Left Wall (with 4 Grand Windows & Natural Sunlight) */}
      <mesh position={[-9, 3.2, 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[26, 6.4]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>

      {/* 4 Architectural Classroom Windows on Left Wall */}
      {[-4, 0, 4, 8].map((z, i) => (
        <group key={i} position={[-8.92, 3.2, z]}>
          {/* Window Frame Outer */}
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[2.6, 3.4, 0.1]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Window Glass Pane */}
          <mesh position={[0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.3, 3.1]} />
            <meshStandardMaterial
              color="#bae6fd"
              transparent
              opacity={0.4}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          {/* Window Daylight Glow Panel behind Glass */}
          <mesh position={[-0.05, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.3, 3.1]} />
            <meshStandardMaterial
              color="#e0f2fe"
              emissive="#bae6fd"
              emissiveIntensity={0.6}
            />
          </mesh>
          {/* Window Sill */}
          <mesh position={[0.08, -1.72, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[2.8, 0.08, 0.24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Right Wall (with Educational Posters & Live Wall Clock) */}
      <mesh position={[9, 3.2, 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[26, 6.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Periodic Table & Science Charts on Right Wall */}
      <group position={[8.92, 3.2, -3]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[3.2, 2.0, 0.06]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[3.0, 1.8]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>
      </group>

      <group position={[8.92, 3.2, 4]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.6, 1.8, 0.06]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[2.4, 1.6]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.3} />
        </mesh>
      </group>

      {/* Functional Real-Time Analog Wall Clock on Right Wall */}
      <group position={[8.92, 4.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Clock Frame */}
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.06, 32]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Clock Face White Dial */}
        <mesh position={[0, 0, 0.032]}>
          <circleGeometry args={[0.38, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Hour Hand */}
        <mesh ref={clockHourHand} position={[0, 0, 0.038]}>
          <boxGeometry args={[0.024, 0.2, 0.006]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Minute Hand */}
        <mesh ref={clockMinHand} position={[0, 0, 0.042]}>
          <boxGeometry args={[0.016, 0.28, 0.006]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Second Hand (Red ticking) */}
        <mesh ref={clockSecHand} position={[0, 0, 0.046]}>
          <boxGeometry args={[0.008, 0.32, 0.004]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* 5. Classroom Ceiling & Modern LED Fixtures */}
      <mesh position={[0, 6.2, 2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 26]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* 6 Linear Pendant LED Panel Lights Hanging Over Aisle Rows */}
      {[-4, 0, 4].map((x) =>
        [-4, 2, 8].map((z) => (
          <group key={`${x}-${z}`} position={[x, 5.6, z]}>
            {/* Hanging Wire Rods */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.6, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
            {/* Lamp Fixture Body */}
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[2.2, 0.08, 0.3]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Glowing Diffuser Surface */}
            <mesh position={[0, -0.041, 0]}>
              <planeGeometry args={[2.1, 0.26]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#fef9c3"
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>
        ))
      )}

      {/* 6. Lighting Atmosphere */}
      {/* Ambient Fill */}
      <ambientLight intensity={0.7} color="#f8fafc" />
      <hemisphereLight
        args={["#93c5fd", "#334155", 0.6]}
      />

      {/* Sunlight streaming from left windows casting soft shadows across the 40 desks */}
      <directionalLight
        position={[-12, 8, 4]}
        target-position={[0, 1, 3]}
        intensity={1.8}
        color="#fef08a"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />

      {/* Spotlights for Front Stage: Highlighting Teacher and Blackboard */}
      <spotLight
        position={[0, 5.8, -4.5]}
        target-position={[0, 1.8, -8.2]}
        intensity={2.8}
        angle={Math.PI / 3}
        penumbra={0.6}
        color="#ffffff"
        castShadow
      />

      <pointLight
        position={[0, 4.2, -7.5]}
        intensity={1.4}
        distance={12}
        color="#fef08a"
      />
    </group>
  );
}
