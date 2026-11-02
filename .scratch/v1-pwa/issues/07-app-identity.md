# App identity: name, icon, manifest

Type: grilling
Status: resolved

## Question

What is the app called on the home screen, and what does its icon look like?

- The name and `short_name`. This is the string the Lifter taps; it should not be "Workout Tracking App". Note `Workout` is on the glossary's _Avoid_ list, so the name should not reintroduce it as a synonym.
- Icon: source artwork (a supplied SVG/PNG) or something generated, and the sizes required (192, 512, maskable, apple-touch-icon).
- Theme colour and background colour, consistent with the theme rule from the styling ticket.
- Manifest fields: `display` (standalone?), `orientation`, `description`, `start_url`, and whether a splash/launch experience is worth configuring.
- Where the name appears in-app (header, About view) so the string has one owner.

Answer with the chosen name, the icon plan, and the manifest field list.

## Answer

**Name: `Sets`, short_name `Sets`.** Kept in English as the brand while all UI copy is pt-BR — a deliberate split, not an oversight.

**UI copy language: pt-BR, everywhere.** Every label, empty state, error and confirmation is Portuguese. English survives only in code identifiers, the app name, and `GLOSSARY.md`.

**The `treino` ban.** In pt-BR "treino" means both Routine and Session — the same ambiguity that banned "workout" in English. UI copy uses **Rotina**, **Sessão**, **Plano**, **Série**, **Melhor série**, **Exercício**, **Carga**, and never "treino". The pt-BR labels are recorded per term in `GLOSSARY.md`, and "treino" joins the _Avoid_ list in both languages.

**Icon: one hand-authored SVG**, the glyph **3×5** set in the app's numeric face, violet on the dark ground, inside the middle 80% safe zone. Exported once into 192×192, 512×512, 512×512 maskable, and a 180×180 apple-touch-icon. No raster, no AI-generated artwork.

**Palette, fixed** (measured against the base background, not eyeballed):

- `--bg` `#0B0D10`, `--surface-1` `#14171C`, `--surface-2` `#1D222A`, `--border` `rgba(255,255,255,0.08)`
- `--text` `#EDEFF2` (16.89:1), `--text-muted` `#8A919B` (6.12:1)
- `--accent-interaction` **violet `#B26BFF`** (5.97:1 base, 4.90:1 on surface 2)
- `--accent-data` **magenta `#F72585`** (5.15:1 base, 4.23:1 on surface 2)

Rejected: vivid `#A855F7`, because it measures 4.04:1 on surface 2 and so cannot be used as interface colour there. `#B26BFF` keeps the vividness while clearing AA on both surfaces.

**Accent roles.** Violet is interaction only: the live-Set marker bar, the primary action, the focus ring. Magenta is data only: the 1RM trend line and the Best Set dot. No gradient between them. **Neither accent ever carries a weight or rep numeral** — numerals are `#EDEFF2` at 16.9:1, and no accent clears 7:1.

**Manifest.** `display: standalone`, `orientation: portrait`, `start_url: /`, `background_color` and `theme_color` both `#0B0D10`, `description` in pt-BR, no custom splash screen.

**Enforced by a test:** a token test asserts the numeral pairs clear 7:1 and every body-text pair clears 4.5:1, so later colour tweaks cannot silently break the floor. Palette source of truth for the design handoff is `docs/design/palette.html`.
