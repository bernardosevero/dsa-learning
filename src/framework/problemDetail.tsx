import { ProblemDetailPage } from "@/ui/screens/problemDetail/ProblemDetailPage";

import type { ReadableHandle } from "./appLayout";

export const handle: ReadableHandle = { isReadable: true };

export default function ProblemDetailPageRoute() {
  return <ProblemDetailPage />;
}
