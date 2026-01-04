import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function askGenie(prompt) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are Genie, Cloudora's AI assistant." },
      { role: "user", content: prompt }
    ]
  });

  return res.choices[0].message.content;
}
