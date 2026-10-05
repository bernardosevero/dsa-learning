import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LandingPage } from "../LandingPage";

function renderLanding() {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

function linkHref(name: string | RegExp): string | null {
  return screen.getByRole("link", { name }).getAttribute("href");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LandingPage", () => {
  it("leads with one h1, the summary and the no-account line", () => {
    renderLanding();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Spaced repetition for the NeetCode 150" }),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Keep previously solved coding problems in your practice routine. dsa-learning shows your due reviews and the next new problem, then schedules each re-solve from how hard it felt.",
      ),
    ).toBeDefined();
    expect(screen.getByText("Free to use. No dsa-learning account required.")).toBeDefined();
  });

  it("sends both Start practicing links to /today, each marked with its placement", () => {
    renderLanding();

    const startLinks = screen.getAllByRole("link", { name: "Start practicing" });

    expect(startLinks.map((link) => link.getAttribute("href"))).toEqual(["/today", "/today"]);
    expect(startLinks.map((link) => link.dataset.placement)).toEqual(["hero", "footer"]);
  });

  it("links to how it works from the hero and the intervals, and to privacy and the notice", () => {
    renderLanding();

    expect(linkHref("How it works")).toBe("/how-it-works");
    expect(linkHref("How mastery works, and more details")).toBe("/how-it-works");
    expect(linkHref("Privacy page")).toBe("/privacy");
    expect(linkHref("Privacy & credits")).toBe("/privacy");
    expect(linkHref(/MIT license notice/)).toBe("/NOTICE.md");
  });

  it("shows the example Today picture with its caption, alt text and intrinsic size", () => {
    renderLanding();

    const preview = screen.getByRole("img", { name: /The Today screen with example data/ });

    expect(preview.getAttribute("src")).toBe("/today-preview.png");
    expect(preview.getAttribute("width")).toBe("960");
    expect(preview.getAttribute("height")).toBe("1488");
    expect(within(screen.getByRole("figure")).getByText("Example practice data")).toBeDefined();
  });

  it("names the three steps of the practice loop", () => {
    renderLanding();

    const steps = within(screen.getByRole("region", { name: "The practice loop" }));

    expect(steps.getAllByRole("heading", { level: 3 }).map((step) => step.textContent)).toEqual([
      "1See what is due",
      "2Solve and log",
      "3Return for a re-solve",
    ]);
    expect(
      steps.getByText("Hard comes back in 2 calendar days, Medium in 7 and Easy in 30."),
    ).toBeDefined();
  });

  it("tables the fixed intervals: Hard +2, Medium +7, Easy +30 calendar days", () => {
    renderLanding();

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);

    expect(rows.map((row) => row.textContent)).toEqual([
      "●●●Hard+2 calendar days",
      "●●○Medium+7 calendar days",
      "●○○Easy+30 calendar days",
    ]);
    expect(screen.getByText(/they don't change the schedule/)).toBeDefined();
  });

  it("answers the three questions in visible text", () => {
    renderLanding();

    const questions = within(screen.getByRole("region", { name: "Questions" }));

    expect(
      questions.getAllByRole("heading", { level: 3 }).map((question) => question.textContent),
    ).toEqual([
      "Is this a coding platform?",
      "Do I need an account?",
      "Where is my progress saved?",
    ]);
    expect(questions.getByText(/solve it on NeetCode or LeetCode/)).toBeDefined();
    expect(questions.getByText(/don't need a dsa-learning account/)).toBeDefined();
    expect(questions.getByText(/export it as a JSON file and import it again/)).toBeDefined();
  });

  it("states that it is independent of NeetCode and LeetCode", () => {
    renderLanding();

    expect(
      screen.getByText(
        "An independent tool following the NeetCode 150 list; not affiliated with NeetCode or LeetCode.",
      ),
    ).toBeDefined();
  });

  it("renders without reading or writing browser storage", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderLanding();

    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
