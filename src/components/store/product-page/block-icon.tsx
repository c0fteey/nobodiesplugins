import {
  BarChart3Icon,
  BoxIcon,
  ClockIcon,
  CoinsIcon,
  GiftIcon,
  GlobeIcon,
  HeartIcon,
  LayersIcon,
  LockIcon,
  PuzzleIcon,
  RocketIcon,
  Settings2Icon,
  ShieldIcon,
  SparklesIcon,
  StoreIcon,
  UsersIcon,
  WandSparklesIcon,
  ZapIcon,
} from "lucide-react";
import type { BLOCK_ICONS } from "@/lib/content-blocks";

const MAP: Record<(typeof BLOCK_ICONS)[number], React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  sparkles: SparklesIcon,
  box: BoxIcon,
  zap: ZapIcon,
  shield: ShieldIcon,
  coins: CoinsIcon,
  store: StoreIcon,
  settings: Settings2Icon,
  layers: LayersIcon,
  gift: GiftIcon,
  rocket: RocketIcon,
  puzzle: PuzzleIcon,
  wand: WandSparklesIcon,
  chart: BarChart3Icon,
  globe: GlobeIcon,
  lock: LockIcon,
  heart: HeartIcon,
  users: UsersIcon,
  clock: ClockIcon,
};

export function BlockIcon({ name, className }: { name: (typeof BLOCK_ICONS)[number]; className?: string }) {
  const Icon = MAP[name] ?? SparklesIcon;
  return <Icon className={className} strokeWidth={1.7} />;
}
