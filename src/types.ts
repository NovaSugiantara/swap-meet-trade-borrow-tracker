export type Direction = "lent" | "borrowed" | "swapped";
export type ItemStatus = "active" | "completed";

export interface SwapItem {
  id: string;
  name: string;
  direction: Direction;
  person: string;
  dueDate: string | null;
  status: ItemStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface AppState { items: SwapItem[] }
export interface SwapFormData { name: string; direction: Direction | ""; person: string; dueDate: string | null }
export type FormErrors = Partial<Record<keyof SwapFormData, string>>;
export interface SummaryStats { lentCount: number; borrowedCount: number }
