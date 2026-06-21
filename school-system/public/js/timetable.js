// ================================================================
// TIMETABLE MODULE — rebuilt from scratch
// ================================================================
const TT = (function () {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  let tt = {
    periods: [],
    meta: {},        // teacherId -> meta object
    assignments: [], // { teacherId, classId, subjectId, periodsPerWeek }
    slots: [],       // generated timetable slots
  };

  // ── Helpers (uses global _teachers/_classes/_subjects/_settings) ───────────
  function tName(id) { const t = _teachers.find(x => x.id === id); return t ? `${t.firstName} ${t.lastName}` : '—'; }
  function cName(id) { const c = _classes.find(x => x.id === id); return c ? c.name : '—'; }
  function sName(id) { const s = _subjects.find(x => x.id === id); return s ? s.name : '—'; }

  // ── Entry point ────────────────────────────────────────────────────────────
  async function initTimetable() {
    renderShell();
    await loadData();
    renderPeriodsTab();
    renderTeachersTab();
    renderViewTab();
  }

  function renderShell() {
    const content = document.getElementById('timetable-content');
    if (!content) return;
    content.innerHTML = `
      <div class="tabs" style="margin-bottom:20px">
        <button class="tab-btn active" id="tab-tt-periods" onclick="switchTab('tt-tab-periods',this)"><i class="fas fa-clock"></i> School Periods</button>
        <button class="tab-btn" id="tab-tt-teachers" onclick="switchTab('tt-tab-teachers',this)"><i class="fas fa-chalkboard-teacher"></i> Teacher Setup</button>
        <button class="tab-btn" id="tab-tt-view" onclick="switchTab('tt-tab-view',this);TT.renderTimetableView()"><i class="fas fa-table"></i> View Timetable</button>
      </div>
      <div id="tt-tab-periods" class="tab-pane active"><div id="ttPeriodsContainer"></div></div>
      <div id="tt-tab-teachers" class="tab-pane"><div id="ttTeacherConfigList"></div></div>
      <div id="tt-tab-view" class="tab-pane">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px">
          <select id="ttViewMode" class="form-control" style="width:150px" onchange="TT.onViewModeChange(this.value)">
            <option value="class">By Class</option>
            <option value="teacher">By Teacher</option>
          </select>
          <select id="ttViewFilter" class="form-control" style="width:190px" onchange="TT.renderTimetableView()"></select>
          <button class="btn btn-primary" onclick="TT.generateAndSave()"><i class="fas fa-magic"></i> Generate</button>
          <button class="btn btn-outline" onclick="TT.renderTimetableView()"><i class="fas fa-sync"></i> Refresh</button>
          <button class="btn btn-secondary" onclick="TT.printAllClasses()" title="Print all class timetables in one go"><i class="fas fa-print"></i> Print All Classes</button>
          <button class="btn btn-secondary" onclick="TT.printAllTeachers()" title="Print all teacher schedules in one go"><i class="fas fa-print"></i> Print All Teachers</button>
          <button class="btn btn-outline" onclick="TT.openSnapshotsModal()" style="margin-left:auto" title="Save or restore timetable snapshots"><i class="fas fa-copy"></i> Copy to Term</button>
        </div>
        <div id="ttViewContainer"></div>
      </div>`;
  }

  async function loadData() {
    try {
      const [periods, config, slots] = await Promise.all([
        API.get('/api/timetable/periods'),
        API.get('/api/timetable/config'),
        API.get('/api/timetable/slots')
      ]);
      tt.periods = periods.map(p => ({
        ...p, id: parseInt(p.id), isBreak: !!p.isBreak, sortOrder: parseInt(p.sortOrder) || 0
      }));
      tt.meta = {};
      (config.meta || []).forEach(m => {
        tt.meta[parseInt(m.teacherId)] = {
          ...m,
          teacherId: parseInt(m.teacherId),
          classTeacherId: m.classTeacherId ? parseInt(m.classTeacherId) : null,
          availableDays: (m.availableDays || 'Mon,Tue,Wed,Thu,Fri').split(',').filter(Boolean),
          isClassTeacher: !!m.isClassTeacher,
          maxPeriodsPerDay: parseInt(m.maxPeriodsPerDay) || 6
        };
      });
      tt.assignments = (config.assignments || []).map(a => ({
        ...a,
        teacherId: parseInt(a.teacherId),
        classId: parseInt(a.classId),
        subjectId: parseInt(a.subjectId),
        periodsPerWeek: parseInt(a.periodsPerWeek) || 1
      }));
      tt.slots = (slots || [])
        .map(s => ({
          ...s,
          classId: parseInt(s.classId),
          periodId: parseInt(s.periodId),
          subjectId: s.subjectId ? parseInt(s.subjectId) : null,
          teacherId: s.teacherId ? parseInt(s.teacherId) : null
        }))
        // Drop any slots with invalid periodId (from old buggy saves before fix)
        .filter(s => !isNaN(s.periodId));
    } catch (e) { console.error('Timetable load error', e); }
  }

  // ── PERIODS TAB ────────────────────────────────────────────────────────────
  function renderPeriodsTab() {
    const c = document.getElementById('ttPeriodsContainer');
    if (!c) return;
    if (tt.periods.length === 0) {
      tt.periods = [
        { name: 'Period 1', startTime: '07:30', endTime: '08:15', isBreak: false, sortOrder: 0 },
        { name: 'Period 2', startTime: '08:15', endTime: '09:00', isBreak: false, sortOrder: 1 },
        { name: 'Period 3', startTime: '09:00', endTime: '09:45', isBreak: false, sortOrder: 2 },
        { name: 'Break',    startTime: '09:45', endTime: '10:05', isBreak: true,  sortOrder: 3 },
        { name: 'Period 4', startTime: '10:05', endTime: '10:50', isBreak: false, sortOrder: 4 },
        { name: 'Period 5', startTime: '10:50', endTime: '11:35', isBreak: false, sortOrder: 5 },
        { name: 'Period 6', startTime: '11:35', endTime: '12:20', isBreak: false, sortOrder: 6 },
        { name: 'Lunch',    startTime: '12:20', endTime: '13:00', isBreak: true,  sortOrder: 7 },
        { name: 'Period 7', startTime: '13:00', endTime: '13:45', isBreak: false, sortOrder: 8 },
        { name: 'Period 8', startTime: '13:45', endTime: '14:30', isBreak: false, sortOrder: 9 }
      ];
    }
    renderPeriodsTable();
  }

  function renderPeriodsTable() {
    const c = document.getElementById('ttPeriodsContainer');
    if (!c) return;
    c.innerHTML = `
      <div class="card card-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px">
          <div>
            <h4 style="margin:0 0 4px">School Day Periods</h4>
            <p style="margin:0;font-size:.78rem;color:var(--text-muted)">Define your school's daily schedule. Only non-break rows are used by the generator.</p>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary" onclick="TT.addPeriod()"><i class="fas fa-plus"></i> Add Row</button>
            <button class="btn btn-primary" onclick="TT.savePeriods()"><i class="fas fa-save"></i> Save Periods</button>
          </div>
        </div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th style="width:28px">#</th><th>Name</th><th>Start</th><th>End</th><th style="width:140px">Type</th><th style="width:36px"></th></tr></thead>
            <tbody>
              ${tt.periods.map((p, i) => `<tr style="${p.isBreak ? 'background:#fffbeb' : ''}">
                <td style="color:var(--text-muted);font-size:11px;text-align:center">${i + 1}</td>
                <td><input type="text" value="${escHtml(p.name)}" onchange="TT.updatePeriod(${i},'name',this.value)" style="width:100%;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;background:var(--white)"></td>
                <td><input type="time" value="${p.startTime}" onchange="TT.updatePeriod(${i},'startTime',this.value)" style="width:100%;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;background:var(--white)"></td>
                <td><input type="time" value="${p.endTime}" onchange="TT.updatePeriod(${i},'endTime',this.value)" style="width:100%;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;background:var(--white)"></td>
                <td>
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
                    <input type="checkbox" ${p.isBreak ? 'checked' : ''} onchange="TT.updatePeriod(${i},'isBreak',this.checked)" style="width:auto">
                    <span style="color:${p.isBreak ? 'var(--amber)' : 'var(--success)'}">${p.isBreak ? '☕ Break/Recess' : '📚 Teaching'}</span>
                  </label>
                </td>
                <td><button class="btn btn-danger btn-sm btn-icon" onclick="TT.removePeriod(${i})"><i class="fas fa-trash"></i></button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function updatePeriod(i, key, val) {
    tt.periods[i][key] = val;
    if (key === 'isBreak') renderPeriodsTable();
  }
  function addPeriod() {
    const n = tt.periods.filter(p => !p.isBreak).length + 1;
    tt.periods.push({ name: `Period ${n}`, startTime: '08:00', endTime: '08:45', isBreak: false, sortOrder: tt.periods.length });
    renderPeriodsTable();
  }
  function removePeriod(i) { tt.periods.splice(i, 1); renderPeriodsTable(); }
  async function savePeriods() {
    await API.post('/api/timetable/periods', tt.periods);
    const saved = await API.get('/api/timetable/periods');
    tt.periods = saved.map(p => ({ ...p, id: parseInt(p.id), isBreak: !!p.isBreak, sortOrder: parseInt(p.sortOrder) || 0 }));
    toast('School periods saved ✓', 'success');
  }

  // ── TEACHER SETUP TAB ──────────────────────────────────────────────────────
  function renderTeachersTab() {
    const c = document.getElementById('ttTeacherConfigList');
    if (!c) return;
    if (_teachers.length === 0) {
      c.innerHTML = `<div class="alert alert-info"><i class="fas fa-info-circle"></i> Add teachers in the <strong>Teachers</strong> section first, then return here to configure their timetable settings.</div>`;
      return;
    }

    const configured = _teachers.filter(t => tt.meta[t.id]);
    const unconfigured = _teachers.filter(t => !tt.meta[t.id]);

    c.innerHTML = `
      <div class="card card-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px">
          <div>
            <h4 style="margin:0 0 4px">Teacher Configuration</h4>
            <p style="margin:0;font-size:.78rem;color:var(--text-muted)">
              For each teacher, set their type (full-time/part-time), which days they're available, max periods per day, whether they're a class teacher, and which subjects they teach in which classes.
            </p>
          </div>
          <button class="btn btn-primary" onclick="TT.openTeacherModal()"><i class="fas fa-plus"></i> Configure Teacher</button>
        </div>

        ${unconfigured.length ? `<div class="alert alert-warning" style="margin-bottom:16px"><i class="fas fa-exclamation-triangle"></i> ${unconfigured.length} teacher(s) not yet configured: <strong>${unconfigured.map(t=>`${t.firstName} ${t.lastName}`).join(', ')}</strong></div>` : ''}

        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Teacher</th><th>Type</th><th>Available Days</th><th style="text-align:center">Max/Day</th>
              <th>Class Teacher Of</th><th>Subject Assignments</th><th style="width:80px"></th>
            </tr></thead>
            <tbody>
              ${_teachers.map(t => {
                const m = tt.meta[t.id];
                const ass = tt.assignments.filter(a => a.teacherId === t.id);
                return `<tr>
                  <td>
                    <div style="font-weight:600;font-size:.85rem">${escHtml(t.firstName)} ${escHtml(t.lastName)}</div>
                    <div style="font-size:.72rem;color:var(--text-muted)">${t.staffId || ''}</div>
                  </td>
                  <td>${m
                    ? `<span class="badge ${m.teacherType === 'Full-time' ? 'badge-success' : 'badge-warning'}">${m.teacherType}</span>`
                    : '<span class="badge badge-neutral">Not set</span>'}</td>
                  <td style="font-size:12px">${m ? (m.availableDays || []).join(', ') : '<span style="color:var(--text-muted)">All days</span>'}</td>
                  <td style="text-align:center;font-size:13px">${m ? m.maxPeriodsPerDay : '—'}</td>
                  <td>${m && m.isClassTeacher && m.classTeacherId
                    ? `<span class="badge badge-info">${cName(m.classTeacherId)}</span>`
                    : '<span style="color:var(--text-muted);font-size:12px">—</span>'}</td>
                  <td>
                    ${ass.length
                      ? ass.map(a => `<div style="font-size:11px;margin-bottom:3px;display:flex;gap:4px;align-items:center;flex-wrap:wrap">
                          <span class="badge badge-info" style="font-size:10px">${cName(a.classId)}</span>
                          <span>${sName(a.subjectId)}</span>
                          <span style="color:var(--text-muted)">${a.periodsPerWeek}×/wk</span>
                        </div>`).join('')
                      : '<span style="color:var(--text-muted);font-size:12px">No assignments</span>'}
                  </td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm btn-icon" onclick="TT.openTeacherModal(${t.id})" title="Configure"><i class="fas fa-cog"></i></button>
                    ${m ? `<button class="btn btn-danger btn-sm btn-icon" onclick="TT.deleteTeacherConfig(${t.id})" title="Remove"><i class="fas fa-trash"></i></button>` : ''}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:flex-end">
          <button class="btn btn-primary" style="font-size:.9rem;padding:10px 24px" onclick="TT.generateAndSave()">
            <i class="fas fa-magic"></i> Generate Timetable Now
          </button>
        </div>
      </div>`;
  }

  function openTeacherModal(teacherId = null) {
    const modal = document.getElementById('ttTeacherModal');
    if (!modal) return;

    const sel = document.getElementById('ttm-teacher');
    sel.innerHTML = '<option value="">-- Select Teacher --</option>' +
      _teachers.map(t => `<option value="${t.id}">${t.firstName} ${t.lastName} (${t.staffId || ''})</option>`).join('');

    const csel = document.getElementById('ttm-classTeacher');
    csel.innerHTML = '<option value="">-- Select Class --</option>' +
      _classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    document.getElementById('ttm-editId').value = '';
    sel.disabled = false;
    document.getElementById('ttm-type').value = 'Full-time';
    DAYS.forEach(d => { const cb = document.getElementById(`ttm-day-${d}`); if (cb) cb.checked = true; });
    document.getElementById('ttm-maxPeriods').value = 6;
    document.getElementById('ttm-isClassTeacher').checked = false;
    document.getElementById('ttm-classTeacherRow').style.display = 'none';
    document.getElementById('ttm-assignments').innerHTML = '';

    if (teacherId) {
      sel.value = teacherId;
      sel.disabled = true;
      document.getElementById('ttm-editId').value = teacherId;
      const m = tt.meta[teacherId];
      if (m) {
        document.getElementById('ttm-type').value = m.teacherType || 'Full-time';
        DAYS.forEach(d => {
          const cb = document.getElementById(`ttm-day-${d}`);
          if (cb) cb.checked = (m.availableDays || DAYS).includes(d);
        });
        document.getElementById('ttm-maxPeriods').value = m.maxPeriodsPerDay || 6;
        document.getElementById('ttm-isClassTeacher').checked = m.isClassTeacher;
        document.getElementById('ttm-classTeacherRow').style.display = m.isClassTeacher ? 'block' : 'none';
        if (m.classTeacherId) csel.value = m.classTeacherId;
      }
      tt.assignments.filter(a => a.teacherId === teacherId).forEach(a => addAssignmentRow(a));
    }
    openModal('ttTeacherModal');
  }

  function onClassTeacherToggle(cb) {
    document.getElementById('ttm-classTeacherRow').style.display = cb.checked ? 'block' : 'none';
  }

  function addAssignmentRow(prefill = null) {
    const list = document.getElementById('ttm-assignments');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'tt-asgn-row';
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 100px 36px;gap:8px;align-items:center;margin-bottom:8px';
    const cOpts = _classes.map(c => `<option value="${c.id}" ${prefill && prefill.classId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    const sOpts = _subjects.map(s => `<option value="${s.id}" ${prefill && prefill.subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
    row.innerHTML = `
      <select style="padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--white)"><option value="">Class…</option>${cOpts}</select>
      <select style="padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--white)"><option value="">Subject…</option>${sOpts}</select>
      <div style="position:relative">
        <input type="number" min="1" max="15" value="${prefill ? prefill.periodsPerWeek : 1}" title="Periods per week" style="width:100%;padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--white)">
        <span style="position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:9px;color:var(--text-muted);pointer-events:none">×/wk</span>
      </div>
      <button class="btn btn-danger btn-sm btn-icon" onclick="this.closest('.tt-asgn-row').remove()"><i class="fas fa-minus"></i></button>`;
    list.appendChild(row);
  }

  async function saveTeacherConfig() {
    const editId = parseInt(document.getElementById('ttm-editId').value) || 0;
    const teacherId = parseInt(document.getElementById('ttm-teacher').value) || editId;
    if (!teacherId) { toast('Please select a teacher', 'danger'); return; }

    const teacherType = document.getElementById('ttm-type').value;
    const availableDays = DAYS.filter(d => document.getElementById(`ttm-day-${d}`)?.checked);
    const maxPeriodsPerDay = parseInt(document.getElementById('ttm-maxPeriods').value) || 6;
    const isClassTeacher = document.getElementById('ttm-isClassTeacher').checked;
    const classTeacherId = isClassTeacher ? parseInt(document.getElementById('ttm-classTeacher').value) || null : null;

    const assignments = [];
    document.querySelectorAll('.tt-asgn-row').forEach(row => {
      const sels = row.querySelectorAll('select');
      const inp = row.querySelector('input[type="number"]');
      const classId = parseInt(sels[0]?.value);
      const subjectId = parseInt(sels[1]?.value);
      if (classId && subjectId) {
        assignments.push({ classId, subjectId, periodsPerWeek: parseInt(inp?.value) || 1 });
      }
    });

    const payload = { teacherId, teacherType, availableDays, maxPeriodsPerDay, isClassTeacher, classTeacherId, assignments };
    await API.post('/api/timetable/config', payload);

    tt.meta[teacherId] = { ...payload };
    tt.assignments = tt.assignments.filter(a => a.teacherId !== teacherId);
    assignments.forEach(a => tt.assignments.push({ ...a, teacherId }));

    closeModal('ttTeacherModal');
    renderTeachersTab();
    toast('Teacher configuration saved', 'success');
  }

  async function deleteTeacherConfig(teacherId) {
    if (!confirm('Remove timetable configuration for this teacher?')) return;
    await API.delete(`/api/timetable/config/${teacherId}`);
    delete tt.meta[teacherId];
    tt.assignments = tt.assignments.filter(a => a.teacherId !== teacherId);
    renderTeachersTab();
    toast('Configuration removed');
  }

  // ── GENERATOR ──────────────────────────────────────────────────────────────
  function generateTimetable() {
    const teachingPeriods = tt.periods.filter(p => !p.isBreak).sort((a, b) => a.sortOrder - b.sortOrder);
    if (teachingPeriods.length === 0) { toast('Set up school periods first (School Periods tab)', 'warning'); return null; }
    if (_classes.length === 0) { toast('No classes found', 'warning'); return null; }
    if (tt.assignments.length === 0) { toast('Configure teacher assignments first (Teacher Setup tab)', 'warning'); return null; }

    const targetClasses = _classes.map(c => c.id);

    // Build placement pool — one entry per required period-slot
    const pool = [];
    targetClasses.forEach(classId => {
      const classAssignments = tt.assignments.filter(a => a.classId === classId);
      classAssignments.forEach(a => {
        const meta = tt.meta[a.teacherId] || { teacherType: 'Full-time', availableDays: DAYS, maxPeriodsPerDay: 6 };
        // Full-time teachers are available every day
        const availDays = meta.teacherType === 'Full-time' ? DAYS : (meta.availableDays || DAYS);
        const capacity = availDays.length * (meta.maxPeriodsPerDay || 6);
        for (let i = 0; i < a.periodsPerWeek; i++) {
          pool.push({ classId, teacherId: a.teacherId, subjectId: a.subjectId, availDays, maxPerDay: meta.maxPeriodsPerDay || 6, capacity });
        }
      });
    });

    // Sort: most-constrained (lowest capacity) teachers first
    pool.sort((a, b) => a.capacity - b.capacity);

    const ATTEMPTS = 10;
    let bestSlots = null, bestConflicts = Infinity;

    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      // Shuffle within same-capacity tier for variety between attempts
      const shuffled = [...pool].sort((a, b) => {
        const d = a.capacity - b.capacity;
        return d !== 0 ? d : Math.random() - 0.5;
      });

      const slots = [];
      const classSlot   = new Set(); // `${classId}_${day}_${periodId}` → blocked
      const teacherSlot = new Set(); // `${teacherId}_${day}_${periodId}` → busy
      const teacherDay  = {};        // `${teacherId}_${day}` → count
      const subjectDay  = new Set(); // `${classId}_${subjectId}_${day}` → spread tracking
      let conflicts = 0;

      // Pre-fill break slots for all classes
      targetClasses.forEach(classId => {
        tt.periods.filter(p => p.isBreak).forEach(p => {
          DAYS.forEach(day => {
            slots.push({ classId, day, periodId: p.id, subjectId: null, teacherId: null, label: p.name });
            classSlot.add(`${classId}_${day}_${p.id}`);
          });
        });
      });

      shuffled.forEach(({ classId, teacherId, subjectId, availDays, maxPerDay }) => {
        let placed = false;

        // Phase 1 — teacher's available days, prefer days where this subject not yet placed
        const dayOrder = [...availDays].sort((a, b) => {
          const aUsed = subjectDay.has(`${classId}_${subjectId}_${a}`) ? 1 : 0;
          const bUsed = subjectDay.has(`${classId}_${subjectId}_${b}`) ? 1 : 0;
          return aUsed - bUsed + (Math.random() - 0.5) * 0.4;
        });

        outer1:
        for (const day of dayOrder) {
          const dcKey = `${teacherId}_${day}`;
          if ((teacherDay[dcKey] || 0) >= maxPerDay) continue;
          const pOrder = [...teachingPeriods].sort(() => Math.random() - 0.5);
          for (const p of pOrder) {
            const ck = `${classId}_${day}_${p.id}`;
            const tk = `${teacherId}_${day}_${p.id}`;
            if (!classSlot.has(ck) && !teacherSlot.has(tk)) {
              classSlot.add(ck); teacherSlot.add(tk);
              teacherDay[dcKey] = (teacherDay[dcKey] || 0) + 1;
              subjectDay.add(`${classId}_${subjectId}_${day}`);
              slots.push({ classId, day, periodId: p.id, subjectId, teacherId, label: '' });
              placed = true; break outer1;
            }
          }
        }

        // Phase 2 — relax to all days (teacher teaching outside their available days)
        if (!placed) {
          outer2:
          for (const day of DAYS) {
            const dcKey = `${teacherId}_${day}`;
            if ((teacherDay[dcKey] || 0) >= maxPerDay) continue;
            for (const p of teachingPeriods) {
              const ck = `${classId}_${day}_${p.id}`;
              const tk = `${teacherId}_${day}_${p.id}`;
              if (!classSlot.has(ck)) {
                classSlot.add(ck);
                const clash = teacherSlot.has(tk);
                if (!clash) teacherSlot.add(tk);
                else conflicts++;
                teacherDay[dcKey] = (teacherDay[dcKey] || 0) + 1;
                subjectDay.add(`${classId}_${subjectId}_${day}`);
                slots.push({ classId, day, periodId: p.id, subjectId, teacherId, label: clash ? '⚠' : '' });
                placed = true; break outer2;
              }
            }
          }
        }

        // Phase 3 — last resort: place anywhere regardless of teacher
        if (!placed) {
          for (const day of DAYS) {
            if (placed) break;
            for (const p of teachingPeriods) {
              const ck = `${classId}_${day}_${p.id}`;
              if (!classSlot.has(ck)) {
                classSlot.add(ck); conflicts++;
                slots.push({ classId, day, periodId: p.id, subjectId, teacherId, label: '⚠' });
                placed = true; break;
              }
            }
          }
        }
      });

      // Fill remaining teaching slots as Free
      targetClasses.forEach(classId => {
        DAYS.forEach(day => {
          teachingPeriods.forEach(p => {
            const ck = `${classId}_${day}_${p.id}`;
            if (!classSlot.has(ck)) slots.push({ classId, day, periodId: p.id, subjectId: null, teacherId: null, label: 'Free' });
          });
        });
      });

      if (conflicts < bestConflicts) {
        bestConflicts = conflicts;
        bestSlots = slots;
        if (conflicts === 0) break;
      }
    }

    if (bestConflicts > 0) {
      toast(`Generated with ${bestConflicts} conflict(s). Reduce periods/week or expand teacher availability to fix.`, 'warning');
    } else {
      toast('Timetable generated — zero conflicts!', 'success');
    }
    tt.slots = bestSlots;
    return bestSlots;
  }

  // Ensures all periods have real DB ids before the generator runs.
  // Without real ids, periodId is undefined → saved as NULL → loaded as NaN → nothing renders.
  async function ensurePeriodsHaveIds() {
    if (tt.periods.length === 0 || tt.periods.some(p => !p.id)) {
      await API.post('/api/timetable/periods', tt.periods);
      const saved = await API.get('/api/timetable/periods');
      tt.periods = saved.map(p => ({
        ...p, id: parseInt(p.id), isBreak: !!p.isBreak, sortOrder: parseInt(p.sortOrder) || 0
      }));
    }
  }

  async function generateAndSave() {
    toast('Generating timetable…', 'info');
    // Persist periods first so every slot gets a real integer periodId
    await ensurePeriodsHaveIds();
    const slots = generateTimetable();
    if (!slots) return;
    await API.post('/api/timetable/slots', slots);
    // Switch to view tab
    const viewTab = document.getElementById('tab-tt-view');
    if (viewTab) viewTab.click();
    renderTimetableView();
  }

  // ── VIEW TAB ───────────────────────────────────────────────────────────────
  function renderViewTab() {
    populateViewFilters();
    renderTimetableView();
  }

  function populateViewFilters() {
    const mode = document.getElementById('ttViewMode')?.value || 'class';
    const sel = document.getElementById('ttViewFilter');
    if (!sel) return;
    if (mode === 'class') {
      sel.innerHTML = _classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } else {
      sel.innerHTML = _teachers.map(t => `<option value="${t.id}">${t.firstName} ${t.lastName}</option>`).join('');
    }
  }

  function onViewModeChange(mode) {
    populateViewFilters();
    renderTimetableView();
  }

  function renderTimetableView() {
    const container = document.getElementById('ttViewContainer');
    if (!container) return;

    const mode = document.getElementById('ttViewMode')?.value || 'class';
    const filterSel = document.getElementById('ttViewFilter');
    // Save current selection BEFORE repopulating (innerHTML reset wipes the value)
    const savedFilter = filterSel?.value || '';

    if (tt.slots.length === 0) {
      populateViewFilters();
      container.innerHTML = `<div class="alert alert-info"><i class="fas fa-info-circle"></i> No timetable generated yet. Go to <strong>Teacher Setup</strong>, configure teachers, then click <strong>Generate Timetable Now</strong>.</div>`;
      return;
    }

    populateViewFilters();

    // Restore the user's filter selection after the dropdown was repopulated
    if (savedFilter && filterSel) {
      filterSel.value = savedFilter;
      // Only keep restored value if it's a valid option
      if (!filterSel.value) filterSel.value = filterSel.options[0]?.value || '';
    }

    const filterVal = filterSel?.value || '';
    if (mode === 'class') {
      renderClassView(filterVal ? parseInt(filterVal) : _classes[0]?.id, container);
    } else {
      renderTeacherView(filterVal ? parseInt(filterVal) : _teachers[0]?.id, container);
    }
  }

  function renderClassView(classId, container) {
    const cls = _classes.find(c => c.id === classId);
    if (!cls) { container.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Select a class above.</div>'; return; }
    const periods = [...tt.periods].sort((a, b) => a.sortOrder - b.sortOrder);
    const cSlots = tt.slots.filter(s => s.classId === classId);
    const clashes = cSlots.filter(s => s.label === '⚠').length;

    let html = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <h3 style="margin:0 0 3px;font-size:15px;font-weight:700">${cls.name} — Weekly Timetable</h3>
          ${clashes
            ? `<div style="font-size:12px;color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> ${clashes} clash(es) detected — adjust teacher settings and regenerate</div>`
            : `<div style="font-size:12px;color:var(--success)"><i class="fas fa-check-circle"></i> No clashes</div>`}
        </div>
        <button class="btn btn-secondary" onclick="TT.printClassTimetable(${classId})"><i class="fas fa-print"></i> Print</button>
      </div>
      <div class="table-wrapper">
        <table style="min-width:640px">
          <thead><tr>
            <th style="width:105px;background:var(--primary);color:#fff">Period</th>
            ${DAYS.map(d => `<th style="background:var(--primary);color:#fff;text-align:center">${d}</th>`).join('')}
          </tr></thead>
          <tbody>`;

    periods.forEach(p => {
      html += `<tr style="${p.isBreak ? 'background:#fffbeb' : ''}">
        <td style="font-size:11px;padding:6px 10px;white-space:nowrap">
          <div style="font-weight:700;color:${p.isBreak ? 'var(--amber)' : 'var(--text)'}">${p.name}</div>
          <div style="color:var(--text-muted)">${p.startTime}–${p.endTime}</div>
        </td>`;
      DAYS.forEach(day => {
        const slot = cSlots.find(s => s.day === day && s.periodId === p.id);
        if (!slot) { html += `<td style="text-align:center;color:var(--text-muted);font-size:11px">—</td>`; return; }
        if (p.isBreak || slot.label === p.name) {
          html += `<td style="background:#fef3c7;text-align:center"><span style="font-size:11px;color:var(--amber);font-style:italic">${p.name}</span></td>`;
          return;
        }
        const isClash = slot.label === '⚠';
        const isFree = slot.label === 'Free' || (!slot.subjectId && !isClash);
        if (isFree) {
          html += `<td style="text-align:center"><span style="font-size:11px;color:var(--text-muted)">Free</span></td>`;
        } else {
          html += `<td style="text-align:center;padding:6px${isClash ? ';outline:2px solid var(--danger);outline-offset:-2px' : ''}">
            <div style="font-weight:700;font-size:12px;color:${isClash ? 'var(--danger)' : 'var(--primary)'}">${sName(slot.subjectId)}</div>
            ${slot.teacherId ? `<div style="font-size:10px;color:var(--text-muted);margin-top:1px">${tName(slot.teacherId)}</div>` : ''}
            ${isClash ? `<div style="font-size:10px;color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> Clash</div>` : ''}
          </td>`;
        }
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }

  function renderTeacherView(teacherId, container) {
    const teacher = _teachers.find(t => t.id === teacherId);
    if (!teacher) { container.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Select a teacher above.</div>'; return; }
    const meta = tt.meta[teacherId];
    const periods = [...tt.periods].sort((a, b) => a.sortOrder - b.sortOrder);
    const tSlots = tt.slots.filter(s => s.teacherId === teacherId);

    const totalPeriods = tSlots.filter(s => !tt.periods.find(p => p.id === s.periodId && p.isBreak) && s.label !== 'Free').length;

    let html = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <h3 style="font-size:15px;font-weight:700;margin:0 0 3px">${teacher.firstName} ${teacher.lastName} — Weekly Schedule</h3>
          <div style="font-size:12px;color:var(--text-muted)">
            ${meta
              ? `${meta.teacherType} · Available: ${(meta.availableDays || DAYS).join(', ')} · Max ${meta.maxPeriodsPerDay}/day · ${totalPeriods} teaching period(s) this week`
              : `Full-time · ${totalPeriods} teaching period(s) this week`}
          </div>
        </div>
        <button class="btn btn-secondary" onclick="TT.printTeacherTimetable(${teacherId})"><i class="fas fa-print"></i> Print</button>
      </div>
      <div class="table-wrapper">
        <table style="min-width:640px">
          <thead><tr>
            <th style="width:105px;background:var(--primary);color:#fff">Period</th>
            ${DAYS.map(d => {
              const avail = !meta || meta.teacherType === 'Full-time' || (meta.availableDays || DAYS).includes(d);
              return `<th style="background:${avail ? 'var(--primary)' : '#94a3b8'};color:#fff;text-align:center">
                ${d}${avail ? '' : '<br><span style="font-size:9px;font-weight:400;opacity:.8">Not in</span>'}
              </th>`;
            }).join('')}
          </tr></thead>
          <tbody>`;

    periods.forEach(p => {
      html += `<tr style="${p.isBreak ? 'background:#fffbeb' : ''}">
        <td style="font-size:11px;padding:6px 10px;white-space:nowrap">
          <div style="font-weight:700;color:${p.isBreak ? 'var(--amber)' : 'var(--text)'}">${p.name}</div>
          <div style="color:var(--text-muted)">${p.startTime}–${p.endTime}</div>
        </td>`;
      DAYS.forEach(day => {
        if (p.isBreak) { html += `<td style="background:#fef3c7;text-align:center"><span style="font-size:11px;color:var(--amber);font-style:italic">${p.name}</span></td>`; return; }
        const avail = !meta || meta.teacherType === 'Full-time' || (meta.availableDays || DAYS).includes(day);
        const slot = tSlots.find(s => s.day === day && s.periodId === p.id);
        if (!slot) {
          html += `<td style="text-align:center;font-size:11px;color:var(--text-muted);background:${avail ? '' : '#f8fafc'}">
            ${avail ? 'Free' : '<span style="opacity:.5">—</span>'}
          </td>`;
          return;
        }
        const isClash = slot.label === '⚠';
        html += `<td style="text-align:center;padding:6px${isClash ? ';outline:2px solid var(--danger);outline-offset:-2px' : ''}">
          <div style="font-weight:700;font-size:12px;color:${isClash ? 'var(--danger)' : 'var(--primary)'}">${sName(slot.subjectId)}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:1px">${cName(slot.classId)}</div>
          ${isClash ? `<div style="font-size:10px;color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> Clash</div>` : ''}
        </td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }

  // ── PRINT ──────────────────────────────────────────────────────────────────
  function printClassTimetable(classId) {
    const cls = _classes.find(c => c.id === classId); if (!cls) return;
    const s = _settings;
    const cSlots = tt.slots.filter(sl => sl.classId === classId);
    const periods = [...tt.periods].sort((a, b) => a.sortOrder - b.sortOrder);
    const logoHtml = s.logo
      ? `<img src="${s.logo}" style="max-height:60px;object-fit:contain">`
      : '<div style="width:60px;height:60px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px">🏫</div>';

    let rows = '';
    periods.forEach(p => {
      rows += `<tr style="${p.isBreak ? 'background:#fef9c3' : ''}">
        <td style="font-weight:700;font-size:11px;white-space:nowrap">${p.name}<br><span style="font-weight:400;color:#64748b">${p.startTime}–${p.endTime}</span></td>`;
      DAYS.forEach(day => {
        const slot = cSlots.find(sl => sl.day === day && sl.periodId === p.id);
        if (!slot) { rows += `<td>—</td>`; return; }
        if (p.isBreak || slot.label === p.name) { rows += `<td style="text-align:center;color:#92400e;font-style:italic">${p.name}</td>`; return; }
        const isFree = slot.label === 'Free' || (!slot.subjectId && slot.label !== '⚠');
        const isClash = slot.label === '⚠';
        const sub = slot.subjectId ? sName(slot.subjectId) : 'Free';
        const tch = slot.teacherId ? tName(slot.teacherId) : '';
        rows += `<td style="text-align:center">
          <strong style="font-size:11px;color:${isClash ? '#ef4444' : isFree ? '#94a3b8' : '#1d4ed8'}">${sub}</strong>
          ${tch && !isFree ? `<br><span style="font-size:10px;color:#64748b">${tch}</span>` : ''}
          ${isClash ? `<br><span style="font-size:9px;color:#ef4444">⚠ Clash</span>` : ''}
        </td>`;
      });
      rows += `</tr>`;
    });

    const win = window.open('', '_blank', 'width=1000,height=700');
    win.document.write(`<!DOCTYPE html><html><head><title>Timetable — ${cls.name}</title>
    <style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:20px;font-size:13px}
      .hdr{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:16px}
      h2{text-align:center;font-size:14px;margin:0 0 4px}
      table{width:100%;border-collapse:collapse}
      th{background:#1d4ed8;color:#fff;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
      td{padding:7px 8px;border:1px solid #e2e8f0;vertical-align:middle}
      .ftr{margin-top:24px;display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #e2e8f0}
      @media print{.no-print{display:none!important}}
    </style></head><body>
    <div class="hdr">
      <div style="display:flex;align-items:center;gap:12px">${logoHtml}<div>
        <div style="font-size:17px;font-weight:700;color:#1d4ed8">${s.schoolName || 'School'}</div>
        <div style="font-style:italic;color:#3b82f6;font-size:11px">"${s.motto || 'Excellence in Education'}"</div>
      </div></div>
      <div style="text-align:right;font-size:11px;color:#64748b">${s.address || ''}${s.city ? ', ' + s.city : ''}<br>${s.phone || ''}<br>${s.email || ''}</div>
    </div>
    <h2>CLASS TIMETABLE — ${cls.name}</h2>
    <p style="text-align:center;font-size:11px;color:#64748b;margin:0 0 12px">${s.currentTerm || 'Term 1'} ${s.academicYear || 2025} &nbsp;|&nbsp; Class Teacher: <strong>${cls.teacherId ? tName(cls.teacherId) : '—'}</strong></p>
    <table><thead><tr><th>Period</th>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="ftr">
      <div style="display:flex;align-items:center;gap:10px">${logoHtml}
        <div><div style="font-weight:700;font-size:11px;color:#1d4ed8">${s.schoolName || ''}</div>
        <div style="font-size:10px;color:#94a3b8;font-style:italic">"${s.motto || ''}"</div></div>
      </div>
      <div style="display:flex;gap:32px;font-size:11px">
        <div style="text-align:center"><div style="width:100px;border-bottom:1px solid #1e293b;margin-bottom:3px"></div>Class Teacher</div>
        <div style="text-align:center"><div style="width:100px;border-bottom:1px solid #1e293b;margin-bottom:3px"></div>${s.adminRole || 'Head Teacher'}</div>
      </div>
    </div>
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`);
    win.document.close();
  }

  // ── TEACHER PRINT ──────────────────────────────────────────────────────────
  function buildTeacherTimetableHTML(teacherId) {
    const teacher = _teachers.find(t => t.id === teacherId); if (!teacher) return '';
    const meta = tt.meta[teacherId];
    const periods = [...tt.periods].sort((a, b) => a.sortOrder - b.sortOrder);
    const tSlots = tt.slots.filter(s => s.teacherId === teacherId);
    const s = _settings;
    let rows = '';
    periods.forEach(p => {
      rows += `<tr style="${p.isBreak ? 'background:#fef9c3' : ''}">
        <td style="font-weight:700;font-size:11px;white-space:nowrap">${p.name}<br><span style="font-weight:400;color:#64748b">${p.startTime}–${p.endTime}</span></td>`;
      DAYS.forEach(day => {
        if (p.isBreak) { rows += `<td style="text-align:center;color:#92400e;font-style:italic">${p.name}</td>`; return; }
        const avail = !meta || meta.teacherType === 'Full-time' || (meta.availableDays || DAYS).includes(day);
        const slot = tSlots.find(sl => sl.day === day && sl.periodId === p.id);
        if (!slot) {
          rows += `<td style="text-align:center;color:#94a3b8;font-size:10px;${avail?'':'background:#f1f5f9'}">
            ${avail ? '—' : '<span style="opacity:.5">N/A</span>'}
          </td>`;
          return;
        }
        const isClash = slot.label === '⚠';
        rows += `<td style="text-align:center">
          <strong style="font-size:11px;color:${isClash ? '#ef4444' : '#1d4ed8'}">${sName(slot.subjectId)}</strong>
          <br><span style="font-size:10px;color:#64748b">${cName(slot.classId)}</span>
          ${isClash ? `<br><span style="font-size:9px;color:#ef4444">⚠ Clash</span>` : ''}
        </td>`;
      });
      rows += `</tr>`;
    });
    const totalPeriods = tSlots.filter(sl => !tt.periods.find(p => p.id === sl.periodId && p.isBreak) && sl.label !== 'Free').length;
    return { teacher, meta, rows, totalPeriods, s };
  }

  function printTeacherTimetable(teacherId) {
    const { teacher, meta, rows, totalPeriods, s } = buildTeacherTimetableHTML(teacherId);
    const logoHtml = s.logo
      ? `<img src="${s.logo}" style="max-height:60px;object-fit:contain">`
      : '<div style="width:60px;height:60px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px">🏫</div>';
    const win = window.open('', '_blank', 'width=1000,height=700');
    win.document.write(buildPrintWindow(`${teacher.firstName} ${teacher.lastName}`, _buildTeacherPage({ teacher, meta, rows, totalPeriods, s, logoHtml }), s));
    win.document.close();
  }

  function _buildTeacherPage({ teacher, meta, rows, totalPeriods, s, logoHtml }) {
    const availInfo = meta ? `${meta.teacherType} · Available: ${(meta.availableDays || DAYS).join(', ')} · Max ${meta.maxPeriodsPerDay}/day · ${totalPeriods} period(s)/week`
      : `Full-time · ${totalPeriods} period(s)/week`;
    return `
    <div class="hdr">
      <div style="display:flex;align-items:center;gap:12px">${logoHtml}<div>
        <div style="font-size:17px;font-weight:700;color:#1d4ed8">${s.schoolName || 'School'}</div>
        <div style="font-style:italic;color:#3b82f6;font-size:11px">"${s.motto || 'Excellence in Education'}"</div>
      </div></div>
      <div style="text-align:right;font-size:11px;color:#64748b">${s.address || ''}${s.city ? ', ' + s.city : ''}<br>${s.phone || ''}<br>${s.email || ''}</div>
    </div>
    <h2>TEACHER SCHEDULE — ${teacher.firstName} ${teacher.lastName}</h2>
    <p style="text-align:center;font-size:11px;color:#64748b;margin:0 0 12px">${s.currentTerm || 'Term 1'} ${s.academicYear || 2025} &nbsp;|&nbsp; ${availInfo}</p>
    <table><thead><tr><th>Period</th>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="ftr">
      <div style="display:flex;align-items:center;gap:10px">${logoHtml}
        <div><div style="font-weight:700;font-size:11px;color:#1d4ed8">${s.schoolName || ''}</div>
        <div style="font-size:10px;color:#94a3b8;font-style:italic">"${s.motto || ''}"</div></div>
      </div>
      <div style="display:flex;gap:32px;font-size:11px">
        <div style="text-align:center"><div style="width:100px;border-bottom:1px solid #1e293b;margin-bottom:3px"></div>Teacher</div>
        <div style="text-align:center"><div style="width:100px;border-bottom:1px solid #1e293b;margin-bottom:3px"></div>${s.adminRole || 'Head Teacher'}</div>
      </div>
    </div>`;
  }

  function buildPrintWindow(title, body, s) {
    return `<!DOCTYPE html><html><head><title>Timetable — ${title}</title>
    <style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:20px;font-size:13px}
      .hdr{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:16px}
      h2{text-align:center;font-size:14px;margin:0 0 4px}
      table{width:100%;border-collapse:collapse}
      th{background:#1d4ed8;color:#fff;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
      td{padding:7px 8px;border:1px solid #e2e8f0;vertical-align:middle}
      .ftr{margin-top:24px;display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #e2e8f0}
      .page-break{page-break-after:always;break-after:page}
      @media print{.no-print{display:none!important}@page{size:A4 landscape;margin:10mm}}
    </style></head><body>${body}
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`;
  }

  function printAllClasses() {
    if (!_classes.length) { toast && toast('No classes found', 'warning'); return; }
    const s = _settings;
    const logoHtml = s.logo
      ? `<img src="${s.logo}" style="max-height:60px;object-fit:contain">`
      : '<div style="width:60px;height:60px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px">🏫</div>';
    let allPages = '';
    _classes.forEach((cls, idx) => {
      const cSlots = tt.slots.filter(sl => sl.classId === cls.id);
      const periods = [...tt.periods].sort((a, b) => a.sortOrder - b.sortOrder);
      let rows = '';
      periods.forEach(p => {
        rows += `<tr style="${p.isBreak ? 'background:#fef9c3' : ''}">
          <td style="font-weight:700;font-size:11px;white-space:nowrap">${p.name}<br><span style="font-weight:400;color:#64748b">${p.startTime}–${p.endTime}</span></td>`;
        DAYS.forEach(day => {
          const slot = cSlots.find(sl => sl.day === day && sl.periodId === p.id);
          if (!slot) { rows += `<td>—</td>`; return; }
          if (p.isBreak || slot.label === p.name) { rows += `<td style="text-align:center;color:#92400e;font-style:italic">${p.name}</td>`; return; }
          const isFree = slot.label === 'Free' || (!slot.subjectId && slot.label !== '⚠');
          const isClash = slot.label === '⚠';
          rows += `<td style="text-align:center">
            <strong style="font-size:11px;color:${isClash ? '#ef4444' : isFree ? '#94a3b8' : '#1d4ed8'}">${isFree ? 'Free' : sName(slot.subjectId)}</strong>
            ${slot.teacherId && !isFree ? `<br><span style="font-size:10px;color:#64748b">${tName(slot.teacherId)}</span>` : ''}
            ${isClash ? `<br><span style="font-size:9px;color:#ef4444">⚠</span>` : ''}
          </td>`;
        });
        rows += `</tr>`;
      });
      allPages += `
        <div class="${idx < _classes.length - 1 ? 'page-break' : ''}">
          <div class="hdr">
            <div style="display:flex;align-items:center;gap:12px">${logoHtml}<div>
              <div style="font-size:17px;font-weight:700;color:#1d4ed8">${s.schoolName || 'School'}</div>
              <div style="font-style:italic;color:#3b82f6;font-size:11px">"${s.motto || ''}"</div>
            </div></div>
            <div style="text-align:right;font-size:11px;color:#64748b">${s.address || ''}<br>${s.phone || ''}</div>
          </div>
          <h2>CLASS TIMETABLE — ${cls.name}</h2>
          <p style="text-align:center;font-size:11px;color:#64748b;margin:0 0 12px">${s.currentTerm || 'Term 1'} ${s.academicYear || 2025} &nbsp;|&nbsp; Class Teacher: <strong>${cls.teacherId ? tName(cls.teacherId) : '—'}</strong></p>
          <table><thead><tr><th>Period</th>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody></table>
          <div class="ftr">
            <div style="display:flex;align-items:center;gap:10px">${logoHtml}
              <div><div style="font-weight:700;font-size:11px;color:#1d4ed8">${s.schoolName || ''}</div>
              <div style="font-size:10px;color:#94a3b8;font-style:italic">"${s.motto || ''}"</div></div>
            </div>
            <div style="display:flex;gap:32px;font-size:11px">
              <div style="text-align:center"><div style="width:100px;border-bottom:1px solid #1e293b;margin-bottom:3px"></div>Class Teacher</div>
              <div style="text-align:center"><div style="width:100px;border-bottom:1px solid #1e293b;margin-bottom:3px"></div>${s.adminRole || 'Head Teacher'}</div>
            </div>
          </div>
        </div>`;
    });
    const win = window.open('', '_blank', 'width=1000,height=700');
    win.document.write(buildPrintWindow('All Classes', allPages, s));
    win.document.close();
  }

  function printAllTeachers() {
    if (!_teachers.length) { toast && toast('No teachers found', 'warning'); return; }
    const s = _settings;
    const logoHtml = s.logo
      ? `<img src="${s.logo}" style="max-height:60px;object-fit:contain">`
      : '<div style="width:60px;height:60px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px">🏫</div>';
    let allPages = '';
    _teachers.forEach((teacher, idx) => {
      const data = buildTeacherTimetableHTML(teacher.id);
      data.logoHtml = logoHtml;
      allPages += `<div class="${idx < _teachers.length - 1 ? 'page-break' : ''}">${_buildTeacherPage(data)}</div>`;
    });
    const win = window.open('', '_blank', 'width=1000,height=700');
    win.document.write(buildPrintWindow('All Teachers', allPages, s));
    win.document.close();
  }

  // ── SNAPSHOTS ───────────────────────────────────────────────────────────────
  async function openSnapshotsModal() {
    const modal = document.getElementById('tt-snapshot-modal');
    if (!modal) return;
    openModal('tt-snapshot-modal');
    await refreshSnapshotList();
  }

  async function refreshSnapshotList() {
    const listEl = document.getElementById('tt-snapshot-list');
    if (!listEl) return;
    listEl.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> Loading…</div>`;
    try {
      const snaps = await API.get('/api/timetable/snapshots');
      if (!snaps.length) {
        listEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:.85rem">No snapshots saved yet. Save the current timetable below.</div>`;
        return;
      }
      listEl.innerHTML = snaps.map(s => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;background:var(--white)">
          <div style="flex:1">
            <div style="font-weight:600;font-size:.88rem">${s.name}</div>
            <div style="font-size:.75rem;color:var(--text-muted)">${s.term ? s.term + ' · ' : ''}${s.year ? s.year + ' · ' : ''}Saved ${new Date(s.createdAt).toLocaleDateString()}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="TT.restoreSnapshot(${s.id},'${s.name.replace(/'/g,"\\'")}')" style="font-size:.78rem"><i class="fas fa-undo"></i> Restore</button>
          <button onclick="TT.deleteSnapshot(${s.id})" style="background:none;border:none;cursor:pointer;color:var(--danger);padding:4px 8px;font-size:.85rem" title="Delete snapshot"><i class="fas fa-trash"></i></button>
        </div>`).join('');
    } catch(e) {
      listEl.innerHTML = `<div style="color:var(--danger);padding:10px">Failed to load snapshots: ${e.message}</div>`;
    }
  }

  async function saveSnapshot() {
    const nameEl = document.getElementById('tt-snap-name');
    const termEl = document.getElementById('tt-snap-term');
    const yearEl = document.getElementById('tt-snap-year');
    const name = nameEl?.value.trim();
    if (!name) { toast('Please enter a snapshot name', 'warning'); nameEl?.focus(); return; }
    try {
      await API.post('/api/timetable/snapshots', { name, term: termEl?.value || '', year: yearEl?.value || '' });
      toast(`Snapshot "${name}" saved`, 'success');
      if (nameEl) nameEl.value = '';
      await refreshSnapshotList();
    } catch(e) { toast('Save failed: ' + e.message, 'danger'); }
  }

  async function restoreSnapshot(id, name) {
    if (!confirm(`Restore timetable from snapshot "${name}"?\n\nThe current live timetable will be replaced. This cannot be undone.`)) return;
    try {
      const r = await API.post(`/api/timetable/snapshots/${id}/restore`, {});
      toast(`Restored from "${name}" — ${r.restored.slots} slots, ${r.restored.periods} periods`, 'success');
      closeModal('tt-snapshot-modal');
      await loadData();
      renderViewTab();
    } catch(e) { toast('Restore failed: ' + e.message, 'danger'); }
  }

  async function deleteSnapshot(id) {
    if (!confirm('Delete this snapshot? This cannot be undone.')) return;
    try {
      await API.delete(`/api/timetable/snapshots/${id}`);
      await refreshSnapshotList();
    } catch(e) { toast('Delete failed: ' + e.message, 'danger'); }
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────────
  return {
    initTimetable, loadData,
    updatePeriod, addPeriod, removePeriod, savePeriods,
    openTeacherModal, saveTeacherConfig, deleteTeacherConfig,
    addAssignmentRow, onClassTeacherToggle,
    generateAndSave, renderTimetableView, onViewModeChange,
    printClassTimetable, printTeacherTimetable, printAllClasses, printAllTeachers,
    openSnapshotsModal, saveSnapshot, restoreSnapshot, deleteSnapshot
  };
})();

window.TT = TT;
window.initTimetable = () => TT.initTimetable();
