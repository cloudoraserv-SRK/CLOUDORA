import { supabase } from "../api/supabase.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function detectProduct(requirement) {
  const text = normalizeText(requirement).toLowerCase();

  if (!text) return "general";
  if (text.includes("blockchain") || text.includes("smart contract") || text.includes("web3")) {
    return "blockchain";
  }
  if (text.includes("seo") || text.includes("ads") || text.includes("marketing") || text.includes("social")) {
    return "digital_marketing";
  }
  if (text.includes("app") || text.includes("software") || text.includes("crm") || text.includes("dashboard")) {
    return "app_software";
  }
  if (text.includes("automation") || text.includes("ai") || text.includes("chatbot")) {
    return "automation_ai";
  }
  if (text.includes("website") || text.includes("web design") || text.includes("landing page")) {
    return "website";
  }
  if (text.includes("brand") || text.includes("logo") || text.includes("video")) {
    return "branding_media";
  }

  return "general";
}

function normalizeCountry(value) {
  const country = normalizeText(value);
  if (!country) return "IN";
  if (country.toLowerCase() === "india") return "IN";
  if (country.toLowerCase() === "united states") return "US";
  if (country.toLowerCase() === "uae") return "AE";
  return country.toUpperCase();
}

function getServiceRouting(product, country) {
  const leadDepartment = pickLeadDepartment(country);

  const routing = {
    website: {
      leadDepartment,
      salesDepartment: country === "IN" ? "tele_sales_domestic" : "tele_sales_international",
      internalTeam: "it_delivery",
    },
    app_software: {
      leadDepartment,
      salesDepartment: country === "IN" ? "tele_sales_domestic" : "tele_sales_international",
      internalTeam: "it_delivery",
    },
    digital_marketing: {
      leadDepartment,
      salesDepartment: country === "IN" ? "tele_sales_domestic" : "tele_sales_international",
      internalTeam: "digital_marketing",
    },
    automation_ai: {
      leadDepartment,
      salesDepartment: country === "IN" ? "tele_sales_domestic" : "tele_sales_international",
      internalTeam: "it_delivery",
    },
    blockchain: {
      leadDepartment,
      salesDepartment: country === "IN" ? "tele_sales_domestic" : "tele_sales_international",
      internalTeam: "it_delivery",
    },
    branding_media: {
      leadDepartment,
      salesDepartment: country === "IN" ? "tele_sales_domestic" : "tele_sales_international",
      internalTeam: "digital_marketing",
    },
    general: {
      leadDepartment,
      salesDepartment: country === "IN" ? "tele_sales_domestic" : "tele_sales_international",
      internalTeam: "management",
    },
  };

  return routing[product] || routing.general;
}

function pickLeadDepartment(country) {
  return normalizeText(country).toUpperCase() === "IN"
    ? "tele_lead_domestic"
    : "tele_lead_international";
}

async function getAvailableTelecaller(country) {
  const preferredDepartment = pickLeadDepartment(country);

  const { data, error } = await supabase
    .from("employees")
    .select("id, department, status, created_at")
    .eq("department", preferredDepartment)
    .in("status", ["active", "available"])
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    return { employeeId: null, error };
  }

  if (data && data.length > 0) {
    return { employeeId: data[0].id, error: null };
  }

  const fallback = await supabase
    .from("employees")
    .select("id, department, status, created_at")
    .in("department", ["tele_lead_domestic", "tele_lead_international"])
    .in("status", ["active", "available"])
    .order("created_at", { ascending: true })
    .limit(1);

  return {
    employeeId: fallback.data?.[0]?.id || null,
    error: fallback.error || null,
  };
}

export async function createPublicEnquiry(payload) {
  const name = normalizeText(payload.name);
  const email = normalizeText(payload.email);
  const phone = normalizeText(payload.phone);
  const requirement = normalizeText(payload.requirement);

  if (!name || (!email && !phone) || !requirement) {
    return {
      ok: false,
      status: 400,
      error: "name, requirement, and either email or phone are required",
    };
  }

  const country = normalizeCountry(payload.country || "IN");
  const product = normalizeText(payload.product) || detectProduct(requirement);
  const routing = getServiceRouting(product, country);

  const leadPayload = {
    name,
    email: email || null,
    phone: phone || null,
    city: normalizeText(payload.city) || null,
    country,
    business_name: normalizeText(payload.business_name) || null,
    requirement,
    budget_range: normalizeText(payload.budget_range) || null,
    timeline: normalizeText(payload.timeline) || null,
    preferred_contact: normalizeText(payload.preferred_contact) || "call",
    lead_type: normalizeText(payload.lead_type) || "business",
    source: normalizeText(payload.source) || "website_form",
    department: routing.salesDepartment,
    interest: product,
    product,
    service_category: product,
    target_team: routing.internalTeam,
    status: "new",
    created_at: new Date().toISOString(),
  };

  const { data: insertedLead, error: leadError } = await supabase
    .from("leads")
    .insert([leadPayload])
    .select("id, country, product")
    .single();

  if (leadError) {
    return {
      ok: false,
      status: 500,
      error: leadError.message || "Lead creation failed",
    };
  }

  const { employeeId, error: assignError } = await getAvailableTelecaller(country);

  if (assignError) {
    return {
      ok: false,
      status: 500,
      error: assignError.message || "Lead assignment failed",
    };
  }

  const taskPayload = {
    employee_id: employeeId,
    task_type: "call",
    lead_id: insertedLead.id,
    status: employeeId ? "assigned" : "unassigned",
    country,
    product: insertedLead.product || product,
    department: routing.leadDepartment,
    shift: "general",
    created_at: new Date().toISOString(),
  };

  const { error: taskError } = await supabase.from("employee_tasks").insert([taskPayload]);

  if (taskError) {
    return {
      ok: false,
      status: 500,
      error: taskError.message || "Task creation failed",
    };
  }

  return {
    ok: true,
    status: 200,
    lead_id: insertedLead.id,
    assigned_to: employeeId,
    task_status: taskPayload.status,
    product,
    routing,
  };
}
