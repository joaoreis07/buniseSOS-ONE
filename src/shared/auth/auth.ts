import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/shared/db/prisma";
import { loginSchema } from "@/modules/auth/schemas/auth.schemas";
import {
  getPrimaryMembership,
  getUserSessionVersion,
  validateMembership,
  verifyPassword,
} from "@/modules/auth/services/auth.service";
import { writeAuditLog } from "@/shared/audit/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findFirst({
          where: { email, deletedAt: null },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            emailVerified: true,
            sessionVersion: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        const membership = await getPrimaryMembership(user.id);
        if (!membership) {
          return null;
        }

        await writeAuditLog({
          companyId: membership.companyId,
          userId: user.id,
          module: "auth",
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          companyId: membership.companyId,
          role: membership.role,
          emailVerified: user.emailVerified,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.companyId = user.companyId;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        token.sessionVersion = user.sessionVersion;
        token.invalidated = false;
        return token;
      }

      if (!token.sub || typeof token.sessionVersion !== "number") {
        token.invalidated = true;
        return token;
      }

      const currentVersion = await getUserSessionVersion(token.sub);
      if (currentVersion === null || currentVersion !== token.sessionVersion) {
        token.invalidated = true;
        return token;
      }

      if (typeof token.companyId === "string") {
        const membership = await validateMembership({
          userId: token.sub,
          companyId: token.companyId,
        });
        if (!membership) {
          token.invalidated = true;
          return token;
        }
        token.companyId = membership.companyId;
        token.role = membership.role;
      }

      token.invalidated = false;
      return token;
    },
    async session({ session, token }) {
      if (token.invalidated || !token.sub || !token.companyId || !token.role) {
        return { ...session, user: undefined as never };
      }

      session.user = {
        ...session.user,
        id: token.sub,
        companyId: token.companyId,
        role: token.role,
        emailVerified: token.emailVerified ?? null,
      };
      return session;
    },
  },
});
