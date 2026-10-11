import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HowItWorksPage } from "../HowItWorksPage";

function renderHowItWorks() {
  render(
    <MemoryRouter>
      <HowItWorksPage />
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

describe("HowItWorksPage", () => {
  it("has one h1 with the intro, then the questions as h2s in the issue's order", () => {
    renderHowItWorks();

    expect(screen.getAllByRole("heading", { level: 1 }).map((h1) => h1.textContent)).toEqual([
      "How spaced-repetition practice works",
    ]);
    expect(
      screen.getByText(
        /Your rating sets the next review date\. Seven questions, answered directly\.$/,
      ),
    ).toBeDefined();
    expect(screen.getAllByRole("heading", { level: 2 }).map((h2) => h2.textContent)).toEqual([
      "What should I practice today?",
      "Where do I solve the problem?",
      "When does a problem return?",
      "When is a problem mastered?",
      "Why are earlier answers hidden?",
      "What is the research behind it?",
      "Can I use it without an account, and keep a backup?",
    ]);
  });

  it("links each question from the page contents, in page order", () => {
    renderHowItWorks();

    const contents = within(screen.getByRole("navigation", { name: "On this page" }));
    const questionIds = screen.getAllByRole("heading", { level: 2 }).map((h2) => `#${h2.id}`);

    expect(contents.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(
      questionIds,
    );
    expect(contents.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "01What to practice today",
      "02Where you solve",
      "03When a problem returns",
      "04When it's mastered",
      "05Why answers are hidden",
      "06The research",
      "07Accounts and backups",
    ]);
  });

  it("orders the risk example by days overdue against the interval, not by the oldest", () => {
    renderHowItWorks();

    const table = within(section("What should I practice today?").getByRole("table"));
    const rows = table.getAllByRole("row").slice(1);

    expect(rows.map((row) => row.textContent)).toEqual([
      "★Contains Duplicate2 days2 days100%",
      "Valid Parentheses7 days3 days43%",
      "Climbing Stairs30 days6 days20%",
    ]);
    expect(table.getByRole("img", { name: "Focus" })).toBeDefined();
  });

  it("shows how a problem moves from new to active to mastered, in words", () => {
    renderHowItWorks();

    const states = within(screen.getByRole("list", { name: /between new, active and mastered/ }));

    expect(states.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "NewNever attempted",
      "any attempt",
      "ActiveComes back on its schedule",
      "Easy, on time, after Easy",
      "MasteredOut of the rotation",
    ]);
    expect(screen.getByText(/A later Medium or Hard sends a mastered problem back/)).toBeDefined();
  });

  it("compares what a review hides with what logging the attempt reveals", () => {
    renderHowItWorks();

    const spoilers = section("Why are earlier answers hidden?");

    expect(spoilers.getAllByText("Hidden")).toHaveLength(3);
    expect(spoilers.getByText("While you review")).toBeDefined();
    expect(spoilers.getByText("After you log it")).toBeDefined();
    expect(spoilers.getByText("Arrays & Hashing")).toBeDefined();
  });

  it("explains that due reviews come first by risk, then the next new problem, with no cap", () => {
    renderHowItWorks();

    const today = section("What should I practice today?");

    expect(today.getByText(/sorted by risk/)).toBeDefined();
    expect(today.getByText(/next new problem, in NeetCode order/)).toBeDefined();
    expect(today.getByText(/no daily cap, no skip action and no list of upcoming/)).toBeDefined();
  });

  it("links out to NeetCode first and LeetCode for solving", () => {
    renderHowItWorks();

    const solving = section("Where do I solve the problem?");
    const links = solving.getAllByRole("link").map((link) => link.getAttribute("href"));

    expect(links).toEqual(["https://neetcode.io/practice", "https://leetcode.com/problemset/"]);
  });

  it("tables the 2/7/30 calendar-day intervals and how overdue and early re-solves behave", () => {
    renderHowItWorks();

    const intervals = section("When does a problem return?");
    const rows = within(intervals.getByRole("table")).getAllByRole("row").slice(1);

    expect(rows.map((row) => row.textContent)).toEqual([
      "●●●Hard+2 calendar days",
      "●●○Medium+7 calendar days",
      "●○○Easy+30 calendar days",
    ]);
    expect(
      intervals.getByText(/in your time zone, starting from the day you actually/),
    ).toBeDefined();
    expect(intervals.getByText(/They don't change the interval/)).toBeDefined();
    expect(intervals.getByText(/before its due date restarts its interval/)).toBeDefined();
  });

  it("states the mastery rule, including that an early Easy doesn't count", () => {
    renderHowItWorks();

    const mastery = section("When is a problem mastered?");

    expect(mastery.getByText(/on or after its due date, following an Easy/)).toBeDefined();
    expect(mastery.getByText(/An Easy before the due date doesn't count/)).toBeDefined();
    expect(mastery.getByText(/Medium or Hard later brings it back/)).toBeDefined();
    expect(mastery.getByText(/not a guarantee of how you will do in an interview/)).toBeDefined();
  });

  it("links each research idea to its original source and states the limits", () => {
    renderHowItWorks();

    const research = section("What is the research behind it?");

    expect(research.getAllByRole("heading", { level: 3 }).map((h3) => h3.textContent)).toEqual([
      "Spacing",
      "Retrieval practice",
      "Broader evidence on study techniques",
    ]);
    expect(linkHref(/Cepeda et al\. \(2008\)/)).toBe("https://pubmed.ncbi.nlm.nih.gov/19076480/");
    expect(linkHref(/Roediger & Karpicke \(2006\)/)).toBe(
      "https://pubmed.ncbi.nlm.nih.gov/16507066/",
    );
    expect(linkHref(/Dunlosky et al\. \(2013\)/)).toBe(
      "https://journals.sagepub.com/doi/abs/10.1177/1529100612453266",
    );
    expect(research.getByRole("complementary", { name: "What this doesn't prove" })).toBeDefined();
    expect(research.getByText(/not a scientifically established optimum/)).toBeDefined();
    expect(research.getByText(/has not been tested in a study of its own/)).toBeDefined();
  });

  it("answers the account question with links to Settings and Privacy", () => {
    renderHowItWorks();

    const account = section("Can I use it without an account, and keep a backup?");

    expect(account.getByText(/works without an account/)).toBeDefined();
    expect(account.getByText(/Signing in with GitHub is optional/)).toBeDefined();
    expect(account.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe("/settings");
    expect(account.getByRole("link", { name: "Privacy page" }).getAttribute("href")).toBe(
      "/privacy",
    );
  });

  it("closes with Start practicing to /today in the footer placement and a link home", () => {
    renderHowItWorks();

    const startLink = screen.getByRole("link", { name: "Start practicing" });

    expect(startLink.getAttribute("href")).toBe("/today");
    expect(startLink.dataset.placement).toBe("footer");
    expect(linkHref("Back to the home page")).toBe("/");
  });

  it("renders without reading or writing browser storage", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderHowItWorks();

    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
