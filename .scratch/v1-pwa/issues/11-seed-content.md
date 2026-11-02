# Exercise seed list and built-in Routine content

Type: research
Status: resolved

## Question

Produce the actual seed content: the Exercise list per the schema decided in the taxonomy ticket, and the Built-in Routines that ship with v1.

- Exercise list at the target count, each with the decided fields, correct slugs, and a citable source for the muscle grouping (a well-known training reference, not a directory of app names).
- Built-in Routines: a small set of named, ordered plans using only seeded Exercise slugs, each with `sets`, `reps` (exact or range) and optional `weight`, matching the format settled in `docs/adr/0003`.
- Every generated file must satisfy the build-time reference test: no Routine names an Exercise slug that is not in the seed list.

Deliver the JSON files on a `research/<name>` branch, no PR, and link them from this ticket.

## Schema, settled

```json
{ "slug": "supino-reto", "name": "Supino reto", "muscleGroup": "Peito", "aliases": ["supino"] }
```

- Fields: `slug`, `name`, `muscleGroup`, optional `aliases`. Nothing else.
- Target ~55 Exercises.
- `muscleGroup` is one of exactly: Peito, Costas, Ombros, Quadríceps, Posteriores, Panturrilha, Bíceps, Tríceps, Abdômen — spelled with those accents.
- `name` in pt-BR, sentence case, no equipment prefixes unless the movement needs it ("Supino reto", "Rosca direta").
- Built-in Routines use the `sets` / `reps` / `weight` shape from `docs/adr/0003`, referencing only slugs in the Exercise list.

## Answer

Delivered `src/data/exercises.json` (55), `src/data/routines.json` (4 Built-in Routines), and `docs/research/exercise-seed.md`.

Distribution: Peito 7 · Costas 9 · Ombros 6 · Quadríceps 7 · Posteriores 6 · Panturrilha 4 · Bíceps 5 · Tríceps 5 · Abdômen 6.

Routines: Rotina A — Peito e tríceps (5), Rotina B — Costas e bíceps (5), Rotina C — Pernas (6), Rotina D — Ombros e abdômen (6). 22 Exercise references, all resolving, no `weight` anywhere.

Independently verified: no key outside the settled four fields, no duplicate slug or normalized name, every `slug` equal to the ASCII kebab-case of its name, `sets` integer, `reps` number or range, 4–7 Exercises per Routine, and "treino" absent from both files.

Source: ExRx.net's per-body-area exercise lists, ten pages fetched 2026-11-02 and cited with URLs in the write-up. **Six placements are judgment rather than source, and are flagged there:** Levantamento terra in Costas (ExRx files it under Erector Spinae), Elevação pélvica and Hiperextensão in Posteriores, Rosca martelo in Bíceps (ExRx cites brachioradialis, and no forearm group exists), Agachamento búlgaro (no ExRx entry), and Stiff + Romeno shipping as two near-overlapping hinges. Pulôver was cut because ExRx disagrees on whether it is chest or lats.

Not researched, and not claimed as sourced: the pt-BR names and the Routine prescriptions.
