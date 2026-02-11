import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export async function createCheckoutSession(params: {
  productId: string;
  successUrl: string;
  customerEmail?: string;
  customerExternalId?: string;
  metadata?: Record<string, string>;
}) {
  const checkout = await polar.checkouts.create({
    products: [params.productId],
    successUrl: params.successUrl,
    customerEmail: params.customerEmail,
    metadata: {
      ...params.metadata,
      external_id: params.customerExternalId ?? "",
    },
  });

  return { url: checkout.url };
}

export async function getSubscription(subscriptionId: string) {
  const sub = await polar.subscriptions.get({ id: subscriptionId });

  return {
    id: sub.id,
    status: sub.status,
    product: { id: sub.product.id, name: sub.product.name },
    current_period_end: sub.currentPeriodEnd?.toISOString() ?? null,
  };
}

export async function getCustomerPortalUrl(customerId: string) {
  const session = await polar.customerSessions.create({ customerId });
  return { url: session.customerPortalUrl };
}
