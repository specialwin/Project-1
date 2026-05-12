import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString();
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name ?? user.email,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId ?? null,
          isCoach: user.isCoach,
        } as unknown as { id: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id: string;
          role: string;
          organizationId: string | null;
          isCoach: boolean;
        };
        token.id = u.id;
        token.role = u.role;
        token.organizationId = u.organizationId;
        token.isCoach = u.isCoach;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).organizationId =
          token.organizationId;
        (session.user as Record<string, unknown>).isCoach = token.isCoach;
      }
      return session;
    },
  },
};

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "owner" | "team" | "coach";
  organizationId: string | null;
  isCoach: boolean;
};
