import { HowItWorksPage } from "@/ui/screens/howItWorks/HowItWorksPage";
import { buildPublicPageMeta } from "@/ui/shared/publicPageMetadata";

export function meta() {
  return buildPublicPageMeta(import.meta.env, "/how-it-works");
}

export default function HowItWorksRoute() {
  return <HowItWorksPage />;
}
