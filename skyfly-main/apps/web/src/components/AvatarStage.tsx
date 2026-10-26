import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Sparkles, AlertCircle } from "lucide-react";

const TeacherAvatar = lazy(() =>
  import("./TeacherAvatar").then((m) => ({ default: m.TeacherAvatar }))
);

class AvatarBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.warn("[AvatarBoundary] 3D stage encountered error, using poster fallback:", error);
  }

  override render() {
    if (this.state.failed) {
      return (
        this.props.fallback || (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#101826] p-6 text-center text-slate-300">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-primary mb-3">
              <Sparkles className="h-6 w-6 text-brand-cyan" />
            </div>
            <h4 className="font-semibold text-white">3D Teacher Active</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              Audio explanation and live transcription remain available.
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

function isWebGLAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function AvatarStage({
  speaking,
  thinking,
  nodAt,
  listening,
  mouthLevel,
}: {
  speaking: boolean;
  thinking?: boolean;
  nodAt?: number;
  listening?: boolean;
  mouthLevel?: React.RefObject<number>;
}) {
  const [mounted, setMounted] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());

    const hasIdle = "requestIdleCallback" in window;
    const idle = hasIdle
      ? window.requestIdleCallback(() => setMounted(true), { timeout: 1000 })
      : window.setTimeout(() => setMounted(true), 150);

    return () => {
      if (hasIdle) window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-[#101826] p-6 text-center text-slate-300">
        <div className="absolute inset-0 hero-bg opacity-30" />
        <div className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl brand-bg text-white shadow-glow mb-4">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-white">EduVault AI Teacher</h3>
          <p className="mt-1.5 max-w-sm text-xs text-slate-400">
            WebGL is disabled or unsupported on this device. Live audio lecture and blackboard captions remain 100% active.
          </p>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#101826] animate-pulse">
        <div className="text-xs text-slate-500 font-mono">Initializing 3D Teacher Stage...</div>
      </div>
    );
  }

  return (
    <AvatarBoundary>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-[#101826]">
            <div className="text-xs text-slate-500 font-mono">Rendering Avatar...</div>
          </div>
        }
      >
        <TeacherAvatar
          speaking={speaking}
          thinking={thinking}
          nodAt={nodAt}
          listening={listening}
          mouthLevel={mouthLevel}
        />
      </Suspense>
    </AvatarBoundary>
  );
}
