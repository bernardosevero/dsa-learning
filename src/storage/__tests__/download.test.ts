// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { EMPTY_SAVE_FILE } from "@/domain/types";

import { downloadExport } from "../download";
import { exportJson } from "../localStore";

const OBJECT_URL = "blob:dta-learning-export";
const SEPTEMBER = 8;

describe("downloadExport", () => {
  let createdBlobs: Blob[] = [];
  let clickedLinks: HTMLAnchorElement[] = [];
  let revokeObjectUrlSpy: MockInstance<(url: string) => void>;

  function recordBlob(blob: Blob | MediaSource): string {
    if (blob instanceof Blob) createdBlobs.push(blob);
    return OBJECT_URL;
  }

  function recordClick(this: HTMLAnchorElement): void {
    clickedLinks.push(this);
  }

  function doNothing(): void {}

  beforeEach(() => {
    createdBlobs = [];
    clickedLinks = [];
    vi.useFakeTimers({ toFake: ["Date", "setTimeout"] });
    vi.setSystemTime(new Date(2026, SEPTEMBER, 27, 12, 0));
    vi.spyOn(URL, "createObjectURL").mockImplementation(recordBlob);
    revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(doNothing);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(recordClick);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("downloads the exported JSON as a file named after today", async () => {
    downloadExport(EMPTY_SAVE_FILE);

    expect(clickedLinks).toHaveLength(1);
    expect(clickedLinks[0]?.download).toBe("dta-learning-2026-09-27.json");
    expect(clickedLinks[0]?.href).toBe(OBJECT_URL);
    expect(clickedLinks[0]?.isConnected).toBe(false);
    expect(createdBlobs).toHaveLength(1);
    expect(await createdBlobs[0]?.text()).toBe(exportJson(EMPTY_SAVE_FILE));
  });

  it("releases the object URL once the download has started", () => {
    downloadExport(EMPTY_SAVE_FILE);

    const revokeCallsDuringClick = revokeObjectUrlSpy.mock.calls.length;
    vi.runAllTimers();

    expect(revokeCallsDuringClick).toBe(0);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith(OBJECT_URL);
  });
});
