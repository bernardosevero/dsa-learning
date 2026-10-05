import { Outlet } from "react-router";

import { PublicLayout } from "@/ui/app/PublicLayout";

export default function PublicLayoutRoute() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  );
}
