import test from "node:test";
import assert from "node:assert/strict";
import { validateForm } from "../src/handlers.ts";
import { addItem, completeItem, deleteItem, getStats, loadState, parseState, restoreItem, saveState, STORAGE_KEY } from "../src/store.ts";
import type { AppState, SwapItem } from "../src/types.ts";
import { renderActiveList } from "../src/ui.ts";

const item = (overrides: Partial<SwapItem> = {}): SwapItem => ({ id: "1", name: "Drill", direction: "borrowed", person: "Priya", dueDate: null, status: "active", createdAt: "2026-08-24T00:00:00.000Z", completedAt: null, ...overrides });

test("validation reports each required field", () => {
  assert.deepEqual(validateForm({ name: " ", direction: "", person: "", dueDate: null }), {
    name: "Name the item you're tracking.", direction: "Choose lent, borrowed, or swapped.", person: "Add the other person's name.",
  });
  assert.deepEqual(validateForm({ name: "Tent", direction: "lent", person: "Marcus", dueDate: null }), {});
});

test("storage handles missing, corrupt, valid, and failed writes", () => {
  assert.deepEqual(parseState(null), { state: { items: [] }, error: null });
  assert.ok(parseState("not json").error);
  const state: AppState = { items: [item()] };
  assert.deepEqual(parseState(JSON.stringify(state)), { state, error: null });
  assert.ok(loadState({ getItem: () => { throw new Error(); }, setItem: () => {} }).error);
  assert.ok(saveState(state, { getItem: () => null, setItem: () => { throw new Error(); } }));
  const values = new Map<string, string>();
  const memory = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  assert.equal(saveState(state, memory), null); assert.equal(values.get(STORAGE_KEY), JSON.stringify(state));
  assert.deepEqual(loadState(memory), { state, error: null });
});

test("CRUD and summary keep one immutable state path", () => {
  const first = item(); const second = item({ id: "2", direction: "lent" });
  const added = addItem({ items: [first] }, second);
  assert.deepEqual(added.items.map(value => value.id), ["2", "1"]);
  const completed = completeItem(added, "1", "2026-08-25T00:00:00.000Z");
  assert.equal(completed.items[1]?.status, "completed");
  assert.deepEqual(getStats(completed.items), { lentCount: 1, borrowedCount: 0 });
  assert.equal(completeItem(completed, "missing"), completed);
  const removed = deleteItem(completed, "1");
  assert.deepEqual(restoreItem(removed, completed.items[1]!, 1), completed);
});

test("rendering escapes user content", () => {
  const html = renderActiveList([item({ name: '<img src=x onerror="alert(1)">', person: "A & B" })]);
  assert.doesNotMatch(html, /<img/); assert.match(html, /&lt;img/); assert.match(html, /A &amp; B/);
});
