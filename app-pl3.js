/* PlayIn365 — عمود اللاعب مطابقًا للتصميم المعتمد «Player App» (3a · 3c · 3h)
   يُحمّل آخرًا فيتقدّم على كل تعريف سابق للاعب. كل رقم من القاعدة أو نسخته التجريبية. */
const PL3 = {};

PL3.TITLE = {
  feed:    ["لوحتي", "يومك ومهامك — خدمتك أنت"],
  records: ["سجلي وتقييمي", "الرقم لا يظهر وحده — تركيبته معه"],
  explore: ["وش حولك؟", "القريب منك — مباريات وملاعب وفعاليات"],
  opps:    ["مهامي", "ما ينتظر قرارك — ولا شيء يمرّ بلا علمك"],
  calendar:["جدولي", "يتجمّع تلقائيًا من جهتك ومبارياتك"],
  messages:["رسائلي", "قنوات موثقة الهوية"],
  health:  ["صحتي 🔒", "حالتك كما سجّلها المختص الطبي"],
  myCard:  ["بطاقتي", "ملفك العام — كما يراه كل زائر"],
  cabinet: ["خزانتي", "طريق الشارات — وما اكتسبتَه بتوقيع غيرك"],
  privacy: ["خصوصيتي", "دوائر الرؤية — من يرى ماذا"],
  viewLog: ["سجل الاطلاع", "من فتح ملفك ومتى وبأي إذن"],
  settings:["الإعدادات", "حسابك وتنبيهاتك"]
};
PL3.DROP = "50% 50% 50% 6px";
PL3.ic = (g,bg,ink,r) => `<span style="width:32px;height:32px;border-radius:${r||PL3.DROP};background:${bg||"#efedff"};color:${ink||"#4636e3"};display:grid;place-items:center;font-size:13px;font-weight:900;flex:none">${g}</span>`;
PL3.card = (inner,pad) => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:${pad||"16px"}">${inner}</div>`;
PL3.h = t => `<b style="display:block;font-size:13px;font-weight:900">${t}</b>`;
PL3.sub = t => `<span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px;line-height:1.8">${t}</span>`;
PL3.dash = "—";
PL3.esn = s => esc(s).replace(/(\d[\d:\-–\/.٫٬]*\d|\d)/g,'<span class="ltr">$1</span>');
PL3.grp = () => { const a=ME&&ME.age; if(!a) return null; return a<=13?"U13":a<=14?"U14":a<=15?"U15":a<=16?"U16":a<=17?"U17":a<=19?"U19":a<=23?"U23":"SEN"; };

/* ── الصور الشخصية: صورة المستخدم أو رمزية جاهزة — والحرف احتياطًا. الصورة تُحيي ولا تُصدّق رقمًا ── */
PL3.AVDIR = "avatars/";
PL3.AVSET = [["player-violet","لاعب"],["player-navy","لاعب"],["goalkeeper","حارس"],["coach","مدرب"],["gk-coach","مدرب حراس"],["referee","حكم"],["organizer","منظم"],["scout","كشاف"],["fan-male","مشجع"],["guardian-male","ولي أمر"],["av1","رمز"],["av2","رمز"],["av4","رمز"],["av5","رمز"]];
/* العالم التجريبي فقط: كل اسم مزروع له وجه — الحساب الحقيقي يختار صورته بنفسه */
PL3.AVDEF = {"سعود القحطاني":"player-violet","سلطان الحربي":"ch-p6","محمد العتيبي":"ch-p7","عبدالعزيز الغامدي":"ch-p9","فيصل الزهراني":"ch-p1","بندر القرني":"player-navy","عبدالله المطيري":"coach","ماجد السبيعي":"referee","تركي الرشيد":"organizer","ناصر الدوسري":"scout",
  "ريان الشمري":"av1","خالد المالكي":"av2","يزيد العنزي":"av4","عمر الشهري":"av5","تركي الدوسري":"player-violet","راكان البقمي":"ch-p6","نايف الحارثي":"player-navy","زياد القرني":"goalkeeper","مشعل الأحمدي":"ch-p7","سالم الزهراني":"ch-p9","أنس الغامدي":"av1","وليد المطيري":"ch-p1","حسام الرشيدي":"av2","ماجد السهلي":"av4"};
PL3.avKey = n => "pi_av_"+String(n||"").trim();
PL3.avUrl = (name,url) => {
  if(url) return url;
  try{ const v=localStorage.getItem(PL3.avKey(name)); if(v==="none") return null; if(v) return v; }catch(e){}
  if(ME && name===ME.name && ME.avatar_url) return ME.avatar_url;
  const d = PL3.AVDEF[String(name||"").trim()];
  return d ? PL3.AVDIR+d+".png" : null;
};
/* القطرة: اللاعب أسفل-يسار · المدرب أسفل-يمين (قرار المالك) */
PL3.dropFor = (role,n) => role==="coach" ? `50% 50% ${n}px 50%` : `50% 50% 50% ${n}px`;
/* av(الاسم, الحجم, {role,url,r,ring,dark,bg,ink,style}) */
PL3.av = (name,size,o) => {
  o=o||{}; size=size||32;
  const r = o.r || PL3.dropFor(o.role, Math.max(4,Math.round(size*0.16)));
  const u = PL3.avUrl(name,o.url);
  const bd = o.ring?`border:${o.ring};`:"";
  if(u) return `<img src="${esc(u)}" alt="" style="width:${size}px;height:${size}px;border-radius:${r};object-fit:cover;object-position:top;background:#efedff;display:block;flex:none;${bd}${o.style||""}">`;
  const bg = o.dark?"linear-gradient(160deg,#4636e3,#2a2260)":(o.bg||"#efedff"), ink=o.dark?"#fff":(o.ink||"#4636e3");
  return `<span style="width:${size}px;height:${size}px;border-radius:${r};background:${bg};color:${ink};display:grid;place-items:center;font:900 ${Math.round(size*0.42)}px Cairo;flex:none;${bd}${o.style||""}">${esc((String(name||"؟").trim()[0])||"؟")}</span>`;
};
/* صورة مربعة مصغَّرة قبل الحفظ — لا نخزّن ملفًا خامًا */
PL3.shrinkSq = file => new Promise(res=>{
  if(!/^image\//.test(file.type)) return res(null);
  const fr=new FileReader();
  fr.onload=()=>{ const img=new Image();
    img.onload=()=>{ const S=320, m=Math.min(img.width,img.height), c=document.createElement("canvas"); c.width=c.height=S;
      c.getContext("2d").drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,S,S); res(c.toDataURL("image/jpeg",0.8)); };
    img.onerror=()=>res(null); img.src=fr.result; };
  fr.onerror=()=>res(null); fr.readAsDataURL(file);
});
window.avatarSheet = () => {
  const cur = PL3.avUrl(ME.name);
  const sh=document.createElement("div"); sh.id="pi_sheet";
  sh.style.cssText="position:fixed;inset:0;z-index:200;background:rgba(21,26,46,.45);display:flex;align-items:flex-end;justify-content:center";
  sh.onclick=e=>{ if(e.target===sh) sh.remove(); };
  sh.innerHTML=`<div style="background:#faf8f3;width:100%;max-width:520px;border-radius:28px 28px 0 0;padding:18px 18px 22px;max-height:82vh;overflow:auto">
    <div style="width:38px;height:4px;border-radius:99px;background:#d5d0c4;margin:0 auto 14px"></div>
    <div style="display:flex;align-items:center;gap:14px">${PL3.av(ME.name,64,{dark:true,r:"50% 50% 50% 12px"})}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:15px;font-weight:900">صورتك</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">تظهر في لوحتك وملفك العام وأمام اسمك — ولا تغيّر رقمًا واحدًا في سجلك.</span></div></div>
    <button onclick="pickAvatarFile()" style="width:100%;margin-top:14px;background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">ارفع صورة من جهازك</button>
    <span style="display:block;font-size:11px;font-weight:900;color:#5b6078;margin:14px 0 8px">أو اختر رمزية جاهزة</span>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
      ${PL3.AVSET.map(([k,lb])=>{const u=PL3.AVDIR+k+".png", on=cur===u;
        return `<button onclick="setAvatar('${u}')" style="background:${on?"#efedff":"#fff"};border:1.5px solid ${on?"#4636e3":"#e9e4d8"};border-radius:16px;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-family:Cairo">
          <img src="${u}" alt="" style="width:52px;height:52px;border-radius:50% 50% 50% 10px;object-fit:cover;object-position:top;background:#efedff">
          <span style="font-size:9.5px;font-weight:900;color:${on?"#4636e3":"#5b6078"}">${lb}</span></button>`;}).join("")}
    </div>
    <div style="display:grid;grid-template-columns:${cur?"1fr 1fr":"1fr"};gap:8px;margin-top:14px">
      ${cur?`<button onclick="setAvatar('none')" style="background:#fff;border:1px solid #e9e4d8;color:#a83b25;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">أزل الصورة</button>`:""}
      <button onclick="closeSheet()" style="background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">إغلاق</button></div>
  </div>`;
  document.body.appendChild(sh);
};
window.pickAvatarFile = () => {
  const inp=document.createElement("input"); inp.type="file"; inp.accept="image/*";
  inp.onchange=async()=>{ const f=inp.files&&inp.files[0]; if(!f) return; const d=await PL3.shrinkSq(f); if(!d) return toast("تعذّر قراءة الصورة",1); setAvatar(d); };
  inp.click();
};
window.setAvatar = async u => {
  try{ localStorage.setItem(PL3.avKey(ME.name),u); }catch(e){ return toast("الصورة كبيرة — جرّب أصغر",1); }
  ME.avatar_url = u==="none"?null:u;
  const {error:ae}=await sb.from("profiles").update({avatar_url:ME.avatar_url}).eq("id",ME.id); PL3._avLocal = !!(ae&&/avatar_url/.test(ae.message));
  await sb.from("transparency").insert({actor:ME.name+" — "+(roleAr[ME.role]||ME.role),action:u==="none"?"أزال صورة ملفه":"حدّث صورة ملفه"});
  const s=document.getElementById("pi_sheet"); if(s) s.remove();
  toast(u==="none"?"أُزيلت الصورة — يبقى الحرف":PL3._avLocal?"حُفظت على هذا الجهاز — تصل للقاعدة بعد تفعيل الهجرة":"حُفظت صورتك"); render();
};

/* ── الشريط السفلي: كبسولة بيضاء عائمة وقطرة مرتفعة ── */
PL3.navItems = [["▣","بطاقتي","publicView"],["▤","سجلي","records"],["FAB","لوحتي","feed"],["◎","حولك","explore"],["☰","مهامي","opps"]];
PL3.nav = () => `<nav style="position:fixed;bottom:12px;inset-inline:12px;max-width:496px;margin:0 auto;background:#fff;border:1px solid #e9e4d8;border-radius:999px;display:flex;justify-content:space-around;align-items:center;padding:8px 10px;box-shadow:0 10px 26px rgba(21,26,46,.07);z-index:60">
${PL3.navItems.map(([g,lb,v])=>{
  const on = VIEW===v;
  if(g==="FAB") return `<button onclick="go('${v}')" style="width:58px;height:58px;border-radius:50% 50% 50% 14px;background:${on?"#4636e3":"#151a2e"};color:${on?"#fff":"#faf8f3"};margin-top:-34px;box-shadow:0 10px 22px ${on?"rgba(70,54,227,.35)":"rgba(21,26,46,.25)"};display:flex;flex-direction:column;align-items:center;justify-content:center;border:4px solid #faf8f3;cursor:pointer;font-family:Cairo;flex:none"><span style="font-size:17px;line-height:1">⌂</span><span style="font-size:8px;font-weight:900;line-height:1;margin-top:2px">${lb}</span></button>`;
  return `<button onclick="go('${v}')" style="background:none;border:0;cursor:pointer;font-family:Cairo;font-size:9.5px;font-weight:${on?900:800};color:${on?"#4636e3":"#8a8fa5"};display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-size:16px">${g}</span>${lb}</button>`;
}).join("")}</nav>`;

/* ── الرأس: جرس · وردمارك · صورة بقطرة — ثم عنوان مركزي ── */
PL3.header = () => {
  const [t,s] = PL3.TITLE[VIEW] || [TITLES[VIEW]||"", ""];
  const av = (ME.name||"؟").trim()[0]||"؟";
  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('opps')" style="width:40px;height:40px;border-radius:${PL3.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;position:relative;cursor:pointer;font-family:Cairo">◔${PL3.badge?`<span style="position:absolute;top:8px;inset-inline-end:9px;width:7px;height:7px;border-radius:50%;background:#e8531f"></span>`:""}</button>
    ${WM()}
    <button onclick="go('publicView')" style="position:relative;width:44px;height:44px;border-radius:50% 50% 50% 10px;background:none;padding:0;border:0;cursor:pointer;flex:none">${PL3.av(ME.name,44,{dark:true,r:"50% 50% 50% 10px"})}${PL3.grp()?`<span style="position:absolute;bottom:-4px;inset-inline-start:-5px;background:#f5c518;color:#151a2e;border-radius:999px;border:2px solid #faf8f3;font:900 7.5px 'Space Grotesk';padding:1px 4px;direction:ltr">${PL3.grp()}</span>`:""}</button>
  </div>
  <div style="text-align:center;padding:10px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">${t}</b>
    ${VIEW==="feed"?`<span style="display:block;font-size:12.5px;font-weight:800;color:#4636e3;margin-top:2px">هلا ${esc((ME.name||"").split(" ")[0])} 👋</span>`:""}
    <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${s}</span>
  </div>`;
};

/* ════════ 3a · لوحتي — خدمة اللاعب: يومه ومهامه ومداخله. السجل الكامل في «سجلي»، والعرض للزائر في «ملفي العام» ════════ */
T.feed = async () => {
  const [mt,joins,evs,cal,hs,att,views,subs] = await Promise.all([
    q("m",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(20)),
    q("jn",sb.from("match_joins").select("*,matches(title,status,match_time,venue)").eq("player_id",ME.id)),
    q("ev",sb.from("match_events").select("*,matches(title)").eq("who",ME.name).order("created_at",{ascending:false})),
    q("c",sb.from("calendar_items").select("*").eq("player_name",ME.name).order("on_date",{ascending:true})),
    q("h",sb.from("health_status").select("*").eq("player_name",ME.name).limit(1)),
    q("a",sb.from("attendance").select("*").eq("player_name",ME.name).order("created_at",{ascending:false}).limit(200)),
    q("v",sb.from("pi_views").select("*").eq("subject",ME.name).order("created_at",{ascending:false}).limit(8)),
    q("s",sb.from("subscriptions").select("id,paid").eq("player_name",ME.name).eq("paid",false))
  ]);
  const live = mt.find(m=>m.status==="live");
  const next = mt.find(m=>m.status==="today") || mt.find(m=>m.status==="open");
  const today = cal.find(c=>String(c.on_date||"").slice(0,10)===new Date().toISOString().slice(0,10)) || cal[0];
  const myJoin = next ? joins.find(j=>j.match_id===next.id) : null;
  const h = hs[0];
  const wkKey = d => { const x=new Date(d); return x.getFullYear()+"-"+Math.floor((x-new Date(x.getFullYear(),0,1))/6048e5); };
  const activeWk = new Set([...att,...evs,...joins].map(x=>wkKey(x.created_at)));
  const wk12 = [...Array(12)].map((_,i)=>wkKey(Date.now()-(11-i)*6048e5));
  const hits = wk12.filter(k=>activeWk.has(k)).length, pct = Math.round(hits/12*100);
  const HS = {available:["متاح","#2c6e49"],rehab:["تأهيل","#8a6912"],limited:["بقيود","#8a6912"],out:["غير متاح","#a83b25"]};
  const hst = h?(HS[h.state]||HS.available):null;
  const status = [["النوم", h&&h.note?"مسجَّل":PL3.dash, "#4636e3"],["الحمل", att.length?String(att.length)+" حصة":PL3.dash, "#151a2e"],["الجاهزية", hst?hst[0]:PL3.dash, hst?hst[1]:"#8a8fa5"]];
  const nm = next?[["الوقت",esc(next.match_time||PL3.dash)],["الملعب",esc(next.venue||PL3.dash)],["المنظم",esc(next.organizer_name||PL3.dash)]]:[];
  const teams = String((next&&next.title)||"").split("×").map(s=>s.replace(/—.*$/,"").trim()).filter(Boolean);
  /* ما ينتظر قرارك — العدّ هنا والتفصيل في «مهامي» */
  const pending = joins.filter(j=>!j.attended&&j.matches&&j.matches.status!=="final").length + subs.length;
  const SC = [
    ["▤","سجلي","وتقييمي كاملًا","records","#efedff","#4636e3"],
    ["✦","خزانتي","شاراتي وطريقها","cabinet","#fff6d6","#c78c00"],
    ["▦","جدولي","ومحفظتي","wallet","#eaf5ee","#2c6e49"],
    ["◎","الملعب","مجتمعي","pitch","#efedff","#4636e3"],
    ["✉","رسائلي","بإذن","messages","#efedff","#4636e3"],
    ["🔒","خصوصيتي","من يرى ماذا","privacy","#eef7f4","#2c8471"]
  ];
  const EV = {goal:["⚽","#fff6d6","#c78c00"],assist:["◎","#efedff","#4636e3"],yellow:["▮","#151a2e","#f5c518"],red:["▮","#fdeee8","#a83b25"],sub:["⇄","#efedff","#4636e3"]};
  const log = evs.slice(0,3).map(e=>{const [g,bg,ink]=EV[e.type]||EV.sub;
    return `<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${PL3.ic(g,bg,ink)}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;line-height:1.5">${esc(evLabel(e))}</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — سجّله ${esc(e.recorded_by)}</span></div>
      <b class="ltr" style="font-size:12.5px;font-weight:700;flex:none;color:#4636e3">${e.minute}'</b></div>`;}).join("");
  /* موجز السجل — الرقم ورابطه؛ التركيبة والرسوم في «سجلي» */
  const per = P3.byMatch(evs), series = per.map(g=>P3.score(g));
  const rating = series.length?(series.reduce((a,b)=>a+b,0)/series.length).toFixed(1):null;
  const verified = new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  const goals = evs.filter(e=>e.type==="goal").length, assists = evs.filter(e=>e.type==="assist").length;
  const spark = (()=>{ if(series.length<2) return "";
    const mn=Math.min(...series),mx=Math.max(...series);
    const X=i=>128-i*(120/(series.length-1)), Y=v=>34-((v-mn)/((mx-mn)||1))*26;
    const pts=series.map((v,i)=>[X(i),Y(v)]);
    return `<svg viewBox="0 0 136 40" style="width:136px;height:40px;display:block;flex:none"><polyline points="${pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" fill="none" stroke="#4636e3" stroke-width="2.5" stroke-linejoin="round"></polyline><circle cx="${pts[0][0].toFixed(1)}" cy="${pts[0][1].toFixed(1)}" r="3.5" fill="#e8531f"></circle></svg>`;})();
  const SCOPE = {record:"السجل الرياضي",readiness:"حالة الجاهزية",medical:"الملف الطبي",profile:"الملف العام"};
  const grp = PL3.grp();

  return `<div style="position:relative;background:#151a2e;padding:18px 18px 24px;border-radius:0 0 36px 36px;overflow:hidden">
    <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
      <button onclick="go('opps')" style="position:relative;width:40px;height:40px;border-radius:${PL3.DROP};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">◔${pending?`<span style="position:absolute;top:7px;inset-inline-end:8px;width:8px;height:8px;border-radius:50%;background:#e8531f;border:2px solid #151a2e"></span>`:""}</button>
      ${WM(1)}
      <button onclick="go('settings')" style="width:40px;height:40px;border-radius:${PL3.DROP};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">⚙</button>
    </div>
    <div style="position:relative;display:flex;align-items:center;gap:16px;margin-top:18px">
      <button onclick="avatarSheet()" title="غيّر صورتك" style="position:relative;flex:none;background:none;border:0;padding:0;cursor:pointer">
        ${PL3.av(ME.name,88,{dark:true,r:"50% 50% 50% 12px",ring:"4px solid #4636e3"})}
        <span style="position:absolute;bottom:-2px;inset-inline-start:-6px;width:28px;height:28px;border-radius:${PL3.DROP};background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:12px;border:2px solid #151a2e">✎</span></button>
      <div style="flex:1;min-width:0">
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:800">أهلًا بك</span>
        <b style="display:block;font-size:26px;font-weight:900;color:#faf8f3;line-height:1.2">${esc((ME.name||"").split(" ")[0])} 👋</b>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${esc(ME.pos||"لاعب")}${grp?` · <span class="ltr">${grp}</span>`:""}${ME.org?" · "+esc(ME.org):""}</span>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <span style="background:rgba(245,197,24,.15);color:#f5c518;border-radius:999px;padding:3px 11px;font-size:10.5px;font-weight:800"><span class="ltr">${verified||"—"}</span> مباراة موثقة</span>
          <button onclick="go('publicView')" style="background:#fff;color:#151a2e;border:0;border-radius:999px;padding:3px 11px;font:900 10.5px Cairo;cursor:pointer">بطاقتي — كما يراها الزائر ←</button>
        </div></div></div>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
  <div style="position:relative;border-radius:22px;overflow:hidden;background:#151a2e;min-height:236px;display:flex">
    <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:${live?"#e8531f":"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:.5"></div>
    <div style="position:relative;padding:18px;display:flex;flex-direction:column;gap:8px;width:64%">
      ${live?`<span style="display:inline-flex;align-items:center;gap:6px;background:#e8531f;color:#fff;border-radius:999px;padding:4px 11px;font-size:10.5px;font-weight:900;width:fit-content"><span style="width:6px;height:6px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite;animation:pls 1.4s infinite"></span>مباشر الآن</span>`:`<span style="color:#b9b0f5;font-size:10.5px;font-weight:900">${today?"⚽ تدريب اليوم":"⚽ يومك"}</span>`}
      <b style="display:block;font-size:20px;font-weight:900;color:#faf8f3;line-height:1.3">${esc(live?live.title:today?today.title:"لا موعد مثبَّت اليوم")}</b>
      <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;line-height:1.9">
        ${live?`◔ <span class="ltr">${esc(live.match_time||"")}</span><br>◎ ${esc(live.venue||"")}<br><span style="color:#8f9bff">المنظم المسؤول ${esc(live.organizer_name||"")}</span>`
          : today?`◔ <span class="ltr">${esc(today.at_time||"")}</span><br>◎ ${esc(today.place||today.org||"")}<br><span style="color:#8f9bff">${today.recorded_by?"أسندها "+esc(today.recorded_by):"من جهتك"}</span>`
          : `تقويمك فارغ اليوم — استكشف القريب منك`}</span>
      <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
        ${myJoin&&!myJoin.attended?`<button onclick="confAtt('${myJoin.id}')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">أكّد حضورك</button>`
          : live?`<button onclick="go('matchView','${live.id}')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">تابع المباشر</button>`
          : `<button onclick="go('explore')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">استكشف القريب</button>`}
        <button onclick="go('coachBrief')" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);color:#faf8f3;border-radius:14px;padding:10px 12px;font:900 11.5px Cairo;cursor:pointer">تعليمات المدرب</button>
      </div>
    </div>
    <div style="position:absolute;inset-inline-end:16px;bottom:16px;width:92px;height:92px;border-radius:50%;display:grid;place-items:center;background:#151a2e;box-shadow:0 0 0 6px #4636e3,inset 0 2px 10px rgba(21,26,46,.08)">
      <div style="text-align:center"><b class="ltr" style="display:block;font-size:22px;font-weight:700;color:#faf8f3">${hits?pct+"%":PL3.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">انتظامك</span></div></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;overflow:hidden;display:flex;flex-direction:column">
      <div style="background:#151a2e;color:#faf8f3;padding:9px 14px;font-size:12px;font-weight:900;text-align:center">حالتك اليوم</div>
      <div style="padding:10px 14px 12px;flex:1">
        ${status.map(([k,v,ink])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f0ece2"><span style="font-size:11px;font-weight:800">${k}</span><b class="ltr" style="font-size:12.5px;color:${ink}">${v}</b></div>`).join("")}
        <span style="display:block;margin-top:8px;background:${hst&&hst[1]==="#2c6e49"?"#eaf5ee":"#fff6d6"};color:${hst?hst[1]:"#8a8fa5"};border-radius:12px;padding:7px;font-size:10.5px;font-weight:900;text-align:center">${hst?(hst[1]==="#2c6e49"?"حالتك جيّدة ✓":esc(h.phase||hst[0])):"لا سجل طبي بعد"}</span>
        <span style="display:block;font-size:9px;color:#8a8fa5;font-weight:700;margin-top:6px;line-height:1.6">${h?"سجّلها "+esc(h.updated_by):"يكتبها المختص الطبي — لا أنت"}</span>
      </div></div>
    <div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;overflow:hidden;display:flex;flex-direction:column">
      <div style="background:#4636e3;color:#fff;padding:9px 14px;font-size:12px;font-weight:900;text-align:center">المباراة القادمة</div>
      <div style="padding:12px 14px;flex:1">
        ${next?`<div style="display:flex;justify-content:space-around;align-items:center">
          <div style="text-align:center"><span style="width:42px;height:42px;border-radius:50% 50% 50% 8px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:15px;font-weight:900;margin:0 auto">${esc((teams[0]||"؟")[0])}</span><span style="display:block;font-size:10px;font-weight:900;margin-top:5px">${esc(teams[0]||"")}</span></div>
          <b class="ltr" style="font-size:11px;color:#8a8fa5">VS</b>
          <div style="text-align:center"><span style="width:42px;height:42px;border-radius:50% 50% 50% 8px;background:#151a2e;color:#f5c518;display:grid;place-items:center;font-size:15px;font-weight:900;margin:0 auto">${esc((teams[1]||"؟")[0])}</span><span style="display:block;font-size:10px;font-weight:900;margin-top:5px">${esc(teams[1]||"")}</span></div></div>
        <div style="margin-top:10px">${nm.map(([i,t])=>`<span style="display:flex;justify-content:space-between;font-size:10.5px;font-weight:800;padding:6px 0;border-top:1px solid #f0ece2"><span style="color:#8a8fa5">${i}</span><span>${t}</span></span>`).join("")}</div>`
        :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">لا مباراة قادمة مثبَّتة<br>المنظمون ينشئونها من زر <b>+</b></div>`}
      </div></div>
  </div>

  <button onclick="go('opps')" style="background:${pending?"#151a2e":"#fff"};border:1px solid ${pending?"#151a2e":"#e9e4d8"};border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;width:100%;color:${pending?"#faf8f3":"#151a2e"}">
    <span style="width:40px;height:40px;border-radius:50% 50% 50% 8px;background:${pending?"#e8531f":"#efedff"};color:${pending?"#fff":"#4636e3"};display:grid;place-items:center;font:700 16px 'Space Grotesk';flex:none;direction:ltr">${pending||"✓"}</span>
    <div style="flex:1;min-width:0"><b style="display:block;font-size:13px;font-weight:900">${pending?"ينتظر قرارك":"لا شيء ينتظر قرارك"}</b>
      <span style="display:block;font-size:10.5px;color:${pending?"#c6cade":"#8a8fa5"};font-weight:700;margin-top:2px">${pending?"تأكيد حضور أو التزام — لا شيء يمرّ بلا علمك":"كل ما يحتاج ردّك يظهر هنا أولًا"}</span></div>
    <span style="color:${pending?"#f5c518":"#8a8fa5"}">←</span></button>

  ${!ME.org?`<button onclick="joinByCode()" style="background:#fff;border:1.5px dashed #b9b0f5;border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;width:100%;color:#151a2e">
    <span style="width:40px;height:40px;border-radius:50% 50% 50% 8px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:17px;flex:none">⌗</span>
    <div style="flex:1;min-width:0"><b style="display:block;font-size:13px;font-weight:900">عندك رمز من أكاديميتك؟</b>
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">أدخله فترتبط بكشفها — ولا تربطك هي، أنت من يقبل</span></div>
    <span style="color:#4636e3">←</span></button>`:""}
  <b style="font-size:13px;font-weight:900">مداخلك</b>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
    ${SC.map(([g,t,s,v,bg,ink])=>`<button onclick="go('${v}')" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;color:#151a2e;cursor:pointer;font-family:Cairo">
      <span style="width:40px;height:40px;border-radius:50% 50% 50% 8px;display:grid;place-items:center;font-size:17px;background:${bg};color:${ink}">${g}</span>
      <b style="font-size:12px;font-weight:900">${t}</b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800">${s}</span></button>`).join("")}
  </div>

  ${PL3.card(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">${PL3.h("آخر ما دخل سجلك")}<a onclick="go('records')" style="font-size:11px;font-weight:900;cursor:pointer">السجل ←</a></div>
    ${log||`<div style="border-top:1px solid #f0ece2;padding-top:12px;font-size:11px;color:#8a8fa5;font-weight:700;line-height:1.9">سجلك يبدأ من أول مباراة — كل حدث يدخل هنا لحظة تسجيله باسم من سجّله.</div>`}`)}

  ${typeof soStory==="function"?PL3.card(`<div style="display:flex;justify-content:space-between;align-items:center">${PL3.h("قصة موسمي")}<button class="btn ghost" style="width:auto;padding:7px 14px;border-radius:999px;font-size:10.5px" onclick="soStory()">شارِكها</button></div>
    <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8;margin-top:6px">بطاقة موسمك من أحداثك الموثّقة وحدها — <span class="ltr">${goals||"—"}</span> هدف · <span class="ltr">${assists||"—"}</span> صناعة · <span class="ltr">${series.length||"—"}</span> مباراة. تُشارَك كصورة، ولا رقم فيها بلا مصدر.</span>`):""}

  <button onclick="go('records')" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:14px;cursor:pointer;font-family:Cairo;text-align:start;width:100%;color:#151a2e">
    <div style="flex:none;text-align:center"><b class="ltr" style="display:block;font-size:30px;font-weight:700;line-height:1;color:${rating?"#4636e3":"#b0b5c6"}">${rating??PL3.dash}</b>
      <span style="display:block;font-size:9px;color:#8a8fa5;font-weight:800;margin-top:3px">${series.length?`من <span class="ltr">${series.length}</span> مباريات`:"بانتظار أول مباراة"}</span></div>
    <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">تقييمك وفورمتك</b>
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px"><span class="ltr">${goals||"—"}</span> هدف · <span class="ltr">${assists||"—"}</span> صناعة · <span class="ltr">${att.length||"—"}</span> حصة — التركيبة والترتيب في سجلك</span></div>
    ${spark||`<span style="color:#8a8fa5">←</span>`}</button>

  ${PL3.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${PL3.h("من رأى ملفك")}<a onclick="go('viewLog')" style="font-size:11px;font-weight:900;cursor:pointer">السجل الكامل ←</a></div>
    ${views.length?views.slice(0,3).map(v=>`<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
      ${PL3.av(v.viewer,32,{role:v.viewer_role})}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(v.viewer||"غير معروف")}</b>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700">${esc(roleAr[v.viewer_role]||v.viewer_role||"")} · ${esc(SCOPE[v.scope]||"الملف العام")}</span></div>
      <span style="font-size:10px;color:#8a8fa5;font-weight:800;flex:none">${VW.rel(v.created_at)}</span></div>`).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">لم يفتح ملفك أحد بعد — كل اطّلاع يظهر باسم صاحبه ووقته وإذنه.</div>`}`)}

  <div style="background:#eef7f4;border:1px solid #cfe5dd;border-radius:14px;padding:14px 16px">
    <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:12.5px;font-weight:900;color:#1d4a3e">🔒 ملفك الطبي</b><span style="font-size:9.5px;font-weight:900;color:#2c8471">بإذن منفصل</span></div>
    <span style="display:block;font-size:10.5px;color:#4a6d62;font-weight:700;margin-top:6px;line-height:1.8">لا يراه كشاف ولا وكيل أبدًا — بقاعدة صلبة لا إعداد، وكل اطّلاع مسجَّل باسمه ووقته.</span>
    <button onclick="go('health')" style="background:none;border:0;margin-top:8px;font:900 10.5px Cairo;color:#2c8471;cursor:pointer;padding:0">حالتي والأذونات ←</button></div>

  <div style="background:#151a2e;border-radius:20px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden">
    <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
    <div style="position:relative"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">دورك الحالي</span><b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.2">لاعب</b></div>
    <button onclick="go('role')" style="position:relative;background:#fff;color:#151a2e;border:0;border-radius:999px;padding:9px 14px;font:900 11px Cairo;cursor:pointer">⇄ تغيير الدور</button></div>
  </main>`;
};
T.profile = T.feed;

/* ════════ 3c · سجلي وتقييمي ════════ */
T.records = async () => {
  const [evs,joins,att,evAll,pf] = await Promise.all([
    q("ev",sb.from("match_events").select("*,matches(title,organizer_name)").eq("who",ME.name).order("created_at",{ascending:false})),
    q("jn",sb.from("match_joins").select("*,matches(title,status)").eq("player_id",ME.id)),
    q("a",sb.from("attendance").select("*").eq("player_name",ME.name).limit(300)),
    q("all",sb.from("match_events").select("who,type,match_id").limit(600)),
    q("pf",sb.from("profiles").select("name,pos,age").eq("role","player").limit(80))
  ]);
  const per = P3.byMatch(evs);
  const series = per.map(g=>P3.score(g));
  const verified = new Set([...per.map(g=>g[0].match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  const rating = series.length?(series.reduce((a,b)=>a+b,0)/series.length).toFixed(1):null;
  const goals = evs.filter(e=>e.type==="goal").length, assists = evs.filter(e=>e.type==="assist").length;

  /* التركيبة: مصدر «مسجَّل» فقط قائم — البقية «—» حتى تُوقَّع */
  const mix = [
    ["مسجَّل","50٪", rating, "#8f9bff", "#4636e3", rating?(rating/10*100)+"%":"0%"],
    ["خبراء","30٪", null, "#f5c518", "#f5c518", "0%"],
    ["داعمون","15٪", null, "#c78c00", "#c78c00", "0%"],
    ["جمهور","5٪", null, "#c9c2b2", "#c9c2b2", "0%"]
  ];
  /* الترتيب في الفئة — من الأحداث الموثقة لا من تقدير */
  const scoreOf = n => { const e=evAll.filter(x=>x.who===n); const gs=P3.byMatch(e); return gs.length?gs.reduce((a,g)=>a+P3.score(g),0)/gs.length:null; };
  const peers = pf.filter(p=>p.pos===ME.pos&&p.name).map(p=>({n:p.name,s:scoreOf(p.name)})).filter(x=>x.s!=null).sort((a,b)=>b.s-a.s);
  const rank = peers.findIndex(x=>x.n===ME.name)+1;
  /* الحمل: نسبة ٧ أيام ÷ ٢٨ يومًا من الحصص الموثقة */
  const load = d => att.filter(a=>(Date.now()-new Date(a.created_at))/864e5<=d).reduce((s,a)=>s+((+a.minutes||60)*(+a.intensity||7)),0);
  const acute = load(7), chronic = load(28)/4;
  const ratio = chronic>0?(acute/chronic):null;
  const zone = ratio==null?["بانتظار حصص","#8a8fa5"]:ratio<0.8?["تحت الحمل","#8a6912"]:ratio<=1.3?["آمن · 0.8 – 1.3","#2c6e49"]:ratio<=1.5?["مرتفع","#8a6912"]:["إجهاد","#a83b25"];
  /* الفورمة */
  const form = (()=>{ if(series.length<2) return null;
    const W=340,H=100,mn=Math.min(...series),mx=Math.max(...series);
    const X=i=>328-i*(320/(series.length-1)), Y=v=>88-((v-mn)/((mx-mn)||1))*66;
    const pts=series.map((v,i)=>[X(i),Y(v)]);
    const poly=pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
    const area=`M${pts.map(p=>p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" L")} L${pts[pts.length-1][0].toFixed(1)} 88 L${pts[0][0].toFixed(1)} 88 Z`;
    const best=series.indexOf(mx);
    return `<svg viewBox="0 0 340 100" style="width:100%;height:100px;display:block;margin-top:8px"><line x1="8" y1="88" x2="332" y2="88" stroke="#e9e4d8"></line>
      <path d="${area}" fill="#efedff"></path><polyline points="${poly}" fill="none" stroke="#4636e3" stroke-width="2.5" stroke-linejoin="round"></polyline>
      <circle cx="${pts[0][0].toFixed(1)}" cy="${pts[0][1].toFixed(1)}" r="4.5" fill="#e8531f"></circle>
      <circle cx="${pts[best][0].toFixed(1)}" cy="${pts[best][1].toFixed(1)}" r="3.5" fill="#fff" stroke="#f5c518" stroke-width="2"></circle></svg>`;})();
  /* بصمة المهارات — من الأحداث الموثقة، والمحور بلا حدث يبقى فارغًا */
  const sk = [["تسديد",goals],["صناعة",assists],["انتظام",att.length?Math.min(10,att.length/6):null],["مشاركة",verified],["انضباط",evs.filter(e=>e.type==="yellow"||e.type==="red").length?null:(verified?9:null)],["لياقة",null]];
  const skv = sk.map(([n,v])=>[n, v==null?null:Math.max(1,Math.min(10,Math.round((n==="تسديد"||n==="صناعة"||n==="مشاركة"?5+v*0.6:v)*10)/10))]);
  const poly6 = (()=>{const R=46,cx=60,cy=58;
    const pts=skv.map(([,v],i)=>{const a=-Math.PI/2+i*Math.PI/3,r=v==null?0:R*(v/10);return [cx+r*Math.cos(a),cy+r*Math.sin(a)]});
    const on=pts.filter((p,i)=>skv[i][1]!=null);
    return {ring:[...Array(6)].map((_,i)=>{const a=-Math.PI/2+i*Math.PI/3;return (cx+R*Math.cos(a)).toFixed(1)+","+(cy+R*Math.sin(a)).toFixed(1)}).join(" "),
      fill:on.length>2?on.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" "):null,
      dots:pts.map((p,i)=>skv[i][1]==null?"":`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="#4636e3"></circle>`).join("")};})();
  /* شبكة الالتزام */
  const wkKey = d => { const x=new Date(d); return x.getFullYear()+"-"+Math.floor((x-new Date(x.getFullYear(),0,1))/6048e5); };
  const activeWk = new Set([...att,...evs,...joins].map(x=>wkKey(x.created_at)));
  const wk12 = [...Array(12)].map((_,i)=>activeWk.has(wkKey(Date.now()-(11-i)*6048e5)));
  const commit = Math.round(wk12.filter(Boolean).length/12*100);
  const EV = {goal:["⚽","#fff6d6","#c78c00"],assist:["◎","#efedff","#4636e3"],yellow:["▮","#151a2e","#f5c518"],red:["▮","#fdeee8","#a83b25"],sub:["⇄","#efedff","#4636e3"]};

  return `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
  ${(()=>{
    /* الموسم في سطر: كل حدث موثّق على محور زمني واحد — الموسم من أول أغسطس */
    const y=new Date().getMonth()>=7?new Date().getFullYear():new Date().getFullYear()-1;
    const s0=new Date(y,7,1), s1=new Date(y+1,6,31);
    const span=s1-s0;
    const items=[
      ...evs.filter(e=>new Date(e.created_at)>=s0).map(e=>({at:new Date(e.created_at), t:e.type, lb:evLabel(e)})),
      ...att.filter(a=>new Date(a.created_at)>=s0).map(a=>({at:new Date(a.created_at), t:"att", lb:"حصة موقّعة"}))
    ].sort((a,b)=>a.at-b.at);
    if(!items.length) return "";
    const C={goal:"#c78c00",assist:"#4636e3",yellow:"#8a6912",red:"#a83b25",sub:"#8a8fa5",att:"#cfc8fb"};
    const MN=["أغس","سبت","أكت","نوف","ديس","ينا","فبر","مار","أبر","ماي","يون","يول"];
    const now=Math.min(100,Math.max(0,(Date.now()-s0)/span*100));
    const goalsS=items.filter(i=>i.t==="goal").length, assS=items.filter(i=>i.t==="assist").length, attS=items.filter(i=>i.t==="att").length;
    return PL3.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${PL3.h("موسمك في سطر")}<span style="font-size:9.5px;font-weight:900;color:#8a8fa5" class="ltr">${y}/${y+1}</span></div>
      ${PL3.sub("كل ما وقّعه غيرك باسمك، على محور واحد — من أول أغسطس")}
      <div style="position:relative;height:46px;margin-top:14px">
        <div style="position:absolute;top:22px;inset-inline:0;height:3px;background:#f0ece2;border-radius:99px"></div>
        <div style="position:absolute;top:22px;inset-inline-start:0;width:${now.toFixed(1)}%;height:3px;background:#e0dbcd;border-radius:99px"></div>
        ${items.map(i=>{const p=Math.min(99.4,Math.max(.6,(i.at-s0)/span*100)); const c=C[i.t]||"#8a8fa5"; const big=i.t==="goal"||i.t==="assist";
          return `<span title="${esc(i.lb)}" style="position:absolute;top:${big?16:19}px;inset-inline-start:${p.toFixed(2)}%;width:${big?15:9}px;height:${big?15:9}px;margin-inline-start:-${big?7.5:4.5}px;border-radius:50% 50% 50% ${big?4:2}px;background:${c};border:${big?"2px solid #fff":"0"};box-shadow:${big?"0 2px 6px rgba(21,26,46,.18)":"none"}"></span>`}).join("")}
        <span style="position:absolute;top:14px;inset-inline-start:${now.toFixed(1)}%;width:2px;height:19px;background:#151a2e;margin-inline-start:-1px"></span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:2px">
        ${MN.map((m,i)=>`<span style="font-size:7.5px;font-weight:800;color:${i%2?"transparent":"#b0b5c6"}">${m}</span>`).join("")}
      </div>
      <div style="display:flex;gap:11px;flex-wrap:wrap;margin-top:12px;border-top:1px solid #f0ece2;padding-top:11px">
        ${[["أهداف",goalsS,"#c78c00"],["صناعة",assS,"#4636e3"],["حصص",attS,"#cfc8fb"]].map(([lb,n,c])=>
          `<span style="font-size:9.5px;font-weight:800;color:#565d78"><span style="display:inline-block;width:8px;height:8px;border-radius:50% 50% 50% 2px;background:${c};margin-inline-end:4px"></span>${lb} <b class="ltr" style="color:${c}">${n||"—"}</b></span>`).join("")}
        <span style="font-size:9.5px;font-weight:800;color:#8a8fa5;margin-inline-start:auto">الخطّ الداكن: اليوم</span>
      </div>
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;line-height:1.8;margin-top:9px">الفراغ في السطر ليس نقصًا في السجل — هو أسبوعٌ لم يُلعب فيه، أو لم يوقّعه أحد بعد.</span>`);
  })()}

  <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
    <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
    <div style="position:relative;display:flex;align-items:center;gap:16px">
      <div style="flex:none;text-align:center"><b class="ltr" style="display:block;font-size:44px;font-weight:700;line-height:1">${rating??PL3.dash}</b>
        <span style="display:block;font-size:10px;color:#c6cade;font-weight:800;margin-top:2px">${series.length?`من <span class="ltr">${series.length}</span> مباراة موثقة`:"بانتظار أول مباراة"}</span></div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
        ${mix.map(([k,w,v,ink,bar,pct])=>`<div><div style="display:flex;justify-content:space-between;font-size:10px;font-weight:800;color:#c6cade"><span>${k} · <span class="ltr">${w}</span></span><b class="ltr" style="color:${ink}">${v??PL3.dash}</b></div>
          <div style="height:5px;border-radius:999px;background:rgba(255,255,255,.12);margin-top:3px;overflow:hidden"><span style="display:block;height:100%;border-radius:999px;background:${bar};width:${pct}"></span></div></div>`).join("")}
      </div></div>
    <div style="position:relative;margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column;gap:5px">
      <span style="font-size:9.5px;color:#b9b0f5;font-weight:700;line-height:1.7">المال لا يشتري وزنًا — سقف صلب للداعمين والجمهور</span>
      <span style="font-size:9.5px;color:#b9b0f5;font-weight:700;line-height:1.7">الجمهور لا يُحتسب إلا بعتبة ظهور</span>
      <span style="font-size:9.5px;color:#b9b0f5;font-weight:700;line-height:1.7">و«${PL3.dash}» حيث لا تقييم بعد — لا صفرًا</span>
    </div>
  </div>

  ${(()=>{
    const Z=[["LA",0,0],["CA",1,0],["RA",2,0],["LM",0,1],["CM",1,1],["RM",2,1]];
    const zc={}; let tot=0;
    evs.filter(e=>e.zone&&(e.type==="goal"||e.type==="assist")).forEach(e=>{ zc[e.zone]=(zc[e.zone]||0)+1; tot++; });
    const mx=Math.max(1,...Object.values(zc));
    const withZone=tot, noZone=evs.filter(e=>!e.zone&&(e.type==="goal"||e.type==="assist")).length;
    return PL3.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${PL3.h("خريطة لمساتك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">${withZone?'<span class="ltr">'+withZone+'</span> حدثًا بمنطقة':"—"}</span></div>
    ${PL3.sub("المنطقة يسجّلها الحكم لحظة توقيع الحدث — ولا تُستنتج")}
    ${withZone?`<div style="margin-top:12px;border-radius:14px;overflow:hidden;background:#1d4a3e;padding:10px">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">
        ${Z.map(([k])=>{const n=zc[k]||0; const op=n?(.22+ (n/mx)*.78):0;
          return `<div style="position:relative;aspect-ratio:1.25;border:1px solid rgba(255,255,255,.18);border-radius:8px;background:rgba(245,197,24,${op.toFixed(2)});display:grid;place-items:center">
            <b class="ltr" style="font-family:'Space Grotesk';font-size:15px;font-weight:700;color:${n?(op>.55?"#151a2e":"#faf8f3"):"rgba(255,255,255,.35)"}">${n||"—"}</b></div>`}).join("")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:5px">
        ${["يسار","عمق","يمين"].map(l=>`<span style="text-align:center;font-size:8.5px;font-weight:800;color:rgba(255,255,255,.55)">${l}</span>`).join("")}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.14)">
        <span style="font-size:8.5px;font-weight:800;color:rgba(255,255,255,.6)">الصف الأعلى: الثلث الأخير</span>
        <span style="font-size:8.5px;font-weight:800;color:rgba(255,255,255,.6)">الأسفل: الوسط</span></div>
    </div>
    ${noZone?`<span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;line-height:1.8;margin-top:9px"><span class="ltr">${noZone}</span> حدثًا موثّقًا بلا منطقة — وقّعها الحكم قبل أن تُسجَّل المناطق، وتبقى في سجلك كما هي.</span>`:""}`
    :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;margin-top:11px">
      <b style="display:block;font-size:12.5px">خريطتك تبدأ من أول منطقة يسجّلها حكم</b>
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8;margin-top:5px">${noZone?'<span class="ltr">'+noZone+'</span> حدثًا موثّقًا عندك بلا منطقة — والمنصة لا تخترع موقعًا لم يُسجَّل':"سجلك يبدأ من أول هدف أو صناعة"}</span></div>`}`);
  })()}

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    ${PL3.card(`${PL3.h("ترتيبك في فئتك")}<b class="ltr" style="display:block;font-size:30px;font-weight:700;margin-top:6px;color:#4636e3">${rank?"#"+rank:PL3.dash}</b>
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:800;margin-top:2px">${peers.length?`من <span class="ltr">${peers.length}</span> ${esc(ME.pos||"لاعبًا")} موثقًا`:"لا مقارنة قبل تقييمات موقّعة"}</span>`,"14px")}
    ${PL3.card(`${PL3.h("حملك هذا الأسبوع")}<b class="ltr" style="display:block;font-size:30px;font-weight:700;margin-top:6px">${ratio?Math.round(ratio*10)/10===Math.round(ratio)?String(Math.round(ratio)):ratio.toFixed(1):PL3.dash}</b>
      <span style="display:block;font-size:9.5px;color:${zone[1]};font-weight:900;margin-top:2px">${zone[0]}</span>
      <span style="display:block;font-size:9px;color:#8a8fa5;font-weight:800;margin-top:3px">${att.length?`من <span class="ltr">${att.length}</span> حصة سجّلها مدربك`:"بانتظار حصص موقّعة"}</span>`,"14px")}
  </div>

  ${PL3.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${PL3.h("الفورمة — تقييم مباراةً بمباراة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">آخر <span class="ltr">${series.length}</span> مباريات</span></div>
    ${form||`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;margin-top:8px"><span style="font-size:10.5px;color:#8a8fa5;font-weight:700">ترتسم فورمتك بعد مباراتين موثقتين — عندك <span class="ltr">${series.length}</span></span></div>`}
    ${form?`<span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:4px">البرتقالية: الأحدث · الذهبية: أفضل أداء موثق</span>`:""}`)}

  ${PL3.card(`${PL3.h("بصمة مهاراتك")}
    <div style="display:flex;align-items:center;gap:14px;margin-top:10px">
      <svg viewBox="0 0 120 116" style="width:118px;height:114px;flex:none">
        <polygon points="${poly6.ring}" fill="none" stroke="#e9e4d8" stroke-width="1.5"></polygon>
        ${poly6.fill?`<polygon points="${poly6.fill}" fill="rgba(70,54,227,.16)" stroke="#4636e3" stroke-width="2.5" stroke-linejoin="round"></polygon>`:""}
        ${poly6.dots}</svg>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
        ${skv.map(([n,v])=>`<div style="display:flex;justify-content:space-between;gap:8px"><span style="font-size:10.5px;font-weight:800;color:${v==null?"#b0b5c6":"#151a2e"}">${n}</span><b class="ltr" style="font-size:11.5px;color:${v==null?"#b0b5c6":"#4636e3"}">${v??PL3.dash}</b></div>`).join("")}
      </div></div>
    <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:8px">المحور بلا حدث موثق يبقى «${PL3.dash}» — لا يُقدَّر</span>`)}

  ${PL3.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${PL3.h(`شبكة التزامك · <span class="ltr">12</span> أسبوعًا`)}<b class="ltr" style="font-size:11px;color:#2c6e49">${commit}%</b></div>
    <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-top:10px">${wk12.map(on=>`<span style="height:22px;border-radius:6px;background:${on?"#4636e3":"#efedff"};border:1px solid ${on?"#4636e3":"#e2ddff"}"></span>`).join("")}</div>
    <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:7px">حسبها نظام الحضور من توقيع المدرب — لا من إدخالك</span>`)}

  ${PL3.card(`${PL3.h("كل ما دخل سجلك")}
    ${evs.length?evs.map(e=>{const [g,bg,ink]=EV[e.type]||EV.sub;
      return `<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${PL3.ic(g,bg,ink)}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;line-height:1.5">${esc(evLabel(e))}</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — سجّله ${esc(e.recorded_by)}</span></div>
      <b class="ltr" style="font-size:12.5px;flex:none;color:#4636e3">${e.minute}'</b></div>`;}).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:14px;text-align:center"><span style="font-size:11px;color:#8a8fa5;font-weight:700;line-height:1.9">سجلك يبدأ من أول مباراة</span>
        <button onclick="go('explore')" style="margin-top:10px;background:#4636e3;color:#fff;border:0;border-radius:14px;padding:11px 16px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">استكشف المباريات</button></div>`}`)}
  </main>`;
};

/* ════════ 3d/3e · البطاقة العامة — ما يراه أي داخل على صفحتك ════════
   PARAM = اسم اللاعب. بلا PARAM = بطاقتك أنت في وضع المالك. */
PL3.qr = seed => {
  const N=21, g=[...Array(N)].map(()=>Array(N).fill(0));
  let h=0; for(const c of String(seed||"PI")) h=(h*31+c.charCodeAt(0))>>>0;
  const rnd=()=>{h^=h<<13;h>>>=0;h^=h>>17;h^=h<<5;h>>>=0;return h/4294967296;};
  const fnd=(r,c)=>{for(let i=-1;i<8;i++)for(let j=-1;j<8;j++){const y=r+i,x=c+j;if(y<0||x<0||y>=N||x>=N)continue;
    const on=(i>=0&&i<=6&&j>=0&&j<=6)&&(i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4));g[y][x]=on?1:0;}};
  fnd(0,0);fnd(0,14);fnd(14,0);
  const res=(r,c)=>(r<9&&c<9)||(r<9&&c>=13)||(r>=13&&c<9);
  for(let r=0;r<N;r++)for(let c=0;c<N;c++) if(!res(r,c)&&rnd()>0.52) g[r][c]=1;
  for(let i=8;i<13;i++){g[6][i]=i%2?0:1;g[i][6]=i%2?0:1;}
  let d=""; for(let r=0;r<N;r++)for(let c=0;c<N;c++) if(g[r][c]) d+=`M${c} ${r}h1v1h-1z`;
  return d;
};
PL3.BADGES = [
  ["hattrick","⚽","ثلاثية", e=>{const per={};e.filter(x=>x.type==="goal").forEach(x=>per[x.match_id]=(per[x.match_id]||0)+1);return Object.values(per).some(v=>v>=3)}],
  ["scorer","◉","هدّاف", e=>e.filter(x=>x.type==="goal").length>=5],
  ["maker","◎","صانع", e=>e.filter(x=>x.type==="assist").length>=3],
  ["first","✦","أول هدف", e=>e.some(x=>x.type==="goal")],
  ["clean","♦","انضباط", e=>e.length>=6&&!e.some(x=>x.type==="red")],
  ["regular","▦","منتظم", (e,a)=>a.length>=10],
  ["loyal","♛","وفاء الموسم", (e,a)=>a.length>=25],
  ["duo","⇄","ثنائية", e=>{const m={};e.forEach(x=>{m[x.match_id]=m[x.match_id]||new Set();m[x.match_id].add(x.type)});return Object.values(m).some(s=>s.has("goal")&&s.has("assist"))}]
];

T.publicView = async () => {
  const who = PARAM || ME.name;
  const owner = who === ME.name;
  const [pf,evs,joins,att,tr,med] = await Promise.all([
    q("pf",sb.from("profiles").select("*").eq("name",who).limit(1)),
    q("ev",sb.from("match_events").select("*,matches(title,comp,organizer_name)").eq("who",who).order("created_at",{ascending:false})),
    q("jn",sb.from("match_joins").select("*,matches(title,comp)").eq("player_name",who)),
    q("a",sb.from("attendance").select("*").eq("player_name",who).limit(300)),
    q("t",sb.from("transparency").select("*").ilike("action","%"+who+"%").limit(40)),
    q("md",sb.from("pi_media").select("*").eq("subject",who).order("created_at",{ascending:false}).limit(12))
  ]);
  const P = pf[0] || (owner?ME:{name:who});
  if(!owner) VW.log(who,"profile","فتح الملف العام");
  const per = P3.byMatch(evs);
  const series = per.map(g=>P3.score(g));
  const rating = series.length?(series.reduce((a,b)=>a+b,0)/series.length).toFixed(1):null;
  const verified = new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  const goals = evs.filter(e=>e.type==="goal").length, assists = evs.filter(e=>e.type==="assist").length;
  const grp = (a=>a?(a<=13?"U13":a<=14?"U14":a<=15?"U15":a<=16?"U16":a<=17?"U17":a<=19?"U19":a<=23?"U23":"SEN"):null)(P.age);
  const stats = [["مباراة",verified],["هدف",goals],["صناعة",assists],["تقييم",rating]];
  if(owner) await BG.sync(who, evs, att);
  const all = await BG.of(who, evs, att);
  const earned = all.filter(b=>b.on).map(b=>({k:b.k, ic:b.g, nm:b.nm, sealed:b.sealed, row:b.row}));
  const award = tr.find(t=>/أفضل لاعب|جائزة|لقب/.test(t.action||""));
  const best = series.length?per[series.indexOf(Math.max(...series))]:null;
  const bestT = best&&best[0].matches?best[0].matches.title:null;
  const comps = {};
  evs.forEach(e=>{const c=e.matches&&e.matches.comp; if(c){comps[c]=comps[c]||{n:c,by:e.matches.organizer_name||"",k:0};comps[c].k++;}});
  const trophies = Object.values(comps).slice(0,3);
  const EV = {goal:["⚽","#fff6d6","#c78c00"],assist:["◎","#efedff","#4636e3"],yellow:["▮","#151a2e","#f5c518"],red:["▮","#fdeee8","#a83b25"],sub:["⇄","#efedff","#4636e3"]};
  const pid = "PI-2026-" + String(1000+(String(who).split("").reduce((a,c)=>a+c.charCodeAt(0),0)%8999));
  const media = med;
  const claps = (()=>{try{return JSON.parse(localStorage.getItem("pi_claps_p")||"{}")}catch(e){return {}}})();
  const mine = claps[who]||0;

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="${owner?"go('feed')":"back()"}" style="width:40px;height:40px;border-radius:${PL3.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">→</button>
    <div style="text-align:center;min-width:0"><b style="display:block;font-size:15px;font-weight:900">${owner?"بطاقتي":"بطاقة اللاعب"}</b>
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:800">${owner?"ملفك العام — كما يراه كل زائر، وما لا يراه لا يظهر هنا":"ما وثّقه غيره — لا أكثر"}</span></div>
    <button onclick="shareCard('${esc(who)}')" style="width:40px;height:40px;border-radius:${PL3.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⇪</button>
  </div>
  <main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">

  <div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;color:#faf8f3;box-shadow:0 18px 44px rgba(21,26,46,.18)">
    <div style="position:absolute;inset-inline-start:58%;top:-62%;width:86%;height:210%;background:radial-gradient(circle at 45% 50%,#f5c518,#8a6912);border-radius:50%;opacity:.2"></div>
    <div style="position:relative;padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">${WM(1)}
        ${verified>=5?`<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,197,24,.16);border:1px solid rgba(245,197,24,.45);color:#f5c518;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">★ لاعب موثّق</span>`:`<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#c6cade;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">سجل قيد التكوين</span>`}
      </div>
      <div style="display:flex;align-items:flex-end;gap:14px;margin-top:22px">
        <div style="position:relative;flex:none">
          ${owner?`<button onclick="avatarSheet()" title="غيّر صورتك" style="background:none;border:0;padding:0;cursor:pointer;display:block">`:""}
          ${PL3.av(who,110,{url:P.avatar_url,dark:true,r:"50% 50% 50% 14px",ring:"3px solid #f5c518"})}
          ${owner?`</button>`:""}
          ${verified?`<img src="${PL3.AVDIR}seal-verified.png" alt="موثّق" style="position:absolute;bottom:-6px;inset-inline-end:-8px;width:36px;height:36px;filter:drop-shadow(0 3px 6px rgba(21,26,46,.35))">`:""}
        </div>
        <div style="flex:1;min-width:0;padding-bottom:4px">
          <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">لاعب${grp?` · <span class="ltr">${grp}</span>`:""}</span>
          <b style="display:block;font-size:24px;font-weight:900;line-height:1.2;margin-top:3px">${esc(who)}</b>
          <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${esc(P.pos||"مركز غير مسجَّل")}${P.org?" · "+esc(P.org):""}</span>
        </div></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:18px">
        ${stats.map(([k,v])=>`<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:9px 4px;text-align:center">
          <b class="ltr" style="display:block;font-size:19px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||PL3.dash}</b>
          <span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:1px">${k}</span></div>`).join("")}
      </div>
      <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
        ${award?`<span style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(160deg,#f5c518,#c78c00);color:#151a2e;border-radius:999px;padding:5px 10px;font-size:9.5px;font-weight:900">★ ${PL3.esn(String(award.action).slice(0,34))}</span>`:""}
        ${att.length?`<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;border-radius:999px;padding:5px 10px;font-size:9.5px;font-weight:900">⚽ <span class="ltr">${att.length}</span> حصة موقّعة</span>`:""}
        <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;border-radius:999px;padding:5px 10px;font-size:9.5px;font-weight:900">✓ <span class="ltr">${earned.length}</span> ${earned.length===1?"شارة":"شارات"}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14)">
        <div style="min-width:0">
          <span style="display:block;font-size:9px;color:#c6cade;font-weight:800">${P.org?"الجهة":"بلا جهة بعد"}</span>
          <div style="display:flex;gap:6px;margin-top:6px;align-items:center;flex-wrap:wrap">
            ${P.org?`<span style="display:inline-flex;align-items:center;gap:6px;height:30px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;padding:0 10px 0 4px;font-size:9.5px;font-weight:900"><span style="width:22px;height:22px;border-radius:${PL3.DROP};background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:10px">${esc(P.org.trim()[0])}</span>${esc(P.org)}</span>`:`<span style="height:30px;border-radius:999px;border:1px dashed rgba(255,255,255,.3);color:#c6cade;display:grid;place-items:center;font-size:9px;font-weight:900;padding:0 10px">تُسجَّل حين تضمّك أكاديمية</span>`}
            ${P.shirt?`<span class="ltr" style="height:30px;min-width:30px;border-radius:999px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font:700 12px 'Space Grotesk';padding:0 9px">#${P.shirt}</span>`:""}
          </div>
          <span class="ltr" style="display:block;font-family:'Space Grotesk';font-size:10px;font-weight:700;color:#8f9bff;margin-top:8px">${pid}</span>
        </div>
        <div style="flex:none;width:74px;height:74px;background:#fff;border-radius:12px;padding:5px"><svg viewBox="0 0 21 21" shape-rendering="crispEdges" style="width:100%;height:100%;display:block"><rect width="21" height="21" fill="#fff"></rect><path d="${PL3.qr(pid)}" fill="#151a2e"></path></svg></div>
      </div>
    </div></div>

  <div style="display:grid;grid-template-columns:${owner?"1fr 1fr 1fr":"1fr 1fr 1fr"};gap:8px">
    <button onclick="shareCard('${esc(who)}')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:12px 6px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">${owner?"شارك بطاقتك":"شارك"}</button>
    ${owner?`<button onclick="go('privacy')" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:12px 6px;font:900 11.5px Cairo;cursor:pointer">ما يظهر منه</button>
    <button onclick="window.print()" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:12px 6px;font:900 11.5px Cairo;cursor:pointer">PDF</button>`
    :`<button onclick="clapPlayer('${esc(who)}')" style="background:#efedff;color:#4636e3;border:0;border-radius:14px;padding:12px 6px;font:900 11.5px Cairo;cursor:pointer">👏 قدّر أداءه</button>
    <button onclick="askConsent('${esc(who)}')" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:12px 6px;font:900 11.5px Cairo;cursor:pointer">اطلب إذن اطلاع</button>`}
  </div>

  ${(award||bestT)?`<div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
    <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:#f5c518;border-radius:50%;opacity:.14"></div>
    <div style="position:relative;display:flex;align-items:center;gap:14px">
      <span style="width:64px;height:64px;border-radius:50% 50% 50% 12px;background:linear-gradient(160deg,#f5c518,#c78c00);color:#151a2e;display:grid;place-items:center;font-size:28px;flex:none">★</span>
      <div style="flex:1;min-width:0"><span style="display:block;font-size:10px;color:#f5c518;font-weight:900">أكبر ما ${owner?"تفتخر":"يفتخر"} به</span>
        <b style="display:block;font-size:16px;font-weight:900;margin-top:3px;line-height:1.4">${esc(award?award.action:"أفضل أداء موثق — "+bestT)}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:3px">${award?"سجّلها "+esc(award.actor):`تقييم <span class="ltr">${Math.max(...series).toFixed(1)}</span> — محسوب من أحداث وقّعها الحكم`}</span></div>
    </div></div>`:""}

  ${PL3.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${PL3.h("شارات مكتسبة")}${owner?`<a onclick="go('cabinet')" style="font-size:11px;font-weight:900;cursor:pointer">خزانتي والطريق ←</a>`:`<b class="ltr" style="font-size:12px;color:#c78c00">${earned.length} / ${PL3.BADGES.length}</b>`}</div>
    ${earned.length?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      ${earned.map(b=>`<span title="${(b.row&&b.row.signed_by)?esc("وقّعه "+b.row.signed_by):""}" style="display:inline-flex;align-items:center;gap:7px;background:#fff8df;border:1px solid #f0e2b4;border-radius:999px;padding:5px 12px 5px 6px">
        <span style="width:26px;height:26px;border-radius:50% 50% 50% 6px;display:grid;place-items:center;font-size:12px;background:linear-gradient(160deg,#f5c518,#c78c00);color:#151a2e">${b.ic}</span>
        <b style="font-size:10.5px;font-weight:900;color:#8a6912">${b.nm}</b>${b.sealed?`<span style="font-size:9px;color:#c78c00">✓</span>`:""}</span>`).join("")}</div>
      ${earned.some(b=>b.sealed)?`<span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:8px;line-height:1.8">المختومة ✓ مكتوبة في السجل بتاريخها والحدث الذي أكملها — لا تُمنح ولا تُشترى.</span>`:""}`
    :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:16px;text-align:center;margin-top:10px;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">لا شارة بعد — تُكتسب من حدث يوقّعه غيره، لا تُمنح ولا تُشترى</div>`}`)}

  ${trophies.length?PL3.card(`${PL3.h("خزانة الألقاب")}
    <div style="display:grid;grid-template-columns:repeat(${Math.min(3,trophies.length)},1fr);gap:9px;margin-top:11px">
      ${trophies.map(t=>`<div style="border:1px solid #f0e2b4;background:#fff8df;border-radius:16px;padding:12px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:7px">
        <span style="width:36px;height:36px;border-radius:50% 50% 50% 8px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:16px">♛</span>
        <b style="font-size:10.5px;font-weight:900;color:#8a6912;line-height:1.5">${esc(t.n)}</b>
        <span style="font-size:9px;font-weight:800;color:#8a8fa5">${t.by?"نظّمها "+esc(t.by):`<span class="ltr">${t.k}</span> حدثًا موثقًا`}</span></div>`).join("")}
    </div>`):""}

  ${PL3.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${PL3.h(owner?"لقطاتي":"لقطاته")}${owner?`<button onclick="addMedia()" style="background:#4636e3;color:#fff;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">＋ أضف لقطة</button>`:`<span style="font-size:10px;color:#8a8fa5;font-weight:800">الموسومة بحدث تحمل «موثّقة»</span>`}</div>
    ${media.length?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
      ${media.map(m=>{const loc=String(m.url||"").startsWith("idb:");
        const src=loc?'src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="':`src="${esc(m.url)}"`;
        const at=loc?` data-idb="${esc(String(m.url).slice(4))}"`:"";
        return `<div style="position:relative;border-radius:16px;overflow:hidden;background:#151a2e;aspect-ratio:4/3">
        ${m.kind==="video"
          ? `<video ${loc?"":`src="${esc(m.url)}"`}${at} playsinline controls preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#151a2e"></video>`
          : `<img ${src}${at} alt="${esc(m.label||"")}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`}
        <span style="position:absolute;bottom:8px;inset-inline-start:8px;background:rgba(21,26,46,.88);color:#faf8f3;border-radius:999px;padding:3px 9px;font-size:9px;font-weight:900">${PL3.esn(m.label||"لقطة")}</span>
        ${m.event_id?`<span style="position:absolute;top:8px;inset-inline-end:8px;background:#f5c518;color:#151a2e;border-radius:999px;padding:2px 7px;font-size:8.5px;font-weight:900">موثّقة ✓</span>`
          :owner?`<button onclick="tagLater('${m.id}')" style="position:absolute;top:8px;inset-inline-end:8px;background:rgba(255,255,255,.92);color:#4636e3;border:0;border-radius:999px;padding:3px 8px;font:900 8.5px Cairo;cursor:pointer">اربطها بحدث</button>`:""}
        ${owner?`<button onclick="delMedia('${m.id}')" style="position:absolute;top:8px;inset-inline-start:8px;width:24px;height:24px;border-radius:50%;background:rgba(21,26,46,.8);color:#fff;border:0;font:900 12px Cairo;cursor:pointer;display:grid;place-items:center">×</button>`:""}</div>`;}).join("")}
    </div>
    <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:9px">رفعها ${esc((media[0]&&media[0].uploaded_by)||"صاحب الملف")} — والمربوطة بحدث وقّعه غيره تحمل شارة «موثّقة»</span>`
    :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;margin-top:10px">
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">${owner?"لا لقطة بعد — ارفع ما تشاء، واربطه بحدث موثق إن أردت شارة «موثّقة».":"لا لقطات منشورة بعد."}</span>
      ${owner?`<button onclick="addMedia()" style="margin-top:11px;background:#4636e3;color:#fff;border:0;border-radius:12px;padding:10px 16px;font:900 11px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">＋ أضف أول لقطة</button>`:""}</div>`}`)}

  ${PL3.card(`${PL3.h(owner?"آخر ما دخل سجلك — كما يراه الزائر":"آخر ما دخل سجله")}${PL3.sub("كل سطر باسم من سجّله — لا رقم بلا مصدر")}
    ${evs.length?evs.slice(0,5).map(e=>{const [g,bg,ink]=EV[e.type]||EV.sub;
      return `<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${PL3.ic(g,bg,ink)}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;line-height:1.5">${esc(evLabel(e))}</b>
          <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — سجّله ${esc(e.recorded_by)}</span></div>
        <b class="ltr" style="font-size:12.5px;flex:none;color:#4636e3">${e.minute}'</b></div>`;}).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">لا أحداث موثقة بعد — السجل يبدأ من أول مباراة يوقّعها حكمها.</div>`}`)}

  ${PL3.card(`${PL3.h("تقييمان لا يُخلطان")}${PL3.sub("ما وقّعته جهة مسؤولة في عمود، وما صفّق له الجمهور في عمود آخر — ولا يُجمعان في رقم واحد")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:13px">

      <div style="padding-inline-end:13px">
        <div style="display:flex;align-items:center;gap:7px">
          <span style="width:8px;height:8px;border-radius:50%;background:#4636e3;flex:none"></span>
          <b style="font-size:11px;font-weight:900;color:#4636e3">من المسؤولين</b></div>
        <span style="display:block;font-size:8.5px;color:#8a8fa5;font-weight:800;margin-top:3px;line-height:1.5">حكّام ومدربون — يدخل التقييم</span>
        <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:28px;font-weight:700;color:#151a2e;margin-top:9px;line-height:1">${(goals+assists)||PL3.dash}</b>
        <span style="display:block;font-size:9px;color:#8a8fa5;font-weight:800">حدثًا موقّعًا</span>
        <div style="display:flex;flex-direction:column;gap:5px;margin-top:10px">
          ${goals?`<div style="display:flex;justify-content:space-between;font-size:9.5px;font-weight:800"><span style="color:#565d78">أهداف</span><b class="ltr" style="color:#4636e3">${goals}</b></div>`:""}
          ${assists?`<div style="display:flex;justify-content:space-between;font-size:9.5px;font-weight:800"><span style="color:#565d78">صناعة</span><b class="ltr" style="color:#4636e3">${assists}</b></div>`:""}
          ${!goals&&!assists?`<span style="font-size:9.5px;color:#8a8fa5;font-weight:700;line-height:1.7">يبدأ من أول حدث يوقّعه حكم</span>`:""}
        </div>
      </div>

      <div style="padding-inline-start:13px;border-inline-start:1px solid #e9e4d8">
        <div style="display:flex;align-items:center;gap:7px">
          <span style="width:8px;height:8px;border-radius:50%;background:#c78c00;flex:none"></span>
          <b style="font-size:11px;font-weight:900;color:#c78c00">من الجمهور</b></div>
        <span style="display:block;font-size:8.5px;color:#8a8fa5;font-weight:800;margin-top:3px;line-height:1.5">تقدير مفتوح — لا يدخل التقييم</span>
        <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:28px;font-weight:700;color:#151a2e;margin-top:9px;line-height:1">${mine||PL3.dash}</b>
        <span style="display:block;font-size:9px;color:#8a8fa5;font-weight:800">تقديرًا 👏</span>
        <div style="margin-top:10px">
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;line-height:1.7">${mine?"من داخل المنصة — بعتبة ظهور، وبلا أثر على رقمك":"لا تقدير بعد — ولن يغيّر تقييمك حين يأتي"}</span>
        </div>
      </div>

    </div>
    <div style="margin-top:13px;border-top:1px solid #f0ece2;padding-top:11px;font-size:10px;color:#8a8fa5;font-weight:700;line-height:1.85">المال لا يشتري وزنًا، والتصفيق لا يُصبح هدفًا. العمودان يبقيان منفصلين في الشاشة وفي القاعدة — وأي جهة تقرأ الأول وحده.</div>`)}

  <div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">هذه النسخة العامة: الاسم والمركز والسجل الموثّق والشارات واللقطات. <b>الملف الطبي والجدول والرسائل والمحفظة لا تظهر هنا أبدًا</b> — وكل فتح يُسجَّل في «من رأى ملفك» باسم صاحبه.</div>
  </main>`;
};
T.myCard = T.publicView;

window.shareCard = async name => {
  const url = location.origin+location.pathname+"#p/"+encodeURIComponent(name);
  try{ if(navigator.share){ await navigator.share({title:"بطاقة "+name+" — PlayIn365",url}); return; } }catch(e){}
  try{ await navigator.clipboard.writeText(url); toast("نُسخ رابط البطاقة"); }catch(e){ toast("الرابط: "+url); }
};
window.askConsent = async name => {
  await sb.from("pi_views").insert({subject:name,viewer:ME.name,viewer_role:ME.role,scope:"profile"});
  await sb.from("transparency").insert({actor:ME.name+" — "+(roleAr[ME.role]||ME.role),action:"طلب إذن اطلاع — "+name});
  toast("أُرسل الطلب — ولي الأمر أو اللاعب يقرر");
};
window.back = () => { VIEW = ME&&ME.role==="player"?"feed":homeFor(); PARAM=null; render(); };

/* ══════ اللقطات: رفع حقيقي — تخزين Supabase حين يكون متاحًا، ونسختك حين لا يكون ══════ */
PL3.BUCKET = "player-media";
PL3.hasStore = async () => {   /* التجريبي والحقيقي سواء — المنفصل هو البيانات لا السلوك */
  if(PL3._store!=null) return PL3._store;
  try{ const {error} = await sb.storage.from(PL3.BUCKET).list("",{limit:1}); PL3._store = !error; }
  catch(e){ PL3._store = false; }
  return PL3._store;
};
/* خزانة محلية للملفات حين لا تكون الحاوية مفعّلة — صورًا وفيديو بلا تفريق */
PL3.idb = () => new Promise((res,rej)=>{
  const r = indexedDB.open("pi_media_files",1);
  r.onupgradeneeded = () => r.result.createObjectStore("f");
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
PL3.putFile = async file => {
  const key = "f-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);
  const db = await PL3.idb();
  await new Promise((res,rej)=>{ const t=db.transaction("f","readwrite"); t.objectStore("f").put(file,key);
    t.oncomplete=res; t.onerror=()=>rej(t.error); });
  return "idb:"+key;
};
PL3.getFile = async key => { const db = await PL3.idb();
  return new Promise(res=>{ const rq=db.transaction("f","readonly").objectStore("f").get(key);
    rq.onsuccess=()=>res(rq.result||null); rq.onerror=()=>res(null); }); };
PL3.dropFile = async key => { const db = await PL3.idb();
  return new Promise(res=>{ const t=db.transaction("f","readwrite"); t.objectStore("f").delete(key); t.oncomplete=res; t.onerror=res; }); };
/* بعد الرسم: كل وسيط محلي يأخذ رابطه الحي */
PL3.hydrateMedia = async () => {
  const els = document.querySelectorAll("[data-idb]");
  for(const el of els){
    const k = el.getAttribute("data-idb"); el.removeAttribute("data-idb");
    const f = await PL3.getFile(k);
    if(f){ const u = URL.createObjectURL(f); (PL3._urls=PL3._urls||[]).push(u); el.src = u; }
  }
};
/* الصورة تُصغَّر قبل الحفظ — لا نخزّن ملفًا خامًا في نسخة المستخدم */
PL3.shrink = file => new Promise(res=>{
  if(!/^image\//.test(file.type)) return res(null);
  const fr = new FileReader();
  fr.onload = () => { const img = new Image();
    img.onload = () => { const M=720, s=Math.min(1,M/Math.max(img.width,img.height));
      const c=document.createElement("canvas"); c.width=Math.round(img.width*s); c.height=Math.round(img.height*s);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      res(c.toDataURL("image/jpeg",0.72)); };
    img.onerror = () => res(null); img.src = fr.result; };
  fr.onerror = () => res(null);
  fr.readAsDataURL(file);
});

window.addMedia = async () => {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*,video/*";
  inp.onchange = async () => { const f = inp.files && inp.files[0]; if(!f) return; PL3._pending = f; await PL3.tagSheet(); };
  inp.click();
};

/* الوسم اختياري — ترفع ما تشاء، وتربطه بحدث إن أردت */
PL3.tagSheet = async () => {
  const {data:evs} = await sb.from("match_events").select("*,matches(title)").eq("who",ME.name)
    .order("created_at",{ascending:false});
  PL3._evs = evs || [];
  const rows = PL3._evs.slice(0,8).map((e,i)=>`<button onclick="pickMediaFor(${i})" style="display:flex;gap:11px;align-items:center;padding:11px 14px;border:0;border-top:1px solid #f0ece2;background:none;width:100%;text-align:start;cursor:pointer;font-family:Cairo">
    ${PL3.ic(e.type==="goal"?"⚽":e.type==="assist"?"◎":"⇄", e.type==="goal"?"#fff6d6":"#efedff", e.type==="goal"?"#c78c00":"#4636e3")}
    <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(evLabel(e))}</b>
      <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — وقّعه ${esc(e.recorded_by)}</span></div>
    <span style="color:#8a8fa5">←</span></button>`).join("");
  const sh = document.createElement("div");
  sh.id = "pi_sheet";
  sh.style.cssText = "position:fixed;inset:0;z-index:200;background:rgba(21,26,46,.45);display:flex;align-items:flex-end;justify-content:center";
  sh.onclick = e => { if(e.target===sh){ PL3._pending=null; sh.remove(); } };
  sh.innerHTML = `<div style="background:#faf8f3;width:100%;max-width:520px;border-radius:28px 28px 0 0;padding:18px 0 22px;max-height:78vh;overflow:auto">
    <div style="width:38px;height:4px;border-radius:99px;background:#d5d0c4;margin:0 auto 14px"></div>
    <div style="padding:0 18px 12px"><b style="display:block;font-size:15px;font-weight:900">تربطها بحدث؟</b>
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">اختياري — اللقطة المربوطة بحدث وقّعه غيرك تحمل شارة «موثّقة»، والبقية تُنشر كما هي.</span></div>
    <div style="padding:0 18px 4px"><button onclick="pickMediaFor(-1)" style="width:100%;background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">ارفعها بلا وسم</button></div>
    ${PL3._evs.length?`<div style="padding:12px 18px 2px"><span style="font-size:11px;font-weight:900;color:#5b6078">أو اربطها بحدث موثق</span></div>${rows}`
      :`<div style="padding:14px 18px 0"><span style="font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">لا حدث موثق في سجلك بعد — تقدر ترفعها بلا وسم الآن وتربطها لاحقًا.</span></div>`}
    <div style="padding:14px 18px 0"><button onclick="closeSheet()" style="width:100%;background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">إلغاء</button></div>
  </div>`;
  document.body.appendChild(sh);
};
window.closeSheet = () => { PL3._pending=null; const s=document.getElementById("pi_sheet"); if(s) s.remove(); };

window.pickMediaFor = async i => {
  const e = i>=0 ? PL3._evs[i] : null;
  const f = PL3._pending; PL3._pending = null;
  const sh = document.getElementById("pi_sheet"); if(sh) sh.remove();
  if(f) await PL3.upload(f,e);
};

PL3.upload = async (file, e) => {
  const isVid = /^video\//.test(file.type);
  if(file.size > 52428800) return toast("الملف أكبر من ٥٠ ميغابايت",1);
  toast("جارٍ رفع اللقطة…");
  const row = {
    subject: ME.name, kind: isVid?"video":"photo",
    event_id: e?e.id:null, event_type: e?e.type:null, minute: e?e.minute:null,
    match_title: (e&&e.matches&&e.matches.title)||"",
    label: e?evLabel(e):"لقطة",
    uploaded_by: ME.name+" — لاعب", owner_id: ME.id
  };
  const store = await PL3.hasStore();
  let saved = false;
  if(store){
    const ext = (file.name.split(".").pop()||"bin").toLowerCase();
    const path = ME.id+"/"+Date.now()+"."+ext;
    const {error} = await sb.storage.from(PL3.BUCKET).upload(path,file,{cacheControl:"3600",upsert:false});
    if(error){ PL3._store = false; }   /* الحاوية غابت — نكمل محليًا بلا ما يفقد المستخدم ملفه */
    else { row.path = path; row.url = sb.storage.from(PL3.BUCKET).getPublicUrl(path).data.publicUrl; saved = true; }
  }
  if(!saved){
    try{ row.url = await PL3.putFile(file); row.path = row.url.slice(4); }
    catch(err){ return toast("تعذّر حفظ الملف على هذا الجهاز",1); }
  }
  const {error:e2} = await sb.from("pi_media").insert(row);
  if(e2){ if(row.url&&String(row.url).startsWith("idb:")) try{ await PL3.dropFile(String(row.url).slice(4)); }catch(x){}
    return toast(/pi_media/.test(e2.message)?"اللقطات لم تُفعَّل في القاعدة بعد — تُفعَّل بتنفيذ هجرة واحدة":"تعذّر الحفظ: "+e2.message,1); }
  await sb.from("transparency").insert({actor:ME.name+" — لاعب",
    action: e ? "رفع لقطة مربوطة بحدث موثق — "+row.label : "رفع لقطة لملفه"});
  toast(e?"رُفعت ورُبطت بحدثها":"رُفعت اللقطة"); render();
};

window.tagLater = async id => {
  PL3._tagId = id;
  const {data:evs} = await sb.from("match_events").select("*,matches(title)").eq("who",ME.name).order("created_at",{ascending:false});
  if(!evs||!evs.length) return toast("لا حدث موثق في سجلك بعد",1);
  PL3._evs = evs;
  const sh = document.createElement("div"); sh.id="pi_sheet";
  sh.style.cssText = "position:fixed;inset:0;z-index:200;background:rgba(21,26,46,.45);display:flex;align-items:flex-end;justify-content:center";
  sh.onclick = ev => { if(ev.target===sh) sh.remove(); };
  sh.innerHTML = `<div style="background:#faf8f3;width:100%;max-width:520px;border-radius:28px 28px 0 0;padding:18px 0 22px;max-height:78vh;overflow:auto">
    <div style="width:38px;height:4px;border-radius:99px;background:#d5d0c4;margin:0 auto 14px"></div>
    <div style="padding:0 18px 8px"><b style="display:block;font-size:15px;font-weight:900">اربط اللقطة بحدث</b></div>
    ${evs.slice(0,8).map((e,i)=>`<button onclick="applyTag(${i})" style="display:flex;gap:11px;align-items:center;padding:11px 14px;border:0;border-top:1px solid #f0ece2;background:none;width:100%;text-align:start;cursor:pointer;font-family:Cairo">
      ${PL3.ic(e.type==="goal"?"⚽":e.type==="assist"?"◎":"⇄", e.type==="goal"?"#fff6d6":"#efedff", e.type==="goal"?"#c78c00":"#4636e3")}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(evLabel(e))}</b>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — وقّعه ${esc(e.recorded_by)}</span></div></button>`).join("")}
    <div style="padding:14px 18px 0"><button onclick="closeSheet()" style="width:100%;background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">إلغاء</button></div></div>`;
  document.body.appendChild(sh);
};
window.applyTag = async i => {
  const e = PL3._evs[i], id = PL3._tagId;
  const sh = document.getElementById("pi_sheet"); if(sh) sh.remove();
  await sb.from("pi_media").update({event_id:e.id,event_type:e.type,minute:e.minute,
    match_title:(e.matches&&e.matches.title)||"",label:evLabel(e)}).eq("id",id);
  await sb.from("transparency").insert({actor:ME.name+" — لاعب",action:"ربط لقطة بحدث موثق — "+evLabel(e)});
  toast("رُبطت بحدثها"); render();
};

window.delMedia = async (id) => {
  const {data:rows} = await sb.from("pi_media").select("*").eq("id",id).limit(1);
  const m = rows && rows[0];
  if(m && m.url && String(m.url).startsWith("idb:")){ try{ await PL3.dropFile(String(m.url).slice(4)); }catch(e){} }
  else if(m && m.path && await PL3.hasStore()){ try{ await sb.storage.from(PL3.BUCKET).remove([m.path]); }catch(e){} }
  await sb.from("pi_media").delete().eq("id",id);
  await sb.from("transparency").insert({actor:ME.name+" — لاعب",action:"حذف لقطة من ملفه"});
  toast("حُذفت اللقطة"); render();
};

window.clapPlayer = async n => {
  try{const c=JSON.parse(localStorage.getItem("pi_claps_p")||"{}");c[n]=(c[n]||0)+1;localStorage.setItem("pi_claps_p",JSON.stringify(c));}catch(e){}
  await sb.from("transparency").insert({actor:ME.name+" — "+(roleAr[ME.role]||ME.role),action:"قدّر أداء "+n+" — تقدير مجتمع لا يدخل التقييم"});
  toast("سُجّل تقديرك باسمك"); render();
};

/* ── التركيب: قشرة اللاعب تتبع التصميم المعتمد ── */
(function(){
  NAV.player = PL3.navItems;
  Object.assign(TITLES,{feed:"لوحتي",opps:"مهامي",publicView:"بطاقة اللاعب",myCard:"بطاقتي",cabinet:"خزانتي"});
  /* رابط البطاقة العام: #p/الاسم */
  const openHash = () => { const m=/^#p\/(.+)$/.exec(location.hash||""); if(m&&ME){ VIEW="publicView"; PARAM=decodeURIComponent(m[1]); render(); } };
  window.addEventListener("hashchange",openHash);
  setTimeout(openHash,900);
  const _nav = window.navHtml || navHtml;
  window.navHtml = navHtml = function(){ return (ME&&ME.role==="player") ? PL3.nav() : _nav(); };

  const _r = window.render;
  window.render = render = async function(){
    await _r();
    try{
      if(!ME || ME.role!=="player" || VIEW==="auth" || VIEW==="role") return;
      const app=$("#app"), hd=app.querySelector(".hd");
      /* شاشات الرأس الداكن تحمل رأسها معها */
      const ownHeader = app.querySelector("main") && app.firstElementChild && app.firstElementChild.classList.contains("hd")
        && app.children[1] && app.children[1].tagName!=="MAIN";
      if(hd){
        const dark = ["feed","profile","publicView","myCard","coachBrief","explore"].indexOf(VIEW)>=0;
        hd.remove();
        if(!dark){ app.insertAdjacentHTML("afterbegin", PL3.header()); }
      }
      if(VIEW==="explore") setTimeout(()=>PL3.drawMap&&PL3.drawMap(),60);
      setTimeout(()=>PL3.hydrateMedia&&PL3.hydrateMedia(),40);
      document.body.style.background="#eeeae0";
      const sh=document.querySelector(".shell"); if(sh) sh.style.background="#faf8f3";
    }catch(e){ console.error("PL3",e); }
  };
})();
