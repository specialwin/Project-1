import { prisma } from "./prisma";
import { daysBetween, startOfLocalDay } from "./utils";

// "Streak" = number of consecutive calendar days, ending today or yesterday,
// on which a lineup was finished. Today not yet finished does not break the
// streak; missing a full prior day does.
export async function computeStreak(organizationId: string): Promise<number> {
  const sessions = await prisma.lineupSession.findMany({
    where: { organizationId, finishedAt: { not: null } },
    orderBy: { date: "desc" },
    select: { date: true },
    take: 400,
  });
  if (sessions.length === 0) return 0;

  const today = startOfLocalDay(new Date());
  let cursor = today;
  let streak = 0;

  // Allow "today not yet done": if the most recent session is yesterday,
  // we start counting from yesterday rather than today.
  const mostRecent = startOfLocalDay(sessions[0].date);
  if (daysBetween(mostRecent, today) >= 1) {
    cursor = new Date(today);
    cursor.setDate(cursor.getDate() - 1);
  }

  const dates = new Set(
    sessions.map((s) => startOfLocalDay(s.date).toISOString()),
  );
  while (dates.has(cursor.toISOString())) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
