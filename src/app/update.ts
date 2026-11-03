/**
 * The update policy, independent of the service worker and of React.
 *
 * A new build is precached by the worker but never takes over on its own: it
 * waits, the Lifter is told outside a Session, and only their tap activates it.
 * Two facts the policy needs are injected — whether a Session is open (read
 * from the repository) and how to activate the waiting build (the worker's
 * virtual module) — so this module stays the unit under test.
 */
export type UpdateState =
  /** No new build is waiting. */
  | { kind: "idle" }
  /** A build waits, but a Session is open: the notice is fully suppressed. */
  | { kind: "suppressed" }
  /** A build waits and the Lifter may act on it. */
  | { kind: "available" }
  /** The Lifter hid the notice for this build; it returns only for the next. */
  | { kind: "dismissed" }
  /** Activation is under way; the reload into the new build follows. */
  | { kind: "applying" }
  /** Activation failed; the previous build keeps running and can be retried. */
  | { kind: "failed" };

export interface UpdateDependencies {
  /** True while a Session is open. Read from the repository, never cached. */
  isSessionActive(): Promise<boolean>;
  /** Activates the waiting worker and reloads into the new build. */
  applyUpdate(): Promise<void>;
}

export interface UpdateController {
  /** The worker reports a new build waiting. */
  announce(): Promise<void>;
  /** Re-reads whether a Session is open; call after every navigation. */
  refresh(): Promise<void>;
  dismiss(): void;
  apply(): Promise<void>;
  getState(): UpdateState;
  subscribe(listener: () => void): () => void;
}

/**
 * A worker that started waiting *before* this page loaded never fires the
 * worker's "need refresh" callback — that callback reports an install this page
 * watched. Without this check, a deploy that landed while the app was closed
 * leaves the Lifter on an old build with no way to learn about it.
 */
export async function announceExistingWaiting(
  controller: Pick<UpdateController, "announce">,
  registration: Pick<ServiceWorkerRegistration, "waiting"> | undefined | null,
): Promise<void> {
  if (registration?.waiting) await controller.announce();
}

export function createUpdateController(dependencies: UpdateDependencies): UpdateController {
  const listeners = new Set<() => void>();

  let waiting = false;
  let sessionActive = false;
  let dismissed = false;
  let applying = false;
  let failed = false;

  function derive(): UpdateState {
    // A Session outranks everything: the notice must be absent from the screen
    // the Lifter is training on, including its failure and applying forms.
    if (!waiting) return { kind: "idle" };
    if (sessionActive) return { kind: "suppressed" };
    if (applying) return { kind: "applying" };
    if (failed) return { kind: "failed" };
    if (dismissed) return { kind: "dismissed" };
    return { kind: "available" };
  }

  let state = derive();

  function publish(): void {
    const next = derive();
    if (next.kind === state.kind) return;
    state = next;
    for (const listener of listeners) listener();
  }

  async function readSession(): Promise<void> {
    try {
      sessionActive = await dependencies.isSessionActive();
    } catch {
      // A failed check must never surface the notice: leaving the last known
      // answer in place is the only choice that cannot interrupt training.
    }
  }

  return {
    async announce() {
      // Each report is a build taking the waiting slot; it is new to the
      // Lifter even if they dismissed the one before it.
      waiting = true;
      dismissed = false;
      failed = false;
      applying = false;
      await readSession();
      publish();
    },

    async refresh() {
      if (!waiting) return;
      await readSession();
      publish();
    },

    dismiss() {
      if (state.kind !== "available" && state.kind !== "failed") return;
      dismissed = true;
      failed = false;
      publish();
    },

    async apply() {
      if (state.kind !== "available" && state.kind !== "failed") return;
      applying = true;
      failed = false;
      publish();
      try {
        await dependencies.applyUpdate();
      } catch {
        // The waiting build is discarded here, so the page keeps the build it
        // already has; the Lifter gets a retry instead of a blank screen.
        applying = false;
        failed = true;
        publish();
      }
    },

    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
