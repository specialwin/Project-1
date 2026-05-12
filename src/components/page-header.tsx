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
    <header className="app-header">
      <div className="container flex items-center justify-between py-4">
        <div className="min-w-0">
          <div className="font-serif text-2xl tracking-tight leading-none">
            {t(locale, "app.name")}
          </div>
          <div className="text-[0.7rem] uppercase tracking-wider3 text-muted truncate">
            {orgName}
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="uppercase tracking-wider2 text-muted hover:text-ink px-1 py-2"
          >
            {t(locale, "nav.today")}
          </Link>
          <Link
            href="/history"
            className="uppercase tracking-wider2 text-muted hover:text-ink px-1 py-2"
          >
            {t(locale, "nav.history")}
          </Link>
          <SignOutButton locale={locale} />
        </nav>
      </div>
    </header>
  );
}
