"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Check, Globe } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NAMES: Record<string, string> = { ka: "ქართული", en: "English" };
const LABELS: Record<string, string> = { ka: "ქარ", en: "ENG" };

export function LanguageSwitcher() {
	const locale = useLocale();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	// Preserve the current query string (e.g. a search + filters) across locales.
	const query = Object.fromEntries(searchParams.entries());

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					className="h-11 gap-1.5 px-0 font-medium cursor-pointer hover:bg-transparent hover:text-inherit aria-expanded:bg-transparent aria-expanded:text-inherit"
					aria-label="Language"
				>
					<Globe className="size-5" />
					{LABELS[locale]}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40">
				{routing.locales.map((l) => (
					<DropdownMenuItem
						key={l}
						onClick={() => router.replace({ pathname, query }, { locale: l })}
						className={l === locale ? "font-medium text-primary" : ""}
					>
						{NAMES[l] ?? l}
						{l === locale && <Check className="ml-auto h-4 w-4" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
