"use client";
import { useTransition } from "react";
import { finishLineup } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/haptics";
import { t, type Locale } from "@/lib/i18n";

export function FinishButton({
  locale,
  finished,
}: {
  locale: Locale;
  finished: boolean;
}) {
  const [pending, start] = useTransition();
  if (finished) {
    return (
      <div className="text-sm uppercase tracking-wider2 text-muted">
        {t(locale, "today.alreadyFinished")}
      </div>
    );
  }
  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() => {
        haptic("heavy");
        start(() => {
          finishLineup();
        });
      }}
    >
      {t(locale, "today.finish")}
    </Button>
  );
}
