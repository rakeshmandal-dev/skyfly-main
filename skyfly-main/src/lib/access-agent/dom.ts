// The agent's "hands": safe helpers that read and operate the current screen.
// They never touch the agent's own panel (marked with data-access-agent).

const RISKY = /delete|remove|sign ?out|log ?out|submit|finish exam|end exam|pay|purchase|buy|reset|clear all|hatao|मिटा|हटा|जमा|डिलीट|खरीद/i;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function visible(el: Element) {
  const h = el as HTMLElement;
  return !!(h.offsetParent || h.getClientRects().length) && getComputedStyle(h).visibility !== "hidden";
}

function outsideAgent(el: Element) {
  return !el.closest("[data-access-agent]");
}

function labelOf(el: Element): string {
  const h = el as HTMLElement;
  return norm(
    h.getAttribute("aria-label") || h.innerText || h.getAttribute("title") || (h as HTMLInputElement).placeholder || (h as HTMLInputElement).value || "",
  );
}

/** Main content of the current page as plain text (for "read page"). */
export function pageText(maxChars = 1400): string {
  const main = document.querySelector("main");
  const text = (main as HTMLElement | null)?.innerText ?? "";
  return text.replace(/\s+/g, " ").trim().slice(0, maxChars);
}

/** Heading of the current page. */
export function pageHeading(): string {
  const h = document.querySelector("main h1, main h2") as HTMLElement | null;
  return h?.innerText.replace(/\s+/g, " ").trim().slice(0, 120) ?? "";
}

const INTERACTIVE = "main button, main a[href], main [role=button], main [role=tab], main input[type=submit]";

export function interactiveLabels(limit = 10): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  document.querySelectorAll(INTERACTIVE).forEach((el) => {
    if (!visible(el) || !outsideAgent(el)) return;
    const l = labelOf(el);
    if (!l || l.length > 60 || seen.has(l)) return;
    seen.add(l);
    out.push(l);
  });
  return out.slice(0, limit);
}

export type ClickTarget = { label: string; risky: boolean; click: () => void };

/** Finds the best matching visible button/link for what the student said. */
export function findClickable(wanted: string): ClickTarget | null {
  const w = norm(wanted);
  if (!w) return null;
  let best: { el: HTMLElement; score: number } | null = null;
  document.querySelectorAll("button, a[href], [role=button], [role=tab], input[type=submit]").forEach((el) => {
    if (!visible(el) || !outsideAgent(el)) return;
    if ((el as HTMLButtonElement).disabled) return;
    const l = labelOf(el);
    if (!l) return;
    let score = 0;
    if (l === w) score = 4;
    else if (l.startsWith(w)) score = 3;
    else if (l.includes(w)) score = 2;
    else if (w.includes(l) && l.length > 2) score = 1;
    if (score && (!best || score > best.score)) best = { el: el as HTMLElement, score };
  });
  if (!best) return null;
  const el = (best as { el: HTMLElement }).el;
  const label = labelOf(el);
  return { label, risky: RISKY.test(label) || RISKY.test(w), click: () => el.click() };
}

/** Types into the focused field, or the first visible text box on the page. */
export function fillInput(text: string): boolean {
  const active = document.activeElement as HTMLElement | null;
  const isField = (e: Element | null): e is HTMLInputElement | HTMLTextAreaElement =>
    !!e &&
    outsideAgent(e) &&
    (e instanceof HTMLTextAreaElement ||
      (e instanceof HTMLInputElement && ["text", "search", "", "url"].includes(e.type)));
  let target: HTMLInputElement | HTMLTextAreaElement | null = isField(active) ? active : null;
  if (!target) {
    const all = Array.from(document.querySelectorAll("textarea, input")) as Element[];
    target = (all.find((e) => isField(e) && visible(e)) as HTMLInputElement | HTMLTextAreaElement | undefined) ?? null;
  }
  if (!target) return false;
  const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(target, text);
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.focus();
  return true;
}

export function scrollPage(dir: "up" | "down") {
  window.scrollBy({ top: dir === "down" ? window.innerHeight * 0.8 : -window.innerHeight * 0.8, behavior: "smooth" });
}

/** Takes one photo from the camera without any button press (permission asked once). */
export async function captureFrame(): Promise<string | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
    await new Promise((r) => setTimeout(r, 900));
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const w = Math.min(1024, vw);
    const h = Math.round((w * vh) / vw);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(video, 0, 0, w, h);
    stream.getTracks().forEach((t) => t.stop());
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return null;
  }
}
