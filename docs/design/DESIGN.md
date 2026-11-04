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
| `text-suggestion` | `#9BA1A6` | pre-filled Set values: dimmer than `text` |
| `primary` | `#B26BFF` | **interaction only** |
| `primary-fill` | `#B26BFF` | filled primary button, with `#0C0E11` on it (5.7:1) |
| `data` | `#F72585` | **data only** — chart lines and the Best Set dot |
| `flare-primary` / `flare-data` | `#B26BFF` / `#F72585` | the two ambient flares, at 22% and 14% |

Code token names: `--accent-interaction` (primary), `--accent-data` (data), `--primary-fill` / `--primary-fill-text` (filled button), `--text-suggestion`.

Hard colour rules:

- **Primary** marks only: the Set currently being logged (a 3px left bar on its row), a filled primary button, and the focus ring. Nothing else is primary. Never a large primary background behind body text.
- **Data** (magenta) appears only inside charts: the estimated 1RM line, the volume line, and the Best Set dot.
- **No accent colour ever sits behind a weight or rep numeral.** Numerals are `text`, except a pre-filled suggestion, which uses `text-suggestion` (`#A7AEB8`: 8.3:1 on `bg`, 7.3:1 on `surface-1`, 6.4:1 on `surface-2`) so a guess looks dimmer than a logged Set.
- No gradient between the two accents. The background carries two ambient flares — violet at 22% from the top left, magenta at 14% from the top right — over a vignette into `bg`. Non-interactive, no blur, no box-shadow.
- The brief asks for glassmorphic translucent cards. They are **solid** here instead: the background behind them is nearly flat, so translucency buys almost nothing and `backdrop-filter` costs real paint on a mid-range phone. Border plus one surface step does the separation.
- No shadows, no blur, no glass. Separation is a 1px border plus one step of the surface ramp.
- Contrast floor: body text and labels ≥4.5:1; a **logged** numeral ≥7:1; a **pre-filled** numeral ≥4.5:1. That is the only place the numeral floor is relaxed, and it is a deliberate trade so a guess cannot be mistaken for a logged Set.

## Type

System font stack — `-apple-system, system-ui, "Segoe UI", Roboto, sans-serif`. No webfonts: the brief specifies Geist and Geist Mono, and they are deliberately not adopted, so the app keeps zero font downloads and instant first paint. Tabular numerals (`font-variant-numeric`) recover most of what Geist Mono would have given the weight and rep columns. `font-variant-numeric: tabular-nums` on every number.

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
- Corner radius **8px** for cards, rows and buttons; **6px** for small chips.
- Minimum touch target **48×48**; the primary action row is **56–64** tall and sits at the bottom, in thumb reach.
- Horizontal page padding 16px.

## Components

- **Card**: `--surface-1`, 1px `--border`, `--radius-card` (12px), with a violet-to-transparent wash (`--wash`) as a background layer. The leading card in a list also gets a 1px violet edge and a soft magenta glow, so emphasis never needs a second colour.
- **Filled button**: solid `--primary-fill` with a white top reflection (`--reflection`) and an outer violet glow (`--glow-primary`). The fill stays solid rather than the brief's gradient, because a violet→purple gradient puts the label under 4.5:1 at the dark end.
- **Badge**: pill, 11px uppercase, `rgb(255 255 255 / 4%)` on a `rgba(255,255,255,0.05)` border, used for group counts ("4 prontas"). A square-cornered violet variant exists for a status tag, and is not yet used because v1 has no notion of an active Routine.
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
