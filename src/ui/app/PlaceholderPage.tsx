import { t } from "@/ui/shared/strings";

export interface PlaceholderPageProps {
  title: string;
}

/** Stands in for a screen until its own issue builds it. */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <>
      <title>{t.documentTitle(title)}</title>
      <h1 className="font-serif text-3xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{t.placeholder}</p>
    </>
  );
}
