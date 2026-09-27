import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { AppDataProvider } from "./AppData";
import { AppRoutes } from "./AppRoutes";

describe("AppRoutes", () => {
  it("moves between Today, Problems and Settings from the nav", async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <MemoryRouter>
          <AppRoutes />
        </MemoryRouter>
      </AppDataProvider>,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Today");

    await user.click(screen.getByRole("link", { name: "Problems" }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Problems");
    await user.click(screen.getByRole("link", { name: "Settings" }));

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Settings & data");
    expect(document.title).toBe("Settings & data · dta-learning");
  });
});
