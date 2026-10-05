import { SettingsPage } from "@/ui/screens/settings/SettingsPage";

import type { ReadableHandle } from "./appLayout";

export const handle: ReadableHandle = { isReadable: true };

export default function SettingsPageRoute() {
  return <SettingsPage />;
}
