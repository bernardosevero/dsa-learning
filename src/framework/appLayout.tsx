import { useMatches } from "react-router";

import { AppLayout } from "@/ui/app/AppLayout";

/** What a screen's route module exports as `handle` to keep its content to a readable column. */
export interface ReadableHandle {
  isReadable: true;
}

function isReadableHandle(handle: unknown): handle is ReadableHandle {
  return typeof handle === "object" && handle !== null && "isReadable" in handle;
}

/**
 * One layout route for the main screens, so moving between them keeps the header mounted. Problem
 * detail and Settings ask for the readable column through their route handle.
 */
export default function AppLayoutRoute() {
  const isReadable = useMatches().some((match) => isReadableHandle(match.handle));
  return <AppLayout isReadable={isReadable} />;
}
