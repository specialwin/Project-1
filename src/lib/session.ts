import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, type SessionUser } from "./auth";

export async function getUserOrRedirect(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }
  return session.user as SessionUser;
}
