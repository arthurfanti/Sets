# Testing strategy

Type: grilling
Status: resolved
Blocked by: 01

## Question

What is proven before the app goes on the phone, and by what?

- Unit tests (Vitest) over the pure domain module: estimated 1RM incl. the 1–10 rep window, volume, week bucketing, slug and duplicate matching, and the seed-reference check from `docs/adr/0003`.
- Component tests: worth it for the Set-logging rows, or does that surface only get proven by hand on the phone?
- End-to-end: is none acceptable in v1, and if so what manual checklist replaces it before install?
- Does any test touch IndexedDB (fake-indexeddb), and is the migration path testable at all without real data?
- What is the smallest test set that would have caught each of the five ADRs' failure modes?

Answer with the test layers, the runner config, and the manual pre-install checklist.

## Answer

**Vitest, three layers, no end-to-end suite.**

**1. Pure domain tests (`src/domain/`).** Epley estimated 1RM and its **1–10 rep window** — 11 reps must produce no Best Set at all, not a clamped one; volume as Σ weight × reps; Monday-local week bucketing including a Session on a Sunday night; duplicate normalization across accents, case and collapsed whitespace; slug derivation. Plus the two build-time invariants: every Built-in Routine slug resolves against the Exercise seed (0003), and the numeral pairs clear 7:1 while body pairs clear 4.5:1 (07).

**2. One component test**, React Testing Library: the Set row. Prefill from the Plan, adjust weight and reps, complete, advance the live highlight. It is the hot path and the place a state bug logs the wrong weight silently. No other component test — the rest is judged on the phone, not in jsdom.

**3. Repository tests with `fake-indexeddb`**, four of them: seeding is insert-if-absent and never resurrects a hidden row; delete-all clears all four stores so seeds re-apply on next open; a record written in an older shape still reads under current code; and completing a Session that deviated from its Routine leaves the Routine byte-identical (0004).

**No Playwright.** A browser suite over a service worker and IndexedDB is a second project to maintain, and it still cannot answer the only question that matters — whether logging a Set takes under 30 seconds on the actual phone.

**Mandatory manual checklist, run on the iPhone before install** (a release gate, not a vibe):

1. Install via Add to Home Screen; confirm standalone launch and no browser chrome.
2. Airplane mode on; cold-start the app; confirm it opens.
3. Start a Routine; log three Sets; confirm each persists immediately.
4. Kill the app mid-Session; reopen; confirm it resumes with the live Set where it was left.
5. Finish; confirm History shows the Session with the right duration.
6. Open the Exercise page; confirm Best Set and both charts agree with what was logged.
7. Deploy a new build; confirm the update banner appears and does not appear during a Session.
8. Time step 3 — three Sets in under 90 seconds total.

**What each ADR's failure mode looks like as a test:**

| ADR | Failure mode | Caught by |
| --- | --- | --- |
| 0003 seed in bundle | a Routine names a slug that does not exist | seed-reference test |
| 0004 no write-back | a deviated Session rewrites its Routine | repository test |
| 0006 append-only | an old record becomes unreadable | `fake-indexeddb` shape test |
| 0007 contrast | a colour tweak drops below 7:1 | token test |
| 0002 no native | install or offline behaviour breaks | manual checklist steps 1–2 |
| 0001 no backend | — | not testable; recorded as accepted risk |
