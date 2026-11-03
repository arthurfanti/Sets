import { describe, expect, it } from "vitest";
import { routes } from "@/app/routes";

/**
 * A contract test over the route table, not a rendering test: these are the
 * paths the spec fixes, and a duplicate or missing path is a broken back stack.
 * Behaviour gets tested at the component seam once the first real component
 * exists.
 */
describe("route table", () => {
  it("exposes the six documented paths, in order", () => {
    expect(routes.map((route) => route.path)).toEqual([
      "/",
      "/sessao/:id",
      "/rotina/:id",
      "/historico",
      "/exercicio/:id",
      "/sobre",
    ]);
  });

  it("gives every path an element", () => {
    for (const route of routes) {
      expect(route.element).toBeTruthy();
    }
  });
});
