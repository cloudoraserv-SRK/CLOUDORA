import { embedText } from "./ingest_master.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function retryIngest(records, retries = 3) {
  for (const rec of records) {
    let attempt = 0;
    let success = false;

    while (!success && attempt < retries) {
      try {
        console.log(`Retrying (${attempt + 1}/${retries}) →`, rec.id);

        const embedding = await embedText(rec.text);

        const { error } = await supabase.from("kb_internal").upsert({
          id: rec.id,
          content: rec.text,
          embedding
        });

        if (!error) {
          success = true;
          console.log(`✔ Success after retry: ${rec.id}`);
        } else {
          throw error;
        }
      } catch (err) {
        console.log("❌ Retry failed:", err.message);
        attempt++;
        await new Promise(r => setTimeout(r, attempt * 1500));
      }
    }
  }

  console.log("Retry Completed.");
}
