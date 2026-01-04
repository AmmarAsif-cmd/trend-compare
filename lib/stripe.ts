import Stripe from "stripe";

// Lazy initialization - only create Stripe instance when needed
// This prevents build failures when STRIPE_SECRET_KEY is not set
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripeObj = getStripe();
    const value = (stripeObj as any)[prop];
    return typeof value === 'function' ? value.bind(stripeObj) : value;
  },
});

// Premium plan price ID (will be set via env variable)
export const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID || "";

/**
 * Create a Stripe checkout session for premium subscription
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  priceId: string = PREMIUM_PRICE_ID
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${baseUrl}/account?success=true`,
    cancel_url: `${baseUrl}/pricing?canceled=true`,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
}

/**
 * Create a Stripe customer portal session
 */
export async function createCustomerPortalSession(customerId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/account`,
  });

  return session;
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}
