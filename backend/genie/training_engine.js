// backend/genie/training_engine.js
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ------------------------------
// 7-DAY TRAINING LIST
// ------------------------------
export const TRAINING_PLAN = {
  1: ["cloudora_intro", "values_rules", "communication_basics"],
  2: ["telecalling_basics", "call_structure", "crm_intro"],
  3: ["sales_basics", "objection_basics", "proposal_basics"],
  4: ["product_knowledge", "pricing_basics", "service_scripts"],
  5: ["task_practice_calls", "crm_updates", "followup_rules"],
  6: ["quality_standards", "reporting_rules", "daily_targets"],
  7: ["assessment_day", "final_quiz", "trial_completion"]
};

// ------------------------------
// Assign Day Training
// ------------------------------
export async function assignTrainingDay(employeeId, dayNumber) {
  const modules = TRAINING_PLAN[dayNumber] || [];
  for (const moduleId of modules) {
    await supabase.from("employee_training_progress").insert({
      employee_id: employeeId,
      day_number: dayNumber,
      module_id: moduleId,
      status: "pending"
    });
  }
  return modules;
}

// ------------------------------
// Mark module completed + give XP
// ------------------------------
export async function completeTrainingModule(employeeId, moduleId, score = 10) {
  await supabase.from("employee_training_progress")
    .update({ status: "completed", score })
    .eq("employee_id", employeeId)
    .eq("module_id", moduleId);

  await supabase.from("employee_xp_log").insert({
    employee_id: employeeId,
    xp: score,
    reason: `Training completed: ${moduleId}`
  });

  return true;
}

// ------------------------------
// Auto-assign Day Based on Date
// ------------------------------
export async function autoAssignTraining(employeeId, joinDate) {
  const today = new Date();
  const diff = Math.floor((today - new Date(joinDate)) / (1000 * 60 * 60 * 24));
  const dayNumber = Math.min(7, diff + 1);
  return await assignTrainingDay(employeeId, dayNumber);
}

// ------------------------------
// Give Tasks After Training Done
// ------------------------------
export async function autoAssignTasksAfterTraining(employeeId) {
  const { data: modules } = await supabase
    .from("employee_training_progress")
    .select("status")
    .eq("employee_id", employeeId);

  const total = modules.length;
  const completed = modules.filter(m => m.status === "completed").length;

  if (total > 0 && completed === total) {
    // Assign first real tasks
    await supabase.from("employee_tasks").insert([
      {
        employee_id: employeeId,
        task_type: "call",
        status: "assigned",
        shift: "general",
        country: "IN",
        product: "general"
      }
    ]);
    return "TASKS_ASSIGNED";
  }

  return "PENDING";
}
