// ─── API CLIENT ─────────────────────────────────────────────────────────────
const API = {
  async get(url) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  async post(url, data) { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return r.json(); },
  async put(url, data) { const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return r.json(); },
  async delete(url) { const r = await fetch(url, { method: 'DELETE' }); return r.json(); }
};

// ─── STATE ───────────────────────────────────────────────────────────────────
let _settings = {}, _students = [], _teachers = [], _classes = [], _subjects = [];
let _editId = null;

// ─── MOBILE SIDEBAR ──────────────────────────────────────────────────────────
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  const isOpen = sb.classList.toggle('sb-open');
  bd.classList.toggle('active', isOpen);
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('sb-open');
  document.getElementById('sidebar-backdrop').classList.remove('active');
}

// ─── MOBILE SEARCH ───────────────────────────────────────────────────────────
function toggleMobileSearch() {
  const bar = document.getElementById('mobile-search-bar');
  const isHidden = bar.style.display === 'none' || bar.classList.contains('hidden');
  if (isHidden) {
    bar.style.display = 'flex';
    bar.classList.remove('hidden');
    document.getElementById('mobile-search-input').focus();
  } else {
    bar.style.display = 'none';
    bar.classList.add('hidden');
    document.getElementById('search-results').style.display = 'none';
  }
}

// Wire mobile search input to same search handler
document.addEventListener('DOMContentLoaded', () => {
  const msi = document.getElementById('mobile-search-input');
  if (msi) {
    msi.addEventListener('input', () => {
      const si = document.getElementById('search-input');
      si.value = msi.value;
      si.dispatchEvent(new Event('input'));
    });
  }
  // Show mobile search button on small screens
  const updateMobileUI = () => {
    const isMobile = window.innerWidth <= 768;
    const mBtn = document.getElementById('btn-mobile-search');
    if (mBtn) mBtn.style.display = isMobile ? 'flex' : 'none';
  };
  updateMobileUI();
  window.addEventListener('resize', updateMobileUI);
});

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const sectionTitles = {
  dashboard: ['Dashboard', 'Welcome to your school management portal'],
  notifications: ['Notification Center', 'System alerts and updates'],
  students: ['Students', 'Manage student enrollment records'],
  teachers: ['Teachers', 'Manage teaching staff records'],
  classes: ['Classes', 'Manage school classes'],
  subjects: ['Subjects', 'Manage subject catalogue'],
  assessments: ['Assessments', 'Record and manage student assessments'],
  attendance: ['Attendance', 'Track student attendance'],
  reportcards: ['Report Cards', 'Generate term report cards'],
  timetable: ['Timetable', 'Class timetable generator'],
  calendar: ['Academic Calendar', 'Manage academic calendar events'],
  analytics: ['Class Analytics', 'Performance charts and statistics'],
  assignments: ['Assignments', 'Track class assignments and homework'],
  promotions: ['Student Promotions', 'Manage promotion and retention records'],
  conduct: ['Conduct Log', 'Student disciplinary and conduct records'],
  scholarships: ['Scholarships', 'Manage scholarship records'],
  'staff-attendance': ['Staff Attendance', 'Track daily staff attendance'],
  leave: ['Leave Management', 'Staff leave requests and approvals'],
  payroll: ['Staff Payroll', 'Monthly payroll records'],
  fees: ['Fees & Payments', 'Manage student fee payments'],
  arrears: ['Arrears', 'Students with outstanding fee balances'],
  expenses: ['Expense Tracker', 'Record and track school expenses'],
  'petty-cash': ['Petty Cash Log', 'Track petty cash transactions'],
  billing: ['Bill Generator', 'Generate and print student fee bills'],
  inventory: ['Inventory', 'School assets and inventory tracking'],
  notices: ['Notice Board', 'School announcements and notices'],
  grading: ['Grading Rules', 'Manage grade boundary definitions'],
  audit: ['Audit Log', 'System activity audit trail'],
  settings: ['Settings', 'Configure system settings']
};

function navigate(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  const sec = document.getElementById(`section-${section}`);
  if (sec) sec.classList.add('active');
  const si = document.querySelector(`.sb-item[data-section="${section}"]`);
  if (si) si.classList.add('active');
  const [title, sub] = sectionTitles[section] || ['Page', ''];
  document.getElementById('tb-page-title').textContent = title;
  document.getElementById('tb-page-sub').textContent = sub;
  document.getElementById('search-results').style.display = 'none';
  // Toggle billing full-height mode
  document.getElementById('content').classList.toggle('billing-active', section === 'billing');
  // Mobile: close sidebar & sync bottom nav
  if (window.innerWidth <= 768) {
    closeSidebar();
    document.querySelectorAll('#bottom-nav .bnav-item[data-section]').forEach(b => {
      b.classList.toggle('active', b.dataset.section === section);
    });
  }
  // Load data
  const loaders = {
    dashboard: loadDashboard, students: loadStudents, teachers: loadTeachers,
    classes: loadClasses, subjects: loadSubjects, assessments: loadAssessments,
    attendance: loadAttendanceView, reportcards: setupReportCards,
    timetable: () => typeof initTimetable === 'function' && initTimetable(),
    calendar: () => typeof loadCalendar === 'function' && loadCalendar(),
    analytics: setupAnalytics, assignments: loadAssignments,
    promotions: loadPromotions, conduct: loadConduct, scholarships: loadScholarships,
    'staff-attendance': loadStaffAttendance, leave: loadLeave, payroll: loadPayroll,
    fees: loadFees, arrears: loadArrears,
    expenses: loadExpenses, 'petty-cash': loadPettyCash,
    billing: setupBilling, inventory: loadInventory,
    notices: loadNotices, grading: loadGradingRules,
    audit: loadAudit, settings: loadSettings,
    notifications: loadNotificationsSection
  };
  if (loaders[section]) loaders[section]();
}

document.querySelectorAll('.sb-item[data-section]').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.section));
});

// ─── MODAL HELPERS ───────────────────────────────────────────────────────────
function openModal(id, editId) {
  _editId = editId || null;
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  _editId = null;
}
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); });
});

// ─── TOAST ───────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    t.style.cssText = `position:fixed;top:68px;left:50%;transform:translateX(-50%);padding:12px 18px;border-radius:8px;color:#fff;font-size:.85rem;z-index:9999;animation:slideUp .2s ease;max-width:90vw;box-shadow:0 4px 12px rgba(0,0,0,.15);white-space:nowrap`;
  } else {
    t.style.cssText = `position:fixed;bottom:20px;right:20px;padding:12px 18px;border-radius:8px;color:#fff;font-size:.85rem;z-index:9999;animation:slideUp .2s ease;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,.15)`;
  }
  t.style.background = { success: '#22c55e', danger: '#ef4444', warning: '#f59e0b', info: '#3b82f6' }[type] || '#3b82f6';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(id, btn) {
  const parent = btn.closest('.section, .modal-body, #content');
  if (!parent) return;
  parent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById(id);
  if (pane) pane.classList.add('active');
  btn.classList.add('active');
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
let _currentLogoBase64 = '';

async function loadSettings() {
  _settings = await API.get('/api/settings');
  const keys = ['schoolName','motto','address','city','phone','email','website','poBox',
    'currentTerm','academicYear','currency','standardFee','admPrefix','billingAppUrl','lowStockThreshold',
    'adminName','adminRole','userRole','userPin','schoolRegNo','region','district',
    'chimeEnabled','chimeSound','chimeVolume'];
  keys.forEach(k => {
    const el = document.getElementById(`s-${k}`);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = _settings[k] === '1';
    else el.value = _settings[k] || '';
  });
  // Populate logo preview
  _currentLogoBase64 = _settings.logo || '';
  setLogoPreview(_currentLogoBase64, '');
}

async function saveSettings() {
  const keys = ['schoolName','motto','address','city','phone','email','website','poBox',
    'currentTerm','academicYear','currency','standardFee','admPrefix','billingAppUrl','lowStockThreshold',
    'adminName','adminRole','userRole','userPin','schoolRegNo','region','district',
    'chimeSound','chimeVolume'];
  const data = {};
  keys.forEach(k => { const el = document.getElementById(`s-${k}`); if (el) data[k] = el.value; });
  const chimeEl = document.getElementById('s-chimeEnabled');
  if (chimeEl) data.chimeEnabled = chimeEl.checked ? '1' : '0';
  data.logo = _currentLogoBase64;
  await API.put('/api/settings', data);
  _settings = { ..._settings, ...data };
  updateBranding();
  toast('Settings saved successfully');
}

function updateBranding() {
  const name = _settings.schoolName || 'My School';
  const term = _settings.currentTerm || 'Term 1';
  const year = _settings.academicYear || '2025';
  document.getElementById('sb-school-name').textContent = name;
  document.getElementById('sb-term').textContent = `${term} • ${year}`;
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('tb-avatar').textContent = initials;
  const sbLogo = document.getElementById('sb-logo');
  if (_settings.logo) {
    sbLogo.innerHTML = `<img src="${_settings.logo}" style="width:36px;height:36px;border-radius:6px;object-fit:cover">`;
  } else {
    sbLogo.innerHTML = `<i class="fa fa-graduation-cap"></i>`;
  }
}

// ─── LOGO UPLOAD ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('logo-drop-zone');
  if (dz) dz.addEventListener('click', () => document.getElementById('logo-file-input').click());
});

function handleLogoDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('logo-drop-zone');
  dz.style.background = 'var(--bg)';
  dz.style.borderColor = 'var(--border)';
  const file = e.dataTransfer.files[0];
  if (file) processLogoFile(file);
}

function handleLogoFileSelect(input) {
  const file = input.files[0];
  if (file) processLogoFile(file);
}

function processLogoFile(file) {
  if (!file.type.startsWith('image/')) {
    toast('Please select an image file (PNG, JPG, SVG…)', 'danger');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast('Image is too large — please use a file under 5 MB', 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    _currentLogoBase64 = e.target.result;
    setLogoPreview(_currentLogoBase64, file.name);
    toast('Logo ready — click Save to apply it', 'info');
  };
  reader.readAsDataURL(file);
}

function setLogoPreview(src, filename) {
  const img = document.getElementById('logo-preview-img');
  const placeholder = document.getElementById('logo-preview-placeholder');
  const removeBtn = document.getElementById('logo-remove-btn');
  const fileLabel = document.getElementById('logo-filename');
  if (!img) return;
  if (src) {
    img.src = src;
    img.style.display = 'block';
    placeholder.style.display = 'none';
    removeBtn.style.display = 'flex';
    if (filename) { fileLabel.textContent = filename; fileLabel.style.display = 'block'; }
    else { fileLabel.style.display = 'none'; }
  } else {
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'block';
    removeBtn.style.display = 'none';
    fileLabel.style.display = 'none';
    document.getElementById('logo-file-input').value = '';
  }
}

function removeLogo() {
  _currentLogoBase64 = '';
  setLogoPreview('', '');
  toast('Logo removed — click Save to apply', 'info');
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function showProfile() {
  const pp = document.getElementById('profile-popup');
  document.getElementById('pp-name').textContent = _settings.schoolName || 'My School';
  document.getElementById('pp-motto').textContent = _settings.motto || '';
  const logo = document.getElementById('pp-logo');
  logo.innerHTML = _settings.logo ? `<img src="${_settings.logo}" style="width:80px;height:80px;border-radius:12px;object-fit:cover">` : `<i class="fa fa-graduation-cap"></i>`;
  const rows = [
    ['Reg. Number', _settings.schoolRegNo], ['Region', _settings.region],
    ['District', _settings.district], ['Address', _settings.address],
    ['Phone', _settings.phone], ['Email', _settings.email],
    ['Website', _settings.website], ['Administrator', _settings.adminName],
    ['Role', _settings.adminRole], ['Current Term', `${_settings.currentTerm} / ${_settings.academicYear}`]
  ].filter(([, v]) => v);
  document.getElementById('pp-body').innerHTML = rows.map(([k, v]) => `<div class="profile-row"><span>${k}</span><span style="font-weight:500">${v}</span></div>`).join('');
  pp.classList.add('active');
}
function closeProfile() { document.getElementById('profile-popup').classList.remove('active'); }
document.getElementById('profile-popup').addEventListener('click', e => { if (e.target === document.getElementById('profile-popup')) closeProfile(); });

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
async function loadDashboard() {
  const stats = await API.get('/api/stats');
  const cur = _settings.currency || '₵';
  const pct = stats.totalAttendance > 0 ? ((stats.presentCount / stats.totalAttendance) * 100).toFixed(0) : 0;
  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon blue"><i class="fa fa-user-graduate"></i></div><div><div class="stat-num">${stats.students}</div><div class="stat-label">Total Students</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa fa-chalkboard-teacher"></i></div><div><div class="stat-num">${stats.teachers}</div><div class="stat-label">Teachers</div></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="fa fa-door-open"></i></div><div><div class="stat-num">${stats.classes}</div><div class="stat-label">Classes</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="fa fa-coins"></i></div><div><div class="stat-num">${cur}${Number(stats.totalPaid).toFixed(2)}</div><div class="stat-label">Fees Collected</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fa fa-exclamation-circle"></i></div><div><div class="stat-num">${cur}${Number(stats.totalBalance).toFixed(2)}</div><div class="stat-label">Outstanding Arrears</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa fa-calendar-check"></i></div><div><div class="stat-num">${pct}%</div><div class="stat-label">Avg Attendance</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="fa fa-wallet"></i></div><div><div class="stat-num">${cur}${Number(stats.totalExpenses||0).toFixed(2)}</div><div class="stat-label">Total Expenses</div></div></div>
    <div class="stat-card"><div class="stat-icon red" style="cursor:pointer" onclick="navigate('notifications')"><i class="fa fa-bell"></i></div><div><div class="stat-num">${stats.notifCount||0}</div><div class="stat-label">Notifications</div></div></div>
  `;
  // Classes list
  document.getElementById('dash-classes-list').innerHTML = stats.classCounts.length
    ? stats.classCounts.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--border)">
        <span style="font-size:.85rem;font-weight:500">${c.name}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="height:6px;width:80px;background:#e2e8f0;border-radius:3px;overflow:hidden"><div style="height:100%;background:var(--blue);width:${Math.min(100,Math.round((c.enrolled/c.capacity)*100))}%"></div></div>
          <span style="font-size:.75rem;color:var(--muted)">${c.enrolled}/${c.capacity}</span>
        </div></div>`).join('')
    : `<div style="padding:20px;text-align:center;color:var(--muted);font-size:.85rem">No classes created yet</div>`;
  // Activity
  const activity = await API.get('/api/activity');
  const colors = { blue: '#3b82f6', green: '#22c55e', amber: '#f59e0b', red: '#ef4444', purple: '#8b5cf6' };
  document.getElementById('activity-list').innerHTML = activity.length
    ? activity.map(a => `<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border)">
        <div style="width:8px;height:8px;border-radius:50%;background:${colors[a.type]||'#3b82f6'};flex-shrink:0"></div>
        <div style="flex:1;font-size:.82rem">${a.text}</div>
        <span style="font-size:.7rem;color:var(--muted)">${a.time}</span></div>`).join('')
    : `<div style="padding:20px;text-align:center;color:var(--muted);font-size:.85rem">No recent activity</div>`;
  // Mini calendar
  renderMiniCalendar(stats.upcomingEvents || []);
  // Upcoming events
  const evEl = document.getElementById('dash-events');
  evEl.innerHTML = (stats.upcomingEvents||[]).length
    ? stats.upcomingEvents.map(e => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;cursor:pointer" onclick="typeof showEventDetail==='function'&&showEventDetail(${e.id})">
        <div style="width:8px;height:8px;border-radius:2px;background:${e.color||'#3b82f6'};flex-shrink:0"></div>
        <div style="flex:1;font-size:.8rem">${e.title}</div>
        <span style="font-size:.72rem;color:var(--muted)">${e.startDate}</span></div>`).join('')
    : `<div style="font-size:.8rem;color:var(--muted)">No upcoming events in the next 7 days</div>`;
}

function renderMiniCalendar(events = []) {
  const now = new Date(), year = now.getFullYear(), month = now.getMonth();
  const first = new Date(year, month, 1).getDay(), days = new Date(year, month + 1, 0).getDate();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const eventDates = new Set(events.map(e => e.startDate));
  let html = `<div style="font-size:.82rem;font-weight:700;margin-bottom:8px;text-align:center">${months[month]} ${year}</div>`;
  html += `<div class="mini-cal-grid">`;
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => html += `<div class="mini-cal-head">${d}</div>`);
  for (let i = 0; i < first; i++) html += `<div class="mini-cal-day other-month"></div>`;
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d === now.getDate();
    const hasEvent = eventDates.has(dateStr);
    html += `<div class="mini-cal-day${isToday?' today':''}${hasEvent&&!isToday?' has-event':''}" title="${hasEvent?'Event on this day':''}">${d}</div>`;
  }
  html += '</div>';
  document.getElementById('mini-cal').innerHTML = html;
}

// ─── STUDENTS ────────────────────────────────────────────────────────────────
async function loadStudents() {
  _students = await API.get('/api/students');
  const fc = document.getElementById('filter-class').value;
  const fs = document.getElementById('filter-status').value;
  const fq = (document.getElementById('filter-student').value || '').toLowerCase();
  let list = _students;
  if (fc) list = list.filter(s => String(s.classId) === fc);
  if (fs) list = list.filter(s => s.status === fs);
  if (fq) list = list.filter(s => `${s.firstName} ${s.lastName} ${s.admNo}`.toLowerCase().includes(fq));
  const tbody = document.getElementById('students-body');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state" style="padding:30px"><i class="fa fa-user-graduate"></i><h4>No students found</h4></div></td></tr>`; return; }
  tbody.innerHTML = list.map(s => {
    const cls = _classes.find(c => c.id === s.classId);
    return `<tr>
      <td><span class="badge badge-blue">${s.admNo}</span></td>
      <td style="cursor:pointer;color:var(--blue);font-weight:500" onclick="viewStudentProfile(${s.id})">${s.firstName} ${s.lastName}</td>
      <td>${cls ? cls.name : '<span class="badge badge-gray">Unassigned</span>'}</td>
      <td>${s.gender||'-'}</td><td>${s.parent||'-'}</td><td>${s.contact||'-'}</td>
      <td><span class="badge ${s.status==='Active'?'badge-green':s.status==='Transferred'?'badge-amber':'badge-red'}">${s.status}</span></td>
      <td><button class="btn btn-sm btn-outline" onclick="editStudent(${s.id})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteStudent(${s.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('');
  // Populate class filter
  const fc2 = document.getElementById('filter-class');
  const cv = fc2.value;
  fc2.innerHTML = '<option value="">All Classes</option>' + _classes.map(c => `<option value="${c.id}"${String(c.id)===cv?'selected':''}>${c.name}</option>`).join('');
}

function editStudent(id) {
  const s = _students.find(x => x.id === id);
  if (!s) return;
  _editId = id;
  document.getElementById('student-modal-title').textContent = 'Edit Student';
  ['firstName','lastName','otherName','gender','dob','admDate','status','parent','contact','photo'].forEach(k => {
    const el = document.getElementById(`s-${k}`);
    if (el) el.value = s[k] || '';
  });
  document.getElementById('s-address-student').value = s.address || '';
  const sel = document.getElementById('s-classId');
  sel.innerHTML = '<option value="">-- Select --</option>' + _classes.map(c => `<option value="${c.id}"${c.id===s.classId?'selected':''}>${c.name}</option>`).join('');
  openModal('student-modal', id);
}

async function saveStudent() {
  const d = {
    firstName: document.getElementById('s-firstName').value.trim(),
    lastName: document.getElementById('s-lastName').value.trim(),
    otherName: document.getElementById('s-otherName').value,
    gender: document.getElementById('s-gender').value,
    dob: document.getElementById('s-dob').value,
    classId: document.getElementById('s-classId').value || null,
    admDate: document.getElementById('s-admDate').value,
    status: document.getElementById('s-status').value,
    parent: document.getElementById('s-parent').value,
    contact: document.getElementById('s-contact').value,
    address: document.getElementById('s-address-student').value,
    photo: document.getElementById('s-photo').value
  };
  if (!d.firstName || !d.lastName) { toast('First and last name are required', 'danger'); return; }
  if (_editId) { await API.put(`/api/students/${_editId}`, d); toast('Student updated'); }
  else { const r = await API.post('/api/students', d); toast(`Student enrolled – ${r.admNo}`); }
  closeModal('student-modal');
  loadStudents();
}

async function deleteStudent(id) {
  if (!confirm('Delete this student? This will also remove their assessments, fees, and attendance.')) return;
  await API.delete(`/api/students/${id}`);
  toast('Student deleted');
  loadStudents();
}

function openStudentModal() {
  _editId = null;
  document.getElementById('student-modal-title').textContent = 'Add Student';
  ['firstName','lastName','otherName','gender','dob','admDate','parent','contact','photo'].forEach(k => {
    const el = document.getElementById(`s-${k}`); if (el) el.value = '';
  });
  document.getElementById('s-address-student').value = '';
  document.getElementById('s-status').value = 'Active';
  const sel = document.getElementById('s-classId');
  sel.innerHTML = '<option value="">-- Select --</option>' + _classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  openModal('student-modal');
}

async function viewStudentProfile(id) {
  const s = _students.find(x => x.id === id);
  if (!s) return;
  const cls = _classes.find(c => c.id === s.classId);
  const [assessments, fees, promotions, conduct] = await Promise.all([
    API.get('/api/assessments'),
    API.get('/api/fees'),
    API.get('/api/promotions'),
    API.get('/api/conduct')
  ]);
  const sAssess = assessments.filter(a => a.studentId === id);
  const sFees = fees.filter(f => f.studentId === id);
  const sPromos = promotions.filter(p => p.studentId === id);
  const sConduct = conduct.filter(c => c.studentId === id);
  document.getElementById('sp-title').textContent = `${s.firstName} ${s.lastName}`;
  document.getElementById('sp-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)">
      <div style="width:64px;height:64px;border-radius:50%;background:#dbeafe;color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:1.4rem;overflow:hidden;flex-shrink:0">
        ${s.photo ? `<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover">` : '<i class="fa fa-user-graduate"></i>'}
      </div>
      <div>
        <div style="font-size:1rem;font-weight:700">${s.firstName} ${s.lastName} ${s.otherName||''}</div>
        <div style="color:var(--muted);font-size:.82rem">${s.admNo} &bull; ${cls?cls.name:'No Class'} &bull; ${s.gender||'N/A'}</div>
        <span class="badge ${s.status==='Active'?'badge-green':'badge-red'}">${s.status}</span>
      </div>
      <button class="btn btn-sm btn-outline" onclick="closeModal('student-profile-modal');editStudent(${s.id})" style="margin-left:auto"><i class="fa fa-edit"></i> Edit</button>
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('sp-tab-info',this)">Info</button>
      <button class="tab-btn" onclick="switchTab('sp-tab-assess',this)">Assessments (${sAssess.length})</button>
      <button class="tab-btn" onclick="switchTab('sp-tab-fees',this)">Fees (${sFees.length})</button>
      <button class="tab-btn" onclick="switchTab('sp-tab-promo',this)">Promotions (${sPromos.length})</button>
      <button class="tab-btn" onclick="switchTab('sp-tab-conduct',this)">Conduct (${sConduct.length})</button>
    </div>
    <div id="sp-tab-info" class="tab-pane active">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.82rem">
        ${[['DOB',s.dob],['Admission Date',s.admDate],['Parent/Guardian',s.parent],['Contact',s.contact],['Address',s.address]].map(([k,v])=>v?`<div><span style="color:var(--muted)">${k}:</span> <strong>${v}</strong></div>`:''  ).join('')}
      </div>
    </div>
    <div id="sp-tab-assess" class="tab-pane">
      ${sAssess.length ? `<table style="width:100%;font-size:.8rem"><thead><tr><th>Subject</th><th>Term</th><th>T1</th><th>T2</th><th>Exam</th><th>Total</th><th>Grade</th></tr></thead><tbody>
        ${sAssess.map(a => { const sub = _subjects.find(s2=>s2.id===a.subjectId); return `<tr><td>${sub?sub.name:'?'}</td><td>${a.term}</td><td>${a.test1}</td><td>${a.test2}</td><td>${a.exam}</td><td>${a.total}</td><td><strong>${a.grade}</strong></td></tr>`; }).join('')}</tbody></table>`
        : '<p style="color:var(--muted);font-size:.82rem;padding:12px 0">No assessment records</p>'}
    </div>
    <div id="sp-tab-fees" class="tab-pane">
      ${sFees.length ? `<table style="width:100%;font-size:.8rem"><thead><tr><th>Term</th><th>Billed</th><th>Paid</th><th>Balance</th></tr></thead><tbody>
        ${sFees.map(f=>`<tr><td>${f.term}</td><td>${_settings.currency||'₵'}${Number(f.billed).toFixed(2)}</td><td>${_settings.currency||'₵'}${Number(f.paid).toFixed(2)}</td><td style="${f.balance>0?'color:var(--red);font-weight:600':''}">${_settings.currency||'₵'}${Number(f.balance).toFixed(2)}</td></tr>`).join('')}</tbody></table>`
        : '<p style="color:var(--muted);font-size:.82rem;padding:12px 0">No fee records</p>'}
    </div>
    <div id="sp-tab-promo" class="tab-pane">
      ${sPromos.length ? sPromos.map(p=>`<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:.82rem"><span class="badge ${p.action==='Promoted'?'badge-green':'badge-amber'}">${p.action}</span> ${p.term} ${p.year} — ${p.reason||'No reason given'}</div>`).join('')
        : '<p style="color:var(--muted);font-size:.82rem;padding:12px 0">No promotion records</p>'}
    </div>
    <div id="sp-tab-conduct" class="tab-pane">
      ${sConduct.length ? sConduct.map(c=>`<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:.82rem"><strong>${c.date}</strong> — ${c.incident} <em style="color:var(--muted)">(${c.action||'No action'})</em></div>`).join('')
        : '<p style="color:var(--muted);font-size:.82rem;padding:12px 0">No conduct records</p>'}
    </div>
  `;
  openModal('student-profile-modal');
}

// ─── TEACHERS ────────────────────────────────────────────────────────────────
async function loadTeachers() {
  _teachers = await API.get('/api/teachers');
  const tbody = document.getElementById('teachers-body');
  tbody.innerHTML = _teachers.map(t => `<tr>
    <td><span class="badge badge-blue">${t.staffId}</span></td>
    <td style="font-weight:500">${t.firstName} ${t.lastName}</td>
    <td>${t.gender||'-'}</td><td>${t.qualification||'-'}</td><td>${t.phone||'-'}</td><td>${t.email||'-'}</td>
    <td><span class="badge ${t.status==='Active'?'badge-green':'badge-red'}">${t.status}</span></td>
    <td><button class="btn btn-sm btn-outline" onclick="editTeacher(${t.id})"><i class="fa fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteTeacher(${t.id})"><i class="fa fa-trash"></i></button></td>
  </tr>`).join('') || '<tr><td colspan="8"><div class="empty-state" style="padding:30px"><i class="fa fa-chalkboard-teacher"></i><h4>No teachers yet</h4></div></td></tr>';
  populateTeacherDropdowns();
}

function editTeacher(id) {
  const t = _teachers.find(x => x.id === id);
  if (!t) return;
  _editId = id;
  document.getElementById('teacher-modal-title').textContent = 'Edit Teacher';
  ['firstName','lastName','gender','qualification','phone','email','dateJoined','status'].forEach(k => {
    const el = document.getElementById(`t-${k}`); if (el) el.value = t[k] || '';
  });
  openModal('teacher-modal', id);
}

async function saveTeacher() {
  const d = {
    firstName: document.getElementById('t-firstName').value.trim(),
    lastName: document.getElementById('t-lastName').value.trim(),
    gender: document.getElementById('t-gender').value,
    qualification: document.getElementById('t-qualification').value,
    phone: document.getElementById('t-phone').value,
    email: document.getElementById('t-email').value,
    dateJoined: document.getElementById('t-dateJoined').value,
    status: document.getElementById('t-status').value
  };
  if (!d.firstName || !d.lastName) { toast('First and last name required', 'danger'); return; }
  if (_editId) { await API.put(`/api/teachers/${_editId}`, d); toast('Teacher updated'); }
  else { const r = await API.post('/api/teachers', d); toast(`Teacher added – ${r.staffId}`); }
  closeModal('teacher-modal');
  loadTeachers();
}

async function deleteTeacher(id) {
  if (!confirm('Delete this teacher?')) return;
  await API.delete(`/api/teachers/${id}`);
  toast('Teacher deleted');
  loadTeachers();
}

function populateTeacherDropdowns() {
  const opt = '<option value="">-- Select Teacher --</option>' + _teachers.map(t => `<option value="${t.id}">${t.firstName} ${t.lastName}</option>`).join('');
  ['c-teacherId','sub-teacherId','lv-teacherId','py-teacherId','msa-teacher'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opt;
  });
}

// ─── CLASSES ────────────────────────────────────────────────────────────────
async function loadClasses() {
  _classes = await API.get('/api/classes');
  const students = _students.length ? _students : await API.get('/api/students');
  const tbody = document.getElementById('classes-body');
  tbody.innerHTML = _classes.map(c => {
    const t = _teachers.find(x => x.id === c.teacherId);
    const enrolled = students.filter(s => s.classId === c.id).length;
    return `<tr>
      <td style="font-weight:500">${c.name}</td><td>${c.level||'-'}</td>
      <td>${t?`${t.firstName} ${t.lastName}`:'<span class="badge badge-gray">None</span>'}</td>
      <td>${enrolled}</td><td>${c.capacity}</td>
      <td><button class="btn btn-sm btn-outline" onclick="editClass(${c.id})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteClass(${c.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="6"><div class="empty-state" style="padding:30px"><i class="fa fa-door-open"></i><h4>No classes yet</h4></div></td></tr>';
  populateClassDropdowns();
}

function editClass(id) {
  const c = _classes.find(x => x.id === id);
  if (!c) return;
  _editId = id;
  document.getElementById('c-name').value = c.name;
  document.getElementById('c-level').value = c.level || '';
  document.getElementById('c-capacity').value = c.capacity;
  document.getElementById('c-teacherId').innerHTML = '<option value="">-- Assign Teacher --</option>' + _teachers.map(t => `<option value="${t.id}"${t.id===c.teacherId?'selected':''}>${t.firstName} ${t.lastName}</option>`).join('');
  openModal('class-modal', id);
}

async function saveClass() {
  const d = { name: document.getElementById('c-name').value.trim(), level: document.getElementById('c-level').value, capacity: parseInt(document.getElementById('c-capacity').value)||40, teacherId: document.getElementById('c-teacherId').value||null };
  if (!d.name) { toast('Class name required', 'danger'); return; }
  if (_editId) { await API.put(`/api/classes/${_editId}`, d); toast('Class updated'); }
  else { await API.post('/api/classes', d); toast('Class created'); }
  closeModal('class-modal');
  loadClasses();
}

async function deleteClass(id) {
  if (!confirm('Delete this class?')) return;
  await API.delete(`/api/classes/${id}`);
  toast('Class deleted');
  loadClasses();
}

function populateClassDropdowns() {
  const opt = '<option value="">-- Select Class --</option>' + _classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  ['s-classId','a-classId','filter-class','filter-assessment-class','filter-att-class',
   'filter-conduct-class','filter-assign-class','as-classId','pr-fromClass','pr-toClass',
   'ma-class','n-classId','rc-class','analytics-class'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { const prev = el.value; el.innerHTML = opt; if (prev) el.value = prev; }
  });
}

// ─── SUBJECTS ────────────────────────────────────────────────────────────────
async function loadSubjects() {
  _subjects = await API.get('/api/subjects');
  const tbody = document.getElementById('subjects-body');
  tbody.innerHTML = _subjects.map(s => {
    const t = _teachers.find(x => x.id === s.teacherId);
    return `<tr>
      <td><span class="badge badge-gray">${s.code||'-'}</span></td>
      <td style="font-weight:500">${s.name}</td>
      <td><span class="badge ${s.category==='Core'?'badge-blue':s.category==='Elective'?'badge-green':'badge-purple'}">${s.category}</span></td>
      <td>${t?`${t.firstName} ${t.lastName}`:'<span style="color:var(--muted)">Unassigned</span>'}</td>
      <td><button class="btn btn-sm btn-outline" onclick="editSubject(${s.id})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteSubject(${s.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="5"><div class="empty-state" style="padding:30px"><i class="fa fa-book"></i><h4>No subjects yet</h4></div></td></tr>';
  populateSubjectDropdowns();
}

function editSubject(id) {
  const s = _subjects.find(x => x.id === id);
  if (!s) return;
  _editId = id;
  document.getElementById('sub-code').value = s.code || '';
  document.getElementById('sub-name').value = s.name;
  document.getElementById('sub-category').value = s.category || 'Core';
  document.getElementById('sub-teacherId').innerHTML = '<option value="">-- Assign --</option>' + _teachers.map(t => `<option value="${t.id}"${t.id===s.teacherId?'selected':''}>${t.firstName} ${t.lastName}</option>`).join('');
  openModal('subject-modal', id);
}

async function saveSubject() {
  const d = { code: document.getElementById('sub-code').value, name: document.getElementById('sub-name').value.trim(), category: document.getElementById('sub-category').value, teacherId: document.getElementById('sub-teacherId').value||null };
  if (!d.name) { toast('Subject name required', 'danger'); return; }
  if (_editId) { await API.put(`/api/subjects/${_editId}`, d); toast('Subject updated'); }
  else { await API.post('/api/subjects', d); toast('Subject added'); }
  closeModal('subject-modal');
  loadSubjects();
}

async function deleteSubject(id) {
  if (!confirm('Delete this subject?')) return;
  await API.delete(`/api/subjects/${id}`);
  toast('Subject deleted');
  loadSubjects();
}

function populateSubjectDropdowns() {
  const opt = '<option value="">-- Select Subject --</option>' + _subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  ['a-subjectId','as-subjectId'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = opt; });
}

// ─── ASSESSMENTS ─────────────────────────────────────────────────────────────
async function loadAssessments() {
  const all = await API.get('/api/assessments');
  const fc = document.getElementById('filter-assessment-class').value;
  const ft = document.getElementById('filter-assessment-term').value;
  let list = all;
  if (fc) list = list.filter(a => String(a.classId) === fc);
  if (ft) list = list.filter(a => a.term === ft);
  const gradeColors = { A: 'badge-green', B: 'badge-blue', C: 'badge-amber', D: 'badge-amber', F: 'badge-red' };
  document.getElementById('assessments-body').innerHTML = list.map(a => {
    const s = _students.find(x => x.id === a.studentId), sub = _subjects.find(x => x.id === a.subjectId), cls = _classes.find(x => x.id === a.classId);
    return `<tr>
      <td>${s?`${s.firstName} ${s.lastName}`:'?'}</td><td>${sub?sub.name:'?'}</td><td>${cls?cls.name:'-'}</td>
      <td>${a.term}</td><td>${a.test1}</td><td>${a.test2}</td><td>${a.exam}</td>
      <td style="font-weight:600">${a.total}</td>
      <td><span class="badge ${gradeColors[a.grade]||'badge-gray'}">${a.grade}</span></td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteAssessment(${a.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="10"><div class="empty-state" style="padding:30px"><i class="fa fa-clipboard-check"></i><h4>No assessments yet</h4></div></td></tr>';
}

async function saveAssessment() {
  const d = {
    studentId: parseInt(document.getElementById('a-studentId').value),
    subjectId: parseInt(document.getElementById('a-subjectId').value)||null,
    classId: parseInt(document.getElementById('a-classId').value)||null,
    term: document.getElementById('a-term').value,
    test1: parseFloat(document.getElementById('a-test1').value)||0,
    test2: parseFloat(document.getElementById('a-test2').value)||0,
    exam: parseFloat(document.getElementById('a-exam').value)||0
  };
  if (!d.studentId) { toast('Please select a student', 'danger'); return; }
  const r = await API.post('/api/assessments', d);
  toast(`Assessment saved – Total: ${r.total}, Grade: ${r.grade}`);
  closeModal('assessment-modal');
  loadAssessments();
}

async function deleteAssessment(id) {
  if (!confirm('Delete this assessment?')) return;
  await API.delete(`/api/assessments/${id}`);
  toast('Assessment deleted');
  loadAssessments();
}

// ─── FEES ────────────────────────────────────────────────────────────────────
async function loadFees() {
  const all = await API.get('/api/fees');
  const ft = document.getElementById('filter-fee-term').value;
  const list = ft ? all.filter(f => f.term === ft) : all;
  const cur = _settings.currency || '₵';
  document.getElementById('fees-body').innerHTML = list.map(f => {
    const s = _students.find(x => x.id === f.studentId);
    return `<tr>
      <td>${s?`${s.firstName} ${s.lastName}`:'?'}</td><td>${f.term}</td>
      <td>${cur}${Number(f.billed).toFixed(2)}</td><td>${cur}${Number(f.paid).toFixed(2)}</td>
      <td style="${f.balance>0?'color:var(--red);font-weight:600':''}">${cur}${Number(f.balance).toFixed(2)}</td>
      <td>${f.method}</td><td>${f.date?f.date.split('T')[0]:''}</td>
      <td><button class="btn btn-sm btn-outline" onclick="editFee(${f.id})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteFee(${f.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8"><div class="empty-state" style="padding:30px"><i class="fa fa-receipt"></i><h4>No fee records yet</h4></div></td></tr>';
}

function editFee(id) { /* simplified */ toast('Use Add Fee to edit', 'info'); }

async function saveFee() {
  const d = {
    studentId: parseInt(document.getElementById('f-studentId').value),
    term: document.getElementById('f-term').value,
    billed: parseFloat(document.getElementById('f-billed').value)||0,
    paid: parseFloat(document.getElementById('f-paid').value)||0,
    method: document.getElementById('f-method').value,
    notes: document.getElementById('f-notes').value
  };
  if (!d.studentId) { toast('Please select a student', 'danger'); return; }
  const r = await API.post('/api/fees', d);
  toast(`Fee saved – Balance: ${_settings.currency||'₵'}${Number(r.balance).toFixed(2)}`);
  closeModal('fee-modal');
  loadFees();
}

async function deleteFee(id) {
  if (!confirm('Delete this fee record?')) return;
  await API.delete(`/api/fees/${id}`);
  toast('Fee record deleted');
  loadFees();
}

async function loadArrears() {
  const [fees, students, classes] = await Promise.all([API.get('/api/fees'), API.get('/api/students'), API.get('/api/classes')]);
  const arrears = fees.filter(f => f.balance > 0);
  const cur = _settings.currency || '₵';
  document.getElementById('arrears-body').innerHTML = arrears.map(f => {
    const s = students.find(x => x.id === f.studentId), cls = classes.find(c => c.id === s?.classId);
    return `<tr>
      <td>${s?`${s.firstName} ${s.lastName}`:'?'}</td><td>${cls?cls.name:'-'}</td><td>${f.term}</td>
      <td>${cur}${Number(f.billed).toFixed(2)}</td><td>${cur}${Number(f.paid).toFixed(2)}</td>
      <td style="color:var(--red);font-weight:700">${cur}${Number(f.balance).toFixed(2)}</td>
      <td>${s?s.contact||'-':'-'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="7"><div class="empty-state" style="padding:30px"><i class="fa fa-check-circle" style="color:var(--green)"></i><h4>No arrears found</h4><p>All accounts are up to date</p></div></td></tr>';
}

function printArrears() {
  const w = window.open('', '_blank');
  const name = _settings.schoolName || 'School';
  const body = document.getElementById('arrears-body').innerHTML;
  w.document.write(`<html><head><title>Arrears List</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px}th{background:#f0f0f0}h2,h3{text-align:center;margin-bottom:4px}</style></head><body><h2>${name}</h2><h3>Arrears Report</h3><table><thead><tr><th>Student</th><th>Class</th><th>Term</th><th>Billed</th><th>Paid</th><th>Balance</th><th>Contact</th></tr></thead><tbody>${body}</tbody></table></body></html>`);
  w.print();
}

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────
async function loadAttendanceView() {
  const all = await API.get('/api/attendance');
  const fc = document.getElementById('filter-att-class').value;
  const fd = document.getElementById('filter-att-date').value;
  let list = all;
  if (fc) list = list.filter(a => String(a.classId) === fc);
  if (fd) list = list.filter(a => a.date === fd);
  document.getElementById('attendance-body').innerHTML = list.map(a => {
    const s = _students.find(x => x.id === a.studentId), cls = _classes.find(x => x.id === a.classId);
    return `<tr>
      <td>${a.date}</td><td>${s?`${s.firstName} ${s.lastName}`:'?'}</td><td>${cls?cls.name:'-'}</td>
      <td><span class="badge ${a.status==='Present'?'badge-green':a.status==='Absent'?'badge-red':'badge-amber'}">${a.status}</span></td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteAttendance(${a.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="5"><div class="empty-state" style="padding:30px"><i class="fa fa-calendar-check"></i><h4>No attendance records</h4></div></td></tr>';
}

function openMarkAttendance() {
  document.getElementById('ma-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('ma-class').innerHTML = '<option value="">-- Select Class --</option>' + _classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('mark-attendance-students').innerHTML = '';
  openModal('mark-attendance-modal');
}

async function loadMarkAttendanceStudents() {
  const classId = document.getElementById('ma-class').value;
  if (!classId) return;
  const students = _students.filter(s => String(s.classId) === classId);
  document.getElementById('mark-attendance-students').innerHTML = students.length
    ? `<table style="width:100%"><thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th></tr></thead><tbody>
      ${students.map(s => `<tr>
        <td>${s.firstName} ${s.lastName}</td>
        ${['Present','Absent','Late','Excused'].map(st => `<td><input type="radio" name="att_${s.id}" value="${st}" ${st==='Present'?'checked':''}></td>`).join('')}
      </tr>`).join('')}</tbody></table>`
    : '<p style="color:var(--muted);text-align:center;padding:20px">No students in this class</p>';
}

async function submitAttendance() {
  const classId = document.getElementById('ma-class').value, date = document.getElementById('ma-date').value;
  if (!classId || !date) { toast('Select class and date', 'danger'); return; }
  const records = [];
  document.querySelectorAll('[name^="att_"]').forEach(el => {
    if (el.checked) {
      const studentId = parseInt(el.name.split('_')[1]);
      records.push({ studentId, classId: parseInt(classId), date, term: _settings.currentTerm || 'Term 1', status: el.value });
    }
  });
  if (!records.length) { toast('No students to mark', 'warning'); return; }
  await API.post('/api/attendance', records);
  toast(`Attendance marked for ${records.length} students`);
  closeModal('mark-attendance-modal');
  loadAttendanceView();
}

async function deleteAttendance(id) {
  await API.delete(`/api/attendance/${id}`);
  loadAttendanceView();
}

// ─── REPORT CARDS ────────────────────────────────────────────────────────────
async function setupReportCards() {
  const sel = document.getElementById('rc-class');
  sel.innerHTML = '<option value="">-- Select Class --</option>' + _classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function generateReportCards() {
  const classId = document.getElementById('rc-class').value, term = document.getElementById('rc-term').value;
  if (!classId) { toast('Select a class', 'warning'); return; }
  const [students, assessments, attendance, gradingRules] = await Promise.all([
    API.get('/api/students'), API.get('/api/assessments'), API.get('/api/attendance'),
    API.get('/api/grading')
  ]);
  const cls = _classes.find(c => String(c.id) === classId);
  const classStudents = students.filter(s => String(s.classId) === classId);
  const cur = _settings.currency || '₵';
  const container = document.getElementById('report-cards-output');
  if (!classStudents.length) { container.innerHTML = '<div class="alert alert-warning">No students in this class</div>'; return; }
  container.innerHTML = classStudents.map(s => {
    const sAssess = assessments.filter(a => a.studentId === s.id && a.term === term);
    const sAtt = attendance.filter(a => a.studentId === s.id && a.term === term);
    const present = sAtt.filter(a => a.status === 'Present').length;
    const gradeColor = (g) => ({ A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' })[g] || '#64748b';
    return `<div class="card" style="margin-bottom:20px;page-break-after:always">
      <div style="background:linear-gradient(135deg,#1e293b,#334155);color:#fff;padding:20px;text-align:center">
        <div style="font-size:1rem;font-weight:700">${_settings.schoolName||'School'}</div>
        <div style="font-size:.78rem;opacity:.8">${_settings.motto||''}</div>
        <div style="margin-top:8px;font-size:.85rem;background:rgba(255,255,255,.1);border-radius:6px;padding:4px 12px;display:inline-block">STUDENT REPORT CARD — ${term}</div>
      </div>
      <div style="padding:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <div><strong>${s.firstName} ${s.lastName}</strong><br><span style="font-size:.78rem;color:var(--muted)">${s.admNo} &bull; ${cls?cls.name:''}</span></div>
          <div style="text-align:right;font-size:.78rem;color:var(--muted)">Attendance: ${present}/${sAtt.length} days</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.8rem">
          <thead><tr style="background:#f8fafc"><th style="padding:8px;border:1px solid var(--border)">Subject</th><th style="padding:8px;border:1px solid var(--border)">Test 1</th><th style="padding:8px;border:1px solid var(--border)">Test 2</th><th style="padding:8px;border:1px solid var(--border)">Exam</th><th style="padding:8px;border:1px solid var(--border)">Total</th><th style="padding:8px;border:1px solid var(--border)">Grade</th></tr></thead>
          <tbody>${sAssess.map(a => {
            const sub = _subjects.find(x => x.id === a.subjectId);
            return `<tr><td style="padding:7px;border:1px solid var(--border)">${sub?sub.name:'?'}</td><td style="padding:7px;border:1px solid var(--border);text-align:center">${a.test1}</td><td style="padding:7px;border:1px solid var(--border);text-align:center">${a.test2}</td><td style="padding:7px;border:1px solid var(--border);text-align:center">${a.exam}</td><td style="padding:7px;border:1px solid var(--border);text-align:center;font-weight:600">${a.total}</td><td style="padding:7px;border:1px solid var(--border);text-align:center"><span style="background:${gradeColor(a.grade)};color:#fff;border-radius:4px;padding:1px 8px;font-size:.78rem">${a.grade}</span></td></tr>`;
          }).join('') || '<tr><td colspan="6" style="padding:10px;text-align:center;color:var(--muted)">No assessments recorded</td></tr>'}</tbody>
        </table>
        <div style="margin-top:16px;display:flex;justify-content:space-between;font-size:.78rem">
          <div>Class Teacher: ___________________________</div>
          <div>Head Teacher: ___________________________</div>
        </div>
      </div>
    </div>`;
  }).join('');
  setTimeout(() => window.print(), 200);
}

// ─── GRADING RULES ───────────────────────────────────────────────────────────
async function loadGradingRules() {
  const rules = await API.get('/api/grading');
  const gradeColors = { A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
  document.getElementById('grading-rules-list').innerHTML = rules.map(r => `
    <div style="display:grid;grid-template-columns:80px 80px 80px 1fr 80px;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="font-weight:600;font-size:.85rem">${r.minScore}</div>
      <div style="font-weight:600;font-size:.85rem">${r.maxScore}</div>
      <div><span style="background:${gradeColors[r.grade]||'#64748b'};color:#fff;border-radius:4px;padding:2px 10px;font-weight:700">${r.grade}</span></div>
      <div style="font-size:.82rem;color:var(--muted)">${r.remarks||'-'}</div>
      <div><button class="btn btn-sm btn-danger" onclick="deleteGradingRule(${r.id})"><i class="fa fa-trash"></i></button></div>
    </div>`).join('') || '<div style="padding:16px 0;color:var(--muted);font-size:.85rem;text-align:center">No grading rules defined</div>';
}

async function saveGradingRule() {
  const d = { minScore: parseInt(document.getElementById('gr-min').value), maxScore: parseInt(document.getElementById('gr-max').value), grade: document.getElementById('gr-grade').value.trim().toUpperCase(), remarks: document.getElementById('gr-remarks').value };
  if (!d.grade || isNaN(d.minScore) || isNaN(d.maxScore)) { toast('Fill all required fields', 'danger'); return; }
  await API.post('/api/grading', d);
  toast('Grading rule added');
  closeModal('grading-modal');
  loadGradingRules();
}

async function deleteGradingRule(id) {
  if (!confirm('Delete this grading rule?')) return;
  await API.delete(`/api/grading/${id}`);
  toast('Grading rule deleted');
  loadGradingRules();
}

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
async function loadAudit() {
  const all = await API.get('/api/audit');
  const fm = document.getElementById('filter-audit-module').value;
  const list = fm ? all.filter(a => a.module === fm) : all;
  document.getElementById('audit-body').innerHTML = list.map(a => `<tr>
    <td style="font-size:.75rem">${a.timestamp?a.timestamp.split('T').join(' ').split('.')[0]:'-'}</td>
    <td>${a.user}</td><td>${a.action}</td>
    <td><span class="badge badge-blue">${a.module||'-'}</span></td>
    <td style="font-size:.75rem;color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis">${a.newValue||a.oldValue||'-'}</td>
  </tr>`).join('') || '<tr><td colspan="5"><div class="empty-state" style="padding:30px"><i class="fa fa-history"></i><h4>No audit records</h4></div></td></tr>';
}

// ─── BILLING — handled by billing.js (setupBilling defined there) ─────────────

// ─── SEARCH ──────────────────────────────────────────────────────────────────
const sectionIcons = { student:'user-graduate', teacher:'chalkboard-teacher', class:'door-open', subject:'book', expense:'wallet', inventory:'boxes', announcement:'bullhorn', event:'calendar-alt' };

document.getElementById('search-input').addEventListener('input', async function() {
  const q = this.value.trim();
  const res = document.getElementById('search-results');
  if (q.length < 2) { res.style.display = 'none'; return; }
  const results = await API.get(`/api/search?q=${encodeURIComponent(q)}`);
  if (!results.length) { res.style.display = 'none'; return; }
  res.style.display = 'block';
  res.innerHTML = results.map(r => `
    <div class="search-result-item" onclick="navigate('${r.url||r.section}');document.getElementById('search-results').style.display='none';document.getElementById('search-input').value=''">
      <div class="search-result-icon"><i class="fa fa-${sectionIcons[r.type]||'circle'}"></i></div>
      <div>
        <div class="search-result-name">${r.name||r.title||'?'}</div>
        <div class="search-result-meta"><span class="badge badge-gray">${r.section||r.type}</span> ${r.sub?`&bull; ${r.sub}`:''}</div>
      </div>
    </div>`).join('');
});

document.addEventListener('click', e => {
  if (!e.target.closest('#search-results') && !e.target.closest('.tb-search')) {
    document.getElementById('search-results').style.display = 'none';
  }
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
let _notifPanelOpen = false;

function toggleNotifPanel() {
  _notifPanelOpen = !_notifPanelOpen;
  document.getElementById('notif-panel').classList.toggle('open', _notifPanelOpen);
  if (_notifPanelOpen) loadNotifPanel();
}

async function loadNotifPanel() {
  const notifs = await API.get('/api/notifications');
  updateNotifBadge(notifs.length);
  const el = document.getElementById('notif-panel-list');
  if (!notifs.length) { el.innerHTML = `<div class="notif-empty"><i class="fa fa-bell-slash" style="font-size:2rem;opacity:.3;display:block;margin-bottom:8px"></i>No notifications</div>`; return; }
  el.innerHTML = notifs.map(n => `<div class="notif-item ${n.type}" id="notif-${n.id}">
    <button class="notif-dismiss" onclick="dismissNotification(${n.id})" title="Dismiss"><i class="fa fa-times"></i></button>
    <div class="notif-title">${n.title}</div>
    <div class="notif-msg">${n.message||''}</div>
    <div class="notif-time">${(n.createdAt||'').split('T')[0]}</div>
  </div>`).join('');
}

async function loadNotificationsSection() {
  const notifs = await API.get('/api/notifications');
  const el = document.getElementById('notif-section-list');
  if (!notifs.length) { el.innerHTML = `<div class="empty-state"><i class="fa fa-bell-slash"></i><h4>No notifications</h4><p>Click Refresh to check for new alerts</p></div>`; return; }
  el.innerHTML = notifs.map(n => `<div class="notif-item ${n.type}" style="margin-bottom:10px;border-radius:8px;background:var(--white)">
    <button class="notif-dismiss" onclick="dismissNotification(${n.id});loadNotificationsSection()" title="Dismiss"><i class="fa fa-times"></i></button>
    <div class="notif-title">${n.title}</div>
    <div class="notif-msg">${n.message||''}</div>
    <div class="notif-time" style="margin-top:6px">${(n.createdAt||'').split('T')[0]}</div>
    ${n.link?`<button class="btn btn-sm btn-outline" onclick="navigate('${n.link.replace('/','')}')" style="margin-top:8px">View</button>`:''}
  </div>`).join('');
}

function updateNotifBadge(count) {
  const badges = [document.getElementById('tb-notif-badge'), document.getElementById('sb-notif-badge')];
  badges.forEach(b => { if (!b) return; b.textContent = count; b.style.display = count > 0 ? 'flex' : 'none'; });
}

async function dismissNotification(id) {
  await API.post(`/api/notifications/${id}/dismiss`, {});
  document.getElementById(`notif-${id}`)?.remove();
  const r = await API.get('/api/notifications/count');
  updateNotifBadge(r.count);
}

async function dismissAllNotifications() {
  await API.post('/api/notifications/dismiss-all', {});
  toast('All notifications dismissed');
  updateNotifBadge(0);
  loadNotifPanel();
  loadNotificationsSection();
}

async function generateNotifications() {
  await API.post('/api/notifications/generate', {});
  loadNotifPanel();
  loadNotificationsSection();
  const r = await API.get('/api/notifications/count');
  updateNotifBadge(r.count);
  toast('Notifications refreshed');
}

// ─── ANALYTICS SETUP ─────────────────────────────────────────────────────────
function setupAnalytics() {
  const sel = document.getElementById('analytics-class');
  sel.innerHTML = '<option value="">-- Select Class --</option>' + _classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadAnalytics() {
  const classId = document.getElementById('analytics-class').value;
  if (!classId) return;
  const data = await API.get(`/api/analytics/class/${classId}`);
  const out = document.getElementById('analytics-output');
  if (!data.length) { out.innerHTML = `<div class="empty-state"><i class="fa fa-chart-bar"></i><h4>No assessment data</h4><p>Add assessments for this class to see analytics</p></div>`; return; }
  const cls = _classes.find(c => String(c.id) === classId);
  out.innerHTML = `<div class="card" style="margin-bottom:14px"><div class="card-body">
    <h4 style="margin-bottom:12px">${cls?cls.name:''} — Subject Performance</h4>
    <div style="overflow-x:auto"><canvas id="analytics-chart" height="300"></canvas></div></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">
    ${data.map(d=>`<div class="card card-body" style="text-align:center;margin:0">
      <div style="font-size:.78rem;font-weight:600;color:var(--muted);margin-bottom:8px">${d.subjectName}</div>
      <div style="font-size:1.4rem;font-weight:700;color:var(--blue)">${d.avg?Number(d.avg).toFixed(1):0}</div>
      <div style="font-size:.7rem;color:var(--muted)">Average</div>
      <div style="font-size:.75rem;margin-top:6px;display:flex;justify-content:space-between">
        <span style="color:var(--green)">↑ ${d.max||0}</span>
        <span>${d.cnt} students</span>
        <span style="color:var(--red)">↓ ${d.min||0}</span>
      </div></div>`).join('')}
    </div>`;
  // Draw chart
  const ctx = document.getElementById('analytics-chart');
  if (ctx && window.Chart) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.subjectName),
        datasets: [
          { label: 'Average', data: data.map(d => Number(d.avg||0).toFixed(1)), backgroundColor: '#3b82f6aa', borderColor: '#3b82f6', borderWidth: 2, borderRadius: 4 },
          { label: 'Highest', data: data.map(d => d.max||0), backgroundColor: '#22c55eaa', borderColor: '#22c55e', borderWidth: 2, borderRadius: 4 },
          { label: 'Lowest', data: data.map(d => d.min||0), backgroundColor: '#ef4444aa', borderColor: '#ef4444', borderWidth: 2, borderRadius: 4 }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }
    });
  }
}

// ─── CLASS LIST PRINT ────────────────────────────────────────────────────────
async function printClassList() {
  const classId = document.getElementById('filter-class').value;
  const classStudents = classId ? _students.filter(s => String(s.classId) === classId) : _students;
  const cls = classId ? _classes.find(c => String(c.id) === classId) : null;
  const w = window.open('', '_blank');
  const logo = _settings.logo ? `<img src="${_settings.logo}" style="max-width:80px;max-height:80px;object-fit:contain">` : `<div style="width:80px;height:80px;background:#3b82f6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem">★</div>`;
  w.document.write(`<!DOCTYPE html><html><head><title>Class List</title><style>
    body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px}
    .header{display:flex;align-items:center;gap:20px;border-bottom:3px solid #1e293b;padding-bottom:16px;margin-bottom:20px}
    .logo-area{flex-shrink:0}.school-name{font-size:1.4rem;font-weight:700;color:#1e293b}
    .motto{font-style:italic;color:#64748b;font-size:.9rem}.contact{margin-left:auto;text-align:right;font-size:.8rem;color:#64748b}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#1e293b;color:#fff;padding:8px;text-align:left}td{padding:6px 8px;border-bottom:1px solid #e2e8f0}
    tr:nth-child(even) td{background:#f8fafc}
    .signatures{display:flex;justify-content:space-between;margin-top:40px}
    .sig-line{border-top:1px solid #333;width:200px;text-align:center;padding-top:4px;font-size:11px}
    @media print{button{display:none}}
  </style></head><body>
  <div class="header">
    <div class="logo-area">${logo}</div>
    <div>
      <div class="school-name">${_settings.schoolName||'School'}</div>
      <div class="motto">${_settings.motto||''}</div>
      ${_settings.schoolRegNo?`<div style="font-size:.78rem;color:#64748b">Reg: ${_settings.schoolRegNo}</div>`:''}
    </div>
    <div class="contact">
      ${_settings.phone?`<div>${_settings.phone}</div>`:''}
      ${_settings.email?`<div>${_settings.email}</div>`:''}
      ${_settings.district?`<div>${_settings.district}, ${_settings.region||''}</div>`:''}
    </div>
  </div>
  <h3 style="margin-bottom:4px">${cls?cls.name:'All Students'} — Class List</h3>
  <p style="font-size:12px;color:#64748b;margin-bottom:12px">${_settings.currentTerm||'Term 1'} / ${_settings.academicYear||'2025'} &bull; Total: ${classStudents.length} students</p>
  <table><thead><tr><th>#</th><th>Admission No.</th><th>Full Name</th><th>Gender</th><th>Date of Birth</th><th>Parent/Guardian</th><th>Contact</th></tr></thead>
  <tbody>${classStudents.map((s,i)=>`<tr><td>${i+1}</td><td>${s.admNo}</td><td>${s.firstName} ${s.lastName} ${s.otherName||''}</td><td>${s.gender||'-'}</td><td>${s.dob||'-'}</td><td>${s.parent||'-'}</td><td>${s.contact||'-'}</td></tr>`).join('')}</tbody></table>
  <div class="signatures">
    <div class="sig-line">Class Teacher</div>
    <div class="sig-line">Head Teacher</div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:20px">
    ${logo}<div style="text-align:center;flex:1"><em>${_settings.motto||''}</em></div>${logo}
  </div>
  </body></html>`);
  w.print();
}

// ─── CHIME ───────────────────────────────────────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playChime(type = 'bell', volume = 0.6) {
  try {
    const ctx = getAudioCtx();
    const freqs = { bell: [880, 1100, 660], chime: [1047, 1319, 1568], ding: [1200, 1200], tone: [440, 550] };
    const tones = freqs[type] || freqs.bell;
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type === 'tone' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.25);
      gain.gain.setValueAtTime(parseFloat(volume) || 0.6, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 1.5);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 1.5);
    });
  } catch (e) { console.warn('Chime error:', e); }
}

function testChime() {
  playChime(document.getElementById('s-chimeSound')?.value || 'bell', document.getElementById('s-chimeVolume')?.value || 0.6);
}

// ─── SETUP WIZARD ────────────────────────────────────────────────────────────
let _wizStep = 0;
const wizSteps = [
  {
    title: 'School Information', sub: 'Step 1 of 4 — Basic school details',
    render: () => `
      <h3>School Information</h3>
      <div class="form-row">
        <div class="form-group"><label class="form-label">School Name *</label><input class="form-control" id="wiz-schoolName" value="${_settings.schoolName||''}"></div>
        <div class="form-group"><label class="form-label">School Motto</label><input class="form-control" id="wiz-motto" value="${_settings.motto||''}"></div>
      </div>
      <div class="form-row-3">
        <div class="form-group"><label class="form-label">Reg. Number</label><input class="form-control" id="wiz-schoolRegNo" value="${_settings.schoolRegNo||''}"></div>
        <div class="form-group"><label class="form-label">Region</label><input class="form-control" id="wiz-region" value="${_settings.region||''}"></div>
        <div class="form-group"><label class="form-label">District</label><input class="form-control" id="wiz-district" value="${_settings.district||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Address</label><input class="form-control" id="wiz-address" value="${_settings.address||''}"></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="wiz-phone" value="${_settings.phone||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="wiz-email" value="${_settings.email||''}"></div>
        <div class="form-group"><label class="form-label">P.O. Box</label><input class="form-control" id="wiz-poBox" value="${_settings.poBox||''}"></div>
      </div>`
  },
  {
    title: 'Academic Settings', sub: 'Step 2 of 4 — Academic year configuration',
    render: () => `
      <h3>Academic Settings</h3>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Current Term</label>
          <select class="form-control" id="wiz-currentTerm">
            ${['Term 1','Term 2','Term 3'].map(t=>`<option${_settings.currentTerm===t?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Academic Year</label><input class="form-control" id="wiz-academicYear" type="number" value="${_settings.academicYear||new Date().getFullYear()}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Currency Symbol</label><input class="form-control" id="wiz-currency" value="${_settings.currency||'₵'}"></div>
        <div class="form-group"><label class="form-label">Standard Fee Amount</label><input class="form-control" type="number" id="wiz-standardFee" value="${_settings.standardFee||'0'}"></div>
      </div>
      <div class="form-group"><label class="form-label">Admission Number Prefix</label><input class="form-control" id="wiz-admPrefix" value="${_settings.admPrefix||'STD'}" placeholder="e.g. STD, ADM"></div>`
  },
  {
    title: 'Administrator Details', sub: 'Step 3 of 4 — Set up your account',
    render: () => `
      <h3>Administrator Details</h3>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Administrator Name</label><input class="form-control" id="wiz-adminName" value="${_settings.adminName||''}"></div>
        <div class="form-group"><label class="form-label">Title / Role</label><input class="form-control" id="wiz-adminRole" value="${_settings.adminRole||'Headmaster'}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">School Logo <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">
          <div id="wiz-logo-preview-wrap" style="width:72px;height:72px;border-radius:10px;border:2px solid var(--border);background:var(--bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
            ${_currentLogoBase64 ? `<img src="${_currentLogoBase64}" style="width:100%;height:100%;object-fit:cover">` : `<i class="fa fa-graduation-cap" style="font-size:1.6rem;color:var(--muted);opacity:.4"></i>`}
          </div>
          <label style="flex:1;min-width:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed var(--border);border-radius:10px;padding:14px 10px;cursor:pointer;background:var(--bg);gap:4px;text-align:center"
            ondragover="event.preventDefault()" ondrop="handleWizLogoDrop(event)">
            <i class="fa fa-cloud-upload-alt" style="font-size:1.3rem;color:var(--blue);opacity:.7"></i>
            <span style="font-size:.8rem;font-weight:600">Drag &amp; drop or click to upload</span>
            <span style="font-size:.7rem;color:var(--muted)">PNG, JPG, SVG</span>
            <input type="file" id="wiz-logo-file" accept="image/*" style="display:none" onchange="handleWizLogoSelect(this)">
          </label>
        </div>
        <div id="wiz-logo-fname" style="font-size:.72rem;color:var(--muted);margin-top:5px;display:none"></div>
      </div>`
  },
  {
    title: "You're All Set!", sub: 'Step 4 of 4 — Setup complete',
    render: () => `
      <div style="text-align:center;padding:12px 0">
        <div style="font-size:3rem;margin-bottom:16px">🎉</div>
        <h3 style="margin-bottom:10px">Setup Complete!</h3>
        <p style="color:var(--muted);font-size:.88rem;line-height:1.65">Your school management system is ready. You can update any of these settings at any time from the <strong>Settings</strong> page.</p>
        <div style="background:var(--bg);border-radius:10px;padding:14px;margin-top:18px;text-align:left;font-size:.83rem;line-height:1.8">
          <div>🏫 <strong>${_settings.schoolName||'School'}</strong></div>
          <div>📅 Term ${_settings.currentTerm||'3'} · ${_settings.academicYear||'—'}</div>
          <div>💰 Standard Fee: ${_settings.currency||'GH¢'}${_settings.standardFee||'0'}</div>
        </div>
        <p style="color:var(--muted);font-size:.8rem;margin-top:14px">💡 Use the <strong>Billing</strong> section to generate and print student fee bills.</p>
      </div>`
  }
];

function openSetupWizard() { _wizStep = 0; renderWizardStep(); document.getElementById('setup-overlay').classList.add('active'); }
function closeSetupWizard() { document.getElementById('setup-overlay').classList.remove('active'); }

function renderWizardStep() {
  const step = wizSteps[_wizStep];
  document.getElementById('wiz-sub').textContent = step.sub;
  document.getElementById('wizard-body').innerHTML = step.render();
  for (let i = 0; i < wizSteps.length; i++) {
    const dot = document.getElementById(`wdot-${i}`);
    if (dot) dot.classList.toggle('done', i <= _wizStep);
  }
  document.getElementById('wiz-back-btn').style.visibility = _wizStep === 0 ? 'hidden' : 'visible';
  document.getElementById('wiz-next-btn').textContent = _wizStep === wizSteps.length - 1 ? '✓ Finish' : 'Next →';
}

function handleWizLogoDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) processWizLogoFile(file);
}
function handleWizLogoSelect(input) {
  const file = input.files[0];
  if (file) processWizLogoFile(file);
}
function processWizLogoFile(file) {
  if (!file.type.startsWith('image/')) { toast('Please select an image file', 'danger'); return; }
  if (file.size > 5 * 1024 * 1024) { toast('Image too large — use a file under 5 MB', 'warning'); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    _currentLogoBase64 = ev.target.result;
    const wrap = document.getElementById('wiz-logo-preview-wrap');
    if (wrap) wrap.innerHTML = `<img src="${_currentLogoBase64}" style="width:100%;height:100%;object-fit:cover">`;
    const fname = document.getElementById('wiz-logo-fname');
    if (fname) { fname.textContent = file.name; fname.style.display = 'block'; }
    // Also sync the main settings logo preview if open
    setLogoPreview(_currentLogoBase64, file.name);
    toast('Logo uploaded — click Next to continue', 'info');
  };
  reader.readAsDataURL(file);
}

async function wizNext() {
  const updates = {};
  const stepKeys = [
    ['schoolName','motto','address','phone','email','poBox','schoolRegNo','region','district'],
    ['currentTerm','academicYear','currency','standardFee','admPrefix'],
    ['adminName','adminRole'],
    ['billingAppUrl']
  ];
  stepKeys[_wizStep].forEach(k => { const el = document.getElementById(`wiz-${k}`); if (el) updates[k] = el.value; });
  // Save logo from the shared base64 variable on step 3
  if (_wizStep === 2) updates.logo = _currentLogoBase64;
  await API.put('/api/settings', updates);
  _settings = { ..._settings, ...updates };
  updateBranding();
  if (_wizStep < wizSteps.length - 1) { _wizStep++; renderWizardStep(); }
  else {
    await API.put('/api/settings', { setupComplete: '1' });
    closeSetupWizard();
    toast('Setup complete! Your school is ready.', 'success');
    loadDashboard();
  }
}

function wizBack() { if (_wizStep > 0) { _wizStep--; renderWizardStep(); } }

// ─── DATA EXPORT / RESET ─────────────────────────────────────────────────────
function exportData() { window.location.href = '/api/export'; }
async function resetData() {
  toast('Reset not implemented in demo mode', 'warning');
}

// ─── POPULATE DROPDOWNS ──────────────────────────────────────────────────────
function populateAllStudentDropdowns() {
  const opt = '<option value="">-- Select Student --</option>' + _students.map(s => `<option value="${s.id}">${s.firstName} ${s.lastName} (${s.admNo})</option>`).join('');
  ['a-studentId','f-studentId','cd-studentId','pr-studentId','sch-studentId'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = opt;
  });
}

// ─── INIT ────────────────────────────────────────────────────────────────────
async function init() {
  _settings = await API.get('/api/settings');
  updateBranding();
  // Preload core data
  [_teachers, _classes, _subjects, _students] = await Promise.all([
    API.get('/api/teachers'), API.get('/api/classes'), API.get('/api/subjects'), API.get('/api/students')
  ]);
  populateClassDropdowns();
  populateTeacherDropdowns();
  populateSubjectDropdowns();
  populateAllStudentDropdowns();
  // Load dashboard
  loadDashboard();
  // Generate notifications on load
  API.post('/api/notifications/generate', {}).then(() => {
    API.get('/api/notifications/count').then(r => updateNotifBadge(r.count));
  });
  // Setup wizard on first run
  if (!_settings.setupComplete || _settings.setupComplete === '0') {
    setTimeout(() => openSetupWizard(), 800);
  }
  // Chime scheduler (check every 60s)
  setInterval(checkChime, 60000);
}

// ─── CHIME SCHEDULER ─────────────────────────────────────────────────────────
let _lastChimePeriod = null;
async function checkChime() {
  if (_settings.chimeEnabled !== '1') return;
  try {
    const periods = await API.get('/api/timetable/periods');
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    for (const p of periods) {
      if (!p.isBreak && p.startTime === hm && _lastChimePeriod !== `${p.id}-${hm}`) {
        _lastChimePeriod = `${p.id}-${hm}`;
        playChime(_settings.chimeSound || 'bell', _settings.chimeVolume || 0.6);
        toast(`Period started: ${p.name}`, 'info');
        break;
      }
    }
  } catch (e) { /* ignore */ }
}

// ─── OPEN MODAL HELPERS ──────────────────────────────────────────────────────
function openMarkStaffAttendance() {
  document.getElementById('msa-date').value = new Date().toISOString().split('T')[0];
  const list = document.getElementById('staff-att-students');
  list.innerHTML = `<table style="width:100%"><thead><tr><th>Teacher</th><th>Present</th><th>Absent</th><th>Late</th></tr></thead><tbody>
    ${_teachers.map(t=>`<tr><td>${t.firstName} ${t.lastName}</td>
      ${['Present','Absent','Late'].map(st=>`<td><input type="radio" name="satt_${t.id}" value="${st}" ${st==='Present'?'checked':''}></td>`).join('')}
    </tr>`).join('')}</tbody></table>`;
  openModal('mark-staff-att-modal');
}

async function submitStaffAttendance() {
  const date = document.getElementById('msa-date').value;
  if (!date) { toast('Select a date', 'danger'); return; }
  const records = [];
  document.querySelectorAll('[name^="satt_"]').forEach(el => {
    if (el.checked) records.push({ teacherId: parseInt(el.name.split('_')[1]), date, status: el.value });
  });
  await API.post('/api/staff-attendance', records);
  toast(`Staff attendance marked for ${records.length} teachers`);
  closeModal('mark-staff-att-modal');
  loadStaffAttendance();
}

async function loadStaffAttendance() {
  const all = await API.get('/api/staff-attendance');
  const fd = document.getElementById('filter-staff-att-date').value;
  const list = fd ? all.filter(a => a.date === fd) : all;
  document.getElementById('staff-att-body').innerHTML = list.map(a => {
    const t = _teachers.find(x => x.id === a.teacherId);
    return `<tr><td>${a.date}</td><td>${t?`${t.firstName} ${t.lastName}`:'?'}</td>
      <td><span class="badge ${a.status==='Present'?'badge-green':a.status==='Absent'?'badge-red':'badge-amber'}">${a.status}</span></td>
      <td></td></tr>`;
  }).join('') || '<tr><td colspan="4"><div class="empty-state" style="padding:20px"><i class="fa fa-user-clock"></i><h4>No records</h4></div></td></tr>';
}

// Start
init();
