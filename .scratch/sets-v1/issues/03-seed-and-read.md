# 03: Seed the library and read the Routines

**What to build:** On first open, the app's Built-in Routines and the Exercise library land in the device database, and Home lists them for real. After this ticket the app is useful to look at and the read path is real.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] First open seeds the Exercises and Built-in Routines; a reload shows the same rows and does not duplicate them.
- [ ] Seeding is version-gated and insert-if-absent: an existing row is never rewritten and a deleted one is never resurrected.
- [ ] Home lists "Rotinas prontas" above "Minhas rotinas", each row naming the Routine and a muted summary of its Exercises.
- [ ] Home with zero Sessions shows a defined empty state — one short sentence in Portuguese and at most one action — not a blank list.
- [ ] A Routine row that references a missing Exercise does not render a dangling summary.
- [ ] The muscle-group order used by the picker is fixed: Peito, Costas, Ombros, Quadríceps, Posteriores, Panturrilha, Bíceps, Tríceps, Abdômen.
