import { getTranslations } from "next-intl/server";
import { Search, MessageCircle, Handshake } from "lucide-react";

export async function HowItWorks() {
  const t = await getTranslations("home");

  const steps = [
    { Icon: Search, title: t("how.s1t"), desc: t("how.s1d") },
    { Icon: MessageCircle, title: t("how.s2t"), desc: t("how.s2d") },
    { Icon: Handshake, title: t("how.s3t"), desc: t("how.s3d") },
  ];

  return (
    <section className="rounded-xl border border-border bg-secondary/40 p-6 sm:p-10">
      <h2 className="caps mb-8 text-lg font-bold sm:text-xl">
        {t("howTitle").toUpperCase()}
      </h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map(({ Icon, title, desc }, i) => (
          <div key={title} className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-bold text-muted-foreground">
                {i + 1}
              </span>
            </div>
            <h3 className="text-base font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
