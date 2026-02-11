import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyResendWebhook,
  ResendWebhookError,
} from "@/lib/resend/webhooks";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Convert headers to plain object
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let event;
    try {
      event = verifyResendWebhook(body, headers);
    } catch (err) {
      if (err instanceof ResendWebhookError) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
      throw err;
    }

    const supabase = createAdminClient();
    const emailId = event.data.email_id;

    if (!emailId) {
      return NextResponse.json({ received: true });
    }

    switch (event.type) {
      case "email.delivered": {
        await supabase
          .from("email_logs")
          .update({ status: "delivered" })
          .eq("resend_id", emailId);
        break;
      }

      case "email.opened": {
        await supabase
          .from("email_logs")
          .update({
            status: "opened",
            opened_at: new Date().toISOString(),
          })
          .eq("resend_id", emailId);

        // Update automation stats
        const { data: log } = await supabase
          .from("email_logs")
          .select("automation_id")
          .eq("resend_id", emailId)
          .single();

        if (log?.automation_id) {
          const { data: automation } = await supabase
            .from("automations")
            .select("stats")
            .eq("id", log.automation_id)
            .single();

          if (automation) {
            const stats =
              (automation.stats as Record<string, number>) || {};
            await supabase
              .from("automations")
              .update({
                stats: { ...stats, opened: (stats.opened || 0) + 1 },
              })
              .eq("id", log.automation_id);
          }
        }
        break;
      }

      case "email.clicked": {
        await supabase
          .from("email_logs")
          .update({
            status: "clicked",
            clicked_at: new Date().toISOString(),
          })
          .eq("resend_id", emailId);

        // Update automation stats
        const { data: log } = await supabase
          .from("email_logs")
          .select("automation_id")
          .eq("resend_id", emailId)
          .single();

        if (log?.automation_id) {
          const { data: automation } = await supabase
            .from("automations")
            .select("stats")
            .eq("id", log.automation_id)
            .single();

          if (automation) {
            const stats =
              (automation.stats as Record<string, number>) || {};
            await supabase
              .from("automations")
              .update({
                stats: { ...stats, clicked: (stats.clicked || 0) + 1 },
              })
              .eq("id", log.automation_id);
          }
        }
        break;
      }

      case "email.bounced": {
        await supabase
          .from("email_logs")
          .update({
            status: "bounced",
            bounced_at: new Date().toISOString(),
            error_message: "Email bounced",
          })
          .eq("resend_id", emailId);

        // Update automation stats
        const { data: log } = await supabase
          .from("email_logs")
          .select("automation_id")
          .eq("resend_id", emailId)
          .single();

        if (log?.automation_id) {
          const { data: automation } = await supabase
            .from("automations")
            .select("stats")
            .eq("id", log.automation_id)
            .single();

          if (automation) {
            const stats =
              (automation.stats as Record<string, number>) || {};
            await supabase
              .from("automations")
              .update({
                stats: { ...stats, bounced: (stats.bounced || 0) + 1 },
              })
              .eq("id", log.automation_id);
          }
        }
        break;
      }

      case "email.complained": {
        await supabase
          .from("email_logs")
          .update({ status: "complained" })
          .eq("resend_id", emailId);
        break;
      }

      default: {
        console.log(`Resend webhook: unhandled event type ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Resend webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
