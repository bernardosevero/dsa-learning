import { Link } from "react-router";

import { t } from "@/ui/shared/strings";

import { NeverSent } from "./NeverSent";

/** What usage sharing sends: each event by name with what it carries, then what is never sent. */
export function SentEvents() {
  return (
    <section aria-labelledby="privacy-sent" className="flex flex-wrap gap-x-16 gap-y-8">
      <div className="flex flex-[1_1_280px] flex-col gap-3">
        <h2 id="privacy-sent" className="font-serif text-[32px] leading-tight font-medium">
          {t.privacy.sentTitle}
        </h2>
        <p className="text-[15px] text-muted-foreground">{t.privacy.sentIntro}</p>
      </div>
      <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-7">
        <ul className="flex flex-col border-b">
          {t.privacy.events.map((event) => (
            <li key={event.name} className="flex flex-wrap gap-x-5 gap-y-1 border-t py-3.5">
              <span className="flex-[1_1_180px] font-semibold">{event.name}</span>
              <span className="flex-[2_1_260px] text-[15px] text-muted-foreground">
                {event.detail}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 text-[15px] text-muted-foreground">
          <p>{t.privacy.publicPages}</p>
          <p>{t.privacy.funnel}</p>
          <p>{t.privacy.analyticsDetails}</p>
          <p>{t.privacy.analyticsStorage}</p>
          <p>
            {t.privacy.optOutBefore}{" "}
            <Link to="/settings" className="text-primary underline">
              {t.privacy.settingsLink}
            </Link>
            {t.privacy.optOutAfter}
          </p>
        </div>
        <NeverSent />
      </div>
    </section>
  );
}
