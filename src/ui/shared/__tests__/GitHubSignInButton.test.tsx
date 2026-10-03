import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GitHubSignInButton } from "../GitHubSignInButton";

describe("GitHubSignInButton", () => {
  it("is named Sign in with GitHub and calls onClick when pressed", async () => {
    const handleClick = vi.fn();
    render(<GitHubSignInButton onClick={handleClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Sign in with GitHub" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("hides the GitHub mark from screen readers", () => {
    render(<GitHubSignInButton onClick={vi.fn()} />);

    const mark = screen.getByRole("button").querySelector("svg");

    expect(mark?.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps the full name when the visible label is shortened for narrow headers", () => {
    render(<GitHubSignInButton hasShortLabelWhenNarrow onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Sign in with GitHub" });

    expect(button.textContent).toContain("Sign in");
  });

  it("cannot be pressed while disabled", () => {
    render(<GitHubSignInButton isDisabled onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Sign in with GitHub" });

    expect(button.hasAttribute("disabled")).toBe(true);
  });
});
