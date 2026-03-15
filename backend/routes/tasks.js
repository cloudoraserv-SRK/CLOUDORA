import express from "express";
import { supabase } from "../api/supabase.js";

const router = express.Router();

function getTaskId(req) {
  return req.body.taskId || req.body.task_id || req.body.id || null;
}

function getEmployeeId(req) {
  return (
    req.body.employeeId ||
    req.body.employee_id ||
    req.query.employeeId ||
    req.query.employee_id ||
    null
  );
}

async function updateTask(taskId, payload) {
  return supabase
    .from("employee_tasks")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
}

async function claimTask(req, res) {
  const taskId = getTaskId(req);
  const employeeId = getEmployeeId(req);

  if (!taskId || !employeeId) {
    return res.status(400).json({ ok: false, error: "taskId and employeeId are required" });
  }

  const { error } = await updateTask(taskId, {
    employee_id: employeeId,
    status: "claimed",
  });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, message: "Task claimed" });
}

async function unclaimTask(req, res) {
  const taskId = getTaskId(req);

  if (!taskId) {
    return res.status(400).json({ ok: false, error: "taskId is required" });
  }

  const { error } = await updateTask(taskId, {
    employee_id: null,
    status: "unassigned",
  });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, message: "Task unclaimed" });
}

async function startTask(req, res) {
  const taskId = getTaskId(req);
  const employeeId = getEmployeeId(req);

  if (!taskId) {
    return res.status(400).json({ ok: false, error: "taskId is required" });
  }

  const payload = {
    status: "in_progress",
    started_at: new Date().toISOString(),
  };

  if (employeeId) payload.employee_id = employeeId;

  const { error } = await updateTask(taskId, payload);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, message: "Task started" });
}

async function stopTask(req, res) {
  const taskId = getTaskId(req);

  if (!taskId) {
    return res.status(400).json({ ok: false, error: "taskId is required" });
  }

  const { error } = await updateTask(taskId, {
    status: "stopped",
  });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, message: "Task stopped" });
}

async function completeTask(req, res) {
  const taskId = getTaskId(req);

  if (!taskId) {
    return res.status(400).json({ ok: false, error: "taskId is required" });
  }

  const { error } = await updateTask(taskId, {
    status: "completed",
    completed_at: new Date().toISOString(),
  });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, message: "Task marked complete" });
}

async function listTasks(req, res) {
  const employeeId = getEmployeeId(req);
  let query = supabase.from("employee_tasks").select("*");

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, tasks: data || [] });
}

async function listUnassignedTasks(req, res) {
  const { data, error } = await supabase
    .from("employee_tasks")
    .select("*")
    .is("employee_id", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, tasks: data || [] });
}

async function getLeadContext(req, res) {
  const employeeId = getEmployeeId(req);
  const leadId = req.query.lead_id || req.query.leadId || null;

  if (!employeeId || !leadId) {
    return res.status(400).json({ ok: false, error: "employeeId and leadId are required" });
  }

  const { data: task, error: taskError } = await supabase
    .from("employee_tasks")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("lead_id", leadId)
    .limit(1)
    .maybeSingle();

  if (taskError) {
    return res.status(500).json({ ok: false, error: taskError.message });
  }

  if (!task) {
    return res.status(404).json({ ok: false, error: "Task not found" });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return res.status(500).json({ ok: false, error: leadError.message });
  }

  return res.json({ ok: true, task, lead });
}

async function getNextCallTask(req, res) {
  const employeeId = getEmployeeId(req);

  if (!employeeId) {
    return res.status(400).json({ ok: false, error: "employeeId is required" });
  }

  const { data: task, error: taskError } = await supabase
    .from("employee_tasks")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("task_type", "call")
    .in("status", ["assigned", "claimed", "in_progress"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (taskError) {
    return res.status(500).json({ ok: false, error: taskError.message });
  }

  if (!task) {
    return res.json({ ok: false, message: "NO_TASKS" });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", task.lead_id)
    .maybeSingle();

  if (leadError) {
    return res.status(500).json({ ok: false, error: leadError.message });
  }

  if (!lead) {
    return res.json({ ok: false, message: "LEAD_NOT_FOUND", task });
  }

  return res.json({ ok: true, task, lead });
}

async function savePrefs(req, res) {
  return res.json({
    ok: true,
    message: "Preferences endpoint kept for compatibility. Persisted employee preferences still need schema finalization.",
  });
}

async function saveShift(req, res) {
  const employeeId = getEmployeeId(req);
  const shift = req.body.shift || null;

  if (!employeeId || !shift) {
    return res.status(400).json({ ok: false, error: "employeeId and shift are required" });
  }

  const { error } = await supabase
    .from("employees")
    .update({
      shift,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({ ok: true, message: "Shift updated" });
}

router.post("/claim", claimTask);
router.post("/unclaim", unclaimTask);
router.post("/start", startTask);
router.post("/stop", stopTask);
router.post("/complete", completeTask);
router.get("/list", listTasks);
router.get("/unassigned", listUnassignedTasks);
router.get("/lead-context", getLeadContext);
router.get("/next-call", getNextCallTask);
router.post("/prefs", savePrefs);
router.post("/shift", saveShift);

// Legacy compatibility paths
router.post("/task/claim", claimTask);
router.post("/task/unclaim", unclaimTask);
router.post("/task/start", startTask);
router.post("/task/stop", stopTask);
router.post("/task/complete", completeTask);
router.get("/task/list", listTasks);
router.get("/task/unassigned", listUnassignedTasks);
router.get("/task/lead-context", getLeadContext);
router.get("/task/next-call", getNextCallTask);
router.post("/task/prefs", savePrefs);
router.post("/task/shift", saveShift);

export default router;
