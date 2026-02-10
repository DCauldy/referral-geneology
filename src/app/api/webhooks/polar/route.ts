import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyPolarWebhook,
  type PolarWebhookEvent,
} from "@/lib/polar/webhooks";
import { mapPolarProductToPlan, getContactLimit, getUserLimit } from "@/lib/polar/plans";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-polar-signature");

    // Verify webhook signature
    if (!verifyPolarWebhook(payload, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const event: PolarWebhookEvent = JSON.parse(payload);
    const supabase = createAdminClient();

    switch (event.type) {
      case "subscription.created":
      case "subscription.updated": {
        const { id: subscriptionId, customer_id, product, metadata, status } = event.data;
        const orgId = metadata?.org_id;

        if (!orgId) {
          console.error("Polar webhook: missing org_id in metadata");
          return NextResponse.json(
            { error: "Missing org_id in metadata" },
            { status: 400 }
          );
        }

        const plan = mapPolarProductToPlan(product.name);
        const maxContacts = getContactLimit(plan);
        const maxUsers = getUserLimit(plan);

        const { error: updateError } = await supabase
          .from("organizations")
          .update({
            plan,
            polar_subscription_id: subscriptionId,
            polar_customer_id: customer_id,
            subscription_status: status === "active" ? "active" : status,
            max_contacts: maxContacts === Infinity ? 999999 : maxContacts,
            max_users: maxUsers,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orgId);

        if (updateError) {
          console.error("Polar webhook: failed to update org", updateError);
          return NextResponse.json(
            { error: "Failed to update organization" },
            { status: 500 }
          );
        }

        break;
      }

      case "subscription.canceled": {
        const { metadata, id: subscriptionId } = event.data;
        const orgId = metadata?.org_id;

        if (!orgId) {
          // Try to find org by subscription ID
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("polar_subscription_id", subscriptionId)
            .single();

          if (!org) {
            console.error("Polar webhook: could not find org for canceled subscription");
            return NextResponse.json(
              { error: "Organization not found" },
              { status: 404 }
            );
          }

          const { error: updateError } = await supabase
            .from("organizations")
            .update({
              subscription_status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", org.id);

          if (updateError) {
            console.error("Polar webhook: failed to schedule downgrade", updateError);
          }

          break;
        }

        // Schedule downgrade - subscription will remain active until period end
        const { error: updateError } = await supabase
          .from("organizations")
          .update({
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orgId);

        if (updateError) {
          console.error("Polar webhook: failed to schedule downgrade", updateError);
          return NextResponse.json(
            { error: "Failed to update organization" },
            { status: 500 }
          );
        }

        break;
      }

      case "subscription.revoked": {
        const { metadata, id: subscriptionId } = event.data;
        let orgId = metadata?.org_id;

        if (!orgId) {
          // Try to find org by subscription ID
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("polar_subscription_id", subscriptionId)
            .single();

          if (org) {
            orgId = org.id;
          }
        }

        if (!orgId) {
          console.error("Polar webhook: could not find org for revoked subscription");
          return NextResponse.json(
            { error: "Organization not found" },
            { status: 404 }
          );
        }

        // Immediate downgrade to free
        const { error: updateError } = await supabase
          .from("organizations")
          .update({
            plan: "free",
            subscription_status: null,
            polar_subscription_id: null,
            max_contacts: 50,
            max_users: 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orgId);

        if (updateError) {
          console.error("Polar webhook: failed to downgrade to free", updateError);
          return NextResponse.json(
            { error: "Failed to downgrade organization" },
            { status: 500 }
          );
        }

        break;
      }

      default: {
        // Unhandled event type - acknowledge receipt
        console.log(`Polar webhook: unhandled event type ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Polar webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
