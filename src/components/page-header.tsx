import { cn } from "@/lib/utils";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";

export function PageHeader({ title, lede, accent, crumbs }: { title: string; lede?: string; accent?: "buy" | "swap" | "give"; crumbs?: Crumb[] }) {
	const bar = accent === "swap" ? "bg-swap" : accent === "give" ? "bg-give" : "bg-buy";

	// With breadcrumbs, the last crumb stands in for the page title, so we drop
	// the big <h1> (and its accent bar) and just show the trail + description.
	if (crumbs && crumbs.length > 0) {
		return (
			<div>
				<div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
					<Breadcrumbs items={crumbs} emphasizeLast />
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
				<div className="flex gap-3 sm:gap-4">
					<span className={cn("w-1 shrink-0 self-stretch rounded-full sm:w-1.5", bar)} aria-hidden />
					<div>
						<h1 className="text-xl font-bold sm:text-3xl">{title}</h1>
						{lede && <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:mt-1.5 sm:text-base">{lede}</p>}
					</div>
				</div>
			</div>
		</div>
	);
}
