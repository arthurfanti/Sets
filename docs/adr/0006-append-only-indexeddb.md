# IndexedDB shape is append-only, with Sets nested in the Session

Four stores (`exercises`, `routines`, `sessions`, `meta`), Sets nested inside their Session document, slug ids for seeded rows and prefixed UUIDs for anything the lifter creates. Migrations are additive-only and every read treats a missing field as its default; a destructive rewrite is required to copy the old store to `backup_<n>` first.

Recorded because the usual IndexedDB habit is a versioned rewrite migration, and the usual relief valve is an export. This app has neither: there is no backup path (`0001`), so a migration that corrupts records has no undo. Additive-only makes the common change — a new field — free, and confines real risk to the one case that now has a mandatory backup step.
