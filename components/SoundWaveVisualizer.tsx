"use client";

type Props = {
  active?: boolean;
  bars?: number;
  color?: string;
  size?: "sm" | "md" | "lg";
};

export function SoundWaveVisualizer({
  active = true,
  bars = 4,
  color = "bg-brand-violet",
  size = "md",
}: Props) {
  const heights = size === "sm" ? "h-3" : size === "lg" ? "h-8" : "h-5";
  const widths = size === "sm" ? "w-0.5" : "w-1";

  return (
    <div
      className="flex items-end gap-1"
      role="img"
      aria-label={active ? "Audio playing" : "Audio idle"}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`${widths} ${heights} rounded-full ${color} ${
            active ? "animate-sound-bar" : "opacity-30"
          }`}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

const BAR_HEIGHTS = ["45%", "80%", "55%", "95%", "65%"];

export function MicSoundWave({ active }: { active: boolean }) {
  return (
    <div className="mt-6 flex h-10 items-end justify-center gap-1.5" aria-hidden>
      {BAR_HEIGHTS.map((height, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full bg-gradient-to-t from-primary to-accent-cyan ${
            active ? "animate-sound-bar" : "opacity-30"
          }`}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: active ? height : "20%",
          }}
        />
      ))}
    </div>
  );
}
