import { Outlet } from "react-router";

import { AppDataProvider, type AppDataProviderProps } from "./AppData";

export type PracticeAppProps = Omit<AppDataProviderProps, "children">;

/**
 * The practice screens' shared state around the current screen: the save file and the account.
 * It stays mounted while the user moves between practice screens. Browser only.
 */
export function PracticeApp({ accountService, remoteStore }: PracticeAppProps) {
  return (
    <AppDataProvider accountService={accountService} remoteStore={remoteStore}>
      <Outlet />
    </AppDataProvider>
  );
}
