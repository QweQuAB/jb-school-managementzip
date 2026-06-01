// ─── SCHOOL BILL GENERATOR ────────────────────────────────────────────────────
// Self-contained billing sub-app. All settings in localStorage (BILL_KEY).

const BILL_KEY = 'saSchoolBillSettings';
const BILL_LVC = { creche:'#06B6D4', nursery:'#8B5CF6', kg:'#EC4899', lp:'#F59E0B', up:'#10B981', jhs:'#3B82F6' };
const BILL_LVL = { creche:'Crèche', nursery:'Nursery', kg:'Kindergarten', lp:'Lower Primary', up:'Upper Primary', jhs:'JHS' };
const BILL_LEVELS = ['creche','nursery','kg','lp','up','jhs'];

const BILL_DEFS = {
  school:{ name:'St. Anne Catholic School', subtitle:'Nkontrodo, Elmina', address:'P.O. Box 58, Elmina, Central Region', logo:null },
  academic:{ year:'2025-2026', term:'3', reopening:'' },
  bank:{ name:'GCB Bank Ltd', branch:'Elmina Branch', account:'1234567890', accountName:'St. Anne Catholic School' },
  fees:{
    creche:{ label:'Crèche', classes:['Crèche'], hasArrears:false, items:[
      {id:'t1',label:'Tuition Fee',amount:320,period:'Per Term',terms:'all'},
      {id:'t2',label:'Stationary',amount:5,period:'Per Term',terms:'all'},
      {id:'t3',label:'Maintenance',amount:15,period:'Per Term',terms:'all'},
      {id:'t4',label:'Exams',amount:10,period:'Per Term',terms:'all'},
      {id:'t5',label:'Books',amount:180,period:'',terms:'1'},
      {id:'t6',label:'PTA/ Building Funds',amount:30,period:'Per Year',terms:'2'},
      {id:'t7',label:'Sports',amount:15,period:'Per Year',terms:'2'}
    ], feeding:{'1':490,'2':420,'3':490} },
    nursery:{ label:'Nursery', classes:['Nursery'], hasArrears:false, items:[
      {id:'n1',label:'Tuition Fee',amount:345,period:'Per Term',terms:'all'},
      {id:'n2',label:'Stationary',amount:5,period:'Per Term',terms:'all'},
      {id:'n3',label:'Maintenance',amount:20,period:'Per Term',terms:'all'},
      {id:'n4',label:'Exams',amount:10,period:'Per Term',terms:'all'},
      {id:'n5',label:'Books',amount:220,period:'',terms:'1'},
      {id:'n6',label:'PTA/ Building Funds',amount:30,period:'Per Year',terms:'2'},
      {id:'n7',label:'Sports',amount:15,period:'Per Year',terms:'2'}
    ], feeding:{'1':490,'2':420,'3':490} },
    kg:{ label:'Kindergarten', classes:['Kindergarten'], hasArrears:false, items:[
      {id:'k1',label:'Tuition Fee',amount:355,period:'Per Term',terms:'all'},
      {id:'k2',label:'Stationary',amount:10,period:'Per Term',terms:'all'},
      {id:'k3',label:'Maintenance',amount:20,period:'Per Term',terms:'all'},
      {id:'k4',label:'Exams',amount:15,period:'Per Term',terms:'all'},
      {id:'k5',label:'Books',amount:450,period:'',terms:'1'},
      {id:'k6',label:'PTA/ Building Funds',amount:30,period:'Per Year',terms:'2'},
      {id:'k7',label:'Sports',amount:15,period:'Per Year',terms:'2'}
    ], feeding:{'1':490,'2':420,'3':490} },
    lp:{ label:'Lower Primary', classes:['Lower Primary'], hasArrears:true, items:[
      {id:'lp1',label:'Tuition Fee',amount:365,period:'Per Term',terms:'all'},
      {id:'lp2',label:'Stationary',amount:10,period:'Per Term',terms:'all'},
      {id:'lp3',label:'Maintenance',amount:30,period:'Per Term',terms:'all'},
      {id:'lp4',label:'Exams',amount:15,period:'Per Term',terms:'all'},
      {id:'lp5',label:'Books',amount:750,period:'',terms:'1'},
      {id:'lp6',label:'PTA/ Building Funds',amount:30,period:'Per Year',terms:'2'},
      {id:'lp7',label:'Sports',amount:15,period:'Per Year',terms:'2'}
    ], feeding:{'1':560,'2':480,'3':560} },
    up:{ label:'Upper Primary', classes:['Upper Primary'], hasArrears:true, items:[
      {id:'up1',label:'Tuition Fee',amount:410,period:'Per Term',terms:'all'},
      {id:'up2',label:'Stationary',amount:10,period:'Per Term',terms:'all'},
      {id:'up3',label:'Maintenance',amount:30,period:'Per Term',terms:'all'},
      {id:'up4',label:'Exams',amount:20,period:'Per Term',terms:'all'},
      {id:'up5',label:'I.C.T',amount:10,period:'Per Term',terms:'all'},
      {id:'up6',label:'Books',amount:870,period:'',terms:'1'},
      {id:'up7',label:'PTA/ Building Funds',amount:30,period:'Per Year',terms:'2'},
      {id:'up8',label:'Sports',amount:15,period:'Per Year',terms:'2'}
    ], feeding:{'1':595,'2':540,'3':595} },
    jhs:{ label:'JHS', classes:['JHS'], hasArrears:true, items:[
      {id:'j1',label:'Tuition Fee',amount:500,period:'Per Term',terms:'all'},
      {id:'j2',label:'Exams',amount:20,period:'Per Term',terms:'all'},
      {id:'j3',label:'Maintenance',amount:40,period:'Per Term',terms:'all'},
      {id:'j4',label:'Stationary',amount:10,period:'Per Term',terms:'all'},
      {id:'j5',label:'I.C.T',amount:10,period:'Per Term',terms:'all'},
      {id:'j6',label:'Books',amount:1450,period:'',terms:'1'},
      {id:'j7',label:'PTA/ Building Funds',amount:30,period:'Per Year',terms:'2'},
      {id:'j8',label:'Sports',amount:15,period:'Per Year',terms:'2'}
    ], feeding:{'1':595,'2':540,'3':595} }
  },
  transport:[
    {id:'ssnit',label:'SSNIT',fees:{creche:350,nursery:350,kg:350,lp:350,up:350,jhs:350}},
    {id:'elmina',label:'Elmina / Mental',fees:{creche:420,nursery:420,kg:420,lp:420,up:420,jhs:420}},
    {id:'ankaful',label:'Ankaful / Bronyibima',fees:{creche:580,nursery:580,kg:650,lp:580,up:580,jhs:580}},
    {id:'quarters',label:'Quarters',fees:{creche:280,nursery:280,kg:280,lp:280,up:280,jhs:280}},
    {id:'ataabadze',label:'Ataabadze',fees:{creche:650,nursery:650,kg:650,lp:650,up:650,jhs:650}},
    {id:'none',label:'No Transport',fees:{creche:0,nursery:0,kg:0,lp:0,up:0,jhs:0}}
  ],
  logoSize:100,
  watermark:{enabled:false,mode:'text',text:'OFFICIAL',image:null,opacity:15,rotation:-35,size:100},
  background:{enabled:false,text:'',fontSize:8,opacity:6,color:'#1B2D5B',spacing:120,rotation:-30},
  _blank:false
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let _BS = null;
let _billPage = 'individual';  // 'individual' | 'fullsheet' | 'settings'
let _billActiveLv = 'lp';
let _billShowPrint = false;
let _billWizStep = 0;
let _billShowWiz = false;
let _billShowAdminWiz = false;
let _billForm1 = {name:'',level:'lp',className:'Lower Primary',transport:'none',term:'3',arrears:0};
let _billForm2 = {name:'',level:'jhs',className:'JHS',transport:'none',term:'3',arrears:0};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
function bMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const k of Object.keys(source)) {
    if (Array.isArray(source[k])) { target[k] = source[k]; }
    else if (source[k] && typeof source[k] === 'object' && target[k] && typeof target[k] === 'object') { bMerge(target[k], source[k]); }
    else if (source[k] !== undefined) { target[k] = source[k]; }
  }
  return target;
}

function loadBillSettings() {
  try {
    const raw = localStorage.getItem(BILL_KEY);
    const base = JSON.parse(JSON.stringify(BILL_DEFS));
    _BS = raw ? bMerge(base, JSON.parse(raw)) : base;
  } catch(e) { _BS = JSON.parse(JSON.stringify(BILL_DEFS)); }
  _billForm1.term = _BS.academic.term;
  _billForm2.term = _BS.academic.term;
}

function saveBillS() { if (_BS) localStorage.setItem(BILL_KEY, JSON.stringify(_BS)); }

function bSet(path, value) {
  const parts = path.split('.');
  let obj = _BS;
  for (let i = 0; i < parts.length - 1; i++) { if (!obj[parts[i]]) obj[parts[i]] = {}; obj = obj[parts[i]]; }
  obj[parts[parts.length-1]] = value;
  saveBillS();
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
function setupBilling() {
  if (!_BS) loadBillSettings();
  document.getElementById('content').classList.add('billing-active');
  _bRender();
  const isFirst = !localStorage.getItem(BILL_KEY);
  if (isFirst && !_billShowWiz) { _billShowWiz = true; _billWizStep = 0; _bRender(); }
  else if (_BS._blank && !_billShowAdminWiz) { _billShowAdminWiz = true; _billWizStep = 0; _bRender(); }
}

// ─── MAIN RENDER ──────────────────────────────────────────────────────────────
function _bRender() {
  const root = document.getElementById('billing-root');
  if (!root) return;
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;flex:1;overflow:hidden">
      ${_bTabBar()}
      <div style="flex:1;overflow-y:auto;background:#F4F6F9;position:relative" id="bill-ca">
        ${_billPage === 'settings' ? _bSettingsPage() : _bGeneratorPage()}
      </div>
    </div>
    ${_billShowPrint ? _bPrintModal() : ''}
    ${_billShowWiz ? _bWizardModal() : ''}
    ${_billShowAdminWiz ? _bAdminWizModal() : ''}
  `;
  // Re-attach ESC key for modals
  if (_billShowPrint || _billShowWiz || _billShowAdminWiz) {
    const handler = (e) => { if (e.key === 'Escape') { _billShowPrint = false; _billShowWiz = false; _billShowAdminWiz = false; _bRender(); document.removeEventListener('keydown', handler); } };
    document.addEventListener('keydown', handler);
  }
}

// ─── TAB BAR ─────────────────────────────────────────────────────────────────
function _bTabBar() {
  const tabs = [
    { id:'individual', icon:'fa-file-invoice', label:'Individual Bill' },
    { id:'fullsheet',  icon:'fa-copy',         label:'Full Sheet (2)' },
    { id:'settings',   icon:'fa-sliders-h',    label:'Settings & Fees' }
  ];
  return `
  <div style="background:#fff;border-bottom:1px solid #E2E8F0;padding:0 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;min-height:52px">
    <div style="display:flex;gap:4px">
      ${tabs.map(t => {
        const a = _billPage === t.id;
        return `<button onclick="billNav('${t.id}')" style="display:flex;align-items:center;gap:7px;padding:10px 16px;border:none;background:${a?'#F0F9FF':'transparent'};color:${a?'#0EA5E9':'#64748B'};border-bottom:2px solid ${a?'#0EA5E9':'transparent'};cursor:pointer;font-size:.82rem;font-weight:${a?'600':'400'};border-radius:6px 6px 0 0;white-space:nowrap">
          <i class="fa ${t.icon}" style="font-size:.8rem"></i>${t.label}
        </button>`;
      }).join('')}
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:20px;padding:4px 12px;font-size:.72rem;color:#15803D;font-weight:600"><i class="fa fa-check-circle"></i> Auto-saved</div>
      <button onclick="billOpenWizard()" style="background:#0EA5E9;border:none;color:#fff;border-radius:8px;padding:6px 14px;font-size:.78rem;cursor:pointer;display:flex;align-items:center;gap:6px"><i class="fa fa-magic"></i> Wizard</button>
    </div>
  </div>`;
}

function billNav(page) { _billPage = page; _bRender(); }

// ─── GENERATOR PAGE ───────────────────────────────────────────────────────────
function _bGeneratorPage() {
  const isSheet = _billPage === 'fullsheet';
  return `<div style="display:flex;height:100%;gap:0">
    ${_bFormPanel(isSheet)}
    ${_bPreviewPanel(isSheet)}
  </div>`;
}

function _bFormPanel(isSheet) {
  return `<div style="width:310px;min-width:260px;background:#fff;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;overflow-y:auto;flex-shrink:0">
    <div style="padding:18px">
      <div style="font-size:.78rem;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Student Details</div>
      ${_bFormFields(_billForm1, 1)}
      ${isSheet ? `<div style="border-top:1px solid #E2E8F0;margin:16px 0 8px"></div>
        <div style="font-size:.78rem;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Bill 2 — Student Details</div>
        ${_bFormFields(_billForm2, 2)}` : ''}
    </div>
    <div style="padding:12px 18px;border-top:1px solid #E2E8F0;margin-top:auto">
      <button onclick="_billOpenPrint()" style="width:100%;background:#1B2D5B;color:#fff;border:none;border-radius:10px;padding:13px;font-size:.9rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
        🖨 Print Preview
      </button>
    </div>
  </div>`;
}

function _bFormFields(form, num) {
  const lv = _BS.fees[form.level];
  const classOpts = lv.classes.length > 1 ? `<div style="margin-bottom:12px">
    <label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Class</label>
    <select onchange="bSetForm(${num},'className',this.value)" style="width:100%;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;background:#F8FAFC">
      ${lv.classes.map(c=>`<option${form.className===c?' selected':''}>${c}</option>`).join('')}
    </select></div>` : '';

  const arrearsField = lv.hasArrears ? `<div style="margin-bottom:12px">
    <label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Arrears (GH¢)</label>
    <input type="number" min="0" step="0.01" value="${form.arrears}" oninput="bSetForm(${num},'arrears',+this.value)" style="width:100%;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;background:#F8FAFC">
  </div>` : '';

  return `
    <div style="margin-bottom:12px">
      <label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Student Name</label>
      <input type="text" value="${form.name}" oninput="bSetForm(${num},'name',this.value)" placeholder="Full name" style="width:100%;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;background:#F8FAFC">
    </div>
    <div style="margin-bottom:12px">
      <label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Level</label>
      <select onchange="bSetFormLevel(${num},this.value)" style="width:100%;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;background:#F8FAFC">
        ${BILL_LEVELS.map(lk=>`<option value="${lk}"${form.level===lk?' selected':''}>${BILL_LVL[lk]}</option>`).join('')}
      </select>
    </div>
    ${classOpts}
    <div style="margin-bottom:12px">
      <label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Transport Zone</label>
      <select onchange="bSetForm(${num},'transport',this.value)" style="width:100%;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;background:#F8FAFC">
        ${_BS.transport.map(z=>`<option value="${z.id}"${form.transport===z.id?' selected':''}>${z.label}</option>`).join('')}
      </select>
    </div>
    <div style="margin-bottom:12px">
      <label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Term</label>
      <select onchange="bSetForm(${num},'term',this.value)" style="width:100%;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;background:#F8FAFC">
        <option value="1"${form.term==='1'?' selected':''}>1st Term</option>
        <option value="2"${form.term==='2'?' selected':''}>2nd Term</option>
        <option value="3"${form.term==='3'?' selected':''}>3rd Term</option>
      </select>
    </div>
    ${arrearsField}`;
}

function bSetForm(num, key, val) {
  const f = num === 1 ? _billForm1 : _billForm2;
  f[key] = val;
  _bRender();
}

function bSetFormLevel(num, lv) {
  const f = num === 1 ? _billForm1 : _billForm2;
  f.level = lv;
  f.className = _BS.fees[lv].classes[0];
  _bRender();
}

function _bPreviewPanel(isSheet) {
  return `<div style="flex:1;overflow-y:auto;padding:24px">
    ${isSheet ? `
      <div style="margin-bottom:16px">
        <div style="font-size:.75rem;font-weight:700;color:#64748B;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">Bill 1 — ${BILL_LVL[_billForm1.level]}</div>
        <div style="background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden">${_bBillDoc(_billForm1, 'prev1', false)}</div>
      </div>
      <div>
        <div style="font-size:.75rem;font-weight:700;color:#64748B;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">Bill 2 — ${BILL_LVL[_billForm2.level]}</div>
        <div style="background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden">${_bBillDoc(_billForm2, 'prev2', false)}</div>
      </div>` :
    `<div style="background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden">${_bBillDoc(_billForm1, 'prev1', false)}</div>`}
  </div>`;
}

// ─── BILL CALCULATOR ─────────────────────────────────────────────────────────
function bCalc(form) {
  const lv = form.level, term = form.term;
  const lvFees = _BS.fees[lv];
  const items = lvFees.items.filter(it => it.terms === 'all' || it.terms === term);
  const baseTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const feeding = Number(lvFees.feeding[term]) || 0;
  const trZone = _BS.transport.find(z => z.id === form.transport);
  const trAmt = (trZone && form.transport !== 'none') ? (Number(trZone.fees[lv]) || 0) : 0;
  const varItems = [{ label:'Feeding', amount:feeding, period:'Per Term' }];
  if (form.transport !== 'none' && trZone) varItems.push({ label:`Transport (${trZone.label})`, amount:trAmt, period:'Per Term' });
  const varTotal = varItems.reduce((s, v) => s + v.amount, 0);
  return {
    name: form.name || 'Student Name', className: form.className,
    term: form.term === '1' ? '1st Term' : form.term === '2' ? '2nd Term' : '3rd Term',
    lv, items, baseTotal, varItems, varTotal,
    grandTotal: baseTotal + varTotal,
    arrears: lvFees.hasArrears ? (Number(form.arrears) || 0) : null,
    hasArrears: lvFees.hasArrears
  };
}

// ─── BILL DOCUMENT RENDERER ───────────────────────────────────────────────────
function _bBillDoc(form, billId, isPrint) {
  const b = bCalc(form);
  const S = _BS;
  const u = isPrint ? 'pt' : 'px';
  const sz = (px) => `${isPrint ? Math.round(px*0.75) : px}${u}`;
  const lsz = S.logoSize || 100;

  // Logo
  let logoHtml;
  if (S.school.logo) {
    logoHtml = `<img src="${S.school.logo}" style="max-height:${sz(60*(lsz/100))};max-width:${sz(80*(lsz/100))};object-fit:contain">`;
  } else {
    const initials = (S.school.name || 'SA').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    logoHtml = `<div style="width:${sz(52*(lsz/100))};height:${sz(52*(lsz/100))};border-radius:50%;border:2px solid #1B2D5B;display:flex;align-items:center;justify-content:center;font-family:serif;font-weight:700;color:#1B2D5B;font-size:${sz(18*(lsz/100))}">${initials}</div>`;
  }

  // Background SVG pattern
  let bgPattern = '';
  if (S.background && S.background.enabled) {
    const bg = S.background;
    const txt = bg.text || S.school.name || 'SCHOOL';
    const sp = bg.spacing || 120;
    const op = (bg.opacity || 6) / 100;
    const rot = bg.rotation ?? -30;
    const fs = bg.fontSize || 8;
    bgPattern = `<svg style="position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="bgp-${billId}" x="0" y="0" width="${sp}" height="${sp/2}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">
        <text x="0" y="${sp/3}" font-family="serif" font-size="${fs}" fill="${bg.color||'#1B2D5B'}" opacity="${op}">${txt}</text>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#bgp-${billId})"/>
    </svg>`;
  }

  // Watermark
  let wmHtml = '';
  if (S.watermark && S.watermark.enabled) {
    const wm = S.watermark;
    const op = (wm.opacity || 15) / 100;
    const rot = wm.rotation ?? -35;
    const scale = (wm.size || 100) / 100;
    if (wm.mode === 'image' && wm.image) {
      wmHtml = `<div style="position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:${op}">
        <img src="${wm.image}" style="transform:rotate(${rot}deg) scale(${scale});max-width:70%;max-height:70%;object-fit:contain">
      </div>`;
    } else {
      wmHtml = `<div style="position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:${op}">
        <div style="font-family:'Playfair Display',serif;font-size:${sz(72*scale)};font-weight:700;color:#1B2D5B;transform:rotate(${rot}deg);white-space:nowrap">${wm.text||'OFFICIAL'}</div>
      </div>`;
    }
  }

  // Fee table rows
  const feeRows = b.items.map(it => `<tr>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;font-size:${sz(11.5)}">${it.label}</td>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:center;font-size:${sz(11.5)}">GH¢</td>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:right;font-size:${sz(11.5)}">${Number(it.amount).toFixed(2)}</td>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;font-size:${sz(10.5)}">${it.period}</td>
  </tr>`).join('');

  const varRows = b.varItems.map(vi => `<tr>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;font-size:${sz(11.5)}">${vi.label}</td>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:center;font-size:${sz(11.5)}">GH¢</td>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:right;font-size:${sz(11.5)}">${vi.amount.toFixed(2)}</td>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;font-size:${sz(10.5)}">Per Term</td>
  </tr>`).join('');

  const arrearsRow = b.hasArrears ? `<tr>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;font-size:${sz(11.5)};font-weight:600">Arrears</td>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:center;font-size:${sz(11.5)}">GH¢</td>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:right;font-size:${sz(11.5)}">${b.arrears > 0 ? b.arrears.toFixed(2) : '_ _ _ _ _'}</td>
    <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;font-size:${sz(10.5)}"></td>
  </tr>` : '';

  const bankHtml = (S.bank.name || S.bank.account) ? `
    <div style="text-align:right">
      <div style="font-size:${sz(8.5)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#1B2D5B;margin-bottom:${sz(3)}">Payment Details</div>
      ${S.bank.name ? `<div style="font-size:${sz(10)}">Bank: ${S.bank.name}${S.bank.branch ? ', '+S.bank.branch : ''}</div>` : ''}
      ${S.bank.accountName ? `<div style="font-size:${sz(10)}">Acct. Name: ${S.bank.accountName}</div>` : ''}
      ${S.bank.account ? `<div style="font-size:${sz(10)}">Acct. No.: ${S.bank.account}</div>` : ''}
    </div>` : '';

  const transportLine = b.varItems.length > 1 && form.transport !== 'none'
    ? `<div style="font-style:italic;font-size:${sz(10.5)};margin-bottom:${sz(4)};color:#444">Transport: ${_BS.transport.find(z=>z.id===form.transport)?.label||''}</div>` : '';

  const footer = S.academic.reopening
    ? `<div style="border-top:1px solid #1B2D5B;margin-top:${sz(8)};padding-top:${sz(6)};text-align:center;font-style:italic;font-size:${sz(10.5)};color:#1B2D5B">School Reopens: ${S.academic.reopening}</div>` : '';

  return `<div style="position:relative;background:#fff;padding:${sz(12)} ${sz(16)};font-family:'Crimson Pro','Times New Roman',serif;overflow:hidden">
    ${bgPattern}${wmHtml}
    <div style="position:relative;z-index:1">
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:${sz(10)};border-bottom:2px solid #1B2D5B;padding-bottom:${sz(10)};margin-bottom:${sz(8)};align-items:start">
        <div>
          <div style="font-family:'Playfair Display',serif;text-transform:uppercase;letter-spacing:.04em;color:#1B2D5B;font-size:${sz(13)};font-weight:700">${S.school.name||''}</div>
          ${S.school.subtitle ? `<div style="font-weight:600;font-size:${sz(11)}">${S.school.subtitle}</div>` : ''}
          ${S.school.address ? `<div style="font-weight:600;font-size:${sz(10)}">${S.school.address}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;justify-content:center">${logoHtml}</div>
        <div>${bankHtml}</div>
      </div>
      <div style="display:flex;align-items:baseline;gap:${sz(8)};margin-bottom:${sz(4)};flex-wrap:wrap">
        <span style="font-weight:700;font-size:${sz(11.5)}">NAME:</span>
        <span style="flex:1;border-bottom:1px dashed #444;min-width:${sz(100)};font-size:${sz(12)};padding-bottom:1px">${b.name}</span>
        <span style="font-weight:700;font-size:${sz(11.5)}">Class:</span>
        <span style="font-size:${sz(12)}">${b.className}</span>
        <span style="font-size:${sz(10.5)};color:#555">&nbsp;·&nbsp;${b.term}&nbsp;·&nbsp;${S.academic.year||''}</span>
      </div>
      ${transportLine}
      <div style="text-align:center;font-family:'Playfair Display',serif;font-style:italic;font-size:${sz(14)};margin:${sz(6)} 0;color:#1B2D5B">Child's Bill</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:${sz(4)}">
        <thead><tr>
          <th style="padding:${sz(4)} ${sz(5)};border:1px solid #555;text-align:left;font-size:${sz(10)};background:#f0f0ee">Description</th>
          <th style="padding:${sz(4)} ${sz(5)};border:1px solid #555;text-align:center;font-size:${sz(10)};background:#f0f0ee">GH¢</th>
          <th style="padding:${sz(4)} ${sz(5)};border:1px solid #555;text-align:right;font-size:${sz(10)};background:#f0f0ee">Amount</th>
          <th style="padding:${sz(4)} ${sz(5)};border:1px solid #555;font-size:${sz(10)};background:#f0f0ee">Period</th>
        </tr></thead>
        <tbody>
          ${feeRows}
          <tr><td colspan="4" style="padding:${sz(2)} 0;border:none"></td></tr>
          <tr style="background:#f8f8f6">
            <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;font-weight:700;font-size:${sz(11.5)}">TOTAL</td>
            <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:center;font-size:${sz(11.5)}">GH¢</td>
            <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:right;font-weight:700;font-size:${sz(11.5)}">${b.baseTotal.toFixed(2)}</td>
            <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555"></td>
          </tr>
          ${varRows}
          <tr style="background:#f8f8f6">
            <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;font-weight:700;font-size:${sz(12)}">TOTAL</td>
            <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:center;font-size:${sz(12)}">GH¢</td>
            <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555;text-align:right;font-weight:700;font-size:${sz(12)}">${b.grandTotal.toFixed(2)}</td>
            <td style="padding:${sz(3)} ${sz(5)};border:1px solid #555"></td>
          </tr>
          ${arrearsRow}
        </tbody>
      </table>
      ${footer}
    </div>
  </div>`;
}

// ─── PRINT PREVIEW MODAL ──────────────────────────────────────────────────────
function _billOpenPrint() { _billShowPrint = true; _bRender(); }
function _billClosePrint() { _billShowPrint = false; _bRender(); }

function _bPrintModal() {
  const isSheet = _billPage === 'fullsheet';
  const bill1Html = _bBillDoc(_billForm1, 'p1', true);
  const bill2Html = isSheet ? _bBillDoc(_billForm2, 'p2', true) : _bBillDoc(_billForm1, 'p2', true);

  return `<div style="position:fixed;inset:0;background:rgba(10,18,40,.85);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px" onclick="if(event.target===this)_billClosePrint()">
    <div style="background:#444;border-radius:12px;max-width:760px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.5)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #555">
        <h3 style="color:#fff;font-family:serif;font-size:1.1rem">Print Preview — A4 Sheet</h3>
        <div style="display:flex;gap:10px">
          <button onclick="billDoPrint()" style="background:#1B2D5B;color:#fff;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;font-size:.85rem;font-weight:600">🖨 Print / Save as PDF</button>
          <button onclick="_billClosePrint()" style="background:transparent;color:#fff;border:1px solid #888;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:.85rem">✕ Close</button>
        </div>
      </div>
      <div style="padding:20px;display:flex;justify-content:center">
        <div id="bill-print-area" style="width:210mm;min-height:297mm;background:#fff;display:flex;flex-direction:column;padding:8mm 12mm;box-shadow:0 4px 20px rgba(0,0,0,.3)">
          <div style="flex:1;padding:3mm 0">${bill1Html}</div>
          <div style="border-top:1.5px dashed #aaa;margin:2mm 0;position:relative;text-align:center">
            <span style="position:absolute;left:50%;transform:translateX(-50%) translateY(-50%);background:#fff;padding:0 8px;font-size:8px;color:#aaa">✂ cut here</span>
          </div>
          <div style="flex:1;padding:3mm 0">${bill2Html}</div>
        </div>
      </div>
    </div>
  </div>`;
}

function billDoPrint() {
  const area = document.getElementById('bill-print-area');
  if (!area) return;
  const content = area.innerHTML;
  const pw = window.open('', '_blank', 'width=900,height=700');
  pw.document.write(`<!DOCTYPE html><html><head>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Crimson Pro','Times New Roman',serif;background:#fff}
    .ppage{width:210mm;min-height:297mm;display:flex;flex-direction:column;padding:8mm 12mm;page-break-after:always}
    .pslot{flex:1;padding:3mm 0}.pcut{border-top:1.5px dashed #aaa;margin:2mm 0;text-align:center;position:relative}
    @page{size:A4;margin:0}</style></head><body>
    <div class="ppage"><div class="pslot">${_bBillDoc(_billForm1,'pr1',true)}</div>
    <div class="pcut"><span style="position:absolute;left:50%;transform:translateX(-50%) translateY(-50%);background:#fff;padding:0 8px;font-size:8pt;color:#aaa">✂ cut here</span></div>
    <div class="pslot">${_billPage==='fullsheet'?_bBillDoc(_billForm2,'pr2',true):_bBillDoc(_billForm1,'pr2',true)}</div></div>
    </body></html>`);
  pw.document.close();
  setTimeout(() => { pw.print(); pw.close(); }, 600);
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function _bSettingsPage() {
  return `<div style="max-width:860px;margin:0 auto;padding:8px 0 40px">
    ${_bSecSchool()}
    ${_bSecAcademic()}
    ${_bSecAppearance()}
    ${_bSecBackground()}
    ${_bSecFees()}
    ${_bSecTransport()}
    ${_bSecBank()}
    ${_bSecDataMgmt()}
  </div>`;
}

function _bSectionWrap(icon, title, body, rightHtml='') {
  return `<div style="background:#fff;border:1px solid #E2E8F0;border-radius:14px;overflow:hidden;margin-bottom:20px">
    <div style="padding:14px 22px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;background:#FAFBFC">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:1.1rem">${icon}</span>
        <span style="font-weight:700;font-size:.9rem;color:#0F172A">${title}</span>
      </div>
      ${rightHtml}
    </div>
    <div style="padding:22px">${body}</div>
  </div>`;
}

function _bInp(id, val, placeholder='', type='text', extra='') {
  return `<input id="${id}" type="${type}" value="${val||''}" placeholder="${placeholder}" ${extra}
    oninput="bSettingInput('${id}')" 
    style="width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;background:#F8FAFC;color:#0F172A;outline:none">`;
}

function bSettingInput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = el.value;
  const pathMap = {
    'bs-school-name':'school.name','bs-school-sub':'school.subtitle','bs-school-addr':'school.address',
    'bs-acad-year':'academic.year','bs-acad-reopen':'academic.reopening',
    'bs-bank-name':'bank.name','bs-bank-branch':'bank.branch','bs-bank-acct':'bank.account','bs-bank-aname':'bank.accountName',
    'bs-logo-size':'logoSize','bs-wm-text':'watermark.text','bs-wm-opacity':'watermark.opacity',
    'bs-wm-rot':'watermark.rotation','bs-wm-size':'watermark.size',
    'bs-bg-text':'background.text','bs-bg-fs':'background.fontSize','bs-bg-op':'background.opacity',
    'bs-bg-angle':'background.rotation','bs-bg-sp':'background.spacing','bs-bg-col':'background.color'
  };
  if (pathMap[id]) {
    const numIds = ['bs-logo-size','bs-wm-opacity','bs-wm-rot','bs-wm-size','bs-bg-fs','bs-bg-op','bs-bg-angle','bs-bg-sp'];
    bSet(pathMap[id], numIds.includes(id) ? Number(v) : v);
    // Re-render only the preview area if in generator, else refresh settings
    if (_billPage === 'settings') {
      const bgPreview = document.getElementById('bg-live-preview');
      if (bgPreview) bgPreview.innerHTML = _bBgPreview();
    }
  }
}

function _bSecSchool() {
  const s = _BS.school;
  const hasLogo = !!s.logo;
  return _bSectionWrap('🏫', 'School Information', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">School Name</label>${_bInp('bs-school-name', s.name,'St. Anne Catholic School')}</div>
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Subtitle / Town</label>${_bInp('bs-school-sub', s.subtitle,'Nkontrodo, Elmina')}</div>
    </div>
    <div style="margin-bottom:14px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Address</label>${_bInp('bs-school-addr', s.address,'P.O. Box...')}</div>
    <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:8px">School Logo (for bills)</label>
      <div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">
        <div style="width:72px;height:72px;border-radius:10px;border:2px solid #E2E8F0;background:#F8FAFC;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
          ${hasLogo ? `<img src="${s.logo}" style="width:100%;height:100%;object-fit:cover">` : `<i class="fa fa-graduation-cap" style="font-size:1.8rem;color:#CBD5E1"></i>`}
        </div>
        <div style="flex:1;min-width:160px">
          <label style="display:flex;flex-direction:column;align-items:center;border:2px dashed #E2E8F0;border-radius:10px;padding:16px 12px;cursor:pointer;background:#F8FAFC;gap:4px;text-align:center" ondragover="event.preventDefault()" ondrop="bHandleLogoDrop(event,'billing')">
            <i class="fa fa-cloud-upload-alt" style="font-size:1.3rem;color:#0EA5E9;opacity:.7"></i>
            <span style="font-size:.8rem;font-weight:600;color:#334155">Drag & drop or click to upload</span>
            <span style="font-size:.7rem;color:#94A3B8">PNG, JPG — max 1.5 MB</span>
            <input type="file" id="bs-logo-file" accept="image/*" style="display:none" onchange="bHandleLogoSelect(this)">
          </label>
          ${hasLogo ? `<button onclick="bRemoveBillLogo()" style="margin-top:8px;background:none;border:1px solid #E2E8F0;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:.75rem;color:#ef4444">Remove Logo</button>` : ''}
        </div>
      </div>
    </div>`);
}

function _bSecAcademic() {
  const a = _BS.academic;
  const termBtn = (v,label) => `<button onclick="bSetAcadTerm('${v}')" style="flex:1;padding:8px;border:1.5px solid ${a.term===v?'#0EA5E9':'#E2E8F0'};background:${a.term===v?'#0EA5E9':'#fff'};color:${a.term===v?'#fff':'#64748B'};border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:600">${label}</button>`;
  return _bSectionWrap('📅', 'Academic Year & Term', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Academic Year</label>${_bInp('bs-acad-year', a.year,'2025-2026')}</div>
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Reopening Date</label>${_bInp('bs-acad-reopen', a.reopening,'e.g. Monday, 7th September 2026')}</div>
    </div>
    <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:8px">Current Term</label>
      <div style="display:flex;gap:8px">${termBtn('1','1st Term')}${termBtn('2','2nd Term')}${termBtn('3','3rd Term')}</div>
    </div>`);
}

function bSetAcadTerm(v) { bSet('academic.term',v); _billForm1.term=v; _billForm2.term=v; _bRender(); }

function _bSlider(id,val,min,max,unit='',extra='') {
  return `<div style="display:flex;align-items:center;gap:10px">
    <input type="range" id="${id}" min="${min}" max="${max}" value="${val}" oninput="bSettingInput('${id}');document.getElementById('${id}-v').textContent=this.value+'${unit}'" style="flex:1">
    <span id="${id}-v" style="font-size:.78rem;color:#334155;min-width:40px;text-align:right">${val}${unit}</span>
  </div>`;
}

function _bToggle(checked, onclick) {
  const on = checked;
  return `<div onclick="${onclick}" style="width:36px;height:20px;border-radius:10px;background:${on?'#0EA5E9':'#CBD5E1'};position:relative;cursor:pointer;transition:background .2s;flex-shrink:0">
    <div style="position:absolute;top:2px;left:${on?'18px':'2px'};width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:left .2s"></div>
  </div>`;
}

function _bSecAppearance() {
  const ls = _BS.logoSize || 100;
  const wm = _BS.watermark || {};
  return _bSectionWrap('🎨', 'Bill Appearance', `
    <div style="margin-bottom:20px">
      <div style="font-size:.78rem;font-weight:600;color:#334155;margin-bottom:6px">Logo Size: <span id="bs-logo-size-v">${ls}</span>%</div>
      ${_bSlider('bs-logo-size',ls,10,200,'%')}
    </div>
    <div style="border-top:1px solid #F1F5F9;padding-top:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div><div style="font-weight:600;font-size:.85rem">Watermark</div><div style="font-size:.75rem;color:#64748B">Overlay a faint watermark on each bill</div></div>
        ${_bToggle(wm.enabled,"bToggleBillSetting('watermark.enabled')")}
      </div>
      <div style="opacity:${wm.enabled?1:0.4};pointer-events:${wm.enabled?'all':'none'}">
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button onclick="bSet('watermark.mode','text');_bRender()" style="flex:1;padding:7px;border:1.5px solid ${wm.mode!=='image'?'#0EA5E9':'#E2E8F0'};background:${wm.mode!=='image'?'#EFF8FF':'#fff'};border-radius:8px;cursor:pointer;font-size:.8rem">Text</button>
          <button onclick="bSet('watermark.mode','image');_bRender()" style="flex:1;padding:7px;border:1.5px solid ${wm.mode==='image'?'#0EA5E9':'#E2E8F0'};background:${wm.mode==='image'?'#EFF8FF':'#fff'};border-radius:8px;cursor:pointer;font-size:.8rem">Image</button>
        </div>
        ${wm.mode==='image' ? `<div style="margin-bottom:12px">
          <label style="display:flex;flex-direction:column;align-items:center;border:2px dashed #E2E8F0;border-radius:8px;padding:12px;cursor:pointer;font-size:.8rem;color:#64748B;gap:4px" ondrop="bHandleLogoDrop(event,'wm')">
            <i class="fa fa-image" style="font-size:1.2rem"></i>Upload watermark image
            <input type="file" accept="image/*" style="display:none" onchange="bHandleWmImg(this)">
          </label>
          ${wm.image?`<button onclick="bSet('watermark.image',null);_bRender()" style="margin-top:6px;background:none;border:1px solid #E2E8F0;border-radius:6px;padding:3px 10px;cursor:pointer;font-size:.72rem;color:#ef4444">Remove</button>`:''}
        </div>` : `<div style="margin-bottom:12px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Watermark Text</label>${_bInp('bs-wm-text', wm.text||'OFFICIAL','OFFICIAL')}</div>`}
        <div style="margin-bottom:10px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Opacity: <span id="bs-wm-opacity-v">${wm.opacity||15}</span>%</label>${_bSlider('bs-wm-opacity',wm.opacity||15,0,100,'%')}</div>
        <div style="margin-bottom:10px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Rotation: <span id="bs-wm-rot-v">${wm.rotation??-35}</span>°</label>${_bSlider('bs-wm-rot',wm.rotation??-35,-180,180,'°')}</div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Size: <span id="bs-wm-size-v">${wm.size||100}</span>%</label>${_bSlider('bs-wm-size',wm.size||100,10,800,'%')}</div>
      </div>
    </div>`);
}

function _bBgPreview() {
  const bg = _BS.background || {};
  if (!bg.enabled) return `<div style="display:flex;align-items:center;justify-content:center;height:80px;color:#94A3B8;font-size:.78rem">Enable to see preview</div>`;
  const txt = bg.text || _BS.school.name || 'SCHOOL';
  const sp = bg.spacing || 120;
  const op = (bg.opacity || 6) / 100;
  const rot = bg.rotation ?? -30;
  const fs = bg.fontSize || 8;
  const col = bg.color || '#1B2D5B';
  return `<svg width="100%" height="80" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px;border:1px solid #E2E8F0">
    <defs><pattern id="bgprev" x="0" y="0" width="${sp}" height="${sp/2}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">
      <text x="0" y="${sp/3}" font-family="serif" font-size="${fs}" fill="${col}" opacity="${op}">${txt}</text>
    </pattern></defs>
    <rect width="100%" height="100%" fill="#fff"/><rect width="100%" height="100%" fill="url(#bgprev)"/>
  </svg>`;
}

function _bSecBackground() {
  const bg = _BS.background || {};
  const swatches = ['#1B2D5B','#0EA5E9','#15803D','#DC2626','#7C3AED','#92400E'];
  return _bSectionWrap('🖼', 'Background Design', `
    <div style="font-size:.78rem;color:#64748B;margin-bottom:14px">Fills the bill background with repeating text — like security paper.</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div><div style="font-weight:600;font-size:.85rem">Enable Background Pattern</div></div>
      ${_bToggle(bg.enabled,"bToggleBillSetting('background.enabled')")}
    </div>
    <div style="opacity:${bg.enabled?1:0.4};pointer-events:${bg.enabled?'all':'none'}">
      <div style="margin-bottom:12px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Repeating Text (blank = school name)</label>${_bInp('bs-bg-text', bg.text||'','Leave blank to use school name')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Font Size: <span id="bs-bg-fs-v">${bg.fontSize||8}</span></label>${_bSlider('bs-bg-fs',bg.fontSize||8,5,20,'')}</div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Opacity: <span id="bs-bg-op-v">${bg.opacity||6}</span>%</label>${_bSlider('bs-bg-op',bg.opacity||6,1,30,'%')}</div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Angle: <span id="bs-bg-angle-v">${bg.rotation??-30}</span>°</label>${_bSlider('bs-bg-angle',bg.rotation??-30,-90,90,'°')}</div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Spacing: <span id="bs-bg-sp-v">${bg.spacing||120}</span></label>${_bSlider('bs-bg-sp',bg.spacing||120,40,300,'')}</div>
      </div>
      <div style="margin-bottom:14px">
        <label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:8px">Colour</label>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${swatches.map(c=>`<div onclick="bSet('background.color','${c}');_bRender()" style="width:28px;height:28px;border-radius:6px;background:${c};cursor:pointer;border:3px solid ${(bg.color||'#1B2D5B')===c?'#0EA5E9':'transparent'}"></div>`).join('')}
          <input type="color" value="${bg.color||'#1B2D5B'}" id="bs-bg-col" oninput="bSettingInput('bs-bg-col')" style="width:32px;height:32px;border:none;border-radius:6px;cursor:pointer;padding:0">
        </div>
      </div>
      <div id="bg-live-preview">${_bBgPreview()}</div>
    </div>`);
}

function bToggleBillSetting(path) {
  const parts = path.split('.');
  let obj = _BS;
  for (let i = 0; i < parts.length - 1; i++) { if (!obj[parts[i]]) obj[parts[i]] = {}; obj = obj[parts[i]]; }
  const key = parts[parts.length-1];
  obj[key] = !obj[key];
  saveBillS();
  _bRender();
}

function _bSecFees() {
  const lv = _billActiveLv;
  const lvData = _BS.fees[lv];
  const termBadge = (t) => {
    const map = {all:['All Terms','#DBEAFE','#1D4ED8'],'1':['Term 1','#D1FAE5','#065F46'],'2':['Term 2','#FEF3C7','#92400E'],'3':['Term 3','#EDE9FE','#5B21B6']};
    const [label,bg,col] = map[t]||map.all;
    return `<span style="background:${bg};color:${col};padding:2px 8px;border-radius:20px;font-size:.7rem;font-weight:600">${label}</span>`;
  };

  const lvTabs = BILL_LEVELS.map(k => `<button onclick="bSetActiveLv('${k}')" style="padding:7px 14px;border:none;background:${lv===k?BILL_LVC[k]:'#F1F5F9'};color:${lv===k?'#fff':'#64748B'};border-radius:20px;cursor:pointer;font-size:.78rem;font-weight:${lv===k?'700':'400'}">${BILL_LVL[k]}</button>`).join('');

  const feeRows = lvData.items.map((it, idx) => `<tr>
    <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9"><input type="text" value="${it.label}" oninput="bFeeItemUpdate('${lv}',${idx},'label',this.value)" style="width:100%;border:none;background:transparent;font-size:.82rem;color:#0F172A;outline:none"></td>
    <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9"><input type="number" value="${it.amount}" oninput="bFeeItemUpdate('${lv}',${idx},'amount',+this.value)" style="width:80px;border:1px solid #E2E8F0;border-radius:6px;padding:4px 6px;font-size:.82rem;text-align:right"></td>
    <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9"><input type="text" value="${it.period}" oninput="bFeeItemUpdate('${lv}',${idx},'period',this.value)" style="width:90px;border:1px solid #E2E8F0;border-radius:6px;padding:4px 6px;font-size:.82rem"></td>
    <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9">
      <select onchange="bFeeItemUpdate('${lv}',${idx},'terms',this.value)" style="border:1px solid #E2E8F0;border-radius:6px;padding:4px 6px;font-size:.78rem">
        <option value="all"${it.terms==='all'?' selected':''}>All Terms</option>
        <option value="1"${it.terms==='1'?' selected':''}>Term 1 only</option>
        <option value="2"${it.terms==='2'?' selected':''}>Term 2 only</option>
        <option value="3"${it.terms==='3'?' selected':''}>Term 3 only</option>
      </select>
    </td>
    <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9;text-align:center">
      <button onclick="bFeeItemDelete('${lv}',${idx})" style="background:none;border:1px solid #FECACA;border-radius:6px;color:#ef4444;cursor:pointer;padding:3px 8px;font-size:.78rem">×</button>
    </td>
  </tr>`).join('');

  const feedRows = ['1','2','3'].map(t => `<tr>
    <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9;font-size:.82rem">Feeding — Term ${t}</td>
    <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9"><input type="number" value="${lvData.feeding[t]||0}" oninput="bFeedingUpdate('${lv}','${t}',+this.value)" style="width:80px;border:1px solid #E2E8F0;border-radius:6px;padding:4px 6px;font-size:.82rem;text-align:right"></td>
    <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9"></td>
    <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9">${termBadge(t)}</td>
    <td></td>
  </tr>`).join('');

  return _bSectionWrap('💰', 'Fee Configuration', `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">${lvTabs}</div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:.82rem" key="${lv}">
        <thead><tr style="background:#F8FAFC">
          <th style="padding:8px;text-align:left;font-size:.72rem;color:#64748B;font-weight:700;border-bottom:2px solid #E2E8F0">Fee Item</th>
          <th style="padding:8px;text-align:left;font-size:.72rem;color:#64748B;font-weight:700;border-bottom:2px solid #E2E8F0">Amount (GH¢)</th>
          <th style="padding:8px;text-align:left;font-size:.72rem;color:#64748B;font-weight:700;border-bottom:2px solid #E2E8F0">Period Label</th>
          <th style="padding:8px;text-align:left;font-size:.72rem;color:#64748B;font-weight:700;border-bottom:2px solid #E2E8F0">When Applied</th>
          <th style="padding:8px;border-bottom:2px solid #E2E8F0"></th>
        </tr></thead>
        <tbody>${feeRows}</tbody>
      </table>
    </div>
    <button onclick="bFeeItemAdd('${lv}')" style="margin-top:10px;background:none;border:1.5px dashed #0EA5E9;color:#0EA5E9;border-radius:8px;padding:7px 16px;cursor:pointer;font-size:.82rem;font-weight:600">+ Add fee item</button>
    <div style="border-top:1px solid #F1F5F9;margin:16px 0 8px;padding-top:8px">
      <div style="font-size:.78rem;font-weight:700;color:#64748B;margin-bottom:8px">🍽 Feeding Fee — specific to ${BILL_LVL[lv]} class</div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.82rem"><tbody>${feedRows}</tbody></table></div>
    </div>
    <div style="font-size:.72rem;color:#94A3B8;margin-top:12px">Edit any field inline. Fee items appear on the bill in the order listed. Feeding fees are per term and specific to each class level.</div>`);
}

function bSetActiveLv(lv) { _billActiveLv = lv; _bRender(); }

function bFeeItemUpdate(lv, idx, key, val) {
  _BS.fees[lv].items[idx][key] = val;
  saveBillS();
}

function bFeeItemDelete(lv, idx) {
  _BS.fees[lv].items.splice(idx, 1);
  saveBillS();
  _bRender();
}

function bFeeItemAdd(lv) {
  _BS.fees[lv].items.push({ id:'item_'+Date.now(), label:'New Fee', amount:0, period:'Per Term', terms:'all' });
  saveBillS();
  _bRender();
}

function bFeedingUpdate(lv, term, val) {
  _BS.fees[lv].feeding[term] = val;
  saveBillS();
}

function _bSecTransport() {
  const zones = _BS.transport.filter(z => z.id !== 'none');
  const headers = ['Cr','Nur','KG','LP','UP','JHS'];
  const lvKeys = ['creche','nursery','kg','lp','up','jhs'];
  return _bSectionWrap('🚌', 'Transport Zones', `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:.82rem">
        <thead><tr style="background:#F8FAFC">
          <th style="padding:8px 12px;text-align:left;font-size:.72rem;color:#64748B;border-bottom:2px solid #E2E8F0">Zone</th>
          ${headers.map(h=>`<th style="padding:8px 12px;text-align:center;font-size:.72rem;color:#64748B;border-bottom:2px solid #E2E8F0">${h}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${zones.map((z,zi) => `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;font-weight:500;font-size:.82rem">${z.label}</td>
            ${lvKeys.map(lk=>`<td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;text-align:center">
              <input type="number" value="${z.fees[lk]||0}" oninput="bTransportUpdate(${zi},'${lk}',+this.value)" style="width:60px;border:1px solid #E2E8F0;border-radius:6px;padding:4px;font-size:.8rem;text-align:center">
            </td>`).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="font-size:.72rem;color:#94A3B8;margin-top:10px">Day Student (no transport) is always GH¢ 0.00 and is not shown on the bill.</div>`);
}

function bTransportUpdate(zoneIdx, lv, val) {
  const zones = _BS.transport.filter(z => z.id !== 'none');
  if (zones[zoneIdx]) zones[zoneIdx].fees[lv] = val;
  saveBillS();
}

function _bSecBank() {
  const b = _BS.bank;
  return _bSectionWrap('🏦', 'Bank Payment Details', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Bank Name</label>${_bInp('bs-bank-name',b.name,'GCB Bank Ltd')}</div>
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Branch</label>${_bInp('bs-bank-branch',b.branch,'Elmina Branch')}</div>
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Account Name</label>${_bInp('bs-bank-aname',b.accountName,'St. Anne Catholic School')}</div>
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Account Number</label>${_bInp('bs-bank-acct',b.account,'')}</div>
    </div>`);
}

function _bSecDataMgmt() {
  return _bSectionWrap('⚙', 'Import / Export / Reset', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <button onclick="bExportSettings()" style="background:#0EA5E9;color:#fff;border:none;border-radius:8px;padding:11px 16px;cursor:pointer;font-size:.85rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px"><i class="fa fa-download"></i> Export Settings</button>
      <label style="background:#10B981;color:#fff;border:none;border-radius:8px;padding:11px 16px;cursor:pointer;font-size:.85rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px">
        <i class="fa fa-upload"></i> Import Settings
        <input type="file" accept=".json" style="display:none" onchange="bImportSettings(this)">
      </label>
      <button onclick="bResetDefaults()" style="background:#F59E0B;color:#fff;border:none;border-radius:8px;padding:11px 16px;cursor:pointer;font-size:.85rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px"><i class="fa fa-undo"></i> Reset to Defaults</button>
      <button onclick="bWipeData()" style="background:#EF4444;color:#fff;border:none;border-radius:8px;padding:11px 16px;cursor:pointer;font-size:.85rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px"><i class="fa fa-trash-alt"></i> Wipe All Data</button>
    </div>
    <div style="font-size:.75rem;color:#94A3B8;margin-top:12px">Export saves all settings as JSON. Import merges JSON onto defaults. Wipe All removes all configured data.</div>`);
}

function bExportSettings() {
  const blob = new Blob([JSON.stringify(_BS, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'school-bill-settings.json'; a.click(); URL.revokeObjectURL(a.href);
}

function bImportSettings(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      _BS = bMerge(JSON.parse(JSON.stringify(BILL_DEFS)), data);
      saveBillS();
      _bRender();
      toast('Settings imported successfully', 'success');
    } catch(err) { toast('Invalid JSON file', 'danger'); }
  };
  reader.readAsText(file);
}

function bResetDefaults() {
  if (!confirm('Reset all billing settings to defaults? This cannot be undone.')) return;
  _BS = JSON.parse(JSON.stringify(BILL_DEFS));
  saveBillS(); _bRender();
  toast('Reset to defaults', 'info');
}

function bWipeData() {
  if (!confirm('Wipe all billing data? All amounts, school info, and bank details will be cleared.')) return;
  _BS = JSON.parse(JSON.stringify(BILL_DEFS));
  BILL_LEVELS.forEach(lv => {
    _BS.fees[lv].items.forEach(it => { it.amount = 0; });
    _BS.fees[lv].feeding = {'1':0,'2':0,'3':0};
  });
  _BS.transport.forEach(z => { Object.keys(z.fees).forEach(k => z.fees[k] = 0); });
  _BS.school = { name:'', subtitle:'', address:'', logo:null };
  _BS.bank = { name:'', branch:'', account:'', accountName:'' };
  _BS._blank = true;
  saveBillS();
  _billShowAdminWiz = true;
  _billWizStep = 0;
  _bRender();
}

// ─── LOGO UPLOAD HANDLERS ─────────────────────────────────────────────────────
function bHandleLogoDrop(e, target) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) bProcessLogoFile(file, target);
}

function bHandleLogoSelect(input) {
  const file = input.files[0];
  if (file) bProcessLogoFile(file, 'billing');
}

function bHandleWmImg(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 2*1024*1024) { toast('Image too large', 'warning'); return; }
  const r = new FileReader();
  r.onload = e => { bSet('watermark.image', e.target.result); _bRender(); };
  r.readAsDataURL(file);
}

function bProcessLogoFile(file, target) {
  if (!file.type.startsWith('image/')) { toast('Please select an image file', 'danger'); return; }
  if (file.size > 1.5*1024*1024) { toast('Image too large — max 1.5 MB', 'warning'); return; }
  const r = new FileReader();
  r.onload = e => { bSet('school.logo', e.target.result); _bRender(); };
  r.readAsDataURL(file);
}

function bRemoveBillLogo() { bSet('school.logo', null); _bRender(); }

// ─── SETUP WIZARD (6 steps) ───────────────────────────────────────────────────
function billOpenWizard() { _billShowWiz = true; _billWizStep = 0; _billShowAdminWiz = false; _bRender(); }

const BILL_WIZ_STEPS = [
  { title:'Welcome', sub:'School Bill Generator' },
  { title:'School Info', sub:'Step 2 of 6' },
  { title:'Address & Reopening', sub:'Step 3 of 6' },
  { title:'Bank Details', sub:'Step 4 of 6' },
  { title:'Term Setup', sub:'Step 5 of 6' },
  { title:"You're All Set!", sub:'Step 6 of 6' }
];

function _bWizardModal() {
  const step = _billWizStep;
  const total = BILL_WIZ_STEPS.length;
  const dots = Array.from({length:total},(_,i)=>`<div style="width:10px;height:10px;border-radius:50%;background:${i<step?'#0EA5E9':i===step?'#fff':'#374151'};transition:background .2s"></div>`).join('');

  let body = '';
  if (step === 0) {
    body = `<div style="text-align:center;padding:10px 0">
      <div style="font-size:3rem;margin-bottom:16px">📋</div>
      <h3 style="font-size:1.1rem;margin-bottom:10px;color:#0F172A">School Bill Generator</h3>
      <p style="color:#64748B;font-size:.88rem;line-height:1.6">Quickly generate, configure, and print term fee bills for your students. Bills are formatted for A4 printing — 2 bills per page with a cut-line.</p>
      <p style="color:#64748B;font-size:.85rem;margin-top:12px">Let's set up your school details in a few quick steps.</p>
    </div>`;
  } else if (step === 1) {
    body = `<h3 style="margin-bottom:16px">School Information</h3>
      <div style="margin-bottom:12px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">School Name *</label>
        <input id="bwiz-name" class="bwiz-inp" value="${_BS.school.name||''}" placeholder="e.g. St. Anne Catholic School"></div>
      <div style="margin-bottom:12px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Subtitle / Town</label>
        <input id="bwiz-sub" class="bwiz-inp" value="${_BS.school.subtitle||''}" placeholder="e.g. Nkontrodo, Elmina"></div>
      <div style="margin-bottom:12px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">School Logo (optional)</label>
        <label style="display:flex;flex-direction:column;align-items:center;border:2px dashed #E2E8F0;border-radius:10px;padding:14px;cursor:pointer;background:#F8FAFC;gap:4px;font-size:.8rem;color:#64748B" ondrop="bHandleLogoDrop(event,'billing')">
          ${_BS.school.logo?`<img src="${_BS.school.logo}" style="height:50px;object-fit:contain;margin-bottom:4px">`:'<i class="fa fa-cloud-upload-alt" style="font-size:1.3rem;color:#0EA5E9;margin-bottom:4px"></i>'}
          Click or drag to upload PNG/JPG
          <input type="file" accept="image/*" style="display:none" onchange="bHandleLogoSelect(this)">
        </label>
      </div>`;
  } else if (step === 2) {
    body = `<h3 style="margin-bottom:16px">Address & Reopening</h3>
      <div style="margin-bottom:12px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">School Address</label>
        <input id="bwiz-addr" class="bwiz-inp" value="${_BS.school.address||''}" placeholder="P.O. Box 58, Elmina, Central Region"></div>
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Reopening Date</label>
        <input id="bwiz-reopen" class="bwiz-inp" value="${_BS.academic.reopening||''}" placeholder="e.g. Monday, 7th September 2026"></div>`;
  } else if (step === 3) {
    body = `<h3 style="margin-bottom:16px">Bank Payment Details</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Bank Name</label><input id="bwiz-bank" class="bwiz-inp" value="${_BS.bank.name||''}" placeholder="GCB Bank Ltd"></div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Branch</label><input id="bwiz-branch" class="bwiz-inp" value="${_BS.bank.branch||''}" placeholder="Elmina Branch"></div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Account Name</label><input id="bwiz-aname" class="bwiz-inp" value="${_BS.bank.accountName||''}" placeholder="School Name"></div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Account Number</label><input id="bwiz-acct" class="bwiz-inp" value="${_BS.bank.account||''}" placeholder="1234567890"></div>
      </div>`;
  } else if (step === 4) {
    const a = _BS.academic;
    const tb = (v,l) => `<button onclick="bWizSetTerm('${v}')" style="flex:1;padding:8px;border:1.5px solid ${a.term===v?'#0EA5E9':'#E2E8F0'};background:${a.term===v?'#0EA5E9':'#fff'};color:${a.term===v?'#fff':'#64748B'};border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:600">${l}</button>`;
    body = `<h3 style="margin-bottom:16px">Term Setup</h3>
      <div style="margin-bottom:14px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:5px">Academic Year</label>
        <input id="bwiz-year" class="bwiz-inp" value="${a.year||'2025-2026'}" placeholder="2025-2026"></div>
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:8px">Current Term</label>
        <div style="display:flex;gap:8px">${tb('1','1st Term')}${tb('2','2nd Term')}${tb('3','3rd Term')}</div>
      </div>`;
  } else if (step === 5) {
    body = `<div style="text-align:center;padding:10px 0">
      <div style="font-size:3rem;margin-bottom:14px">✅</div>
      <h3 style="color:#0F172A;margin-bottom:10px">All Set!</h3>
      <p style="color:#64748B;font-size:.88rem;line-height:1.6">Your school billing is configured. You can update any settings at any time from the <strong>Settings & Fees</strong> tab.</p>
      <div style="background:#F0F9FF;border-radius:10px;padding:14px;margin-top:16px;text-align:left;font-size:.82rem">
        <div><strong>School:</strong> ${_BS.school.name||'—'}</div>
        <div><strong>Year:</strong> ${_BS.academic.year||'—'} &nbsp;·&nbsp; <strong>Term:</strong> ${_BS.academic.term==='1'?'1st':_BS.academic.term==='2'?'2nd':'3rd'}</div>
        <div><strong>Bank:</strong> ${_BS.bank.name||'—'}</div>
      </div>
    </div>`;
  }

  const isLast = step === total - 1;
  const isFirst = step === 0;
  return `<div style="position:fixed;inset:0;background:rgba(10,18,40,.8);backdrop-filter:blur(4px);z-index:2100;display:flex;align-items:center;justify-content:center;padding:20px">
    <div style="background:#fff;border-radius:18px;width:100%;max-width:520px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.4)">
      <div style="background:#0B1120;padding:22px 24px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="color:#fff;font-weight:700;font-size:1rem">${BILL_WIZ_STEPS[step].title}</div>
          <div style="color:#94A3B8;font-size:.78rem;margin-top:2px">${BILL_WIZ_STEPS[step].sub}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">${dots}
          <button onclick="_billShowWiz=false;_bRender()" style="background:none;border:none;color:#94A3B8;cursor:pointer;font-size:1.1rem;margin-left:10px">✕</button>
        </div>
      </div>
      <div style="padding:24px;max-height:70vh;overflow-y:auto">
        <style>.bwiz-inp{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;background:#F8FAFC;color:#0F172A;outline:none;box-sizing:border-box}</style>
        ${body}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #F1F5F9;display:flex;justify-content:space-between;align-items:center">
        <button onclick="bWizBack()" style="padding:9px 20px;border:1.5px solid #E2E8F0;border-radius:8px;background:#fff;cursor:pointer;font-size:.85rem;color:#64748B;visibility:${isFirst?'hidden':'visible'}">Back</button>
        <div style="display:flex;gap:8px">
          ${isFirst ? `<button onclick="_billShowWiz=false;_bRender()" style="padding:9px 20px;border:1.5px solid #E2E8F0;border-radius:8px;background:#fff;cursor:pointer;font-size:.85rem;color:#64748B">Skip</button>` : ''}
          <button onclick="${isLast?"_billShowWiz=false;_bRender()":"bWizNext()"}" style="padding:9px 24px;border:none;border-radius:8px;background:linear-gradient(135deg,#0EA5E9,#0284C7);color:#fff;cursor:pointer;font-size:.85rem;font-weight:600">${isLast?'Start Generating Bills →':'Next →'}</button>
        </div>
      </div>
    </div>
  </div>`;
}

function bWizSetTerm(v) { bSet('academic.term', v); _billForm1.term = v; _billForm2.term = v; _bRender(); }

function bWizNext() {
  const s = _billWizStep;
  if (s===1) {
    const n = document.getElementById('bwiz-name'); if (n) bSet('school.name', n.value);
    const sb = document.getElementById('bwiz-sub'); if (sb) bSet('school.subtitle', sb.value);
  } else if (s===2) {
    const a = document.getElementById('bwiz-addr'); if (a) bSet('school.address', a.value);
    const r = document.getElementById('bwiz-reopen'); if (r) bSet('academic.reopening', r.value);
  } else if (s===3) {
    const f = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    bSet('bank.name', f('bwiz-bank')); bSet('bank.branch', f('bwiz-branch'));
    bSet('bank.accountName', f('bwiz-aname')); bSet('bank.account', f('bwiz-acct'));
  } else if (s===4) {
    const y = document.getElementById('bwiz-year'); if (y) bSet('academic.year', y.value);
  }
  _billWizStep++;
  _bRender();
}

function bWizBack() { if (_billWizStep > 0) { _billWizStep--; _bRender(); } }

// ─── ADMIN SETUP WIZARD (7 steps) ─────────────────────────────────────────────
const BILL_AWIZ_STEPS = [
  { title:'Admin Setup', sub:'Configure from scratch' },
  { title:'School Info', sub:'Step 2 of 7' },
  { title:'Academic Year & Term', sub:'Step 3 of 7' },
  { title:'Bank Details', sub:'Step 4 of 7' },
  { title:'Transport Zones', sub:'Step 5 of 7' },
  { title:'Fee Amounts', sub:'Step 6 of 7' },
  { title:'Setup Complete!', sub:'Step 7 of 7' }
];

function _bAdminWizModal() {
  const step = _billWizStep;
  const total = BILL_AWIZ_STEPS.length;
  const dots = Array.from({length:total},(_,i)=>`<div style="width:8px;height:8px;border-radius:50%;background:${i<step?'#0EA5E9':i===step?'#fff':'#374151'}"></div>`).join('');

  let body = '';
  if (step === 0) {
    body = `<div style="text-align:center;padding:10px 0">
      <div style="font-size:2.5rem;margin-bottom:14px">🛠</div>
      <h3 style="margin-bottom:10px">Admin Setup</h3>
      <p style="color:#64748B;font-size:.85rem;line-height:1.65">Let's configure the bill generator from scratch. You'll set up:</p>
      <ol style="text-align:left;color:#64748B;font-size:.85rem;line-height:1.8;margin:14px 0 0 20px">
        <li>School name, address, logo</li><li>Academic year and current term</li>
        <li>Bank payment details</li><li>Transport zone fees</li><li>Fee amounts per class level</li>
      </ol>
    </div>`;
  } else if (step === 1) {
    body = `<h3 style="margin-bottom:14px">School Info</h3>
      <div style="margin-bottom:10px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">School Name</label><input id="bawiz-name" class="bwiz-inp" value="${_BS.school.name||''}"></div>
      <div style="margin-bottom:10px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Subtitle / Location</label><input id="bawiz-sub" class="bwiz-inp" value="${_BS.school.subtitle||''}"></div>
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Full Address</label><input id="bawiz-addr" class="bwiz-inp" value="${_BS.school.address||''}"></div>`;
  } else if (step === 2) {
    const a = _BS.academic;
    const tb = (v,l) => `<button onclick="bWizSetTerm('${v}')" style="flex:1;padding:7px;border:1.5px solid ${a.term===v?'#0EA5E9':'#E2E8F0'};background:${a.term===v?'#0EA5E9':'#fff'};color:${a.term===v?'#fff':'#64748B'};border-radius:8px;cursor:pointer;font-size:.8rem">${l}</button>`;
    body = `<h3 style="margin-bottom:14px">Academic Year & Term</h3>
      <div style="margin-bottom:12px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Academic Year</label><input id="bawiz-year" class="bwiz-inp" value="${a.year||'2025-2026'}"></div>
      <div style="margin-bottom:12px"><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:8px">Current Term</label><div style="display:flex;gap:8px">${tb('1','1st')}${tb('2','2nd')}${tb('3','3rd')}</div></div>
      <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Reopening Date</label><input id="bawiz-reopen" class="bwiz-inp" value="${a.reopening||''}" placeholder="e.g. Monday, 7th September 2026"></div>`;
  } else if (step === 3) {
    body = `<h3 style="margin-bottom:14px">Bank Details</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Bank Name</label><input id="bawiz-bank" class="bwiz-inp" value="${_BS.bank.name||''}"></div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Branch</label><input id="bawiz-branch" class="bwiz-inp" value="${_BS.bank.branch||''}"></div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Account Name</label><input id="bawiz-aname" class="bwiz-inp" value="${_BS.bank.accountName||''}"></div>
        <div><label style="display:block;font-size:.75rem;font-weight:600;color:#64748B;margin-bottom:4px">Account No.</label><input id="bawiz-acct" class="bwiz-inp" value="${_BS.bank.account||''}"></div>
      </div>`;
  } else if (step === 4) {
    const zones = _BS.transport.filter(z=>z.id!=='none');
    const lvHdr = ['Cr','Nur','KG','LP','UP','JHS'];
    const lvKeys = BILL_LEVELS;
    body = `<h3 style="margin-bottom:14px">Transport Zones</h3>
      <div style="overflow-x:auto;font-size:.8rem">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#F8FAFC">
            <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #E2E8F0;font-size:.72rem;color:#64748B">Zone</th>
            ${lvHdr.map(h=>`<th style="padding:6px 8px;text-align:center;border-bottom:2px solid #E2E8F0;font-size:.72rem;color:#64748B">${h}</th>`).join('')}
          </tr></thead>
          <tbody>${zones.map((z,zi)=>`<tr>
            <td style="padding:5px 8px;border-bottom:1px solid #F1F5F9;font-weight:500">${z.label}</td>
            ${lvKeys.map(lk=>`<td style="padding:5px 8px;border-bottom:1px solid #F1F5F9;text-align:center">
              <input type="number" value="${z.fees[lk]||0}" oninput="bTransportUpdate(${zi},'${lk}',+this.value)" style="width:55px;border:1px solid #E2E8F0;border-radius:5px;padding:3px;font-size:.78rem;text-align:center">
            </td>`).join('')}
          </tr>`).join('')}</tbody>
        </table>
      </div>`;
  } else if (step === 5) {
    body = `<h3 style="margin-bottom:12px">Fee Amounts per Level</h3>
      <div style="overflow-x:auto;font-size:.8rem">
        ${BILL_LEVELS.map(lv => {
          const lvd = _BS.fees[lv];
          return `<div style="margin-bottom:16px">
            <div style="font-weight:700;color:${BILL_LVC[lv]};margin-bottom:6px">${BILL_LVL[lv]}</div>
            ${lvd.items.map((it,idx)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
              <span style="flex:1;font-size:.8rem;color:#334155">${it.label}</span>
              <input type="number" value="${it.amount}" oninput="bFeeItemUpdate('${lv}',${idx},'amount',+this.value)" style="width:80px;border:1px solid #E2E8F0;border-radius:6px;padding:4px 6px;font-size:.8rem;text-align:right">
              <span style="font-size:.72rem;color:#94A3B8;min-width:50px">${it.terms==='all'?'All':it.terms==='1'?'T1':it.terms==='2'?'T2':'T3'}</span>
            </div>`).join('')}
            <div style="font-size:.75rem;color:#64748B;margin-top:4px">Feeding: T1=<input type="number" value="${lvd.feeding['1']||0}" oninput="bFeedingUpdate('${lv}','1',+this.value)" style="width:60px;border:1px solid #E2E8F0;border-radius:4px;padding:2px 4px;font-size:.75rem"> T2=<input type="number" value="${lvd.feeding['2']||0}" oninput="bFeedingUpdate('${lv}','2',+this.value)" style="width:60px;border:1px solid #E2E8F0;border-radius:4px;padding:2px 4px;font-size:.75rem"> T3=<input type="number" value="${lvd.feeding['3']||0}" oninput="bFeedingUpdate('${lv}','3',+this.value)" style="width:60px;border:1px solid #E2E8F0;border-radius:4px;padding:2px 4px;font-size:.75rem"></div>
          </div>`;
        }).join('')}
      </div>`;
  } else if (step === 6) {
    body = `<div style="text-align:center;padding:10px 0">
      <div style="font-size:3rem;margin-bottom:14px">🎉</div>
      <h3 style="margin-bottom:10px">Setup Complete!</h3>
      <p style="color:#64748B;font-size:.88rem;line-height:1.6">Your billing system is fully configured. Generate bills for your students right now.</p>
    </div>`;
  }

  const isLast = step === total - 1;
  const isFirst = step === 0;
  return `<div style="position:fixed;inset:0;background:rgba(10,18,40,.85);backdrop-filter:blur(4px);z-index:2100;display:flex;align-items:center;justify-content:center;padding:20px">
    <div style="background:#fff;border-radius:18px;width:100%;max-width:560px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.4);max-height:90vh;display:flex;flex-direction:column">
      <div style="background:#0B1120;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
        <div>
          <div style="color:#fff;font-weight:700;font-size:1rem">${BILL_AWIZ_STEPS[step].title}</div>
          <div style="color:#94A3B8;font-size:.78rem;margin-top:2px">${BILL_AWIZ_STEPS[step].sub}</div>
        </div>
        <div style="display:flex;align-items:center;gap:5px">${dots}
          <button onclick="_billShowAdminWiz=false;_bRender()" style="background:none;border:none;color:#94A3B8;cursor:pointer;font-size:1.1rem;margin-left:10px">✕</button>
        </div>
      </div>
      <div style="padding:22px;overflow-y:auto;flex:1">
        <style>.bwiz-inp{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;background:#F8FAFC;color:#0F172A;outline:none;box-sizing:border-box}</style>
        ${body}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #F1F5F9;display:flex;justify-content:space-between;flex-shrink:0">
        <button onclick="bAdminWizBack()" style="padding:9px 20px;border:1.5px solid #E2E8F0;border-radius:8px;background:#fff;cursor:pointer;font-size:.85rem;color:#64748B;visibility:${isFirst?'hidden':'visible'}">Back</button>
        <button onclick="${isLast?"_billShowAdminWiz=false;_BS._blank=false;saveBillS();_bRender()":"bAdminWizNext()"}" style="padding:9px 24px;border:none;border-radius:8px;background:linear-gradient(135deg,#0EA5E9,#0284C7);color:#fff;cursor:pointer;font-size:.85rem;font-weight:600">${isLast?'Start Generating Bills →':'Next →'}</button>
      </div>
    </div>
  </div>`;
}

function bAdminWizNext() {
  const g = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
  const s = _billWizStep;
  if (s===1) { bSet('school.name',g('bawiz-name')); bSet('school.subtitle',g('bawiz-sub')); bSet('school.address',g('bawiz-addr')); }
  else if (s===2) { bSet('academic.year',g('bawiz-year')); bSet('academic.reopening',g('bawiz-reopen')); }
  else if (s===3) { bSet('bank.name',g('bawiz-bank')); bSet('bank.branch',g('bawiz-branch')); bSet('bank.accountName',g('bawiz-aname')); bSet('bank.account',g('bawiz-acct')); }
  _billWizStep++;
  _bRender();
}

function bAdminWizBack() { if (_billWizStep > 0) { _billWizStep--; _bRender(); } }
