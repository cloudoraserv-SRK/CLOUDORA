import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const openAiModels = [
  process.env.OPENAI_CHAT_MODEL,
  "gpt-4o-mini",
  "gpt-4.1-mini"
].filter(Boolean);

const geminiModels = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-1.5-flash"
].filter(Boolean);

function getPreferredProvider() {
  return String(process.env.AI_PROVIDER || "openai").trim().toLowerCase();
}

function mapMessagesForGemini(messages = []) {
  const systemMessages = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");

  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: String(message.content || "") }]
    }));

  return { systemMessages, contents };
}

async function askOpenAI(messages) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing on the backend");
  }

  let lastError = null;

  for (const model of openAiModels) {
    try {
      const res = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7
      });

      return res.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
      lastError = error;
      console.error(`GENIE OPENAI MODEL FAILURE (${model}):`, error?.message || error);
    }
  }

  throw lastError || new Error("All OpenAI Genie models failed");
}

async function askGemini(messages) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing on the backend");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const { systemMessages, contents } = mapMessagesForGemini(messages);
  let lastError = null;

  for (const modelName of geminiModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemMessages || undefined
      });

      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: 0.7
        }
      });

      const text = result.response?.text?.() || "";
      if (text.trim()) return text;
    } catch (error) {
      lastError = error;
      console.error(`GENIE GEMINI MODEL FAILURE (${modelName}):`, error?.message || error);
    }
  }

  throw lastError || new Error("All Gemini Genie models failed");
}

export async function askGenie(messages) {
  const preferred = getPreferredProvider();

  if (preferred === "gemini") {
    try {
      return await askGemini(messages);
    } catch (geminiError) {
      console.error("GENIE GEMINI PRIMARY FAILURE:", geminiError?.message || geminiError);
      if (process.env.OPENAI_API_KEY) {
        return askOpenAI(messages);
      }
      throw geminiError;
    }
  }

  try {
    return await askOpenAI(messages);
  } catch (openAiError) {
    console.error("GENIE OPENAI PRIMARY FAILURE:", openAiError?.message || openAiError);
    if (process.env.GEMINI_API_KEY) {
      return askGemini(messages);
    }
    throw openAiError;
  }
}
