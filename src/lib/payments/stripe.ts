/**
 * Stripe / cards disabled. Use MoMo flow only (`lib/payments/momo.ts`).
 */
export function createCheckoutSession(): never {
  throw new Error("Card/Stripe payments are disabled. Use MoMo (code 8787) in Subscription settings.");
}

export function constructStripeWebhookEvent(): never {
  throw new Error("Stripe webhooks disabled — MoMo manual approval only.");
}
