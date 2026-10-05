import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { HowItWorksPage } from "../HowItWorksPage";

// A .ts test so it runs in the node project, where window, document and localStorage don't exist.
describe("HowItWorksPage on the server", () => {
  it("renders every answer into the HTML, with no browser APIs and no practice app", () => {
    const html = renderToString(createElement(MemoryRouter, null, createElement(HowItWorksPage)));

    expect(html).toContain("How spaced-repetition practice works");
    expect(html).toContain("sorted by risk");
    expect(html).toContain("+30 calendar days");
    expect(html).toContain("An Easy before the due date doesn&#x27;t count");
    expect(html).toContain("https://pubmed.ncbi.nlm.nih.gov/19076480/");
    expect(html).toContain("your progress is saved in this browser");
  });
});
