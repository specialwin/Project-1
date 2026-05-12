"use client";
import { useTransition } from "react";
import { skipStandard } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/lib/i18n";

export function SkipToggle({
  locale,
  skipped,
}: {
  locale: Locale;
  skipped: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="quiet"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("skip", String(!skipped));
        start(() => {
          skipStandard(fd);
        });
      }}
    >
      {skipped ? t(locale, "today.unskipStandard") : t(locale, "today.skipStandard")}
    </Button>
  );
}
