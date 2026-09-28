import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { AppDataProvider } from "../AppData";
import { AppRoutes } from "../AppRoutes";

function renderAt(path: string) {
  render(
    <AppDataProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

function pageHeading(): string {
  return screen.getByRole("heading", { level: 1 }).textContent;
}

afterEach(() => {
  localStorage.clear();
});

describe("AppRoutes", () => {
  it.each([
    ["/", "Today"],
    ["/problems", "Problems"],
    ["/settings", "Settings & data"],
  ])("renders %s as the %s screen with its own page title", (path, heading) => {
    renderAt(path);

    expect(pageHeading()).toBe(heading);
    expect(document.title).toBe(`${heading} · dsa-learning`);
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
    const nav = screen.getByRole("navigation", { name: "Main" });

    await user.click(screen.getByRole("link", { name: "Problems" }));
    expect(pageHeading()).toBe("Problems");
    await user.click(screen.getByRole("link", { name: "Settings" }));

    expect(pageHeading()).toBe("Settings & data");
    expect(nav.querySelector("[aria-current='page']")?.textContent).toBe("Settings");
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
});
