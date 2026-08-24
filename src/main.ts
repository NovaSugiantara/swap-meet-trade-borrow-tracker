import { displayErrors, handleFormSubmit, handleListClick } from "./handlers.ts";
import { addItem, completeItem, deleteItem, emptyState, getStats, loadState, restoreItem, saveState, STORAGE_KEY } from "./store.ts";
import type { AppState, FormErrors, SwapFormData, SwapItem } from "./types.ts";
import { renderActiveList, renderHistoryList, renderSummary } from "./ui.ts";

const must = <T extends Element>(selector: string): T => { const element = document.querySelector<T>(selector); if (!element) throw new Error(`Missing ${selector}`); return element; };
const form = must<HTMLFormElement>("#swap-form");
const formWrap = must<HTMLElement>("#swap-form-wrap");
const addToggle = must<HTMLButtonElement>("#add-toggle");
const activeList = must<HTMLElement>("#active-list");
const historyList = must<HTMLElement>("#history-list");
const summary = must<HTMLElement>("#summary");
const errorBox = must<HTMLElement>("#storage-error");
const toast = must<HTMLElement>("#undo-toast");
const toastMessage = must<HTMLElement>("#toast-message");
const undoButton = must<HTMLButtonElement>("#undo-delete");

let state: AppState = emptyState();
let storageError: string | null = null;
let pendingDelete: { item: SwapItem; index: number; timer: ReturnType<typeof setTimeout> } | null = null;
let noticeTimer: ReturnType<typeof setTimeout> | null = null;

function announce(message: string): void {
  if (noticeTimer) clearTimeout(noticeTimer);
  toastMessage.textContent = message; undoButton.hidden = true; toast.hidden = false;
  noticeTimer = setTimeout(() => { if (!pendingDelete) toast.hidden = true; }, 3000);
}
function render(): void {
  summary.innerHTML = renderSummary(getStats(state.items));
  activeList.innerHTML = renderActiveList(state.items); activeList.removeAttribute("aria-busy");
  historyList.innerHTML = renderHistoryList(state.items);
  must<HTMLElement>("#history-count").textContent = String(state.items.filter(item => item.status === "completed").length);
  errorBox.textContent = storageError ?? ""; errorBox.hidden = !storageError;
}
function commit(next: AppState, message: string): void { state = next; storageError = saveState(state); render(); announce(storageError ?? message); }
function setForm(open: boolean): void {
  formWrap.hidden = !open; addToggle.setAttribute("aria-expanded", String(open));
  if (open) must<HTMLInputElement>("#name").focus(); else addToggle.focus();
}
function makeItem(data: SwapFormData): SwapItem {
  return { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, name: data.name, direction: data.direction as SwapItem["direction"], person: data.person, dueDate: data.dueDate, status: "active", createdAt: new Date().toISOString(), completedAt: null };
}
function showUndo(item: SwapItem, index: number): void {
  if (noticeTimer) clearTimeout(noticeTimer);
  toastMessage.textContent = "Removed from history."; undoButton.hidden = false; toast.hidden = false;
  const timer = setTimeout(() => { toast.hidden = true; pendingDelete = null; }, 6000);
  pendingDelete = { item, index, timer };
}

addToggle.addEventListener("click", () => setForm(formWrap.hidden));
must<HTMLButtonElement>("#cancel-form").addEventListener("click", () => { form.reset(); displayErrors({}); setForm(false); });
form.addEventListener("submit", event => handleFormSubmit(event, data => {
  displayErrors({}); commit(addItem(state, makeItem(data)), `${data.name} is on your list.`); form.reset(); must<HTMLInputElement>("#name").focus();
}, (errors: FormErrors) => { displayErrors(errors); const first = Object.keys(errors)[0]; if (first) document.getElementById(first)?.focus(); }));

document.addEventListener("click", event => handleListClick(event, (action, id) => {
  if (action === "add") { setForm(true); return; }
  if (!id) return;
  if (action === "complete") { const next = completeItem(state, id); if (next !== state) commit(next, "Marked complete and moved to history."); return; }
  if (pendingDelete) { announce("Use Undo or wait before deleting another item."); return; }
  const index = state.items.findIndex(item => item.id === id && item.status === "completed");
  const item = state.items[index]; if (index < 0 || !item) return;
  const next = deleteItem(state, id); state = next; storageError = saveState(state); render(); showUndo(item, index);
}));

undoButton.addEventListener("click", () => {
  if (!pendingDelete) return; clearTimeout(pendingDelete.timer);
  const { item, index } = pendingDelete; pendingDelete = null; toast.hidden = true;
  commit(restoreItem(state, item, index), "Restored to history.");
});

window.addEventListener("storage", event => {
  if (event.key !== STORAGE_KEY) return;
  if (pendingDelete) { clearTimeout(pendingDelete.timer); pendingDelete = null; toast.hidden = true; }
  const loaded = loadState(); state = loaded.state; storageError = loaded.error; render(); announce("Updated from another tab.");
});

requestAnimationFrame(() => { const loaded = loadState(); state = loaded.state; storageError = loaded.error; render(); });
