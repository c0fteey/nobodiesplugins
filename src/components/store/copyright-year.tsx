import { cacheLife } from "next/cache";

// Cached for a day so the static shell can include it without a request-time clock read
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
