import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function askGemini(prompt) {
  const res = await client.chat.completions.create({
    model: process.env.MODEL_NAME,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6
  });

  return res.choices[0].message.content;
}
