/* PlayIn365 — الدفعة ٤: ولي الأمر والموافقات · الكشاف · الطبي · المشجع · لوحة المالك */
const RL={};

/* ══════════ ولي الأمر: الإشراف + الموافقة كمنتج (نطاق · غرض · مدة · سحب) ══════════ */
RL.SCOPES=[
  {k:"record",  ar:"السجل الرياضي",    d:"المباريات والأحداث الموثقة", risk:"low"},
  {k:"readiness",ar:"حالة الجاهزية",   d:"متاح / بقيود — بلا تشخيص",   risk:"low"},
  {k:"contact", ar:"التواصل عبرك",     d:"لا مراسلة مباشرة لابنك أبدًا", risk:"mid"},
  {k:"medical", ar:"الملف الطبي",      d:"محجوب عن الكشافين دائمًا",    risk:"high"}
];
RL.DUR=[{k:"7",ar:"٧ أيام"},{k:"30",ar:"٣٠ يومًا"},{k:"90",ar:"موسم"}];
RL.ckey=(child,scope)=>`pi_consent_${child}_${scope}`;
RL.get=(child,scope)=>{try{const v=localStorage.getItem(RL.ckey(child,scope));return v?JSON.parse(v):null}catch(e){return null}};
RL.active=c=>c&&new Date(c.until)>new Date();
window.rlGrant=(child,scope,ar)=>{
  const S=RL.SCOPES.find(s=>s.k===scope);
  if(S&&S.risk==="high") return toast("الملف الطبي لا يُمنح من هنا — يمرّ بالمختص الطبي حصرًا",1);
  const d=prompt(`منح إذن: ${ar}\nلمن؟ (اسم الجهة أو الكشاف)`,"نادي الهلال");
  if(!d||!d.trim())return;
  const days=prompt("لكم مدة؟ اكتب: 7 أو 30 أو 90","30");
  const n=+days||30;
  const until=new Date(Date.now()+n*864e5).toISOString();
  const purpose=prompt("الغرض من الإذن (يُسجَّل ويُعرض):","تقييم للانتقال");
  try{localStorage.setItem(RL.ckey(child,scope),JSON.stringify({to:d.trim(),until,purpose:(purpose||"").trim(),at:new Date().toISOString()}))}catch(e){}
  trans(`منح إذن ${ar} — ${d.trim()} لمدة ${n} يومًا (${(purpose||"").trim()})`);
  toast("مُنح الإذن — ويمكنك سحبه في أي لحظة"); render();
};
window.rlRevoke=(child,scope,ar)=>{
  try{localStorage.removeItem(RL.ckey(child,scope))}catch(e){}
  trans(`سحب إذن ${ar}`);
  toast("سُحب الإذن فورًا — وسُجّل السحب باسمك"); render();
};

T.guardian=async()=>{
  const [pf,att,ev,ns]=await Promise.all([
    q("pf",sb.from("profiles").select("id,name,role,org,pos,age").eq("role","player").not("name","is",null).limit(60)),
    q("att",sb.from("attendance").select("*").order("created_at",{ascending:false}).limit(120)),
    q("ev",sb.from("match_events").select("*,matches(title,organizer_name)").order("created_at",{ascending:false}).limit(120)),
    q("nt",sb.from("notifications").select("*").eq("user_id",ME.id).eq("kind","report").order("created_at",{ascending:false}).limit(5))
  ]);
  const linked=(()=>{try{return JSON.parse(localStorage.getItem("pi_children_"+ME.id)||"[]")}catch(e){return []}})();
  const named=pf.filter(p=>p.name);
  const evCount=n=>ev.filter(e=>e.who===n).length;
  const minors=named.filter(p=>p.age&&p.age<18).sort((a,b)=>evCount(b.name)-evCount(a.name)||a.age-b.age);
  const kids=linked.length?named.filter(p=>linked.includes(p.name)):(minors.length?[minors[0]]:named.slice(0,1));
  const kid=kids[0];
  const kidAtt=kid?att.filter(a=>a.player_name===kid.name):[];
  const kidEv=kid?ev.filter(e=>e.who===kid.name):[];
  const minor=kid&&kid.age&&kid.age<18;
  /* كشف تعارض مواعيد الابن — نفس قاعدة تقويم اللاعب */
  const kidCal=kid?await q("kc",sb.from("calendar_items").select("*").eq("player_name",kid.name)):[];
  const kmins=t=>{const m=String(t||"").match(/(\d{1,2}):(\d{2})/);return m?(+m[1])*60+(+m[2]):null};
  const kidConf=(()=>{const byDay={},out=[];
    kidCal.forEach(x=>{const k=String(x.on_date||"").slice(0,10); if(k)(byDay[k]=byDay[k]||[]).push(x);});
    Object.values(byDay).forEach(arr=>{ if(arr.length<2) return;
      arr.forEach((a,i)=>arr.forEach((b,j)=>{ if(j<=i) return;
        const ta=kmins(a.at_time), tb=kmins(b.at_time);
        if(ta===null||tb===null||Math.abs(ta-tb)<120) out.push([a,b]);
      }));
    });
    return out;})();

  return `<main>
  <div class="stage" style="border-radius:26px">
    <b style="font-size:15px;color:#f5c518">إشراف ولي الأمر</b>
    <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">${minor?"ابنك تحت الثامنة عشرة — لا مراسلة مباشرة معه، وكل طلب يخصه يمرّ بموافقتك الفردية.":"ترى نشاط ابنك الموثق وتتحكم بمن يراه."}</span>
  </div>

  ${kid?`<div class="card" style="border-radius:26px">
    <div style="display:flex;gap:14px;align-items:center">
      <span style="width:52px;height:52px;flex:none;border-radius:50% 50% 50% 13px;background:linear-gradient(160deg,#4636e3,#2a2260);color:#fff;display:grid;place-items:center;font-weight:900;font-size:20px">${esc(kid.name[0])}</span>
      <div style="flex:1;min-width:0"><b style="font-size:15px">${esc(kid.name)}</b>
        <span class="muted" style="display:block">${esc(kid.pos||"لاعب")}${kid.age?" · "+N(kid.age)+" سنة":""}${kid.org?" · "+esc(kid.org):""}</span></div>
      ${minor?`<span style="background:#fff6d6;color:#c78c00;border-radius:999px;padding:4px 11px;font-size:9.5px;font-weight:900;flex:none">قاصر — محمي</span>`:""}
    </div>
    <div class="stat3" style="margin-top:14px">
      <div class="stat"><b class="ltr" style="color:#4636e3">${kidAtt.length}</b><span class="muted">حصة موثقة</span></div>
      <div class="stat"><b class="ltr" style="color:#c78c00">${kidEv.filter(e=>e.type==="goal").length}</b><span class="muted">هدف</span></div>
      <div class="stat"><b class="ltr" style="color:#2c6e49">${new Set(kidEv.map(e=>e.match_id)).size}</b><span class="muted">مباراة</span></div>
    </div>
    <button class="btn ghost" style="margin-top:11px" onclick="rlLinkKid()">${linked.length?"غيّر الابن المرتبط":"اربط ابنك"}</button>
  </div>

  ${kidConf.length?`<div style="background:#fff6d6;border:1px solid #f0e2b4;border-radius:20px;padding:14px 16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <b style="font-size:12.5px;color:#8a6a1e">⚠ تعارض في جدول ${esc(kid.name.split(" ")[0])}</b>
      <span style="background:#fff;border:1px solid #f0e2b4;color:#8a6a1e;border-radius:999px;padding:3px 10px;font-size:9.5px;font-weight:900"><span class="ltr">${kidConf.length}</span></span></div>
    ${kidConf.slice(0,3).map(([a,b])=>`<div style="background:#fff;border:1px solid #f0e2b4;border-radius:13px;padding:10px 12px;margin-bottom:7px">
      <span style="font-size:11px;font-weight:800;color:#8a6a1e;display:block;line-height:1.8">«${esc(a.title)}»${a.at_time?` <span class="ltr">${esc(a.at_time)}</span>`:""} مع «${esc(b.title)}»${b.at_time?` <span class="ltr">${esc(b.at_time)}</span>`:""}</span>
      <span style="font-size:10px;font-weight:700;color:#a08a5e;display:block;margin-top:4px"><span class="ltr">${String(a.on_date||"").slice(0,10)}</span>${a.created_by?` · سجّله ${esc(a.created_by)}`:""}${b.created_by&&b.created_by!==a.created_by?` و${esc(b.created_by)}`:""}</span></div>`).join("")}
    <span style="font-size:10.5px;font-weight:700;color:#8a6a1e;line-height:1.85;display:block">القرار لك ولابنك — والمنصة تكشف التعارض ولا تختار. أبلِغ المنظّم لتُعاد الجدولة.</span>
    <button class="btn ghost" style="margin-top:10px;padding:9px;font-size:10.5px" onclick="rlFlagConf('${esc(kid.name)}','${esc(kidConf[0][0].title)}','${esc(kidConf[0][1].title)}')">أبلِغ المنظّم</button></div>`:""}

  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:5px">الأذونات — نطاق وغرض ومدة وسحب</b>
    <span class="muted" style="display:block;margin-bottom:12px">الإذن ليس مربعًا واحدًا: تختار ما يُرى، ولمن، ولماذا، ولكم مدة — وتسحبه متى شئت.</span>
    <div style="display:flex;flex-direction:column;gap:9px">
      ${RL.SCOPES.map(s=>{const c=RL.get(kid.name,s.k),on=RL.active(c);
        const hi=s.risk==="high";
        return `<div style="background:${on?"#f2f8f5":hi?"#f7f4f0":"#faf8f3"};border:1px solid ${on?"#d8e6de":"#e9e4d8"};border-radius:16px;padding:12px 14px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div style="flex:1;min-width:0"><b style="font-size:12.5px">${esc(s.ar)}</b>
            <span class="muted" style="display:block;margin-top:2px">${esc(s.d)}</span></div>
          ${hi?`<span style="background:#e9f0ea;color:#1d4a3e;border-radius:8px;padding:4px 10px;font-size:9.5px;font-weight:900;flex:none">🔒 طبي حصري</span>`
            :on?`<button class="btn ghost" style="width:auto;padding:7px 12px;border-radius:999px;font-size:10px;flex:none" onclick="rlRevoke('${esc(kid.name)}','${s.k}','${esc(s.ar)}')">اسحب</button>`
                :`<button class="btn" style="width:auto;padding:7px 13px;border-radius:999px;font-size:10px;flex:none" onclick="rlGrant('${esc(kid.name)}','${s.k}','${esc(s.ar)}')">امنح</button>`}
        </div>
        ${on?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:9px">
          <span style="background:#fff;border:1px solid #d8e6de;color:#2c6e49;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:900">لـ${esc(c.to)}</span>
          ${c.purpose?`<span style="background:#fff;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:800">${esc(c.purpose)}</span>`:""}
          <span style="background:#fff;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:800">ينتهي <span class="ltr">${new Date(c.until).toLocaleDateString("en-GB")}</span></span></div>`:""}
      </div>`}).join("")}
    </div>
    <div class="note" style="margin-top:11px">كل اطّلاع يُسجّل: من فتح ملف ابنك ومتى وبأي إذن. والإذن المؤقت ينتهي وحده.</div>
  </div>

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
      <b class="h2" style="color:#4636e3">آخر نشاط موثق</b>
      <a onclick="go('updates')" style="font-size:11.5px;font-weight:900">تحديثات الأكاديمية ←</a></div>
    ${[...kidEv,...kidAtt].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5).map(x=>x.type?`<div class="lrow"><span class="ic">${x.type==="goal"?"⚽":x.type==="assist"?"◎":"▮"}</span><div style="flex:1"><b style="font-size:12px">${esc(evLabel(x))}</b><span class="muted" style="display:block">${esc(x.matches?.title||"")} · وثّقه ${esc(x.recorded_by)}</span></div></div>`:`<div class="lrow"><span class="ic">◈</span><div style="flex:1"><b style="font-size:12px">حصة — ${esc(x.group_name||"")}</b><span class="muted" style="display:block">سجّلها ${esc(x.recorded_by)}</span></div></div>`).join("")||`<span class="muted">لا نشاط بعد</span>`}
  </div>`:`<div class="card" style="border-radius:26px;text-align:center;padding:26px">
    <b style="font-size:13px">اربط ابنك لتبدأ الإشراف</b>
    <span class="muted" style="display:block;margin-top:5px">اختر من اللاعبين المسجّلين في المنصة</span>
    <button class="btn" style="margin-top:12px" onclick="rlLinkKid()">اربط ابنك</button></div>`}

  ${ns.length?`<div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:8px">آخر تقرير وصلك</b>
    <div class="lrow" onclick="go('updates')" style="cursor:pointer"><span class="ic">▤</span><div style="flex:1"><b style="font-size:12px">${esc(ns[0].title)}</b><span class="muted" style="display:block">${esc(ns[0].body)}</span></div><span style="color:#4636e3;font-weight:900">←</span></div></div>`:""}
  </main>`;
};
window.rlFlagConf=async(kid,a,b)=>{
  const os=await q("o",sb.from("profiles").select("id").in("role",["coach","academy","admin"]).limit(20));
  if(os.length) await sb.from("notifications").insert(os.map(o=>({user_id:o.id,kind:"conflict",title:"تعارض جدول — "+kid,body:`${ME.name} (ولي أمر): «${a}» يتزامن مع «${b}»`})));
  await trans(`إبلاغ ولي أمر بتعارض جدول ${kid} — ${a} مع ${b}`);
  toast("وصل الإبلاغ للمنظّمين — والقرار يبقى لك");
};
window.rlLinkKid=async()=>{
  const pf=await q("pf",sb.from("profiles").select("name").eq("role","player").limit(40));
  const names=pf.map(p=>p.name).filter(n=>n&&n.trim());
  if(!names.length) return toast("لا لاعبين مسجّلين بعد",1);
  const n=prompt("اسم ابنك كما هو مسجّل:\n\n"+names.slice(0,12).join("\n"),names[0]);
  if(!n||!n.trim())return;
  const hit=names.find(x=>x===n.trim());
  if(!hit) return toast("لم أجد هذا الاسم بين اللاعبين",1);
  try{localStorage.setItem("pi_children_"+ME.id,JSON.stringify([hit]))}catch(e){}
  await trans(`ربط ولي أمر بلاعب — ${hit}`);
  toast("ارتبط — وكل طلب يخصه يمرّ بك"); render();
};

/* ══════════ الكشاف: قائمة متابعة لا بحث ══════════ */
T.scout=async()=>{
  const [pf,ev,att]=await Promise.all([
    q("pf",sb.from("profiles").select("id,name,role,org,pos,age").eq("role","player").not("name","is",null).limit(60)),
    q("ev",sb.from("match_events").select("who,type,match_id,recorded_by,created_at").limit(300)),
    q("att",sb.from("attendance").select("player_name,created_at").limit(300))
  ]);
  const watch=(()=>{try{return JSON.parse(localStorage.getItem("pi_watch_"+ME.id)||"[]")}catch(e){return []}})();
  const score=n=>{const e=ev.filter(x=>x.who===n);const per={};e.forEach(x=>{(per[x.match_id]=per[x.match_id]||[]).push(x)});
    const gs=Object.values(per);if(!gs.length)return null;
    const s=gs.reduce((a,g)=>{let v=6;g.forEach(x=>{if(x.type==="goal")v+=.5;if(x.type==="assist")v+=.3;if(x.type==="red")v-=.5});return a+v},0)/gs.length;
    return Math.max(1,Math.min(10,s)).toFixed(1)};
  const card=p=>{const on=watch.includes(p.name),sc=score(p.name),ms=new Set(ev.filter(e=>e.who===p.name).map(e=>e.match_id)).size;
    const minor=p.age&&p.age<18;
    return `<div style="background:#fff;border:1px solid ${on?"#c9c2f5":"#e9e4d8"};border-radius:20px;padding:14px 16px">
      <div style="display:flex;gap:12px;align-items:center">
        <span style="width:42px;height:42px;flex:none;border-radius:50% 50% 50% 11px;background:linear-gradient(160deg,#4636e3,#2a2260);color:#fff;display:grid;place-items:center;font-weight:900;font-size:16px">${esc(p.name[0])}</span>
        <div style="flex:1;min-width:0"><b style="font-size:13px;display:block">${esc(p.name)}</b>
          <span class="muted">${esc(p.pos||"لاعب")}${p.age?" · "+N(p.age):""}${p.org?" · "+esc(p.org):""}</span></div>
        <div style="text-align:center;flex:none"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:19px;color:${sc?"#4636e3":"#c9c2b2"}">${sc||"—"}</b><span style="font-size:8px;color:#b0aa9c;font-weight:800">${sc?"تقييم":"<٥ مباريات"}</span></div>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:10px">
        <span style="background:#faf8f3;border:1px solid #e9e4d8;color:#565d78;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:800">${N(ms)} مباراة موثقة</span>
        ${minor?`<span style="background:#fff6d6;color:#c78c00;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:900">قاصر — عبر ولي الأمر</span>`:""}
        <span style="background:#e9f0ea;color:#1d4a3e;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:900">الطبي محجوب 🔒</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:11px">
        <button class="btn ${on?"ghost":""}" style="flex:1;padding:9px;font-size:11px" onclick="scWatch('${esc(p.name)}')">${on?"أزل من المتابعة":"+ أضف للمتابعة"}</button>
        <button class="btn ghost" style="flex:1;padding:9px;font-size:11px" onclick="scRequest('${esc(p.name)}',${minor?1:0})">اطلب إذن اطلاع</button>
      </div></div>`};
  const watched=pf.filter(p=>p.name&&watch.includes(p.name));
  const rest=pf.filter(p=>p.name&&!watch.includes(p.name)).slice(0,6);
  return `<main>
  <div class="stage" style="border-radius:26px">
    <b style="font-size:15px;color:#f5c518">قائمة المتابعة</b>
    <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">لا بحث عشوائي في اللاعبين — تبني قائمة متابعة، وكل اطّلاع بإذن ومسجَّل. القاصر يمرّ بولي أمره دائمًا.</span>
  </div>
  ${watched.length?`<div style="display:flex;flex-direction:column;gap:10px"><b class="h2" style="color:#4636e3">أتابعهم (${N(watched.length)})</b>${watched.map(card).join("")}</div>`:""}
  <div style="display:flex;flex-direction:column;gap:10px;margin-top:${watched.length?"6px":"0"}">
    <b class="h2" style="color:${watched.length?"#8a8fa5":"#4636e3"}">${watched.length?"لاعبون آخرون":"لاعبون ظاهرون في الاستكشاف"}</b>
    ${rest.map(card).join("")||`<div class="card" style="border-radius:20px;text-align:center;padding:22px"><span class="muted">لا لاعبين ظاهرين — الظهور يخضع لإعدادات خصوصية كل لاعب</span></div>`}
  </div>
  <div class="dnote">إشعارات الكشافين تمرّ عبر ولي الأمر لمن دون السادسة عشرة، والملف الطبي محجوب عنك دائمًا بقاعدة صلبة.</div>
  </main>`;
};
window.scWatch=async(n)=>{
  let w=[];try{w=JSON.parse(localStorage.getItem("pi_watch_"+ME.id)||"[]")}catch(e){}
  const on=w.includes(n);
  w=on?w.filter(x=>x!==n):[...w,n];
  try{localStorage.setItem("pi_watch_"+ME.id,JSON.stringify(w))}catch(e){}
  toast(on?"أُزيل من متابعتك":"أُضيف لقائمة متابعتك"); render();
};
window.scRequest=async(n,minor)=>{
  const gs=await q("g",sb.from("profiles").select("id").eq("role",minor?"guardian":"player").limit(10));
  if(gs.length) await sb.from("notifications").insert(gs.map(g=>({user_id:g.id,kind:"consent",title:"طلب إذن اطلاع",body:`${ME.name} (كشاف) يطلب إذن اطلاع على سجل ${n}`})));
  await trans(`طلب إذن اطلاع — ${n}${minor?" (عبر ولي الأمر)":""}`);
  toast(minor?"وصل الطلب لولي الأمر — لا اطلاع قبل موافقته":"وصل الطلب للاعب");
};

/* ══════════ الطبي: الجاهزية لا التشخيص ══════════ */
T.medical=async()=>{
  const org=ME.org||"";
  const [pf,att,hs]=await Promise.all([
    q("pf",sb.from("profiles").select("id,name,role,org,age").eq("role","player").limit(60)),
    q("att",sb.from("attendance").select("player_name,org,created_at").limit(200)),
    q("hs",sb.from("health_status").select("*").limit(60))
  ]);
  const roster=pf.filter(p=>p.name&&(!org||p.org===org)).slice(0,10);
  const HMAP={available:"ok",rehab:"limited",limited:"limited",out:"out"};
  const base=n=>{const h=hs.find(x=>x.player_name===n); return h?(HMAP[h.state]||"ok"):"ok";};
  const st=n=>{try{return localStorage.getItem("pi_med_"+n)||base(n)}catch(e){return base(n)}};
  const ST={ok:{ar:"متاح",bg:"#e9f0ea",fg:"#2c6e49"},limited:{ar:"متاح بقيود",bg:"#fff6d6",fg:"#c78c00"},out:{ar:"غير متاح",bg:"#fbeeea",fg:"#a83b25"}};
  const counts={ok:roster.filter(p=>st(p.name)==="ok").length,limited:roster.filter(p=>st(p.name)==="limited").length,out:roster.filter(p=>st(p.name)==="out").length};
  return `<main>
  <div style="background:linear-gradient(165deg,#1d4a3e,#0f2b24);border-radius:26px;padding:22px 20px;color:#faf8f3">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b style="font-size:15px;color:#7fd6a8">المجال الطبي 🔒</b>
        <span style="display:block;font-size:11.5px;color:#b6d8c8;font-weight:500;line-height:1.85;margin-top:5px;max-width:400px">ما يخرج من هنا حالة المشاركة فقط. التشخيص والتفاصيل السريرية لا تغادر هذا المجال، والكشافون محجوبون دائمًا.</span></div>
      <button class="btn gold" style="width:auto;padding:9px 14px;border-radius:999px;font-size:11px;flex:none" onclick="go('reports')">تقرير ←</button>
    </div>
  </div>
  <div class="stat3">
    <div class="stat"><b style="color:#2c6e49">${N(counts.ok)}</b><span class="muted">متاح</span></div>
    <div class="stat"><b style="color:#c78c00">${N(counts.limited)}</b><span class="muted">بقيود</span></div>
    <div class="stat"><b style="color:#a83b25">${N(counts.out)}</b><span class="muted">غير متاح</span></div>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#1d4a3e;display:block;margin-bottom:11px">حالات المشاركة — اضغط لتغييرها</b>
    ${roster.length?roster.map(p=>{const s=st(p.name),S=ST[s];
      return `<div class="lrow">
        <span class="ic" style="background:${S.bg};color:${S.fg}">◈</span>
        <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(p.name)}</b><span class="muted" style="display:block">${esc(p.org||"")}${p.age?" · "+N(p.age)+" سنة":""}</span></div>
        <button onclick="mdCycle('${esc(p.name)}')" style="background:${S.bg};color:${S.fg};border:0;border-radius:999px;padding:6px 13px;font:900 10px Cairo;cursor:pointer;flex:none">${S.ar}</button></div>`}).join(""):`<span class="muted">لا لاعبين</span>`}
  </div>
  <div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:20px;padding:15px 17px">
    <b style="font-size:12.5px;color:#1d4a3e;display:block;margin-bottom:6px">توصية الحمل للمدرب</b>
    <span style="font-size:11.5px;font-weight:600;color:#1d4a3e;line-height:1.85;display:block">${counts.limited?`${N(counts.limited)} لاعبًا بحمل مخفّض هذا الأسبوع — تظهر للمدرب كقيد تشغيلي بلا سبب طبي.`:"لا قيود حالية — كل اللاعبين بحمل كامل."}</span>
  </div>
  <div class="dnote">كل اطّلاع على أي ملف طبي مسجَّل باسم من فتحه ووقته. الفصل بين الجاهزية والتشخيص قاعدة صلبة لا إعداد.</div>
  </main>`;
};
window.mdCycle=async(n)=>{
  const order=["ok","limited","out"];
  let cur="ok";try{cur=localStorage.getItem("pi_med_"+n)||"ok"}catch(e){}
  const nxt=order[(order.indexOf(cur)+1)%3];
  try{localStorage.setItem("pi_med_"+n,nxt)}catch(e){}
  await trans(`تحديث حالة الجاهزية — ${n}: ${({ok:"متاح",limited:"متاح بقيود",out:"غير متاح"})[nxt]}`);
  toast("انعكست الحالة فورًا للمدرب — بلا تشخيص"); render();
};

/* ══════════ المشجع/الهاوي ══════════ */
T.fan=async()=>{
  const [mt,pf,ev]=await Promise.all([
    q("mt",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(20)),
    q("pf",sb.from("profiles").select("id,name,role,org,pos").limit(40)),
    q("ev",sb.from("match_events").select("who,type,match_id").limit(200))
  ]);
  const follow=(()=>{try{return JSON.parse(localStorage.getItem("pi_follow_"+ME.id)||"[]")}catch(e){return []}})();
  const live=mt.filter(m=>m.status==="live"),today=mt.filter(m=>m.status==="today"),open=mt.filter(m=>m.status==="open").slice(0,3);
  const players=pf.filter(p=>p.role==="player"&&p.name).slice(0,6);
  return `<main>
  <div class="stage" style="border-radius:26px">
    <b style="font-size:15px;color:#f5c518">تابع اللعبة</b>
    <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">تابع لاعبًا أو جهة، وشاهد المباريات الحيّة لحظة بلحظة — بلا عدّادات شعبية ولا مقارنات بين الأطفال.</span>
  </div>
  ${live.length?`<div style="display:flex;flex-direction:column;gap:10px">
    <b class="h2" style="color:#e8531f">مباشر الآن</b>
    ${live.map(m=>`<div onclick="go('matchView','${m.id}')" style="background:#151a2e;border-radius:22px;padding:16px 18px;color:#faf8f3;cursor:pointer;position:relative;overflow:hidden">
      <div style="position:absolute;inset-inline-start:70%;top:-60%;width:65%;height:220%;background:#e8531f;border-radius:50%;opacity:.42"></div>
      <div style="position:relative;display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="min-width:0"><span style="display:inline-flex;align-items:center;gap:6px;background:#e8531f;border-radius:999px;padding:3px 11px;font-size:10px;font-weight:900"><span style="width:6px;height:6px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite"></span>مباشر</span>
          <b style="display:block;font-size:14px;margin-top:7px">${esc(m.title)}</b>
          <span style="font-size:10.5px;color:#c6cade;font-weight:700">المنظم المسؤول: ${esc(m.organizer_name)}</span></div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:30px;flex:none">${m.score_a}–${m.score_b}</b></div></div>`).join("")}
  </div>`:""}
  ${today.length||open.length?`<div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">${today.length?"اليوم":"قريبًا"}</b>
    ${[...today,...open].slice(0,4).map(m=>`<div class="lrow" onclick="go('matchView','${m.id}')" style="cursor:pointer">
      <span class="ic">⚽</span><div style="flex:1;min-width:0"><b style="font-size:12px">${esc(m.title)}</b><span class="muted" style="display:block"><span class="ltr">${esc(m.match_time||"")}</span> · ${esc(m.venue||"")} · ${esc(m.organizer_name)}</span></div>
      <span style="color:#4636e3;font-weight:900">←</span></div>`).join("")}</div>`:""}
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">لاعبون يمكنك متابعتهم</b>
    ${players.length?players.map(p=>{const on=follow.includes(p.name),ms=new Set(ev.filter(e=>e.who===p.name).map(e=>e.match_id)).size;
      return `<div class="lrow">
        <span class="ic" style="background:linear-gradient(160deg,#4636e3,#2a2260);color:#fff">${esc(p.name[0])}</span>
        <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(p.name)}</b><span class="muted" style="display:block">${esc(p.pos||"لاعب")}${p.org?" · "+esc(p.org):""} · ${N(ms)} مباراة موثقة</span></div>
        <button class="btn ${on?"ghost":""}" style="width:auto;padding:7px 13px;border-radius:999px;font-size:10px;flex:none" onclick="fnFollow('${esc(p.name)}')">${on?"أتابعه ✓":"تابع"}</button></div>`}).join(""):`<span class="muted">لا لاعبين ظاهرين</span>`}
  </div>
  <div class="note">لا أرقام شعبية ولا ترتيب بين اللاعبين — المتابعة لمشاهدة المسيرة الموثقة لا للمقارنة.</div>
  </main>`;
};
window.fnFollow=(n)=>{
  let f=[];try{f=JSON.parse(localStorage.getItem("pi_follow_"+ME.id)||"[]")}catch(e){}
  const on=f.includes(n); f=on?f.filter(x=>x!==n):[...f,n];
  try{localStorage.setItem("pi_follow_"+ME.id,JSON.stringify(f))}catch(e){}
  toast(on?"أُلغيت المتابعة":"تتابعه الآن — يصلك جديده الموثق"); render();
};

/* ══════════ لوحة المالك ══════════ */
T.owner=async()=>{
  const [pf,mt,ev,att,subs,bk,tr,ns]=await Promise.all([
    q("pf",sb.from("profiles").select("id,name,role,org,created_at").limit(400)),
    q("mt",sb.from("matches").select("id,status,created_at,organizer_name").limit(200)),
    q("ev",sb.from("match_events").select("id,created_at").limit(500)),
    q("att",sb.from("attendance").select("id,org,created_at").limit(500)),
    q("subs",sb.from("subscriptions").select("*").limit(200)),
    q("bk",sb.from("bookings").select("*").limit(200)),
    q("tr",sb.from("transparency").select("*").order("created_at",{ascending:false}).limit(60)),
    q("nt",sb.from("notifications").select("id,kind,created_at").limit(300))
  ]);
  const acts=[...ev,...att,...mt,...ns];
  const dayCount=n=>acts.filter(a=>{const d=(Date.now()-new Date(a.created_at))/864e5;return d<n}).length;
  const days=[...Array(14)].map((_,i)=>{const from=13-i;
    return acts.filter(a=>{const d=(Date.now()-new Date(a.created_at))/864e5;return d>=from&&d<from+1}).length});
  const mx=Math.max(...days,1);
  const byRole={};pf.forEach(p=>{byRole[p.role]=(byRole[p.role]||0)+1});
  const roles=Object.entries(byRole).sort((a,b)=>b[1]-a[1]);
  const orgs=[...new Set(pf.map(p=>p.org).filter(Boolean))];
  const subRev=subs.filter(s=>s.paid).reduce((t,s)=>t+(+s.amount||0),0);
  const bkRev=bk.filter(b=>b.status==="paid").reduce((t,b)=>t+(+b.price||0),0);
  const platform=Math.round(subRev*0.04+bkRev*0.15);
  const reports=ns.filter(n=>n.kind==="report").length;
  return `<main>
  <div class="stage" style="border-radius:26px">
    <b style="font-size:16px;color:#f5c518">نبض PlayIn</b>
    <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">أرقام حقيقية من القاعدة — لا تقديرات. تقرأها كمالك لتعرف أين تنمو المنصة وأين تحتاج دفعًا.</span>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:8px;margin-top:16px">
      <div style="background:rgba(255,255,255,.08);border:1px solid #333a55;border-radius:15px;padding:12px 10px"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:20px;color:#faf8f3">${N(pf.length)}</b><span style="font-size:9px;color:#9aa0b8;font-weight:800">حسابًا</span></div>
      <div style="background:rgba(255,255,255,.08);border:1px solid #333a55;border-radius:15px;padding:12px 10px"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:20px;color:#f5c518">${N(dayCount(7))}</b><span style="font-size:9px;color:#9aa0b8;font-weight:800">حدثًا/٧ أيام</span></div>
      <div style="background:rgba(255,255,255,.08);border:1px solid #333a55;border-radius:15px;padding:12px 10px"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:20px;color:#faf8f3">${N(orgs.length)}</b><span style="font-size:9px;color:#9aa0b8;font-weight:800">جهة</span></div>
      <div style="background:rgba(44,110,73,.25);border:1px solid #2c6e49;border-radius:15px;padding:12px 10px"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:20px;color:#7fd6a8">${platform.toLocaleString("en")}</b><span style="font-size:9px;color:#9aa0b8;font-weight:800">دخل المنصة ر.س</span></div>
    </div>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">النشاط اليومي — ١٤ يومًا</b>
    <div style="display:flex;align-items:flex-end;gap:4px;height:76px">
      ${days.map((d,i)=>`<div title="${d} حدثًا" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%"><span style="height:${Math.max(4,d/mx*100)}%;background:${i===13?"#f5c518":"#4636e3"};border-radius:4px 4px 0 0;opacity:${d?1:.15};display:block"></span></div>`).join("")}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:6px"><span class="muted">قبل أسبوعين</span><span class="muted" style="color:#c78c00">اليوم</span></div>
    <span class="muted" style="display:block;margin-top:8px">أعلى يوم: <b class="ltr" style="color:#4636e3">${mx}</b> حدثًا · الإجمالي في ١٤ يومًا: <b class="ltr">${N(dayCount(14))}</b></span>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">تركيبة المستخدمين</b>
    ${roles.map(([r,c])=>`<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:4px"><span style="color:#565d78">${esc(roleAr[r]||r)}</span><span class="ltr" style="color:#4636e3;font-family:'Space Grotesk'">${c}</span></div><div style="height:8px;background:#f0ece2;border-radius:99px;overflow:hidden"><div style="width:${Math.round(c/pf.length*100)}%;height:100%;background:#4636e3;border-radius:99px"></div></div></div>`).join("")}
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">الإيرادات ونِسب المنصة</b>
    ${RP?"":""}
    <div style="display:flex;flex-direction:column;gap:9px">
      <div style="display:flex;justify-content:space-between;align-items:center;background:#faf8f3;border:1px solid #e9e4d8;border-radius:13px;padding:11px 13px"><div><b style="font-size:11.5px">اشتراكات الأكاديميات</b><span class="muted" style="display:block">نسبة ٤٪ بلا اشتراك · ٠٪ مع اشتراك</span></div><b class="ltr" style="color:#2c6e49">${subRev.toLocaleString("en")}</b></div>
      <div style="display:flex;justify-content:space-between;align-items:center;background:#faf8f3;border:1px solid #e9e4d8;border-radius:13px;padding:11px 13px"><div><b style="font-size:11.5px">حجوزات الملاعب</b><span class="muted" style="display:block">تذاكر ومنتج رقمي ١٥–٢٠٪</span></div><b class="ltr" style="color:#2c6e49">${bkRev.toLocaleString("en")}</b></div>
      <div style="display:flex;justify-content:space-between;align-items:center;background:#151a2e;border-radius:13px;padding:11px 13px;color:#faf8f3"><div><b style="font-size:11.5px;color:#f5c518">نصيب المنصة المحتسب</b><span style="display:block;font-size:9.5px;color:#9aa0b8;font-weight:700">بالنِّسب المعلنة — عقود احترافية ٢٫٥٪ ثابتة</span></div><b class="ltr" style="color:#f5c518">${platform.toLocaleString("en")}</b></div>
    </div>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">صحة المنصة</b>
    ${RP.kv?RP.kv([
      ["مباريات موثقة",`<span class="ltr">${mt.filter(m=>m.status==="final").length}</span>`,"#4636e3"],
      ["أحداث مسجّلة",`<span class="ltr">${ev.length}</span>`],
      ["حصص تدريب",`<span class="ltr">${att.length}</span>`],
      ["تقارير منشورة",`<span class="ltr">${reports}</span>`,"#c78c00"],
      ["قيود في سجل الشفافية",`<span class="ltr">${tr.length}</span>`,"#2c6e49"]
    ]):""}
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:9px">إدخال جهة جديدة</b>
    <span class="muted" style="display:block;margin-bottom:11px">المسار: أنشئ الجهة → اختر وضعها (خفيف/متوسط/احترافي) → أضف مجموعاتها ولاعبيها → ادعُ أولياء الأمور → انشر أول تقرير.</span>
    <div style="display:flex;flex-direction:column;gap:7px">
      ${[["١","أنشئ حساب الجهة ودورها","erp"],["٢","أضف المجموعات واللاعبين","acad"],["٣","انشر أول تقرير لأولياء الأمور","reports"]].map(([n,t,v])=>`<div class="lrow" onclick="go('${v}')" style="cursor:pointer"><span class="ic">${n}</span><div style="flex:1"><b style="font-size:12px">${t}</b></div><span style="color:#4636e3;font-weight:900">←</span></div>`).join("")}
    </div>
  </div>
  </main>`;
};

/* ── التركيب ── */
(function(){
  Object.assign(TITLES,{fan:"تابع اللعبة",owner:"نبض المنصة",guardian:"الإشراف",scout:"قائمة المتابعة",medical:"المجال الطبي 🔒"});
  if(NAV.guardian) NAV.guardian=[["⌂","الإشراف","guardian"],["▤","تحديثاتي","updates"],["FAB","","explore"],["◎","تابع","fan"],["◉","تقارير","reports"]];
  if(NAV.scout) NAV.scout=[["⌂","المتابعة","scout"],["◎","تابع","fan"],["FAB","","explore"],["▤","تقارير","reports"],["◉","إشعارات","notifications"]];
  if(NAV.medical) NAV.medical=[["⌂","الطبي","medical"],["◎","استكشف","explore"],["FAB","","explore"],["▤","تقارير","reports"],["◉","الشفافية","admin"]];
  if(NAV.admin) NAV.admin=[["⌂","النبض","owner"],["◈","الديوان","erp"],["FAB","","newMatch"],["◎","السوق","market"],["▤","تقارير","reports"]];
  if(NAV.agent) NAV.agent=[["⌂","التعاقدات","deals"],["◎","السوق","market"],["FAB","","deals"],["▤","تقارير","reports"],["◉","إشعارات","notifications"]];
  Object.assign(TITLES,{owner:"نبض المنصة",memberships:"العضويات",sponsor:"الرعايات"});
})();
