import { LandingPage } from "@/ui/screens/landing/LandingPage";
import { buildLandingJsonLd, buildPublicPageMeta } from "@/ui/shared/publicPageMetadata";

export function meta() {
  return [...buildPublicPageMeta(import.meta.env, "/"), buildLandingJsonLd(import.meta.env)];
}

export default function LandingRoute() {
  return <LandingPage />;
}
