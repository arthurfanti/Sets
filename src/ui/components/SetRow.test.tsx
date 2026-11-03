// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SetRow } from "@/ui/components/SetRow";

afterEach(cleanup);

const labels = {
  exerciseName: "Supino reto",
  position: 1,
};

function weightInput(): HTMLInputElement {
  return screen.getByLabelText("Carga da série 1 de Supino reto") as HTMLInputElement;
}

function repsInput(): HTMLInputElement {
  return screen.getByLabelText("Repetições da série 1 de Supino reto") as HTMLInputElement;
}

describe("SetRow", () => {
  it("shows a pre-filled slot muted, with labelled weight and reps controls", () => {
    render(<SetRow {...labels} weight={100} reps={8} prefilled active={false} confirmed={false} />);

    expect(weightInput().value).toBe("100");
    expect(repsInput().value).toBe("8");
    expect(weightInput().dataset.muted).toBe("true");
    expect(repsInput().dataset.muted).toBe("true");
    expect(screen.getByRole("button", { name: "Confirmar série 1 de Supino reto" })).toBeTruthy();
  });

  it("renders a fractional suggestion with a comma", () => {
    render(
      <SetRow {...labels} weight={92.5} reps={8} prefilled active={false} confirmed={false} />,
    );

    expect(weightInput().value).toBe("92,5");
  });

  it("flips the typed values to full contrast and confirms the exact numbers", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(async () => undefined);
    render(
      <SetRow
        {...labels}
        weight={100}
        reps={8}
        prefilled
        active
        confirmed={false}
        onConfirm={onConfirm}
      />,
    );

    await user.clear(weightInput());
    await user.type(weightInput(), "92,5");
    await user.clear(repsInput());
    await user.type(repsInput(), "5");

    expect(weightInput().dataset.muted).toBe("false");
    expect(repsInput().dataset.muted).toBe("false");

    await user.click(screen.getByRole("button", { name: "Confirmar série 1 de Supino reto" }));
    expect(onConfirm).toHaveBeenCalledWith(92.5, 5);
  });

  it("marks the live row and moves the mark when the parent advances it", () => {
    const { rerender } = render(
      <SetRow {...labels} weight={100} reps={8} prefilled active confirmed={false} />,
    );
    expect(weightInput().closest("li")?.dataset.active).toBe("true");

    rerender(
      <SetRow {...labels} weight={100} reps={8} prefilled={false} active={false} confirmed />,
    );

    expect(weightInput().closest("li")?.dataset.active).toBe("false");
    expect(weightInput().dataset.muted).toBe("false");
    expect(
      (screen.getByRole("button", { name: /Confirmar série 1/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
