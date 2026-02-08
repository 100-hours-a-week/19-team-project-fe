# Agent Guidance (Project-Level)

This repository uses Next.js App Router with Feature-Sliced Design (FSD). Keep
instructions here stable and low-churn. Put task-specific priorities in chat.

## Stack Snapshot
- Next.js App Router (Next.js 16)
- React 19 + TypeScript (strict)
- Tailwind CSS v4
- TanStack Query, Zustand
- Path alias: `@/*` -> `src/*`

## Folder Architecture (FSD)
- `src/app/`: Entry layer only (routing, composition, server/client boundary).
- `src/widgets/`: Page sections composed from multiple features/entities.
- `src/features/`: User actions/scenarios (UI + state + API together).
- `src/entities/`: Domain models/types/queries/UI used by multiple features.
- `src/shared/`: Domain-agnostic UI, libs, configs, infra.

### Dependency Rules (Critical)
- Layers depend downward only: `app` -> `widgets` -> `features` -> `entities` ->
  `shared`.
- Slices in the same layer must not depend on each other directly.
- External imports must use each slice's public `index.ts` (no deep imports).

## API Placement Rules
Place API code based on reuse scope:
- Page/widget-only API: inside that slice.
- Feature-wide API: `features/<slice>/api`.
- Cross-feature domain API: `entities/<domain>/api`.

## Commands
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Type check: `pnpm type-check`
- Format: `pnpm format` (scoped to `src/**/*.{ts,tsx,js,jsx,css,md,json}`)

## Commit Hooks
Husky runs `pnpm format && pnpm lint` on pre-commit and commitlint on
`commit-msg`. Use conventional commit types:
`build, chore, content, docs, feat, fix, refactor, style, test, deploy`.

