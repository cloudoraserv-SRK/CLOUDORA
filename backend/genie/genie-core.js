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
  async function startSession(sessionId, meta = {}) {
    await memory.createSession(sessionId, meta);
    return { ok: true, sessionId };
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
      const out = await jobFlow.handle(sessionId, userText, {
        memory,
        supabase,
        logger
      });

      if (out?.finished) {
        await memory.setState(sessionId, { activeFlow: null });
      }

      return out;
    }

    // 👉 BUSINESS FLOW
    if (activeFlow === "business") {
      const out = await businessFlow.handle(sessionId, userText, {
        memory,
        supabase,
        logger
      });

      if (out?.finished) {
        await memory.setState(sessionId, { activeFlow: null });
      }

      return out;
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
