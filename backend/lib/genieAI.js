console.log("🔐 GCP PROJECT:", process.env.GCP_PROJECT_ID);
console.log("🔐 GCP LOCATION:", process.env.GCP_LOCATION);
console.log(
  "🔐 CREDS PRESENT:",
  !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
);


import { VertexAI } from "@google-cloud/vertexai";

const credentials = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || "{}"
);

const vertex = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION,
  credentials
});

const model = vertex.preview.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-1.0-pro"
});

export async function askGemini(prompt) {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });

    const text =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Empty Gemini response");

    return text;
  } catch (err) {
    console.error("🔥 GEMINI ERROR:", err);
    throw err;
  }
}


