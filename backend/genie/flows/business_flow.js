// backend/genie/flows/business_flow.js

export default {
  async handle(sessionId, userText, { memory, supabase, logger }) {

    // Load or initialize flow state
    const state = await memory.getState(sessionId);
    const flow = state.flow || { step: 0, data: {} };

    logger.log("[BUSINESS FLOW] step:", flow.step, "text:", userText);

    // STEP 0 — ask requirement
    if (flow.step === 0) {
      flow.step = 1;
      await memory.setState(sessionId, { flow, activeFlow: "business" });

      return { reply: "What service do you need? (Website, Ads, AI, App, Other)" };
    }

    // STEP 1 — store service and ask budget
    if (flow.step === 1) {
      flow.data.service = userText.trim();
      flow.step = 2;

      await memory.setState(sessionId, { flow, activeFlow: "business" });

      return {
        reply: `Great — ${flow.data.service}. What is your approximate budget or timeline?`
      };
    }

    // STEP 2 — store budget/timeline and submit lead
    if (flow.step === 2) {
      flow.data.budget_range = userText.trim();

      try {
        await supabase.from("business_leads").insert({
          service: flow.data.service,
          budget_range: flow.data.budget_range,
          requirement: flow.data.service,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        logger.error("business lead insert failed:", e.message);
      }

      await memory.resetFlow(sessionId);

      return {
        reply: "Thank you. Our team will contact you shortly.",
        finished: true
      };
    }

    // Default fallback
    return { reply: "Tell me what service you need." };
  }
};
