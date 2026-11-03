import { describe, expect, it } from "vitest";
import { formatKg, formatNumber } from "@/ui/format";

describe("formatNumber", () => {
  it("uses a pt-BR decimal comma, so 92.5 kg never reads as 92.5", () => {
    expect(formatNumber(92.5)).toBe("92,5");
    expect(formatKg(92.5)).toBe("92,5 kg");
  });

  it("leaves whole numbers bare and rounds floating noise", () => {
    expect(formatNumber(100)).toBe("100");
    expect(formatNumber(92.49999999999999)).toBe("92,5");
  });
});
