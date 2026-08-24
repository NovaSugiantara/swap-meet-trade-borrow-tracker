import type { SummaryStats, SwapItem } from "./types.ts";

const directions = {
  lent: { label: "→ Lent", relation: "to", color: "var(--lent)" },
  borrowed: { label: "← Borrowed", relation: "from", color: "var(--borrowed)" },
  swapped: { label: "⇄ Swapped", relation: "with", color: "var(--swapped)" },
} as const;
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
const dateLabel = (value: string) => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function renderSummary(stats: SummaryStats): string {
  return `<div class="stat stat-lent"><strong>${stats.lentCount}</strong><span>You've lent ${stats.lentCount === 1 ? "1 item" : `${stats.lentCount} items`}</span></div><div class="stat stat-borrowed"><strong>${stats.borrowedCount}</strong><span>You owe back ${stats.borrowedCount === 1 ? "1 item" : `${stats.borrowedCount} items`}</span></div>`;
}

function renderCard(item: SwapItem, history: boolean): string {
  const direction = directions[item.direction];
  const overdue = !history && item.dueDate !== null && item.dueDate < todayKey();
  const date = history && item.completedAt ? `Completed ${dateLabel(item.completedAt.slice(0, 10))}` : item.dueDate ? `Due ${dateLabel(item.dueDate)}` : "No due date";
  return `<article class="note swap-card" style="--accent:${direction.color}" data-id="${escapeHtml(item.id)}"><div class="card-top"><span class="badge">${direction.label}</span>${overdue ? '<span class="overdue">Overdue</span>' : ""}</div><h3>${escapeHtml(item.name)}</h3><p>${direction.relation} ${escapeHtml(item.person)}</p><div class="card-footer"><span class="date">${date}</span><button class="card-action ${history ? "delete" : ""}" type="button" data-action="${history ? "delete" : "complete"}">${history ? "Delete" : "Mark complete"}</button></div></article>`;
}

export function renderActiveList(items: SwapItem[]): string {
  const active = items.filter(item => item.status === "active").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return active.length ? active.map(item => renderCard(item, false)).join("") : '<div class="empty"><strong>Nothing tracked yet.</strong><span>Add your first swap and get it out of your head.</span><br><button class="primary" type="button" data-action="add">+ Add swap</button></div>';
}

export function renderHistoryList(items: SwapItem[]): string {
  const completed = items.filter(item => item.status === "completed").sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  return completed.length ? completed.map(item => renderCard(item, true)).join("") : '<div class="empty"><strong>No completed swaps yet.</strong><span>Finished exchanges will settle here.</span></div>';
}
