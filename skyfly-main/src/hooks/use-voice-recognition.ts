import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceRecognitionOptions {
  language?: "hi-IN" | "en-IN" | "en-US";
  onResult?: (transcript: string, isFinal?: boolean) => void;
  onFinalResult?: (finalTranscript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const autoSubmitTimer = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRec) {
      setIsSupported(false);
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = options.language || "en-IN";

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
      setPermissionDenied(false);
      finalTranscriptRef.current = "";
      setInterimTranscript("");
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item && item[0]) {
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
      }

      if (final) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + final.trim();
        setTranscript(finalTranscriptRef.current);
        setInterimTranscript("");
        optionsRef.current.onResult?.(finalTranscriptRef.current, true);
      } else if (interim) {
        setInterimTranscript(interim);
        const combined = (finalTranscriptRef.current ? finalTranscriptRef.current + " " : "") + interim;
        optionsRef.current.onResult?.(combined, false);
      }
    };

    rec.onerror = (event: any) => {
      console.warn("[VoiceRecognition] Error:", event.error);
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setPermissionDenied(true);
        setError("Microphone permission was denied. Please allow microphone access in browser.");
      } else if (event.error === "no-speech") {
        // No speech detected - not a critical failure
      } else {
        setError(`Microphone error: ${event.error}`);
      }
      setIsListening(false);
      optionsRef.current.onError?.(event.error);
    };

    rec.onend = () => {
      setIsListening(false);
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        // Trigger auto-submit when student stops speaking
        if (autoSubmitTimer.current) clearTimeout(autoSubmitTimer.current);
        autoSubmitTimer.current = setTimeout(() => {
          optionsRef.current.onFinalResult?.(finalText);
        }, 500);
      }
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {}
      if (autoSubmitTimer.current) clearTimeout(autoSubmitTimer.current);
    };
  }, [options.language]);

  const startListening = useCallback((lang?: "hi-IN" | "en-IN" | "en-US") => {
    setError(null);
    setPermissionDenied(false);
    setTranscript("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";

    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser. Please type your question.");
      return;
    }

    try {
      if (lang) {
        recognitionRef.current.lang = lang;
      }
      recognitionRef.current.start();
    } catch (err: any) {
      try {
        recognitionRef.current.abort();
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch {}
        }, 120);
      } catch {}
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    permissionDenied,
    isSupported,
    startListening,
    stopListening,
    setTranscript,
  };
}
