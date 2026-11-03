// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Exercise, Routine, Session } from "@/domain";
import { SessionScreen } from "@/ui/screens/SessionScreen";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  listFinishedSessions: vi.fn(),
  listExercises: vi.fn(),
  listRoutines: vi.fn(),
  finishSession: vi.fn(),
  addExerciseToSession: vi.fn(),
  discardSession: vi.fn(),
  findActiveSession: vi.fn(),
  startSession: vi.fn(),
  flush: vi.fn(),
  write: vi.fn(),
  clear: vi.fn(),
}));

vi.mock("@/db/sessions", () => {
  class ActiveSessionError extends Error {}
  return {
    ActiveSessionError,
    getSession: mocks.getSession,
    listFinishedSessions: mocks.listFinishedSessions,
    finishSession: mocks.finishSession,
    addExerciseToSession: mocks.addExerciseToSession,
    discardSession: mocks.discardSession,
    findActiveSession: mocks.findActiveSession,
    startSession: mocks.startSession,
  };
});

vi.mock("@/db/repositories", () => ({
  listExercises: mocks.listExercises,
  listRoutines: mocks.listRoutines,
}));

vi.mock("@/db/writes", () => ({
  getSetWriter: () => ({
    applyPending: (session: Session) => session,
    pending: () => [],
    flush: mocks.flush,
    write: mocks.write,
    clear: mocks.clear,
  }),
}));

const EXERCISE: Exercise = {
  id: "supino-reto",
  name: "Supino reto",
  muscleGroup: "Peito",
  source: "builtin",
};

const ROUTINE: Routine = {
  id: "rotina",
  name: "Push",
  source: "builtin",
  prescriptions: [{ exerciseId: EXERCISE.id, sets: 1, reps: 8 }],
};

const LIVE: Session = {
  id: "ses_1",
  routineId: ROUTINE.id,
  startedAt: Date.now(),
  plan: [{ exerciseId: EXERCISE.id, sets: 1, reps: 8 }],
  sets: [{ exerciseId: EXERCISE.id, index: 0, weight: 100, reps: 8, confirmedAt: Date.now() }],
};

beforeEach(() => {
  mocks.getSession.mockResolvedValue(LIVE);
  mocks.listFinishedSessions.mockResolvedValue([]);
  mocks.listExercises.mockResolvedValue([EXERCISE]);
  mocks.listRoutines.mockResolvedValue([ROUTINE]);
  mocks.flush.mockResolvedValue({ saved: true });
  mocks.finishSession.mockResolvedValue({ ...LIVE, endedAt: Date.now() });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderSession(id = "ses_1") {
  render(
    <MemoryRouter initialEntries={[`/sessao/${id}`]}>
      <Routes>
        <Route path="/sessao/:id" element={<SessionScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SessionScreen", () => {
  it("stays on the finished Session after Finish, keeping the Exercise links one tap away", async () => {
    const user = userEvent.setup();
    renderSession();

    await user.click(await screen.findByRole("button", { name: "Finalizar" }));

    expect(await screen.findByText("Esta sessão já foi encerrada.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Supino reto" }).getAttribute("href")).toBe(
      "/exercicio/supino-reto",
    );
    expect(mocks.finishSession).toHaveBeenCalledWith("ses_1");
  });

  it("makes Adicionar exercício the only way to log in an empty Session", async () => {
    mocks.getSession.mockResolvedValue({ ...LIVE, plan: [], sets: [] });
    renderSession();

    expect(await screen.findByText(/Nenhum exercício no Plano/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Adicionar exercício" })).toBeTruthy();
  });
});
