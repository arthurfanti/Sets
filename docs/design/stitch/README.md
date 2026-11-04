# Stitch artefacts — historical

These five screens were generated in Stitch for the **v1** build and are kept as a
record of the layout work. **Their colours are out of date.**

The app was restyled to the `Obsidian Athletics` system without touching layout:
new surfaces, an amber data accent replacing magenta, 8px radii, and one radial
vignette. `apply_design_system` and `edit_screens` both reported success and
changed nothing in Stitch, so these files were never re-rendered.

For the current look, the running app is the source of truth:

- https://sets-40e.pages.dev
- `docs/design/DESIGN.md` — palette, type, spacing, contrast floors
- `src/ui/tokens.css` — the values the code actually reads

Use these screens for composition and hierarchy, never for colour. If you need
current pictures, regenerate them in Stitch with `generate_variants` and export
into a new folder rather than overwriting this one.
