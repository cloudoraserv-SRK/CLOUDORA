import express from "express";
import { getEmployeeByToken, loginEmployee, logoutEmployee } from "../lib/employeeAuth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const result = await loginEmployee(req.body || {});
    return res.status(result.status).json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || e });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers["x-employee-token"] || req.query.token;
    const result = await getEmployeeByToken(token);
    return res.status(result.status).json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || e });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const token = req.headers["x-employee-token"] || req.body.token;
    const result = await logoutEmployee(token);
    return res.status(result.status).json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || e });
  }
});

export default router;
