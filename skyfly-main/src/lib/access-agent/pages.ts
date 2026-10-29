// Every page the agent can open, with the words a student might say (English, Hinglish, Hindi).

export type AgentPage = { path: string; label: string; labelHi: string; keys: string[] };

export const PAGES: AgentPage[] = [
  { path: "/dashboard", label: "Dashboard", labelHi: "डैशबोर्ड", keys: ["dashboard", "home", "ghar", "होम", "डैशबोर्ड", "घर"] },
  { path: "/classroom", label: "3D Classroom", labelHi: "थ्रीडी क्लासरूम", keys: ["classroom", "3d classroom", "class", "क्लासरूम", "कक्षा"] },
  { path: "/ai", label: "AI Assistant", labelHi: "एआई असिस्टेंट", keys: ["ai assistant", "assistant", "ai", "chat", "doubt", "असिस्टेंट", "डाउट", "चैट"] },
  { path: "/teacher", label: "Personal Teacher", labelHi: "पर्सनल टीचर", keys: ["teacher", "personal teacher", "tutor", "टीचर", "शिक्षक"] },
  { path: "/mentor", label: "AI Mentor", labelHi: "एआई मेंटर", keys: ["mentor", "stress", "tension", "मेंटर", "तनाव"] },
  { path: "/voice", label: "Voice AI", labelHi: "वॉइस एआई", keys: ["voice ai", "voice", "वॉइस", "आवाज़"] },
  { path: "/camera", label: "Camera AI Solver", labelHi: "कैमरा सॉल्वर", keys: ["camera solver", "camera ai", "camera", "कैमरा"] },
  { path: "/subjects", label: "Subjects", labelHi: "विषय", keys: ["subjects", "subject", "vishay", "विषय", "सब्जेक्ट"] },
  { path: "/notes", label: "Notes Library", labelHi: "नोट्स", keys: ["notes", "note", "notes library", "नोट्स", "नोट"] },
  { path: "/pyqs", label: "Previous Year Questions", labelHi: "पिछले साल के प्रश्न", keys: ["pyq", "pyqs", "previous year", "previous years", "purane paper", "पिछले साल", "पुराने पेपर"] },
  { path: "/quiz", label: "Practice Quizzes", labelHi: "क्विज़", keys: ["quiz", "quizzes", "practice", "क्विज़", "क्वीज़", "क्विज", "प्रैक्टिस"] },
  { path: "/exam", label: "Exam Simulation", labelHi: "परीक्षा सिमुलेशन", keys: ["exam", "exam simulation", "pariksha", "परीक्षा", "एग्जाम"] },
  { path: "/mock-tests", label: "Timed Mocks", labelHi: "मॉक टेस्ट", keys: ["mock", "mocks", "mock test", "mock tests", "मॉक"] },
  { path: "/viva", label: "Oral Viva", labelHi: "वाइवा", keys: ["viva", "interview", "वाइवा", "इंटरव्यू"] },
  { path: "/mistakes", label: "Mistake Notebook", labelHi: "गलतियों की कॉपी", keys: ["mistakes", "mistake", "galtiyan", "गलतियाँ", "गलतियां", "गलती"] },
  { path: "/planner", label: "Study Planner", labelHi: "स्टडी प्लानर", keys: ["planner", "study planner", "timetable", "plan", "प्लानर", "टाइमटेबल"] },
  { path: "/career", label: "Career Roadmap", labelHi: "करियर रोडमैप", keys: ["career", "roadmap", "करियर", "रोडमैप"] },
  { path: "/progress", label: "Progress", labelHi: "प्रगति", keys: ["progress", "readiness", "प्रगति", "प्रोग्रेस"] },
  { path: "/leaderboard", label: "Leaderboard", labelHi: "लीडरबोर्ड", keys: ["leaderboard", "ranking", "rank", "लीडरबोर्ड", "रैंक"] },
  { path: "/bookmarks", label: "Bookmarks", labelHi: "बुकमार्क", keys: ["bookmarks", "bookmark", "saved", "बुकमार्क"] },
  { path: "/vault", label: "Encrypted Vault", labelHi: "वॉल्ट", keys: ["vault", "वॉल्ट"] },
  { path: "/certificates", label: "Certificates", labelHi: "प्रमाणपत्र", keys: ["certificates", "certificate", "प्रमाणपत्र", "सर्टिफिकेट"] },
  { path: "/low-resource", label: "Low-Resource Mode", labelHi: "लो रिसोर्स मोड", keys: ["low resource", "low-resource", "lite mode", "लो रिसोर्स"] },
  { path: "/network", label: "Student Network", labelHi: "स्टूडेंट नेटवर्क", keys: ["network", "students", "नेटवर्क"] },
  { path: "/impact", label: "Impact Dashboard", labelHi: "इम्पैक्ट", keys: ["impact", "इम्पैक्ट"] },
  { path: "/impact-access", label: "Impact Access", labelHi: "इम्पैक्ट एक्सेस", keys: ["impact access", "free access", "इम्पैक्ट एक्सेस"] },
  { path: "/feedback", label: "Feedback", labelHi: "फीडबैक", keys: ["feedback", "फीडबैक", "सुझाव"] },
  { path: "/profile", label: "My Profile", labelHi: "मेरी प्रोफ़ाइल", keys: ["profile", "my profile", "प्रोफ़ाइल", "प्रोफाइल"] },
  { path: "/settings", label: "Settings", labelHi: "सेटिंग्स", keys: ["settings", "setting", "सेटिंग", "सेटिंग्स"] },
];

export const pageLabel = (p: AgentPage, hindi: boolean) => (hindi ? p.labelHi : p.label);
export const findPage = (path: string) => PAGES.find((p) => path === p.path || path.startsWith(p.path + "/"));
