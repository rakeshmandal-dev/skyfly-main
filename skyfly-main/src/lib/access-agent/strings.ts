import type { AgentLang } from "./memory";

/** Everything the agent says on its own, in Hindi and English. */
export function strings(lang: AgentLang) {
  const hi = lang === "hi-IN";
  return {
    welcome: hi
      ? "नमस्ते! मैं साथी हूँ, आपकी पढ़ाई का साथी। अगर आप देख नहीं सकते तो 1 दबाइए, सुन नहीं सकते तो 2, बोल नहीं सकते तो 3। फिर एंटर दबाइए। छोड़ने के लिए एस्केप दबाइए।"
      : "Hello! I am Sathi, your learning helper. Press 1 if you cannot see, 2 if you cannot hear, 3 if you cannot speak. Then press Enter. Press Escape to skip.",
    ready: hi
      ? "मैं तैयार हूँ। ऑल्ट और ए दबाइए, या बड़ा माइक बटन दबाइए, और बताइए क्या करना है। मेरे काम सुनने के लिए बोलिए, मदद।"
      : "I am ready. Press Alt and A, or the big microphone button, and tell me what to do. Say help to hear what I can do.",
    help: hi
      ? "आप कह सकते हैं: नोट्स खोलो, क्विज़ खोलो, प्लानर खोलो। पेज पढ़ो। कौन से बटन हैं। क्लिक और फिर बटन का नाम। लिखो और फिर आपकी बात। कैमरे के लिए, मेरे सामने क्या है। धीरे या तेज़। रुको। या कोई भी पढ़ाई का सवाल पूछिए।"
      : "You can say: open notes, open quiz, open planner. Read page. What can I press. Click, then a button name. Type, then your words. What is in front of me, to use the camera. Slower or faster. Stop. Or ask me any study question.",
    opened: (l: string) => (hi ? `${l} खुल गया।` : `${l} is open.`),
    heading: (h: string) => (hi ? `पेज का शीर्षक: ${h}।` : `Page heading: ${h}.`),
    confirmLogout: hi ? "क्या आप साइन आउट करना चाहते हैं? हाँ या नहीं बोलिए।" : "Do you want to sign out? Say yes or no.",
    confirmRisky: (l: string) =>
      hi ? `"${l}" जोखिम भरा हो सकता है। क्या मैं इसे दबा दूँ? हाँ या नहीं।` : `"${l}" may be risky. Should I press it? Say yes or no.`,
    cancelled: hi ? "ठीक है, रद्द कर दिया।" : "Okay, cancelled.",
    stopped: hi ? "रुक गया।" : "Stopped.",
    notFound: (x: string) => (hi ? `"${x}" नाम का बटन नहीं मिला।` : `I could not find a button called "${x}".`),
    clicked: (l: string) => (hi ? `${l} दबा दिया।` : `Pressed ${l}.`),
    filled: hi ? "लिख दिया। भेजने के लिए बोलिए, भेजो।" : "Typed it. Say send to send it.",
    noInput: hi ? "इस स्क्रीन पर लिखने की जगह नहीं मिली।" : "I could not find a place to type on this screen.",
    optionsIntro: hi ? "इस स्क्रीन पर ये हैं:" : "On this screen you can use:",
    noOptions: hi ? "इस स्क्रीन पर कोई बटन नहीं मिला।" : "I found no buttons on this screen.",
    emptyPage: hi ? "इस पेज पर पढ़ने के लिए कुछ नहीं मिला।" : "I found nothing to read on this page.",
    cameraWorking: hi ? "देख रहा हूँ। कृपया कैमरा स्थिर रखिए।" : "Looking now. Please hold the camera steady.",
    cameraFail: hi ? "मैं कैमरा नहीं चला सका। कृपया कैमरे की अनुमति दीजिए।" : "I could not use the camera. Please allow camera permission.",
    aiFail: hi ? "माफ़ कीजिए, अभी जवाब नहीं दे पाया। फिर कोशिश कीजिए।" : "Sorry, I could not answer just now. Please try again.",
    slower: hi ? "ठीक है, धीरे बोलूँगा।" : "Okay, I will speak slower.",
    faster: hi ? "ठीक है, तेज़ बोलूँगा।" : "Okay, I will speak faster.",
    micBlocked: hi ? "माइक बंद है। आप मुझे टाइप करके बता सकते हैं।" : "The microphone is blocked. You can type to me instead.",
    micOff: hi ? "माइक बंद कर दिया।" : "Microphone is off.",
    suggestNext: (l: string) =>
      hi ? `आप अक्सर इसके बाद ${l} खोलते हैं। क्या मैं खोल दूँ? हाँ या नहीं।` : `You often open ${l} after this. Shall I open it? Say yes or no.`,
    suggestTime: (l: string) =>
      hi ? `इस समय आप आमतौर पर ${l} खोलते हैं। क्या मैं खोल दूँ? हाँ या नहीं।` : `At this time you usually open ${l}. Shall I open it? Say yes or no.`,
    signedOut: hi ? "साइन आउट हो गया।" : "Signed out.",
    nothingRepeat: hi ? "दोहराने के लिए कुछ नहीं है।" : "I have nothing to repeat.",
    okay: hi ? "ठीक है।" : "Okay.",
    thinking: hi ? "सोच रहा हूँ…" : "Thinking…",
  };
}

/** Pick the speech language from the text itself (Devanagari → Hindi, Latin → English). */
export function langFor(text: string, fallback: AgentLang): AgentLang {
  if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
  if (/[A-Za-z]/.test(text)) return "en-IN";
  return fallback;
}
