import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

// --------------------------------------------
// LOAD ENV
// --------------------------------------------
dotenv.config({ path: path.join(process.cwd(), "..", ".env") });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
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
const KB_DIR = path.resolve(process.cwd(), "..", "kb");

// --------------------------------------------
// LOAD KB FILES
// --------------------------------------------
function loadKBFiles() {
  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith(".json"));
  let docs = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(KB_DIR, file), "utf8");
      const json = JSON.parse(raw);

      let entries = [];
      if (Array.isArray(json)) entries = json;
      else {
        Object.keys(json).forEach(key => {
          if (Array.isArray(json[key])) entries.push(...json[key]);
        });
      }

      docs.push({
        file,
        entries,
        category: file.replace(".json", "")
      });

    } catch (err) {
      console.error(`❌ JSON ERROR in file: ${file}`);
      console.error(err.message);
      process.exit(1);
    }
  }
  return docs;
}

// --------------------------------------------
// TEXT CHUNKING
// --------------------------------------------
function chunkText(text, maxLen = 500) {
  const words = text.split(" ");
  let chunks = [];
  let curr = [];

  for (const w of words) {
    curr.push(w);
    if (curr.join(" ").length > maxLen) {
      chunks.push(curr.join(" "));
      curr = [];
    }
  }
  if (curr.length) chunks.push(curr.join(" "));
  return chunks;
}

// --------------------------------------------
// GEMINI EMBEDDINGS
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

    if (!res.ok || data.error) {
      console.error("❌ Gemini API Error:", data.error || data);
      return null;
    }

    return data.embedding?.values || null;

  } catch (err) {
    console.error("❌ Network/Fetch error:", err.message);
    return null;
  }
}

// --------------------------------------------
// INSERT INTO kb_internal  (REQUIRED FOR match_kb)
// --------------------------------------------
async function insertInternal(id, title, content, embedding, meta) {
  const { error } = await supabase.from("kb_internal").insert({
    id,
    title,
    content,
    category: meta.category,
    source_file: meta.file,
    embedding
  });

  if (error) console.error("❌ Internal insert error:", error);
}

// --------------------------------------------
// INSERT INTO kb_vectors (optional secondary table)
// --------------------------------------------
async function insertVector(id, title, content, embedding, meta) {
  const { error } = await supabase.from("kb_vectors").insert({
    id,
    title,
    content,
    category: meta.category,
    source_file: meta.file,
    metadata: meta.metadata || {},
    embedding
  });

  if (error) console.error("❌ Vector insert error:", error);
}

// --------------------------------------------
// MAIN INGEST
// --------------------------------------------
async function ingest() {
  console.log("📥 Loading KB files...");
  const docs = loadKBFiles();

  for (const doc of docs) {
    console.log(`\n📄 Ingesting: ${doc.file}`);

    let entryIndex = 0;

    for (const entry of doc.entries) {
      entryIndex++;

      const baseId = entry.id || `${doc.category}_${entryIndex}`;
      const baseTitle = entry.title || entry.id || "Untitled KB Entry";

      const content = entry.content || JSON.stringify(entry, null, 2);
      const chunks = chunkText(content, 450);

      let chunkCounter = 0;

      for (const chunkText of chunks) {
        chunkCounter++;
        const chunkId = `${baseId}_chunk_${chunkCounter}`;

        const emb = await embed(chunkText);
        if (!emb) {
          console.error("❌ Skipped chunk due to embedding failure");
          continue;
        }

        // REQUIRED INSERT 1 → kb_internal
        await insertInternal(
          chunkId,
          baseTitle,
          chunkText,
          emb,
          {
            category: doc.category,
            file: doc.file
          }
        );

        // OPTIONAL INSERT 2 → kb_vectors
        await insertVector(
          chunkId,
          baseTitle,
          chunkText,
          emb,
          {
            category: doc.category,
            file: doc.file,
            metadata: { original_id: entry.id }
          }
        );

        console.log(`  ✔ Saved chunk: ${chunkId}`);
      }
    }
  }

  console.log("\n🎉 KB INGEST COMPLETED SUCCESSFULLY!");
}

ingest();
