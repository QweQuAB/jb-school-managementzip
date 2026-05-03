// ─── modules.js — All New Management Modules ─────────────────────────────────

// ─── CALENDAR ────────────────────────────────────────────────────────────────
let _calYear = new Date().getFullYear(), _calMonth = new Date().getMonth();
let _calEvents = [], _editEventId = null;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EVENT_COLORS = { Holiday:'#ef4444', Exam:'#8b5cf6', Meeting:'#f59e0b', Sports:'#22c55e', 'Parents Day':'#3b82f6', 'Speech Day':'#f59e0b', Event:'#3b82f6', Other:'#64748b' };

async function loadCalendar() {
  _calEvents = await API.get('/api/calendar');
  renderCalendar();
  renderEventsTable();
  document.getElementById('ev-year').value = new Date().getFullYear();
}

function calPrev() { _calMonth--; if (_calMonth < 0) { _calMonth = 11; _calYear--; } renderCalendar(); }
function calNext() { _calMonth++; if (_calMonth > 11) { _calMonth = 0; _calYear++; } renderCalendar(); }

function renderCalendar() {
  document.getElementById('cal-month-label').textContent = `${MONTHS[_calMonth]} ${_calYear}`;
  const first = new Date(_calYear, _calMonth, 1).getDay();
  const days = new Date(_calYear, _calMonth + 1, 0).getDate();
  const today = new Date();
  let html = '';
  for (let i = 0; i < first; i++) html += `<div class="cal-day other-month"></div>`;
  for (let d = 1; d <= days; d++) {
    const dateStr = `${_calYear}-${String(_calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d === today.getDate() && _calMonth === today.getMonth() && _calYear === today.getFullYear();
    const dayEvents = _calEvents.filter(e => e.startDate === dateStr || (e.endDate && dateStr >= e.startDate && dateStr <= e.endDate));
    html += `<div class="cal-day${isToday?' today':''}" onclick="handleCalDayClick('${dateStr}')">
      <div class="cal-day-num">${d}</div>
      ${dayEvents.slice(0,3).map(e=>`<span class="cal-event-dot" style="background:${e.color||EVENT_COLORS[e.type]||'#3b82f6'}" onclick="showEventDetail(${e.id});event.stopPropagation()" title="${e.title}">${e.title}</span>`).join('')}
      ${dayEvents.length>3?`<span style="font-size:.62rem;color:var(--muted)">+${dayEvents.length-3} more</span>`:''}
    </div>`;
  }
  document.getElementById('cal-grid').innerHTML = html;
}

function handleCalDayClick(dateStr) {
  document.getElementById('ev-startDate').value = dateStr;
  document.getElementById('ev-endDate').value = dateStr;
  openModal('event-modal');
}

function renderEventsTable() {
  const sorted = [..._calEvents].sort((a,b)=>a.startDate.localeCompare(b.startDate));
  document.getElementById('events-body').innerHTML = sorted.map(e=>`<tr>
    <td style="font-weight:500;cursor:pointer;color:var(--blue)" onclick="showEventDetail(${e.id})">${e.title}</td>
    <td><span class="badge" style="background:${e.color||EVENT_COLORS[e.type]||'#3b82f6'}20;color:${e.color||EVENT_COLORS[e.type]||'#3b82f6'}">${e.type}</span></td>
    <td>${e.startDate}</td><td>${e.endDate||e.startDate}</td><td>${e.term||'-'}</td>
    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;font-size:.78rem">${e.description||'-'}</td>
    <td><button class="btn btn-sm btn-outline" onclick="editEvent(${e.id})"><i class="fa fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteEvent(${e.id})"><i class="fa fa-trash"></i></button></td>
  </tr>`).join('') || '<tr><td colspan="7"><div class="empty-state" style="padding:20px"><i class="fa fa-calendar-alt"></i><h4>No events yet</h4></div></td></tr>';
}

function showEventDetail(id) {
  const e = _calEvents.find(x => x.id === id);
  if (!e) return;
  document.getElementById('ev-detail-title').textContent = e.title;
  document.getElementById('ev-detail-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <div style="width:16px;height:16px;border-radius:3px;background:${e.color||'#3b82f6'}"></div>
      <span class="badge" style="background:${(e.color||'#3b82f6')}20;color:${e.color||'#3b82f6'}">${e.type}</span>
    </div>
    <div class="profile-row"><span>Start Date</span><strong>${e.startDate}</strong></div>
    <div class="profile-row"><span>End Date</span><strong>${e.endDate||e.startDate}</strong></div>
    ${e.term?`<div class="profile-row"><span>Term</span><strong>${e.term}</strong></div>`:''}
    ${e.year?`<div class="profile-row"><span>Year</span><strong>${e.year}</strong></div>`:''}
    ${e.description?`<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:8px;font-size:.85rem">${e.description}</div>`:''}`;
  document.getElementById('ev-detail-edit-btn').onclick = () => { closeModal('event-detail-modal'); editEvent(id); };
  openModal('event-detail-modal');
}

function editEvent(id) {
  const e = _calEvents.find(x => x.id === id);
  if (!e) return;
  _editEventId = id;
  document.getElementById('event-modal-title').textContent = 'Edit Event';
  document.getElementById('ev-title').value = e.title;
  document.getElementById('ev-type').value = e.type||'Event';
  document.getElementById('ev-term').value = e.term||'';
  document.getElementById('ev-startDate').value = e.startDate;
  document.getElementById('ev-endDate').value = e.endDate||'';
  document.getElementById('ev-color').value = e.color||'#3b82f6';
  document.getElementById('ev-year').value = e.year||new Date().getFullYear();
  document.getElementById('ev-description').value = e.description||'';
  openModal('event-modal', id);
}

async function saveEvent() {
  const d = {
    title: document.getElementById('ev-title').value.trim(),
    type: document.getElementById('ev-type').value,
    term: document.getElementById('ev-term').value,
    startDate: document.getElementById('ev-startDate').value,
    endDate: document.getElementById('ev-endDate').value,
    color: document.getElementById('ev-color').value,
    year: parseInt(document.getElementById('ev-year').value)||new Date().getFullYear(),
    description: document.getElementById('ev-description').value
  };
  if (!d.title || !d.startDate) { toast('Title and start date required', 'danger'); return; }
  if (_editEventId) { await API.put(`/api/calendar/${_editEventId}`, d); toast('Event updated'); _editEventId = null; }
  else { await API.post('/api/calendar', d); toast('Event added'); }
  closeModal('event-modal');
  loadCalendar();
}

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  await API.delete(`/api/calendar/${id}`);
  toast('Event deleted');
  loadCalendar();
}

// ─── CALENDAR BULK IMPORT ─────────────────────────────────────────────────────
const CAL_TEMPLATE = [
  {
    "title": "First Day of School",
    "type": "Event",
    "term": "Term 1",
    "startDate": "2025-09-01",
    "endDate": "2025-09-01",
    "year": 2025,
    "color": "#3b82f6",
    "description": "School reopens for Term 1"
  },
  {
    "title": "Independence Day Holiday",
    "type": "Holiday",
    "term": "Term 1",
    "startDate": "2025-03-06",
    "endDate": "2025-03-06",
    "year": 2025,
    "color": "#ef4444",
    "description": "National holiday - school closed"
  },
  {
    "title": "Mid-Term Examinations",
    "type": "Exam",
    "term": "Term 1",
    "startDate": "2025-10-06",
    "endDate": "2025-10-10",
    "year": 2025,
    "color": "#8b5cf6",
    "description": "Mid-term exams for all classes"
  },
  {
    "title": "Staff Meeting",
    "type": "Meeting",
    "term": "Term 1",
    "startDate": "2025-09-15",
    "endDate": "2025-09-15",
    "year": 2025,
    "color": "#f59e0b",
    "description": "Monthly staff meeting in the conference room"
  },
  {
    "title": "Speech and Prize-Giving Day",
    "type": "Speech Day",
    "term": "Term 3",
    "startDate": "2025-12-05",
    "endDate": "2025-12-05",
    "year": 2025,
    "color": "#f59e0b",
    "description": "Annual speech and prize-giving ceremony"
  },
  {
    "title": "Inter-School Sports",
    "type": "Sports",
    "term": "Term 2",
    "startDate": "2025-07-14",
    "endDate": "2025-07-15",
    "year": 2025,
    "color": "#22c55e",
    "description": "Annual inter-school sports competition"
  },
  {
    "title": "Parents Day",
    "type": "Parents Day",
    "term": "Term 2",
    "startDate": "2025-06-28",
    "endDate": "2025-06-28",
    "year": 2025,
    "color": "#3b82f6",
    "description": "Parents invited to collect report cards and meet teachers"
  },
  {
    "title": "End of Term 1",
    "type": "Event",
    "term": "Term 1",
    "startDate": "2025-12-12",
    "endDate": "2025-12-12",
    "year": 2025,
    "color": "#22c55e",
    "description": "Last day of Term 1"
  }
];

let _calImportData = [];

function openCalendarImport() {
  _calImportData = [];
  document.getElementById('cal-template-box').textContent = JSON.stringify(CAL_TEMPLATE, null, 2);
  document.getElementById('cal-import-preview').style.display = 'none';
  document.getElementById('cal-import-btn').style.display = 'none';
  document.getElementById('cal-import-file').value = '';
  openModal('cal-import-modal');
}

function copyCalendarTemplate() {
  navigator.clipboard.writeText(JSON.stringify(CAL_TEMPLATE, null, 2))
    .then(() => toast('Template copied to clipboard!'))
    .catch(() => toast('Copy failed — please select and copy manually', 'warning'));
}

function downloadCalendarTemplate() {
  const blob = new Blob([JSON.stringify(CAL_TEMPLATE, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'school_calendar_template.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Template downloaded!');
}

document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('cal-drop-zone');
  if (dz) dz.addEventListener('click', () => document.getElementById('cal-import-file').click());
});

function handleCalDrop(e) {
  e.preventDefault();
  document.getElementById('cal-drop-zone').style.background = '#fff';
  const file = e.dataTransfer.files[0];
  if (file) processCalImportFile(file);
}

function handleCalFileSelect(input) {
  const file = input.files[0];
  if (file) processCalImportFile(file);
}

function processCalImportFile(file) {
  if (!file.name.endsWith('.json')) {
    toast('Please upload a .json file', 'danger'); return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) { toast('JSON must be an array of events [ {...}, {...} ]', 'danger'); return; }
      _calImportData = data;
      showCalImportPreview(file.name, data);
    } catch(err) {
      toast('Invalid JSON file — check for syntax errors', 'danger');
    }
  };
  reader.readAsText(file);
}

function showCalImportPreview(filename, data) {
  const VALID_TYPES = ['Holiday','Exam','Meeting','Sports','Parents Day','Speech Day','Event','Other'];
  const errors = [];
  const valid = [];
  data.forEach((row, i) => {
    const rowErrors = [];
    if (!row.title || !String(row.title).trim()) rowErrors.push('missing title');
    if (!row.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(row.startDate)) rowErrors.push('startDate must be YYYY-MM-DD');
    if (row.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(row.endDate)) rowErrors.push('endDate must be YYYY-MM-DD');
    if (row.type && !VALID_TYPES.includes(row.type)) rowErrors.push(`unknown type "${row.type}"`);
    if (rowErrors.length) errors.push(`Row ${i+1} (${row.title||'?'}): ${rowErrors.join(', ')}`);
    else valid.push(row);
  });

  document.getElementById('cal-import-filename').textContent = filename;
  document.getElementById('cal-import-count').textContent = `${valid.length} valid event${valid.length!==1?'s':''}`;
  document.getElementById('cal-import-preview').style.display = 'block';

  const errBox = document.getElementById('cal-import-errors');
  if (errors.length) {
    errBox.style.display = 'block';
    errBox.innerHTML = `<div class="alert alert-warning" style="margin-bottom:10px"><i class="fa fa-exclamation-triangle"></i> <strong>${errors.length} row${errors.length>1?'s':''} skipped:</strong><ul style="margin:6px 0 0 18px;font-size:.78rem">${errors.map(e=>`<li>${e}</li>`).join('')}</ul></div>`;
  } else {
    errBox.style.display = 'none';
  }

  const tableWrap = document.getElementById('cal-import-table-wrap');
  if (valid.length === 0) {
    tableWrap.innerHTML = `<div class="empty-state" style="padding:20px"><i class="fa fa-exclamation-circle"></i><h4>No valid events found</h4><p>Check the field reference above and fix your file.</p></div>`;
    document.getElementById('cal-import-btn').style.display = 'none';
  } else {
    tableWrap.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:.78rem">
      <thead><tr>
        <th style="padding:8px 10px;text-align:left;background:#f8fafc;border-bottom:2px solid #e2e8f0;font-size:.72rem;color:#64748b">Title</th>
        <th style="padding:8px 10px;text-align:left;background:#f8fafc;border-bottom:2px solid #e2e8f0;font-size:.72rem;color:#64748b">Type</th>
        <th style="padding:8px 10px;text-align:left;background:#f8fafc;border-bottom:2px solid #e2e8f0;font-size:.72rem;color:#64748b">Start</th>
        <th style="padding:8px 10px;text-align:left;background:#f8fafc;border-bottom:2px solid #e2e8f0;font-size:.72rem;color:#64748b">End</th>
        <th style="padding:8px 10px;text-align:left;background:#f8fafc;border-bottom:2px solid #e2e8f0;font-size:.72rem;color:#64748b">Term</th>
      </tr></thead>
      <tbody>${valid.map((r,i)=>`<tr style="${i%2?'background:#f8fafc':''}">
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-weight:500">${r.title}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0"><span style="background:${EVENT_COLORS[r.type]||'#3b82f6'}20;color:${EVENT_COLORS[r.type]||'#3b82f6'};padding:2px 8px;border-radius:20px;font-size:.7rem;font-weight:600">${r.type||'Event'}</span></td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0">${r.startDate}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0">${r.endDate||r.startDate}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0">${r.term||'-'}</td>
      </tr>`).join('')}</tbody>
    </table>`;
    _calImportData = valid;
    document.getElementById('cal-import-btn').style.display = 'inline-flex';
  }
}

function clearCalImport() {
  _calImportData = [];
  document.getElementById('cal-import-preview').style.display = 'none';
  document.getElementById('cal-import-btn').style.display = 'none';
  document.getElementById('cal-import-file').value = '';
}

async function runCalendarImport() {
  if (!_calImportData.length) { toast('No events to import', 'warning'); return; }
  const btn = document.getElementById('cal-import-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Importing...';
  try {
    const res = await fetch('/api/calendar/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(_calImportData)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Import failed');
    closeModal('cal-import-modal');
    toast(`${result.imported} event${result.imported!==1?'s':''} imported successfully!`, 'success');
    loadCalendar();
  } catch(err) {
    toast(`Import failed: ${err.message}`, 'danger');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-file-import"></i> Import Events';
  }
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────
let _editExpenseId = null;
async function loadExpenses() {
  const all = await API.get('/api/expenses');
  const fc = document.getElementById('filter-expense-cat').value;
  const fm = document.getElementById('filter-expense-month').value;
  let list = all;
  if (fc) list = list.filter(e => e.category === fc);
  if (fm) list = list.filter(e => e.date && e.date.startsWith(fm));
  const cur = (typeof _settings !== 'undefined' ? _settings.currency : null) || '₵';
  document.getElementById('expenses-body').innerHTML = list.map(e=>`<tr>
    <td>${e.date}</td><td><span class="badge badge-blue">${e.category}</span></td>
    <td>${e.description||'-'}</td><td style="font-weight:600">${cur}${Number(e.amount).toFixed(2)}</td>
    <td>${e.approvedBy||'-'}</td>
    <td><button class="btn btn-sm btn-outline" onclick="editExpense(${e.id})"><i class="fa fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteExpense(${e.id})"><i class="fa fa-trash"></i></button></td>
  </tr>`).join('') || '<tr><td colspan="6"><div class="empty-state" style="padding:20px"><i class="fa fa-wallet"></i><h4>No expenses recorded</h4></div></td></tr>';
}

let _expenseSummaryVisible = false;
async function toggleExpenseSummary() {
  _expenseSummaryVisible = !_expenseSummaryVisible;
  const el = document.getElementById('expense-summary');
  if (!_expenseSummaryVisible) { el.style.display='none'; return; }
  el.style.display = 'block';
  await loadExpenseSummary();
}

async function loadExpenseSummary() {
  const summary = await API.get('/api/expenses/summary');
  const cur = (typeof _settings !== 'undefined' ? _settings.currency : null) || '₵';
  const el = document.getElementById('expense-summary');
  if (!el) return;
  el.innerHTML = `<div class="analytics-grid">
    <div class="card card-body" style="margin:0">
      <h4 style="margin-bottom:12px;font-size:.88rem">By Category</h4>
      ${summary.byCategory.map(c=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:.82rem"><span>${c.category}</span><strong>${cur}${Number(c.total).toFixed(2)}</strong></div>`).join('')}
    </div>
    <div class="card card-body" style="margin:0">
      <h4 style="margin-bottom:12px;font-size:.88rem">By Month</h4>
      ${summary.byMonth.map(m=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:.82rem"><span>${m.month}</span><strong>${cur}${Number(m.total).toFixed(2)}</strong></div>`).join('')}
      <div style="font-weight:700;font-size:.88rem;margin-top:8px;padding-top:8px;border-top:2px solid var(--border)">Total: ${cur}${Number(summary.totalSpend).toFixed(2)}</div>
    </div>
  </div>`;
}

function editExpense(id) {
  const modal = document.getElementById('expense-modal');
  _editExpenseId = id;
  toast('Expense editing: load data', 'info');
  API.get('/api/expenses').then(all => {
    const e = all.find(x => x.id === id);
    if (!e) return;
    document.getElementById('expense-modal-title').textContent = 'Edit Expense';
    document.getElementById('ex-category').value = e.category;
    document.getElementById('ex-amount').value = e.amount;
    document.getElementById('ex-date').value = e.date;
    document.getElementById('ex-approvedBy').value = e.approvedBy||'';
    document.getElementById('ex-description').value = e.description||'';
    modal.classList.add('active');
  });
}

async function saveExpense() {
  const d = {
    category: document.getElementById('ex-category').value,
    amount: parseFloat(document.getElementById('ex-amount').value)||0,
    date: document.getElementById('ex-date').value,
    approvedBy: document.getElementById('ex-approvedBy').value,
    description: document.getElementById('ex-description').value
  };
  if (!d.date || !d.amount) { toast('Date and amount required', 'danger'); return; }
  if (_editExpenseId) { await API.put(`/api/expenses/${_editExpenseId}`, d); toast('Expense updated'); _editExpenseId = null; }
  else { await API.post('/api/expenses', d); toast('Expense saved'); }
  closeModal('expense-modal');
  loadExpenses();
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  await API.delete(`/api/expenses/${id}`);
  toast('Expense deleted');
  loadExpenses();
}

// ─── INVENTORY ───────────────────────────────────────────────────────────────
let _editInventoryId = null;
async function loadInventory() {
  const all = await API.get('/api/inventory');
  const fc = document.getElementById('filter-inv-cat').value;
  const fs = document.getElementById('filter-inv-stock').value;
  let list = all;
  if (fc) list = list.filter(i => i.category === fc);
  if (fs === 'low') list = list.filter(i => i.quantity <= i.minStock);
  document.getElementById('inventory-body').innerHTML = list.map(i=>{
    const isLow = i.quantity <= i.minStock;
    const condColor = { Good:'badge-green', New:'badge-blue', Fair:'badge-amber', Poor:'badge-red' }[i.condition]||'badge-gray';
    return `<tr>
      <td style="font-weight:500">${i.name}</td><td>${i.category||'-'}</td>
      <td style="${isLow?'color:var(--red);font-weight:700':''}">${i.quantity}${isLow?` <span style="font-size:.7rem;color:var(--red)">(LOW)</span>`:''}</td>
      <td><span class="badge ${condColor}">${i.condition}</span></td>
      <td>${i.location||'-'}</td><td>${i.dateAcquired||'-'}</td><td>${i.minStock}</td>
      <td><button class="btn btn-sm btn-outline" onclick="editInventory(${i.id})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteInventory(${i.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8"><div class="empty-state" style="padding:20px"><i class="fa fa-boxes"></i><h4>No inventory items</h4></div></td></tr>';
}

function editInventory(id) {
  _editInventoryId = id;
  API.get('/api/inventory').then(all => {
    const i = all.find(x => x.id === id);
    if (!i) return;
    document.getElementById('inventory-modal-title').textContent = 'Edit Inventory Item';
    document.getElementById('inv-name').value = i.name;
    document.getElementById('inv-category').value = i.category||'';
    document.getElementById('inv-quantity').value = i.quantity;
    document.getElementById('inv-minStock').value = i.minStock;
    document.getElementById('inv-condition').value = i.condition||'Good';
    document.getElementById('inv-location').value = i.location||'';
    document.getElementById('inv-dateAcquired').value = i.dateAcquired||'';
    document.getElementById('inv-notes').value = i.notes||'';
    openModal('inventory-modal');
  });
}

async function saveInventory() {
  const d = {
    name: document.getElementById('inv-name').value.trim(),
    category: document.getElementById('inv-category').value,
    quantity: parseInt(document.getElementById('inv-quantity').value)||0,
    minStock: parseInt(document.getElementById('inv-minStock').value)||5,
    condition: document.getElementById('inv-condition').value,
    location: document.getElementById('inv-location').value,
    dateAcquired: document.getElementById('inv-dateAcquired').value,
    notes: document.getElementById('inv-notes').value
  };
  if (!d.name) { toast('Item name required', 'danger'); return; }
  if (_editInventoryId) { await API.put(`/api/inventory/${_editInventoryId}`, d); toast('Item updated'); _editInventoryId = null; }
  else { await API.post('/api/inventory', d); toast('Item added to inventory'); }
  closeModal('inventory-modal');
  loadInventory();
}

async function deleteInventory(id) {
  if (!confirm('Delete this inventory item?')) return;
  await API.delete(`/api/inventory/${id}`);
  toast('Item deleted');
  loadInventory();
}

// ─── SCHOLARSHIPS ────────────────────────────────────────────────────────────
let _editScholarshipId = null;
async function loadScholarships() {
  const all = await API.get('/api/scholarships');
  document.getElementById('scholarships-body').innerHTML = all.map(s => {
    const student = (typeof _students !== 'undefined' ? _students : []).find(x => x.id === s.studentId);
    const missing = !s.sponsorName || !s.scholarshipType;
    return `<tr>
      <td style="font-weight:500">${student?`${student.firstName} ${student.lastName}`:'?'}${missing?` <span title="Incomplete record" style="color:var(--red)"><i class="fa fa-exclamation-circle"></i></span>`:''}</td>
      <td>${s.scholarshipType||'<span style="color:var(--red)">Missing</span>'}</td>
      <td>${s.sponsorName||'<span style="color:var(--red)">Missing</span>'}</td>
      <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis">${s.benefits||'-'}</td>
      <td>${s.startDate||'-'}</td><td>${s.endDate||'-'}</td>
      <td><span class="badge ${s.status==='Active'?'badge-green':s.status==='Expired'?'badge-gray':'badge-red'}">${s.status}</span></td>
      <td><button class="btn btn-sm btn-outline" onclick="editScholarship(${s.id})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteScholarship(${s.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8"><div class="empty-state" style="padding:20px"><i class="fa fa-award"></i><h4>No scholarships recorded</h4></div></td></tr>';
}

function editScholarship(id) {
  _editScholarshipId = id;
  API.get('/api/scholarships').then(all => {
    const s = all.find(x => x.id === id);
    if (!s) return;
    document.getElementById('sch-modal-title').textContent = 'Edit Scholarship';
    document.getElementById('sch-studentId').value = s.studentId;
    document.getElementById('sch-type').value = s.scholarshipType||'';
    document.getElementById('sch-sponsor').value = s.sponsorName||'';
    document.getElementById('sch-status').value = s.status||'Active';
    document.getElementById('sch-startDate').value = s.startDate||'';
    document.getElementById('sch-endDate').value = s.endDate||'';
    document.getElementById('sch-benefits').value = s.benefits||'';
    document.getElementById('sch-notes').value = s.notes||'';
    openModal('scholarship-modal');
  });
}

async function saveScholarship() {
  const d = {
    studentId: parseInt(document.getElementById('sch-studentId').value),
    scholarshipType: document.getElementById('sch-type').value,
    sponsorName: document.getElementById('sch-sponsor').value,
    status: document.getElementById('sch-status').value,
    startDate: document.getElementById('sch-startDate').value,
    endDate: document.getElementById('sch-endDate').value,
    benefits: document.getElementById('sch-benefits').value,
    notes: document.getElementById('sch-notes').value
  };
  if (!d.studentId) { toast('Select a student', 'danger'); return; }
  if (_editScholarshipId) { await API.put(`/api/scholarships/${_editScholarshipId}`, d); toast('Scholarship updated'); _editScholarshipId = null; }
  else { await API.post('/api/scholarships', d); toast('Scholarship added'); }
  closeModal('scholarship-modal');
  loadScholarships();
}

async function deleteScholarship(id) {
  if (!confirm('Delete this scholarship record?')) return;
  await API.delete(`/api/scholarships/${id}`);
  toast('Scholarship deleted');
  loadScholarships();
}

// ─── PROMOTIONS ──────────────────────────────────────────────────────────────
async function loadPromotions() {
  const all = await API.get('/api/promotions');
  document.getElementById('promotions-body').innerHTML = all.map(p => {
    const s = (typeof _students !== 'undefined' ? _students : []).find(x => x.id === p.studentId);
    const fc = (typeof _classes !== 'undefined' ? _classes : []).find(x => x.id === p.fromClassId);
    const tc = (typeof _classes !== 'undefined' ? _classes : []).find(x => x.id === p.toClassId);
    return `<tr>
      <td>${s?`${s.firstName} ${s.lastName}`:'?'}</td>
      <td>${fc?fc.name:'-'}</td><td>${tc?tc.name:'-'}</td>
      <td><span class="badge ${p.action==='Promoted'?'badge-green':'badge-amber'}">${p.action}</span></td>
      <td style="max-width:180px">${p.reason||'-'}</td>
      <td>${p.term} / ${p.year}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deletePromotion(${p.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7"><div class="empty-state" style="padding:20px"><i class="fa fa-level-up-alt"></i><h4>No promotion records</h4></div></td></tr>';
}

async function savePromotion() {
  const d = {
    studentId: parseInt(document.getElementById('pr-studentId').value),
    fromClassId: parseInt(document.getElementById('pr-fromClass').value)||null,
    toClassId: parseInt(document.getElementById('pr-toClass').value)||null,
    action: document.getElementById('pr-action').value,
    term: document.getElementById('pr-term').value,
    year: parseInt((typeof _settings !== 'undefined' ? _settings.academicYear : null) || new Date().getFullYear()),
    reason: document.getElementById('pr-reason').value
  };
  if (!d.studentId) { toast('Select a student', 'danger'); return; }
  await API.post('/api/promotions', d);
  toast(`Student ${d.action} successfully`);
  closeModal('promotion-modal');
  loadPromotions();
}

async function deletePromotion(id) {
  if (!confirm('Delete this promotion record?')) return;
  await API.delete(`/api/promotions/${id}`);
  toast('Record deleted');
  loadPromotions();
}

// ─── CONDUCT LOG ─────────────────────────────────────────────────────────────
async function loadConduct() {
  const all = await API.get('/api/conduct');
  const fc = document.getElementById('filter-conduct-class').value;
  const fd = document.getElementById('filter-conduct-date').value;
  let list = all;
  if (fc) list = list.filter(c => String(c.classId) === fc);
  if (fd) list = list.filter(c => c.date === fd);
  document.getElementById('conduct-body').innerHTML = list.map(c => {
    const s = (typeof _students !== 'undefined' ? _students : []).find(x => x.id === c.studentId);
    const cls = (typeof _classes !== 'undefined' ? _classes : []).find(x => x.id === c.classId);
    return `<tr>
      <td>${c.date}</td>
      <td>${s?`${s.firstName} ${s.lastName}`:'?'}</td>
      <td>${cls?cls.name:'-'}</td>
      <td style="max-width:200px">${c.incident}</td>
      <td>${c.action||'-'}</td><td>${c.handledBy||'-'}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteConduct(${c.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7"><div class="empty-state" style="padding:20px"><i class="fa fa-exclamation-triangle"></i><h4>No conduct records</h4></div></td></tr>';
}

async function saveConduct() {
  const d = {
    studentId: parseInt(document.getElementById('cd-studentId').value),
    classId: null,
    date: document.getElementById('cd-date').value,
    incident: document.getElementById('cd-incident').value.trim(),
    action: document.getElementById('cd-action').value,
    handledBy: document.getElementById('cd-handledBy').value
  };
  // Auto-fill classId from student
  if (d.studentId && typeof _students !== 'undefined') {
    const s = _students.find(x => x.id === d.studentId);
    if (s) d.classId = s.classId;
  }
  if (!d.studentId || !d.incident || !d.date) { toast('Student, date, and incident are required', 'danger'); return; }
  await API.post('/api/conduct', d);
  toast('Conduct log entry saved');
  closeModal('conduct-modal');
  loadConduct();
}

async function deleteConduct(id) {
  if (!confirm('Delete this conduct record?')) return;
  await API.delete(`/api/conduct/${id}`);
  toast('Record deleted');
  loadConduct();
}

// ─── ASSIGNMENTS ─────────────────────────────────────────────────────────────
let _editAssignmentId = null;
async function loadAssignments() {
  const all = await API.get('/api/assignments');
  const fc = document.getElementById('filter-assign-class').value;
  const fs = document.getElementById('filter-assign-status').value;
  let list = all;
  if (fc) list = list.filter(a => String(a.classId) === fc);
  if (fs) list = list.filter(a => a.status === fs);
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('assignments-body').innerHTML = list.map(a => {
    const cls = (typeof _classes !== 'undefined' ? _classes : []).find(x => x.id === a.classId);
    const sub = (typeof _subjects !== 'undefined' ? _subjects : []).find(x => x.id === a.subjectId);
    const isOverdue = a.dueDate < today && a.status === 'Active';
    return `<tr>
      <td style="font-weight:500">${a.title}${isOverdue?` <span class="badge badge-red" style="font-size:.65rem">OVERDUE</span>`:''}</td>
      <td>${cls?cls.name:'-'}</td><td>${sub?sub.name:'-'}</td>
      <td>${a.dateAssigned||'-'}</td>
      <td style="${isOverdue?'color:var(--red);font-weight:600':''}">${a.dueDate}</td>
      <td><span class="badge ${a.status==='Active'?'badge-blue':'badge-green'}">${a.status}</span></td>
      <td><button class="btn btn-sm btn-outline" onclick="editAssignment(${a.id})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteAssignment(${a.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7"><div class="empty-state" style="padding:20px"><i class="fa fa-tasks"></i><h4>No assignments yet</h4></div></td></tr>';
}

function editAssignment(id) {
  _editAssignmentId = id;
  API.get('/api/assignments').then(all => {
    const a = all.find(x => x.id === id);
    if (!a) return;
    document.getElementById('assign-modal-title').textContent = 'Edit Assignment';
    document.getElementById('as-title').value = a.title;
    document.getElementById('as-classId').value = a.classId;
    document.getElementById('as-subjectId').value = a.subjectId||'';
    document.getElementById('as-dateAssigned').value = a.dateAssigned;
    document.getElementById('as-dueDate').value = a.dueDate;
    document.getElementById('as-status').value = a.status;
    document.getElementById('as-description').value = a.description||'';
    openModal('assignment-modal');
  });
}

async function saveAssignment() {
  const d = {
    title: document.getElementById('as-title').value.trim(),
    classId: parseInt(document.getElementById('as-classId').value),
    subjectId: parseInt(document.getElementById('as-subjectId').value)||null,
    dateAssigned: document.getElementById('as-dateAssigned').value,
    dueDate: document.getElementById('as-dueDate').value,
    status: document.getElementById('as-status').value,
    description: document.getElementById('as-description').value
  };
  if (!d.title || !d.classId || !d.dueDate) { toast('Title, class, and due date are required', 'danger'); return; }
  if (_editAssignmentId) { await API.put(`/api/assignments/${_editAssignmentId}`, d); toast('Assignment updated'); _editAssignmentId = null; }
  else { await API.post('/api/assignments', d); toast('Assignment added'); }
  closeModal('assignment-modal');
  loadAssignments();
}

async function deleteAssignment(id) {
  if (!confirm('Delete this assignment?')) return;
  await API.delete(`/api/assignments/${id}`);
  toast('Assignment deleted');
  loadAssignments();
}

// ─── LEAVE ───────────────────────────────────────────────────────────────────
let _editLeaveId = null;
async function loadLeave() {
  const all = await API.get('/api/leave');
  document.getElementById('leave-body').innerHTML = all.map(l => {
    const t = (typeof _teachers !== 'undefined' ? _teachers : []).find(x => x.id === l.teacherId);
    const days = Math.max(1, Math.round((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1);
    return `<tr>
      <td>${t?`${t.firstName} ${t.lastName}`:'?'}</td>
      <td><span class="badge badge-blue">${l.type}</span></td>
      <td>${l.startDate}</td><td>${l.endDate} <span style="font-size:.72rem;color:var(--muted)">(${days}d)</span></td>
      <td style="max-width:150px">${l.reason||'-'}</td>
      <td>
        <select class="form-control" style="font-size:.75rem;padding:4px 8px;width:120px" onchange="updateLeaveStatus(${l.id},this.value)">
          ${['Pending','Approved','Rejected'].map(s=>`<option${l.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteLeave(${l.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7"><div class="empty-state" style="padding:20px"><i class="fa fa-plane-departure"></i><h4>No leave requests</h4></div></td></tr>';
}

async function saveLeave() {
  const d = {
    teacherId: parseInt(document.getElementById('lv-teacherId').value),
    type: document.getElementById('lv-type').value,
    startDate: document.getElementById('lv-startDate').value,
    endDate: document.getElementById('lv-endDate').value,
    reason: document.getElementById('lv-reason').value
  };
  if (!d.teacherId || !d.startDate || !d.endDate) { toast('Teacher, start and end dates required', 'danger'); return; }
  await API.post('/api/leave', d);
  toast('Leave request submitted');
  closeModal('leave-modal');
  loadLeave();
}

async function updateLeaveStatus(id, status) {
  const all = await API.get('/api/leave');
  const l = all.find(x => x.id === id);
  if (!l) return;
  await API.put(`/api/leave/${id}`, { ...l, status, approvedBy: (typeof _settings !== 'undefined' ? _settings.adminName : '') || 'Admin' });
  toast(`Leave ${status.toLowerCase()}`);
  loadLeave();
}

async function deleteLeave(id) {
  if (!confirm('Delete this leave request?')) return;
  await API.delete(`/api/leave/${id}`);
  loadLeave();
}

// ─── PAYROLL ─────────────────────────────────────────────────────────────────
let _editPayrollId = null;
async function loadPayroll() {
  const all = await API.get('/api/payroll');
  const fm = document.getElementById('filter-payroll-month').value;
  const fy = document.getElementById('filter-payroll-year').value;
  let list = all;
  if (fm) list = list.filter(p => p.month === fm);
  if (fy) list = list.filter(p => String(p.year) === fy);
  const cur = (typeof _settings !== 'undefined' ? _settings.currency : null) || '₵';
  document.getElementById('payroll-body').innerHTML = list.map(p => {
    const t = (typeof _teachers !== 'undefined' ? _teachers : []).find(x => x.id === p.teacherId);
    return `<tr>
      <td>${t?`${t.firstName} ${t.lastName}`:'?'}</td>
      <td>${p.month} ${p.year}</td>
      <td>${cur}${Number(p.basicSalary).toFixed(2)}</td>
      <td>${cur}${Number(p.allowances).toFixed(2)}</td>
      <td style="color:var(--red)">${cur}${Number(p.deductions).toFixed(2)}</td>
      <td class="payroll-net">${cur}${Number(p.netPay).toFixed(2)}</td>
      <td><span class="badge ${p.status==='Paid'?'badge-green':'badge-amber'}">${p.status}</span></td>
      <td><button class="btn btn-sm btn-outline" onclick="editPayroll(${p.id})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deletePayroll(${p.id})"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8"><div class="empty-state" style="padding:20px"><i class="fa fa-money-check-alt"></i><h4>No payroll records</h4></div></td></tr>';
}

function editPayroll(id) {
  _editPayrollId = id;
  API.get('/api/payroll').then(all => {
    const p = all.find(x => x.id === id);
    if (!p) return;
    document.getElementById('payroll-modal-title').textContent = 'Edit Payroll Record';
    document.getElementById('py-teacherId').value = p.teacherId;
    document.getElementById('py-month').value = p.month;
    document.getElementById('py-year').value = p.year;
    document.getElementById('py-basic').value = p.basicSalary;
    document.getElementById('py-allowances').value = p.allowances;
    document.getElementById('py-deductions').value = p.deductions;
    document.getElementById('py-status').value = p.status;
    openModal('payroll-modal');
  });
}

async function savePayroll() {
  const d = {
    teacherId: parseInt(document.getElementById('py-teacherId').value),
    month: document.getElementById('py-month').value,
    year: parseInt(document.getElementById('py-year').value)||2025,
    basicSalary: parseFloat(document.getElementById('py-basic').value)||0,
    allowances: parseFloat(document.getElementById('py-allowances').value)||0,
    deductions: parseFloat(document.getElementById('py-deductions').value)||0,
    status: document.getElementById('py-status').value
  };
  if (!d.teacherId || !d.month) { toast('Teacher and month required', 'danger'); return; }
  let r;
  if (_editPayrollId) { r = await API.put(`/api/payroll/${_editPayrollId}`, d); toast('Payroll updated'); _editPayrollId = null; }
  else { r = await API.post('/api/payroll', d); toast(`Payroll saved – Net: ${(typeof _settings !== 'undefined'?_settings.currency:null)||'₵'}${Number(r.netPay||0).toFixed(2)}`); }
  closeModal('payroll-modal');
  loadPayroll();
}

async function deletePayroll(id) {
  if (!confirm('Delete this payroll record?')) return;
  await API.delete(`/api/payroll/${id}`);
  loadPayroll();
}

// ─── NOTICE BOARD ────────────────────────────────────────────────────────────
async function loadNotices() {
  const all = await API.get('/api/announcements');
  // Populate class filter in modal
  const classOpt = '<option value="">School-wide</option>' + (typeof _classes !== 'undefined' ? _classes : []).map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  const el = document.getElementById('n-classId');
  if (el) el.innerHTML = classOpt;
  const typeColors = { General:'blue', Academic:'purple', Event:'green', Emergency:'red' };
  const feed = document.getElementById('notices-feed');
  if (!all.length) { feed.innerHTML = `<div class="empty-state"><i class="fa fa-bullhorn"></i><h4>No announcements yet</h4><p>Post your first announcement using the button above</p></div>`; return; }
  feed.innerHTML = all.map(n => {
    const cls = (typeof _classes !== 'undefined' ? _classes : []).find(x => x.id === n.targetClassId);
    return `<div class="notice-card ${n.type.toLowerCase()}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="font-weight:700;font-size:.92rem">${n.title}</div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="badge badge-${typeColors[n.type]||'blue'}">${n.type}</span>
          <button class="btn btn-sm btn-danger" onclick="deleteNotice(${n.id})"><i class="fa fa-trash"></i></button>
        </div>
      </div>
      <div style="font-size:.82rem;color:var(--muted);margin-bottom:8px;line-height:1.5">${n.body}</div>
      <div style="font-size:.72rem;color:var(--muted);display:flex;gap:12px">
        <span><i class="fa fa-user"></i> ${n.author||'Admin'}</span>
        <span><i class="fa fa-calendar"></i> ${(n.datePosted||'').split('T')[0]}</span>
        ${cls?`<span><i class="fa fa-door-open"></i> ${cls.name}</span>`:``}
      </div>
    </div>`;
  }).join('');
}

async function saveNotice() {
  const d = {
    title: document.getElementById('n-title').value.trim(),
    body: document.getElementById('n-body').value.trim(),
    targetClassId: document.getElementById('n-classId').value||null,
    author: document.getElementById('n-author').value||'Admin',
    type: document.getElementById('n-type').value
  };
  if (!d.title || !d.body) { toast('Title and message required', 'danger'); return; }
  await API.post('/api/announcements', d);
  toast('Announcement posted');
  closeModal('notice-modal');
  loadNotices();
}

async function deleteNotice(id) {
  if (!confirm('Delete this announcement?')) return;
  await API.delete(`/api/announcements/${id}`);
  toast('Announcement deleted');
  loadNotices();
}

// ─── PETTY CASH ──────────────────────────────────────────────────────────────
async function loadPettyCash() {
  const all = await API.get('/api/petty-cash');
  const cur = (typeof _settings !== 'undefined' ? _settings.currency : null) || '₵';
  const balance = all.length ? all[0].balance : 0;
  document.getElementById('petty-balance-display').innerHTML = `
    <div class="petty-balance">
      <div class="label">Current Petty Cash Balance</div>
      <div class="amount">${cur}${Number(balance).toFixed(2)}</div>
    </div>`;
  document.getElementById('petty-cash-body').innerHTML = all.map(p=>`<tr>
    <td>${p.date}</td>
    <td><span class="badge ${p.type==='Credit'?'badge-green':'badge-red'}">${p.type}</span></td>
    <td>${p.purpose}</td>
    <td style="${p.type==='Debit'?'color:var(--red)':''}">${p.type==='Debit'?'-':'+'} ${cur}${Number(p.amount).toFixed(2)}</td>
    <td>${p.authorizedBy||'-'}</td>
    <td style="font-weight:600">${cur}${Number(p.balance).toFixed(2)}</td>
    <td><button class="btn btn-sm btn-danger" onclick="deletePettyCash(${p.id})"><i class="fa fa-trash"></i></button></td>
  </tr>`).join('') || '<tr><td colspan="7"><div class="empty-state" style="padding:20px"><i class="fa fa-coins"></i><h4>No petty cash entries</h4></div></td></tr>';
}

function openPettyCash(type) {
  document.getElementById('pc-modal-title').textContent = `Petty Cash — ${type}`;
  document.getElementById('pc-type').value = type;
  document.getElementById('pc-amount').value = '';
  document.getElementById('pc-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('pc-authorized').value = '';
  document.getElementById('pc-purpose').value = '';
  openModal('petty-cash-modal');
}

async function savePettyCash() {
  const d = {
    amount: parseFloat(document.getElementById('pc-amount').value)||0,
    purpose: document.getElementById('pc-purpose').value.trim(),
    date: document.getElementById('pc-date').value,
    authorizedBy: document.getElementById('pc-authorized').value,
    type: document.getElementById('pc-type').value
  };
  if (!d.amount || !d.purpose || !d.date) { toast('Amount, purpose, and date required', 'danger'); return; }
  await API.post('/api/petty-cash', d);
  toast('Petty cash entry saved');
  closeModal('petty-cash-modal');
  loadPettyCash();
}

async function deletePettyCash(id) {
  if (!confirm('Delete this entry?')) return;
  await API.delete(`/api/petty-cash/${id}`);
  toast('Entry deleted');
  loadPettyCash();
}
