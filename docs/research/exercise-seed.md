# Exercise seed and Built-in Routine content

Research for [`11-seed-content`](../../.scratch/v1-pwa/issues/11-seed-content.md). Delivers `src/data/exercises.json` (55 Exercises) and `src/data/routines.json` (4 Built-in Routines) per the schema settled in [`08-exercise-taxonomy`](../../.scratch/v1-pwa/issues/08-exercise-taxonomy.md) and the bundle decision in [ADR 0003](../adr/0003-builtin-routines-in-bundle.md).

## What shipped

| Group | Count | Exercises |
| --- | --- | --- |
| Peito | 7 | Supino reto, Supino inclinado, Supino declinado, Crucifixo, Crossover, Peck deck, Flexão de braço |
| Costas | 9 | Puxada frontal, Puxada supinada, Barra fixa, Remada curvada, Remada unilateral, Remada baixa, Remada cavalinho, Encolhimento, Levantamento terra |
| Ombros | 6 | Desenvolvimento militar, Desenvolvimento com halteres, Elevação lateral, Elevação frontal, Elevação posterior, Remada alta |
| Quadríceps | 7 | Agachamento livre, Agachamento frontal, Leg press, Cadeira extensora, Afundo, Agachamento búlgaro, Agachamento hack |
| Posteriores | 6 | Levantamento terra romeno, Stiff, Mesa flexora, Cadeira flexora, Hiperextensão, Elevação pélvica |
| Panturrilha | 4 | Panturrilha em pé, Panturrilha sentado, Panturrilha no leg press, Panturrilha unilateral |
| Bíceps | 5 | Rosca direta, Rosca alternada, Rosca Scott, Rosca concentrada, Rosca martelo |
| Tríceps | 5 | Tríceps na polia, Tríceps testa, Tríceps francês, Supino fechado, Mergulho |
| Abdômen | 6 | Abdominal supra, Abdominal infra, Abdominal na máquina, Abdominal oblíquo, Prancha, Prancha lateral |

Total 55. Every group clears the floor of 4; legs and back carry the most, as the taxonomy expected.

## How the list was assembled

**One reference, used for one decision.** The only sourced claim in this deliverable is *which muscle group an Exercise belongs to*. The reference is the **ExRx.net Exercise Directory**, a long-standing exercise-prescription reference that files each movement under its body area and target muscle (for example Barbell Bench Press under Chest → Pectoralis Major, Sternal).

**The rule applied:** an Exercise's `muscleGroup` is the ExRx body-area page **on which ExRx lists that movement**, at the named muscle section. Every entry below was read off the live page, not recalled. Anything ExRx does not list, or lists in a place that has no counterpart in our nine groups, is flagged in *Judgment calls* rather than quietly reassigned.

**Selection filter, applied before placement:**

- Included only movements a commercial gym can load with a barbell, dumbbell, machine, cable, or body weight.
- Excluded Olympic lifts, kettlebell work, plyometrics, and sport-specific or rehabilitative drills — the picker must stay one or two screens, and v1 has no rest timer or progression engine to justify them.
- Excluded body areas our taxonomy has no group for: neck, forearms, hip abductors/adductors, rotator cuff, serratus anterior.
- Kept at most two entries that are the same movement pattern on different equipment where both are genuinely standard (Supino reto/inclinado/declinado, the three leg curls are *not* one pattern; see flags).

**Names are not from the source.** ExRx is English-only; every `name` here is the term current in Brazilian gyms for that movement (Supino reto, Rosca Scott, Tríceps testa, Peck deck). There is **no citation for the pt-BR naming** — no dictionary or terminology reference was consulted, so treat naming as editorial judgment over common usage, correctable by anyone who lifts in Brazil. Slugs are mechanical kebab-case derivations of those names, so a rename means a new slug.

## Taxonomy mapping

The nine groups are not ExRx's body areas; they are a coarser partition chosen in the taxonomy ticket. The mapping used for every placement:

| Our group | ExRx body area / muscle section |
| --- | --- |
| Peito | Chest — Pectoralis Major, Sternal; Pectoralis Major, Clavicular |
| Costas | Back — General Back; Latissimus Dorsi & Teres Major; Trapezius, Upper Fibers |
| Ombros | Shoulders — Deltoid, Anterior / Lateral / Posterior |
| Quadríceps | Thighs — Quadriceps |
| Posteriores | Thighs — Hamstrings (plus Hips — Gluteus Maximus for hip extension, flagged) |
| Panturrilha | Calves — Gastrocnemius; Soleus |
| Bíceps | Upper Arms — Biceps Brachii; Brachialis |
| Tríceps | Upper Arms — Triceps Brachii |
| Abdômen | Waist — Rectus Abdominis; Obliques |

Two ExRx areas in that mapping have no group of their own and had to be absorbed: **Hips** (glutes) folded into Posteriores, and **Waist → Erector Spinae** (lower back) split between Costas and Posteriores depending on the movement. Both are flagged below.

## Placement, exercise by exercise

Source for every row: the ExRx list page for the body area named in the *ExRx location* column, accessed 2026-11-02. Section names are ExRx's own headings; movement labels are the English entry titles at that location.

### Peito — [Chest](https://exrx.net/Lists/ExList/ChestWt)

| Exercise | ExRx location |
| --- | --- |
| Supino reto | Pectoralis Major, Sternal → Barbell Bench Press |
| Supino inclinado | Pectoralis Major, Clavicular → Barbell Incline Bench Press |
| Supino declinado | Pectoralis Major, Sternal → Barbell Decline Bench Press |
| Crucifixo | Pectoralis Major, Sternal → Dumbbell Fly |
| Crossover | Pectoralis Major, Sternal → Cable Flies (Standing Fly) |
| Peck deck | Pectoralis Major, Sternal → Lever (selectorized) Pec Deck Fly |
| Flexão de braço | Pectoralis Major, Sternal → Body Weight Push-up |

### Costas — [Back](https://exrx.net/Lists/ExList/BackWt), plus [Waist](https://exrx.net/Lists/ExList/WaistWt) for one row

| Exercise | ExRx location |
| --- | --- |
| Puxada frontal | Latissimus Dorsi & Teres Major → Lever (selectorized) Front Pulldown |
| Puxada supinada | Latissimus Dorsi & Teres Major → Cable Underhand Pulldown |
| Barra fixa | Latissimus Dorsi & Teres Major → Body Weight Pull-up |
| Remada curvada | General Back → Barbell Bent-over Row |
| Remada unilateral | General Back → Dumbbell One Arm Bent-over Row |
| Remada baixa | General Back → Cable Seated Row |
| Remada cavalinho | General Back → Lever (plate loaded) T-bar Row |
| Encolhimento | Trapezius, Upper Fibers & Levator Scapulae → Barbell Shrug |
| Levantamento terra | *Waist → Erector Spinae → Barbell Deadlift* (see flag 1) |

### Ombros — [Shoulders](https://exrx.net/Lists/ExList/ShouldWt)

| Exercise | ExRx location |
| --- | --- |
| Desenvolvimento militar | Anterior Deltoid → Barbell Military Press |
| Desenvolvimento com halteres | Anterior Deltoid → Dumbbell Shoulder Press |
| Elevação lateral | Lateral Deltoid → Dumbbell Lateral Raise |
| Elevação frontal | Anterior Deltoid → Dumbbell Front Raise |
| Elevação posterior | Posterior Deltoid → Dumbbell Rear Lateral Raise |
| Remada alta | Lateral Deltoid → Barbell Upright Row |

### Quadríceps — [Thighs](https://exrx.net/Lists/ExList/ThighWt)

| Exercise | ExRx location |
| --- | --- |
| Agachamento livre | Quadriceps → Barbell Squat |
| Agachamento frontal | Quadriceps → Barbell Front Squat |
| Leg press | Quadriceps → 45° Leg Press |
| Cadeira extensora | Quadriceps → Lever (selectorized) Leg Extension |
| Afundo | Quadriceps → Barbell Lunge |
| Agachamento búlgaro | Quadriceps → Single Leg Split Squat (see flag 6) |
| Agachamento hack | Quadriceps → Sled Hack Squat |

### Posteriores — [Thighs](https://exrx.net/Lists/ExList/ThighWt), plus [Hips](https://exrx.net/Lists/ExList/HipsWt) for one row

| Exercise | ExRx location |
| --- | --- |
| Levantamento terra romeno | Hamstrings → cross-reference *Romanian Deadlift* (ExRx files the entry under Olympic Lifts; see flag 5) |
| Stiff | Hamstrings → Barbell Straight-leg Deadlift (see flag 5) |
| Mesa flexora | Hamstrings → Lever (selectorized) Lying Leg Curl |
| Cadeira flexora | Hamstrings → Lever (selectorized) Seated Leg Curl |
| Hiperextensão | Hamstrings → Barbell/Weighted Hyperextension (see flag 3) |
| Elevação pélvica | *Hips → Gluteus Maximus → Barbell Hip Thrust* (see flag 2) |

### Panturrilha — [Calves](https://exrx.net/Lists/ExList/CalfWt)

| Exercise | ExRx location |
| --- | --- |
| Panturrilha em pé | Gastrocnemius → Barbell Standing Calf Raise |
| Panturrilha sentado | Soleus → Lever (selectorized) Seated Calf Raise |
| Panturrilha no leg press | Gastrocnemius → 45° Calf Press |
| Panturrilha unilateral | Gastrocnemius → Weighted Single Leg Calf Raise |

### Bíceps — [Upper Arms](https://exrx.net/Lists/ExList/ArmWt), plus [Forearms](https://exrx.net/Lists/ExList/ForeArmWt) for one row

| Exercise | ExRx location |
| --- | --- |
| Rosca direta | Biceps Brachii → Barbell Curl |
| Rosca alternada | Biceps Brachii → Dumbbell Curl (Alternating) |
| Rosca Scott | Brachialis → Barbell Preacher Curl |
| Rosca concentrada | Brachialis → Dumbbell Concentration Curl |
| Rosca martelo | *Brachioradialis → Dumbbell Hammer Curl* (see flag 4) |

### Tríceps — [Upper Arms](https://exrx.net/Lists/ExList/ArmWt)

| Exercise | ExRx location |
| --- | --- |
| Tríceps na polia | Triceps Brachii → Cable Pushdown |
| Tríceps testa | Triceps Brachii → Barbell Lying Triceps Extension |
| Tríceps francês | Triceps Brachii → Dumbbell Triceps Extension |
| Supino fechado | Triceps Brachii → Barbell Close Grip Bench Press |
| Mergulho | Triceps Brachii → Weighted Triceps Dip |

### Abdômen — [Waist](https://exrx.net/Lists/ExList/WaistWt)

| Exercise | ExRx location |
| --- | --- |
| Abdominal supra | Rectus Abdominis → Weighted/Body Weight Crunch |
| Abdominal infra | Rectus Abdominis → Leg-Hip Raises |
| Abdominal na máquina | Rectus Abdominis → Lever (selectorized) Seated Crunch |
| Abdominal oblíquo | Obliques → Weighted Side Crunch |
| Prancha | Rectus Abdominis → Isometric Front Plank |
| Prancha lateral | Obliques → Isometric Side Plank |

## Judgment calls and uncertain placements

**1. Levantamento terra sits in Costas, and ExRx does not say so.** ExRx files the barbell Deadlift under *Waist → Erector Spinae* and cross-references *Hips → Gluteus Maximus*; it never files it under Back. We put it in Costas because the erector spinae is back musculature, the taxonomy has no lumbar group, and Brazilian gym practice trains it on back day. ExRx supports the muscle, not the group. Weakest-sourced row in the list; move it to Posteriores if the picker should follow the posterior-chain reading instead.

**2. Elevação pélvica (hip thrust) is in Posteriores although ExRx files it under Hips.** The taxonomy deliberately has no glute group — the rationale in ticket 08 is that `Posteriores` houses hip-extension work that a flexor/extensor split would leave homeless. Posteriores is therefore the intended home, but the placement rests on that ticket's reasoning, not on ExRx.

**3. Hiperextensão (back extension) is in Posteriores, and ExRx lists it in two places.** It appears under *Hamstrings* and again under *Waist → Erector Spinae*; the Hamstrings filing is why it sits here. A lifter who treats it as lower-back work would expect Costas. Acceptable either way, not settled by the source.

**4. Rosca martelo is in Bíceps, but ExRx files Hammer Curl under Brachioradialis (Forearms).** The taxonomy has no forearm group, and the movement is performed and programmed as a curl. The primary muscle per ExRx is the brachioradialis, so this is a group-of-convenience placement.

**5. Stiff and Levantamento terra romeno ship as two Exercises, and the source does not draw a clean line between them.** ExRx has *Straight-leg Deadlift* on the Hamstrings page and *Stiff-leg Deadlift* on the Erector Spinae page, plus a separate *Romanian Deadlift* under Olympic Lifts; the three labels overlap in practice and gyms use them loosely. Kept both Stiff and Romeno because Brazilian gyms treat them as separate prescriptions (Romeno from a hang with unlocked knees, Stiff with straighter legs, often from a deficit). If the duplicate-warning rule starts firing on these two, they are the pair to collapse.

**6. Agachamento búlgaro has no ExRx entry.** It was placed from ExRx's *Single Leg Split Squat* / *Split Squat* entries, which are the same pattern without the rear foot elevated. The rear-foot elevation is a documented variation of the split squat, not a different movement, but the exact title does not exist on the source.

**7. Encolhimento is in Costas, not Ombros.** ExRx puts the shrugs under *Back → Trapezius, Upper Fibers*, so Costas follows the source. Lifters who train traps on shoulder day will look in the wrong section; that is a UX cost paid for source fidelity.

**8. Excluded despite being common: Pulôver, Good morning, and every Olympic lift.** Pulôver was cut because ExRx splits it — dumbbell pullover under *Chest → Pectoralis Sternal*, barbell pullover under *Latissimus Dorsi* — so one entry would carry a contested group. Good morning was cut as a near-duplicate of the two hinges already present. Olympic lifts were cut as sport-specific per the selection filter.

**9. Prancha carries a rep count that is really a hold duration.** The schema has no time field, so `reps` would have to hold seconds. Planks are seeded as Exercises (they are logged like anything else) but are deliberately kept out of the Built-in Routines, which use rep-based abdominal movements instead. Recorded as a known schema gap, not worked around in data.

**10. Nothing here is a periodization claim.** The Built-in Routines are our own composition — a common A/B/C/D split matched to the seeded groups. No program, coach, or template was consulted or copied, so the `sets` and `reps` ranges are defaults a Lifter edits, not a sourced recommendation. `weight` is omitted everywhere for the reason in ADR 0003: a built-in cannot know the Lifter's load, and it pre-fills from their last Session.

## Sources

All accessed 2026-11-02.

- ExRx.net, *Exercise Directory* — <https://exrx.net/Lists/Directory>
- ExRx.net, *Chest Exercises* — <https://exrx.net/Lists/ExList/ChestWt>
- ExRx.net, *Back Exercises* — <https://exrx.net/Lists/ExList/BackWt>
- ExRx.net, *Shoulder Exercises* — <https://exrx.net/Lists/ExList/ShouldWt>
- ExRx.net, *Thigh Exercises* — <https://exrx.net/Lists/ExList/ThighWt>
- ExRx.net, *Hip Exercises* — <https://exrx.net/Lists/ExList/HipsWt>
- ExRx.net, *Calf Exercises* — <https://exrx.net/Lists/ExList/CalfWt>
- ExRx.net, *Upper Arm Exercises* — <https://exrx.net/Lists/ExList/ArmWt>
- ExRx.net, *Forearm Exercises* — <https://exrx.net/Lists/ExList/ForeArmWt>
- ExRx.net, *Waist Exercises* — <https://exrx.net/Lists/ExList/WaistWt>

No source is cited for pt-BR naming or for the Routine prescriptions; neither was researched, and inventing a reference for them would be worse than saying so.

## Verification

Cross-references, schema shape, slug derivation, group floor and banned word, checked programmatically against both files:

```
$ python3 - <<'PY'   # inline check, run from the repo root
EXERCISES: 55
PER GROUP: Peito=7, Costas=9, Ombros=6, Quadríceps=7, Posteriores=6, Panturrilha=4, Bíceps=5, Tríceps=5, Abdômen=6
ROUTINES: 4
  rotina-a: Rotina A — Peito e tríceps (5 exercises)
  rotina-b: Rotina B — Costas e bíceps (5 exercises)
  rotina-c: Rotina C — Pernas (6 exercises)
  rotina-d: Rotina D — Ombros e abdômen (6 exercises)
ROUTINE REFERENCES: 22 total, all resolved: True
ALIASES: 29
ERRORS: none
```

Checked: no duplicate slug or normalized name; no key outside `slug`/`name`/`muscleGroup`/`aliases`; every `slug` equals the kebab-case ASCII derivation of its `name`; every `muscleGroup` in the fixed nine; no group under 4; every Routine item resolves to a seeded slug; 4–7 Exercises per Routine; `sets` an integer, `reps` a number or `n-m` string; no `weight` key; "treino" absent from every name.
