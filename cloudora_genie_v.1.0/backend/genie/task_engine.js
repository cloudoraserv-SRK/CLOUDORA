// backend/genie/task_engine.js
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// helper: update or create employee_daily_logs row for today
async function upsertDailyLog(employee_id, changes = {}) {
  const today = new Date().toISOString().slice(0,10);
  const { data } = await supabase
    .from("employee_daily_logs")
    .select("*")
    .eq("employee_id", employee_id)
    .eq("date", today)
    .maybeSingle();

  if (!data) {
    const payload = {
      employee_id,
      date: today,
      total_calls: changes.total_calls || 0,
      total_tasks_completed: changes.total_tasks_completed || 0,
      xp_earned: changes.xp_earned || 0,
      working_hours: changes.working_hours || null
    };
    await supabase.from("employee_daily_logs").insert(payload);
    return;
  }

  // merge updates
  const upd = {};
  if (typeof changes.total_calls === "number") upd.total_calls = data.total_calls + changes.total_calls;
  if (typeof changes.total_tasks_completed === "number") upd.total_tasks_completed = data.total_tasks_completed + changes.total_tasks_completed;
  if (typeof changes.xp_earned === "number") upd.xp_earned = data.xp_earned + changes.xp_earned;
  if (changes.working_hours) upd.working_hours = changes.working_hours;

  await supabase.from("employee_daily_logs")
    .update(upd)
    .eq("employee_id", employee_id)
    .eq("date", today);
}

// Claim task (assign to employee)
export async function claimTask(taskId, employeeId) {
  const { error } = await supabase.from("employee_tasks")
    .update({ employee_id: employeeId, status: "assigned" })
    .eq("id", taskId);
  return { ok: !error, error };
}

// Unclaim task (make unassigned)
export async function unclaimTask(taskId, employeeId) {
  const { error } = await supabase.from("employee_tasks")
    .update({ employee_id: null, status: "unassigned" })
    .eq("id", taskId)
    .eq("employee_id", employeeId);
  return { ok: !error, error };
}

// Start task (sets started_at, status -> in_progress)
export async function startTask(taskId, employeeId) {
  const started_at = new Date().toISOString();
  const { error } = await supabase.from("employee_tasks")
    .update({ status: "in_progress", started_at })
    .eq("id", taskId)
    .eq("employee_id", employeeId);
  return { ok: !error, error, started_at };
}

// Stop task (compute duration, optionally mark completed)
export async function stopTask(taskId, employeeId, { markComplete=false, notes="", callStatus=null, durationSeconds=null } = {}) {
  // fetch task
  const { data: task } = await supabase.from("employee_tasks").select("*").eq("id", taskId).maybeSingle();
  if (!task) return { ok:false, error: "Task not found" };
  if (task.employee_id !== employeeId) return { ok:false, error: "Not owner" };

  const completed_at = new Date().toISOString();
  let duration = durationSeconds;
  if (!duration && task.started_at) {
    duration = Math.floor((new Date(completed_at) - new Date(task.started_at)) / 1000);
  }

  const newStatus = markComplete ? "completed" : "assigned";
  const updatePayload = { status: newStatus, completed_at };

  const { error: upErr } = await supabase.from("employee_tasks")
    .update(updatePayload)
    .eq("id", taskId);

  // log call if relevant
  if (task.task_type === "call") {
    await supabase.from("employee_call_logs").insert({
      employee_id: employeeId,
      lead_id: task.lead_id,
      call_status: callStatus || (markComplete ? "followup" : "not_connected"),
      notes: notes || "",
      duration_seconds: duration || 0,
      created_at: completed_at
    });
    // update daily log: +1 call; if completed -> +1 task completed
    await upsertDailyLog(employeeId, {
      total_calls: 1,
      total_tasks_completed: markComplete ? 1 : 0,
      xp_earned: markComplete ? 10 : 2
    });
  } else {
    // non-call tasks
    if (markComplete) {
      await upsertDailyLog(employeeId, { total_tasks_completed: 1, xp_earned: 5 });
    }
  }

  return { ok: !upErr, error: upErr, duration_seconds: duration };
}

// Complete task directly
export async function completeTask(taskId, employeeId, notes="") {
  return await stopTask(taskId, employeeId, { markComplete: true, notes, callStatus: "qualified" });
}

// List tasks for employee (assigned + in_progress)
export async function listTasksForEmployee(employeeId, opts = {}) {
  let q = supabase.from("employee_tasks").select("*");
  if (employeeId) q = q.eq("employee_id", employeeId);
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error } = await q.order("created_at", { ascending: true });
  return { data, error };
}

// Admin: fetch unassigned tasks
export async function listUnassignedTasks(limit=100) {
  const { data, error } = await supabase.from("employee_tasks")
    .select("*")
    .is("employee_id", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  return { data, error };
}

// Set employee preferences (country/product/shift) — stored in employees table
export async function setEmployeePrefs(employeeId, prefs = {}) {
  const { error } = await supabase.from("employees")
    .update({
      preferred_country: prefs.country || null,
      preferred_product: prefs.product || null,
      shift: prefs.shift || null
    })
    .eq("id", employeeId);
  return { ok: !error, error };
}

// Assign shift for employee (quick)
export async function setShift(employeeId, shift) {
  return await setEmployeePrefs(employeeId, { shift });
}

export default {
  claimTask,
  unclaimTask,
  startTask,
  stopTask,
  completeTask,
  listTasksForEmployee,
  listUnassignedTasks,
  setEmployeePrefs,
  setShift
};
