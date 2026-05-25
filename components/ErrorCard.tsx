type Props = {
  message: string;
  tryAgainLabel: string;
  onRetry?: () => void;
};

export function ErrorCard({ message, tryAgainLabel, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="mx-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center"
    >
      <p className="text-sm leading-relaxed text-red-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-touch mt-4 rounded-xl bg-white px-6 font-semibold text-gray-900 transition hover:bg-white/90"
        >
          {tryAgainLabel}
        </button>
      )}
    </div>
  );
}
