import { READABLE_ROUTE_HANDLE } from "@/ui/app/readableRoute";
import { ProblemDetailPage } from "@/ui/screens/problemDetail/ProblemDetailPage";

// Problem detail and Settings keep their content to a readable column.
export const handle = READABLE_ROUTE_HANDLE;

export default function ProblemDetailPageRoute() {
  return <ProblemDetailPage />;
}
