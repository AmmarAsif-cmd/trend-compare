# Freemium Model Setup Guide

This document provides a complete guide to the freemium subscription system implemented in TrendArc.

## Overview

TrendArc now supports a two-tier freemium model:

- **Free Tier**: Basic access with template-based AI insights
- **Premium Tier ($4.99/month)**: Rich AI insights with category analysis, predictions, and all features

## Features by Tier

### Free Tier
- ✅ View all trend comparisons
- ✅ Basic AI insights (template-based)
- ✅ 12-month timeframe
- ✅ Worldwide data
- ✅ Blog access
- ✅ Comparison charts and stats

### Premium Tier ($4.99/month)
- ✅ All Free features, plus:
- ⭐ **Rich AI insights** powered by Claude Haiku
  - Category detection (music, movies, tech, etc.)
  - Trend predictions and forecasts
  - Peak explanations with exact dates
  - Practical implications for your use case
  - Volatility analysis
- ⭐ All timeframes (7d, 30d, 12m, 5y, all)
- ⭐ Geographic breakdowns
- ⭐ CSV export
- ⭐ Ad-free experience
- ⭐ Priority support

## Database Schema

The freemium system adds two new models to your Prisma schema:

### User Model
```prisma
model User {
  id                String        @id @default(cuid())
  email             String        @unique
  name              String?
  password          String        // Hashed with bcrypt
  emailVerified     DateTime?
  subscriptionTier  String        @default("free") // "free" | "premium"
  stripeCustomerId  String?       @unique
  subscriptions     Subscription[]
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}
```

### Subscription Model
```prisma
model Subscription {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tier                  String    // "free" | "premium"
  status                String    // "active" | "canceled" | "past_due" | "paused" | "trialing"
  stripeSubscriptionId  String?   @unique
  stripePriceId         String?
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAtPeriodEnd     Boolean   @default(false)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

## Environment Variables

Add these variables to your `.env` file:

### Required
```bash
# NextAuth (Generate secret with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://trendarc.net  # or http://localhost:3000 for dev

# Stripe
STRIPE_SECRET_KEY=sk_test_...  # Use sk_live_... in production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Use pk_live_... in production
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

# App URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=https://trendarc.net  # or http://localhost:3000 for dev
```

## Stripe Setup

### 1. Create a Stripe Account
1. Sign up at https://stripe.com/
2. Verify your email
3. Complete business details

### 2. Create a Product
1. Go to Stripe Dashboard → Products → Add Product
2. Name: "TrendArc Premium"
3. Description: "Advanced AI insights and premium features"
4. Pricing model: Recurring
5. Price: $4.99 USD
6. Billing period: Monthly
7. Save and copy the Price ID (starts with `price_...`)

### 3. Get API Keys
1. Go to Developers → API keys
2. Copy "Secret key" (starts with `sk_test_...`)
3. Copy "Publishable key" (starts with `pk_test_...`)
4. Add to your `.env` file

### 4. Set Up Webhook
1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://trendarc.net/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Save and copy the Signing secret (starts with `whsec_...`)
5. Add to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### 5. Test Mode vs Live Mode
- Start with **Test mode** keys (`sk_test_...`, `pk_test_...`)
- Use Stripe's test card: `4242 4242 4242 4242`
- When ready for production, switch to **Live mode** keys

## Database Migration

After adding the User and Subscription models, run:

```bash
npx prisma migrate dev --name add_user_subscription_models
npx prisma generate
```

For production:
```bash
npx prisma migrate deploy
```

## Architecture

### Authentication Flow
1. User signs up at `/signup`
   - Password is hashed with bcrypt (12 rounds)
   - User created with `subscriptionTier: "free"`
   - Free subscription automatically created
   - Auto-login after signup

2. User logs in at `/login`
   - NextAuth credentials provider validates password
   - JWT session token includes user ID and subscription tier
   - Redirects to homepage or requested page

### Paywall Logic
1. Comparison page loads (server-side)
2. `canAccessPremium()` checks user's subscription tier
3. If premium: Generate rich AI insights using Claude Haiku
4. If free: Show upgrade prompt with feature list
5. Upgrade button redirects to `/pricing`

### Subscription Flow
1. User clicks "Upgrade to Premium" on `/pricing`
2. Creates Stripe Checkout session via `/api/stripe/checkout`
3. Redirects to Stripe hosted checkout page
4. User enters payment information
5. On success:
   - Stripe sends `checkout.session.completed` webhook
   - Webhook handler updates user to premium tier
   - Creates subscription record
   - Redirects user to `/account?success=true`

### Webhook Events
- `checkout.session.completed`: Upgrade user to premium, save Stripe customer ID
- `customer.subscription.updated`: Update subscription status, period dates
- `customer.subscription.deleted`: Downgrade user to free tier
- `invoice.payment_succeeded`: Payment successful (subscription continues)
- `invoice.payment_failed`: Mark subscription as `past_due`, notify user

## Key Files

### Authentication
- `lib/auth-user.ts` - NextAuth configuration
- `lib/user-auth-helpers.ts` - Helper functions for checking user tier
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `app/api/user/signup/route.ts` - User registration endpoint
- `app/api/user/me/route.ts` - Get current user data

### Payments
- `lib/stripe.ts` - Stripe configuration and helper functions
- `app/api/stripe/webhook/route.ts` - Stripe webhook handler
- `app/api/stripe/checkout/route.ts` - Create checkout session
- `app/api/stripe/portal/route.ts` - Customer portal for subscription management

### Pages
- `app/pricing/page.tsx` - Pricing page with tier comparison
- `app/login/page.tsx` - Login page
- `app/signup/page.tsx` - Signup page
- `app/account/page.tsx` - User account and subscription management
- `app/compare/[slug]/page.tsx` - Comparison page with paywall logic

### Admin
- `app/admin/page.tsx` - Updated dashboard with subscriber metrics
- `app/api/admin/stats/subscribers/route.ts` - Subscriber stats endpoint

## Admin Dashboard Metrics

The admin dashboard now shows:

### Revenue
- **Monthly Recurring Revenue (MRR)**: Total from all premium subscribers
- Premium subscribers count × $4.99

### Users
- Total registered users
- New users today
- Free vs Premium breakdown
- Active subscriptions

### Growth Tracking
- New subscriptions this month
- Conversion rate (premium / total users)

## Cost Analysis

### AI Insights Costs (Claude Haiku)
- ~$0.0014 per comparison with rich AI insights
- With 10 premium users generating 100 comparisons each:
  - Cost: $14/month
  - Revenue: $49.90/month
  - Profit: $35.90/month

### Break-even Analysis
- At $4.99/month per user
- Cost per AI insight: $0.0014
- Break-even at ~3,564 AI insights per user per month
- Typical usage: ~50-200 insights/month per user
- **Highly profitable at scale**

## Testing Checklist

### Before Launch
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test free user experience (no rich AI)
- [ ] Test upgrade to premium
- [ ] Test premium user experience (rich AI visible)
- [ ] Test Stripe webhook events
- [ ] Test subscription cancellation
- [ ] Test payment failure handling
- [ ] Test customer portal access
- [ ] Verify admin dashboard shows correct metrics
- [ ] Test with Stripe test mode cards

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication required: `4000 0025 0000 3155`

## Security Considerations

1. **Password Security**
   - Passwords hashed with bcrypt (12 rounds)
   - Never stored in plain text
   - Password validation on signup

2. **Session Security**
   - JWT tokens with NextAuth
   - HTTP-only cookies (not accessible via JavaScript)
   - Secure session management

3. **API Security**
   - Authentication required for all user/subscription endpoints
   - Stripe webhook signature verification
   - Rate limiting via existing middleware

4. **Database Security**
   - Foreign key constraints with CASCADE delete
   - Unique constraints on critical fields (email, Stripe IDs)
   - Proper indexing for performance

## Deployment Checklist

### Vercel/Production
1. Add all environment variables to Vercel
2. Run database migration: `npx prisma migrate deploy`
3. Update NEXTAUTH_URL to production URL
4. Update NEXT_PUBLIC_APP_URL to production URL
5. Switch Stripe to live mode keys
6. Update Stripe webhook URL to production
7. Test complete flow in production
8. Monitor Stripe dashboard for events

## Support

For issues or questions:
- Review this guide
- Check Stripe dashboard for webhook logs
- Check Vercel logs for errors
- Test with Stripe test mode first

## Future Enhancements

Potential improvements:
- Annual billing option with discount
- Team/agency plans
- Usage-based pricing
- Free trial period (7-14 days)
- Referral program
- Student discount
- Email verification
- Password reset flow
- Social login (Google, GitHub)
