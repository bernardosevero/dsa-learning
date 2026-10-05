import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createAppRouter } from "@/test/appRouter";
import { track, trackPageView } from "@/ui/shared/analytics";

vi.mock("@/ui/shared/analytics", () => ({
  track: vi.fn(),
  trackPageView: vi.fn(),
  setAnalyticsEnabled: vi.fn(),
}));

function renderAt(path: string) {
  render(<RouterProvider router={createAppRouter(path)} />);
}

// PageSheet's readable column, which Problem detail and Settings sit in.
const READABLE_COLUMN_CLASS = "max-w-[656px]";

function pageHeading(): string {
  return screen.getByRole("heading", { level: 1 }).textContent;
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("the app's routes", () => {
  it.each([
    "/",
    "/problems",
    "/problems/two-sum",
    "/settings",
    "/privacy",
    "/solve/two-sum",
    "/log/two-sum",
  ])("shows the author footer with accessible profile links on %s", (path) => {
    renderAt(path);

    const footer = within(screen.getByRole("contentinfo", { name: "About the creator" }));
    expect(footer.getByText("© Bernardo Severo - 2026 | Made with ❤️ in 🇧🇷")).toBeDefined();
    expect(footer.getByText("© Bernardo Severo - 2026. Made with love in Brazil.")).toBeDefined();
    const githubLink = footer.getByRole("link", { name: "GitHub (opens in a new tab)" });
    const linkedinLink = footer.getByRole("link", { name: "LinkedIn (opens in a new tab)" });
    expect(githubLink.getAttribute("href")).toBe("https://github.com/bernardosevero");
    expect(linkedinLink.getAttribute("href")).toBe("https://linkedin.com/in/bernardosevero");
    for (const link of [githubLink, linkedinLink]) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it.each([
    ["/", "Today"],
    ["/problems", "Problems"],
    ["/settings", "Settings & data"],
  ])("renders %s as the %s screen with its own page title", (path, heading) => {
    renderAt(path);

    expect(pageHeading()).toBe(heading);
    expect(document.title).toBe(`${heading} · dsa-learning`);
    expect(trackPageView).toHaveBeenCalledWith(path);
  });

  it("renders /privacy as a public page, without the practice app or its pageviews", () => {
    renderAt("/privacy");

    expect(pageHeading()).toBe("Privacy & credits");
    expect(document.title).toBe("Privacy & credits · dsa-learning");
    expect(screen.getByRole("link", { name: "Open app" }).getAttribute("href")).toBe("/");
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
    expect(trackPageView).not.toHaveBeenCalled();
  });

  it("renders an unknown address as the not-found page", () => {
    renderAt("/does-not-exist");

    expect(pageHeading()).toBe("Page not found");
    expect(document.title).toBe("Page not found · dsa-learning");
    expect(trackPageView).not.toHaveBeenCalled();
  });

  it.each([
    ["/", false],
    ["/problems", false],
    ["/problems/two-sum", true],
    ["/settings", true],
  ])("keeps %s to the readable column: %s", (path, isReadable) => {
    renderAt(path);

    const content = screen.getByRole("main").firstElementChild;

    expect(content?.classList.contains(READABLE_COLUMN_CLASS)).toBe(isReadable);
  });

  it("renders /problems/two-sum as the Problem detail screen for that problem", () => {
    renderAt("/problems/two-sum");

    expect(pageHeading()).toBe("Two Sum");
    expect(document.title).toBe("Two Sum · dsa-learning");
  });

  it("renders /solve/two-sum as the Solving screen for that problem", () => {
    renderAt("/solve/two-sum");

    expect(pageHeading()).toBe("Two Sum");
    expect(document.title).toBe("Solving Two Sum · dsa-learning");
  });

  it("renders /log/two-sum as the Log attempt screen for that problem", () => {
    renderAt("/log/two-sum");

    expect(pageHeading()).toBe("Two Sum");
    expect(document.title).toBe("Log attempt Two Sum · dsa-learning");
  });

  it("moves between Today, Problems and Settings from the nav and marks the current one", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByRole("link", { name: "Problems" }));
    expect(pageHeading()).toBe("Problems");
    await user.click(screen.getByRole("link", { name: "Settings" }));

    // Settings has its own layout route (the readable column), so its header is a new element.
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(pageHeading()).toBe("Settings & data");
    expect(nav.querySelector("[aria-current='page']")?.textContent).toBe("Settings");
    expect(trackPageView).toHaveBeenCalledWith("/problems");
    expect(trackPageView).toHaveBeenCalledWith("/settings");
  });

  it("sends no extra pageview when the usage switch changes on the same page", async () => {
    const user = userEvent.setup();
    renderAt("/settings");
    const usageSwitch = screen.getByRole("switch", { name: "Share usage data" });

    await user.click(usageSwitch);
    await user.click(usageSwitch);

    expect(trackPageView).toHaveBeenCalledOnce();
    expect(trackPageView).toHaveBeenCalledWith("/settings");
  });

  it("drops a problem marked as already mastered in Problems from Today's New section", async () => {
    const user = userEvent.setup();
    renderAt("/problems");

    await user.click(screen.getByRole("button", { name: "Actions for Contains Duplicate" }));
    await user.click(screen.getByRole("menuitem", { name: "Mark as already mastered…" }));
    await user.click(screen.getByRole("button", { name: "Mark as mastered" }));
    await user.click(screen.getByRole("link", { name: "Today" }));

    const newSection = within(screen.getByRole("region", { name: /New/ }));
    expect(newSection.queryByText("Contains Duplicate")).toBeNull();
    expect(newSection.getByText("Valid Anagram", { selector: "p" })).toBeDefined();
    expect(track).toHaveBeenCalledWith("marked_mastered", { pattern: "Arrays & Hashing" });
  });

  it("marks Problems as the current page on a problem's detail page", () => {
    renderAt("/problems/two-sum");

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.querySelector("[aria-current='page']")?.textContent).toBe("Problems");
  });

  it("goes back to Today from the wordmark", async () => {
    const user = userEvent.setup();
    renderAt("/settings");

    await user.click(screen.getByRole("link", { name: "dsa-learning" }));

    expect(pageHeading()).toBe("Today");
  });

  it("opens the privacy notice from the Settings footer", async () => {
    const user = userEvent.setup();
    renderAt("/settings");

    await user.click(
      within(screen.getByRole("region", { name: "Privacy & credits" })).getByRole("link", {
        name: "Privacy & credits",
      }),
    );

    expect(pageHeading()).toBe("Privacy & credits");
    expect(screen.getByText(/Your notes, key insights/)).toBeDefined();
    expect(screen.getByRole("link", { name: /MIT license notice/ }).getAttribute("href")).toBe(
      "/NOTICE.md",
    );
  });
});
