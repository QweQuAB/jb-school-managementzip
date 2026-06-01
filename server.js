const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'school-system', 'public')));

const dbDir = path.join(__dirname, 'school-system', 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'school.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT,
  type TEXT DEFAULT 'blue',
  time TEXT DEFAULT (strftime('%H:%M','now','localtime'))
);
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT, admNo TEXT, firstName TEXT NOT NULL,
  lastName TEXT NOT NULL, otherName TEXT DEFAULT '', gender TEXT DEFAULT '',
  dob TEXT DEFAULT '', classId INTEGER, admDate TEXT DEFAULT '',
  status TEXT DEFAULT 'Active', parent TEXT DEFAULT '', contact TEXT DEFAULT '',
  address TEXT DEFAULT '', photo TEXT DEFAULT '', createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, staffId TEXT, firstName TEXT NOT NULL,
  lastName TEXT NOT NULL, gender TEXT DEFAULT '', qualification TEXT DEFAULT '',
  phone TEXT DEFAULT '', role TEXT DEFAULT '', subjectId INTEGER,
  status TEXT DEFAULT 'Active', dateJoined TEXT DEFAULT '', specialization TEXT DEFAULT '',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, level TEXT DEFAULT '',
  teacherId INTEGER, teacher2Id INTEGER, capacity INTEGER DEFAULT 40
);
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT DEFAULT '', name TEXT NOT NULL,
  category TEXT DEFAULT 'Core', teacherId INTEGER
);
CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, studentId INTEGER NOT NULL, subjectId INTEGER,
  classId INTEGER, term TEXT DEFAULT 'Term 1', year INTEGER DEFAULT 2025,
  test1 REAL DEFAULT 0, test2 REAL DEFAULT 0, exam REAL DEFAULT 0,
  total REAL DEFAULT 0, grade TEXT DEFAULT 'F', date TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS fees (
  id INTEGER PRIMARY KEY AUTOINCREMENT, studentId INTEGER NOT NULL,
  term TEXT DEFAULT 'Term 1', year INTEGER DEFAULT 2025, billed REAL DEFAULT 0,
  paid REAL DEFAULT 0, balance REAL DEFAULT 0, method TEXT DEFAULT 'Cash',
  notes TEXT DEFAULT '', date TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT, studentId INTEGER NOT NULL,
  classId INTEGER, date TEXT NOT NULL, term TEXT DEFAULT 'Term 1',
  status TEXT DEFAULT 'Present'
);
CREATE TABLE IF NOT EXISTS timetable_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
  startTime TEXT NOT NULL, endTime TEXT NOT NULL, isBreak INTEGER DEFAULT 0,
  sortOrder INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS timetable_teacher_meta (
  teacherId INTEGER PRIMARY KEY, teacherType TEXT DEFAULT 'Full-time',
  availableDays TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri', maxPeriodsPerDay INTEGER DEFAULT 6,
  isClassTeacher INTEGER DEFAULT 0, classTeacherId INTEGER
);
CREATE TABLE IF NOT EXISTS timetable_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, teacherId INTEGER NOT NULL,
  classId INTEGER NOT NULL, subjectId INTEGER NOT NULL,
  periodsPerWeek INTEGER DEFAULT 1, contactHours INTEGER DEFAULT 1,
  UNIQUE(teacherId, classId, subjectId)
);
CREATE TABLE IF NOT EXISTS timetable_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT, classId INTEGER NOT NULL, day TEXT NOT NULL,
  periodId INTEGER NOT NULL, subjectId INTEGER, teacherId INTEGER,
  label TEXT DEFAULT '', UNIQUE(classId, day, periodId)
);

-- NEW TABLES
CREATE TABLE IF NOT EXISTS grading_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  minScore INTEGER NOT NULL, maxScore INTEGER NOT NULL,
  grade TEXT NOT NULL, remarks TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
  startDate TEXT NOT NULL, endDate TEXT, type TEXT DEFAULT 'Event',
  description TEXT DEFAULT '', term TEXT DEFAULT '', year INTEGER DEFAULT 2025,
  color TEXT DEFAULT '#3b82f6', createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT NOT NULL,
  amount REAL NOT NULL, date TEXT NOT NULL, description TEXT DEFAULT '',
  approvedBy TEXT DEFAULT '', receipt TEXT DEFAULT '',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT DEFAULT '',
  quantity INTEGER DEFAULT 0, condition TEXT DEFAULT 'Good',
  dateAcquired TEXT DEFAULT '', location TEXT DEFAULT '',
  minStock INTEGER DEFAULT 5, notes TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS scholarships (
  id INTEGER PRIMARY KEY AUTOINCREMENT, studentId INTEGER NOT NULL,
  scholarshipType TEXT DEFAULT '', sponsorName TEXT DEFAULT '',
  benefits TEXT DEFAULT '', photo TEXT DEFAULT '',
  startDate TEXT DEFAULT '', endDate TEXT DEFAULT '',
  status TEXT DEFAULT 'Active', notes TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, message TEXT,
  type TEXT DEFAULT 'info', module TEXT DEFAULT '', link TEXT DEFAULT '',
  dismissed INTEGER DEFAULT 0, createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, studentId INTEGER NOT NULL,
  fromClassId INTEGER, toClassId INTEGER, action TEXT DEFAULT 'Promoted',
  reason TEXT DEFAULT '', term TEXT DEFAULT '', year INTEGER DEFAULT 2025,
  date TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS conduct_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, studentId INTEGER NOT NULL,
  classId INTEGER, date TEXT NOT NULL, incident TEXT NOT NULL,
  action TEXT DEFAULT '', handledBy TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, subjectId INTEGER,
  classId INTEGER NOT NULL, dateAssigned TEXT NOT NULL, dueDate TEXT NOT NULL,
  description TEXT DEFAULT '', status TEXT DEFAULT 'Active'
);
CREATE TABLE IF NOT EXISTS staff_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT, teacherId INTEGER NOT NULL,
  date TEXT NOT NULL, status TEXT DEFAULT 'Present',
  UNIQUE(teacherId, date)
);
CREATE TABLE IF NOT EXISTS leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT, teacherId INTEGER NOT NULL,
  type TEXT DEFAULT 'Annual', startDate TEXT NOT NULL, endDate TEXT NOT NULL,
  reason TEXT DEFAULT '', status TEXT DEFAULT 'Pending', approvedBy TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS payroll (
  id INTEGER PRIMARY KEY AUTOINCREMENT, teacherId INTEGER NOT NULL,
  month TEXT NOT NULL, year INTEGER NOT NULL, basicSalary REAL DEFAULT 0,
  allowances REAL DEFAULT 0, deductions REAL DEFAULT 0, netPay REAL DEFAULT 0,
  status TEXT DEFAULT 'Pending', UNIQUE(teacherId, month, year)
);
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL,
  targetClassId INTEGER, author TEXT DEFAULT 'Admin',
  datePosted TEXT DEFAULT CURRENT_TIMESTAMP, type TEXT DEFAULT 'General'
);
CREATE TABLE IF NOT EXISTS petty_cash (
  id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL,
  purpose TEXT NOT NULL, date TEXT NOT NULL, authorizedBy TEXT DEFAULT '',
  type TEXT DEFAULT 'Debit', balance REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT DEFAULT 'Admin',
  action TEXT NOT NULL, module TEXT DEFAULT '', oldValue TEXT DEFAULT '',
  newValue TEXT DEFAULT '', timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// ─── Migrations (safe alter table for existing DBs) ──────────────────────────
[
  ['teachers','role','TEXT DEFAULT \'\''],
  ['classes','teacher2Id','INTEGER']
].forEach(([tbl,col,def])=>{
  const cols=db.prepare(`PRAGMA table_info(${tbl})`).all().map(r=>r.name);
  if(!cols.includes(col)) db.exec(`ALTER TABLE ${tbl} ADD COLUMN ${col} ${def}`);
});

// ─── Seed defaults ────────────────────────────────────────────────────────────
const ins = db.prepare(`INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)`);
[
  ['schoolName','My School'],['motto','Excellence in Education'],['address',''],
  ['city',''],['phone',''],['email',''],['website',''],['poBox',''],
  ['logo',''],['currentTerm','Term 1'],['academicYear','2025'],
  ['currency','₵'],['standardFee','0'],['admPrefix','STD'],
  ['adminName','Administrator'],['adminRole','Headmaster'],['gradingSystem','standard'],
  ['billingAppUrl',''],['setupComplete','0'],
  ['schoolRegNo',''],['region',''],['district',''],
  ['chimeEnabled','1'],['chimeSound','bell'],['chimeVolume','0.6'],
  ['userRole','Administrator'],['userPin',''],['lowStockThreshold','5']
].forEach(([k,v])=>ins.run(k,v));

const insC = db.prepare(`INSERT OR IGNORE INTO counters(name,value) VALUES(?,?)`);
['student','teacher','class','subject','assessment','fee','attendance']
  .forEach(n=>insC.run(n,1));

// Seed default grading rules
if (db.prepare('SELECT COUNT(*) as n FROM grading_rules').get().n === 0) {
  const ig = db.prepare('INSERT INTO grading_rules(minScore,maxScore,grade,remarks) VALUES(?,?,?,?)');
  [[80,100,'A','Excellent'],[70,79,'B','Very Good'],[60,69,'C','Good'],[50,59,'D','Average'],[0,49,'F','Needs Improvement']]
    .forEach(r=>ig.run(...r));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getSetting = k => { const r=db.prepare('SELECT value FROM settings WHERE key=?').get(k); return r?r.value:null; };
const setSetting = (k,v) => db.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)').run(k,String(v??''));
function nextId(name) {
  const r=db.prepare('SELECT value FROM counters WHERE name=?').get(name);
  const id=r?r.value:1;
  db.prepare('UPDATE counters SET value=? WHERE name=?').run(id+1,name);
  return id;
}
function logActivity(text,type='blue') {
  db.prepare('INSERT INTO activity(text,type) VALUES(?,?)').run(text,type);
  db.prepare('DELETE FROM activity WHERE id NOT IN (SELECT id FROM activity ORDER BY id DESC LIMIT 25)').run();
}
function auditLog(action,module,oldVal='',newVal='') {
  db.prepare('INSERT INTO audit_log(user,action,module,oldValue,newValue) VALUES(?,?,?,?,?)').run('Admin',action,module,String(oldVal),String(newVal));
}
function calcGrade(total) {
  const rules=db.prepare('SELECT * FROM grading_rules ORDER BY minScore DESC').all();
  const rule=rules.find(r=>total>=r.minScore&&total<=r.maxScore);
  return rule?rule.grade:'F';
}

// ─── Settings ────────────────────────────────────────────────────────────────
app.get('/api/settings',(req,res)=>{
  const rows=db.prepare('SELECT key,value FROM settings').all();
  const obj={}; rows.forEach(r=>obj[r.key]=r.value); res.json(obj);
});
app.put('/api/settings',(req,res)=>{
  const upd=db.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)');
  const run=db.transaction(entries=>entries.forEach(([k,v])=>upd.run(k,String(v??''))));
  run(Object.entries(req.body)); res.json({success:true});
});

// ─── Activity ────────────────────────────────────────────────────────────────
app.get('/api/activity',(req,res)=>res.json(db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT 25').all()));

// ─── Grading Rules ───────────────────────────────────────────────────────────
app.get('/api/grading',(req,res)=>res.json(db.prepare('SELECT * FROM grading_rules ORDER BY minScore DESC').all()));
app.post('/api/grading',(req,res)=>{
  const {minScore,maxScore,grade,remarks}=req.body;
  const r=db.prepare('INSERT INTO grading_rules(minScore,maxScore,grade,remarks) VALUES(?,?,?,?)').run(minScore,maxScore,grade,remarks||'');
  auditLog('Added grading rule','Settings');
  res.json({id:r.lastInsertRowid});
});
app.put('/api/grading/:id',(req,res)=>{
  const {minScore,maxScore,grade,remarks}=req.body;
  db.prepare('UPDATE grading_rules SET minScore=?,maxScore=?,grade=?,remarks=? WHERE id=?').run(minScore,maxScore,grade,remarks||'',req.params.id);
  res.json({success:true});
});
app.delete('/api/grading/:id',(req,res)=>{
  db.prepare('DELETE FROM grading_rules WHERE id=?').run(req.params.id);
  res.json({success:true});
});

// ─── Students ────────────────────────────────────────────────────────────────
app.get('/api/students',(req,res)=>res.json(db.prepare('SELECT * FROM students ORDER BY id').all()));
app.post('/api/students',(req,res)=>{
  const d=req.body, year=getSetting('academicYear')||'2025', prefix=getSetting('admPrefix')||'STD';
  const id=nextId('student'), admNo=`${prefix}/${year}/${String(id).padStart(4,'0')}`;
  db.prepare(`INSERT INTO students(id,admNo,firstName,lastName,otherName,gender,dob,classId,admDate,status,parent,contact,address,photo)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id,admNo,d.firstName,d.lastName,d.otherName||'',d.gender||'',d.dob||'',d.classId||null,d.admDate||'',d.status||'Active',d.parent||'',d.contact||'',d.address||'',d.photo||'');
  logActivity(`Student enrolled: ${d.firstName} ${d.lastName}`,'green');
  auditLog('Added student','Students','',`${d.firstName} ${d.lastName}`);
  res.json({id,admNo});
});
app.put('/api/students/:id',(req,res)=>{
  const d=req.body;
  db.prepare(`UPDATE students SET firstName=?,lastName=?,otherName=?,gender=?,dob=?,classId=?,admDate=?,status=?,parent=?,contact=?,address=?,photo=? WHERE id=?`)
    .run(d.firstName,d.lastName,d.otherName||'',d.gender||'',d.dob||'',d.classId||null,d.admDate||'',d.status||'Active',d.parent||'',d.contact||'',d.address||'',d.photo||'',req.params.id);
  auditLog('Updated student','Students');
  res.json({success:true});
});
app.delete('/api/students/:id',(req,res)=>{
  const id=req.params.id;
  const s=db.prepare('SELECT firstName,lastName FROM students WHERE id=?').get(id);
  db.prepare('DELETE FROM students WHERE id=?').run(id);
  ['fees','assessments','attendance','promotions','conduct_log','scholarships'].forEach(t=>db.prepare(`DELETE FROM ${t} WHERE studentId=?`).run(id));
  auditLog('Deleted student','Students',s?`${s.firstName} ${s.lastName}`:'');
  res.json({success:true});
});

// ─── Teachers ────────────────────────────────────────────────────────────────
app.get('/api/teachers',(req,res)=>res.json(db.prepare('SELECT * FROM teachers ORDER BY id').all()));
app.post('/api/teachers',(req,res)=>{
  const d=req.body, year=getSetting('academicYear')||'2025', id=nextId('teacher');
  const staffId=`TCH/${year}/${String(id).padStart(3,'0')}`;
  db.prepare(`INSERT INTO teachers(id,staffId,firstName,lastName,gender,qualification,phone,role,subjectId,status,dateJoined,specialization)VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id,staffId,d.firstName,d.lastName,d.gender||'',d.qualification||'',d.phone||'',d.role||'',d.subjectId||null,d.status||'Active',d.dateJoined||'',d.specialization||'');
  logActivity(`Teacher added: ${d.firstName} ${d.lastName}`,'blue');
  auditLog('Added teacher','Teachers','',`${d.firstName} ${d.lastName}`);
  res.json({id,staffId});
});
app.put('/api/teachers/:id',(req,res)=>{
  const d=req.body;
  db.prepare(`UPDATE teachers SET firstName=?,lastName=?,gender=?,qualification=?,phone=?,role=?,subjectId=?,status=?,dateJoined=?,specialization=? WHERE id=?`)
    .run(d.firstName,d.lastName,d.gender||'',d.qualification||'',d.phone||'',d.role||'',d.subjectId||null,d.status||'Active',d.dateJoined||'',d.specialization||'',req.params.id);
  res.json({success:true});
});
app.delete('/api/teachers/:id',(req,res)=>{
  db.prepare('DELETE FROM teachers WHERE id=?').run(req.params.id);
  res.json({success:true});
});

// ─── Classes ────────────────────────────────────────────────────────────────
app.get('/api/classes',(req,res)=>res.json(db.prepare('SELECT * FROM classes ORDER BY id').all()));
app.post('/api/classes',(req,res)=>{
  const d=req.body;
  const r=db.prepare(`INSERT INTO classes(name,level,teacherId,teacher2Id,capacity)VALUES(?,?,?,?,?)`).run(d.name,d.level||'',d.teacherId||null,d.teacher2Id||null,d.capacity||40);
  logActivity(`Class created: ${d.name}`,'purple');
  res.json({id:r.lastInsertRowid});
});
app.put('/api/classes/:id',(req,res)=>{
  const d=req.body;
  db.prepare(`UPDATE classes SET name=?,level=?,teacherId=?,teacher2Id=?,capacity=? WHERE id=?`).run(d.name,d.level||'',d.teacherId||null,d.teacher2Id||null,d.capacity||40,req.params.id);
  res.json({success:true});
});
app.delete('/api/classes/:id',(req,res)=>{
  db.prepare('DELETE FROM classes WHERE id=?').run(req.params.id);
  db.prepare('UPDATE students SET classId=NULL WHERE classId=?').run(req.params.id);
  res.json({success:true});
});

// ─── Subjects ────────────────────────────────────────────────────────────────
app.get('/api/subjects',(req,res)=>res.json(db.prepare('SELECT * FROM subjects ORDER BY id').all()));
app.post('/api/subjects',(req,res)=>{
  const d=req.body;
  const r=db.prepare(`INSERT INTO subjects(code,name,category,teacherId)VALUES(?,?,?,?)`).run(d.code||'',d.name,d.category||'Core',d.teacherId||null);
  res.json({id:r.lastInsertRowid});
});
app.put('/api/subjects/:id',(req,res)=>{
  const d=req.body;
  db.prepare(`UPDATE subjects SET code=?,name=?,category=?,teacherId=? WHERE id=?`).run(d.code||'',d.name,d.category||'Core',d.teacherId||null,req.params.id);
  res.json({success:true});
});
app.delete('/api/subjects/:id',(req,res)=>{db.prepare('DELETE FROM subjects WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Assessments ─────────────────────────────────────────────────────────────
app.get('/api/assessments',(req,res)=>res.json(db.prepare('SELECT * FROM assessments ORDER BY id DESC').all()));
app.post('/api/assessments',(req,res)=>{
  const d=req.body;
  const total=(parseFloat(d.test1)||0)+(parseFloat(d.test2)||0)+(parseFloat(d.exam)||0);
  const grade=calcGrade(total);
  const r=db.prepare(`INSERT INTO assessments(studentId,subjectId,classId,term,year,test1,test2,exam,total,grade)VALUES(?,?,?,?,?,?,?,?,?,?)`)
    .run(d.studentId,d.subjectId||null,d.classId||null,d.term||'Term 1',d.year||2025,d.test1||0,d.test2||0,d.exam||0,total,grade);
  res.json({id:r.lastInsertRowid,total,grade});
});
app.delete('/api/assessments/:id',(req,res)=>{db.prepare('DELETE FROM assessments WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Fees ────────────────────────────────────────────────────────────────────
app.get('/api/fees',(req,res)=>res.json(db.prepare('SELECT * FROM fees ORDER BY id DESC').all()));
app.post('/api/fees',(req,res)=>{
  const d=req.body, balance=(d.billed||0)-(d.paid||0);
  const r=db.prepare(`INSERT INTO fees(studentId,term,year,billed,paid,balance,method,notes)VALUES(?,?,?,?,?,?,?,?)`)
    .run(d.studentId,d.term||'Term 1',d.year||2025,d.billed||0,d.paid||0,balance,d.method||'Cash',d.notes||'');
  logActivity('Fee payment recorded','amber');
  res.json({id:r.lastInsertRowid,balance});
});
app.put('/api/fees/:id',(req,res)=>{
  const d=req.body, balance=(d.billed||0)-(d.paid||0);
  db.prepare(`UPDATE fees SET studentId=?,term=?,year=?,billed=?,paid=?,balance=?,method=?,notes=? WHERE id=?`)
    .run(d.studentId,d.term||'Term 1',d.year||2025,d.billed||0,d.paid||0,balance,d.method||'Cash',d.notes||'',req.params.id);
  res.json({success:true,balance});
});
app.delete('/api/fees/:id',(req,res)=>{db.prepare('DELETE FROM fees WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Attendance ──────────────────────────────────────────────────────────────
app.get('/api/attendance',(req,res)=>res.json(db.prepare('SELECT * FROM attendance ORDER BY id DESC').all()));
app.post('/api/attendance',(req,res)=>{
  const records=req.body;
  const del=db.prepare(`DELETE FROM attendance WHERE studentId=? AND date=?`);
  const ins=db.prepare(`INSERT INTO attendance(studentId,classId,date,term,status)VALUES(?,?,?,?,?)`);
  const batch=db.transaction(recs=>recs.forEach(r=>{del.run(r.studentId,r.date);ins.run(r.studentId,r.classId||null,r.date,r.term||'Term 1',r.status||'Present');}));
  batch(Array.isArray(records)?records:[records]);
  logActivity('Attendance marked','green');
  res.json({success:true});
});
app.delete('/api/attendance/:id',(req,res)=>{db.prepare('DELETE FROM attendance WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Timetable ───────────────────────────────────────────────────────────────
app.get('/api/timetable/periods',(req,res)=>res.json(db.prepare('SELECT * FROM timetable_periods ORDER BY sortOrder,id').all()));
app.post('/api/timetable/periods',(req,res)=>{
  const periods=req.body;
  db.prepare('DELETE FROM timetable_periods').run();
  const ins=db.prepare('INSERT INTO timetable_periods(name,startTime,endTime,isBreak,sortOrder)VALUES(?,?,?,?,?)');
  const batch=db.transaction(ps=>ps.forEach((p,i)=>ins.run(p.name,p.startTime,p.endTime,p.isBreak?1:0,i)));
  batch(Array.isArray(periods)?periods:[periods]);
  res.json({success:true});
});
app.get('/api/timetable/config',(req,res)=>res.json({meta:db.prepare('SELECT * FROM timetable_teacher_meta').all(),assignments:db.prepare('SELECT * FROM timetable_assignments').all()}));
app.post('/api/timetable/config',(req,res)=>{
  const {teacherId,teacherType,availableDays,maxPeriodsPerDay,isClassTeacher,classTeacherId,assignments}=req.body;
  db.prepare(`INSERT OR REPLACE INTO timetable_teacher_meta(teacherId,teacherType,availableDays,maxPeriodsPerDay,isClassTeacher,classTeacherId)VALUES(?,?,?,?,?,?)`)
    .run(teacherId,teacherType||'Full-time',(availableDays||[]).join(','),maxPeriodsPerDay||6,isClassTeacher?1:0,classTeacherId||null);
  if(Array.isArray(assignments)){
    db.prepare('DELETE FROM timetable_assignments WHERE teacherId=?').run(teacherId);
    const ins=db.prepare('INSERT OR REPLACE INTO timetable_assignments(teacherId,classId,subjectId,periodsPerWeek,contactHours)VALUES(?,?,?,?,?)');
    const batch=db.transaction(ass=>ass.forEach(a=>ins.run(teacherId,a.classId,a.subjectId,a.periodsPerWeek||1,a.contactHours||1)));
    batch(assignments);
  }
  res.json({success:true});
});
app.delete('/api/timetable/config/:teacherId',(req,res)=>{
  db.prepare('DELETE FROM timetable_teacher_meta WHERE teacherId=?').run(req.params.teacherId);
  db.prepare('DELETE FROM timetable_assignments WHERE teacherId=?').run(req.params.teacherId);
  res.json({success:true});
});
app.get('/api/timetable/slots',(req,res)=>res.json(db.prepare('SELECT * FROM timetable_slots').all()));
app.post('/api/timetable/slots',(req,res)=>{
  const slots=req.body;
  if(!Array.isArray(slots)||slots.length===0){return res.json({success:true});}
  const classIds=[...new Set(slots.map(s=>s.classId))];
  const del=db.prepare('DELETE FROM timetable_slots WHERE classId=?');
  const ins=db.prepare('INSERT OR REPLACE INTO timetable_slots(classId,day,periodId,subjectId,teacherId,label)VALUES(?,?,?,?,?,?)');
  const batch=db.transaction(()=>{classIds.forEach(c=>del.run(c));slots.forEach(s=>ins.run(s.classId,s.day,s.periodId,s.subjectId||null,s.teacherId||null,s.label||''));});
  batch(); res.json({success:true});
});

// ─── Grading ─────────────────────────────────────────────────────────────────
// (already defined above)

// ─── Calendar Events ─────────────────────────────────────────────────────────
app.get('/api/calendar',(req,res)=>res.json(db.prepare('SELECT * FROM calendar_events ORDER BY startDate').all()));
app.post('/api/calendar',(req,res)=>{
  const d=req.body;
  const r=db.prepare('INSERT INTO calendar_events(title,startDate,endDate,type,description,term,year,color)VALUES(?,?,?,?,?,?,?,?)')
    .run(d.title,d.startDate,d.endDate||d.startDate,d.type||'Event',d.description||'',d.term||'',d.year||2025,d.color||'#3b82f6');
  logActivity(`Calendar event added: ${d.title}`,'blue');
  res.json({id:r.lastInsertRowid});
});
app.put('/api/calendar/:id',(req,res)=>{
  const d=req.body;
  db.prepare('UPDATE calendar_events SET title=?,startDate=?,endDate=?,type=?,description=?,term=?,year=?,color=? WHERE id=?')
    .run(d.title,d.startDate,d.endDate||d.startDate,d.type||'Event',d.description||'',d.term||'',d.year||2025,d.color||'#3b82f6',req.params.id);
  res.json({success:true});
});
app.delete('/api/calendar/:id',(req,res)=>{db.prepare('DELETE FROM calendar_events WHERE id=?').run(req.params.id);res.json({success:true});});
app.post('/api/calendar/bulk',(req,res)=>{
  const events=req.body;
  if(!Array.isArray(events)||events.length===0){res.status(400).json({error:'Expected a non-empty array of events'});return;}
  const stmt=db.prepare('INSERT INTO calendar_events(title,startDate,endDate,type,description,term,year,color)VALUES(?,?,?,?,?,?,?,?)');
  const insert=db.transaction(arr=>{
    const ids=[];
    for(const d of arr){
      if(!d.title||!d.startDate){continue;}
      const r=stmt.run(
        String(d.title).trim(),
        String(d.startDate).trim(),
        d.endDate?String(d.endDate).trim():String(d.startDate).trim(),
        d.type||'Event',
        d.description||'',
        d.term||'',
        parseInt(d.year)||new Date().getFullYear(),
        d.color||EVENT_COLORS_SERVER[d.type]||'#3b82f6'
      );
      ids.push(r.lastInsertRowid);
    }
    return ids;
  });
  const EVENT_COLORS_SERVER={Holiday:'#ef4444',Exam:'#8b5cf6',Meeting:'#f59e0b',Sports:'#22c55e','Parents Day':'#3b82f6','Speech Day':'#f59e0b',Event:'#3b82f6',Other:'#64748b'};
  const ids=insert(events);
  logActivity(`Bulk imported ${ids.length} calendar events`,'blue');
  res.json({imported:ids.length,ids});
});

// ─── Expenses ────────────────────────────────────────────────────────────────
app.get('/api/expenses',(req,res)=>res.json(db.prepare('SELECT * FROM expenses ORDER BY date DESC').all()));
app.post('/api/expenses',(req,res)=>{
  const d=req.body;
  const r=db.prepare('INSERT INTO expenses(category,amount,date,description,approvedBy,receipt)VALUES(?,?,?,?,?,?)')
    .run(d.category,d.amount,d.date,d.description||'',d.approvedBy||'',d.receipt||'');
  logActivity(`Expense recorded: ${d.category} - ${d.amount}`,'amber');
  auditLog('Added expense','Expenses','',`${d.category}: ${d.amount}`);
  res.json({id:r.lastInsertRowid});
});
app.put('/api/expenses/:id',(req,res)=>{
  const d=req.body;
  db.prepare('UPDATE expenses SET category=?,amount=?,date=?,description=?,approvedBy=?,receipt=? WHERE id=?')
    .run(d.category,d.amount,d.date,d.description||'',d.approvedBy||'',d.receipt||'',req.params.id);
  res.json({success:true});
});
app.delete('/api/expenses/:id',(req,res)=>{db.prepare('DELETE FROM expenses WHERE id=?').run(req.params.id);res.json({success:true});});
app.get('/api/expenses/summary',(req,res)=>{
  const byCategory=db.prepare("SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC").all();
  const byMonth=db.prepare("SELECT strftime('%Y-%m',date) as month, SUM(amount) as total FROM expenses GROUP BY month ORDER BY month DESC LIMIT 12").all();
  const totalSpend=db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM expenses').get().total;
  res.json({byCategory,byMonth,totalSpend});
});

// ─── Inventory ───────────────────────────────────────────────────────────────
app.get('/api/inventory',(req,res)=>res.json(db.prepare('SELECT * FROM inventory ORDER BY name').all()));
app.post('/api/inventory',(req,res)=>{
  const d=req.body;
  const r=db.prepare('INSERT INTO inventory(name,category,quantity,condition,dateAcquired,location,minStock,notes)VALUES(?,?,?,?,?,?,?,?)')
    .run(d.name,d.category||'',d.quantity||0,d.condition||'Good',d.dateAcquired||'',d.location||'',d.minStock||5,d.notes||'');
  res.json({id:r.lastInsertRowid});
});
app.put('/api/inventory/:id',(req,res)=>{
  const d=req.body;
  db.prepare('UPDATE inventory SET name=?,category=?,quantity=?,condition=?,dateAcquired=?,location=?,minStock=?,notes=? WHERE id=?')
    .run(d.name,d.category||'',d.quantity||0,d.condition||'Good',d.dateAcquired||'',d.location||'',d.minStock||5,d.notes||'',req.params.id);
  res.json({success:true});
});
app.delete('/api/inventory/:id',(req,res)=>{db.prepare('DELETE FROM inventory WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Scholarships ────────────────────────────────────────────────────────────
app.get('/api/scholarships',(req,res)=>res.json(db.prepare('SELECT * FROM scholarships ORDER BY id').all()));
app.post('/api/scholarships',(req,res)=>{
  const d=req.body;
  const r=db.prepare('INSERT INTO scholarships(studentId,scholarshipType,sponsorName,benefits,photo,startDate,endDate,status,notes)VALUES(?,?,?,?,?,?,?,?,?)')
    .run(d.studentId,d.scholarshipType||'',d.sponsorName||'',d.benefits||'',d.photo||'',d.startDate||'',d.endDate||'',d.status||'Active',d.notes||'');
  logActivity('Scholarship record added','purple');
  res.json({id:r.lastInsertRowid});
});
app.put('/api/scholarships/:id',(req,res)=>{
  const d=req.body;
  db.prepare('UPDATE scholarships SET studentId=?,scholarshipType=?,sponsorName=?,benefits=?,photo=?,startDate=?,endDate=?,status=?,notes=? WHERE id=?')
    .run(d.studentId,d.scholarshipType||'',d.sponsorName||'',d.benefits||'',d.photo||'',d.startDate||'',d.endDate||'',d.status||'Active',d.notes||'',req.params.id);
  res.json({success:true});
});
app.delete('/api/scholarships/:id',(req,res)=>{db.prepare('DELETE FROM scholarships WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Notifications ───────────────────────────────────────────────────────────
app.get('/api/notifications',(req,res)=>res.json(db.prepare("SELECT * FROM notifications WHERE dismissed=0 ORDER BY id DESC").all()));
app.post('/api/notifications/generate',(req,res)=>{
  const ins=db.prepare('INSERT OR IGNORE INTO notifications(title,message,type,module,link) SELECT ?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM notifications WHERE title=? AND dismissed=0)');
  
  // Check overdue fees
  const overdueCount=db.prepare("SELECT COUNT(*) as n FROM fees WHERE balance>0").get().n;
  if(overdueCount>0) ins.run('Outstanding Fees',`${overdueCount} student(s) have outstanding fee balances`,'warning','Fees','/fees',`Outstanding Fees`);
  
  // Incomplete student records
  const incompleteStudents=db.prepare("SELECT COUNT(*) as n FROM students WHERE parent='' OR contact=''").get().n;
  if(incompleteStudents>0) ins.run('Incomplete Student Records',`${incompleteStudents} student record(s) are missing parent/contact info`,'info','Students','/students','Incomplete Student Records');
  
  // Low stock inventory
  const lowStock=db.prepare('SELECT COUNT(*) as n FROM inventory WHERE quantity<=minStock').get().n;
  if(lowStock>0) ins.run('Low Inventory Stock',`${lowStock} item(s) are at or below minimum stock level`,'warning','Inventory','/inventory','Low Inventory Stock');
  
  // Incomplete scholarships
  const incScholarships=db.prepare("SELECT COUNT(*) as n FROM scholarships WHERE sponsorName='' OR scholarshipType=''").get().n;
  if(incScholarships>0) ins.run('Incomplete Scholarship Records',`${incScholarships} scholarship record(s) have missing details`,'warning','Scholarships','/scholarships','Incomplete Scholarship Records');
  
  // Overdue assignments
  const today=new Date().toISOString().split('T')[0];
  const overdueAss=db.prepare("SELECT COUNT(*) as n FROM assignments WHERE dueDate<? AND status='Active'").get(today).n;
  if(overdueAss>0) ins.run('Overdue Assignments',`${overdueAss} assignment(s) are past their due date`,'danger','Assignments','/assignments','Overdue Assignments');

  // Upcoming events (next 3 days)
  const soon=new Date(); soon.setDate(soon.getDate()+3);
  const soonDate=soon.toISOString().split('T')[0];
  const upcomingEvents=db.prepare("SELECT * FROM calendar_events WHERE startDate>=? AND startDate<=?").all(today,soonDate);
  upcomingEvents.forEach(ev=>{
    const title=`Upcoming: ${ev.title}`;
    ins.run(title,`Scheduled for ${ev.startDate}`,'info','Calendar','/calendar',title);
  });

  // Pending leave requests
  const pendingLeave=db.prepare("SELECT COUNT(*) as n FROM leave_requests WHERE status='Pending'").get().n;
  if(pendingLeave>0) ins.run('Pending Leave Requests',`${pendingLeave} leave request(s) awaiting approval`,'info','Staff','',`Pending Leave Requests`);

  res.json({generated:true,count:db.prepare("SELECT COUNT(*) as n FROM notifications WHERE dismissed=0").get().n});
});
app.post('/api/notifications/:id/dismiss',(req,res)=>{
  db.prepare('UPDATE notifications SET dismissed=1 WHERE id=?').run(req.params.id);
  res.json({success:true});
});
app.post('/api/notifications/dismiss-all',(req,res)=>{
  db.prepare('UPDATE notifications SET dismissed=1').run();
  res.json({success:true});
});
app.get('/api/notifications/count',(req,res)=>{
  res.json({count:db.prepare("SELECT COUNT(*) as n FROM notifications WHERE dismissed=0").get().n});
});

// ─── Promotions ──────────────────────────────────────────────────────────────
app.get('/api/promotions',(req,res)=>res.json(db.prepare('SELECT * FROM promotions ORDER BY id DESC').all()));
app.post('/api/promotions',(req,res)=>{
  const d=req.body;
  const r=db.prepare('INSERT INTO promotions(studentId,fromClassId,toClassId,action,reason,term,year)VALUES(?,?,?,?,?,?,?)')
    .run(d.studentId,d.fromClassId||null,d.toClassId||null,d.action||'Promoted',d.reason||'',d.term||'Term 1',d.year||2025);
  if(d.action!=='Retained'&&d.toClassId) db.prepare('UPDATE students SET classId=? WHERE id=?').run(d.toClassId,d.studentId);
  logActivity(`Student ${d.action==='Promoted'?'promoted':'retained'}`,'blue');
  res.json({id:r.lastInsertRowid});
});
app.delete('/api/promotions/:id',(req,res)=>{db.prepare('DELETE FROM promotions WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Conduct Log ─────────────────────────────────────────────────────────────
app.get('/api/conduct',(req,res)=>res.json(db.prepare('SELECT * FROM conduct_log ORDER BY id DESC').all()));
app.post('/api/conduct',(req,res)=>{
  const d=req.body;
  const r=db.prepare('INSERT INTO conduct_log(studentId,classId,date,incident,action,handledBy)VALUES(?,?,?,?,?,?)')
    .run(d.studentId,d.classId||null,d.date,d.incident,d.action||'',d.handledBy||'');
  res.json({id:r.lastInsertRowid});
});
app.delete('/api/conduct/:id',(req,res)=>{db.prepare('DELETE FROM conduct_log WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Assignments ─────────────────────────────────────────────────────────────
app.get('/api/assignments',(req,res)=>res.json(db.prepare('SELECT * FROM assignments ORDER BY dueDate').all()));
app.post('/api/assignments',(req,res)=>{
  const d=req.body;
  const r=db.prepare('INSERT INTO assignments(title,subjectId,classId,dateAssigned,dueDate,description,status)VALUES(?,?,?,?,?,?,?)')
    .run(d.title,d.subjectId||null,d.classId,d.dateAssigned,d.dueDate,d.description||'',d.status||'Active');
  logActivity(`Assignment added: ${d.title}`,'blue');
  res.json({id:r.lastInsertRowid});
});
app.put('/api/assignments/:id',(req,res)=>{
  const d=req.body;
  db.prepare('UPDATE assignments SET title=?,subjectId=?,classId=?,dateAssigned=?,dueDate=?,description=?,status=? WHERE id=?')
    .run(d.title,d.subjectId||null,d.classId,d.dateAssigned,d.dueDate,d.description||'',d.status||'Active',req.params.id);
  res.json({success:true});
});
app.delete('/api/assignments/:id',(req,res)=>{db.prepare('DELETE FROM assignments WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Staff Attendance ────────────────────────────────────────────────────────
app.get('/api/staff-attendance',(req,res)=>res.json(db.prepare('SELECT * FROM staff_attendance ORDER BY date DESC').all()));
app.post('/api/staff-attendance',(req,res)=>{
  const records=req.body;
  const upsert=db.prepare('INSERT OR REPLACE INTO staff_attendance(teacherId,date,status)VALUES(?,?,?)');
  const batch=db.transaction(recs=>recs.forEach(r=>upsert.run(r.teacherId,r.date,r.status||'Present')));
  batch(Array.isArray(records)?records:[records]);
  res.json({success:true});
});

// ─── Leave Requests ──────────────────────────────────────────────────────────
app.get('/api/leave',(req,res)=>res.json(db.prepare('SELECT * FROM leave_requests ORDER BY id DESC').all()));
app.post('/api/leave',(req,res)=>{
  const d=req.body;
  const r=db.prepare('INSERT INTO leave_requests(teacherId,type,startDate,endDate,reason,status)VALUES(?,?,?,?,?,?)')
    .run(d.teacherId,d.type||'Annual',d.startDate,d.endDate,d.reason||'','Pending');
  res.json({id:r.lastInsertRowid});
});
app.put('/api/leave/:id',(req,res)=>{
  const d=req.body;
  db.prepare('UPDATE leave_requests SET type=?,startDate=?,endDate=?,reason=?,status=?,approvedBy=? WHERE id=?')
    .run(d.type||'Annual',d.startDate,d.endDate,d.reason||'',d.status||'Pending',d.approvedBy||'',req.params.id);
  res.json({success:true});
});
app.delete('/api/leave/:id',(req,res)=>{db.prepare('DELETE FROM leave_requests WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Payroll ─────────────────────────────────────────────────────────────────
app.get('/api/payroll',(req,res)=>res.json(db.prepare('SELECT * FROM payroll ORDER BY year DESC, month DESC').all()));
app.post('/api/payroll',(req,res)=>{
  const d=req.body, net=(parseFloat(d.basicSalary)||0)+(parseFloat(d.allowances)||0)-(parseFloat(d.deductions)||0);
  const r=db.prepare('INSERT OR REPLACE INTO payroll(teacherId,month,year,basicSalary,allowances,deductions,netPay,status)VALUES(?,?,?,?,?,?,?,?)')
    .run(d.teacherId,d.month,d.year||2025,d.basicSalary||0,d.allowances||0,d.deductions||0,net,d.status||'Pending');
  res.json({id:r.lastInsertRowid,netPay:net});
});
app.put('/api/payroll/:id',(req,res)=>{
  const d=req.body, net=(parseFloat(d.basicSalary)||0)+(parseFloat(d.allowances)||0)-(parseFloat(d.deductions)||0);
  db.prepare('UPDATE payroll SET teacherId=?,month=?,year=?,basicSalary=?,allowances=?,deductions=?,netPay=?,status=? WHERE id=?')
    .run(d.teacherId,d.month,d.year||2025,d.basicSalary||0,d.allowances||0,d.deductions||0,net,d.status||'Pending',req.params.id);
  res.json({success:true,netPay:net});
});
app.delete('/api/payroll/:id',(req,res)=>{db.prepare('DELETE FROM payroll WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Announcements ───────────────────────────────────────────────────────────
app.get('/api/announcements',(req,res)=>res.json(db.prepare('SELECT * FROM announcements ORDER BY id DESC').all()));
app.post('/api/announcements',(req,res)=>{
  const d=req.body;
  const r=db.prepare('INSERT INTO announcements(title,body,targetClassId,author,type)VALUES(?,?,?,?,?)')
    .run(d.title,d.body,d.targetClassId||null,d.author||'Admin',d.type||'General');
  logActivity(`Announcement: ${d.title}`,'blue');
  res.json({id:r.lastInsertRowid});
});
app.delete('/api/announcements/:id',(req,res)=>{db.prepare('DELETE FROM announcements WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Petty Cash ──────────────────────────────────────────────────────────────
app.get('/api/petty-cash',(req,res)=>res.json(db.prepare('SELECT * FROM petty_cash ORDER BY id DESC').all()));
app.post('/api/petty-cash',(req,res)=>{
  const d=req.body;
  const lastBalance=db.prepare('SELECT balance FROM petty_cash ORDER BY id DESC LIMIT 1').get();
  const prevBalance=lastBalance?parseFloat(lastBalance.balance):0;
  const balance=d.type==='Credit'?prevBalance+parseFloat(d.amount):prevBalance-parseFloat(d.amount);
  const r=db.prepare('INSERT INTO petty_cash(amount,purpose,date,authorizedBy,type,balance)VALUES(?,?,?,?,?,?)')
    .run(d.amount,d.purpose,d.date,d.authorizedBy||'',d.type||'Debit',balance);
  res.json({id:r.lastInsertRowid,balance});
});
app.delete('/api/petty-cash/:id',(req,res)=>{db.prepare('DELETE FROM petty_cash WHERE id=?').run(req.params.id);res.json({success:true});});

// ─── Audit Log ───────────────────────────────────────────────────────────────
app.get('/api/audit',(req,res)=>res.json(db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 200').all()));

// ─── Analytics ───────────────────────────────────────────────────────────────
app.get('/api/analytics/class/:classId',(req,res)=>{
  const classId=req.params.classId;
  const subjects=db.prepare('SELECT DISTINCT subjectId FROM assessments WHERE classId=?').all(classId);
  const data=subjects.map(({subjectId})=>{
    const sub=db.prepare('SELECT name FROM subjects WHERE id=?').get(subjectId);
    const stats=db.prepare('SELECT AVG(total) as avg, MAX(total) as max, MIN(total) as min, COUNT(*) as cnt FROM assessments WHERE classId=? AND subjectId=?').get(classId,subjectId);
    return {subjectId,subjectName:sub?sub.name:'Unknown',...stats};
  });
  res.json(data);
});
app.get('/api/analytics/term',(req,res)=>{
  const terms=db.prepare("SELECT DISTINCT term, year FROM assessments ORDER BY year DESC, term ASC").all();
  const data=terms.map(({term,year})=>{
    const avg=db.prepare('SELECT AVG(total) as avg FROM assessments WHERE term=? AND year=?').get(term,year);
    return {term,year,avg:avg.avg};
  });
  res.json(data);
});

// ─── Global Search ───────────────────────────────────────────────────────────
app.get('/api/search',(req,res)=>{
  const q=(req.query.q||'').toLowerCase().trim();
  if(!q||q.length<2){return res.json([]);}
  const results=[];
  const like=`%${q}%`;
  db.prepare("SELECT id,'student' as type,firstName||' '||lastName as name,admNo as sub FROM students WHERE lower(firstName||' '||lastName||' '||admNo||' '||COALESCE(parent,''))LIKE lower(?)")
    .all(like).forEach(r=>results.push({...r,section:'students',url:'students'}));
  db.prepare("SELECT id,'teacher' as type,firstName||' '||lastName as name,staffId as sub FROM teachers WHERE lower(firstName||' '||lastName||' '||staffId||' '||COALESCE(phone,''))LIKE lower(?)")
    .all(like).forEach(r=>results.push({...r,section:'teachers',url:'teachers'}));
  db.prepare("SELECT id,'class' as type,name,level as sub FROM classes WHERE lower(name||' '||COALESCE(level,''))LIKE lower(?)")
    .all(like).forEach(r=>results.push({...r,section:'classes',url:'classes'}));
  db.prepare("SELECT id,'subject' as type,name,category as sub FROM subjects WHERE lower(name||' '||COALESCE(code,''))LIKE lower(?)")
    .all(like).forEach(r=>results.push({...r,section:'subjects',url:'subjects'}));
  db.prepare("SELECT e.id,'expense' as type,e.description as name,e.category as sub FROM expenses e WHERE lower(e.description||' '||e.category)LIKE lower(?)")
    .all(like).forEach(r=>results.push({...r,section:'expenses',url:'expenses'}));
  db.prepare("SELECT i.id,'inventory' as type,i.name,i.category as sub FROM inventory i WHERE lower(i.name||' '||COALESCE(i.category,''))LIKE lower(?)")
    .all(like).forEach(r=>results.push({...r,section:'inventory',url:'inventory'}));
  db.prepare("SELECT a.id,'announcement' as type,a.title as name,a.author as sub FROM announcements a WHERE lower(a.title||' '||a.body)LIKE lower(?)")
    .all(like).forEach(r=>results.push({...r,section:'notices',url:'notices'}));
  db.prepare("SELECT c.id,'event' as type,c.title as name,c.type as sub FROM calendar_events c WHERE lower(c.title||' '||COALESCE(c.description,''))LIKE lower(?)")
    .all(like).forEach(r=>results.push({...r,section:'calendar',url:'calendar'}));
  res.json(results.slice(0,30));
});

// ─── Stats ───────────────────────────────────────────────────────────────────
app.get('/api/stats',(req,res)=>{
  const today=new Date().toISOString().split('T')[0];
  const soon=new Date(); soon.setDate(soon.getDate()+7);
  res.json({
    students:db.prepare('SELECT COUNT(*) as n FROM students').get().n,
    teachers:db.prepare('SELECT COUNT(*) as n FROM teachers').get().n,
    classes:db.prepare('SELECT COUNT(*) as n FROM classes').get().n,
    totalBilled:db.prepare('SELECT COALESCE(SUM(billed),0) as n FROM fees').get().n,
    totalPaid:db.prepare('SELECT COALESCE(SUM(paid),0) as n FROM fees').get().n,
    totalBalance:db.prepare('SELECT COALESCE(SUM(balance),0) as n FROM fees').get().n,
    arrearsCount:db.prepare('SELECT COUNT(*) as n FROM fees WHERE balance>0').get().n,
    presentCount:db.prepare("SELECT COUNT(*) as n FROM attendance WHERE status='Present'").get().n,
    totalAttendance:db.prepare('SELECT COUNT(*) as n FROM attendance').get().n,
    totalExpenses:db.prepare('SELECT COALESCE(SUM(amount),0) as n FROM expenses').get().n,
    notifCount:db.prepare("SELECT COUNT(*) as n FROM notifications WHERE dismissed=0").get().n,
    lowStock:db.prepare('SELECT COUNT(*) as n FROM inventory WHERE quantity<=minStock').get().n,
    upcomingEvents:db.prepare('SELECT * FROM calendar_events WHERE startDate>=? AND startDate<=? ORDER BY startDate LIMIT 5').all(today,soon.toISOString().split('T')[0]),
    classCounts:db.prepare(`SELECT c.id,c.name,COUNT(s.id) as enrolled,c.capacity FROM classes c LEFT JOIN students s ON s.classId=c.id GROUP BY c.id`).all()
  });
});

// ─── Export ───────────────────────────────────────────────────────────────────
app.get('/api/export',(req,res)=>{
  const data={
    students:db.prepare('SELECT * FROM students').all(),
    teachers:db.prepare('SELECT * FROM teachers').all(),
    classes:db.prepare('SELECT * FROM classes').all(),
    subjects:db.prepare('SELECT * FROM subjects').all(),
    assessments:db.prepare('SELECT * FROM assessments').all(),
    fees:db.prepare('SELECT * FROM fees').all(),
    attendance:db.prepare('SELECT * FROM attendance').all(),
    expenses:db.prepare('SELECT * FROM expenses').all(),
    inventory:db.prepare('SELECT * FROM inventory').all(),
    scholarships:db.prepare('SELECT * FROM scholarships').all(),
    settings:db.prepare('SELECT * FROM settings').all(),
    exportedAt:new Date().toISOString()
  };
  res.setHeader('Content-Disposition',`attachment; filename=school_export_${new Date().toISOString().split('T')[0]}.json`);
  res.json(data);
});

// ─── Fallback ────────────────────────────────────────────────────────────────
app.get('/{*path}',(req,res)=>res.sendFile(path.join(__dirname,'school-system','public','index.html')));
app.use((err,req,res,next)=>{console.error('API Error:',err.message);res.status(500).json({error:err.message});});

const PORT=process.env.PORT||5000;
app.listen(PORT,'0.0.0.0',()=>{
  console.log(`School Management System running on port ${PORT}`);
  console.log(`Database: ${path.join(dbDir,'school.db')}`);
});
