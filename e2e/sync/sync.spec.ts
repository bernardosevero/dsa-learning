import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { today } from "@/domain/dates";
import type { SaveFile } from "@/domain/types";
import { anAttempt, aSaveFile } from "@/test/builders";

import { logFirstProblem } from "../flows";
import {
  createTestAccount,
  expectRowEntryIds,
  focusWindow,
  newDevice,
  openSignedIn,
  readLocalFile,
  readSaveRow,
  hasAccount,
  type StoredSaveFile,
} from "./session";

/** A save file holding one Medium attempt on Contains Duplicate, logged today. */
function aLocalLogWithOneAttempt(): SaveFile {
  const attempt = anAttempt({
    id: randomUUID(),
    date: today(),
    completedAt: new Date().toISOString(),
  });
  return aSaveFile({ entries: [attempt] });
}

function avatarLink(page: Page) {
  return page.getByRole("link", { name: /^Account settings/ });
}

async function expectSynced(page: Page) {
  await expect(page.getByRole("link", { name: "Account settings · Synced" })).toBeVisible();
}

function localEntryIds(file: StoredSaveFile): string[] {
  return file.entries.map((entry) => entry.id).toSorted();
}

test("a signed-in session survives a reload", async ({ browser }) => {
  const account = await createTestAccount();
  const { page } = await newDevice(browser);
  await openSignedIn(page, account);
  await expect(avatarLink(page)).toBeVisible();

  await page.reload();

  await expect(avatarLink(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);
});

test("the first sync uploads the local log to the account", async ({ browser }) => {
  const account = await createTestAccount();
  const localLog = aLocalLogWithOneAttempt();
  const { page } = await newDevice(browser);

  await openSignedIn(page, account, localLog);

  await expectRowEntryIds(account.userId, localEntryIds(localLog));
  await expectSynced(page);
});

test("a new device shows a skeleton, then the account's log", async ({ browser }) => {
  const account = await createTestAccount();
  const localLog = aLocalLogWithOneAttempt();
  const laptop = await newDevice(browser);
  await openSignedIn(laptop.page, account, localLog);
  await expectRowEntryIds(account.userId, localEntryIds(localLog));
  const phone = await newDevice(browser);
  let releaseRead: () => void = () => undefined;
  const readHeld = new Promise<void>((resolve) => {
    releaseRead = resolve;
  });
  await phone.context.route("**/rest/v1/saves*", async (route) => {
    await readHeld;
    await route.continue();
  });

  await openSignedIn(phone.page, account);
  await expect(phone.page.getByText("Loading your progress…")).toBeAttached();
  await expect(phone.page.getByText("Re-solve problems right before you forget them.")).toHaveCount(
    0,
  );
  releaseRead();

  await expect(phone.page.getByText("Loading your progress…")).toHaveCount(0);
  await expect
    .poll(async () => localEntryIds(await readLocalFile(phone.page)))
    .toEqual(localEntryIds(localLog));
  await expect(phone.page.getByText("Re-solve problems right before you forget them.")).toHaveCount(
    0,
  );
});

test("an attempt logged on one device appears on the other after focus", async ({ browser }) => {
  const account = await createTestAccount();
  const laptop = await newDevice(browser);
  const phone = await newDevice(browser);
  await openSignedIn(laptop.page, account);
  await expectSynced(laptop.page);
  await openSignedIn(phone.page, account);
  await expectSynced(phone.page);

  await logFirstProblem(laptop.page, "Medium");
  const loggedIds = localEntryIds(await readLocalFile(laptop.page));
  expect(loggedIds).toHaveLength(1);
  await expectRowEntryIds(account.userId, loggedIds);
  await focusWindow(phone.page);

  await expect.poll(async () => localEntryIds(await readLocalFile(phone.page))).toEqual(loggedIds);
});

test("a settings change on one device reaches the other", async ({ browser }) => {
  const account = await createTestAccount();
  const laptop = await newDevice(browser);
  const phone = await newDevice(browser);
  await openSignedIn(laptop.page, account);
  await expectSynced(laptop.page);
  await openSignedIn(phone.page, account);
  await expectSynced(phone.page);

  await laptop.page.goto("/settings");
  await laptop.page.getByRole("switch", { name: "Show the pattern on reviews" }).click();
  await expect
    .poll(async () => (await readSaveRow(account.userId))?.settings.showPatternOnReviews)
    .toBe(true);
  await focusWindow(phone.page);

  await expect
    .poll(async () => (await readLocalFile(phone.page)).settings.showPatternOnReviews)
    .toBe(true);
});

test("a signed-in reset stays reset on the other device", async ({ browser }) => {
  const account = await createTestAccount();
  const localLog = aLocalLogWithOneAttempt();
  const laptop = await newDevice(browser);
  const phone = await newDevice(browser);
  await openSignedIn(laptop.page, account, localLog);
  await expectRowEntryIds(account.userId, localEntryIds(localLog));
  await openSignedIn(phone.page, account);
  await expect.poll(async () => localEntryIds(await readLocalFile(phone.page))).toHaveLength(1);

  await laptop.page.goto("/settings");
  await laptop.page.getByLabel("Type reset to confirm").fill("reset");
  await laptop.page.getByRole("button", { name: "Reset progress" }).click();
  await expect
    .poll(async () =>
      (await readSaveRow(account.userId))?.entries.every((entry) => entry.deletedAt),
    )
    .toBe(true);
  await focusWindow(phone.page);

  await expect
    .poll(async () => (await readLocalFile(phone.page)).entries.every((entry) => entry.deletedAt))
    .toBe(true);
  await phone.page.goto("/");
  await expect(
    phone.page.getByText("Re-solve problems right before you forget them."),
  ).toBeVisible();
});

test("delete account keeps the local log and removes the account's row", async ({ browser }) => {
  const account = await createTestAccount();
  const localLog = aLocalLogWithOneAttempt();
  const { page } = await newDevice(browser);
  await openSignedIn(page, account, localLog);
  await expectRowEntryIds(account.userId, localEntryIds(localLog));

  await page.goto("/settings");
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete account" }).click();

  await expect(
    page.getByRole("main").getByRole("button", { name: "Sign in with GitHub" }),
  ).toBeVisible();
  expect(localEntryIds(await readLocalFile(page))).toEqual(localEntryIds(localLog));
  expect(await hasAccount(account.userId)).toBe(false);
  expect(await readSaveRow(account.userId)).toBeNull();
});

test("a signed-out app shows Sign in with GitHub and never calls Supabase's REST API", async ({
  browser,
}) => {
  const { page } = await newDevice(browser);
  const restRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/rest/v1/")) {
      restRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Sign in with GitHub" }),
  ).toBeVisible();
  await focusWindow(page);
  await page.goto("/settings");
  await expect(
    page.getByRole("main").getByRole("button", { name: "Sign in with GitHub" }),
  ).toBeVisible();

  expect(restRequests).toEqual([]);
});
