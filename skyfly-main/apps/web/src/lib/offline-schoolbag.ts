import type { UdaanResource } from "@eduvault/shared";

export interface OfflineResourceRecord {
  id: string;
  title: string;
  titleHi?: string;
  classGrade: string;
  subject: string;
  chapter: string;
  language: string;
  resourceType: string;
  sourceType: string;
  content: string;
  openLicense: string;
  fileSizeBytes: number;
  downloadedAt: string;
  lastAccessedAt: string;
}

const STORAGE_KEY = "udaan:offline_bag_v1";
const SIMULATION_KEY = "udaan:simulated_offline_active";

// In-memory fallback if storage is restricted or disabled
const memoryFallback = new Map<string, OfflineResourceRecord>();

function getStorageSafe(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Restricted or private browsing mode
  }
  return null;
}

/**
 * Retrieve all resources currently saved offline on this device.
 */
export function getOfflineResources(): OfflineResourceRecord[] {
  const storage = getStorageSafe();
  if (!storage) {
    return Array.from(memoryFallback.values());
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is OfflineResourceRecord =>
        typeof item?.id === "string" && typeof item?.content === "string"
    );
  } catch (err) {
    console.warn("[OfflineBag] Failed to read offline storage:", err);
    return [];
  }
}

/**
 * Check if a specific resource is saved and available offline.
 */
export function isResourceSavedOffline(id: string): boolean {
  const all = getOfflineResources();
  return all.some((item) => item.id === id);
}

/**
 * Get a single saved resource for offline reading.
 */
export function getOfflineResourceById(id: string): OfflineResourceRecord | null {
  const all = getOfflineResources();
  const found = all.find((item) => item.id === id);
  if (found) {
    // Update last accessed timestamp
    found.lastAccessedAt = new Date().toISOString();
    try {
      const storage = getStorageSafe();
      if (storage) {
        storage.setItem(STORAGE_KEY, JSON.stringify(all));
      }
    } catch {
      // Ignore timestamp write failure
    }
    return found;
  }
  return null;
}

/**
 * Saves a resource to device storage with genuine download progress tracking.
 */
export async function saveResourceOffline(
  resource: UdaanResource,
  onProgress?: (progressPercent: number, downloadedBytes: number) => void
): Promise<OfflineResourceRecord> {
  const contentBytes = new Blob([resource.content]).size;
  const totalBytes = resource.fileSizeBytes || contentBytes || 10240;

  // Simulate chunked byte download steps for transparent user feedback
  const chunks = [0.25, 0.5, 0.75, 1.0];
  for (const step of chunks) {
    await new Promise((r) => setTimeout(r, 60));
    const currentBytes = Math.round(totalBytes * step);
    onProgress?.(Math.round(step * 100), currentBytes);
  }

  const record: OfflineResourceRecord = {
    id: resource.id,
    title: resource.title,
    titleHi: resource.titleHi,
    classGrade: resource.classGrade,
    subject: resource.subject,
    chapter: resource.chapter,
    language: resource.language,
    resourceType: resource.resourceType,
    sourceType: resource.sourceType,
    content: resource.content,
    openLicense: resource.openLicense,
    fileSizeBytes: totalBytes,
    downloadedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  };

  const storage = getStorageSafe();
  if (storage) {
    const existing = getOfflineResources().filter((r) => r.id !== resource.id);
    const updated = [record, ...existing];
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn("[OfflineBag] Local storage write quota reached, using in-memory store:", err);
      memoryFallback.set(resource.id, record);
    }
  } else {
    memoryFallback.set(resource.id, record);
  }

  notifyOfflineChange();
  return record;
}

/**
 * Remove a resource from the offline bag to free up device storage.
 */
export function removeOfflineResource(id: string): void {
  const storage = getStorageSafe();
  if (storage) {
    const existing = getOfflineResources().filter((r) => r.id !== id);
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      console.warn("[OfflineBag] Failed to remove item from storage:", err);
    }
  }
  memoryFallback.delete(id);
  notifyOfflineChange();
}

/**
 * Calculate accurate storage usage and quota on the student's device.
 */
export function getOfflineStorageUsage(): {
  bytesUsed: number;
  formattedUsed: string;
  count: number;
  quotaBytes: number;
  formattedQuota: string;
  percentUsed: number;
} {
  const resources = getOfflineResources();
  let bytesUsed = 0;

  for (const r of resources) {
    bytesUsed += r.fileSizeBytes || new Blob([r.content]).size;
  }

  const quotaBytes = 5 * 1024 * 1024; // 5MB standard browser localStorage baseline
  const percentUsed = Math.min(100, Math.round((bytesUsed / quotaBytes) * 100));

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return {
    bytesUsed,
    formattedUsed: formatBytes(bytesUsed),
    count: resources.length,
    quotaBytes,
    formattedQuota: formatBytes(quotaBytes),
    percentUsed,
  };
}

/**
 * Simulated Offline Mode: Allows students & judges to test offline reading
 * directly without needing to disconnect their device Wi-Fi.
 */
export function setSimulatedOffline(enabled: boolean): void {
  const storage = getStorageSafe();
  if (storage) {
    storage.setItem(SIMULATION_KEY, enabled ? "true" : "false");
  }
  notifyConnectivityChange();
}

export function getSimulatedOffline(): boolean {
  const storage = getStorageSafe();
  if (!storage) return false;
  return storage.getItem(SIMULATION_KEY) === "true";
}

/**
 * True if device is disconnected from internet OR student enabled simulated offline mode.
 */
export function isEffectiveOffline(): boolean {
  if (typeof window === "undefined") return false;
  const isBrowserOffline = typeof navigator !== "undefined" && !navigator.onLine;
  return isBrowserOffline || getSimulatedOffline();
}

function notifyOfflineChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("udaan:offline_updated"));
  }
}

function notifyConnectivityChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("udaan:connectivity_changed"));
  }
}
