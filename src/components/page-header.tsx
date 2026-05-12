import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { SignOutButton } from "./sign-out-button";

export function PageHeader({
  locale,
  orgName,
}: {
  locale: Locale;
  orgName: string;
}) {
  return (
    <header className="border-b border-ink/15 bg-paper">
      <div className="container flex items-center justify-between py-5">
        <div>
          <div className="font-serif text-2xl tracking-tight">
            {t(locale, "app.name")}
          </div>
          <div className="text-[0.72rem] uppercase tracking-wider3 text-muted">
            {orgName}
          </div>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/"
            className="uppercase tracking-wider2 text-muted hover:text-ink"
          >
            {t(locale, "nav.today")}
          </Link>
          <Link
            href="/history"
            className="uppercase tracking-wider2 text-muted hover:text-ink"
          >
            {t(locale, "nav.history")}
          </Link>
          <SignOutButton locale={locale} />
        </nav>
      </div>
    </header>
  );
}
