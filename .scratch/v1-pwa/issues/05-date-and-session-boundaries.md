# Date, week and Session boundaries

Type: grilling
Status: resolved
Blocked by: 04

## Question

Every progress number in this app depends on time bucketing, and none of it has been decided.

- How a Session records its moment: ISO UTC instant, or local wall-clock date plus time? (A 6am session in one timezone must not drift into the previous week.)
- What "this week" means for the volume chart: week start (Monday?), local time, and whether a Session dated in the future or backfilled counts.
- A Session left open overnight, or for three days: does it resume, split, or get flagged? The single-active-Session rule needs a boundary.
- Whether a finished Session's date can be edited, and whether Sessions can be deleted.
- What `duration` means for an empty Session and one resumed across days.

Answer with the stored representation, the week-bucketing rule, and the stale-Session policy.

## Answer

**Times are epoch milliseconds**, `startedAt` and `endedAt`, bucketed into days and weeks at render time in the device's local zone. No stored `yyyy-mm-dd`: a second source of truth is a second thing that can disagree. Accepted consequence: changing timezone re-buckets past Sessions, which on a single-device app is a non-event.

**A week is Monday 00:00 to Sunday 23:59, local**, labelled by its Monday date. In v1 a Session can only be started now — no backdating, no future-dated Sessions — so the volume chart never shows a future bucket and history never gains entries retroactively.

**A Session left open is never auto-closed.** On the next open, if the active Session started on an earlier local date, the app surfaces "Sessão de 14 nov ainda aberta" and offers **Continuar** or **Finalizar**. Finalizar sets `endedAt` to the **last logged Set's timestamp**, not to now, so duration never counts the days the app sat closed. An empty Session finished this way records duration 0 and is discardable.

**A finished Session can be deleted**, behind a confirmation naming its Routine and date. `startedAt` is immutable — changing it would silently re-bucket history and every chart. Set weight and reps are editable to correct a typo; adding or removing Exercises from a finished Session is not.
