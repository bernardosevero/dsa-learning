import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LandingPage } from "../LandingPage";

// A .ts test so it runs in the node project, where window, document and localStorage don't exist.
describe("LandingPage on the server", () => {
  it("renders its whole content with no browser APIs and no practice app", () => {
    const html = renderToString(createElement(MemoryRouter, null, createElement(LandingPage)));

    expect(html).toContain("Solved problems come back.");
    expect(html).toContain("Spaced repetition for the NeetCode 150.");
    expect(html).toContain("Where is my progress saved?");
    expect(html).toContain("Back in 30 days");
    expect(html).toContain("Easy after Easy");
    // Closed dropdowns still carry their answers, so crawlers read every one without JavaScript.
    expect(html).toContain("rarely the only round");
    expect(html).toContain("no streak to protect");
    expect(html.match(/<details/g)).toHaveLength(7);
  });
});
