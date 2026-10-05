import { describe, expect, it } from "vitest";
import { DEFAULTS, extractPinFromLines } from "./store";

describe("extractPinFromLines", () => {
  it("prefers a larger printed PIN over a longer small-print number", () => {
    expect(
      extractPinFromLines(
        [
          { text: "Serial 123456789012345", height: 10 },
          { text: "PIN 4567890123", height: 38 },
        ],
        DEFAULTS,
      ),
    ).toBe("4567890123");
  });

  it("prefers the longer candidate when the printed sizes are equal", () => {
    expect(
      extractPinFromLines(
        [
          { text: "1234567890", height: 24 },
          { text: "123456789012", height: 24 },
        ],
        DEFAULTS,
      ),
    ).toBe("123456789012");
  });
});
