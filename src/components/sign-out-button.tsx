"use client";
import { signOut } from "next-auth/react";
import { t, type Locale } from "@/lib/i18n";

export function SignOutButton({ locale }: { locale: Locale }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="uppercase tracking-wider2 text-muted hover:text-ink text-sm"
    >
      {t(locale, "nav.signOut")}
    </button>
  );
}
