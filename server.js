const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const ExcelJS = require("exceljs");
const multer = require("multer");
const XLSX = require("xlsx");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// ======================
// MYSQL CONNECTION
// ======================

let db;

async function connectDB() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: { rejectUnauthorized: false }
    });

    console.log("✅ Connected to Railway MySQL");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

connectDB();

// ======================
// GET ROUTES
// ======================

app.get("/students", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM students");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/staff", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM staff");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/staffusers", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM staff_users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/marks", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM marks");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================
// STUDENT ROUTES
// ======================

app.post("/students/add", async (req, res) => {
  try {
    const { id, username, password, name } = req.body;

    await db.query(
      "INSERT INTO students (id, username, password, name) VALUES (?, ?, ?, ?)",
      [id, username, password, name]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/students/update", async (req, res) => {
  try {
    const { id, username, password, name } = req.body;

    await db.query(
      "UPDATE students SET username=?, password=?, name=? WHERE id=?",
      [username, password, name, id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/students/delete", async (req, res) => {
  try {
    const { id } = req.body;

    await db.query("DELETE FROM students WHERE id=?", [id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// MARKS ROUTES
// ======================

app.post("/marks/add", async (req, res) => {
  try {
    const { studentID, subject, marks, staffName, status } = req.body;

    await db.query(
      "INSERT INTO marks (studentID, subject, marks, staffName, status) VALUES (?, ?, ?, ?, ?)",
      [studentID, subject, marks, staffName, status]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/marks/update", async (req, res) => {
  try {
    const { studentID, subject, status, notes, meeting } = req.body;

    await db.query(
      "UPDATE marks SET status=?, notes=?, meeting=? WHERE studentID=? AND subject=?",
      [status, notes, meeting, studentID, subject]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// BULK UPLOAD JSON
// ======================

app.post("/marks/bulkUploadJSON", async (req, res) => {
  try {
    const rows = req.body.data;

    let success = 0;
    let updated = 0;

    for (let row of rows) {
      const { studentID, subject, marks, staffName } = row;

      const [existing] = await db.query(
        "SELECT * FROM marks WHERE studentID=? AND subject=? AND staffName=?",
        [studentID, subject, staffName]
      );

      if (existing.length > 0) {
        await db.query(
          "UPDATE marks SET marks=? WHERE studentID=? AND subject=? AND staffName=?",
          [marks, studentID, subject, staffName]
        );
        updated++;
      } else {
        await db.query(
          "INSERT INTO marks (studentID, subject, marks, staffName, status) VALUES (?, ?, ?, ?, 'Pending')",
          [studentID, subject, marks, staffName]
        );
        success++;
      }
    }

    res.json({ successCount: success, updateCount: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================
// ROOT TEST ROUTE
// ======================

app.get("/", (req, res) => {
  res.json({ message: "Campus Connect API Running 🚀" });
});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});