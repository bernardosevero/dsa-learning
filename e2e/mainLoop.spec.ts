import { expect, test, type Page } from "@playwright/test";

import { FIRST_PROBLEM, logFirstProblem } from "./flows";

// Local time, so the app's "today" is Oct 1 in whatever zone the browser runs in.
const START = new Date("2026-10-01T10:00:00");
const TWO_DAYS_LATER = new Date("2026-10-03T10:00:00");
const SECOND_PROBLEM = "Valid Anagram";

async function openToday(page: Page) {
  await page.clock.install({ time: START });
  await page.goto("/today");
}

function newSection(page: Page) {
  return page.getByRole("region", { name: /^New/ });
}

test("the main loop logs a new problem and offers the next one", async ({ page }) => {
  await openToday(page);
  await expect(page.getByRole("link", { name: `Start ${FIRST_PROBLEM}` })).toBeVisible();

  await logFirstProblem(page, "Medium");

  await expect(page.getByText("Next re-solve: 2026-10-08")).toBeVisible();
  await page.getByRole("link", { name: "Back to Today" }).click();
  await expect(
    newSection(page).getByRole("link", { name: `Start ${SECOND_PROBLEM}` }),
  ).toBeVisible();
  await expect(newSection(page).getByText(FIRST_PROBLEM)).toHaveCount(0);
});

test("a Hard attempt comes back two days later as the focus, without its pattern", async ({
  page,
}) => {
  await openToday(page);
  await logFirstProblem(page, "Hard");
  await expect(page.getByText("Next re-solve: 2026-10-03")).toBeVisible();

  await page.clock.setSystemTime(TWO_DAYS_LATER);
  await page.goto("/today");

  const dueReviews = page.getByRole("region", { name: /^Due reviews/ });
  await expect(dueReviews.getByRole("link", { name: `Start ${FIRST_PROBLEM}` })).toBeVisible();
  await expect(dueReviews.getByText(/★/)).toBeVisible();
  await expect(dueReviews.getByText("Arrays & Hashing")).toHaveCount(0);
});

test("a problem marked as already mastered counts as mastered and never shows on Today", async ({
  page,
}) => {
  await page.clock.install({ time: START });
  await page.goto("/problems");
  await expect(page.getByRole("radio", { name: "Mastered 0" })).toBeVisible();

  await page.getByRole("button", { name: `Actions for ${FIRST_PROBLEM}` }).click();
  await page.getByRole("menuitem", { name: "Mark as already mastered…" }).click();
  await page.getByRole("button", { name: "Mark as mastered" }).click();

  await expect(page.getByRole("radio", { name: "Mastered 1" })).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Today" }).click();
  await expect(
    newSection(page).getByRole("link", { name: `Start ${SECOND_PROBLEM}` }),
  ).toBeVisible();
  await expect(page.getByText(FIRST_PROBLEM)).toHaveCount(0);
});

test("an exported file imported into a fresh browser shows the same Today", async ({
  page,
  browser,
}) => {
  await openToday(page);
  await logFirstProblem(page, "Medium");
  await page.goto("/today");
  const todayBefore = (await page.getByRole("main").textContent()) ?? "";
  await page.goto("/settings");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const exportPath = await (await downloadEvent).path();

  const freshContext = await browser.newContext();
  const freshPage = await freshContext.newPage();
  await freshPage.clock.install({ time: START });
  await freshPage.goto("/settings");
  await freshPage.locator("input[type='file']").setInputFiles(exportPath);
  await expect(freshPage.getByText("Imported: 1 new entry")).toBeVisible();
  await freshPage.goto("/today");

  await expect(freshPage.getByRole("main")).toHaveText(todayBefore);
  await freshContext.close();
});

test("an export imported after Reset progress brings Today back", async ({ page }) => {
  await openToday(page);
  await logFirstProblem(page, "Medium");
  await page.goto("/today");
  const todayBefore = (await page.getByRole("main").textContent()) ?? "";
  await page.goto("/settings");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const exportPath = await (await downloadEvent).path();

  await page.getByLabel("Type reset to confirm").fill("reset");
  await page.getByRole("button", { name: "Reset progress" }).click();
  await expect(page.getByText("Progress reset. Every problem is new again.")).toBeVisible();
  await page.locator("input[type='file']").setInputFiles(exportPath);
  await expect(page.getByText("Imported: 1 new entry")).toBeVisible();
  await page.goto("/today");

  await expect(page.getByRole("main")).toHaveText(todayBefore);
});
