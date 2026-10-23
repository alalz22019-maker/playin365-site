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
  if(r==="coach")return P3.coachProfile();
  if(r==="academy"||r==="venue")return P3.orgProfile();
  if(r==="guardian")return T.guardian();
  return P3.genericProfile();
};
T.rating=T.profile;

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
/* ═══ سجلي — نهر المسيرة ═══ */
/* ═══ الخصوصية — دوائر الرؤية ═══ */
/* ═══ التركيب: تنقّل + هيدر ═══ */
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
