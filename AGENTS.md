# Repository Instructions

## Before changing code

- Read the parent challenge guide at `~/Project/challenge/AGENTS.md`; its document protocol and commit gates are mandatory here.
- Read `docs/BRIEF.md` and `docs/SRS.md`. `docs/PRD.md` is currently empty and `docs/DESIGN.md` is missing, so do not invent requirements or start implementation until that gap is resolved.
- This repository currently has only a placeholder `README.md`, no package manifest/lockfile, and no verified build, test, lint, formatter, CI, or OpenCode command. Do not assume `npm` scripts; inspect again after the toolchain is added.

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
- `docs/` is currently untracked. For the repository-bootstrap change, stage `AGENTS.md` explicitly and leave `docs/` untouched and uncommitted; do not use `git add -A`.
