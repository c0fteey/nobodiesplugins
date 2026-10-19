import { ShimmerImage } from "@/components/media/shimmer-image";
import type { Faq, Product } from "@/db/schema";
import { youtubeEmbed, type ContentBlock } from "@/lib/content-blocks";
import { cn } from "@/lib/utils";
import { FaqList } from "../faq-list";
import { ProductArt } from "../product-art";
import { BlockIcon } from "./block-icon";
import { Reveal } from "./reveal";

function Heading({ eyebrow, title, text, center = true }: { eyebrow?: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={cn("mb-8", center && "text-center")}>
      {eyebrow && <p className="mb-2 text-xs font-bold tracking-[0.2em] text-brand-soft uppercase">{eyebrow}</p>}
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {text && <p className={cn("mt-3 text-sm leading-relaxed text-white/70", center && "mx-auto max-w-2xl")}>{text}</p>}
    </div>
  );
}

/** Image from the block, or the product's pixel art as a stand-in. */
function Visual({ url, product, alt }: { url: string; product: Product; alt: string }) {
  return url ? (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl ring-1 ring-white/10">
      <ShimmerImage src={url} alt={alt} fill unoptimized sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
    </div>
  ) : (
    <ProductArt product={product} size="md" sizes="40vw" className="aspect-video w-full rounded-xl opacity-90 ring-1 ring-white/10" />
  );
}

export function ContentBlocksView({ blocks, product }: { blocks: ContentBlock[]; product: Product }) {
  return (
    <div className="space-y-24">
      {blocks.map((block, i) => (
        <Reveal key={i}>
          <Block block={block} product={product} index={i} />
        </Reveal>
      ))}
    </div>
  );
}

function Block({ block, product, index }: { block: ContentBlock; product: Product; index: number }) {
  switch (block.type) {
    case "intro":
      return (
        <section className="text-center">
          {block.eyebrow && <p className="mb-2 text-xs font-bold tracking-[0.2em] text-brand-soft uppercase">{block.eyebrow}</p>}
          <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{block.title}</h2>
          {block.text && <p className="mx-auto mt-4 max-w-2xl leading-relaxed whitespace-pre-line text-white/75">{block.text}</p>}
        </section>
      );

    case "features":
      return (
        <section>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((item, k) => (
              <div key={k} className="rounded-xl border border-white/5 bg-gradient-to-b from-[#221a3d] to-[#19171f] p-5 transition hover:border-brand/40">
                <span className="grid size-10 place-items-center rounded-lg bg-brand/20 text-brand-soft">
                  <BlockIcon name={item.icon} className="size-5" />
                </span>
                <h3 className="mt-4 font-bold">{item.title}</h3>
                {item.text && <p className="mt-1.5 text-sm leading-relaxed text-white/65">{item.text}</p>}
              </div>
            ))}
          </div>
        </section>
      );

    case "media":
      return (
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div className={cn(block.imageLeft && "lg:order-2")}>
            <Heading eyebrow={block.eyebrow} title={block.title} center={false} />
            <p className="-mt-4 leading-relaxed whitespace-pre-line text-white/75">{block.text}</p>
          </div>
          <Visual url={block.imageUrl} product={product} alt={block.title} />
        </section>
      );

    case "cards":
      return (
        <section>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <div className="grid gap-5 sm:grid-cols-2">
            {block.items.map((item, k) => (
              <div key={k} className="overflow-hidden rounded-xl border border-white/5 bg-[#1a1a1d]">
                <Visual url={item.imageUrl} product={product} alt={item.title} />
                <div className="p-5">
                  <h3 className="text-lg font-bold text-brand-soft">{item.title}</h3>
                  {item.text && <p className="mt-1.5 text-sm leading-relaxed text-white/70">{item.text}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "stats":
      return (
        <section>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {block.items.map((item, k) => (
              <div key={k} className="rounded-xl border border-white/5 bg-[#1a1a1d] p-5 text-center">
                <p className="text-2xl font-extrabold text-brand-soft">{item.value}</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-white/60 uppercase">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "list":
      return (
        <section>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <div className="grid gap-3 sm:grid-cols-2">
            {block.items.map((item, k) => (
              <div key={k} className="rounded-lg border-l-2 border-brand bg-[#1c1c20] px-4 py-3">
                <p className="text-sm font-bold">{item.title}</p>
                {item.text && <p className="text-xs text-white/60">{item.text}</p>}
              </div>
            ))}
          </div>
        </section>
      );

    case "chips":
      return (
        <section>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <div className="flex flex-wrap justify-center gap-2">
            {block.items.map((item, k) => (
              <span key={k} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/80">
                {item.label}
              </span>
            ))}
          </div>
        </section>
      );

    case "video": {
      const src = youtubeEmbed(block.url);
      if (!src) return null;
      return (
        <section>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <div className="relative aspect-video overflow-hidden rounded-xl ring-1 ring-white/10">
            <iframe
              src={src}
              title={block.title}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          </div>
        </section>
      );
    }

    case "faq": {
      // FaqList expects Faq rows; give each item a stable id
      const faqs: Faq[] = block.items.map((item, k) => ({
        id: `b${index}-${k}`,
        question: item.question,
        answer: item.answer,
        sortOrder: k,
        published: true,
      }));
      return (
        <section id="faq" className="scroll-mt-24">
          <Heading title={block.title} />
          <FaqList faqs={faqs} />
        </section>
      );
    }
  }
}
