import { getUserOrRedirect, getOrganizationForUser } from "@/lib/session";
import { getOrCreateTodaySession } from "@/lib/session-today";
import { computeStreak } from "@/lib/streak";
import { asLocale, t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, SectionLabel } from "@/components/ui/card";
import { Streak } from "@/components/streak";
import { AttendanceRow } from "@/components/today/attendance-row";
import { StoryForm } from "@/components/today/story-form";
import { ConsensusField } from "@/components/today/consensus-field";
import { SkipToggle } from "@/components/today/skip-toggle";
import { FinishButton } from "@/components/today/finish-button";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await getUserOrRedirect();
  const org = await getOrganizationForUser(user);
  const locale = asLocale(org.language);

  const session = await getOrCreateTodaySession(org.id);
  const streak = await computeStreak(org.id);

  const finished = !!session.finishedAt;
  const standard = session.standard;
  const standardTitle =
    !standard
      ? null
      : locale === "th"
        ? standard.titleTh
        : standard.titleEn;
  const standardBody =
    !standard
      ? null
      : locale === "th"
        ? standard.bodyTh
        : standard.bodyEn;

  const dateLabel = session.date.toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <section className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <SectionLabel>{dateLabel}</SectionLabel>
          <h1 className="font-serif text-3xl mt-1">
            {t(locale, "today.heading")}
          </h1>
        </div>
        <Streak count={streak} locale={locale} />
      </section>

      <div className="hairline" />

      {/* Today's standard */}
      <section>
        <div className="flex items-center justify-between">
          <SectionLabel>{t(locale, "today.standardLabel")}</SectionLabel>
          {standard && (
            <SkipToggle locale={locale} skipped={session.standardSkipped} />
          )}
        </div>

        {!standard && (
          <p className="mt-3 text-muted italic">
            {t(locale, "today.standardEmpty")}
          </p>
        )}

        {standard && (
          <div
            className={
              session.standardSkipped
                ? "opacity-40 mt-3"
                : "mt-3"
            }
          >
            <div className="text-[0.72rem] uppercase tracking-wider3 text-muted">
              No. {String(standard.number).padStart(2, "0")} of 25
            </div>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight mt-2">
              {standardTitle}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/90">
              {standardBody}
            </p>
            {session.standardSkipped && (
              <p className="mt-4 text-sm italic text-muted">
                {t(locale, "today.standardSkipped")}
              </p>
            )}
          </div>
        )}
      </section>

      <div className="hairline" />

      {/* Munger inversion */}
      <section>
        <SectionLabel>{t(locale, "today.inversionTitle")}</SectionLabel>
        <p className="mt-2 font-serif text-xl leading-relaxed">
          {t(locale, "today.inversionPrompt")}
        </p>

        <div className="mt-6 space-y-4">
          {session.stories.length === 0 ? null : (
            <div>
              <SectionLabel>{t(locale, "today.stories")}</SectionLabel>
              <ul className="mt-2 space-y-3">
                {session.stories.map((s) => (
                  <li
                    key={s.id}
                    className="border-l-2 border-ink/30 pl-4 py-1"
                  >
                    {s.authorName && (
                      <div className="text-[0.7rem] uppercase tracking-wider2 text-muted">
                        {s.authorName}
                      </div>
                    )}
                    <p className="leading-relaxed">{s.badExperience}</p>
                    {s.preventionAnswer && (
                      <p className="mt-1 text-sm text-ink/80 italic">
                        {s.preventionAnswer}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!finished && <StoryForm locale={locale} />}

          <ConsensusField
            locale={locale}
            initialValue={session.consensusAnswer}
            disabled={finished}
          />
        </div>
      </section>

      <div className="hairline" />

      {/* Attendance */}
      <section>
        <SectionLabel>{t(locale, "today.attendance")}</SectionLabel>
        {session.attendance.length === 0 ? (
          <p className="mt-3 text-muted italic">{t(locale, "today.noTeam")}</p>
        ) : (
          <Card className="mt-3">
            <CardContent className="p-0">
              {session.attendance.map((a) => (
                <AttendanceRow
                  key={a.id}
                  row={{
                    attendanceId: a.id,
                    teamMemberId: a.teamMemberId,
                    name: a.teamMember.name,
                    role: a.teamMember.role ?? null,
                    present: a.present,
                  }}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <div className="hairline" />

      <section className="flex items-center justify-end gap-4">
        <FinishButton locale={locale} finished={finished} />
      </section>
    </div>
  );
}
