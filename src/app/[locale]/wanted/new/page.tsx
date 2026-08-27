import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

// The wanted flow is now a type within the unified add-a-book form. Keep this
// route alive (old links, bookmarks) by sending it there with wanted preselected.
export default async function NewWantedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: "/add?type=wanted", locale });
}
