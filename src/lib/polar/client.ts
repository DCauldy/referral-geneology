const POLAR_API_BASE = "https://api.polar.sh/v1";

interface PolarRequestOptions {
  method?: string;
  body?: Record<string, unknown>;
}

async function polarFetch<T>(
  path: string,
  options: PolarRequestOptions = {}
): Promise<T> {
  const { method = "GET", body } = options;

  const res = await fetch(`${POLAR_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Polar API error: ${res.status} ${error}`);
  }

  return res.json();
}

export async function createCheckoutSession(params: {
  productPriceId: string;
  successUrl: string;
  customerEmail?: string;
  customerExternalId?: string;
  metadata?: Record<string, string>;
}) {
  return polarFetch<{ url: string }>("/checkouts/custom", {
    method: "POST",
    body: {
      product_price_id: params.productPriceId,
      success_url: params.successUrl,
      customer_email: params.customerEmail,
      metadata: {
        ...params.metadata,
        external_id: params.customerExternalId,
      },
    },
  });
}

export async function getSubscription(subscriptionId: string) {
  return polarFetch<{
    id: string;
    status: string;
    product: { id: string; name: string };
    current_period_end: string;
  }>(`/subscriptions/${subscriptionId}`);
}

export async function getCustomerPortalUrl(customerId: string) {
  return polarFetch<{ url: string }>(
    `/customers/${customerId}/portal`
  );
}
