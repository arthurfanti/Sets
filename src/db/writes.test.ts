import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type SetsDb, seedDatabase } from "@/db/database";
import { appendSet, type SetInput, startSession } from "@/db/sessions";
import { createSetWriter, type PersistSet } from "@/db/writes";
import type { Session } from "@/domain";

let db: SetsDb;
let session: Session;

beforeEach(async () => {
  const name = `sets-writes-${crypto.randomUUID()}`;
  db = await openDatabase(name);
  await seedDatabase(db);
  const routine = (await db.getAll("routines"))[0];
  if (!routine) throw new Error("seed has no Routine");
  session = await startSession(routine.id, db);
});

const firstSet: SetInput = { exerciseId: "supino-reto", index: 0, weight: 80, reps: 8 };
const secondSet: SetInput = { exerciseId: "supino-reto", index: 1, weight: 82.5, reps: 6 };

/** A storage seam that refuses writes until `recover` or the limit runs out. */
function storage(limit = Number.POSITIVE_INFINITY) {
  let calls = 0;
  let refusals = limit;
  return {
    persist: (async (sessionId: string, input: SetInput) => {
      calls += 1;
      if (refusals > 0) {
        refusals -= 1;
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }
      return appendSet(sessionId, input, db);
    }) satisfies PersistSet,
    calls: () => calls,
    recover: () => {
      refusals = 0;
    },
  };
}

async function storedSets(): Promise<Session["sets"]> {
  return (await db.get("sessions", session.id))?.sets ?? [];
}

describe("set writer", () => {
  it("saves the Set on the first attempt and holds nothing", async () => {
    const device = storage(0);
    const writer = createSetWriter(device.persist);

    const result = await writer.write(session, firstSet);

    expect(result.saved).toBe(true);
    expect(result.pending).toBe(0);
    expect(result.session.sets).toHaveLength(1);
    expect(await storedSets()).toHaveLength(1);
    expect(device.calls()).toBe(1);
  });

  it("retries once and saves when the first attempt fails", async () => {
    const device = storage(1);
    const writer = createSetWriter(device.persist);

    const result = await writer.write(session, firstSet);

    expect(result.saved).toBe(true);
    expect(device.calls()).toBe(2);
    expect(await storedSets()).toHaveLength(1);
  });

  it("holds the Set after two refusals instead of dropping it", async () => {
    const device = storage(2);
    const writer = createSetWriter(device.persist);

    const result = await writer.write(session, firstSet);

    expect(result.saved).toBe(false);
    expect(result.pending).toBe(1);
    expect(device.calls()).toBe(2);
    expect(result.session.sets).toEqual([expect.objectContaining({ weight: 80, reps: 8 })]);
    expect(writer.pending()).toEqual([
      { sessionId: session.id, input: expect.objectContaining({ ...firstSet }) },
    ]);
    expect(await storedSets()).toHaveLength(0);
  });

  it("flushes held Sets on a later successful write", async () => {
    const device = storage(2);
    const writer = createSetWriter(device.persist);

    const held = await writer.write(session, firstSet);
    const next = await writer.write(held.session, secondSet);

    expect(next.saved).toBe(true);
    expect(next.pending).toBe(0);
    expect(next.session.sets).toHaveLength(2);
    expect(writer.pending()).toEqual([]);
    expect(await storedSets()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ index: 0, weight: 80 }),
        expect.objectContaining({ index: 1, weight: 82.5 }),
      ]),
    );
  });

  it("shows the held Set again when the Session screen reloads", async () => {
    const device = storage(2);
    const writer = createSetWriter(device.persist);
    await writer.write(session, firstSet);

    const stored = await db.get("sessions", session.id);
    if (!stored) throw new Error("Session disappeared");

    expect(writer.applyPending(stored).sets).toEqual([
      expect.objectContaining({ index: 0, weight: 80, reps: 8 }),
    ]);
  });

  it("reports the Session unsaved when a finish flush still fails, keeping the Sets", async () => {
    const device = storage();
    const writer = createSetWriter(device.persist);
    await writer.write(session, firstSet);

    const refused = await writer.flush();

    expect(refused.saved).toBe(false);
    expect(refused.pending).toBe(1);
    expect(writer.pending()).toHaveLength(1);
  });

  it("flushes held Sets when storage recovers", async () => {
    const device = storage();
    const writer = createSetWriter(device.persist);
    await writer.write(session, firstSet);

    device.recover();
    const flushed = await writer.flush();

    expect(flushed.saved).toBe(true);
    expect(flushed.pending).toBe(0);
    expect(await storedSets()).toHaveLength(1);
  });
});
