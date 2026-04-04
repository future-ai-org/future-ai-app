import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY?.trim() || undefined;
}

export function getStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}
