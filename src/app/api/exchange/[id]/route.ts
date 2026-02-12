import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH - Accept or decline an exchange
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

    // Check receiver is on a paid plan
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
      .select("id, plan")
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

    // Handle accept
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
      await supabase.from("activities").insert({
        org_id: org.id,
        entity_type: "contact",
        entity_id: newContact.id,
        activity_type: "referral_received",
        title: "Contact received via referral exchange",
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

    // Handle decline
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

    // Handle status update (receiver sharing conversion status back)
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

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: accept, decline, or update_status" },
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
