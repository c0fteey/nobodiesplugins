"use client";

import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import type { Campaign, Product } from "@/db/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/components/store/cart-provider";
import { ConfirmDialogHost } from "@/components/ui/confirm-dialog";
import { site } from "@/lang/site";

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
          <ConfirmDialogHost confirmLabel={site.common.confirm} cancelLabel={site.common.cancel} />
        </CartProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}
