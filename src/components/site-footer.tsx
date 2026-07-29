import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-16 bg-brand-dark text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" aria-hidden />
            <span className="caps text-xl font-bold">
              {"ტირაჟი".toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-white/70">{t("about")}</p>
        </div>

        <nav className="flex gap-6 text-sm">
          <Link href="/terms" className="text-white/80 hover:text-white">
            {t("terms")}
          </Link>
          <Link href="/privacy" className="text-white/80 hover:text-white">
            {t("privacy")}
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/60">
          © {new Date().getFullYear()} ტირაჟი · {t("rights")}
        </p>
      </div>
    </footer>
  );
}
