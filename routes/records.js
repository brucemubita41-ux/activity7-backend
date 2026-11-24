const express = require("express");
const pool = require("../db");

const router = express.Router();

const ALLOWED_STATUSES = ["Pending", "In progress", "Completed"];

function validateRecordInput(body) {
  const { title, category, description, status } = body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return "Title is required and must be a non-empty string.";
  }
  if (!category || typeof category !== "string" || !category.trim()) {
    return "Category is required and must be a non-empty string.";
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return "Description is required and must be a non-empty string.";
  }
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return `Status is required and must be one of: ${ALLOWED_STATUSES.join(", ")}.`;
  }
  return null;
}

// GET /api/records - Read all records
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM records ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching records:", err);
    res.status(500).json({ message: "Failed to fetch records." });
  }
});

// GET /api/records/:id - Read single record
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid record ID." });
  }

  try {
    const result = await pool.query("SELECT * FROM records WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching record:", err);
    res.status(500).json({ message: "Failed to fetch record." });
  }
});

// POST /api/records - Create record
router.post("/", async (req, res) => {
  const validationError = validateRecordInput(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const { title, category, description, status } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title.trim(), category.trim(), description.trim(), status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating record:", err);
    res.status(500).json({ message: "Failed to create record." });
  }
});

// PUT /api/records/:id - Update record
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid record ID." });
  }

  const validationError = validateRecordInput(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const { title, category, description, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE records
       SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5
       RETURNING *`,
      [title.trim(), category.trim(), description.trim(), status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error updating record:", err);
    res.status(500).json({ message: "Failed to update record." });
  }
});

// DELETE /api/records/:id - Delete record
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid record ID." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }

    res.status(200).json({ message: "Record deleted." });
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).json({ message: "Failed to delete record." });
  }
});

module.exports = router;
