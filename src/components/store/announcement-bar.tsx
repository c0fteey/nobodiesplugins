import { getSettings } from "@/lib/data/store";
import { AnnouncementCarousel } from "./announcement-carousel";

export async function AnnouncementBar() {
  const { announcements } = await getSettings();
  const enabled = announcements.filter((a) => a.enabled);
  if (enabled.length === 0) return null;

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(90deg,#2a1690,#3a20b8_45%,#2a1690)]">
      {/* faint streaks like the reference banner */}
      <div aria-hidden className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(115deg,transparent_0_40px,rgba(255,255,255,.06)_40px_42px)]" />
      <AnnouncementCarousel announcements={enabled} />
    </div>
  );
}
