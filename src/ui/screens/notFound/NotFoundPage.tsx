import { Link } from "react-router";

import { Button } from "@/ui/primitives/button";
import { t } from "@/ui/shared/strings";

/** An address that matches no page. The static host serves it with a 404 status. */
export function NotFoundPage() {
  return (
    <>
      <title>{t.documentTitle(t.pages.notFound)}</title>
      <h1 className="mb-4 font-serif text-3xl">{t.notFound.title}</h1>
      <p className="mb-6 text-muted-foreground">{t.notFound.body}</p>
      <Button asChild>
        <Link to="/">{t.notFound.home}</Link>
      </Button>
    </>
  );
}
