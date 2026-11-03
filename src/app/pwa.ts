import { registerSW } from "virtual:pwa-register";
import { announceExistingWaiting, createUpdateController } from "@/app/update";
import { findActiveSession } from "@/db/sessions";

/**
 * The real edges of the update policy: the generated service worker and the
 * Session repository. Kept apart from `@/app/update` so the policy can be
 * tested without the worker, and imported only by the entry point because the
 * virtual module exists only inside a Vite build.
 */
export const updateController = createUpdateController({
  // Read from the repository, never duplicated from screen state: a Session
  // open anywhere in the app blocks the notice until it is finished or
  // discarded.
  isSessionActive: async () => (await findActiveSession()) !== undefined,

  // Activates the waiting build and reloads. The worker fully precached the
  // new build before it started waiting, so the reload is safe offline; if it
  // never happens, the page keeps running the build it already has.
  applyUpdate: async () => {
    await updateServiceWorker();
  },
});

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh: () => {
    void updateController.announce();
  },
  // Offline-first: a registration failure costs updates, not the launch.
  onRegisterError: () => undefined,
});

// A build that landed while the app was closed is already waiting the moment
// this page opens, and the callback above never fires for it. Ask directly.
void (async () => {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    await announceExistingWaiting(updateController, registration);
  } catch {
    // No registration means no update; it must cost nothing at launch.
  }
})();
