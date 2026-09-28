import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { AppDataProvider } from "./AppData";
import { AppRoutes } from "./AppRoutes";

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
    ["/problems/two-sum", "Problem"],
    ["/settings", "Settings & data"],
  ])("renders %s as the %s screen with its own page title", (path, heading) => {
    renderAt(path);

    expect(pageHeading()).toBe(heading);
    expect(document.title).toBe(`${heading} · dta-learning`);
  });

  it("renders /solve/two-sum as the Solving screen for that problem", () => {
    renderAt("/solve/two-sum");

    expect(pageHeading()).toBe("Two Sum");
    expect(document.title).toBe("Solving Two Sum · dta-learning");
  });

  it("renders /log/two-sum as the Log attempt screen for that problem", () => {
    renderAt("/log/two-sum");

    expect(pageHeading()).toBe("Two Sum");
    expect(document.title).toBe("Log attempt Two Sum · dta-learning");
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

  it("goes back to Today from the wordmark", async () => {
    const user = userEvent.setup();
    renderAt("/settings");

    await user.click(screen.getByRole("link", { name: "dta-learning" }));

    expect(pageHeading()).toBe("Today");
  });
});
