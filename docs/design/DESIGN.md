# Sets — DESIGN.md

A personal strength-training log for one lifter, used on a phone, one-handed, mid-workout. Dark only. All copy in **pt-BR**. The name of the app is **Sets**.

## Why this design exists

The lifter is standing at a rack with a bar loaded, sweaty hands, and 90 seconds of attention. Every screen must answer one question at a glance. Numbers are the interface: they must be large, tabular, and never jump position as digits change.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#0B0D10` | app background, always |
| `surface-1` | `#14171C` | cards, rows |
| `surface-2` | `#1D222A` | raised rows, pickers, modals |
| `border` | `rgba(255,255,255,0.08)` | 1px separators, button outlines |
| `text` | `#EDEFF2` | all text and all numbers |
| `text-muted` | `#8A919B` | labels, secondary stats, placeholders |
| `violet` | `#B26BFF` | **interaction only** |
| `magenta` | `#F72585` | **data only** |

Hard colour rules:

- **Violet** marks only: the Set currently being logged (a 3px left bar on its row, and the primary button), and the focus ring. Nothing else is violet. Never a large violet background fill behind body text.
- **Magenta** appears only inside charts: the estimated 1RM line and the Best Set dot.
- **No accent colour ever sits behind a weight or rep numeral.** Numerals are always `text` on `bg`/`surface-1`.
- No gradients between the two accents.
- No shadows, no blur, no glass. Separation is a 1px border plus one step of the surface ramp.
- Contrast floor: body text ≥4.5:1, every numeral ≥7:1.

## Type

System font stack — `-apple-system, system-ui, "Segoe UI", Roboto, sans-serif`. No webfonts. `font-variant-numeric: tabular-nums` on every number.

| Role | Size / weight |
| --- | --- |
| Screen title | 20px / 600 |
| Exercise name | 17px / 600 |
| Set value (the hero) | 32px / 600, tabular |
| Body / labels | 15px / 400 |
| Secondary stat | 13px / 400, muted |
| Button label | 15px / 600 |

## Space and shape

- Spacing scale only: **4, 8, 12, 16, 24, 32**.
- Corner radius **12px** for cards, rows and buttons; **8px** for small chips.
- Minimum touch target **48×48**; the primary action row is **56–64** tall and sits at the bottom, in thumb reach.
- Horizontal page padding 16px.

## Composition rules

- One column. No tab bar, no drawer, no sidebar, no hamburger.
- The bottom of the screen holds at most one primary action, full width.
- A Set row is: index, weight (with a small `kg` in muted), `×`, reps, and a 48×48 completion button. Completed rows drop to `surface-1` with muted checkmarks; the live row is `surface-2` with the violet left bar.
- Navigation back is a single text or chevron control top-left. Never more than one navigation affordance per screen.
- Empty states are one short sentence in pt-BR, muted, plus at most one action.

## Screens

**1. Início (home / Routine list).** Title "Rotinas". Two groups: "Rotinas prontas" (Built-in) and "Minhas rotinas" (User). Each row: Routine name, then a muted summary line of its Exercises (e.g. "Supino reto · Remada curvada · Desenvolvimento"). Tapping a row starts a Session. Bottom primary button: "Nova rotina". A small secondary link to history: "Histórico".

**2. Sessão (live session).** Header: Routine name + elapsed time, muted. Body: one block per Exercise, in order, with its own Set rows pre-filled with the prescribed weight and reps. The current Set row is highlighted with the violet bar. Completing a Set marks it done and advances the highlight. Footer: a wide primary button "Finalizar" and a small muted "Descartar" beneath it.

**3. Nova rotina / Editar rotina (Routine editor).** Title "Rotina". A name field at top. Then an ordered list of Exercise rows, each showing the Exercise name and, beneath it, compact `séries × reps · carga` values with small steppers. Each row has a drag handle and a remove control. Between rows, a muted full-width "Adicionar exercício" row. Footer primary action "Salvar".

**4. Histórico (session list).** Title "Histórico". A flat list, newest first, grouped by month with a muted month header. Each row: Routine name (or "Sessão livre"), date, and a muted line with duration and Set count. Tapping opens the Session's detail. No charts here.

**5. Exercício (exercise page).** Title is the Exercise name. Headline block: "Melhor série" label, then the value in 32px tabular with `kg × reps` and the muted estimated 1RM beneath. Below, a 12-week / all-time toggle, then the 1RM line chart (magenta line, no fill, minimal axes, muted labels), then a smaller volume chart. Then a compact list of the most recent Sets.

## Copy rules

- pt-BR only, second person: "você".
- Vocabulary is fixed: **Rotina**, **Sessão**, **Plano**, **Série**, **Melhor série**, **Exercício**, **Carga**.
- **Never** the word "treino" — it means both Routine and Session and names nothing. Likewise never "workout", "programa", "ficha".
- Weights are bare numbers in kilograms; the only unit shown is a small muted `kg` next to the value.

## Out of scope — do not draw these

No rest timer, no countdown, no floating timer. No social feed, likes or sharing. No nutrition, calories or bodyweight tracking. No Apple Health, wearable or device sync. No login, account, avatar or profile screen. No export, import or backup buttons. No settings screen. No pound/lb toggle. No dark/light switch. No AI coach, suggestions or generated programs. No tab bar. No onboarding carousel. No streak gamification, badges or confetti.

## Density

Comfortable, not dense. This is a phone held at chest height in a noisy room, not a dashboard. When in doubt, remove a row rather than shrink a target.
