/* PlayIn365 — الدفعة ٧: مسار المدرب — الحصص ومخططها · مكتبة التمارين · لوحة الفريق · اللوحة التكتيكية · سلسلة الثقة (بلا اعتماد) */
const CH={};

/* ── مكتبة التمارين: مصنّفة بالغرض والفئة ── */
CH.DRILLS=[
  {k:"press",ar:"ضغط عالٍ — 3 ضد 2",aim:"tactic",min:20,grp:"U15+",d:"استعادة الكرة في الثلث الأخير بضغط منظم"},
  {k:"rondo",ar:"روندو 5 ضد 2",aim:"tech",min:15,grp:"كل الفئات",d:"سرعة التمرير تحت ضغط ورفع الرأس"},
  {k:"transition",ar:"تحوّل سريع — 4 ضد 3",aim:"tactic",min:18,grp:"U14+",d:"الانتقال من الدفاع للهجوم في ٦ ثوان"},
  {k:"finish",ar:"إنهاء من العرضيات",aim:"tech",min:20,grp:"U13+",d:"التمركز داخل المنطقة والإنهاء بلمسة"},
  {k:"speed",ar:"تسارع ٢٠م × ٦",aim:"phys",min:12,grp:"U16+",d:"القدرة على التسارع القصوى — يقاس بسباق ٢٠م"},
  {k:"cod",ar:"تغيير اتجاه — مكوك",aim:"phys",min:14,grp:"U14+",d:"مرتبط باختبار 5-0-5"},
  {k:"recover",ar:"استشفاء ومرونة",aim:"recover",min:25,grp:"كل الفئات",d:"بعد المباريات — حمل خفيف"},
  {k:"gk",ar:"حراسة — تصدٍّ وتوزيع",aim:"tech",min:20,grp:"حرّاس",d:"ردة الفعل والتوزيع الأول"}
];
CH.AIM={tactic:{ar:"تكتيكي",c:"#4636e3"},tech:{ar:"مهاري",c:"#c78c00"},phys:{ar:"بدني",c:"#e8531f"},recover:{ar:"استشفاء",c:"#2c6e49"}};

/* ── مخطط الحصة المحلي (يبقى مع المدرب) ── */
CH.pkey=()=>`pi_plan_${ME.id}`;
CH.dateKey=()=>`pi_plan_date_${ME.id}`;
CH.timeKey=()=>`pi_plan_time_${ME.id}`;
CH.today=()=>typeof CO!=="undefined"&&CO.today?CO.today():new Date().toISOString().slice(0,10);
CH.date=()=>{try{const v=localStorage.getItem(CH.dateKey())||"";return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:CH.today()}catch(e){return CH.today()}};
CH.time=()=>{try{const v=localStorage.getItem(CH.timeKey())||"";return /^\d{2}:\d{2}$/.test(v)?v:"18:00"}catch(e){return "18:00"}};
window.chDate=v=>{if(/^\d{4}-\d{2}-\d{2}$/.test(String(v||"")))try{localStorage.setItem(CH.dateKey(),v)}catch(e){}};
window.chTime=v=>{if(/^\d{2}:\d{2}$/.test(String(v||"")))try{localStorage.setItem(CH.timeKey(),v)}catch(e){}};
CH.plan=()=>{try{return JSON.parse(localStorage.getItem(CH.pkey())||"[]")}catch(e){return []}};
CH.setPlan=p=>{try{localStorage.setItem(CH.pkey(),JSON.stringify(p))}catch(e){}};
window.chAdd=k=>{const d=CH.DRILLS.find(x=>x.k===k);if(!d)return;
  const p=CH.plan(); if(p.includes(k)) return toast("موجود في المخطط");
  CH.setPlan([...p,k]); toast(`أُضيف: ${d.ar}`); render();};
window.chRm=k=>{CH.setPlan(CH.plan().filter(x=>x!==k)); render();};
window.chClear=()=>{CH.setPlan([]); toast("أُفرغ المخطط"); render();};
window.chPublish=async()=>{
  if(CH._publishing)return toast("يجري نشر الحصة الآن",1);
  const p=CH.plan(); if(!p.length) return toast("المخطط فارغ",1);
  const items=p.map(k=>CH.DRILLS.find(d=>d.k===k)).filter(Boolean);
  if(!items.length)return toast("لا توجد تمارين صالحة في المخطط",1);
  const mins=items.reduce((s,d)=>s+d.min,0);
  const title="حصة — "+items.map(d=>CH.AIM[d.aim].ar).filter((v,i,a)=>a.indexOf(v)===i).join(" + ");
  const org=ME.org||"", plannedDate=CH.date(), plannedTime=CH.time();
  if(plannedDate<CH.today())return toast("اختر اليوم أو موعدًا لاحقًا",1);
  const roster=await CO.roster();
  const names=[...new Set(roster.map(x=>String(x.name||"").trim()).filter(Boolean))];
  if(!names.length)return toast("لا يوجد لاعبون في الفئة المختارة",1);
  CH._publishing=true;
  try{
    const prior=await q("c",sb.from("calendar_items").select("player_name,title,on_date,created_by").eq("created_by",ME.name).eq("on_date",plannedDate).eq("kind","training").eq("title",title).limit(500));
    const already=new Set(prior.filter(x=>x.title===title&&String(x.on_date||"").slice(0,10)===plannedDate).map(x=>x.player_name));
    const recipients=names.filter(n=>!already.has(n));
    if(!recipients.length)return toast("سبق نشر هذه الحصة لجميع اللاعبين في هذا الموعد",1);
    const group=CO.grp&&CO.grp()!=="all"?CO.grp():"كل الفئات";
    const summary="مراجعة الحصة قبل النشر\n"+title+" · "+mins+" دقيقة\nالفئة: "+group+" · المستلمون: "+recipients.length+" لاعبًا"+(already.size?" · تم استبعاد "+already.size+" سبق أن وصلتهم":"")+"\nالموعد: "+plannedDate+" · "+plannedTime+"\nهل تريد المتابعة؟";
    if(!confirm(summary))return;
    const rows=recipients.map(n=>({player_name:n,kind:"training",title,subtitle:items.length+" تمارين · "+mins+" دقيقة · سجّلها "+ME.name,at_time:plannedTime,on_date:plannedDate,org,needs_confirm:false,created_by:ME.name}));
    const {error}=await sb.from("calendar_items").insert(rows);
    if(error)return toast("تعذّر: "+error.message,1);
    await trans("نشر مخطط حصة ("+items.length+" تمرين · "+mins+" دقيقة) لـ"+recipients.length+" لاعبًا");
    toast("نُشرت الحصة لـ"+recipients.length+" لاعبًا"+(already.size?" · أُزيل التكرار":""));
    CH.setPlan([]);render();
  }finally{CH._publishing=false;}
};

T.sessions=async()=>{
  const org=ME.org||"";
  const [roster,att,cal]=await Promise.all([
    CO.roster(),
    q("a",sb.from("attendance").select("*").eq("recorded_by",ME.name).order("created_at",{ascending:false}).limit(200)),
    q("c",sb.from("calendar_items").select("*").eq("created_by",ME.name).order("on_date",{ascending:false}).limit(40))
  ]);
  const plan=CH.plan().map(k=>CH.DRILLS.find(d=>d.k===k)).filter(Boolean);
  const mins=plan.reduce((s,d)=>s+d.min,0);
  const byAim={};plan.forEach(d=>{byAim[d.aim]=(byAim[d.aim]||0)+d.min});
  const validAtt=att.filter(a=>a.present!==false);
  const days=[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()-i+7)%7));const key=d.toISOString().slice(0,10);return new Set(validAtt.filter(a=>CO.rowDate(a)===key).map(a=>String(a.player_name||"").trim())).size;});
  const DN=["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];
  const mx=Math.max(...days,1);
  const uniqueSessions=new Set((CO.sessionsOf?CO.sessionsOf(cal):cal.filter(c=>c.kind==="training")).map(c=>String(c.on_date||"").slice(0,10)+"|"+c.title+"|"+(c.at_time||""))).size;
  const recipients=[...new Set(roster.map(x=>String(x.name||"").trim()).filter(Boolean))];
  const filt=(()=>{try{return localStorage.getItem("pi_drill_f")||"all"}catch(e){return "all"}})();
  const shown=filt==="all"?CH.DRILLS:CH.DRILLS.filter(d=>d.aim===filt);
  
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b style="font-size:15px;color:#f5c518">الحصص ومخططها</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">ابنِ الحصة من مكتبة التمارين، راجع الفئة والموعد، ثم أرسلها إلى لاعبيك باسمك.</span></div>
      <div style="text-align:center;flex:none"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:22px;color:#f5c518">${uniqueSessions}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">حصة منشورة</span></div>
    </div>
  </div>

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <b class="h2" style="color:#4636e3">مخطط الحصة</b>
      ${plan.length?`<span style="background:#efedff;color:#4636e3;border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:900"><span class="ltr">${plan.length}</span> تمرين · <span class="ltr">${mins}</span> د</span>`:""}</div>
    ${plan.length?`
      <div style="display:flex;height:12px;border-radius:99px;overflow:hidden;margin-bottom:12px">
        ${Object.entries(byAim).map(([a,m])=>`<span style="width:${m/mins*100}%;background:${CH.AIM[a].c}" title="${CH.AIM[a].ar} ${m}د"></span>`).join("")}</div>
      <div style="display:flex;gap:11px;flex-wrap:wrap;margin-bottom:13px">
        ${Object.entries(byAim).map(([a,m])=>`<span class="muted" style="color:${CH.AIM[a].c}">■ ${CH.AIM[a].ar} <span class="ltr">${m}</span>د</span>`).join("")}</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${plan.map((d,i)=>`<div style="display:flex;align-items:center;gap:11px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:15px;padding:10px 12px">
          <span style="width:28px;height:28px;flex:none;border-radius:9px;background:${CH.AIM[d.aim].c};color:#fff;display:grid;place-items:center;font-family:'Space Grotesk';font-weight:700;font-size:12px">${i+1}</span>
          <div style="flex:1;min-width:0"><b style="font-size:12px;display:block">${esc(d.ar)}</b><span class="muted"><span class="ltr">${d.min}</span> دقيقة · ${esc(d.grp)}</span></div>
          <button onclick="chRm('${d.k}')" style="background:none;border:0;color:#a83b25;font:900 15px Cairo;cursor:pointer;flex:none;padding:4px 8px">×</button></div>`).join("")}</div>
      <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:8px;margin-top:12px">
        <label style="font-size:10px;font-weight:900;color:#5b6078">تاريخ الحصة
          <input type="date" value="${CH.date()}" min="${CH.today()}" onchange="chDate(this.value)" style="display:block;width:100%;margin-top:5px;border:1px solid #e9e4d8;border-radius:11px;padding:9px 8px;font:800 11px Cairo;background:#faf8f3;color:#151a2e"></label>
        <label style="font-size:10px;font-weight:900;color:#5b6078">وقت الحصة
          <input type="time" value="${CH.time()}" onchange="chTime(this.value)" style="display:block;width:100%;margin-top:5px;border:1px solid #e9e4d8;border-radius:11px;padding:9px 8px;font:800 11px Cairo;background:#faf8f3;color:#151a2e"></label>
      </div>
      <span class="muted" style="display:block;margin-top:7px">ستصل إلى <span class="ltr">${recipients.length}</span> لاعبًا في ${CO.grp&&CO.grp()!=="all"?CO.grp():"كل الفئات"}</span>
      <div style="display:flex;gap:8px;margin-top:13px">
        <button class="btn" style="flex:1" onclick="chPublish()">انشر في تقويم لاعبيك</button>
        <button class="btn ghost" style="flex:none;width:auto;padding:13px 17px" onclick="chClear()">أفرغ</button></div>
    `:`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:20px;text-align:center">
      <b style="font-size:12.5px">ابنِ حصتك من المكتبة أدناه</b>
      <span class="muted" style="display:block;margin-top:5px">اضغط + على أي تمرين ليدخل المخطط</span></div>`}
  </div>

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#4636e3">مكتبة التمارين</b>
      <span class="muted"><span class="ltr">${CH.DRILLS.length}</span> تمرين</span></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      <button onclick="drillFilt('all')" style="background:${filt==="all"?"#4636e3":"#faf8f3"};color:${filt==="all"?"#fff":"#565d78"};border:1px solid ${filt==="all"?"#4636e3":"#e9e4d8"};border-radius:999px;padding:7px 15px;font:900 11px Cairo;cursor:pointer">الكل</button>
      ${Object.entries(CH.AIM).map(([k,a])=>`<button onclick="drillFilt('${k}')" style="background:${filt===k?a.c:"#faf8f3"};color:${filt===k?"#fff":"#565d78"};border:1px solid ${filt===k?a.c:"#e9e4d8"};border-radius:999px;padding:7px 15px;font:900 11px Cairo;cursor:pointer">${a.ar}</button>`).join("")}
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${shown.map(d=>{const inPlan=CH.plan().includes(d.k);const A=CH.AIM[d.aim];
        return `<div style="display:flex;align-items:center;gap:11px;background:${inPlan?"#f6f5ff":"#faf8f3"};border:1px solid ${inPlan?"#ddd8fb":"#e9e4d8"};border-radius:16px;padding:11px 13px">
          <span style="width:5px;height:38px;flex:none;border-radius:99px;background:${A.c}"></span>
          <div style="flex:1;min-width:0">
            <b style="font-size:12.5px;display:block">${esc(d.ar)}</b>
            <span class="muted" style="display:block;margin-top:2px">${esc(d.d)}</span>
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">
              <span style="background:#fff;border:1px solid #e9e4d8;color:${A.c};border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:900">${A.ar}</span>
              <span style="background:#fff;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:800"><span class="ltr">${d.min}</span> د</span>
              <span style="background:#fff;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:800">${esc(d.grp)}</span></div></div>
          <button onclick="chAdd('${d.k}')" ${inPlan?"disabled":""} style="width:34px;height:34px;flex:none;border-radius:11px;background:${inPlan?"#efedff":"#4636e3"};color:${inPlan?"#4636e3":"#fff"};border:0;font:900 17px Cairo;cursor:${inPlan?"default":"pointer"}">${inPlan?"✓":"+"}</button></div>`}).join("")}
    </div>
  </div>

  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">مشاركات الحضور خلال الأسبوع</b>
    ${validAtt.length?`<div style="display:flex;align-items:flex-end;gap:5px;height:64px">
      ${days.map(d=>`<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%"><span style="height:${Math.max(6,d/mx*100)}%;background:${d===mx&&d>0?"#f5c518":"#4636e3"};border-radius:5px 5px 0 0;opacity:${d?1:.16};display:block"></span></div>`).join("")}</div>
      <div style="display:flex;gap:5px;margin-top:6px">${DN.map(n=>`<span style="flex:1;text-align:center;font-size:8.5px;font-weight:800;color:#8a8fa5">${n}</span>`).join("")}</div>
      <span class="muted" style="display:block;margin-top:8px">أعلى يوم <span class="ltr">${mx}</span> مشاركة · كل لاعب يُحسب مرة واحدة في اليوم · <span class="ltr">${uniqueSessions}</span> حصة منشورة في التقاويم</span>`
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:16px;text-align:center"><span class="muted">تظهر المشاركات بعد تسجيل أول حضور</span></div>`}
  </div>
  </main>`;
};
window.drillFilt=k=>{try{localStorage.setItem("pi_drill_f",k)}catch(e){};render()};

/* ── لوحة الفريق: من يحتاج انتباهك ── */
T.squad=async()=>{
  const org=ME.org||"";
  const [pf,att,ev,hs,mt]=await Promise.all([
    q("p",sb.from("profiles").select("id,name,role,org,pos,age").eq("role","player").not("name","is",null).limit(80)),
    q("a",sb.from("attendance").select("*").eq("org",org).order("created_at",{ascending:false}).limit(300)),
    q("e",sb.from("match_events").select("who,type,match_id,created_at").limit(400)),
    q("h",sb.from("health_status").select("*").limit(80)),
    q("m",sb.from("matches").select("id,created_at,status").limit(60))
  ]);
  const roster=pf.filter(p=>!org||p.org===org);
  const hMap={};hs.forEach(h=>hMap[h.player_name]=h);
  const recentMatches=n=>{const ids=new Set(ev.filter(e=>e.who===n&&(Date.now()-new Date(e.created_at))/864e5<=8).map(e=>e.match_id));return ids.size};
  const rows=roster.map(p=>{
    const h=hMap[p.name], m8=recentMatches(p.name);
    const sessions=att.filter(a=>a.player_name===p.name).length;
    const lastAtt=att.find(a=>a.player_name===p.name);
    const daysOff=lastAtt?Math.floor((Date.now()-new Date(lastAtt.created_at))/864e5):null;
    let flag=null;
    if(h&&h.state==="rehab") flag={t:"عائد من إصابة — "+(h.phase||"تأهيل"),c:"#c78c00",act:["البرنامج","health"]};
    else if(h&&h.state==="out") flag={t:"غير متاح — بقرار المختص",c:"#a83b25",act:["الحالة","health"]};
    else if(m8>=3) flag={t:`حمل عالٍ — ${m8} مباريات في ٨ أيام`,c:"#e8531f",act:["خطة راحة","rest"]};
    else if(daysOff!==null&&daysOff>=14) flag={t:`غائب ${daysOff} يومًا عن الحصص`,c:"#c78c00",act:["تابعه","follow"]};
    return {p,h,sessions,flag,m8};
  });
  const need=rows.filter(r=>r.flag);
  const ready=rows.filter(r=>!r.flag&&(!r.h||r.h.state==="available")).length;
  const overload=rows.filter(r=>r.flag&&r.flag.c==="#e8531f").length;
  return `<main>
  <div class="stat3">
    <div class="stat"><b class="ltr">${roster.length}</b><span class="muted">لاعبًا</span></div>
    <div class="stat"><b class="ltr" style="color:#2c6e49">${ready}</b><span class="muted">جاهز</span></div>
    <div class="stat"><b class="ltr" style="color:#e8531f">${overload}</b><span class="muted">حمل زائد</span></div>
  </div>
  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <b class="h2" style="color:#4636e3">يحتاجون انتباهك</b>
      <span class="muted"><span class="ltr">${need.length}</span></span></div>
    ${need.length?need.map(r=>`<div style="background:#faf8f3;border:1px solid #e9e4d8;border-inline-start:3px solid ${r.flag.c};border-radius:15px;padding:12px 14px;display:flex;gap:11px;align-items:center;margin-bottom:8px">
      <span style="width:36px;height:36px;flex:none;border-radius:50% 50% 50% 7px;background:${r.flag.c==="#e8531f"?"linear-gradient(160deg,#f5c518,#c78c00)":"#f2f0ea"};color:${r.flag.c==="#e8531f"?"#151a2e":"#565d78"};display:grid;place-items:center;font-size:13px;font-weight:900">${esc(r.p.name[0])}</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px;display:block">${esc(r.p.name)}</b>
        <span style="display:block;font-size:10.5px;color:${r.flag.c};font-weight:800;margin-top:2px">${esc(r.flag.t)}</span></div>
      <button onclick="sqAct('${esc(r.p.name)}','${r.flag.act[1]}')" style="background:none;border:0;color:#4636e3;font:900 10.5px Cairo;cursor:pointer;flex:none">${r.flag.act[0]}</button></div>`).join("")
      :`<div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:16px;padding:16px;text-align:center"><b style="font-size:12px;color:#2c6e49">كل اللاعبين في المسار ✓</b><span class="muted" style="display:block;margin-top:4px">لا حمل زائد ولا غياب طويل ولا تأهيل جارٍ</span></div>`}
  </div>
  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2">القائمة الكاملة</b><span class="muted">حصص · جاهزية</span></div>
    ${roster.length?rows.sort((a,b)=>b.sessions-a.sessions).map(r=>{
      const st=r.h?r.h.state:"available";
      const S=({available:["متاح","#2c6e49"],rehab:["تأهيل","#c78c00"],limited:["بقيود","#c78c00"],out:["غير متاح","#a83b25"]})[st]||["متاح","#2c6e49"];
      return `<div class="lrow">
        <span class="ic">${esc(r.p.name[0])}</span>
        <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(r.p.name)}</b>
          <span class="muted" style="display:block">${esc(r.p.pos||"لاعب")}${r.p.age?` · <span class="ltr">${r.p.age}</span>`:""} · <span class="ltr">${r.sessions}</span> حصة</span></div>
        <span style="color:${S[1]};font-weight:900;font-size:10px;flex:none">${S[0]}</span></div>`}).join("")
      :`<span class="muted">لا لاعبين في جهتك بعد</span>`}
  </div>
  <div style="display:flex;gap:8px">
    <button class="btn" style="flex:1" onclick="go('tactics')">اللوحة التكتيكية</button>
    <button class="btn ghost" style="flex:1" onclick="go('newMatch')">نظّم مباراة</button>
  </div>
  <div class="note">التنبيهات محسوبة من نشاط موثّق: مباريات ٨ أيام · غياب الحصص · حالة المختص الطبي. ولا يظهر سبب طبي — الجاهزية فقط.</div>
  </main>`;
};
window.sqAct=async(name,kind)=>{
  if(kind==="health") return toast("الحالة الطبية عند المختص — يظهر لك أثرها التشغيلي فقط");
  if(kind==="rest"){
    const org=ME.org||"";
    const {error}=await sb.from("calendar_items").insert({player_name:name,kind:"rehab",title:"خطة راحة — حمل مخفّض",subtitle:`قرار المدرب ${ME.name} · بلا احتكاك`,at_time:"17:00",on_date:new Date(Date.now()+864e5).toISOString().slice(0,10),org,needs_confirm:false,created_by:ME.name});
    if(error) return toast("تعذّر: "+error.message,1);
    await trans(`خطة راحة — ${name}`);
    return toast("دخلت خطة الراحة تقويم اللاعب باسمك");
  }
  await trans(`متابعة غياب — ${name}`);
  toast("سُجّلت المتابعة في سجل الشفافية");
};

/* ── اللوحة التكتيكية: تشكيل يُنشر في تقويم اللاعبين ── */
CH.FORMS={"4-3-3":[[1,"حارس"],[4,"دفاع"],[3,"وسط"],[3,"هجوم"]],"4-4-2":[[1,"حارس"],[4,"دفاع"],[4,"وسط"],[2,"هجوم"]],"3-5-2":[[1,"حارس"],[3,"دفاع"],[5,"وسط"],[2,"هجوم"]],"4-2-3-1":[[1,"حارس"],[4,"دفاع"],[2,"ارتكاز"],[3,"وسط"],[1,"هجوم"]]};
T.tactics=async()=>{
  const f=(()=>{try{return localStorage.getItem("pi_form_"+ME.id)||"4-3-3"}catch(e){return "4-3-3"}})();
  const lines=CH.FORMS[f]||CH.FORMS["4-3-3"];
  const org=ME.org||"";
  const [pf,hs]=await Promise.all([
    q("p",sb.from("profiles").select("name,pos,org,role").eq("role","player").not("name","is",null).limit(60)),
    q("h",sb.from("health_status").select("player_name,state").limit(80))
  ]);
  const roster=pf.filter(p=>!org||p.org===org);
  const hMap={};hs.forEach(h=>hMap[h.player_name]=h.state);
  const avail=roster.filter(p=>(hMap[p.name]||"available")==="available");
  const total=lines.reduce((s,l)=>s+l[0],0);
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div><b style="font-size:15px;color:#f5c518">اللوحة التكتيكية</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">التشكيل ونشره في تقويم لاعبيك — والجاهزية من المختص لا منك.</span></div>
      <b class="ltr" style="font-family:'Space Grotesk';font-size:24px;color:#f5c518;flex:none">${f}</b>
    </div>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:10px">اختر التشكيل</b>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${Object.keys(CH.FORMS).map(k=>`<button onclick="tacForm('${k}')" style="flex:1;min-width:70px;background:${k===f?"#4636e3":"#faf8f3"};color:${k===f?"#fff":"#565d78"};border:1px solid ${k===f?"#4636e3":"#e9e4d8"};border-radius:13px;padding:12px 8px;font:700 13px 'Space Grotesk';cursor:pointer" dir="ltr">${k}</button>`).join("")}
    </div>
  </div>
  <div class="card" style="border-radius:26px;padding:0;overflow:hidden">
    <div style="background:linear-gradient(170deg,#1d4a3e,#0f2b24);padding:20px 16px;position:relative">
      <div style="position:absolute;inset:16px;border:1.5px solid rgba(255,255,255,.14);border-radius:10px"></div>
      <div style="position:absolute;inset-inline-start:16px;inset-inline-end:16px;top:50%;height:1.5px;background:rgba(255,255,255,.14)"></div>
      <div style="position:absolute;inset-inline-start:50%;top:50%;width:64px;height:64px;border:1.5px solid rgba(255,255,255,.14);border-radius:50%;transform:translate(-50%,-50%)"></div>
      <div style="position:relative;display:flex;flex-direction:column-reverse;gap:16px">
        ${lines.map(([n,label])=>`<div style="display:flex;justify-content:space-around;align-items:center">
          ${[...Array(n)].map(()=>`<span style="width:34px;height:34px;border-radius:50% 50% 50% 7px;background:rgba(245,197,24,.92);color:#151a2e;display:grid;place-items:center;font-size:11px;font-weight:900">●</span>`).join("")}
        </div>`).join("")}
      </div>
    </div>
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:7px">
      ${lines.slice().reverse().map(([n,label])=>`<div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800"><span style="color:#565d78">${label}</span><span class="ltr" style="color:#4636e3;font-family:'Space Grotesk'">${n}</span></div>`).join("")}
    </div>
  </div>
  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <b class="h2">المتاحون للتشكيل</b>
      <span style="background:${avail.length>=total?"#e9f0ea":"#fff6d6"};color:${avail.length>=total?"#2c6e49":"#c78c00"};border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:900"><span class="ltr">${avail.length}</span>/<span class="ltr">${total}</span></span></div>
    ${avail.length?avail.slice(0,11).map(p=>`<div class="lrow"><span class="ic">${esc(p.name[0])}</span><div style="flex:1;min-width:0"><b style="font-size:12px">${esc(p.name)}</b><span class="muted" style="display:block">${esc(p.pos||"لاعب")}</span></div><span style="color:#2c6e49;font-weight:900;font-size:10px;flex:none">متاح</span></div>`).join(""):`<span class="muted">لا لاعبين متاحين — راجع لوحة الفريق</span>`}
    ${avail.length<total?`<div class="note" style="margin-top:10px">المتاحون أقل من التشكيل بـ<span class="ltr">${total-avail.length}</span> — التشكيل قابل للنشر ويظهر النقص صريحًا.</div>`:""}
  </div>
  <button class="btn" onclick="tacPublish('${f}')">انشر التشكيل في تقويم اللاعبين</button>
  <div class="note">التشكيل قرار فني باسمك — يدخل تقويم اللاعبين ويُسجَّل في الشفافية، ولا يمسّ تقييم أحد.</div>
  </main>`;
};
window.tacForm=k=>{try{localStorage.setItem("pi_form_"+ME.id,k)}catch(e){};render()};
window.tacPublish=async(f)=>{
  const org=ME.org||"";
  const players=await q("p",sb.from("attendance").select("player_name").eq("org",org).limit(200));
  const names=[...new Set(players.map(x=>x.player_name))];
  if(!names.length) return toast("لا لاعبين في جهتك",1);
  const rows=names.map(n=>({player_name:n,kind:"training",title:"تشكيل المباراة — "+f,subtitle:`قرار المدرب ${ME.name}`,at_time:"19:00",on_date:new Date().toISOString().slice(0,10),org,needs_confirm:false,created_by:ME.name}));
  const {error}=await sb.from("calendar_items").insert(rows);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`نشر تشكيل ${f} لـ${names.length} لاعبًا`);
  toast(`نُشر التشكيل لـ${names.length} لاعبًا`);
};

/* ── سلسلة الثقة: بديل «طلبات التوثيق» الذي يخالف القانون ── */
T.chain=async()=>{
  const [ev,mt,tr]=await Promise.all([
    q("e",sb.from("match_events").select("*,matches(title,organizer_name,status)").eq("recorded_by",ME.name).order("created_at",{ascending:false}).limit(40)),
    q("m",sb.from("matches").select("*").eq("organizer_id",ME.id).order("created_at",{ascending:false}).limit(20)),
    q("t",sb.from("transparency").select("*").order("created_at",{ascending:false}).limit(60))
  ]);
  const mine=tr.filter(t=>t.actor&&t.actor.includes(ME.name));
  const corr=mine.filter(t=>t.action&&t.action.includes("تصحيح"));
  return `<main>
  <div class="stage" style="border-radius:26px">
    <b style="font-size:15px;color:#f5c518">توقيعك في سلسلة الثقة</b>
    <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">ما سجّلته باسمك دخل السجل لحظته — بلا اعتماد ولا انتظار. مسؤوليتك هي التوقيع.</span>
  </div>
  <div class="stat3">
    <div class="stat"><b class="ltr" style="color:#4636e3">${ev.length}</b><span class="muted">حدثًا باسمك</span></div>
    <div class="stat"><b class="ltr">${mt.length}</b><span class="muted">مباراة نظّمتها</span></div>
    <div class="stat"><b class="ltr" style="color:${corr.length?"#c78c00":"#2c6e49"}">${corr.length}</b><span class="muted">تصحيحًا</span></div>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">كيف يسير الحدث</b>
    <div style="display:flex;align-items:center;margin-bottom:11px">
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
        <span style="width:30px;height:30px;border-radius:50%;background:#4636e3;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:900">أنت</span>
        <span style="font-size:9px;font-weight:800;color:#4636e3">المنظم المسؤول</span></div>
      <span style="flex:1;height:2.5px;background:#4636e3;margin-top:-14px"></span>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
        <span style="width:30px;height:30px;border-radius:50%;background:#2c6e49;color:#fff;display:grid;place-items:center;font-size:13px">✓</span>
        <span style="font-size:9px;font-weight:800;color:#2c6e49">السجل — فورًا</span></div>
    </div>
    <div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:14px;padding:12px 14px">
      <span style="font-size:11.5px;font-weight:700;color:#1d4a3e;line-height:1.9;display:block">خطوتان لا ثلاث: لا «ينتظرك» ولا «قيد الاعتماد». إذا وقع خطأ إدخال فأنت وحدك تصحّحه، ويظهر التصحيح باسمك ووقته — تصحيح لا اعتراض.</span></div>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:10px">آخر ما وقّعته</b>
    ${ev.length?ev.slice(0,8).map(e=>`<div class="lrow">
      <span class="ic">${e.type==="goal"?"⚽":e.type==="assist"?"◎":"▮"}</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(evLabel(e))}</b>
        <span class="muted" style="display:block">${esc(e.matches?.title||"مباراة")} · د<span class="ltr">${N(e.minute)}</span> · <span class="ltr">${new Date(e.created_at).toLocaleDateString("en-GB")}</span></span></div>
      <button onclick="chFix('${e.id}','${esc(e.who)}')" style="background:none;border:0;color:#4636e3;font:900 10.5px Cairo;cursor:pointer;flex:none">صحّح</button></div>`).join("")
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:16px;text-align:center"><span class="muted">لم تسجّل أحداثًا بعد — سجّل من شاشة المباراة</span></div>`}
  </div>
  ${mine.length?`<div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:9px">قراراتك في سجل الشفافية</b>
    ${mine.slice(0,6).map(t=>`<div class="lrow"><span class="ic">▤</span><div style="flex:1;min-width:0"><b style="font-size:11.5px">${esc(t.action)}</b><span class="muted" style="display:block"><span class="ltr">${new Date(t.created_at).toLocaleString("en-GB")}</span></span></div></div>`).join("")}
    <span class="muted" style="display:block;margin-top:9px">قراءة فقط — حتى لك.</span></div>`:""}
  </main>`;
};
window.chFix=async(id,who)=>{
  const m=prompt(`تصحيح إدخال — ${who}\nالدقيقة الصحيحة:`);
  if(m===null) return;
  const v=parseInt(m,10); if(isNaN(v)) return toast("دقيقة غير صحيحة",1);
  const {error}=await sb.from("match_events").update({minute:v}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`تصحيح إدخال — ${who}: الدقيقة ${v}`);
  toast("صُحّح وظهر التصحيح باسمك ووقته"); render();
};

/* ── التركيب ── */
(function(){
  Object.assign(TITLES,{sessions:"الحصص",squad:"فريقي",tactics:"اللوحة التكتيكية",chain:"سلسلة الثقة"});
  if(NAV.coach) NAV.coach=[["⌂","فريقي","squad"],["◈","الحصص","sessions"],["FAB","","newMatch"],["▶","مبارياتي","orgMatch"],["▤","تقارير","reports"]];
  const _cp=P3&&P3.coachProfile;
  if(_cp) P3.coachProfile=async()=>{
    const body=await _cp();
    const rows=`<div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:6px">أدواتك</b>
      <div class="lrow" onclick="go('sessions')" style="cursor:pointer"><span class="ic">◈</span><div style="flex:1"><b style="font-size:12px">الحصص ومخططها ومكتبة التمارين</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('squad')" style="cursor:pointer"><span class="ic">▦</span><div style="flex:1"><b style="font-size:12px">لوحة الفريق — من يحتاج انتباهك</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('tactics')" style="cursor:pointer"><span class="ic">◎</span><div style="flex:1"><b style="font-size:12px">اللوحة التكتيكية والتشكيل</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('chain')" style="cursor:pointer"><span class="ic">▤</span><div style="flex:1"><b style="font-size:12px">سلسلة الثقة — ما وقّعته باسمك</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('settings')" style="cursor:pointer"><span class="ic">⚙</span><div style="flex:1"><b style="font-size:12px">الإعدادات</b></div><span style="color:#4636e3;font-weight:900">←</span></div></div>`;
    return body.replace("</main>",rows+"</main>");
  };
  if(typeof homeFor==="function"){ const _h=homeFor; window.homeFor=function(){ return ME&&ME.role==="coach"?"squad":_h(); }; }
})();
