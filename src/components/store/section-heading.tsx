import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

export function SectionHeading({ title, description, href }: { title: string; description?: string; href?: string }) {
  return (
    <div className="mb-8">
      <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <span aria-hidden className="block h-7 w-[3px] shrink-0 rounded-full bg-brand" />
        {title}
        {href && (
          <Link
            href={href}
            aria-label={`See all ${title}`}
            className="grid size-6 place-items-center rounded-full bg-white/15 text-white/80 transition hover:bg-brand hover:text-white"
          >
            <ChevronRightIcon className="size-4" />
          </Link>
        )}
      </h2>
      {description && <p className="mt-2 text-sm text-white/70">{description}</p>}
    </div>
  );
}
