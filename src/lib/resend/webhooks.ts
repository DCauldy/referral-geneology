import { Webhook } from "svix";

export class ResendWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResendWebhookError";
  }
}

interface ResendWebhookEvent {
  type: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    [key: string]: unknown;
  };
}

export function verifyResendWebhook(
  body: string,
  headers: Record<string, string>
): ResendWebhookEvent {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    throw new ResendWebhookError("RESEND_WEBHOOK_SECRET is not configured");
  }

  const wh = new Webhook(secret);

  try {
    const payload = wh.verify(body, {
      "svix-id": headers["svix-id"],
      "svix-timestamp": headers["svix-timestamp"],
      "svix-signature": headers["svix-signature"],
    }) as ResendWebhookEvent;

    return payload;
  } catch {
    throw new ResendWebhookError("Invalid webhook signature");
  }
}
