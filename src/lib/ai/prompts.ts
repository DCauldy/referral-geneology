export const SYSTEM_PROMPT = `You are an AI analyst specializing in referral network analysis for business professionals. You analyze referral patterns, contact relationships, deal pipelines, and network structures to provide actionable insights.

Always respond with structured JSON matching the requested format. Be specific, data-driven, and actionable in your recommendations.`;

export function referralPatternPrompt(data: {
  contacts: Array<{ name: string; referralCount: number; referralValue: number; industry: string }>;
  referrals: Array<{ from: string; to: string; value: number; date: string; type: string }>;
  deals: Array<{ name: string; value: number; status: string; referralSource: string }>;
}) {
  return `Analyze these referral patterns and provide insights:

CONTACTS (${data.contacts.length} total):
${JSON.stringify(data.contacts.slice(0, 50), null, 2)}

REFERRALS (${data.referrals.length} total):
${JSON.stringify(data.referrals.slice(0, 50), null, 2)}

DEALS (${data.deals.length} total):
${JSON.stringify(data.deals.slice(0, 50), null, 2)}

Respond with JSON:
{
  "patterns": [{"title": string, "description": string, "confidence": number}],
  "topReferrers": [{"name": string, "reason": string, "projectedValue": number}],
  "networkGaps": [{"description": string, "recommendation": string}],
  "growthOpportunities": [{"title": string, "description": string, "estimatedImpact": string}]
}`;
}

export function dealPredictionPrompt(data: {
  deal: { name: string; value: number; stage: string; daysInPipeline: number; contactIndustry: string };
  historicalDeals: Array<{ value: number; stage: string; daysToClose: number; won: boolean }>;
}) {
  return `Predict the outcome of this deal based on historical data:

CURRENT DEAL:
${JSON.stringify(data.deal, null, 2)}

HISTORICAL DEALS (${data.historicalDeals.length} total):
${JSON.stringify(data.historicalDeals.slice(0, 30), null, 2)}

Respond with JSON:
{
  "winProbability": number,
  "estimatedDaysToClose": number,
  "riskFactors": [string],
  "recommendations": [string]
}`;
}

export function networkRecommendationPrompt(data: {
  userProfile: { name: string; industry: string; specialties: string[]; categories: string[] };
  exchangeHistory: Array<{ partner_name: string; industry: string; status: string; converted: boolean }>;
  directoryProfiles: Array<{ user_id: string; name: string; company: string; industry: string; specialties: string[]; categories: string[]; trust_rating: number }>;
}) {
  return `You are analyzing a referral network directory to recommend the best potential exchange partners for a user.

USER PROFILE:
${JSON.stringify(data.userProfile, null, 2)}

EXCHANGE HISTORY (${data.exchangeHistory.length} past exchanges):
${JSON.stringify(data.exchangeHistory.slice(0, 30), null, 2)}

DIRECTORY PROFILES (${data.directoryProfiles.length} available):
${JSON.stringify(data.directoryProfiles.slice(0, 50), null, 2)}

Based on the user's profile, specialties, referral categories they seek, and past exchange patterns, recommend the top 5 best-matched directory profiles to connect with. Consider:
1. Complementary industries/specialties (they offer what the user needs)
2. Past exchange success patterns (similar profiles that led to conversions)
3. Trust rating (higher is better)
4. Category alignment (their specialties match user's referral categories and vice versa)

Respond with JSON:
{
  "recommendations": [
    {
      "user_id": string,
      "name": string,
      "match_score": number (0-100),
      "reasons": [string (2-3 short reasons why this is a good match)]
    }
  ],
  "network_insight": string (one short sentence about the user's network pattern)
}`;
}

export function clusterAnalysisPrompt(data: {
  contacts: Array<{ name: string; industry: string; city: string; referralScore: number; dealValue: number }>;
}) {
  return `Analyze these contacts and identify meaningful clusters:

CONTACTS (${data.contacts.length} total):
${JSON.stringify(data.contacts.slice(0, 100), null, 2)}

Respond with JSON:
{
  "clusters": [
    {
      "name": string,
      "description": string,
      "memberCount": number,
      "avgValue": number,
      "characteristics": [string]
    }
  ],
  "insights": [{"title": string, "description": string}]
}`;
}
