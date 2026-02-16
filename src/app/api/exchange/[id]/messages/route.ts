import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isImpersonating } from "@/lib/admin/impersonation";

// GET - Fetch messages for an exchange thread
export async function GET(
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

    // Verify user is a party to this exchange
    const { data: exchange, error: exchangeError } = await supabase
      .from("referral_exchanges")
      .select("id, sender_user_id, receiver_user_id, status")
      .eq("id", id)
      .single();

    if (exchangeError || !exchange) {
      return NextResponse.json(
        { error: "Exchange not found" },
        { status: 404 }
      );
    }

    if (
      exchange.sender_user_id !== user.id &&
      exchange.receiver_user_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Not authorized to view this exchange" },
        { status: 403 }
      );
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from("exchange_messages")
      .select("*")
      .eq("exchange_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json(
        { error: msgError.message },
        { status: 500 }
      );
    }

    // Enrich with sender profiles
    const userIds = [...new Set((messages || []).map((m) => m.sender_user_id))];
    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profiles) {
        profileMap = Object.fromEntries(
          profiles.map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );
      }
    }

    const enriched = (messages || []).map((m) => ({
      ...m,
      sender_profile: profileMap[m.sender_user_id] || null,
    }));

    return NextResponse.json({ messages: enriched });
  } catch (err) {
    console.error("Exchange messages GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Send a message in an exchange thread
export async function POST(
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

    // Check impersonation
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("active_org_id")
      .eq("id", user.id)
      .single();

    if (profile?.active_org_id) {
      const impersonating = await isImpersonating(
        supabase,
        user.id,
        profile.active_org_id
      );
      if (impersonating) {
        return NextResponse.json(
          { error: "Cannot send messages while impersonating" },
          { status: 403 }
        );
      }
    }

    // Verify exchange exists, is accepted, and user is a party
    const { data: exchange, error: exchangeError } = await supabase
      .from("referral_exchanges")
      .select("id, sender_user_id, receiver_user_id, status")
      .eq("id", id)
      .single();

    if (exchangeError || !exchange) {
      return NextResponse.json(
        { error: "Exchange not found" },
        { status: 404 }
      );
    }

    if (exchange.status !== "accepted") {
      return NextResponse.json(
        { error: "Messages can only be sent on accepted exchanges" },
        { status: 400 }
      );
    }

    if (
      exchange.sender_user_id !== user.id &&
      exchange.receiver_user_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Not authorized to message on this exchange" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message must be 2000 characters or less" },
        { status: 400 }
      );
    }

    const { data: newMessage, error: insertError } = await supabase
      .from("exchange_messages")
      .insert({
        exchange_id: id,
        sender_user_id: user.id,
        message: message.trim(),
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: newMessage });
  } catch (err) {
    console.error("Exchange messages POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
