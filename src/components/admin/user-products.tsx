"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GiftIcon, Loader2Icon, PackageIcon, Undo2Icon } from "lucide-react";
import { toast } from "sonner";
import { grantProductAction, revokeProductAction, type AdminResult } from "@/actions/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { admin } from "@/lang/admin";
import { site } from "@/lang/site";
import { selectCls } from "./form-bits";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { confirmDialog } from "@/components/ui/confirm-dialog";

const t = admin.users;

type ProductOption = { id: string; name: string; type: keyof typeof site.productTypes };

/** "Products" button on a user row: grant a product for free or take one back. */
export function UserProducts({ userId, who, owned, products }: { userId: string; who: string; owned: string[]; products: ProductOption[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [choice, setChoice] = useState("");
  const ownedSet = new Set(owned);
  const ownedProducts = products.filter((p) => ownedSet.has(p.id));
  const grantable = products.filter((p) => !ownedSet.has(p.id));

  const run = (fn: () => Promise<AdminResult>, message: string) =>
    start(async () => {
      const result = await fn();
      if (!result.ok) return void toast.error(result.error);
      toast.success(message);
      setChoice("");
      router.refresh();
    });

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 px-2.5 text-xs font-semibold text-white/80 transition hover:border-brand hover:text-white"
          />
        }
      >
        <PackageIcon className="size-3.5" /> {t.products} <span className="text-white/45">{owned.length}</span>
      </DialogTrigger>
      <DialogContent className="max-w-lg border border-white/10 bg-[#1a1a1c]">
        <DialogHeader>
          <DialogTitle>{t.productsTitle(who)}</DialogTitle>
          <DialogDescription>{t.productsDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <ChoiceSelect
            value={choice}
            onChange={setChoice}
            options={grantable.map((p) => ({ value: p.id, label: p.name, hint: site.productTypes[p.type] }))}
            placeholder={t.grantChoose}
            aria-label={t.grant}
            className={selectCls}
          />
          <button
            type="button"
            disabled={!choice || pending}
            onClick={() => run(() => grantProductAction({ userId, productId: choice }), t.granted)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? <Loader2Icon className="size-4 animate-spin" /> : <GiftIcon className="size-4" />} {t.grant}
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.14em] text-white/50 uppercase">{t.owned}</p>
          {ownedProducts.length === 0 ? (
            <Alert>
              <AlertDescription>{t.noneOwned}</AlertDescription>
            </Alert>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto">
              {ownedProducts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-md bg-white/[0.03] px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                  <span className="text-[11px] text-white/40">{site.productTypes[p.type]}</span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={async () =>
                      (await confirmDialog({ title: t.revokeConfirm(p.name), confirmLabel: t.revoke })) &&
                      run(() => revokeProductAction({ userId, productId: p.id }), t.revoked)
                    }
                    className="inline-flex items-center gap-1 text-xs text-white/50 transition hover:text-destructive"
                  >
                    <Undo2Icon className="size-3.5" /> {t.revoke}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
