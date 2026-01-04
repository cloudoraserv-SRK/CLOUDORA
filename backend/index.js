// ---------------------------------------------
// Cloudora Genie — Backend Main Server (CLEAN STABLE VERSION)
// ---------------------------------------------

import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
// Routers (working modules)
import catalogueRouter from "./routes/admin_upload.js";
import proposalRouter from "./routes/api_proposal.js";
import genieRoutes from "./routes/genie.js";
import genieMediaRoutes from "./routes/genie_media.js";
import tasksRouter from "./routes/tasks.js";
import adminRouter from "./routes/admin.js";
import jobRouter from "./routes/job/job.js";
import trainingRouter from "./routes/training.js";
import extractorRoutes from "./routes/extractor.js";


// ---- WRITE GCP KEY FILE BEFORE ANY GOOGLE SDK LOADS ----
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  fs.writeFileSync(
    "/app/gcp-key.json",
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    { encoding: "utf8" }
  );
  console.log("🔐 GCP key file written to /app/gcp-key.json");
}

// Logger
const logger = console;

// ---------------------------------------------
// Express Init
// ---------------------------------------------
const app = express();

// ---------------------------------------------
// CORS (Final Production Version)
// ---------------------------------------------
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
  "https://cloudoraserv.cloud",
  "https://cloudora-production.up.railway.app",
];

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.options("*", cors());
// ---------------------------------------------
// Body Parser
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
// ROUTES
// ---------------------------------------------

// Extractor (SERP + DB assign)
app.use("/api/extract", extractorRoutes);

// Job Flow (apply, create-employee, login)
app.use("/api/job", jobRouter);

// Admin area
app.use("/api/admin", adminRouter);

// Task manager
app.use("/api/tasks", tasksRouter);

// Catalogue upload
app.use("/api/catalogue", catalogueRouter);

// Proposal generator
app.use("/api/proposal", proposalRouter);

// Genie media routes (images/audio upload)
app.use("/api/genie", genieMediaRoutes);

// Genie Brain routes (TEXT + AI)
app.use("/api/genie", genieRoutes);


// Training module
app.use("/api/training", trainingRouter);

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Cloudora Backend OK");
});

// ---------------------------------------------
// START SERVER
// ---------------------------------------------
const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`🔥 Cloudora Genie backend running CLEAN on ${PORT}`);
});







