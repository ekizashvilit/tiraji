"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function SortSelect({ className }: { className?: string }) {
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
		<Select
			aria-label={t("sortBy")}
			value={current}
			onChange={(e) => onChange(e.target.value)}
			className={cn("w-auto", className)}
		>
			<option value="recent">{t("sortRecent")}</option>
			<option value="relevance">{t("sortRelevance")}</option>
			<option value="price_asc">{t("sortPriceAsc")}</option>
			<option value="price_desc">{t("sortPriceDesc")}</option>
		</Select>
	);
}
