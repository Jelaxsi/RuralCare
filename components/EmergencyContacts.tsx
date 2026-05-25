type Props = {
  title: string;
};

const EMERGENCY_LINES = [
  { tel: "1990", label: "Call 1990 — Suwa Seriya", region: "Sri Lanka" },
  { tel: "108", label: "Call 108 — Emergency Ambulance", region: "India" },
  { tel: "911", label: "Call 911 / 999", region: "General" },
];

export function EmergencyContacts({ title }: Props) {
  return (
    <div className="mx-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="animate-pulse text-2xl" aria-hidden>
          🚨
        </span>
        <p className="font-semibold text-red-200">{title}</p>
      </div>
      <div className="flex flex-col gap-2">
        {EMERGENCY_LINES.map((line) => (
          <a
            key={line.tel}
            href={`tel:${line.tel}`}
            className="btn-touch flex flex-col rounded-xl bg-red-600/80 px-4 py-3 text-left font-semibold text-white transition hover:bg-red-600 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>📞 {line.label}</span>
            <span className="text-xs font-normal text-red-100/80">{line.region}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
