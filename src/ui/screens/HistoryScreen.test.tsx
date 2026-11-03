// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryScreen } from "@/ui/screens/HistoryScreen";

const mocks = vi.hoisted(() => ({
  listFinishedSessions: vi.fn(),
  deleteFinishedSession: vi.fn(),
  updateSet: vi.fn(),
  startEmptySession: vi.fn(),
  listExercises: vi.fn(),
  listRoutines: vi.fn(),
}));

vi.mock("@/db/sessions", () => {
  class ActiveSessionError extends Error {
    readonly session: { id: string };
    constructor(session: { id: string }) {
      super("open");
      this.session = session;
    }
  }
  return {
    ActiveSessionError,
    listFinishedSessions: mocks.listFinishedSessions,
    deleteFinishedSession: mocks.deleteFinishedSession,
    updateSet: mocks.updateSet,
    startEmptySession: mocks.startEmptySession,
  };
});

vi.mock("@/db/repositories", () => ({
  listExercises: mocks.listExercises,
  listRoutines: mocks.listRoutines,
}));

beforeEach(() => {
  mocks.listFinishedSessions.mockResolvedValue([]);
  mocks.listExercises.mockResolvedValue([]);
  mocks.listRoutines.mockResolvedValue([]);
  mocks.startEmptySession.mockResolvedValue({
    id: "ses_livre",
    routineId: null,
    startedAt: Date.now(),
    plan: [],
    sets: [],
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderHistory() {
  render(
    <MemoryRouter initialEntries={["/historico"]}>
      <Routes>
        <Route path="/historico" element={<HistoryScreen />} />
        <Route path="/sessao/:id" element={<p>Sessão aberta</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HistoryScreen", () => {
  it("starts an empty Session from the Session list and opens it", async () => {
    const user = userEvent.setup();
    renderHistory();

    const start = await screen.findByRole("button", { name: "Iniciar sessão livre" });
    await user.click(start);

    expect(await screen.findByText("Sessão aberta")).toBeTruthy();
    expect(mocks.startEmptySession).toHaveBeenCalledTimes(1);
  });
});
