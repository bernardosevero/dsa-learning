import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { trackStartPracticing } from "../analytics";
import { StartPracticingLink } from "../StartPracticingLink";

vi.mock("../analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../analytics")>()),
  trackStartPracticing: vi.fn(),
}));

function renderLinkAt(path: string, placement: "hero" | "footer") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="today" element={<p>Today screen</p>} />
        <Route path="*" element={<StartPracticingLink placement={placement} />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("StartPracticingLink", () => {
  it.each([
    ["/", "hero"],
    ["/", "footer"],
    ["/how-it-works", "footer"],
  ] as const)(
    "on %s (%s) sends its page and placement and still opens Today",
    async (path, placement) => {
      const user = userEvent.setup();
      renderLinkAt(path, placement);

      await user.click(screen.getByRole("link", { name: "Start practicing" }));

      expect(trackStartPracticing).toHaveBeenCalledExactlyOnceWith(path, placement);
      expect(screen.getByText("Today screen")).toBeDefined();
    },
  );

  it("sends nothing from a page that isn't a public entry point", async () => {
    const user = userEvent.setup();
    renderLinkAt("/privacy", "footer");

    await user.click(screen.getByRole("link", { name: "Start practicing" }));

    expect(trackStartPracticing).not.toHaveBeenCalled();
    expect(screen.getByText("Today screen")).toBeDefined();
  });
});
