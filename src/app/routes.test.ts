import { describe, expect, it } from "vitest";
import { routes } from "@/app/routes";

describe("route table", () => {
  it("exposes the five screens at their own paths", () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toEqual(["/", "/sessao/:id", "/rotina/:slug", "/historico", "/exercicio/:slug"]);
  });

  it("gives every route an element to render", () => {
    for (const route of routes) {
      expect(route.element).toBeDefined();
    }
  });
});
