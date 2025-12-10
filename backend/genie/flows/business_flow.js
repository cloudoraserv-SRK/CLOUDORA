// backend/genie/flows/business_flow.js
export default {
  async handle(sessionId, userText, { memory, supabase, logger }) {
    const state = (await memory.getState(sessionId))?.flow || { step: 0, data: {} };

    if (state.step === 0) {
      state.step = 1;
      await memory.setState(sessionId, { flow: state });
      return { reply: "What service do you need? (Website, Ads, AI, App, Other)" };
    }

    if (state.step === 1) {
      state.data.service = userText.trim();
      state.step = 2;
      await memory.setState(sessionId, { flow: state });
      return { reply: `Got it — ${state.data.service}. What is your approximate budget or timeline? (optional)` };
    }

    if (state.step === 2) {
      state.data.budget_range = userText.trim();
      // store lead
      try {
        await supabase.from("business_leads").insert({
          service: state.data.service,
  budget_range: state.data.budget_range || null,
  requirement: state.data.service,
  created_at: new Date().toISOString()
        });
      } catch (e) {
        logger.error("lead insert failed", e.message);
      }
      await memory.resetFlow(sessionId);
      return { reply: "Thanks — we recorded your interest. Our team will contact you shortly.", finished: true };
    }

    return { reply: "Tell me which service you need." };
  }
};
