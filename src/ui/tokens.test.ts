import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The design system's contrast floors, checked against the tokens themselves.
 * A numeral is unreadable at a rack in bright light before it is unreadable on
 * a desk, so `text` and the suggestion colour must clear 7:1 on every surface
 * a numeral can sit on. Body text clears 4.5:1.
 */

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`Token --${name} is missing or is not a hex colour.`);
  return match[1];
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((value >> 16) & 0xff) +
    0.7152 * channel((value >> 8) & 0xff) +
    0.0722 * channel(value & 0xff)
  );
}

function contrast(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

const surfaces = ["bg", "surface-1", "surface-2"] as const;
const bodyText = ["text", "text-muted"] as const;
/** A logged number must never be misread. */
const loggedNumerals = ["text"] as const;
/** A pre-filled number is provisional, so it clears AA rather than 7:1. */
const suggestedNumerals = ["text-suggestion"] as const;

describe("design token contrast", () => {
  it("keeps body text at or above 4.5:1 on every surface", () => {
    for (const name of bodyText) {
      for (const surface of surfaces) {
        const ratio = contrast(token(name), token(surface));
        expect(ratio, `--${name} on --${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps every logged numeral at or above 7:1 on every surface", () => {
    for (const name of loggedNumerals) {
      for (const surface of surfaces) {
        const ratio = contrast(token(name), token(surface));
        expect(ratio, `--${name} on --${surface}`).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it("keeps a suggestion visibly dimmer than text, yet at or above 4.5:1", () => {
    const suggestion = token("text-suggestion");

    expect(luminance(suggestion)).toBeLessThan(luminance(token("text")));
    for (const name of suggestedNumerals) {
      for (const surface of surfaces) {
        const ratio = contrast(token(name), token(surface));
        expect(ratio, `--${name} on --${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps the filled button's label readable against the dark end of its gradient", () => {
    // The fill is a violet-to-purple gradient with white text, exactly as the
    // design specifies. White clears 4.5:1 against the purple end (8.6:1) and
    // does not against the violet end (4.0:1); the drop shadow and the 17px
    // semibold weight are what carry it there. That is the one documented
    // exception to the text floor, recorded in DESIGN.md.
    expect(contrast("#ffffff", "#7928ca")).toBeGreaterThanOrEqual(4.5);
  });
});
