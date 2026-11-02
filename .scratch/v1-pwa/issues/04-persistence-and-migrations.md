# Persistence layer and schema evolution

Type: grilling
Status: resolved

## Question

With no export and no backup, a bad schema change destroys the Lifter's entire history. What is the storage design?

- Raw IndexedDB, or the `idb` wrapper (~1 kB, promises, typed stores)? `localStorage` is out: Sessions and Sets outgrow it.
- Object stores and keys: `exercises` (slug or generated id), `routines`, `sessions` (with Sets nested or in their own store), `meta` (seed version applied, schema version).
- Where the seed slugs live versus user-generated ids, and how the two namespaces never collide.
- Schema versioning: a `version` field on the database plus per-record `schemaVersion`? What runs on upgrade, given insert-if-absent seeding from `docs/adr/0003`?
- Is a Set written in its own transaction the instant it is logged, so a kill mid-write cannot lose the Session?

Answer with the store list, the key strategy, and the upgrade procedure, including what happens when an old record's shape is unknown.

## Answer

**`idb` over raw IndexedDB**, four stores, `sessions` indexed on `startedAt`:

| Store | Key | Holds |
| --- | --- | --- |
| `exercises` | `id` | seeded rows and user-created rows |
| `routines` | `id` | Built-in and User Routines |
| `sessions` | `id` | the Session **including its Sets, nested** |
| `meta` | key string | `schemaVersion`, `seedVersion` |

**Sets are nested inside their Session**, not a separate store. One `put` rewrites a ~3 KB document atomically; a separate store would mean a transaction per Set plus a join on every read, for a query nobody makes — the charts read one Exercise's Sessions.

**Identity.** Seeded Exercises and Built-in Routines use their slug as `id` (`supino-reto`). Anything the lifter creates uses `usr_` or `rot_` plus `crypto.randomUUID()`. Sessions use `ses_` plus `crypto.randomUUID()`. The prefixes make a seed-slug/user-id collision structurally impossible, and renaming a user Exercise never changes its `id` — no slug generation, which is where hash-style bugs live.

**Migrations are additive-only, reads are tolerant.** A new field never triggers a store rewrite, and every read treats a missing field as its default. If a destructive rewrite ever becomes unavoidable, it copies the affected store into `backup_<n>` inside the same upgrade transaction, keeps that copy until the next successful launch, and only then drops it. With no export, that backup store is the only thing between a bad release and total loss.

**Seeding is version-gated.** `meta.seedVersion` is compared to the bundled constant; seeding runs only when the bundle is newer, and always insert-if-absent — never updating an existing row, never resurrecting a deleted one.
