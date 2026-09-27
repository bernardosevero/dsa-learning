import { describe, expect, it } from "vitest";

describe("test setup", () => {
  it("runs domain tests in the node environment", () => {
    const hasDocument = typeof document !== "undefined";

    expect(hasDocument).toBe(false);
  });
});
