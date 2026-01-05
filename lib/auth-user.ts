import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

// Validate Google OAuth credentials
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.warn('[Auth] ⚠️ Google OAuth credentials not configured. Google sign-in will not work.');
  console.warn('[Auth] Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file.');
}

// Get the base URL for OAuth redirects
// Priority: NEXTAUTH_URL > AUTH_URL > auto-detect from request
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }
  // Will be auto-detected from request in production
  return undefined;
};

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    ...(googleClientId && googleClientSecret ? [
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        // Explicitly set authorization URL parameters if needed
        authorization: {
          params: {
            // Ensure redirect_uri is properly set
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
    ] : []),
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
          // Normalize email to lowercase to ensure consistency
          const normalizedEmail = email.toLowerCase().trim();
          
          const user = await prisma.user.findUnique({
            where: {
              email: normalizedEmail,
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
            console.error('[Auth] User has no password set! This account may be OAuth-only. Please use Google sign-in.');
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

          // Check if email is verified (only for credential-based signups, OAuth emails are auto-verified)
          if (!user.emailVerified && user.password) {
            console.log('[Auth] Email not verified for:', email);
            // Return null to indicate failed login, but we'll handle the error in signIn callback
            return null;
          }

          console.log('[Auth] ✅ Login successful for:', email);

          // Update last sign-in method
          await prisma.user.update({
            where: { id: user.id },
            data: { lastSignInMethod: "credentials" },
          });

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
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in - link to existing account or create new
      if (account?.provider === "google" && user.email) {
        try {
          // Normalize email to lowercase to ensure consistency
          const normalizedEmail = user.email.toLowerCase().trim();
          
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              lastSignInMethod: true,
              emailVerified: true,
            },
          });

          if (!existingUser) {
            // Create new user from Google OAuth
            await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: user.name || null,
                password: null, // OAuth users don't have passwords
                subscriptionTier: "free",
                emailVerified: new Date(), // Google emails are verified
                lastSignInMethod: "google",
                subscriptions: {
                  create: {
                    tier: "free",
                    status: "active",
                  },
                },
              },
            });
            console.log('[Auth] ✅ Created new user from Google OAuth:', normalizedEmail);
          } else {
            // Account exists - link Google OAuth to existing account
            // This ensures one account per email regardless of signup method
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                // Update name if user doesn't have one or if Google name is more complete
                ...(user.name && (!existingUser.name || user.name.length > (existingUser.name?.length || 0)) 
                  ? { name: user.name } 
                  : {}),
                // Mark email as verified if it wasn't already
                ...(existingUser.emailVerified ? {} : { emailVerified: new Date() }),
                lastSignInMethod: "google",
              },
            });
            console.log('[Auth] ✅ Linked Google OAuth to existing account:', normalizedEmail, {
              hadPassword: !!existingUser.password,
              previousMethod: existingUser.lastSignInMethod,
            });
          }
        } catch (error: any) {
          console.error('[Auth] Error handling Google sign-in:', error);
          // Allow sign-in to proceed even if DB update fails
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in - user object is available
      if (user) {
        // For Google OAuth, user object doesn't have id initially, fetch from DB
        if (account?.provider === "google" && user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.subscriptionTier = dbUser.subscriptionTier;
              token.email = dbUser.email;
              console.log('[Auth] ✅ JWT: Set token for Google user:', { id: dbUser.id, email: dbUser.email });
            } else {
              console.error('[Auth] ❌ JWT: User not found in DB after Google sign-in:', user.email);
            }
          } catch (error) {
            console.error('[Auth] Error fetching user in JWT callback:', error);
          }
        } else {
          // For credentials provider, user object has id
          token.id = user.id;
          token.subscriptionTier = (user as any).subscriptionTier;
          token.email = user.email;
        }
      }
      
      // If token doesn't have id but has email, try to fetch (fallback)
      if (!token.id && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.subscriptionTier = dbUser.subscriptionTier;
            console.log('[Auth] ✅ JWT: Fetched user ID from email:', dbUser.id);
          }
        } catch (error) {
          console.error('[Auth] Error fetching user in JWT fallback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
        (session.user as any).subscriptionTier = token.subscriptionTier || "free";
        // Ensure email matches
        if (token.email) {
          session.user.email = token.email as string;
        }
        console.log('[Auth] ✅ Session: User session created:', { id: token.id, email: token.email });
      } else {
        console.warn('[Auth] ⚠️ Session: Missing user ID in token:', { hasUser: !!session.user, hasTokenId: !!token.id, tokenKeys: Object.keys(token) });
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
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
