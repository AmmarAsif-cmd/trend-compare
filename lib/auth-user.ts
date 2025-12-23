import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials');
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        console.log('[Auth] Attempting login for:', email);

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: email,
            },
            include: {
              subscriptions: {
                where: {
                  status: "active",
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
              },
            },
          });

          if (!user) {
            console.log('[Auth] User not found:', email);
            return null;
          }

          console.log('[Auth] User found:', {
            id: user.id,
            email: user.email,
            hasPassword: !!user.password,
            passwordLength: user.password?.length,
            passwordPrefix: user.password?.substring(0, 10),
            subscriptionTier: user.subscriptionTier,
          });

          if (!user.password) {
            console.error('[Auth] User has no password set!');
            return null;
          }

          const isPasswordValid = await compare(password, user.password);

          console.log('[Auth] Password validation result:', isPasswordValid);

          if (!isPasswordValid) {
            console.error('[Auth] Invalid password for user:', email);
            // Test if password hash format is correct
            const hashFormat = user.password.substring(0, 7);
            console.error('[Auth] Password hash format:', hashFormat, '(should start with $2a$12$ or $2b$12$)');
            return null;
          }

          console.log('[Auth] ✅ Login successful for:', email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            subscriptionTier: user.subscriptionTier,
          };
        } catch (error: any) {
          console.error('[Auth] Error during authentication:', {
            message: error?.message,
            code: error?.code,
            stack: error?.stack,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionTier = (user as any).subscriptionTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).subscriptionTier = token.subscriptionTier;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
