"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";

export function SortSelect() {
	const t = useTranslations("filters");
	const params = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const current = params.get("sort") ?? "recent";

	function onChange(value: string) {
		const sp = new URLSearchParams(params.toString());
		if (value === "recent") sp.delete("sort");
		else sp.set("sort", value);
		const qs = sp.toString();
		router.push(qs ? `${pathname}?${qs}` : pathname);
	}

	return (
		<label className="flex items-center gap-2 text-sm">
			<select
				value={current}
				onChange={(e) => onChange(e.target.value)}
				className="h-10 rounded-md border border-input bg-background px-2 text-sm font-medium outline-none focus:border-primary"
			>
				<option value="recent">{t("sortRecent")}</option>
				<option value="relevance">{t("sortRelevance")}</option>
				<option value="price_asc">{t("sortPriceAsc")}</option>
				<option value="price_desc">{t("sortPriceDesc")}</option>
			</select>
		</label>
	);
}
