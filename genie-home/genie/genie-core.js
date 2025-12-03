/* genie-core.js
   Full state machine + internal Q&A engine for Cloudora Genie.

   Responsibilities:
   - Hybrid conversation manager (wizard + chat)
   - Intent detection (job / website / business / internal_policy)
   - Multi-step flows with i18n question keys
   - Internal Q&A answers using knowledge base
   - Prepare lead payloads and call createLead()
   - Hooks: onOutput(text), onUpdateUI(ctx)
*/

import { t } from "../i18n/t.js";
import { createLead } from "../api/supabase.js"; // currently a safe mock

// -----------------------------
// INTERNAL KNOWLEDGE BASE (seeded)
// -----------------------------
// This is the internal Q&A store. You can extend at runtime via registerKnowledge().
const INTERNAL_KB = {
  // Trial rules
  "trial.duration": "7 calendar days.",
  "trial.evaluation": "Evaluation based on work quality, punctuality, communication, and adherence to responsibilities.",
  "trial.payouts": "Minimum committed payouts per deliverable/hour/lead. See department-specific payouts for details.",
  "trial.transition": "After trial, candidate may be offered full-time, part-time, freelance, or collaborator roles with salary + incentives.",
  "trial.guardrails": "Cloudora reserves rights to validate work, disqualify misuse, and terminate trial for misconduct.",

  // Telecalling / Lead Generation
  "tele.domestic.trial_payout": "₹50 per qualified lead (domestic tele lead generation trial).",
  "tele.international.trial_payout": "₹50 per qualified lead (international tele lead generation trial).",
  "tele.posttrial.incentive": "1% commission on sales generated, stage-wise, starting after 150 qualified leads.",
  "tele.performance_bonus": "2% extra if sales exceed ₹10,00,000/month.",
  "tele.referral_bonus": "₹500 per successful referral.",

  // Chat / Support
  "chat.trial_payout_domestic": "₹40/hour (domestic).",
  "chat.trial_payout_international": "₹60/hour (international).",
  "chat.posttrial.incentive": "1% commission on sales generated through queries resolved (after 150 queries).",

  // Technical (dev) payouts (per deliverable)
  "dev.section": "Single section development: ₹300.",
  "dev.onepager": "One-pager website: ₹2,000.",
  "dev.landing": "Landing page with form/CTA: ₹2,500.",
  "dev.module": "Small feature/module: ₹1,000.",
  "dev.apk": "Mobile APK (basic): ₹3,000.",
  "dev.qa": "Testing/QA (single module): ₹500.",
  "dev.innovation_bonus": "Innovation bonus: minimum ₹1,000 for unique contributions.",
  "dev.referral": "Developer referral bonus: ₹1,000 per successful referral.",

  // Content & Creatives
  "content.blog": "Blog article (500–700 words): ₹200.",
  "content.longform": "Long-form article (1000+ words): ₹500.",
  "content.post": "Social media caption: ₹30 per post.",
  "content.poster": "Poster/banner (static): ₹200.",
  "content.shortvideo": "Edited short video (up to 1 min): ₹500.",
  "content.fullvideo": "Full explainer video (2–3 min): ₹1,500.",
  "content.referral": "Creative referral bonus: ₹500 per successful referral.",

  // Package prices (short)
  "package.trial.3day": "3-Day Trial — ₹999 (2 social posts + 1 ad setup + audit).",
  "package.trial.7day": "7-Day Trial — ₹1,999 (6 social posts + 1 video + 2 ad setups + audit).",
  "package.monthly.starter": "Starter Growth — ₹9,999/month.",
  "package.3month.growth": "3-Month Growth Booster — ₹24,999.",
  "package.6month.advanced": "6-Month Advanced Growth — ₹44,999.",
  "package.1year.dominator": "1-Year Brand Dominator — ₹99,999.",

  // Website packages
  "website.starter": "Starter Site — ₹14,999 (up to 5 pages).",
  "website.business": "Business Site — ₹29,999 (custom design).",
  "website.ecommerce": "E-commerce Site — ₹49,999.",

  // CRM basics
  "crm.lead_definition": "Qualified Lead: validated contact info, clear need, and consent to engage.",
  "crm.sale_definition": "Sale: closed deal with invoice generated and payment received by Cloudora.",
  "crm.support_query": "Support Query: a unique customer issue resolved to completion (no duplicates).",

  // Referral, payments etc
  "general.referral": "Referral bonuses vary by department (₹500–₹1,000 depending on role).",
  "general.performance_bonus": "Performance bonus: 2% extra above ₹10,00,000 sales/month for eligible teams."
};

// utility to register more knowledge at runtime
export function registerKnowledge(key, text) {
  INTERNAL_KB[key] = text;
}

// -----------------------------
// CATEGORY MAP (for pitches)
// -----------------------------
const CATEGORY_MAP = {
  "real-estate": { name: "Real Estate", pitchKey: "pitch.real_estate" },
  "restaurants": { name: "Restaurants & Cafes", pitchKey: "pitch.restaurants" },
  "local-services": { name: "Local Service Providers", pitchKey: "pitch.local_services" },
  "retail": { name: "Retail Shops", pitchKey: "pitch.retail" },
  "startups": { name: "Startups & Entrepreneurs", pitchKey: "pitch.startups" },
  "education": { name: "Education & Training", pitchKey: "pitch.education" },
  "ecommerce": { name: "E-commerce Sellers", pitchKey: "pitch.ecommerce" },
  "health": { name: "Health & Wellness", pitchKey: "pitch.health" },
  "automobile": { name: "Automobile", pitchKey: "pitch.automobile" },
  "travel": { name: "Travel", pitchKey: "pitch.travel" },
  "beauty": { name: "Beauty & Fashion", pitchKey: "pitch.beauty" },
  "finance": { name: "Financial Services", pitchKey: "pitch.finance" },
  "manufacturing": { name: "Manufacturers & Wholesalers", pitchKey: "pitch.manufacturing" },
  "freelancer": { name: "Freelancers", pitchKey: "pitch.freelancer" },
  "logistics": { name: "Logistics & Transport", pitchKey: "pitch.logistics" },
  "home-services": { name: "Home Services", pitchKey: "pitch.homeservices" }
};

// -----------------------------
// FLOW DEFINITIONS (keys map to i18n keys in /i18n/*.json)
// -----------------------------
const FLOWS = {
  website_flow: [
    { key: "flow.website.q1", field: "website_type" },
    { key: "flow.website.q2", field: "page_count" },
    { key: "flow.website.q3", field: "has_content" },
    { key: "flow.website.q4", field: "features" },
    { key: "flow.website.q5", field: "budget" },
    { key: "flow.website.q6", field: "contact" }
  ],
  business_flow: [
    { key: "flow.business.q1", field: "category" },
    { key: "flow.business.q2", field: "current_problem" },
    { key: "flow.business.q3", field: "service_interest" },
    { key: "flow.business.q4", field: "budget" },
    { key: "flow.business.q5", field: "contact" }
  ],
  job_flow: [
    { key: "flow.job.q1", field: "job_type" },
    { key: "flow.job.q2", field: "experience" },
    { key: "flow.job.q3", field: "availability" },
    { key: "flow.job.q4", field: "expected_salary" },
    { key: "flow.job.q5", field: "contact" }
  ]
};

// -----------------------------
// INTENT DETECTION
// -----------------------------
function detectIntent(text = "") {
  const s = (text || "").toLowerCase();

  // internal policy keywords
  const internalKeywords = [
    "payout", "salary", "incentive", "trial", "referral", "commission",
    "policy", "procedure", "guardrail", "compensation", "trial rules", "offer letter",
    "how to apply", "application", "applicant", "kyc", "agreement", "terms", "tnc"
  ];
  if (internalKeywords.some(w => s.includes(w))) {
    return { intent: "internal_policy_mode" };
  }

  // job detection
  const jobWords = ["job", "work", "vacancy", "apply", "opportunity", "intern", "hiring"];
  if (jobWords.some(w => s.includes(w))) return { intent: "job_flow" };

  // website detection
  const websiteWords = ["website", "site", "landing", "ecommerce", "store", "shop", "domain"];
  if (websiteWords.some(w => s.includes(w))) return { intent: "website_flow" };

  // business detection
  const bizWords = ["customer", "lead", "sales", "marketing", "grow", "clients", "business", "ads"];
  if (bizWords.some(w => s.includes(w))) return { intent: "business_flow" };

  // category detection shortcuts (e.g., user says "real estate")
  const catWords = Object.values(CATEGORY_MAP).map(c => c.name.toLowerCase());
  for (const c of catWords) {
    if (s.includes(c)) return { intent: "business_flow" };
  }

  return { intent: "idle" }; // fallback
}

// -----------------------------
// Core exported object
// -----------------------------
export const genieCore = {
  mode: "idle",           // idle | website_flow | business_flow | job_flow | internal_policy_mode
  stepIndex: 0,
  data: {},
  onOutput: null,         // callback(text)
  onUpdateUI: null,       // callback(ctx)
  init(opts = {}) {
    this.onOutput = opts.onOutput || null;
    this.onUpdateUI = opts.onUpdateUI || null;
    console.log("Genie core initialized");
  },

  // send text to UI + TTS
  sendOutput(text) {
    if (!text) return;
    // prefer i18n if key passed (t will return key if not found)
    const out = typeof text === "string" ? text : String(text);
    if (this.onOutput) this.onOutput(out);
    else console.log("Genie:", out);
  },

  // UI updater
  updateUI(ctx) {
    if (this.onUpdateUI) this.onUpdateUI(ctx);
  },

  // start a named flow manually (used by buttons)
  startFlow(flowName) {
    if (!FLOWS[flowName]) {
      this.mode = "idle";
      this.stepIndex = 0;
      this.data = {};
      this.sendOutput(t("genie.fallback") || "Okay, how can I support you further?");
      return;
    }
    this.mode = flowName;
    this.stepIndex = 0;
    this.data = { flow: flowName, created_at: new Date().toISOString() };
    // Immediately ask the first question
    this.sendCurrentQuestion();
  },

  // send question for the current step
  sendCurrentQuestion() {
    const flow = FLOWS[this.mode];
    if (!flow) {
      this.sendOutput(t("genie.fallback"));
      return;
    }
    if (this.stepIndex >= flow.length) {
      // finish
      this.finishFlow();
      return;
    }
    const step = flow[this.stepIndex];
    const question = t(step.key) || step.key;
    this.sendOutput(question);
    this.updateUI({ mode: this.mode, stepIndex: this.stepIndex, step });
  },

  // handle input from user (voice/text/button)
  async handleUserInput(rawText) {
    const text = (rawText || "").trim();
    // If user typed nothing, ignore
    if (!text && this.mode === "idle") {
      const greet = t("genie.welcome") || "Hello! How can I help you today?";
      this.sendOutput(greet);
      return greet;
    }

    // If we are in internal policy mode: answer directly
    if (this.mode === "internal_policy_mode") {
      const answer = this._answerInternal(text);
      this.sendOutput(answer);
      // remain in internal policy mode until user says "back" or "exit"
      if (/(back|exit|done|thanks|thank you)/i.test(text)) {
        this.mode = "idle";
        this.stepIndex = 0;
        this.data = {};
      }
      return answer;
    }

    // If currently idle: detect intent and possibly start a flow or answer knowledge
    if (this.mode === "idle") {
      const detected = detectIntent(text);
      if (detected.intent === "internal_policy_mode") {
        this.mode = "internal_policy_mode";
        // optional immediate answer if text contains a specific key-like question
        const internalAnswer = this._answerInternal(text);
        this.sendOutput(internalAnswer);
        return internalAnswer;
      }
      if (detected.intent && detected.intent !== "idle") {
        // start the detected flow
        this.startFlow(detected.intent);
        // If the user already provided an answer relevant to the first question,
        // record it as the first answer and advance.
        // We'll do a small heuristic: if first question expects category/website etc,
        // and the text contains e.g., "website", "real estate", "I need a website for cafe"
        const flow = FLOWS[detected.intent];
        if (flow && flow[0]) {
          // heuristics: if raw text contains keywords related to the first field, use it
          const firstField = flow[0].field;
          // store as first answer when sensible
          this.data[firstField] = text;
          this.stepIndex = 1; // move to next
          // ask next question
          this.sendCurrentQuestion();
        }
        return "";
      } else {
        // idle and no intent: generic reply
        const reply = t("genie.welcome") || "Hello! How can I help you today?";
        this.sendOutput(reply);
        return reply;
      }
    }

    // If inside a flow (website, business, job)
    const flow = FLOWS[this.mode];
    if (!flow) {
      this.sendOutput(t("genie.fallback"));
      this.mode = "idle";
      return t("genie.fallback");
    }

    // store current step
    const curStep = flow[this.stepIndex];
    if (curStep && curStep.field) {
      this.data[curStep.field] = text;
    }
    this.stepIndex++;

    // Ask next or finish
    if (this.stepIndex < flow.length) {
      this.sendCurrentQuestion();
      return "";
    } else {
      await this.finishFlow();
      return "";
    }
  },

  // finalize the flow: prepare lead, try to save, give summary
  async finishFlow() {
    try {
      // prepare payload
      const lead = this._prepareLeadPayload();
      // call createLead (mock or real)
      const res = await createLead(lead);
      // success
      const successMsg = t("genie.lead_created") || "Thanks — I have captured your request. Our expert will contact you soon.";
      const summary = this._leadSummaryText(lead);
      this.sendOutput(`${successMsg} ${summary}`);
    } catch (err) {
      console.error("finishFlow error:", err);
      this.sendOutput(t("genie.lead_error") || "Sorry, something went wrong while saving your request. Please try again.");
    } finally {
      // reset state
      this.mode = "idle";
      this.stepIndex = 0;
      this.data = {};
      this.updateUI({ mode: this.mode });
    }
  },

  // prepare a standard lead payload based on collected data
  _prepareLeadPayload() {
    const payload = {
      full_name: this.data.contact || "",
      phone: this._extractPhone(this.data.contact || ""),
      email: this._extractEmail(this.data.contact || ""),
      source: "genie",
      created_at: new Date().toISOString(),
      service_interest: "",
      metadata: {}
    };

    const flow = this.data.flow || this.mode;

    if (flow === "website_flow" || this.mode === "website_flow") {
      payload.service_interest = "Website";
      payload.metadata = {
        website_type: this.data.website_type || "",
        pages: this.data.page_count || "",
        has_content: this.data.has_content || "",
        features: this.data.features || "",
        budget: this.data.budget || ""
      };
    } else if (flow === "business_flow" || this.mode === "business_flow") {
      payload.service_interest = this.data.service_interest || "Business Growth";
      payload.metadata = {
        category: this.data.category || "",
        problem: this.data.current_problem || "",
        service_interest: this.data.service_interest || "",
        budget: this.data.budget || ""
      };
    } else if (flow === "job_flow" || this.mode === "job_flow") {
      payload.service_interest = "Job Application";
      payload.metadata = {
        job_type: this.data.job_type || "",
        experience: this.data.experience || "",
        availability: this.data.availability || "",
        expected_salary: this.data.expected_salary || ""
      };
    } else {
      payload.metadata = this.data;
    }

    return payload;
  },

  _leadSummaryText(payload) {
    if (payload.service_interest === "Website") {
      return ` (${payload.metadata.website_type || "N/A"}, ${payload.metadata.pages || "N/A"} pages, Budget: ${payload.metadata.budget || "N/A"})`;
    } else if (payload.service_interest === "Job Application") {
      return ` (${payload.metadata.job_type || "N/A"}, Experience: ${payload.metadata.experience || "N/A"})`;
    } else {
      return ` (${payload.service_interest || "General"}, ${payload.metadata.category || ""})`;
    }
  },

  // very small helpers to parse contact info heuristically
  _extractEmail(text) {
    const m = (text || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return m ? m[0] : "";
  },
  _extractPhone(text) {
    const m = (text || "").match(/(\+?\d[\d\-\s]{6,}\d)/);
    return m ? m[0].replace(/\s+/g, "") : "";
  },

  // INTERNAL Q&A ANSWERER (uses INTERNAL_KB, t() fallback)
  _answerInternal(question) {
    const q = (question || "").toLowerCase();

    // direct key match attempts (e.g., "what is telecalling trial payout")
    // check for known key words and return KB entries
    const rules = [
      { keys: ["telecaller", "lead", "trial", "payout"], key: "tele.domestic.trial_payout" },
      { keys: ["tele", "international", "trial", "payout"], key: "tele.international.trial_payout" },
      { keys: ["tele", "incentive", "commission"], key: "tele.posttrial.incentive" },
      { keys: ["developer", "one-pager", "one pager", "onepage", "one page"], key: "dev.onepager" },
      { keys: ["developer", "section", "single section"], key: "dev.section" },
      { keys: ["creative", "blog", "article", "creative bonus"], key: "content.blog" },
      { keys: ["trial duration", "7 days", "trial period"], key: "trial.duration" },
      { keys: ["trial guardrail", "guardrail", "misconduct"], key: "trial.guardrails" },
      { keys: ["referral bonus", "referral"], key: "general.referral" },
      { keys: ["package 7 day", "7 day trial"], key: "package.trial.7day" },
      { keys: ["website starter", "starter site"], key: "website.starter" },
      { keys: ["crm lead", "qualified lead"], key: "crm.lead_definition" }
    ];

    for (const rule of rules) {
      if (rule.keys.every(k => rule.keys.some(word => q.includes(word)))) {
        // (we keep the attempt simpler: search if ANY key appears)
      }
    }

    // simpler matching strategy: check presence of single keywords mapped to KB
    const keywordMap = {
      "telecaller": "tele.domestic.trial_payout",
      "tele": "tele.domestic.trial_payout",
      "lead payout": "tele.domestic.trial_payout",
      "developer": "dev.onepager",
      "one-pager": "dev.onepager",
      "trial": "trial.duration",
      "trial rules": "trial.evaluation",
      "referral": "general.referral",
      "performance bonus": "general.performance_bonus",
      "blog article": "content.blog",
      "starter site": "website.starter",
      "website price": "website.business",
      "qualified lead": "crm.lead_definition",
      "agreement": "trial.guardrails",
      "payout": "tele.domestic.trial_payout"
    };

    for (const k in keywordMap) {
      if (q.includes(k)) {
        const ansKey = keywordMap[k];
        const txt = INTERNAL_KB[ansKey] || t(ansKey) || INTERNAL_KB[ansKey];
        if (txt) return txt;
      }
    }

    // If question mentions a package name exactly
    if (q.includes("3-day") || q.includes("3 day")) return INTERNAL_KB["package.trial.3day"];
    if (q.includes("7-day") || q.includes("7 day")) return INTERNAL_KB["package.trial.7day"];
    if (q.includes("monthly starter") || q.includes("starter growth")) return INTERNAL_KB["package.monthly.starter"];

    // fallback: try to find any KB entry containing any word from question
    const tokens = q.split(/\W+/).filter(Boolean);
    for (const key in INTERNAL_KB) {
      for (const tok of tokens) {
        if (String(INTERNAL_KB[key]).toLowerCase().includes(tok)) {
          return INTERNAL_KB[key];
        }
      }
    }

    // final fallback: generic help with pointer to admin
    return "I don't have an exact answer right now. I can forward this to HR/Admin or show the trial offer letter. Would you like that?";
  },

  // quick pitch function
  pitchCategory(catKey) {
    const info = CATEGORY_MAP[catKey];
    if (!info) {
      this.sendOutput(t("genie.fallback") || "Sorry, I don't have that category.");
      return;
    }
    const pitch = t(info.pitchKey) || `We help ${info.name} with leads, marketing, and staffing.`;
    this.sendOutput(pitch);
  },

  // allow external modules to add more internal KB entries at runtime
  registerKnowledge,

  // utility: quick reset
  reset() {
    this.mode = "idle";
    this.stepIndex = 0;
    this.data = {};
    this.updateUI({ mode: this.mode });
  }
};
