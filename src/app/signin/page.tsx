"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";

export default function SignInPage() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const locale = "en"; // sign-in is pre-org

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setPending(false);
    if (res?.error) {
      setError(t(locale, "signIn.error"));
      return;
    }
    router.push(res?.url || "/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl">{t(locale, "app.name")}</h1>
          <div className="text-[0.72rem] uppercase tracking-wider3 text-muted mt-2">
            {t(locale, "app.tagline")}
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 bg-paper border border-ink/15 p-8">
          <h2 className="font-serif text-2xl text-center mb-2">
            {t(locale, "signIn.heading")}
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t(locale, "signIn.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t(locale, "signIn.password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-accent border-l-2 border-accent pl-3">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {t(locale, "signIn.submit")}
          </Button>
          <p className="text-center text-xs text-muted pt-2">
            {t(locale, "signIn.hint")}
          </p>
        </form>
      </div>
    </main>
  );
}
