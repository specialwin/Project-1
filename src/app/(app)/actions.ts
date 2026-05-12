"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserOrRedirect, getOrganizationForUser } from "@/lib/session";
import { getOrCreateTodaySession } from "@/lib/session-today";
import { composeSummary, deliverSummary } from "@/lib/summary";
import { asLocale } from "@/lib/i18n";

async function getContext() {
  const user = await getUserOrRedirect();
  const org = await getOrganizationForUser(user);
  return { user, org };
}

async function loadTodayOwnedByUser() {
  const { org } = await getContext();
  const session = await getOrCreateTodaySession(org.id);
  return { org, session };
}

export async function toggleAttendance(formData: FormData) {
  const teamMemberId = String(formData.get("teamMemberId") ?? "");
  const present = formData.get("present") === "true";
  if (!teamMemberId) return;

  const { session } = await loadTodayOwnedByUser();
  await prisma.attendance.update({
    where: {
      sessionId_teamMemberId: { sessionId: session.id, teamMemberId },
    },
    data: { present },
  });
  revalidatePath("/");
}

export async function setConsensus(formData: FormData) {
  const value = String(formData.get("consensus") ?? "").trim();
  const { session } = await loadTodayOwnedByUser();
  await prisma.lineupSession.update({
    where: { id: session.id },
    data: { consensusAnswer: value || null },
  });
  revalidatePath("/");
}

const StorySchema = z.object({
  authorName: z.string().max(80).optional(),
  badExperience: z.string().min(1).max(2000),
  preventionAnswer: z.string().max(2000).optional(),
});

export async function addStory(formData: FormData) {
  const parsed = StorySchema.safeParse({
    authorName: (formData.get("authorName") as string) || undefined,
    badExperience: (formData.get("badExperience") as string) || "",
    preventionAnswer: (formData.get("preventionAnswer") as string) || undefined,
  });
  if (!parsed.success) return;

  const { session } = await loadTodayOwnedByUser();
  await prisma.story.create({
    data: {
      sessionId: session.id,
      authorName: parsed.data.authorName || null,
      badExperience: parsed.data.badExperience,
      preventionAnswer: parsed.data.preventionAnswer || null,
    },
  });
  revalidatePath("/");
}

export async function skipStandard(formData: FormData) {
  const skip = formData.get("skip") === "true";
  const { session } = await loadTodayOwnedByUser();
  await prisma.lineupSession.update({
    where: { id: session.id },
    data: { standardSkipped: skip },
  });
  revalidatePath("/");
}

export async function finishLineup() {
  const { org, session } = await loadTodayOwnedByUser();

  // Re-load with everything we need to compose the summary.
  const full = await prisma.lineupSession.findUnique({
    where: { id: session.id },
    include: {
      standard: true,
      attendance: true,
      stories: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!full) return;

  const presentCount = full.attendance.filter((a) => a.present).length;
  const totalCount = full.attendance.length;
  const firstStory = full.stories[0];

  const locale = asLocale(org.language);
  const standardTitle =
    full.standard == null || full.standardSkipped
      ? null
      : locale === "th"
        ? full.standard.titleTh
        : full.standard.titleEn;

  const { subject, body, oneLine } = composeSummary({
    locale,
    date: full.date,
    standardTitle,
    standardSkipped: full.standardSkipped || full.standardId == null,
    presentCount,
    totalCount,
    story: firstStory?.badExperience ?? null,
    consensus: full.consensusAnswer ?? null,
  });

  await prisma.lineupSession.update({
    where: { id: full.id },
    data: { finishedAt: new Date(), summary: oneLine },
  });

  // Best-effort delivery; do not fail the action if delivery is unconfigured.
  await deliverSummary({
    organizationId: org.id,
    subject,
    body,
  }).catch(() => undefined);

  revalidatePath("/");
  revalidatePath("/history");
}
