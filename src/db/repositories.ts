import type { Routine } from "@/domain";

/**
 * The single boundary between the screens and storage.
 *
 * Everything in `ui/` reads through functions like this one and never touches a
 * database handle. Ticket #3 replaces these bodies with IndexedDB reads plus
 * seed-on-first-run; until then there is no store to read, so the list is empty.
 */
export async function listRoutines(): Promise<Routine[]> {
  return [];
}
