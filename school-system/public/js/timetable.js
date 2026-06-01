// ================================================================
// TIMETABLE MODULE
// ================================================================
const TT = (function() {
  const DAYS = ['Mon','Tue','Wed','Thu','Fri'];

  let ttState = {
    periods: [],
    meta: {},     // teacherId -> meta object
    assignments: [], // {teacherId,classId,subjectId,periodsPerWeek,contactHours}
    slots: [],    // generated timetable
    viewMode: 'class' // 'class' or 'teacher'
  };

  // ── Load from API ──────────────────────────────────────────────
  async function loadTimetableData() {
    try {
      const [periods, config, slots] = await Promise.all([
        API.get('/api/timetable/periods'),
        API.get('/api/timetable/config'),
        API.get('/api/timetable/slots')
      ]);
      ttState.periods = periods.map(p=>({...p,id:parseInt(p.id),isBreak:!!p.isBreak}));
      ttState.meta = {};
      (config.meta||[]).forEach(m=>{
        ttState.meta[m.teacherId]={...m,
          teacherId:parseInt(m.teacherId),
          classTeacherId:m.classTeacherId?parseInt(m.classTeacherId):null,
          availableDays:(m.availableDays||'Mon,Tue,Wed,Thu,Fri').split(','),
          isClassTeacher:!!m.isClassTeacher,
          maxPeriodsPerDay:parseInt(m.maxPeriodsPerDay)||6
        };
      });
      ttState.assignments=(config.assignments||[]).map(a=>({
        ...a,id:parseInt(a.id),
        teacherId:parseInt(a.teacherId),classId:parseInt(a.classId),subjectId:parseInt(a.subjectId),
        periodsPerWeek:parseInt(a.periodsPerWeek)||1,contactHours:parseInt(a.contactHours)||1
      }));
      ttState.slots=(slots||[]).map(s=>({...s,id:parseInt(s.id),classId:parseInt(s.classId),
        periodId:parseInt(s.periodId),subjectId:s.subjectId?parseInt(s.subjectId):null,
        teacherId:s.teacherId?parseInt(s.teacherId):null}));
      renderTimetableView();
    } catch(e) { console.error('Timetable load error',e); }
  }

  // ── Periods Setup ─────────────────────────────────────────────
  function renderPeriodsSetup() {
    const container=document.getElementById('ttPeriodsContainer');
    if(!container) return;
    if(ttState.periods.length===0) {
      // Default school day
      ttState.periods=[
        {name:'Period 1',startTime:'07:30',endTime:'08:15',isBreak:false,sortOrder:0},
        {name:'Period 2',startTime:'08:15',endTime:'09:00',isBreak:false,sortOrder:1},
        {name:'Period 3',startTime:'09:00',endTime:'09:45',isBreak:false,sortOrder:2},
        {name:'Break',startTime:'09:45',endTime:'10:05',isBreak:true,sortOrder:3},
        {name:'Period 4',startTime:'10:05',endTime:'10:50',isBreak:false,sortOrder:4},
        {name:'Period 5',startTime:'10:50',endTime:'11:35',isBreak:false,sortOrder:5},
        {name:'Period 6',startTime:'11:35',endTime:'12:20',isBreak:false,sortOrder:6},
        {name:'Lunch',startTime:'12:20',endTime:'13:00',isBreak:true,sortOrder:7},
        {name:'Period 7',startTime:'13:00',endTime:'13:45',isBreak:false,sortOrder:8},
        {name:'Period 8',startTime:'13:45',endTime:'14:30',isBreak:false,sortOrder:9}
      ];
    }
    renderPeriodsTable();
  }

  function renderPeriodsTable() {
    const container=document.getElementById('ttPeriodsContainer');
    if(!container) return;
    container.innerHTML=`
      <div class="table-wrapper" style="margin-bottom:12px">
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Start</th><th>End</th><th>Type</th><th></th></tr></thead>
          <tbody id="periodsTableBody">
          ${ttState.periods.map((p,i)=>`<tr>
            <td style="color:var(--text-muted)">${i+1}</td>
            <td><input type="text" value="${p.name}" onchange="TT.updatePeriod(${i},'name',this.value)" style="width:120px;padding:5px 8px"></td>
            <td><input type="time" value="${p.startTime}" onchange="TT.updatePeriod(${i},'startTime',this.value)" style="width:100px;padding:5px 8px"></td>
            <td><input type="time" value="${p.endTime}" onchange="TT.updatePeriod(${i},'endTime',this.value)" style="width:100px;padding:5px 8px"></td>
            <td>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
                <input type="checkbox" ${p.isBreak?'checked':''} onchange="TT.updatePeriod(${i},'isBreak',this.checked)" style="width:auto">
                Break/Recess
              </label>
            </td>
            <td><button class="btn btn-danger btn-sm btn-icon" onclick="TT.removePeriod(${i})"><i class="fas fa-minus"></i></button></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" onclick="TT.addPeriod()"><i class="fas fa-plus"></i> Add Period</button>
        <button class="btn btn-primary" onclick="TT.savePeriods()"><i class="fas fa-save"></i> Save Periods</button>
      </div>`;
  }

  function updatePeriod(i,key,val) { ttState.periods[i][key]=val; }
  function addPeriod() {
    ttState.periods.push({name:`Period ${ttState.periods.length+1}`,startTime:'08:00',endTime:'08:45',isBreak:false,sortOrder:ttState.periods.length});
    renderPeriodsTable();
  }
  function removePeriod(i) { ttState.periods.splice(i,1); renderPeriodsTable(); }
  async function savePeriods() {
    await API.post('/api/timetable/periods',ttState.periods);
    toast('School periods saved');
  }

  // ── Teacher Config ────────────────────────────────────────────
  function renderTeacherConfigs() {
    const container=document.getElementById('ttTeacherConfigList');
    if(!container) return;
    const teachers=state.teachers;
    if(teachers.length===0) {
      container.innerHTML='<div class="alert alert-info"><i class="fas fa-info-circle"></i> Add teachers in the Teachers section first.</div>';
      return;
    }
    container.innerHTML=`
      <div style="margin-bottom:16px;display:flex;justify-content:flex-end">
        <button class="btn btn-primary" onclick="TT.openTeacherConfigModal()"><i class="fas fa-plus"></i> Configure Teacher</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Teacher</th><th>Type</th><th>Available Days</th><th>Max Periods/Day</th>
            <th>Class Teacher Of</th><th>Assignments</th><th>Actions</th>
          </tr></thead>
          <tbody>
          ${teachers.map(t=>{
            const meta=ttState.meta[t.id];
            const ass=ttState.assignments.filter(a=>a.teacherId===t.id);
            return `<tr>
              <td><strong>${t.firstName} ${t.lastName}</strong><br><span style="font-size:11px;color:var(--text-muted)">${t.staffId}</span></td>
              <td>${meta?`<span class="badge ${meta.teacherType==='Full-time'?'badge-success':'badge-warning'}">${meta.teacherType}</span>`:'<span class="badge badge-neutral">—</span>'}</td>
              <td style="font-size:12px">${meta?(meta.availableDays||[]).join(', '):'All days'}</td>
              <td style="text-align:center">${meta?meta.maxPeriodsPerDay:'—'}</td>
              <td>${meta&&meta.isClassTeacher&&meta.classTeacherId?getClassName(meta.classTeacherId):'—'}</td>
              <td>
                ${ass.map(a=>`<div style="font-size:11px;margin-bottom:2px">
                  <span class="badge badge-info">${getClassName(a.classId)}</span>
                  ${getSubjectName(a.subjectId)} — ${a.periodsPerWeek}pw
                </div>`).join('')||'<span style="color:var(--text-muted);font-size:12px">None</span>'}
              </td>
              <td style="white-space:nowrap">
                <button class="btn btn-secondary btn-sm btn-icon" onclick="TT.openTeacherConfigModal(${t.id})" title="Configure"><i class="fas fa-cog"></i></button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="TT.deleteTeacherConfig(${t.id})" title="Remove config"><i class="fas fa-trash"></i></button>
              </td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function openTeacherConfigModal(teacherId=null) {
    const modal=document.getElementById('ttTeacherConfigModal');
    if(!modal) return;
    const teacherSel=document.getElementById('ttConfigTeacher');
    teacherSel.innerHTML='<option value="">-- Select Teacher --</option>'+state.teachers.map(t=>`<option value="${t.id}">${t.firstName} ${t.lastName} (${t.staffId})</option>`).join('');

    document.getElementById('ttConfigType').value='Full-time';
    DAYS.forEach(d=>{ const cb=document.getElementById(`ttDay_${d}`); if(cb) cb.checked=true; });
    document.getElementById('ttConfigMaxPeriods').value=6;
    document.getElementById('ttConfigIsClassTeacher').checked=false;
    document.getElementById('ttConfigClassTeacherDiv').style.display='none';
    document.getElementById('ttConfigClassTeacher').innerHTML='<option value="">-- Select Class --</option>'+state.classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('ttAssignmentsList').innerHTML='';
    document.getElementById('ttConfigEditTeacherId').value='';

    if(teacherId) {
      teacherSel.value=teacherId;
      document.getElementById('ttConfigEditTeacherId').value=teacherId;
      const meta=ttState.meta[teacherId];
      if(meta) {
        document.getElementById('ttConfigType').value=meta.teacherType||'Full-time';
        DAYS.forEach(d=>{ const cb=document.getElementById(`ttDay_${d}`); if(cb) cb.checked=(meta.availableDays||DAYS).includes(d); });
        document.getElementById('ttConfigMaxPeriods').value=meta.maxPeriodsPerDay||6;
        document.getElementById('ttConfigIsClassTeacher').checked=meta.isClassTeacher;
        document.getElementById('ttConfigClassTeacherDiv').style.display=meta.isClassTeacher?'block':'none';
        if(meta.classTeacherId) document.getElementById('ttConfigClassTeacher').value=meta.classTeacherId;
      }
      renderAssignmentRows(teacherId);
    }
    openModal('ttTeacherConfigModal');
  }

  function onClassTeacherToggle(cb) {
    document.getElementById('ttConfigClassTeacherDiv').style.display=cb.checked?'block':'none';
  }

  function renderAssignmentRows(teacherId=null) {
    const list=document.getElementById('ttAssignmentsList');
    if(!list) return;
    const tid=teacherId||parseInt(document.getElementById('ttConfigEditTeacherId').value)||parseInt(document.getElementById('ttConfigTeacher').value);
    const existing=ttState.assignments.filter(a=>a.teacherId===tid);
    list.innerHTML='';
    if(existing.length>0) {
      existing.forEach((a,i)=>addAssignmentRow(a));
    }
  }

  function addAssignmentRow(prefill=null) {
    const list=document.getElementById('ttAssignmentsList');
    if(!list) return;
    const row=document.createElement('div');
    row.className='tt-assignment-row';
    row.style.cssText='display:grid;grid-template-columns:1fr 1fr 80px 80px auto;gap:8px;align-items:center;margin-bottom:8px;';
    const classOpts=state.classes.map(c=>`<option value="${c.id}" ${prefill&&prefill.classId===c.id?'selected':''}>${c.name}</option>`).join('');
    const subOpts=state.subjects.map(s=>`<option value="${s.id}" ${prefill&&prefill.subjectId===s.id?'selected':''}>${s.name}</option>`).join('');
    row.innerHTML=`
      <select style="padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px"><option value="">Class</option>${classOpts}</select>
      <select style="padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px"><option value="">Subject</option>${subOpts}</select>
      <input type="number" min="1" max="10" value="${prefill?prefill.periodsPerWeek:1}" placeholder="Periods/wk" title="Periods per week" style="padding:7px;border:1.5px solid var(--border);border-radius:8px;font-size:13px">
      <input type="number" min="1" max="20" value="${prefill?prefill.contactHours:1}" placeholder="Contact hrs" title="Contact hours" style="padding:7px;border:1.5px solid var(--border);border-radius:8px;font-size:13px">
      <button class="btn btn-danger btn-sm btn-icon" onclick="this.closest('.tt-assignment-row').remove()"><i class="fas fa-minus"></i></button>`;
    list.appendChild(row);
  }

  async function saveTeacherConfig() {
    const teacherId=parseInt(document.getElementById('ttConfigTeacher').value)||parseInt(document.getElementById('ttConfigEditTeacherId').value);
    if(!teacherId){toast('Please select a teacher','error');return;}
    const availableDays=DAYS.filter(d=>document.getElementById(`ttDay_${d}`)?.checked);
    const isClassTeacher=document.getElementById('ttConfigIsClassTeacher').checked;
    const classTeacherId=isClassTeacher?parseInt(document.getElementById('ttConfigClassTeacher').value)||null:null;

    const assignmentRows=document.querySelectorAll('.tt-assignment-row');
    const assignments=[];
    assignmentRows.forEach(row=>{
      const selects=row.querySelectorAll('select');
      const inputs=row.querySelectorAll('input[type="number"]');
      const classId=parseInt(selects[0].value);
      const subjectId=parseInt(selects[1].value);
      if(classId&&subjectId) {
        assignments.push({classId,subjectId,periodsPerWeek:parseInt(inputs[0].value)||1,contactHours:parseInt(inputs[1].value)||1});
      }
    });

    const payload={teacherId,teacherType:document.getElementById('ttConfigType').value,
      availableDays,maxPeriodsPerDay:parseInt(document.getElementById('ttConfigMaxPeriods').value)||6,
      isClassTeacher,classTeacherId,assignments};
    await API.post('/api/timetable/config',payload);

    ttState.meta[teacherId]={...payload,availableDays};
    ttState.assignments=ttState.assignments.filter(a=>a.teacherId!==teacherId);
    assignments.forEach(a=>ttState.assignments.push({...a,teacherId}));

    closeModal('ttTeacherConfigModal');
    renderTeacherConfigs();
    toast('Teacher configuration saved');
  }

  async function deleteTeacherConfig(teacherId) {
    confirmAction('Remove timetable configuration for this teacher?',async()=>{
      await API.del(`/api/timetable/config/${teacherId}`);
      delete ttState.meta[teacherId];
      ttState.assignments=ttState.assignments.filter(a=>a.teacherId!==teacherId);
      renderTeacherConfigs();
      toast('Configuration removed');
    });
  }

  // ── TIMETABLE GENERATOR ──────────────────────────────────────
  function generateTimetable() {
    const classSel=document.getElementById('ttGenerateClass').value;
    const targetClasses=classSel?[parseInt(classSel)]:state.classes.map(c=>c.id);
    if(targetClasses.length===0){toast('No classes available','error');return;}
    const teachingPeriods=ttState.periods.filter(p=>!p.isBreak);
    if(teachingPeriods.length===0){toast('Please set up school periods first','error');return;}

    // Build the global pool of ALL needed placements across all classes.
    // Processing globally (not class-by-class) prevents early classes from
    // monopolising a teacher's available slots.
    const globalPool=[];
    targetClasses.forEach(classId=>{
      const classAssignments=ttState.assignments.filter(a=>a.classId===classId);
      classAssignments.forEach(a=>{
        const meta=ttState.meta[a.teacherId]||{availableDays:DAYS,maxPeriodsPerDay:6};
        const availDays=DAYS.filter(d=>(meta.availableDays||DAYS).includes(d));
        const teacherCapacity=availDays.length*(meta.maxPeriodsPerDay||6);
        for(let i=0;i<a.periodsPerWeek;i++){
          globalPool.push({classId,assignment:a,availDays,teacherCapacity,meta});
        }
      });
    });

    // Try multiple independent attempts and keep the one with the fewest conflicts.
    const ATTEMPTS=6;
    let bestSlots=null,bestConflicts=Infinity;

    for(let attempt=0;attempt<ATTEMPTS;attempt++){
      // Shuffle then stable-sort hardest-to-place first
      // (teachers with least total available slots come first)
      const pool=[...globalPool].sort(()=>Math.random()-0.5);
      pool.sort((a,b)=>a.teacherCapacity-b.teacherCapacity);

      const slots=[];
      const classUsed={};   // `${classId}_${day}_${periodId}` -> true
      const teacherUsed={}; // `${teacherId}_${day}_${periodId}` -> true
      const teacherDayCnt={}; // `${teacherId}_${day}` -> count
      let conflicts=0;

      // Pre-fill break slots for every target class
      targetClasses.forEach(classId=>{
        ttState.periods.filter(p=>p.isBreak).forEach(p=>{
          DAYS.forEach(day=>{
            slots.push({classId,day,periodId:p.id,subjectId:null,teacherId:null,label:p.name});
          });
        });
      });

      pool.forEach(({classId,assignment,availDays,meta})=>{
        const {teacherId}=assignment;
        const maxPd=meta.maxPeriodsPerDay||6;
        let placed=false;

        // Phase 1 – try within the teacher's available days without conflict
        const dayOrder=[...availDays].sort(()=>Math.random()-0.5);
        outer:
        for(const day of dayOrder){
          const dcKey=`${teacherId}_${day}`;
          if((teacherDayCnt[dcKey]||0)>=maxPd) continue;
          const periodOrder=[...teachingPeriods].sort(()=>Math.random()-0.5);
          for(const p of periodOrder){
            const ck=`${classId}_${day}_${p.id}`;
            const tk=`${teacherId}_${day}_${p.id}`;
            if(!classUsed[ck]&&!teacherUsed[tk]){
              classUsed[ck]=true; teacherUsed[tk]=true;
              teacherDayCnt[dcKey]=(teacherDayCnt[dcKey]||0)+1;
              slots.push({classId,day,periodId:p.id,subjectId:assignment.subjectId,teacherId,label:''});
              placed=true; break outer;
            }
          }
        }

        // Phase 2 – expand to all days (teacher unavailable but class slot free)
        if(!placed){
          outer2:
          for(const day of DAYS){
            const dcKey=`${teacherId}_${day}`;
            if((teacherDayCnt[dcKey]||0)>=maxPd) continue;
            for(const p of teachingPeriods){
              const ck=`${classId}_${day}_${p.id}`;
              const tk=`${teacherId}_${day}_${p.id}`;
              if(!classUsed[ck]){
                classUsed[ck]=true;
                const hasTeacherConflict=!!teacherUsed[tk];
                if(!hasTeacherConflict) teacherUsed[tk]=true;
                else conflicts++;
                teacherDayCnt[dcKey]=(teacherDayCnt[dcKey]||0)+1;
                slots.push({classId,day,periodId:p.id,subjectId:assignment.subjectId,teacherId,label:hasTeacherConflict?'⚠':''});
                placed=true; break outer2;
              }
            }
          }
        }

        // Phase 3 – last resort: find any free class slot, ignore all teacher constraints
        if(!placed){
          for(const day of DAYS){
            if(placed) break;
            for(const p of teachingPeriods){
              const ck=`${classId}_${day}_${p.id}`;
              if(!classUsed[ck]){
                classUsed[ck]=true; conflicts++;
                slots.push({classId,day,periodId:p.id,subjectId:assignment.subjectId,teacherId,label:'⚠'});
                placed=true; break;
              }
            }
          }
        }
      });

      // Fill remaining class teaching slots with Free
      targetClasses.forEach(classId=>{
        DAYS.forEach(day=>{
          teachingPeriods.forEach(p=>{
            const ck=`${classId}_${day}_${p.id}`;
            if(!classUsed[ck]){
              slots.push({classId,day,periodId:p.id,subjectId:null,teacherId:null,label:'Free'});
            }
          });
        });
      });

      if(conflicts<bestConflicts){
        bestConflicts=conflicts;
        bestSlots=slots;
        if(conflicts===0) break; // perfect – stop early
      }
    }

    if(bestConflicts>0){
      toast(`Timetable generated with ${bestConflicts} conflict(s). Adjust teacher availability or periods per week to reduce them.`,'warning');
    } else {
      toast('Timetable generated – no conflicts!','success');
    }

    ttState.slots=bestSlots;
    return bestSlots;
  }

  async function generateAndSave() {
    const slots=generateTimetable();
    if(!slots) return;
    await API.post('/api/timetable/slots',slots);
    renderTimetableView();
    toast('Timetable generated and saved!');
    navigate('timetable');
    const viewTab=document.getElementById('tab-tt-view');
    if(viewTab) viewTab.click();
  }

  // ── View Timetable ───────────────────────────────────────────
  function renderTimetableView() {
    const container=document.getElementById('ttViewContainer');
    if(!container) return;
    const viewMode=document.getElementById('ttViewMode')?.value||'class';
    const filterVal=document.getElementById('ttViewFilter')?.value;

    if(ttState.slots.length===0) {
      container.innerHTML='<div class="alert alert-info" style="margin-top:16px"><i class="fas fa-info-circle"></i> No timetable generated yet. Go to the Setup tab to configure teachers, then generate.</div>';
      return;
    }

    if(viewMode==='class') {
      const classId=filterVal?parseInt(filterVal):state.classes[0]?.id;
      if(!classId){container.innerHTML='<div class="alert alert-info">No classes available.</div>';return;}
      renderClassTimetable(classId,container);
    } else {
      const teacherId=filterVal?parseInt(filterVal):state.teachers[0]?.id;
      renderTeacherTimetable(teacherId,container);
    }
  }

  function renderClassTimetable(classId,container) {
    const cls=state.classes.find(c=>c.id===classId);
    const classSlots=ttState.slots.filter(s=>s.classId===classId);
    if(!cls){container.innerHTML='<div style="padding:20px;color:var(--text-muted)">Select a class to view its timetable.</div>';return;}
    const periods=ttState.periods.sort((a,b)=>a.sortOrder-b.sortOrder);
    let html=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 style="font-size:16px;font-weight:700">${cls.name} — Weekly Timetable</h3>
      <button class="btn btn-secondary" onclick="TT.printClassTimetable(${classId})"><i class="fas fa-print"></i> Print</button>
    </div>
    <div class="table-wrapper"><table style="min-width:700px">
      <thead><tr><th style="width:120px">Time</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr></thead>
      <tbody>`;
    periods.forEach(p=>{
      const bg=p.isBreak?'background:#f8fafc;':'';
      html+=`<tr style="${bg}">
        <td style="font-size:12px;color:var(--text-muted);white-space:nowrap"><strong>${p.name}</strong><br>${p.startTime}–${p.endTime}</td>`;
      DAYS.forEach(day=>{
        const slot=classSlots.find(s=>s.day===day&&s.periodId===p.id);
        if(!slot){html+=`<td style="color:var(--text-muted);font-size:12px;text-align:center">—</td>`;return;}
        if(p.isBreak||slot.label===p.name||slot.label==='BREAK'||slot.label===p.name) {
          html+=`<td style="background:#f1f5f9;text-align:center"><span class="badge badge-neutral" style="font-size:11px">${slot.label||p.name}</span></td>`;
          return;
        }
        const subName=getSubjectName(slot.subjectId);
        const tName=slot.teacherId?getTeacherName(slot.teacherId):'';
        const isConflict=slot.label==='⚠';
        html+=`<td style="text-align:center;padding:8px 6px">
          <div style="font-weight:600;font-size:12px;color:${isConflict?'var(--danger)':'var(--primary)'}">${subName==='—'?slot.label||'Free':subName}</div>
          ${tName&&tName!=='—'?`<div style="font-size:10px;color:var(--text-muted);margin-top:2px">${tName}</div>`:''}
          ${isConflict?'<div style="font-size:10px;color:var(--danger)">Conflict!</div>':''}
        </td>`;
      });
      html+=`</tr>`;
    });
    html+=`</tbody></table></div>`;
    container.innerHTML=html;
  }

  function renderTeacherTimetable(teacherId,container) {
    const teacher=state.teachers.find(t=>t.id===teacherId);
    if(!teacher){container.innerHTML='<div style="padding:20px;color:var(--text-muted)">Select a teacher to view their schedule.</div>';return;}
    const periods=ttState.periods.sort((a,b)=>a.sortOrder-b.sortOrder);
    let html=`<div style="margin-bottom:12px">
      <h3 style="font-size:16px;font-weight:700">${teacher.firstName} ${teacher.lastName} — Weekly Schedule</h3>
    </div>
    <div class="table-wrapper"><table style="min-width:700px">
      <thead><tr><th style="width:120px">Time</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr></thead>
      <tbody>`;
    periods.forEach(p=>{
      html+=`<tr>
        <td style="font-size:12px;color:var(--text-muted);white-space:nowrap"><strong>${p.name}</strong><br>${p.startTime}–${p.endTime}</td>`;
      DAYS.forEach(day=>{
        const slot=ttState.slots.find(s=>s.teacherId===teacherId&&s.day===day&&s.periodId===p.id);
        if(!slot){html+=`<td style="color:var(--text-muted);font-size:12px;text-align:center">Free</td>`;return;}
        const subName=getSubjectName(slot.subjectId);
        const clsName=getClassName(slot.classId);
        html+=`<td style="text-align:center;padding:8px 6px">
          <div style="font-weight:600;font-size:12px;color:var(--primary)">${subName}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${clsName}</div>
        </td>`;
      });
      html+=`</tr>`;
    });
    html+=`</tbody></table></div>`;
    container.innerHTML=html;
  }

  function printClassTimetable(classId) {
    const cls=state.classes.find(c=>c.id===classId); if(!cls) return;
    const s=state.settings;
    const classSlots=ttState.slots.filter(sl=>sl.classId===classId);
    const periods=ttState.periods.sort((a,b)=>a.sortOrder-b.sortOrder);
    const logoHtml=s.logo?`<img src="${s.logo}" style="max-height:60px;object-fit:contain;">`:
      '<div style="width:60px;height:60px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px">🏫</div>';
    const win=window.open('','_blank','width=1000,height=700');
    let tableRows='';
    periods.forEach(p=>{
      tableRows+=`<tr style="${p.isBreak?'background:#f8fafc':''}">
        <td style="font-weight:600;white-space:nowrap;font-size:11px">${p.name}<br><span style="font-weight:400;color:#64748b">${p.startTime}–${p.endTime}</span></td>`;
      DAYS.forEach(day=>{
        const slot=classSlots.find(sl=>sl.day===day&&sl.periodId===p.id);
        if(!slot){tableRows+=`<td>—</td>`;return;}
        if(p.isBreak||slot.label===p.name){tableRows+=`<td style="background:#f1f5f9;text-align:center;color:#64748b;font-style:italic">${p.name}</td>`;return;}
        const sub=getSubjectName(slot.subjectId);
        const tch=slot.teacherId?getTeacherName(slot.teacherId):'';
        tableRows+=`<td style="text-align:center"><strong style="font-size:11px;color:#1d4ed8">${sub==='—'?slot.label||'Free':sub}</strong>${tch&&tch!=='—'?`<br><span style="font-size:10px;color:#64748b">${tch}</span>`:''}`;
        if(slot.label==='⚠') tableRows+=`<br><span style="font-size:10px;color:#ef4444">Conflict</span>`;
        tableRows+=`</td>`;
      });
      tableRows+=`</tr>`;
    });
    win.document.write(`<!DOCTYPE html><html><head><title>Timetable - ${cls.name}</title>
    <style>body{font-family:Arial,sans-serif;margin:0;padding:20px;font-size:13px;}
    .header{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:16px;}
    .school-name{font-size:18px;font-weight:700;color:#1d4ed8;}
    .motto{font-style:italic;color:#1d4ed8;font-size:12px;}
    h2{text-align:center;font-size:15px;margin:0 0 16px;}
    table{width:100%;border-collapse:collapse;}
    th{background:#1d4ed8;color:white;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
    td{padding:8px;border:1px solid #e2e8f0;vertical-align:middle;}
    .footer{margin-top:24px;display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #e2e8f0;}
    @media print{.no-print{display:none!important;}}</style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:12px">${logoHtml}<div>
        <div class="school-name">${s.schoolName||'School'}</div>
        <div class="motto">"${s.motto||'Excellence in Education'}"</div>
      </div></div>
      <div style="text-align:right;font-size:11px;color:#64748b">
        ${s.address||''}${s.city?', '+s.city:''}<br>${s.phone||''}<br>${s.email||''}
      </div>
    </div>
    <h2>Class Timetable — ${cls.name} &nbsp;|&nbsp; ${s.currentTerm||'Term 1'} ${s.academicYear||2025}</h2>
    <p style="font-size:11px;text-align:center;color:#64748b;margin-bottom:12px">Class Teacher: <strong>${getTeacherName(cls.teacherId)}</strong></p>
    <table><thead><tr><th>Period</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody></table>
    <div class="footer">
      <div style="display:flex;align-items:center;gap:10px">${logoHtml}
        <div><div style="font-weight:700;font-size:12px;color:#1d4ed8">${s.schoolName||'School'}</div>
        <div style="font-size:10px;color:#94a3b8;font-style:italic">"${s.motto||''}"</div></div>
      </div>
      <div style="display:flex;gap:32px;font-size:11px">
        <div style="text-align:center"><div style="width:100px;border-bottom:1px solid #1e293b;margin-bottom:3px"></div>Class Teacher</div>
        <div style="text-align:center"><div style="width:100px;border-bottom:1px solid #1e293b;margin-bottom:3px"></div>${s.adminRole||'Head Teacher'}</div>
      </div>
    </div>
    <script>window.onload=function(){window.print();}<\/script></body></html>`);
    win.document.close();
  }

  function onViewModeChange(mode) {
    const filterSel=document.getElementById('ttViewFilter');
    if(!filterSel) return;
    if(mode==='class') {
      filterSel.innerHTML='<option value="">All Classes</option>'+state.classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    } else {
      filterSel.innerHTML='<option value="">All Teachers</option>'+state.teachers.map(t=>`<option value="${t.id}">${t.firstName} ${t.lastName}</option>`).join('');
    }
    renderTimetableView();
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    loadTimetableData, renderPeriodsSetup, renderTeacherConfigs, renderTimetableView,
    updatePeriod, addPeriod, removePeriod, savePeriods,
    openTeacherConfigModal, saveTeacherConfig, deleteTeacherConfig,
    addAssignmentRow, onClassTeacherToggle, generateAndSave,
    printClassTimetable, onViewModeChange
  };
})();

window.TT = TT;
