// genie/memory/memory.js
// Cloudora Genie — persistent memory engine (Supabase-backed)

export default function memoryModule({ supabase, logger = console }) {

  // -----------------------------------
  // Fetch session row
  // -----------------------------------
  async function getSession(sessionId) {
    if (!sessionId) return null;

    const { data, error } = await supabase
      .from("genie_sessions")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) {
      logger.error("getSession error:", error);
      return null;
    }

    return data || null;
  }

  // -----------------------------------
  // Create new session if needed
  // -----------------------------------
  async function createSession(sessionId, meta = {}) {
    try {
      const { error } = await supabase
        .from("genie_sessions")
        .insert([{ session_id: sessionId, meta, state: {} }]);

      // ignore duplicate error
      if (error && error.code !== "23505") {
        logger.error("createSession error:", error);
      }
    } catch (e) {
      logger.error("createSession failed:", e);
    }
  }

  // -----------------------------------
  // Get ONLY the state object
  // -----------------------------------
  async function getState(sessionId) {
    const row = await getSession(sessionId);
    if (!row) return {};
    return row.state || {};
  }

  // -----------------------------------
  // Merge & update session state
  // -----------------------------------
  async function setState(sessionId, newState) {
    try {
      const current = await getState(sessionId);
      const merged = { ...current, ...newState };

      const { error } = await supabase
        .from("genie_sessions")
        .update({
          state: merged,
          updated_at: new Date().toISOString()
        })
        .eq("session_id", sessionId);

      if (error) logger.error("setState error:", error);
      return merged;

    } catch (e) {
      logger.error("setState failed:", e);
      return null;
    }
  }

  // -----------------------------------
  // Reset only flow keys, keep meta safe
  // -----------------------------------
  async function resetFlow(sessionId) {
    const row = await getSession(sessionId);
    if (!row) return;

    const { meta } = row;

    const { error } = await supabase
      .from("genie_sessions")
      .update({
        state: {},
        meta: meta,  // FIX: keep original meta
        updated_at: new Date().toISOString()
      })
      .eq("session_id", sessionId);

    if (error) logger.error("resetFlow error:", error);
  }

  // -----------------------------------
  // Full reset (session wipe)
  // -----------------------------------
  async function resetSession(sessionId) {
    try {
      const { error } = await supabase
        .from("genie_sessions")
        .update({
          // FIX: clear flow safely
          state: { activeFlow: null, paused: false },
          meta: {},
          updated_at: new Date().toISOString()
        })
        .eq("session_id", sessionId);

      if (error) logger.error("resetSession error:", error);

    } catch (e) {
      logger.error("resetSession failed:", e);
    }
  }

  // -----------------------------------
  // Delete session completely
  // -----------------------------------
  async function deleteSession(sessionId) {
    try {
      const { error } = await supabase
        .from("genie_sessions")
        .delete()
        .eq("session_id", sessionId);

      if (error) logger.error("deleteSession error:", error);

    } catch (e) {
      logger.error("deleteSession failed:", e);
    }
  }

  // -----------------------------------
  // EXPORTS
  // -----------------------------------
  return {
    getSession,
    createSession,
    getState,
    setState,
    resetFlow,
    resetSession,
    deleteSession
  };
}
