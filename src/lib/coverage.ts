import { prisma } from "./prisma";
import { daysBetween } from "./utils";

export type CoverageRow = {
  id: string;
  number: number;
  titleEn: string;
  titleTh: string;
  lastDiscussed: Date | null;
  daysSince: number | null;
  stale: boolean;
};

const STALE_DAYS = 30;

export async function getStandardsCoverage(
  organizationId: string,
): Promise<CoverageRow[]> {
  const standards = await prisma.standard.findMany({
    where: { organizationId },
    orderBy: { number: "asc" },
  });

  // Latest non-skipped finished session per standard.
  const latestPerStandard = await prisma.lineupSession.groupBy({
    by: ["standardId"],
    where: {
      organizationId,
      finishedAt: { not: null },
      standardSkipped: false,
      standardId: { not: null },
    },
    _max: { date: true },
  });

  const lastByStandardId = new Map<string, Date>();
  for (const row of latestPerStandard) {
    if (row.standardId && row._max.date) {
      lastByStandardId.set(row.standardId, row._max.date);
    }
  }

  const today = new Date();
  return standards.map((s) => {
    const last = lastByStandardId.get(s.id) ?? null;
    const days = last ? daysBetween(last, today) : null;
    return {
      id: s.id,
      number: s.number,
      titleEn: s.titleEn,
      titleTh: s.titleTh,
      lastDiscussed: last,
      daysSince: days,
      stale: last == null || (days ?? 0) >= STALE_DAYS,
    };
  });
}

export const STALE_THRESHOLD_DAYS = STALE_DAYS;
