import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Send,
  Eye,
  Camera,
  Layers,
  HelpCircle,
  CheckCircle2,
  GraduationCap,
  Users,
  Hand,
  Mic,
  MicOff,
  UserCheck,
  AlertTriangle,
  Radio,
  ChevronDown,
  Loader2,
  RotateCcw,
  SkipForward,
  Box,
  ChevronRight,
  ChevronLeft,
  Volume1,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import type { CameraPreset, LessonTopic } from "./types";
import { useSpeech } from "@/lib/speech";
import { useClassroomRealtime } from "@/hooks/use-classroom-realtime";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import type { HologramSegment, ClassroomAIResponse } from "@/lib/classroom-ai.server";

const ClassroomScene = lazy(() =>
  import("./ClassroomScene").then((m) => ({ default: m.ClassroomScene }))
);

const SAMPLE_TOPICS: LessonTopic[] = [
  {
    id: "physics-newton",
    title: "Newton's 3 Laws of Motion",
    subject: "Physics · Mechanics",
    subtitle: "Inertia, Force & Momentum, Action-Reaction",
    boardHeading: "NEWTONIAN DYNAMICS & MOTION LAWS",
    boardFormulas: [
      "1st Law: ΣF = 0 ⟹ v = const (Inertia)",
      "2nd Law: F = dp/dt = m · a",
      "3rd Law: F_AB = - F_BA",
      "Kinematics: v² = u² + 2as",
    ],
    boardNotes: [
      "An object maintains constant velocity unless acted on by an external net force.",
      "Acceleration is directly proportional to net force and inversely to mass.",
      "Every action has an equal and opposite reaction acting on different bodies.",
    ],
    speechText:
      "Welcome to our 3D Classroom! Today we are mastering Newton's Laws of Motion. The first law defines inertia: without an unbalanced force, a moving body keeps moving forever. The second law quantifies force as mass times acceleration, F equals m a. And the third law proves all forces in the universe occur in equal and opposite pairs.",
    speechTextHindi:
      "नमस्ते और EduVault AI 3D क्लासरूम में आपका स्वागत है! आज हम न्यूटन के गति के नियमों को समझ रहे हैं। पहला नियम जड़त्व का है—बिना बाहरी बल के वस्तु अपनी गति बनाए रखती है। दूसरा नियम बल की गणना करता है: F बराबर m गुना a।",
    hologramSegments: [
      {
        step: 1,
        totalSteps: 3,
        spokenText:
          "Newton's first law of motion is the law of inertia. A body stays at rest or moves at constant velocity unless acted upon by an external net force.",
        heading: "1. Law of Inertia (1st Law)",
        keyPoints: [
          "Inertia resists changes in state of motion",
          "Without friction or drag, objects move forever",
        ],
        formula: "ΣF = 0  ⟹  dv/dt = 0",
        diagramType: "atom",
        diagramLabel: "Inertial Particle State",
        keywords: ["Inertia", "Newton's 1st Law"],
      },
      {
        step: 2,
        totalSteps: 3,
        spokenText:
          "The second law defines force mathematically: Force equals the rate of change of momentum, simplified to mass times acceleration.",
        heading: "2. Force & Acceleration (2nd Law)",
        keyPoints: [
          "Force is directly proportional to acceleration",
          "Greater mass requires greater force for same acceleration",
        ],
        formula: "F = m · a = dp / dt",
        diagramType: "force_vectors",
        diagramLabel: "Vector Acceleration Dynamic",
        keywords: ["Vector Dynamics", "Momentum"],
      },
      {
        step: 3,
        totalSteps: 3,
        spokenText:
          "The third law states that for every action force, there is an equal and opposite reaction force acting on mutually distinct bodies.",
        heading: "3. Action-Reaction Pairs (3rd Law)",
        keyPoints: [
          "Forces always occur in matched dual pairs",
          "Action and reaction never cancel out because they act on different objects",
        ],
        formula: "F_AB = - F_BA",
        diagramType: "cube",
        diagramLabel: "Dual Force Interaction",
        keywords: ["Action-Reaction", "Paired Forces"],
      },
    ],
  },
  {
    id: "relativity-einstein",
    title: "Einstein's Theory & E = mc²",
    subject: "Modern Physics",
    subtitle: "Mass-Energy Equivalence & Space-Time",
    boardHeading: "SPECIAL RELATIVITY & ENERGY EQUIVALENCE",
    boardFormulas: [
      "E₀ = m · c²",
      "Relativistic Energy: E = γ m c²",
      "Lorentz Factor: γ = 1 / √(1 - v²/c²)",
      "Speed of Light: c ≈ 3.0 × 10⁸ m/s",
    ],
    boardNotes: [
      "Mass and energy are interchangeable manifestations of the exact same physical entity.",
      "A tiny amount of mass converts into a colossal quantity of energetic output.",
      "The speed of light c is the universal speed limit across all inertial frames.",
    ],
    speechText:
      "Look at the equation on the blackboard: E equals m c squared. Albert Einstein showed us that mass and energy are two sides of the exact same coin. Because the speed of light c squared is astronomical, even one gram of matter holds roughly 90 trillion Joules of pure energy!",
    hologramSegments: [
      {
        step: 1,
        totalSteps: 3,
        spokenText:
          "Albert Einstein discovered that mass is not independent of energy; they are two manifestations of the same physical entity.",
        heading: "1. Mass-Energy Equivalence",
        keyPoints: [
          "Rest energy E equals mass times light speed squared",
          "1 gram of matter holds 90 trillion Joules of energy",
        ],
        formula: "E_0 = m · c²",
        diagramType: "atom",
        diagramLabel: "Atomic Energy Conversion",
        keywords: ["Mass-Energy", "Relativity"],
      },
      {
        step: 2,
        totalSteps: 3,
        spokenText:
          "As an object approaches the cosmic speed limit of light, relativistic effects cause time dilation and dynamic mass increases.",
        heading: "2. Lorentz Transformations",
        keyPoints: [
          "Universal speed of light c is constant across all frames",
          "Time slows down for high-velocity observers",
        ],
        formula: "γ = 1 / √(1 - v²/c²)",
        diagramType: "cube",
        diagramLabel: "Spacetime Lorentz Invariance",
        keywords: ["Time Dilation", "Light Constant"],
      },
      {
        step: 3,
        totalSteps: 3,
        spokenText:
          "This principle powers our entire universe, from stellar solar fusion in stars to modern nuclear energy and GPS satellite time synchronization.",
        heading: "3. Cosmic Applications & Fusion",
        keyPoints: [
          "Powers thermonuclear fusion in the Sun",
          "Essential for high-precision satellite orbital navigation",
        ],
        formula: "ΔE = Δm · c²",
        diagramType: "solar_system",
        diagramLabel: "Solar Fusion Core",
        keywords: ["Thermonuclear", "Solar Core"],
      },
    ],
  },
  {
    id: "biology-dna",
    title: "DNA Double Helix & Genetics",
    subject: "Biology · Genetics",
    subtitle: "Nucleotide Base Pairing & Central Dogma",
    boardHeading: "MOLECULAR GENETICS & DNA ARCHITECTURE",
    boardFormulas: [
      "Base Pairing: Adenine (A) ═ Thymine (T)",
      "Base Pairing: Guanine (G) ≡ Cytosine (C)",
      "Central Dogma: DNA ➔ RNA ➔ Protein",
      "Helix Pitch: 3.4 nm / 10 base pairs per turn",
    ],
    boardNotes: [
      "Discovered by Watson and Crick, DNA forms an antiparallel double-stranded helical polymer.",
      "Hydrogen bonds stabilize purine-pyrimidine base pairs within the core.",
      "Transcription and translation convert genetic code into life-sustaining proteins.",
    ],
    speechText:
      "Welcome to Molecular Genetics! On our chalkboard, notice the complementary base pairs. Adenine bonds exclusively with Thymine through two hydrogen bonds, while Guanine pairs with Cytosine via three bonds. This simple elegance carries the entire blueprint of human life.",
    hologramSegments: [
      {
        step: 1,
        totalSteps: 3,
        spokenText:
          "DNA is the hereditary blueprint of life, structured as an antiparallel double helix made of sugar-phosphate backbones.",
        heading: "1. Double Helix Structure",
        keyPoints: [
          "Discovered by Watson and Crick (1953)",
          "Antiparallel 5' to 3' complementary strands",
        ],
        formula: "Pitch = 3.4 nm (10 bp/turn)",
        diagramType: "dna",
        diagramLabel: "Double Helix Polymer",
        keywords: ["Double Helix", "Nucleotides"],
      },
      {
        step: 2,
        totalSteps: 3,
        spokenText:
          "Complementary nitrogenous base pairing rules ensure genetic fidelity: Adenine pairs with Thymine, while Guanine pairs with Cytosine.",
        heading: "2. Complementary Base Pairing",
        keyPoints: [
          "A and T linked by 2 hydrogen bonds",
          "G and C linked by 3 strong hydrogen bonds",
        ],
        formula: "A ═ T  |  G ≡ C",
        diagramType: "dna",
        diagramLabel: "Hydrogen Bonded Rungs",
        keywords: ["Base Pairs", "Hydrogen Bonds"],
      },
      {
        step: 3,
        totalSteps: 3,
        spokenText:
          "The central dogma explains how DNA is transcribed into messenger RNA and then translated into functional proteins.",
        heading: "3. Central Dogma of Molecular Biology",
        keyPoints: [
          "Transcription: DNA to mRNA in nucleus",
          "Translation: mRNA to Protein via ribosomes",
        ],
        formula: "DNA  ➔  RNA  ➔  Protein",
        diagramType: "atom",
        diagramLabel: "Ribosomal Protein Synthesis",
        keywords: ["Central Dogma", "Translation"],
      },
    ],
  },
  {
    id: "cs-neural-networks",
    title: "Neural Networks & Artificial Intelligence",
    subject: "Computer Science · AI",
    subtitle: "Perceptrons, Backpropagation & Deep Learning",
    boardHeading: "DEEP LEARNING ARCHITECTURES & GRADIENTS",
    boardFormulas: [
      "Forward Pass: y = σ( W · x + b )",
      "Loss Function: L = - Σ [ y log(ŷ) ]",
      "Gradient Descent: W ← W - η ∇L_W",
      "Backpropagation: ∂L/∂w = ∂L/∂y · ∂y/∂z · ∂z/∂w",
    ],
    boardNotes: [
      "Artificial neurons simulate biological synaptic activation through weighted linear sums.",
      "Non-linear activation functions (ReLU, GELU, Sigmoid) enable universal approximation.",
      "Backpropagation applies the calculus chain rule to optimize multi-million parameter models.",
    ],
    speechText:
      "Artificial Intelligence starts with the mathematical neuron on the board. Each input is scaled by a weight, summed with a bias, and transformed by an activation function. Gradient descent iteratively refines these weights to teach the computer how to perceive and solve complex problems.",
    hologramSegments: [
      {
        step: 1,
        totalSteps: 3,
        spokenText:
          "Artificial Neural Networks are computational graphs inspired by the human brain. Each neuron computes a weighted sum with non-linear activation.",
        heading: "1. Perceptron Mathematical Model",
        keyPoints: [
          "Inputs scaled by synaptic weights W",
          "Transformed by non-linear activations (ReLU, GELU)",
        ],
        formula: "y = σ( W · x + b )",
        diagramType: "neural",
        diagramLabel: "Perceptron Graph Flow",
        keywords: ["Perceptron", "Synapses"],
      },
      {
        step: 2,
        totalSteps: 3,
        spokenText:
          "During training, the loss function measures error, and backpropagation calculates gradients using the calculus chain rule.",
        heading: "2. Backpropagation & Optimization",
        keyPoints: [
          "Loss evaluates prediction discrepancy",
          "Gradient descent adjusts multi-million weights",
        ],
        formula: "W ← W - η ∇L_W",
        diagramType: "cube",
        diagramLabel: "Loss Optimization Surface",
        keywords: ["Gradient Descent", "Loss Surface"],
      },
      {
        step: 3,
        totalSteps: 3,
        spokenText:
          "Modern Large Language Models and Vision Transformers use self-attention to process entire books and codebases in parallel.",
        heading: "3. Attention Mechanisms & Transformers",
        keyPoints: [
          "Query, Key, and Value vector projections",
          "Powers ChatGPT, Gemini, and Autonomous AI",
        ],
        formula: "Attention(Q,K,V) = softmax(QK^T / √d_k) V",
        diagramType: "neural",
        diagramLabel: "Self-Attention Topology",
        keywords: ["Transformers", "Self-Attention"],
      },
    ],
  },
  {
    id: "math-calculus",
    title: "Differential Calculus & Rate of Change",
    subject: "Mathematics · Calculus",
    subtitle: "Limits, Tangents & Derivatives",
    boardHeading: "DIFFERENTIAL CALCULUS & FUNDAMENTAL THEOREM",
    boardFormulas: [
      "Derivative: f'(x) = lim_{h→0} [f(x+h) - f(x)] / h",
      "Power Rule: d/dx [xⁿ] = n · xⁿ⁻¹",
      "Product Rule: (u·v)' = u'v + uv'",
      "Chain Rule: d/dx [f(g(x))] = f'(g(x)) · g'(x)",
    ],
    boardNotes: [
      "Calculus provides the mathematical language of continuous change and motion.",
      "The first derivative represents the instantaneous slope of a tangent line.",
      "Used across physics, economics, medicine, and engineering to optimize real-world systems.",
    ],
    speechText:
      "Calculus is the mathematical foundation of modern science. On the blackboard, we have the first principles limit definition. By shrinking delta h towards zero, we discover instantaneous rates of change—from planetary orbits to rocket propulsion velocities.",
    hologramSegments: [
      {
        step: 1,
        totalSteps: 3,
        spokenText:
          "Calculus is the mathematics of change. The derivative represents the instantaneous rate of change and the exact slope of the tangent line.",
        heading: "1. First Principles & Limits",
        keyPoints: [
          "Instantaneous rate of change as Δx approaches 0",
          "Slope of curve at any infinitesimally small point",
        ],
        formula: "f'(x) = lim_{h→0} [f(x+h) - f(x)] / h",
        diagramType: "wave",
        diagramLabel: "Secant to Tangent Limit",
        keywords: ["Limits", "Instantaneous Rate"],
      },
      {
        step: 2,
        totalSteps: 3,
        spokenText:
          "Core differentiation rules like the power rule, product rule, and chain rule allow us to differentiate complex multi-variable functions.",
        heading: "2. Core Differentiation Rules",
        keyPoints: [
          "Power Rule: d/dx [x^n] = n * x^(n-1)",
          "Chain Rule enables nested function derivations",
        ],
        formula: "d/dx [f(g(x))] = f'(g(x)) · g'(x)",
        diagramType: "cube",
        diagramLabel: "Chain Rule Differentiation",
        keywords: ["Derivatives", "Chain Rule"],
      },
      {
        step: 3,
        totalSteps: 3,
        spokenText:
          "The Fundamental Theorem of Calculus bridges differentiation and integration, allowing us to compute areas, volumes, and planetary trajectories.",
        heading: "3. Fundamental Theorem of Calculus",
        keyPoints: [
          "Differentiation and Integration are inverse operations",
          "Calculates exact areas under arbitrary curves",
        ],
        formula: "∫_a^b f(x) dx = F(b) - F(a)",
        diagramType: "atom",
        diagramLabel: "Integral Riemann Sum",
        keywords: ["Integration", "Fundamental Theorem"],
      },
    ],
  },
];

const QUICK_DOUBTS = [
  "Explain in simple Hindi",
  "How does gravity warp spacetime?",
  "What is quantum superposition?",
  "How does backpropagation work in AI?",
  "Give JEE / NEET exam example",
];

const PRESETS_LIST: { id: CameraPreset; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "🌐" },
  { id: "teacher", label: "Teacher", icon: "👩‍🏫" },
  { id: "blackboard", label: "Blackboard", icon: "📋" },
  { id: "front_seat", label: "Front Row", icon: "🪑" },
  { id: "back_seat", label: "Back Row", icon: "🎒" },
  { id: "podium", label: "Podium POV", icon: "👨‍🏫" },
];

export function ClassroomStage({
  className = "",
  roomId = "default-classroom",
}: {
  className?: string;
  roomId?: string;
}) {
  const [currentTopic, setCurrentTopic] = useState<LessonTopic>(SAMPLE_TOPICS[0]!);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("overview");
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("AI Virtual Teacher · Online & Ready");
  const [customQuestion, setCustomQuestion] = useState("");
  const [lastAskedQuestion, setLastAskedQuestion] = useState<string | null>(null);
  const [hasQuestionError, setHasQuestionError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [nodAt, setNodAt] = useState(0);
  const [showRoster, setShowRoster] = useState(false);
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("en-IN");
  const [micBannerError, setMicBannerError] = useState<string | null>(null);

  const stageContainerRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech();

  // Supabase Realtime Multi-User Hook with Live Topic Broadcast Listener
  const {
    participants,
    currentUserId,
    mySeat,
    isHandRaised,
    isFull,
    handRaiseQueue,
    joinSeat,
    toggleRaiseHand,
    selectStudentToSpeak,
    broadcastTopic,
  } = useClassroomRealtime(roomId, (remoteTopic, remoteStep) => {
    setCurrentTopic(remoteTopic);
    setCurrentSegmentIndex(remoteStep);
    if (remoteTopic.hologramSegments && remoteTopic.hologramSegments.length > 0) {
      playSegment(
        remoteStep,
        remoteTopic.hologramSegments,
        remoteTopic.speechTextHindi ? "hi" : "en"
      );
    }
  });

  // Active Hologram Segment calculation
  const segments = currentTopic.hologramSegments || [];
  const activeSegment = segments[currentSegmentIndex] || null;

  // Speak a specific Hologram Segment out loud
  const playSegment = useCallback(
    (segIndex: number, segList: HologramSegment[] = segments, lang: "en" | "hi" = "en") => {
      const targetSeg = segList[segIndex];
      if (!targetSeg) {
        setSpeaking(false);
        setNodAt(Date.now());
        setStatusMessage("Lecture completed.");
        return;
      }

      const segHeading = targetSeg.title || targetSeg.heading || "Key Concept";
      const segSpeech = targetSeg.speech || targetSeg.spokenText || "";
      const segKeyPoints = targetSeg.keyPoints || (targetSeg.elements?.flatMap((e) => e.steps || e.keywords || []) ?? ["Key takeaway"]);

      setCurrentSegmentIndex(segIndex);
      setSpeaking(true);
      setStatusMessage(`Step ${targetSeg.step}/${targetSeg.totalSteps}: ${segHeading}`);

      // Update blackboard with active segment details
      setCurrentTopic((prev) => ({
        ...prev,
        boardHeading: segHeading.toUpperCase(),
        boardFormulas: targetSeg.formula
          ? [targetSeg.formula, ...(prev.boardFormulas.slice(0, 2))]
          : prev.boardFormulas,
        boardNotes: segKeyPoints,
      }));

      // Speak in Hindi if query/segment is Hindi, else English
      const speechLangCode =
        lang === "hi" || voiceLang === "hi-IN" || /[\u0900-\u097F]/.test(segSpeech)
          ? "hi-IN"
          : "en-IN";

      if (!audioMuted && speech.supported && segSpeech) {
        speech.speak(segSpeech, speechLangCode, () => {
          if (segIndex + 1 < segList.length) {
            setTimeout(() => {
              playSegment(segIndex + 1, segList, lang);
            }, 800);
          } else {
            setSpeaking(false);
            setNodAt(Date.now());
            setStatusMessage("AI Virtual Teacher · Online & Ready");
          }
        });
      } else {
        setTimeout(() => {
          if (segIndex + 1 < segList.length) {
            playSegment(segIndex + 1, segList, lang);
          } else {
            setSpeaking(false);
            setNodAt(Date.now());
            setStatusMessage("AI Virtual Teacher · Online & Ready");
          }
        }, 5500);
      }
    },
    [segments, audioMuted, speech, voiceLang]
  );

  // Handle student question / doubt using Server-Side AI API Route
  const handleAskDoubt = async (questionText: string) => {
    const q = questionText.trim();
    if (!q) return;

    speech.stop();
    voiceRec.stopListening();
    setSpeaking(false);
    setThinking(true);
    setHasQuestionError(false);
    setLastAskedQuestion(q);
    setStatusMessage(`Teacher soch rahi hai: "${q}"…`);
    setCustomQuestion("");
    setMicBannerError(null);

    if (isHandRaised) {
      void toggleRaiseHand();
    }

    try {
      const isHindiQuery =
        voiceLang === "hi-IN" || q.includes("hindi") || /[\u0900-\u097F]/.test(q);

      const res = await fetch("/api/classroom-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          language: isHindiQuery ? "hi" : "en",
          clientId: currentUserId,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI Gateway responded with status ${res.status}`);
      }

      const aiData = (await res.json()) as ClassroomAIResponse;

      setThinking(false);

      if (aiData.segments && aiData.segments.length > 0) {
        const newTopic: LessonTopic = {
          id: "custom-ai-" + Date.now(),
          title: aiData.topicTitle || q,
          subject: aiData.subject || "Academic Discussion",
          subtitle: `AI Live Solution: "${q}"`,
          boardHeading: (aiData.segments[0]?.heading || aiData.topicTitle).toUpperCase(),
          boardFormulas: aiData.segments[0]?.formula
            ? [aiData.segments[0].formula, ...(aiData.segments[1]?.formula ? [aiData.segments[1].formula] : ["ΔE = h · ν"])]
            : ["Universal Principles", "Derived via AI Engine"],
          boardNotes: aiData.segments[0]?.keyPoints || ["Structured derivation step 1"],
          speechText: aiData.segments.map((s) => s.spokenText).join(" "),
          speechTextHindi: aiData.language === "hi" ? aiData.segments.map((s) => s.spokenText).join(" ") : undefined,
          hologramSegments: aiData.segments,
          followUpQuestions: aiData.followUpQuestions,
          disclaimer: aiData.disclaimer,
          isSafetyWarning: aiData.isSafetyWarning,
        };

        setCurrentTopic(newTopic);
        setCurrentSegmentIndex(0);
        broadcastTopic(newTopic, 0);
        playSegment(0, aiData.segments, aiData.language);
      }
    } catch (err: any) {
      console.warn("[ClassroomStage] Server AI error, using fallback:", err);
      setThinking(false);
      setHasQuestionError(true);
      setStatusMessage(`Teacher answering: "${q}"`);
      if (!audioMuted && speech.supported) {
        const isHindi = voiceLang === "hi-IN" || /[\u0900-\u097F]/.test(q);
        speech.speak(
          isHindi
            ? `यह ${q} के बारे में एक महत्वपूर्ण प्रश्न है। आइए ब्लैकबोर्ड पर दिए गए मूल सिद्धांतों को समझते हैं।`
            : `That is an insightful question about ${q}. Let us analyze the foundational concepts on the blackboard.`,
          isHindi ? "hi-IN" : "en-IN",
          () => {
            setSpeaking(false);
            setNodAt(Date.now());
          }
        );
      }
    }
  };

  // Browser Speech Recognition Hook for live voice questions
  const voiceRec = useVoiceRecognition({
    language: voiceLang,
    onResult: (transcriptText) => {
      setCustomQuestion(transcriptText);
    },
    onFinalResult: (finalText) => {
      if (finalText.trim() && !speaking && !thinking) {
        void handleAskDoubt(finalText);
      }
    },
    onError: (errMsg) => {
      if (errMsg === "not-allowed" || errMsg === "permission-denied") {
        setMicBannerError(
          "Microphone permission was denied. Please allow microphone access in browser or type below."
        );
      }
    },
  });

  // Automatically ensure microphone is OFF when teacher speaks (prevents feedback loop)
  useEffect(() => {
    if (speaking && voiceRec.isListening) {
      voiceRec.stopListening();
    }
  }, [speaking, voiceRec]);

  // Auto join a seat on first load if not seated yet
  useEffect(() => {
    if (mySeat === null && !isFull) {
      void joinSeat(14); // Default to Seat 15 (center aisle front-mid)
    }
  }, [mySeat, isFull, joinSeat]);

  // Handle topic switch from bottom curriculum selector
  const handleSelectTopic = (topic: LessonTopic) => {
    setCurrentTopic(topic);
    setCurrentSegmentIndex(0);
    speech.stop();
    setSpeaking(false);
    setThinking(false);
    setStatusMessage(`Topic: ${topic.title}`);
  };

  // Start / Pause Full 3D Lecture
  const handleStartLecture = useCallback(() => {
    if (speaking) {
      speech.stop();
      setSpeaking(false);
      setStatusMessage("Lecture paused.");
      return;
    }

    setThinking(true);
    setStatusMessage("Teacher is preparing 3D presentation…");

    setTimeout(() => {
      setThinking(false);
      const segs = currentTopic.hologramSegments || [];
      playSegment(0, segs, voiceLang === "hi-IN" ? "hi" : "en");
    }, 500);
  }, [currentTopic, speaking, playSegment, voiceLang, speech]);

  // Toggle voice recording (Microphone)
  const toggleVoiceMic = () => {
    if (speaking) {
      speech.stop();
      setSpeaking(false);
    }

    if (voiceRec.isListening) {
      voiceRec.stopListening();
      if (customQuestion.trim()) {
        void handleAskDoubt(customQuestion);
      }
    } else {
      setMicBannerError(null);
      voiceRec.startListening(voiceLang);
      setStatusMessage(
        voiceLang === "hi-IN"
          ? "Sun rahi hoon... Apna sawaal boliye (हिंदी)"
          : "Listening... Speak your question now (English)"
      );
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!stageContainerRef.current) return;
    if (!document.fullscreenElement) {
      stageContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const currentPresetInfo = PRESETS_LIST.find((p) => p.id === cameraPreset) || PRESETS_LIST[0]!;

  return (
    <div
      ref={stageContainerRef}
      className={`relative flex flex-col rounded-3xl border border-white/20 bg-slate-950/95 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none h-screen w-screen" : className
      }`}
    >
      {/* 1. Classroom Top Bar: Minimal, Clean, Essential Controls Only */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3.5 sm:px-5 py-2.5 bg-black/60 backdrop-blur-md z-20">
        {/* Left: Live Status & Seat Count */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex h-3 w-3 flex-shrink-0">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${
                speaking
                  ? "bg-rose-400 animate-ping"
                  : thinking
                  ? "bg-amber-400 animate-pulse"
                  : "bg-emerald-400 animate-pulse"
              } opacity-75`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                speaking ? "bg-rose-500" : thinking ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide truncate">
                3D AI CLASSROOM
              </span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] font-mono border flex items-center gap-1 ${
                  isFull
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                }`}
              >
                <Radio className="h-2.5 w-2.5 text-cyan-400 animate-pulse" />
                <span>{participants.length}/40</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-300 truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              {thinking ? (
                <span className="text-amber-300 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Teacher soch rahi hai...
                </span>
              ) : voiceRec.isListening ? (
                <span className="text-rose-300 flex items-center gap-1 animate-pulse">
                  <Mic className="h-3 w-3" /> Sun rahi hoon... (बोलिए)
                </span>
              ) : (
                statusMessage
              )}
            </span>
          </div>
        </div>

        {/* Right: Essential Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center rounded-lg bg-white/10 p-0.5 border border-white/10 text-[11px]">
            <button
              onClick={() => {
                setVoiceLang("en-IN");
                if (voiceRec.isListening) {
                  voiceRec.startListening("en-IN");
                }
              }}
              className={`px-2 py-0.5 rounded font-medium transition ${
                voiceLang === "en-IN"
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setVoiceLang("hi-IN");
                if (voiceRec.isListening) {
                  voiceRec.startListening("hi-IN");
                }
              }}
              className={`px-2 py-0.5 rounded font-medium transition ${
                voiceLang === "hi-IN"
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Raise Hand Button */}
          <button
            onClick={() => void toggleRaiseHand()}
            className={`flex items-center gap-1 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all shadow-md ${
              isHandRaised
                ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/30 animate-pulse"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
            }`}
            title="Raise Hand to Ask Doubt"
          >
            <Hand className={`h-3.5 w-3.5 ${isHandRaised ? "fill-slate-950" : ""}`} />
            <span className="hidden sm:inline">{isHandRaised ? "Hand Raised" : "Raise Hand"}</span>
          </button>

          {/* Seat Picker Button */}
          <button
            onClick={() => {
              setShowSeatPicker(!showSeatPicker);
              setShowRoster(false);
              setShowPresetDropdown(false);
            }}
            className="flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-white border border-white/10 transition"
            title="Select Desk Seat"
          >
            <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline">{mySeat !== null ? `Seat #${mySeat + 1}` : "Seat"}</span>
            <ChevronDown className="h-3 w-3 text-white/60" />
          </button>

          {/* Queue Drawer Button */}
          <button
            onClick={() => {
              setShowRoster(!showRoster);
              setShowSeatPicker(false);
              setShowPresetDropdown(false);
            }}
            className={`relative flex items-center gap-1 rounded-xl px-2 sm:px-2.5 py-1.5 text-xs font-medium border transition ${
              handRaiseQueue.length > 0
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-white/10 text-white hover:bg-white/20 border-white/10"
            }`}
            title="View Student Queue"
          >
            <Users className="h-3.5 w-3.5" />
            {handRaiseQueue.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
                {handRaiseQueue.length}
              </span>
            )}
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              setAudioMuted(!audioMuted);
              if (!audioMuted) speech.stop();
            }}
            className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition border border-white/10"
            title={audioMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {audioMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-rose-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition border border-white/10"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Mic Permission Banner / Unsupported Browser Message */}
      {micBannerError && (
        <div className="bg-rose-500/20 border-b border-rose-500/40 px-4 py-2 text-xs text-rose-200 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{micBannerError}</span>
          </div>
          <button
            onClick={() => setMicBannerError(null)}
            className="text-xs text-rose-300 hover:text-white underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. 3D WebGL Canvas Viewport (Full Width, Maximized Space) */}
      <div className="relative flex-1 min-h-[460px] sm:min-h-[580px] w-full bg-[#0c121e] overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full w-full flex-col items-center justify-center bg-[#0c121e] text-slate-400 gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <div className="text-xs font-mono">Rendering Multi-User 3D Classroom...</div>
            </div>
          }
        >
          <ClassroomScene
            currentTopic={currentTopic}
            speaking={speaking}
            thinking={thinking}
            cameraPreset={cameraPreset}
            selectedDesk={mySeat}
            onDeskSelect={(deskIdx) => {
              void joinSeat(deskIdx);
              setCameraPreset("free");
              setStatusMessage(`Moved to Desk #${deskIdx + 1}. Full 360° view active!`);
            }}
            nodAt={nodAt}
            participants={participants}
            myUserId={currentUserId}
            mySeat={mySeat}
            activeHologramSegment={activeSegment}
            showHologram={true}
            onNextHologramStep={() => {
              if (currentSegmentIndex + 1 < segments.length) {
                speech.stop();
                playSegment(currentSegmentIndex + 1, segments);
              }
            }}
            onPrevHologramStep={() => {
              if (currentSegmentIndex > 0) {
                speech.stop();
                playSegment(currentSegmentIndex - 1, segments);
              }
            }}
            onReplayHologramStep={() => {
              speech.stop();
              playSegment(currentSegmentIndex, segments);
            }}
            onToggleHologramSpeech={() => {
              if (speaking) {
                speech.stop();
                setSpeaking(false);
              } else {
                playSegment(currentSegmentIndex, segments);
              }
            }}
          />
        </Suspense>

        {/* Top Left: Sleek Collapsible Camera Viewpoint Menu */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
          <div className="relative">
            <button
              onClick={() => {
                setShowPresetDropdown(!showPresetDropdown);
                setShowSeatPicker(false);
                setShowRoster(false);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-black/70 hover:bg-black/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl border border-white/20 shadow-xl transition-all"
            >
              <Camera className="h-3.5 w-3.5 text-cyan-400" />
              <span>{currentPresetInfo.icon} {currentPresetInfo.label}</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showPresetDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Popover */}
            {showPresetDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 rounded-2xl bg-slate-950/95 p-2 text-white shadow-2xl border border-white/20 backdrop-blur-2xl grid grid-cols-1 gap-1 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1">
                  Camera Viewpoints
                </div>
                {PRESETS_LIST.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setCameraPreset(preset.id);
                      setShowPresetDropdown(false);
                      setStatusMessage(`Camera moved to ${preset.label} view`);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      cameraPreset === preset.id
                        ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                        : "hover:bg-white/10 text-slate-200"
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Live Speech Recognition Transcript Indicator */}
        {voiceRec.isListening && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md rounded-2xl bg-rose-950/90 border border-rose-500/60 p-3.5 text-white shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-rose-300">
              <span className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Sun rahi hoon... ({voiceLang === "hi-IN" ? "हिंदी" : "English"})</span>
              </span>
              <span className="text-[10px] font-mono text-rose-400">Bolna band karte hi answer aayega</span>
            </div>
            <div className="text-sm font-medium text-white italic min-h-[24px]">
              {customQuestion || "Boliye apna sawaal..."}
            </div>
          </div>
        )}

        {/* Question Conversation Status Indicator */}
        {lastAskedQuestion && !voiceRec.isListening && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-md rounded-xl bg-slate-950/80 border border-white/15 px-3 py-1.5 text-xs text-white shadow-xl backdrop-blur-md flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <MessageSquare className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
              <span className="text-slate-400">Sawaal:</span>
              <span className="font-semibold text-cyan-200 truncate">{lastAskedQuestion}</span>
            </div>
            {hasQuestionError && (
              <button
                onClick={() => void handleAskDoubt(lastAskedQuestion)}
                className="flex items-center gap-1 rounded bg-rose-500/30 hover:bg-rose-500/50 px-2 py-0.5 text-[10px] text-rose-200 font-bold transition flex-shrink-0"
              >
                <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Retry
              </button>
            )}
          </div>
        )}

        {/* Floating Bottom Center Unified Control Dock (Start Lecture, Mic, and Step Controls) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[92%] sm:w-auto max-w-2xl flex flex-col items-center gap-2">
          {/* Main Control Pill Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-slate-950/85 p-2 backdrop-blur-2xl border border-white/20 shadow-2xl w-full sm:w-auto">
            {/* Start / Pause 3D Lecture Button */}
            <button
              onClick={handleStartLecture}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xl transition-all duration-200 ${
                speaking
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/40 animate-pulse"
                  : "bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 hover:opacity-95 shadow-cyan-500/30 hover:scale-[1.02]"
              }`}
            >
              {speaking ? (
                <>
                  <Pause className="h-4 w-4" /> Pause Lecture
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" /> Start 3D Lecture
                </>
              )}
            </button>

            {/* Quick Mic Voice Ask Button (Prominent & Clear) */}
            <button
              onClick={toggleVoiceMic}
              disabled={thinking}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all shadow-lg ${
                voiceRec.isListening
                  ? "bg-rose-500 text-white ring-4 ring-rose-400/50 animate-pulse"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:scale-105"
              }`}
              title={
                voiceRec.isListening
                  ? "Sun rahi hoon... Click to send immediately"
                  : `Voice se sawaal poochein (${voiceLang === "hi-IN" ? "हिंदी" : "English"})`
              }
            >
              {voiceRec.isListening ? (
                <>
                  <MicOff className="h-4 w-4 animate-bounce" />
                  <span>Sun Rahi Hoon...</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Ask by Voice</span>
                </>
              )}
            </button>

            {/* Hologram Step Derivation Controls in Bottom Dock */}
            {segments.length > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5 pl-2 border-l border-white/15 text-xs text-white">
                <div className="flex items-center gap-1 px-1">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  <span className="font-mono text-[10px] sm:text-[11px] text-cyan-300 font-bold whitespace-nowrap">
                    Scene {currentSegmentIndex + 1}/{segments.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (currentSegmentIndex > 0) {
                      speech.stop();
                      playSegment(currentSegmentIndex - 1, segments);
                    }
                  }}
                  disabled={currentSegmentIndex <= 0}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition"
                  title="Previous Step"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => {
                    speech.stop();
                    playSegment(currentSegmentIndex, segments);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
                  title="Replay Spoken Scene"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                </button>

                <button
                  onClick={() => {
                    if (speaking) {
                      speech.stop();
                      setSpeaking(false);
                    } else {
                      playSegment(currentSegmentIndex, segments);
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 px-2 py-1 text-[11px] font-semibold text-cyan-300 border border-cyan-400/30 transition"
                  title={speaking ? "Pause Voice" : "Listen to Scene"}
                >
                  {speaking ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span className="hidden sm:inline">{speaking ? "Pause" : "Listen"}</span>
                </button>

                <button
                  onClick={() => {
                    if (currentSegmentIndex + 1 < segments.length) {
                      speech.stop();
                      playSegment(currentSegmentIndex + 1, segments);
                    }
                  }}
                  disabled={currentSegmentIndex >= segments.length - 1}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-semibold disabled:opacity-30 text-xs transition"
                  title="Next Step"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hand Raise Live Queue Drawer */}
        {showRoster && (
          <div className="absolute top-14 right-3 sm:right-4 z-30 w-72 sm:w-80 max-h-[400px] rounded-2xl bg-slate-950/95 p-4 text-white shadow-2xl border border-white/20 backdrop-blur-2xl flex flex-col gap-3 overflow-hidden animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Classroom Roster
                </span>
              </div>
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                {participants.length} / 40
              </span>
            </div>

            {/* Hand-Raise Queue Section */}
            <div>
              <div className="text-[11px] font-mono text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Hand className="h-3 w-3" /> Question Queue ({handRaiseQueue.length})
              </div>
              {handRaiseQueue.length === 0 ? (
                <div className="rounded-xl bg-white/5 p-2 text-center text-xs text-slate-400">
                  No hands raised. Click "Raise Hand" to join queue.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {handRaiseQueue.map((p, idx) => (
                    <div
                      key={p.userId}
                      className="flex items-center justify-between gap-2 rounded-xl bg-amber-500/15 p-2 border border-amber-500/30 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-amber-400 font-bold">
                          #{idx + 1}
                        </span>
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.avatarColor }}
                        />
                        <span className="font-semibold truncate">
                          {p.displayName} (Seat {p.seatNumber + 1})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          void selectStudentToSpeak(p.userId);
                          setStatusMessage(`Teacher invited ${p.displayName} to speak!`);
                        }}
                        className="rounded-lg bg-amber-500 hover:bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-950 transition flex-shrink-0"
                      >
                        Call On
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Active Seated Students List */}
            <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-white/10">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Seated Students ({participants.length})
              </div>
              <div className="space-y-1 flex-1 overflow-y-auto pr-1 max-h-36">
                {participants.map((p) => {
                  const isMe = p.userId === currentUserId;
                  return (
                    <div
                      key={p.userId}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1 text-xs ${
                        isMe ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30" : "bg-white/5 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.avatarColor }}
                        />
                        <span className="truncate">
                          {p.displayName} {isMe && "(You)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        {p.isHandRaised && <Hand className="h-3 w-3 text-amber-400" />}
                        <span>Seat #{p.seatNumber + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Seat Picker Grid Modal */}
        {showSeatPicker && (
          <div className="absolute top-14 right-3 sm:right-20 z-30 w-72 sm:w-80 rounded-2xl bg-slate-950/95 p-4 text-white shadow-2xl border border-white/20 backdrop-blur-2xl animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">
                Select Desk (1 - 40)
              </span>
              <button
                onClick={() => setShowSeatPicker(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {Array.from({ length: 40 }).map((_, i) => {
                const occupiedBy = participants.find((p) => p.seatNumber === i);
                const isMyCurrent = mySeat === i;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!occupiedBy || isMyCurrent) {
                        void joinSeat(i);
                        setShowSeatPicker(false);
                      }
                    }}
                    disabled={Boolean(occupiedBy && !isMyCurrent)}
                    className={`h-8 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center ${
                      isMyCurrent
                        ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-300 shadow-glow"
                        : occupiedBy
                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                        : "bg-white/15 text-white hover:bg-cyan-500/30 hover:border-cyan-400 border border-white/10"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Interactive Console: Curriculum Modules & Live Voice Ask Doubt */}
      <div className="border-t border-white/10 bg-slate-950/95 p-3.5 sm:p-4 backdrop-blur-xl z-10 flex flex-col gap-3.5">
        {/* Curriculum Topic Switcher */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" /> Select Lesson Topic:
            </span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Updates 3D Blackboard & Hologram
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
            {SAMPLE_TOPICS.map((topic) => {
              const active = currentTopic.id === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                    active
                      ? "bg-cyan-500/20 border-cyan-400 text-white shadow-glow ring-1 ring-cyan-400/50"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono text-cyan-300 truncate">
                      {topic.subject.split("·")[0]}
                    </span>
                    {active && <CheckCircle2 className="h-3 w-3 text-cyan-400" />}
                  </div>
                  <span className="text-xs font-bold text-white mt-0.5 line-clamp-1">
                    {topic.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Voice & Text Doubt Input with Live Microphone Button */}
        <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
          {/* Safety / Pacing Disclaimer Banner */}
          {currentTopic.disclaimer && (
            <div
              className={`rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 border ${
                currentTopic.isSafetyWarning
                  ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
                  : "bg-cyan-500/15 text-cyan-200 border-cyan-500/30"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <span>{currentTopic.disclaimer}</span>
            </div>
          )}

          {/* 1-Click Interactive Follow-Up Question Chips */}
          {currentTopic.followUpQuestions && currentTopic.followUpQuestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
              <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-1 font-bold">
                <Sparkles className="h-3 w-3 text-cyan-400" /> Follow-Up (1-Click):
              </span>
              {currentTopic.followUpQuestions.map((fq, i) => (
                <button
                  key={i}
                  onClick={() => void handleAskDoubt(fq)}
                  disabled={speaking || thinking}
                  className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-400/40 px-2.5 py-1 text-xs font-medium transition flex items-center gap-1 disabled:opacity-40"
                >
                  <span>💡</span>
                  <span>{fq}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-pink-400" /> Quick Doubts:
            </span>
            {QUICK_DOUBTS.map((doubt, i) => (
              <button
                key={i}
                onClick={() => handleAskDoubt(doubt)}
                disabled={speaking || thinking}
                className="rounded-lg bg-white/5 hover:bg-white/15 px-2 py-0.5 text-[11px] text-slate-200 border border-white/10 transition disabled:opacity-50"
              >
                {doubt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleAskDoubt(customQuestion);
            }}
            className="flex items-center gap-2"
          >
            {/* Live Microphone Voice Recognition Button */}
            <button
              type="button"
              onClick={toggleVoiceMic}
              disabled={thinking}
              className={`grid h-10 w-10 place-items-center rounded-xl font-bold transition-all shadow-lg flex-shrink-0 ${
                voiceRec.isListening
                  ? "bg-rose-500 text-white ring-4 ring-rose-400/50 animate-pulse"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              }`}
              title={
                voiceRec.isListening
                  ? "Listening... Click to send"
                  : `Speak doubt (${voiceLang === "hi-IN" ? "Hindi" : "English"})`
              }
            >
              {voiceRec.isListening ? (
                <MicOff className="h-4 w-4 animate-bounce" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>

            {/* Input Box for Typing or Transcribed Voice */}
            <div className="relative flex-1">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder={
                  voiceRec.isListening
                    ? `Sun rahi hoon... (${voiceLang === "hi-IN" ? "हिंदी में बोलिए" : "Speak in English"})...`
                    : "Ask the 3D Teacher any doubt by voice or text (e.g. 'Explain in Hindi', 'What is gravity?')..."
                }
                disabled={thinking}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition ${
                  voiceRec.isListening
                    ? "border-rose-400 bg-rose-950/40 ring-1 ring-rose-400"
                    : "border-white/15 bg-white/5 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                } disabled:opacity-50`}
              />
            </div>

            {/* Ask / Send Button */}
            <button
              type="submit"
              disabled={!customQuestion.trim() || thinking}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-glow hover:opacity-90 transition disabled:opacity-40 flex-shrink-0"
            >
              {thinking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Soch rahi hai...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Ask
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
