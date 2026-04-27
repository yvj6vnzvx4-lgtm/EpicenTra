import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const AUTH_DB_TIMEOUT_MS = 4000;
const AUTH_UNAVAILABLE_ERROR = "AUTH_SERVICE_UNAVAILABLE";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(AUTH_UNAVAILABLE_ERROR));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await withTimeout(
            prisma.user.findUnique({
              where: { email: credentials.email },
              include: { organization: true },
            }),
            AUTH_DB_TIMEOUT_MS
          );

          if (!user) return null;

          const isValid = await withTimeout(
            bcrypt.compare(credentials.password, user.passwordHash),
            AUTH_DB_TIMEOUT_MS
          );

          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
            organizationSlug: user.organization.slug,
          };
        } catch (error) {
          console.error("[auth] credentials authorize failed:", error);
          throw new Error(AUTH_UNAVAILABLE_ERROR);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as NextAuthUser & {
          role: string;
          avatarUrl: string | null;
          organizationId: string;
          organizationName: string;
        };
        token.id = u.id;
        token.role = u.role;
        token.avatarUrl = u.avatarUrl;
        token.organizationId = u.organizationId;
        token.organizationName = u.organizationName;
        token.organizationSlug = (u as any).organizationSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.organizationSlug = token.organizationSlug as string;
      }
      return session;
    },
  },
};
