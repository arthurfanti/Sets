# Sets — v1

Status: ready-for-agent

## Problem Statement

Strength training is logged between sets, at a rack, with a bar still loaded and about ninety seconds of attention. Nothing on the phone is built for that moment: notes apps need typing a full sentence, spreadsheets need the keyboard, and the serious training apps are cloud-first — accounts, sync, subscriptions, and screens designed for browsing rather than for the two seconds after a set.

The result is predictable. The log gets skipped for one session, then a week, then it is abandoned and the lifter has no idea whether they are stronger than three months ago.

## Solution

A phone-installed web app, in Brazilian Portuguese, that opens offline, shows the Routines you actually train, and lets you log a Set in a few taps because the weight and reps are already filled in from last time. Finish the Session and it is in your history, and every Exercise quietly keeps its own best Set, estimated 1RM trend and weekly volume.

No account, no server, no subscription, no onboarding. The app is called **Sets** and it lives on the home screen, next to the things you actually use. Data stays on the device, which means it is fast and private — and means the app has to be honest that there is no backup.

## User Stories

1. As a Lifter, I want to install the app to my iPhone home screen, so that it opens standalone and my training history is protected from Safari's storage eviction.
2. As a Lifter, I want the app to open with no network, so that a basement gym's dead signal changes nothing.
3. As a Lifter, I want the app to open directly on my Routines, so that starting a Session is one tap from launch.
4. As a Lifter, I want Built-in Routines to be there on first launch, so that I can train before I have configured anything.
5. As a Lifter, I want my own Routines listed beneath the Built-in ones, so that I can tell what shipped with the app from what I wrote.
6. As a Lifter, I want each Routine row to name its Exercises, so that I can pick between them without opening them.
7. As a Lifter, I want to start a Session by tapping a Routine, so that I do not navigate before I train.
8. As a Lifter, I want a new Session's Sets pre-filled with the weight and reps I did last time at that index, so that the common case needs no typing.
9. As a Lifter, I want pre-filled values to look different from values I have confirmed, so that I can tell a guess from a logged Set at a glance.
10. As a Lifter, I want to adjust weight and reps with large controls, so that sweaty thumbs do not fight the interface.
11. As a Lifter, I want to type an exact number when the steppers are too coarse, so that a 92.5 kg set is possible.
12. As a Lifter, I want to confirm a Set with one tap, so that the next Set becomes the active one automatically.
13. As a Lifter, I want the active Set to be visually unmistakable, so that I never log into the wrong row.
14. As a Lifter, I want to log an Exercise that is not in the Plan, so that an unplanned movement is still recorded.
15. As a Lifter, I want to skip a prescribed Set without a dialog, so that an interrupted set costs no taps.
16. As a Lifter, I want every Set written to the device the moment I confirm it, so that killing the app mid-Session loses nothing.
17. As a Lifter, I want to reopen the app after it was killed and find the Session where I left it, so that a phone call does not end my workout.
18. As a Lifter, I want a Session left open overnight to be brought back to my attention rather than silently closed, so that I can continue or finish it deliberately.
19. As a Lifter, I want finishing a stale Session to end at my last logged Set, so that the recorded duration is not a lie about three days.
20. As a Lifter, I want exactly one Session active at a time, so that the app never has to guess which one I mean.
21. As a Lifter, I want to change the weight mid-Session without that rewriting my Routine, so that my program stays the program I wrote.
22. As a Lifter, I want to finish a Session and see it in my history immediately, so that the log is trustworthy.
23. As a Lifter, I want history grouped by month with duration and Set count per Session, so that I can see adherence at a glance.
24. As a Lifter, I want to expand a Session in history to see its Sets, so that I can check what I actually did without a separate screen.
25. As a Lifter, I want to correct a typo in a past Set's weight or reps, so that one mistake does not corrupt my progress.
26. As a Lifter, I want to delete a Session I logged by mistake, so that it stops counting toward volume.
27. As a Lifter, I want an Exercise page showing my Best Set, so that I know my headline number without computing it.
28. As a Lifter, I want an estimated 1RM trend line, so that progress is visible even when the weight has not changed.
29. As a Lifter, I want weekly volume as a secondary chart, so that I can see whether I am doing more work over time.
30. As a Lifter, I want to switch the charts between 12 weeks and all time, so that I can check this block or my whole history.
31. As a Lifter, I want the Exercise page reachable from a Session I just finished, so that the reward for logging is one tap away.
32. As a Lifter, I want to create a Routine with ordered Exercises and prescribed sets and reps, so that my program exists in the app.
33. As a Lifter, I want to add an Exercise to a Routine through a searchable picker grouped by muscle, so that I find "Supino inclinado" without scrolling a wall.
34. As a Lifter, I want to create an Exercise that does not exist yet from inside the picker, so that I never have to leave the flow to log what I did.
35. As a Lifter, I want the app to refuse a duplicate Exercise name, so that I do not end up with "Supino" and "supino" split across my history.
36. As a Lifter, I want to rename my own Exercise and have history follow the rename, so that a typo gets fixed everywhere at once.
37. As a Lifter, I want to delete my own Exercise without destroying the Sets that used it, so that cleaning up the picker never rewrites history.
38. As a Lifter, I want Built-in Exercises to be unchangeable, so that the shared seed stays trustworthy.
39. As a Lifter, I want editing a Built-in Routine to create my own copy, so that my edits survive an app update.
40. As a Lifter, I want new Built-in Routines and Exercises to appear after an update without overwriting mine, so that updates are not a trade-off.
41. As a Lifter, I want the app to keep working after an update without my data moving, so that a release is never a risk to my history.
42. As a Lifter, I want to be told a new version is available rather than have the screen reload under me, so that an update never lands between Sets.
43. As a Lifter, I want the update notice to wait until I have finished training, so that it is not a distraction at the rack.
44. As a Lifter, I want to see how much history exists before I delete it, so that the irreversible action is not abstract.
45. As a Lifter, I want delete-all to require typing a word, so that a mistap cannot end my history.
46. As a Lifter, I want to be told plainly that there is no backup and that deleting the home-screen icon deletes my history, so that I cannot lose everything without having been warned.
47. As a Lifter, I want the app to refuse to start rather than pretend to save, if the device will not let it store anything, so that I never train into a void.
48. As a Lifter, I want a way out of that failure that works even if the database is corrupt, so that the app can never become permanently unusable.
49. As a Lifter, I want a failed write mid-Session to keep my Sets and tell me, so that a full disk does not silently delete my workout.
50. As a Lifter, I want to keep logging while a write is retrying, so that the workout is not held hostage by the bug.
51. As a Lifter using VoiceOver, I want the weight and rep controls labelled, so that I can log a Set without seeing the screen.
52. As a Lifter using VoiceOver, I want a confirmation announced when a Set is logged, so that I know it took.
53. As a Lifter, I want the numbers on screen to be unmistakable, so that 100 and 10 are never confused at a glance.
54. As a Lifter, I want the app in Portuguese, so that I am not translating mid-set.
55. As a Lifter, I want the app to open instantly and feel native, so that it does not cost me the window between sets.

## Implementation Decisions

**Stack and shape.** Vite + React + TypeScript, single package on npm, deployed as a static site. Five modules with one rule each: a pure domain module (estimated 1RM, volume, week bucketing, slug and duplicate matching, no React), a seed-data module, a database module owning all persistence, a UI module of components and CSS modules, and an app module for routing and composition. UI talks to repositories; it never touches a database handle.

**Routing.** `react-router` with `HashRouter` over five routes — home, session, routine editor, history, exercise. Hash routing exists for the back gesture, not for URLs: an installed PWA hides them, and it removes any dependence on a server-side rewrite rule.

**Storage.** IndexedDB through a thin promise wrapper (`idb`), four stores: exercises, routines, sessions, meta. **Sets are nested inside their Session document** — one atomic write per change, no join, because nothing queries Sets across Sessions except one Exercise's chart.

**Identity.** Seeded Exercises and Built-in Routines use their slug as id. Anything the Lifter creates uses a prefixed UUID (`usr_`, `rot_`), Sessions use `ses_`. The prefixes make collisions structurally impossible and mean renaming never changes an id.

**Migrations are additive-only, reads are tolerant.** A new field never triggers a store rewrite; every read treats a missing field as its default. A destructive rewrite, if ever needed, must first copy the affected store to a backup store inside the same upgrade transaction and drop it only after a successful launch. This is forced by having no export.

**Seeding is version-gated and insert-if-absent.** `meta.seedVersion` is compared to a bundled constant. Existing rows are never updated and deleted rows are never resurrected.

**Times.** Stored as epoch milliseconds; bucketed into days and weeks at render time in the device's local zone. A week is Monday 00:00 → Sunday 23:59, labelled by its Monday. Sessions can only start now — no backdating.

**Session lifecycle.** One active Session at a time. Every Set persists on confirm. An **empty Session** can be started from the Session list with no Routine, and therefore no Plan — it is the fallback when nothing fits. A Session left open across a local date boundary is surfaced on the next launch as still open, offering Continue or Finish; Finish sets `endedAt` to the last logged Set's timestamp. An empty finished Session records duration 0 and is discardable. `startedAt` is immutable; Set values are editable; Exercises cannot be added to or removed from a finished Session.

**Pre-fill.** A Set slot pre-fills from the Set at the **same index** in the most recent finished Session containing that Exercise, walking back at most five Sessions; if that Session logged fewer Sets, its last Set for the Exercise is used. Reps come from history, not from the Plan's lower bound. **History beats a User Routine's target weight**, which serves only as a fallback when there is no history. No staleness decay. Pre-filled values render muted; confirmed values render at full contrast.

**Chart semantics.** Best Set is the Set with the highest **estimated 1RM (Epley)**, computed only for Sets of 1–10 reps; Sets outside that window are recorded but never headline. Heaviest weight is a secondary stat. Volume is Σ weight × reps. Charts are hand-rolled SVG, no charting dependency, one 12-week/all-time toggle.

**Design system.** Dark only. System font stack, no webfonts, tabular numerals everywhere. Spacing on a 4/8/12/16/24/32 scale, 12px radius, 48px minimum touch target, primary action 56–64px pinned within thumb reach. Surfaces are separated by a two-step background ramp plus 1px low-alpha borders — no shadows, no blur. **Violet `#B26BFF` is interaction only** (the active Set's marker bar, the primary action, focus rings); **magenta `#F72585` is data only** (chart lines, Best Set dot); neither ever sits behind a weight or rep numeral, which are always `#EDEFF2` at 7:1 or better. Body text clears 4.5:1.

**Copy.** All UI copy in **pt-BR**; the app name stays English. Vocabulary is fixed and follows the glossary: **Rotina, Sessão, Plano, Série, Melhor série, Exercício, Carga**. The word **"treino" is banned** in both languages because it names both Routine and Session.

**Exercise taxonomy.** Seeded Exercises carry only slug, name, muscle group and optional aliases. Nine groups in fixed order: Peito, Costas, Ombros, Quadríceps, Posteriores, Panturrilha, Bíceps, Tríceps, Abdômen. ~55 Exercises ship with the app; four Built-in Routines reference only seeded slugs, and a build-time check fails on any unresolved reference.

**Custom Exercises.** Created inline from the picker via a name-prefilled sheet with nine group chips and **no default group**. Duplicate detection normalizes case, accents and whitespace; an exact match blocks creation and offers the existing row, a near match only warns. Renaming is retroactive because Sets reference by id. Deletion is a soft delete (`hiddenAt`): gone from the picker, still resolvable in history. Built-in Exercises are neither renamable nor hideable.

**Offline and updates.** `vite-plugin-pwa` with `generateSW`, precaching the entire build; no runtime caching, because the app makes no network requests. Updates are **prompted, never silent**, and the notice is fully suppressed while a Session is active, appearing only after Finish or Discard. The waiting worker makes the swap atomic.

**Delivery.** Cloudflare Pages, project `sets`, at `sets.pages.dev`, deployed by CLI; GitHub repo with CI on push using the identical build, with the manual command retained as an escape hatch. `_headers` serves hashed assets as immutable and forces `no-cache` on `sw.js`, `index.html` and the manifest — hashing cannot fix those three, and headers alone would re-download the bundle every launch.

**Failure surfaces.** If the database **refuses to open**, the app does not start: a blocking screen names the cause (another open instance / no disk space / unknown or corrupt) and always offers Retry plus a destructive reset confirmed by typing `apagar`, so a corrupt database can never brick the app. Ephemeral-but-working storage is undetectable and is not treated as an error. A write that fails mid-Session retries once, then shows a persistent non-dismissable bar while Sets are held in memory and logging continues; Finish flushes, and refuses to close if the flush fails.

**Storage honesty.** `navigator.storage.persist()` is requested silently at launch; the result is reported only in an About view reached from a muted link on Home, which shows counts rather than bytes, the persistence state, the no-backup sentence, and delete-all. Delete-all clears every store behind a typed `apagar` and returns the app to first-run state.

## Testing Decisions

A good test asserts external behaviour at a seam the app already has; it does not reach into a module's internals, and it fails for exactly one reason.

- **Domain functions are called directly** — no fakes, no doubles. Epley 1RM and its 1–10 rep window (11 reps must yield no Best Set, not a clamped one), volume, Monday-local week bucketing including a Sunday-night Session, duplicate normalization across accents/case/whitespace, slug derivation.
- **The repository boundary** is the single seam over persistence, tested with an in-memory IndexedDB implementation: seeding is insert-if-absent and never resurrects a hidden row; delete-all clears all four stores so seeds re-apply; a record written in an older shape still reads under current code; and a Session that deviated from its Routine leaves the Routine byte-identical.
- **One component seam**, the Set row: prefill, adjust, confirm, advance the active highlight.
- **Two build-time invariants**: every Built-in Routine slug resolves against the Exercise seed, and the design tokens satisfy the 7:1 numeral and 4.5:1 body contrast floors.
- **No end-to-end suite.** A browser suite over a service worker and IndexedDB is a second project to maintain and still cannot answer whether logging is fast on the phone.
- **A manual iPhone checklist is a release gate**: install and confirm standalone launch; airplane mode and cold start; log three Sets; kill mid-Session and resume; finish and check history; check the Exercise page agrees; deploy and confirm the update banner appears only outside a Session; and time three Sets.

## Out of Scope

Rest timer. Export, import, backup or restore. Pounds and any unit toggle. Accounts, sync, backend, multi-device. Wearables, Apple Health, Health Connect. Social, sharing, leaderboards. Nutrition and bodyweight tracking. Program generation, periodization, deload logic. Native app and App Store distribution. Per-Set variation inside a Routine (supersets, drop sets, per-Set targets). Editing a finished Session's Plan. Light theme. A settings screen.

## Further Notes

- `GLOSSARY.md` and `docs/adr/0001`–`0006` are the authoritative record; this spec is the synthesis, not the source.
- Five designed screens live in `docs/design/stitch/` with `DESIGN.md` as the rule set. Four generation defects are recorded in the map's ticket 09 and are **overridden by this spec**: a violet bar on a historical Set, an invented "Registrar nova série" action, a duplicate Save in the editor, and inconsistent sample data.
- Three questions are deliberately left to implementation rather than decided here: the zero-Session first-run state, accessibility specifics (control labels, focus order in a Set row, the VoiceOver announcement on confirming a Set), and the bundle-size budget measured on a mid-range phone.
- The no-backup decision is accepted, recorded in `docs/adr/0001`, and is the reason storage honesty is a feature rather than an afterthought.
