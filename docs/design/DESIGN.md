# Sets — DESIGN.md

A personal strength-training log for one lifter, used on a phone, one-handed, mid-workout. Dark only. All copy in **pt-BR**. The name of the app is **Sets**.

Source of truth for the look: `docs/design/obsidian-athletics-brief.md` (the Stitch PRD).

## Why this design exists

The lifter is standing at a rack with a bar loaded, sweaty hands, and 90 seconds of attention. Every screen must answer one question at a glance. Numbers are the interface: they must be large, tabular, and never jump position as digits change.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#0C0E11` | app background, always |
| `surface-1` | `#1A1C1F` | cards, rows |
| `surface-2` | `#22252A` | raised rows, pickers, modals |
| `border` | `#2E3238` | 1px separators, button outlines |
| `text` | `#FFFFFF` | logged numbers and body text |
| `text-muted` | `#9BA1A6` | labels, secondary stats, placeholders |
| `text-suggestion` | `#A7AEB8` | pre-filled Set values: dimmer than `text` |
| `primary` | `#B26BFF` | **interaction only** |
| `primary-fill` | `#B26BFF` | filled primary button; white label (3.26:1 at the violet end — the one accepted exception, below) |
| `data` | `#F72585` | **data only** — chart lines and the Best Set dot |

Code token names: `--accent-interaction` (primary), `--accent-data` (data), `--primary-fill` (filled button fill), `--text-suggestion`.

Hard colour rules:

- **Primary** marks only: the Set currently being logged (a 3px left bar on its row), a filled primary button, the focus ring, and a selected control's outline (a category chip in its pressed state). Nothing else is primary. Never a large primary background behind body text.
- **Data** (magenta) appears only inside charts: the estimated 1RM line, the volume line, and the Best Set dot.
- **No accent colour ever sits behind a weight or rep numeral.** Numerals are `text`, except a pre-filled suggestion, which uses `text-suggestion` (`#A7AEB8`: 8.6:1 on `bg`, 7.6:1 on `surface-1`, 6.9:1 on `surface-2`) so a guess looks dimmer than a logged Set.
- No gradient between the two accents. The background carries three ambient flares over a vignette into `bg`: violet `#B26BFF` at 14% mid-left, magenta `#F72585` at 12% top-right, purple `#7928CA` at 20% bottom-right. Non-interactive, `pointer-events: none`, no blur, no box-shadow.
- Cards are glass: a white 6%→2% pane over `backdrop-filter: blur(24px)`, a 9% white border, a 12px radius and the card shadow (an inset 1px top highlight under a soft drop). Blur is scoped to cards and the filled button's halo is the only other shadow; everything else separates with a 1px border plus one step of the surface ramp.
- Contrast floor: body text and labels ≥4.5:1; a **logged** numeral ≥7:1; a **pre-filled** numeral ≥4.5:1. That is the only place the numeral floor is relaxed, and it is a deliberate trade so a guess cannot be mistaken for a logged Set. The single accepted exception outside that trade is the filled button's white label on the violet end of its gradient (3.26:1), carried by the drop shadow and the 17px semibold weight.

## Type

System font stack — `-apple-system, system-ui, "Segoe UI", Roboto, sans-serif`. No webfonts: the brief specifies Geist and Geist Mono, and they are deliberately not adopted, so the app keeps zero font downloads and instant first paint. Tabular numerals (`font-variant-numeric`) recover most of what Geist Mono would have given the weight and rep columns. `font-variant-numeric: tabular-nums` on every number.

| Role | Size / weight |
| --- | --- |
| Screen title | 20px / 600 |
| Exercise name | 17px / 600 |
| Set value (the hero) | 32px / 600, tabular |
| Body / labels | 15px / 400 |
| Secondary stat | 13px / 400, muted |
| Button label | 17px / 600 |

## Space and shape

- Spacing scale only: **4, 8, 12, 16, 24, 32**.
- Corner radius **12px** for cards (`--radius-card`); **8px** for rows and buttons (`--radius`); **6px** for small chips (`--radius-sm`).
- Minimum touch target **48×48**; the primary action row is **56–64** tall and sits at the bottom, in thumb reach.
- Horizontal page padding 16px.
- Motion: `--transition` (300ms, `cubic-bezier(0.4, 0, 0.2, 1)`) for anything hover- or press-shaped — border lifts, wash fades, scale-to-0.99, chevrons. `--motion` (140ms, 0ms under `prefers-reduced-motion`) for the Set-completion flip on a row and the update banner's entrance.

## Components

- **Card**: a glass pane — `white/6%` to `white/2%` gradient over `backdrop-filter: blur(24px)`, a `white/9%` border, 12px radius, and an inset top highlight under a soft drop shadow. Every card-like surface composes the one `.glass` class in `src/ui/glass.module.css` and keeps only its own padding and layout. On hover the border turns violet at 40% and a violet wash fades in; on press the card scales to 0.99.
- **Filled button**: violet→purple gradient (`#B26BFF → #9E46FF → #7928CA`) under a white half-height sheen, 8px radius, a 28px violet halo, **a white 17px/600 label with a drop shadow**, and a lighter gradient plus a wider halo on hover; presses scale to 0.99. White on the violet end measures **3.26:1** (the midpoint 4.40:1, the purple end 7.07:1) — below the text floor, accepted as the one exception, carried by the shadow and the semibold weight.
- **Badge**: pill, 11px uppercase, `rgb(255 255 255 / 4%)` on a `rgb(255 255 255 / 5%)` border, `text-muted` label (6.8:1 on the pill over `bg`, 5.2:1 over the brightest flare), used for group counts ("4 prontas"). A violet "Ativa" status tag is **deliberately absent**: the brief asks for one, but V2 uses it to mark the user's active Routine and v1 has no such concept, so no dead variant ships.
- **Screen title**: gradient-clipped white to 72% white, matching the V2 header.

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
