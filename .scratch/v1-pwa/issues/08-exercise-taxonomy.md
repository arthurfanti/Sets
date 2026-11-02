# Exercise taxonomy and seed schema

Type: grilling
Status: resolved

## Question

The seed file shape decides what the research ticket can even produce, so it is settled first.

- Fields per Exercise: `slug`, `name`, and then which of `muscleGroup`, `equipment`, `aliases`, `isCompound`? Only include a field the UI or a rule actually consumes — name the consumer for each, or cut it.
- Is muscle group shown to the Lifter, or used only to group and order the Exercise picker?
- How many Exercises ship: a tight 40–60, or a broad 150+? More coverage means more picker scrolling and more research work.
- Name matching: case- and whitespace-insensitive comparison when the Lifter types a custom Exercise — is a near-duplicate blocked, warned, or allowed?
- Does the seed schema need to mirror the stored Exercise record exactly, or may the build step enrich it?

Answer with the final field list, each field's consumer, and the target count for the research ticket.

## Answer

**Three fields, each with a named consumer.**

| Field | Consumer |
| --- | --- |
| `slug` | stable identity; Built-in Routine references; rename-proof |
| `name` | display in the picker, Set rows, and charts (pt-BR, e.g. "Supino reto") |
| `muscleGroup` | the picker's section header and its fixed ordering |

Rejected: `equipment` and `isCompound`, because their only consumer was the rest timer, which v1 does not have. `difficulty` was never a thing. The loader adds `source: "builtin"` when seeding; the JSON never carries it, or ids, or timestamps.

**Count: ~55 Exercises**, spread so no group is thin, covering the common barbell, dumbbell, machine and cable movements. Not 150: the picker must stay one or two screens, and anything missing is two taps away via a custom Exercise.

**Nine groups, one primary per Exercise, fixed order** (never alphabetical):

**Peito · Costas · Ombros · Quadríceps · Posteriores · Panturrilha · Bíceps · Tríceps · Abdômen**

Legs is the only group split, because it is the only one big enough to scroll. `Quadríceps` and `Posteriores` were chosen over `Extensores` and `Flexores`: the latter names a knee action that leaves glute-dominant work and calf work homeless.

**Duplicate rule.** Normalize by lowercasing, trimming, collapsing inner whitespace and stripping accents, then compare. Exact normalized match blocks creation and offers the existing Exercise; a near match only warns. So "Tríceps Testa", "triceps testa" and "  TRÍCEPS   TESTA" are one Exercise.

**Aliases.** Seeded Exercises may carry an optional `aliases` array of common short forms ("supino" → Supino reto, "rosca" → Rosca direta). Aliases are matched by search, never displayed, and only exist where the short form genuinely differs from the name.
