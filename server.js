require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const recordsRouter = require("./routes/records");

const app = express();

const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.length > 0 ? origins : "*",
  })
);
app.use(express.json());

// Root HTML API Guide (Step 8)
app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Campus Maintenance Requests API</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 860px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #222; }
    h1, h2 { color: #0f4c81; }
    code, pre { background: #f4f6f8; padding: 2px 6px; border-radius: 4px; }
    pre { padding: 12px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #0f4c81; color: #fff; }
    .note { background: #fff8e1; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; }
  </style>
</head>
<body>
  <h1>Campus Maintenance Requests API</h1>
  <p><strong>Student Number:</strong> 202510970</p>
  <p>A RESTful backend API built with Node.js, Express, and PostgreSQL for recording and tracking campus maintenance issues.</p>
  <p><strong>Live Base URL:</strong> <a href="${baseUrl}">${baseUrl}</a></p>
  <p>
    <strong>Quick Links:</strong>
    <a href="/health">/health</a> |
    <a href="/api/records">/api/records</a>
  </p>

  <div class="note">
    <strong>Note:</strong> This service is hosted on Render's free tier and may take up to 50 seconds to wake up on the first request after being idle.
  </div>

  <h2>Available Routes</h2>
  <table>
    <thead>
      <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
    </thead>
    <tbody>
      <tr><td>GET</td><td>/</td><td>HTML API guide page</td></tr>
      <tr><td>GET</td><td>/health</td><td>Server and PostgreSQL health check</td></tr>
      <tr><td>GET</td><td>/api/records</td><td>Fetch all maintenance records</td></tr>
      <tr><td>GET</td><td>/api/records/:id</td><td>Fetch a single record by ID</td></tr>
      <tr><td>POST</td><td>/api/records</td><td>Create a new maintenance record</td></tr>
      <tr><td>PUT</td><td>/api/records/:id</td><td>Update an existing maintenance record</td></tr>
      <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a maintenance record</td></tr>
    </tbody>
  </table>

  <h2>Input Rules &amp; Sample JSON Body</h2>
  <ul>
    <li><strong>title</strong>: Required non-empty string</li>
    <li><strong>category</strong>: Required non-empty string (e.g., Electrical, Plumbing, Furniture, ICT)</li>
    <li><strong>description</strong>: Required non-empty string</li>
    <li><strong>status</strong>: Required; must be <code>Pending</code>, <code>In progress</code>, or <code>Completed</code></li>
  </ul>
  <pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>

  <h2>HTTP Status Codes</h2>
  <ul>
    <li><strong>200 OK</strong> – Request succeeded</li>
    <li><strong>201 Created</strong> – New record saved</li>
    <li><strong>400 Bad Request</strong> – Missing or invalid fields</li>
    <li><strong>404 Not Found</strong> – Record or route not found</li>
    <li><strong>500 Internal Server Error</strong> – Database or server error</li>
  </ul>
</body>
</html>`);
});

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    console.error("Health check error:", err);
    res.status(500).json({ status: "error", message: "Database connection failed." });
  }
});

// Mount Records CRUD Routes
app.use("/api/records", recordsRouter);

// Fallback 404 JSON handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
