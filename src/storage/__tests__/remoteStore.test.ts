import { describe, expect, it } from "vitest";

import { aMasteredMark, anAttempt, aRemoteSave } from "@/test/builders";

import { parseRemoteSave } from "../remoteStore";

describe("parseRemoteSave", () => {
  it("accepts a valid row", () => {
    const row = aRemoteSave({ entries: [anAttempt(), aMasteredMark()], version: 4 });

    const result = parseRemoteSave(row);

    expect(result).toEqual({ ok: true, value: row });
  });

  it("rejects a row whose log isn't a list of entries", () => {
    const result = parseRemoteSave({ ...aRemoteSave(), entries: [{ type: "unknown" }] });

    expect(result.ok).toBe(false);
  });

  it("rejects a row without a version", () => {
    const { entries, settings } = aRemoteSave();

    const result = parseRemoteSave({ entries, settings });

    expect(result.ok).toBe(false);
  });
});
