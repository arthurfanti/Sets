// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Exercise } from "@/domain";
import { ExercisePicker } from "@/ui/components/ExercisePicker";

const mocks = vi.hoisted(() => ({
  listSelectableExercises: vi.fn(),
  listExercises: vi.fn(),
  hideExercise: vi.fn(),
  createExercise: vi.fn(),
  renameExercise: vi.fn(),
}));

vi.mock("@/db/exercises", () => ({
  listSelectableExercises: mocks.listSelectableExercises,
  hideExercise: mocks.hideExercise,
  createExercise: mocks.createExercise,
  renameExercise: mocks.renameExercise,
}));

vi.mock("@/db/repositories", () => ({
  listExercises: mocks.listExercises,
}));

const SUPINO: Exercise = {
  id: "supino-reto",
  name: "Supino reto",
  muscleGroup: "Peito",
  aliases: ["bench press"],
  source: "builtin",
};

const REMADA: Exercise = {
  id: "remada-curvada",
  name: "Remada curvada",
  muscleGroup: "Costas",
  source: "builtin",
};

beforeEach(() => {
  mocks.listSelectableExercises.mockResolvedValue([SUPINO, REMADA]);
  mocks.listExercises.mockResolvedValue([SUPINO, REMADA]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ExercisePicker", () => {
  it("matches an alias, not only the Exercise's name", async () => {
    const user = userEvent.setup();
    render(<ExercisePicker onPick={vi.fn()} onClose={vi.fn()} />);

    await user.type(await screen.findByLabelText("Buscar exercício"), "bench");

    expect(screen.getByRole("button", { name: "Adicionar Supino reto" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Adicionar Remada curvada" })).toBeNull();
  });

  it("offers to create the Exercise the search did not find", async () => {
    const user = userEvent.setup();
    render(<ExercisePicker onPick={vi.fn()} onClose={vi.fn()} />);

    await user.type(await screen.findByLabelText("Buscar exercício"), "remada cavalinho");
    await user.click(screen.getByRole("button", { name: "Criar exercício «remada cavalinho»" }));

    expect(screen.getByRole("dialog", { name: "Novo exercício" })).toBeTruthy();
  });

  it("shows an Exercise already in the plan as already added and does not offer it again", async () => {
    const onPick = vi.fn();
    render(<ExercisePicker onPick={onPick} onClose={vi.fn()} added={[SUPINO.id]} />);

    expect(await screen.findByText("Já adicionado")).toBeTruthy();
    expect(screen.getByText("Supino reto")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Adicionar Supino reto" })).toBeNull();
    expect(onPick).not.toHaveBeenCalled();
  });
});
