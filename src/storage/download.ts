import { today } from "@/domain/dates";
import type { SaveFile } from "@/domain/types";

import { exportJson } from "./localStore";

/** Downloads the save file as `dta-learning-YYYY-MM-DD.json`, dated today in local time. */
export function downloadExport(file: SaveFile): void {
  const blob = new Blob([exportJson(file)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dta-learning-${today()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  // Release the blob on the next task, once the browser has picked up the download.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
