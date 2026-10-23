/* PlayIn365 — الدفعة ٥: إكمال مسار اللاعب — فرصي · تقويمي · الرسائل · صحتي · الإعدادات · البروفايل العام · بطاقة اليوم · أرقام المباراة */
const PL={};
PL.stage=(inner,disc)=>`<div class="stage" style="border-radius:26px">${disc||""}<div style="position:relative">${inner}</div></div>`;
PL.empty=t=>`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center"><span class="muted">${esc(t)}</span></div>`;
PL.ar=n=>N(n);

/* ═══ ٠١ فرصي ═══ */
PL.OPP={
  trial:{ar:"تجربة أداء",c:"#f5c518",fg:"#151a2e"},
  interest:{ar:"اهتمام",c:"#4636e3",fg:"#fff"},
  contact:{ar:"طلب تواصل",c:"#c78c00",fg:"#151a2e"},
  rejected:{ar:"لم تُقبل",c:"#a83b25",fg:"#fff"}
};
T.opps=async()=>{
  const os=await q("o",sb.from("pi_opps").select("*").eq("player_name",ME.name).order("created_at",{ascending:false}));
  const open=os.filter(o=>o.status==="open"), closed=os.filter(o=>o.status!=="open");
  const days=d=>Math.max(0,Math.ceil((new Date(d)-Date.now())/864e5));
  const card=o=>{
    const K=PL.OPP[o.kind]||PL.OPP.interest;
    if(o.kind==="trial") return `<div class="stage" style="border-radius:24px">
      <div style="position:absolute;inset-inline-start:64%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
      <div style="position:relative">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
          <span style="font-size:10px;font-weight:900;color:#f5c518">${K.ar}</span>
          ${o.deadline?`<span style="font-size:10px;font-weight:800;color:#c6cade">تُقفل بعد <span class="ltr">${days(o.deadline)}</span> أيام</span>`:""}</div>
        <b style="font-size:14.5px;display:block;line-height:1.6">${esc(o.title)}</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.9;margin-top:7px">${esc(o.body||"")}</span>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn gold" style="flex:1" onclick="oppAct('${o.id}','apply','${esc(o.title)}')">سجّل في التجربة</button>
          <button class="btn ghost" style="flex:none;width:auto;padding:13px 17px;background:rgba(255,255,255,.1);border-color:#333a55;color:#faf8f3" onclick="oppDetails('${esc(o.org||"")}')">التفاصيل</button></div>
      </div></div>`;
    if(o.kind==="contact") return `<div class="card" style="border-radius:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
        <span style="font-size:10px;font-weight:900;color:#c78c00">${K.ar}</span>
        <span style="font-size:10px;color:#8a8fa5;font-weight:800">ينتظر قرارك</span></div>
      <b style="font-size:13px;display:block;line-height:1.6">${esc(o.title)}</b>
      <span style="display:block;font-size:11.5px;color:#565d78;font-weight:600;line-height:1.9;margin-top:6px">${esc(o.body||"")}</span>
      <div style="display:flex;gap:8px;margin-top:13px">
        <button class="btn" style="flex:1" onclick="oppAct('${o.id}','accept','${esc(o.title)}')">اقبل</button>
        <button class="btn ghost" style="flex:1" onclick="oppAct('${o.id}','decline','${esc(o.title)}')">ارفض</button></div></div>`;
    if(o.kind==="rejected") return `<div class="card" style="border-radius:24px;border-color:#f2d9d0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
        <span style="background:#fdeee8;color:#a83b25;border-radius:999px;padding:4px 11px;font-size:10px;font-weight:900">${K.ar}</span>
        <span style="font-size:10px;color:#8a8fa5;font-weight:800" class="ltr">${new Date(o.created_at).toLocaleDateString("en-GB")}</span></div>
      <b style="font-size:13px;display:block;line-height:1.6">${esc(o.title)}</b>
      ${o.feedback?`<span style="display:block;font-size:11.5px;color:#565d78;font-weight:600;line-height:1.9;margin-top:7px">«${esc(o.feedback)}»</span>`:""}
      <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;line-height:1.85;margin-top:11px;padding-top:11px;border-top:1px solid #f7e6df">لا يظهر في ملفك العام ولا يراه كشاف آخر ولا يمسّ تقييمك.</span></div>`;
    return `<div class="card" style="border-radius:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
        <span style="font-size:10px;font-weight:900;color:#4636e3">${K.ar}</span>
        <span style="font-size:10px;color:#8a8fa5;font-weight:800">${esc(o.created_by||"")}</span></div>
      <b style="font-size:13px;display:block;line-height:1.6">${esc(o.title)}</b>
      <span style="display:block;font-size:11.5px;color:#565d78;font-weight:600;line-height:1.9;margin-top:6px">${esc(o.body||"")}</span></div>`;
  };
  return `<main>
    ${PL.stage(`<b style="font-size:15px;color:#f5c518">فرصك</b>
      <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">التجارب والاهتمام وطلبات التواصل. لا أحد يراسلك قبل قبولك، ولا رفض يظهر في ملفك العام.</span>`,
      `<div style="position:absolute;inset-inline-start:66%;top:-70%;width:68%;height:220%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>`)}
    ${open.length?open.map(card).join(""):PL.empty("لا فرص الآن — تظهر هنا حين تفتح جهة تجربة أو يتابعك كشاف")}
    ${closed.length?`<div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">
      <b class="h2" style="color:#8a8fa5">مغلقة — خاصة بك</b>${closed.map(card).join("")}</div>`:""}
    <div class="dnote">الاهتمام ليس عرضًا، والرفض ليس علنيًا. طلبات القاصرين تمرّ بولي الأمر قبل أن تصلك.</div>
  </main>`;
};
window.oppDetails=(org)=>toast(org?("الجهة: "+org+" — التفاصيل الكاملة تصلك بعد التسجيل"):"لا تفاصيل إضافية");
window.oppAct=async(id,act,title)=>{
  const map={apply:["applied","سُجّلت في التجربة — أُخطرت الجهة"],accept:["accepted","قبلت التواصل — يمكنه مراسلتك الآن"],decline:["declined","رفضت الطلب — لا يستطيع مراسلتك"]};
  const [st,msg]=map[act]||map.apply;
  const {error}=await sb.from("pi_opps").update({status:st}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  if(act==="accept"){ await sb.from("pi_msgs").update({gated:false}).eq("member_name",ME.name).eq("thread_kind","agent"); }
  await trans(({apply:"تسجيل في تجربة: ",accept:"قبول طلب تواصل: ",decline:"رفض طلب تواصل: "})[act]+title);
  toast(msg); render();
};

/* ═══ ٠٢ تقويمي ═══ */
PL.CAL={training:{ar:"تدريب",c:"#4636e3"},rehab:{ar:"تأهيل",c:"#c78c00"},match:{ar:"مباراة",c:"#e8531f"},booking:{ar:"حجز",c:"#2c6e49"}};
T.calendar=async()=>{
  const [items,joins]=await Promise.all([
    q("c",sb.from("calendar_items").select("*").eq("player_name",ME.name).order("on_date",{ascending:true})),
    q("j",sb.from("match_joins").select("*,matches(title,match_date,match_time,venue,status)").eq("player_id",ME.id).limit(30))
  ]);
  const extra=joins.filter(j=>j.matches&&j.matches.status!=="final"&&j.matches.match_date).map(j=>({
    id:"j"+j.id,kind:"match",title:"مباراة — "+(j.matches.title||""),subtitle:(j.matches.venue||""),
    at_time:j.matches.match_time||"",on_date:j.matches.match_date,needs_confirm:!j.attended,confirmed:j.attended,join_id:j.id}));
  const all=[...items,...extra].sort((a,b)=>new Date(a.on_date)-new Date(b.on_date));
  const DAYS=["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];
  const today=new Date(); today.setHours(0,0,0,0);
  /* كشف التعارض: موعدان في يوم واحد تقلّ المدة بينهما عن ساعتين */
  const mins=t=>{const m=String(t||"").match(/(\d{1,2}):(\d{2})/);return m?(+m[1])*60+(+m[2]):null};
  const CONF={};
  (()=>{const byDay={};
    all.forEach(x=>{const k=String(x.on_date||"").slice(0,10); if(k)(byDay[k]=byDay[k]||[]).push(x);});
    Object.entries(byDay).forEach(([k,arr])=>{ if(arr.length<2) return;
      arr.forEach((a,i)=>arr.forEach((b,j)=>{ if(j<=i) return;
        const ta=mins(a.at_time), tb=mins(b.at_time);
        if(ta===null||tb===null||Math.abs(ta-tb)<120){ CONF[a.id]=b; CONF[b.id]=a; }
      }));
    });
  })();
  const conflicts=[...new Set(Object.keys(CONF))].length/2;
  const start=new Date(today); start.setDate(start.getDate()-start.getDay());
  const week=[...Array(7)].map((_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);
    const key=d.toISOString().slice(0,10);
    const hit=all.filter(x=>String(x.on_date).slice(0,10)===key);
    return {d,key,n:d.getDate(),name:DAYS[d.getDay()],isToday:+d===+today,dots:[...new Set(hit.map(h=>h.kind))]};});
  const dayLabel=x=>{const d=new Date(x.on_date);d.setHours(0,0,0,0);
    const diff=Math.round((d-today)/864e5);
    return diff===0?"اليوم":diff===1?"غدًا":diff<0?"مضى":DAYS[d.getDay()];};
  return `<main>
    <div class="card" style="border-radius:26px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:13px">
        <b class="h2" style="color:#4636e3">أسبوعك</b>
        <span class="muted">يتجمّع تلقائيًا من جهتك ومبارياتك</span></div>
      <div style="display:flex;justify-content:space-between;gap:4px">
        ${week.map(w=>`<div style="text-align:center;flex:1">
          <span style="font-size:9.5px;color:#a09a8c;font-weight:800;display:block">${w.name}</span>
          ${w.isToday
            ? `<b class="ltr" style="width:30px;height:30px;border-radius:11px;background:#4636e3;color:#fff;display:grid;place-items:center;font-family:'Space Grotesk';font-size:13px;margin:4px auto 0">${w.n}</b>`
            : `<b class="ltr" style="font-family:'Space Grotesk';font-size:13px;display:block;margin-top:4px;color:${w.dots.length?"#151a2e":"#c9c2b2"}">${w.n}</b>`}
          <span style="display:flex;gap:2px;justify-content:center;margin-top:3px;min-height:5px">${w.dots.map(k=>`<span style="width:5px;height:5px;border-radius:50%;background:${(PL.CAL[k]||PL.CAL.training).c};display:block"></span>`).join("")}</span>
        </div>`).join("")}
      </div>
      <div style="display:flex;gap:11px;flex-wrap:wrap;margin-top:11px;padding-top:11px;border-top:1px solid #f0ece2">
        ${Object.values(PL.CAL).map(k=>`<span class="muted" style="color:${k.c}">● ${k.ar}</span>`).join("")}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <b class="h2" style="color:#4636e3">القادم</b>
        ${conflicts?`<span style="background:#fff6d6;color:#c78c00;border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:900">⚠ <span class="ltr">${conflicts}</span> تعارض</span>`:""}</div>
      ${all.length?all.map(x=>{const K=PL.CAL[x.kind]||PL.CAL.training; const cf=CONF[x.id];
        return `<div class="card" style="border-radius:18px;border-inline-start:3px solid ${cf?"#c78c00":K.c};display:flex;flex-direction:column;gap:0">
          <div style="display:flex;gap:12px;align-items:center">
          <div style="text-align:center;flex:none;width:46px">
            <b class="ltr" style="font-family:'Space Grotesk';font-size:15px;display:block">${esc(x.at_time||"—")}</b>
            <span style="font-size:9px;color:#8a8fa5;font-weight:800">${dayLabel(x)}</span></div>
          <div style="flex:1;min-width:0">
            <b style="font-size:12.5px;display:block">${esc(x.title)}</b>
            <span class="muted" style="display:block;margin-top:3px">${esc(x.subtitle||x.org||"")}${x.created_by?" · سجّله "+esc(x.created_by):""}</span></div>
          ${x.needs_confirm?`<button class="btn" style="width:auto;padding:8px 13px;border-radius:999px;font-size:10px;flex:none" onclick="${x.join_id?`confAtt('${x.join_id}')`:`calConfirm('${x.id}')`}">أكّد</button>`
            :x.confirmed?`<span style="color:#2c6e49;font-weight:900;font-size:10.5px;flex:none">مؤكد ✓</span>`:""}</div>
          ${cf?`<div style="background:#fff6d6;border:1px solid #f0e2b4;border-radius:12px;padding:9px 11px;margin-top:10px">
            <b style="font-size:10.5px;color:#8a6a1e;display:block;margin-bottom:3px">⚠ تعارض في الوقت</b>
            <span style="font-size:10.5px;font-weight:700;color:#8a6a1e;line-height:1.8;display:block">يتزامن مع «${esc(cf.title)}»${cf.at_time?` <span class="ltr">${esc(cf.at_time)}</span>`:""}${cf.created_by?` — سجّله ${esc(cf.created_by)}`:""}. أكّد واحدًا وأبلِغ منظّم الآخر.</span>
            <button class="btn ghost" style="margin-top:9px;padding:8px;font-size:10.5px" onclick="calFlag('${esc(x.title)}','${esc(cf.title)}')">أبلِغ بالتعارض</button></div>`:""}</div>`}).join(""):PL.empty("لا مواعيد — تظهر حين تجدول جهتك تدريبًا أو مباراة")}
    </div>
    <div class="note">${conflicts?"التعارض يُكشف تلقائيًا حين يتقارب موعدان في يوم واحد — والخيار لك لا للمنصة. وحمل أسبوعك يظهر للمدرب في لوحته.":"حمل أسبوعك يظهر للمدرب في لوحته — والتأكيد يُخطر المنظم لحظته."}</div>
  </main>`;
};
window.calConfirm=async(id)=>{
  const {error}=await sb.from("calendar_items").update({confirmed:true,needs_confirm:false}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans("تأكيد حضور موعد في التقويم");
  toast("حضورك مؤكد — أُخطر المنظم"); render();
};
window.calFlag=async(a,b)=>{
  const os=await q("o",sb.from("profiles").select("id").in("role",["coach","academy","admin","guardian"]).limit(20));
  if(os.length) await sb.from("notifications").insert(os.map(o=>({user_id:o.id,kind:"conflict",title:"تعارض موعدين",body:`${ME.name}: «${a}» يتزامن مع «${b}»`})));
  await trans(`إبلاغ بتعارض موعدين — ${a} مع ${b}`);
  toast("وصل الإبلاغ لمنظّميك وولي أمرك");
};

/* ═══ ٠٣ الرسائل ═══ */
PL.TH={team:{ic:"◈",bg:"linear-gradient(160deg,#f5c518,#c78c00)",fg:"#151a2e"},
       org:{ic:"ن",bg:"#151a2e",fg:"#f5c518"},
       agent:{ic:"و",bg:"#f2f0ea",fg:"#565d78"}};
T.messages=async()=>{
  const ms=await q("m",sb.from("pi_msgs").select("*").eq("member_name",ME.name).order("created_at",{ascending:false}));
  const minor=ME.age&&ME.age<18;
  return `<main>
    ${PL.stage(`<b style="font-size:15px;color:#f5c518">رسائلك</b>
      <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">${minor?"أنت تحت الثامنة عشرة — لا مراسلة مباشرة معك: كل قناة تمرّ بولي أمرك." : "الوكيل لا يكتب قبل قبولك، والقنوات كلها موثقة الهوية."}</span>`)}
    ${ms.length?ms.map(m=>{const K=PL.TH[m.thread_kind]||PL.TH.team;const locked=m.gated||minor;
      return `<div class="card" style="border-radius:18px;display:flex;gap:12px;align-items:center;${locked?"opacity:.9":""}">
        <span style="width:44px;height:44px;flex:none;border-radius:${m.thread_kind==="agent"?"50% 50% 8px 50%":"50% 50% 50% 8px"};background:${K.bg};color:${K.fg};display:grid;place-items:center;font-size:15px;font-weight:900">${K.ic}</span>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">
            <b style="font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.thread)}</b>
            <span class="muted" style="flex:none"><span class="ltr">${new Date(m.created_at).toLocaleDateString("en-GB")}</span></span></div>
          <span class="muted" style="display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${locked?"🔒 مقفلة — لا مراسلة قبل الإذن":esc(m.sender||"")+": "+esc(m.body||"")}</span></div>
        ${m.unread>0&&!locked?`<span class="ltr" style="background:#4636e3;color:#fff;border-radius:50%;width:20px;height:20px;display:grid;place-items:center;font-size:10px;font-weight:900;flex:none">${m.unread}</span>`
          :locked?`<span style="flex:none;font-size:13px">🔒</span>`:""}</div>`}).join(""):PL.empty("لا رسائل — القنوات تُفتح حين تنضم لفريق أو تقبل طلب تواصل")}
    <div class="dnote">كل قناة تحمل هوية موثقة. أي طلب من وكيل أو كشاف لا يصل إلا بعد قبولك في «فرصك» — وللقاصر عبر ولي أمره فقط.</div>
  </main>`;
};

/* ═══ ٠٤ صحتي ═══ */
PL.HS={available:{ar:"متاح",bg:"#e9f0ea",fg:"#2c6e49"},rehab:{ar:"تأهيل",bg:"#fff6d6",fg:"#8a6912"},limited:{ar:"متاح بقيود",bg:"#fff6d6",fg:"#8a6912"},out:{ar:"غير متاح",bg:"#fbeeea",fg:"#a83b25"}};
T.health=async()=>{
  const rows=await q("h",sb.from("health_status").select("*").eq("player_name",ME.name).limit(1));
  const h=rows[0];
  const cal=await q("c",sb.from("calendar_items").select("*").eq("player_name",ME.name).eq("kind","rehab").order("on_date",{ascending:true}));
  const medViews=await q("mv",sb.from("pi_views").select("viewer,viewer_role,created_at").eq("subject",ME.name).eq("scope","medical").order("created_at",{ascending:false}).limit(20));
  const S=h?(PL.HS[h.state]||PL.HS.available):PL.HS.available;
  const w=h&&h.week?h.week:0, tot=h&&h.total?h.total:0;
  return `<main>
    <div style="background:linear-gradient(165deg,#1d4a3e,#0f2b24);border-radius:26px;padding:22px 20px;color:#faf8f3">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <b style="font-size:15px;color:#7fd6a8">صحتي</b><span style="font-size:14px">🔒</span></div>
      <span style="display:block;font-size:11.5px;color:#b6d8c8;font-weight:500;line-height:1.85;margin-top:6px">حالتك كما سجّلها المختص الطبي. ما يخرج للمدرب هو حالة المشاركة فقط — لا تشخيص ولا تفاصيل سريرية.</span>
    </div>
    ${(()=>{
      const st = h?h.state:"available";
      const A = { available:{q:"تدرّب كامل", d:"لا قيود على حملك اليوم", c:"#2c6e49", bg:"#e9f0ea", g:"✓"},
                  limited:{q:"تدرّب بقيود", d:"حمل مخفّض — والمدرب يرى «بقيود» ولا يرى سببها", c:"#8a6912", bg:"#fff8df", g:"◔"},
                  rehab:{q:"جلسة تأهيل لا تدريب", d:"برنامجك مع المختص، والمدرب يرى «غير متاح»", c:"#8a6912", bg:"#fff8df", g:"◈"},
                  out:{q:"لا تتدرّب اليوم", d:"غير متاح بقرار المختص — ولا يُرفع إلا منه", c:"#a83b25", bg:"#fdeee8", g:"⚠️"} }[st] || {q:"تدرّب كامل",d:"لا قيود مسجَّلة",c:"#2c6e49",bg:"#e9f0ea",g:"✓"};
      return `<div class="card" style="border-radius:26px;padding:0;overflow:hidden">
        <div style="background:${A.bg};padding:16px 18px;display:flex;gap:13px;align-items:center">
          <span style="width:44px;height:44px;flex:none;border-radius:12px;background:#fff;color:${A.c};display:grid;place-items:center;font-size:19px">${A.g}</span>
          <div style="flex:1;min-width:0">
            <span style="display:block;font-size:9.5px;font-weight:900;color:${A.c}">جاهزيتك اليوم</span>
            <b style="display:block;font-size:16px;font-weight:900;color:#151a2e;margin-top:2px">${A.q}</b>
            <span style="display:block;font-size:10.5px;font-weight:700;color:#565d78;line-height:1.7;margin-top:3px">${A.d}</span>
          </div></div>
        <div style="padding:13px 18px;display:flex;justify-content:space-between;align-items:baseline;gap:10px">
          <span style="font-size:10px;font-weight:800;color:#8a8fa5">${h?"سجّلها "+esc(h.updated_by||"المختص"):"لا سجل طبي — والافتراض حملٌ كامل"}</span>
          <span style="font-size:10px;font-weight:800;color:#8a8fa5" class="ltr">${h&&h.updated_at?esc(String(h.updated_at).slice(0,10)):"—"}</span>
        </div></div>`;})()}
    <div class="card" style="border-radius:26px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:13px">
        <b class="h2" style="color:#1d4a3e">الجاهزية</b>
        <span style="background:${S.bg};color:${S.fg};border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:900">${S.ar}${tot?` — أسبوع <span class="ltr">${w}</span>/<span class="ltr">${tot}</span>`:""}</span></div>
      ${tot?`<div style="display:flex;gap:6px;margin-bottom:11px">
        ${[...Array(tot)].map((_,i)=>`<div style="flex:1;height:9px;border-radius:99px;background:${i<w?"#2c8471":"#e6ece9"}"></div>`).join("")}</div>
        <span class="muted" style="display:block">${esc(h.phase||"")} · العودة المتوقعة بعد <span class="ltr">${Math.max(0,tot-w)}</span> أسبوع</span>`
      :`<span class="muted" style="display:block">لا قيود حالية — حمل كامل.</span>`}
      ${h&&h.note?`<div style="background:#eef7f4;border:1px solid #d8e6de;border-radius:14px;padding:11px 13px;margin-top:12px">
        <b style="font-size:11px;color:#1d4a3e;display:block;margin-bottom:4px">توجيه الأسبوع</b>
        <span style="font-size:11.5px;font-weight:600;color:#1d4a3e;line-height:1.85">${esc(h.note)}</span></div>`:""}
      ${h?`<span class="muted" style="display:block;margin-top:10px">سجّلها ${esc(h.updated_by||"المختص")} · <span class="ltr">${new Date(h.updated_at).toLocaleDateString("en-GB")}</span></span>`:""}
    </div>
    ${cal.length?`<div class="card" style="border-radius:26px">
      <b class="h2" style="color:#1d4a3e;display:block;margin-bottom:11px">جلسات التأهيل</b>
      ${cal.map(c=>`<div class="lrow"><span class="ic" style="background:#eef7f4;color:#1d4a3e">◈</span>
        <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(c.title)}</b>
        <span class="muted" style="display:block">${esc(c.subtitle||"")} · <span class="ltr">${esc(c.at_time||"")}</span></span></div></div>`).join("")}</div>`:""}
    <div class="card" style="border-radius:26px">
      <b class="h2" style="color:#1d4a3e;display:block;margin-bottom:4px">البروتوكول الطبي</b>
      <span class="muted" style="display:block;line-height:1.9;margin-bottom:12px">أربع قواعد تحكم هذا الملف — لا تتغيّر بإعداد ولا بطلب.</span>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[["من يكتب","المختص الطبي وحده — لا المدرب ولا الإدارة ولا الأدمن"],
            ["ما يخرج منه","حالة المشاركة فقط: متاح · بقيود · غير متاح — بلا تشخيص ولا تفاصيل"],
            ["من يُمنع دائمًا","الكشافون والوكلاء — بلا استثناء ولا إذن مؤقّت"],
            ["الإذن","منفصل عن إذن السجل، ويُسحب متى شئت، وكل فتح يُكتب"]]
          .map(([k,v])=>`<div style="background:#eef7f4;border:1px solid #d8e6de;border-radius:14px;padding:11px 13px">
            <b style="display:block;font-size:11px;font-weight:900;color:#1d4a3e">${k}</b>
            <span style="display:block;font-size:10.5px;font-weight:700;color:#1d4a3e;line-height:1.8;margin-top:3px">${v}</span></div>`).join("")}
      </div>
      <div style="margin-top:12px;border-top:1px solid #e6ece9;padding-top:11px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
          <b style="font-size:11.5px;font-weight:900;color:#1d4a3e">من فتح ملفك الطبي</b>
          <span style="font-size:10px;font-weight:900;color:${medViews.length?"#1d4a3e":"#8a8fa5"}">${medViews.length?'<span class="ltr">'+medViews.length+'</span> مرة':"لا مرة واحدة"}</span></div>
        ${medViews.length?medViews.slice(0,4).map(v=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:8px 0;border-top:1px solid #f0ece2">
          <span style="font-size:10.5px;font-weight:800;color:#565d78">${esc(v.viewer||"—")}${v.viewer_role?" · "+esc(roleAr[v.viewer_role]||v.viewer_role):""}</span>
          <span class="ltr" style="font-size:9.5px;font-weight:700;color:#8a8fa5">${esc(String(v.created_at||"").slice(0,10))}</span></div>`).join("")
        :`<span class="muted" style="display:block;margin-top:7px;line-height:1.8">ولو فُتح مرة واحدة لظهر اسمها هنا — السجل لا يُحذف ولا يُخفى، حتى منك.</span>`}
        ${medViews.length?`<a onclick="go('viewLog')" style="display:block;font-size:11px;font-weight:900;margin-top:9px;cursor:pointer">السجل كاملًا ←</a>`:""}
      </div>
    </div>
    <div class="dnote">هذا الملف خاصّ بك. كل اطّلاع عليه مسجَّل باسم من فتحه ووقته، والكشافون محجوبون عنه دائمًا.</div>
  </main>`;
};

/* ═══ ٠٥ البروفايل العام — كما يراك الآخرون ═══ */
T.publicView=async()=>{
  const [evs,joins]=await Promise.all([
    q("e",sb.from("match_events").select("*").eq("who",ME.name)),
    q("j",sb.from("match_joins").select("match_id,attended").eq("player_id",ME.id))
  ]);
  const per={};evs.forEach(e=>{(per[e.match_id]=per[e.match_id]||[]).push(e)});
  const gs=Object.values(per),ready=gs.length>=5;
  const sc=g=>{let s=6;g.forEach(e=>{if(e.type==="goal")s+=.5;if(e.type==="assist")s+=.3;if(e.type==="red")s-=.5});return Math.max(1,Math.min(10,s))};
  const rating=ready?(gs.reduce((a,g)=>a+sc(g),0)/gs.length).toFixed(1):"—";
  const ms=new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  const g=evs.filter(e=>e.type==="goal").length,a=evs.filter(e=>e.type==="assist").length;
  return `<main>
    <div class="note">هذا ما يراه نادٍ أو كشاف يزور ملفك — لا أكثر. الطبي والتقويم والرسائل لا تظهر هنا أبدًا.</div>
    <div class="stage" style="border-radius:26px;padding:22px 20px 24px">
      <div style="position:absolute;inset-inline-start:58%;top:-80%;width:74%;height:250%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.55"></div>
      <div style="position:relative;display:flex;align-items:center;gap:15px">
        <span style="width:82px;height:82px;flex:none;border-radius:50% 50% 50% 15px;background:linear-gradient(160deg,#f5c518,#c78c00);display:grid;place-items:center;color:#151a2e;font-size:30px;font-weight:900">${esc((ME.name||"؟")[0])}</span>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:7px"><b style="font-size:20px">${esc(ME.name)}</b><span style="color:#f5c518;font-size:16px">✓</span></div>
          <span style="display:block;font-size:12px;color:#c6cade;font-weight:700;margin-top:5px">${esc(ME.pos||"لاعب")}${ME.age?` · <span class="ltr">${ME.age}</span> سنة`:""}${ME.org?" · "+esc(ME.org):""}</span>
          <span style="display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.1);border-radius:999px;padding:5px 11px;font-size:10.5px;font-weight:800;margin-top:8px">معرّف دائم <span class="ltr">#${String(ME.id).slice(0,8)}</span></span>
        </div>
      </div>
    </div>
    <div class="stat3">
      <div class="stat"><b class="ltr" style="color:#4636e3">${rating}</b><span class="muted">التقييم</span></div>
      <div class="stat"><b class="ltr">${ms}</b><span class="muted">مباراة موثقة</span></div>
      <div class="stat"><b class="ltr" style="color:#c78c00">${g}</b><span class="muted">هدف</span></div>
    </div>
    <div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:10px">ما يظهر للزائر</b>
      ${[["الاسم والمركز والعمر","ظاهر"],["السجل الموثق والتقييم","ظاهر"],["صناعة الأهداف — "+a,"ظاهر"],["الملف الطبي","محجوب 🔒"],["التقويم والرسائل","محجوب 🔒"],["الفرص والرفض","محجوب 🔒"]].map(([k,v])=>`<div class="lrow"><span class="ic" style="background:${v==="ظاهر"?"#efedff":"#eef7f4"};color:${v==="ظاهر"?"#4636e3":"#1d4a3e"}">${v==="ظاهر"?"◉":"🔒"}</span><div style="flex:1"><b style="font-size:12px">${esc(k)}</b></div><span style="font-size:10.5px;font-weight:900;color:${v==="ظاهر"?"#4636e3":"#1d4a3e"};flex:none">${v}</span></div>`).join("")}
      <button class="btn ghost" style="margin-top:11px" onclick="go('privacy')">اضبط دوائر الرؤية ←</button>
    </div>
  </main>`;
};

/* ═══ ٠٦ الإعدادات ═══ */
T.settings=async()=>{
  setTimeout(async()=>{ const el=document.getElementById('pi_rel'); if(!el) return; try{ const r=await (await fetch('release.json?ts='+Date.now(),{cache:'no-store'})).json(); el.textContent=r.stamp.replace(/T(\d\d)-(\d\d)-.*$/,' $1:$2')+' · '+r.fingerprint; }catch(e){ el.textContent='—'; } },0);
  const g=k=>{try{return localStorage.getItem("pi_set_"+k)!=="0"}catch(e){return true}};
  const sw=(k,on)=>`<span onclick="setTog('${k}')" style="width:46px;height:26px;background:${on?"#4636e3":"#d5d0c4"};border-radius:99px;position:relative;flex:none;cursor:pointer;transition:background .18s"><span style="position:absolute;top:3px;inset-inline-start:${on?"23px":"3px"};width:20px;height:20px;background:#fff;border-radius:50%;transition:inset-inline-start .18s"></span></span>`;
  const row=(t,d,k)=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div style="min-width:0"><b style="font-size:12.5px">${t}</b><span class="muted" style="display:block;margin-top:2px">${d}</span></div>${sw(k,g(k))}</div>`;
  return `<main>
    <div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:11px">حسابك</b>
      ${[["الاسم",esc(ME.name)],["الدور",esc(roleAr[ME.role]||ME.role)],["الجهة",esc(ME.org||"—")],["المعرّف الدائم",`<span class="ltr">#${String(ME.id).slice(0,8)}</span>`]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;gap:12px;font-size:11.5px;font-weight:700;padding:7px 0"><span style="color:#8a8fa5">${k}</span><b>${v}</b></div>`).join("")}
      ${ME.role==="player"?`<div style="border-top:1px solid #f0ece2;margin-top:8px;padding-top:12px">
        <b style="display:block;font-size:12px;margin-bottom:9px">هويتك الرياضية — تكتبها أنت</b>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div class="fld" style="margin:0"><label>المركز</label><select id="pf_pos">${["","حارس","مدافع","ظهير","وسط","جناح","مهاجم"].map(o=>`<option value="${o}" ${(ME.pos||"")===o?"selected":""}>${o||"—"}</option>`).join("")}</select></div>
          <div class="fld" style="margin:0"><label>العمر</label><input id="pf_age" type="number" min="6" max="60" inputmode="numeric" class="ltr" value="${ME.age||""}" placeholder="—"></div></div>
        <div class="fld" style="margin:10px 0 0"><label>رقم القميص</label><input id="pf_shirt" type="number" min="1" max="99" inputmode="numeric" class="ltr" value="${ME.shirt||""}" placeholder="—"></div>
        <button class="btn" style="margin-top:10px" onclick="saveIdentity()">احفظ</button>
        ${(ME.age&&ME.age<18)?`<div style="margin-top:12px;border-top:1px solid #f0ece2;padding-top:12px">
          <b style="display:block;font-size:12px">إذن وليّ الأمر</b>
          ${ME.guardian_consent_at?`<span class="muted" style="display:block;margin-top:6px;line-height:1.8">مأذون باسم <b>${esc(ME.guardian_name||"وليّ الأمر")}</b> — للمتابعة والتعاملات العادية. ويبقى التعاقد والانتقال والاطّلاع الطبي باستئذانه.</span>`
            :`<span class="muted" style="display:block;margin-top:6px;line-height:1.8">إذن واحد ودائم للمتابعة والتعاملات العادية — فلا يُستأذن وليّك في كل تدريب. ويبقى الجسيم (تعاقد · انتقال · طبي) باستئذانه.</span>
              <button class="btn" style="margin-top:9px" onclick="guardianConsent()">سجّل إذن وليّ أمرك</button>`}</div>`:""}
        <span class="muted" style="display:block;margin-top:8px;line-height:1.8">العمر يحدّد فئتك ويُفعّل حمايات القاصر تلقائيًا · المركز والرقم يظهران في ملفك العام. الأرقام الرياضية وحدها لا تكتبها أنت.</span></div>`:""}
      <span class="muted" style="display:block;margin-top:8px">معرّفك يبقى معك عبر الأكاديمية والنادي والمنتخب — ولا يُعاد إنشاؤه عند الانتقال.</span>
    </div>
    <div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:12px">الإشعارات</b>
      <div style="display:flex;flex-direction:column;gap:13px">
        ${row("أحداث سجلي","حين يوثّق منظم هدفًا أو مشاركة لك","n_events")}
        ${row("الفرص والتجارب","التجارب المفتوحة واهتمام الأندية","n_opps")}
        ${row("مواعيد التقويم","تذكير قبل التدريب والمباراة","n_cal")}
        ${row("تقارير جهتي","حين تنشر أكاديميتك تقريرًا","n_reports")}
      </div>
    </div>
    <div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:9px">الخصوصية والعرض</b>
      <div class="lrow" onclick="go('privacy')" style="cursor:pointer"><span class="ic">🔒</span><div style="flex:1"><b style="font-size:12px">دوائر الرؤية — من يرى ماذا</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('publicView')" style="cursor:pointer"><span class="ic">◉</span><div style="flex:1"><b style="font-size:12px">اعرض ملفي كما يراه الآخرون</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
    </div>
    <div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:9px">نسختك من البيانات</b>
      <span class="muted" style="display:block;line-height:1.9;margin-bottom:10px">هذا الحساب يعمل كأي حساب عادي تمامًا — نفس الشاشات ونفس الأزرار ونفس القواعد. الفرق الوحيد أن بياناته في نسخة منفصلة، فما تُنشئه وتسجّله وتحصّله يبقى لك ولا يختلط ببيانات غيرك.</span>
      <button class="btn ghost" onclick="piResetDemo()">أعد نسختي إلى حالتها الأولى</button>
    </div>
    <div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:6px">عن التطبيق</b>
      <span class="muted" style="display:block;line-height:1.9">الإصدار المنشور <span id="pi_rel" class="ltr" style="font-weight:700">…</span></span>
    </div>
    <div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:9px">اللغة</b>
      <div style="display:flex;gap:7px">
        <button style="flex:1;background:#4636e3;color:#fff;border:1px solid #4636e3;border-radius:13px;padding:12px;font:900 12px Cairo;cursor:pointer">العربية</button>
        <button style="flex:1;background:#faf8f3;color:#565d78;border:1px solid #e9e4d8;border-radius:13px;padding:12px;font:900 12px Cairo;cursor:pointer" onclick="toast('العربية هي لغة المنصة — والتقارير تُصدَّر بالإنجليزية أيضًا')">English</button>
      </div>
      <span class="muted" style="display:block;margin-top:8px">التقارير وحدها ثنائية اللغة — تبدّلها من مركز التقارير.</span>
    </div>
    <button class="btn ghost" onclick="signOut()">تسجيل الخروج</button>
  </main>`;
};
window.saveIdentity=async()=>{
  const pos=($("#pf_pos")||{}).value||null, age=+($("#pf_age")||{}).value||null, shirt=+($("#pf_shirt")||{}).value||null;
  if(age&&(age<6||age>60)) return toast("العمر بين 6 و60",1);
  const {error}=await sb.from("profiles").update({pos,age,shirt}).eq("id",ME.id);
  if(error) return toast("تعذّر الحفظ: "+error.message,1);
  Object.assign(ME,{pos,age,shirt});
  await sb.from("transparency").insert({actor:ME.name+" — لاعب",action:"حدّث هويته الرياضية (المركز · العمر · الرقم) بنفسه"});
  toast("حُفظت — انعكست في ملفك العام"); render();
};
window.setTog=k=>{try{const v=localStorage.getItem("pi_set_"+k)!=="0";localStorage.setItem("pi_set_"+k,v?"0":"1")}catch(e){};toast("حُفظ الخيار");render()};

/* ═══ ٠٧ بطاقة مباراة اليوم + روابط سريعة داخل نشاطي ═══ */
PL.head=async()=>{
  const [mt,joins,os,ms,hs]=await Promise.all([
    q("m",sb.from("matches").select("*").in("status",["today","open","live"]).order("created_at",{ascending:false}).limit(6)),
    q("j",sb.from("match_joins").select("*,matches(title,status,match_date)").eq("player_id",ME.id).limit(20)),
    q("o",sb.from("pi_opps").select("id,kind,status").eq("player_name",ME.name).eq("status","open")),
    q("g",sb.from("pi_msgs").select("unread,gated").eq("member_name",ME.name)),
    q("h",sb.from("health_status").select("state").eq("player_name",ME.name).limit(1))
  ]);
  const todayStr=new Date().toISOString().slice(0,10);
  const mine=joins.map(j=>j.match_id);
  const todayMatch=mt.find(m=>m.status==="today"||String(m.match_date||"").slice(0,10)===todayStr)||mt.find(m=>mine.includes(m.id)&&m.status!=="final");
  const myJoin=todayMatch?joins.find(j=>j.match_id===todayMatch.id):null;
  const unread=ms.reduce((s,m)=>s+(m.unread||0),0);
  const nOpps=os.length;
  const hState=hs[0]?hs[0].state:"available";
  const badge=n=>n>0?`<span class="ltr" style="position:absolute;top:-4px;inset-inline-end:-4px;background:#e8531f;color:#fff;border-radius:50%;min-width:17px;height:17px;padding:0 4px;display:grid;place-items:center;font-size:9.5px;font-weight:900">${n}</span>`:"";
  const link=(ic,label,view,n,tint)=>`<button onclick="go('${view}')" style="position:relative;flex:1;min-width:0;background:#fff;border:1px solid #e9e4d8;border-radius:18px;padding:13px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:Cairo">
    <span style="position:relative;width:34px;height:34px;border-radius:50% 50% 50% 6px;background:${tint||"#efedff"};color:#4636e3;display:grid;place-items:center;font-size:15px">${ic}${badge(n)}</span>
    <span style="font-size:10.5px;font-weight:900;color:#565d78">${label}</span></button>`;
  const tparts=String((todayMatch&&todayMatch.title)||"").split("×").map(s=>s.replace(/—.*$/,"").trim()).filter(Boolean);
  const tA=(todayMatch&&todayMatch.team_a)||tparts[0]||"", tB=(todayMatch&&todayMatch.team_b)||tparts[1]||"";
  const teamPill=(t)=>t?`<div style="text-align:center;flex:1;min-width:0"><span style="width:42px;height:42px;border-radius:8px 50% 50% 50%;background:rgba(255,255,255,.12);display:grid;place-items:center;margin:0 auto 7px;font-size:14px;font-weight:900">${esc(t[0])}</span><b style="font-size:11.5px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t)}</b></div>`:`<div style="flex:1"></div>`;
  const card=todayMatch?`<div class="stage" style="border-radius:22px">
    <div style="position:absolute;inset-inline-start:64%;top:-70%;width:70%;height:230%;background:${todayMatch.status==="live"?"#e8531f":"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:.5"></div>
    <div style="position:relative">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:10px;font-weight:900;color:#f5c518">${todayMatch.status==="live"?"مباشر الآن":"مباراتك اليوم"}</span>
        <span style="font-size:10px;font-weight:800;color:#c6cade">${esc(todayMatch.comp||"مباراة")}</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        ${teamPill(tA)}
        <div style="text-align:center;padding:0 10px">
          ${todayMatch.status==="live"?`<b class="ltr" style="font-family:'Space Grotesk';font-size:26px;display:block">${todayMatch.score_a}–${todayMatch.score_b}</b>`
            :`<b class="ltr" style="font-family:'Space Grotesk';font-size:17px;color:#faf8f3;display:block">${esc(todayMatch.match_time||"—")}</b>`}
          <span style="font-size:9.5px;color:#c6cade;font-weight:800">${esc(todayMatch.venue||"")}</span></div>
        ${teamPill(tB)}
      </div>
      ${myJoin&&!myJoin.attended
        ? `<button class="btn gold" style="margin-top:14px" onclick="confAtt('${myJoin.id}')">أكّد حضورك</button>`
        : myJoin?`<div style="text-align:center;margin-top:13px;font-size:11.5px;font-weight:900;color:#f5c518">حضورك مؤكد ✓</div>`
        : `<button class="btn gold" style="margin-top:14px" onclick="go('matchView','${todayMatch.id}')">تفاصيل المباراة</button>`}
    </div></div>`:"";
  return card+`<div style="display:flex;gap:8px">
    ${link("✦","فرصك","opps",nOpps)}
    ${link("▦","تقويمي","calendar",0)}
    ${link("✉","الرسائل","messages",unread)}
    ${link("◈","صحتي","health",0,hState==="available"?"#eef7f4":"#fff6d6")}
  </div>`;
};

/* ═══ ٠٨ أرقامك في المباراة ═══ */
PL.matchStats=async(mid)=>{
  if(!mid) return "";
  const evs=await q("e",sb.from("match_events").select("*").eq("match_id",mid).eq("who",ME.name));
  if(!evs.length) return "";
  const key=n=>`pi_ms_${mid}_${n}`;
  const gv=n=>{try{return localStorage.getItem(key(n))||""}catch(e){return ""}};
  const METRICS=[["touch","لمسات في الثلث الهجومي"],["shots","تسديدات على المرمى"],["drib","مراوغات ناجحة"]];
  const goals=evs.filter(e=>e.type==="goal").length,as=evs.filter(e=>e.type==="assist").length;
  const rows=METRICS.map(([k,ar])=>{const v=gv(k);
    return `<div><div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;margin-bottom:5px">
      <span>${ar}</span><b class="ltr" style="font-family:'Space Grotesk';color:${v?"#4636e3":"#c9c2b2"}">${v||"—"}</b></div>
      <div style="height:8px;background:#f0ece2;border-radius:99px;overflow:hidden"><div style="width:${v?Math.min(100,+v*4):0}%;height:100%;background:#4636e3;border-radius:99px"></div></div></div>`;}).join("");
  return `<div class="card" style="border-radius:24px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <b class="h2" style="color:#4636e3">أرقامك في المباراة</b>
      <span class="muted">من التوثيق</span></div>
    <div class="stat3" style="margin-bottom:13px">
      <div class="stat"><b class="ltr" style="color:#c78c00">${goals}</b><span class="muted">هدف</span></div>
      <div class="stat"><b class="ltr" style="color:#4636e3">${as}</b><span class="muted">صناعة</span></div>
      <div class="stat"><b class="ltr">${evs.length}</b><span class="muted">حدثًا موثقًا</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">${rows}</div>
    <div class="note" style="margin-top:12px">الأهداف والصناعة من سجل المنظم. الأرقام التفصيلية تُملأ من نظام القياس عند ربطه — ولا يُعرض رقم بلا مصدر.</div>
  </div>`;
};

/* ═══ التركيب ═══ */
(function(){
  Object.assign(TITLES,{opps:"فرصك",calendar:"تقويمي",messages:"رسائلك",health:"صحتي 🔒",settings:"الإعدادات",publicView:"ملفي كما يراه الآخرون"});

  const _feed=T.feed;
  if(_feed) T.feed=async()=>{
    let head=""; try{ head=await PL.head(); }catch(e){ console.error(e); }
    const body=await _feed();
    return body.replace("<main>","<main>"+head);
  };

  const _mv=T.matchView;
  if(_mv) T.matchView=async()=>{
    if(!PARAM) return `<main><div class="card" style="border-radius:24px;text-align:center;padding:26px"><b style="font-size:13px">لم تُحدَّد مباراة</b><span class="muted" style="display:block;margin-top:5px">افتح المباراة من الاستكشاف أو من سجلك</span><button class="btn" style="margin-top:12px" onclick="go('explore')">استكشف المباريات</button></div></main>`;
    const body=await _mv();
    if(ME.role!=="player") return body;
    let stats=""; try{ stats=await PL.matchStats(PARAM); }catch(e){}
    return stats?body.replace("</main>",stats+"</main>"):body;
  };

  const _pp=P3&&P3.playerProfile;
  if(_pp) P3.playerProfile=async()=>{
    const body=await _pp();
    const extra=`<div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:6px">المزيد</b>
      <div class="lrow" onclick="go('publicView')" style="cursor:pointer"><span class="ic">◉</span><div style="flex:1"><b style="font-size:12px">ملفي كما يراه الآخرون</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('calendar')" style="cursor:pointer"><span class="ic">▦</span><div style="flex:1"><b style="font-size:12px">تقويمي — تدريباتي ومبارياتي</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('health')" style="cursor:pointer"><span class="ic">◈</span><div style="flex:1"><b style="font-size:12px">صحتي 🔒 — الجاهزية والتأهيل</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('messages')" style="cursor:pointer"><span class="ic">✉</span><div style="flex:1"><b style="font-size:12px">رسائلي</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('settings')" style="cursor:pointer"><span class="ic">⚙</span><div style="flex:1"><b style="font-size:12px">الإعدادات</b></div><span style="color:#4636e3;font-weight:900">←</span></div></div>`;
    return body.replace("</main>",extra+"</main>");
  };

  /* الطبي يكتب في القاعدة ليراها اللاعب */
  window.mdCycle=async(n)=>{
    const order=["available","limited","out"];
    const cur=(()=>{try{return localStorage.getItem("pi_med_"+n)||"available"}catch(e){return "available"}})();
    const idx=order.indexOf(cur==="ok"?"available":cur);
    const nxt=order[(idx+1)%3];
    try{localStorage.setItem("pi_med_"+n,nxt)}catch(e){}
    const {error}=await sb.from("health_status").upsert({player_name:n,state:nxt,updated_by:ME.name,updated_at:new Date().toISOString()},{onConflict:"player_name"});
    if(error) return toast("تعذّر: "+error.message,1);
    await trans(`تحديث حالة الجاهزية — ${n}: ${PL.HS[nxt].ar}`);
    toast("انعكست الحالة فورًا للمدرب واللاعب — بلا تشخيص"); render();
  };
})();
