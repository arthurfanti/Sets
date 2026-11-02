# 05: Start a Session and log Sets

**What to build:** The core of the app — start from a Routine and log a Set in a few taps because the values are already there. The Session snapshots its Plan, pre-fills every slot, persists each Set the instant it is confirmed, and comes back exactly as it was after the app is killed.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Tapping a Routine starts a Session whose Plan is a snapshot: later Routine edits do not change it.
- [ ] Each slot pre-fills from the Set at the same index in the most recent finished Session containing that Exercise, walking back at most five Sessions.
- [ ] If that Session logged fewer Sets, its last Set for the Exercise is used; if it logged none, the Routine's target weight is the fallback.
- [ ] Reps pre-fill from what was actually done, never from the lower bound of the prescribed range.
- [ ] Pre-filled values render muted and flip to full contrast once confirmed or edited.
- [ ] Confirming a Set persists it immediately and the active highlight advances to the next slot.
- [ ] Weight and reps can be typed exactly, and the controls are labelled for assistive technology.
- [ ] Killing the app mid-Session and reopening restores the Session with the same active slot and every confirmed Set intact.
- [ ] Only one Session can be active; starting another asks whether to resume or discard the open one.
- [ ] An Exercise can be added to the live Session without leaving it.
