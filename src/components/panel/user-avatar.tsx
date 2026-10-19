import { ShimmerImage } from "@/components/media/shimmer-image";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, image, className }: { name: string; image: string | null; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <span className={cn("relative grid size-12 place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-brand to-[#a68cff]", className)}>
      {image ? (
        <ShimmerImage src={image} alt={name} fill sizes="48px" unoptimized className="object-cover" />
      ) : (
        <span className="text-sm font-bold text-white">{initials}</span>
      )}
    </span>
  );
}
