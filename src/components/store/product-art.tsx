import { ShimmerImage } from "@/components/media/shimmer-image";
import type { Product } from "@/db/schema";
import { cn } from "@/lib/utils";

type ArtProduct = Pick<Product, "name" | "imageUrl" | "accentFrom" | "accentTo" | "artTitle" | "type">;

/**
 * Product cover. Uses the uploaded image when there is one, otherwise renders
 * a blocky, Minecraft-flavoured cover from the product's colors and art title.
 */
export function ProductArt({
  product,
  className,
  size = "md",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
}: {
  product: ArtProduct;
  className?: string;
  size?: "sm" | "md" | "lg";
  sizes?: string;
  priority?: boolean;
}) {
  if (product.imageUrl) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <ShimmerImage
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  const title = (product.artTitle || product.name).toUpperCase();
  const words = title.split(" ");

  return (
    <div
      aria-label={product.name}
      role="img"
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, ${product.accentFrom}, ${product.accentTo})` }}
    >
      {/* pixel grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* chunky voxel blocks */}
      <span aria-hidden className="absolute -right-3 -bottom-3 size-1/3 rotate-12 rounded-sm bg-black/25 shadow-[inset_-6px_-6px_0_rgba(0,0,0,.25),inset_6px_6px_0_rgba(255,255,255,.2)]" />
      <span aria-hidden className="absolute top-3 left-3 size-1/6 -rotate-6 rounded-sm bg-white/20 shadow-[inset_-4px_-4px_0_rgba(0,0,0,.2)]" />
      <span aria-hidden className="absolute top-1/4 right-1/5 size-1/12 rounded-[2px] bg-yellow-300/80 shadow-[inset_-3px_-3px_0_rgba(0,0,0,.25)]" />
      <div aria-hidden className="absolute inset-[6%] rounded-md border-2 border-white/40" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        {words.map((word, i) => (
          <span
            key={i}
            className={cn(
              "font-pixel leading-[0.85] font-bold text-white [text-shadow:3px_3px_0_rgba(0,0,0,.35),-1px_-1px_0_rgba(0,0,0,.2)]",
              size === "lg" && "text-[clamp(2.2rem,6vw,4.5rem)]",
              size === "md" && "text-[clamp(1.4rem,3.4vw,2.4rem)]",
              size === "sm" && "text-lg",
            )}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
