import { z } from "zod";

// Product pages are built from these blocks, edited in the admin panel.
// Shared by the admin editor (RHF + zod), the server actions and the renderer.

const text = (max: number) => z.string().trim().max(max);
const url = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "Must be an http(s) URL");

export const BLOCK_ICONS = [
  "sparkles", "box", "zap", "shield", "coins", "store", "settings", "layers", "gift",
  "rocket", "puzzle", "wand", "chart", "globe", "lock", "heart", "users", "clock",
] as const;

const iconName = z.enum(BLOCK_ICONS);

export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("intro"),
    eyebrow: text(60).default(""),
    title: text(160),
    text: text(2000).default(""),
  }),
  z.object({
    type: z.literal("features"),
    eyebrow: text(60).default(""),
    title: text(160),
    text: text(600).default(""),
    items: z
      .array(z.object({ icon: iconName.default("sparkles"), title: text(80), text: text(400).default("") }))
      .max(24),
  }),
  z.object({
    type: z.literal("media"),
    eyebrow: text(60).default(""),
    title: text(160),
    text: text(2000).default(""),
    imageUrl: url.default(""),
    imageLeft: z.boolean().default(false),
  }),
  z.object({
    type: z.literal("cards"),
    eyebrow: text(60).default(""),
    title: text(160),
    text: text(600).default(""),
    items: z.array(z.object({ title: text(80), text: text(400).default(""), imageUrl: url.default("") })).max(12),
  }),
  z.object({
    type: z.literal("stats"),
    eyebrow: text(60).default(""),
    title: text(160),
    text: text(600).default(""),
    items: z.array(z.object({ value: text(30), label: text(60) })).max(8),
  }),
  z.object({
    type: z.literal("list"),
    eyebrow: text(60).default(""),
    title: text(160),
    text: text(600).default(""),
    items: z.array(z.object({ title: text(80), text: text(200).default("") })).max(40),
  }),
  z.object({
    type: z.literal("chips"),
    eyebrow: text(60).default(""),
    title: text(160),
    text: text(600).default(""),
    items: z.array(z.object({ label: text(60) })).max(80),
  }),
  z.object({
    type: z.literal("video"),
    eyebrow: text(60).default(""),
    title: text(160),
    text: text(600).default(""),
    // YouTube link; rendered with youtube-nocookie
    url,
  }),
  z.object({
    type: z.literal("faq"),
    title: text(160).default("Frequently Asked Questions"),
    items: z.array(z.object({ question: text(200), answer: text(2000) })).max(30),
  }),
]);

export const blocksSchema = z.array(blockSchema).max(40);

export const highlightSchema = z.object({ label: text(40), value: text(60) });
export const highlightsSchema = z.array(highlightSchema).max(12);

export type ContentBlock = z.infer<typeof blockSchema>;
export type BlockType = ContentBlock["type"];
export type Highlight = z.infer<typeof highlightSchema>;

export const BLOCK_LABELS: Record<BlockType, string> = {
  intro: "Intro (big headline + text)",
  features: "Feature grid (icon cards)",
  media: "Image + text",
  cards: "Image cards grid",
  stats: "Stats row",
  list: "Two-column list",
  chips: "Everything included (chips)",
  video: "Video (YouTube)",
  faq: "FAQ",
};

/** Empty block of a given type, used by the admin "Add block" menu. */
export function emptyBlock(type: BlockType): ContentBlock {
  switch (type) {
    case "intro":
      return { type, eyebrow: "", title: "Headline", text: "" };
    case "features":
      return { type, eyebrow: "", title: "What makes it stand out", text: "", items: [{ icon: "sparkles", title: "Feature", text: "" }] };
    case "media":
      return { type, eyebrow: "", title: "Section title", text: "", imageUrl: "", imageLeft: false };
    case "cards":
      return { type, eyebrow: "", title: "Section title", text: "", items: [{ title: "Card", text: "", imageUrl: "" }] };
    case "stats":
      return { type, eyebrow: "", title: "By the numbers", text: "", items: [{ value: "100+", label: "Label" }] };
    case "list":
      return { type, eyebrow: "", title: "Section title", text: "", items: [{ title: "Item", text: "" }] };
    case "chips":
      return { type, eyebrow: "", title: "Everything Included", text: "", items: [{ label: "Feature" }] };
    case "video":
      return { type, eyebrow: "", title: "Showcase", text: "", url: "" };
    case "faq":
      return { type, title: "Frequently Asked Questions", items: [{ question: "Question?", answer: "Answer." }] };
  }
}

/** youtube.com/watch?v=ID, youtu.be/ID or /embed/ID -> privacy-friendly embed URL */
export function youtubeEmbed(link: string) {
  const match = /(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/.exec(link);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}
