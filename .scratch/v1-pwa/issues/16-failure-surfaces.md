# Failure surfaces

Type: grilling
Status: resolved

## Question

The three ways storage fails, and what the Lifter sees for each. None of them has an answer yet, and the wrong one loses a workout silently.

- **IndexedDB unavailable** — Safari private browsing, or a blocked origin. Does the app refuse to start, start read-only, or start and lose everything on close?
- **Quota exceeded** — a write throws `QuotaExceededError` mid-Session. Is the Set kept in memory, retried, or dropped with a message?
- **A write that fails** for any other reason, mid-Set. What does the live screen say, and can the Lifter keep logging?

Also: is any of this surfaced ahead of time (a banner on Home) or only at the moment it breaks?

## Answer

**The blocking screen appears only when `indexedDB.open` rejects, and it is never a dead end.** A hard stop is right — logging into a store that cannot persist means every Set looks saved and none survive — but a stop with no exit turns one unreadable database into a permanently unusable app, and the app's own delete-all lives on a screen you cannot reach from there.

So the screen names the cause and always offers two actions: **Tentar de novo**, and a destructive **Apagar dados e começar de novo** that deletes the database and reloads, confirmed by typing `apagar` exactly as 13's delete-all does.

| Cause | Copy | Extra action |
| --- | --- | --- |
| `onblocked` — another open instance holds an old connection | "Feche as outras abas do Sets e tente de novo." | Retry only |
| `QuotaExceededError` — no disk space | "Sem espaço no aparelho. Libere espaço e tente de novo." | Retry only |
| Version mismatch, corrupt database, anything unknown | "Não foi possível abrir o histórico." | Retry **and** the destructive reset |

The reset is the escape hatch that makes the design safe: whatever state the database is in, the app can return to a working one. It costs the history, which `0001` already accepts as unrecoverable — better a working app with no data than an app that cannot open.

Private browsing falls into the blocked or unknown rows depending on the browser, and the copy says so: the fix is leaving private browsing, and the app cannot do it for you.

**Ephemeral storage that opens successfully is not detectable and is not treated as an error.** Nothing special happens; the About view already reports the persistence state. A warning the app cannot justify would train the lifter to ignore the real one.

**A write that fails mid-Session** retries once immediately. If it still fails, a persistent non-dismissable bar appears on the Session screen — **"Não foi possível salvar. Suas séries continuam aqui."** — and logging continues, because the values are held in memory and the next successful write flushes the queue. **Finalizar** attempts the flush; if it still fails, it reports the Session as unsaved and refuses to close. Dropping a Set silently is the one outcome that turns a bad minute into lost training.

**Everything here surfaces only at the moment it breaks**, plus the About line that already exists. A pre-emptive banner about a condition that usually never fires costs the attention needed on the day it does.
