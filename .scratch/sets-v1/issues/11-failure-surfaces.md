# 11: Failure surfaces

**What to build:** What happens when storage says no. The app refuses to pretend it is saving, but can always be recovered — and a failed write mid-Session never silently drops a Set.

**Blocked by:** 10

**Status:** ready-for-agent

- [ ] If the database refuses to open, the app does not enter the normal flow: a blocking screen names the cause and explains it in Portuguese.
- [ ] The blocking screen always offers retry, and offers a destructive reset confirmed by typing a word.
- [ ] The destructive reset deletes the database and returns the app to a working first-run state, even when the database is corrupt.
- [ ] The copy differs per cause — another open instance, no disk space, unknown or corrupt — and never claims a cause it cannot detect.
- [ ] A write that fails during a Session retries once, then shows a persistent non-dismissable notice that the Set was not saved.
- [ ] Logging continues while a write is failing, and a later successful write flushes the held Sets.
- [ ] Finish attempts a flush and reports the Session as unsaved rather than closing if it still fails.
- [ ] Ephemeral-but-working storage is not treated as an error and produces no warning.
