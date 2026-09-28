import { expect, test, type Page } from "@playwright/test";

// Local time, so the app's "today" is Oct 1 in whatever zone the browser runs in.
const START = new Date("2026-10-01T10:00:00");
const TWO_DAYS_LATER = new Date("2026-10-03T10:00:00");
const FIRST_PROBLEM = "Contains Duplicate";
const SECOND_PROBLEM = "Valid Anagram";

async function openToday(page: Page) {
  await page.clock.install({ time: START });
  await page.goto("/");
}

// Today → Solving → "I'm done" → Log, rating the attempt and taking 20 minutes.
async function logFirstProblem(page: Page, rating: "Hard" | "Medium" | "Easy") {
  await page.getByRole("link", { name: `Start ${FIRST_PROBLEM}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: FIRST_PROBLEM })).toBeVisible();
  await page.getByRole("link", { name: "I'm done" }).click();
  await page.getByRole("radio", { name: rating }).check();
  await page.getByLabel("Time").fill("20");
  await page.getByRole("button", { name: /^Save/ }).click();
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
  await page.goto("/");

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
  await page.goto("/");
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
  await freshPage.goto("/");

  await expect(freshPage.getByRole("main")).toHaveText(todayBefore);
  await freshContext.close();
});
