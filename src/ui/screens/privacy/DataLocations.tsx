import { ChartColumnIcon, CloudIcon, MonitorIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/ui/primitives/badge";
import { Card } from "@/ui/primitives/card";
import { t } from "@/ui/shared/strings";

const { locations } = t.privacy;

interface LocationCardProps {
  id: string;
  icon: LucideIcon;
  title: string;
  badge: string;
  isAlways?: boolean;
  children: ReactNode;
}

function LocationCard({
  id,
  icon: Icon,
  title,
  badge,
  isAlways = false,
  children,
}: LocationCardProps) {
  return (
    <Card className="rounded-2xl p-6">
      <article aria-labelledby={id} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Icon aria-hidden className="size-6 text-primary" />
          <Badge variant={isAlways ? "due" : "muted"} className="font-mono font-normal">
            {badge}
          </Badge>
        </div>
        <h3 id={id} className="text-lg font-semibold">
          {title}
        </h3>
        <div className="flex flex-col gap-3 text-[15px] text-muted-foreground">{children}</div>
      </article>
    </Card>
  );
}

/** Where data can live: always this browser, an account if you sign in, analytics if allowed. */
export function DataLocations() {
  return (
    <section aria-labelledby="privacy-where" className="flex flex-col gap-5">
      <h2 id="privacy-where" className="font-serif text-[32px] leading-tight font-medium">
        {t.privacy.whereTitle}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        <LocationCard
          id="privacy-browser"
          icon={MonitorIcon}
          title={locations.browser.title}
          badge={locations.browser.badge}
          isAlways
        >
          <p>{t.privacy.browserStorage}</p>
          <p>{t.privacy.exportAndReset}</p>
        </LocationCard>
        <LocationCard
          id="privacy-account"
          icon={CloudIcon}
          title={locations.account.title}
          badge={locations.account.badge}
        >
          <p>{t.privacy.accountStorage}</p>
          <p>{t.privacy.accountDelete}</p>
        </LocationCard>
        <LocationCard
          id="privacy-analytics"
          icon={ChartColumnIcon}
          title={locations.analytics.title}
          badge={locations.analytics.badge}
        >
          <p>{locations.analytics.body}</p>
          <a
            href="#usage-sharing"
            className="inline-flex min-h-11 items-center self-start font-medium text-primary underline"
          >
            {locations.analytics.turnOff}
          </a>
        </LocationCard>
      </div>
    </section>
  );
}
