import { Link } from "react-router";

import { t } from "@/ui/shared/strings";

const { platform, account, storage } = t.landing.faqs;

/** Three direct answers, in the HTML as plain text so they read without JavaScript. */
export function LandingFaq() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-semibold">{platform.question}</h3>
        <p className="mt-1 text-muted-foreground">{platform.answer}</p>
      </div>
      <div>
        <h3 className="font-semibold">{account.question}</h3>
        <p className="mt-1 text-muted-foreground">{account.answer}</p>
      </div>
      <div>
        <h3 className="font-semibold">{storage.question}</h3>
        <p className="mt-1 text-muted-foreground">
          {storage.answerBefore}{" "}
          <Link to="/privacy" className="text-primary underline">
            {storage.privacyLink}
          </Link>
          {storage.answerAfter}
        </p>
      </div>
    </div>
  );
}
