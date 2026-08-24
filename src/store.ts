import type { AppState, SummaryStats, SwapItem } from "./types.ts";

export const STORAGE_KEY = "swap-meet-v1";
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface LoadResult { state: AppState; error: string | null }

export const emptyState = (): AppState => ({ items: [] });

const isItem = (value: unknown): value is SwapItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.name === "string" &&
    ["lent", "borrowed", "swapped"].includes(String(item.direction)) &&
    typeof item.person === "string" && ["active", "completed"].includes(String(item.status)) &&
    typeof item.createdAt === "string" && (item.dueDate === null || typeof item.dueDate === "string") &&
    (item.completedAt === null || typeof item.completedAt === "string");
};

export function parseState(raw: string | null): LoadResult {
  if (raw === null) return { state: emptyState(), error: null };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !Array.isArray((value as AppState).items) || !(value as AppState).items.every(isItem)) throw new Error();
    return { state: value as AppState, error: null };
  } catch {
    return { state: emptyState(), error: "We couldn't read your saved swaps. Start again below." };
  }
}

export function loadState(storage: StorageLike = localStorage): LoadResult {
  try { return parseState(storage.getItem(STORAGE_KEY)); }
  catch { return { state: emptyState(), error: "Saving is blocked. Keep this tab open to protect your changes." }; }
}

export function saveState(state: AppState, storage: StorageLike = localStorage): string | null {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return null; }
  catch { return "We couldn't save this. Keep this tab open and try again."; }
}

export const addItem = (state: AppState, item: SwapItem): AppState => ({ items: [item, ...state.items] });
export const completeItem = (state: AppState, id: string, now = new Date().toISOString()): AppState => {
  if (!state.items.some(item => item.id === id && item.status === "active")) return state;
  return { items: state.items.map(item => item.id === id ? { ...item, status: "completed", completedAt: now } : item) };
};
export const deleteItem = (state: AppState, id: string): AppState => ({ items: state.items.filter(item => item.id !== id) });
export const restoreItem = (state: AppState, item: SwapItem, index: number): AppState => {
  const items = [...state.items]; items.splice(index, 0, item); return { items };
};
export const getStats = (items: SwapItem[]): SummaryStats => ({
  lentCount: items.filter(item => item.status === "active" && item.direction === "lent").length,
  borrowedCount: items.filter(item => item.status === "active" && item.direction === "borrowed").length,
});
