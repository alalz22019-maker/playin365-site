const C=window.PI_CONFIG||{};
let sb=(C.SUPABASE_URL&&!C.SUPABASE_URL.includes("YOUR-"))?supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
if(sb&&window.DEMO) sb=DEMO.wrap(sb);
let ME=null, VIEW="auth", PARAM=null, CACHE={}, DEMO_HINT=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const N=n=>`<span class="ltr">${esc(n)}</span>`;
const roleAr={player:"لاعب",coach:"مدرب",organizer:"منظم",academy:"أكاديمية",venue:"ملعب",guardian:"ولي أمر",scout:"كشاف",admin:"الإدارة",medical:"طبي",referee:"حكم",agent:"وكيل"};
const WM=d=>`<span class="wm" style="font-size:18px"><span style="color:${d?"#faf8f3":"#151a2e"}">Play</span><span style="color:${d?"#f5c518":"#c78c00"}">In</span><span style="color:${d?"#7b5cff":"#4636e3"};font-size:.46em;vertical-align:super;letter-spacing:0">365</span></span>`;
function toast(t,err){ const e=document.createElement("div"); e.className="toast"+(err?" err":""); e.textContent=t; document.body.append(e); setTimeout(()=>e.remove(),2800); }
function go(v,p){ VIEW=v; PARAM=p??null; render(); }
async function trans(action){ await sb.from("transparency").insert({actor:ME.name+" — "+roleAr[ME.role],action}); }
async function notifyUser(uid,kind,title,body){ await sb.from("notifications").insert({user_id:uid,kind,title,body}); }

/* ---------- AUTH ---------- */
async function boot(){
  if(!sb){ $("#app").innerHTML=`<main><div class="note" style="margin-top:40vh0">⚠️ لم تُضبط مفاتيح Supabase بعد — افتح <b>config.js</b> وضع Project URL وanon key ثم أعد التحميل. الخطوات كاملة في README-DEPLOY.md</div></main>`; return; }
  const {data:{session}}=await sb.auth.getSession();
  if(session){ DEMO.begin(session.user.id,session.user.email); await loadMe(session.user.id,session.user.email); VIEW=ME&&ME.roleSet?homeFor():"role"; } 
  render();
  sb.auth.onAuthStateChange(async(ev,s)=>{ if(ev==="SIGNED_IN"&&s){ CACHE={}; PARAM=null; DEMO.begin(s.user.id,s.user.email); await loadMe(s.user.id,s.user.email); VIEW=ME&&ME.roleSet?homeFor():"role"; render(); } if(ev==="SIGNED_OUT"){ ME=null; CACHE={}; PARAM=null; DEMO.on=false; VIEW="auth"; render(); } });
}
async function loadMe(uid,email){
  const {data}=await sb.from("profiles").select("*").eq("id",uid).single();
  let picked=false; try{ picked=localStorage.getItem("pi_role_"+(data&&data.id))==="1"; }catch(e){}
  /* Demo accounts are synthetic personas. Their requested persona is encoded in the
     @demo.playin365.app email and must never be overridden by stale profile seed data. */
  let demoRole=null;
  try{
    if(data && DEMO && DEMO.isDemoEmail(email)){
      const candidate=String(email||"").split("@")[0];
      if(roleAr[candidate]) demoRole=candidate;
    }
  }catch(e){}
  ME=data?{...data,role:demoRole||data.role,isSyntheticDemo:!!demoRole,roleSet:!!demoRole||picked||DEMO_HINT===data.id||(data.role&&data.role!=="player")||(data.org&&data.pos)}:null;
}
function homeFor(){ return ({player:"myHome",coach:"myHome",organizer:"orgMatch",referee:"refDuty",academy:"myHome",venue:"venue",guardian:"guardian",scout:"scout",admin:"owner",medical:"medical",agent:"deals"})[ME.role]||"home"; }
async function doSignup(){
  const name=$("#su_name").value.trim(), em=$("#su_em").value.trim(), pw=$("#su_pw").value;
  if(!name||!em||pw.length<8) return toast("أكمل الاسم والبريد وكلمة مرور ٨+ أحرف",1);
  const {error}=await sb.auth.signUp({email:em,password:pw,options:{data:{name}}});
  if(error) return toast(error.message.includes("registered")?"البريد مسجّل سابقًا — ادخل":"تعذّر: "+error.message,1);
  toast("أنشئ الحساب — إن طُلب تأكيد البريد افتح رسالتنا");
}
async function doLogin(){
  const em=$("#li_em").value.trim(), pw=$("#li_pw").value;
  const {error}=await sb.auth.signInWithPassword({email:em,password:pw});
  if(error) toast("بيانات غير صحيحة",1);
}
const DEMO_PW="Demo1234!";
const DEMOS={
  افراد:[["player","سعود القحطاني","لاعب — سجل ممتلئ وتقييم"],["coach","عبدالله المطيري","مدرب — أثر تدريب وحصص"],["scout","ناصر الدوسري","كشاف"],["agent","خالد العنزي","وكيل — غرفة تعاقدات"],["medical","د. ريم الحربي","طبي"],["referee","ماجد السبيعي","حكم"],["guardian","فهد الشمري","ولي أمر"],["organizer","تركي الرشيد","منظم"],["admin","إدارة المنصة","الإدارة — نبض المنصة"]],
  جهات:[["academy","أكاديمية النخبة","أكاديمية — حضور واشتراكات"],["venue","ملعب المروج","ملعب — حجوزات"]]
};
window.demoLogin=async(role,btn)=>{
  if(btn){btn.disabled=true;btn.dataset.t=btn.textContent;btn.textContent="ثوانٍ…";}
  const {data,error}=await sb.auth.signInWithPassword({email:role+"@demo.playin365.app",password:DEMO_PW});
  if(error){if(btn){btn.disabled=false;btn.textContent=btn.dataset.t;}return toast("تعذّر فتح الحساب",1);}
  DEMO_HINT=data.user.id;
  try{localStorage.setItem("pi_role_"+data.user.id,"1");}catch(e){}
  toast("دخلت كـ"+roleAr[role]+" — الحساب جاهز للاستكشاف");
};
window.doGuest=async(btn)=>{
  if(btn){ btn.disabled=true; btn.textContent="ثوانٍ — نجهّز جولتك…"; }
  const r=Math.random().toString(36).slice(2,10);
  const {error}=await sb.auth.signUp({email:`guest_${Date.now()}_${r}@demo.playin365.app`,password:"Gp!"+r+"9x2",options:{data:{name:"زائر"}}});
  if(error){ if(btn){ btn.disabled=false; btn.textContent="استكشف PlayIn365 — بلا بريد ولا كلمة مرور"; } return toast("تعذّر فتح الحساب — جرّب مرة أخرى",1); }
  toast("دخلت كزائر — رحلة جديدة من البداية");
};
async function saveRole(){
  const role=$("#rl").value, org=$("#rl_org")?$("#rl_org").value.trim():"";
  const {error}=await sb.from("profiles").update({role,org}).eq("id",ME.id);
  if(error) return toast("تعذّر الحفظ: "+error.message,1);
  try{ localStorage.setItem("pi_role_"+ME.id,"1"); }catch(e){}
  ME.role=role; ME.org=org; ME.roleSet=true; toast("أهلًا بك — "+roleAr[role]); go(homeFor());
}

/* ---------- DATA ---------- */
/* حسابات الزائر السريع لا تظهر كلاعبين في قوائم أحد */
const GUEST_NAME="زائر";
async function q(name,builder){ const run=()=>typeof builder==="function"?builder():builder; let {data,error}=await run();
  if(error&&(error.code==="PGRST303"||/JWT issued at future/i.test(error.message||""))){ try{ await sb.auth.refreshSession(); ({data,error}=await run()); }catch(e){} }
  if(error){ console.error(name,error); toast("خطأ قراءة "+name,1); return []; }
  let rows=data||[];
  if(Array.isArray(rows)&&rows.length&&rows[0]&&"name" in rows[0]) rows=rows.filter(r=>r.name!==GUEST_NAME);
  return rows; }
const evLabel=e=>({goal:"هدف — "+e.who,assist:"صناعة — "+e.who,yellow:"بطاقة صفراء — "+e.who,red:"بطاقة حمراء — "+e.who,sub:"تبديل — "+e.who})[e.type]||e.type;

/* ---------- VIEWS ---------- */
const T={};
T.auth=()=>`<main style="justify-content:center">
  <div style="text-align:center;margin:26px 0 4px">
    <span class="wm" style="font-size:34px"><span style="color:#151a2e">Play</span><span style="color:#c78c00">In</span><span style="color:#4636e3;font-size:.46em;vertical-align:super;letter-spacing:0">365</span></span>
    <p style="margin:8px 0 0;font-size:13px;color:#565d78;font-weight:700">حسابك الرياضي الموثّق — كل رقم باسم من سجّله</p>
  </div>
  <div class="stage" style="border-radius:26px;padding:22px 20px">
    <b style="display:block;font-size:18px;font-weight:900;line-height:1.5;text-wrap:pretty">آلاف المباريات تُلعب كل أسبوع — وتختفي بلا أثر.</b>
    <span style="display:block;font-size:13px;font-weight:500;color:#c6cade;line-height:1.9;margin-top:9px;text-wrap:pretty">حوكمة الرياضة من خلال جعل كل مباراة قابلة للتسجيل بلمستين، وكل حدث يحمل اسم من سجّله وصفته.</span>
    <div style="display:flex;flex-direction:column;gap:9px;margin-top:16px;padding-top:15px;border-top:1px solid rgba(255,255,255,.12)">
      ${[["⚽","المباراة تُسجَّل لحظتها","المنظّم ينشئها، الحكم يوقّعها، والحدث ينعكس في سجل الجميع"],
         ["✓","كل سطر باسم صاحبه","كل قرار يتم اتخاذه، يتم تسجيله لضبط الحوكمة"],
         ["🔒","التحكم في الصلاحيات","اختلاف الصلاحيات بناء على البيانات وحساسيتها وفائدتها"]]
        .map(([g,t,s])=>`<div style="display:flex;gap:12px;align-items:flex-start">
        <span style="width:34px;height:34px;flex:none;border-radius:50% 50% 50% 8px;background:rgba(245,197,24,.16);color:#f5c518;display:grid;place-items:center;font-size:15px">${g}</span>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">${t}</b>
          <span style="display:block;font-size:11px;font-weight:500;color:#c6cade;line-height:1.8;margin-top:3px">${s}</span></div></div>`).join("")}
    </div>
    <span style="display:block;font-size:11px;font-weight:800;color:#c6cade;line-height:1.8;margin-top:15px;padding-top:13px;border-top:1px solid rgba(255,255,255,.12)">لاعب · مدرب · أكاديمية · منظّم · حكم · وليّ أمر · كشاف<br>مستخدمون مختلفون — بأدوار متعددة</span>
  </div>
  <div class="card">
    <div style="display:flex;gap:6px;margin-bottom:13px">
      <button class="btn" id="tabL" style="flex:1;padding:11px" onclick="swTab(0)">دخول</button>
      <button class="btn ghost" id="tabS" style="flex:1;padding:11px" onclick="swTab(1)">حساب جديد</button>
    </div>
    <div id="pnL">
      <div class="fld"><label>البريد الإلكتروني</label><input id="li_em" dir="ltr" placeholder="you@email.com"></div>
      <div class="fld"><label>كلمة المرور</label><input id="li_pw" dir="ltr" type="password" placeholder="••••••••"></div>
      <button class="btn" onclick="doLogin()">ادخل</button>
    </div>
    <div id="pnS" style="display:none">
      <div class="fld"><label>الاسم</label><input id="su_name" placeholder="اسمك الظاهر في السجلات"></div>
      <div class="fld"><label>البريد الإلكتروني</label><input id="su_em" dir="ltr" placeholder="you@email.com"></div>
      <div class="fld"><label>كلمة المرور</label><input id="su_pw" dir="ltr" type="password" placeholder="٨ أحرف فأكثر"></div>
      <button class="btn" onclick="doSignup()">أنشئ الحساب</button>
      <p class="muted" style="text-align:center;margin:9px 0 0">التسجيل مفتوح للجميع — المصداقية تُكتسب من ملعبك لا عند الباب</p>
    </div>
    <button class="btn ghost" disabled style="margin-top:9px">نفاذ <span class="chip warn" style="margin-inline-start:6px">قريبًا</span></button>
    <button class="btn dark" style="margin-top:9px" onclick="doGuest(this)">استكشف PlayIn365 — بلا بريد ولا كلمة مرور</button>
    <p class="muted" style="text-align:center;margin:7px 0 0">كل جولة استكشاف تبدأ من نقطة جديدة</p>
  </div>
  <div class="card" style="border-radius:26px">
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:4px"><span style="width:8px;height:22px;background:#4636e3;border-radius:99px"></span><b class="h2">أدوار جاهزة للاستكشاف</b></div>
    <p class="muted" style="margin:0 0 12px">ادخل بأي دور فورًا — بياناته مزروعة لتشوف الرسوم والخدمات مملوءة.</p>
    ${Object.entries(typeof DEMOS!=="undefined"?DEMOS:{}).map(([grp,arr])=>`
      <div style="font-size:11px;font-weight:900;color:#8a8fa5;margin:6px 0 8px">${grp==="افراد"?"أفراد":"جهات"}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:6px">
        ${arr.map(([r,nm,desc])=>`<button onclick="demoLogin('${r}',this)" style="display:flex;align-items:center;gap:11px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:16px;padding:11px 13px;cursor:pointer;text-align:start;font-family:Cairo">
          ${typeof PL3!=="undefined"?PL3.av(nm,38,{dark:true,r:r==="coach"?"50% 50% 10px 50%":"50% 50% 50% 10px",url:PL3.AVDEF[nm]?PL3.AVDIR+PL3.AVDEF[nm]+".png":null}):`<span style="width:38px;height:38px;border-radius:50% 50% 50% 10px;background:linear-gradient(160deg,#4636e3,#2a2260);color:#fff;display:grid;place-items:center;font-weight:900;font-size:15px;flex:none">${nm[0]}</span>`}
          <span style="flex:1;min-width:0"><b style="font-size:12.5px;display:block">${nm}</b><span class="muted">${desc}</span></span>
          <span style="color:#4636e3;font-weight:900">←</span></button>`).join("")}
      </div>`).join("")}
    <p class="muted" style="text-align:center;margin:9px 0 0">كلمة المرور لكلها <span class="ltr">Demo1234!</span> — والبريد <span class="ltr">دور@demo.playin365.app</span></p>
  </div></main>`;
window.swTab=i=>{ $("#pnL").style.display=i?"none":"block"; $("#pnS").style.display=i?"block":"none"; $("#tabL").className=i?"btn ghost":"btn"; $("#tabS").className=i?"btn":"btn ghost"; $("#tabL").style.flex=$("#tabS").style.flex="1"; };

T.role=()=>`<main>
  <div class="stage"><b style="font-size:15px;color:#f5c518">هلا ${esc(ME.name)} 👋</b><p style="margin:7px 0 0;font-size:12px;color:#c6cade;font-weight:600;line-height:1.9">${ME.roleSet?`دورك الحالي ${esc(roleAr[ME.role]||"")}. يمكنك تغييره وقت الحاجة.`:"اختر دورك الأساسي — هوية واحدة وأدوار متعددة، وتضيف غيره لاحقًا."}</p></div>
  <div class="card">
    <div class="fld"><label>الدور</label><select id="rl">${Object.entries(roleAr).map(([k,v])=>`<option value="${k}"${k===ME.role?" selected":""}>${v}</option>`).join("")}</select></div>
    <div class="fld"><label>جهتك (اختياري)</label><input id="rl_org" value="${esc(ME.org||"")}" placeholder="مثال: أكاديمية النخبة / ملعب المروج"></div>
    <button class="btn" onclick="saveRole()">${ME.roleSet?"حفظ الدور":"ابدأ"}</button>
  </div></main>`;

T.newMatch=()=>`<main>
  <div class="card"><b class="h2" style="display:block;margin-bottom:11px">إنشاء مباراة — أنت المنظم المسؤول</b>
    <div class="fld"><label>العنوان</label><input id="nm_t" placeholder="سباعية ودية / الصقور × الشرق"></div>
    <div class="grid2"><div class="fld"><label>الوقت</label><input id="nm_time" dir="ltr" value="20:00"></div><div class="fld"><label>الملعب</label><input id="nm_v" value="ملعب المروج"></div></div>
    <div class="grid2"><div class="fld"><label>رسوم اللاعب (ر.س)</label><input id="nm_fee" dir="ltr" type="number" value="0"></div><div class="fld"><label>حكم معيّن (اختياري)</label><input id="nm_ref" placeholder="اسم الحكم"></div></div>
    <button class="btn" onclick="createMatch()">أنشئ — تظهر فورًا في استكشف</button></div>
  <div class="note">كل شيء تحت مسؤوليتك: التنظيم والتسجيل والنتيجة. إن عيّنت حكمًا فقراره ينعكس مباشرة.</div></main>`;
window.createMatch=async()=>{
  const t=$("#nm_t").value.trim(); if(!t) return toast("اكتب العنوان",1);
  const {error}=await sb.from("matches").insert({title:t,match_time:$("#nm_time").value,venue:$("#nm_v").value,fee:+$("#nm_fee").value||0,referee_name:$("#nm_ref").value.trim(),organizer_id:ME.id,organizer_name:ME.name,status:"open",comp:"مفتوحة"});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans("إنشاء مباراة: "+t); toast("أُنشئت"); go("orgMatch");
};

T.orgMatch=async()=>{
  const ms=await q("matches",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(15));
  const mine=ME.role==="referee"?ms.filter(m=>m.referee_name===ME.name):ms.filter(m=>m.organizer_id===ME.id);
  const list=mine.length?mine:ms;
  const owned=mine.length>0;
  return `<main>
    ${(owned||ME.role!=="organizer")?"":`<div class="note">لا مباريات تحت مسؤوليتك بعد — هذه مباريات المنصة للاطلاع. أنشئ مباراتك من زر <b>+</b> لتصير مسؤولًا عن تسجيلها.</div>`}
    ${list.map(m=>`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:13px">${esc(m.title)}</b>${m.status==="final"?`<b class="ltr" style="font-family:'Space Grotesk';font-size:16px">${m.score_a} - ${m.score_b}</b>`:`<span class="chip ${m.status==="live"?"live":"warn"}">${m.status==="live"?"● مباشر":m.status==="today"?"اليوم":"مفتوحة"}</span>`}</div>
      <span class="muted" style="display:block;margin-top:4px">${esc(m.venue)} · ${esc(m.match_time)} · المنظم: ${esc(m.organizer_name)}${m.referee_name?" — الحكم "+esc(m.referee_name):""}</span>
      <div style="display:flex;gap:8px;margin-top:11px">
        ${(m.organizer_id===ME.id||m.referee_name===ME.name)&&m.status!=="final"?`<button class="btn" style="flex:1;padding:11px" onclick="go('live','${m.id}')">التسجيل المباشر</button>`:""}
        ${(m.organizer_id===ME.id)&&m.status==="final"?`<button class="btn ghost" style="flex:1;padding:11px" onclick="go('correct','${m.id}')">تصحيح باسمك</button>`:""}
        <button class="btn ghost" style="flex:1;padding:11px" onclick="go('matchView','${m.id}')">التفاصيل</button>
      </div></div>`).join("")||`<div class="card" style="text-align:center;padding:28px"><b>لا مباريات بعد</b></div>`}
    <div class="note">لا اعتماد ولا اعتراض: قرارك ينعكس فورًا. الخطأ يُصحَّح باسمك ووقتك وسببك في سجل الشفافية.</div>
  </main>`;
};

T.live=async()=>{
  const m=(await q("m",sb.from("matches").select("*").eq("id",PARAM)))[0]; if(!m) return "<main><div class='card'>غير موجودة</div></main>"; CACHE.live=m;
  if(m.status!=="live"&&m.status!=="final"){ await sb.from("matches").update({status:"live"}).eq("id",m.id); m.status="live"; }
  const evs=await q("evs",sb.from("match_events").select("*").eq("match_id",m.id).order("created_at",{ascending:false}));
  const by=m.referee_name&&ME.name===m.referee_name?ME.name+" — الحكم":ME.name+" — المنظم";
  return `<main>
    <div class="stage"><div style="display:flex;justify-content:space-between;align-items:center"><span class="chip live" style="background:rgba(232,83,31,.2);border:1px solid #e8531f;color:#ff8a5f">● مباشر</span><b class="ltr" style="font-family:'Space Grotesk';font-size:30px">${m.score_a} - ${m.score_b}</b></div><b style="display:block;margin-top:6px;font-size:13px">${esc(m.title)}</b></div>
    <div class="card"><b class="h2" style="display:block;margin-bottom:10px">سجّل — ينعكس فورًا باسم: ${esc(by)}</b>
      <div class="grid2"><div class="fld"><label>اسم اللاعب</label><input id="ev_who" placeholder="من فعلها؟"></div><div class="fld"><label>الدقيقة</label><input id="ev_min" dir="ltr" type="number" min="1" max="130" placeholder="67"></div></div>
      <div class="grid2">
        <button class="btn" onclick="recEv('${m.id}','goal',1,'${esc(by)}')">⚽ هدف (فريق ١)</button>
        <button class="btn" onclick="recEv('${m.id}','goal',2,'${esc(by)}')">⚽ هدف (فريق ٢)</button>
        <button class="btn dark" onclick="recEv('${m.id}','yellow',0,'${esc(by)}')">▮ بطاقة صفراء</button>
        <button class="btn ghost" onclick="recEv('${m.id}','sub',0,'${esc(by)}')">⇄ تبديل</button>
      </div></div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b class="h2">الأحداث</b><button class="btn dark" style="width:auto;padding:9px 16px;border-radius:999px;font-size:10.5px" onclick="endMatch('${m.id}')">أنهِ — النتيجة نهائية لحظة الإعلان</button></div>
      ${evs.map(e=>`<div class="lrow"><b class="ltr" style="font-family:'Space Grotesk';color:#8a8fa5;width:30px;flex:none">${e.minute}'</b><span style="flex:1;font-size:12px;font-weight:700">${esc(evLabel(e))}</span><span class="muted" style="flex-shrink:0">${esc(e.recorded_by)}</span></div>`).join("")||`<span class="muted">لم تُسجّل أحداث بعد.</span>`}</div>
  </main>`;
};
window.recEv=async(mid,type,team,by)=>{
  const who=$("#ev_who").value.trim(); if(!who) return toast("اكتب اسم اللاعب — لا حدث بلا صاحب",1);
  const mv=$("#ev_min")?$("#ev_min").value:""; const min=parseInt(mv,10);
  if(!(min>=1&&min<=130)) return toast("اكتب الدقيقة — الرقم يدخل السجل للأبد",1);
  const {error}=await sb.from("match_events").insert({match_id:mid,minute:min,type,who,recorded_by:by});
  if(error) return toast("تعذّر: "+error.message,1);
  if(type==="goal"&&team){ const f=team===1?"score_a":"score_b"; const m=CACHE.live; m[f]++; await sb.from("matches").update({[f]:m[f]}).eq("id",mid); }
  toast("سُجّل وانعكس فورًا"); render();
};
window.endMatch=async(mid)=>{
  await sb.from("matches").update({status:"final"}).eq("id",mid);
  const m=CACHE.live; await trans(`إعلان نتيجة ${m.title}: ${m.score_a}-${m.score_b} — نهائية لحظة الإعلان`);
  toast("النتيجة نهائية ودخلت السجلات"); go("orgMatch");
};

T.correct=async()=>{
  const m=(await q("m",sb.from("matches").select("*").eq("id",PARAM)))[0]; CACHE.corr=m;
  return `<main>
    <div class="card" style="border:2px solid #4636e3"><b class="h2" style="display:block;margin-bottom:10px">تصحيح المنظم — ${esc(m.title)}</b>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><span class="muted">النتيجة</span>
        <input id="c1" dir="ltr" value="${m.score_a}" style="width:54px;text-align:center;border:1px solid #e3ded2;border-radius:10px;padding:10px;font:700 14px 'Space Grotesk'">
        <span style="color:#c9c2b2;font-weight:900">-</span>
        <input id="c2" dir="ltr" value="${m.score_b}" style="width:54px;text-align:center;border:1px solid #e3ded2;border-radius:10px;padding:10px;font:700 14px 'Space Grotesk'">
      </div>
      <div class="fld"><label>السبب — إلزامي</label><input id="cr" placeholder="مثال: خطأ إدخال في الدقيقة 67"></div>
      <button class="btn dark" onclick="applyCorrect()">أكّد — يُخطر الطرفان ويدخل سجل الشفافية باسمك</button></div>
    <div class="note">تصحيح لا اعتراض: أنت وحدك تصحّح ما نظّمت، ويبقى التصحيح باسمك ووقته وسببه للأبد.</div>
  </main>`;
};
window.applyCorrect=async()=>{
  const r=$("#cr").value.trim(); if(!r) return toast("السبب إلزامي",1);
  const m=CACHE.corr, a=+$("#c1").value, b=+$("#c2").value;
  await sb.from("matches").update({score_a:a,score_b:b}).eq("id",m.id);
  await trans(`تصحيح نتيجة ${m.title}: من ${m.score_a}-${m.score_b} إلى ${a}-${b} · السبب: ${r}`);
  toast("صُحّحت ودخل التصحيح سجل الشفافية"); go("orgMatch");
};

T.matchView=async()=>{
  const m=(await q("m",sb.from("matches").select("*").eq("id",PARAM)))[0];
  const evs=await q("evs",sb.from("match_events").select("*").eq("match_id",m.id).order("minute"));
  return `<main>
    <div class="card" style="text-align:center"><span class="muted">${esc(m.comp)} · ${esc(m.venue)}</span><b style="display:block;font-size:14px;margin-top:6px">${esc(m.title)}</b><b class="ltr" style="font-family:'Space Grotesk';font-size:30px;display:block;margin-top:5px">${m.score_a} - ${m.score_b}</b>
      <span class="muted" style="display:block;margin-top:6px">المنظم: ${esc(m.organizer_name)}${m.referee_name?" — الحكم "+esc(m.referee_name)+" (قراره ينعكس فورًا)":""}</span></div>
    <div class="stage"><b style="font-size:12.5px;color:#f5c518;display:block;margin-bottom:9px">الأحداث — دخلت السجلات لحظة تسجيلها</b>
      ${evs.map(e=>`<div style="display:flex;gap:11px;align-items:center;padding:8px 0;border-top:1px solid #333a55;font-size:12px;font-weight:700"><b class="ltr" style="font-family:'Space Grotesk';color:#9aa0b8;width:30px;flex:none">${e.minute}'</b><span style="flex:1">${esc(evLabel(e))}</span><span style="font-size:9.5px;color:#9aa0b8">${esc(e.recorded_by)}</span></div>`).join("")||`<span style="font-size:11px;color:#9aa0b8;font-weight:700">لا أحداث بعد.</span>`}</div>
    <button class="btn ghost" onclick="toast('وصل البلاغ التقني — لا يمسّ النتيجة ولا الأحداث')">بلاغ تقني عام — لا يغيّر نتيجة ولا حدثًا</button>
  </main>`;
};
