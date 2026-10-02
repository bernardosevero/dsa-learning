import { Link } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/ui/primitives/avatar";
import { Button } from "@/ui/primitives/button";
import { t } from "@/ui/shared/strings";

import { useAppData } from "./AppData";

/** The header's account control: Sign in, the avatar linking to Settings, or nothing at all. */
export function HeaderAccount() {
  const { account, signIn } = useAppData();

  function handleSignIn() {
    // A failure only leaves the user signed out, with nothing lost, and the button stays to retry.
    void signIn();
  }

  if (account.status === "unavailable") {
    return null;
  }
  if (account.status === "signedOut") {
    return (
      <Button variant="outline" onClick={handleSignIn}>
        {t.account.signIn}
      </Button>
    );
  }
  return (
    <Link
      to="/settings#account"
      aria-label={t.account.openAccount}
      className="flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Avatar>
        {account.avatarUrl !== undefined && <AvatarImage src={account.avatarUrl} alt="" />}
        <AvatarFallback className="text-sm font-semibold">
          {account.email.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
