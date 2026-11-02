# Storage persistence, the About view and delete-all

Type: grilling
Status: resolved
Blocked by: 04

## Question

There is no backup, so the only levers are persistence and honesty.

- When does the app call `navigator.storage.persist()` — silently on first run, or after the first finished Session? What happens when it is refused (iOS Safari commonly declines)?
- Should storage usage be surfaced at all, and if so in what unit and where? A number that says "2.1 MB" teaches the Lifter nothing.
- The About/Storage view: what it contains beyond delete-all, and how it is reached from the home screen.
- Delete-all: what the confirmation says, what destructive number it names (Session count? date range?), and whether a typed confirmation is warranted.
- The icon-deletion hazard: deleting the Home Screen icon destroys the data store outright, and nothing in the app can prevent or recover it. Does the About view say so, and does delete-all point at it?
- Is the no-backup risk stated anywhere in-app, or deliberately kept out of the product surface? `docs/adr/0001` records it; decide whether the Lifter sees it.

Answer with the persist policy, the About view contents, and the exact confirmation copy.

## Answer

**Persistence is requested silently at launch**, before any Session can exist, via `navigator.storage.persist()`. If it is refused there is no prompt, no nag and no first-run banner — the state is disclosed once, in About.

**The About view is reached from a muted "Sobre" text link at the bottom of the Home screen**, under the Routine list and above the pinned button. Not a second header link: Histórico already owns that corner.

About contains, in this order:

- App name and version.
- **Armazenamento: Protegido** or **Não protegido** — the persistence state, in those words.
- Counts, never bytes: "38 sessões · 55 exercícios · desde 12 ago". `navigator.storage.estimate()` is not called at all; megabytes teach the lifter nothing about what is at risk.
- One plain sentence: **"Não há backup: se você apagar o Sets da tela de início, o histórico vai junto."**
- The delete-all row, visually destructive.

**Delete-all clears every store** — Sessions, custom Exercises, User Routines, `meta` — returning the app to first-run state, with seeds re-applied on the next open. No partial "clear history but keep routines": that leaves ornaments pointing at nothing.

**Friction is exactly two steps plus a typed word.** The dialog reads:

> **Apagar tudo?**
> 38 sessões, desde 12 ago, serão apagadas. Não há como desfazer.
> Digite **apagar** para confirmar.

The confirm button stays disabled until the word matches. Every other confirmation in the app stays a single tap; this is the only irreversible action, so it is the only one that costs typing.
