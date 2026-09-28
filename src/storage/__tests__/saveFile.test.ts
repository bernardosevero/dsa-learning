import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "@/domain/types";
import { aMasteredMark, anAttempt, aSaveFile } from "@/test/builders";

import { parseSaveFile } from "../saveFile";

// One attempt and one mark: the valid file most tests parse or break one field of.
const SAMPLE_FILE = aSaveFile({
  entries: [anAttempt(), aMasteredMark({ problemId: "two-sum" })],
  settings: DEFAULT_SETTINGS,
});

function withFirstEntryField(field: string, value: unknown): unknown {
  return { ...SAMPLE_FILE, entries: [{ ...SAMPLE_FILE.entries[0], [field]: value }] };
}

function errorOf(result: ReturnType<typeof parseSaveFile>): string {
  if (result.ok) {
    throw new Error("Expected the save file to be rejected");
  }
  return result.error;
}

describe("parseSaveFile", () => {
  it("accepts a valid save file with every optional field", () => {
    const file = aSaveFile({
      entries: [
        anAttempt({
          startedAt: "2026-10-01T11:40:00.000Z",
          keyInsight: "Track what was already seen",
          notes: "Took two tries",
          deletedAt: "2026-10-02T09:00:00.000Z",
        }),
        aMasteredMark(),
      ],
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-03T10:00:00.000Z" },
    });

    const result = parseSaveFile(file);

    expect(result).toEqual({ ok: true, file });
  });

  it("rejects a file with an unsupported version", () => {
    const result = parseSaveFile({ ...SAMPLE_FILE, version: 2 });

    expect(errorOf(result)).toContain("version");
  });

  it("rejects an entry with an unknown rating", () => {
    const result = parseSaveFile(withFirstEntryField("rating", "trivial"));

    expect(errorOf(result)).toContain("rating");
  });

  it("rejects an entry with an unknown help value", () => {
    const result = parseSaveFile(withFirstEntryField("help", "copied"));

    expect(errorOf(result)).toContain("help");
  });

  it("rejects an entry with an unknown type", () => {
    const result = parseSaveFile(withFirstEntryField("type", "skipped"));

    expect(errorOf(result)).toContain("type");
  });

  it("rejects an entry whose date is not a real YYYY-MM-DD day", () => {
    const wrongFormat = parseSaveFile(withFirstEntryField("date", "01/10/2026"));
    const impossibleDay = parseSaveFile(withFirstEntryField("date", "2026-02-30"));

    expect(errorOf(wrongFormat)).toContain("date");
    expect(errorOf(impossibleDay)).toContain("date");
  });

  it("rejects an attempt with a negative time", () => {
    const result = parseSaveFile(withFirstEntryField("timeMinutes", -1));

    expect(errorOf(result)).toContain("timeMinutes");
  });

  it("rejects data that is not a save file at all", () => {
    const nullResult = parseSaveFile(null);
    const arrayResult = parseSaveFile([]);

    expect(nullResult.ok).toBe(false);
    expect(arrayResult.ok).toBe(false);
  });
});
