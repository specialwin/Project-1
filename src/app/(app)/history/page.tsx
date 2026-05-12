import { getUserOrRedirect, getOrganizationForUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { asLocale, t } from "@/lib/i18n";
import { Card, CardContent, SectionLabel } from "@/components/ui/card";
import { getStandardsCoverage, STALE_THRESHOLD_DAYS } from "@/lib/coverage";
import { daysBetween } from "@/lib/utils";

export const dynamic = "force-dynamic";

function relative(locale: ReturnType<typeof asLocale>, date: Date | null) {
  if (!date) return t(locale, "history.never");
  const days = daysBetween(date, new Date());
  if (days <= 0) return t(locale, "history.today");
  if (days === 1) return t(locale, "history.yesterday");
  return t(locale, "history.daysAgo", { days });
}

export default async function HistoryPage() {
  const user = await getUserOrRedirect();
  const org = await getOrganizationForUser(user);
  const locale = asLocale(org.language);

  const sessions = await prisma.lineupSession.findMany({
    where: { organizationId: org.id, finishedAt: { not: null } },
    orderBy: { date: "desc" },
    take: 120,
    include: {
      standard: true,
      attendance: true,
      stories: { take: 1, orderBy: { createdAt: "asc" } },
    },
  });

  const coverage = await getStandardsCoverage(org.id);

  return (
    <div className="space-y-12 max-w-3xl mx-auto">
      <section>
        <h1 className="font-serif text-3xl">{t(locale, "history.heading")}</h1>
      </section>

      <div className="hairline" />

      <section>
        {sessions.length === 0 ? (
          <p className="text-muted italic">{t(locale, "history.empty")}</p>
        ) : (
          <ul className="space-y-4">
            {sessions.map((s) => {
              const present = s.attendance.filter((a) => a.present).length;
              const total = s.attendance.length;
              const title =
                s.standard == null || s.standardSkipped
                  ? null
                  : locale === "th"
                    ? s.standard.titleTh
                    : s.standard.titleEn;
              const dateStr = s.date.toLocaleDateString(
                locale === "th" ? "th-TH" : "en-US",
                { weekday: "short", month: "long", day: "numeric" },
              );
              const firstStory = s.stories[0];
              return (
                <li key={s.id}>
                  <Card>
                    <CardContent className="space-y-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="font-serif text-lg">{dateStr}</div>
                        <div className="text-[0.72rem] uppercase tracking-wider3 text-muted">
                          {present}/{total} {t(locale, "history.attendance")}
                        </div>
                      </div>
                      <div>
                        <span className="text-[0.72rem] uppercase tracking-wider3 text-muted mr-2">
                          {t(locale, "history.standard")}
                        </span>
                        <span className="font-serif text-lg">
                          {title ?? `— ${t(locale, "history.skipped")}`}
                        </span>
                      </div>
                      {firstStory && (
                        <p className="text-sm text-ink/80 border-l-2 border-ink/20 pl-3">
                          {firstStory.badExperience}
                        </p>
                      )}
                      {s.consensusAnswer && (
                        <p className="text-sm italic text-ink/70">
                          {s.consensusAnswer}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="hairline" />

      <section>
        <SectionLabel>{t(locale, "history.coverageHeading")}</SectionLabel>
        <p className="text-sm text-muted mt-1 max-w-prose">
          {t(locale, "history.coverageSubheading")}
        </p>
        <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
          {coverage.map((row) => (
            <li
              key={row.id}
              className={
                row.stale
                  ? "flex items-baseline justify-between gap-4 py-3 bg-flag/10 px-3"
                  : "flex items-baseline justify-between gap-4 py-3 px-3"
              }
            >
              <div className="flex items-baseline gap-4 min-w-0">
                <span className="text-[0.72rem] uppercase tracking-wider3 text-muted numeric">
                  {String(row.number).padStart(2, "0")}
                </span>
                <span className="font-serif truncate">
                  {locale === "th" ? row.titleTh : row.titleEn}
                </span>
              </div>
              <div className="text-[0.72rem] uppercase tracking-wider2 text-muted whitespace-nowrap">
                {row.stale && (
                  <span className="mr-3 text-flag">
                    {t(locale, "history.stale")}
                  </span>
                )}
                {t(locale, "history.lastDiscussed")}:{" "}
                {relative(locale, row.lastDiscussed)}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[0.7rem] uppercase tracking-wider2 text-muted mt-3">
          Threshold: {STALE_THRESHOLD_DAYS} days
        </p>
      </section>
    </div>
  );
}
