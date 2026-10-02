import { useAppData } from "@/ui/app/AppData";
import { formatTimeAgo } from "@/ui/shared/format";
import { t } from "@/ui/shared/strings";

/** How the account's sync stands, in words: "Synced 2 min ago", "Offline — …", "Sync paused — …". */
export function SyncStatusLine() {
  const { syncStatus } = useAppData();

  if (syncStatus.status === "signedOut") {
    return null;
  }
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {syncStatus.status === "synced" ? (
        <>
          {t.account.sync.synced}{" "}
          <span className="font-mono">{formatTimeAgo(syncStatus.at, new Date())}</span>
        </>
      ) : (
        t.account.sync[syncStatus.status]
      )}
    </p>
  );
}
