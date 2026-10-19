"use client";

import { useCallback, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * next/image with a shimmer placeholder until the bytes arrive, then a short fade-in.
 * Meant for `fill` images: the parent must be `relative` (as every caller already is).
 */
export function ShimmerImage({ className, onLoad, alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  // Cached images can finish before hydration, so onLoad never fires for them
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <>
      {!loaded && <span aria-hidden className="shimmer absolute inset-0" />}
      <Image
        ref={ref}
        alt={alt}
        {...props}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={cn("transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0", className)}
      />
    </>
  );
}
