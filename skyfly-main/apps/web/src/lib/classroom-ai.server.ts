export type UniversalShape3DType =
  | "sphere"
  | "cube"
  | "cylinder"
  | "cone"
  | "torus"
  | "arrow"
  | "plane"
  | "orbit_system"
  | "wave"
  | "helix"
  | "molecule"
  | "grid"
  | "bar_chart_3d";

export type UniversalHologramElementType =
  | "shape3d"
  | "diagram"
  | "graph"
  | "formula"
  | "map"
  | "keywords"
  | "steps"
  | "code"
  | "image_concept";

// Backwards compatibility alias for older 3D model types
export type HologramModelType =
  | "atom"
  | "dna"
  | "solar_system"
  | "force_vectors"
  | "neural"
  | "cube"
  | "wave"
  | "planet"
  | "formula"
  | UniversalShape3DType;

export interface UniversalDiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  color?: string;
}

export interface UniversalDiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface UniversalDiagramData {
  style?: "flowchart" | "cycle" | "tree" | "timeline" | "comparison";
  nodes: UniversalDiagramNode[];
  edges?: UniversalDiagramEdge[];
}

export interface UniversalGraphPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface UniversalGraphData {
  chartType: "line" | "bar" | "pie";
  xAxisLabel?: string;
  yAxisLabel?: string;
  points: UniversalGraphPoint[];
}

export interface UniversalMapData {
  regionName: string;
  lat?: number;
  lng?: number;
  highlights?: string[];
  description?: string;
}

export interface UniversalCodeData {
  language: string;
  snippet: string;
  explanation?: string;
}

export interface UniversalHologramElement {
  id?: string;
  type: UniversalHologramElementType;
  title?: string;
  shape?: UniversalShape3DType;
  color?: string;
  formula?: string;
  keywords?: string[];
  steps?: string[];
  diagram?: UniversalDiagramData;
  graph?: UniversalGraphData;
  map?: UniversalMapData;
  code?: UniversalCodeData;
  imageConcept?: {
    conceptName: string;
    subparts?: string[];
  };
  // Backwards compatibility fields
  modelType?: HologramModelType;
  value?: string;
  label?: string;
  items?: string[];
  positionOffset?: [number, number, number];
}

// Backwards compatibility alias
export type HologramElement = UniversalHologramElement;

export interface UniversalHologramScene {
  step: number;
  totalSteps: number;
  title?: string;
  speech?: string;
  elements?: UniversalHologramElement[];
  // Backwards compatibility aliases with older UI callers
  spokenText?: string;
  heading?: string;
  keyPoints?: string[];
  formula?: string;
  diagramType?: HologramModelType;
  diagramLabel?: string;
  keywords?: string[];
}

// Backwards compatibility alias
export type HologramSegment = UniversalHologramScene;

export interface ClassroomAIResponse {
  success: boolean;
  language: "en" | "hi";
  topicTitle: string;
  subject: string;
  disclaimer?: string;
  isSafetyWarning?: boolean;
  scenes: UniversalHologramScene[];
  // Backwards compatibility alias
  segments: UniversalHologramScene[];
  followUpQuestions: string[];
}

// In-Memory Sliding Window Rate Limiter
interface RateLimitBucket {
  timestamps: number[];
  dayCount: number;
  dayResetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

const MAX_PER_WINDOW = 15; // 15 requests
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_DAY = 70; // 70 requests per day

export function checkRateLimit(clientId: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
  message?: string;
} {
  const now = Date.now();
  let bucket = rateLimitStore.get(clientId);

  if (!bucket) {
    bucket = { timestamps: [], dayCount: 0, dayResetAt: now + 24 * 60 * 60 * 1000 };
    rateLimitStore.set(clientId, bucket);
  }

  // Reset daily bucket if 24 hours have passed
  if (now > bucket.dayResetAt) {
    bucket.dayCount = 0;
    bucket.dayResetAt = now + 24 * 60 * 60 * 1000;
  }

  // Filter timestamps within sliding window
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (bucket.dayCount >= MAX_PER_DAY) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.dayResetAt - now) / 1000),
      message:
        "Daily question limit reached for this session. Please resume tomorrow or review previous lecture notes.",
    };
  }

  if (bucket.timestamps.length >= MAX_PER_WINDOW) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSeconds = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      message: `You're asking great questions rapidly! The AI Teacher is taking a short breather. Please try again in ${retryAfterSeconds} seconds.`,
    };
  }

  // Record usage
  bucket.timestamps.push(now);
  bucket.dayCount += 1;

  return {
    allowed: true,
    remaining: MAX_PER_WINDOW - bucket.timestamps.length,
  };
}

export const SYSTEM_INSTRUCTION = `You are a world-class, warm, patient, and highly engaging AI Professor and 3D Virtual Classroom Instructor for EduVault AI.
Your mission is to answer ANY student question across any academic, real-world, or philosophical domain (Science, Mathematics, History, Geography, Coding & Computer Science, Health, Economics, Literature, Engineering, General Curiosity, etc.) in either Hindi, English, or Hinglish matching the student's language.

PEDAGOGICAL TEACHING STRUCTURE:
1. Start Simple: Begin with an intuitive, friendly greeting and the core intuitive idea.
2. Relatable Example / Analogy: Use an everyday real-world example to make the concept crystal clear.
3. Detailed Conceptual Breakdown: Explain the deeper mechanics, principles, formulas, or historical context step by step.
4. Summary & Synthesis: Conclude with key takeaways and practical implications.

SCENE BREAKDOWN RULES:
- Break the entire explanation into 4 to 10 short, sequential scenes (Steps).
- For short/simple queries, use 4-5 scenes.
- For broad, complex queries, use 6-10 scenes.
- In EVERY scene:
  * "speech": 2-3 crisp, spoken sentences (maximum 40 words) that the teacher speaks naturally out loud.
  * "title": A concise, clear title for this scene (e.g. "1. Gravity and Mass", "2. Inverse Square Law").
  * "elements": Exactly 1 to 3 hologram elements floating in 3D space to visually illustrate the explanation.

SUPPORTED HOLOGRAM ELEMENT TYPES:
1. "shape3d": For spatial, geometric, or physical objects.
   - shape: One of ["sphere", "cube", "cylinder", "cone", "torus", "arrow", "plane", "orbit_system", "wave", "helix", "molecule", "grid", "bar_chart_3d"]
   - title: Short description (e.g. "Hydrogen Atom Orbitals")
   - color: Optional hex (e.g. "#38bdf8", "#ec4899", "#f59e0b")
2. "diagram": For processes, timelines, comparisons, or trees.
   - diagram: { "style": "flowchart"|"cycle"|"tree"|"timeline"|"comparison", "nodes": [{"id": "1", "label": "Start", "sublabel": "Initiation"}], "edges": [{"from": "1", "to": "2"}] }
3. "graph": For mathematical functions, statistics, or trends.
   - graph: { "chartType": "line"|"bar"|"pie", "xAxisLabel": "Time (s)", "yAxisLabel": "Velocity (m/s)", "points": [{"x": 0, "y": 0}, {"x": 2, "y": 19.6}] }
4. "formula": For math, physics, chemistry equations.
   - formula: "F = G · (m₁ · m₂) / r²"
5. "map": For geography, historical locations, or global phenomena.
   - map: { "regionName": "Himalayan Mountain Range", "lat": 27.9881, "lng": 86.9250, "highlights": ["Tectonic Collision Zone"] }
6. "keywords": For 1 to 4 essential concept pills.
   - keywords: ["Inertia", "Newton's 1st Law", "Conservation"]
7. "steps": For ordered checklist items or rules.
   - steps: ["Initialize array pointers", "Compare middle element", "Bisect search space"]
8. "code": For coding and software engineering questions.
   - code: { "language": "python"|"typescript"|"cpp"|"java", "snippet": "def binary_search(arr, target):\n    # implementation" }
9. "image_concept": For abstract visual ideas when no specific 3D mesh applies.
   - imageConcept: { "conceptName": "Photosynthesis Chloroplast Cycle", "subparts": ["Light Reaction", "Calvin Cycle"] }

FALLBACK & HOLOGRAM INTEGRITY RULE:
- The hologram must NEVER be empty. If no complex 3D shape or diagram applies to a specific scene, include "keywords" and "steps".
- Each scene must have 1 to 3 elements.

FOLLOW-UP QUESTIONS:
- At the end of the JSON response, provide 2-3 logical, fascinating follow-up questions ("followUpQuestions") that the student can click to explore further.

SAFETY & POLICY GUARDRAILS:
1. Harmful/Dangerous queries (weapons, bomb making, self-harm, cyberattacks, illegal acts, toxic substances, adult content):
   - Politely decline to provide harmful instructions in a supportive tone, and pivot to the safe educational/scientific principle behind it.
2. Medical, Legal, Financial advice queries:
   - Provide foundational educational concepts and explicitly include a friendly disclaimer urging consultation with a qualified professional.
3. Unverifiable or Ambiguous questions:
   - Explicitly clarify scientific boundaries and state current consensus without making up fabricated facts.

RESPONSE FORMAT:
Strictly output RAW JSON ONLY (no markdown backticks, no \`\`\`json, just pure JSON object).
JSON Structure:
{
  "topicTitle": "Topic title",
  "subject": "Physics | Mathematics | Chemistry | Biology | Computer Science | History | Geography | Economics | General",
  "language": "en" | "hi",
  "disclaimer": "Optional disclaimer string if applicable",
  "scenes": [
    {
      "step": 1,
      "totalSteps": 4,
      "title": "Scene 1: Introduction",
      "speech": "Spoken teacher sentence 1. Spoken teacher sentence 2.",
      "elements": [
        {
          "type": "shape3d",
          "shape": "orbit_system",
          "title": "Planetary Motion"
        },
        {
          "type": "formula",
          "formula": "F = G · (m₁ · m₂) / r²"
        },
        {
          "type": "keywords",
          "keywords": ["Universal Gravity", "Inverse Square"]
        }
      ]
    }
  ],
  "followUpQuestions": [
    "Follow-up question 1?",
    "Follow-up question 2?",
    "Follow-up question 3?"
  ]
}`;

// Safety & Policy Interceptor
export function checkSafetyGuardrails(
  question: string,
  preferredLang: "en" | "hi" = "en"
): ClassroomAIResponse | null {
  const q = question.toLowerCase();
  const isHindi = preferredLang === "hi" || /[\u0900-\u097F]/.test(question);

  // 1. Harmful, weapons, self-harm, illegal activities
  const dangerousPatterns = [
    /\b(make|build|create|how to)\s+(a\s+)?(bomb|explosive|weapon|gun|poison|cyanide|bio\s*weapon|meth|heroin|drug)\b/i,
    /\b(kill|harm|suicide|hang|cut)\s+(myself|yourself|someone|people)\b/i,
    /\b(hack|ddos|steal|credit\s*card|malware|ransomware|exploit)\s+(a\s+)?(bank|account|website|system)\b/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(q)) {
      return {
        success: true,
        language: isHindi ? "hi" : "en",
        isSafetyWarning: true,
        topicTitle: isHindi ? "सुरक्षा नीति एवं शैक्षिक दिशानिर्देश" : "Educational Safety & Policy Guide",
        subject: "Safety & Ethics",
        disclaimer: isHindi
          ? "सुरक्षा कारणों से हानिकारक या अवैध गतिविधियों के निर्देश नहीं दिए जा सकते।"
          : "Educational safety guidelines prevent instructions on dangerous or illegal activities.",
        scenes: [
          {
            step: 1,
            totalSteps: 2,
            title: isHindi ? "1. सुरक्षा दिशानिर्देश" : "1. Safe Learning Principle",
            speech: isHindi
              ? "मैं एक AI शिक्षक हूँ और मैं किसी भी प्रकार के हथियार, हानिकारक पदार्थ या अवैध कार्य करने के निर्देश प्रदान नहीं कर सकती।"
              : "As an AI teacher, I am committed to safe learning. I cannot provide instructions for creating weapons, hazardous substances, or engaging in harmful activities.",
            spokenText: isHindi
              ? "मैं एक AI शिक्षक हूँ और मैं किसी भी प्रकार के हथियार, हानिकारक पदार्थ या अवैध कार्य करने के निर्देश प्रदान नहीं कर सकती।"
              : "As an AI teacher, I am committed to safe learning. I cannot provide instructions for creating weapons, hazardous substances, or engaging in harmful activities.",
            heading: isHindi ? "सुरक्षा दिशानिर्देश" : "Safety Policy",
            keyPoints: isHindi
              ? ["हानिकारक सामग्री के निर्देश प्रतिबंधित हैं", "सुरक्षित विज्ञान और तकनीक सीखें"]
              : ["Harmful instructions are strictly restricted", "Focus on constructive science & engineering"],
            elements: [
              {
                type: "keywords",
                keywords: isHindi
                  ? ["सुरक्षा नीति", "रचनात्मक शिक्षा"]
                  : ["Safety First", "Constructive Science"],
              },
              {
                type: "steps",
                steps: isHindi
                  ? ["1. हानिकारक प्रयोगों से बचें", "2. मान्यता प्राप्त शोध और विज्ञान का अध्ययन करें"]
                  : ["1. Avoid hazardous actions", "2. Explore accredited scientific principles"],
              },
            ],
          },
          {
            step: 2,
            totalSteps: 2,
            title: isHindi ? "2. सकारात्मक शैक्षिक विकल्प" : "2. Constructive Alternatives",
            speech: isHindi
              ? "यदि आप रसायन विज्ञान, ऊर्जा परिवर्तन या साइबर सुरक्षा के सिद्धांतों को सुरक्षित और शैक्षणिक दृष्टि से समझना चाहते हैं, तो मुझे अवश्य बताएं।"
              : "If you are interested in the theoretical chemistry of energy reactions or ethical cybersecurity defenses, we can explore those constructive topics together.",
            spokenText: isHindi
              ? "यदि आप रसायन विज्ञान, ऊर्जा परिवर्तन या साइबर सुरक्षा के सिद्धांतों को सुरक्षित और शैक्षणिक दृष्टि से समझना चाहते हैं, तो मुझे अवश्य बताएं।"
              : "If you are interested in the theoretical chemistry of energy reactions or ethical cybersecurity defenses, we can explore those constructive topics together.",
            heading: isHindi ? "शैक्षिक विकल्प" : "Educational Exploration",
            keyPoints: isHindi
              ? ["सैद्धांतिक भौतिकी और रसायन विज्ञान", "नैतिक साइबर सुरक्षा"]
              : ["Theoretical chemical energetics", "Ethical defensive cybersecurity"],
            elements: [
              {
                type: "shape3d",
                shape: "molecule",
                title: isHindi ? "आणविक रसायन संरचना" : "Molecular Chemistry Structure",
              },
              {
                type: "keywords",
                keywords: isHindi ? ["रसायन विज्ञान", "साइबर सुरक्षा"] : ["Chemical Science", "Defensive Security"],
              },
            ],
          },
        ],
        segments: [], // populated below
        followUpQuestions: isHindi
          ? [
              "ऊर्जा संरक्षण और रासायनिक अभिक्रियाएं कैसे काम करती हैं?",
              "साइबर सुरक्षा में एन्क्रिप्शन कैसे काम करता है?",
              "विज्ञान और प्रौद्योगिकी में नैतिक नियम क्या हैं?",
            ]
          : [
              "How do chemical reaction energetics and conservation laws work?",
              "What are the foundational principles of ethical cybersecurity?",
              "How did Alfred Nobel establish the science of controlled explosives?",
            ],
      };
    }
  }

  return null;
}

// Validation & Normalization Engine
export function validateAndNormalizeResponse(
  raw: any,
  fallbackQuestion: string,
  preferredLang: "en" | "hi" = "en"
): ClassroomAIResponse {
  const isHindi =
    raw?.language === "hi" ||
    preferredLang === "hi" ||
    /[\u0900-\u097F]/.test(fallbackQuestion);

  const topicTitle =
    typeof raw?.topicTitle === "string" && raw.topicTitle.trim()
      ? raw.topicTitle.trim()
      : isHindi
      ? `अध्ययन विषय: ${fallbackQuestion.slice(0, 30)}`
      : `Concept: ${fallbackQuestion.slice(0, 30)}`;

  const subject =
    typeof raw?.subject === "string" && raw.subject.trim()
      ? raw.subject.trim()
      : "Academic Masterclass";

  const rawScenes = Array.isArray(raw?.scenes)
    ? raw.scenes
    : Array.isArray(raw?.segments)
    ? raw.segments
    : [];

  const normalizedScenes: UniversalHologramScene[] = [];
  const total = rawScenes.length > 0 ? rawScenes.length : 3;

  for (let idx = 0; idx < rawScenes.length; idx++) {
    const s = rawScenes[idx];
    const stepNum = typeof s?.step === "number" ? s.step : idx + 1;
    const title =
      typeof s?.title === "string" && s.title.trim()
        ? s.title.trim()
        : typeof s?.heading === "string" && s.heading.trim()
        ? s.heading.trim()
        : `Step ${stepNum}`;

    const speech =
      typeof s?.speech === "string" && s.speech.trim()
        ? s.speech.trim()
        : typeof s?.spokenText === "string" && s.spokenText.trim()
        ? s.spokenText.trim()
        : isHindi
        ? "आइए इस चरण में विषय के मुख्य सिद्धांतों को विस्तार से समझें।"
        : "Let us examine the foundational principles of this concept in detail.";

    // Normalize elements (must be 1 to 3 elements)
    const elements: UniversalHologramElement[] = [];

    if (Array.isArray(s?.elements) && s.elements.length > 0) {
      for (const el of s.elements.slice(0, 3)) {
        if (el && typeof el === "object") {
          const type = (el.type || "keywords") as UniversalHologramElementType;
          elements.push({
            type,
            title: el.title || el.label || undefined,
            shape: el.shape || el.modelType || (type === "shape3d" ? "sphere" : undefined),
            color: el.color || undefined,
            formula: el.formula || el.value || undefined,
            keywords: Array.isArray(el.keywords)
              ? el.keywords
              : Array.isArray(el.items)
              ? el.items
              : undefined,
            steps: Array.isArray(el.steps)
              ? el.steps
              : Array.isArray(el.items)
              ? el.items
              : undefined,
            diagram: el.diagram || undefined,
            graph: el.graph || undefined,
            map: el.map || undefined,
            code: el.code || undefined,
            imageConcept: el.imageConcept || undefined,
          });
        }
      }
    }

    // If no elements were parsed, build from legacy fields or fallback
    if (elements.length === 0) {
      if (s?.formula) {
        elements.push({ type: "formula", formula: s.formula });
      }
      if (s?.diagramType) {
        elements.push({
          type: "shape3d",
          shape: (s.diagramType as UniversalShape3DType) || "sphere",
          title: s.diagramLabel || title,
        });
      }
      if (Array.isArray(s?.keywords) && s.keywords.length > 0) {
        elements.push({ type: "keywords", keywords: s.keywords });
      } else if (Array.isArray(s?.keyPoints) && s.keyPoints.length > 0) {
        elements.push({ type: "steps", steps: s.keyPoints });
      } else {
        elements.push({
          type: "keywords",
          keywords: isHindi ? ["मूल सिद्धांत", "अवधारणा"] : ["Core Principle", "Key Concept"],
        });
        elements.push({
          type: "steps",
          steps: isHindi
            ? ["1. सिद्धांत को ध्यानपूर्वक समझें", "2. उदाहरण पर विचार करें"]
            : ["1. Understand key theorem", "2. Review practical derivation"],
        });
      }
    }

    // Extract backwards compatibility fields
    const keyPoints: string[] = [];
    let formulaStr: string | undefined = s?.formula;
    let legacyDiagramType: HologramModelType = "atom";
    const keywordList: string[] = [];

    for (const el of elements) {
      if (el.type === "formula" && el.formula) formulaStr = el.formula;
      if (el.type === "shape3d" && el.shape) legacyDiagramType = el.shape;
      if (el.type === "keywords" && el.keywords) keywordList.push(...el.keywords);
      if (el.type === "steps" && el.steps) keyPoints.push(...el.steps);
    }

    if (keyPoints.length === 0 && Array.isArray(s?.keyPoints)) {
      keyPoints.push(...s.keyPoints);
    }
    if (keyPoints.length === 0) {
      keyPoints.push(isHindi ? "सिद्धांत का मुख्य अनुप्रयोग" : "Primary governing law");
      keyPoints.push(isHindi ? "व्यावहारिक उदाहरण और निष्कर्ष" : "Practical real-world application");
    }

    normalizedScenes.push({
      step: stepNum,
      totalSteps: total,
      title,
      speech,
      elements,
      // Compatibility fields
      spokenText: speech,
      heading: title,
      keyPoints,
      formula: formulaStr,
      diagramType: legacyDiagramType,
      diagramLabel: title,
      keywords: keywordList.length > 0 ? keywordList : undefined,
    });
  }

  // Ensure follow-up questions
  const followUpQuestions =
    Array.isArray(raw?.followUpQuestions) && raw.followUpQuestions.length >= 2
      ? raw.followUpQuestions.slice(0, 3)
      : isHindi
      ? [
          "क्या आप इसका एक व्यावहारिक उदाहरण दे सकते हैं?",
          "यह परीक्षा और वास्तविक जीवन में कैसे उपयोगी है?",
          "इसके पीछे का गणितीय या वैज्ञानिक नियम क्या है?",
        ]
      : [
          "Can you provide a practical real-world example?",
          "How is this tested in competitive exams?",
          "What are the mathematical or foundational derivations?",
        ];

  return {
    success: true,
    language: isHindi ? "hi" : "en",
    topicTitle,
    subject,
    disclaimer: raw?.disclaimer || undefined,
    scenes: normalizedScenes,
    segments: normalizedScenes,
    followUpQuestions,
  };
}

// Multi-Discipline Curated Fallback Matrix
export function generateCuratedFallback(
  question: string,
  preferredLang: "en" | "hi" = "en"
): ClassroomAIResponse {
  const q = question.toLowerCase();
  const isHindi = preferredLang === "hi" || q.includes("hindi") || /[\u0900-\u097F]/.test(question);

  // Check safety first
  const safety = checkSafetyGuardrails(question, preferredLang);
  if (safety) {
    safety.segments = safety.scenes;
    return safety;
  }

  // 1. CODING / DATA STRUCTURES / ALGORITHMS / COMPUTER SCIENCE
  if (
    q.includes("code") ||
    q.includes("python") ||
    q.includes("javascript") ||
    q.includes("algorithm") ||
    q.includes("binary search") ||
    q.includes("tree") ||
    q.includes("recursion") ||
    q.includes("react") ||
    q.includes("sorting")
  ) {
    const rawData = {
      topicTitle: isHindi ? "बाइनरी सर्च एवं एल्गोरिदम टाइम कॉम्प्लेक्सिटी" : "Binary Search & Algorithmic Efficiency",
      subject: "Computer Science · Data Structures & Algorithms",
      scenes: [
        {
          step: 1,
          totalSteps: 4,
          title: isHindi ? "1. बाइनरी सर्च का मूल विचार" : "1. Divide & Conquer Intuition",
          speech: isHindi
            ? "बाइनरी सर्च एक सॉर्टेड ऐरे में किसी एलिमेंट को खोजने का सबसे तेज़ तरीका है। यह हर चरण में सर्च स्पेस को आधा कर देता है।"
            : "Binary search is an optimal divide-and-conquer algorithm for searching sorted arrays. At every comparison, it cuts the search space in half.",
          elements: [
            {
              type: "shape3d",
              shape: "bar_chart_3d",
              title: "Sorted Array Elements",
              color: "#38bdf8",
            },
            {
              type: "keywords",
              keywords: ["Divide & Conquer", "Sorted Array", "O(log N)"],
            },
          ],
        },
        {
          step: 2,
          totalSteps: 4,
          title: isHindi ? "2. एल्गोरिदम कोड इम्प्लीमेंटेशन" : "2. Code Implementation",
          speech: isHindi
            ? "हम लो और हाई पॉइंटर्स सेट करते हैं और मध्य बिंदु निकालते हैं। यदि टारगेट मध्य से बड़ा है तो राइट हाफ में खोजते हैं।"
            : "We maintain low and high pointers, calculate the midpoint, and discard the unneeded half based on comparison.",
          elements: [
            {
              type: "code",
              code: {
                language: "python",
                snippet:
                  "def binary_search(arr, target):\n  low, high = 0, len(arr) - 1\n  while low <= high:\n    mid = (low + high) // 2\n    if arr[mid] == target: return mid\n    elif arr[mid] < target: low = mid + 1\n    else: high = mid - 1\n  return -1",
                explanation: "Logarithmic time binary bisecting",
              },
            },
            {
              type: "formula",
              formula: "mid = low + ⌊(high - low) / 2⌋",
            },
          ],
        },
        {
          step: 3,
          totalSteps: 4,
          title: isHindi ? "3. टाइम एवं स्पेस कॉम्प्लेक्सिटी" : "3. Complexity & Logarithmic Scaling",
          speech: isHindi
            ? "लीनियर सर्च की तुलना में जहाँ N ऑपरेशंस लगते हैं, बाइनरी सर्च सिर्फ लॉग N ऑपरेशंस में 10 लाख एलिमेंट्स को 20 स्टेप्स में खोज लेता है!"
            : "Unlike linear search which scales as O(N), binary search runs in O(log N) time, searching 1,000,000 items in just 20 comparisons!",
          elements: [
            {
              type: "graph",
              graph: {
                chartType: "line",
                xAxisLabel: "Elements N",
                yAxisLabel: "Comparisons",
                points: [
                  { x: 10, y: 3 },
                  { x: 100, y: 7 },
                  { x: 1000, y: 10 },
                  { x: 1000000, y: 20 },
                ],
              },
            },
            {
              type: "formula",
              formula: "T(N) = O(log₂ N),  Space = O(1)",
            },
          ],
        },
        {
          step: 4,
          totalSteps: 4,
          title: isHindi ? "4. वास्तविक उपयोग एवं निष्कर्ष" : "4. Practical Industry Applications",
          speech: isHindi
            ? "डेटाबेस इंडेक्सिंग, सर्च इंजनों और ऑपरेटिंग सिस्टम्स के B-Trees बाइनरी सर्च के इसी सिद्धांत पर काम करते हैं।"
            : "Database B-Tree indexing, Git bisect, and operating system memory locators rely fundamentally on binary search logic.",
          elements: [
            {
              type: "steps",
              steps: [
                "1. Database B-Tree indexing",
                "2. Git bisect bug finding",
                "3. Real-time game physics query",
              ],
            },
            {
              type: "keywords",
              keywords: ["B-Tree Indexes", "Git Bisect", "High Scalability"],
            },
          ],
        },
      ],
      followUpQuestions: isHindi
        ? [
            "रोटेटेड सॉर्टेड ऐरे में बाइनरी सर्च कैसे करें?",
            "रिकर्सिव और इटरेटिव बाइनरी सर्च में क्या अंतर है?",
            "क्विकसॉर्ट और मर्जसॉर्ट में कौन सा बेहतर है?",
          ]
        : [
            "How do we apply binary search on a rotated sorted array?",
            "What is the memory difference between iterative vs recursive search?",
            "How do database B+ trees generalize binary search?",
          ],
    };
    return validateAndNormalizeResponse(rawData, question, preferredLang);
  }

  // 2. HISTORY / CIVILIZATIONS / REVOLUTIONS
  if (
    q.includes("history") ||
    q.includes("indus") ||
    q.includes("harappa") ||
    q.includes("mughal") ||
    q.includes("freedom") ||
    q.includes("gandhi") ||
    q.includes("war") ||
    q.includes("revolution") ||
    q.includes("ancient")
  ) {
    const rawData = {
      topicTitle: isHindi ? "सिंधु घाटी सभ्यता एवं प्राचीन नगर नियोजन" : "Indus Valley Civilization & Urban Engineering",
      subject: "History · Ancient Civilizations",
      scenes: [
        {
          step: 1,
          totalSteps: 4,
          title: isHindi ? "1. कांस्य युगीन सभ्यता का उदय" : "1. Genesis of Bronze Age Civilization",
          speech: isHindi
            ? "सिंधु घाटी सभ्यता (हड़प्पा सभ्यता) 2500 ईसा पूर्व में सिंधु और घग्गर-हकरा नदी घाटियों में विकसित हुई।"
            : "The Indus Valley Civilization flourished around 2500 BCE along the fertile floodplains of the Indus and Ghaggar-Hakra river basins.",
          elements: [
            {
              type: "map",
              map: {
                regionName: "Indus River Basin (Harappa & Mohenjo-daro)",
                lat: 27.329,
                lng: 68.138,
                highlights: ["Mohenjo-daro", "Harappa", "Lothal Port", "Dholavira"],
              },
            },
            {
              type: "keywords",
              keywords: ["2500 BCE", "Bronze Age", "Harappa", "Mohenjo-daro"],
            },
          ],
        },
        {
          step: 2,
          totalSteps: 4,
          title: isHindi ? "2. ग्रिड प्रणाली एवं नगर नियोजन" : "2. Master Urban Grid Architecture",
          speech: isHindi
            ? "हड़प्पा के नगर ग्रिड पैटर्न पर बने थे जहाँ सड़कें समकोण पर काटती थीं और पक्की ईंटों के दोमंजिला मकान थे।"
            : "Cities were meticulously organized on a rectilinear grid system, featuring standard baked brick architecture and fortified citadels.",
          elements: [
            {
              type: "shape3d",
              shape: "grid",
              title: "Urban Rectilinear Grid",
              color: "#f59e0b",
            },
            {
              type: "steps",
              steps: [
                "1. Right-angled grid street layout",
                "2. Standard baked bricks (1:2:4 ratio)",
                "3. Citadel and Lower Town segregation",
              ],
            },
          ],
        },
        {
          step: 3,
          totalSteps: 4,
          title: isHindi ? "3. उन्नत जल निकासी एवं स्वच्छता" : "3. Underground Sanitation & Great Bath",
          speech: isHindi
            ? "विश्व में पहली बार भूमिगत ढकी हुई नालियों और मोहनजोदड़ो के विशाल स्नानागार ने स्वच्छता इंजीनियरिंग का अद्भुत उदाहरण पेश किया।"
            : "Every home connected to covered underground street sewers with inspection traps, millennia ahead of contemporary civilizations.",
          elements: [
            {
              type: "diagram",
              diagram: {
                style: "flowchart",
                nodes: [
                  { id: "1", label: "Household Drain", sublabel: "Clay pipes" },
                  { id: "2", label: "Street Conduit", sublabel: "Covered brick" },
                  { id: "3", label: "City Soak Pit", sublabel: "Sanitation traps" },
                ],
                edges: [
                  { from: "1", to: "2" },
                  { from: "2", to: "3" },
                ],
              },
            },
            {
              type: "keywords",
              keywords: ["Great Bath", "Underground Drainage", "Hydraulic Plaster"],
            },
          ],
        },
        {
          step: 4,
          totalSteps: 4,
          title: isHindi ? "4. व्यापार, मुहरें एवं पतन के कारण" : "4. Maritime Trade & Historical Legacy",
          speech: isHindi
            ? "लोथल के डॉकयार्ड से मेसोपोटामिया तक समुद्री व्यापार होता था। 1900 ईसा पूर्व में जलवायु परिवर्तन और नदियों के मार्ग बदलने से यह सभ्यता विलीन हुई।"
            : "From the tidal dockyard at Lothal, maritime trade reached Mesopotamia. Gradual climatic shifts and river desiccation led to urban decentralization.",
          elements: [
            {
              type: "steps",
              steps: [
                "1. Maritime trade with Meluhha (Mesopotamia)",
                "2. Steatite unicorn seals and standard weights",
                "3. Monsoon shifts & tectonic desiccation",
              ],
            },
            {
              type: "keywords",
              keywords: ["Lothal Dockyard", "Steatite Seals", "Climate Shift"],
            },
          ],
        },
      ],
      followUpQuestions: isHindi
        ? [
            "हड़प्पा की लिपि अभी तक क्यों नहीं पढ़ी जा सकी?",
            "लोथल के डॉकयार्ड की इंजीनियरिंग कैसे काम करती थी?",
            "सिंधु सभ्यता और मेसोपोटामिया सभ्यता में क्या समानताएं थीं?",
          ]
        : [
            "Why has the Indus script remained undeciphered to this day?",
            "How did the tidal basin engineering at Lothal port function?",
            "What were the key trade relationships between Harappa and Mesopotamia?",
          ],
    };
    return validateAndNormalizeResponse(rawData, question, preferredLang);
  }

  // 3. GEOGRAPHY / EARTH SCIENCES / CLIMATE / TECTONICS
  if (
    q.includes("geography") ||
    q.includes("earth") ||
    q.includes("plate") ||
    q.includes("tectonic") ||
    q.includes("volcano") ||
    q.includes("river") ||
    q.includes("himalaya") ||
    q.includes("climate") ||
    q.includes("atmosphere")
  ) {
    const rawData = {
      topicTitle: isHindi ? "प्लेट विवर्तनिकी एवं हिमालय का निर्माण" : "Plate Tectonics & Continental Drift Dynamics",
      subject: "Geography · Geodynamics",
      scenes: [
        {
          step: 1,
          totalSteps: 4,
          title: isHindi ? "1. पृथ्वी की आंतरिक परतें और प्लेटें" : "1. Lithospheric Plates & Asthenosphere",
          speech: isHindi
            ? "पृथ्वी की सबसे बाहरी परत (लिथोस्फीयर) 7 प्रमुख विवर्तनिक प्लेटों में विभाजित है, जो पिघले हुए एस्थेनोस्फीयर पर तैरती हैं।"
            : "Earth's brittle outer crust and upper mantle are fragmented into major tectonic plates floating upon the semi-fluid convective asthenosphere.",
          elements: [
            {
              type: "shape3d",
              shape: "sphere",
              title: "Earth Lithospheric Shell",
              color: "#0284c7",
            },
            {
              type: "keywords",
              keywords: ["Lithosphere", "Asthenosphere", "Mantle Convection"],
            },
          ],
        },
        {
          step: 2,
          totalSteps: 4,
          title: isHindi ? "2. प्लेट सीमाओं के 3 प्रकार" : "2. Three Tectonic Boundary Types",
          speech: isHindi
            ? "प्लेटें तीन तरह से मिलती हैं: अभिसारी (टकराने वाली), अपसारी (दूर जाने वाली), और रूपांतरण (एक-दूसरे से रगड़ने वाली)।"
            : "Plates interact across three boundaries: Convergent (colliding), Divergent (spreading rift zones), and Transform (lateral strike-slip faults).",
          elements: [
            {
              type: "diagram",
              diagram: {
                style: "comparison",
                nodes: [
                  { id: "1", label: "Convergent", sublabel: "Mountains & Trenches" },
                  { id: "2", label: "Divergent", sublabel: "Mid-Ocean Ridges" },
                  { id: "3", label: "Transform", sublabel: "Strike-Slip Earthquakes" },
                ],
              },
            },
            {
              type: "keywords",
              keywords: ["Convergent", "Divergent", "Transform Fault"],
            },
          ],
        },
        {
          step: 3,
          totalSteps: 4,
          title: isHindi ? "3. भारतीय प्लेट और हिमालय की उत्पत्ति" : "3. Indo-Eurasian Continental Collision",
          speech: isHindi
            ? "लगभग 5 करोड़ वर्ष पूर्व, भारतीय प्लेट प्रति वर्ष 15 सेमी की गति से यूरेशियन प्लेट से टकराई, जिससे टेथिस सागर की तलछट उठकर हिमालय बन गई।"
            : "50 million years ago, the northward Indian plate collided with Eurasia, thrusting ancient Tethys seafloor strata upward into the Himalayas.",
          elements: [
            {
              type: "map",
              map: {
                regionName: "Indo-Eurasian Collision Zone (Himalayan Arc)",
                lat: 28.3949,
                lng: 84.124,
                highlights: ["Mount Everest", "Tibetan Plateau", "Main Boundary Thrust"],
              },
            },
            {
              type: "formula",
              formula: "Velocity = ~5 cm / year (Ongoing uplift: 5 mm/yr)",
            },
          ],
        },
        {
          step: 4,
          totalSteps: 4,
          title: isHindi ? "4. भूकंप एवं रिंग ऑफ फायर" : "4. Seismic Activity & Pacific Ring of Fire",
          speech: isHindi
            ? "सबडक्शन ज़ोन में तनाव बढ़ने से भूकंप और ज्वालामुखी आते हैं। प्रशांत महासागर की 'रिंग ऑफ फायर' में दुनिया के 75% ज्वालामुखी स्थित हैं।"
            : "Subduction friction unleashes severe megathrust earthquakes. The Pacific 'Ring of Fire' hosts over 75% of Earth's active volcanoes.",
          elements: [
            {
              type: "steps",
              steps: [
                "1. Subduction slab dehydration & magma generation",
                "2. Megathrust seismic energy release",
                "3. Tsunami genesis via sea floor displacement",
              ],
            },
            {
              type: "keywords",
              keywords: ["Ring of Fire", "Subduction Zone", "Seismic Waves"],
            },
          ],
        },
      ],
      followUpQuestions: isHindi
        ? [
            "माउंट एवरेस्ट की ऊंचाई आज भी क्यों बढ़ रही है?",
            "सुनामी कैसे उत्पन्न होती है और इसकी गति कितनी होती है?",
            "महाद्वीपीय विस्थापन सिद्धांत (Continental Drift) किसने दिया था?",
          ]
        : [
            "Why is Mount Everest continuing to grow taller every year?",
            "How do undersea tectonic earthquakes trigger destructive tsunamis?",
            "What was Alfred Wegener's evidence for continental drift?",
          ],
    };
    return validateAndNormalizeResponse(rawData, question, preferredLang);
  }

  // 4. MATHEMATICS / CALCULUS / GEOMETRY / TRIGONOMETRY
  if (
    q.includes("math") ||
    q.includes("calculus") ||
    q.includes("derivative") ||
    q.includes("integral") ||
    q.includes("pythagor") ||
    q.includes("trigonometry") ||
    q.includes("matrix") ||
    q.includes("algebra") ||
    q.includes("probability")
  ) {
    const rawData = {
      topicTitle: isHindi ? "कैलकुलस डेरिवेटिव एवं तात्कालिक परिवर्तन की दर" : "Calculus Derivatives & Instantaneous Rate of Change",
      subject: "Mathematics · Differential Calculus",
      scenes: [
        {
          step: 1,
          totalSteps: 4,
          title: isHindi ? "1. परिवर्तन की दर का विचार" : "1. Concept of Instantaneous Velocity",
          speech: isHindi
            ? "कैलकुलस में डेरिवेटिव हमें बताता है कि किसी फलन का मान एक निश्चित बिंदु पर किस गति से बदल रहा है।"
            : "The derivative quantifies the exact instantaneous rate of change of a function at any given continuous point.",
          elements: [
            {
              type: "shape3d",
              shape: "wave",
              title: "Continuous Smooth Curve",
              color: "#ec4899",
            },
            {
              type: "formula",
              formula: "f'(x) = lim_{h → 0} \\frac{f(x + h) - f(x)}{h}",
            },
          ],
        },
        {
          step: 2,
          totalSteps: 4,
          title: isHindi ? "2. स्पर्श रेखा का ढाल (Slope of Tangent)" : "2. Geometric Tangent Line Slope",
          speech: isHindi
            ? "ज्यामितीय रूप से, किसी वक्र के बिंदु पर खींची गई स्पर्श रेखा का ढलान (स्लोप) ही उसका डेरिवेटिव dy/dx होता है।"
            : "Geometrically, the derivative equals the slope of the tangent line touching the curve at coordinate point (x, f(x)).",
          elements: [
            {
              type: "graph",
              graph: {
                chartType: "line",
                xAxisLabel: "x axis",
                yAxisLabel: "f(x) = x²",
                points: [
                  { x: -2, y: 4 },
                  { x: -1, y: 1 },
                  { x: 0, y: 0 },
                  { x: 1, y: 1 },
                  { x: 2, y: 4 },
                ],
              },
            },
            {
              type: "formula",
              formula: "Slope m = dy / dx = tan(θ)",
            },
          ],
        },
        {
          step: 3,
          totalSteps: 4,
          title: isHindi ? "3. बुनियादी अवकलन नियम (Power & Chain Rule)" : "3. Power Rule & Chain Rule Mechanics",
          speech: isHindi
            ? "पॉवर रूल के अनुसार x की घात n का अवकलन n गुणा x की घात n-1 होता है। चेन रूल मिश्रित फलनों को हल करता है।"
            : "The fundamental Power Rule states d/dx(xⁿ) = n·xⁿ⁻¹. Composite functions are differentiated cleanly via the Chain Rule.",
          elements: [
            {
              type: "steps",
              steps: [
                "1. Power Rule: d/dx(xⁿ) = n · xⁿ⁻¹",
                "2. Product Rule: (u·v)' = u'·v + u·v'",
                "3. Chain Rule: dy/dx = (dy/du) · (du/dx)",
              ],
            },
            {
              type: "keywords",
              keywords: ["Power Rule", "Chain Rule", "Product Rule"],
            },
          ],
        },
        {
          step: 4,
          totalSteps: 4,
          title: isHindi ? "4. ऑप्टिमाइजेशन एवं वास्तविक अनुप्रयोग" : "4. Optimization & Real-World Machine Learning",
          speech: isHindi
            ? "जब डेरिवेटिव शून्य होता है, तो हमें फलन का अधिकतम या न्यूनतम मान मिलता है। AI का ग्रेडिएंट डिसेंट इसी से काम करता है!"
            : "Setting f'(x) = 0 identifies critical maxima and minima. This optimization directly powers modern AI gradient descent!",
          elements: [
            {
              type: "formula",
              formula: "Critical Points: f'(x) = 0,  Optimization: ∇L = 0",
            },
            {
              type: "keywords",
              keywords: ["Optimization", "Gradient Descent", "Loss Minimization"],
            },
          ],
        },
      ],
      followUpQuestions: isHindi
        ? [
            "इंटीग्रल (समाकलन) और डेरिवेटिव में क्या संबंध है?",
            "आर्टिफिशियल इंटेलिजेंस में ग्रेडिएंट डिसेंट कैसे काम करता है?",
            "त्रिकोणमितीय फलनों sin(x) और cos(x) का अवकलन कैसे होता है?",
          ]
        : [
            "What is the Fundamental Theorem of Calculus linking derivatives & integrals?",
            "How does multivariate backpropagation use the chain rule in AI?",
            "What are practical examples of finding maximum profit using derivatives?",
          ],
    };
    return validateAndNormalizeResponse(rawData, question, preferredLang);
  }

  // 5. SCIENCE / PHYSICS / GRAVITY / NEWTON
  if (
    q.includes("gravity") ||
    q.includes("gurutva") ||
    q.includes("newton") ||
    q.includes("force") ||
    q.includes("motion")
  ) {
    const rawData = {
      topicTitle: isHindi ? "गुरुत्वाकर्षण एवं न्यूटन के नियम" : "Gravitational Dynamics & Motion Laws",
      subject: "Physics · Classical & Relativistic Mechanics",
      scenes: [
        {
          step: 1,
          totalSteps: 4,
          title: isHindi ? "1. गुरुत्वाकर्षण का सार्वत्रिक नियम" : "1. Universal Gravitational Law",
          speech: isHindi
            ? "गुरुत्वाकर्षण ब्रह्मांड का वह सार्वत्रिक आकर्षण बल है जो किन्हीं दो द्रव्यमानों को परस्पर अपनी ओर खींचता है।"
            : "Gravity is the fundamental attractive force mutually pulling all matter together across the cosmos.",
          elements: [
            {
              type: "shape3d",
              shape: "orbit_system",
              title: "Orbital Gravity Well",
              color: "#38bdf8",
            },
            {
              type: "formula",
              formula: "F = G · (m₁ · m₂) / r²",
            },
            {
              type: "keywords",
              keywords: ["Universal Gravity", "Inverse-Square Law"],
            },
          ],
        },
        {
          step: 2,
          totalSteps: 4,
          title: isHindi ? "2. न्यूटन का द्वितीय नियम एवं त्वरण" : "2. Newton's 2nd Law & Force Vectors",
          speech: isHindi
            ? "न्यूटन के दूसरे नियम के अनुसार, वस्तु पर लगने वाला कुल बल उसके संवेग परिवर्तन की दर या द्रव्यमान गुणा त्वरण के बराबर होता है।"
            : "Newton's second law defines force as the rate of change of momentum, simplified to mass times acceleration.",
          elements: [
            {
              type: "shape3d",
              shape: "arrow",
              title: "Force Vector Direction",
              color: "#ec4899",
            },
            {
              type: "formula",
              formula: "F = dp / dt = m · a",
            },
          ],
        },
        {
          step: 3,
          totalSteps: 4,
          title: isHindi ? "3. स्पेस-टाइम वक्रता (आइंस्टीन का दृष्टिकोण)" : "3. Spacetime Curvature & General Relativity",
          speech: isHindi
            ? "आइंस्टीन के सामान्य सापेक्षता सिद्धांत में बताया गया है कि भारी द्रव्यमान स्पेस-टाइम फैब्रिक को मोड़ते हैं, और ग्रह उसी वक्रता पर परिक्रमा करते हैं।"
            : "Einstein showed gravity is not merely an invisible tug, but the geometric curvature of 4D spacetime caused by mass and energy.",
          elements: [
            {
              type: "shape3d",
              shape: "grid",
              title: "Curved Spacetime Manifold",
              color: "#a855f7",
            },
            {
              type: "formula",
              formula: "G_{μν} = \\frac{8πG}{c⁴} T_{μν}",
            },
          ],
        },
        {
          step: 4,
          totalSteps: 4,
          title: isHindi ? "4. उपग्रह, ज्वारभाटा और ब्लैक होल" : "4. Orbital Velocity & Black Holes",
          speech: isHindi
            ? "यही गुरुत्वाकर्षण उपग्रहों को पृथ्वी की कक्षा में रखता है, समुद्र में ज्वारभाटा लाता है, और अत्यधिक सघन होने पर ब्लैक होल बनाता है।"
            : "Gravity keeps satellites in stable low Earth orbit, generates ocean tides, and collapses dying stars into supermassive black holes.",
          elements: [
            {
              type: "steps",
              steps: [
                "1. Orbital Velocity: v = √(G·M / r)",
                "2. Escape Velocity: v_esc = √(2·G·M / r)",
                "3. Gravitational Lensing around Black Holes",
              ],
            },
            {
              type: "keywords",
              keywords: ["Orbital Mechanics", "Escape Velocity", "Event Horizon"],
            },
          ],
        },
      ],
      followUpQuestions: isHindi
        ? [
            "ब्लैक होल के इवेंट होराइजन पर समय क्यों रुक जाता है?",
            "पृथ्वी से पलायन वेग (Escape Velocity) कितना होता है?",
            "गुरुत्वाकर्षण तरंगों (Gravitational Waves) का पता कैसे चला?",
          ]
        : [
            "Why does time appear to stop near a black hole's event horizon?",
            "How do satellites calculate orbital escape velocity?",
            "How did LIGO detect gravitational waves in spacetime?",
          ],
    };
    return validateAndNormalizeResponse(rawData, question, preferredLang);
  }

  // 6. UNIVERSAL DYNAMIC ACADEMIC ENGINE (Fallback for any unknown subject)
  const cleanQ = question.replace(/[\?\.\!]/g, "").trim();
  const rawData = {
    topicTitle: isHindi ? `विषय: ${cleanQ.slice(0, 32)}` : `Exploration: ${cleanQ.slice(0, 32)}`,
    subject: "Universal Masterclass",
    scenes: [
      {
        step: 1,
        totalSteps: 4,
        title: isHindi ? "1. मौलिक अवधारणा एवं परिभाषा" : "1. Core Foundational Principles",
        speech: isHindi
          ? `यह एक बहुत ही ज्ञानवर्धक प्रश्न है। आइए "${cleanQ}" के मूल सिद्धांतों और इसकी मुख्य परिभाषा से शुरुआत करते हैं।`
          : `That is an insightful question. Let us examine the foundational concepts and primary definitions governing "${cleanQ}".`,
        elements: [
          {
            type: "shape3d",
            shape: "sphere",
            title: isHindi ? "मौलिक वैचारिक मॉडल" : "Conceptual Architecture",
            color: "#38bdf8",
          },
          {
            type: "keywords",
            keywords: isHindi
              ? ["मूल सिद्धांत", "परिभाषा", "संरचना"]
              : ["Foundations", "Definitions", "Core Structure"],
          },
        ],
      },
      {
        step: 2,
        totalSteps: 4,
        title: isHindi ? "2. कार्यप्रणाली एवं प्रक्रिया" : "2. Governing Mechanics & Workflow",
        speech: isHindi
          ? "जब हम इसकी कार्यप्रणाली को चरणबद्ध तरीके से देखते हैं, तो सभी घटक एक सुव्यवस्थित नियम और संतुलन का पालन करते हैं।"
          : "When analyzed systematically, each interacting component adheres to invariant governing rules and balanced conservation laws.",
        elements: [
          {
            type: "diagram",
            diagram: {
              style: "flowchart",
              nodes: [
                { id: "1", label: "Input / Initiation", sublabel: "Initial State" },
                { id: "2", label: "Dynamic Process", sublabel: "Core Transformation" },
                { id: "3", label: "Equilibrium Outcome", sublabel: "Final Result" },
              ],
              edges: [
                { from: "1", to: "2" },
                { from: "2", to: "3" },
              ],
            },
          },
          {
            type: "steps",
            steps: isHindi
              ? ["1. प्रारंभिक अवस्था और इनपुट", "2. परिवर्तनकारी प्रक्रिया", "3. अंतिम संतुलन परिणाम"]
              : ["1. Initial conditions & input", "2. Transformative phase", "3. Equilibrium outcome"],
          },
        ],
      },
      {
        step: 3,
        totalSteps: 4,
        title: isHindi ? "3. विश्लेषणात्मक नियम एवं समीकरण" : "3. Analytical Relationship & Logic",
        speech: isHindi
          ? "विश्लेषणात्मक दृष्टि से, यह अवधारणा दर्शाती है कि इनपुट और आउटपुट के बीच एक सीधा और मापने योग्य संबंध होता है।"
          : "Analytically, this demonstrates a direct, measurable relationship between interacting inputs and systemic outputs.",
        elements: [
          {
            type: "formula",
            formula: "Efficiency = \\frac{\\text{Useful Output}}{\\text{Total Input}} \\times 100\\%",
          },
          {
            type: "keywords",
            keywords: isHindi
              ? ["विश्लेषण", "समीकरण", "संतुलन"]
              : ["Analysis", "Derivation", "Equilibrium"],
          },
        ],
      },
      {
        step: 4,
        totalSteps: 4,
        title: isHindi ? "4. व्यावहारिक अनुप्रयोग एवं निष्कर्ष" : "4. Practical Applications & Key Insights",
        speech: isHindi
          ? "वास्तविक दुनिया और प्रतियोगी परीक्षाओं में, इस विषय की गहरी समझ आपको जटिल समस्याओं को आसानी से हल करने में मदद करती है।"
          : "In real-world applications and academic problem solving, mastering this concept empowers you to synthesize solutions effortlessly.",
        elements: [
          {
            type: "steps",
            steps: isHindi
              ? ["1. वास्तविक जीवन में प्रत्यक्ष उपयोग", "2. प्रतियोगी परीक्षाओं के लिए मुख्य बिंदु", "3. भविष्य के शोध के रास्ते"]
              : ["1. Direct real-world implementation", "2. High-yield exam applications", "3. Future research directions"],
          },
          {
            type: "keywords",
            keywords: isHindi
              ? ["व्यावहारिक उपयोग", "सफलता", "निष्कर्ष"]
              : ["Applications", "Mastery", "Synthesis"],
          },
        ],
      },
    ],
    followUpQuestions: isHindi
      ? [
          "क्या आप इसका एक सरल दैनिक जीवन का उदाहरण दे सकते हैं?",
          "इस सिद्धांत की सीमाएं (Limitations) क्या हैं?",
          "इसे पहली बार किसने और कब खोजा था?",
        ]
      : [
          "Can you provide a simple everyday real-life analogy?",
          "What are the boundary conditions or limitations of this principle?",
          "How has modern technology evolved based on this concept?",
        ],
  };

  return validateAndNormalizeResponse(rawData, question, preferredLang);
}

// Call Google Gemini 2.5 Flash / Lovable AI with Automatic 1-Retry on Invalid JSON
export async function askClassroomAI(
  question: string,
  preferredLang: "en" | "hi" = "en",
  clientId: string = "default-student"
): Promise<ClassroomAIResponse> {
  const q = question.trim();
  if (!q) {
    return generateCuratedFallback("Introduction to Science", preferredLang);
  }

  // 1. Safety Guardrail Pre-Check
  const safetyCheck = checkSafetyGuardrails(q, preferredLang);
  if (safetyCheck) {
    return safetyCheck;
  }

  // 2. Rate Limiting Check
  const rateLimit = checkRateLimit(clientId);
  if (!rateLimit.allowed) {
    const isHindi = preferredLang === "hi" || /[\u0900-\u097F]/.test(q);
    return {
      success: false,
      language: isHindi ? "hi" : "en",
      topicTitle: isHindi ? "कृपया थोड़ा विश्राम करें" : "Classroom Rate Limit",
      subject: "Pacing Notice",
      disclaimer: rateLimit.message,
      scenes: [
        {
          step: 1,
          totalSteps: 1,
          title: isHindi ? "शिक्षक का संक्षिप्त विराम" : "Short Break",
          speech: isHindi
            ? `आपने बहुत तेज़ी से कई अच्छे सवाल पूछे हैं! शिक्षिका कुछ पलों के लिए जलपान कर रही हैं। कृपया ${rateLimit.retryAfterSeconds || 60} सेकंड बाद पुनः पूछें।`
            : `You have asked several brilliant questions in quick succession! The teacher is taking a short water break. Please resume in ${rateLimit.retryAfterSeconds || 60} seconds.`,
          spokenText: isHindi
            ? `आपने बहुत तेज़ी से कई अच्छे सवाल पूछे हैं! शिक्षिका कुछ पलों के लिए जलपान कर रही हैं। कृपया ${rateLimit.retryAfterSeconds || 60} सेकंड बाद पुनः पूछें।`
            : `You have asked several brilliant questions in quick succession! The teacher is taking a short water break. Please resume in ${rateLimit.retryAfterSeconds || 60} seconds.`,
          heading: isHindi ? "संक्षिप्त विराम" : "Short Pacing Break",
          keyPoints: isHindi
            ? ["ब्लैकबोर्ड पर दिए गए नोट्स का पुनरावलोकन करें", "कुछ सेकंड बाद पुनः प्रश्न पूछें"]
            : ["Review blackboard lecture notes", "Resume queries shortly"],
          elements: [
            {
              type: "keywords",
              keywords: isHindi
                ? ["विश्राम", "नोट्स रिवीजन"]
                : ["Pacing Pause", "Review Notes"],
            },
            {
              type: "steps",
              steps: isHindi
                ? [`1. प्रतीक्षा समय: ~${rateLimit.retryAfterSeconds || 60}s`, "2. पिछले अध्यायों का अभ्यास करें"]
                : [`1. Wait timer: ~${rateLimit.retryAfterSeconds || 60}s`, "2. Practice prior concepts"],
            },
          ],
        },
      ],
      segments: [],
      followUpQuestions: isHindi
        ? ["पिछले टॉपिक का सारांश दिखाओ", "ब्लैकबोर्ड नोट्स समझाइए"]
        : ["Summarize prior lecture key takeaways", "Explain blackboard notes"],
    };
  }

  const geminiKey =
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"];

  const openaiKey = process.env["OPENAI_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];

  // 1. Google Gemini 2.0 Flash
  if (geminiKey) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
        const promptText =
          attempt === 1
            ? `${SYSTEM_INSTRUCTION}\n\nStudent Question: "${q}"\nPreferred Language: ${preferredLang}`
            : `${SYSTEM_INSTRUCTION}\n\nATTENTION: Your previous response was not valid JSON. Please generate ONLY valid, parseable JSON according to the schema.\nStudent Question: "${q}"\nPreferred Language: ${preferredLang}`;

        const payload = {
          contents: [
            {
              role: "user",
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.35,
          },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleaned = rawText.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
            const parsed = JSON.parse(cleaned);
            return validateAndNormalizeResponse(parsed, q, preferredLang);
          }
        }
      } catch (err) {
        console.warn(`[ClassroomAI] Gemini attempt ${attempt} error:`, err);
      }
    }
  }

  // 2. OpenAI GPT-4o-mini
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: `Student Question: "${q}"\nLanguage: ${preferredLang}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.35,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
          const parsed = JSON.parse(cleaned);
          return validateAndNormalizeResponse(parsed, q, preferredLang);
        }
      }
    } catch (err) {
      console.warn("[ClassroomAI] OpenAI call error:", err);
    }
  }

  // 3. Fallback to Lovable Gateway if available
  if (lovableKey) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: `Student Question: "${q}"\nLanguage: ${preferredLang}` },
          ],
          temperature: 0.35,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
          const parsed = JSON.parse(cleaned);
          return validateAndNormalizeResponse(parsed, q, preferredLang);
        }
      }
    } catch (err) {
      console.warn("[ClassroomAI] Lovable Gateway call error:", err);
    }
  }

  // Robust universal curated fallback
  return generateCuratedFallback(q, preferredLang);
}
