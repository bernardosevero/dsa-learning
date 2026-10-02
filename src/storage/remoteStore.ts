import { z } from "zod";

import type { RemoteSave } from "@/domain/sync";
import type { Entry, Settings } from "@/domain/types";

import { entriesSchema, settingsSchema } from "./saveFile";

/** Why the account's copy couldn't be used: the request failed, or the row is not valid. */
export type RemoteFailure = { ok: false; reason: "unreachable" | "invalid"; error: string };

export type ReadSaveResult = { ok: true; value: RemoteSave | undefined } | RemoteFailure;

export type WriteSaveResult =
  { ok: true; value: "written" | "conflict" } | { ok: false; reason: "unreachable"; error: string };

/** The account's copy of the log in the cloud. A backend (Supabase now) implements it. */
export interface RemoteStore {
  /** Returns the signed-in user's save, or undefined before their first sync. */
  read(): Promise<ReadSaveResult>;
  /**
   * Inserts the save when `expectedVersion` is undefined, otherwise updates it only if it is still
   * at that version. Returns "conflict" when another device wrote first.
   */
  write(
    save: { entries: Entry[]; settings: Settings },
    expectedVersion: number | undefined,
  ): Promise<WriteSaveResult>;
}

const remoteSaveSchema: z.ZodType<RemoteSave> = z.object({
  entries: entriesSchema,
  settings: settingsSchema,
  version: z.number().int().positive(),
});

/** Validates a saves row into a RemoteSave. An invalid row is an error and is never overwritten. */
export function parseRemoteSave(
  row: unknown,
): { ok: true; value: RemoteSave } | { ok: false; error: string } {
  const result = remoteSaveSchema.safeParse(row);
  if (!result.success) {
    return { ok: false, error: z.prettifyError(result.error) };
  }
  return { ok: true, value: result.data };
}
