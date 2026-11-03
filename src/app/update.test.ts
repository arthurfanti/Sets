import { describe, expect, it, vi } from "vitest";
import { createUpdateController } from "@/app/update";

/**
 * The controller is the whole update policy, so it is tested where the app
 * observes it: the state the banner renders, and the two injected edges — "is a
 * Session open" and "activate the waiting build". The service worker itself is
 * never mocked; it owns nothing this policy decides.
 */
function setup(options: { sessionActive?: boolean } = {}) {
  const deps = {
    sessionActive: options.sessionActive ?? false,
    applied: 0,
    isSessionActive: vi.fn(async () => deps.sessionActive),
    applyUpdate: vi.fn(async () => {
      deps.applied += 1;
    }),
  };
  return Object.assign(deps, { controller: createUpdateController(deps) });
}

describe("update notice", () => {
  it("stays idle until a new build is waiting", () => {
    const { controller } = setup();
    expect(controller.getState()).toEqual({ kind: "idle" });
  });

  it("announces a waiting build when no Session is open", async () => {
    const { controller } = setup();
    await controller.announce();
    expect(controller.getState()).toEqual({ kind: "available" });
  });

  it("suppresses the notice while a Session is open", async () => {
    const { controller } = setup({ sessionActive: true });
    await controller.announce();
    expect(controller.getState()).toEqual({ kind: "suppressed" });
  });

  it("surfaces once the Session is finished", async () => {
    const deps = setup({ sessionActive: true });
    await deps.controller.announce();
    deps.sessionActive = false;
    await deps.controller.refresh();
    expect(deps.controller.getState()).toEqual({ kind: "available" });
  });

  it("hides again when a Session is started while the notice is up", async () => {
    const deps = setup();
    await deps.controller.announce();
    deps.sessionActive = true;
    await deps.controller.refresh();
    expect(deps.controller.getState()).toEqual({ kind: "suppressed" });
  });

  it("keeps the notice hidden when the Session check fails", async () => {
    const deps = setup({ sessionActive: true });
    await deps.controller.announce();
    deps.isSessionActive.mockRejectedValueOnce(new Error("storage refused"));
    await deps.controller.refresh();
    expect(deps.controller.getState()).toEqual({ kind: "suppressed" });
  });

  it("lets the Lifter dismiss the notice for this build", async () => {
    const { controller } = setup();
    await controller.announce();
    controller.dismiss();
    expect(controller.getState()).toEqual({ kind: "dismissed" });
    await controller.refresh();
    expect(controller.getState()).toEqual({ kind: "dismissed" });
  });

  it("announces a later build again after a dismissal", async () => {
    const { controller } = setup();
    await controller.announce();
    controller.dismiss();
    await controller.announce();
    expect(controller.getState()).toEqual({ kind: "available" });
  });

  it("notifies subscribers of every change and stops after unsubscribe", async () => {
    const { controller } = setup();
    const listener = vi.fn();
    const stop = controller.subscribe(listener);
    await controller.announce();
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    controller.dismiss();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("applying an update", () => {
  it("activates the waiting build", async () => {
    const deps = setup();
    await deps.controller.announce();
    await deps.controller.apply();
    expect(deps.applyUpdate).toHaveBeenCalledTimes(1);
    expect(deps.controller.getState()).toEqual({ kind: "applying" });
  });

  it("offers a retry when activation fails, on the build already running", async () => {
    const deps = setup();
    await deps.controller.announce();
    deps.applyUpdate.mockRejectedValueOnce(new Error("worker failed"));

    await deps.controller.apply();
    expect(deps.controller.getState()).toEqual({ kind: "failed" });

    await deps.controller.apply();
    expect(deps.applyUpdate).toHaveBeenCalledTimes(2);
    expect(deps.controller.getState()).toEqual({ kind: "applying" });
  });

  it("never activates a build the Lifter was not shown", async () => {
    const deps = setup({ sessionActive: true });
    await deps.controller.announce();
    await deps.controller.apply();
    expect(deps.applyUpdate).not.toHaveBeenCalled();
    expect(deps.controller.getState()).toEqual({ kind: "suppressed" });
  });

  it("never activates a dismissed build", async () => {
    const deps = setup();
    await deps.controller.announce();
    deps.controller.dismiss();
    await deps.controller.apply();
    expect(deps.applyUpdate).not.toHaveBeenCalled();
    expect(deps.controller.getState()).toEqual({ kind: "dismissed" });
  });

  it("does not activate twice while activation is under way", async () => {
    const deps = setup();
    await deps.controller.announce();
    const applying = deps.controller.apply();
    const again = deps.controller.apply();
    await Promise.all([applying, again]);
    expect(deps.applyUpdate).toHaveBeenCalledTimes(1);
    expect(deps.controller.getState()).toEqual({ kind: "applying" });
  });
});
