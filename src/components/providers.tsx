"use client";

import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import type { Campaign, Product } from "@/db/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/components/store/cart-provider";

export function Providers({
  catalog,
  campaigns,
  children,
}: {
  catalog: Product[];
  campaigns: Campaign[];
  children: React.ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <CartProvider catalog={catalog} campaigns={campaigns}>
          {children}
          <Toaster theme="dark" position="bottom-center" richColors />
        </CartProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}
