# Sets

A personal strength-training log for one lifter, built for the ninety seconds between sets. Phone-first, installed to the home screen, offline, no account. All copy is pt-BR.

## Run it

Requires Node 24 and npm.

```sh
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Biome check (format + lint) |
| `npm run test` | Vitest, one run |

## Shape

| Module | Holds | Rule |
| --- | --- | --- |
| `src/domain/` | Types and pure functions | No React, fully unit-testable |
| `src/data/` | Seed JSON: Exercises and Built-in Routines | Input to the build, never imported by UI |
| `src/db/` | Storage and repositories | The only place a database handle exists |
| `src/ui/` | Components and CSS modules | Imports repositories, never storage |
| `src/app/` | Router and composition | No domain logic |

Routing is hash-based on purpose: the phone's back gesture must return to the previous screen, and the deploy needs no rewrite rule.

## Where the design lives

- `GLOSSARY.md` — the vocabulary, English term paired with its pt-BR label. "Treino" is banned: it means both Routine and Session.
- `docs/adr/` — decisions that are hard to reverse and would look surprising without context.
- `.scratch/v1-pwa/spec.md` — the buildable plan behind the current work.
- `docs/design/stitch/` — the designed screens and `DESIGN.md`, the token and copy rules.

Work is tracked in GitHub issues.
