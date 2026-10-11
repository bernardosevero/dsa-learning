import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicLayout } from "../PublicLayout";

function renderPublicLayout(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <PublicLayout>
        <h1>Page content</h1>
      </PublicLayout>
    </MemoryRouter>,
  );
}

function linkHrefs(container: HTMLElement): (string | null)[] {
  return within(container)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PublicLayout", () => {
  it("offers only How it works and the app in the header, with no Privacy link", () => {
    renderPublicLayout("/");

    const headerNav = screen.getByRole("navigation", { name: "Site" });

    expect(
      within(headerNav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["How it works", "Open app"]);
    expect(linkHrefs(headerNav)).toEqual(["/how-it-works", "/today"]);
  });

  it("links the wordmark home", () => {
    renderPublicLayout("/privacy");

    expect(screen.getByRole("link", { name: "dsa-learning" }).getAttribute("href")).toBe("/");
  });

  it("marks the header link of the page being viewed as current", () => {
    renderPublicLayout("/how-it-works");

    const headerNav = screen.getByRole("navigation", { name: "Site" });

    expect(
      within(headerNav).getByRole("link", { name: "How it works" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      within(headerNav).getByRole("link", { name: "Open app" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("puts How it works, Privacy & credits and the license notice in the site links row", () => {
    renderPublicLayout("/");

    const siteLinks = screen.getByRole("navigation", { name: "Pages" });

    expect(linkHrefs(siteLinks)).toEqual(["/how-it-works", "/privacy", "/NOTICE.md"]);
    expect(
      screen.getByText(
        "An independent tool following the NeetCode 150 list; not affiliated with NeetCode or LeetCode.",
      ),
    ).toBeDefined();
  });

  it("keeps the author footer with its credit and both profile links", () => {
    renderPublicLayout("/");

    const footer = screen.getByRole("contentinfo", { name: "About the creator" });

    expect(
      within(footer).getByText("© Bernardo Severo - 2026. Made with love in Brazil."),
    ).toBeDefined();
    expect(linkHrefs(footer)).toEqual([
      "https://github.com/bernardosevero",
      "https://linkedin.com/in/bernardosevero",
    ]);
  });

  it("renders the page inside main without reading or writing browser storage", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderPublicLayout("/");

    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "Page content" }),
    ).toBeDefined();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
