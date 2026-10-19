import { requireAdmin } from "@/lib/auth-guard";

export async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
