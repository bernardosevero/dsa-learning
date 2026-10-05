import { READABLE_ROUTE_HANDLE } from "@/ui/app/readableRoute";
import { SettingsPage } from "@/ui/screens/settings/SettingsPage";

// Problem detail and Settings keep their content to a readable column.
export const handle = READABLE_ROUTE_HANDLE;

export default function SettingsPageRoute() {
  return <SettingsPage />;
}
