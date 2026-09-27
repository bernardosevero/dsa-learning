import { describe, expect, it } from "vitest";

import { formatDate, formatEstimate } from "./format";

describe("formatDate", () => {
  it("prints a day as weekday, month and day", () => {
    const formatted = formatDate("2026-10-08");

    expect(formatted).toBe("Thu, Oct 8");
  });
});

describe("formatEstimate", () => {
  it.each([
    [45, "~45m"],
    [60, "~1h"],
    [110, "~1h 50m"],
    [120, "~2h"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    const formatted = formatEstimate(minutes);

    expect(formatted).toBe(expected);
  });
});
