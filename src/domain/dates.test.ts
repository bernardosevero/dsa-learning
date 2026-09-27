import { describe, expect, it } from "vitest";

import { addDays, daysBetween, isValidLocalDate, toLocalDate, today } from "./dates";

describe("addDays", () => {
  it("adds the fixed review intervals as calendar days", () => {
    const start = "2026-10-01";

    const hardDueDate = addDays(start, 2);
    const mediumDueDate = addDays(start, 7);
    const easyDueDate = addDays(start, 30);

    expect(hardDueDate).toBe("2026-10-03");
    expect(mediumDueDate).toBe("2026-10-08");
    expect(easyDueDate).toBe("2026-10-31");
  });

  it("crosses year and leap-day boundaries", () => {
    const nextYear = addDays("2026-12-31", 1);
    const leapDay = addDays("2028-02-28", 1);
    const afterFebruary = addDays("2027-02-28", 1);
    const previousFebruary = addDays("2026-03-01", -1);

    expect(nextYear).toBe("2027-01-01");
    expect(leapDay).toBe("2028-02-29");
    expect(afterFebruary).toBe("2027-03-01");
    expect(previousFebruary).toBe("2026-02-28");
  });

  it("is unaffected by a daylight-saving transition", () => {
    const dueDate = addDays("2026-03-07", 2);

    expect(dueDate).toBe("2026-03-09");
  });
});

describe("daysBetween", () => {
  it("returns signed whole calendar days", () => {
    const forward = daysBetween("2026-10-01", "2026-10-04");
    const backward = daysBetween("2026-10-04", "2026-10-01");
    const sameDay = daysBetween("2026-10-01", "2026-10-01");
    const acrossYear = daysBetween("2026-12-30", "2027-01-02");

    expect(forward).toBe(3);
    expect(backward).toBe(-3);
    expect(sameDay).toBe(0);
    expect(acrossYear).toBe(3);
  });
});

describe("toLocalDate", () => {
  it("uses the requested time zone to find the calendar day", () => {
    const instant = new Date("2026-10-01T02:30:00Z");

    const saoPauloDate = toLocalDate(instant, "America/Sao_Paulo");
    const tokyoDate = toLocalDate(instant, "Asia/Tokyo");

    expect(saoPauloDate).toBe("2026-09-30");
    expect(tokyoDate).toBe("2026-10-01");
  });
});

describe("today", () => {
  it("returns the current instant's date in the requested time zone", () => {
    const instant = new Date("2026-10-01T02:30:00Z");

    const currentDate = today(instant, "America/Sao_Paulo");

    expect(currentDate).toBe("2026-09-30");
  });
});

describe("isValidLocalDate", () => {
  it("accepts real dates in strict YYYY-MM-DD form", () => {
    const isLeapDayValid = isValidLocalDate("2028-02-29");

    expect(isLeapDayValid).toBe(true);
  });

  it("rejects impossible or malformed dates", () => {
    const isNonLeapDayValid = isValidLocalDate("2027-02-29");
    const isInvalidMonthValid = isValidLocalDate("2026-13-01");
    const isUnpaddedMonthValid = isValidLocalDate("2026-1-01");
    const isEmptyValid = isValidLocalDate("");

    expect(isNonLeapDayValid).toBe(false);
    expect(isInvalidMonthValid).toBe(false);
    expect(isUnpaddedMonthValid).toBe(false);
    expect(isEmptyValid).toBe(false);
  });
});
