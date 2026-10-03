import { Link } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/ui/primitives/avatar";
import { cn } from "@/ui/primitives/cn";
import { GitHubSignInButton } from "@/ui/shared/GitHubSignInButton";
import { t } from "@/ui/shared/strings";

import { useAppData } from "./AppData";
import type { SyncStatus } from "./useSync";

// The dot's color is never the only signal: the link's name says the same in words.
const SYNC_DOTS: Record<
  Exclude<SyncStatus["status"], "signedOut">,
  { className: string; label: string }
> = {
  syncing: { className: "animate-pulse bg-muted-foreground", label: t.account.sync.syncing },
  synced: { className: "bg-primary", label: t.account.sync.synced },
  offline: { className: "bg-rating-medium", label: t.account.sync.offline },
  error: { className: "bg-destructive", label: t.account.sync.error },
};

/** The header's account control: Sign in with GitHub, the avatar linking to Settings, or nothing at all. */
export function HeaderAccount() {
  const { account, signIn, syncStatus } = useAppData();

  function handleSignIn() {
    // A failure only leaves the user signed out, with nothing lost, and the button stays to retry.
    void signIn();
  }

  if (account.status === "unavailable") {
    return null;
  }
  if (account.status === "signedOut") {
    return <GitHubSignInButton hasShortLabelWhenNarrow onClick={handleSignIn} />;
  }
  const syncDot = syncStatus.status === "signedOut" ? undefined : SYNC_DOTS[syncStatus.status];
  return (
    <Link
      to="/settings#account"
      aria-label={
        syncDot === undefined
          ? t.account.openAccount
          : `${t.account.openAccount}${t.separator}${syncDot.label}`
      }
      className="flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="relative">
        <Avatar>
          {account.avatarUrl !== undefined && <AvatarImage src={account.avatarUrl} alt="" />}
          <AvatarFallback className="text-sm font-semibold">
            {account.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {syncDot !== undefined && (
          <span
            aria-hidden
            className={cn(
              "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-background",
              syncDot.className,
            )}
          />
        )}
      </span>
    </Link>
  );
}
