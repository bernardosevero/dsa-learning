import { describe, expect, it } from "vitest";

import { aMasteredMark, anAttempt } from "@/test/builders";

import { computeMetrics, median } from "../metrics";

describe("median", () => {
  it("returns null for no values", () => {
    expect(median([])).toBeNull();
  });

  it("returns the middle value of an odd count and the mean of the middle two of an even count", () => {
    const oddMedian = median([9, 1, 5]);
    const evenMedian = median([4, 1, 10, 2]);

    expect(oddMedian).toBe(5);
    expect(evenMedian).toBe(3);
  });
});

describe("computeMetrics", () => {
  it("returns empty counts and null shares for an empty log", () => {
    const metrics = computeMetrics([]);

    expect(metrics).toEqual({
      onTimeReviews: { onTime: 0, total: 0, share: null },
      resolveSpeed: { firstAttemptMedianMinutes: null, reviewMedianMinutes: null },
      ratingProgress: { improved: 0, total: 0, share: null },
      load: { attempts: 0, activeDays: 0, attemptsPerActiveDay: null },
      habit: { activeDays: 0, weeks: 0, daysPerWeek: null },
    });
  });

  it("counts a review as on time when it is done at most 2 days after its due date", () => {
    const entries = [
      anAttempt({ id: "a1", date: "2026-10-01", rating: "hard" }),
      anAttempt({ id: "a2", date: "2026-10-03", rating: "hard" }),
      anAttempt({ id: "a3", date: "2026-10-07", rating: "hard" }),
      anAttempt({ id: "a4", date: "2026-10-12", rating: "hard" }),
    ];

    const { onTimeReviews } = computeMetrics(entries);

    expect(onTimeReviews).toEqual({ onTime: 2, total: 3, share: 2 / 3 });
  });

  it("counts a review done before its due date as on time", () => {
    const entries = [
      anAttempt({ id: "a1", date: "2026-10-01", rating: "easy" }),
      anAttempt({ id: "a2", date: "2026-10-05", rating: "medium" }),
    ];

    const { onTimeReviews } = computeMetrics(entries);

    expect(onTimeReviews).toEqual({ onTime: 1, total: 1, share: 1 });
  });

  it("takes the due date from the non-deleted entries before the review", () => {
    const entries = [
      anAttempt({ id: "a1", date: "2026-10-01", rating: "medium" }),
      anAttempt({ id: "a2", date: "2026-10-02", rating: "hard", deletedAt: "2026-10-02T13:00Z" }),
      anAttempt({ id: "a3", date: "2026-10-08", rating: "medium" }),
    ];

    const { onTimeReviews } = computeMetrics(entries);

    expect(onTimeReviews).toEqual({ onTime: 1, total: 1, share: 1 });
  });

  it("treats the first non-deleted attempt as the first attempt when an earlier one was undone", () => {
    const entries = [
      anAttempt({ id: "a1", date: "2026-10-01", timeMinutes: 90, deletedAt: "2026-10-01T13:00Z" }),
      anAttempt({ id: "a2", date: "2026-10-02", timeMinutes: 40 }),
      anAttempt({ id: "a3", date: "2026-10-09", timeMinutes: 10 }),
    ];

    const metrics = computeMetrics(entries);

    expect(metrics.onTimeReviews).toEqual({ onTime: 1, total: 1, share: 1 });
    expect(metrics.resolveSpeed).toEqual({
      firstAttemptMedianMinutes: 40,
      reviewMedianMinutes: 10,
    });
    expect(metrics.load).toEqual({ attempts: 2, activeDays: 2, attemptsPerActiveDay: 1 });
  });

  it("leaves reviews of a mastered problem out of the on-time share because they have no due date", () => {
    const entries = [
      anAttempt({ id: "a1", date: "2026-10-01" }),
      aMasteredMark({ id: "m1", date: "2026-10-02" }),
      anAttempt({ id: "a2", date: "2026-12-01" }),
    ];

    const { onTimeReviews } = computeMetrics(entries);

    expect(onTimeReviews).toEqual({ onTime: 0, total: 0, share: null });
  });

  it("does not count an attempt after a mastered mark as a review when it is the first attempt", () => {
    const entries = [
      aMasteredMark({ id: "m1", date: "2026-10-01" }),
      anAttempt({ id: "a1", date: "2026-10-05", timeMinutes: 12 }),
    ];

    const { resolveSpeed } = computeMetrics(entries);

    expect(resolveSpeed).toEqual({ firstAttemptMedianMinutes: null, reviewMedianMinutes: null });
  });

  it("compares review times with first-attempt times of only the problems that were reviewed", () => {
    const entries = [
      anAttempt({ id: "a1", problemId: "two-sum", date: "2026-10-01", timeMinutes: 30 }),
      anAttempt({ id: "a2", problemId: "two-sum", date: "2026-10-08", timeMinutes: 12 }),
      anAttempt({ id: "a3", problemId: "two-sum", date: "2026-10-15", timeMinutes: 8 }),
      anAttempt({ id: "b1", problemId: "valid-anagram", date: "2026-10-01", timeMinutes: 50 }),
      anAttempt({ id: "b2", problemId: "valid-anagram", date: "2026-10-08", timeMinutes: 20 }),
      anAttempt({ id: "c1", problemId: "group-anagrams", date: "2026-10-02", timeMinutes: 99 }),
    ];

    const { resolveSpeed } = computeMetrics(entries);

    expect(resolveSpeed).toEqual({ firstAttemptMedianMinutes: 40, reviewMedianMinutes: 12 });
  });

  it("counts a problem as improved when its latest rating is easier than its first", () => {
    const entries = [
      anAttempt({ id: "a1", problemId: "two-sum", date: "2026-10-01", rating: "hard" }),
      anAttempt({ id: "a2", problemId: "two-sum", date: "2026-10-03", rating: "medium" }),
      anAttempt({ id: "b1", problemId: "valid-anagram", date: "2026-10-01", rating: "medium" }),
      anAttempt({ id: "b2", problemId: "valid-anagram", date: "2026-10-08", rating: "medium" }),
      anAttempt({ id: "c1", problemId: "group-anagrams", date: "2026-10-01", rating: "easy" }),
      anAttempt({ id: "c2", problemId: "group-anagrams", date: "2026-10-31", rating: "hard" }),
      anAttempt({ id: "d1", problemId: "top-k", date: "2026-10-01", rating: "hard" }),
    ];

    const { ratingProgress } = computeMetrics(entries);

    expect(ratingProgress).toEqual({ improved: 1, total: 3, share: 1 / 3 });
  });

  it("averages attempts over the days with at least one attempt", () => {
    const entries = [
      anAttempt({ id: "a1", problemId: "two-sum", date: "2026-10-01" }),
      anAttempt({ id: "b1", problemId: "valid-anagram", date: "2026-10-01" }),
      anAttempt({ id: "c1", problemId: "group-anagrams", date: "2026-10-01" }),
      anAttempt({ id: "d1", problemId: "top-k", date: "2026-10-04" }),
      aMasteredMark({ id: "m1", problemId: "contains-duplicate", date: "2026-10-06" }),
    ];

    const { load } = computeMetrics(entries);

    expect(load).toEqual({ attempts: 4, activeDays: 2, attemptsPerActiveDay: 2 });
  });

  it("divides active days by the started weeks between the first and last active day", () => {
    const entries = [
      anAttempt({ id: "a1", problemId: "two-sum", date: "2026-10-01" }),
      anAttempt({ id: "b1", problemId: "valid-anagram", date: "2026-10-02" }),
      anAttempt({ id: "c1", problemId: "group-anagrams", date: "2026-10-05" }),
      anAttempt({ id: "d1", problemId: "top-k", date: "2026-10-10" }),
    ];

    const { habit } = computeMetrics(entries);

    expect(habit).toEqual({ activeDays: 4, weeks: 2, daysPerWeek: 2 });
  });
});
