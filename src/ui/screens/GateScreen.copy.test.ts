import { describe, expect, it } from "vitest";
import { confirmsDeletion } from "@/ui/confirmation";
import { GATE_TITLE, gateCopy, RESET_LABEL } from "@/ui/screens/GateScreen.copy";

describe("blocked-database copy", () => {
  it("tells the Lifter to close the other tabs when the open was blocked", () => {
    expect(gateCopy("blocked").body).toBe("Feche as outras abas do Sets e tente de novo.");
  });

  it("names the missing space when the device refused the open for quota", () => {
    expect(gateCopy("quota").body).toBe("Sem espaço no aparelho. Libere espaço e tente de novo.");
  });

  it("admits the unknown case instead of inventing a cause", () => {
    expect(gateCopy("unknown").body).toBe("Não foi possível abrir o histórico.");
  });

  it("offers the destructive reset only where retry cannot help", () => {
    expect(gateCopy("unknown").canReset).toBe(true);
    expect(gateCopy("blocked").canReset).toBe(false);
    expect(gateCopy("quota").canReset).toBe(false);
  });

  it("mentions private browsing only as a possible fix, never as a detected cause", () => {
    expect(gateCopy("unknown").hint).toContain("janela privada");
    expect(gateCopy("blocked").hint).toContain("janela privada");
    expect(gateCopy("quota").hint).toBeUndefined();
  });

  it("names the action the reset actually performs", () => {
    expect(RESET_LABEL).toBe("Apagar dados e começar de novo");
    expect(GATE_TITLE).toBe("Não foi possível abrir o Sets.");
  });

  it("requires the exact word, forgiving case and stray spaces", () => {
    expect(confirmsDeletion("apagar")).toBe(true);
    expect(confirmsDeletion(" Apagar ")).toBe(true);
    expect(confirmsDeletion("apagar tudo")).toBe(false);
    expect(confirmsDeletion("apaga")).toBe(false);
  });
});
