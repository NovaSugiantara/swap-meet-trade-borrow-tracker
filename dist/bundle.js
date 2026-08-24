// src/handlers.ts
var validDirections = ["lent", "borrowed", "swapped"];
function validateForm(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = "Name the item you're tracking.";
  if (!validDirections.includes(data.direction)) errors.direction = "Choose lent, borrowed, or swapped.";
  if (!data.person.trim()) errors.person = "Add the other person's name.";
  return errors;
}
function handleFormSubmit(event, onValid, onErrors) {
  event.preventDefault();
  const form2 = event.currentTarget;
  const values = new FormData(form2);
  const data = {
    name: String(values.get("name") ?? "").trim(),
    direction: String(values.get("direction") ?? ""),
    person: String(values.get("person") ?? "").trim(),
    dueDate: String(values.get("dueDate") ?? "") || null
  };
  const errors = validateForm(data);
  if (Object.keys(errors).length) onErrors(errors);
  else onValid(data);
}
function handleListClick(event, onAction) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "add") onAction("add", null);
  if (action === "complete" || action === "delete") onAction(action, button.closest("[data-id]")?.dataset.id ?? null);
}
function displayErrors(errors) {
  for (const field of ["name", "direction", "person"]) {
    const input = document.getElementById(field), output = document.getElementById(`${field}-error`);
    const message = errors[field] ?? "";
    input?.setAttribute("aria-invalid", message ? "true" : "false");
    if (output) output.textContent = message;
  }
}

// src/store.ts
var STORAGE_KEY = "swap-meet-v1";
var emptyState = () => ({ items: [] });
var isItem = (value) => {
  if (!value || typeof value !== "object") return false;
  const item = value;
  return typeof item.id === "string" && typeof item.name === "string" && ["lent", "borrowed", "swapped"].includes(String(item.direction)) && typeof item.person === "string" && ["active", "completed"].includes(String(item.status)) && typeof item.createdAt === "string" && (item.dueDate === null || typeof item.dueDate === "string") && (item.completedAt === null || typeof item.completedAt === "string");
};
function parseState(raw) {
  if (raw === null) return { state: emptyState(), error: null };
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || !Array.isArray(value.items) || !value.items.every(isItem)) throw new Error();
    return { state: value, error: null };
  } catch {
    return { state: emptyState(), error: "We couldn't read your saved swaps. Start again below." };
  }
}
function loadState(storage) {
  try {
    return parseState((storage ?? globalThis.localStorage).getItem(STORAGE_KEY));
  } catch {
    return { state: emptyState(), error: "Saving is blocked. Keep this tab open to protect your changes." };
  }
}
function saveState(state2, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(STORAGE_KEY, JSON.stringify(state2));
    return null;
  } catch {
    return "We couldn't save this. Keep this tab open and try again.";
  }
}
var addItem = (state2, item) => ({ items: [item, ...state2.items] });
var completeItem = (state2, id, now = (/* @__PURE__ */ new Date()).toISOString()) => {
  if (!state2.items.some((item) => item.id === id && item.status === "active")) return state2;
  return { items: state2.items.map((item) => item.id === id ? { ...item, status: "completed", completedAt: now } : item) };
};
var deleteItem = (state2, id) => ({ items: state2.items.filter((item) => item.id !== id) });
var restoreItem = (state2, item, index) => {
  const items = [...state2.items];
  items.splice(index, 0, item);
  return { items };
};
var getStats = (items) => ({
  lentCount: items.filter((item) => item.status === "active" && item.direction === "lent").length,
  borrowedCount: items.filter((item) => item.status === "active" && item.direction === "borrowed").length
});

// src/ui.ts
var directions = {
  lent: { label: "\u2192 Lent", relation: "to", color: "var(--lent)" },
  borrowed: { label: "\u2190 Borrowed", relation: "from", color: "var(--borrowed)" },
  swapped: { label: "\u21C4 Swapped", relation: "with", color: "var(--swapped)" }
};
var escapeHtml = (value) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
var dateLabel = (value) => new Intl.DateTimeFormat(void 0, { month: "short", day: "numeric", year: "numeric" }).format(/* @__PURE__ */ new Date(`${value}T12:00:00`));
var todayKey = () => {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
function renderSummary(stats) {
  return `<div class="stat stat-lent"><strong>${stats.lentCount}</strong><span>You've lent ${stats.lentCount === 1 ? "1 item" : `${stats.lentCount} items`}</span></div><div class="stat stat-borrowed"><strong>${stats.borrowedCount}</strong><span>You owe back ${stats.borrowedCount === 1 ? "1 item" : `${stats.borrowedCount} items`}</span></div>`;
}
function renderCard(item, history) {
  const direction = directions[item.direction];
  const overdue = !history && item.dueDate !== null && item.dueDate < todayKey();
  const date = history && item.completedAt ? `Completed ${dateLabel(item.completedAt.slice(0, 10))}` : item.dueDate ? `Due ${dateLabel(item.dueDate)}` : "No due date";
  return `<article class="note swap-card" style="--accent:${direction.color}" data-id="${escapeHtml(item.id)}"><div class="card-top"><span class="badge">${direction.label}</span>${overdue ? '<span class="overdue">Overdue</span>' : ""}</div><h3>${escapeHtml(item.name)}</h3><p>${direction.relation} ${escapeHtml(item.person)}</p><div class="card-footer"><span class="date">${date}</span><button class="card-action ${history ? "delete" : ""}" type="button" data-action="${history ? "delete" : "complete"}">${history ? "Delete" : "Mark complete"}</button></div></article>`;
}
function renderActiveList(items) {
  const active = items.filter((item) => item.status === "active").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return active.length ? active.map((item) => renderCard(item, false)).join("") : '<div class="empty"><strong>Nothing tracked yet.</strong><span>Add your first swap and get it out of your head.</span><br><button class="primary" type="button" data-action="add">+ Add swap</button></div>';
}
function renderHistoryList(items) {
  const completed = items.filter((item) => item.status === "completed").sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  return completed.length ? completed.map((item) => renderCard(item, true)).join("") : '<div class="empty"><strong>No completed swaps yet.</strong><span>Finished exchanges will settle here.</span></div>';
}

// src/main.ts
var must = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
};
var form = must("#swap-form");
var formWrap = must("#swap-form-wrap");
var addToggle = must("#add-toggle");
var activeList = must("#active-list");
var historyList = must("#history-list");
var summary = must("#summary");
var errorBox = must("#storage-error");
var toast = must("#undo-toast");
var toastMessage = must("#toast-message");
var undoButton = must("#undo-delete");
var state = emptyState();
var storageError = null;
var pendingDelete = null;
var noticeTimer = null;
function announce(message) {
  if (noticeTimer) clearTimeout(noticeTimer);
  toastMessage.textContent = message;
  undoButton.hidden = true;
  toast.hidden = false;
  noticeTimer = setTimeout(() => {
    if (!pendingDelete) toast.hidden = true;
  }, 3e3);
}
function render() {
  summary.innerHTML = renderSummary(getStats(state.items));
  activeList.innerHTML = renderActiveList(state.items);
  activeList.removeAttribute("aria-busy");
  historyList.innerHTML = renderHistoryList(state.items);
  must("#history-count").textContent = String(state.items.filter((item) => item.status === "completed").length);
  errorBox.textContent = storageError ?? "";
  errorBox.hidden = !storageError;
}
function commit(next, message) {
  state = next;
  storageError = saveState(state);
  render();
  announce(storageError ?? message);
}
function setForm(open) {
  formWrap.hidden = !open;
  addToggle.setAttribute("aria-expanded", String(open));
  if (open) must("#name").focus();
  else addToggle.focus();
}
function makeItem(data) {
  return { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, name: data.name, direction: data.direction, person: data.person, dueDate: data.dueDate, status: "active", createdAt: (/* @__PURE__ */ new Date()).toISOString(), completedAt: null };
}
function showUndo(item, index) {
  if (noticeTimer) clearTimeout(noticeTimer);
  toastMessage.textContent = "Removed from history.";
  undoButton.hidden = false;
  toast.hidden = false;
  const timer = setTimeout(() => {
    toast.hidden = true;
    pendingDelete = null;
  }, 6e3);
  pendingDelete = { item, index, timer };
}
addToggle.addEventListener("click", () => setForm(formWrap.hidden));
must("#cancel-form").addEventListener("click", () => {
  form.reset();
  displayErrors({});
  setForm(false);
});
form.addEventListener("submit", (event) => handleFormSubmit(event, (data) => {
  displayErrors({});
  commit(addItem(state, makeItem(data)), `${data.name} is on your list.`);
  form.reset();
  must("#name").focus();
}, (errors) => {
  displayErrors(errors);
  const first = Object.keys(errors)[0];
  if (first) document.getElementById(first)?.focus();
}));
document.addEventListener("click", (event) => handleListClick(event, (action, id) => {
  if (action === "add") {
    setForm(true);
    return;
  }
  if (!id) return;
  if (action === "complete") {
    const next2 = completeItem(state, id);
    if (next2 !== state) commit(next2, "Marked complete and moved to history.");
    return;
  }
  if (pendingDelete) {
    announce("Use Undo or wait before deleting another item.");
    return;
  }
  const index = state.items.findIndex((item2) => item2.id === id && item2.status === "completed");
  const item = state.items[index];
  if (index < 0 || !item) return;
  const next = deleteItem(state, id);
  state = next;
  storageError = saveState(state);
  render();
  showUndo(item, index);
}));
undoButton.addEventListener("click", () => {
  if (!pendingDelete) return;
  clearTimeout(pendingDelete.timer);
  const { item, index } = pendingDelete;
  pendingDelete = null;
  toast.hidden = true;
  commit(restoreItem(state, item, index), "Restored to history.");
});
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  if (pendingDelete) {
    clearTimeout(pendingDelete.timer);
    pendingDelete = null;
    toast.hidden = true;
  }
  const loaded = loadState();
  state = loaded.state;
  storageError = loaded.error;
  render();
  announce("Updated from another tab.");
});
requestAnimationFrame(() => {
  const loaded = loadState();
  state = loaded.state;
  storageError = loaded.error;
  render();
});
