import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type {
  HologramSegment,
  UniversalHologramScene,
  UniversalHologramElement,
  UniversalShape3DType,
} from "@/lib/classroom-ai.server";

interface Hologram3DProps {
  segment: HologramSegment | UniversalHologramScene | null;
  active: boolean;
  speaking: boolean;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onReplayStep?: () => void;
  onToggleSpeech?: () => void;
}

export function Hologram3D({ segment, active, speaking }: Hologram3DProps) {
  const root = useRef<THREE.Group>(null);
  const pedestalRings = useRef<THREE.Group>(null);
  const beamCone = useRef<THREE.Mesh>(null);
  const particleField = useRef<THREE.Points>(null);
  const model3DGroup = useRef<THREE.Group>(null);
  const globeGroup = useRef<THREE.Group>(null);

  // Procedural swirling holographic particles
  const particleGeo = useMemo(() => {
    const count = 42;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 0.25 + Math.random() * 0.7;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = 0.25 + Math.random() * 2.2;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Gentle levitation sway of the entire hologram pedestal
    if (root.current) {
      root.current.position.y = 0.25 + Math.sin(t * 1.4) * 0.02;
    }

    // Rotating holographic emitter base rings
    if (pedestalRings.current) {
      pedestalRings.current.rotation.y = t * 0.6;
    }

    // Volumetric beam pulse
    if (beamCone.current) {
      const pulse = 0.12 + Math.sin(t * 3.0) * 0.035;
      (beamCone.current.material as THREE.MeshStandardMaterial).opacity = pulse;
    }

    // Particle swirl
    if (particleField.current) {
      particleField.current.rotation.y = t * 0.35;
    }

    // Central 3D Science / Math Model organic rotation
    if (model3DGroup.current) {
      model3DGroup.current.rotation.y = t * 0.75;
      model3DGroup.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }

    // Rotating Geography Wireframe Globe
    if (globeGroup.current) {
      globeGroup.current.rotation.y = t * 0.45;
    }
  });

  if (!active || !segment) {
    return null;
  }

  // Extract up to 3 elements for clean vertical separation
  const elements: UniversalHologramElement[] =
    Array.isArray(segment.elements) && segment.elements.length > 0
      ? segment.elements.slice(0, 3)
      : [];

  // Fallback if elements list is empty
  if (elements.length === 0) {
    if (segment.formula) {
      elements.push({ type: "formula", formula: segment.formula });
    }
    if (segment.diagramType) {
      elements.push({
        type: "shape3d",
        shape: (segment.diagramType as UniversalShape3DType) || "sphere",
        title: segment.diagramLabel || segment.heading,
      });
    }
    if (Array.isArray(segment.keywords) && segment.keywords.length > 0) {
      elements.push({ type: "keywords", keywords: segment.keywords });
    } else if (Array.isArray(segment.keyPoints) && segment.keyPoints.length > 0) {
      elements.push({ type: "steps", steps: segment.keyPoints });
    } else {
      elements.push({ type: "keywords", keywords: ["Core Concept", "Key Takeaway"] });
      elements.push({
        type: "steps",
        steps: ["1. Understand key theorem", "2. Review derivation & examples"],
      });
    }
  }

  return (
    // Positioned neatly to the teacher's right side (x = 3.8, z = -7.2) with balanced scale
    <group ref={root} position={[3.8, 0.25, -7.2]} scale={[0.88, 0.88, 0.88]}>
      {/* 1. Futuristic Sci-Fi Emitter Pedestal Base */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.5, 0.6, 0.08, 28]} />
        <meshStandardMaterial color="#0b1120" metalness={0.92} roughness={0.18} />
      </mesh>

      {/* Hexagonal Laser Projection Ring */}
      <mesh position={[0, 0.088, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.46, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Upward Volumetric Hologram Light Cone Beam */}
      <mesh ref={beamCone} position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.58, 0.1, 2.4, 24, 1, true]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Swirling Hologram Particle Dust */}
      <points ref={particleField} geometry={particleGeo}>
        <pointsMaterial
          size={0.032}
          color="#38bdf8"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Gyroscopic Orbital Projector Rings */}
      <group ref={pedestalRings} position={[0, 1.35, 0]}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.52, 0.007, 10, 40]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0ea5e9"
            emissiveIntensity={1.4}
            transparent
            opacity={0.7}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[0.44, 0.006, 10, 40]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#f43f5e"
            emissiveIntensity={1.4}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>

      {/* Render Dynamic Elements (Max 3, vertically placed at Top y=2.35, Center y=1.35, Bottom y=0.55) */}
      {elements.map((el, index) => {
        // Vertical layout slots based on total count
        let posY = 1.35;
        if (elements.length === 3) {
          posY = index === 0 ? 2.35 : index === 1 ? 1.35 : 0.55;
        } else if (elements.length === 2) {
          posY = index === 0 ? 2.15 : 0.85;
        }

        return (
          <group key={el.id || `el-${index}-${el.type}`} position={[0, posY, 0]}>
            {renderElementContent(el, model3DGroup, globeGroup)}
          </group>
        );
      })}
    </group>
  );
}

// Sub-Renderer for the 9 Hologram Element Types
function renderElementContent(
  el: UniversalHologramElement,
  model3DGroup: React.RefObject<THREE.Group>,
  globeGroup: React.RefObject<THREE.Group>
) {
  switch (el.type) {
    // 1. 3D SHAPE / GEOMETRY
    case "shape3d":
      return (
        <group>
          <group ref={model3DGroup}>
            {render3DShapeGeometry(el.shape || (el.modelType as UniversalShape3DType) || "sphere", el.color)}
          </group>
          {el.title && (
            <Billboard follow position={[0, -0.32, 0]}>
              <Html center distanceFactor={6.2} className="pointer-events-none select-none">
                <div className="rounded-lg border border-cyan-400/50 bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300 backdrop-blur-md shadow-md whitespace-nowrap">
                  ✦ {el.title}
                </div>
              </Html>
            </Billboard>
          )}
        </group>
      );

    // 2. DIAGRAM (Flowchart, Cycle, Tree, Timeline, Comparison)
    case "diagram":
      return (
        <Billboard follow>
          <Html center distanceFactor={6.2} className="pointer-events-none select-none">
            <div className="max-w-[280px] rounded-2xl border border-cyan-400/70 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md text-left">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  {el.diagram?.style || "Hologram Diagram"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {el.diagram?.nodes?.map((node, i) => (
                  <div key={node.id || i} className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">
                      <div>{node.label}</div>
                      {node.sublabel && (
                        <div className="text-[9px] text-cyan-400/80 font-normal">{node.sublabel}</div>
                      )}
                    </div>
                    {i < (el.diagram?.nodes?.length || 0) - 1 && (
                      <span className="text-cyan-400 text-xs">➔</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Html>
        </Billboard>
      );

    // 3. GRAPH (Line, Bar, Pie with glowing data points)
    case "graph":
      return (
        <Billboard follow>
          <Html center distanceFactor={6.2} className="pointer-events-none select-none">
            <div className="w-[260px] rounded-2xl border border-cyan-400/70 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                  📈 {el.graph?.chartType?.toUpperCase() || "DATA GRAPH"}
                </span>
                <span className="text-[9px] text-cyan-300/70 font-mono">
                  {el.graph?.yAxisLabel || "f(x)"} vs {el.graph?.xAxisLabel || "x"}
                </span>
              </div>
              {/* Mini SVG Data Visualizer */}
              <div className="h-20 w-full flex items-end justify-between gap-1.5 pt-2 pb-1 border-b border-l border-cyan-500/40 px-1">
                {el.graph?.points?.map((pt, i) => {
                  const maxVal = Math.max(...(el.graph?.points?.map((p) => Math.abs(p.y)) || [1]), 1);
                  const heightPct = Math.min(100, Math.max(15, (Math.abs(pt.y) / maxVal) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[8px] font-mono text-cyan-300">{pt.y}</span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                      />
                      <span className="text-[8px] font-mono text-cyan-400/80 truncate max-w-[32px]">
                        {pt.x}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Html>
        </Billboard>
      );

    // 4. FORMULA (Glowing math / physics / chemistry equation)
    case "formula":
      return (
        <Billboard follow>
          <Html center distanceFactor={6.2} className="pointer-events-none select-none">
            <div className="max-w-[270px] rounded-2xl border border-cyan-400/70 bg-slate-950/90 px-3.5 py-1.5 shadow-2xl backdrop-blur-md text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400/90 font-bold">
                  Hologram Formula
                </span>
              </div>
              <div className="font-mono font-bold text-cyan-100 text-xs sm:text-sm tracking-wide break-words drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]">
                {el.formula || "E = m · c²"}
              </div>
            </div>
          </Html>
        </Billboard>
      );

    // 5. MAP (Geography Globe & Region Locator)
    case "map":
      return (
        <group>
          <group ref={globeGroup}>
            {/* Holographic Wireframe Rotating Globe */}
            <mesh>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial
                color="#0284c7"
                wireframe
                emissive="#0284c7"
                emissiveIntensity={1.8}
                transparent
                opacity={0.65}
              />
            </mesh>
            {/* Equator & Meridian Rings */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.22, 0.225, 32]} />
              <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
            </mesh>
            {/* Target Beacon Pin */}
            <mesh position={[0.16, 0.12, 0.1]}>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshStandardMaterial color="#ec4899" emissive="#f43f5e" emissiveIntensity={3} />
            </mesh>
          </group>
          <Billboard follow position={[0, -0.32, 0]}>
            <Html center distanceFactor={6.2} className="pointer-events-none select-none">
              <div className="rounded-xl border border-pink-500/70 bg-slate-950/90 px-3 py-1 text-center shadow-lg backdrop-blur-md">
                <div className="text-[11px] font-bold text-pink-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  🌍 {el.map?.regionName || "Geographic Target"}
                </div>
                {el.map?.highlights?.[0] && (
                  <div className="text-[9px] text-pink-200/80 font-mono">{el.map.highlights[0]}</div>
                )}
              </div>
            </Html>
          </Billboard>
        </group>
      );

    // 6. KEYWORDS (Floating concept pills)
    case "keywords":
      return (
        <Billboard follow>
          <Html center distanceFactor={6.2} className="pointer-events-none select-none">
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[260px]">
              {(el.keywords || ["Core Principle", "Key Concept"]).map((kw, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-pink-500/60 bg-slate-950/90 px-2.5 py-1 text-[10px] font-bold text-pink-300 backdrop-blur-md shadow-lg drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] whitespace-nowrap"
                >
                  ✦ {kw}
                </div>
              ))}
            </div>
          </Html>
        </Billboard>
      );

    // 7. STEPS (Numbered holographic step checklist)
    case "steps":
      return (
        <Billboard follow>
          <Html center distanceFactor={6.2} className="pointer-events-none select-none">
            <div className="max-w-[270px] rounded-2xl border border-cyan-400/60 bg-slate-950/90 p-2.5 shadow-2xl backdrop-blur-md text-left">
              <div className="text-[9px] font-mono font-bold uppercase text-cyan-400 mb-1">
                ✓ Execution Steps
              </div>
              <div className="flex flex-col gap-1">
                {(el.steps || ["Step 1", "Step 2"]).slice(0, 3).map((st, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-[10px] leading-tight text-cyan-100/90"
                  >
                    <span className="flex-shrink-0 text-cyan-400 font-bold font-mono">[{i + 1}]</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          </Html>
        </Billboard>
      );

    // 8. CODE (Holographic IDE card)
    case "code":
      return (
        <Billboard follow>
          <Html center distanceFactor={6.2} className="pointer-events-none select-none">
            <div className="w-[280px] rounded-2xl border border-emerald-400/60 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md text-left font-mono">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-500/30">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500/80" />
                  <span className="h-2 w-2 rounded-full bg-yellow-500/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[9px] uppercase font-bold text-emerald-400">
                  {el.code?.language || "Code"}
                </span>
              </div>
              <pre className="text-[9px] text-emerald-200 leading-snug overflow-x-auto whitespace-pre-wrap max-h-[85px]">
                {el.code?.snippet || "# Solution algorithm"}
              </pre>
            </div>
          </Html>
        </Billboard>
      );

    // 9. IMAGE / CONCEPT (Procedural conceptual node matrix)
    case "image_concept":
    default:
      return (
        <Billboard follow>
          <Html center distanceFactor={6.2} className="pointer-events-none select-none">
            <div className="max-w-[260px] rounded-2xl border border-cyan-400/70 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md text-center">
              <div className="text-sm mb-1">💡</div>
              <div className="text-[11px] font-bold text-cyan-200 mb-1">
                {el.imageConcept?.conceptName || el.title || "Conceptual Framework"}
              </div>
              {el.imageConcept?.subparts && (
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {el.imageConcept.subparts.map((sp, i) => (
                    <span
                      key={i}
                      className="rounded bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 text-[9px] text-cyan-300"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Html>
        </Billboard>
      );
  }
}

// 3D Procedural Geometries for "shape3d"
function render3DShapeGeometry(shape: UniversalShape3DType, customColor?: string) {
  const cyan = customColor || "#38bdf8";
  const pink = "#ec4899";
  const amber = "#f59e0b";

  switch (shape) {
    // 1. SPHERE
    case "sphere":
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.184, 16, 16]} />
            <meshStandardMaterial
              color={cyan}
              wireframe
              emissive={cyan}
              emissiveIntensity={2}
            />
          </mesh>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.26, 0.006, 8, 32]} />
            <meshStandardMaterial color={pink} emissive={pink} emissiveIntensity={2} />
          </mesh>
        </group>
      );

    // 2. CUBE
    case "cube":
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.26, 0.26, 0.26]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.264, 0.264, 0.264]} />
            <meshStandardMaterial
              color={cyan}
              wireframe
              emissive={cyan}
              emissiveIntensity={2}
            />
          </mesh>
          <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial
              color={pink}
              wireframe
              emissive={pink}
              emissiveIntensity={2}
            />
          </mesh>
        </group>
      );

    // 3. CYLINDER
    case "cylinder":
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[0.12, 0.12, 0.32, 16]} />
            <meshStandardMaterial color={cyan} wireframe emissive={cyan} emissiveIntensity={2} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.32, 12]} />
            <meshStandardMaterial color={pink} emissive={pink} emissiveIntensity={1.5} />
          </mesh>
        </group>
      );

    // 4. CONE
    case "cone":
      return (
        <group>
          <mesh>
            <coneGeometry args={[0.16, 0.34, 16]} />
            <meshStandardMaterial color={cyan} wireframe emissive={cyan} emissiveIntensity={2} />
          </mesh>
        </group>
      );

    // 5. TORUS
    case "torus":
      return (
        <group>
          <mesh>
            <torusGeometry args={[0.2, 0.04, 12, 32]} />
            <meshStandardMaterial color={cyan} wireframe emissive={cyan} emissiveIntensity={2} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.14, 0.02, 10, 24]} />
            <meshStandardMaterial color={pink} emissive={pink} emissiveIntensity={2} />
          </mesh>
        </group>
      );

    // 6. ARROW (Force & Dynamics Vectors)
    case "arrow":
      return (
        <group>
          {/* Central Mass */}
          <mesh>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.124, 0.124, 0.124]} />
            <meshStandardMaterial color={cyan} wireframe emissive={cyan} emissiveIntensity={1.8} />
          </mesh>
          {/* Arrow Vector */}
          <group position={[0.08, 0, 0]}>
            <mesh position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.007, 0.007, 0.2, 6]} />
              <meshStandardMaterial color={pink} emissive={pink} emissiveIntensity={2.2} />
            </mesh>
            <mesh position={[0.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.026, 0.06, 10]} />
              <meshStandardMaterial color={pink} emissive={pink} emissiveIntensity={2.5} />
            </mesh>
          </group>
        </group>
      );

    // 7. PLANE (Cartesian Grid)
    case "plane":
    case "grid":
      return (
        <group rotation={[Math.PI / 6, 0, 0]}>
          <mesh>
            <planeGeometry args={[0.4, 0.4, 6, 6]} />
            <meshStandardMaterial
              color={cyan}
              wireframe
              emissive={cyan}
              emissiveIntensity={2}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      );

    // 8. ORBIT SYSTEM / ATOM / SOLAR SYSTEM
    case "orbit_system":
    default:
      return (
        <group>
          {/* Central Sun / Nucleus */}
          <mesh>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color={amber} emissive={amber} emissiveIntensity={2.5} />
          </mesh>
          {/* Orbit 1 */}
          <mesh rotation={[0.4, 0.9, 0]}>
            <torusGeometry args={[0.26, 0.006, 8, 36]} />
            <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={1.6} />
          </mesh>
          <mesh position={[0.26, 0, 0]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={2.5} />
          </mesh>
          {/* Orbit 2 */}
          <mesh rotation={[-0.7, 0.5, 0]}>
            <torusGeometry args={[0.26, 0.006, 8, 36]} />
            <meshStandardMaterial color={pink} emissive={pink} emissiveIntensity={1.6} />
          </mesh>
          <mesh position={[-0.26, 0, 0]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            <meshStandardMaterial color={pink} emissive={pink} emissiveIntensity={2.5} />
          </mesh>
        </group>
      );

    // 9. WAVE
    case "wave":
      return (
        <group>
          {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => (
            <mesh key={i} position={[x, Math.sin(i * 1.2) * 0.12, 0]}>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={2.2} />
            </mesh>
          ))}
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.22, 0.005, 8, 32]} />
            <meshStandardMaterial color={pink} emissive={pink} emissiveIntensity={1.6} />
          </mesh>
        </group>
      );

    // 10. HELIX / DNA
    case "helix":
      return (
        <group>
          {[-0.2, -0.13, -0.06, 0, 0.06, 0.13, 0.2].map((y, i) => (
            <group key={i} position={[0, y, 0]} rotation={[0, i * 0.6, 0]}>
              <mesh>
                <cylinderGeometry args={[0.006, 0.006, 0.32, 6]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color={amber} emissive={amber} emissiveIntensity={1.2} />
              </mesh>
              <mesh position={[-0.16, 0, 0]}>
                <sphereGeometry args={[0.024, 8, 8]} />
                <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={2} />
              </mesh>
              <mesh position={[0.16, 0, 0]}>
                <sphereGeometry args={[0.024, 8, 8]} />
                <meshStandardMaterial color={pink} emissive={pink} emissiveIntensity={2} />
              </mesh>
            </group>
          ))}
        </group>
      );

    // 11. MOLECULE
    case "molecule":
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.08, 14, 14]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={2.2} />
          </mesh>
          <mesh position={[-0.15, 0.1, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.15, 0.1, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
          </mesh>
          <mesh position={[-0.075, 0.05, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.007, 0.007, 0.15, 6]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[0.075, 0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.007, 0.007, 0.15, 6]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      );

    // 12. 3D BAR CHART
    case "bar_chart_3d":
      return (
        <group>
          {[-0.14, -0.05, 0.05, 0.14].map((x, i) => {
            const h = [0.12, 0.22, 0.32, 0.18][i] || 0.2;
            return (
              <mesh key={i} position={[x, h / 2 - 0.15, 0]}>
                <boxGeometry args={[0.06, h, 0.06]} />
                <meshStandardMaterial color={cyan} wireframe emissive={cyan} emissiveIntensity={2} />
              </mesh>
            );
          })}
        </group>
      );
  }
}
