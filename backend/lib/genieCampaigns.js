import OpenAI from "openai";
import { supabase } from "./supabaseClient.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function fetchBlastContacts({
  source = "scraped",
  limit = 25,
  search = "",
  city = "",
  category = ""
} = {}) {
  if (source === "scraped") {
    let query = supabase
      .from("scraped_leads")
      .select("id, name, email, phone, address, website, category, city")
      .not("email", "is", null)
      .limit(limit);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    if (city) query = query.ilike("city", `%${city}%`);
    if (category) query = query.ilike("category", `%${category}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).filter((row) => row.email);
  }

  if (source === "leads") {
    let query = supabase
      .from("leads")
      .select("id, name, email, phone, company, requirement, country")
      .not("email", "is", null)
      .limit(limit);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).filter((row) => row.email);
  }

  return [];
}

export async function generateBlastContent({
  businessProfile = {},
  objective = "",
  tone = "",
  offer = "",
  cta = "",
  platformContext = ""
} = {}) {
  const prompt = `
Create a cold outreach email campaign for a business.

Business profile:
${JSON.stringify(businessProfile, null, 2)}

Campaign objective: ${objective || "Generate interest and qualified replies"}
Offer: ${offer || "Cloudora services"}
Tone: ${tone || "Professional and persuasive"}
CTA: ${cta || "Reply to book a quick discussion"}
Platform context: ${platformContext || "Email outreach campaign"}

Return valid JSON only with this shape:
{
  "subject": "short subject line",
  "previewText": "short preview text",
  "html": "<html email body with placeholders like {{name}} if useful>",
  "text": "plain text fallback",
  "followUpSubject": "follow-up subject",
  "followUpText": "follow-up email body"
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a growth marketer and email campaign strategist. Return valid JSON only."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const raw = response.choices[0]?.message?.content || "{}";
  return JSON.parse(raw);
}

export async function dispatchViaMlBlaster({
  mlblasterUrl,
  contacts = [],
  campaign,
  senderProfile = {}
}) {
  const baseUrl = String(
    mlblasterUrl || process.env.MLBLASTER_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  const results = [];
  for (const contact of contacts) {
    const body = {
      to: contact.email,
      subject: campaign.subject,
      html: campaign.html,
      contact: {
        ...contact,
        business_name: senderProfile.businessName || ""
      }
    };

    const response = await fetch(`${baseUrl}/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    results.push({
      email: contact.email,
      success: Boolean(payload.success),
      payload
    });
  }

  return {
    ok: true,
    baseUrl,
    sent: results.filter((item) => item.success).length,
    failed: results.filter((item) => !item.success).length,
    results
  };
}

export function normalizeCampaignRequest(payload = {}) {
  return {
    source: payload.source || "scraped",
    limit: Number(payload.limit || 10),
    search: String(payload.search || "").trim(),
    city: String(payload.city || "").trim(),
    category: String(payload.category || "").trim(),
    objective: String(payload.objective || "").trim(),
    offer: String(payload.offer || "").trim(),
    tone: String(payload.tone || "").trim(),
    cta: String(payload.cta || "").trim(),
    platformContext: String(payload.platformContext || "").trim(),
    mlblasterUrl: String(payload.mlblasterUrl || "").trim(),
    dispatch: Boolean(payload.dispatch),
    businessProfile: {
      businessName: String(payload.businessProfile?.businessName || "").trim(),
      ownerName: String(payload.businessProfile?.ownerName || "").trim(),
      industry: String(payload.businessProfile?.industry || "").trim(),
      targetAudience: String(payload.businessProfile?.targetAudience || "").trim(),
      goals: String(payload.businessProfile?.goals || "").trim(),
      platforms: normalizeArray(payload.businessProfile?.platforms),
      tone: String(payload.businessProfile?.tone || "").trim(),
      postingFrequency: String(payload.businessProfile?.postingFrequency || "").trim(),
      language: String(payload.businessProfile?.language || "").trim()
    }
  };
}
