// backend/routes/tasks.js
import express from "express";
import "dotenv/config";
import taskEngine from "../genie/task_engine.js";

const router = express.Router();

// POST /api/task/claim  { taskId, employeeId }
router.post("/task/claim", async (req, res) => {
  const { taskId, employeeId } = req.body;
  if (!taskId || !employeeId) return res.status(400).json({ error: "taskId & employeeId required" });
  const out = await taskEngine.claimTask(taskId, employeeId);
  return res.json(out);
});

// POST /api/task/unclaim  { taskId, employeeId }
router.post("/task/unclaim", async (req, res) => {
  const { taskId, employeeId } = req.body;
  const out = await taskEngine.unclaimTask(taskId, employeeId);
  return res.json(out);
});

// POST /api/task/start  { taskId, employeeId }
router.post("/task/start", async (req, res) => {
  const { taskId, employeeId } = req.body;
  const out = await taskEngine.startTask(taskId, employeeId);
  return res.json(out);
});

// POST /api/task/stop  { taskId, employeeId, markComplete, notes, callStatus }
router.post("/task/stop", async (req, res) => {
  const { taskId, employeeId, markComplete=false, notes="", callStatus=null } = req.body;
  const out = await taskEngine.stopTask(taskId, employeeId, { markComplete, notes, callStatus });
  return res.json(out);
});

// POST /api/task/complete  { taskId, employeeId, notes }
router.post("/task/complete", async (req, res) => {
  const { taskId, employeeId, notes="" } = req.body;
  const out = await taskEngine.completeTask(taskId, employeeId, notes);
  return res.json(out);
});

// GET /api/task/list?employeeId=...
router.get("/task/list", async (req, res) => {
  const employeeId = req.query.employeeId || null;
  const out = await taskEngine.listTasksForEmployee(employeeId, {});
  return res.json(out);
});

// GET /api/task/unassigned
router.get("/task/unassigned", async (req, res) => {
  const out = await taskEngine.listUnassignedTasks(200);
  return res.json(out);
});

// POST /api/task/prefs { employeeId, country, product, shift }
router.post("/task/prefs", async (req, res) => {
  const { employeeId, country, product, shift } = req.body;
  if (!employeeId) return res.status(400).json({ error: "employeeId required" });
  const out = await taskEngine.setEmployeePrefs(employeeId, { country, product, shift });
  return res.json(out);
});

// POST /api/task/shift { employeeId, shift }
router.post("/task/shift", async (req, res) => {
  const { employeeId, shift } = req.body;
  if (!employeeId || !shift) return res.status(400).json({ error: "employeeId & shift required" });
  const out = await taskEngine.setShift(employeeId, shift);
  return res.json(out);
});

export default router;
