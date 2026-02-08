# Project Instructions for Codex/Agents

## Quick Context
- Repo: Next.js App Router + TypeScript + Tailwind v4
- Architecture: Feature-Sliced Design (FSD)
- Alias: `@/*` -> `src/*`

## Non-Negotiables
- `src/app/` is entry/composition only. Do not put domain logic here.
- Follow FSD layer boundaries and slice isolation.
- Import slices only via their public `index.ts` (no internal deep paths).

## Where Code Goes
- Page section UI: `src/widgets/`
- User actions/scenarios: `src/features/`
- Domain model/types/queries/UI: `src/entities/`
- Shared primitives and infra: `src/shared/`

## API Location Rule
Choose by reuse scope:
1. Single page/widget: keep in that slice.
2. Multiple screens in a feature: `features/<slice>/api`.
3. Cross-feature domain API: `entities/<domain>/api`.

## Commands
- `pnpm dev`
- `pnpm lint`
- `pnpm type-check`
- `pnpm format`

## Ask Before You Act
- Destructive changes (deletions, large refactors).
- Adding or changing external dependencies.
- Modifying CI/CD or Git hooks.

