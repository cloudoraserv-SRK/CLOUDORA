import { supabase } from "./supabaseClient.js";

/*
  MODE SWITCH
  true  = KB disabled (NO embedding, NO OpenAI calls)  ✅ CURRENT SAFE
  false = KB enabled  (embedding + vector search)
*/
const KB_ENABLED = false;

/* =========================
   MAIN KB QUERY FUNCTION
========================= */
export async function queryGenieKB({
  message,
  site = "cloudora",
  threshold = 0.78,
  limit = 5
}) {
  // 🚫 TEMP: embedding disabled to avoid quota errors
  if (!KB_ENABLED) {
    return null;
  }

  // ⚠️ This block will be enabled later
  // const embedding = await embedText(message);

  // const { data, error } = await supabase.rpc(
  //   "match_kb_vectors",
  //   {
  //     query_embedding: embedding,
  //     match_threshold: threshold,
  //     match_count: limit,
  //     site_filter: site
  //   }
  // );

  // if (error || !data?.length) return null;

  // return data.map(d => d.content).join("\n\n");

  return null;
}
