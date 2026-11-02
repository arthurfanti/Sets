# v1 PWA on your phone

## Destination

A deployed v1 of the workout tracker, installed to the Lifter's phone and usable at the gym: start a Routine, log Sets in seconds, finish, and later see per-Exercise progress. This map resolves the decisions still standing between the settled design and that install — it does not write the app.

## Notes

- **Spec published:** [spec.md](spec.md) collapses this map's decisions into the buildable plan. The map's job ends there.
- The design is already settled by a full grilling session. `GLOSSARY.md` and every file in `docs/adr/` are authoritative; do not re-litigate them, extend them.
- Read `docs/agents/domain.md` before exploring. Vocabulary is fixed: Exercise, Routine, Built-in Routine, User Routine, Session, Plan, Set, Best Set, Lifter.
- Every session consults `grilling` and `domain-modeling`. Prototype tickets consult `prototype`.
- Planning only. No ticket writes app code; the build is executed after the map closes, via `/to-spec` and `/to-tickets`.
- Stack is fixed: Vite + React + TypeScript, IndexedDB, no backend, kilograms as bare numbers.
- New decisions that qualify as ADRs (hard to reverse, surprising, real trade-off) get written to `docs/adr/` at resolution time.

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [UI system, styling and the numeral treatment](issues/06-ui-system-and-styling.md): CSS Modules over one tokens file, dark-only, system font stack with tabular numerals, AA floor but 7:1 on every number, 4 px spacing scale, 48 px targets, one accent reserved for the live Set and the primary action, borders instead of shadows.

- [App identity](issues/07-app-identity.md): name `Sets` with pt-BR copy throughout, `treino` banned in both languages, a single 3×5 SVG icon exported to four sizes, violet `#B26BFF` for interaction and magenta `#F72585` for data only, neither ever carrying a numeral, manifest standalone/portrait on `#0B0D10`.

- [Stitch access repaired](issues/14-stitch-access.md): dead API key replaced in the MCP config; `list_projects` succeeds and the remote server is usable.

- [All five screens — design](issues/09-session-and-exercise-screens.md): five Stitch screens generated from `docs/design/DESIGN.md` and exported to `docs/design/stitch/`; no sixth screen for a finished Session (History rows expand in place), one save affordance in the editor, and violet confined to the live Set and the primary action.

- [Exercise taxonomy and seed schema](issues/08-exercise-taxonomy.md): three fields only (`slug`, `name`, `muscleGroup`, plus optional `aliases`), ~55 Exercises, nine fixed groups with legs split into Quadríceps / Posteriores / Panturrilha, and accent-insensitive duplicate detection.

- [Exercise seed list and built-in Routine content](issues/11-seed-content.md): 55 Exercises across the nine groups plus four Built-in Routines, sourced from ExRx body-area lists, all 22 cross-references verified, six placements flagged as judgment.

- [Repo skeleton and module boundaries](issues/01-repo-skeleton.md): one Vite app on npm, five folders (`domain`/`data`/`db`/`ui`/`app`) with UI importing repositories and never IndexedDB, `react-router` HashRouter for the back gesture, Biome plus a strict `tsc --noEmit`.

- [Persistence layer and schema evolution](issues/04-persistence-and-migrations.md): `idb` with four stores and Sets nested inside the Session document, slug ids for seeds and `usr_`/`ses_` prefixed UUIDs for user data, additive-only migrations with tolerant reads, version-gated insert-if-absent seeding.

- [Date, week and Session boundaries](issues/05-date-and-session-boundaries.md): epoch-ms instants bucketed locally at render, Monday-start weeks, no backdating, no auto-close for a stale Session (prompt to continue or finish, ending at the last logged Set), deletable but date-immutable finished Sessions.

- [Offline, install and update behaviour](issues/02-offline-and-updates.md): `vite-plugin-pwa` with `generateSW`, precache everything with no runtime caching, and a prompted update that never fires mid-Session.

- [Deploy target and install path](issues/03-deploy-and-install.md): Cloudflare Pages project `sets` at `sets.pages.dev` with GitHub CI on push plus a manual escape hatch, install via Safari Add to Home Screen (which is what exempts the app from the seven-day storage cap), and a `_headers` policy of immutable hashed assets with no-cache on `sw.js`, `index.html` and the manifest.

- [Storage persistence, the About view and delete-all](issues/13-storage-and-delete.md): silent `persist()` at launch with the state disclosed only in About, counts instead of bytes, one plain no-backup sentence naming the icon hazard, and a delete-all that clears every store behind a typed `apagar`.

- [Custom Exercise creation and naming rules](issues/10-custom-exercise-flow.md): creation inline in the picker via a name-prefilled sheet with no default group, retroactive renaming, soft delete through `hiddenAt`, and built-in Exercises immutable.

- [Testing strategy](issues/12-testing-strategy.md): Vitest over the pure domain plus two build-time invariants, exactly one component test (the Set row), four `fake-indexeddb` repository tests, no Playwright, and a mandatory eight-step iPhone release checklist that includes timing the logging.

- [Pre-fill rules for a Set](issues/15-prefill-rules.md): same-index seeding, walking back at most five finished Sessions, history beating the Routine's target weight, no staleness decay, and suggested values muted until confirmed.

- [Failure surfaces](issues/16-failure-surfaces.md): a blocking screen only when the database refuses to open, always with a typed-`apagar` reset so it can never brick, and a mid-Session write failure that holds Sets in memory, retries, warns persistently, and blocks Finalizar rather than losing them.

## Not yet specified

<!-- in-scope fog, not sharp enough to ticket -->

- First-run experience with zero Sessions: what the home screen shows before any history exists.
- Accessibility beyond layout: labels for the weight and rep controls, focus order inside a Set row, and what a screen reader announces when a Set completes. (Target sizes, thumb reach and the contrast floor are settled by the UI-system ticket.)
- Bundle-size and first-paint budget on a mid-range phone.

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->

- Rest timer — explicitly cut in grilling.
- Light theme — dark only in v1; a second surface set is a post-v1 change, not a preference toggle deferred to later.
- Export/import, backup and restore — the JSON feed is authoring input, not a user format. Recorded as accepted risk in `docs/adr/0001`.
- Pounds and any unit toggle — `docs/adr/0005`.
- Accounts, sync, backend, multi-device.
- Wearable and Apple Health / Health Connect integration.
- Social, sharing, leaderboards.
- Nutrition and bodyweight tracking.
- Program generation, periodization, deload logic.
- Native app and app-store distribution — `docs/adr/0002`.
- Per-Set variation inside a Routine (supersets, drop sets, per-set targets).
- Editing a past Session's Plan.
