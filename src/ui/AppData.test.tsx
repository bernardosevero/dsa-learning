import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { SaveFile } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";

import { AppDataProvider, useAppData } from "./AppData";

function MarkMasteredButton() {
  const { markMastered } = useAppData();
  return (
    <button type="button" onClick={() => markMastered("two-sum")}>
      Mark
    </button>
  );
}

afterEach(() => {
  localStorage.clear();
});

describe("AppDataProvider", () => {
  it("persists an action to localStorage under dta-learning:v1", async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <MarkMasteredButton />
      </AppDataProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Mark" }));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as SaveFile; // safe: written by the provider
    expect(stored.entries).toMatchObject([{ type: "markedMastered", problemId: "two-sum" }]);
  });
});
