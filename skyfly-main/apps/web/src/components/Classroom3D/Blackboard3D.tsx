import { Html } from "@react-three/drei";
import { Sparkles, Brain, BookOpen } from "lucide-react";
import type { LessonTopic } from "./types";

interface Blackboard3DProps {
  topic: LessonTopic;
  speaking: boolean;
}

export function Blackboard3D({ topic, speaking }: Blackboard3DProps) {
  return (
    <group position={[0, 2.7, -9.8]}>
      {/* 1. Main Chalkboard Frame (Dark Teak/Walnut Wood) */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[9.2, 3.4, 0.12]} />
        <meshStandardMaterial color="#2d1c13" roughness={0.7} />
      </mesh>

      {/* 2. Inner Blackboard Matte Surface (Classic Dark Green / Slate Chalkboard) */}
      <mesh position={[0, 0, 0.05]} receiveShadow>
        <planeGeometry args={[8.8, 3.0]} />
        <meshStandardMaterial
          color="#162923"
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>

      {/* 3. Bottom Chalk Ledge / Tray */}
      <mesh position={[0, -1.68, 0.16]} castShadow>
        <boxGeometry args={[9.2, 0.08, 0.24]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Chalk Sticks on Tray */}
      {[-1.2, -0.9, -0.6, 1.4, 1.6].map((x, i) => (
        <mesh
          key={i}
          position={[x, -1.63, 0.18]}
          rotation={[0, 0.2 * i, 0]}
        >
          <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#ffffff" : "#fef08a"}
            roughness={0.95}
          />
        </mesh>
      ))}

      {/* Wooden Chalk Eraser / Duster */}
      <mesh position={[0.2, -1.62, 0.19]} rotation={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.18, 0.05, 0.09]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>

      {/* 4. Top Classroom Smart Light Fixture above Blackboard */}
      <mesh position={[0, 1.76, 0.35]}>
        <boxGeometry args={[8.6, 0.06, 0.15]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Light Strip Glow */}
      <mesh position={[0, 1.73, 0.35]}>
        <boxGeometry args={[8.4, 0.02, 0.08]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fef08a"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* 5. Blackboard Content Overlay (Crisp HTML Chalk & HUD Rendering) */}
      <Html
        transform
        distanceFactor={4.2}
        position={[0, 0.02, 0.08]}
        className="pointer-events-none select-none"
      >
        <div className="w-[1080px] h-[370px] p-6 text-white font-sans flex flex-col justify-between overflow-hidden">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/40">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                {topic.subject.toUpperCase()}
              </div>
              <span className="text-xl font-bold tracking-tight text-white/95 font-serif">
                {topic.boardHeading}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${speaking ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-xs font-mono text-emerald-300/80">
                {speaking ? "LIVE LECTURE" : "INTERACTIVE CLASSROOM"}
              </span>
            </div>
          </div>

          {/* Main Body: Equations on Left, Conceptual Points on Right */}
          <div className="grid grid-cols-12 gap-6 my-auto pt-2">
            {/* Left Col: Chalk Formulas & Math */}
            <div className="col-span-5 bg-black/40 rounded-xl p-4 border border-white/10">
              <div className="text-[11px] font-mono text-amber-300/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Core Formulas & Laws
              </div>
              <div className="space-y-2 font-mono text-amber-100">
                {topic.boardFormulas.map((f, i) => (
                  <div
                    key={i}
                    className="text-base bg-emerald-950/40 px-3 py-1.5 rounded border border-emerald-500/20 text-emerald-200 font-semibold shadow-inner"
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Structured Explanation Bullet Points */}
            <div className="col-span-7 space-y-2">
              <div className="text-[11px] font-mono text-cyan-300/90 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" /> Key Lecture Concepts
              </div>
              <div className="space-y-2">
                {topic.boardNotes.map((note, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-100 leading-snug bg-white/5 p-2.5 rounded-lg border border-white/10"
                  >
                    <span className="text-cyan-400 font-bold font-mono text-xs mt-0.5">
                      0{i + 1}.
                    </span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Live Caption / Spoken Subtitle */}
          <div className="mt-1 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300/90 font-mono">
            <div className="truncate max-w-[850px] italic text-emerald-200">
              {speaking ? `🎙️ Teacher: "${topic.speechText.slice(0, 110)}..."` : "💡 Click 'Start Lecture' or any topic to begin learning"}
            </div>
            <div className="text-[10px] text-white/50">EduVault 3D SmartBoard</div>
          </div>
        </div>
      </Html>
    </group>
  );
}
