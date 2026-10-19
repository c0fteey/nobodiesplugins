import { Skeleton } from "@/components/ui/skeleton";
import { site } from "@/lang/site";

/** Placeholder with the same layout as the product browser (filters + card grid). */
export function ProductGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-label={site.browser.loadingLabel} className="container-page grid gap-8 py-16 lg:grid-cols-[230px_1fr]">
      <div className="hidden space-y-3 lg:block">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="flex flex-col">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="mt-5 h-5 w-2/3" />
            <Skeleton className="mt-2.5 h-3.5 w-full" />
            <Skeleton className="mt-1.5 h-3.5 w-4/5" />
            <div className="mt-5 flex items-end justify-between">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
