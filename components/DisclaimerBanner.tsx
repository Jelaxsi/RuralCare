type Props = {
  text: string;
  size?: "sm" | "md";
  className?: string;
};

export function DisclaimerBanner({ text, size = "md", className = "" }: Props) {
  return (
    <div
      role="note"
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-100/90 ${
        size === "sm" ? "px-3 py-2 text-xs leading-relaxed" : "px-4 py-3 text-sm leading-relaxed"
      } ${className}`}
    >
      <span aria-hidden>⚕️ </span>
      {text}
    </div>
  );
}
