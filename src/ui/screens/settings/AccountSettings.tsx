import { CircleAlertIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router";

import type { AccountResult } from "@/storage/accountService";
import { useAppData } from "@/ui/app/AppData";
import { Alert, AlertDescription } from "@/ui/primitives/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/primitives/alert-dialog";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";

import { SyncStatusLine } from "./SyncStatusLine";

const ACCOUNT_HASH = "#account";

/** The account: sign in with GitHub, or sign out and delete it. Both keep the local log. */
export function AccountSettings() {
  const { account, signIn, signOut, deleteAccount } = useAppData();
  const headingId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const { hash } = useLocation();
  const [isPending, setIsPending] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  // The header avatar links here; the router doesn't scroll to a fragment on its own.
  useEffect(() => {
    if (hash === ACCOUNT_HASH) {
      sectionRef.current?.scrollIntoView();
    }
  }, [hash]);

  async function runAction(action: () => Promise<AccountResult>) {
    setIsPending(true);
    setHasFailed(false);
    const result = await action();
    setIsPending(false);
    setHasFailed(!result.ok);
  }

  function handleSignIn() {
    void runAction(signIn);
  }

  function handleSignOut() {
    void runAction(signOut);
  }

  function handleDelete() {
    void runAction(deleteAccount);
  }

  if (account.status === "unavailable") {
    return null;
  }

  return (
    <section id="account" ref={sectionRef} aria-labelledby={headingId} className="scroll-mt-4">
      <SectionLabel id={headingId}>{t.account.title}</SectionLabel>
      <Card className="gap-3 p-4">
        {account.status === "signedOut" ? (
          <>
            <p className="text-sm text-muted-foreground">{t.account.purpose}</p>
            <Button className="self-start" disabled={isPending} onClick={handleSignIn}>
              {t.account.continueWithGitHub}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm">
              <span className="text-muted-foreground">{t.account.signedInAs}</span>{" "}
              <span className="font-semibold break-all">{account.email}</span>
            </p>
            <SyncStatusLine />
            <div className="flex flex-wrap gap-2.5">
              <Button variant="outline" disabled={isPending} onClick={handleSignOut}>
                {t.account.signOut}
              </Button>
              <DeleteAccountButton isPending={isPending} onConfirm={handleDelete} />
            </div>
          </>
        )}
        {hasFailed && (
          <Alert variant="destructive" role="alert">
            <CircleAlertIcon aria-hidden />
            <AlertDescription>{t.account.failed}</AlertDescription>
          </Alert>
        )}
      </Card>
    </section>
  );
}

interface DeleteAccountButtonProps {
  isPending: boolean;
  onConfirm: () => void;
}

function DeleteAccountButton({ isPending, onConfirm }: DeleteAccountButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-destructive" disabled={isPending}>
          {t.account.deleteAccount}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.account.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.account.deleteDetail}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.account.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {t.account.confirmDelete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
