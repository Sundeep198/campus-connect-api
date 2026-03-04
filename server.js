const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');


const ExcelJS = require("exceljs");
const multer = require("multer");
const XLSX = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() }); 
const app = express();
app.use(cors());
app.use(express.json());

// ✅ MySQL Connection (Promise Version)
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
    console.error("Database connection failed:", err);
  }
}

connectDB();


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

app.get("/marks/template-full", async (req,res)=>{

const ExcelJS = require("exceljs");

let workbook = new ExcelJS.Workbook();
let sheet = workbook.addWorksheet("MarksEntry");

// Get students
let [students] = await db.query("SELECT id,name FROM students");

// Get all subjects from marks table
let [subjectRows] = await db.query("SELECT DISTINCT subject FROM marks");
let subjects = subjectRows.map(r=>r.subject);

// Get all marks
let [marks] = await db.query("SELECT studentID,subject,marks FROM marks");

sheet.columns = [
{header:"Student Name", key:"name", width:20},
{header:"Student ID", key:"id", width:15},
{header:"Subject", key:"subject", width:20},
{header:"Marks", key:"marks", width:10}
];

students.forEach(student=>{
subjects.forEach(subject=>{

let existing = marks.find(m=>
m.studentID === student.id &&
m.subject === subject
);

sheet.addRow({
name: student.name,
id: student.id,
subject: subject,
marks: existing ? existing.marks : ""
});

});
});

sheet.views = [{state:'frozen', ySplit:1}];
res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);

res.setHeader(
  "Content-Disposition",
  "attachment; filename=marks-template.xlsx"
);
await workbook.xlsx.write(res);
res.end();

});

app.get("/marks/template-staff", async (req,res)=>{

const ExcelJS = require("exceljs");

let staffName = req.query.staffName;

if(!staffName){
return res.status(400).send("Staff required");
}

// Subjects handled by staff
let [subjectRows] = await db.query(
"SELECT DISTINCT subject FROM marks WHERE staffName=?",
[staffName]
);

let subjects = subjectRows.map(r=>r.subject);

// Students
let [students] = await db.query("SELECT id,name FROM students");

// Marks of that staff
let [marks] = await db.query(
"SELECT studentID,subject,marks FROM marks WHERE staffName=?",
[staffName]
);

let workbook = new ExcelJS.Workbook();
let sheet = workbook.addWorksheet("MarksEntry");

sheet.columns = [
{header:"Student Name", key:"name", width:20},
{header:"Student ID", key:"id", width:15},
{header:"Subject", key:"subject", width:20},
{header:"Marks", key:"marks", width:10}
];

students.forEach(student=>{
subjects.forEach(subject=>{

let existing = marks.find(m=>
m.studentID === student.id &&
m.subject === subject
);

sheet.addRow({
name: student.name,
id: student.id,
subject: subject,
marks: existing ? existing.marks : ""
});

});
});

sheet.views = [{state:'frozen', ySplit:1}];
res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);

res.setHeader(
  "Content-Disposition",
  "attachment; filename=marks-template.xlsx"
);
await workbook.xlsx.write(res);
res.end();

});


app.post("/marks/bulkUpload", upload.single("file"), async (req,res)=>{
try {

const workbook = XLSX.read(req.file.buffer,{type:"buffer"});
const sheet = workbook.Sheets["MarksEntry"];

if(!sheet){
return res.status(400).json({error:"Invalid Template"});
}

let rows = XLSX.utils.sheet_to_json(sheet,{defval:""});
rows = rows.filter(r=>r["Student Name"] || r["Marks"]);

let success=0,updated=0,errorRows=[];

for(let row of rows){

let id=row["Student ID"];
let subject=row["Subject"];
let marks=parseInt(row["Marks"]);

if(!id || !subject || isNaN(marks) || marks<0 || marks>100){
errorRows.push(row);
continue;
}

let existing = await db.query(
"SELECT * FROM marks WHERE studentID=? AND subject=?",
[id,subject]
);

if(existing.rows.length>0){
await db.query(
"UPDATE marks SET marks=? WHERE studentID=? AND subject=?",
[marks,id,subject]
);
updated++;
}else{
await db.query(
"INSERT INTO marks(studentID,subject,marks,status) VALUES(?,?,?,'Pending')",
[id,subject,marks]
);
success++;
}
}

res.json({
successCount:success,
updateCount:updated,
errorCount:errorRows.length,
errors:errorRows
});

}catch(err){
console.error(err);
res.status(500).json({error:"Upload failed"});
}
});

app.post("/marks/bulkUploadJSON", async (req,res)=>{

let rows=req.body.data;

let success=0,updated=0,errorRows=[];

for(let row of rows){

let {studentID,subject,marks}=row;

let existing = await db.query(
"SELECT * FROM marks WHERE studentID=? AND subject=? AND staffName=?",
[studentID,subject,row.staffName]
);

if(existing.length>0){
await db.query(
"UPDATE marks SET marks=? WHERE studentID=? AND subject=? AND staffName=?",
[marks,studentID,subject,row.staffName]
);
updated++;
}else{
await db.query(
"INSERT INTO marks(studentID,subject,marks,staffName,status) VALUES(?,?,?,?, 'Pending')",
[studentID,subject,marks,row.staffName]
);
success++;
}
}

res.json({successCount:success,updateCount:updated});
}); 


// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});