# 09: Offline and prompted updates

**What to build:** The app works with no network and never swaps versions under the Lifter's hands. A new build is announced outside a Session and applied only when they ask for it.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] After one completed load, the app cold-starts with no network and every screen works from cache.
- [ ] A new deployment shows a dismissable "Nova versão disponível" notice with an update action.
- [ ] The notice never appears while a Session is active, and appears once the Session is finished or discarded.
- [ ] Tapping update activates the waiting worker and reloads into the new version with no data lost.
- [ ] An interrupted update leaves the app on the previous version rather than a blank screen.
- [ ] Offline use logs Sets normally and they persist across a cold start.
