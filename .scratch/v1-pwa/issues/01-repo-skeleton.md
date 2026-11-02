# Repo skeleton and module boundaries

Type: grilling
Status: resolved

## Question

What is the physical shape of the repo, before any feature code lands?

- Single Vite app, or a `packages/` split? (Nothing here justifies a monorepo; confirm and record.)
- Where does the pure domain logic live so it can be unit-tested without React — a `src/domain/` holding estimated 1RM, volume, week bucketing, and slug rules?
- Where do the seed JSON files live, and how do they reach the bundler?
- Navigation: react-router, or a hand-rolled screen state machine? The app has roughly four screens (home/routines, session, history, exercise); a router may be more machinery than the app earns.
- Path aliases, module resolution, and formatting/lint tooling: Biome or ESLint + Prettier.

Answer as a decided layout with the reasoning for the router question, since that one is a real fork.

## Answer

**One Vite app, one package, npm.** No monorepo: nothing here has an independent release or a shared consumer, and a `packages/` split would buy only ceremony.

**Folders, each with one rule:**

| Folder | Holds | Rule |
| --- | --- | --- |
| `src/domain/` | estimated 1RM, volume, week bucketing, slug and duplicate matching | pure TypeScript, imports no React, unit-tested |
| `src/data/` | `exercises.json`, `routines.json` | seed input only, never imported by `ui/` |
| `src/db/` | IndexedDB open/upgrade, seeding, repositories | the only place that touches a database handle |
| `src/ui/` | React components and `.module.css` | imports repositories from `db/`, never raw IndexedDB |
| `src/app/` | router, shell, providers | composition only, no domain logic |

`@/` aliases `src/`.

**Routing: `react-router` with `HashRouter`.** Five routes — `/`, `/sessao/:id`, `/rotina/:slug`, `/historico`, `/exercicio/:slug`. The choice is about the back gesture, not URLs: with no router, swiping back from a Session exits the app. Hash routing also means no SPA fallback rule has to be configured on whatever host 03 chooses, and an installed PWA hides the hash anyway.

**Tooling: Biome for lint and format, `tsc --noEmit` for types**, with `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Two commands, and `noUncheckedIndexedAccess` is the flag that matters most: this app indexes into Sets constantly.
