import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import { getFromAddress } from "@/lib/resend/config";

// POST - Send a referral exchange
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check sender is on a paid plan
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
    const { receiver_email, contact_snapshot, context_note, source_contact_id } =
      body;

    if (!receiver_email || !contact_snapshot) {
      return NextResponse.json(
        { error: "receiver_email and contact_snapshot are required" },
        { status: 400 }
      );
    }

    if (!contact_snapshot.first_name) {
      return NextResponse.json(
        { error: "contact_snapshot must include first_name" },
        { status: 400 }
      );
    }

    // Prevent sending to yourself
    if (receiver_email === user.email) {
      return NextResponse.json(
        { error: "Cannot send a referral to yourself" },
        { status: 400 }
      );
    }

    // Insert the exchange (trigger resolves receiver_user_id and checks plan)
    const { data: exchange, error: insertError } = await supabase
      .from("referral_exchanges")
      .insert({
        sender_user_id: user.id,
        sender_org_id: org.id,
        receiver_email,
        contact_snapshot,
        context_note: context_note || null,
        source_contact_id: source_contact_id || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Exchange insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Send notification email to receiver
    const senderName =
      (
        await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
      ).data?.full_name || "Someone";

    const contactName = [
      contact_snapshot.first_name,
      contact_snapshot.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    try {
      if (exchange.status === "undeliverable") {
        // Receiver exists but is on free plan - still notify via email
        await sendEmail({
          to: receiver_email,
          from: getFromAddress("Referral Genealogy"),
          subject: `${senderName} wants to send you a referral`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e293b;">You have a pending referral</h2>
              <p><strong>${senderName}</strong> from <strong>${org.name}</strong> wants to send you a referral for <strong>${contactName}</strong>.</p>
              ${context_note ? `<p style="color: #64748b; font-style: italic;">"${context_note}"</p>` : ""}
              <p>To receive referrals on Referral Genealogy, you need a Pro or Team plan.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/billing"
                 style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Upgrade Your Plan
              </a>
            </div>
          `,
        });
      } else if (exchange.receiver_user_id) {
        // Receiver is a paid user - notify them of the incoming referral
        await sendEmail({
          to: receiver_email,
          from: getFromAddress("Referral Genealogy"),
          subject: `${senderName} sent you a referral for ${contactName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e293b;">New referral from your network</h2>
              <p><strong>${senderName}</strong> from <strong>${org.name}</strong> sent you a referral for <strong>${contactName}</strong>.</p>
              ${context_note ? `<p style="color: #64748b; font-style: italic;">"${context_note}"</p>` : ""}
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/referrals/exchange"
                 style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                View in Your Inbox
              </a>
            </div>
          `,
        });
      } else {
        // Receiver not on platform - send invitation email
        await sendEmail({
          to: receiver_email,
          from: getFromAddress("Referral Genealogy"),
          subject: `${senderName} sent you a referral on Referral Genealogy`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e293b;">You've been sent a referral</h2>
              <p><strong>${senderName}</strong> from <strong>${org.name}</strong> wants to send you a referral for <strong>${contactName}</strong>.</p>
              ${context_note ? `<p style="color: #64748b; font-style: italic;">"${context_note}"</p>` : ""}
              <p>Sign up for Referral Genealogy (Pro or Team plan) to receive this referral and start growing your network.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?ref=${exchange.token}"
                 style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Claim Your Referral
              </a>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      // Email failure shouldn't block the exchange creation
      console.error("Exchange notification email error:", emailErr);
    }

    return NextResponse.json({ success: true, exchange });
  } catch (err) {
    console.error("Exchange creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - List sent or received exchanges
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const direction = searchParams.get("direction") || "received"; // "sent" or "received"
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");

    let query = supabase
      .from("referral_exchanges")
      .select("*", { count: "exact" });

    if (direction === "sent") {
      query = query.eq("sender_user_id", user.id);
    } else {
      query = query.eq("receiver_user_id", user.id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For sent exchanges, fetch receiver profiles where available
    // For received exchanges, fetch sender profiles
    const exchanges = data || [];
    const userIds =
      direction === "sent"
        ? exchanges
            .map((e) => e.receiver_user_id)
            .filter((id): id is string => id !== null)
        : exchanges.map((e) => e.sender_user_id);

    const orgIds =
      direction === "received"
        ? exchanges.map((e) => e.sender_org_id)
        : [];

    let profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    let orgs: Record<string, { id: string; name: string }> = {};

    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      if (profileData) {
        profiles = Object.fromEntries(
          profileData.map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );
      }
    }

    if (orgIds.length > 0) {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", orgIds);
      if (orgData) {
        orgs = Object.fromEntries(orgData.map((o) => [o.id, { id: o.id, name: o.name }]));
      }
    }

    const enriched = exchanges.map((e) => ({
      ...e,
      sender_profile:
        direction === "received" ? profiles[e.sender_user_id] : undefined,
      sender_org:
        direction === "received" ? orgs[e.sender_org_id] : undefined,
      receiver_profile:
        direction === "sent" && e.receiver_user_id
          ? profiles[e.receiver_user_id]
          : undefined,
    }));

    return NextResponse.json({
      exchanges: enriched,
      totalCount: count || 0,
    });
  } catch (err) {
    console.error("Exchange list error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
