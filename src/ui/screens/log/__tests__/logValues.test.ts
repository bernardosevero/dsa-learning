import { describe, expect, it } from "vitest";

import { countMinutesSince, createInitialLogValues, validateLog } from "../logValues";

const STARTED_AT = "2026-10-01T10:00:00.000Z";

describe("countMinutesSince", () => {
  it.each([
    ["2026-10-01T10:00:10.000Z", 1],
    ["2026-10-01T10:19:01.000Z", 20],
    ["2026-10-01T10:20:00.000Z", 20],
  ])("rounds the time up to whole minutes, at least 1 (%s)", (now, expected) => {
    const minutes = countMinutesSince(STARTED_AT, new Date(now));

    expect(minutes).toBe(expected);
  });
});

describe("validateLog", () => {
  it("trims the free text", () => {
    const values = {
      ...createInitialLogValues(null, 20),
      rating: "easy" as const,
      keyInsight: "  a  ",
    };

    const result = validateLog(values);

    expect(result).toEqual({
      ok: true,
      value: { rating: "easy", timeMinutes: 20, help: "none", keyInsight: "a", notes: "" },
    });
  });

  it.each(["", "0", "601", "2.5"])("rejects the time %j", (timeText) => {
    const values = { ...createInitialLogValues(null, null), rating: "easy" as const, timeText };

    const result = validateLog(values);

    expect(result.ok).toBe(false);
  });
});
