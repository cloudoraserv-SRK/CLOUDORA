// ---------------------------------------------
// Cloudora Tasks API (CLEAN BASIC VERSION)
// All AI / Genie / Memory removed
// ---------------------------------------------

import express from "express";
const router = express.Router();

// TEMPORARY in-memory tasks (for clean backend)
let tasks = [];

// ---------------------------------------------
// CLAIM TASK
// ---------------------------------------------
router.post("/task/claim", async (req, res) => {
  const { taskId, employeeId } = req.body;

  if (!taskId || !employeeId)
    return res.status(400).json({ error: "taskId & employeeId required" });

  tasks = tasks.map(t =>
    t.id === taskId ? { ...t, assigned_to: employeeId, status: "claimed" } : t
  );

  return res.json({ ok: true, message: "Task claimed" });
});

// ---------------------------------------------
// UNCLAIM TASK
// ---------------------------------------------
router.post("/task/unclaim", async (req, res) => {
  const { taskId } = req.body;

  tasks = tasks.map(t =>
    t.id === taskId ? { ...t, assigned_to: null, status: "unclaimed" } : t
  );

  return res.json({ ok: true, message: "Task unclaimed" });
});

// ---------------------------------------------
// START TASK
// ---------------------------------------------
router.post("/task/start", async (req, res) => {
  const { taskId, employeeId } = req.body;

  tasks = tasks.map(t =>
    t.id === taskId ? { ...t, status: "in-progress", started_by: employeeId } : t
  );

  return res.json({ ok: true, message: "Task started" });
});

// ---------------------------------------------
// STOP TASK
// ---------------------------------------------
router.post("/task/stop", async (req, res) => {
  const { taskId } = req.body;

  tasks = tasks.map(t =>
    t.id === taskId ? { ...t, status: "stopped" } : t
  );

  return res.json({ ok: true, message: "Task stopped" });
});

// ---------------------------------------------
// COMPLETE TASK
// ---------------------------------------------
router.post("/task/complete", async (req, res) => {
  const { taskId } = req.body;

  tasks = tasks.map(t =>
    t.id === taskId ? { ...t, status: "completed" } : t
  );

  return res.json({ ok: true, message: "Task marked complete" });
});

// ---------------------------------------------
// LIST TASKS BY EMPLOYEE
// ---------------------------------------------
router.get("/task/list", async (req, res) => {
  const employeeId = req.query.employeeId;

  const list = tasks.filter(t => t.assigned_to === employeeId);

  return res.json({ ok: true, tasks: list });
});

// ---------------------------------------------
// UNASSIGNED TASKS
// ---------------------------------------------
router.get("/task/unassigned", async (req, res) => {
  const list = tasks.filter(t => !t.assigned_to);
  return res.json({ ok: true, tasks: list });
});

// ---------------------------------------------
// SET EMPLOYEE PREFERENCES (TEMP MOCK)
// ---------------------------------------------
router.post("/task/prefs", async (req, res) => {
  return res.json({ ok: true, message: "Preferences saved" });
});

// ---------------------------------------------
// SET SHIFT (TEMP MOCK)
// ---------------------------------------------
router.post("/task/shift", async (req, res) => {
  return res.json({ ok: true, message: "Shift updated" });
});

export default router;
