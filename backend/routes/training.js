import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ------------------------------------
// 1️⃣ GET MODULE LIST
// ------------------------------------
router.get("/modules", async (req, res) => {
  const { data, error } = await supabase
    .from("training_modules")
    .select("*");

  if (error) return res.json({ ok: false, error: error.message });
  return res.json({ ok: true, modules: data });
});

// ------------------------------------
// 2️⃣ GET TRAINING QUESTIONS
// ------------------------------------
router.get("/questions", async (req, res) => {
  const module_id = req.query.module_id;

  const { data, error } = await supabase
    .from("training_questions")
    .select("*")
    .eq("module_id", module_id);

  if (error) return res.json({ ok: false, error: error.message });

  return res.json({ ok: true, questions: data });
});

// ------------------------------------
// 3️⃣ SUBMIT QUIZ
// ------------------------------------
router.post("/submit", async (req, res) => {
  const { employee_id, module_id, answers } = req.body;

  const { data: questions } = await supabase
    .from("training_questions")
    .select("*")
    .eq("module_id", module_id);

  let score = 0;
  questions.forEach(q => {
    if (answers[q.id] === q.correct_option) score++;
  });

  await supabase.from("training_progress").upsert({
    employee_id,
    module_id,
    score,
    total: questions.length,
    status: "completed",
    updated_at: new Date().toISOString()
  });

  return res.json({ ok: true, score, total: questions.length });
});
router.get("/content", async (req, res) => {
  const module_id = req.query.module_id;

  const { data, error } = await supabase
    .from("training_content")
    .select("*")
    .eq("module_id", module_id)
    .maybeSingle();

  if (error || !data) {
    return res.json({ ok: false, error: "No content available" });
  }

  return res.json({ ok: true, content: data });
});

export default router;
