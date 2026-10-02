import { randomUUID } from "node:crypto";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { localSupabase } from "./localSupabase";

/** Where the app keeps its save file, and where supabase-js keeps the session for 127.0.0.1. */
const SAVE_FILE_KEY = "dsa-learning:v1";
const SESSION_KEY = "sb-127-auth-token";

export interface TestAccount {
  userId: string;
  session: Session;
}

export interface Device {
  context: BrowserContext;
  page: Page;
}

/** What the app keeps in localStorage, only as far as these tests read it. */
export interface StoredSaveFile {
  entries: { id: string; deletedAt?: string }[];
  settings: { showPatternOnReviews: boolean };
}

let adminClient: SupabaseClient | undefined;

// The local stack's secret key: it can create users and read every row, bypassing RLS.
function admin(): SupabaseClient {
  const { url, secretKey } = localSupabase();
  adminClient ??= createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/** Creates a confirmed user with a unique email and returns them signed in, without GitHub. */
export async function createTestAccount(): Promise<TestAccount> {
  const email = `sync-${randomUUID()}@example.test`;
  const password = randomUUID();
  const created = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error !== null) {
    throw created.error;
  }
  const { url, publishableKey } = localSupabase();
  const userClient = createClient(url, publishableKey, { auth: { persistSession: false } });
  const signedIn = await userClient.auth.signInWithPassword({ email, password });
  if (signedIn.error !== null) {
    throw signedIn.error;
  }
  return { userId: created.data.user.id, session: signedIn.data.session };
}

/** Opens a new browser context: one device with its own storage. */
export async function newDevice(browser: Browser): Promise<Device> {
  const context = await browser.newContext();
  return { context, page: await context.newPage() };
}

/**
 * Opens the app signed in as `account`, with `localFile` already saved on this device. The session
 * goes where supabase-js reads it, so from the reload on the app runs exactly as after GitHub.
 */
export async function openSignedIn(
  page: Page,
  account: TestAccount,
  localFile?: StoredSaveFile,
): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    ([sessionKey, session, saveFileKey, saveFile]) => {
      localStorage.setItem(sessionKey, session);
      if (saveFile !== undefined) {
        localStorage.setItem(saveFileKey, saveFile);
      }
    },
    [
      SESSION_KEY,
      JSON.stringify(account.session),
      SAVE_FILE_KEY,
      localFile && JSON.stringify(localFile),
    ] as const,
  );
  await page.reload();
}

/** Fires the window focus event, one of sync's triggers. */
export async function focusWindow(page: Page): Promise<void> {
  // A string, because e2e code is type-checked for Node, without the DOM's `window`.
  await page.evaluate('window.dispatchEvent(new Event("focus"))');
}

const NOTHING_SAVED: StoredSaveFile = { entries: [], settings: { showPatternOnReviews: false } };

/** Returns the save file this device holds in localStorage; nothing saved yet reads as empty, as in the app. */
export async function readLocalFile(page: Page): Promise<StoredSaveFile> {
  const text = await page.evaluate((key) => localStorage.getItem(key), SAVE_FILE_KEY);
  return text === null ? NOTHING_SAVED : (JSON.parse(text) as StoredSaveFile); // safe: written by the app under test
}

/** Returns the account's saves row as the database holds it, or null before its first sync. */
export async function readSaveRow(userId: string): Promise<StoredSaveFile | null> {
  const { data, error } = await admin()
    .from("saves")
    .select("entries, settings")
    .eq("user_id", userId)
    .maybeSingle();
  if (error !== null) {
    throw error;
  }
  return data;
}

/** Returns whether the account's user still exists. */
export async function userExists(userId: string): Promise<boolean> {
  const { data } = await admin().auth.admin.getUserById(userId);
  return data.user !== null;
}

/** Waits until the account's row holds exactly the entries with these ids. */
export async function expectRowEntryIds(userId: string, ids: readonly string[]): Promise<void> {
  await expect
    .poll(async () => (await readSaveRow(userId))?.entries.map((entry) => entry.id).toSorted())
    .toEqual(ids.toSorted());
}
