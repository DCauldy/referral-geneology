import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * When a deal is won, auto-link it to any unlinked referral for the deal's contact
 * and mark the referral as "converted". This triggers the database's
 * recalculate_contact_referral_metrics() function, which updates:
 * - referral.deal_id → the won deal
 * - referral.status → "converted"
 * - referral.referral_value → deal value
 * - contact.lifetime_referral_value (via trigger)
 * - contact.referral_score (via trigger)
 */
export async function linkWonDealToReferrals(
  supabase: SupabaseClient,
  dealId: string,
  orgId: string
) {
  // Get the deal's contact and value
  const { data: deal } = await supabase
    .from("deals")
    .select("contact_id, value")
    .eq("id", dealId)
    .single();

  if (!deal?.contact_id) return;

  // Find referrals where this contact is the referred person and no deal is linked yet
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id")
    .eq("org_id", orgId)
    .eq("referred_id", deal.contact_id)
    .is("deal_id", null)
    .order("referral_date", { ascending: false })
    .limit(1);

  if (!referrals || referrals.length === 0) {
    // No unlinked referrals — check if there's already a linked one and just update it
    const { data: existingLinked } = await supabase
      .from("referrals")
      .select("id")
      .eq("org_id", orgId)
      .eq("deal_id", dealId)
      .limit(1);

    if (existingLinked && existingLinked.length > 0) {
      // Update the already-linked referral status and value
      await supabase
        .from("referrals")
        .update({
          status: "converted",
          referral_value: deal.value ?? 0,
        })
        .eq("id", existingLinked[0].id);
    }
    return;
  }

  // Link the most recent unlinked referral to this deal
  await supabase
    .from("referrals")
    .update({
      deal_id: dealId,
      status: "converted",
      referral_value: deal.value ?? 0,
    })
    .eq("id", referrals[0].id);
}
