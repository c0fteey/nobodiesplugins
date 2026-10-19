import Link from "next/link";
import { ShieldIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-guard";

/** Shortcut into the admin panel, only rendered for admins. */
export async function AdminLink() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return null;

  return (
    <div className="px-4 pt-6 sm:px-14">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand-soft transition hover:bg-brand/20"
      >
        <ShieldIcon className="size-4" /> Open admin panel
      </Link>
    </div>
  );
}
