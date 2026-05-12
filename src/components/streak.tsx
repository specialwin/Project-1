import { t, type Locale } from "@/lib/i18n";

export function Streak({ count, locale }: { count: number; locale: Locale }) {
  if (count <= 0) {
    return (
      <div className="text-muted text-sm uppercase tracking-wider2">
        {t(locale, "streak.none")}
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-3">
      <div className="font-serif text-6xl md:text-7xl leading-none numeric">
        {count}
      </div>
      <div className="text-[0.72rem] uppercase tracking-wider3 text-muted">
        {t(locale, "streak.label")}
      </div>
    </div>
  );
}
