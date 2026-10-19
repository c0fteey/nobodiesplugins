import { cn } from "@/lib/utils";

/**
 * NOBODIES wordmark. Letters are pulled into each other and every letter
 * carries a background-colored outline, so where two glyphs touch the later
 * one "cuts" into the earlier one. Alternating z-order makes them read as
 * woven together rather than simply stacked.
 */
export function Wordmark({ text = "NOBODIES", className }: { text?: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={text}
      className={cn("inline-flex items-center font-logo leading-none font-extrabold uppercase select-none", className)}
    >
      {text.split("").map((letter, i) => (
        <span
          key={i}
          aria-hidden
          className="nb-letter"
          style={{ marginLeft: i === 0 ? 0 : "-0.05em", zIndex: i % 2 === 0 ? 2 : 1 }}
        >
          <span className="nb-cut">{letter}</span>
          <span className="nb-fill">{letter}</span>
        </span>
      ))}
    </span>
  );
}

/** Compact mark for tight spots (dashboard sidebar, favicon-like uses). */
export function LogoMark({ className }: { className?: string }) {
  return <Wordmark text="NB" className={cn("text-2xl", className)} />;
}
