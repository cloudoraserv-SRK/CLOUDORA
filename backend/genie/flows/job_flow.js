// backend/genie/flows/job_flow.js
// FINAL — Stable, flexible, Hindi/English friendly job application flow
// FIXED: state persistence, activeFlow persistence, resetFlow safety

export default {
  async handle(sessionId, userText, { memory, supabase, logger }) {

    // Load state safely
    const state = await memory.getState(sessionId);
    const flow = state.flow || { step: 0, data: {} };
    const step = flow.step ?? 0;
    const lower = (userText || "").toLowerCase().trim();

    logger.log("[JOB FLOW]", { step, text: userText });

    // ---------------------------------------------------------
    // STEP 0 — Detect job interest + capture role
    // ---------------------------------------------------------
    if (step === 0) {
      const containsJob =
        lower.includes("job") ||
        lower.includes("apply") ||
        lower.includes("chahiye") ||
        lower.includes("kaam") ||
        lower.includes("position") ||
        lower.includes("role") ||
        lower.includes("hiring") ||
        lower.includes("work");

      if (containsJob) {
        flow.data.role = userText.trim();
        flow.step = 1;

        await memory.setState(sessionId, {
          flow,
          activeFlow: "job"
        });

        return {
          reply: `Great — applying for "${flow.data.role}". How many years of experience do you have?`
        };
      }

      // If not detected → Ask clearly
      flow.step = 0;
      await memory.setState(sessionId, { flow, activeFlow: "job" });

      return {
        reply: "Which role are you applying for? (Telecaller, Sales, Developer, etc.)"
      };
    }

    // ---------------------------------------------------------
    // STEP 1 — Experience
    // ---------------------------------------------------------
    if (step === 1) {
      const years = (userText.match(/(\d+(\.\d+)?)/) || [null])[0];
      flow.data.experience = years ? Number(years) : userText.trim();

      flow.step = 2;
      await memory.setState(sessionId, {
        flow,
        activeFlow: "job"
      });

      return {
        reply: "Nice. What skills or tools do you know? (comma separated)"
      };
    }

    // ---------------------------------------------------------
    // STEP 2 — Skills
    // ---------------------------------------------------------
    if (step === 2) {
      flow.data.skills = userText
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      flow.step = 3;
      await memory.setState(sessionId, { flow, activeFlow: "job" });

      return {
        reply: "Are you available for a short paid trial if selected? (yes/no)"
      };
    }

    // ---------------------------------------------------------
    // STEP 3 — Trial availability
    // ---------------------------------------------------------
    if (step === 3) {
      const yes = /^y(es)?$/i.test(lower);
      flow.data.available_for_trial = yes;

      flow.step = 4;
      await memory.setState(sessionId, { flow, activeFlow: "job" });

      return {
        reply: "Optional: If you have a resume/portfolio link, type it now (or type skip)."
      };
    }

    // ---------------------------------------------------------
    // STEP 4 — Resume optional
    // ---------------------------------------------------------
    if (step === 4) {
      if (!/^(skip|no)$/i.test(lower)) {
        flow.data.resume = userText.trim();
      }

      flow.step = 5;
      await memory.setState(sessionId, { flow, activeFlow: "job" });

      return {
        reply: "Would you like to discuss expected CTC? (yes/no)"
      };
    }

    // ---------------------------------------------------------
    // STEP 5 — Check if candidate wants to mention CTC
    // ---------------------------------------------------------
    if (step === 5) {
      const wantsCTC = /^y(es)?$/i.test(lower);

      if (wantsCTC) {
        flow.step = 6;
        await memory.setState(sessionId, { flow, activeFlow: "job" });

        return {
          reply: "Please mention your expected CTC (monthly/annual or a range)."
        };
      }

      // No CTC → finalize
      const application = {
        role: flow.data.role,
        experience: flow.data.experience,
        skills: Array.isArray(flow.data.skills)
          ? flow.data.skills.join(", ")
          : flow.data.skills || null,
        trial: flow.data.available_for_trial,
        resume: flow.data.resume || null,
        ctc: null,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from("job_applications").insert(application);
      } catch (e) {
        logger.error("job insert failed:", e.message);
      }

      await memory.resetFlow(sessionId);

      return {
        reply: `Thanks — your application for ${application.role} is recorded. We'll contact you if shortlisted.`,
        finished: true
      };
    }

    // ---------------------------------------------------------
    // STEP 6 — Candidate mentions CTC → finalize
    // ---------------------------------------------------------
    if (step === 6) {
      flow.data.ctc = userText.trim();

      const application = {
        role: flow.data.role,
        experience: flow.data.experience,
        skills: Array.isArray(flow.data.skills)
          ? flow.data.skills.join(", ")
          : flow.data.skills || null,
        trial: flow.data.available_for_trial,
        resume: flow.data.resume || null,
        ctc: flow.data.ctc,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from("job_applications").insert(application);
      } catch (e) {
        logger.error("job insert failed:", e.message);
      }

      await memory.resetFlow(sessionId);

      return {
        reply: `Thanks — your application for ${application.role} is submitted with expected CTC: ${application.ctc}.`,
        finished: true
      };
    }

    // ---------------------------------------------------------
    // DEFAULT (Failsafe)
    // ---------------------------------------------------------
    return {
      reply: "Let's restart the job application. Which role do you want to apply for?",
      finished: false
    };
  }
};
