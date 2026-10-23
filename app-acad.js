/* PlayIn365 — الدفعة ٢: الأكاديمية الكاملة · القمع · الاختبارات البدنية · مالك الملاعب · ERP */
const AC={};

/* ── الاختبارات البدنية المعتمدة (بنية تقرير مدارس الرياض) ── */
AC.TESTS=[
  {k:"h_w",   ar:"الطول والوزن",   en:"Height & Weight", unit:"سم / كجم", why:"متابعة النمو الجسدي", groups:"كل الفئات"},
  {k:"phv",   ar:"PHV — النضج البيولوجي", en:"PHV", unit:"سنة", why:"مرحلة النمو وتوقيت الحمل", groups:"U12+"},
  {k:"cmj",   ar:"CMJ — القفز العمودي", en:"CMJ", unit:"سم", why:"القدرة الانفجارية للجزء السفلي", groups:"U14+"},
  {k:"t505",  ar:"5-0-5 — تغيير الاتجاه", en:"5-0-5", unit:"ث", why:"القدرة على تغيير الاتجاه", groups:"U14+"},
  {k:"s20",   ar:"سباق 20م", en:"20m Sprint", unit:"ث", why:"السرعة القصوى", groups:"U16+"},
  {k:"ift",   ar:"30-15 IFT", en:"30-15 IFT", unit:"كم/س", why:"التحمل المتقطع", groups:"U16+"}
];
AC.tkey=(org,p,k)=>`pi_test_${org}_${p}_${k}`;
AC.getTest=(org,p,k)=>{try{return localStorage.getItem(AC.tkey(org,p,k))||""}catch(e){return ""}};
window.acTest=(org,p,k,ar,unit)=>{
  const cur=AC.getTest(org,p,k);
  const v=prompt(`${ar} — ${p}\nالوحدة: ${unit}\nاكتب القيمة (واتركها فارغة للحذف):`,cur);
  if(v===null)return;
  try{v.trim()?localStorage.setItem(AC.tkey(org,p,k),v.trim()):localStorage.removeItem(AC.tkey(org,p,k))}catch(e){}
  trans(`قياس ${ar} — ${p}: ${v.trim()||"حُذف"}`);
  toast(v.trim()?"سُجّل القياس باسمك ووقته":"حُذف القياس");
  render();
};

/* ── قمع المواهب ── */
AC.funnel=(att,subs,pf,mt,ev,org)=>{
  const joined=new Set(pf.filter(p=>p.org===org&&p.role==="player").map(p=>p.name));
  const attNames=new Set(att.map(a=>a.player_name));
  attNames.forEach(n=>joined.add(n));
  const active=new Set(att.filter(a=>{const d=(Date.now()-new Date(a.created_at))/864e5;return d<=21}).map(a=>a.player_name));
  const verified=new Set(ev.filter(e=>attNames.has(e.who)).map(e=>e.who));
  const moved=new Set(); // انتقال يُسجّل من غرفة التعاقدات
  return [
    {ar:"التحق",  n:joined.size,   c:"#151a2e", d:"مسجّل في الجهة"},
    {ar:"نشط",   n:active.size,   c:"#4636e3", d:"حضور موثق في ٢١ يومًا"},
    {ar:"موثّق",  n:verified.size, c:"#c78c00", d:"له أحداث مباريات موثقة"},
    {ar:"انتقل",  n:moved.size,    c:"#2c6e49", d:"عبر غرفة التعاقدات"}
  ];
};

/* ══════════ الأكاديمية الكاملة ══════════ */
T.acad=async()=>{
  const org=ME.org||"أكاديميتي";
  const [att,subs,pf,mt,ev]=await Promise.all([
    q("att",sb.from("attendance").select("*").eq("org",org).order("created_at",{ascending:false}).limit(400)),
    q("subs",sb.from("subscriptions").select("*").eq("org",org)),
    q("pf",sb.from("profiles").select("id,name,role,org,pos,age").limit(300)),
    q("mt",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(50)),
    q("ev",sb.from("match_events").select("who,type,match_id,recorded_by,created_at").limit(400))
  ]);
  const players=[...new Set(att.map(a=>a.player_name))];
  const groups=[...new Set(att.map(a=>a.group_name).filter(Boolean))];
  const g0=(()=>{try{return localStorage.getItem("pi_grp_"+org)||groups[0]||"U18"}catch(e){return groups[0]||"U18"}})();
  const todayStr=new Date().toISOString().slice(0,10);
  const doneToday=new Set(att.filter(a=>a.session_date===todayStr).map(a=>a.player_name));
  const funnel=AC.funnel(att,subs,pf,mt,ev,org);
  const paid=subs.filter(s=>s.paid),due=subs.filter(s=>!s.paid);
  const sum=a=>a.reduce((t,s)=>t+(+s.amount||0),0);
  const grpPlayers=players.filter(p=>att.some(a=>a.player_name===p&&(a.group_name||"U18")===g0));
  const mxF=Math.max(...funnel.map(f=>f.n),1);

  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b style="font-size:16px;color:#f5c518">${esc(org)}</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:600;margin-top:4px">${N(players.length)} لاعبًا · ${N(groups.length||1)} مجموعة · ${N(att.length)} حصة موثقة</span></div>
      <button class="btn gold" style="width:auto;padding:9px 15px;border-radius:999px;font-size:11px;flex:none" onclick="go('reports')">التقارير ←</button>
    </div>
  </div>

  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">قمع المواهب — من الالتحاق إلى الانتقال</b>
    <div style="display:flex;flex-direction:column;gap:9px">
      ${funnel.map((f,i)=>`<div style="display:grid;grid-template-columns:58px 1fr 42px;gap:10px;align-items:center">
        <span style="font-size:11.5px;font-weight:900;color:${f.c}">${f.ar}</span>
        <div style="height:26px;background:#f6f3ec;border-radius:9px;overflow:hidden;position:relative">
          <div style="width:${Math.max(6,f.n/mxF*100)}%;height:100%;background:${f.c};border-radius:9px;opacity:${1-i*0.06}"></div>
        </div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:15px;color:${f.c};text-align:end">${f.n}</b>
        <span></span><span class="muted" style="grid-column:2/4;margin-top:-4px">${esc(f.d)}</span></div>`).join("")}
    </div>
    <span class="muted" style="display:block;margin-top:10px">كل رقم من نشاط موثق — لا تقديرات. «انتقل» يُحتسب من غرفة التعاقدات حين تُسجَّل الصفقة.</span>
  </div>

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#4636e3">حضور اليوم — بنقرة</b>
      <span style="background:#efedff;color:#4636e3;border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:900">${N(doneToday.size)}/${N(grpPlayers.length)} حاضر</span>
    </div>
    ${groups.length>1?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:11px">${groups.map(g=>`<button onclick="acGrp('${esc(org)}','${esc(g)}')" style="background:${g===g0?"#4636e3":"#faf8f3"};color:${g===g0?"#fff":"#565d78"};border:1px solid ${g===g0?"#4636e3":"#e9e4d8"};border-radius:999px;padding:7px 15px;font:900 11px Cairo;cursor:pointer">${esc(g)}</button>`).join("")}</div>`:""}
    ${grpPlayers.length?`<div style="display:flex;flex-direction:column;gap:7px">
      ${grpPlayers.map(p=>{const on=doneToday.has(p);
        return `<div style="display:flex;align-items:center;gap:11px;background:${on?"#f2f8f5":"#faf8f3"};border:1px solid ${on?"#d8e6de":"#e9e4d8"};border-radius:15px;padding:10px 12px">
        <span style="width:34px;height:34px;border-radius:50% 50% 50% 9px;background:${on?"linear-gradient(160deg,#2c6e49,#1d4a3e)":"linear-gradient(160deg,#4636e3,#2a2260)"};color:#fff;display:grid;place-items:center;font-weight:900;font-size:13px;flex:none">${esc(p[0])}</span>
        <b style="flex:1;min-width:0;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p)}</b>
        ${on?`<span style="color:#2c6e49;font-weight:900;font-size:11px;flex:none">حاضر ✓</span>`
            :`<button class="btn" style="width:auto;padding:8px 15px;border-radius:999px;font-size:10.5px;flex:none" onclick="acMark('${esc(org)}','${esc(g0)}','${esc(p)}')">سجّل</button>`}</div>`}).join("")}
    </div>`:`<div style="border:1.5px dashed #d5d0c4;border-radius:15px;padding:16px;text-align:center"><span class="muted">لا لاعبين في هذه المجموعة بعد</span></div>`}
    <button class="btn ghost" style="margin-top:10px" onclick="acAddPlayer('${esc(org)}','${esc(g0)}')">+ أضف لاعبًا للمجموعة</button>
  </div>

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <b class="h2" style="color:#4636e3">الاختبارات البدنية</b>
      <span class="muted">اضغط أي خلية لتسجيل القياس</span>
    </div>
    ${grpPlayers.length?`<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
      <table style="border-collapse:separate;border-spacing:0;width:100%;min-width:520px">
        <thead><tr>
          <th style="text-align:start;font-size:10px;font-weight:900;color:#8a8fa5;padding:0 8px 8px;position:sticky;inset-inline-start:0;background:#fff">اللاعب</th>
          ${AC.TESTS.map(t=>`<th style="font-size:9.5px;font-weight:900;color:#565d78;padding:0 6px 8px;text-align:center;white-space:nowrap">${esc(t.en)}<span style="display:block;font-size:8px;color:#b0aa9c;font-weight:700">${esc(t.unit)}</span></th>`).join("")}
        </tr></thead>
        <tbody>${grpPlayers.slice(0,10).map(p=>`<tr>
          <td style="font-size:11px;font-weight:800;padding:5px 8px;position:sticky;inset-inline-start:0;background:#fff;white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis">${esc(p)}</td>
          ${AC.TESTS.map(t=>{const v=AC.getTest(org,p,t.k);
            return `<td style="padding:3px 4px;text-align:center"><button onclick="acTest('${esc(org)}','${esc(p)}','${t.k}','${esc(t.ar)}','${esc(t.unit)}')" style="width:100%;min-width:52px;background:${v?"#efedff":"#faf8f3"};border:1px solid ${v?"#c9c2f5":"#e9e4d8"};border-radius:9px;padding:8px 4px;font:800 11px 'Space Grotesk';color:${v?"#4636e3":"#c9c2b2"};cursor:pointer" class="ltr">${v||"—"}</button></td>`}).join("")}
        </tr>`).join("")}</tbody>
      </table></div>
      <div style="display:flex;flex-direction:column;gap:5px;margin-top:11px">
        ${AC.TESTS.map(t=>`<span class="muted" style="line-height:1.7"><b style="color:#565d78">${esc(t.en)}</b> — ${esc(t.why)} · ${esc(t.groups)}</span>`).join("")}
      </div>`:`<div style="border:1.5px dashed #d5d0c4;border-radius:15px;padding:16px;text-align:center"><span class="muted">أضف لاعبين لتظهر جداول القياس</span></div>`}
    <div class="note" style="margin-top:11px">كل قياس يحمل اسم من سجّله ووقته في سجل الشفافية. ولا يُنشر رقم بلا وحدة وتاريخ ومصدر.</div>
  </div>

  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">التحصيل والاشتراكات</b>
    <div class="stat3" style="margin-bottom:12px">
      <div class="stat"><b style="color:#2c6e49">${sum(paid).toLocaleString("en")}</b><span class="muted">محصّل ر.س</span></div>
      <div class="stat"><b style="color:${due.length?"#a83b25":"#2c6e49"}">${sum(due).toLocaleString("en")}</b><span class="muted">متأخر ر.س</span></div>
      <div class="stat"><b style="color:#4636e3">${subs.length?Math.round(paid.length/subs.length*100):0}%</b><span class="muted">نسبة التحصيل</span></div>
    </div>
    ${subs.length?subs.slice(0,8).map(s=>`<div class="lrow">
      <span class="ic" style="background:${s.paid?"#e9f0ea":"#fff6d6"};color:${s.paid?"#2c6e49":"#c78c00"}">${s.paid?"✓":"◔"}</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(s.player_name)}</b><span class="muted" style="display:block">${esc(s.group_name||"")} · <span class="ltr">${esc(s.month)}</span> · <span class="ltr">${N(s.amount)}</span> ر.س</span></div>
      ${s.paid?`<span style="color:#2c6e49;font-weight:900;font-size:10.5px;flex:none">مدفوع</span>`:`<button class="btn" style="width:auto;padding:7px 13px;border-radius:999px;font-size:10px;flex:none" onclick="acPay('${s.id}','${esc(s.player_name)}')">حصّل</button>`}</div>`).join(""):`<div style="border:1.5px dashed #d5d0c4;border-radius:15px;padding:16px;text-align:center"><span class="muted">لا اشتراكات مسجّلة</span></div>`}
    <div class="note" style="margin-top:10px">نموذجك: اشتراك و٠٪ <b>أو</b> بلا اشتراك و٤٪ — تختار واحدًا كل موسم، والنسبة معلنة قبل أي تحصيل.</div>
  </div>
  </main>`;
};
window.acGrp=(org,g)=>{try{localStorage.setItem("pi_grp_"+org,g)}catch(e){};render()};
window.acMark=async(org,grp,p)=>{
  const {error}=await sb.from("attendance").insert({org,group_name:grp,session_date:new Date().toISOString().slice(0,10),player_name:p,present:true,recorded_by:ME.name});
  if(error) return toast("تعذّر التسجيل: "+error.message,1);
  await trans(`تسجيل حضور — ${p} (${grp})`);
  toast("سُجّل وانعكس فورًا — باسمك ووقته"); render();
};
window.acAddPlayer=async(org,grp)=>{
  const n=prompt("اسم اللاعب الجديد في المجموعة "+grp+":");
  if(!n||!n.trim())return;
  const {error}=await sb.from("attendance").insert({org,group_name:grp,session_date:new Date().toISOString().slice(0,10),player_name:n.trim(),present:true,recorded_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إضافة لاعب للمجموعة ${grp} — ${n.trim()}`);
  toast("أُضيف وسُجّل حضوره اليوم"); render();
};
window.acPay=async(id,name)=>{
  const {error}=await sb.from("subscriptions").update({paid:true,paid_at:new Date().toISOString()}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`تحصيل اشتراك — ${name}`);
  toast("حُصّل — والقيد باسمك في السجل"); render();
};

/* ══════════ مالك الملاعب ══════════ */
T.venue=async()=>{
  const org=ME.org||"ملعبي";
  const bk=await q("bk",sb.from("bookings").select("*").eq("venue",org).order("created_at",{ascending:false}));
  const free=bk.filter(b=>b.status==="free"),req=bk.filter(b=>b.status==="requested"),paidB=bk.filter(b=>b.status==="paid"||b.status==="accepted");
  const rev=paidB.reduce((s,b)=>s+(+b.price||0),0);
  const occ=bk.length?Math.round(paidB.length/bk.length*100):0;
  const HOURS=["16:00","17:00","18:00","19:00","20:00","21:00","22:00"];
  const DAYS=["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];
  const cellState=(d,h)=>{
    const hit=bk.find(b=>(b.slot||"").includes(h));
    if(!hit) return {bg:"#f6f3ec",fg:"#c9c2b2",t:"—",title:"غير مجدول"};
    if(hit.status==="paid"||hit.status==="accepted") return {bg:"#4636e3",fg:"#fff",t:"●",title:"محجوز: "+(hit.who||"")};
    if(hit.status==="requested") return {bg:"#fff6d6",fg:"#c78c00",t:"◔",title:"طلب: "+(hit.who||"")};
    return {bg:"#e9f0ea",fg:"#2c6e49",t:"○",title:"شاغر"};
  };
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b style="font-size:16px;color:#f5c518">${esc(org)}</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:600;margin-top:4px">${N(paidB.length)} ساعة محجوزة · ${N(free.length)} شاغرة · ${N(req.length)} طلبًا</span></div>
      <button class="btn gold" style="width:auto;padding:9px 15px;border-radius:999px;font-size:11px;flex:none" onclick="go('reports')">التقارير ←</button>
    </div>
  </div>
  <div class="stat3">
    <div class="stat"><b style="color:#4636e3">${occ}%</b><span class="muted">نسبة الإشغال</span></div>
    <div class="stat"><b style="color:#2c6e49">${rev.toLocaleString("en")}</b><span class="muted">إيراد ر.س</span></div>
    <div class="stat"><b style="color:#c78c00">${N(req.length)}</b><span class="muted">طلب معلّق</span></div>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">شبكة الإشغال — الأسبوع</b>
    <div style="overflow-x:auto"><table style="border-collapse:separate;border-spacing:3px;width:100%;min-width:430px">
      <thead><tr><th style="width:52px"></th>${HOURS.map(h=>`<th style="font-size:8.5px;font-weight:900;color:#8a8fa5;padding-bottom:4px" class="ltr">${h}</th>`).join("")}</tr></thead>
      <tbody>${DAYS.map(d=>`<tr>
        <td style="font-size:10px;font-weight:900;color:#565d78;white-space:nowrap;padding-inline-end:5px">${d}</td>
        ${HOURS.map(h=>{const c=cellState(d,h);return `<td><div title="${esc(c.title)}" style="height:28px;background:${c.bg};color:${c.fg};border-radius:7px;display:grid;place-items:center;font-size:11px;font-weight:900">${c.t}</div></td>`}).join("")}
      </tr>`).join("")}</tbody></table></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:11px">
      <span class="muted" style="color:#4636e3">● محجوز</span><span class="muted" style="color:#c78c00">◔ طلب معلّق</span><span class="muted" style="color:#2c6e49">○ شاغر</span><span class="muted">— غير مجدول</span></div>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">الطلبات — معاملة تجارية بقرارك</b>
    ${req.length?req.map(b=>`<div class="lrow">
      <span class="ic">◔</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(b.who)}</b><span class="muted" style="display:block"><span class="ltr">${esc(b.slot)}</span>${b.price?" · "+N(b.price)+" ر.س":""}</span></div>
      <div style="display:flex;gap:5px;flex:none">
        <button class="btn" style="width:auto;padding:7px 12px;border-radius:999px;font-size:10px" onclick="vnAct('${b.id}','paid','${esc(b.who)}')">اقبل</button>
        <button class="btn ghost" style="width:auto;padding:7px 12px;border-radius:999px;font-size:10px" onclick="vnAct('${b.id}','free','${esc(b.who)}')">ارفض</button></div></div>`).join(""):`<div style="border:1.5px dashed #d5d0c4;border-radius:15px;padding:16px;text-align:center"><span class="muted">لا طلبات معلّقة</span></div>`}
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:9px">أضف ساعة شاغرة</b>
    <button class="btn" onclick="vnAddSlot('${esc(org)}')">+ ساعة جديدة للحجز</button>
  </div>
  <div class="note">الحجز معاملة تجارية بينك وبين العميل — المنصة توثّقها ولا تفرض قرارًا. نِسب المنصة: تذاكر ومنتج رقمي ١٥–٢٠٪ · بضاعة ٨–١٠٪.</div>
  </main>`;
};
window.vnAct=async(id,st,who)=>{
  const {error}=await sb.from("bookings").update({status:st}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(st==="paid"?`قبول حجز — ${who}`:`رفض حجز — ${who}`);
  toast(st==="paid"?"قُبل الحجز وانعكس فورًا":"رُفض الطلب وعادت الساعة شاغرة"); render();
};
window.vnAddSlot=async(org)=>{
  const s=prompt("وصف الساعة (مثال: الخميس 19:00–20:00):");
  if(!s||!s.trim())return;
  const p=prompt("السعر بالريال:","150");
  const {error}=await sb.from("bookings").insert({venue:org,slot:s.trim(),who:"مفتوح",status:"free",price:+p||0});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إضافة ساعة شاغرة — ${s.trim()}`);
  toast("أُضيفت وظهرت في الاستكشاف"); render();
};

/* ══════════ ERP — ديوان المنظمة ══════════ */
T.erp=async()=>{
  const org=ME.org||"";
  const [pf,subs,tr,att]=await Promise.all([
    q("pf",sb.from("profiles").select("id,name,role,org,age").limit(300)),
    q("subs",sb.from("subscriptions").select("*").eq("org",org)),
    q("tr",sb.from("transparency").select("*").order("created_at",{ascending:false}).limit(30)),
    q("att",sb.from("attendance").select("player_name,recorded_by,created_at").eq("org",org).limit(200))
  ]);
  const members=pf.filter(p=>p.org===org);
  const paid=subs.filter(s=>s.paid),due=subs.filter(s=>!s.paid);
  const sum=a=>a.reduce((t,s)=>t+(+s.amount||0),0);
  const budget=sum(subs)||1, collected=sum(paid);
  const minors=members.filter(m=>m.age&&m.age<18).length;
  const PERMS=[
    ["إنشاء مباراة وتسجيل أحداثها","مدرب · منظم · حكم","#4636e3"],
    ["تسجيل الحضور والتحصيل","إداري · مدرب","#4636e3"],
    ["الاطلاع على الملف الطبي","الطبي فقط 🔒","#1d4a3e"],
    ["نشر تقرير لأولياء الأمور","إداري · مدرب","#c78c00"],
    ["تصحيح إدخال في السجل","المنظم صاحب القيد","#e8531f"],
    ["تعديل نسبة المنصة","قرار مجلس — لا زر","#8a8fa5"]
  ];
  return `<main>
  <div style="background:#f4f6f8;border:1px solid #d9dfe5;border-radius:12px;padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
      <div><b style="font-size:15px;color:#243244">ديوان ${esc(org||"المنظمة")}</b>
        <span style="display:block;font-size:11.5px;color:#5a6a7c;font-weight:600;margin-top:3px">الطبقة الإدارية الرسمية — كل قرار باسمه وتاريخه</span></div>
      <span style="background:#fff;border:1px solid #d9dfe5;color:#5a6a7c;border-radius:8px;padding:5px 12px;font-size:10px;font-weight:800">سطح رسمي</span>
    </div>
  </div>

  <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:16px 18px">
    <b style="font-size:13px;color:#243244;display:block;margin-bottom:12px">الأعضاء</b>
    <div class="stat3">
      <div class="stat" style="border-radius:10px"><b style="color:#243244">${N(members.length)}</b><span class="muted">عضوًا</span></div>
      <div class="stat" style="border-radius:10px"><b style="color:#4636e3">${N(members.filter(m=>m.role==="player").length)}</b><span class="muted">لاعبًا</span></div>
      <div class="stat" style="border-radius:10px"><b style="color:#c78c00">${N(minors)}</b><span class="muted">تحت ١٨</span></div>
    </div>
    ${minors?`<div style="background:#fff6d6;border:1px solid #f0e2b4;border-radius:10px;padding:10px 12px;margin-top:11px;font-size:10.5px;font-weight:700;color:#8a6a1e;line-height:1.75">${N(minors)} عضوًا تحت الثامنة عشرة — كل طلب يخصهم يمرّ بموافقة ولي الأمر الفردية، ولا مراسلة مباشرة.</div>`:""}
  </div>

  <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:16px 18px">
    <b style="font-size:13px;color:#243244;display:block;margin-bottom:12px">المالية</b>
    <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;margin-bottom:7px"><span style="color:#5a6a7c">المحصّل من المستهدف</span><span class="ltr" style="color:#243244">${collected.toLocaleString("en")} / ${budget.toLocaleString("en")} ر.س</span></div>
    <div style="height:11px;background:#eef1f4;border-radius:99px;overflow:hidden"><div style="width:${Math.min(100,Math.round(collected/budget*100))}%;height:100%;background:${collected/budget>=.7?"#2c6e49":"#c78c00"};border-radius:99px"></div></div>
    ${due.length?`<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px">${due.slice(0,4).map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;background:#f9fafb;border:1px solid #e6eaee;border-radius:9px;padding:8px 11px"><span style="font-size:11px;font-weight:700;color:#243244">${esc(s.player_name)}</span><span class="ltr" style="font-size:10.5px;font-weight:800;color:#a83b25">${N(s.amount)} ر.س متأخر</span></div>`).join("")}</div>`:`<div style="margin-top:11px;font-size:10.5px;font-weight:700;color:#2c6e49">لا متأخرات ✓</div>`}
  </div>

  <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:16px 18px">
    <b style="font-size:13px;color:#243244;display:block;margin-bottom:12px">مصفوفة الصلاحيات</b>
    <div style="display:flex;flex-direction:column;gap:7px">
      ${PERMS.map(([act,who,c])=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;background:#f9fafb;border:1px solid #e6eaee;border-radius:9px;padding:9px 11px">
        <span style="font-size:11px;font-weight:700;color:#243244;flex:1;min-width:0">${esc(act)}</span>
        <span style="font-size:10px;font-weight:800;color:${c};flex:none;text-align:end">${esc(who)}</span></div>`).join("")}
    </div>
    <div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:10px;padding:10px 12px;margin-top:11px;font-size:10.5px;font-weight:700;color:#1d4a3e;line-height:1.75">قاعدة صلبة: الملف الطبي حصري للمختص الطبي — والكشافون محجوبون عنه دائمًا، وكل اطّلاع مسجَّل.</div>
  </div>

  <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:16px 18px">
    <b style="font-size:13px;color:#243244;display:block;margin-bottom:12px">سجل القرارات</b>
    ${tr.length?`<div style="display:flex;flex-direction:column;gap:7px">${tr.slice(0,8).map(t=>`<div style="display:flex;gap:10px;background:#f9fafb;border:1px solid #e6eaee;border-radius:9px;padding:9px 11px">
      <span style="width:5px;border-radius:99px;background:#4636e3;flex:none"></span>
      <div style="flex:1;min-width:0"><b style="font-size:11px;color:#243244;display:block">${esc(t.action)}</b>
        <span style="font-size:9.5px;font-weight:700;color:#8a95a3">${esc(t.actor)} · <span class="ltr">${new Date(t.created_at).toLocaleString("en-GB")}</span></span></div></div>`).join("")}</div>`:`<span class="muted">لا قرارات بعد</span>`}
    <div style="margin-top:11px;font-size:10.5px;font-weight:700;color:#5a6a7c;line-height:1.75">قراءة فقط — حتى للإدارة. لا اعتماد ولا اعتراض: القرار ينعكس فورًا، والتصحيح باسم صاحبه.</div>
  </div>
  </main>`;
};

/* ── التركيب ── */
(function(){
  Object.assign(TITLES,{erp:"ديوان المنظمة",acad:"الأكاديمية",venue:"الملعب"});
  if(NAV.academy) NAV.academy=[["⌂","الأكاديمية","acad"],["▶","مبارياتنا","orgMatch"],["FAB","","newMatch"],["◈","الديوان","erp"],["▤","تقارير","reports"]];
  if(NAV.venue) NAV.venue=[["⌂","الملعب","venue"],["◎","استكشف","explore"],["FAB","","venue"],["◈","الديوان","erp"],["▤","تقارير","reports"]];
  if(NAV.admin) NAV.admin=[["⌂","النبض","admin"],["◈","الديوان","erp"],["FAB","","newMatch"],["◎","السوق","market"],["▤","تقارير","reports"]];
})();
