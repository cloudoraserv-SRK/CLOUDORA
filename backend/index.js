// ---------------------------------------------
// Cloudora Genie — Backend Main Server (FINAL)
// ---------------------------------------------

import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

// Core Modules
import createGenie from "./genie/genie-core.js";
import { logOnboardingStep } from "./genie/flow_manager.js";

// Routers
import catalogueRouter from "./routes/admin_upload.js";
import proposalRouter from "./routes/api_proposal.js";
import genieRoutes from "./routes/genie.js";
import genieMediaRoutes from "./routes/genie_media.js";
import tasksRouter from "./routes/tasks.js";
import adminRouter from "./routes/admin.js";
import jobRouter from "./routes/job/job.js";

// Memory Engine
import memoryModule from "./genie/memory/memory.js";
import trainingRouter from "./routes/training.js";

// Logger
const logger = console;

// ---------------------------------------------
// Express App
// ---------------------------------------------
// ---------------------------------------------
// CORS CONFIG (FINAL FIX)
// ---------------------------------------------
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
  "https://cloudoraserv.cloud",
  "https://cloudora-production.up.railway.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser tools (Postman, Curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS blocked: " + origin), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false
  })
);

// Proper preflight handler
app.options("*", cors());


app.use(bodyParser.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/training", trainingRouter);

// ---------------------------------------------
// Supabase (Service Role for backend)
// ---------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------------------------------------
// Memory Engine Init
// ---------------------------------------------
const memory = memoryModule({ supabase, logger });

// ---------------------------------------------
// Genie Core Init
// ---------------------------------------------
const genie = createGenie({ logger });

// Clean utility
function safeText(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

// ---------------------------------------------
// Session Helper
// ---------------------------------------------
async function ensureSession(sessionId, meta = {}) {
  if (!sessionId) sessionId = "sess_" + Date.now();
  const existing = await memory.getSession(sessionId);
  if (!existing) await memory.createSession(sessionId, meta);
  return sessionId;
}

// ---------------------------------------------
// ROUTES (ORDER MATTERS — JOB FIRST, ETC.)
// ---------------------------------------------
app.use("/api/job", jobRouter);
app.use("/api/admin", adminRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/catalogue", catalogueRouter);
app.use("/api/proposal", proposalRouter);

// Genie
app.use("/api/genie", genieRoutes);
app.use("/api/genie", genieMediaRoutes);

// ---------------------------------------------
// Create New Session
// ---------------------------------------------
app.post("/api/genie/start", async (req, res) => {
  try {
    const { sessionId: provided, meta } = req.body || {};
    const sessionId =
      provided || "sess_" + Math.random().toString(36).slice(2, 10);

    await memory.createSession(sessionId, meta || {});
    return res.json({ ok: true, sessionId });
  } catch (e) {
    logger.error("start session error:", e);
    return res.status(500).json({ error: "Unable to create session" });
  }
});

// ---------------------------------------------
// Role Selection Handler
// ---------------------------------------------
app.post("/api/genie/role", async (req, res) => {
  try {
    const { role, sessionId: provided } = req.body || {};
    const sessionId = await ensureSession(provided);

    await memory.setState(sessionId, { role });

    switch (String(role || "").toLowerCase()) {
      case "client":
        return res.json({
          reply: "Great! Let’s grow your business.",
          redirect: "/client/client.html",
        });

      case "job":
        return res.json({
          reply: "Starting your job application.",
          redirect: "/job/job.html",
        });

      case "employee":
        return res.json({
          reply: "Opening employee login…",
          redirect: "/employee/login.html",
        });

      case "partner":
        return res.json({
          reply: "Starting partner onboarding.",
          redirect: "/partner/partner.html",
        });

      default:
        return res.json({
          reply: "Please choose the correct option.",
          redirect: null,
        });
    }
  } catch (e) {
    logger.error("role error:", e);
    return res.status(500).json({ error: "Role selection failed" });
  }
});

// ---------------------------------------------
// MAIN GENIE MESSAGE HANDLER (NEW)
// ---------------------------------------------
app.post("/api/genie/message", async (req, res) => {
  try {
    const { sessionId, message } = req.body || {};
    const id = await ensureSession(sessionId);

    const output = await genie.handleInput(id, safeText(message || ""));
    return res.json({ ...output, sessionId: id });
  } catch (e) {
    logger.error("genie message error:", e);
    return res.status(500).json({ error: "Genie failed to respond" });
  }
});

// ---------------------------------------------
// OLD (Legacy) Genie Handler — backward compatibility
// ---------------------------------------------
app.post("/api/genie", async (req, res) => {
  const { sessionId, text } = req.body;
  const id = await ensureSession(sessionId);

  const output = await genie.handleInput(id, safeText(text || ""));
  return res.json({ ...output, sessionId: id });
});

// ---------------------------------------------
// Onboarding Logs
// ---------------------------------------------
app.post("/api/onboarding/log", async (req, res) => {
  try {
    const { step, answer, applicationId } = req.body || {};
    await logOnboardingStep(step, answer, applicationId || null);
    return res.json({ ok: true });
  } catch (e) {
    logger.error("onboarding log error:", e);
    return res.status(500).json({ error: e.message || "Log failed" });
  }
});

// ---------------------------------------------
// SERVER START
// ---------------------------------------------
const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`🔥 Cloudora Genie backend running on ${PORT}`);
});




