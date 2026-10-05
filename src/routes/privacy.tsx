import { PrivacyPage } from "@/ui/screens/privacy/PrivacyPage";
import { buildPublicPageMeta } from "@/ui/shared/publicPageMetadata";

export function meta() {
  return buildPublicPageMeta(import.meta.env, "/privacy");
}

export default function PrivacyRoute() {
  return <PrivacyPage />;
}
