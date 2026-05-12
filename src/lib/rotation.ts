import { prisma } from "./prisma";

// -----------------------------------------------------------------------------
// Rotation
//
// The 25 standards rotate on a 25-day cycle. The "pointer" moves forward each
// day a session is finished without being skipped. Skipped days do not advance
// the pointer, so the team always returns to the same standard the next day.
//
// We derive today's standard number as:
//   pointer = count of finished, non-skipped sessions so far  (1-based next)
//   today_number = ((pointer) % 25) + 1
// -----------------------------------------------------------------------------

export async function pickStandardForToday(organizationId: string) {
  const finishedAdvancing = await prisma.lineupSession.count({
    where: {
      organizationId,
      finishedAt: { not: null },
      standardSkipped: false,
      standardId: { not: null },
    },
  });
  const todayNumber = (finishedAdvancing % 25) + 1;
  return prisma.standard.findUnique({
    where: {
      organizationId_number: {
        organizationId,
        number: todayNumber,
      },
    },
  });
}
