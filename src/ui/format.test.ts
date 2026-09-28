import { describe, expect, it } from "vitest";

import { formatDate, formatElapsed, formatEstimate, formatMonthDay } from "./format";

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

describe("formatMonthDay", () => {
  it("prints a day as month and day", () => {
    const formatted = formatMonthDay("2026-09-24");

    expect(formatted).toBe("Sep 24");
  });
});

describe("formatElapsed", () => {
  it.each([
    [0, "00:00"],
    [65_000, "01:05"],
    [45 * 60_000, "45:00"],
    [3_723_000, "1:02:03"],
  ])("formats %i ms as %s", (milliseconds, expected) => {
    const formatted = formatElapsed(milliseconds);

    expect(formatted).toBe(expected);
  });
});
