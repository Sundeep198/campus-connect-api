const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS so your Android app can connect
app.use(cors());
// Allow the server to read JSON data from POST requests
app.use(express.json());

// --- Mock Database (Resets when server restarts) ---
let db = {
    students: [
        { id: "101", name: "Sundeep Kumar", username: "student", password: "123" }
    ],
    staff_users: [
        { name: "Prof. Smith", username: "staff", password: "456" }
    ],
    staff_availability: [
        {
            name: "Prof. Smith",
            designation: "HOD CSE",
            availability: "Available",
            block: "A",
            room: "101",
            date: new Date().toISOString().split('T')[0],
            startTime: "10:00",
            duration: 60,
            endTime: "11:00"
        }
    ],
    marks: []
};

// --- Endpoints ---

// Get all students
app.get('/students', (req, res) => res.json(db.students));

// Get staff login users
app.get('/staffusers', (req, res) => res.json(db.staff_users));

// Get staff directory/availability
app.get('/staff', (req, res) => res.json(db.staff_availability));

// Update staff availability
app.post('/staff/update', (req, res) => {
    const update = req.body;
    const index = db.staff_availability.findIndex(s => s.name === update.name);
    if (index !== -1) {
        db.staff_availability[index] = { ...db.staff_availability[index], ...update };
    } else {
        db.staff_availability.push(update);
    }
    res.json({ status: "success" });
});

// Get all marks
app.get('/marks', (req, res) => res.json(db.marks));

// Add new marks
app.post('/marks/add', (req, res) => {
    db.marks.push(req.body);
    res.status(201).json({ status: "success" });
});

// Update existing marks (Accept/Review)
app.post('/marks/update', (req, res) => {
    const update = req.body;
    const index = db.marks.findIndex(m => m.studentID === update.studentID && m.subject === update.subject);
    if (index !== -1) {
        db.marks[index] = { ...db.marks[index], ...update };
        res.json({ status: "success" });
    } else {
        res.status(404).json({ status: "error", message: "Mark not found" });
    }
});

// --- Server Startup ---
// Railway automatically provides the PORT environment variable
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});