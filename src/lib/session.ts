import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, type SessionUser } from "./auth";
import { prisma } from "./prisma";

export async function getUserOrRedirect(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }
  return session.user as SessionUser;
}

export async function getOrganizationForUser(user: SessionUser) {
  if (!user.organizationId) {
    // Fall back to first org (single-tenant local dev).
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("No organization exists.");
    return org;
  }
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });
  if (!org) throw new Error("Organization not found.");
  return org;
}
