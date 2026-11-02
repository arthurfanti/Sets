# Pre-fill rules for a Set

Type: grilling
Status: resolved

## Question

A Session's Plan pre-fills weight and reps for every Set slot, "from the prescription, then from your last Session of that Exercise". That sentence hides four decisions, and a build agent will invent all four wrongly.

- **Which past value seeds a slot**: the Set at the same index last time, the heaviest Set of that Exercise, the first Set, or the last Set?
- **Precedence** when a User Routine carries a target weight and history disagrees.
- **Fallback** when the last Session skipped that Exercise entirely, or logged two Sets of four.
- **Staleness**: does a Session from three months ago still pre-fill, or does the suggestion decay or disappear?

Answer with the rule per slot, the precedence order, the walk-back procedure, and how a pre-filled value is distinguished from a confirmed one on screen.

## Answer

**A slot pre-fills from the Set at the same index.**

Walking back from the most recent **finished** Session containing that Exercise: take its Set at the same index. If that Session logged fewer Sets, take its last Set for the Exercise. If it logged none for the Exercise at all, step back one Session. **Stop after five Sessions.**

**Precedence, highest first:**

1. The same-index Set in that Session (weight and reps).
2. That Session's last Set for the Exercise.
3. The Routine's target weight, for weight only.
4. Empty — the lifter types it.

**History beats the Routine's target.** The Routine is a template written once; the last Session is what was actually lifted. A target weight is a fallback for the day there is no history, never an override of it. Same for reps: if the last Set was 10 at this index, 10 is pre-filled, not the lower bound of `8-12` — the Plan's range is structure and display, and silently demoting a lifter to 8 would look like the app caused a regression.

**No decay, but suggested values look different from logged ones.** A three-month-old number still pre-fills, because v1 has no periodization to justify deliberately lowering it. A pre-filled value renders **muted `#8A919B`** and flips to **`#EDEFF2`** once the Set is confirmed or edited. Muted means "this is a suggestion"; a guess and a logged number must be distinguishable without reading anything.
