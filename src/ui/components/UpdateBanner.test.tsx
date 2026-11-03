// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createUpdateController } from "@/app/update";
import { UpdateBanner } from "@/ui/components/UpdateBanner";

afterEach(cleanup);

function setup(options: { sessionActive?: boolean } = {}) {
  const deps = {
    sessionActive: options.sessionActive ?? false,
    isSessionActive: vi.fn(async () => deps.sessionActive),
    applyUpdate: vi.fn(async () => undefined),
  };
  const controller = createUpdateController(deps);
  render(<UpdateBanner controller={controller} />);
  return { ...deps, controller };
}

describe("update banner", () => {
  it("announces the new build with an action", async () => {
    const { controller } = setup();
    await controller.announce();

    expect(screen.getByText("Nova versão disponível.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeTruthy();
  });

  it("draws nothing while a Session is open", async () => {
    const { controller } = setup({ sessionActive: true });
    await controller.announce();

    expect(screen.queryByText("Nova versão disponível.")).toBeNull();
  });

  it("disappears when the Lifter dismisses it", async () => {
    const { controller } = setup();
    await controller.announce();

    await userEvent.click(screen.getByRole("button", { name: "Depois" }));
    expect(screen.queryByText("Nova versão disponível.")).toBeNull();
  });

  it("applies the update when the Lifter taps the action", async () => {
    const { controller, applyUpdate } = setup();
    await controller.announce();

    await userEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(applyUpdate).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Atualizando…")).toBeTruthy();
  });
});
