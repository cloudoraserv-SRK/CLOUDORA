// genie-core.js — core state machine + flow manager (named export)
import { t } from "../i18n/t.js";
import { createLead } from "../api/supabase.js"; // simple function to insert lead
// small mapping of categories -> pitch lines (pulled from memory)
const CATEGORY_MAP = {
  "real-estate": { name: "Real Estate", pitchKey: "pitch.real_estate" },
  "restaurants": { name: "Restaurants & Cafes", pitchKey: "pitch.restaurants" },
  "local-services": { name: "Local Service Providers", pitchKey: "pitch.local_services" },
  "retail": { name: "Retail Shops", pitchKey: "pitch.retail" },
  "startup": { name: "Startups & Entrepreneurs", pitchKey: "pitch.startups" },
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

// helper: simple intent detection based on keywords
function detectIntent(text = "") {
  const s = text.toLowerCase();
  // job-related words
  const jobWords = ["job", "work", "hire me", "vacancy", "apply", "opportunity", "intern"];
  if (jobWords.some(w => s.includes(w))) return { intent: "job_flow" };

  // website words
  const websiteWords = ["website", "site", "landing", "ecommerce", "store", "shop"];
  if (websiteWords.some(w => s.includes(w))) return { intent: "website_flow" };

  // business / lead words
  const bizWords = ["customer", "lead", "sales", "marketing", "grow", "clients", "business"];
  if (bizWords.some(w => s.includes(w))) return { intent: "business_flow" };

  // fallback
  return { intent: "idle" };
}

// Flow definitions: each step has a key (i18n path or plain text) and field name
const FLOWS = {
  website_flow: [
    { key: "flow.website.q1", field: "website_type" },        // e.g., Business / E-commerce / Portfolio
    { key: "flow.website.q2", field: "page_count" },         // how many pages
    { key: "flow.website.q3", field: "has_content" },        // do you have content
    { key: "flow.website.q4", field: "features" },           // e.g., payment, booking
    { key: "flow.website.q5", field: "budget" },             // budget
    { key: "flow.website.q6", field: "contact" }             // collect contact details
  ],
  business_flow: [
    { key: "flow.business.q1", field: "category" },          // which category
    { key: "flow.business.q2", field: "current_problem" },   // problem/pain
    { key: "flow.business.q3", field: "service_interest" },  // what service do they want
    { key: "flow.business.q4", field: "budget" },           // budget
    { key: "flow.business.q5", field: "contact" }           // contact
  ],
  job_flow: [
    { key: "flow.job.q1", field: "job_type" },               // telecalling / technical / creative
    { key: "flow.job.q2", field: "experience" },             // experience
    { key: "flow.job.q3", field: "availability" },           // full/part
    { key: "flow.job.q4", field: "expected_salary" },        // expected income
    { key: "flow.job.q5", field: "contact" }                 // contact
  ]
};

// stateful object exported
export const genieCore = {
  mode: "idle",           // current mode (idle, website_flow, business_flow, job_flow)
  stepIndex: 0,           // index in current flow
  data: {},               // collected data for current flow
  onOutput: null,         // callback: (text) => {} to speak / show
  onUpdateUI: null,       // callback to update UI (e.g., show steps)
  init(opts = {}) {
    if (opts.onOutput) this.onOutput = opts.onOutput;
    if (opts.onUpdateUI) this.onUpdateUI = opts.onUpdateUI;
    console.log("Genie core initialized");
  },

  // start a flow explicitly (from button click)
  startFlow(flowName) {
    if (!FLOWS[flowName]) {
      this.sendOutput(t("genie.fallback") || "Okay, how can I help?");
      return;
    }
    this.mode = flowName;
    this.stepIndex = 0;
    this.data = { flow: flowName, created_at: new Date().toISOString() };
    this.sendCurrentQuestion();
  },

  // send the current question to UI
  sendCurrentQuestion() {
    const flow = FLOWS[this.mode];
    if (!flow) return this.sendOutput(t("genie.fallback"));

    if (this.stepIndex >= flow.length) {
      // flow complete
      this.finishFlow();
      return;
    }
    const step = flow[this.stepIndex];
    // t(key) will fallback to key if not found
    const q = t(step.key) || step.key;
    this.sendOutput(q);
    if (this.onUpdateUI) this.onUpdateUI({ mode: this.mode, stepIndex: this.stepIndex, step });
  },

  // handle an incoming user answer (string)
  async handleUserInput(text) {
    text = (text || "").trim();
    // if idle: detect intent and auto-start flow if needed
    if (this.mode === "idle") {
      const detected = detectIntent(text);
      if (detected.intent && detected.intent !== "idle") {
        // start that flow, but if text contains an immediate answer, pass it as first answer
        this.startFlow(detected.intent);
        // if user already gave an answer that matches the first question, process it immediately
        // small delay to allow UI to show question
        return "";
      } else {
        // small generic reply
        const reply = t("genie.welcome") || "Hello! How can I help you today?";
        this.sendOutput(reply);
        return reply;
      }
    }

    // if inside a flow, store the answer and move to next step
    const flow = FLOWS[this.mode];
    if (!flow) {
      this.sendOutput(t("genie.fallback"));
      return t("genie.fallback");
    }
    const step = flow[this.stepIndex];
    if (step && step.field) {
      // store answer
      this.data[step.field] = text || "";
    }
    this.stepIndex++;
    if (this.stepIndex < flow.length) {
      this.sendCurrentQuestion();
      return "";
    } else {
      // finalize
      await this.finishFlow();
      return "";
    }
  },

  // finalize the current flow: prepare summary, create lead, give next steps
  async finishFlow() {
    // create lead summary text and push to Supabase (via createLead)
    try {
      // transform data to lead object
      const leadPayload = this._prepareLeadPayload();
      // attempt to save (createLead returns { ok: true } or throws)
      const res = await createLead(leadPayload);
      // success message
      const successMsg = t("genie.lead_created") || "Thanks — I have captured your request. Our expert will contact you soon.";
      // include small summary
      const summary = this._leadSummaryText(leadPayload);
      this.sendOutput(`${successMsg}\n${summary}`);
    } catch (err) {
      console.error("Lead creation failed", err);
      this.sendOutput(t("genie.lead_error") || "Sorry, something went wrong while saving your request. Please try again.");
    } finally {
      // reset to idle after finishing
      this.mode = "idle";
      this.stepIndex = 0;
      this.data = {};
      if (this.onUpdateUI) this.onUpdateUI({ mode: this.mode });
    }
  },

  // prepare lead payload mapping based on flow
  _prepareLeadPayload() {
    const flow = this.data.flow;
    const payload = {
      full_name: this.data.contact || "",
      phone: this.data.contact || "",
      email: this.data.contact && this.data.contact.includes("@") ? this.data.contact : "",
      source: "genie",
      created_at: new Date().toISOString(),
      metadata: {}
    };
    if (flow === "website_flow") {
      payload.metadata = {
        website_type: this.data.website_type || "",
        pages: this.data.page_count || "",
        has_content: this.data.has_content || "",
        features: this.data.features || "",
        budget: this.data.budget || ""
      };
      payload.service_interest = "Website";
    } else if (flow === "business_flow") {
      payload.metadata = {
        category: this.data.category || "",
        problem: this.data.current_problem || "",
        service_interest: this.data.service_interest || "",
        budget: this.data.budget || ""
      };
      payload.service_interest = this.data.service_interest || "Business Growth";
    } else if (flow === "job_flow") {
      payload.metadata = {
        job_type: this.data.job_type || "",
        experience: this.data.experience || "",
        availability: this.data.availability || "",
        expected_salary: this.data.expected_salary || ""
      };
      payload.service_interest = "Job Application";
    } else {
      payload.metadata = this.data;
    }
    return payload;
  },

  // small human-friendly summary string
  _leadSummaryText(payload) {
    if (payload.service_interest === "Website") {
      return `Website request — Type: ${payload.metadata.website_type || "N/A"}, Pages: ${payload.metadata.pages || "N/A"}, Budget: ${payload.metadata.budget || "N/A"}`;
    } else if (payload.service_interest === "Job Application") {
      return `Job application — Role: ${payload.metadata.job_type || "N/A"}, Experience: ${payload.metadata.experience || "N/A"}`;
    } else {
      return `Request: ${payload.service_interest || "General"}, Category: ${payload.metadata.category || "N/A"}`;
    }
  },

  // helper to send text to UI + TTS
  sendOutput(text) {
    if (!text) return;
    if (this.onOutput) this.onOutput(text);
    else console.log("Genie:", text);
  },

  // utility: quick start a category pitch based on category key
  pitchCategory(key) {
    const info = CATEGORY_MAP[key];
    if (!info) {
      this.sendOutput(t("genie.fallback"));
      return;
    }
    const pitch = t(info.pitchKey) || `We help ${info.name} with leads and marketing.`;
    this.sendOutput(pitch);
  }
};
