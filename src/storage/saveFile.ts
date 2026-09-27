import { z } from "zod";

import { isValidLocalDate } from "@/domain/dates";
import type { SaveFile } from "@/domain/types";

const localDateSchema = z.string().refine(isValidLocalDate, {
  message: "Expected a real date in YYYY-MM-DD form",
});

const difficultySchema = z.enum(["Easy", "Medium", "Hard"]);

const entryBaseShape = {
  id: z.string().min(1),
  problemId: z.string().min(1),
  deletedAt: z.string().optional(),
};

const attemptSchema = z.object({
  ...entryBaseShape,
  type: z.literal("attempt"),
  startedAt: z.string().optional(),
  completedAt: z.string(),
  date: localDateSchema,
  rating: z.enum(["hard", "medium", "easy"]),
  timeMinutes: z.number().nonnegative(),
  help: z.enum(["none", "hint", "solution"]),
  keyInsight: z.string().optional(),
  notes: z.string().optional(),
});

const markedMasteredSchema = z.object({
  ...entryBaseShape,
  type: z.literal("markedMastered"),
  at: z.string(),
  date: localDateSchema,
});

const settingsSchema = z.object({
  timeBoxMinutes: z.record(difficultySchema, z.number().positive()),
  showPatternOnReviews: z.boolean(),
});

// Annotated with SaveFile so the compiler flags any drift between the schema and the domain type.
const saveFileSchema: z.ZodType<SaveFile> = z.object({
  version: z.literal(1),
  entries: z.array(z.discriminatedUnion("type", [attemptSchema, markedMasteredSchema])),
  settings: settingsSchema,
  activeTimer: z.object({ problemId: z.string().min(1), startedAt: z.string() }).optional(),
});

/** Validates unknown JSON into a SaveFile, or returns a readable error listing what is wrong. */
export function parseSaveFile(
  json: unknown,
): { ok: true; file: SaveFile } | { ok: false; error: string } {
  const result = saveFileSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: z.prettifyError(result.error) };
  }
  return { ok: true, file: result.data };
}
