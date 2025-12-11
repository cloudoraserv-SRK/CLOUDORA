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
// Express App Init
// ---------------------------------------------
const app = express();

// ---------------------------------------------
// CORS CONFIG (FINAL PRODUCTION VERSION)
// ---------------------------------------------
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
  "https://cloudoraserv.cloud",
  "https://cloudora-production.up.railway.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked: " + origin), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
  })
);

app.options("*", cors());

// ---------------------------------------------
// BODY PARSER
// ---------------------------------------------
app.use(bodyParser.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------------------------------------
// Supabase (Service Role)
// ---------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------------------------------------
// Memory Engine + Genie Init
// ---------------------------------------------
const memory = memoryModule({ supabase, logger });
const genie = createGenie({ logger });

// Utility
function safeText(v) {
  if (!v) return "";
  return String(v).trim();
}

// ---------------------------------------------
// SESSION HELPER
// ---------------------------------------------
async function ensureSession(sessionId, meta = {}) {
  if (!sessionId) sessionId = "sess_" + Date.now();
  const existing = await memory.getSession(sessionId);
  if (!existing) await memory.createSession(sessionId, meta);
  return sessionId;
}

// ---------------------------------------------
// ROUTES (ORDER MATTERS)
// ---------------------------------------------
app.use("/api/job", jobRouter);
app.use("/api/admin", adminRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/catalogue", catalogueRouter);
app.use("/api/proposal", proposalRouter);

// Genie Routes
app.use("/api/genie", genieRoutes);
app.use("/api/genie", genieMediaRoutes);

// Training Route
app.use("/api/training", trainingRouter);

// ---------------------------------------------
// SESSION + ROLE + MESSAGE ROUTES
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

app.post("/api/genie/role", async (req, res) => {
  try {
    const { role, sessionId: provided } = req.body || {};
    const sessionId = await ensureSession(provided);

    await memory.setState(sessionId, { role });

    const lower = String(role || "").toLowerCase();

    const redirects = {
      client: "/client/client.html",
      job: "/job/job.html",
      employee: "/employee/login.html",
      partner: "/partner/partner.html",
    };

    return res.json({
      reply: `Starting ${lower} flow...`,
      redirect: redirects[lower] || null,
    });
  } catch (e) {
    logger.error("role error:", e);
    return res.status(500).json({ error: "Role selection failed" });
  }
});

app.post("/api/genie/message", async (req, res) => {
  try {
    const { sessionId, message } = req.body || {};
    const id = await ensureSession(sessionId);

    const output = await genie.handleInput(id, String(message || "").trim());

    const reply = output.text || output.reply || "Okay!";

    return res.json({
      reply,
      sessionId: id
    });

  } catch (e) {
    logger.error("genie message error:", e);
    return res.status(500).json({ reply: "Genie failed" });
  }
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
    return res.status(500).json({ error: e.message });
  }
});

// ---------------------------------------------
// SERVER START
// ---------------------------------------------
const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`🔥 Cloudora Genie backend running on ${PORT}`);
});


