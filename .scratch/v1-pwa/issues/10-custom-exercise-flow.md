# Custom Exercise creation and naming rules

Type: grilling
Status: resolved
Blocked by: 08

## Question

The picker is the Routine editor's biggest surface, and it has to accept an Exercise the seed list does not have.

- Where creation happens: inline in the picker, a separate screen, or "no match — create it" as a row in the filtered list.
- Id generation for user-created Exercises, and how it is guaranteed not to collide with a seed slug.
- Duplicate handling: exact match, case/whitespace match, and fuzzy near-miss — block, warn, or allow? Blocks a typo'd second "Bench press", allows "Bench Press (paused)".
- Can a user-created Exercise be renamed or deleted? What happens to Sessions and Routines referencing it — the Plan snapshots Exercise references, so deletion must not orphan history.
- Does creating one during a Session work, or only from the Routine editor?

Answer with the flow, the id rule, the duplicate rule, and the delete rule.

## Answer

**Creation lives inside the picker.** When the search matches nothing, the last row becomes **"Criar «<typed name>»"**; tapping opens a sheet with the name prefilled, the nine group chips and **no default group** — one group must be chosen — then Criar. Reachable identically from the Routine editor and from a live Session, because an unplanned movement is exactly when the Exercise is missing. No separate creation screen.

**New Exercises get `usr_` + `crypto.randomUUID()`** as their id (04). No slug generation, so a user Exercise can never collide with a seed slug, and its id never changes afterwards.

**Renaming is allowed and retroactive.** Sets and Plan entries reference the Exercise by id, so a rename relabels every past Set and every chart label at once. Accepted cost: history is not a snapshot of what a movement was once called. The alternative — storing the name per Set — freezes typos forever and duplicates a field the Exercise already owns.

**Deleting is a soft delete**: a `hiddenAt` timestamp (an additive field, allowed by 0006). The Exercise leaves the picker so it cannot be logged again, but every existing Set still resolves, still renders, and still charts. Hard deletion would orphan Sets pointing at a missing id; refusing deletion would leave mistakes permanently in the picker.

**Built-in Exercises are immutable** — not renamable, not hideable — the same rule 0003 applies to Built-in Routines, and for the same reason: shared seed data that the user can mutate stops being a reliable seed.

**Duplicate detection stays as 08 settled it**: exact normalized match blocks creation and offers the existing Exercise; a near match only warns.
