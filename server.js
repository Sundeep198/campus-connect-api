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
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_HOST?.includes("railway") 
      ? { rejectUnauthorized: false } 
      : undefined
});

(async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ Database Connected Successfully");
  } catch (err) {
    console.error("❌ Database Connection Failed:", err);
  }
})();

app.get("/debug/tables", async (req,res)=>{
  try{
    const [rows] = await db.query("SHOW TABLES");
    res.json(rows);
  }catch(err){
    res.json(err);
  }
});

// ======================
// GET ROUTES
// ======================

app.get("/", (req,res)=>{
  res.send("Campus Connect API Running");
});

app.get('/students', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM students");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: err.message});
    }
});

app.get('/staff', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM staff");
        res.json(rows);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.get('/staffusers', async (req, res) => {
  try {

    const [rows] = await db.query("SELECT * FROM staff_users");

    res.json(rows);

  } catch (err) {

    console.error("Staff Users Error:", err);

    res.status(500).json({
      success:false,
      error: err.message
    });

  }
});

app.get('/marks', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM marks");
        res.json(rows);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});


// ======================
// STUDENT ROUTES
// ======================

app.post('/students/add', async (req, res) => {
  try {

    const { id, username, password, name } = req.body;

    await db.query(
      "INSERT INTO students (id, username, password, name) VALUES (?, ?, ?, ?)",
      [id, username, password, name]
    );

    res.json({ success:true });

  } catch(err) {
    res.status(500).json({ success:false, error: err.message });
  }
});

app.post('/students/update', async (req, res) => {
  try {

    const { id, username, password, name } = req.body;

    await db.query(
      "UPDATE students SET username=?, password=?, name=? WHERE id=?",
      [username, password, name, id]
    );

    res.json({ success:true });

  } catch(err) {
    res.status(500).json({ success:false, error: err.message });
  }
});

app.post('/students/delete', async (req, res) => {
  try {

    const { id } = req.body;

    await db.query(
      "DELETE FROM students WHERE id=?",
      [id]
    );

    res.json({ success:true });

  } catch(err) {
    res.status(500).json({ success:false, error: err.message });
  }
});


// ======================
// MARKS ROUTES
// ======================

app.post('/marks/add', async (req, res) => {
  try {
    const { studentID, subject, marks, staffName, status } = req.body;

    await db.query(
      "INSERT INTO marks (studentID, subject, marks, staffName, status) VALUES (?, ?, ?, ?, ?)",
      [studentID, subject, marks, staffName, status]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});


app.post('/marks/update', async (req, res) => {
  try {
    const { studentID, subject, status, notes, meeting } = req.body;

    await db.query(
      "UPDATE marks SET status=?, notes=?, meeting=? WHERE studentID=? AND subject=?",
      [status, notes, meeting, studentID, subject]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});


app.post('/marks/updateMarks', async (req, res) => {
  try {
    const { studentID, subject, staffName, marks } = req.body;

    await db.query(
      "UPDATE marks SET marks=? WHERE studentID=? AND subject=? AND staffName=?",
      [marks, studentID, subject, staffName]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});


// ======================
// STAFF ROUTES
// ======================

app.post('/staff/update', async (req, res) => {
  try {
    const { name, availability, block, room, date, startTime, duration, endTime } = req.body;

    await db.query(
      "UPDATE staff SET availability=?, block=?, room=?, date=?, startTime=?, duration=?, endTime=? WHERE name=?",
      [availability, block, room, date, startTime, duration, endTime, name]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

app.get("/marks/template-full", async (req,res)=>{


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

const staffName = req.body.staffName;

if(!req.file){
return res.status(400).json({error:"No file uploaded"});
}

const workbook = XLSX.read(req.file.buffer,{type:"buffer"});
const sheet = workbook.Sheets["MarksEntry"];

if(!sheet){
return res.status(400).json({error:"Invalid Template"});
}

let rows = XLSX.utils.sheet_to_json(sheet,{defval:""});
rows = rows.filter(r=>r["Student Name"] || r["Marks"]);

let success=0,updated=0,errorRows=[];

for(let row of rows){

let id = row["Student ID"];
let subject = row["Subject"];
let marks = parseInt(row["Marks"]);

if(!id || !subject || isNaN(marks) || marks < 0 || marks > 100){
errorRows.push(row);
continue;
}

const [existing] = await db.query(
"SELECT * FROM marks WHERE studentID=? AND subject=? AND staffName=?",
[id, subject, staffName]
);

if(existing.length > 0){

await db.query(
"UPDATE marks SET marks=? WHERE studentID=? AND subject=? AND staffName=?",
[marks, id, subject, staffName]
);

updated++;

}else{

await db.query(
"INSERT INTO marks(studentID,subject,marks,staffName,status) VALUES(?,?,?,?, 'Pending')",
[id, subject, marks, staffName]
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

if(!req.body.data){
return res.status(400).json({error:"No data provided"});
}

const rows = req.body.data;

let success = 0;
let updated = 0;
let errorCount = 0;

for(const row of rows){

const {studentID,subject,marks,staffName} = row;

if(!studentID || !subject || marks==null){
errorCount++;
continue;
}

const [existing] = await db.query(
"SELECT * FROM marks WHERE studentID=? AND subject=? AND staffName=?",
[studentID,subject,staffName]
);

if(existing.length > 0){

await db.query(
"UPDATE marks SET marks=? WHERE studentID=? AND subject=? AND staffName=?",
[marks,studentID,subject,staffName]
);

updated++;

}else{

await db.query(
"INSERT INTO marks(studentID,subject,marks,staffName,status) VALUES(?,?,?,?, 'Pending')",
[studentID,subject,marks,staffName]
);

success++;

}
}

res.json({
successCount:success,
updateCount:updated,
errorCount:errorCount
});

});

// ======================
// START SERVER
// ======================

app.use((err, req, res, next) => {
console.error("Unhandled Error:", err);
res.status(500).json({
success:false,
error:"Internal Server Error"
});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});