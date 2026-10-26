// Robust Supabase Auth Storage adapter
// Uses browser window.localStorage directly with safe fallbacks and instant resolution.

class SafeMemoryStorage {
  private store: Map<string, string> = new Map();
  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const memoryFallback = new SafeMemoryStorage();

export function brokeredPreviewStorage() {
  if (typeof window === "undefined") return undefined;

  try {
    const testKey = "__eduvault_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (err) {
    console.warn("[Auth Storage] localStorage unavailable, falling back to in-memory session:", err);
    return memoryFallback;
  }
}
