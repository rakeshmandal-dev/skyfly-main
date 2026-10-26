import { useCallback, useEffect, useRef, useState } from "react";
import { matchVoice, type VoiceMatch } from "@/lib/languages";

export type SpeechState = {
  speaking: boolean;
  paused: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  spokenText: string;
  /** How well the last spoken language matched an installed browser voice. */
  voiceMatch: (VoiceMatch & { code: string }) | null;
  speak: (text: string, lang: string, onEnd?: () => void) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

export function useSpeech(): SpeechState {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [spokenText, setSpokenText] = useState("");
  const [supported, setSupported] = useState(false);
  const [voiceMatch, setVoiceMatch] = useState<(VoiceMatch & { code: string }) | null>(null);
  const endRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, lang: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    endRef.current = onEnd;
    setSpokenText(text);

    // Long text is split so browsers don't cut the utterance short.
    const chunks =
      text.match(/[^.!?。！？\n]+[.!?。！？]*\s*/g)?.reduce<string[]>((acc, sentence) => {
        const last = acc[acc.length - 1];
        if (last && (last + sentence).length < 200) acc[acc.length - 1] = last + sentence;
        else acc.push(sentence);
        return acc;
      }, []) ?? [text];

    const match = matchVoice(synth.getVoices(), lang);
    setVoiceMatch({ ...match, code: lang });

    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk.trim());
      u.lang = match.quality === "exact" || match.quality === "language" ? lang : (match.voice?.lang ?? lang);
      if (match.voice) u.voice = match.voice;
      u.rate = 0.95;
      u.pitch = 1;
      if (i === 0)
        u.onstart = () => {
          setSpeaking(true);
          setPaused(false);
        };
      if (i === chunks.length - 1) {
        u.onend = () => {
          setSpeaking(false);
          setPaused(false);
          endRef.current?.();
        };
        u.onerror = () => {
          setSpeaking(false);
          setPaused(false);
        };
      }
      synth.speak(u);
    });
    setSpeaking(true);
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setPaused(false);
  }, []);

  const stop = useCallback(() => {
    endRef.current = undefined;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  return { speaking, paused, supported, voices, spokenText, voiceMatch, speak, pause, resume, stop };
}
