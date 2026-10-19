import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type { ContentBlock, Highlight } from "@/lib/content-blocks";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { mode: "date" }).defaultNow().notNull();

// --- Auth.js tables (shape required by @auth/drizzle-adapter) ---

// Roles are rows so the admin panel can add/rename/delete them. "user" and "admin"
// are built in (system): renamable, never deletable. Access checks use the key "admin".
export const roles = pgTable("role", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#a1a1aa"),
  system: boolean("system").notNull().default(false),
  // Set = auto role: given once a buyer's completed orders reach this total (0 = any order).
  // The highest threshold reached wins; admins and manually given custom roles are never touched.
  minSpendCents: integer("min_spend_cents"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const users = pgTable("user", {
  id: id(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // Only set for e-mail + password accounts
  passwordHash: text("password_hash"),
  // Deleting a role drops its members back to "user"
  role: text("role")
    .notNull()
    .default("user")
    .references(() => roles.key, { onDelete: "set default", onUpdate: "cascade" }),
  marketingEmails: boolean("marketing_emails").notNull().default(true),
  // Shown in the dashboard once a Discord account is linked
  discordUsername: text("discord_username"),
  createdAt: createdAt(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// --- Store ---

export const productType = pgEnum("product_type", ["plugin", "addon", "model", "build"]);
export const productBadge = pgEnum("product_badge", ["sale", "new"]);

export const products = pgTable(
  "product",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: productType("type").notNull(),
    // Add-ons belong to a plugin (Crate Claim -> Crates)
    parentId: text("parent_id"),
    tagline: text("tagline"), // e.g. "Rewards & animations"
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull().default(""),
    priceCents: integer("price_cents").notNull(),
    // Struck-through "was" price; null when not discounted
    compareAtCents: integer("compare_at_cents"),
    badge: productBadge("badge"),
    // Optional cover image URL; when empty the UI renders generated pixel art
    imageUrl: text("image_url"),
    // Two colors for the generated cover art gradient
    accentFrom: text("accent_from").notNull().default("#6d28d9"),
    accentTo: text("accent_to").notNull().default("#a855f7"),
    artTitle: text("art_title"), // big pixel text on the cover, e.g. "CRATES"
    tags: text("tags").array().notNull().default([]),
    mcVersions: text("mc_versions").array().notNull().default([]),
    version: text("version").notNull().default("1.0.0"),
    changelog: text("changelog"),
    // Where buyers download the jar/zip; only handed out after an ownership check
    downloadUrl: text("download_url"),
    // Optional wide banner shown under the product header
    bannerUrl: text("banner_url"),
    // "Key stats" in the product sidebar, e.g. { label: "Folia", value: "Supported" }
    highlights: jsonb("highlights").$type<Highlight[]>().notNull().default([]),
    // Page sections, edited with the block editor in the admin panel
    content: jsonb("content").$type<ContentBlock[]>().notNull().default([]),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (p) => [index("product_type_idx").on(p.type), index("product_parent_idx").on(p.parentId)],
);

// --- Promotions ---

export const couponType = pgEnum("coupon_type", ["percent", "fixed"]);

export const coupons = pgTable("coupon", {
  id: id(),
  // Stored uppercase; customers type it case-insensitively
  code: text("code").notNull().unique(),
  description: text("description").notNull().default(""),
  type: couponType("type").notNull(),
  // percent: 1-100, fixed: cents
  amount: integer("amount").notNull(),
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  // null = unlimited
  maxUses: integer("max_uses"),
  usesCount: integer("uses_count").notNull().default(0),
  perUserLimit: integer("per_user_limit").notNull().default(1),
  // Set to lock the coupon to one account ("account coupon")
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  // Empty = whole cart; otherwise only these products are discounted
  productIds: text("product_ids").array().notNull().default([]),
  // Creator / partner codes show who the code belongs to
  creatorName: text("creator_name"),
  startsAt: timestamp("starts_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const couponRedemptions = pgTable(
  "coupon_redemption",
  {
    id: id(),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: text("order_id").notNull(),
    discountCents: integer("discount_cents").notNull(),
    createdAt: createdAt(),
  },
  (r) => [index("redemption_coupon_user_idx").on(r.couponId, r.userId)],
);

// "Buy X, get Y free" offers
export const campaigns = pgTable("campaign", {
  id: id(),
  name: text("name").notNull(),
  label: text("label").notNull().default("LAUNCH OFFER"),
  headline: text("headline").notNull(),
  text: text("text").notNull().default(""),
  triggerProductId: text("trigger_product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  rewardProductId: text("reward_product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { mode: "date" }),
  endsAt: timestamp("ends_at", { mode: "date" }),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const orderStatus = pgEnum("order_status", ["pending", "completed", "refunded"]);

export const orders = pgTable(
  "order",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subtotalCents: integer("subtotal_cents").notNull(),
    // Sale price savings (compare-at minus price)
    discountCents: integer("discount_cents").notNull().default(0),
    couponCode: text("coupon_code"),
    couponDiscountCents: integer("coupon_discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    status: orderStatus("status").notNull().default("completed"),
    createdAt: createdAt(),
  },
  (o) => [index("order_user_idx").on(o.userId)],
);

export const orderItems = pgTable(
  "order_item",
  {
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    priceCents: integer("price_cents").notNull(),
    // Set when the item was a free campaign gift
    campaignId: text("campaign_id"),
  },
  (oi) => [primaryKey({ columns: [oi.orderId, oi.productId] })],
);

export const licenseStatus = pgEnum("license_status", ["active", "revoked"]);

export const licenses = pgTable(
  "license",
  {
    id: id(),
    key: text("key").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    status: licenseStatus("status").notNull().default("active"),
    activations: integer("activations").notNull().default(0),
    lastSeenAt: timestamp("last_seen_at", { mode: "date" }),
    createdAt: createdAt(),
  },
  (l) => [uniqueIndex("license_user_product_idx").on(l.userId, l.productId)],
);

// --- Content ---

export const docPages = pgTable(
  "doc_page",
  {
    id: id(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    content: text("content").notNull().default(""), // markdown-ish plain text
    sortOrder: integer("sort_order").notNull().default(0),
    published: boolean("published").notNull().default(true),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (d) => [index("doc_product_idx").on(d.productId)],
);

export const faqs = pgTable("faq", {
  id: id(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

export const partners = pgTable("partner", {
  id: id(),
  name: text("name").notNull(),
  playersAvg: integer("players_avg").notNull().default(0),
  logoUrl: text("logo_url"),
  color: text("color").notNull().default("#7c5cff"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const contactMessages = pgTable("contact_message", {
  id: id(),
  name: text("name"),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: createdAt(),
});

export type Announcement = {
  enabled: boolean;
  title: string;
  badge: string;
  text: string;
  cta: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  visible: boolean;
};

export type FooterSettings = {
  tagline: string;
  showDiscord: boolean;
  showTwitter: boolean;
  showInstagram: boolean;
};

export type SiteSettings = {
  // Rotates right-to-left when there is more than one enabled
  announcements: Announcement[];
  discountPercent: number;
  seasonLabel: string;
  discordUrl: string;
  supportEmail: string;
  navItems: NavItem[];
  footer: FooterSettings;
};

export const settings = pgTable("setting", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<SiteSettings>().notNull(),
});

// --- Discord ---

// Single row (id "main"): which server the bot manages
export const discordSettings = pgTable("discord_settings", {
  id: text("id").primaryKey().default("main"),
  guildId: text("guild_id"),
  enabled: boolean("enabled").notNull().default(false),
  // Pull linked users into the server (needs the guilds.join scope)
  autoJoin: boolean("auto_join").notNull().default(true),
  // Take managed roles back when a purchase no longer qualifies (refund)
  removeRoles: boolean("remove_roles").notNull().default(true),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Condition -> Discord role. productId: owns that product; siteRole: has that site role;
// neither: any completed purchase ("every customer")
export const discordRoleRules = pgTable(
  "discord_role_rule",
  {
    id: id(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
    siteRole: text("site_role").references(() => roles.key, { onDelete: "cascade", onUpdate: "cascade" }),
    roleId: text("role_id").notNull(),
    createdAt: createdAt(),
  },
  (r) => [index("discord_rule_product_idx").on(r.productId)],
);

export const discordSyncLog = pgTable(
  "discord_sync_log",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    ok: boolean("ok").notNull(),
    message: text("message").notNull(),
    createdAt: createdAt(),
  },
  (l) => [index("discord_log_created_idx").on(l.createdAt)],
);

export type Role = typeof roles.$inferSelect;
export type Product = typeof products.$inferSelect;
export type DocPage = typeof docPages.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
