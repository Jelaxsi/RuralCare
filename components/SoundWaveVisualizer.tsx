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

export function MicSoundWave({ active }: { active: boolean }) {
  return (
    <div className="flex h-16 items-center justify-center gap-1" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-brand transition-all ${
            active ? "animate-sound-bar" : "h-2 opacity-20"
          }`}
          style={{
            animationDelay: `${i * 0.08}s`,
            height: active ? undefined : "8px",
          }}
        />
      ))}
    </div>
  );
}
