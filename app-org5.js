/* PlayIn365 — المسابقات: دوري أو بطولة بعدد فرق حقيقي.
   السقوط الذي أُصلح: اختيار «دوري» أو «بطولة» كان يفتح نفس نموذج المباراة الودية —
   حقلا فريقين فقط. فصار للدوري والبطولة مسارهما: قائمة فرق · صيغة · جدول يُولَّد وحده.
   والترتيب لا يُدخل يدويًا في أي حال — يُحسب من النتائج الموقَّعة بحكمها. */
const CP = {};
CP.dash = "—";
CP.FMT = {
  rr:     {ar:"دوري ذهاب",        ex:"كل فريق يلاقي الآخر مرة",         min:4},
  rr2:    {ar:"ذهاب وعودة",       ex:"كل فريق يلاقي الآخر مرتين",       min:4},
  groups: {ar:"مجموعات ثم إقصاء", ex:"مجموعات من أربعة، ثم يتأهّل اثنان", min:6},
  ko:     {ar:"خروج المغلوب",     ex:"دور واحد — الخاسر يخرج",          min:4}
};
CP.MO = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
CP.dt = s => { if(!s) return CP.dash; const d = new Date(s); if(isNaN(d)) return esc(String(s).slice(0,10));
  return '<span class="ltr">'+d.getDate()+'</span> '+CP.MO[d.getMonth()]; };
CP.plus = (iso, days) => { const d = new Date(iso); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
CP.GRP = ["أ","ب","ج","د","هـ","و","ز","ح"];

/* ═══ حالة النموذج ═══ */
CP.mk    = () => { try{ return JSON.parse(localStorage.getItem("pi_newcomp_"+(ME&&ME.id))||"{}"); }catch(e){ return {}; } };
CP.setMk = o => { try{ localStorage.setItem("pi_newcomp_"+(ME&&ME.id), JSON.stringify(Object.assign(CP.mk(),o))); }catch(e){} };
CP.teams = () => { const t = CP.mk().teams; return Array.isArray(t)?t:[]; };
window.cpSet = (k,v) => { CP.setMk({[k]:v}); if(k!=="name"&&k!=="venue") render(); };
window.cpAddTeam = () => {
  const el = document.getElementById("cp_team"); if(!el) return;
  const raw = String(el.value||"").split(/[\n,،]/).map(s=>s.trim()).filter(Boolean);
  if(!raw.length) return toast("اكتب اسم الفريق",1);
  const cur = CP.teams(), add = raw.filter(t=>cur.indexOf(t)<0);
  if(!add.length) return toast("الفريق مضاف أصلًا",1);
  CP.setMk({teams:cur.concat(add)});
  el.value = ""; render();
};
window.cpDelTeam = i => { const t = CP.teams().slice(); t.splice(i,1); CP.setMk({teams:t}); render(); };

/* ═══ توليد الجدول — دوري الروبن بطريقة الدائرة ═══ */
CP.rr = list => {
  const t = list.slice(); if(t.length % 2) t.push(null);
  const n = t.length, rounds = [];
  for(let r=0; r<n-1; r++){
    const pairs = [];
    for(let i=0; i<n/2; i++){
      const a = t[i], b = t[n-1-i];
      if(a && b) pairs.push(r%2 ? [b,a] : [a,b]);
    }
    rounds.push(pairs);
    t.splice(1, 0, t.pop());
  }
  return rounds;
};
CP.fixtures = (fmt, list) => {
  if(fmt==="ko"){
    const p = []; for(let i=0; i<list.length-1; i+=2) p.push([list[i], list[i+1]]);
    return [{grp:null, rounds:[p]}];
  }
  if(fmt==="groups"){
    const g = [], size = 4, out = [];
    for(let i=0; i<list.length; i+=size) g.push(list.slice(i, i+size));
    if(g.length>1 && g[g.length-1].length<3){ const last = g.pop(); last.forEach((t,i)=>g[i%g.length].push(t)); }
    g.forEach((names,i)=>out.push({grp:CP.GRP[i]||String(i+1), rounds:CP.rr(names)}));
    return out;
  }
  const one = CP.rr(list);
  const rounds = fmt==="rr2" ? one.concat(one.map(r=>r.map(([a,b])=>[b,a]))) : one;
  return [{grp:null, rounds}];
};

/* ═══ الإنشاء ═══ */
window.cpCreate = async () => {
  const m = CP.mk(), list = CP.teams();
  const nameEl = document.getElementById("cp_name"), vnEl = document.getElementById("cp_venue");
  const name = String((nameEl?nameEl.value:m.name)||"").trim();
  const venue = String((vnEl?vnEl.value:m.venue)||"").trim();
  const fmt = m.format || "rr";
  const F = CP.FMT[fmt];
  if(!name) return toast("اكتب اسم المسابقة",1);
  if(list.length < F.min) return toast(`${F.ar} يحتاج ${F.min} فرق على الأقل — عندك ${list.length}`,1);
  if(!m.date) return toast("اختر تاريخ أول جولة",1);
  const time = m.time || "18:00";

  const btn = document.getElementById("cp_go");
  if(btn){ btn.disabled = true; btn.textContent = "يُولَّد الجدول…"; }

  const blocks = CP.fixtures(fmt, list);
  const rows = []; let maxR = 0;
  blocks.forEach(b => b.rounds.forEach((pairs, ri) => {
    const rn = ri+1; maxR = Math.max(maxR, rn);
    const date = CP.plus(m.date, ri*7);
    pairs.forEach(([a,b2]) => rows.push({
      title:`${a} × ${b2}`, team_a:a, team_b:b2, comp:name, venue:venue||null,
      match_date:date, match_time:time, status:"open", organizer_name:ME.name,
      round:rn, grp:b.grp, duration_min:+m.dur||90, halves:2, slots:+m.slots||14, fee:0
    }));
  }));

  const ends = CP.plus(m.date, (maxR-1)*7);
  const tour = {name, org:ME.name, scope:"local", state:"soon", teams:list.length, reg_open:false,
    starts_at:m.date, ends_at:ends, format:fmt, fee_team:+m.fee||null, venue:venue||null,
    day_time:time, created_by:ME.name};
  const t1 = await sb.from("pi_tours").insert(tour);
  if(t1.error){ if(btn){btn.disabled=false;} return toast("تعذّر إنشاء المسابقة: "+t1.error.message,1); }

  const t2 = await sb.from("pi_comp_teams").insert(list.map((t,i)=>({
    comp:name, team:t, added_by:ME.name,
    grp:(blocks.find(b=>b.rounds.some(r=>r.some(p=>p.indexOf(t)>=0)))||{}).grp||null
  })));
  if(t2.error) toast("سُجّلت المسابقة — وتعذّر حفظ قائمة الفرق: "+t2.error.message,1);

  const t3 = await sb.from("matches").insert(rows);
  if(t3.error){ if(btn){btn.disabled=false;} return toast("أُنشئت المسابقة — وتعذّر توليد الجدول: "+t3.error.message,1); }

  await trans(`أنشأ ${F.ar} «${name}» بـ${list.length} فرق وولّد ${rows.length} مباراة في ${maxR} جولات`);
  try{ localStorage.removeItem("pi_newcomp_"+ME.id); }catch(e){}
  toast(`أُنشئت — ${rows.length} مباراة في ${maxR} جولات`);
  go("compRoom", name);
};

/* ═══ الترتيب من النتائج لا من الإدخال ═══ */
CP.stand = (teams, ms) => {
  const R = {}; teams.forEach(t=>R[t]={team:t, grp:null, played:0, won:0, drew:0, lost:0, gf:0, ga:0});
  ms.forEach(m=>{
    if(m.status!=="final" || m.score_a==null || m.score_b==null) return;
    const A = R[m.team_a], B = R[m.team_b]; if(!A || !B) return;
    const sa = +m.score_a, sbv = +m.score_b;
    A.played++; B.played++; A.gf+=sa; A.ga+=sbv; B.gf+=sbv; B.ga+=sa;
    if(m.grp){ A.grp = A.grp||m.grp; B.grp = B.grp||m.grp; }
    if(sa>sbv){ A.won++; B.lost++; } else if(sa<sbv){ B.won++; A.lost++; } else { A.drew++; B.drew++; }
  });
  return Object.values(R);
};
CP.initial = n => { const w = String(n||"").replace(/^ال/,"").trim(); return w[0] || "◈"; };
CP.pts = r => r.won*3 + r.drew;
CP.gd  = r => r.gf - r.ga;
CP.order = rows => rows.slice().sort((a,b)=>CP.pts(b)-CP.pts(a) || CP.gd(b)-CP.gd(a) || b.gf-a.gf || String(a.team).localeCompare(b.team,"ar"));

/* ═══ نموذج الإنشاء ═══ */
CP.form = () => {
  const m = CP.mk(), list = CP.teams(), fmt = m.format || "rr", F = CP.FMT[fmt];
  const enough = list.length >= F.min;
  const blocks = enough ? CP.fixtures(fmt, list) : [];
  const nMatch = blocks.reduce((a,b)=>a + b.rounds.reduce((x,r)=>x+r.length,0), 0);
  const nRound = blocks.reduce((a,b)=>Math.max(a, b.rounds.length), 0);
  const L = t => `<span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:5px">${t}</span>`;
  const IN = (id,k,ph,type,val) => `<input id="${id}" value="${ORG.esn(val==null?(m[k]||""):val)}" oninput="CP.setMk({${k}:this.value})" ${type?`type="${type}"`:""} ${type==="number"||type==="date"||type==="time"?'class="ltr"':""} placeholder="${ph}" style="width:100%;box-sizing:border-box;border:1px solid #e9e4d8;border-radius:12px;padding:11px;font:700 12px ${type==="number"?"'Space Grotesk'":"Cairo"};background:#faf8f3;color:#151a2e">`;
  const ready = (m.name||"") && enough && m.date;

  return `
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ORG.disc()}
      <div style="position:relative">
        <span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">${F.ar}</span>
        <b style="display:block;font-size:19px;font-weight:900;margin-top:4px;line-height:1.35;color:${m.name?"#f5c518":"#8a93b0"}">${m.name?esc(m.name):"اسم المسابقة"}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:6px;line-height:1.9">
          <span class="ltr">${list.length||CP.dash}</span> فريقًا${enough?` · <span class="ltr">${nMatch}</span> مباراة في <span class="ltr">${nRound}</span> جولات`:` · يحتاج <span class="ltr">${F.min}</span> على الأقل`}<br>
          ${m.venue?"◎ "+esc(m.venue):"بلا ملعب بعد"}${m.date?` · تبدأ ${CP.dt(m.date)} <span class="ltr">${esc(m.time||"18:00")}</span>`:" · بلا تاريخ"}
        </span>
      </div></div>

    ${ORG.card(`${ORG.h("الصيغة")}${ORG.sub(F.ex)}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px">
        ${Object.entries(CP.FMT).map(([k,v])=>`<button onclick="cpSet('format','${k}')" style="background:${fmt===k?"#4636e3":"#faf8f3"};color:${fmt===k?"#fff":"#5b6078"};border:1px solid ${fmt===k?"#4636e3":"#e9e4d8"};border-radius:12px;padding:11px 8px;font:900 11px Cairo;cursor:pointer;text-align:start;line-height:1.5">${v.ar}<span style="display:block;font-size:9px;font-weight:700;opacity:.75;margin-top:2px">من <span class="ltr">${v.min}</span> فرق</span></button>`).join("")}
      </div>`)}

    ${ORG.card(`${ORG.h("اسم المسابقة")}
      <div style="margin-top:10px">${IN("cp_name","name","دوري أحياء الرياض — خريف ٢٠٢٦")}</div>`)}

    ${ORG.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ORG.h("الفرق المشاركة")}
        <b class="ltr" style="font-family:'Space Grotesk';font-size:15px;color:${enough?"#4636e3":"#8a8fa5"}">${list.length||CP.dash}</b></div>
      ${ORG.sub("اكتب اسم الفريق واضغط أضف — أو الصق أسماء مفصولة بفاصلة أو بسطر")}
      <div style="display:flex;gap:7px;margin-top:11px">
        <input id="cp_team" placeholder="النخبة" onkeydown="if(event.key==='Enter'){event.preventDefault();cpAddTeam()}" style="flex:1;min-width:0;border:1px solid #e9e4d8;border-radius:12px;padding:11px;font:700 12px Cairo;background:#faf8f3;color:#151a2e">
        <button onclick="cpAddTeam()" style="flex:none;background:#4636e3;color:#fff;border:0;border-radius:12px;padding:0 16px;font:900 11.5px Cairo;cursor:pointer">أضف</button></div>
      ${list.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:11px">
        ${list.map((t,i)=>`<span style="display:flex;align-items:center;gap:7px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:999px;padding:6px 7px 6px 12px;font:900 10.5px Cairo;color:#151a2e">
          ${esc(t)}<button onclick="cpDelTeam(${i})" style="width:19px;height:19px;flex:none;border:0;border-radius:50%;background:#fff;color:#a83b25;font:900 11px Cairo;cursor:pointer;line-height:1">×</button></span>`).join("")}
      </div>`:ORG.empty("لا فرق بعد — أضف أول فريق")}
      ${list.length && list.length%2 && fmt!=="ko" ? `<div style="margin-top:10px;background:#fff6d6;border:1px solid #f0e2b4;border-radius:12px;padding:10px 12px;font-size:10.5px;font-weight:800;color:#8a6912;line-height:1.8">عددهم فردي — فريق يستريح في كل جولة، وهذا مثبَت في الجدول لا خطأ فيه.</div>`:""}
      ${fmt==="ko" && list.length%2 ? `<div style="margin-top:10px;background:#fff6d6;border:1px solid #f0e2b4;border-radius:12px;padding:10px 12px;font-size:10.5px;font-weight:800;color:#8a6912;line-height:1.8">خروج المغلوب بعدد فردي يترك فريقًا بلا مواجهة في الدور الأول — أضف فريقًا أو احذف واحدًا.</div>`:""}`)}

    ${ORG.card(`${ORG.h("الملعب والبداية")}
      <div style="margin-top:10px">${L("الملعب")}${IN("cp_venue","venue","ملعب المروج")}</div>
      <div style="display:grid;grid-template-columns:1fr 110px;gap:8px;margin-top:11px">
        <div>${L("تاريخ أول جولة")}${IN("cp_date","date","","date")}</div>
        <div>${L("الوقت")}${IN("cp_time","time","","time",m.time||"18:00")}</div></div>
      ${ORG.sub("الجولات تتوالى أسبوعيًا من هذا التاريخ — وكل مباراة تُنقل بموعدها وحدها لاحقًا")}`)}

    ${ORG.card(`${ORG.h("رسم مشاركة الفريق")}
      <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div>${L("للفريق (ر.س)")}${IN("cp_fee","fee","0","number",m.fee||"")}</div>
        <div>${L("مقاعد المباراة")}${IN("cp_slots","slots","14","number",m.slots||14)}</div></div>
      ${+m.fee?ORG.sub(`المحصَّل المتوقّع <span class="ltr">${(+m.fee*list.length).toLocaleString("en")}</span> ر.س من <span class="ltr">${list.length}</span> فرق`):ORG.sub("بلا رسم — لا تسوية مالية")}`)}

    ${enough?ORG.card(`${ORG.h("معاينة الجدول")}
      ${ORG.sub(`${nMatch} مباراة · ${nRound} جولة${blocks.length>1?` · ${blocks.length} مجموعات`:""}`)}
      <div style="margin-top:11px;display:flex;flex-direction:column;gap:9px">
        ${blocks.slice(0,2).map(b=>`<div>
          ${b.grp?`<span style="display:block;font-size:10px;font-weight:900;color:#4636e3;margin-bottom:6px">المجموعة ${esc(b.grp)}</span>`:""}
          ${b.rounds.slice(0,2).map((pairs,ri)=>`<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:13px;padding:10px 12px;margin-bottom:6px">
            <span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:6px">الجولة <span class="ltr">${ri+1}</span> · ${CP.dt(CP.plus(m.date||new Date().toISOString().slice(0,10), ri*7))}</span>
            ${pairs.map(([a,b2])=>`<span style="display:block;font-size:11px;font-weight:800;color:#151a2e;line-height:1.9">${esc(a)} <span style="color:#8a8fa5">×</span> ${esc(b2)}</span>`).join("")}
          </div>`).join("")}
        </div>`).join("")}
        ${nRound>2?`<span style="font-size:10px;font-weight:800;color:#8a8fa5">وبقيّة الجولات تُولَّد معها</span>`:""}
      </div>`):""}

    <button id="cp_go" onclick="cpCreate()" style="background:${ready?"#4636e3":"#e9e4d8"};color:${ready?"#fff":"#8a8fa5"};border:0;border-radius:14px;padding:15px;font:900 13.5px Cairo;cursor:pointer;${ready?"box-shadow:0 8px 18px rgba(70,54,227,.3)":""}">＋ أنشئ المسابقة وولّد الجدول</button>
    ${ORG.note("الجدول يُولَّد مرة واحدة وتبقى كل مباراة قابلة للنقل بموعدها. الترتيب لا يُدخل يدويًا أبدًا — يُحسب من النتائج الموقَّعة بحكمها، والتصحيح باسم من صحّحه في سجل الشفافية.")}`;
};

/* ═══ أنشئ — مباراة أو مسابقة ═══ */
ORG._nm2 = T.newMatch;
T.newMatch = async () => {
  if(!ME || ME.role!=="organizer") return ORG._nm2 ? ORG._nm2() : "";
  const one = (ORG.mk().kind || "ودية");
  const isComp = one==="دوري" || one==="بطولة";
  if(!isComp) return ORG._nm2();
  return ORG.top("أنشئ مسابقة", one==="دوري"?"فرق وجدول — لا مباراة بفريقين":"مجموعات وإقصاء")
    + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">${CP.switcher(one)}${CP.form()}</main>`;
};
CP.switcher = kind => `<div style="display:flex;gap:6px;background:#f0ece2;border-radius:14px;padding:4px">
  ${[["ودية","مباراة واحدة"],["دوري","دوري أو بطولة"]].map(([k,lb])=>{
    const on = (k==="دوري") === (kind==="دوري"||kind==="بطولة");
    return `<button onclick="nmSet('kind','${k}')" style="flex:1;background:${on?"#fff":"transparent"};color:${on?"#151a2e":"#8a8fa5"};border:0;border-radius:11px;padding:10px;font:900 11.5px Cairo;cursor:pointer;${on?"box-shadow:0 1px 3px rgba(21,26,46,.1)":""}">${lb}</button>`;
  }).join("")}</div>`;

/* ═══ مسابقاتي ═══ */
CP.load = async () => {
  const me = ME.name;
  const [tours, ms, tm] = await Promise.all([
    q("cp_t", sb.from("pi_tours").select("*").limit(200)),
    q("cp_m", sb.from("matches").select("*").limit(500)),
    q("cp_ct", sb.from("pi_comp_teams").select("*").limit(600))
  ]);
  const mine = (tours||[]).filter(t => !t.team && String(t.scope||"local")!=="official" && (t.created_by===me || t.org===me));
  return {mine, ms:ms||[], tm:tm||[]};
};
CP.teamsOf = (D, name) => {
  const reg = D.tm.filter(t=>t.comp===name).map(t=>t.team);
  if(reg.length) return reg;
  const ms = D.ms.filter(m=>m.comp===name);
  return [...new Set(ms.flatMap(m=>[m.team_a,m.team_b]).filter(Boolean))];
};
CP.stateOf = t => {
  const s = String(t.state||"").toLowerCase();
  if(s==="live") return ["جارية","#e8531f","#fdeee8"];
  if(s==="done") return ["انتهت","#2c6e49","#e9f0ea"];
  if(s==="open") return ["التسجيل مفتوح","#4636e3","#efedff"];
  return ["لم تبدأ","#8a8fa5","#f2f0ea"];
};

T.comps = async () => {
  const D = await CP.load();
  return ORG.top("مسابقاتي","دورياتك وبطولاتك وجداولها") + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <button onclick="nmSet('kind','دوري')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:14px;font:900 12.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.28)">＋ أنشئ دوريًا أو بطولة</button>
    ${D.mine.length?D.mine.map(t=>{
      const teams = CP.teamsOf(D, t.name);
      const ms = D.ms.filter(m=>m.comp===t.name);
      const done = ms.filter(m=>m.status==="final").length;
      const next = ms.filter(m=>m.status!=="final").sort((a,b)=>String(a.match_date||"").localeCompare(String(b.match_date||"")))[0];
      const [lb,c,bg] = CP.stateOf(t);
      const F = CP.FMT[t.format] || null;
      const pct = ms.length ? Math.round(done/ms.length*100) : 0;
      return `<button onclick="go('compRoom','${ORG.esn(t.name)}')" style="text-align:start;background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:16px;cursor:pointer;font-family:Cairo;display:flex;flex-direction:column;gap:11px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <div style="min-width:0">
            <b style="display:block;font-size:13.5px;font-weight:900;color:#151a2e;line-height:1.5">${esc(t.name)}</b>
            <span style="display:block;font-size:10.5px;font-weight:700;color:#8a8fa5;margin-top:4px;line-height:1.8">${F?F.ar:"مسابقة"} · <span class="ltr">${teams.length||CP.dash}</span> فريقًا${t.venue?" · "+esc(t.venue):""}</span></div>
          <span style="flex:none;background:${bg};color:${c};border-radius:999px;padding:5px 11px;font-size:9.5px;font-weight:900">${lb}</span></div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:5px">
            <span>مباريات انتهت</span><span class="ltr">${done}/${ms.length||CP.dash}</span></div>
          <div style="height:7px;border-radius:99px;background:#f0ece2;overflow:hidden"><span style="display:block;height:100%;width:${pct}%;background:#4636e3;border-radius:99px"></span></div></div>
        <span style="font-size:10px;font-weight:800;color:#565d78">${next?`الجولة القادمة ${CP.dt(next.match_date)} — ${esc(next.team_a)} × ${esc(next.team_b)}`:ms.length?"كل الجولات انتهت":"لا جدول بعد"}</span>
      </button>`;
    }).join(""):`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:24px 18px;text-align:center">
      <b style="display:block;font-size:13px;font-weight:900;color:#151a2e">لا مسابقة باسمك بعد</b>
      <span style="display:block;font-size:11px;font-weight:700;color:#8a8fa5;line-height:1.85;margin-top:7px">الدوري ليس مباراة بفريقين — أنشئ مسابقة، أضف فرقها، ويُولَّد جدولها كاملًا.</span></div>`}
    ${ORG.note("كل مسابقة مقيَّدة باسمك منظّمًا مسؤولًا. والترتيب فيها محسوب من النتائج الموقَّعة بحكمها — لا يُدخل يدويًا.")}
  </main>`;
};

/* ═══ غرفة المسابقة ═══ */
CP.tab = () => { try{ return localStorage.getItem("pi_cp_tab")||"table"; }catch(e){ return "table"; } };
window.cpTab = t => { try{ localStorage.setItem("pi_cp_tab",t); }catch(e){} render(); };

T.compRoom = async () => {
  const D = await CP.load();
  const name = (typeof PARAM!=="undefined" && PARAM) || (D.mine[0]||{}).name;
  if(!name) return T.comps();
  const t = D.mine.find(x=>x.name===name) || {name};
  const teams = CP.teamsOf(D, name);
  const ms = D.ms.filter(m=>m.comp===name);
  const F = CP.FMT[t.format] || null;
  const rows = CP.stand(teams, ms);
  const anyFinal = ms.some(m=>m.status==="final" && m.score_a!=null);
  const grps = [...new Set(ms.map(m=>m.grp).filter(Boolean))].sort();
  const tab = CP.tab();
  const [lb,c,bg] = CP.stateOf(t);
  const liveNow = ms.some(m=>m.status==="live");
  const qual = t.format==="groups" ? 2 : 0;

  const table = g => {
    const src = g ? rows.filter(r=>r.grp===g) : rows;
    const ord = CP.order(src);
    return `<div style="overflow-x:auto">
      <table style="border-collapse:separate;border-spacing:0 4px;width:100%;min-width:392px">
        <thead><tr>
          <th style="text-align:start;font-size:9.5px;font-weight:900;color:#8a8fa5;padding:0 8px 6px">الفريق</th>
          ${["ل","ف","ت","خ","+/−","ن"].map(h=>`<th style="font-size:9.5px;font-weight:900;color:#8a8fa5;padding:0 5px 6px;text-align:center">${h}</th>`).join("")}
        </tr></thead>
        <tbody>${ord.map((r,i)=>{
          const up = qual && i<qual;
          return `<tr style="background:${up?"#f6f5ff":"#faf8f3"}">
            <td style="padding:9px 8px;border-radius:0 10px 10px 0"><span style="display:flex;align-items:center;gap:8px">
              <span class="ltr" style="width:19px;height:19px;flex:none;border-radius:6px;background:${up?"#4636e3":"#e9e4d8"};color:${up?"#fff":"#8a8fa5"};display:grid;place-items:center;font:700 10px 'Space Grotesk'">${i+1}</span>
              <b style="font-size:11.5px">${esc(r.team)}</b>${up?`<span style="font-size:9px;font-weight:900;color:#4636e3">يتأهّل</span>`:""}</span></td>
            ${[r.played,r.won,r.drew,r.lost,(CP.gd(r)>0?"+":"")+CP.gd(r),CP.pts(r)].map((v,j)=>`<td class="ltr" style="text-align:center;padding:9px 5px;font:${j===5?"700 13px":"600 11.5px"} 'Space Grotesk';color:${j===5?"#4636e3":"#565d78"};${j===5?"border-radius:10px 0 0 10px":""}">${v}</td>`).join("")}
          </tr>`;
        }).join("")}</tbody></table></div>`;
  };

  const roundList = () => {
    const rs = [...new Set(ms.map(m=>+m.round||0))].sort((a,b)=>a-b);
    if(!ms.length) return ORG.empty("لا جدول — المسابقة بلا مباريات مولَّدة");
    return rs.map(rn=>{
      const list = ms.filter(m=>(+m.round||0)===rn).sort((a,b)=>String(a.grp||"").localeCompare(String(b.grp||""),"ar"));
      const date = (list[0]||{}).match_date;
      return `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:18px;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
          <b style="font-size:12px;font-weight:900;color:#151a2e">${rn?`الجولة <span class="ltr">${rn}</span>`:"مباريات بلا جولة"}</b>
          <span style="font-size:10px;font-weight:800;color:#8a8fa5">${CP.dt(date)}</span></div>
        <div style="display:flex;flex-direction:column;gap:7px">
        ${list.map(m=>{
          const fin = m.status==="final" && m.score_a!=null;
          const S = ORG.ST[m.status] || ["مفتوحة","#4636e3"];
          const sc = fin ? `${esc(m.team_a)} <span class="ltr" style="font-family:'Space Grotesk';font-weight:700;color:#4636e3">${+m.score_a}</span> <span style="color:#8a8fa5">×</span> <span class="ltr" style="font-family:'Space Grotesk';font-weight:700;color:#4636e3">${+m.score_b}</span> ${esc(m.team_b)}`
            : `${esc(m.team_a)} <span style="color:#8a8fa5">×</span> ${esc(m.team_b)}`;
          return `<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:13px;padding:10px 12px;display:flex;align-items:center;gap:10px">
            <div style="flex:1;min-width:0">
              <b style="display:block;font-size:11.5px;font-weight:900;color:#151a2e;line-height:1.6">${sc}</b>
              <span style="display:block;font-size:9.5px;font-weight:800;color:#8a8fa5;margin-top:3px">${m.grp?`المجموعة ${esc(m.grp)} · `:""}<span class="ltr">${esc(m.match_time||"")}</span>${m.referee_name?" · الحكم "+esc(m.referee_name):" · بلا حكم"}</span></div>
            ${fin?`<span style="flex:none;background:#e9f0ea;color:#2c6e49;border-radius:999px;padding:4px 10px;font-size:9px;font-weight:900">انتهت</span>`
                 :`<span style="flex:none;background:${m.status==="live"?"#fdeee8":"#efedff"};color:${S[1]};border-radius:999px;padding:4px 10px;font-size:9px;font-weight:900">${S[0]}</span>`}
          </div>`;
        }).join("")}</div></div>`;
    }).join("");
  };

  const TABS = [["table","الترتيب"],["fix","الجدول"],["teams","الفرق"]];
  return ORG.top(name.length>22?name.slice(0,22)+"…":name, F?F.ar:"مسابقة", `<button onclick="go('comps')" style="width:40px;height:40px;border-radius:${ORG.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">←</button>`)
  + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ORG.disc(liveNow)}
      <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="min-width:0">
          <b style="display:block;font-size:15px;font-weight:900;color:#f5c518;line-height:1.5">${esc(name)}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:6px;line-height:1.9">
            <span class="ltr">${teams.length||CP.dash}</span> فريقًا · <span class="ltr">${ms.length||CP.dash}</span> مباراة · انتهت <span class="ltr">${ms.filter(m=>m.status==="final").length}</span><br>
            ${t.starts_at?`من ${CP.dt(t.starts_at)}`:""}${t.ends_at?` إلى ${CP.dt(t.ends_at)}`:""}${t.venue?" · ◎ "+esc(t.venue):""}</span></div>
        <span style="flex:none;background:${liveNow?"#e8531f":"rgba(255,255,255,.12)"};color:#fff;border-radius:999px;padding:5px 11px;font-size:9.5px;font-weight:900">${liveNow?"مباراة مباشرة الآن":lb}</span></div></div>

    <div style="display:flex;gap:6px;background:#f0ece2;border-radius:14px;padding:4px">
      ${TABS.map(([k,t2])=>`<button onclick="cpTab('${k}')" style="flex:1;background:${tab===k?"#fff":"transparent"};color:${tab===k?"#151a2e":"#8a8fa5"};border:0;border-radius:11px;padding:10px;font:900 11.5px Cairo;cursor:pointer;${tab===k?"box-shadow:0 1px 3px rgba(21,26,46,.1)":""}">${t2}</button>`).join("")}</div>

    ${tab==="table" ? (anyFinal
      ? (grps.length
          ? grps.map(g=>ORG.card(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px"><b style="font-size:13px;font-weight:900;color:#4636e3">المجموعة ${esc(g)}</b><span style="font-size:9.5px;font-weight:800;color:#8a8fa5">لعب · فائز · تعادل · خاسر · فارق · نقاط</span></div>${table(g)}`)).join("")
          : ORG.card(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">${ORG.h("الترتيب")}<span style="font-size:9.5px;font-weight:800;color:#8a8fa5">لعب · فائز · تعادل · خاسر · فارق · نقاط</span></div>${table(null)}`))
      : ORG.card(`${ORG.h("لا ترتيب بعد")}${ORG.sub("الترتيب يُحسب من النتائج الموقَّعة بحكمها — يظهر فور إقفال أول مباراة. ولا يُدخل يدويًا في أي حال.")}
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:11px">${teams.slice(0,12).map(x=>`<span style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:999px;padding:6px 12px;font:900 10.5px Cairo;color:#565d78">${esc(x)}</span>`).join("")}</div>`))
     : tab==="fix" ? `<div style="display:flex;flex-direction:column;gap:10px">${roundList()}</div>`
     : ORG.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ORG.h("الفرق")}<b class="ltr" style="font-family:'Space Grotesk';font-size:15px;color:#4636e3">${teams.length||CP.dash}</b></div>
        <div style="display:flex;flex-direction:column;gap:7px;margin-top:11px">
        ${teams.length?teams.map(x=>{
          const reg = D.tm.find(r=>r.comp===name && r.team===x);
          const played = ms.filter(m=>(m.team_a===x||m.team_b===x) && m.status==="final").length;
          return `<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:13px;padding:11px 12px;display:flex;align-items:center;gap:10px">
            ${ORG.ic(esc(CP.initial(x)))}
            <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;font-weight:900;color:#151a2e">${esc(x)}</b>
              <span style="display:block;font-size:9.5px;font-weight:800;color:#8a8fa5;margin-top:2px">${reg&&reg.grp?`المجموعة ${esc(reg.grp)} · `:""}لعب <span class="ltr">${played}</span>${reg?` · أضافه ${esc(reg.added_by)}`:""}</span></div>
          </div>`;
        }).join(""):ORG.empty("لا فرق مسجَّلة")}</div>`)}

    ${ORG.note("النتيجة توقّعها الحكم في مباراتها، والترتيب يتحرّك وحده بعدها. لا زرّ هنا يعدّل نتيجة أو ترتيبًا — والتصحيح باسم من صحّحه في سجل الشفافية.")}
  </main>`;
};

(function(){
  Object.assign(TITLES, {comps:"مسابقاتي", compRoom:"غرفة المسابقة"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE, {
    comps:["مسابقاتي","دورياتك وبطولاتك وجداولها"],
    compRoom:["غرفة المسابقة","ترتيب وجدول وفرق"]
  });
  if(typeof ORG!=="undefined"){ ["comps","compRoom"].forEach(v=>{ if(ORG.OWN.indexOf(v)<0) ORG.OWN.push(v); }); }
  if(typeof HUB!=="undefined"){
    if(HUB.ROLE.organizer && !HUB.ROLE.organizer.some(a=>a[2]==="comps"))
      HUB.ROLE.organizer.splice(2, 0, ["♛","مسابقاتي","comps","#fff6d6","#c78c00"]);
    if(HUB.ROLE_OK.organizer) HUB.ROLE_OK.organizer.push("comps","compRoom");
  }
  if(typeof NAV!=="undefined" && NAV.organizer)
    NAV.organizer = [["◉","ملفي","orgMe"],["♛","مسابقاتي","comps"],["FAB","","hub"],["●","المباشر","orgLive"],["☰","مهامي","orgTasks"]];
  /* غرفة البطولة القديمة تقرأ صفوف ترتيب تُدخل يدويًا — تُوجَّه إلى مسابقاتك */
  const _tn = T.tournament;
  T.tournament = async () => (ME && ME.role==="organizer") ? T.comps() : (_tn ? _tn() : "");
})();
window.CP = CP;
