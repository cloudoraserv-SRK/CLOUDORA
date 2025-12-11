console.log("JOB FLOW LOADED:", jobFlow);
console.log("BUSINESS FLOW LOADED:", businessFlow);

// ===========================================================
// CLOUDORA GENIE — FINAL UPDATED GENIE-CORE (STABLE V3)
// FIXED:
//  - Proper intent detection
//  - Business flow triggers on all service queries
//  - Job flow triggers correctly
//  - General fallback only when needed
// ===========================================================

import { createClient } from "@supabase/supabase-js";
import jobFlow from "./flows/job_flow.js";
import businessFlow from "./flows/business_flow.js";
import memoryModule from "./memory/memory.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default function createGenie({ logger = console } = {}) {
  const memory = memoryModule({ supabase, logger });

  // ----------------------------------------------------------
  // START SESSION
  // ----------------------------------------------------------
  async function startSession() {
  const res = await fetch(CONFIG.BACKEND + "/api/genie/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  const j = await res.json();
  SESSION_ID = j.sessionId;
  localStorage.setItem("genie_session", SESSION_ID);
}

  // ----------------------------------------------------------
  // HANDLE INPUT
  // ----------------------------------------------------------
  async function handleInput(sessionId, userText) {
    logger.log("GENIE CORE LOADED → processing text:", userText);

    const text = userText?.trim() || "";
    const lc = text.toLowerCase();

    // ------------------------------------------------------
    // GLOBAL COMMANDS
    // ------------------------------------------------------
    if (["stop", "cancel", "quit", "exit", "reset"].includes(lc)) {
      await memory.resetSession(sessionId);
      return {
        reply: "Session reset. What would you like to do next?",
        finished: true
      };
    }

    if (lc === "pause") {
      await memory.setState(sessionId, { paused: true });
      return { reply: "Paused. Say resume to continue." };
    }

    if (["resume", "continue"].includes(lc)) {
      await memory.setState(sessionId, { paused: false });
      return { reply: "Resumed. Go ahead!" };
    }

    // If paused → ignore
    const state = await memory.getState(sessionId);
    if (state?.paused) {
      return { reply: "Still paused. Say resume to continue." };
    }

    // ------------------------------------------------------
    // FLOW DETECTION
    // ------------------------------------------------------
    let activeFlow = state?.activeFlow || null;

    // WORD LISTS FOR INTENT DETECTION
    const jobWords = ["job", "apply", "career", "hiring", "work", "vacancy"];
    const businessWords = [
      "website",
      "web",
      "marketing",
      "seo",
      "ads",
      "digital",
      "service",
      "services",
      "package",
      "plan",
      "quote",
      "price",
      "pricing",
      "app",
      "software",
      "brand",
      "brand design",
      "logo",
      "ecommerce",
      "store"
    ];

    // Detect flow only if not already in one
    if (!activeFlow) {
      if (jobWords.some(w => lc.includes(w))) {
        activeFlow = "job";
      } else if (businessWords.some(w => lc.includes(w))) {
        activeFlow = "business";
      } else {
        activeFlow = "general";
      }

      await memory.setState(sessionId, { activeFlow });
      logger.log("DETECTED FLOW:", activeFlow);
    }

    // ------------------------------------------------------
    // FLOW ROUTING
    // ------------------------------------------------------

    // 👉 JOB FLOW
  if (activeFlow === "job") {
  try {
    logger.log("[GENIE] routing → JOB FLOW");

    const out = await jobFlow.handle(sessionId, userText, {
      memory,
      supabase,
      logger
    });

    logger.log("[JOB FLOW OUTPUT]", out);

    if (out?.finished) {
      await memory.setState(sessionId, { activeFlow: null });
    }

    return out;
  } catch (err) {
    logger.error("[JOB FLOW ERROR]", err);
    return {
      reply: "Job flow crashed internally. Please try again.",
      finished: false
    };
  }
}

    // 👉 BUSINESS FLOW
if (activeFlow === "business") {
  try {
    logger.log("[GENIE] routing → BUSINESS FLOW");

    const out = await businessFlow.handle(sessionId, userText, {
      memory,
      supabase,
      logger
    });

    logger.log("[BUSINESS FLOW OUTPUT]", out);

    if (out?.finished) {
      await memory.setState(sessionId, { activeFlow: null });
    }

    return out;
  } catch (err) {
    logger.error("[BUSINESS FLOW ERROR]", err);
    return {
      reply: "Business flow crashed internally. Please try again.",
      finished: false
    };
  }
}
    // ------------------------------------------------------
    // GENERAL FALLBACK
    // ------------------------------------------------------
    return {
      reply:
        "Sure! Tell me what you want — business services, pricing, packages, jobs, onboarding, or anything else.",
      finished: false
    };
  }

  // ----------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------
  return {
    startSession,
    handleInput,
    memory
  };
}



