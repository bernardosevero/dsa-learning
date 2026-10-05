import { useMatches } from "react-router";

/** What a screen's route exports as `handle` to keep its content to a readable column. */
export interface ReadableRouteHandle {
  isReadable: true;
}

export const READABLE_ROUTE_HANDLE: ReadableRouteHandle = { isReadable: true };

function isReadableRouteHandle(handle: unknown): handle is ReadableRouteHandle {
  return typeof handle === "object" && handle !== null && "isReadable" in handle;
}

/** Returns whether the current screen's route asked for the readable column. */
export function useIsReadableRoute(): boolean {
  return useMatches().some((match) => isReadableRouteHandle(match.handle));
}
