/* PlayIn365 — part 3: طبقة برايم الكاملة — بروفايلات ورسوم بيانية وخدمات لكل دور (تُركّب فوق 1/2) */
const P3={};
/* معادلة الانطلاقة — معلنة في الواجهة، تتبدل بقرار معلن لا بزر */
P3.score=evs=>{let s=6;for(const e of evs){if(e.type==="goal")s+=.5;if(e.type==="assist")s+=.3;if(e.type==="red")s-=.5}return Math.max(1,Math.min(10,Math.round(s*10)/10))};
P3.byMatch=evs=>{const m={};evs.forEach(e=>{(m[e.match_id]=m[e.match_id]||[]).push(e)});return Object.values(m)};
P3.curve=(vals,best)=>{if(vals.length<2)return null;const w=300,h=90,min=Math.min(...vals,5.5),max=Math.max(...vals,8);
  const pts=vals.map((v,i)=>[i*(w/(vals.length-1)),h-10-((v-min)/((max-min)||1))*(h-26)]);
  const d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  const bi=vals.indexOf(Math.max(...vals)),bp=pts[bi],lp=pts[pts.length-1];
  return `<svg viewBox="0 0 300 90" style="width:100%;height:auto;display:block" preserveAspectRatio="none"><path d="${d} L300,90 L0,90 Z" fill="rgba(70,54,227,.12)"></path><path d="${d}" fill="none" stroke="#4636e3" stroke-width="3" stroke-linecap="round"></path><circle cx="${bp[0]}" cy="${bp[1]}" r="5" fill="#f5c518" stroke="#fff" stroke-width="2"></circle><circle cx="${lp[0]}" cy="${lp[1]}" r="5" fill="#e8531f" stroke="#fff" stroke-width="2"></circle></svg>`};
P3.compBar=()=>`<div class="bar" style="height:10px"><span style="width:50%;background:#151a2e"></span><span style="width:30%;background:#4636e3"></span><span style="width:15%;background:#c78c00"></span><span style="width:5%;background:#c9c2b2"></span></div>
  <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:7px"><span class="muted" style="color:#151a2e">■ مسجَّل 50٪</span><span class="muted" style="color:#4636e3">■ خبراء 30٪</span><span class="muted" style="color:#c78c00">■ داعمون 15٪</span><span class="muted">■ جمهور 5٪</span></div>
  <div class="wnote" style="margin-top:9px;border-top:1px solid #f0ece2;padding-top:9px"><span class="muted" style="line-height:1.8">المال لا يشتري وزنًا — سقف صلب للداعمين والجمهور.</span><span class="muted" style="line-height:1.8">الجمهور لا يُحتسب إلا بعتبة ظهور.</span><span class="muted" style="line-height:1.8">و«—» حيث لا تقييم بعد — لا صفر.</span></div>`;
P3.hex=(fill,inner,label)=>`<span style="width:58px;height:66px;background:${fill};${inner?"":"border:2px dashed #d5d0c4;"}clip-path:polygon(50% 0,100% 16%,100% 66%,50% 100%,0 66%,0 16%);display:grid;place-items:center;font-size:${inner?"19px":"15px"};color:${inner?"#fff":"#b0aa9c"}" title="${label||""}">${inner||"؟"}</span>`;
P3.headCard=(sub,av,ringHTML,extra)=>`<div class="stage" style="border-radius:26px;padding:22px 20px 24px">
  <span style="font-size:11.5px;color:#c6cade;font-weight:800;background:rgba(255,255,255,.08);border-radius:999px;padding:4px 13px;width:fit-content;display:inline-block">${sub}</span>
  <div style="display:flex;align-items:center;gap:15px;margin-top:16px">
    <div style="position:relative;width:84px;height:84px;flex:none">${ringHTML||""}
      <div style="position:absolute;inset:0;border-radius:50% 50% 50% 10px;background:linear-gradient(160deg,#4636e3,#2a2260);display:grid;place-items:center;font-weight:900;font-size:31px">${esc(av)}</div></div>
    <div style="display:flex;flex-direction:column;gap:4px;min-width:0">${extra}</div></div></div>`;

/* ═══ ملفي — لكل دور ═══ */
T.profile=async()=>{
  const r=ME.role;
  if(r==="player")return P3.playerProfile();
  if(r==="coach")return P3.coachProfile();
  if(r==="academy"||r==="venue")return P3.orgProfile();
  if(r==="guardian")return T.guardian();
  return P3.genericProfile();
};
T.rating=T.profile;

P3.playerProfile=async()=>{
  const evs=await q("ev",sb.from("match_events").select("*,matches(title,comp,created_at)").eq("who",ME.name).order("created_at",{ascending:true}));
  const joins=await q("jn",sb.from("match_joins").select("*,matches(title,status,match_date)").eq("player_id",ME.id));
  const perMatch=P3.byMatch(evs);
  const verified=new Set([...perMatch.map(g=>g[0].match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  const series=perMatch.map(g=>P3.score(g));
  const ready=series.length>0;   /* قرار المالك: التقييم يظهر من أول مباراة موثقة ومعه حجم عيّنته */
  const rating=ready&&series.length?(series.reduce((a,b)=>a+b,0)/series.length).toFixed(1):null;
  const curve=P3.curve(series);
  const goals=evs.filter(e=>e.type==="goal").length,assists=evs.filter(e=>e.type==="assist").length;
  const hat=perMatch.some(g=>g.filter(e=>e.type==="goal").length>=3);
  /* شبكة الأسابيع من النشاط الفعلي */
  const wk=new Set([...evs,...joins].map(x=>{const d=new Date(x.created_at);return d.getFullYear()+"-"+Math.floor((d-new Date(d.getFullYear(),0,1))/6048e5)}));
  const now=new Date(),cells=[...Array(12)].map((_,i)=>{const d=new Date(now-(11-i)*6048e5);const k=d.getFullYear()+"-"+Math.floor((d-new Date(d.getFullYear(),0,1))/6048e5);return wk.has(k)});
  return `<main>
  ${P3.headCard("ملف لاعب",(ME.name||"؟")[0],`<div style="position:absolute;inset:-7px;border-radius:50%;border:2px dashed #f5c518;animation:orbit 28s linear infinite"></div><span style="position:absolute;top:-10px;inset-inline-start:50%;width:10px;height:10px;background:#f5c518;border-radius:50%;border:2px solid #151a2e;z-index:2"></span>`,
    `<b style="font-size:18px">${esc(ME.name)}</b><span style="font-size:12px;color:#c6cade">${esc(ME.pos||"لاعب")}${ME.age?" · "+N(ME.age)+" سنة":""}${ME.org?" · "+esc(ME.org):""}</span>
     <span style="background:rgba(245,197,24,.15);color:#f5c518;border-radius:999px;padding:3px 12px;font-size:10.5px;font-weight:800;width:fit-content">${verified} مباراة موثقة</span>`)}
  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b class="h2" style="color:#4636e3">التقييم العام</b>
      <div style="text-align:end"><b class="ltr" style="font-family:'Space Grotesk';font-size:34px;line-height:1;display:block">${rating??"—"}</b><span class="muted">${series.length?"من "+series.length+" مباراة موثقة":"بانتظار أول مباراة موثقة"}</span></div></div>
    ${P3.compBar()}
    <a onclick="go('ratingDetail')" style="font-size:11px;font-weight:900;display:block;margin-top:9px">كيف يُحسب؟ ←</a>
    <div id="rdet" style="display:none;margin-top:9px;border-top:1px solid #f0ece2;padding-top:9px">
      <span class="muted" style="display:block;line-height:2">الأوزان: مسجَّل 50٪ · خبراء 30٪ · داعمون موثّقون 15٪ · جمهور 5٪ — وسقف صلب: الداعمون + الجمهور ≤ 20٪ مهما كان العدد. الرقم يظهر من أول مباراة موثقة ومعه حجم عيّنته — و«—» للصفر وحده: الصفر يُقرأ حكمًا والشرطة انتظارًا. الرقم الحالي من مصدر «مسجَّل» وحده بمعادلة الانطلاقة المعلنة: 6.0 + 0.5×هدف + 0.3×صناعة − 0.5×حمراء لكل مباراة.</span></div></div>
  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px"><b class="h2" style="color:#4636e3">منحنى الجاهزية — بمبارياتك</b>${series.length?`<b class="ltr" style="font-family:'Space Grotesk';font-size:20px">${series[series.length-1]}</b>`:""}</div>
    ${curve||`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center"><span class="muted">يرتسم منحناك بعد مباراتين موثقتين — عندك ${series.length}</span></div>`}
    ${curve?`<div style="display:flex;justify-content:space-between;margin-top:6px"><span class="muted" style="color:#c78c00">● ذهبي: أفضل أداء موثق</span><span class="muted" style="color:#e8531f">● برتقالي: الأحدث</span></div>`:""}</div>
  <div class="card" style="border-radius:26px"><b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">بصمة المهارات</b>
    <div style="display:flex;gap:15px;align-items:center">
      <svg viewBox="0 0 120 120" style="width:110px;height:110px;flex:none">
        <polygon points="60,8 105,34 105,86 60,112 15,86 15,34" fill="none" stroke="#e9e4d8" stroke-width="1.5"></polygon>
        <polygon points="60,34 82,47 82,73 60,86 38,73 38,47" fill="none" stroke="#efedff" stroke-width="1"></polygon>
        ${ready?`<polygon points="60,20 96,40 90,80 60,102 28,76 32,42" fill="rgba(70,54,227,.26)" stroke="#4636e3" stroke-width="3" stroke-linejoin="round"></polygon><circle cx="60" cy="20" r="4" fill="#f5c518" stroke="#fff" stroke-width="1.5"></circle>`:`<polygon points="60,26 92,42 88,76 60,96 32,72 34,44" fill="none" stroke="#b9b0f5" stroke-width="2" stroke-dasharray="5 5"></polygon>`}</svg>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:11.5px;color:#565d78;font-weight:700">
        <span>سرعة · تسديد · تمرير</span><span>مراوغة · تمركز · لياقة</span>
        ${ready?`<span style="color:#c78c00">★ من ${verified} مباراة موثقة</span>`:`<span class="muted">تتكوّن بصمتك من أول مباراة موثقة</span>`}</div></div></div>
  <div class="card" style="border-radius:26px"><b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">انتظام الموسم — شبكة الأسابيع</b>
    <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:5px">${cells.map(c=>`<span style="aspect-ratio:1;background:${c?"#4636e3":"#efedff"};border-radius:5px"></span>`).join("")}</div>
    <div style="display:flex;gap:12px;margin-top:9px;flex-wrap:wrap"><span class="muted" style="color:#4636e3">■ أسبوع فيه نشاط موثق</span><span class="muted">■ بلا نشاط</span></div></div>
  <div class="card" style="border-radius:26px"><b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">خزانة الإنجازات</b>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      ${P3.hex(goals>0?"linear-gradient(160deg,#f5c518,#c78c00)":"#efece3",goals>0?"⚽":"","أول هدف موثق")}
      ${P3.hex(verified>=5?"linear-gradient(160deg,#4636e3,#2a2260)":"#efece3",verified>=5?"▤":"","5 مباريات موثقة")}
      ${P3.hex(hat?"linear-gradient(160deg,#e8531f,#a83b25)":"#efece3",hat?"🎩":"","هاتريك")}
      ${P3.hex("#efece3","","الشاغر التالي")}</div>
    <span class="muted" style="display:block;margin-top:9px">${goals?`أهدافك ${N(goals)} · صناعاتك ${N(assists)} — كل درع بمرجعه الموثق`:"أول درع ينتظر أول هدف موثق"}</span></div>
  <div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:6px">خدماتك</b>
    <div class="lrow" onclick="go('reports')" style="cursor:pointer"><span class="ic">▤</span><div style="flex:1"><b style="font-size:12px">تقريري الشخصي — قابل للمشاركة</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
    <div class="lrow" onclick="go('records')" style="cursor:pointer"><span class="ic">▤</span><div style="flex:1"><b style="font-size:12px">سجلي الرياضي — نهر المسيرة</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
    <div class="lrow" onclick="go('privacy')" style="cursor:pointer"><span class="ic">🔒</span><div style="flex:1"><b style="font-size:12px">الخصوصية والتحكم — دوائر الرؤية</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
    <div class="lrow" onclick="go('explore')" style="cursor:pointer"><span class="ic">◎</span><div style="flex:1"><b style="font-size:12px">طلب توثيق مباراة جديدة</b></div><span style="color:#4636e3;font-weight:900">←</span></div></div>
  </main>`;
};
window.p3tog=id=>{const e=document.getElementById(id);if(e)e.style.display=e.style.display==="none"?"block":"none"};

P3.coachProfile=async()=>{
  const att=await q("att",sb.from("attendance").select("*").eq("recorded_by",ME.name).order("created_at",{ascending:false}).limit(200));
  const my=await q("mt",sb.from("matches").select("*").eq("organizer_id",ME.id));
  const per={};att.forEach(a=>{per[a.player_name]=(per[a.player_name]||0)+1});
  const top=Object.entries(per).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const days=[...Array(7)].map((_,i)=>att.filter(a=>new Date(a.created_at).getDay()===i).length),mx=Math.max(...days,1);
  return `<main>
  ${P3.headCard("ملف مدرب",(ME.name||"؟")[0],`<div style="position:absolute;inset:-7px;border-radius:50%;border:3px solid #f5c518"></div>`,
    `<b style="font-size:18px">${esc(ME.name)}</b><span style="font-size:12px;color:#c6cade">مدرب${ME.org?" · "+esc(ME.org):""}</span>
     <span style="background:rgba(245,197,24,.15);color:#f5c518;border-radius:999px;padding:3px 12px;font-size:10.5px;font-weight:800;width:fit-content">${att.length} حصة موثقة باسمك</span>`)}
  <div class="card" style="border-radius:26px"><b class="h2" style="color:#243244;display:block;margin-bottom:13px">أثر التدريب — أكثر لاعبيك التزامًا</b>
    ${top.length?top.map(([n,c],i)=>{const w=40+Math.min(140,c*14);return `<div style="display:grid;grid-template-columns:64px 1fr 44px;gap:10px;align-items:center;font-size:12px;font-weight:700;margin-bottom:9px"><span style="color:#565d78;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n)}</span><svg viewBox="0 0 200 16" style="width:100%;height:16px" preserveAspectRatio="none"><line x1="14" y1="8" x2="${14+w}" y2="8" stroke="${i===0?"#c78c00":"#4636e3"}" stroke-width="3" stroke-linecap="round"></line><circle cx="14" cy="8" r="6" fill="#d5d0c4"></circle><circle cx="${14+w}" cy="8" r="6" fill="${i===0?"#f5c518":"#4636e3"}"></circle></svg><span style="color:${i===0?"#c78c00":"#4636e3"}" class="ltr">+${c}${i===0?"★":""}</span></div>`}).join("")+`<span class="muted">النقطة الرمادية بداية التوثيق ← الملونة اليوم. ★ الأكثر حصصًا موثقة. الرقم = حصص حضور سجّلتها باسمك.</span>`:`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:16px;text-align:center"><span class="muted">يظهر الأثر بعد أول حصص حضور تسجلها</span></div>`}</div>
  <div class="card" style="border-radius:26px"><b class="h2" style="color:#243244;display:block;margin-bottom:11px">حمل الأسبوع التدريبي</b>
    <div style="display:flex;align-items:flex-end;gap:5px;height:56px">${["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"].map((d,i)=>`<span style="flex:1;height:${Math.max(8,days[(i+1)%7]/mx*100)}%;background:${days[(i+1)%7]===mx&&days[(i+1)%7]>0?"#f5c518":"#4636e3"};border-radius:4px 4px 0 0;opacity:${days[(i+1)%7]?1:.18}"></span>`).join("")}</div>
    <span class="muted" style="display:block;margin-top:7px">ارتفاع العمود = حصص موثقة · الذهبي يوم الذروة</span></div>
  <div class="stage" style="border-radius:26px;display:flex;align-items:center;justify-content:space-between;gap:12px">
    <div><b style="font-size:14px;color:#f5c518">${my.filter(m=>m.status!=="final").length} مباراة تحت مسؤوليتك</b><span style="display:block;font-size:11.5px;color:#9aa0b8">قرارك ينعكس مباشرة — وتصحيحك باسمك</span></div>
    <button class="btn gold" style="width:auto;padding:11px 20px;border-radius:999px" onclick="go('orgMatch')">مبارياتي</button></div>
  <div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:6px">خدماتك</b>
    <div class="lrow" onclick="go('acad')" style="cursor:pointer"><span class="ic">▤</span><div style="flex:1"><b style="font-size:12px">الوضع الخفيف — حضور واشتراكات</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
    <div class="lrow" onclick="go('newMatch')" style="cursor:pointer"><span class="ic">＋</span><div style="flex:1"><b style="font-size:12px">إنشاء مباراة — أنت المنظم المسؤول</b></div><span style="color:#4636e3;font-weight:900">←</span></div></div>
  </main>`;
};

P3.orgProfile=async()=>{
  const isV=ME.role==="venue",org=ME.org||(isV?"ملعبي":"أكاديميتي");
  const att=await q("a",sb.from("attendance").select("player_name").eq("org",org));
  const subs=await q("s",sb.from("subscriptions").select("*").eq("org",org));
  const bs=isV?await q("b",sb.from("bookings").select("*").eq("venue",org)):[];
  const my=await q("m",sb.from("matches").select("id").eq("organizer_id",ME.id));
  const players=isV?new Set(bs.filter(b=>b.who&&b.who!=="شاغر").map(b=>b.who)).size:new Set(att.map(a=>a.player_name)).size;
  const rev=isV?bs.filter(b=>b.status==="paid"||b.status==="accepted").reduce((s,b)=>s+(+b.price||0),0):subs.filter(s=>s.paid).reduce((a,s)=>a+(+s.amount||0),0);
  return `<main>
  ${P3.headCard(isV?"ملف ملعب":"ملف أكاديمية",(org||"؟")[0],"",
    `<b style="font-size:18px">${esc(org)}</b><span style="font-size:12px;color:#c6cade">${roleAr[ME.role]} · يديره ${esc(ME.name)}</span>
     <span style="background:rgba(245,197,24,.15);color:#f5c518;border-radius:999px;padding:3px 12px;font-size:10.5px;font-weight:800;width:fit-content">التوثيق القانوني لازم للجهات ✓</span>`)}
  <div class="stat3"><div class="stat"><b>${players}</b><span class="muted">${isV?"عملاء":"لاعبون"}</span></div><div class="stat"><b style="color:#4636e3">${isV?bs.length:my.length}</b><span class="muted">${isV?"حجوزات":"مباريات"}</span></div><div class="stat"><b style="color:#2c6e49">${rev.toLocaleString("en")}</b><span class="muted">إيراد ر.س</span></div></div>
  <div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:6px">خدمات الجهة</b>
    ${isV?`<div class="lrow" onclick="go('venue')" style="cursor:pointer"><span class="ic">⌂</span><div style="flex:1"><b style="font-size:12px">جدول اليوم والطلبات</b></div><span style="color:#4636e3;font-weight:900">←</span></div>`:`
    <div class="lrow" onclick="go('acad')" style="cursor:pointer"><span class="ic">✓</span><div style="flex:1"><b style="font-size:12px">حضور بنقرة + التحصيل</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
    <div class="lrow" onclick="go('orgMatch')" style="cursor:pointer"><span class="ic">▶</span><div style="flex:1"><b style="font-size:12px">مبارياتنا — التسجيل المباشر</b></div><span style="color:#4636e3;font-weight:900">←</span></div>`}
    <div class="lrow" onclick="go('market')" style="cursor:pointer"><span class="ic">◈</span><div style="flex:1"><b style="font-size:12px">المتجر — النسبة معلنة قبل النشر</b></div><span style="color:#4636e3;font-weight:900">←</span></div></div>
  <div class="note">${isV?"نِسب المنصة: منتج رقمي وتذاكر 15–20٪ · بضاعة 8–10٪.":"نموذجك: اشتراك و0٪ أو بلا اشتراك و4٪ — تختار واحدًا كل موسم."}</div>
  </main>`;
};

P3.genericProfile=async()=>{
  const tr=await q("t",sb.from("transparency").select("*").order("created_at",{ascending:false}).limit(50));
  const mine=tr.filter(t=>t.actor&&t.actor.startsWith(ME.name));
  return `<main>
  ${P3.headCard("ملف "+roleAr[ME.role],(ME.name||"؟")[0],"",
    `<b style="font-size:18px">${esc(ME.name)}</b><span style="font-size:12px;color:#c6cade">${roleAr[ME.role]}${ME.org?" · "+esc(ME.org):""}</span>
     <span style="background:rgba(245,197,24,.15);color:#f5c518;border-radius:999px;padding:3px 12px;font-size:10.5px;font-weight:800;width:fit-content">${mine.length} إجراء باسمك في سجل الشفافية</span>`)}
  <div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:8px">آخر إجراءاتك — كلها باسمك</b>
    ${mine.slice(0,6).map(t=>`<div class="lrow"><span class="ic">▤</span><div style="flex:1"><b style="font-size:12px">${esc(t.action)}</b><span class="muted" style="display:block" ><span class="ltr">${new Date(t.created_at).toLocaleString("en-GB")}</span></span></div></div>`).join("")||`<span class="muted">لا إجراءات بعد — كل ما تفعله يُسجّل باسمك.</span>`}</div>
  </main>`;
};

/* ═══ رئيسية اللاعب — الشاشة المعتمدة ═══ */
T.home=async()=>{
  const matches=CACHE.matches=await q("matches",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(20));
  const live=matches.find(m=>m.status==="live"),today=matches.find(m=>m.status==="today");
  const open=matches.filter(m=>m.status==="open").slice(0,2);
  const joins=await q("jn",sb.from("match_joins").select("*,matches(title,status)").eq("player_id",ME.id));
  const evs=await q("ev",sb.from("match_events").select("created_at").eq("who",ME.name));
  const slots=await q("sl",sb.from("bookings").select("*").eq("status","free").limit(1));
  const unconf=joins.filter(j=>!j.attended&&j.matches&&j.matches.status!=="final").length;
  const act=[...evs,...joins];
  const dayNames=["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];
  const arcs=[...Array(5)].map((_,i)=>{const d=new Date(Date.now()-(4-i)*864e5);const c=act.filter(x=>new Date(x.created_at).toDateString()===d.toDateString()).length;return{n:dayNames[d.getDay()],c,today:i===4}});
  const mxc=Math.max(...arcs.map(a=>a.c),1);
  return `<main>
  <div><b style="font-size:20px;font-weight:900">هلا ${esc(ME.name.split(" ")[0])} 👋</b><span style="display:block;font-size:12.5px;color:#8a8fa5;font-weight:700">${unconf?`عندك ${N(unconf)} مباراة تنتظر تأكيد حضورك`:live?"مباراة مباشرة الآن — تابعها":"أمورك هادئة — استكشف القريب منك"}</span></div>
  ${live?`<div class="stage" style="border-radius:26px;cursor:pointer" onclick="go('matchView','${live.id}')">
    <div style="position:absolute;inset-inline-start:65%;top:-40%;width:70%;height:180%;background:#e8531f;border-radius:50%;opacity:.45"></div>
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center;gap:10px">
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        <span style="display:inline-flex;align-items:center;gap:7px;background:#e8531f;color:#fff;border-radius:999px;padding:4px 13px;font-size:11px;font-weight:900;width:fit-content"><span style="width:7px;height:7px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite"></span>مباشر الآن</span>
        <b style="font-size:14.5px">${esc(live.title)}</b>
        <span style="font-size:11.5px;color:#c6cade">المنظم المسؤول: ${esc(live.organizer_name)}</span></div>
      <b class="ltr" style="font-family:'Space Grotesk';font-size:32px;flex:none">${live.score_a}–${live.score_b}</b></div></div>`:""}
  ${today&&!live?`<div class="stage" style="border-radius:26px"><span class="chip" style="background:#f5c518;color:#151a2e">مباراة اليوم</span><b style="display:block;font-size:15px;margin-top:8px">${esc(today.title)}</b><span style="font-size:12px;color:#c6cade" class="ltr">${esc(today.match_time)}</span></div>`:""}
  <div class="card" style="border-radius:26px"><b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">أسبوعك — قوس الأيام</b>
    ${mxc?`<div style="display:flex;justify-content:space-between;align-items:flex-end;padding:0 4px">
      ${arcs.map(a=>{const f=a.c?Math.max(24,a.c/mxc*88):0;return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><svg viewBox="0 0 36 36" style="width:34px;height:34px"><circle cx="18" cy="18" r="14" fill="none" stroke="#efedff" stroke-width="5" ${a.c?"":'stroke-dasharray="3 4"'}></circle>${a.c?`<circle cx="18" cy="18" r="14" fill="none" stroke="${a.today?"#f5c518":"#4636e3"}" stroke-width="5" stroke-dasharray="${f} 88" stroke-linecap="round" transform="rotate(-90 18 18)"></circle>`:`<text x="18" y="22" text-anchor="middle" font-family="Cairo" font-size="11" font-weight="900" fill="#c9cdd9">—</text>`}</svg><span style="font-size:10.5px;font-weight:800;color:${a.today?"#c78c00":a.c?"#565d78":"#b0b5c6"}">${a.n}</span></div>`}).join("")}</div>
    <span class="muted" style="display:block;margin-top:8px">كل يوم حلقة تكتمل بنشاطك الموثق · واليوم الخالي يحمل «—» لا صفرًا</span>`
    :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:20px;text-align:center">
      <b style="display:block;font-size:12.5px">أسبوعك يبدأ من أول مباراة موثّقة</b>
      <span class="muted" style="display:block;margin-top:5px;line-height:1.8">لا نشاط مسجَّلًا هذا الأسبوع — والقوس يرتسم لحظة يوقّع منظّمٌ أول حدث باسمك</span>
      <button class="btn" style="margin-top:11px;padding:11px" onclick="go('explore')">مباريات قريبة</button></div>`}</div>
  <div class="card" style="border-radius:26px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px"><b class="h2" style="color:#4636e3">قريب منك</b><a onclick="go('explore')" style="font-size:11.5px;font-weight:900">الكل ←</a></div>
    <div style="display:flex;flex-direction:column;gap:9px">
      ${open.map(m=>`<div onclick="go('matchView','${m.id}')" style="display:flex;align-items:center;gap:11px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:17px;padding:11px 13px;cursor:pointer"><span style="width:38px;height:38px;border-radius:13px;background:#efedff;display:grid;place-items:center;font-size:16px;flex:none">⚽</span><div style="flex:1;min-width:0"><b style="font-size:12.5px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.title)}</b><span class="muted">${esc(m.match_time)}${m.fee>0?" · "+N(m.fee)+" ر.س":" · مجانًا"} · ${esc(m.organizer_name)}</span></div><span style="color:#4636e3;font-weight:900">←</span></div>`).join("")}
      ${slots.map(s=>`<div style="display:flex;align-items:center;gap:11px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:17px;padding:11px 13px"><span style="width:38px;height:38px;border-radius:13px;background:#fff6d6;display:grid;place-items:center;font-size:16px;flex:none">🏟</span><div style="flex:1"><b style="font-size:12.5px">${esc(s.venue)} — ساعة شاغرة</b><span class="muted" style="display:block"><span class="ltr">${esc(s.slot)}</span>${s.price?" · "+N(s.price)+" ر.س":""}</span></div><button class="btn" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px" onclick="reqBook('${s.venue}','${esc(s.slot)}',${s.price||0})">احجز</button></div>`).join("")}
      ${!open.length&&!slots.length?`<span class="muted">لا شيء قريب الآن — المنظمون ينشئون المباريات من زر +</span>`:""}</div></div>
  ${joins.length||evs.length?`<div class="card" style="border-radius:26px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b class="h2">آخر ما دخل سجلك</b><a onclick="go('records')" style="font-size:11.5px;font-weight:900">السجل ←</a></div><span class="muted">${N(evs.length)} حدث موثق · ${N(joins.length)} مشاركة</span></div>`:""}
  </main>`;
};
window.reqBook=async(v,s,p)=>{await sb.from("bookings").insert({venue:v,slot:s,who:ME.name,status:"requested",price:p});toast("أُرسل طلب الحجز — بانتظار رد الملعب (معاملة تجارية)");};

/* ═══ سجلي — نهر المسيرة ═══ */
T.records=async()=>{
  const evs=await q("ev",sb.from("match_events").select("*,matches(title,comp,score_a,score_b,status,organizer_name)").eq("who",ME.name).order("created_at",{ascending:false}));
  const joins=await q("jn",sb.from("match_joins").select("*,matches(title,status,score_a,score_b,organizer_name)").eq("player_id",ME.id).order("created_at",{ascending:false}));
  const months={};[...evs,...joins].forEach(x=>{const k=new Date(x.created_at).toISOString().slice(0,7);months[k]=(months[k]||0)+1});
  const mk=Object.keys(months).sort();
  const mLabel=k=>{const[y,m]=k.split("-");return["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"][+m-1]||k};
  const river=mk.length>=2?(()=>{
    const W=300,H=104,PB=22,PT=12,mx=Math.max(...mk.map(k=>months[k]));
    const X=i=>mk.length>1?8+i*((W-16)/(mk.length-1)):W/2;
    const Y=v=>H-PB-(v/mx)*(H-PB-PT);
    const pts=mk.map((k,i)=>[X(i),Y(months[k])]);
    const line=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
    const area=`${line} L${pts[pts.length-1][0].toFixed(1)},${H-PB} L${pts[0][0].toFixed(1)},${H-PB} Z`;
    const grid=[0,.5,1].map(f=>`<line x1="6" y1="${Y(mx*f).toFixed(1)}" x2="${W-6}" y2="${Y(mx*f).toFixed(1)}" stroke="#f0ece2" stroke-width="1"></line>`).join("");
    const dots=pts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===pts.length-1?5:3.5}" fill="${i===pts.length-1?"#e8531f":"#4636e3"}" stroke="#fff" stroke-width="2"></circle>`).join("");
    const step=Math.ceil(mk.length/5);
    const labels=mk.map((k,i)=>(i%step===0||i===mk.length-1)?`<text x="${X(i).toFixed(1)}" y="${H-7}" text-anchor="middle" font-family="Cairo" font-size="8.5" font-weight="700" fill="#8a8fa5">${mLabel(k)}</text>`:"").join("");
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
      <defs><linearGradient id="rvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(70,54,227,.30)"></stop><stop offset="1" stop-color="rgba(70,54,227,.03)"></stop></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#rvg)"></path>
      <path d="${line}" fill="none" stroke="#4636e3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
      ${dots}${labels}
      <text x="6" y="${(Y(mx)-3).toFixed(1)}" font-family="Space Grotesk" font-size="9" font-weight="700" fill="#c78c00">${mx}</text></svg>`})():null;
  const byM={};evs.forEach(e=>{(byM[e.match_id]=byM[e.match_id]||[]).push(e)});
  const matchCards=Object.entries(byM).slice(0,4);
  return `<main>
  <div class="card" style="border-radius:26px"><b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">مسيرتي شهراً بشهر — عدد الأحداث الموّثقة</b>
    ${river||`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center"><span class="muted">ترتسم مسيرتك بعد شهرين من النشاط الموثق</span></div>`}
    ${river?`<div style="display:flex;gap:14px;margin-top:7px;flex-wrap:wrap"><span class="muted" style="color:#4636e3">● شهر موثّق</span><span class="muted" style="color:#e8531f">● الأحدث</span><span class="muted" style="color:#c78c00">الرقم أعلىه = أعلى شهر</span></div>`:""}</div>
  ${matchCards.map(([mid,g])=>{const m=g[0].matches||{};return `<div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px"><b style="font-size:13px">${esc(m.title||"مباراة")}</b><b class="ltr" style="font-family:'Space Grotesk'">${m.score_a??0}–${m.score_b??0}</b></div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">
      <span style="background:#fff6d6;color:#c78c00;border-radius:6px;padding:3px 10px;font-size:10px;font-weight:900">وثّقه ${esc(m.organizer_name||"المنظم")} ✓</span>
      <span style="background:#fff;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:6px;padding:3px 10px;font-size:10px;font-weight:800" class="ltr">#${String(mid).slice(0,8)}</span></div>
    ${g.map(e=>`<div class="lrow"><span class="ic">${e.type==="goal"?"⚽":e.type==="assist"?"◎":e.type==="yellow"?"▮":e.type==="red"?"▮":"⇄"}</span><div style="flex:1"><b style="font-size:12px">${esc(evLabel(e))}</b><span class="muted" style="display:block">الدقيقة ${N(e.minute)} · سجّله ${esc(e.recorded_by)}</span></div></div>`).join("")}
    <span class="muted" style="display:block;margin-top:7px">أي جهة تفتح الرقم المرجعي ترى السجل نفسه — نسخة واحدة من الحقيقة.</span></div>`}).join("")}
  ${!matchCards.length?`<div class="card" style="border-radius:26px;text-align:center;padding:26px"><b style="font-size:13px">سجلك يبدأ من أول مباراة</b><span class="muted" style="display:block;margin-top:5px">انضم لمباراة قريبة — كل حدث يدخل لحظة تسجيله من المنظم</span><button class="btn" style="margin-top:12px" onclick="go('explore')">استكشف المباريات</button></div>`:""}
  ${joins.length?`<div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:8px">مشاركاتي</b>${joins.slice(0,5).map(j=>`<div class="lrow"><span class="ic">✓</span><div style="flex:1"><b style="font-size:12px">${esc(j.matches?.title||"مباراة")}</b><span class="muted" style="display:block">${j.attended?"حضور مؤكد":"بانتظار تأكيد حضورك"}</span></div>${!j.attended&&j.matches?.status!=="final"?`<button class="btn" style="width:auto;padding:7px 13px;border-radius:999px;font-size:10px" onclick="confAtt('${j.id}')">أكّد</button>`:""}</div>`).join("")}</div>`:""}
  </main>`;
};
window.confAtt=async(id)=>{await sb.from("match_joins").update({attended:true}).eq("id",id);toast("أُكّد حضورك");render();};

/* ═══ الخصوصية — دوائر الرؤية ═══ */
T.privacy=async()=>{
  const g=k=>{try{return localStorage.getItem("pi_priv_"+k)!=="0"}catch(e){return true}};
  const sw=(k,on)=>`<span onclick="privTog('${k}')" style="width:46px;height:26px;background:${on?"#4636e3":"#d5d0c4"};border-radius:99px;position:relative;flex:none;cursor:pointer;transition:background .18s"><span style="position:absolute;top:3px;inset-inline-start:${on?"23px":"3px"};width:20px;height:20px;background:#fff;border-radius:50%;transition:inset-inline-start .18s"></span></span>`;
  return `<main>
  <div class="card" style="border-radius:26px"><b class="h2" style="color:#4636e3;display:block;margin-bottom:13px">دوائر الرؤية — من يرى ماذا</b>
    <div style="position:relative;width:100%;max-width:250px;aspect-ratio:1;margin:0 auto">
      <div style="position:absolute;inset:0;border-radius:50%;background:#efedff;border:1.5px dashed #b9b0f5;display:flex;justify-content:center"><span style="font-size:10px;font-weight:900;color:#8a8fa5;margin-top:8px">العامة — الاسم والمركز فقط</span></div>
      <div style="position:absolute;inset:13%;border-radius:50%;background:#e2deff;border:1.5px dashed #9a8df0;display:flex;justify-content:center"><span style="font-size:10px;font-weight:900;color:#6a5fd0;margin-top:6px">الأندية الموثقة — السجل</span></div>
      <div style="position:absolute;inset:26%;border-radius:50%;background:#cfc8fb;display:flex;justify-content:center"><span style="font-size:10px;font-weight:900;color:#4636e3;margin-top:6px">فريقي — الجاهزية</span></div>
      <div style="position:absolute;inset:38%;border-radius:50%;background:linear-gradient(160deg,#4636e3,#2a2260);display:grid;place-items:center;color:#fff"><span style="font-size:9.5px;font-weight:900;text-align:center;line-height:1.5">أنت + الطبيب<br>🔒 الطبية</span></div></div>
    <span class="muted" style="display:block;margin-top:11px;text-align:center">الطبية لا تغادر الدائرة الداخلية أبدًا — والكشافون ممنوعون منها دائمًا</span></div>
  <div class="card" style="border-radius:26px"><b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">مفاتيح سريعة</b>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b style="font-size:12.5px">الظهور في الاستكشاف</b><span class="muted" style="display:block">تظهر للأندية الباحثة عن مركزك</span></div>${sw("explore",g("explore"))}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b style="font-size:12.5px">مشاركة الموقع أثناء الفعاليات</b><span class="muted" style="display:block">للملاعب القريبة فقط</span></div>${sw("loc",g("loc"))}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b style="font-size:12.5px">إشعارات كشافي المواهب</b><span class="muted" style="display:block">🔒 تمر عبر ولي الأمر لمن دون 16</span></div>${sw("scout",g("scout"))}</div></div></div>
  <div class="dnote"><b style="color:#f5c518">كل اطّلاع يُسجّل</b> — من فتح ملفك ومتى، والإذن المؤقت يُسحب متى شئت.</div>
  </main>`;
};
window.privTog=k=>{try{const v=localStorage.getItem("pi_priv_"+k)!=="0";localStorage.setItem("pi_priv_"+k,v?"0":"1")}catch(e){};toast("حُفظ الخيار");render();};

/* ═══ التركيب: تنقّل + هيدر ═══ */
NAV.player[4]=["◉","ملفي","profile"];
(function(){
  const _r=window.render;
  window.render=async function(){ await _r();
    try{ const hd=document.querySelector(".hd");
      if(hd&&ME&&!document.getElementById("avx")){
        const b=document.createElement("button"); b.id="avx";
        b.style.cssText="width:34px;height:34px;border:0;border-radius:50% 50% 50% 10px;background:linear-gradient(160deg,#4636e3,#2a2260);color:#fff;font:900 14px Cairo;cursor:pointer;flex:none";
        b.textContent=(ME.name||"؟").trim()[0]||"؟"; b.title="ملفي"; b.onclick=()=>go("profile");
        hd.appendChild(b); }
      /* اتجاه القطرة يتبع الدور — المدرب أسفل-يمين */
      const coach=ME&&ME.role==="coach";
      document.body.classList.toggle("r-coach",!!coach);
      if(coach) document.querySelectorAll('#app [style*="50% 50% 50%"]').forEach(el=>{
        const s=el.getAttribute("style")||"";
        el.setAttribute("style",s.replace(/50%\s+50%\s+50%\s+([0-9.]+px)/g,"50% 50% $1 50%"));
      });
    }catch(e){} };
})();
