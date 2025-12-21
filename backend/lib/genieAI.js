import { VertexAI } from "@google-cloud/vertexai";

const vertex = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION
});

const model = vertex.preview.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-1.5-pro"
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

    if (!text) {
      throw new Error("Empty Gemini response");
    }

    return text;
  } catch (err) {
    console.error("🔥 GEMINI ERROR:", err);
    throw err;
  }
}
