import { appendSet, type SetInput } from "@/db/sessions";
import type { Session } from "@/domain";
import { applySet } from "@/domain/session";

/**
 * The write path for a Set, with the app's promise attached: a refused write
 * is retried once, then held in memory rather than dropped, and the next
 * successful write flushes everything held before it.
 *
 * The queue is memory only. That is the whole point of the banner: while the
 * device refuses, the Sets live on the screen and logging continues; closing
 * the app is the one way to lose them, which is why finishing refuses.
 */

export interface QueuedSet {
  sessionId: string;
  input: SetInput;
}

export interface WriteResult {
  /** The Session to render: stored, or with the held Set applied in memory. */
  session: Session;
  /** False when this Set is held for a later flush. */
  saved: boolean;
  /** Everything still held, including this Set when it failed. */
  pending: number;
}

export interface FlushResult {
  /** True only when nothing is left in memory. */
  saved: boolean;
  pending: number;
}

export type PersistSet = (sessionId: string, input: SetInput) => Promise<Session>;

export interface SetWriter {
  write(session: Session, input: SetInput): Promise<WriteResult>;
  flush(): Promise<FlushResult>;
  pending(): QueuedSet[];
  /** The stored Session with anything still held for it applied. */
  applyPending(session: Session): Session;
}

function keyOf(sessionId: string, input: SetInput): string {
  return `${sessionId}\u0000${input.exerciseId}\u0000${input.index}`;
}

export function createSetWriter(persist: PersistSet = appendSet): SetWriter {
  const queue = new Map<string, QueuedSet>();

  /** One retry, immediately: a transient refusal often clears on its own. */
  async function persistWithRetry(sessionId: string, input: SetInput): Promise<Session> {
    try {
      return await persist(sessionId, input);
    } catch {
      return persist(sessionId, input);
    }
  }

  async function flush(): Promise<FlushResult> {
    // Map iteration is insertion order, so held Sets reach the device in the
    // order the Lifter logged them. One failure stops the walk: the next Set
    // would meet the same wall.
    for (const [key, held] of queue) {
      try {
        await persist(held.sessionId, held.input);
      } catch {
        break;
      }
      queue.delete(key);
    }
    return { saved: queue.size === 0, pending: queue.size };
  }

  return {
    async write(session, input) {
      const key = keyOf(session.id, input);
      const confirmedAt = input.confirmedAt ?? Date.now();
      const confirmed: SetInput = { ...input, confirmedAt };
      const rendered = applySet(session, { ...confirmed, confirmedAt });
      try {
        await persistWithRetry(session.id, input);
        queue.delete(key);
        await flush();
        return { session: rendered, saved: true, pending: queue.size };
      } catch {
        // Re-confirming a slot replaces its held Set; Map keeps the original
        // insertion order, so the flush still follows the Lifter's sequence.
        queue.set(key, { sessionId: session.id, input: confirmed });
        return { session: rendered, saved: false, pending: queue.size };
      }
    },
    flush,
    pending: () => [...queue.values()],
    applyPending(session) {
      let withHeld = session;
      for (const held of queue.values()) {
        if (held.sessionId !== session.id) continue;
        withHeld = applySet(withHeld, {
          ...held.input,
          confirmedAt: held.input.confirmedAt ?? Date.now(),
        });
      }
      return withHeld;
    },
  };
}

let writer: SetWriter | undefined;

/**
 * One writer for the app, not one per screen: navigating away from a Session
 * and back must not discard Sets the device refused to store.
 */
export function getSetWriter(): SetWriter {
  writer ??= createSetWriter();
  return writer;
}
