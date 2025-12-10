import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

// --------------------------------------------
// LOAD ENV
// --------------------------------------------
dotenv.config({ path: path.join(process.cwd(), ".env") });


if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE credentials");
  process.exit(1);
}

if (!process.env.GOOGLE_API_KEY) {
  console.error("❌ Missing GOOGLE_API_KEY");
  process.exit(1);
}

// --------------------------------------------
// SUPABASE
// --------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --------------------------------------------
// KB DIRECTORY
// --------------------------------------------
const KB_DIR = path.resolve(process.cwd(), "kb");

// --------------------------------------------
// PARSE ALL JSON FILES
// --------------------------------------------
function loadKBFiles() {
  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith(".json"));
  let docs = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(KB_DIR, file), "utf8");
      const json = JSON.parse(raw);

      let entries = [];

      // Case 1: {documents:[]}
      if (json.documents && Array.isArray(json.documents)) {
        entries = json.documents;
      }
      // Case 2: direct array
      else if (Array.isArray(json)) {
        entries = json;
      }
      // Case 3: unknown object → flatten arrays inside it
      else {
        Object.keys(json).forEach(key => {
          if (Array.isArray(json[key])) entries.push(...json[key]);
        });
      }

      docs.push({
        file,
        module: json.module || file.replace(".json", ""),
        entries
      });

    } catch (err) {
      console.error(`❌ JSON error in ${file}:`, err.message);
      process.exit(1);
    }
  }
  return docs;
}

// --------------------------------------------
// CHUNK TEXT INTO 400–500 words
// --------------------------------------------
function chunkText(text, maxLen = 450) {
  const words = text.split(" ");
  let chunks = [];
  let buf = [];

  for (const w of words) {
    buf.push(w);
    if (buf.join(" ").length > maxLen) {
      chunks.push(buf.join(" "));
      buf = [];
    }
  }
  if (buf.length) chunks.push(buf.join(" "));
  return chunks;
}

// --------------------------------------------
// GEMINI EMBEDDING
// --------------------------------------------
async function embed(text) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GOOGLE_API_KEY}`;

  const body = {
    content: { parts: [{ text }] }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.error) {
      console.error("❌ Gemini API Error:", data.error);
      return null;
    }

    return data.embedding?.values || null;
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    return null;
  }
}

// --------------------------------------------
// SAVE VECTOR
// --------------------------------------------
async function saveVector(chunkId, title, chunkText, embedding, meta) {
  const { error } = await supabase.from("kb_vectors").insert({
    id: chunkId,
    title,
    content: chunkText,
    embedding,
    category: meta.module,
    source_file: meta.file,
    metadata: meta.metadata || {}
  });

  if (error) console.error("❌ Insert error:", error);
}

// --------------------------------------------
// MAIN INGEST ENGINE
// --------------------------------------------
async function ingest() {
  console.log("📥 Loading KB documents...");
  const docs = loadKBFiles();

  for (const doc of docs) {
    console.log(`\n📄 Processing: ${doc.file}`);

    let index = 0;

    for (const entry of doc.entries) {
      index++;

      const baseId = entry.id || `${doc.module}_${index}`;
      const title = entry.title || entry.id || "Untitled Entry";

      const content =
        entry.content ||
        JSON.stringify(entry, null, 2) ||
        "";

      const chunks = chunkText(content, 450);
      let c = 0;

      for (const chunk of chunks) {
        c++;
        const chunkId = `${baseId}_chunk_${c}`;

        const emb = await embed(chunk);
        if (!emb) {
          console.error("❌ Skipped chunk:", chunkId);
          continue;
        }

        await saveVector(chunkId, title, chunk, emb, {
          module: doc.module,
          file: doc.file,
          metadata: { original_id: entry.id || null }
        });

        console.log(`   ✔ Saved ${chunkId}`);
      }
    }
  }

  console.log("\n🎉 Ingest Completed Successfully!");
}

ingest();
