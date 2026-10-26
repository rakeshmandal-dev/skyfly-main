import { useEffect, useRef, useState } from "react";
import { AvatarStage } from "./AvatarStage";
import { useLiveVoice } from "@/hooks/use-live-voice";
import { supabase } from "@/integrations/supabase/client";
import { recordLearningSession } from "@/lib/learning-sessions";
import { toast } from "sonner";
export function LiveTeacher() {
  const [language, setLanguage] = useState<"Hindi" | "English">("English");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{role: string; text: string}[]>([]);
  const [outputMuted, setOutputMuted] = useState(false);
  const [recording, setRecording] = useState<Blob | null>(null);
  const [replaying, setReplaying] = useState(false);
  const replayRef = useRef<HTMLAudioElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const mouthLevel = useRef(0);
  const heard = useRef(false);
  const id = useRef("");
  const call = useLiveVoice({ language, getToken: async () => (await supabase.auth.getSession()).data.session?.access_token, onEvent(event) {
    if (event.type === "app.delegation.pending") setThinking(true);
    if (event.type === "app.delegation.result") setThinking(false);
    if (event.type === "session.input_transcript.delta" || event.type === "session.output_transcript.delta") {
      const role = event.type.includes("input") ? "You" : "AI teacher";
      const text = typeof event.delta === "string" ? event.delta : "";
      if (text.trim()) { heard.current = true; setTranscript(old => { const last = old.at(-1); return last?.role === role ? [...old.slice(0,-1), {role, text: last.text + text}] : [...old, {role, text}]; }); }
      if (role === "AI teacher") setThinking(false);
    }
    if (event.type === "app.closed") { setSpeaking(false); setThinking(false); if (heard.current && id.current) { void recordLearningSession("voice", id.current).catch(() => toast.error("Session could not be saved.")); id.current = ""; } }
  }});
  useEffect(() => {
    if (call.status !== "connected") return;
    const audio = call.audioRef.current;
    let ctx: AudioContext | undefined;
    let frame = 0;
    const timer = setInterval(() => {
      const stream = audio?.srcObject;
      if (!(stream instanceof MediaStream) || ctx) return;
      ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream); const analyser = ctx.createAnalyser(); analyser.fftSize = 256; source.connect(analyser);
      const bytes = new Uint8Array(analyser.fftSize);
      const update = () => { analyser.getByteTimeDomainData(bytes); const rms = Math.sqrt(bytes.reduce((sum,b) => sum + ((b-128)/128)**2,0)/bytes.length); mouthLevel.current = Math.min(1,rms * 7); setSpeaking(rms > .012); frame = requestAnimationFrame(update); }; update();
      if (typeof MediaRecorder !== "undefined") {
        try { const chunks: BlobPart[] = []; const r = new MediaRecorder(stream); recorder.current = r; r.ondataavailable = e => { if(e.data.size) chunks.push(e.data); }; r.onstop = () => { if(chunks.length) setRecording(new Blob(chunks, {type:r.mimeType})); }; r.start(); } catch { /* Replay remains unavailable when this browser cannot record audio. */ }
      }
    }, 200);
    return () => { clearInterval(timer); cancelAnimationFrame(frame); void ctx?.close(); if(recorder.current?.state === "recording") recorder.current.stop(); mouthLevel.current=0; };
  }, [call.status]);
  useEffect(() => { if(call.audioRef.current) call.audioRef.current.muted = outputMuted; }, [outputMuted, call.status]);
  useEffect(() => { if(!recording || !replayRef.current) return; const url=URL.createObjectURL(recording); replayRef.current.src=url; return () => URL.revokeObjectURL(url); }, [recording]);
  const active = ["connecting","connected","stopping"].includes(call.status);
  const state = replaying ? "Speaking" : call.status === "connecting" ? "Connecting" : speaking ? "Speaking" : thinking ? "Thinking" : call.status === "connected" ? "Listening" : "Ready";
  return <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Your AI virtual teacher</h2><p className="text-sm text-muted-foreground">A human-like teacher, clearly powered by AI. Speak naturally in Hindi or English.</p></div><select aria-label="Conversation language" className="rounded-lg border bg-background p-2" disabled={active} value={language} onChange={e=>setLanguage(e.target.value as "Hindi"|"English")}><option>English</option><option>Hindi</option></select></div>
    <div className="relative h-[370px] overflow-hidden rounded-xl"><AvatarStage speaking={speaking || replaying} thinking={thinking} listening={state === "Listening"} mouthLevel={mouthLevel}/><span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white" role="status">AI teacher · {state}</span><span className="absolute bottom-3 left-4 text-xs text-slate-300">CC0 human model · not a real person</span></div>
    <audio ref={call.audioRef} autoPlay playsInline />
    <audio ref={replayRef} onPlay={()=>setReplaying(true)} onEnded={()=>setReplaying(false)} onPause={()=>setReplaying(false)} />
    {call.error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{call.error}</p>}
    <div className="flex flex-wrap gap-2">
      <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-40" disabled={active} onClick={()=>{ heard.current=false; id.current=crypto.randomUUID(); setRecording(null); setTranscript([]); call.start(); }}>{language === "Hindi" ? "बातचीत शुरू करें" : "Start voice conversation"}</button>
      <button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={!active && !replaying} onClick={()=>{call.stop();replayRef.current?.pause();}}>Stop</button>
      <button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={call.status!=="connected"} onClick={()=>call.setMuted(!call.muted)}>{call.muted ? "Unmute microphone" : "Mute microphone"}</button>
      <button className="rounded-lg border px-3 py-2" onClick={()=>setOutputMuted(!outputMuted)}>{outputMuted ? "Unmute teacher" : "Mute teacher"}</button>
      <button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={!recording || active} onClick={()=>{ if(replayRef.current) {replayRef.current.currentTime=0;void replayRef.current.play().catch(()=>toast.error("Audio playback unavailable."));} }}>Replay conversation audio</button>
      {call.playbackBlocked && <button className="rounded-lg border px-3 py-2" onClick={call.resumePlayback}>Enable audio playback</button>}
    </div>
    <p className="text-xs text-muted-foreground">Requires internet and microphone permission. Replay audio stays on this device for this visit only. Use Low-Resource Learning for lightweight notes and device audio.</p>
    {transcript.length > 0 && <div className="max-h-64 space-y-3 overflow-auto rounded-xl bg-secondary/40 p-4" aria-label="Conversation transcript">{transcript.map((item,i)=><p key={i} className="text-sm"><strong>{item.role}: </strong>{item.text}</p>)}</div>}
  </section>;
}
