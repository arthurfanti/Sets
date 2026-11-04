# Workout Tracking App

## Agent skills

### Issue tracker

Issues live as GitHub issues in `arthurfanti/Sets`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, label strings equal to their names: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Local dev

Vite serves on **5173**, and only 5173. `npm run dev`, never a custom `--port`.

- One server at a time. If 5173 is occupied the stale process is ours: `lsof -ti:5173 | xargs kill`, then start again. Do not dodge it onto another port.
- Stop the server when verification is done (`lsof -ti:5173 | xargs kill`); do not leave it running between turns.
