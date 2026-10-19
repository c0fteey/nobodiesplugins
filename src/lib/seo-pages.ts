// Pages whose link preview / search snippet can be edited in Admin → SEO.
// Shared by the admin form (client) and the metadata helpers (server).
export const SEO_PAGES = {
  home: "/",
  products: "/products",
  addons: "/addons",
  docs: "/docs",
  about: "/about",
  help: "/help",
  login: "/login",
  register: "/register",
} as const;

export type SeoPageKey = keyof typeof SEO_PAGES;

export type PageSeo = { title: string; description: string; image: string };

export type SeoSettings = {
  siteName: string;
  /** Public address of the site, used for absolute links in previews and the sitemap */
  siteUrl: string;
  /** "%s" is replaced by the page title */
  titleTemplate: string;
  defaultDescription: string;
  /** Preview image used when a page has none */
  defaultImage: string;
  twitterHandle: string;
  /** Off = ask search engines not to index the site */
  indexable: boolean;
  pages: Record<SeoPageKey, PageSeo>;
};
