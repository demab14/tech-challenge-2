const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { CORS_ORIGIN } = require("./config");

const app = express();

const ID = uuidv4();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const HOST = "0.0.0.0";

app.use(express.json());

// --- CORS (safe defaults for this challenge) ---
app.use((req, res, next) => {
  // If CORS_ORIGIN is set, use it; otherwise allow all (useful for initial debugging).
  const origin = CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");

  // Allow common methods (ALB + browsers may send OPTIONS preflight)
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// --- Health endpoint for ALB target group health checks ---
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

// Return the GUID for the app call
function handleId(req, res) {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  res.status(200).json({ id: ID });
}

// Support both / and /api/ patterns
app.get("/", handleId);
app.get("/api", handleId);
app.get("/api/", handleId);

// Optional: if anything else is requested, still return the GUID
app.get("*", handleId);

app.listen(PORT, HOST, () => {
  console.log(`Backend started on http://${HOST}:${PORT} (ctrl+c to exit)`);
  console.log(`CORS_ORIGIN=${CORS_ORIGIN || "*"}`);
});
