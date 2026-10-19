import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import type { ContentBlock, Highlight } from "../src/lib/content-blocks";

const SHOP_HIGHLIGHTS: Highlight[] = [
  { label: "In-game editor", value: "Yes" },
  { label: "Folia", value: "Supported" },
  { label: "Bedrock players", value: "Supported" },
  { label: "Currencies", value: "Unlimited" },
];

const SHOP_CONTENT: ContentBlock[] = [
  {
    type: "intro",
    eyebrow: "",
    title: "Every shop on your server, built and run from one in-game editor.",
    text: "Set up categories, items and prices without opening a single config file. Players get a clean GUI, you get full control.",
  },
  {
    type: "features",
    eyebrow: "Why it stands out",
    title: "What makes NOBODIES Shop apart",
    text: "",
    items: [
      { icon: "wand", title: "Built in-game", text: "Create shops, categories and items from a GUI editor. No YAML needed." },
      { icon: "coins", title: "Unlimited currencies", text: "Charge money, points, XP levels, items or any placeholder." },
      { icon: "store", title: "Four ways to trade", text: "GUI shops, commands, chest shops and sign shops." },
      { icon: "zap", title: "Fast and light", text: "Async loading and caching keep your TPS where it belongs." },
      { icon: "shield", title: "Safe transactions", text: "Every purchase is validated and logged." },
      { icon: "layers", title: "Templates", text: "Start from ready-made layouts and tweak them." },
    ],
  },
  {
    type: "media",
    eyebrow: "Editor",
    title: "Build your whole shop in-game",
    text: "Drag items in, set a price, done. Edit layouts, lore and permissions without leaving the server.",
    imageUrl: "",
    imageLeft: false,
  },
  {
    type: "cards",
    eyebrow: "",
    title: "Four ways to trade",
    text: "Give players the shopping style that fits your server.",
    items: [
      { title: "GUI Shops", text: "Classic menus with categories and pages.", imageUrl: "" },
      { title: "The /sell Command", text: "Sell your whole inventory or a single item.", imageUrl: "" },
      { title: "Player Chest Shops", text: "Let players run their own stalls.", imageUrl: "" },
      { title: "Admin Sign Shops", text: "One-click buying from signs around spawn.", imageUrl: "" },
    ],
  },
  {
    type: "stats",
    eyebrow: "",
    title: "Price a whole shop without a spreadsheet",
    text: "Built-in price generator and audit tools.",
    items: [
      { value: "20+", label: "Price presets" },
      { value: "∞", label: "Currencies" },
      { value: "4", label: "Shop types" },
      { value: "< 1ms", label: "Avg. lookup" },
    ],
  },
  {
    type: "chips",
    eyebrow: "",
    title: "Everything Included",
    text: "",
    items: ["GUI editor", "Sell command", "Sign shops", "Chest shops", "Discounts", "Permissions", "Logs", "PlaceholderAPI", "Vault", "Folia", "Bedrock", "Templates"].map((label) => ({ label })),
  },
  {
    type: "faq",
    title: "Frequently Asked Questions",
    items: [
      { question: "Does it work with my economy plugin?", answer: "Yes, anything that hooks into Vault works out of the box." },
      { question: "Can I import my old shop?", answer: "You can rebuild it quickly in the editor; most servers are done in under an hour." },
    ],
  },
];

const { products, docPages, faqs, partners, settings, campaigns, coupons } = schema;

type Seed = Omit<typeof products.$inferInsert, "parentId"> & { parent?: string };

const VERSIONS = ["1.8", "1.12", "1.16", "1.20", "1.21"];

const PLUGINS: Seed[] = [
  {
    slug: "nobodies-crates", name: "NOBODIES Crates", type: "plugin", tagline: "Rewards & animations", artTitle: "CRATES",
    shortDescription: "The crate plugin with 120+ animation combos, Bedrock support, custom models and rewards players can pick themselves.",
    description: "NOBODIES Crates turns opening a crate into a moment.\n\nPick from more than 120 opening animations, let players choose their own prize, and preview every reward in a clean GUI. Works with Java and Bedrock players, supports custom models, and stays light on your server's tick time.",
    priceCents: 1799, compareAtCents: 1999, badge: "sale", accentFrom: "#f59e0b", accentTo: "#fde047",
    tags: ["Crates", "Animated", "Functionality"], mcVersions: VERSIONS, version: "6.7.0", featured: true, sortOrder: 1,
    changelog: "Disable build notifications by default, opt in with a config flag",
  },
  {
    slug: "nobodies-shop", name: "NOBODIES Shop", type: "plugin", tagline: "Economy & trading", artTitle: "SHOP",
    shortDescription: "A GUI shop built around an in-game editor, with per-shop commands, sign shops and prices in money, points, levels or items.",
    description: "Set up a full server shop without touching a config file.\n\nThe in-game editor lets you add categories, items and prices in seconds. Charge in money, points, XP levels, items or any placeholder, and expose shops through commands, chests or signs.",
    priceCents: 1999, badge: "new", accentFrom: "#7c3aed", accentTo: "#c084fc",
    tags: ["Shop", "Economy", "Functionality"], mcVersions: VERSIONS, version: "1.0.0-beta-1", featured: true, sortOrder: 2,
    changelog: "First public release",
  },
  {
    slug: "nobodies-duels", name: "NOBODIES Duels", type: "plugin", tagline: "Arenas & matchmaking", artTitle: "DUELS",
    shortDescription: "Duels that fit any server type: modern menus, casual and ranked matches, flexible arena modes and in-game setup.",
    description: "Everything a PvP server needs out of the box.\n\nQueue for casual or ranked matches, build arenas in game, and give players kits, stats and leaderboards. No extra dependencies required.",
    priceCents: 1799, compareAtCents: 1999, badge: "sale", accentFrom: "#16a34a", accentTo: "#4ade80",
    tags: ["Minigames", "Arenas", "Functionality"], mcVersions: VERSIONS, version: "4.5.0", featured: true, sortOrder: 3,
    changelog: "Disable build notifications by default, opt in with a config flag",
  },
  {
    slug: "nobodies-lobby", name: "NOBODIES Lobby", type: "plugin", tagline: "Hub & navigation", artTitle: "LOBBY",
    shortDescription: "Features from 30+ lobby plugins in one: proxy support, NPCs, announcements, queues, scoreboards and world protection.",
    description: "Replace a stack of hub plugins with one.\n\nProxy-aware server selectors, NPCs, holograms, announcements, queues, scoreboards and world protection — all configured from a single place.",
    priceCents: 1799, compareAtCents: 1999, badge: "sale", accentFrom: "#2563eb", accentTo: "#60a5fa",
    tags: ["Lobby", "Functionality"], mcVersions: VERSIONS, version: "3.4.0", sortOrder: 4,
    changelog: "Folia support",
  },
];

const addon = (parent: string, slug: string, name: string, art: string, desc: string, price: number, compare: number | null, from: string, to: string, tags: string[], sortOrder: number): Seed => ({
  slug, name, type: "addon", parent, artTitle: art, shortDescription: desc, priceCents: price, compareAtCents: compare,
  badge: compare ? "sale" : null, accentFrom: from, accentTo: to, tags: ["Addon", ...tags], mcVersions: VERSIONS, sortOrder,
});

const ADDONS: Seed[] = [
  addon("nobodies-crates", "crate-claim", "Crate Claim (Add-on)", "CRATE CLAIM", "Adds a claim rewards menu so players can collect the rewards they won later from crates.", 899, 999, "#6d28d9", "#a855f7", ["Crates"], 10),
  addon("nobodies-crates", "mass-opening", "Mass Opening (Add-on)", "MASS OPENING", "Adds mass opening so players can open many keys at once with a single click.", 899, 999, "#b91c1c", "#f87171", ["Crates", "Animations"], 11),
  addon("nobodies-crates", "loot-boxes", "LootBoxes (Add-on)", "LOOT BOXES", "Adds placeable lootboxes players can obtain, gift and open anywhere.", 899, 999, "#4338ca", "#818cf8", ["Crates"], 12),
  addon("nobodies-crates", "rarities", "Rarities (Add-on)", "RARITIES", "Adds a rarity system so you can set tiers, colors and broadcast rules per reward.", 719, 799, "#db2777", "#f9a8d4", ["Crates"], 13),
  addon("nobodies-crates", "last-winner", "Last Winner (Add-on)", "LAST WINNER", "Adds placeholders that log the winners of each crate and their rewards.", 359, 399, "#15803d", "#86efac", ["Crates"], 14),
  addon("nobodies-crates", "player-kits", "Player Kits (Add-on)", "PLAYER KITS", "Lets players create and share their own kits from crate rewards.", 899, 999, "#0284c7", "#7dd3fc", ["Crates"], 15),
  addon("nobodies-crates", "reward-on-loop", "Reward on Loop (Add-on)", "LOOP", "Gives a small reward every time a crate animation loops. Free for every Crates owner.", 0, null, "#334155", "#94a3b8", ["Crates"], 16),
  addon("nobodies-crates", "leaderboard", "Leaderboard (Add-on)", "TOP", "Adds crate opening leaderboards with holograms. Free for every Crates owner.", 0, null, "#334155", "#94a3b8", ["Crates"], 17),
  addon("nobodies-duels", "lobby-items", "Lobby Items (Add-on)", "LOBBY ITEMS", "Adds custom dynamic lobby items, a scoreboard and more to the duels lobby.", 629, 699, "#7c3aed", "#a78bfa", ["Minigames"], 20),
  addon("nobodies-duels", "elo-ranks", "Elo Ranks (Add-on)", "ELO RANKS", "Adds elo ranks that players can climb through ranked matches.", 899, 999, "#ea580c", "#fdba74", ["Minigames"], 21),
  addon("nobodies-duels", "sign-queues", "Sign Queues (Add-on)", "SIGN QUEUES", "Adds sign queues players can use to quick join a match.", 899, 999, "#e11d48", "#fda4af", ["Minigames"], 22),
  addon("nobodies-duels", "the-bridge", "The Bridge (Add-on)", "THE BRIDGE", "Adds the Bridge minigame to your duels server.", 539, 599, "#dc2626", "#2563eb", ["Minigames"], 23),
  addon("nobodies-duels", "bed-fight", "Bed Fight (Add-on)", "BED FIGHT", "A gamemode add-on that introduces Bed Fight to Duels.", 539, 599, "#b91c1c", "#f97316", ["Minigames"], 24),
  addon("nobodies-duels", "tnt-run", "TNT Run (Add-on)", "TNT RUN", "A gamemode add-on that introduces TNT Run to Duels.", 539, 599, "#be123c", "#fb7185", ["Minigames"], 25),
  addon("nobodies-duels", "floor-is-lava", "Floor is Lava (Add-on)", "LAVA", "A free party mode for Duels owners.", 0, null, "#334155", "#94a3b8", ["Minigames"], 26),
  addon("nobodies-shop", "autosell", "Autosell (Add-on)", "SELL", "Automatically sells configured items from players' inventories.", 499, null, "#16a34a", "#22c55e", ["Shop"], 30),
];

const EXTRAS: Seed[] = [
  { slug: "simple-model-pack", name: "Simple Model Pack V.1", type: "model", artTitle: "SIMPLE PACK", shortDescription: "A set of unique and beautiful crate models, so you don't need several crate types.", priceCents: 899, compareAtCents: 999, badge: "sale", accentFrom: "#6d28d9", accentTo: "#c026d3", tags: ["Models", "Animated"], mcVersions: ["1.20", "1.21"], sortOrder: 40 },
  { slug: "medieval-crates-pack", name: "Medieval Crates Pack", type: "model", artTitle: "MEDIEVAL", shortDescription: "Medieval themed crate models with animated lids and particles.", priceCents: 1529, compareAtCents: 1699, badge: "sale", accentFrom: "#f59e0b", accentTo: "#fcd34d", tags: ["Models"], mcVersions: ["1.20", "1.21"], sortOrder: 41 },
  { slug: "tower-lobby", name: "Tower Lobby", type: "build", artTitle: "TOWER", shortDescription: "A 150x150 lobby spawn with NPC areas, interior and more. Ready for NOBODIES Lobby.", priceCents: 719, compareAtCents: 799, badge: "sale", accentFrom: "#0ea5e9", accentTo: "#a5f3fc", tags: ["Builds"], mcVersions: ["1.20", "1.21"], sortOrder: 50 },
  { slug: "tower-lobby-halloween", name: "Tower Lobby - Halloween", type: "build", artTitle: "SPOOKY", shortDescription: "The Halloween edition of the 150x150 Tower Lobby, with spooky decorations.", priceCents: 719, compareAtCents: 799, badge: "sale", accentFrom: "#4c1d95", accentTo: "#f97316", tags: ["Builds"], mcVersions: ["1.20", "1.21"], sortOrder: 51 },
];

function docsFor(pluginSlug: string, name: string) {
  return [
    {
      slug: `${pluginSlug}-installation`, title: "Installation", sortOrder: 1,
      summary: `Install ${name} and get it running in a few minutes.`,
      content: `# Installation\n\n- Download the latest jar from your **Purchases** page.\n- Drop it into your server's \`plugins\` folder.\n- Restart the server (don't use /reload).\n\n## Activating your license\n\nPaste the key from the **Licenses** page into \`config.yml\`:\n\n\`\`\`\nlicense: "XXXX-XXXX-XXXX-XXXX"\n\`\`\`\n\nThe plugin checks the key on startup and shows the result in the console.`,
    },
    {
      slug: `${pluginSlug}-commands`, title: "Commands & permissions", sortOrder: 2,
      summary: `Every command ${name} adds, with its permission node.`,
      content: `# Commands\n\n- \`/${pluginSlug.replace("nobodies-", "")} help\` — shows all commands\n- \`/${pluginSlug.replace("nobodies-", "")} reload\` — reloads the configuration\n- \`/${pluginSlug.replace("nobodies-", "")} editor\` — opens the in-game editor\n\n## Permissions\n\nAdmin commands need \`nobodies.admin\`. Players need no permission for the default menus.`,
    },
  ];
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  const db = drizzle(pool, { schema });

  // Clean content tables (keeps users, orders and licenses)
  await db.delete(docPages);
  await db.delete(faqs);
  await db.delete(partners);

  const ids = new Map<string, string>();
  for (const seed of [...PLUGINS, ...ADDONS, ...EXTRAS]) {
    const { parent, ...p } = seed;
    const extra = seed.slug === "nobodies-shop" ? { highlights: SHOP_HIGHLIGHTS, content: SHOP_CONTENT } : {};
    const values = { ...p, ...extra, parentId: parent ? ids.get(parent) : null };
    const [row] = await db
      .insert(products)
      .values(values)
      .onConflictDoUpdate({ target: products.slug, set: values })
      .returning({ id: products.id });
    ids.set(seed.slug, row.id);
  }

  await db.insert(docPages).values([
    {
      slug: "getting-started", title: "Getting Started", productId: null, sortOrder: 0,
      summary: "New here? Start with this page.",
      content: "# Welcome\n\nEvery NOBODIES product follows the same flow:\n\n- Buy or claim it from the store\n- Download it from **Dashboard → Purchases**\n- Activate plugins with the key from **Dashboard → Licenses**\n\nStuck? Open a ticket on Discord or use the Help page.",
    },
    {
      slug: "resource-pack-merger", title: "RP Merger", productId: null, sortOrder: 1,
      summary: "Merge our resource packs with your own.",
      content: "# RP Merger\n\nModel packs ship as resource packs. To combine them with your server pack, merge the `assets` folders and keep the higher `pack_format`.",
    },
    ...PLUGINS.flatMap((p) => docsFor(p.slug, p.name).map((d) => ({ ...d, productId: ids.get(p.slug)! }))),
  ]);

  await db.insert(faqs).values([
    { sortOrder: 1, question: "What is NOBODIES about?", answer: "NOBODIES is a Minecraft store where we create innovative products that make your project thrive. We are committed to delivering quality Minecraft products where your satisfaction is our concern." },
    { sortOrder: 2, question: "How do I know you are trustworthy?", answer: "Every product has public documentation, a changelog and an active Discord where you can talk to us and other server owners before you buy." },
    { sortOrder: 3, question: "Do you have a customer support team?", answer: "Yes. Open a ticket on Discord or send us a message from the Help page and the team will get back to you." },
    { sortOrder: 4, question: "Are there any discounts or promotions available?", answer: "We run seasonal sales (like Halloween) and bundle offers. Keep an eye on the banner at the top of the site." },
    { sortOrder: 5, question: "Why aren't you on other forums like Spigot or BuiltByBit?", answer: "Selling directly lets us ship updates faster, keep prices lower and give you licenses and downloads in one dashboard." },
  ]);

  await db.insert(partners).values([
    { name: "BlockHaven", playersAvg: 120, color: "#7c3aed", sortOrder: 1 },
    { name: "Skyforge", playersAvg: 670, color: "#f97316", sortOrder: 2 },
    { name: "CraftNova", playersAvg: 176, color: "#eab308", sortOrder: 3 },
    { name: "Pixelrealm", playersAvg: 550, color: "#ef4444", sortOrder: 4 },
    { name: "Emberfall", playersAvg: 553, color: "#dc2626", sortOrder: 5 },
    { name: "Voidline", playersAvg: 265, color: "#3b82f6", sortOrder: 6 },
  ]);

  await db
    .insert(settings)
    .values({
      key: "site",
      value: {
        announcements: [
          { enabled: true, title: "HALLOWEEN SEASON IS HERE!", badge: "10% off", text: "limited time offer!", cta: "SAVE 10% NOW", href: "/products" },
          { enabled: true, title: "NEW: NOBODIES SHOP", badge: "Launch", text: "AutoSell add-on free for a limited time", cta: "SEE OFFER", href: "/products/nobodies-shop" },
        ],
        discountPercent: 10,
        seasonLabel: "Halloween Season",
        discordUrl: "https://discord.com",
        supportEmail: "support@nobodies.gg",
        navItems: [
          { label: "Products", href: "/products", visible: true },
          { label: "Addons", href: "/addons", visible: true },
          { label: "Docs", href: "/docs", visible: true },
          { label: "About Us", href: "/about", visible: true },
          { label: "Help", href: "/help", visible: true },
        ],
        footer: {
          tagline: "Premium plugins for serious Minecraft servers.",
          showDiscord: true,
          showTwitter: true,
          showInstagram: true,
        },
      },
    })
    .onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value` } });

  // Demo promotions (safe to re-run)
  await db.delete(campaigns);
  await db.insert(campaigns).values({
    name: "Shop launch",
    label: "LAUNCH OFFER",
    headline: "Buy now and get the AutoSell add-on free",
    triggerProductId: ids.get("nobodies-shop")!,
    rewardProductId: ids.get("autosell")!,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 86_400_000),
  });
  await db
    .insert(coupons)
    .values([
      { code: "WELCOME10", description: "10% off your first order", type: "percent", amount: 10, perUserLimit: 1 },
      { code: "CREATOR15", description: "Creator code", type: "percent", amount: 15, creatorName: "ExampleCreator", maxUses: 500 },
    ])
    .onConflictDoNothing();

  console.log(`Seeded ${ids.size} products, docs, FAQs and partners`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
