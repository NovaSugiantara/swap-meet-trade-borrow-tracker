# Repository Instructions

## Before changing code

- Read the parent challenge guide at `~/Project/challenge/AGENTS.md`; its document protocol and commit gates are mandatory here.
- Read `docs/PRD.md`, `docs/SRS.md`, and `docs/DESIGN.md` after the brief. Later documents refine earlier ones; use the SRS `{ items: SwapItem[] }` storage envelope where the PRD's array wording conflicts.
- Use the checked-in `npm` scripts; `npm run verify` runs strict type-checking, tests, and the production bundle.

## Product constraints

- Swap Meet is a mobile-first single-page browser app for tracking lent, borrowed, and swapped items.
- Persistence is browser `localStorage` only. No backend, authentication, or application network calls are in scope.
- The storage key is `swap-meet-v1`, containing `{ items: SwapItem[] }`; missing or corrupt JSON falls back to `{ items: [] }`.
- User-facing copy should be friendly and direct, use second person and contractions, and avoid passive voice.

## Expected boundaries

- The SRS draft defines `src/types.ts`, `src/store.ts`, `src/ui.ts`, `src/handlers.ts`, and `src/main.ts`. Keep types, storage/domain logic, pure rendering, event handlers, and bootstrap wiring in those responsibilities rather than one global file.
- Use delegated list events with `data-action` and the closest card's `data-id`; re-render through one application state path after mutations.
- Keep validation errors visible beside the relevant fields and preserve keyboard access; direction must not be communicated by color alone.

## Change and commit hygiene

- The parent guide requires one working feature per commit, a 25 KB raw app-source cap, visible undo for deletes, and runnable tests. Measure source size before each source commit.
- `docs/` is intentionally untracked. Stage implementation paths explicitly and leave `docs/` uncommitted; do not use `git add -A`.
