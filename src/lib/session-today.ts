import { prisma } from "./prisma";
import { pickStandardForToday } from "./rotation";
import { startOfLocalDay } from "./utils";

// Ensure a LineupSession row exists for "today" for the organization.
// Pre-populates standardId from rotation and creates attendance rows for all
// active team members.
export async function getOrCreateTodaySession(organizationId: string) {
  const date = startOfLocalDay(new Date());

  const existing = await prisma.lineupSession.findUnique({
    where: { organizationId_date: { organizationId, date } },
    include: {
      standard: true,
      attendance: { include: { teamMember: true } },
      stories: { orderBy: { createdAt: "asc" } },
    },
  });
  if (existing) return existing;

  const standard = await pickStandardForToday(organizationId);
  const teamMembers = await prisma.teamMember.findMany({
    where: { organizationId, active: true },
    orderBy: { name: "asc" },
  });

  const created = await prisma.lineupSession.create({
    data: {
      organizationId,
      date,
      standardId: standard?.id ?? null,
      attendance: {
        create: teamMembers.map((m) => ({
          teamMemberId: m.id,
          present: false,
        })),
      },
    },
    include: {
      standard: true,
      attendance: { include: { teamMember: true } },
      stories: { orderBy: { createdAt: "asc" } },
    },
  });
  return created;
}
