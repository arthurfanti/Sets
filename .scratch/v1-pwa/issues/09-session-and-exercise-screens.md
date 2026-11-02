# All five screens — design

Type: prototype
Status: resolved
Blocked by: 06, 07, 14

## Question

What do the five screens actually look like, at phone size, one-handed? Settle the visual composition with concrete artifacts to react to, then record what each screen carries.

**Mechanism: Stitch MCP**, not hand-written throwaway code. Sequence, in order:

1. Write `docs/design/DESIGN.md` from the UI-system and identity tickets: tokens (violet `#B26BFF` interaction, magenta `#F72585` data only), type, contrast floor, spacing scale, target sizes, accent roles, surface rule — plus the hard constraints Stitch cannot know (kilograms as a bare number, no rest timer, no export/share, no accounts) and the fixed pt-BR vocabulary (**Rotina**, **Sessão**, **Plano**, **Série**, **Melhor série**, **Exercício**, **Carga** — never "treino"). Every generated screen must come back in pt-BR; an English mock is a failed prompt.
2. `create_project` → `upload_design_md` → `create_design_system_from_design_md`.
3. `generate_screen_from_text` once per screen, then `edit_screens` / `generate_variants` for the iteration.
4. `download_file` the PNG **and** the HTML per screen; commit to `docs/design/stitch/` on a `prototype/<name>` branch; link from this ticket.

The five screens:

- **Home / Routine list** — Built-in and User Routines, start a Session in one tap, reach the Session list.
- **Session** — the live Plan: Exercise blocks, Set slots, pre-filled weight and reps, one-tap completion of the current Set, finish and discard.
- **Routine editor** — ordered Exercise rows with sets/reps/weight, add via picker, reorder, remove.
- **Session list** — history, grouped, and the Exercise-page entry point.
- **Exercise page** — Best Set headline, 1RM trend, volume as secondary, 12-week/all-time toggle.

Out of this ticket: interaction behaviour. Set-logging speed, pre-fill rules, tap count, crash-safe resume cannot be judged from a screenshot — they are decided in the build under `/tdd`, or in a separate `/prototype` if they resist.

Answer with, per screen: what is on it, what is cut, what is reachable in one tap. Link the artifacts.

## Comments

- `docs/design/DESIGN.md` written from the UI-system and identity tickets: tokens, type scale, 4/8/12/16/24/32 spacing, 48 px targets, per-screen composition, pt-BR copy rules and the do-not-draw list. Palette source of truth stays `docs/design/palette.html`.
- Generation blocked before the first Stitch call: the MCP rejects every request with a Google authentication error. See [Stitch access repaired](14-stitch-access.md). Nothing else about this ticket is blocked — 06 and 07 are closed, so the remaining work is one design-system call and five generations.

## Answer

**Artifacts.** Stitch project `13602567423234918255`, design system `assets/3f0899b1e6264a8d921ee9a5982ea5a2`, generated from `docs/design/DESIGN.md`. Five screens exported as PNG and HTML into `docs/design/stitch/`: `01-rotinas`, `02-sessao`, `03-editor`, `04-historico`, `05-exercicio`. The screenshots are the visual reference; the HTML is the layout reference and is never copied into the app.

**What each screen carries.**

- **Rotinas** — two grouped sections, "Rotinas prontas" then "Minhas rotinas", each row a card with the Routine name and a muted middle-dot list of its Exercises. One violet primary action pinned bottom: "Nova rotina". "Histórico" is a muted text link in the header. No search, no filters, no counts.
- **Sessão** — header is Routine name plus a muted elapsed time. One card per Exercise, three Set rows each, weight and reps at 32px with a small muted `kg`, a 48×48 completion button per row. Only the live Set carries the violet left bar and the filled check. Footer is the violet "Finalizar" plus a muted "Descartar". No timer of any kind.
- **Rotina (editor)** — name field, then ordered Exercise cards each with drag handle, name, a muted `séries · reps · carga` line, small steppers and a remove glyph. A dashed "Adicionar exercício" row sits after the last Exercise. Bottom violet "Salvar rotina".
- **Histórico** — flat list, newest first, muted month headers, one card per Session with Routine name (or "Sessão livre") and a muted `date · duration · set count`. No charts, nothing pinned.
- **Exercício** — "Melhor série" headline card with the value at 32px and the estimated 1RM beneath, a 12 semanas / Tudo segmented toggle, the 1RM line chart, a smaller volume chart, then the three most recent Sets. Both charts magenta, no gridlines, muted axis labels.

**Decisions this ticket adds.**

- A finished Session has **no sixth screen**: tapping a History row expands it in place to list that Session's Sets. The **Exercício** page is reached by tapping an Exercise name inside that expansion. That is the only navigation added beyond what the map already fixed.
- The editor drops the duplicate top-right "Salvar" the generator drew: one save affordance, the pinned bottom button.

**Two deviations in the generated artifacts, corrected in the spec and not in the pixels.** `edit_screens` reported success twice and never re-rendered the export, so these are recorded here as the answer rather than re-generated:

1. `05-exercicio` draws a violet left bar on the most recent Historical Set. Violet marks only a Set **currently being logged**; nothing on a history page may carry it.
2. `05-exercicio` draws a "Registrar nova série" button. That action does not exist — Sets are only logged inside a Sessão.

Sample data in `02-sessao` is also inconsistent (the "Tríceps testa" summary says 100 kg while its Sets say 36 kg). Cosmetic; the layout is what the artifact is for.
