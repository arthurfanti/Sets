# UI system, styling and the numeral treatment

Type: grilling
Status: resolved

## Question

The whole interaction is numbers entered by thumb, in a gym, often one-handed and sweaty.

- Styling: plain CSS with custom properties, CSS modules, or Tailwind? Consider that no design system exists and the app is four screens.
- Theme: dark only, light only, or `prefers-color-scheme`? Gym lighting and battery both argue for one answer, not two.
- Type: which font carries the numbers, and does tabular-figure alignment matter for weights and reps lining up in a column?
- Touch targets and spacing: minimum target size, and the layout consequence for a phone held one-handed.
- Motion policy: where transitions earn their place (Set completion?) and where they do not.

Answer with a decided stack, the theme rule, and the numeric typeface rule.

## Answer

**Styling: CSS Modules over one tokens file.** `src/ui/tokens.css` holds every custom property; each component owns a `.module.css`. No Tailwind and no utility framework — four screens plus a picker do not earn the indirection, and Stitch returns HTML + CSS, so a token-for-token translation is the cheapest handoff. Component-local class names never repeat a literal colour, size, or duration.

**Theme: dark only.** One surface set, one contrast set. `prefers-color-scheme` is ignored deliberately; a light theme is a post-v1 change, not a preference toggle nobody asked for.

**Type: system stack, zero webfonts.** `-apple-system, system-ui, sans-serif` resolves to SF Pro on the Lifter's phone, which is instant on first paint and survives offline. `font-variant-numeric: tabular-nums` on every number so weights and reps do not jitter as digits change; weight 600 on the value being edited, 400 elsewhere.

**Contrast: AA as the floor, 7:1 on numbers.** Body and chrome meet 4.5:1; the Set being entered and every recorded Set value meet 7:1. The numerals are the string that must never be misread.

**Physical rules.** Spacing scale 4/8/12/16/24/32 px only. Minimum touch target 48×48 px, stepper buttons separated by at least 8 px. The primary action row is 56–64 px tall and sits within one-handed thumb reach. Motion is a 120–160 ms background/opacity change on Set completion and nothing else — no page transitions, no entrance animations — and all of it is disabled under `prefers-reduced-motion`.

**Colour: one accent, two uses.** A single accent hue marks the Set currently being logged and the primary action. Everything else is monochrome. The hue itself is owned by the identity ticket, so 06 fixes the rule and 07 supplies the value.

**Surfaces: borders, not shadows.** A two-step background ramp plus 1 px low-alpha borders. No box-shadows, no glass, no blur — shadows vanish on dark and cost paint on low-end phones.
