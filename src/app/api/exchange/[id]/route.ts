import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import { getFromAddress } from "@/lib/resend/config";
import { isImpersonating } from "@/lib/admin/impersonation";

// PATCH - Accept, decline, update status, update draft, or publish draft
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user is on a paid plan
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("active_org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.active_org_id) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, plan")
      .eq("id", profile.active_org_id)
      .single();

    if (!org || org.plan === "free") {
      return NextResponse.json(
        { error: "Referral exchange requires a paid plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, receiver_status, receiver_status_visible } = body;

    // Fetch the exchange
    const { data: exchange, error: fetchError } = await supabase
      .from("referral_exchanges")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !exchange) {
      return NextResponse.json(
        { error: "Exchange not found" },
        { status: 404 }
      );
    }

    // ── Update Draft ──────────────────────────────────────────
    if (action === "update_draft") {
      if (exchange.sender_user_id !== user.id) {
        return NextResponse.json(
          { error: "Not authorized to update this draft" },
          { status: 403 }
        );
      }

      if (exchange.status !== "draft") {
        return NextResponse.json(
          { error: "Only drafts can be updated with this action" },
          { status: 400 }
        );
      }

      const allowedFields = [
        "receiver_email",
        "contact_snapshot",
        "context_note",
        "source_contact_id",
        "interest_level",
        "contact_approach",
        "internal_notes",
        "sender_metadata",
        "notify_on_connect",
        "remind_follow_up",
      ];

      const updates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from("referral_exchanges")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, exchange: updated });
    }

    // ── Publish Draft ─────────────────────────────────────────
    if (action === "publish_draft") {
      if (exchange.sender_user_id !== user.id) {
        return NextResponse.json(
          { error: "Not authorized to publish this draft" },
          { status: 403 }
        );
      }

      if (exchange.status !== "draft") {
        return NextResponse.json(
          { error: "Only drafts can be published" },
          { status: 400 }
        );
      }

      if (!exchange.receiver_email) {
        return NextResponse.json(
          { error: "Recipient email is required to send a referral" },
          { status: 400 }
        );
      }

      const snapshot = exchange.contact_snapshot as {
        first_name?: string;
        last_name?: string | null;
      };

      if (!snapshot.first_name) {
        return NextResponse.json(
          { error: "Contact name is required" },
          { status: 400 }
        );
      }

      // Prevent sending to yourself
      if (exchange.receiver_email === user.email) {
        return NextResponse.json(
          { error: "Cannot send a referral to yourself" },
          { status: 400 }
        );
      }

      // Block during impersonation
      if (await isImpersonating(supabase, user.id, org.id)) {
        return NextResponse.json(
          {
            error:
              "Cannot send exchanges while impersonating an organization",
          },
          { status: 403 }
        );
      }

      // Publish: set status to pending, set expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: updateError } = await supabase
        .from("referral_exchanges")
        .update({
          status: "pending",
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // Re-fetch to get the trigger-resolved status
      const { data: published, error: refetchError } = await supabase
        .from("referral_exchanges")
        .select("*")
        .eq("id", id)
        .single();

      if (refetchError || !published) {
        return NextResponse.json(
          { error: "Failed to fetch published exchange" },
          { status: 500 }
        );
      }

      // Send notification email (same 3-branch logic as POST)
      const senderName =
        (
          await supabase
            .from("user_profiles")
            .select("full_name")
            .eq("id", user.id)
            .single()
        ).data?.full_name || "Someone";

      const contactName = [snapshot.first_name, snapshot.last_name]
        .filter(Boolean)
        .join(" ");

      const receiverEmail = published.receiver_email as string;

      try {
        if (published.status === "undeliverable") {
          await sendEmail({
            to: receiverEmail,
            from: getFromAddress("Trellis"),
            subject: `${senderName} wants to send you a referral`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e293b;">You have a pending referral</h2>
                <p><strong>${senderName}</strong> from <strong>${org.name}</strong> wants to send you a referral for <strong>${contactName}</strong>.</p>
                ${published.context_note ? `<p style="color: #64748b; font-style: italic;">"${published.context_note}"</p>` : ""}
                <p>To receive referrals on Trellis, you need a Pro or Team plan.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/billing"
                   style="display: inline-block; padding: 12px 24px; background-color: #2f5435; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Upgrade Your Plan
                </a>
              </div>
            `,
          });
        } else if (published.receiver_user_id) {
          await sendEmail({
            to: receiverEmail,
            from: getFromAddress("Trellis"),
            subject: `${senderName} sent you a referral for ${contactName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e293b;">New referral from your network</h2>
                <p><strong>${senderName}</strong> from <strong>${org.name}</strong> sent you a referral for <strong>${contactName}</strong>.</p>
                ${published.context_note ? `<p style="color: #64748b; font-style: italic;">"${published.context_note}"</p>` : ""}
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/exchange"
                   style="display: inline-block; padding: 12px 24px; background-color: #2f5435; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  View in Your Inbox
                </a>
              </div>
            `,
          });
        } else {
          await sendEmail({
            to: receiverEmail,
            from: getFromAddress("Trellis"),
            subject: `${senderName} sent you a referral on Trellis`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e293b;">You've been sent a referral</h2>
                <p><strong>${senderName}</strong> from <strong>${org.name}</strong> wants to send you a referral for <strong>${contactName}</strong>.</p>
                ${published.context_note ? `<p style="color: #64748b; font-style: italic;">"${published.context_note}"</p>` : ""}
                <p>Sign up for Trellis (Pro or Team plan) to receive this referral and start growing your network.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?ref=${published.token}"
                   style="display: inline-block; padding: 12px 24px; background-color: #2f5435; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Claim Your Referral
                </a>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.error("Exchange notification email error:", emailErr);
      }

      return NextResponse.json({ success: true, exchange: published });
    }

    // ── Accept ────────────────────────────────────────────────
    if (action === "accept") {
      if (exchange.receiver_user_id !== user.id) {
        return NextResponse.json(
          { error: "Not authorized to accept this exchange" },
          { status: 403 }
        );
      }

      if (exchange.status !== "pending") {
        return NextResponse.json(
          { error: `Exchange is already ${exchange.status}` },
          { status: 400 }
        );
      }

      // Import contact into receiver's org
      const snapshot = exchange.contact_snapshot as {
        first_name: string;
        last_name?: string | null;
        company_name?: string | null;
        email?: string | null;
        phone?: string | null;
        industry?: string | null;
      };

      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          org_id: org.id,
          first_name: snapshot.first_name,
          last_name: snapshot.last_name || null,
          email: snapshot.email || null,
          phone: snapshot.phone || null,
          industry: snapshot.industry || null,
          relationship_type: "contact",
          generation: 1,
          notes: `Received via referral exchange from ${exchange.receiver_email !== user.email ? "another network" : "network"}. ${exchange.context_note || ""}`.trim(),
        })
        .select("id")
        .single();

      if (contactError) {
        console.error("Contact import error:", contactError);
        return NextResponse.json(
          { error: "Failed to import contact" },
          { status: 500 }
        );
      }

      // Update exchange status
      const { error: updateError } = await supabase
        .from("referral_exchanges")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          imported_contact_id: newContact.id,
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // Create activity record
      const contactName = [snapshot.first_name, snapshot.last_name].filter(Boolean).join(" ");
      await supabase.from("activities").insert({
        org_id: org.id,
        entity_type: "contact",
        entity_id: newContact.id,
        activity_type: "referral_received",
        title: `${contactName} was received via the referral exchange`,
        description: exchange.context_note || "Imported from inter-network referral",
        metadata: {
          exchange_id: exchange.id,
          sender_org_id: exchange.sender_org_id,
        },
        created_by: user.id,
      });

      return NextResponse.json({
        success: true,
        contact_id: newContact.id,
        message: "Referral accepted and contact imported",
      });
    }

    // ── Decline ───────────────────────────────────────────────
    if (action === "decline") {
      if (exchange.receiver_user_id !== user.id) {
        return NextResponse.json(
          { error: "Not authorized to decline this exchange" },
          { status: 403 }
        );
      }

      if (exchange.status !== "pending") {
        return NextResponse.json(
          { error: `Exchange is already ${exchange.status}` },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("referral_exchanges")
        .update({
          status: "declined",
          declined_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "Referral declined" });
    }

    // ── Update Status ─────────────────────────────────────────
    if (action === "update_status") {
      if (exchange.receiver_user_id !== user.id) {
        return NextResponse.json(
          { error: "Not authorized to update this exchange" },
          { status: 403 }
        );
      }

      const updates: Record<string, unknown> = {};
      if (receiver_status) updates.receiver_status = receiver_status;
      if (typeof receiver_status_visible === "boolean")
        updates.receiver_status_visible = receiver_status_visible;

      const { error: updateError } = await supabase
        .from("referral_exchanges")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // Log activity on the imported contact when status changes
      if (receiver_status && receiver_status !== exchange.receiver_status && exchange.imported_contact_id) {
        const statusLabels: Record<string, string> = {
          none: "No update",
          in_progress: "In Progress",
          converted: "Converted",
          lost: "Lost",
        };
        const snapshot = exchange.contact_snapshot as { first_name: string; last_name?: string | null };
        const name = [snapshot.first_name, snapshot.last_name].filter(Boolean).join(" ");
        const label = statusLabels[receiver_status] || receiver_status;

        await supabase.from("activities").insert({
          org_id: org.id,
          entity_type: "contact",
          entity_id: exchange.imported_contact_id,
          activity_type: "referral_received",
          title: `Exchange status for ${name} updated to ${label}`,
          description: null,
          metadata: {
            exchange_id: exchange.id,
            old_status: exchange.receiver_status,
            new_status: receiver_status,
          },
          created_by: user.id,
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: accept, decline, update_status, update_draft, or publish_draft" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Exchange action error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a draft or pending exchange (sender only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RLS policy already restricts to sender + status IN ('draft', 'pending')
    const { error: deleteError } = await supabase
      .from("referral_exchanges")
      .delete()
      .eq("id", id)
      .eq("sender_user_id", user.id);

    if (deleteError) {
      console.error("Exchange delete error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Exchange delete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
