"use client";
import { useState, useTransition } from "react";
import { setConsensus } from "@/app/(app)/actions";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { t, type Locale } from "@/lib/i18n";

export function ConsensusField({
  locale,
  initialValue,
  disabled,
}: {
  locale: Locale;
  initialValue: string | null;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function commit() {
    const fd = new FormData();
    fd.set("consensus", value);
    start(async () => {
      await setConsensus(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="consensus">{t(locale, "today.consensusLabel")}</Label>
      <Textarea
        id="consensus"
        rows={3}
        value={value}
        disabled={disabled}
        placeholder={t(locale, "today.consensusPlaceholder")}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
      />
      <div className="text-[0.7rem] uppercase tracking-wider2 text-muted h-4">
        {pending ? "…" : saved ? "saved" : ""}
      </div>
    </div>
  );
}
