import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatElapsed,
  formatEstimate,
  formatMonthDay,
  formatTimeAgo,
} from "../format";

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

describe("formatTimeAgo", () => {
  const now = new Date("2026-10-02T12:00:00.000Z");

  it.each([
    ["2026-10-02T11:59:30.000Z", "just now"],
    ["2026-10-02T11:58:00.000Z", "2 min ago"],
    ["2026-10-02T09:00:00.000Z", "3 h ago"],
    ["2026-10-01T11:00:00.000Z", "1 day ago"],
    ["2026-09-29T12:00:00.000Z", "3 days ago"],
  ])("formats %s as %s", (isoTime, expected) => {
    const formatted = formatTimeAgo(isoTime, now);

    expect(formatted).toBe(expected);
  });
});
