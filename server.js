const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to Railway MySQL");
    }
});


// ======================
// GET ROUTES
// ======================

app.get('/students', (req, res) => {
    db.query("SELECT * FROM students", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/staff', (req, res) => {
    db.query("SELECT * FROM staff", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/staffusers', (req, res) => {
    db.query("SELECT * FROM staff_users", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/marks', (req, res) => {
    db.query("SELECT * FROM marks", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});


// ======================
// STUDENT ROUTES
// ======================

app.post('/students/add', (req, res) => {
    const { id, username, password, name } = req.body;
    db.query(
        "INSERT INTO students (id, username, password, name) VALUES (?, ?, ?, ?)",
        [id, username, password, name],
        (err) => {
            if (err) return res.status(500).json({ success:false, error: err.message });
            res.json({ success:true });
        }
    );
});

app.post('/students/update', (req, res) => {
    const { id, username, password, name } = req.body;
    db.query(
        "UPDATE students SET username=?, password=?, name=? WHERE id=?",
        [username, password, name, id],
        (err) => {
            if (err) return res.status(500).json({ success:false, error: err.message });
            res.json({ success:true });
        }
    );
});

app.post('/students/delete', (req, res) => {
    const { id } = req.body;
    db.query(
        "DELETE FROM students WHERE id=?",
        [id],
        (err) => {
            if (err) return res.status(500).json({ success:false, error: err.message });
            res.json({ success:true });
        }
    );
});


// ======================
// MARKS ROUTES
// ======================

app.post('/marks/add', (req, res) => {
    const { studentID, subject, marks, staffName, status } = req.body;
    db.query(
        "INSERT INTO marks (studentID, subject, marks, staffName, status) VALUES (?, ?, ?, ?, ?)",
        [studentID, subject, marks, staffName, status],
        (err) => {
            if (err) return res.status(500).json({ success:false, error: err.message });
            res.json({ success:true });
        }
    );
});

app.post('/marks/update', (req, res) => {
    const { studentID, subject, status, notes, meeting } = req.body;
    db.query(
        "UPDATE marks SET status=?, notes=?, meeting=? WHERE studentID=? AND subject=?",
        [status, notes, meeting, studentID, subject],
        (err) => {
            if (err) return res.status(500).json({ success:false, error: err.message });
            res.json({ success:true });
        }
    );
});

app.post('/marks/updateMarks', (req, res) => {
    const { studentID, subject, staffName, marks } = req.body;
    db.query(
        "UPDATE marks SET marks=? WHERE studentID=? AND subject=? AND staffName=?",
        [marks, studentID, subject, staffName],
        (err) => {
            if (err) return res.status(500).json({ success:false, error: err.message });
            res.json({ success:true });
        }
    );
});


// ======================
// STAFF ROUTES
// ======================

app.post('/staff/update', (req, res) => {
    const { name, availability, block, room, date, startTime, duration, endTime } = req.body;
    db.query(
        "UPDATE staff SET availability=?, block=?, room=?, date=?, startTime=?, duration=?, endTime=? WHERE name=?",
        [availability, block, room, date, startTime, duration, endTime, name],
        (err) => {
            if (err) return res.status(500).json({ success:false, error: err.message });
            res.json({ success:true });
        }
    );
});


// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});