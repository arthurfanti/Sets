# 10: Storage honesty

**What to build:** Telling the truth about where the data lives. Persistence is requested quietly, the state is visible in an About view, and the only irreversible action in the app costs typing.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Persistent storage is requested once at launch, silently, with no prompt or banner if it is refused.
- [ ] About is reachable from a muted link on Home and shows the app name, its version and the persistence state in plain words.
- [ ] About shows counts — Sessions, Exercises, and the date of the earliest Session — never bytes.
- [ ] About states plainly that there is no backup and that deleting the home-screen icon deletes the history.
- [ ] Delete-all names the number of Sessions and the date range it destroys, and requires typing a word before the action enables.
- [ ] Delete-all clears every store, including custom Exercises and User Routines, and the app returns to first-run state with seeds re-applied on next open.
