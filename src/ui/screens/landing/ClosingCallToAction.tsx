import { StartPracticingLink } from "@/ui/shared/StartPracticingLink";
import { t } from "@/ui/shared/strings";

/** The landing's last word: a green card with the second Start practicing link. */
export function ClosingCallToAction() {
  return (
    <section
      aria-labelledby="landing-closing"
      className="px-[clamp(16px,4vw,40px)] pb-[clamp(56px,7vw,96px)]"
    >
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-6 rounded-[20px] bg-primary p-[clamp(36px,5vw,64px)] text-primary-foreground">
        <div className="flex flex-[1_1_380px] flex-col gap-2">
          <h2
            id="landing-closing"
            className="font-serif text-[clamp(28px,3.6vw,40px)] leading-[1.1] font-medium"
          >
            {t.landing.closing.title}
          </h2>
          <p className="opacity-90">{t.landing.closing.body}</p>
        </div>
        <StartPracticingLink placement="footer" variant="outline" />
      </div>
    </section>
  );
}
