import { createHmac } from "crypto";

export function verifyPolarWebhook(
  payload: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.POLAR_WEBHOOK_SECRET) {
    return false;
  }

  const expected = createHmac("sha256", process.env.POLAR_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return signature === expected;
}

export interface PolarWebhookEvent {
  type: string;
  data: {
    id: string;
    status: string;
    customer_id: string;
    product: {
      id: string;
      name: string;
    };
    metadata?: Record<string, string>;
    [key: string]: unknown;
  };
}
