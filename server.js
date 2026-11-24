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
    origin: origins.length > 0 ? origins : "*"
  })
);
app.use(express.json());

// GET / - API Guide for the marker
app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Campus Maintenance Requests API Guide</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 860px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1f2937; }
    h1, h2 { color: #1456a0; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #d1d5db; padding: 0.6rem; text-align: left; }
    th { background: #f3f4f6; }
    pre { background: #f8fafc; border: 1px solid #cbd5e1; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    .note { background: #fef3c7; border-left: 4px solid #d97706; padding: 0.75rem 1rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>Campus Maintenance Requests API</h1>
  <p><strong>Student Number:</strong> 202510970</p>
  <p><strong>Description:</strong> Independent Node.js and Express REST API for reporting, tracking, updating, and deleting campus maintenance requests (ICT251 Activity 7).</p>
  <p><strong>Live API Base URL:</strong> <code>${baseUrl}</code></p>
  <p><strong>Quick Links:</strong> <a href="/health">/health</a> | <a href="/api/records">/api/records</a></p>

  <div class="note">
    <strong>Note:</strong> Free Render instances pause when idle, so the first request after inactivity may take 30–50 seconds to wake up.
  </div>

  <h2>Required Routes</h2>
  <table>
    <thead>
      <tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
    </thead>
    <tbody>
      <tr><td>GET</td><td><code>/</code></td><td>Show this API guide for the marker.</td></tr>
      <tr><td>GET</td><td><code>/health</code></td><td>Check that the server and database respond.</td></tr>
      <tr><td>GET</td><td><code>/api/records</code></td><td>Read all maintenance records.</td></tr>
      <tr><td>GET</td><td><code>/api/records/:id</code></td><td>Read one maintenance record by ID.</td></tr>
      <tr><td>POST</td><td><code>/api/records</code></td><td>Create a new maintenance record.</td></tr>
      <tr><td>PUT</td><td><code>/api/records/:id</code></td><td>Update all four editable fields of an existing record.</td></tr>
      <tr><td>DELETE</td><td><code>/api/records/:id</code></td><td>Delete a maintenance record by ID.</td></tr>
    </tbody>
  </table>

  <h2>Input Fields & Validation Rules</h2>
  <ul>
    <li><strong>title:</strong> String, 3 to 80 characters</li>
    <li><strong>category:</strong> String, 2 to 40 characters (e.g., Electrical, Plumbing, Furniture)</li>
    <li><strong>description:</strong> String, 5 to 300 characters</li>
    <li><strong>status:</strong> One of <code>Pending</code>, <code>In progress</code>, or <code>Completed</code></li>
  </ul>

  <h2>Sample POST / PUT JSON Body</h2>
  <pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>

  <h2>HTTP Status Codes</h2>
  <ul>
    <li><strong>200 OK:</strong> Successful GET, PUT, or DELETE</li>
    <li><strong>201 Created:</strong> Successful POST creation</li>
    <li><strong>400 Bad Request:</strong> Invalid input, invalid ID, or malformed JSON</li>
    <li><strong>404 Not Found:</strong> Record ID or route does not exist</li>
    <li><strong>500 / 503:</strong> Unexpected server or database error</li>
  </ul>
</body>
</html>`);
});

// GET /health - Check server and database connection
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", message: "Database connection failed." });
  }
});

// Mount records API router
app.use("/api/records", recordsRouter);

// Final 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Four-parameter error middleware (malformed JSON -> 400, server error -> 500)
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  console.error("Server error:", error);
  res.status(500).json({ message: "Internal server error." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
