export const HISTORY_STORAGE_KEY = "harbourline-post-history";
export const MAX_HISTORY_ITEMS = 50;

export type HistoryEntry = {
  id: string;
  niche: string;
  postType: string;
  content: string;
  savedAt: string;
};

function isHistoryEntry(x: unknown): x is HistoryEntry {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.niche === "string" &&
    typeof o.postType === "string" &&
    typeof o.content === "string" &&
    typeof o.savedAt === "string"
  );
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry);
  } catch {
    return [];
  }
}

export function persistHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota or private mode
  }
}
