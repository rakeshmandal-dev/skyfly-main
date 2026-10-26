import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

export type TextSize = "normal" | "large" | "xlarge";

export interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  cycleTextSize: () => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  toggleReducedMotion: () => void;
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

const STORAGE_KEYS = {
  TEXT_SIZE: "ev:a11y:text-size",
  HIGH_CONTRAST: "ev:a11y:high-contrast",
  REDUCED_MOTION: "ev:a11y:reduced-motion",
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    if (typeof window === "undefined") return "normal";
    const saved = localStorage.getItem(STORAGE_KEYS.TEXT_SIZE);
    return saved === "large" || saved === "xlarge" ? (saved as TextSize) : "normal";
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST);
    if (saved !== null) return saved === "true";
    return window.matchMedia?.("(prefers-contrast: more)")?.matches ?? false;
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(STORAGE_KEYS.REDUCED_MOTION);
    if (saved !== null) return saved === "true";
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  });

  const [politeAnnouncement, setPoliteAnnouncement] = useState<string>("");
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState<string>("");
  const announceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply attributes to document root for CSS selectors
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-text-size", textSize);
    try {
      localStorage.setItem(STORAGE_KEYS.TEXT_SIZE, textSize);
    } catch {
      /* ignore */
    }
  }, [textSize]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (highContrast) {
      root.setAttribute("data-contrast", "high");
      root.classList.add("high-contrast");
    } else {
      root.removeAttribute("data-contrast");
      root.classList.remove("high-contrast");
    }
    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(highContrast));
    } catch {
      /* ignore */
    }
  }, [highContrast]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (reducedMotion) {
      root.setAttribute("data-reduced-motion", "true");
      root.classList.add("reduced-motion");
    } else {
      root.removeAttribute("data-reduced-motion");
      root.classList.remove("reduced-motion");
    }
    try {
      localStorage.setItem(STORAGE_KEYS.REDUCED_MOTION, String(reducedMotion));
    } catch {
      /* ignore */
    }
  }, [reducedMotion]);

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
  }, []);

  const cycleTextSize = useCallback(() => {
    setTextSizeState((prev) => {
      if (prev === "normal") return "large";
      if (prev === "large") return "xlarge";
      return "normal";
    });
  }, []);

  const setHighContrast = useCallback((val: boolean) => {
    setHighContrastState(val);
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrastState((prev) => !prev);
  }, []);

  const setReducedMotion = useCallback((val: boolean) => {
    setReducedMotionState(val);
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotionState((prev) => !prev);
  }, []);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    if (announceTimeoutRef.current) clearTimeout(announceTimeoutRef.current);
    if (priority === "assertive") {
      setAssertiveAnnouncement("");
      announceTimeoutRef.current = setTimeout(() => setAssertiveAnnouncement(message), 50);
    } else {
      setPoliteAnnouncement("");
      announceTimeoutRef.current = setTimeout(() => setPoliteAnnouncement(message), 50);
    }
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        cycleTextSize,
        highContrast,
        setHighContrast,
        toggleHighContrast,
        reducedMotion,
        setReducedMotion,
        toggleReducedMotion,
        announce,
      }}
    >
      {/* WCAG Screen reader live announcement regions */}
      <div
        id="a11y-live-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", border: 0 }}
      >
        {politeAnnouncement}
      </div>
      <div
        id="a11y-live-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", border: 0 }}
      >
        {assertiveAnnouncement}
      </div>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      textSize: "normal",
      setTextSize: () => {},
      cycleTextSize: () => {},
      highContrast: false,
      setHighContrast: () => {},
      toggleHighContrast: () => {},
      reducedMotion: false,
      setReducedMotion: () => {},
      toggleReducedMotion: () => {},
      announce: () => {},
    };
  }
  return ctx;
}

/**
 * SkipToContent: Allows screen reader & keyboard navigation users
 * to jump straight past navigation headers to the main content.
 */
export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-primary focus:text-primary-foreground focus:font-semibold focus:shadow-2xl focus:ring-4 focus:ring-ring focus:outline-none transition"
    >
      Skip to main content
    </a>
  );
}
