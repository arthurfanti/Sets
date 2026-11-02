# 08: Exercise page

**What to build:** The reward for logging — a per-Exercise page showing the headline Best Set, an estimated 1RM trend and weekly volume, each judged against the rep window that makes a Best Set meaningful.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] The page shows Best Set as the headline, computed by Epley estimated 1RM over Sets of 1–10 reps only.
- [ ] A Set outside 1–10 reps is recorded and listed, but never becomes the Best Set, and never clamps into the range.
- [ ] An estimated 1RM line renders per Session, with a 12-week window by default and an all-time toggle.
- [ ] Weekly volume renders as a secondary chart, bucketed Monday-start in local time.
- [ ] Both charts are hand-rolled SVG with no charting dependency, using the data accent only.
- [ ] A Session logged on a Sunday night lands in the week that has just ended, not the next one.
- [ ] An Exercise with no Sets shows a defined empty state rather than an axis with no line.
- [ ] Each chart exposes a text summary to assistive technology, since a line alone carries nothing.
