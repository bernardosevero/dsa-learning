import { expect, type Page } from "@playwright/test";

export const FIRST_PROBLEM = "Contains Duplicate";

/** Today → Solving → "I'm done" → Log, rating the attempt and taking 20 minutes. */
export async function logFirstProblem(page: Page, rating: "Hard" | "Medium" | "Easy") {
  await page.getByRole("link", { name: `Start ${FIRST_PROBLEM}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: FIRST_PROBLEM })).toBeVisible();
  await page.getByRole("link", { name: "I'm done" }).click();
  await page.getByRole("radio", { name: rating }).check();
  await page.getByLabel("Time").fill("20");
  await page.getByRole("button", { name: /^Save/ }).click();
}
