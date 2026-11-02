# 01: Scaffold and dev loop

**What to build:** A working development environment for the app: strict TypeScript, a linter and formatter, a test runner, the router shell with its five routes rendering placeholders, and the design tokens. Nothing is deployed and nothing is installable yet — this ticket ends when a fresh clone can build, typecheck, lint and test cleanly.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A fresh clone installs and runs the dev server with one documented command.
- [ ] Strict TypeScript with unchecked-index and exact-optional-property checks enabled; `tsc --noEmit` passes.
- [ ] One formatter/linter runs clean across the repo, and the same command is used by people and CI.
- [ ] The test runner executes and a trivial suite passes.
- [ ] Five routes exist — home, session, routine editor, history, exercise — reachable by direct URL, each rendering a placeholder, with the hardware back gesture returning to the previous route rather than exiting.
- [ ] Design tokens (colour ramp, spacing scale, radius, type sizes) exist as custom properties; components read them and never repeat a literal colour or size.
- [ ] The domain, seed-data, database, UI and app modules exist as separate units, with UI importing repositories rather than a database handle.
