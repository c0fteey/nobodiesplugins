import { z } from "zod";
import { blocksSchema, highlightsSchema } from "@/lib/content-blocks";

// Accepts "", null or a URL. The client resolver already maps "" to null and the
// server parses that output again, so null must be valid input too.
const optionalUrl = z
  .string()
  .trim()
  .nullish()
  .refine((v) => !v || /^https?:\/\/\S+$/.test(v), "Must be an http(s) URL")
  .transform((v) => v || null);

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #5b2bff");
const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only");

export const couponCodeSchema = z
  .string()
  .trim()
  .max(40)
  .regex(/^[A-Za-z0-9_-]*$/, "Coupon codes only contain letters, numbers, - and _");

export const checkoutSchema = z.object({
  productIds: z.array(z.uuid()).min(1, "Your cart is empty").max(50),
  couponCode: couponCodeSchema.nullish(),
});

export const contactSchema = z.object({
  name: z.string().trim().max(80).optional().default(""),
  email: z.email("Enter a valid email address").trim(),
  subject: z.enum(["Technical Support", "Billing", "Feature Request", "Other"]),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(4000),
});

export const productSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().trim().min(2).max(80),
    slug,
    type: z.enum(["plugin", "addon", "model", "build"]),
    parentId: z.uuid().nullable().optional(),
    tagline: z.string().trim().max(60).optional().default(""),
    shortDescription: z.string().trim().min(10).max(300),
    description: z.string().trim().max(20000).optional().default(""),
    price: z.coerce.number().min(0).max(10000),
    compareAt: z.coerce.number().min(0).max(10000).nullable().optional(),
    badge: z.enum(["sale", "new", "none"]).default("none"),
    imageUrl: optionalUrl,
    downloadUrl: optionalUrl,
    accentFrom: hexColor,
    accentTo: hexColor,
    artTitle: z.string().trim().max(24).optional().default(""),
    tags: z.string().optional().default(""), // comma separated in the form
    mcVersions: z.string().optional().default(""),
    version: z.string().trim().min(1).max(30),
    featured: z.boolean().default(false),
    published: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
    bannerUrl: optionalUrl,
    highlights: highlightsSchema.default([]),
    content: blocksSchema.default([]),
  })
  .refine((p) => p.type !== "addon" || !!p.parentId, {
    message: "Add-ons must belong to a plugin",
    path: ["parentId"],
  })
  .refine((p) => p.compareAt == null || p.compareAt === 0 || p.compareAt > p.price, {
    message: "Compare-at price must be higher than the price",
    path: ["compareAt"],
  });

export const docSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(2).max(120),
  slug,
  productId: z.uuid().nullable().optional(),
  summary: z.string().trim().max(400).optional().default(""),
  content: z.string().max(50000).optional().default(""),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  published: z.boolean().default(true),
});

export const faqSchema = z.object({
  id: z.uuid().optional(),
  question: z.string().trim().min(5).max(200),
  answer: z.string().trim().min(5).max(4000),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  published: z.boolean().default(true),
});

export const partnerSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(40),
  playersAvg: z.coerce.number().int().min(0).max(1_000_000),
  logoUrl: optionalUrl,
  color: hexColor,
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
});

export const announcementSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().min(1, "Title is required").max(60),
  badge: z.string().trim().max(20),
  text: z.string().trim().max(60),
  cta: z.string().trim().max(30),
  href: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Use /path or an https:// link"),
});

const navItemSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(30),
  href: z.string().trim().min(1).max(100),
  visible: z.boolean(),
});

const footerSchema = z.object({
  tagline: z.string().trim().max(150),
  showDiscord: z.boolean(),
  showTwitter: z.boolean(),
  showInstagram: z.boolean(),
});

export const settingsSchema = z.object({
  announcements: z.array(announcementSchema).max(10),
  discountPercent: z.coerce.number().int().min(0).max(90),
  seasonLabel: z.string().trim().min(2).max(40),
  discordUrl: z.url(),
  supportEmail: z.email(),
  navItems: z.array(navItemSchema).min(1).max(20),
  footer: footerSchema,
});

// Accepts a Date (already parsed by the client resolver) or a date string; "" = none
const optionalDate = z
  .union([z.date(), z.string().trim()])
  .nullish()
  .transform((v, ctx) => {
    if (v == null || v === "") return null;
    const date = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid date" });
      return z.NEVER;
    }
    return date;
  });

export const couponSchema = z
  .object({
    id: z.uuid().optional(),
    code: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only")
      .transform((v) => v.toUpperCase()),
    description: z.string().trim().max(200).default(""),
    type: z.enum(["percent", "fixed"]),
    // percent: 1-100, fixed: euros (converted to cents in the action)
    amount: z.coerce.number().positive("Must be more than 0").max(10000),
    minSubtotal: z.coerce.number().min(0).max(10000).default(0),
    maxUses: z.coerce.number().int().min(1).max(1_000_000).nullable().default(null),
    perUserLimit: z.coerce.number().int().min(1).max(1000).default(1),
    userEmail: z
      .string()
      .trim()
      .toLowerCase()
      .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email")
      .default(""),
    productIds: z.array(z.uuid()).max(200).default([]),
    creatorName: z.string().trim().max(60).default(""),
    startsAt: optionalDate,
    expiresAt: optionalDate,
    active: z.boolean().default(true),
  })
  .refine((c) => c.type !== "percent" || c.amount <= 100, { message: "Percent can't exceed 100", path: ["amount"] })
  .refine((c) => !c.startsAt || !c.expiresAt || c.expiresAt > c.startsAt, {
    message: "Must end after it starts",
    path: ["expiresAt"],
  });

export const campaignSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().trim().min(2).max(80),
    label: z.string().trim().min(1).max(30).default("LAUNCH OFFER"),
    headline: z.string().trim().min(5).max(120),
    text: z.string().trim().max(300).default(""),
    triggerProductId: z.uuid("Choose the product to buy"),
    rewardProductId: z.uuid("Choose the free product"),
    startsAt: optionalDate,
    endsAt: optionalDate,
    active: z.boolean().default(true),
  })
  .refine((c) => c.triggerProductId !== c.rewardProductId, {
    message: "The free product must be different",
    path: ["rewardProductId"],
  })
  .refine((c) => !c.startsAt || !c.endsAt || c.endsAt > c.startsAt, { message: "Must end after it starts", path: ["endsAt"] });

export type ProductInput = z.input<typeof productSchema>;
export type DocInput = z.input<typeof docSchema>;
export type FaqInput = z.input<typeof faqSchema>;
export type PartnerInput = z.input<typeof partnerSchema>;
export type SettingsInput = z.input<typeof settingsSchema>;
export type ContactInput = z.input<typeof contactSchema>;
