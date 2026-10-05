import { t } from "@/ui/shared/strings";

/**
 * What shows until the practice app has read this browser's save: the app shell's HTML, and the
 * first render while hydrating. The same element both times, so nothing jumps.
 */
export function AppLoading() {
  return (
    <>
      <title>{t.appName}</title>
      <div className="min-h-svh" aria-busy="true">
        <p className="sr-only" role="status">
          {t.shell.loading}
        </p>
      </div>
    </>
  );
}
