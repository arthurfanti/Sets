import { describe, expect, it } from "vitest";
import { moveItem } from "@/domain/order";

const list = ["a", "b", "c", "d"];

describe("moveItem", () => {
  it("moves an item to a new index, shifting the rest", () => {
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
  });

  it("leaves the list alone when the move goes nowhere", () => {
    expect(moveItem(list, 1, 1)).toEqual(list);
    expect(moveItem(list, 0, 9)).toEqual(list);
  });

  it("does not mutate the list it was given", () => {
    moveItem(list, 2, 0);
    expect(list).toEqual(["a", "b", "c", "d"]);
  });
});
