import type { TranslationKeys } from "@/lib/i18n/translations";

type Props = {
  t: Pick<TranslationKeys, "callEmergencyNow" | "call1990SuwaSeriya" | "call108Ambulance">;
};

export function EmergencyContacts({ t }: Props) {
  return (
    <div className="mx-4 rounded-2xl border-2 border-red-300 bg-red-50 p-5 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:shadow-lg dark:shadow-red-500/20 pulse-red">
      <p className="mb-4 text-center text-xl font-black uppercase tracking-wide text-red-800 dark:text-red-300">
        🚨 {t.callEmergencyNow}
      </p>
      <div className="flex flex-col gap-3">
        <a
          href="tel:1990"
          className="btn-touch flex flex-col rounded-xl bg-red-600 px-5 py-4 text-left font-bold text-white transition hover:bg-red-500 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>📞 {t.call1990SuwaSeriya}</span>
          <span className="text-sm font-normal text-red-100/90">Sri Lanka</span>
        </a>
        <a
          href="tel:108"
          className="btn-touch flex flex-col rounded-xl bg-red-600 px-5 py-4 text-left font-bold text-white transition hover:bg-red-500 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>📞 {t.call108Ambulance}</span>
          <span className="text-sm font-normal text-red-100/90">India</span>
        </a>
      </div>
    </div>
  );
}
