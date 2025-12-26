import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

// Ensure AUTH_SECRET is set
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  console.error('❌ CRITICAL: AUTH_SECRET or NEXTAUTH_SECRET environment variable is not set!');
  console.error('   NextAuth will not work properly without this.');
  console.error('   Generate one with: openssl rand -base64 32');
}

export const authConfig: NextAuthConfig = {
  secret: authSecret,
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
          // Check if Prisma is available
          if (!prisma) {
            console.error('[Auth] Prisma client not initialized - database unavailable');
            throw new Error('Database connection unavailable. Please ensure migrations have been run.');
          }

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
            name: error?.name,
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
          });

          // If it's a Prisma initialization error, log it clearly
          if (error?.message?.includes('Prisma client is not initialized')) {
            console.error('[Auth] ❌ CRITICAL: Prisma client not initialized. Database operations are failing.');
            console.error('[Auth] This typically means migrations have not been run or there is a schema mismatch.');
          }

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
    error: "/login", // Redirect errors to login page instead of default error page
  },
  session: {
    strategy: "jwt",
  },
  // Add debug mode to see what's happening
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
