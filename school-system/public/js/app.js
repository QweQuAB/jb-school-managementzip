// ================================================================
// API CLIENT
// ================================================================
const API = {
  async get(url) {
    const r = await fetch(url); return r.json();
  },
  async post(url, body) {
    const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    return r.json();
  },
  async put(url, body) {
    const r = await fetch(url, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    return r.json();
  },
  async del(url) {
    const r = await fetch(url, { method:'DELETE' }); return r.json();
  }
};

// ================================================================
// APP STATE
// ================================================================
let state = {
  students: [], teachers: [], classes: [], subjects: [],
  assessments: [], fees: [], attendance: [], settings: {},
  timetable: { periods:[], config:{ meta:[], assignments:[] }, slots:[] }
};

// ================================================================
// UTILITIES
// ================================================================
function fmt(n) {
  return parseFloat(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function currency() { return state.settings.currency || '₵'; }
function calcGrade(total) {
  if (total>=80) return 'A'; if (total>=70) return 'B';
  if (total>=60) return 'C'; if (total>=50) return 'D'; return 'F';
}
function getStudentName(id) {
  const s = state.students.find(x=>x.id===id);
  return s ? `${s.firstName} ${s.lastName}` : 'N/A';
}
function getClassName(id) {
  const c = state.classes.find(x=>x.id===id); return c ? c.name : '—';
}
function getSubjectName(id) {
  const s = state.subjects.find(x=>x.id===id); return s ? s.name : '—';
}
function getTeacherName(id) {
  const t = state.teachers.find(x=>x.id===id);
  return t ? `${t.firstName} ${t.lastName}` : '—';
}
function getStudentClass(studentId) {
  const s = state.students.find(x=>x.id===studentId);
  return s ? getClassName(s.classId) : '—';
}
function today() { return new Date().toISOString().split('T')[0]; }

// ================================================================
// TOAST
// ================================================================
function toast(msg, type='success') {
  const icons = {success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle'};
  const el = document.createElement('div');
  el.className=`toast ${type}`;
  el.innerHTML=`<i class="fas ${icons[type]||icons.success}"></i><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>el.remove(),3500);
}

// ================================================================
// MODAL HELPERS
// ================================================================
function openModal(id) { document.getElementById(id).style.display='flex'; }
function closeModal(id) { document.getElementById(id).style.display='none'; }
function closeModalOnOverlay(e,id) { if(e.target===document.getElementById(id)) closeModal(id); }
function confirmAction(message, fn) {
  document.getElementById('confirmMessage').textContent=message;
  const btn=document.getElementById('confirmOkBtn');
  btn.onclick=()=>{ fn(); closeModal('confirmModal'); };
  openModal('confirmModal');
}

// ================================================================
// NAVIGATION
// ================================================================
const pageTitles = {
  dashboard:{title:'Dashboard',sub:'Welcome to your school management portal'},
  students:{title:'Students',sub:'Manage student enrollment and records'},
  teachers:{title:'Teachers',sub:'Manage teaching staff'},
  classes:{title:'Classes',sub:'Manage class groups and assignments'},
  subjects:{title:'Subjects',sub:'Manage academic subjects'},
  assessments:{title:'Assessments',sub:'Record and review student scores'},
  attendance:{title:'Attendance',sub:'Track daily attendance'},
  'report-cards':{title:'Report Cards',sub:'Generate student term reports'},
  fees:{title:'Fees & Payments',sub:'Manage school fees and payment records'},
  arrears:{title:'Outstanding Arrears',sub:'Students with unpaid fee balances'},
  billing:{title:'Bill Generator',sub:'Generate invoices and payment receipts'},
  timetable:{title:'Timetable',sub:'Generate and manage class timetables'},
  settings:{title:'Settings',sub:'Configure your school management system'}
};

function navigate(sectionId) {
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.section').forEach(el=>el.classList.remove('active'));
  const navItem=document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  if(navItem) navItem.classList.add('active');
  const sec=document.getElementById(`sec-${sectionId}`);
  if(sec) sec.classList.add('active');
  const meta=pageTitles[sectionId]||{title:sectionId,sub:''};
  document.getElementById('pageTitle').textContent=meta.title;
  document.getElementById('pageSubtitle').textContent=meta.sub;
  if(sectionId==='dashboard') refreshDashboard();
  if(sectionId==='arrears') renderArrears();
  if(sectionId==='billing') renderBilling();
  if(sectionId==='settings') loadSettingsForm();
  if(sectionId==='fees') refreshFeeStats();
  if(sectionId==='timetable') window.TT?.renderTimetableView();
}

document.querySelectorAll('.nav-item').forEach(el=>{
  el.addEventListener('click',()=>navigate(el.dataset.section));
});

// ================================================================
// DROPDOWNS POPULATE
// ================================================================
function populateDropdowns() {
  const classOpts = state.classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  const teacherOpts = state.teachers.map(t=>`<option value="${t.id}">${t.firstName} ${t.lastName}</option>`).join('');
  const subjectOpts = state.subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  const studentOpts = state.students.map(s=>`<option value="${s.id}">${s.firstName} ${s.lastName}</option>`).join('');

  const filters = ['studentClassFilter','assessmentClassFilter','arrearsClassFilter','attendanceViewClass'];
  filters.forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    const val=el.value;
    el.innerHTML='<option value="">All Classes</option>'+classOpts;
    if(val) el.value=val;
  });

  const setIfExists = (id, html) => { const el=document.getElementById(id); if(el) el.innerHTML=html; };
  setIfExists('sClassId','<option value="">-- Select Class --</option>'+classOpts);
  setIfExists('cTeacher','<option value="">-- Assign Teacher --</option>'+teacherOpts);
  setIfExists('tSubject','<option value="">-- Select Subject --</option>'+subjectOpts);
  setIfExists('subTeacher','<option value="">-- Select Teacher --</option>'+teacherOpts);
  setIfExists('aStudent','<option value="">-- Select Student --</option>'+studentOpts);
  setIfExists('aSubject','<option value="">-- Select Subject --</option>'+subjectOpts);
  setIfExists('aClass','<option value="">-- Select Class --</option>'+classOpts);
  setIfExists('fStudent','<option value="">-- Select Student --</option>'+studentOpts);
  setIfExists('reportStudentSel','<option value="">-- Select Student --</option>'+studentOpts);
  setIfExists('attendanceClassSel','<option value="">-- Select Class --</option>'+classOpts);
}

// ================================================================
// DASHBOARD
// ================================================================
async function refreshDashboard() {
  const stats = await API.get('/api/stats');
  document.getElementById('dashStudents').textContent=stats.students;
  document.getElementById('dashTeachers').textContent=stats.teachers;
  document.getElementById('dashClasses').textContent=stats.classes;
  document.getElementById('dashFeesCollected').textContent=currency()+fmt(stats.totalPaid);
  document.getElementById('dashArrears').textContent=currency()+fmt(stats.totalBalance);
  const pct=stats.totalAttendance>0?Math.round(stats.presentCount/stats.totalAttendance*100):0;
  document.getElementById('dashAttendance').textContent=pct+'%';
  const badge=document.getElementById('arrearsBadge');
  badge.textContent=stats.arrearsCount;
  badge.style.display=stats.arrearsCount>0?'inline-block':'none';

  const breakdown=document.getElementById('dashClassBreakdown');
  if(!stats.classCounts||stats.classCounts.length===0) {
    breakdown.innerHTML='<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">No classes created yet</div>';
  } else {
    breakdown.innerHTML=stats.classCounts.map(c=>{
      const cap=c.capacity||40;
      const pct=Math.min(100,Math.round((c.enrolled/cap)*100));
      return `<div class="mini-stat-row" style="padding:12px 20px">
        <span style="font-weight:500">${c.name}</span>
        <div style="flex:1;margin:0 16px"><div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pct>80?'var(--danger)':pct>60?'var(--warning)':'var(--primary)'}"></div></div></div>
        <span style="font-size:12px;color:var(--text-muted)">${c.enrolled}/${cap}</span>
      </div>`;
    }).join('');
  }

  const activity=await API.get('/api/activity');
  const actEl=document.getElementById('dashActivity');
  if(!activity||activity.length===0) {
    actEl.innerHTML='<div class="activity-item"><div class="activity-dot blue"></div><div class="activity-text">No recent activity</div></div>';
  } else {
    actEl.innerHTML=activity.map(a=>`
      <div class="activity-item">
        <div class="activity-dot ${a.type}"></div>
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>`).join('');
  }
}

// ================================================================
// STUDENTS
// ================================================================
function openStudentModal(id=null) {
  populateDropdowns();
  ['sFirstName','sLastName','sOtherName','sParent','sContact','sAddress'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('sGender').value='';
  document.getElementById('sDOB').value='';
  document.getElementById('sClassId').value='';
  document.getElementById('sAdmDate').value=today();
  document.getElementById('sStatus').value='Active';
  document.getElementById('sEditId').value='';
  document.getElementById('studentModalTitle').textContent='Add Student';
  if(id!=null) {
    const s=state.students.find(x=>x.id===id); if(!s) return;
    document.getElementById('sFirstName').value=s.firstName;
    document.getElementById('sLastName').value=s.lastName;
    document.getElementById('sOtherName').value=s.otherName||'';
    document.getElementById('sGender').value=s.gender||'';
    document.getElementById('sDOB').value=s.dob||'';
    document.getElementById('sClassId').value=s.classId||'';
    document.getElementById('sAdmDate').value=s.admDate||'';
    document.getElementById('sStatus').value=s.status||'Active';
    document.getElementById('sParent').value=s.parent||'';
    document.getElementById('sContact').value=s.contact||'';
    document.getElementById('sAddress').value=s.address||'';
    document.getElementById('sEditId').value=id;
    document.getElementById('studentModalTitle').textContent='Edit Student';
  }
  openModal('studentModal');
}

async function saveStudent() {
  const firstName=document.getElementById('sFirstName').value.trim();
  const lastName=document.getElementById('sLastName').value.trim();
  const gender=document.getElementById('sGender').value;
  if(!firstName||!lastName||!gender){toast('Please fill required fields','error');return;}
  const body={firstName,lastName,otherName:document.getElementById('sOtherName').value.trim(),
    gender,classId:parseInt(document.getElementById('sClassId').value)||null,
    dob:document.getElementById('sDOB').value,admDate:document.getElementById('sAdmDate').value,
    status:document.getElementById('sStatus').value,parent:document.getElementById('sParent').value.trim(),
    contact:document.getElementById('sContact').value.trim(),address:document.getElementById('sAddress').value.trim()};
  const editId=document.getElementById('sEditId').value;
  if(editId) {
    await API.put(`/api/students/${editId}`,body);
    const idx=state.students.findIndex(x=>x.id===parseInt(editId));
    if(idx!==-1) state.students[idx]={...state.students[idx],...body};
  } else {
    const res=await API.post('/api/students',body);
    state.students.push({id:res.id,admNo:res.admNo,...body});
  }
  closeModal('studentModal'); renderStudents(); populateDropdowns();
  toast('Student saved successfully');
}

async function deleteStudent(id) {
  confirmAction('Delete this student and all their records?',async()=>{
    await API.del(`/api/students/${id}`);
    state.students=state.students.filter(x=>x.id!==id);
    state.fees=state.fees.filter(x=>x.studentId!==id);
    state.assessments=state.assessments.filter(x=>x.studentId!==id);
    state.attendance=state.attendance.filter(x=>x.studentId!==id);
    renderStudents(); populateDropdowns(); toast('Student deleted');
  });
}

function viewStudent(id) {
  const s=state.students.find(x=>x.id===id); if(!s) return;
  const cls=getClassName(s.classId);
  const fees=state.fees.filter(f=>f.studentId===id);
  const totalPaid=fees.reduce((a,f)=>a+(parseFloat(f.paid)||0),0);
  const totalBal=fees.reduce((a,f)=>a+(parseFloat(f.balance)||0),0);
  const attRecs=state.attendance.filter(a=>a.studentId===id);
  const pct=attRecs.length>0?Math.round(attRecs.filter(a=>a.status==='Present').length/attRecs.length*100):0;
  const initials=((s.firstName||'')[0]||'')+((s.lastName||'')[0]||'');
  document.getElementById('viewStudentBody').innerHTML=`
    <div class="profile-header">
      <div class="student-avatar">${initials.toUpperCase()}</div>
      <div>
        <div class="profile-name">${s.firstName} ${s.otherName?s.otherName+' ':''}${s.lastName}</div>
        <div class="profile-sub">${s.admNo} · ${cls} · <span class="badge badge-${s.status==='Active'?'success':'neutral'}">${s.status}</span></div>
      </div>
    </div>
    <div class="info-grid" style="margin-bottom:20px">
      <div class="info-item"><label>Gender</label><p>${s.gender||'N/A'}</p></div>
      <div class="info-item"><label>Date of Birth</label><p>${s.dob||'N/A'}</p></div>
      <div class="info-item"><label>Admission Date</label><p>${s.admDate||'N/A'}</p></div>
      <div class="info-item"><label>Parent/Guardian</label><p>${s.parent||'N/A'}</p></div>
      <div class="info-item"><label>Contact</label><p>${s.contact||'N/A'}</p></div>
      <div class="info-item"><label>Address</label><p>${s.address||'N/A'}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
      <div class="stat-card" style="padding:14px">
        <div class="stat-icon green" style="width:36px;height:36px;font-size:14px"><i class="fas fa-wallet"></i></div>
        <div class="stat-body"><div class="stat-value" style="font-size:20px">${currency()}${fmt(totalPaid)}</div><div class="stat-label">Paid</div></div>
      </div>
      <div class="stat-card" style="padding:14px">
        <div class="stat-icon red" style="width:36px;height:36px;font-size:14px"><i class="fas fa-exclamation-circle"></i></div>
        <div class="stat-body"><div class="stat-value" style="font-size:20px">${currency()}${fmt(totalBal)}</div><div class="stat-label">Balance</div></div>
      </div>
      <div class="stat-card" style="padding:14px">
        <div class="stat-icon blue" style="width:36px;height:36px;font-size:14px"><i class="fas fa-calendar-check"></i></div>
        <div class="stat-body"><div class="stat-value" style="font-size:20px">${pct}%</div><div class="stat-label">Attendance</div></div>
      </div>
    </div>`;
  openModal('viewStudentModal');
}

function renderStudents(list=null) {
  const rows=list||state.students;
  const tbody=document.getElementById('studentTbody');
  if(rows.length===0){tbody.innerHTML='<tr class="empty-row"><td colspan="9">No students found.</td></tr>';return;}
  tbody.innerHTML=rows.map(s=>{
    const cls=getClassName(s.classId);
    const sc=s.status==='Active'?'badge-success':s.status==='Graduated'?'badge-info':'badge-neutral';
    return `<tr>
      <td><span style="font-weight:500;color:var(--primary)">${s.admNo}</span></td>
      <td><strong>${s.firstName} ${s.lastName}</strong>${s.otherName?`<br><span style="font-size:11px;color:var(--text-muted)">${s.otherName}</span>`:''}</td>
      <td>${s.gender||'—'}</td>
      <td>${s.dob||'—'}</td>
      <td>${cls}</td>
      <td>${s.parent||'—'}</td>
      <td>${s.contact||'—'}</td>
      <td><span class="badge ${sc}">${s.status}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="viewStudent(${s.id})" title="View"><i class="fas fa-eye"></i></button>
        <button class="btn btn-secondary btn-sm btn-icon" onclick="openStudentModal(${s.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteStudent(${s.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function filterStudents() {
  const q=document.getElementById('studentSearch').value.toLowerCase();
  const cls=document.getElementById('studentClassFilter').value;
  const gender=document.getElementById('studentGenderFilter').value;
  renderStudents(state.students.filter(s=>{
    const name=`${s.firstName} ${s.lastName} ${s.admNo}`.toLowerCase();
    return(!q||name.includes(q))&&(!cls||s.classId===parseInt(cls))&&(!gender||s.gender===gender);
  }));
}

// CLASS LIST PRINT
function printClassList(classId) {
  const cls = state.classes.find(c=>c.id===classId); if(!cls) return;
  const students = state.students.filter(s=>s.classId===classId);
  const s = state.settings;
  const teacher = getTeacherName(cls.teacherId);
  const logoHtml = s.logo ? `<img src="${s.logo}" style="max-height:70px;object-fit:contain;">` : '<div style="width:70px;height:70px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🏫</div>';
  const win=window.open('','_blank','width=900,height=700');
  win.document.write(`<!DOCTYPE html><html><head><title>Class List - ${cls.name}</title>
  <style>
    body{font-family:'Arial',sans-serif;margin:0;padding:20px;font-size:13px;color:#1e293b;}
    .header{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #0d6efd;padding-bottom:16px;margin-bottom:20px;}
    .header-left{display:flex;gap:16px;align-items:center;}
    .school-name{font-size:20px;font-weight:700;color:#0d6efd;}
    .school-info{font-size:12px;color:#64748b;line-height:1.6;}
    .motto{font-style:italic;color:#0d6efd;font-weight:500;}
    .header-right{text-align:right;font-size:12px;color:#475569;}
    h2{font-size:16px;text-align:center;margin:12px 0 20px;color:#1e293b;}
    table{width:100%;border-collapse:collapse;}
    th{background:#0d6efd;color:white;padding:9px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;text-align:left;}
    td{padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;}
    tr:nth-child(even) td{background:#f8fafc;}
    .footer{margin-top:32px;display:flex;justify-content:space-between;align-items:flex-end;padding-top:16px;border-top:1px solid #e2e8f0;}
    .footer-logo{display:flex;align-items:center;gap:10px;}
    .sig-line{width:120px;border-bottom:1px solid #1e293b;margin-bottom:4px;}
    .sig-item{text-align:center;}
    .sig-label{font-size:11px;color:#64748b;}
    @media print{body{padding:0;}button{display:none!important;}}
  </style></head><body>
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div>
        <div class="school-name">${s.schoolName||'School Name'}</div>
        <div class="motto">"${s.motto||'Excellence in Education'}"</div>
      </div>
    </div>
    <div class="header-right">
      <strong>${s.schoolName||'School'}</strong><br>
      ${s.address||''}${s.city?', '+s.city:''}<br>
      ${s.phone?'Tel: '+s.phone:''}<br>
      ${s.email||''}<br>
      ${s.website||''}
    </div>
  </div>
  <h2>Class List — ${cls.name} &nbsp;|&nbsp; ${s.currentTerm||'Term 1'} ${s.academicYear||2025}</h2>
  <p style="font-size:12px;color:#475569;margin-bottom:12px">Class Teacher: <strong>${teacher}</strong> &nbsp;|&nbsp; Total Enrolled: <strong>${students.length}</strong> &nbsp;|&nbsp; Capacity: <strong>${cls.capacity||40}</strong></p>
  <table>
    <thead><tr><th>#</th><th>Admission No.</th><th>Full Name</th><th>Gender</th><th>Date of Birth</th><th>Parent/Guardian</th><th>Contact</th></tr></thead>
    <tbody>
      ${students.map((st,i)=>`<tr>
        <td>${i+1}</td>
        <td>${st.admNo}</td>
        <td><strong>${st.firstName} ${st.otherName?st.otherName+' ':''}${st.lastName}</strong></td>
        <td>${st.gender||'—'}</td>
        <td>${st.dob||'—'}</td>
        <td>${st.parent||'—'}</td>
        <td>${st.contact||'—'}</td>
      </tr>`).join('')}
      ${students.length===0?'<tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8">No students enrolled in this class</td></tr>':''}
    </tbody>
  </table>
  <div class="footer">
    <div class="footer-logo">
      ${logoHtml}
      <div>
        <div style="font-size:11px;font-weight:600;color:#0d6efd">${s.schoolName||'School'}</div>
        <div style="font-size:10px;color:#94a3b8;font-style:italic">"${s.motto||''}"</div>
      </div>
    </div>
    <div style="display:flex;gap:40px">
      <div class="sig-item"><div class="sig-line"></div><div class="sig-label">Class Teacher</div></div>
      <div class="sig-item"><div class="sig-line"></div><div class="sig-label">${s.adminRole||'Head Teacher'}</div></div>
    </div>
  </div>
  <script>window.onload=function(){window.print();}<\/script>
  </body></html>`);
  win.document.close();
}

// ================================================================
// TEACHERS
// ================================================================
function openTeacherModal(id=null) {
  populateDropdowns();
  ['tFirstName','tLastName','tPhone','tEmail','tSpecialization'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('tGender').value='';
  document.getElementById('tQualification').value='B.Ed.';
  document.getElementById('tStatus').value='Active';
  document.getElementById('tSubject').value='';
  document.getElementById('tDateJoined').value=today();
  document.getElementById('tEditId').value='';
  document.getElementById('teacherModalTitle').textContent='Add Teacher';
  if(id!=null) {
    const t=state.teachers.find(x=>x.id===id); if(!t) return;
    document.getElementById('tFirstName').value=t.firstName;
    document.getElementById('tLastName').value=t.lastName;
    document.getElementById('tGender').value=t.gender||'';
    document.getElementById('tQualification').value=t.qualification||'B.Ed.';
    document.getElementById('tPhone').value=t.phone||'';
    document.getElementById('tEmail').value=t.email||'';
    document.getElementById('tSubject').value=t.subjectId||'';
    document.getElementById('tStatus').value=t.status||'Active';
    document.getElementById('tDateJoined').value=t.dateJoined||'';
    document.getElementById('tSpecialization').value=t.specialization||'';
    document.getElementById('tEditId').value=id;
    document.getElementById('teacherModalTitle').textContent='Edit Teacher';
  }
  openModal('teacherModal');
}

async function saveTeacher() {
  const firstName=document.getElementById('tFirstName').value.trim();
  const lastName=document.getElementById('tLastName').value.trim();
  const gender=document.getElementById('tGender').value;
  const phone=document.getElementById('tPhone').value.trim();
  if(!firstName||!lastName||!gender||!phone){toast('Please fill required fields','error');return;}
  const body={firstName,lastName,gender,phone,
    email:document.getElementById('tEmail').value.trim(),
    qualification:document.getElementById('tQualification').value,
    subjectId:parseInt(document.getElementById('tSubject').value)||null,
    status:document.getElementById('tStatus').value,
    dateJoined:document.getElementById('tDateJoined').value,
    specialization:document.getElementById('tSpecialization').value.trim()};
  const editId=document.getElementById('tEditId').value;
  if(editId) {
    await API.put(`/api/teachers/${editId}`,body);
    const idx=state.teachers.findIndex(x=>x.id===parseInt(editId));
    if(idx!==-1) state.teachers[idx]={...state.teachers[idx],...body};
  } else {
    const res=await API.post('/api/teachers',body);
    state.teachers.push({id:res.id,staffId:res.staffId,...body});
  }
  closeModal('teacherModal'); renderTeachers(); populateDropdowns(); toast('Teacher saved');
}

async function deleteTeacher(id) {
  confirmAction('Delete this teacher record?',async()=>{
    await API.del(`/api/teachers/${id}`);
    state.teachers=state.teachers.filter(x=>x.id!==id);
    renderTeachers(); populateDropdowns(); toast('Teacher deleted');
  });
}

function renderTeachers(list=null) {
  const rows=list||state.teachers;
  const tbody=document.getElementById('teacherTbody');
  if(rows.length===0){tbody.innerHTML='<tr class="empty-row"><td colspan="9">No teachers found.</td></tr>';return;}
  tbody.innerHTML=rows.map(t=>{
    const sub=getSubjectName(t.subjectId);
    const sc=t.status==='Active'?'badge-success':t.status==='On Leave'?'badge-warning':'badge-neutral';
    return `<tr>
      <td><span style="font-weight:500;color:var(--primary)">${t.staffId}</span></td>
      <td><strong>${t.firstName} ${t.lastName}</strong></td>
      <td>${t.gender||'—'}</td>
      <td><span class="badge badge-info">${t.qualification}</span></td>
      <td>${sub!=='—'?sub:'<span style="color:var(--text-muted)">—</span>'}</td>
      <td>${t.phone}</td>
      <td>${t.email||'—'}</td>
      <td><span class="badge ${sc}">${t.status}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="openTeacherModal(${t.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteTeacher(${t.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}
function filterTeachers() {
  const q=document.getElementById('teacherSearch').value.toLowerCase();
  renderTeachers(state.teachers.filter(t=>`${t.firstName} ${t.lastName} ${t.staffId}`.toLowerCase().includes(q)));
}

// ================================================================
// CLASSES
// ================================================================
function openClassModal(id=null) {
  populateDropdowns();
  document.getElementById('cName').value='';
  document.getElementById('cLevel').value='';
  document.getElementById('cTeacher').value='';
  document.getElementById('cCapacity').value='40';
  document.getElementById('cEditId').value='';
  document.getElementById('classModalTitle').textContent='Add Class';
  if(id!=null) {
    const c=state.classes.find(x=>x.id===id); if(!c) return;
    document.getElementById('cName').value=c.name;
    document.getElementById('cLevel').value=c.level||'';
    document.getElementById('cTeacher').value=c.teacherId||'';
    document.getElementById('cCapacity').value=c.capacity||40;
    document.getElementById('cEditId').value=id;
    document.getElementById('classModalTitle').textContent='Edit Class';
  }
  openModal('classModal');
}

async function saveClass() {
  const name=document.getElementById('cName').value.trim();
  if(!name){toast('Class name is required','error');return;}
  const body={name,level:document.getElementById('cLevel').value,
    teacherId:parseInt(document.getElementById('cTeacher').value)||null,
    capacity:parseInt(document.getElementById('cCapacity').value)||40};
  const editId=document.getElementById('cEditId').value;
  if(editId) {
    await API.put(`/api/classes/${editId}`,body);
    const idx=state.classes.findIndex(x=>x.id===parseInt(editId));
    if(idx!==-1) state.classes[idx]={...state.classes[idx],...body};
  } else {
    const res=await API.post('/api/classes',body);
    state.classes.push({id:res.id,...body});
  }
  closeModal('classModal'); renderClasses(); populateDropdowns(); toast('Class saved');
}

async function deleteClass(id) {
  confirmAction('Delete this class? Students will be unassigned.',async()=>{
    await API.del(`/api/classes/${id}`);
    state.classes=state.classes.filter(x=>x.id!==id);
    state.students.forEach(s=>{if(s.classId===id)s.classId=null;});
    renderClasses(); populateDropdowns(); toast('Class deleted');
  });
}

function renderClasses(list=null) {
  const rows=list||state.classes;
  const tbody=document.getElementById('classTbody');
  if(rows.length===0){tbody.innerHTML='<tr class="empty-row"><td colspan="7">No classes found.</td></tr>';return;}
  tbody.innerHTML=rows.map(c=>{
    const teacher=getTeacherName(c.teacherId);
    const enrolled=state.students.filter(s=>s.classId===c.id).length;
    const cap=c.capacity||40;
    return `<tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.level||'—'}</td>
      <td>${teacher}</td>
      <td>${cap}</td>
      <td><span class="badge ${enrolled>=cap?'badge-danger':enrolled>cap*.8?'badge-warning':'badge-success'}">${enrolled}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="openClassModal(${c.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="btn btn-primary btn-sm btn-icon" onclick="printClassList(${c.id})" title="Print Class List"><i class="fas fa-print"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteClass(${c.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}
function filterClasses() {
  const q=document.getElementById('classSearch').value.toLowerCase();
  renderClasses(state.classes.filter(c=>c.name.toLowerCase().includes(q)));
}

// ================================================================
// SUBJECTS
// ================================================================
function openSubjectModal(id=null) {
  populateDropdowns();
  document.getElementById('subCode').value='';
  document.getElementById('subName').value='';
  document.getElementById('subCategory').value='Core';
  document.getElementById('subTeacher').value='';
  document.getElementById('subEditId').value='';
  document.getElementById('subjectModalTitle').textContent='Add Subject';
  if(id!=null) {
    const s=state.subjects.find(x=>x.id===id); if(!s) return;
    document.getElementById('subCode').value=s.code||'';
    document.getElementById('subName').value=s.name;
    document.getElementById('subCategory').value=s.category||'Core';
    document.getElementById('subTeacher').value=s.teacherId||'';
    document.getElementById('subEditId').value=id;
    document.getElementById('subjectModalTitle').textContent='Edit Subject';
  }
  openModal('subjectModal');
}

async function saveSubject() {
  const name=document.getElementById('subName').value.trim();
  if(!name){toast('Subject name is required','error');return;}
  const body={code:document.getElementById('subCode').value.trim().toUpperCase(),name,
    category:document.getElementById('subCategory').value,
    teacherId:parseInt(document.getElementById('subTeacher').value)||null};
  const editId=document.getElementById('subEditId').value;
  if(editId) {
    await API.put(`/api/subjects/${editId}`,body);
    const idx=state.subjects.findIndex(x=>x.id===parseInt(editId));
    if(idx!==-1) state.subjects[idx]={...state.subjects[idx],...body};
  } else {
    const res=await API.post('/api/subjects',body);
    state.subjects.push({id:res.id,...body});
  }
  closeModal('subjectModal'); renderSubjects(); populateDropdowns(); toast('Subject saved');
}

async function deleteSubject(id) {
  confirmAction('Delete this subject?',async()=>{
    await API.del(`/api/subjects/${id}`);
    state.subjects=state.subjects.filter(x=>x.id!==id);
    renderSubjects(); populateDropdowns(); toast('Subject deleted');
  });
}

function renderSubjects(list=null) {
  const rows=list||state.subjects;
  const tbody=document.getElementById('subjectTbody');
  if(rows.length===0){tbody.innerHTML='<tr class="empty-row"><td colspan="5">No subjects found.</td></tr>';return;}
  tbody.innerHTML=rows.map(s=>{
    const catClass=s.category==='Core'?'badge-info':s.category==='Elective'?'badge-purple':'badge-neutral';
    return `<tr>
      <td><span class="badge badge-neutral" style="font-family:monospace">${s.code||'—'}</span></td>
      <td><strong>${s.name}</strong></td>
      <td><span class="badge ${catClass}">${s.category}</span></td>
      <td>${getTeacherName(s.teacherId)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="openSubjectModal(${s.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteSubject(${s.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}
function filterSubjects() {
  const q=document.getElementById('subjectSearch').value.toLowerCase();
  renderSubjects(state.subjects.filter(s=>`${s.name} ${s.code}`.toLowerCase().includes(q)));
}

// ================================================================
// ASSESSMENTS
// ================================================================
function openAssessmentModal() {
  populateDropdowns();
  document.getElementById('aStudent').value='';
  document.getElementById('aSubject').value='';
  document.getElementById('aClass').value='';
  document.getElementById('aTerm').value='Term 1';
  document.getElementById('aYear').value=state.settings.academicYear||2025;
  document.getElementById('aTest1').value=0;
  document.getElementById('aTest2').value=0;
  document.getElementById('aExam').value=0;
  document.getElementById('aTotal').value='0';
  document.getElementById('aGrade').value='—';
  openModal('assessmentModal');
}

function calcTotal() {
  const t1=parseFloat(document.getElementById('aTest1').value)||0;
  const t2=parseFloat(document.getElementById('aTest2').value)||0;
  const ex=parseFloat(document.getElementById('aExam').value)||0;
  const total=t1+t2+ex;
  document.getElementById('aTotal').value=total.toFixed(1);
  document.getElementById('aGrade').value=calcGrade(total);
}

async function saveAssessment() {
  const studentId=parseInt(document.getElementById('aStudent').value);
  const subjectId=parseInt(document.getElementById('aSubject').value);
  if(!studentId||!subjectId){toast('Please select student and subject','error');return;}
  const t1=parseFloat(document.getElementById('aTest1').value)||0;
  const t2=parseFloat(document.getElementById('aTest2').value)||0;
  const ex=parseFloat(document.getElementById('aExam').value)||0;
  if(t1>20||t2>20||ex>60){toast('Scores exceed maximum values','error');return;}
  const total=t1+t2+ex;
  const body={studentId,subjectId,classId:parseInt(document.getElementById('aClass').value)||null,
    term:document.getElementById('aTerm').value,year:parseInt(document.getElementById('aYear').value)||2025,
    test1:t1,test2:t2,exam:ex,total,grade:calcGrade(total)};
  const res=await API.post('/api/assessments',body);
  state.assessments.unshift({id:res.id,...body,date:new Date().toISOString()});
  closeModal('assessmentModal'); renderAssessments(); toast('Assessment saved');
}

async function deleteAssessment(id) {
  confirmAction('Delete this assessment?',async()=>{
    await API.del(`/api/assessments/${id}`);
    state.assessments=state.assessments.filter(x=>x.id!==id);
    renderAssessments(); toast('Assessment deleted');
  });
}

function renderAssessments(list=null) {
  const rows=list||state.assessments;
  const tbody=document.getElementById('assessmentTbody');
  if(rows.length===0){tbody.innerHTML='<tr class="empty-row"><td colspan="11">No assessments found.</td></tr>';return;}
  tbody.innerHTML=rows.map(a=>`<tr>
    <td><strong>${getStudentName(a.studentId)}</strong></td>
    <td>${getSubjectName(a.subjectId)}</td>
    <td>${getClassName(a.classId)}</td>
    <td>${a.term}</td><td>${a.year}</td>
    <td>${a.test1}</td><td>${a.test2}</td><td>${a.exam}</td>
    <td><strong>${parseFloat(a.total).toFixed(1)}</strong></td>
    <td><span class="badge grade-${a.grade}">${a.grade}</span></td>
    <td><button class="btn btn-danger btn-sm btn-icon" onclick="deleteAssessment(${a.id})"><i class="fas fa-trash"></i></button></td>
  </tr>`).join('');
}
function filterAssessments() {
  const q=document.getElementById('assessmentSearch').value.toLowerCase();
  const term=document.getElementById('assessmentTermFilter').value;
  const cls=document.getElementById('assessmentClassFilter').value;
  renderAssessments(state.assessments.filter(a=>{
    const name=getStudentName(a.studentId).toLowerCase();
    return(!q||name.includes(q))&&(!term||a.term===term)&&(!cls||a.classId===parseInt(cls));
  }));
}

// ================================================================
// ATTENDANCE
// ================================================================
function loadAttendanceSheet() {
  const classId=parseInt(document.getElementById('attendanceClassSel').value);
  const sheet=document.getElementById('attendanceSheet');
  const saveRow=document.getElementById('attendanceSaveRow');
  if(!classId){sheet.innerHTML='';saveRow.style.display='none';return;}
  const students=state.students.filter(s=>s.classId===classId);
  if(students.length===0){
    sheet.innerHTML='<div class="alert alert-info" style="margin:0"><i class="fas fa-info-circle"></i> No students enrolled in this class yet.</div>';
    saveRow.style.display='none';return;
  }
  saveRow.style.display='block';
  sheet.innerHTML=`<div class="table-wrapper"><table>
    <thead><tr><th>#</th><th>Student</th><th>Admission No.</th><th>Status</th></tr></thead>
    <tbody>${students.map((s,i)=>`<tr>
      <td>${i+1}</td>
      <td><strong>${s.firstName} ${s.lastName}</strong></td>
      <td>${s.admNo}</td>
      <td><div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['Present','Absent','Late','Excused'].map(st=>`<label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12.5px">
          <input type="radio" name="att_${s.id}" value="${st}" ${st==='Present'?'checked':''} style="width:auto"> ${st}</label>`).join('')}
      </div></td></tr>`).join('')}
    </tbody></table></div>`;
}

async function saveAttendance() {
  const classId=parseInt(document.getElementById('attendanceClassSel').value);
  const date=document.getElementById('attendanceDate').value;
  const term=document.getElementById('attendanceTerm').value;
  if(!classId||!date){toast('Please select class and date','error');return;}
  const students=state.students.filter(s=>s.classId===classId);
  const records=[];
  students.forEach(s=>{
    const radio=document.querySelector(`input[name="att_${s.id}"]:checked`);
    if(radio) records.push({studentId:s.id,classId,date,term,status:radio.value});
  });
  await API.post('/api/attendance',records);
  state.attendance=state.attendance.filter(a=>!(records.some(r=>r.studentId===a.studentId&&r.date===date)));
  records.forEach(r=>state.attendance.unshift({...r,id:Date.now()+Math.random()}));
  renderAttendance(); toast(`Attendance saved for ${records.length} student(s)`);
}

function renderAttendance(list=null) {
  const rows=list||state.attendance;
  const tbody=document.getElementById('attendanceTbody');
  if(rows.length===0){tbody.innerHTML='<tr class="empty-row"><td colspan="6">No attendance records yet.</td></tr>';return;}
  tbody.innerHTML=[...rows].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(a=>{
    const sc=a.status==='Present'?'badge-success':a.status==='Absent'?'badge-danger':a.status==='Late'?'badge-warning':'badge-neutral';
    return `<tr>
      <td><strong>${getStudentName(a.studentId)}</strong></td>
      <td>${getClassName(a.classId)}</td>
      <td>${a.date}</td><td>${a.term}</td>
      <td><span class="badge ${sc}">${a.status}</span></td>
      <td><button class="btn btn-danger btn-sm btn-icon" onclick="deleteAttendance(${a.id})"><i class="fas fa-trash"></i></button></td>
    </tr>`;
  }).join('');
}

async function deleteAttendance(id) {
  await API.del(`/api/attendance/${id}`);
  state.attendance=state.attendance.filter(x=>x.id!==id);
  renderAttendance();
}

function filterAttendance() {
  const q=document.getElementById('attendanceSearch').value.toLowerCase();
  const cls=document.getElementById('attendanceViewClass').value;
  renderAttendance(state.attendance.filter(a=>{
    const name=getStudentName(a.studentId).toLowerCase();
    return(!q||name.includes(q))&&(!cls||a.classId===parseInt(cls));
  }));
}

// ================================================================
// REPORT CARDS
// ================================================================
function generateReportCard() {
  const studentId=parseInt(document.getElementById('reportStudentSel').value);
  const term=document.getElementById('reportTerm').value;
  const year=parseInt(document.getElementById('reportYear').value)||2025;
  if(!studentId){toast('Please select a student','error');return;}
  const student=state.students.find(x=>x.id===studentId); if(!student) return;
  const assessments=state.assessments.filter(a=>a.studentId===studentId&&a.term===term&&a.year===year);
  const cls=getClassName(student.classId);
  const s=state.settings;
  const totals=assessments.map(a=>parseFloat(a.total)||0);
  const avg=totals.length>0?(totals.reduce((a,b)=>a+b,0)/totals.length).toFixed(1):'N/A';
  const overallGrade=avg!=='N/A'?calcGrade(parseFloat(avg)):'—';
  const attRecs=state.attendance.filter(a=>a.studentId===studentId&&a.term===term);
  const presentDays=attRecs.filter(a=>a.status==='Present').length;
  const attPct=attRecs.length>0?Math.round(presentDays/attRecs.length*100):'N/A';
  document.getElementById('reportCardOutput').innerHTML=`
    <div class="card">
      <div class="card-header">
        <span class="card-title">Report Card Preview</span>
        <button class="btn btn-secondary" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
      </div>
      <div class="card-body">
        <div class="report-card-preview">
          <div class="report-header">
            ${s.logo?`<img src="${s.logo}" style="max-height:70px;margin-bottom:8px">`:''}
            <div class="report-school-name">${s.schoolName||'School Name'}</div>
            <div class="report-school-sub">${s.address||''}${s.city?', '+s.city:''} | ${s.phone||''}</div>
            <div class="report-school-sub" style="font-style:italic;color:var(--primary);margin-top:4px">"${s.motto||'Excellence in Education'}"</div>
            <div class="report-title">Academic Report — ${term}, ${year}</div>
          </div>
          <div class="report-meta">
            <div class="report-meta-item"><span class="report-meta-label">Student:</span> ${student.firstName} ${student.otherName||''} ${student.lastName}</div>
            <div class="report-meta-item"><span class="report-meta-label">Admission No.:</span> ${student.admNo}</div>
            <div class="report-meta-item"><span class="report-meta-label">Class:</span> ${cls}</div>
            <div class="report-meta-item"><span class="report-meta-label">Gender:</span> ${student.gender||'N/A'}</div>
            <div class="report-meta-item"><span class="report-meta-label">Term:</span> ${term}</div>
            <div class="report-meta-item"><span class="report-meta-label">Academic Year:</span> ${year}</div>
          </div>
          <table class="report-table">
            <thead><tr><th>Subject</th><th>Test 1 /20</th><th>Test 2 /20</th><th>Exam /60</th><th>Total /100</th><th>Grade</th><th>Remarks</th></tr></thead>
            <tbody>${assessments.length>0?assessments.map(a=>`<tr>
              <td>${getSubjectName(a.subjectId)}</td>
              <td>${a.test1}</td><td>${a.test2}</td><td>${a.exam}</td>
              <td><strong>${parseFloat(a.total).toFixed(1)}</strong></td>
              <td><strong>${a.grade}</strong></td>
              <td>${a.grade==='A'?'Excellent':a.grade==='B'?'Very Good':a.grade==='C'?'Good':a.grade==='D'?'Average':'Needs Improvement'}</td>
            </tr>`).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px">No assessment records for this term</td></tr>'}
            </tbody>
          </table>
          <div class="report-summary">
            <div><span style="color:var(--text-muted);font-size:12px">Average Score</span><br><strong style="font-size:18px">${avg}</strong></div>
            <div><span style="color:var(--text-muted);font-size:12px">Overall Grade</span><br><strong style="font-size:18px">${overallGrade}</strong></div>
            <div><span style="color:var(--text-muted);font-size:12px">Subjects Taken</span><br><strong style="font-size:18px">${assessments.length}</strong></div>
            <div><span style="color:var(--text-muted);font-size:12px">Attendance</span><br><strong style="font-size:18px">${attPct}%</strong></div>
          </div>
          <div style="margin-top:20px;padding:12px 16px;border:1px solid var(--border);border-radius:8px;background:var(--bg)">
            <strong style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Class Teacher's Remarks</strong>
            <p style="margin-top:6px;color:var(--text-muted);font-style:italic;font-size:13px">__________________________________________________</p>
          </div>
          <div class="report-sig">
            <div class="report-sig-item"><div class="report-sig-line"></div><div style="font-size:12px;color:var(--text-muted)">Class Teacher</div></div>
            <div class="report-sig-item"><div class="report-sig-line"></div><div style="font-size:12px;color:var(--text-muted)">${s.adminRole||'Head Teacher'}</div></div>
            <div class="report-sig-item"><div class="report-sig-line"></div><div style="font-size:12px;color:var(--text-muted)">Parent/Guardian</div></div>
          </div>
          <div style="text-align:center;margin-top:20px;font-size:11px;color:var(--text-muted)">
            ${s.schoolName||'School'} · ${term} ${year} · Generated by School Management System
          </div>
        </div>
      </div>
    </div>`;
  toast('Report card generated');
}

// ================================================================
// FEES
// ================================================================
function openFeeModal(id=null) {
  populateDropdowns();
  document.getElementById('fStudent').value='';
  document.getElementById('fTerm').value='Term 1';
  document.getElementById('fYear').value=state.settings.academicYear||2025;
  document.getElementById('fBilled').value=state.settings.standardFee||'';
  document.getElementById('fPaid').value='';
  document.getElementById('fMethod').value='Cash';
  document.getElementById('fNotes').value='';
  document.getElementById('fEditId').value='';
  document.getElementById('feeModalTitle').textContent='Record Fee Payment';
  if(id!=null) {
    const f=state.fees.find(x=>x.id===id); if(!f) return;
    document.getElementById('fStudent').value=f.studentId;
    document.getElementById('fTerm').value=f.term;
    document.getElementById('fYear').value=f.year;
    document.getElementById('fBilled').value=f.billed;
    document.getElementById('fPaid').value=f.paid;
    document.getElementById('fMethod').value=f.method||'Cash';
    document.getElementById('fNotes').value=f.notes||'';
    document.getElementById('fEditId').value=id;
    document.getElementById('feeModalTitle').textContent='Edit Fee Record';
  }
  openModal('feeModal');
}

async function saveFee() {
  const studentId=parseInt(document.getElementById('fStudent').value);
  const billed=parseFloat(document.getElementById('fBilled').value)||0;
  const paid=parseFloat(document.getElementById('fPaid').value)||0;
  if(!studentId||billed<=0){toast('Please select student and enter billed amount','error');return;}
  const body={studentId,term:document.getElementById('fTerm').value,
    year:parseInt(document.getElementById('fYear').value)||2025,billed,paid,
    method:document.getElementById('fMethod').value,notes:document.getElementById('fNotes').value.trim()};
  const editId=document.getElementById('fEditId').value;
  let balance;
  if(editId) {
    const res=await API.put(`/api/fees/${editId}`,body);
    balance=res.balance;
    const idx=state.fees.findIndex(x=>x.id===parseInt(editId));
    if(idx!==-1) state.fees[idx]={...state.fees[idx],...body,balance};
  } else {
    const res=await API.post('/api/fees',body);
    balance=res.balance;
    state.fees.unshift({id:res.id,...body,balance,date:new Date().toISOString()});
  }
  closeModal('feeModal'); renderFees(); renderArrears(); refreshFeeStats(); toast('Fee record saved');
}

async function deleteFee(id) {
  confirmAction('Delete this fee record?',async()=>{
    await API.del(`/api/fees/${id}`);
    state.fees=state.fees.filter(x=>x.id!==id);
    renderFees(); renderArrears(); refreshFeeStats(); toast('Record deleted');
  });
}

function refreshFeeStats() {
  const totalBilled=state.fees.reduce((s,f)=>s+(parseFloat(f.billed)||0),0);
  const totalPaid=state.fees.reduce((s,f)=>s+(parseFloat(f.paid)||0),0);
  const totalBal=state.fees.reduce((s,f)=>s+(parseFloat(f.balance)||0),0);
  document.getElementById('totalFeeBilled').textContent=currency()+fmt(totalBilled);
  document.getElementById('totalFeePaid').textContent=currency()+fmt(totalPaid);
  document.getElementById('totalFeeBalance').textContent=currency()+fmt(totalBal);
}

function renderFees(list=null) {
  const rows=list||state.fees;
  const tbody=document.getElementById('feeTbody');
  if(rows.length===0){tbody.innerHTML='<tr class="empty-row"><td colspan="9">No fee records yet.</td></tr>';return;}
  tbody.innerHTML=rows.map(f=>{
    const bal=parseFloat(f.balance)||0;
    const sc=bal<=0?'badge-success':bal<parseFloat(f.billed)?'badge-warning':'badge-danger';
    const statusText=bal<=0?'Paid':bal<parseFloat(f.billed)?'Partial':'Unpaid';
    return `<tr>
      <td><strong>${getStudentName(f.studentId)}</strong></td>
      <td>${getStudentClass(f.studentId)}</td>
      <td>${f.term}</td><td>${f.year}</td>
      <td>${currency()}${fmt(f.billed)}</td>
      <td>${currency()}${fmt(f.paid)}</td>
      <td><strong style="color:${bal>0?'var(--danger)':'var(--success)'}">${currency()}${fmt(bal)}</strong></td>
      <td><span class="badge ${sc}">${statusText}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="openFeeModal(${f.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteFee(${f.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}
function filterFees() {
  const q=document.getElementById('feeSearch').value.toLowerCase();
  const term=document.getElementById('feeTermFilter').value;
  renderFees(state.fees.filter(f=>{
    const name=getStudentName(f.studentId).toLowerCase();
    return(!q||name.includes(q))&&(!term||f.term===term);
  }));
}

// ================================================================
// ARREARS
// ================================================================
function renderArrears(list=null) {
  const arrears=list||state.fees.filter(f=>(parseFloat(f.balance)||0)>0);
  const tbody=document.getElementById('arrearsTbody');
  const badge=document.getElementById('arrearsBadge');
  if(arrears.length===0){
    tbody.innerHTML='<tr class="empty-row"><td colspan="9">No outstanding arrears. Great!</td></tr>';
    badge.style.display='none'; return;
  }
  badge.textContent=arrears.length; badge.style.display='inline-block';
  tbody.innerHTML=arrears.map(f=>{
    const s=state.students.find(x=>x.id===f.studentId);
    const name=s?`${s.firstName} ${s.lastName}`:'N/A';
    return `<tr>
      <td><strong>${name}</strong></td>
      <td><span style="color:var(--primary)">${s?s.admNo:'—'}</span></td>
      <td>${getStudentClass(f.studentId)}</td>
      <td>${f.term}</td><td>${f.year}</td>
      <td>${currency()}${fmt(f.billed)}</td>
      <td>${currency()}${fmt(f.paid)}</td>
      <td><strong style="color:var(--danger)">${currency()}${fmt(f.balance)}</strong></td>
      <td><button class="btn btn-secondary btn-sm" onclick="openFeeModal(${f.id})"><i class="fas fa-pen"></i> Update</button></td>
    </tr>`;
  }).join('');
}
function filterArrears() {
  const q=document.getElementById('arrearsSearch').value.toLowerCase();
  const cls=document.getElementById('arrearsClassFilter').value;
  renderArrears(state.fees.filter(f=>{
    if((parseFloat(f.balance)||0)<=0) return false;
    const name=getStudentName(f.studentId).toLowerCase();
    const st=state.students.find(s=>s.id===f.studentId);
    return(!q||name.includes(q))&&(!cls||st&&st.classId===parseInt(cls));
  }));
}
function printArrears() {window.print();}

// ================================================================
// BILLING
// ================================================================
function renderBilling() {
  const s=state.settings;
  document.getElementById('billingStudentCount').textContent=state.students.length;
  document.getElementById('billingFeeCount').textContent=state.fees.length;
  const arrearsCount=new Set(state.fees.filter(f=>f.balance>0).map(f=>f.studentId)).size;
  document.getElementById('billingArrearsCount').textContent=arrearsCount+' students';
  document.getElementById('billingCurrentTerm').textContent=`${s.currentTerm||'Term 1'} - ${s.academicYear||2025}`;
  const urlEl=document.getElementById('billingAppFrame');
  const statusEl=document.getElementById('billingAppStatus');
  if(s.billingAppUrl&&s.billingAppUrl.trim()) {
    urlEl.innerHTML=`<div style="margin-top:16px">
      <a href="${s.billingAppUrl}" target="_blank" class="btn btn-primary" style="font-size:14px;padding:12px 24px">
        <i class="fas fa-external-link-alt"></i> Open School Billing Assistant
      </a>
      <p style="font-size:12px;color:var(--text-muted);margin-top:8px">Opens in a new tab with your student and fee data context</p>
    </div>`;
    statusEl.innerHTML='<span class="badge badge-success"><i class="fas fa-link"></i> Connected</span>';
  } else {
    urlEl.innerHTML='<p style="color:var(--text-muted);font-size:13px;margin-top:8px">Set the billing app URL in <a href="#" onclick="navigate(\'settings\')">Settings → Academic Settings</a> to connect your School Billing Assistant.</p>';
    statusEl.innerHTML='<span class="badge badge-neutral">Not connected</span>';
  }
}

// ================================================================
// SETTINGS
// ================================================================
function loadSettingsForm() {
  const s=state.settings;
  const fields=['schoolName','motto','address','city','phone','email','website','poBox',
    'currentTerm','academicYear','currency','standardFee','admPrefix','adminName','adminRole',
    'gradingSystem','billingAppUrl'];
  fields.forEach(k=>{
    const el=document.getElementById('set'+k.charAt(0).toUpperCase()+k.slice(1));
    if(el) el.value=s[k]||'';
  });
  if(s.logo) {
    const img=document.getElementById('logoPreviewImg');
    if(img){img.src=s.logo;img.style.display='block';}
    const txt=document.getElementById('logoUploadText');
    if(txt) txt.style.display='none';
  }
}

async function saveSettings() {
  const fields=['schoolName','motto','address','city','phone','email','website','poBox',
    'currentTerm','academicYear','currency','standardFee','admPrefix','adminName','adminRole',
    'gradingSystem','billingAppUrl'];
  const newSettings={};
  fields.forEach(k=>{
    const el=document.getElementById('set'+k.charAt(0).toUpperCase()+k.slice(1));
    if(el) newSettings[k]=el.value;
  });
  if(state.settings.logo) newSettings.logo=state.settings.logo;
  await API.put('/api/settings',newSettings);
  state.settings={...state.settings,...newSettings};
  applySettings(); toast('Settings saved');
}

function applySettings() {
  const s=state.settings;
  document.getElementById('sidebarSchoolName').textContent=s.schoolName||'My School';
  document.getElementById('currentTermDisplay').textContent=`${s.currentTerm||'Term 1'} - ${s.academicYear||2025}`;
  document.getElementById('adminAvatar').textContent=((s.adminName||'A')[0]).toUpperCase();
}

function handleLogoUpload(e) {
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async(ev)=>{
    await API.put('/api/settings',{logo:ev.target.result});
    state.settings.logo=ev.target.result;
    document.getElementById('logoPreviewImg').src=ev.target.result;
    document.getElementById('logoPreviewImg').style.display='block';
    document.getElementById('logoUploadText').style.display='none';
    toast('Logo uploaded');
  };
  reader.readAsDataURL(file);
}

function exportData() { window.open('/api/export','_blank'); toast('Data exported'); }
function confirmReset() {
  confirmAction('This will permanently delete ALL data. This CANNOT be undone. Are you absolutely sure?', async()=>{
    const tables=['students','teachers','classes','subjects','assessments','fees','attendance','activity',
      'timetable_periods','timetable_teacher_meta','timetable_assignments','timetable_slots'];
    for(const t of tables) await API.del(`/api/reset/${t}`).catch(()=>{});
    location.reload();
  });
}

// ================================================================
// TABS
// ================================================================
function switchTab(groupId,tabId,btn) {
  document.getElementById(groupId).querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.closest('.tabs').querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

// ================================================================
// SETUP WIZARD
// ================================================================
function openSetupWizard() { openModal('setupWizardModal'); showWizardStep(1); }
function closeSetupWizard() {
  closeModal('setupWizardModal');
  API.put('/api/settings',{setupComplete:'1'});
  state.settings.setupComplete='1';
}

let wizardStep=1;
const wizardSteps=4;

function showWizardStep(step) {
  wizardStep=step;
  for(let i=1;i<=wizardSteps;i++) {
    const el=document.getElementById(`wizardStep${i}`);
    if(el) el.style.display=i===step?'block':'none';
  }
  document.getElementById('wizardProgress').textContent=`Step ${step} of ${wizardSteps}`;
  document.getElementById('wizardProgressBar').style.width=`${(step/wizardSteps)*100}%`;
  document.getElementById('wizardBack').style.display=step>1?'inline-flex':'none';
  document.getElementById('wizardNext').textContent=step===wizardSteps?'Finish Setup':'Next →';
}

async function wizardNext() {
  if(wizardStep<wizardSteps) {
    showWizardStep(wizardStep+1);
  } else {
    await saveWizardData();
    closeSetupWizard();
    toast('Setup complete! Welcome to your school management system.','success');
  }
}

async function saveWizardData() {
  const newSettings={
    schoolName:document.getElementById('wSchoolName').value.trim()||'My School',
    motto:document.getElementById('wMotto').value.trim(),
    address:document.getElementById('wAddress').value.trim(),
    city:document.getElementById('wCity').value.trim(),
    phone:document.getElementById('wPhone').value.trim(),
    email:document.getElementById('wEmail').value.trim(),
    currentTerm:document.getElementById('wCurrentTerm').value,
    academicYear:document.getElementById('wAcademicYear').value,
    currency:document.getElementById('wCurrency').value,
    admPrefix:document.getElementById('wAdmPrefix').value.trim()||'STD',
    adminName:document.getElementById('wAdminName').value.trim(),
    adminRole:document.getElementById('wAdminRole').value.trim(),
    billingAppUrl:document.getElementById('wBillingUrl').value.trim(),
    setupComplete:'1'
  };
  await API.put('/api/settings',newSettings);
  state.settings={...state.settings,...newSettings};
  applySettings();
}

// ================================================================
// INIT
// ================================================================
async function init() {
  try {
    const [settings,students,teachers,classes,subjects,assessments,fees,attendance] = await Promise.all([
      API.get('/api/settings'), API.get('/api/students'), API.get('/api/teachers'),
      API.get('/api/classes'), API.get('/api/subjects'), API.get('/api/assessments'),
      API.get('/api/fees'), API.get('/api/attendance')
    ]);
    state.settings=settings;
    state.students=students.map(s=>({...s,id:parseInt(s.id),classId:s.classId?parseInt(s.classId):null}));
    state.teachers=teachers.map(t=>({...t,id:parseInt(t.id),subjectId:t.subjectId?parseInt(t.subjectId):null}));
    state.classes=classes.map(c=>({...c,id:parseInt(c.id),teacherId:c.teacherId?parseInt(c.teacherId):null,capacity:parseInt(c.capacity)||40}));
    state.subjects=subjects.map(s=>({...s,id:parseInt(s.id),teacherId:s.teacherId?parseInt(s.teacherId):null}));
    state.assessments=assessments.map(a=>({...a,id:parseInt(a.id),studentId:parseInt(a.studentId),subjectId:a.subjectId?parseInt(a.subjectId):null,classId:a.classId?parseInt(a.classId):null,total:parseFloat(a.total)||0,test1:parseFloat(a.test1)||0,test2:parseFloat(a.test2)||0,exam:parseFloat(a.exam)||0}));
    state.fees=fees.map(f=>({...f,id:parseInt(f.id),studentId:parseInt(f.studentId),billed:parseFloat(f.billed)||0,paid:parseFloat(f.paid)||0,balance:parseFloat(f.balance)||0}));
    state.attendance=attendance.map(a=>({...a,id:parseInt(a.id),studentId:parseInt(a.studentId),classId:a.classId?parseInt(a.classId):null}));

    populateDropdowns();
    renderStudents(); renderTeachers(); renderClasses(); renderSubjects();
    renderAssessments(); renderFees(); renderAttendance(); renderArrears();
    refreshFeeStats(); refreshDashboard(); applySettings();

    const dateEl=document.getElementById('attendanceDate');
    if(dateEl&&!dateEl.value) dateEl.value=new Date().toISOString().split('T')[0];

    // Show setup wizard if not completed
    if(!settings.setupComplete||settings.setupComplete==='0') {
      setTimeout(()=>openSetupWizard(), 800);
    }

    // Load timetable data
    if(window.TT) window.TT.loadTimetableData();

  } catch(err) {
    console.error('Init error:', err);
    document.getElementById('pageSubtitle').textContent='⚠ Could not connect to server. Please refresh.';
  }
}

init();
