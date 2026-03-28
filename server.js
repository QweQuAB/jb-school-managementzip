const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'school-system', 'public')));

// DB setup
const dbDir = path.join(__dirname, 'school-system', 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'school.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ─────────────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  value INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT,
  type TEXT DEFAULT 'blue',
  time TEXT DEFAULT (strftime('%H:%M','now','localtime'))
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admNo TEXT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  otherName TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  dob TEXT DEFAULT '',
  classId INTEGER,
  admDate TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  parent TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  address TEXT DEFAULT '',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staffId TEXT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  gender TEXT DEFAULT '',
  qualification TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  subjectId INTEGER,
  status TEXT DEFAULT 'Active',
  dateJoined TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level TEXT DEFAULT '',
  teacherId INTEGER,
  capacity INTEGER DEFAULT 40
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT DEFAULT '',
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Core',
  teacherId INTEGER
);

CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL,
  subjectId INTEGER,
  classId INTEGER,
  term TEXT DEFAULT 'Term 1',
  year INTEGER DEFAULT 2025,
  test1 REAL DEFAULT 0,
  test2 REAL DEFAULT 0,
  exam REAL DEFAULT 0,
  total REAL DEFAULT 0,
  grade TEXT DEFAULT 'F',
  date TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL,
  term TEXT DEFAULT 'Term 1',
  year INTEGER DEFAULT 2025,
  billed REAL DEFAULT 0,
  paid REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  method TEXT DEFAULT 'Cash',
  notes TEXT DEFAULT '',
  date TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL,
  classId INTEGER,
  date TEXT NOT NULL,
  term TEXT DEFAULT 'Term 1',
  status TEXT DEFAULT 'Present'
);

CREATE TABLE IF NOT EXISTS timetable_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  isBreak INTEGER DEFAULT 0,
  sortOrder INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS timetable_teacher_meta (
  teacherId INTEGER PRIMARY KEY,
  teacherType TEXT DEFAULT 'Full-time',
  availableDays TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  maxPeriodsPerDay INTEGER DEFAULT 6,
  isClassTeacher INTEGER DEFAULT 0,
  classTeacherId INTEGER
);

CREATE TABLE IF NOT EXISTS timetable_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacherId INTEGER NOT NULL,
  classId INTEGER NOT NULL,
  subjectId INTEGER NOT NULL,
  periodsPerWeek INTEGER DEFAULT 1,
  contactHours INTEGER DEFAULT 1,
  UNIQUE(teacherId, classId, subjectId)
);

CREATE TABLE IF NOT EXISTS timetable_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  classId INTEGER NOT NULL,
  day TEXT NOT NULL,
  periodId INTEGER NOT NULL,
  subjectId INTEGER,
  teacherId INTEGER,
  label TEXT DEFAULT '',
  UNIQUE(classId, day, periodId)
);
`);

// Seed default settings
const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)`);
[
  ['schoolName','My School'],['motto','Excellence in Education'],['address',''],
  ['city',''],['phone',''],['email',''],['website',''],['poBox',''],
  ['logo',''],['currentTerm','Term 1'],['academicYear','2025'],
  ['currency','₵'],['standardFee','0'],['admPrefix','STD'],
  ['adminName','Administrator'],['adminRole','Headmaster'],['gradingSystem','standard'],
  ['billingAppUrl',''],['setupComplete','0']
].forEach(([k,v]) => insertSetting.run(k,v));

// Seed default counters
const insertCounter = db.prepare(`INSERT OR IGNORE INTO counters(name,value) VALUES(?,?)`);
['student','teacher','class','subject','assessment','fee','attendance']
  .forEach(n => insertCounter.run(n, 1));

// ─── Helpers ────────────────────────────────────────────────────────────────
function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key);
  return row ? row.value : null;
}
function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)').run(key, String(value ?? ''));
}
function nextId(name) {
  const row = db.prepare('SELECT value FROM counters WHERE name=?').get(name);
  const id = row ? row.value : 1;
  db.prepare('UPDATE counters SET value=? WHERE name=?').run(id + 1, name);
  return id;
}
function logActivity(text, type = 'blue') {
  db.prepare('INSERT INTO activity(text,type) VALUES(?,?)').run(text, type);
  db.prepare('DELETE FROM activity WHERE id NOT IN (SELECT id FROM activity ORDER BY id DESC LIMIT 20)').run();
}

// ─── Settings ────────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key,value FROM settings').all();
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  res.json(obj);
});

app.put('/api/settings', (req, res) => {
  const upd = db.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)');
  const runAll = db.transaction(entries => entries.forEach(([k,v]) => upd.run(k, String(v ?? ''))));
  runAll(Object.entries(req.body));
  res.json({ success: true });
});

// ─── Activity ────────────────────────────────────────────────────────────────
app.get('/api/activity', (req, res) => {
  res.json(db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT 20').all());
});

// ─── Students ────────────────────────────────────────────────────────────────
app.get('/api/students', (req, res) => {
  res.json(db.prepare('SELECT * FROM students ORDER BY id').all());
});

app.post('/api/students', (req, res) => {
  const d = req.body;
  const year = getSetting('academicYear') || '2025';
  const prefix = getSetting('admPrefix') || 'STD';
  const id = nextId('student');
  const admNo = `${prefix}/${year}/${String(id).padStart(4,'0')}`;
  db.prepare(`INSERT INTO students(id,admNo,firstName,lastName,otherName,gender,dob,classId,admDate,status,parent,contact,address)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, admNo, d.firstName, d.lastName, d.otherName||'', d.gender||'', d.dob||'',
         d.classId||null, d.admDate||'', d.status||'Active', d.parent||'', d.contact||'', d.address||'');
  logActivity(`New student enrolled: ${d.firstName} ${d.lastName}`, 'green');
  res.json({ id, admNo });
});

app.put('/api/students/:id', (req, res) => {
  const d = req.body;
  db.prepare(`UPDATE students SET firstName=?,lastName=?,otherName=?,gender=?,dob=?,classId=?,admDate=?,status=?,parent=?,contact=?,address=? WHERE id=?`)
    .run(d.firstName, d.lastName, d.otherName||'', d.gender||'', d.dob||'',
         d.classId||null, d.admDate||'', d.status||'Active', d.parent||'', d.contact||'', d.address||'', req.params.id);
  res.json({ success: true });
});

app.delete('/api/students/:id', (req, res) => {
  const id = req.params.id;
  db.prepare('DELETE FROM students WHERE id=?').run(id);
  db.prepare('DELETE FROM fees WHERE studentId=?').run(id);
  db.prepare('DELETE FROM assessments WHERE studentId=?').run(id);
  db.prepare('DELETE FROM attendance WHERE studentId=?').run(id);
  res.json({ success: true });
});

// ─── Teachers ────────────────────────────────────────────────────────────────
app.get('/api/teachers', (req, res) => {
  res.json(db.prepare('SELECT * FROM teachers ORDER BY id').all());
});

app.post('/api/teachers', (req, res) => {
  const d = req.body;
  const year = getSetting('academicYear') || '2025';
  const id = nextId('teacher');
  const staffId = `TCH/${year}/${String(id).padStart(3,'0')}`;
  db.prepare(`INSERT INTO teachers(id,staffId,firstName,lastName,gender,qualification,phone,email,subjectId,status,dateJoined,specialization)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, staffId, d.firstName, d.lastName, d.gender||'', d.qualification||'', d.phone||'', d.email||'',
         d.subjectId||null, d.status||'Active', d.dateJoined||'', d.specialization||'');
  logActivity(`New teacher added: ${d.firstName} ${d.lastName}`, 'blue');
  res.json({ id, staffId });
});

app.put('/api/teachers/:id', (req, res) => {
  const d = req.body;
  db.prepare(`UPDATE teachers SET firstName=?,lastName=?,gender=?,qualification=?,phone=?,email=?,subjectId=?,status=?,dateJoined=?,specialization=? WHERE id=?`)
    .run(d.firstName, d.lastName, d.gender||'', d.qualification||'', d.phone||'', d.email||'',
         d.subjectId||null, d.status||'Active', d.dateJoined||'', d.specialization||'', req.params.id);
  res.json({ success: true });
});

app.delete('/api/teachers/:id', (req, res) => {
  db.prepare('DELETE FROM teachers WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Classes ────────────────────────────────────────────────────────────────
app.get('/api/classes', (req, res) => {
  res.json(db.prepare('SELECT * FROM classes ORDER BY id').all());
});

app.post('/api/classes', (req, res) => {
  const d = req.body;
  const info = db.prepare(`INSERT INTO classes(name,level,teacherId,capacity) VALUES(?,?,?,?)`)
    .run(d.name, d.level||'', d.teacherId||null, d.capacity||40);
  logActivity(`New class created: ${d.name}`, 'purple');
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/classes/:id', (req, res) => {
  const d = req.body;
  db.prepare(`UPDATE classes SET name=?,level=?,teacherId=?,capacity=? WHERE id=?`)
    .run(d.name, d.level||'', d.teacherId||null, d.capacity||40, req.params.id);
  res.json({ success: true });
});

app.delete('/api/classes/:id', (req, res) => {
  db.prepare('DELETE FROM classes WHERE id=?').run(req.params.id);
  db.prepare('UPDATE students SET classId=NULL WHERE classId=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Subjects ────────────────────────────────────────────────────────────────
app.get('/api/subjects', (req, res) => {
  res.json(db.prepare('SELECT * FROM subjects ORDER BY id').all());
});

app.post('/api/subjects', (req, res) => {
  const d = req.body;
  const info = db.prepare(`INSERT INTO subjects(code,name,category,teacherId) VALUES(?,?,?,?)`)
    .run(d.code||'', d.name, d.category||'Core', d.teacherId||null);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/subjects/:id', (req, res) => {
  const d = req.body;
  db.prepare(`UPDATE subjects SET code=?,name=?,category=?,teacherId=? WHERE id=?`)
    .run(d.code||'', d.name, d.category||'Core', d.teacherId||null, req.params.id);
  res.json({ success: true });
});

app.delete('/api/subjects/:id', (req, res) => {
  db.prepare('DELETE FROM subjects WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Assessments ─────────────────────────────────────────────────────────────
app.get('/api/assessments', (req, res) => {
  res.json(db.prepare('SELECT * FROM assessments ORDER BY id DESC').all());
});

app.post('/api/assessments', (req, res) => {
  const d = req.body;
  const info = db.prepare(`INSERT INTO assessments(studentId,subjectId,classId,term,year,test1,test2,exam,total,grade)
    VALUES(?,?,?,?,?,?,?,?,?,?)`)
    .run(d.studentId, d.subjectId||null, d.classId||null, d.term||'Term 1', d.year||2025,
         d.test1||0, d.test2||0, d.exam||0, d.total||0, d.grade||'F');
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/assessments/:id', (req, res) => {
  db.prepare('DELETE FROM assessments WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Fees ────────────────────────────────────────────────────────────────────
app.get('/api/fees', (req, res) => {
  res.json(db.prepare('SELECT * FROM fees ORDER BY id DESC').all());
});

app.post('/api/fees', (req, res) => {
  const d = req.body;
  const balance = (d.billed||0) - (d.paid||0);
  const info = db.prepare(`INSERT INTO fees(studentId,term,year,billed,paid,balance,method,notes)
    VALUES(?,?,?,?,?,?,?,?)`)
    .run(d.studentId, d.term||'Term 1', d.year||2025, d.billed||0, d.paid||0, balance, d.method||'Cash', d.notes||'');
  logActivity(`Fee payment recorded`, 'amber');
  res.json({ id: info.lastInsertRowid, balance });
});

app.put('/api/fees/:id', (req, res) => {
  const d = req.body;
  const balance = (d.billed||0) - (d.paid||0);
  db.prepare(`UPDATE fees SET studentId=?,term=?,year=?,billed=?,paid=?,balance=?,method=?,notes=? WHERE id=?`)
    .run(d.studentId, d.term||'Term 1', d.year||2025, d.billed||0, d.paid||0, balance, d.method||'Cash', d.notes||'', req.params.id);
  res.json({ success: true, balance });
});

app.delete('/api/fees/:id', (req, res) => {
  db.prepare('DELETE FROM fees WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Attendance ───────────────────────────────────────────────────────────────
app.get('/api/attendance', (req, res) => {
  res.json(db.prepare('SELECT * FROM attendance ORDER BY id DESC').all());
});

app.post('/api/attendance', (req, res) => {
  const records = req.body;
  const delExist = db.prepare(`DELETE FROM attendance WHERE studentId=? AND date=?`);
  const ins = db.prepare(`INSERT INTO attendance(studentId,classId,date,term,status) VALUES(?,?,?,?,?)`);
  const batch = db.transaction(recs => {
    recs.forEach(r => {
      delExist.run(r.studentId, r.date);
      ins.run(r.studentId, r.classId||null, r.date, r.term||'Term 1', r.status||'Present');
    });
  });
  batch(Array.isArray(records) ? records : [records]);
  logActivity(`Attendance marked`, 'green');
  res.json({ success: true });
});

app.delete('/api/attendance/:id', (req, res) => {
  db.prepare('DELETE FROM attendance WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Timetable Periods ────────────────────────────────────────────────────────
app.get('/api/timetable/periods', (req, res) => {
  res.json(db.prepare('SELECT * FROM timetable_periods ORDER BY sortOrder, id').all());
});

app.post('/api/timetable/periods', (req, res) => {
  const periods = req.body;
  db.prepare('DELETE FROM timetable_periods').run();
  const ins = db.prepare('INSERT INTO timetable_periods(name,startTime,endTime,isBreak,sortOrder) VALUES(?,?,?,?,?)');
  const batch = db.transaction(ps => ps.forEach((p, i) => ins.run(p.name, p.startTime, p.endTime, p.isBreak?1:0, i)));
  batch(Array.isArray(periods) ? periods : [periods]);
  res.json({ success: true });
});

// ─── Timetable Teacher Config ────────────────────────────────────────────────
app.get('/api/timetable/config', (req, res) => {
  const meta = db.prepare('SELECT * FROM timetable_teacher_meta').all();
  const assignments = db.prepare('SELECT * FROM timetable_assignments').all();
  res.json({ meta, assignments });
});

app.post('/api/timetable/config', (req, res) => {
  const { teacherId, teacherType, availableDays, maxPeriodsPerDay, isClassTeacher, classTeacherId, assignments } = req.body;
  db.prepare(`INSERT OR REPLACE INTO timetable_teacher_meta(teacherId,teacherType,availableDays,maxPeriodsPerDay,isClassTeacher,classTeacherId)
    VALUES(?,?,?,?,?,?)`)
    .run(teacherId, teacherType||'Full-time', (availableDays||[]).join(','), maxPeriodsPerDay||6, isClassTeacher?1:0, classTeacherId||null);

  if (Array.isArray(assignments)) {
    db.prepare('DELETE FROM timetable_assignments WHERE teacherId=?').run(teacherId);
    const ins = db.prepare('INSERT OR REPLACE INTO timetable_assignments(teacherId,classId,subjectId,periodsPerWeek,contactHours) VALUES(?,?,?,?,?)');
    const batch = db.transaction(ass => ass.forEach(a => ins.run(teacherId, a.classId, a.subjectId, a.periodsPerWeek||1, a.contactHours||1)));
    batch(assignments);
  }
  res.json({ success: true });
});

app.delete('/api/timetable/config/:teacherId', (req, res) => {
  db.prepare('DELETE FROM timetable_teacher_meta WHERE teacherId=?').run(req.params.teacherId);
  db.prepare('DELETE FROM timetable_assignments WHERE teacherId=?').run(req.params.teacherId);
  res.json({ success: true });
});

// ─── Timetable Slots ──────────────────────────────────────────────────────────
app.get('/api/timetable/slots', (req, res) => {
  res.json(db.prepare('SELECT * FROM timetable_slots').all());
});

app.post('/api/timetable/slots', (req, res) => {
  const slots = req.body;
  if (!Array.isArray(slots) || slots.length === 0) { return res.json({ success: true }); }
  const classIds = [...new Set(slots.map(s => s.classId))];
  const del = db.prepare('DELETE FROM timetable_slots WHERE classId=?');
  const ins = db.prepare('INSERT OR REPLACE INTO timetable_slots(classId,day,periodId,subjectId,teacherId,label) VALUES(?,?,?,?,?,?)');
  const batch = db.transaction(() => {
    classIds.forEach(c => del.run(c));
    slots.forEach(s => ins.run(s.classId, s.day, s.periodId, s.subjectId||null, s.teacherId||null, s.label||''));
  });
  batch();
  res.json({ success: true });
});

// ─── Export ───────────────────────────────────────────────────────────────────
app.get('/api/export', (req, res) => {
  const exportData = {
    students: db.prepare('SELECT * FROM students').all(),
    teachers: db.prepare('SELECT * FROM teachers').all(),
    classes: db.prepare('SELECT * FROM classes').all(),
    subjects: db.prepare('SELECT * FROM subjects').all(),
    assessments: db.prepare('SELECT * FROM assessments').all(),
    fees: db.prepare('SELECT * FROM fees').all(),
    attendance: db.prepare('SELECT * FROM attendance').all(),
    settings: db.prepare('SELECT * FROM settings').all(),
    exportedAt: new Date().toISOString()
  };
  res.setHeader('Content-Disposition', `attachment; filename=school_export_${new Date().toISOString().split('T')[0]}.json`);
  res.json(exportData);
});

// ─── Stats ────────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json({
    students: db.prepare('SELECT COUNT(*) as n FROM students').get().n,
    teachers: db.prepare('SELECT COUNT(*) as n FROM teachers').get().n,
    classes: db.prepare('SELECT COUNT(*) as n FROM classes').get().n,
    totalBilled: db.prepare('SELECT COALESCE(SUM(billed),0) as n FROM fees').get().n,
    totalPaid: db.prepare('SELECT COALESCE(SUM(paid),0) as n FROM fees').get().n,
    totalBalance: db.prepare('SELECT COALESCE(SUM(balance),0) as n FROM fees').get().n,
    arrearsCount: db.prepare('SELECT COUNT(*) as n FROM fees WHERE balance>0').get().n,
    presentCount: db.prepare("SELECT COUNT(*) as n FROM attendance WHERE status='Present'").get().n,
    totalAttendance: db.prepare('SELECT COUNT(*) as n FROM attendance').get().n,
    classCounts: db.prepare(`SELECT c.id, c.name, COUNT(s.id) as enrolled, c.capacity FROM classes c LEFT JOIN students s ON s.classId=c.id GROUP BY c.id`).all()
  });
});

// ─── Fallback ─────────────────────────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'school-system', 'public', 'index.html'));
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`School Management System running on port ${PORT}`);
  console.log(`Database: ${path.join(dbDir, 'school.db')}`);
});
