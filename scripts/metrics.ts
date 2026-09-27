// Prints the dogfooding success metrics of an exported save file.
// Run with `pnpm tsx scripts/metrics.ts <export.json>`.

import { readFile } from "node:fs/promises";
import process from "node:process";

import { computeMetrics, type Metrics } from "../src/domain/metrics.ts";
import type { SaveFile } from "../src/domain/types.ts";
import { parseSaveFile } from "../src/storage/saveFile.ts";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const USAGE = "Usage: pnpm tsx scripts/metrics.ts <export.json>";
const NO_DATA = "n/a";
const PERCENT = 100;
// Rounds to one decimal place.
const ROUNDING_FACTOR = 10;
const ON_TIME_TARGET_PERCENT = 80;

function formatNumber(value: number | null): string {
  return value === null ? NO_DATA : String(Math.round(value * ROUNDING_FACTOR) / ROUNDING_FACTOR);
}

function formatPercent(share: number | null): string {
  return share === null ? NO_DATA : `${Math.round(share * PERCENT)}%`;
}

function formatMinutes(minutes: number | null): string {
  return minutes === null ? NO_DATA : `${formatNumber(minutes)} min`;
}

function toRows(metrics: Metrics): [string, string, string][] {
  const { onTimeReviews, resolveSpeed, ratingProgress, load, habit } = metrics;
  return [
    [
      "On-time reviews",
      formatPercent(onTimeReviews.share),
      `${onTimeReviews.onTime} of ${onTimeReviews.total} reviews; target ${ON_TIME_TARGET_PERCENT}%+`,
    ],
    [
      "Re-solve speed",
      `${formatMinutes(resolveSpeed.reviewMedianMinutes)} vs ${formatMinutes(resolveSpeed.firstAttemptMedianMinutes)}`,
      "median review time vs first attempt, reviewed problems",
    ],
    [
      "Rating progress",
      formatPercent(ratingProgress.share),
      `${ratingProgress.improved} of ${ratingProgress.total} problems with 2+ attempts`,
    ],
    [
      "Load",
      formatNumber(load.attemptsPerActiveDay),
      `${load.attempts} attempts over ${load.activeDays} active days`,
    ],
    [
      "Habit",
      formatNumber(habit.daysPerWeek),
      `${habit.activeDays} active days over ${habit.weeks} weeks`,
    ],
  ];
}

function formatTable(rows: readonly (readonly string[])[]): string {
  const columnWidths = [0, 0, 0];
  for (const row of rows) {
    for (const [column, cell] of row.entries()) {
      columnWidths[column] = Math.max(columnWidths[column] ?? 0, cell.length);
    }
  }
  const lines = rows.map((row) =>
    row.map((cell, column) => cell.padEnd(columnWidths[column] ?? 0)).join("  "),
  );
  return `${lines.map((line) => line.trimEnd()).join("\n")}\n`;
}

async function readSaveFile(path: string): Promise<Result<SaveFile>> {
  let json: unknown;
  try {
    const text = await readFile(path, "utf8");
    json = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: `could not read ${path} as JSON: ${String(error)}` };
  }
  const parsed = parseSaveFile(json);
  return parsed.ok ? { ok: true, value: parsed.file } : parsed;
}

async function printMetrics(path: string | undefined): Promise<Result<string>> {
  if (path === undefined) {
    return { ok: false, error: USAGE };
  }
  const saveFile = await readSaveFile(path);
  if (!saveFile.ok) {
    return saveFile;
  }
  const rows = [["Metric", "Value", "Detail"], ...toRows(computeMetrics(saveFile.value.entries))];
  return { ok: true, value: formatTable(rows) };
}

const output = await printMetrics(process.argv[2]);
if (output.ok) {
  process.stdout.write(output.value);
} else {
  console.error(`metrics failed: ${output.error}`);
  process.exitCode = 1;
}
