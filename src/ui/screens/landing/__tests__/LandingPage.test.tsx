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

function section(name: string) {
  return within(screen.getByRole("region", { name }));
}

function linkHref(name: string | RegExp): string | null {
  return screen.getByRole("link", { name }).getAttribute("href");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LandingPage", () => {
  it("leads with one two-line h1, the summary with the intervals and the three promises", () => {
    renderLanding();

    expect(screen.getAllByRole("heading", { level: 1 }).map((h1) => h1.textContent)).toEqual([
      "Solved problems come back. Spaced repetition for the NeetCode 150.",
    ]);
    expect(
      screen.getByText(
        "See your due reviews and the next new problem. Solve it, say how it felt, and dsa-learning brings it back for a re-solve: Hard in 2 days, Medium in 7, Easy in 30.",
      ),
    ).toBeDefined();
    expect(screen.getByText("Free")).toBeDefined();
    expect(screen.getByText("No account needed")).toBeDefined();
    expect(screen.getByText("Progress stays in your browser")).toBeDefined();
  });

  it("sends both Start practicing links to /today, each marked with its placement", () => {
    renderLanding();

    const startLinks = screen.getAllByRole("link", { name: "Start practicing" });

    expect(startLinks.map((link) => link.getAttribute("href"))).toEqual(["/today", "/today"]);
    expect(startLinks.map((link) => link.dataset.placement)).toEqual(["hero", "footer"]);
  });

  it("links to how it works, its mastery and research answers, and to privacy", () => {
    renderLanding();

    expect(linkHref("How it works")).toBe("/how-it-works");
    expect(linkHref("How mastery works, in full")).toBe("/how-it-works#how-mastery");
    expect(linkHref("Read the research notes")).toBe("/how-it-works#how-research");
    expect(linkHref("Privacy page")).toBe("/privacy");
  });

  it("shows the example Today picture with its caption, alt text and intrinsic size", () => {
    renderLanding();

    const preview = screen.getByRole("img", { name: /The Today screen with example data/ });

    expect(preview.getAttribute("src")).toBe("/today-preview.webp");
    expect(preview.getAttribute("srcset")).toBe(
      "/today-preview-480w.webp 480w, /today-preview-720w.webp 720w, /today-preview.webp 960w",
    );
    expect(preview.getAttribute("width")).toBe("960");
    expect(preview.getAttribute("height")).toBe("1488");
    expect(screen.getByText("The Today screen, with example practice data")).toBeDefined();
  });

  it("shows the fixed intervals as tiles: Hard 2, Medium 7, Easy 30 days, each with its word", () => {
    renderLanding();

    const intervals = section("Your rating sets the next date. Nothing else does.");
    const tiles = intervals.getAllByRole("list")[0];
    if (tiles === undefined) {
      throw new Error("Expected the interval tiles");
    }

    expect(
      within(tiles)
        .getAllByRole("listitem")
        .map((tile) => tile.textContent),
    ).toEqual(["●●●Felt Hard2days", "●●○Felt Medium7days", "●○○Felt Easy30days"]);
    expect(intervals.getByText(/they don't change the schedule/)).toBeDefined();
  });

  it("walks one problem from first solve to mastered, dating each stop by its interval", () => {
    renderLanding();

    const timeline = section("Your rating sets the next date. Nothing else does.").getAllByRole(
      "list",
    )[1];
    if (timeline === undefined) {
      throw new Error("Expected the timeline");
    }

    expect(
      within(timeline)
        .getAllByRole("listitem")
        .map((stop) => stop.textContent),
    ).toEqual([
      "Oct 1First solve●●●HardBack in 2 days",
      "Oct 3Review●●○MediumBack in 7 days",
      "Oct 10Review●○○EasyBack in 30 days",
      "Nov 9Review, on time●○○EasyEasy after Easy",
      "From then onLeaves the rotationMasteredA later Medium or Hard brings it back",
    ]);
  });

  it("names the three steps of the practice loop", () => {
    renderLanding();

    const steps = section("Three steps, every day you practice.");

    expect(steps.getAllByRole("heading", { level: 3 }).map((step) => step.textContent)).toEqual([
      "See what is due",
      "Solve and log",
      "Return for a re-solve",
    ]);
    expect(
      steps.getByText(
        "Hard comes back in 2 calendar days, Medium in 7 and Easy in 30. Easy twice, on time, and it's mastered.",
      ),
    ).toBeDefined();
  });

  it("cites the two research ideas and says the app hasn't been studied itself", () => {
    renderLanding();

    const research = section("Two well-studied ideas, applied to interview prep.");

    expect(research.getByText("Cepeda et al., 2008")).toBeDefined();
    expect(research.getByText("Roediger & Karpicke, 2006")).toBeDefined();
    expect(research.getByText(/hasn't been tested in a study of its own/)).toBeDefined();
  });

  it("answers the three questions in visible text", () => {
    renderLanding();

    const questions = section("Questions");

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

  it("closes with Start with problem one", () => {
    renderLanding();

    const closing = section("Start with problem one.");

    expect(closing.getByRole("link", { name: "Start practicing" }).dataset.placement).toBe(
      "footer",
    );
  });

  it("renders without reading or writing browser storage", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderLanding();

    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
