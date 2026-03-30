export const HISTORY_STORAGE_KEY = "harbourline-post-history";
export const MAX_HISTORY_ITEMS = 50;

export type HistoryEntry = {
  id: string;
  category: string; // Changed from niche
  voice: string;    // Added so you can track the vibe
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
  const saved = localStorage.getItem("mimico_post_history");
  return saved ? JSON.parse(saved) : [];
}

export function persistHistory(history: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("mimico_post_history", JSON.stringify(history));
}
