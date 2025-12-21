import { VertexAI } from "@google-cloud/vertexai";

const vertex = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION
});

const model = vertex.preview.getGenerativeModel({
  model: process.env.GEMINI_MODEL
});

export async function askGemini(prompt) {
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    return result.response.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("🔥 GEMINI ERROR:", err);
    throw err;
  }
}
  return result.response.candidates[0].content.parts[0].text;
}

