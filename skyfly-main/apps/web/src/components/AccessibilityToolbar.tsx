import React, { useState } from "react";
import {
  Eye,
  Type,
  Sparkles,
  ZapOff,
  HelpCircle,
  X,
  Volume2,
  Check,
} from "lucide-react";
import { useAccessibility, type TextSize } from "@/lib/accessibility";
import { Link } from "@tanstack/react-router";

export function AccessibilityToolbar() {
  const {
    textSize,
    setTextSize,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    announce,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const handleTextSizeChange = (size: TextSize) => {
    setTextSize(size);
    announce(`Text size set to ${size}`);
  };

  const handleContrastToggle = () => {
    toggleHighContrast();
    announce(highContrast ? "High contrast disabled" : "High contrast enabled");
  };

  const handleMotionToggle = () => {
    toggleReducedMotion();
    announce(reducedMotion ? "Animations restored" : "Reduced motion enabled");
  };

  return (
    <div className="relative">
      {/* Quick Access Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Accessibility options: adjust text size, contrast, and voice assistance"
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card/80 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition shadow-sm"
        title="Accessibility Settings"
      >
        <Eye className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span className="hidden sm:inline">Accessibility</span>
        {highContrast && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        )}
      </button>

      {/* Accessible Flyout Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Accessibility settings panel"
          className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl focus:outline-none"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-bold tracking-tight">Accessibility & Vision</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility options"
              className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 space-y-4">
            {/* Text Size Scale */}
            <div>
              <label id="text-size-label" className="text-xs font-semibold text-muted-foreground">
                Text Size Scale
              </label>
              <div
                role="radiogroup"
                aria-labelledby="text-size-label"
                className="mt-1.5 grid grid-cols-3 gap-2"
              >
                {(
                  [
                    { id: "normal", label: "Normal (100%)", icon: "A" },
                    { id: "large", label: "Large (115%)", icon: "A+" },
                    { id: "xlarge", label: "Extra Large (130%)", icon: "A++" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    role="radio"
                    aria-checked={textSize === item.id}
                    onClick={() => handleTextSizeChange(item.id)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-primary ${
                      textSize === item.id
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background hover:bg-accent text-foreground"
                    }`}
                  >
                    <span className="text-sm font-bold">{item.icon}</span>
                    <span className="text-[10px] opacity-80">{item.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast Mode */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">High Contrast</span>
                <p className="text-[11px] text-muted-foreground">
                  Solid dark/light colors and high-visibility outlines
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={highContrast}
                onClick={handleContrastToggle}
                aria-label="Toggle high contrast display mode"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  highContrast ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    highContrast ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion Mode */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Reduce Motion</span>
                <p className="text-[11px] text-muted-foreground">
                  Disable decorative animations and orb pulsing
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={reducedMotion}
                onClick={handleMotionToggle}
                aria-label="Toggle reduced motion"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  reducedMotion ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    reducedMotion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Quick Voice & Study Shortcuts */}
            <div className="rounded-xl border border-border bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Voice Learning Shortcuts</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  to="/voice"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-primary/20 bg-background p-2 text-center font-medium hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  🎙️ Voice Teacher
                </Link>
                <Link
                  to="/study-reader"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-primary/20 bg-background p-2 text-center font-medium hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  📖 Study Reader
                </Link>
              </div>
            </div>

            {/* Keyboard Shortcuts Trigger */}
            <button
              onClick={() => setShowKeyboardHelp((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:underline"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Keyboard accessibility guide</span>
            </button>

            {showKeyboardHelp && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
                <p><strong>Tab / Shift+Tab:</strong> Navigate controls sequentially</p>
                <p><strong>Space / Enter:</strong> Activate buttons or toggles</p>
                <p><strong>Esc:</strong> Close dialogs or dropdown menus</p>
                <p><strong>Enter on Voice Mic:</strong> Start/stop listening immediately</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
