import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Silkscreen, Unbounded } from "next/font/google";
import { Providers } from "@/components/providers";
import { getCampaigns, getProducts } from "@/lib/data/store";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "NOBODIES — Premium Minecraft plugins", template: "%s · NOBODIES" },
  description:
    "Premium plugins, add-ons, models and builds hand-crafted for serious Minecraft servers.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cached catalog powers the cart drawer everywhere (store, dashboard, admin)
  const [catalog, campaigns] = await Promise.all([getProducts(), getCampaigns()]);

  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${unbounded.variable} ${silkscreen.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers catalog={catalog} campaigns={campaigns}>{children}</Providers>
      </body>
    </html>
  );
}
