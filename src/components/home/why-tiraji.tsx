import { getTranslations } from "next-intl/server";
import { PiggyBank, Recycle, Gem, LayoutGrid } from "lucide-react";

export async function WhyTiraji() {
  const t = await getTranslations("home");

  const items = [
    { Icon: PiggyBank, title: t("why.b1t"), desc: t("why.b1d") },
    { Icon: Recycle, title: t("why.b2t"), desc: t("why.b2d") },
    { Icon: Gem, title: t("why.b3t"), desc: t("why.b3d") },
    { Icon: LayoutGrid, title: t("why.b4t"), desc: t("why.b4d") },
  ];

  return (
    <section>
      <h2 className="caps mb-6 text-lg font-bold sm:text-xl">
        {t("whyTitle").toUpperCase()}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-card p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-base font-bold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
