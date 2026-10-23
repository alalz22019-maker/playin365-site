/* PlayIn365 — الدفعة ١٠: الأفراد — لوحة المستثمر · فريق الحي · التقدير الاجتماعي المنفصل · تعيينات الحكم */
const IN={};
IN.empty=t=>`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center"><span class="muted">${esc(t)}</span></div>`;

/* ═══ لوحة المستثمر ═══ */
IN.ST={open:{ar:"مفتوحة",bg:"#efedff",fg:"#4636e3"},held:{ar:"في محفظتك",bg:"#e9f0ea",fg:"#2c6e49"},review:{ar:"قيد التقييم",bg:"#fff6d6",fg:"#c78c00"}};
T.investor=async()=>{
  const [inv,pf,att,mt,ev,bk,subs,mem]=await Promise.all([
    q("i",sb.from("pi_deals_inv").select("*").order("created_at",{ascending:true})),
    q("p",sb.from("profiles").select("name,role,org").not("name","is",null).limit(300)),
    q("a",sb.from("attendance").select("player_name,org,created_at").limit(400)),
    q("m",sb.from("matches").select("id,status,created_at").limit(80)),
    q("e",sb.from("match_events").select("id,created_at").limit(400)),
    q("b",sb.from("bookings").select("*").limit(80)),
    q("s",sb.from("subscriptions").select("*").limit(120)),
    q("mm",sb.from("memberships").select("*").limit(80))
  ]);
  const orgOf=n=>{const p=pf.find(x=>x.name===n);return p?p.org:""};
  const live=(entity)=>{
    const members=new Set(att.filter(a=>a.org===entity).map(a=>a.player_name)).size;
    const d30=att.filter(a=>a.org===entity&&(Date.now()-new Date(a.created_at))/864e5<=30).length;
    const d60=att.filter(a=>a.org===entity&&(()=>{const d=(Date.now()-new Date(a.created_at))/864e5;return d>30&&d<=60})()).length;
    const growth=d60>0?Math.round((d30-d60)/d60*100):(d30>0?100:0);
    const rev=subs.filter(s=>s.org===entity&&s.paid).reduce((t,s)=>t+(+s.amount||0),0)
             + bk.filter(b=>b.venue===entity&&b.status==="paid").reduce((t,b)=>t+(+b.price||0),0)
             + mem.filter(m=>m.org===entity).reduce((t,m)=>t+(+m.price||0),0);
    return {members,growth,rev,sessions:att.filter(a=>a.org===entity).length};
  };
  const held=inv.filter(i=>i.status==="held");
  const totalRev=subs.filter(s=>s.paid).reduce((t,s)=>t+(+s.amount||0),0)+bk.filter(b=>b.status==="paid").reduce((t,b)=>t+(+b.price||0),0);
  const platform=Math.round(totalRev*0.04);
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
    <div style="position:relative">
      <b style="font-size:15px;color:#f5c518">فرص استثمارية موثقة بالأرقام</b>
      <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">كل رقم من سجلات المنصة الموثقة — لا عروض تقديمية منمّقة، والفارغ يبقى فارغًا بصدق.</span>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px">
        ${[[inv.length,"فرصة"],[held.length,"في محفظتك"],[platform.toLocaleString("en"),"دخل المنصة ر.س"]].map(([v,l],i)=>`<div style="background:rgba(255,255,255,.08);border:1px solid #333a55;border-radius:14px;padding:11px 8px;text-align:center">
          <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:19px;color:${i===2?"#7fd6a8":"#faf8f3"}">${v}</b>
          <span style="font-size:8.5px;color:#9aa0b8;font-weight:800">${l}</span></div>`).join("")}
      </div>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:10px">
    <b class="h2" style="color:#4636e3">الفرص</b>
    ${inv.length?inv.map(i=>{const S=IN.ST[i.status]||IN.ST.review;const L=live(i.entity);
      return `<div class="card" style="border-radius:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px;gap:10px">
        <div style="min-width:0"><b style="font-size:13px">${esc(i.entity)}</b>
          <span class="muted" style="display:block;margin-top:2px">${esc(i.kind||"")}${i.stake&&i.stake!=="—"?" · حصة "+esc(i.stake):""}</span></div>
        <div style="display:flex;gap:6px;align-items:center;flex:none">
          ${i.verified?`<span style="background:#fff6d6;color:#c78c00;border-radius:999px;padding:3px 10px;font-size:9.5px;font-weight:900">معتمدة ★</span>`:""}
          <span style="background:${S.bg};color:${S.fg};border-radius:999px;padding:3px 11px;font-size:9.5px;font-weight:900">${S.ar}</span></div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;margin-bottom:10px">
        ${[[L.members||"—","عضو نشط","#4636e3"],
           [L.sessions?((L.growth>0?"+":"")+L.growth+"%"):"—","نمو ٣٠ يومًا","#4636e3"],
           [L.rev?L.rev.toLocaleString("en"):"—","إيراد موثّق ر.س","#c78c00"]].map(([v,l,c])=>`<div style="background:#faf8f3;border-radius:14px;padding:10px 6px">
          <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:16px;color:${v==="—"?"#c9c2b2":c}">${v}</b>
          <span style="display:block;font-size:8.5px;color:#8a8fa5;font-weight:800">${l}</span></div>`).join("")}
      </div>
      <span class="muted" style="display:block;line-height:1.9">${L.sessions?`محسوبة من <span class="ltr">${L.sessions}</span> حصة موثقة ونشاط الجهة في المنصة.`:"لا نشاط موثّق بعد لهذه الجهة — لا نُقدّر رقمًا لا نملك دليله."}</span>
      <div style="display:flex;gap:7px;margin-top:12px">
        <button class="btn" style="flex:1;padding:10px;font-size:11px" onclick="invRoom('${esc(i.entity)}')">اطلب غرفة بيانات</button>
        ${i.status!=="held"?`<button class="btn ghost" style="flex:1;padding:10px;font-size:11px" onclick="invTrack('${i.id}','${esc(i.entity)}')">تابع الفرصة</button>`:""}</div>
    </div>`}).join(""):IN.empty("لا فرص مطروحة")}
  </div>

  ${held.length?`<div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">محفظتك</b>
    ${held.map(i=>{const L=live(i.entity);
      return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:14px;padding:11px 13px;margin-bottom:8px">
      <div style="min-width:0"><b style="font-size:11.5px">${esc(i.entity)}</b>
        <span class="muted" style="display:block">${esc(i.kind||"")}${i.stake&&i.stake!=="—"?" — حصة "+esc(i.stake):""}</span></div>
      <b class="ltr" style="font-family:'Space Grotesk';font-size:13px;color:${L.rev?"#2c6e49":"#8a8fa5"};flex:none">${L.rev?L.rev.toLocaleString("en")+" ر.س":"—"}</b></div>`}).join("")}
  </div>`:""}

  <div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:9px">نموذج دخل المنصة</b>
    <div style="display:flex;flex-direction:column;gap:7px">
      ${[["أكاديمية","اشتراك و٠٪ أو بلا اشتراك و٤٪"],["متجر بضاعة","٨–١٠٪"],["منتج رقمي وتذاكر","١٥–٢٠٪"],["عضويات رقمية","١٥–٢٥٪"],["عقود احترافية","٢٫٥٪ ثابتة مهما بلغ العقد"]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;gap:12px;font-size:11.5px;font-weight:700"><span style="color:#8a8fa5">${k}</span><b style="text-align:end">${v}</b></div>`).join("")}
    </div>
    <span class="muted" style="display:block;margin-top:9px;line-height:1.9">النِّسب معلنة قبل أي نشر، وتعديلها قرار مجلس لا زر.</span>
  </div>
  <div class="dnote">لا نعرض تقديرات ولا توقعات. ما لا دليل له يظهر «—» — والمستثمر يقرأ الواقع لا الوعد.</div>
  </main>`;
};
window.invRoom=async(entity)=>{
  const os=await q("o",sb.from("profiles").select("id").in("role",["admin","academy","venue"]).limit(20));
  if(os.length) await sb.from("notifications").insert(os.map(o=>({user_id:o.id,kind:"datroom",title:"طلب غرفة بيانات — "+entity,body:ME.name+" يطلب غرفة بيانات كاملة"})));
  await trans(`طلب غرفة بيانات — ${entity}`);
  toast("وصل الطلب للجهة — وتقرر هي ما تشاركه");
};
window.invTrack=async(id,entity)=>{
  const {error}=await sb.from("pi_deals_inv").update({status:"review"}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`متابعة فرصة استثمارية — ${entity}`);
  toast("أُضيفت لمتابعتك — يصلك جديدها الموثّق"); render();
};

/* ═══ فريق الحي — للمشجع والهاوي ═══ */
T.hood=async()=>{
  const mine=await q("h",sb.from("pi_hoods").select("*").eq("owner_id",ME.id).order("created_at",{ascending:false}));
  const free=await q("b",sb.from("bookings").select("*").eq("status","free").limit(6));
  const teams=[...new Set(mine.map(h=>h.name))];
  const t0=(()=>{try{return localStorage.getItem("pi_hood_"+ME.id)||teams[0]||""}catch(e){return teams[0]||""}})();
  const roster=mine.filter(h=>h.name===t0);
  const booked=roster.find(h=>h.venue);
  const cost=booked?(+booked.share||0):0;
  const per=roster.length?Math.round(cost/roster.length):0;
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="position:absolute;inset:0;opacity:.18;background-image:radial-gradient(#faf8f3 1px,transparent 1px);background-size:13px 13px"></div>
    <div style="position:relative">
      <b style="font-size:15px;color:#f5c518">⚽ كوّن فريق حيّك</b>
      <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.9;margin-top:5px">لا يشترط أن تكون لاعبًا مسجّلًا. اجمع أصحابك، استأجر ملعبًا، وقسّم التكلفة — ولو رغبتم وثّقوا مبارياتكم فتبدأ سجلاتكم.</span>
    </div>
  </div>

  ${teams.length?`<div class="card" style="border-radius:22px">
    <b class="h2" style="display:block;margin-bottom:9px">فرقك</b>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${teams.map(t=>`<button onclick="hoodPick('${esc(t)}')" style="background:${t===t0?"#4636e3":"#faf8f3"};color:${t===t0?"#fff":"#565d78"};border:1px solid ${t===t0?"#4636e3":"#e9e4d8"};border-radius:999px;padding:8px 16px;font:900 11.5px Cairo;cursor:pointer">${esc(t)}</button>`).join("")}
    </div>
  </div>

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#4636e3">${esc(t0)}</b>
      <span class="muted"><span class="ltr">${roster.length}</span> عضوًا</span></div>
    ${roster.length?roster.map(h=>`<div class="lrow">
      <span class="ic">${esc((h.member_name||"؟")[0])}</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(h.member_name)}</b>
        ${h.member_name===ME.name?`<span class="muted" style="display:block">أنت — منشئ الفريق</span>`:""}</div>
      ${h.member_name!==ME.name?`<button onclick="hoodRm('${h.id}','${esc(h.member_name)}')" style="background:none;border:0;color:#a83b25;font:900 14px Cairo;cursor:pointer;flex:none;padding:4px 8px">×</button>`:""}</div>`).join(""):IN.empty("لا أعضاء بعد")}
    <button class="btn ghost" style="margin-top:10px" onclick="hoodAdd('${esc(t0)}')">+ أضف صاحبك</button>
  </div>

  ${booked?`<div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">الحجز وتقسيم التكلفة</b>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${[["الملعب",esc(booked.venue)],["الوقت",`<span class="ltr">${esc(booked.slot||"")}</span>`],["التكلفة",`<span class="ltr">${cost}</span> ر.س`],["نصيب كل عضو",`<span class="ltr">${per}</span> ر.س`]].map(([k,v],i)=>`<div style="display:flex;justify-content:space-between;gap:12px;font-size:11.5px;font-weight:700"><span style="color:#8a8fa5">${k}</span><b style="color:${i===3?"#4636e3":"#151a2e"}">${v}</b></div>`).join("")}
    </div>
    <div style="height:10px;background:#f0ece2;border-radius:99px;overflow:hidden;margin-top:11px;display:flex">
      ${roster.map((_,i)=>`<span style="flex:1;background:${i%2?"#7b5cff":"#4636e3"};${i?"border-inline-start:1.5px solid #fff":""}"></span>`).join("")}</div>
    <span class="muted" style="display:block;margin-top:8px">القسمة بالتساوي على <span class="ltr">${roster.length}</span> — والحجز معاملة تجارية مع الملعب.</span>
  </div>`:free.length?`<div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">ساعات شاغرة قريبة</b>
    ${free.slice(0,4).map(b=>`<div class="lrow">
      <span class="ic">🏟</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(b.venue)}</b>
        <span class="muted" style="display:block"><span class="ltr">${esc(b.slot||"")}</span>${b.price?` · <span class="ltr">${N(b.price)}</span> ر.س`:""}</span></div>
      <button class="btn" style="width:auto;padding:7px 13px;border-radius:999px;font-size:10px;flex:none" onclick="hoodBook('${esc(t0)}','${esc(b.venue)}','${esc(b.slot||"")}',${b.price||0})">احجز</button></div>`).join("")}
  </div>`:IN.empty("لا ساعات شاغرة الآن")}

  <div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:8px">وثّقوا مباراتكم</b>
    <span class="muted" style="display:block;line-height:1.9;margin-bottom:11px">لو أردتم، أنشئ المباراة كمنظم مسؤول — فتدخل أحداثها سجلات من يشارك فيها لحظة تسجيلها.</span>
    <button class="btn" onclick="go('newMatch')">أنشئ مباراة موثّقة</button>
  </div>`
  :`<div class="card" style="border-radius:26px;text-align:center;padding:26px">
    <b style="font-size:13px">ابدأ فريقك</b>
    <span class="muted" style="display:block;margin-top:5px;line-height:1.9">اسم واحد يكفي — ثم أضف أصحابك واحجز ملعبًا</span>
    <button class="btn" style="margin-top:12px" onclick="hoodNew()">أنشئ فريق الحي</button></div>`}
  <div class="note">فريق الحي ليس جهة رياضية ولا يمنح تقييمًا — وإن وثّقتم مبارياتكم دخلت سجل من يشارك باسم منظّمها.</div>
  </main>`;
};
window.hoodPick=t=>{try{localStorage.setItem("pi_hood_"+ME.id,t)}catch(e){};render()};
window.hoodNew=async()=>{
  const n=prompt("اسم فريق الحي:"); if(!n||!n.trim())return;
  const {error}=await sb.from("pi_hoods").insert({name:n.trim(),owner_id:ME.id,owner_name:ME.name,member_name:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  try{localStorage.setItem("pi_hood_"+ME.id,n.trim())}catch(e){}
  await trans(`إنشاء فريق حي — ${n.trim()}`);
  toast("أُنشئ الفريق وأنت أول أعضائه"); render();
};
window.hoodAdd=async(team)=>{
  const n=prompt("اسم صاحبك:"); if(!n||!n.trim())return;
  const {error}=await sb.from("pi_hoods").insert({name:team,owner_id:ME.id,owner_name:ME.name,member_name:n.trim()});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إضافة عضو لفريق الحي ${team} — ${n.trim()}`);
  toast("أُضيف — والقسمة تُحدَّث تلقائيًا"); render();
};
window.hoodRm=async(id,name)=>{
  const {error}=await sb.from("pi_hoods").delete().eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إزالة عضو من فريق الحي — ${name}`);
  toast("أُزيل"); render();
};
window.hoodBook=async(team,venue,slot,price)=>{
  const rows=await q("h",sb.from("pi_hoods").select("id").eq("owner_id",ME.id).eq("name",team));
  if(!rows.length) return toast("أنشئ الفريق أولًا",1);
  const u=await sb.from("pi_hoods").update({venue,slot,share:price}).eq("owner_id",ME.id).eq("name",team);
  if(u.error) return toast("تعذّر: "+u.error.message,1);
  await sb.from("bookings").insert({venue,slot,who:team+" — "+ME.name,status:"requested",price});
  await trans(`طلب حجز لفريق الحي ${team} — ${venue} ${slot}`);
  toast("أُرسل طلب الحجز للملعب — والقسمة ظاهرة لأعضائك"); render();
};

/* ═══ التقدير الاجتماعي — منفصل عن السمعة ═══ */
IN.CLAP=[{k:"clap",ic:"👏",ar:"تقدير"},{k:"fire",ic:"🔥",ar:"أداء"},{k:"mvp",ic:"🗳",ar:"رجل المباراة"}];
T.cheer=async()=>{
  const mt=await q("m",sb.from("matches").select("*").in("status",["live","today","final"]).order("created_at",{ascending:false}).limit(6));
  const m=mt.find(x=>x.status==="live")||mt.find(x=>x.status==="today")||mt[0];
  if(!m) return `<main>${IN.empty("لا مباريات لتشجّعها الآن")}</main>`;
  const [ev,claps]=await Promise.all([
    q("e",sb.from("match_events").select("*").eq("match_id",m.id).order("minute",{ascending:false}).limit(12)),
    q("c",sb.from("pi_claps").select("*").eq("match_id",m.id))
  ]);
  const cnt=(t,k)=>claps.filter(c=>c.target===t&&c.kind===k).length;
  const goals=ev.filter(e=>e.type==="goal");
  const mvpTop=[...new Set(ev.map(e=>e.who))].map(w=>({w,n:cnt(w,"mvp")})).sort((a,b)=>b.n-a.n);
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="position:absolute;inset-inline-start:65%;top:-60%;width:70%;height:220%;background:${m.status==="live"?"#e8531f":"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:.5"></div>
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div style="min-width:0">
        ${m.status==="live"?`<span style="display:inline-flex;align-items:center;gap:6px;background:#e8531f;color:#fff;border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:900"><span style="width:6px;height:6px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite"></span>فريقك يلعب</span>`
          :`<span style="font-size:10.5px;font-weight:900;color:#f5c518">${m.status==="final"?"انتهت":"اليوم"}</span>`}
        <b style="display:block;font-size:13.5px;margin-top:6px">${esc(m.title)}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:3px">المنظم: ${esc(m.organizer_name||"")}</span></div>
      <b class="ltr" style="font-family:'Space Grotesk';font-size:30px;flex:none">${m.score_a}–${m.score_b}</b></div>
  </div>

  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">قدّر اللحظة — تقديرك اجتماعي</b>
    ${goals.length?`<div style="display:flex;gap:7px;flex-wrap:wrap">
      ${goals.slice(0,4).map(g=>`<button onclick="clapIt('${m.id}','${esc(g.who)}','clap')" style="background:#efedff;color:#4636e3;border:0;border-radius:12px;padding:9px 14px;font:800 12px Cairo;cursor:pointer">👏 هدف ${esc((g.who||"").split(" ")[0])} <span class="ltr">${cnt(g.who,"clap")}</span></button>`).join("")}
      <button onclick="clapIt('${m.id}','${esc(m.team_a||m.title)}','fire')" style="background:#fff;border:1px solid #e9e4d8;color:#565d78;border-radius:12px;padding:9px 14px;font:800 12px Cairo;cursor:pointer">🔥 أداء الفريق <span class="ltr">${cnt(m.team_a||m.title,"fire")}</span></button>
    </div>`:IN.empty("لا أحداث موثقة بعد في هذه المباراة")}
    <span class="muted" style="display:block;margin-top:10px;line-height:1.9">تقدير المشجعين <b>لا يدخل في السمعة الموثقة</b> — ويظهر منفصلًا دائمًا.</span>
  </div>

  ${mvpTop.length?`<div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#c78c00">🗳 تصويت رجل المباراة</b>
      <span class="muted">جائزة منفصلة</span></div>
    ${mvpTop.slice(0,5).map(x=>{const mx=Math.max(...mvpTop.map(y=>y.n),1);
      return `<div style="margin-bottom:9px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:5px">
        <b style="font-size:11.5px">${esc(x.w)}</b>
        <div style="display:flex;gap:8px;align-items:center;flex:none">
          <span class="ltr" style="font-family:'Space Grotesk';font-size:12px;color:#c78c00;font-weight:700">${x.n}</span>
          <button onclick="clapIt('${m.id}','${esc(x.w)}','mvp')" style="background:#fff6d6;color:#c78c00;border:0;border-radius:999px;padding:5px 13px;font:900 10px Cairo;cursor:pointer">صوّت</button></div></div>
      <div style="height:7px;background:#f0ece2;border-radius:99px;overflow:hidden"><div style="width:${x.n/mx*100}%;height:100%;background:linear-gradient(90deg,#f5c518,#c78c00);border-radius:99px"></div></div></div>`}).join("")}
    <span class="muted" style="display:block;margin-top:8px;line-height:1.9">تصويت الجماهير جائزة تقديرية — والتقييم الموثق يبقى بأوزانه: مسجَّل ٥٠٪ · خبراء ٣٠٪ · داعمون ١٥٪ · جمهور ٥٪ بسقف صلب.</span>
  </div>`:""}
  <div class="dnote">لا عدّادات شعبية على ملفات اللاعبين، ولا مقارنة بين الأطفال. التقدير يعبّر عنك ولا يحكم على أحد.</div>
  </main>`;
};
window.clapIt=async(mid,target,kind)=>{
  const {error}=await sb.from("pi_claps").insert({match_id:mid,target,kind,by_user:ME.id});
  if(error) return toast("تعذّر: "+error.message,1);
  const ar=(IN.CLAP.find(c=>c.k===kind)||{}).ar||"تقدير";
  toast(`سُجّل ${ar}ك — منفصلًا عن السمعة الموثقة`); render();
};

/* ═══ تعيينات الحكم ═══ */
T.refDuty=async()=>{
  const [refs,mt,ev]=await Promise.all([
    q("r",sb.from("pi_refs").select("*").eq("referee",ME.name).order("created_at",{ascending:false})),
    q("m",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(40)),
    q("e",sb.from("match_events").select("*").like("recorded_by",ME.name+"%").order("created_at",{ascending:false}).limit(30))
  ]);
  const mine=mt.filter(m=>m.referee_name===ME.name);
  const openM=mine.filter(m=>m.status!=="final");
  const clash=(()=>{const byDay={};mine.forEach(m=>{const d=(m.match_date||"").slice(0,10)||"—";(byDay[d]=byDay[d]||[]).push(m)});
    return Object.entries(byDay).filter(([d,a])=>d!=="—"&&a.length>1);})();
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b style="font-size:15px;color:#f5c518">تعييناتك</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">قرارك نهائي لحظة إعلانه — بلا اعتماد ولا اعتراض، والتصحيح باسمك ووقته.</span></div>
      <div style="text-align:center;flex:none"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:22px;color:#f5c518">${mine.length||"—"}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">مباراة</span></div>
    </div>
  </div>
  <div class="stat3">
    <div class="stat"><b class="ltr" style="color:#e8531f">${openM.length||"—"}</b><span class="muted">قائمة</span></div>
    <div class="stat"><b class="ltr" style="color:#4636e3">${ev.length||"—"}</b><span class="muted">قرارًا سجّلته</span></div>
    <div class="stat"><b class="ltr" style="color:${clash.length?"#c78c00":"#2c6e49"}">${clash.length||"—"}</b><span class="muted">تعارضًا</span></div>
  </div>
  ${clash.length?`<div style="background:#fff6d6;border:1px solid #f0e2b4;border-radius:18px;padding:13px 15px">
    <b style="font-size:12px;color:#8a6a1e;display:block;margin-bottom:5px">تعارض تعيينات</b>
    ${clash.map(([d,a])=>`<span style="display:block;font-size:11.5px;font-weight:700;color:#8a6a1e;line-height:1.9"><span class="ltr">${d}</span> — <span class="ltr">${a.length}</span> مباريات: ${a.map(m=>esc(m.title)).join(" · ")}</span>`).join("")}
    <span style="display:block;font-size:10.5px;font-weight:700;color:#8a6a1e;margin-top:7px">اعتذر عن إحداها ليعيّن المنظم بديلًا.</span></div>`:""}
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">مبارياتك</b>
    ${mine.length?mine.slice(0,8).map(m=>`<div class="lrow" onclick="go('matchView','${m.id}')" style="cursor:pointer">
      <span class="ic" style="background:${m.status==="live"?"#fdeee8":"#efedff"};color:${m.status==="live"?"#e8531f":"#4636e3"}">${m.status==="live"?"●":"▶"}</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(m.title)}</b>
        <span class="muted" style="display:block">${esc(m.venue||"")} · ${esc(m.organizer_name||"")}${m.match_date?` · <span class="ltr">${String(m.match_date).slice(0,10)}</span>`:""}</span></div>
      ${m.status==="final"?`<b class="ltr" style="font-family:'Space Grotesk';font-size:12px;flex:none">${m.score_a}–${m.score_b}</b>`
        :`<button onclick="event.stopPropagation();refExcuse('${m.id}','${esc(m.title)}')" style="background:none;border:0;color:#a83b25;font:900 10.5px Cairo;cursor:pointer;flex:none">اعتذر</button>`}</div>`).join(""):IN.empty("لا تعيينات — يعيّنك المنظم من غرفة البطولة")}
  </div>
  ${ev.length?`<div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:10px">آخر قراراتك</b>
    ${ev.slice(0,6).map(e=>`<div class="lrow"><span class="ic">${e.type==="goal"?"⚽":e.type==="assist"?"◎":"▮"}</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(evLabel(e))}</b>
        <span class="muted" style="display:block">د<span class="ltr">${N(e.minute)}</span> · <span class="ltr">${new Date(e.created_at).toLocaleDateString("en-GB")}</span></span></div></div>`).join("")}
    <span class="muted" style="display:block;margin-top:9px">كل قرار دخل السجل لحظة إعلانه.</span></div>`:""}
  </main>`;
};
window.refExcuse=async(mid,title)=>{
  const r=prompt(`اعتذار عن ${title}\nالسبب — يُدوَّن للمنظم:`);
  if(r===null)return;
  const {error}=await sb.from("matches").update({referee_name:null}).eq("id",mid);
  if(error) return toast("تعذّر: "+error.message,1);
  await sb.from("pi_refs").delete().eq("match_id",mid).eq("referee",ME.name);
  await trans(`اعتذار حكم عن ${title}${r.trim()?" — "+r.trim():""}`);
  toast("دُوّن اعتذارك — ويعيّن المنظم بديلًا"); render();
};

/* ═══ التركيب ═══ */
(function(){
  Object.assign(TITLES,{investor:"لوحة المستثمر",hood:"فريق الحي",cheer:"شجّع",refDuty:"تعييناتي"});
  if(NAV.referee) NAV.referee=[["⌂","تعييناتي","refDuty"],["◎","استكشف","explore"],["FAB","","newMatch"],["▤","تقارير","reports"],["◉","إشعارات","notifications"]];
  if(NAV.admin) NAV.admin=[["⌂","النبض","owner"],["◈","الديوان","erp"],["FAB","","newMatch"],["◎","السوق","market"],["▤","تقارير","reports"]];
  const _fan=T.fan;
  if(_fan) T.fan=async()=>{
    const body=await _fan();
    const strip=`<div style="display:flex;gap:8px">
      <button onclick="go('cheer')" style="flex:1;background:#fff;border:1px solid #e9e4d8;border-radius:18px;padding:13px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:Cairo">
        <span style="width:34px;height:34px;border-radius:50% 50% 50% 6px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:15px">👏</span>
        <span style="font-size:10.5px;font-weight:900;color:#565d78">شجّع</span></button>
      <button onclick="go('hood')" style="flex:1;background:#fff;border:1px solid #e9e4d8;border-radius:18px;padding:13px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:Cairo">
        <span style="width:34px;height:34px;border-radius:50% 50% 50% 6px;background:#fff6d6;color:#c78c00;display:grid;place-items:center;font-size:15px">⚽</span>
        <span style="font-size:10.5px;font-weight:900;color:#565d78">فريق الحي</span></button>
      <button onclick="go('market')" style="flex:1;background:#fff;border:1px solid #e9e4d8;border-radius:18px;padding:13px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:Cairo">
        <span style="width:34px;height:34px;border-radius:50% 50% 50% 6px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:15px">◈</span>
        <span style="font-size:10.5px;font-weight:900;color:#565d78">ادعم</span></button>
    </div>`;
    return body.replace("<main>","<main>"+strip);
  };
  const _gp=P3&&P3.genericProfile;
  if(_gp) P3.genericProfile=async()=>{
    const body=await _gp();
    const rows=[];
    if(ME.role==="referee") rows.push(["▶","تعييناتي — قرارك نهائي","refDuty"]);
    if(["admin","agent","scout"].includes(ME.role)) rows.push(["◈","لوحة المستثمر","investor"]);
    rows.push(["⚽","فريق الحي","hood"],["⚙","الإعدادات","settings"]);
    const extra=`<div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:6px">أدواتك</b>
      ${rows.map(([ic,t,v])=>`<div class="lrow" onclick="go('${v}')" style="cursor:pointer"><span class="ic">${ic}</span><div style="flex:1"><b style="font-size:12px">${t}</b></div><span style="color:#4636e3;font-weight:900">←</span></div>`).join("")}</div>`;
    return body.replace("</main>",extra+"</main>");
  };
  const _ow=T.owner;
  if(_ow) T.owner=async()=>{
    const body=await _ow();
    const link=`<button class="btn ghost" onclick="go('investor')">لوحة المستثمر — الفرص والنِّسب ←</button>`;
    return body.replace("</main>",link+"</main>");
  };
})();
