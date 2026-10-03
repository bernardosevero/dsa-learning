import { Button } from "@/ui/primitives/button";

import { SocialIcon } from "./SocialIcon";
import { t } from "./strings";

export interface GitHubSignInButtonProps {
  readonly onClick: () => void;
  readonly isDisabled?: boolean;
  /** Says just "Sign in" between the nav and sheet widths, where the header shares its row with the nav. */
  readonly hasShortLabelWhenNarrow?: boolean;
  readonly className?: string;
}

/** Starts GitHub sign-in: GitHub's dark button with its mark, so the provider is clear at a glance. */
export function GitHubSignInButton({
  onClick,
  isDisabled,
  hasShortLabelWhenNarrow,
  className,
}: GitHubSignInButtonProps) {
  return (
    <Button
      variant="dark"
      className={className}
      disabled={isDisabled}
      // The name stays the full label even when the visible text is shortened.
      aria-label={t.account.signInWithGitHub}
      onClick={onClick}
    >
      <SocialIcon platform="github" className="size-4" />
      {hasShortLabelWhenNarrow ? (
        <>
          <span className="hidden nav:inline sheet:hidden">{t.account.signIn}</span>
          <span className="nav:hidden sheet:inline">{t.account.signInWithGitHub}</span>
        </>
      ) : (
        t.account.signInWithGitHub
      )}
    </Button>
  );
}
