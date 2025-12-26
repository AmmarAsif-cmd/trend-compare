import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendAccountLockoutEmail } from "@/lib/email";

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

          // Check if account is locked
          if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            const minutesRemaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
            console.log('[Auth] Account locked for:', email, 'Minutes remaining:', minutesRemaining);
            throw new Error(`Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`);
          }

          // If lockout has expired, clear it
          if (user.accountLockedUntil && user.accountLockedUntil <= new Date()) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                accountLockedUntil: null,
                failedLoginAttempts: 0,
              },
            });
          }

          console.log('[Auth] User found:', {
            id: user.id,
            email: user.email,
            hasPassword: !!user.password,
            failedAttempts: user.failedLoginAttempts,
            subscriptionTier: user.subscriptionTier,
          });

          if (!user.password) {
            console.error('[Auth] User has no password set! User may have signed up with OAuth.');
            throw new Error('This account was created using Google sign-in. Please log in with Google instead.');
          }

          const isPasswordValid = await compare(password, user.password);

          console.log('[Auth] Password validation result:', isPasswordValid);

          if (!isPasswordValid) {
            console.error('[Auth] Invalid password for user:', email);

            // Increment failed login attempts
            const newFailedAttempts = user.failedLoginAttempts + 1;

            if (newFailedAttempts >= 5) {
              // Lock account for 30 minutes
              const lockUntil = new Date();
              lockUntil.setMinutes(lockUntil.getMinutes() + 30);

              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: newFailedAttempts,
                  accountLockedUntil: lockUntil,
                },
              });

              console.log('[Auth] Account locked for:', email, 'until:', lockUntil);

              // Send lockout email (don't block on this)
              try {
                await sendAccountLockoutEmail(email, lockUntil);
              } catch (emailError) {
                console.error('[Auth] Failed to send lockout email:', emailError);
              }

              throw new Error('Too many failed login attempts. Your account has been locked for 30 minutes. Please check your email for details.');
            } else {
              // Just increment failed attempts
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: newFailedAttempts,
                },
              });

              const attemptsRemaining = 5 - newFailedAttempts;
              throw new Error(`Invalid email or password. ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining before account lockout.`);
            }
          }

          // Password is valid - reset failed attempts
          if (user.failedLoginAttempts > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: 0,
              },
            });
          }

          // Check if email is verified (only for email/password users)
          if (!user.emailVerified) {
            console.log('[Auth] Email not verified for:', email);
            throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
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
