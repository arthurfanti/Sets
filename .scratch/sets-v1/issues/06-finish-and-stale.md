# 06: Finish, discard, and the stale Session

**What to build:** Closing a Session honestly. Finish ends it at the last logged Set, Discard deletes the draft behind a confirmation, and a Session left open overnight is brought back rather than silently closed.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Finalizar closes the Session and records a duration measured to the last logged Set, not to the moment of tapping.
- [ ] Descartar deletes the draft Session behind a confirmation and returns to Home.
- [ ] An empty Session that is finished records a zero duration and can be discarded.
- [ ] A Session left open across a local date boundary is surfaced on the next launch as still open, offering Continue or Finish.
- [ ] Finishing a stale Session does not count the intervening gap as training time.
- [ ] Completing a Session never rewrites the Routine it came from, even where weights and Exercises deviated.
