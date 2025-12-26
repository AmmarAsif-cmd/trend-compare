import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
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
    async signIn({ user, account, profile }) {
      // For OAuth providers (Google), create user if doesn't exist
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Create new user from Google account
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                emailVerified: new Date(),
                subscriptionTier: "free",
              },
            });
            user.id = newUser.id;
          } else {
            user.id = existingUser.id;
          }

          // Create or update Account record for OAuth
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            create: {
              userId: user.id as string,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
            update: {
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });
        } catch (error) {
          console.error("[Auth] Error creating OAuth user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;

        // Fetch subscription tier from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { subscriptionTier: true },
        });
        token.subscriptionTier = dbUser?.subscriptionTier || "free";
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
