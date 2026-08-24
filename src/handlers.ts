import type { Direction, FormErrors, SwapFormData } from "./types.ts";

const validDirections: Direction[] = ["lent", "borrowed", "swapped"];

export function validateForm(data: SwapFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = "Name the item you're tracking.";
  if (!validDirections.includes(data.direction as Direction)) errors.direction = "Choose lent, borrowed, or swapped.";
  if (!data.person.trim()) errors.person = "Add the other person's name.";
  return errors;
}

export function handleFormSubmit(event: SubmitEvent, onValid: (data: SwapFormData) => void, onErrors: (errors: FormErrors) => void): void {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const values = new FormData(form);
  const data: SwapFormData = {
    name: String(values.get("name") ?? "").trim(),
    direction: String(values.get("direction") ?? "") as Direction | "",
    person: String(values.get("person") ?? "").trim(),
    dueDate: String(values.get("dueDate") ?? "") || null,
  };
  const errors = validateForm(data);
  if (Object.keys(errors).length) onErrors(errors); else onValid(data);
}

export function handleListClick(event: MouseEvent, onAction: (action: "add" | "complete" | "delete", id: string | null) => void): void {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "add") onAction("add", null);
  if (action === "complete" || action === "delete") onAction(action, button.closest<HTMLElement>("[data-id]")?.dataset.id ?? null);
}

export function displayErrors(errors: FormErrors): void {
  for (const field of ["name", "direction", "person"] as const) {
    const input = document.getElementById(field), output = document.getElementById(`${field}-error`);
    const message = errors[field] ?? "";
    input?.setAttribute("aria-invalid", message ? "true" : "false");
    if (output) output.textContent = message;
  }
}
