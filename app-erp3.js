/* PlayIn365 — ديوان الأكاديمية مطابقًا للتصميم المعتمد «Academy Console» (11a–11e)
   مقام الديوان: رمادي مؤسسي #243244 · زوايا 12px · بلا قطرات ولا بنفسجي · والذهبي ختم اعتماد فقط.
   يُحمَّل بعد app-acad5.js فيتقدّم على T.erp القديمة. */
const DW = {};
DW.dash="—"; DW.INK="#243244"; DW.BG="#f4f6f8"; DW.BD="#d9dfe5"; DW.MUTE="#8fa0b0"; DW.TXT="#5a6a7c";
DW.esn = s => esc(String(s==null?"":s));
DW.panel = (title, right, inner) => `<div style="background:#fff;border:1px solid ${DW.BD};border-radius:12px;overflow:hidden">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid ${DW.BD}"><b style="font-size:12.5px;font-weight:900">${title}</b>${right?`<span style="font-size:10px;color:${DW.MUTE};font-weight:800;flex:none">${right}</span>`:""}</div>
  <div style="padding:14px">${inner}</div></div>`;
DW.note = t => `<div style="background:${DW.BG};border:1px solid ${DW.BD};border-radius:12px;padding:12px 13px;font-size:10.5px;color:${DW.TXT};font-weight:700;line-height:1.85">${t}</div>`;
DW.empty = t => `<div style="border:1.5px dashed ${DW.BD};border-radius:10px;padding:16px;text-align:center;font-size:10.5px;color:${DW.MUTE};font-weight:700;line-height:1.8">${t}</div>`;
DW.sq = (t,bg,ink,sz) => `<span style="width:${sz||32}px;height:${sz||32}px;border-radius:9px;background:${bg||DW.BG};color:${ink||DW.INK};display:grid;place-items:center;font-size:${Math.round((sz||32)*.42)}px;font-weight:900;flex:none">${t}</span>`;
DW.TABS = [["erp","النبض"],["erpPeople","الناس"],["erpOps","التشغيل والمال"],["erpField","الميدان"]];
DW.head = (cur, org) => `<div style="background:${DW.INK};padding:12px 16px;display:flex;align-items:center;gap:12px;color:#fff;position:sticky;top:0;z-index:20">
    ${WM(1)}
    <span style="width:1px;height:22px;background:#3c4c60;flex:none"></span>
    <span style="width:28px;height:28px;border-radius:9px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:13px;font-weight:900;flex:none">${DW.esn(ACD.ini(org))}</span>
    <b style="font-size:12.5px;font-weight:900;flex:1;min-width:0">${DW.esn(org)}</b>
    <button onclick="go('acadHome','${DW.esn(org)}')" style="flex:none;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:9px;padding:7px 11px;font:900 10px Cairo;cursor:pointer">الملف العام ←</button>
  </div>
  <div style="background:${DW.INK};padding:0 12px 12px;display:flex;gap:4px;overflow-x:auto;position:sticky;top:52px;z-index:19">
    ${DW.TABS.map(([v,t])=>`<button onclick="go('${v}')" style="flex:none;border:0;border-radius:8px;padding:8px 13px;font:800 11.5px Cairo;cursor:pointer;background:${cur===v?"rgba(255,255,255,.14)":"transparent"};color:${cur===v?"#fff":"#aebccb"}">${t}</button>`).join("")}
  </div>`;
DW.grpOf = a => ACD.grpOf(a);
/* صورة الديوان: مربّعة 9px (جهة لا فرد) — والحرف بديلًا حين لا صورة */
DW.face = (name,url,sz) => { const u = PL3.avUrl(name,url), s = sz||34;
  return u ? `<img src="${esc(u)}" alt="" style="width:${s}px;height:${s}px;border-radius:9px;object-fit:cover;object-position:top;background:#eef1f5;flex:none;display:block">`
           : `<span style="width:${s}px;height:${s}px;border-radius:9px;background:#eef1f5;color:${DW.INK};display:grid;place-items:center;font:900 ${Math.round(s*.4)}px Cairo;flex:none">${DW.esn(String(name||"؟").trim()[0])}</span>`; };

DW.load = async org => {
  const [pf,att,subs,aps,tro,try_,seats,ms,ev,tr,hs,meta,alum] = await Promise.all([
    q("p", sb.from("profiles").select("id,name,role,org,pos,age,shirt,avatar_url,guardian_name,guardian_consent_at").eq("org",org).limit(400)),
    q("a", sb.from("attendance").select("player_name,created_at,recorded_by,group_name").eq("org",org).limit(3000)),
    q("s", sb.from("subscriptions").select("*").eq("org",org).limit(600)),
    q("ap", sb.from("pi_approvals").select("*").eq("org",org).limit(300)),
    q("t", sb.from("pi_tours").select("*").eq("org",org).limit(30)),
    q("y", sb.from("pi_tryouts").select("*").eq("org",org).order("created_at",{ascending:false}).limit(80)),
    q("st", sb.from("pi_seats").select("*").eq("org",org).limit(300)),
    q("m", sb.from("matches").select("*").order("created_at",{ascending:false}).limit(60)),
    q("e", sb.from("match_events").select("who,type,created_at,recorded_by").order("created_at",{ascending:false}).limit(300)),
    q("tr", sb.from("transparency").select("*").ilike("action","%"+ACD.short(org)+"%").order("created_at",{ascending:false}).limit(200)),
    q("h", sb.from("health_status").select("*").limit(200)),
    q("om", sb.from("pi_org_meta").select("*").eq("org",org).limit(40)),
    q("al", sb.from("pi_alumni").select("*").limit(80))
  ]);
  const players = pf.filter(p=>p.role==="player"), coaches = pf.filter(p=>p.role==="coach");
  const names = new Set(players.map(p=>p.name));
  const hMap = {}; hs.forEach(h=>hMap[h.player_name]=h);
  const days = [...new Set(att.map(a=>String(a.created_at||"").slice(0,10)))].sort().reverse();
  const short = ACD.short(org);
  const mine = ms.filter(m=>String(m.title||"").indexOf(short)>=0);
  return {org, short, aps, players, coaches, staff:pf.filter(p=>["coach","medical","academy"].indexOf(p.role)>=0), names, att, days, subs, tro, tryouts:try_, seats, matches:mine, allM:ms, evs:ev.filter(e=>names.has(e.who)), tr, hMap, meta, accredit:meta.find(m=>m.kind==="accredit"), alumni:alum.filter(a=>names.has(a.player_name)||String(a.coach_name||"").length&&pf.some(p=>p.name===a.coach_name))};
};
DW.load7 = (D,n) => D.att.filter(a=>(Date.now()-new Date(a.created_at))/864e5 <= n).length;

/* ═══════ 11a · النبض ═══════ */
T.erp = async () => {
  const org = (ME&&ME.org)||""; if(!org) return DW.empty("لا جهة مرتبطة بحسابك");
  const D = await DW.load(org);
  const today = new Date().toISOString().slice(0,10);
  const attToday = D.att.filter(a=>String(a.created_at||"").slice(0,10)===today).length;
  const live = D.allM.find(m=>m.status==="live" && String(m.title||"").indexOf(D.short)>=0);
  const rehab = D.players.filter(p=>D.hMap[p.name] && D.hMap[p.name].state!=="available");
  const noGuard = D.players.filter(p=>p.age && p.age<18 && !p.guardian_consent_at);
  const unpaid = D.subs.filter(s=>!s.paid);
  const openSeats = D.seats.filter(s=>!s.linked_id);
  const pulse = [["حاضر اليوم", attToday||DW.dash, attToday?"#fff":"#8fa0b0"],["بقيود طبية", rehab.length||DW.dash, rehab.length?"#e8531f":"#8fa0b0"],["بلا إذن وليّ", noGuard.length||DW.dash, noGuard.length?"#f5c518":"#8fa0b0"]];
  const headline = live ? `مباراة جارية — ${live.title}` : rehab.length||noGuard.length||unpaid.length ? `الأكاديمية بخير — عدا ${rehab.length+noGuard.length+unpaid.length}` : "الأكاديمية بخير";
  const lines = [
    attToday?`حضور اليوم <span class="ltr">${attToday}</span> من <span class="ltr">${D.players.length}</span>`:"لا حصة موقّعة اليوم بعد",
    rehab.length?`<span class="ltr">${rehab.length}</span> بقيود المختص الطبي`:"",
    noGuard.length?`<span class="ltr">${noGuard.length}</span> قاصرًا بلا إذن وليّ موثّق`:"",
    unpaid.length?`<span class="ltr">${unpaid.length}</span> اشتراكًا غير محصَّل`:""
  ].filter(Boolean).join(" · ");
  /* مدار الفئات */
  const byG = {}; D.players.forEach(p=>{ const g=DW.grpOf(p.age); if(g) byG[g]=(byG[g]||0)+1; });
  const gs = Object.entries(byG).sort();
  const gLoad = g => { const ps=D.players.filter(p=>DW.grpOf(p.age)===g).map(p=>p.name);
    const w=D.att.filter(a=>ps.indexOf(a.player_name)>=0 && (Date.now()-new Date(a.created_at))/864e5<=7).length;
    const m=D.att.filter(a=>ps.indexOf(a.player_name)>=0 && (Date.now()-new Date(a.created_at))/864e5<=28).length/4;
    return m? +(w/m).toFixed(2) : null; };
  const lInk = v => v==null?["#eef1f5","#8fa0b0"] : v>1.3?["#fdeee8","#a83b25"] : v<0.8?["#fff8df","#8a6912"] : ["#eaf5ee","#2c6e49"];
  /* قمع المواهب */
  const funnel = [
    {t:"طلبات تجربة", n:D.tryouts.length, d:"سجّلها أصحابها في المنصة", c:DW.INK},
    {t:"مقاعد الكشف", n:D.seats.length, d:"مستورَدة بأرموزها", c:"#5a6a7c"},
    {t:"ارتبطوا بحساباتهم", n:D.seats.filter(s=>s.linked_id).length, d:"بفعل اللاعب لا بربطنا", c:"#2c6e49"},
    {t:"خرّيجون", n:D.alumni.length, d:"«انتقل» يُسجَّل من الصفقة لا من إعلاننا", c:"#8a6912"}
  ];
  const fmx = Math.max(1,...funnel.map(f=>f.n));
  /* شريط اليوم */
  const tl = [
    ...(live?[{time:live.match_time||"—", t:live.title, s:"جارية — التسجيل بلمستين", tag:"مباشر", bg:"#fdeee8", bd:"#f3cdbe", tagBg:"#e8531f", tagInk:"#fff"}]:[]),
    ...D.days.slice(0,1).map(d=>{const n=D.att.filter(a=>String(a.created_at||"").slice(0,10)===d);
      return {time:d.slice(5), t:`حصة — ${n.length} حاضرًا`, s:`وقّعها ${(n[0]&&n[0].recorded_by)||"المدرب"}`, tag:"موقّعة", bg:"#fff", bd:DW.BD, tagBg:"#eaf5ee", tagInk:"#2c6e49"}; }),
    ...D.tryouts.filter(t=>t.status==="open").slice(0,1).map(t=>({time:"—", t:`تجربة أداء ${t.group_name||""}`, s:t.note||"مقر الأكاديمية", tag:"مفتوحة", bg:"#fff", bd:DW.BD, tagBg:"#eef1f5", tagInk:DW.INK})),
    ...(openSeats.length?[{time:"—", t:`${openSeats.length} مقعدًا بانتظار أصحابها`, s:"أرسل الأرموز — والارتباط بفعل اللاعب", tag:"معلّق", bg:"#fff8df", bd:"#f0e2b4", tagBg:"#f5c518", tagInk:"#151a2e"}]:[])
  ];
  /* ما ينتظر قرارك */
  const acts = [
    ...(D.tryouts.filter(t=>t.status==="pending").length?[["◷",`${D.tryouts.filter(t=>t.status==="pending").length} طلب تجربة بانتظار ردّك`,"اقبل أو اعتذر — والنتيجة تصل صاحبها","erpPeople","#fff8df","#8a6912"]]:[]),
    ...(unpaid.length?[["▮",`${unpaid.length} اشتراكًا غير محصَّل`,"الإيصال يصل المشترك لحظة التحصيل","erpOps","#fdeee8","#a83b25"]]:[]),
    ...(noGuard.length?[["👤",`${noGuard.length} قاصرًا بلا إذن وليّ`,"إذن واحد يكفي — ولا يُستأذن في كل تدريب","erpPeople","#eef1f5",DW.INK]]:[]),
    ...(openSeats.length?[["⌗",`${openSeats.length} مقعدًا بلا صاحب`,"أرسل الأرموز","importPlayers","#eef1f5",DW.INK]]:[])
  ];

  return DW.head("erp",org) + `<main style="flex:1;padding:14px 16px 118px;display:flex;flex-direction:column;gap:12px;background:${DW.BG}">
    <div style="position:relative;overflow:hidden;background:${DW.INK};border-radius:14px;padding:18px;color:#fff">
      <div style="position:absolute;inset-inline-start:70%;top:-70%;width:60%;height:240%;background:#2f4157;border-radius:50%;opacity:.55"></div>
      <div style="position:relative">
        <span style="font-size:10.5px;font-weight:900;color:#f5c518" class="ltr">${today}</span>
        <b style="display:block;font-size:20px;font-weight:900;margin-top:6px;line-height:1.35">${esc(headline)}</b>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:6px;line-height:1.85">${lines||"لا نشاط موثّق بعد اليوم"}</span>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px">
          ${pulse.map(([k,v,ink])=>`<div style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:11px 8px;text-align:center"><b class="ltr" style="display:block;font-size:22px;color:${ink}">${v}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:3px">${k}</span></div>`).join("")}
        </div></div></div>

    ${acts.length?DW.panel("ما ينتظر قرارك","الصلاحية في القاعدة لا في الشاشة",
      acts.map(([g,t,s,v,bg,ink])=>`<button onclick="go('${v}')" style="width:100%;display:flex;gap:11px;align-items:center;padding:10px 0;border:0;border-top:1px solid #eef1f5;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
        ${DW.sq(g,bg,ink,34)}<div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(t)}</b><span style="display:block;font-size:10px;color:${DW.MUTE};font-weight:700;margin-top:2px">${esc(s)}</span></div><span style="color:${DW.MUTE}">←</span></button>`).join("")
      ):DW.panel("ما ينتظر قرارك","",`<div style="display:flex;gap:11px;align-items:center">${DW.sq("✓","#eaf5ee","#2c6e49",34)}<b style="font-size:12px">لا شيء ينتظر قرارك</b></div>`)}

    ${gs.length?DW.panel("مدار الفئات","الحجم = العدد · اللون = الحمل",
      `<div style="display:flex;flex-direction:column;gap:9px">
        ${gs.map(([g,n])=>{const v=gLoad(g), [bg,ink]=lInk(v);
          return `<div style="display:flex;gap:10px;align-items:center">
            <span style="width:42px;height:42px;border-radius:10px;background:${bg};border:1.5px solid ${ink}33;color:${ink};display:grid;place-items:center;flex:none"><b class="ltr" style="font-size:14px;font-weight:700">${n}</b></span>
            <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:11.5px"><span class="ltr">${g}</span></b><b class="ltr" style="font-size:11px;color:${ink}">${v??DW.dash}</b></div>
              <div style="height:6px;background:#eef1f5;border-radius:99px;overflow:hidden;margin-top:5px;position:relative"><span style="position:absolute;inset-inline-start:40%;width:25%;height:100%;background:#eaf5ee"></span><span style="display:block;height:100%;background:${ink};width:${v==null?0:Math.min(100,Math.round(v/2*100))}%"></span></div></div></div>`;}).join("")}
        <span style="font-size:10px;color:${DW.TXT};font-weight:700;line-height:1.8;border-top:1px solid #eef1f5;padding-top:10px">الحمل = نسبة أسبوعك إلى متوسط أربعة أسابيع. المنطقة الآمنة <span class="ltr">0.8 – 1.3</span> — والمدرب يقرّر، الإدارة تقرأ.</span>
      </div>`):""}

    ${DW.panel("قمع المواهب","من نشاط موثّق",
      funnel.map(f=>`<div style="margin-bottom:11px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:11px;font-weight:900"><span style="color:${f.c}">${f.t}</span><b class="ltr" style="color:${f.c};font-size:14px">${f.n||DW.dash}</b></div>
        <div style="height:18px;background:${DW.BG};border-radius:6px;overflow:hidden;margin-top:5px"><div style="height:100%;border-radius:6px;background:${f.c};width:${Math.round(f.n/fmx*100)}%"></div></div>
        <span style="display:block;font-size:9.5px;color:${DW.MUTE};font-weight:700;margin-top:4px">${f.d}</span></div>`).join("")
      + `<span style="display:block;font-size:10px;color:${DW.TXT};font-weight:700;line-height:1.8;border-top:1px solid #eef1f5;padding-top:10px">لا رقم هنا من تقديرنا — كلها صفوف في القاعدة باسم من أنشأها.</span>`)}

    ${tl.length?DW.panel("شريط اليوم","كل بطاقة باسم من أنشأها",
      `<div style="display:flex;flex-direction:column;gap:9px">${tl.map(t=>`<div style="border-radius:10px;padding:12px;background:${t.bg};border:1px solid ${t.bd}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="ltr" style="font-size:10.5px;font-weight:700;color:${DW.MUTE}">${esc(t.time)}</span>
          <span style="background:${t.tagBg};color:${t.tagInk};border-radius:999px;padding:3px 9px;font-size:9px;font-weight:900">${t.tag}</span></div>
        <b style="display:block;font-size:11.5px;font-weight:900;margin-top:5px;line-height:1.45">${esc(t.t)}</b>
        <span style="display:block;font-size:9.5px;font-weight:700;margin-top:3px;color:${DW.MUTE}">${esc(t.s)}</span></div>`).join("")}</div>`):""}

    ${DW.hint?DW.hint():""}
    ${DW.note("الديوان يقرأ ولا يصحّح: لا زرّ هنا يعدّل نتيجة ولا تقييمًا ولا حضورًا وقّعه مدرب. التصحيح باسم من صحّحه في سجل الشفافية.")}
  </main>`;
};

/* ═══════ 11b · الناس ═══════ */
DW.pk = () => "pi_dwp_"+(ME&&ME.id);
DW.pv = () => { try{ return JSON.parse(localStorage.getItem(DW.pk())||"null")||{tab:"players",q:""}; }catch(e){ return {tab:"players",q:""}; } };
window.dwTab = t => { try{ localStorage.setItem(DW.pk(), JSON.stringify(Object.assign(DW.pv(),{tab:t}))); }catch(e){} render(); };
window.dwFind = v => { try{ localStorage.setItem(DW.pk(), JSON.stringify(Object.assign(DW.pv(),{q:v}))); }catch(e){} render(); };
window.dwTryout = async (id,ok) => {
  const {error} = await sb.from("pi_tryouts").update({status: ok?"accepted":"declined"}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(ok?"قبل طلب تجربة أداء":"اعتذر عن طلب تجربة أداء");
  toast(ok?"قُبل — تصل النتيجة صاحبها باسمك":"اعتُذر — والسبب يصل صاحبه"); render();
};
T.erpPeople = async () => {
  const org = (ME&&ME.org)||""; if(!org) return DW.empty("لا جهة");
  const D = await DW.load(org); const V = DW.pv();
  const nAtt = n => D.att.filter(a=>a.player_name===n).length;
  const pend = D.tryouts.filter(t=>t.status==="pending");
  let rows = V.tab==="players" ? D.players : V.tab==="staff" ? D.staff : D.players.filter(p=>p.age&&p.age<18);
  if(V.q) rows = rows.filter(p=>String(p.name).indexOf(V.q)>=0 || String(p.pos||"").indexOf(V.q)>=0);
  const HS = {available:["متاح","#2c6e49"],rehab:["تأهيل","#8a6912"],limited:["بقيود","#8a6912"],out:["غير متاح","#a83b25"]};
  const ROLE = {coach:"مدرب",medical:"طبي",academy:"مشرف"};

  return DW.head("erpPeople",org) + `<main style="flex:1;padding:14px 16px 118px;display:flex;flex-direction:column;gap:12px;background:${DW.BG}">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      ${[["players",`اللاعبون`,D.players.length],["staff","الطاقم",D.staff.length],["minors","القاصرون",D.players.filter(p=>p.age&&p.age<18).length]].map(([k,t,n])=>`<button onclick="dwTab('${k}')" style="background:${V.tab===k?DW.INK:"#fff"};color:${V.tab===k?"#fff":DW.TXT};border:1px solid ${V.tab===k?DW.INK:DW.BD};border-radius:10px;padding:11px 6px;font:900 11px Cairo;cursor:pointer;text-align:center"><b class="ltr" style="display:block;font-size:16px">${n||DW.dash}</b>${t}</button>`).join("")}
    </div>

    ${pend.length?DW.panel(`طلبات تجربة — <span class="ltr">${pend.length}</span>`,"قرارك يصل صاحبه باسمك",
      pend.map(t=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #eef1f5">
        ${DW.sq(DW.esn(String(t.applicant||"؟").trim()[0]),"#eef1f5",DW.INK,34)}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(t.applicant)}</b>
          <span style="display:block;font-size:9.5px;color:${DW.MUTE};font-weight:700;margin-top:2px">${t.age?`<span class="ltr">${t.age}</span> سنة · `:""}${esc(t.group_name||"—")}${t.created_by?` · سجّله ${esc(t.created_by)}`:""}</span></div>
        <button onclick="dwTryout('${t.id}',true)" style="flex:none;background:#2c6e49;color:#fff;border:0;border-radius:8px;padding:8px 11px;font:900 10px Cairo;cursor:pointer">اقبل</button>
        <button onclick="dwTryout('${t.id}',false)" style="flex:none;background:#fff;color:#a83b25;border:1px solid ${DW.BD};border-radius:8px;padding:8px 11px;font:900 10px Cairo;cursor:pointer">اعتذر</button></div>`).join("")):""}

    ${DW.panel(V.tab==="staff"?"الطاقم":V.tab==="minors"?"القاصرون وأولياء أمورهم":"سجل اللاعبين", `<span class="ltr">${rows.length}</span>`,
      `<input value="${DW.esn(V.q)}" oninput="dwFind(this.value)" placeholder="ابحث باسم أو مركز" style="width:100%;border:1px solid ${DW.BD};border-radius:9px;padding:9px 11px;font:700 11px Cairo;background:${DW.BG};margin-bottom:6px">
      ${rows.length?rows.map(p=>{
        const h=D.hMap[p.name], S=h?(HS[h.state]||HS.available):null, n=nAtt(p.name);
        const seat=D.seats.find(s=>s.name===p.name);
        return `<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #eef1f5">
          ${DW.face(p.name,p.avatar_url,34)}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(p.name)}</b>
            <span style="display:block;font-size:9.5px;color:${DW.MUTE};font-weight:700;margin-top:2px">${V.tab==="staff"?esc(ROLE[p.role]||p.role):`${esc(p.pos||"—")}${p.age?` · <span class="ltr">${DW.grpOf(p.age)||p.age}</span>`:""}${p.shirt?` · <span class="ltr">#${p.shirt}</span>`:""} · <span class="ltr">${n}</span> حصة`}</span></div>
          ${V.tab==="minors"
            ? (p.guardian_consent_at?`<span style="flex:none;background:#eaf5ee;color:#2c6e49;border-radius:999px;padding:4px 9px;font-size:9px;font-weight:900">إذن ${esc(p.guardian_name||"وليّه")} ✓</span>`
              :`<span style="flex:none;background:#fff8df;color:#8a6912;border-radius:999px;padding:4px 9px;font-size:9px;font-weight:900">بلا إذن وليّ</span>`)
            : S?`<span style="flex:none;background:${S[1]}18;color:${S[1]};border-radius:999px;padding:4px 9px;font-size:9px;font-weight:900">${S[0]}</span>`:""}
          ${seat&&!seat.linked_id?`<span class="ltr" style="flex:none;background:${DW.INK};color:#f5c518;border-radius:8px;padding:5px 8px;font:700 10px 'Space Grotesk'">${seat.join_code}</span>`:""}
        </div>`;}).join("")
      :DW.empty(V.q?"لا نتيجة لبحثك":"لا صفوف")}`)}

    ${DW.panel("مقاعد الكشف",`<span class="ltr">${D.seats.filter(s=>!s.linked_id).length}</span> بلا صاحب`,
      `<div style="display:flex;gap:8px"><button onclick="go('importPlayers')" style="flex:1;background:${DW.INK};color:#fff;border:0;border-radius:9px;padding:11px;font:900 11px Cairo;cursor:pointer">استورد كشفًا</button>
      <button onclick="go('tryouts')" style="flex:1;background:#fff;color:#151a2e;border:1px solid ${DW.BD};border-radius:9px;padding:11px;font:900 11px Cairo;cursor:pointer">اختبارات القبول</button></div>`)}

    ${DW.note("الأكاديمية لا تربط حسابًا بأحد: تستورد مقاعد وترسل أرموزها، ويرتبط صاحبها بنفسه. وإذن وليّ الأمر يُعطى مرة واحدة — ولا يُستأذن إلا في تعاقد أو انتقال أو اطّلاع طبي.")}
  </main>`;
};

/* ═══════ 11c · التشغيل والمال ═══════ */
T.erpOps = async () => {
  const org = (ME&&ME.org)||""; if(!org) return DW.empty("لا جهة");
  const D = await DW.load(org);
  const paid = D.subs.filter(s=>s.paid), unpaid = D.subs.filter(s=>!s.paid);
  const sum = a => a.reduce((s,x)=>s+(+x.amount||0),0);
  const rate = D.subs.length?Math.round(paid.length/D.subs.length*100):null;
  const done = D.matches.filter(m=>m.status==="final");
  const wins = done.filter(m=>{const a=+m.score_a,b=+m.score_b; return String(m.team_a||"").indexOf(D.short)>=0?a>b:b>a;}).length;
  const MN=["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"];
  const now=new Date();
  const months=[...Array(6)].map((_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return {k:d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"),lb:MN[d.getMonth()]};});
  const mv = months.map(m=>D.days.filter(d=>d.startsWith(m.k)).length);
  const mx = Math.max(1,...mv);
  const gov = [
    ["الاعتماد", D.accredit?`سارٍ${D.accredit.to_year?` حتى ${D.accredit.to_year}`:""}`:"غير مسجَّل", D.accredit?"#2c6e49":"#8fa0b0"],
    ["مدربون معتمدون", `${D.coaches.length}`, D.coaches.length?"#2c6e49":"#8fa0b0"],
    ["قاصرون بإذن وليّ", `${D.players.filter(p=>p.age&&p.age<18&&p.guardian_consent_at).length} / ${D.players.filter(p=>p.age&&p.age<18).length}`, "#243244"],
    ["قيود سجل الشفافية", `${D.tr.length}`, "#243244"]
  ];

  return DW.head("erpOps",org) + `<main style="flex:1;padding:14px 16px 118px;display:flex;flex-direction:column;gap:12px;background:${DW.BG}">
    <div style="background:${DW.INK};border-radius:14px;padding:18px;color:#fff">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        ${[["حصة موثّقة",D.days.length,"#fff"],["مباراة",D.matches.length,"#fff"],["تحصيل",rate!=null?rate+"%":null,rate>=80?"#7fd7a4":"#f5c518"]].map(([k,v,c])=>`<div><b class="ltr" style="display:block;font-size:24px;font-weight:700;color:${v?c:"#8a93b0"}">${v||DW.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}
      </div></div>

    ${DW.panel("الاشتراكات",`محصَّل <span class="ltr">${sum(paid).toLocaleString("en")}</span> ر.س`,
      `<div style="display:flex;gap:9px;margin-bottom:11px">
        <div style="flex:1;background:#eaf5ee;border:1px solid #cfe5dd;border-radius:10px;padding:11px;text-align:center"><b class="ltr" style="display:block;font-size:18px;color:#2c6e49">${paid.length||DW.dash}</b><span style="font-size:9.5px;color:#2c6e49;font-weight:900">مدفوع ✓</span></div>
        <div style="flex:1;background:${unpaid.length?"#fdeee8":DW.BG};border:1px solid ${unpaid.length?"#f3cdbe":DW.BD};border-radius:10px;padding:11px;text-align:center"><b class="ltr" style="display:block;font-size:18px;color:${unpaid.length?"#a83b25":DW.MUTE}">${unpaid.length||DW.dash}</b><span style="font-size:9.5px;color:${unpaid.length?"#a83b25":DW.MUTE};font-weight:900">غير محصَّل</span></div>
      </div>
      ${unpaid.length?unpaid.slice(0,6).map(s=>`<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid #eef1f5">
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11px">${esc(s.player_name)}</b><span style="display:block;font-size:9.5px;color:${DW.MUTE};font-weight:700">${esc(s.group_name||"—")}</span></div>
        <b class="ltr" style="font-size:12px;color:#a83b25">${(+s.amount||0).toLocaleString("en")}</b></div>`).join("")
      :DW.empty("كل الاشتراكات محصَّلة")}
      <span style="display:block;font-size:10px;color:${DW.TXT};font-weight:700;margin-top:9px;line-height:1.8">كل ريال عبر المنصة بإيصال باسم دافعه — والإلغاء بسبب مكتوب يردّ المبلغ.</span>`)}

    ${(()=>{
      const inflow = sum(paid);
      const apOk = (D.aps||[]).filter(a=>a.status==="approved"), apOpen=(D.aps||[]).filter(a=>a.status==="open");
      const spent = sum(apOk), committed = sum(apOpen);
      const left = inflow - spent - committed;
      const pc = v => inflow>0 ? Math.max(0,Math.min(100,Math.round(v/inflow*100))) : 0;
      const KIND={budget:["ميزانية","#243244"],travel:["سفر","#c78c00"],contract:["تعاقد","#2c6e49"]};
      const byKind={}; apOk.concat(apOpen).forEach(a=>{ byKind[a.kind||"budget"]=(byKind[a.kind||"budget"]||0)+(+a.amount||0); });
      const rows=Object.entries(byKind).sort((a,b)=>b[1]-a[1]);
      if(!inflow && !spent && !committed) return DW.panel("الميزانية ومقياس المصروف","","<div style=\"font-size:11px;color:"+DW.TXT+";font-weight:700;line-height:1.85\">لا حركة مالية بعد — الميزانية تتكوّن من الاشتراكات المحصَّلة، والمصروف من الطلبات الموقَّعة في «الموافقات».</div>");
      return DW.panel("الميزانية ومقياس المصروف",`الوارد <span class="ltr">${inflow.toLocaleString("en")}</span> ر.س`,
      `<div style="height:16px;border-radius:6px;overflow:hidden;display:flex;background:#eef1f5;margin-bottom:9px">
        <span style="width:${pc(spent)}%;background:#243244"></span>
        <span style="width:${pc(committed)}%;background:repeating-linear-gradient(45deg,#8fa0b0 0 4px,#a9b6c2 4px 8px)"></span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${[["مصروف موقَّع",spent,"#243244"],["ملتزم به",committed,"#8fa0b0"],["المتبقّي",left,left<0?"#a83b25":"#2c6e49"]].map(([k,v,c])=>
        `<div style="background:${DW.BG};border:1px solid ${DW.BD};border-radius:10px;padding:10px 8px;text-align:center">
          <b class="ltr" style="display:block;font-size:15px;font-weight:700;color:${c}">${v.toLocaleString("en")}</b>
          <span style="font-size:8.5px;color:${DW.TXT};font-weight:800">${k}</span></div>`).join("")}
      </div>
      ${rows.length?`<div style="margin-top:11px;border-top:1px solid #eef1f5;padding-top:10px;display:flex;flex-direction:column;gap:7px">
        ${rows.map(([k,v])=>{const K=KIND[k]||KIND.budget; const w=inflow>0?pc(v):0;
          return `<div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:10.5px;font-weight:800">
            <span style="color:${DW.TXT}">${K[0]}</span><b class="ltr" style="color:${K[1]}">${v.toLocaleString("en")}</b></div>
          <div style="height:5px;background:#eef1f5;border-radius:99px;margin-top:4px;overflow:hidden"><span style="display:block;height:100%;width:${w}%;background:${K[1]};border-radius:99px"></span></div>
        </div>`}).join("")}
      </div>`:""}
      <span style="display:block;font-size:10px;color:${DW.TXT};font-weight:700;margin-top:10px;line-height:1.85">المخطَّط = طلبات وقّعتها السلسلة كاملة. المشطَّب = التزام قائم لم يُنفَّذ بعد. ولا رقم هنا بلا طلبٍ باسم مقدّمه في «الموافقات».${left<0?" <b style=\"color:#a83b25\">الالتزامات تجاوزت الوارد.</b>":""}</span>`);
    })()}

    ${D.days.length?DW.panel("الحصص في ستة أشهر","كلها موقّعة بأسماء مدربيها",
      `<div style="display:flex;align-items:flex-end;gap:6px;height:86px;margin-top:4px">
        ${mv.map((v,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
          <b class="ltr" style="font-size:9px;font-weight:700;color:${v?DW.INK:"#c9d2da"}">${v||""}</b>
          <span style="width:100%;border-radius:5px 5px 2px 2px;background:${v?DW.INK:"#eef1f5"};height:${Math.max(3,Math.round(v/mx*58))}px"></span>
          <span style="font-size:8px;font-weight:800;color:${DW.MUTE}">${months[i].lb}</span></div>`).join("")}
      </div>`):""}

    ${D.matches.length?DW.panel("المباريات",`فاز <span class="ltr">${wins}</span> من <span class="ltr">${done.length}</span>`,
      D.matches.slice(0,5).map(m=>`<button onclick="go('matchView','${m.id}')" style="width:100%;display:flex;gap:10px;align-items:center;padding:9px 0;border:0;border-top:1px solid #eef1f5;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(m.title)}</b><span style="display:block;font-size:9.5px;color:${DW.MUTE};font-weight:700;margin-top:2px">${esc(m.comp||"ودية")} · ${esc(m.venue||"—")}${m.referee_name?` · الحكم ${esc(m.referee_name)}`:""}</span></div>
        ${m.score_a!=null?`<b class="ltr" style="font-size:15px;font-weight:700;flex:none">${m.score_a}–${m.score_b}</b>`:`<span style="font-size:9.5px;color:${DW.MUTE};font-weight:900;flex:none">لم تُلعب</span>`}</button>`).join("")
      ):""}

    ${DW.panel("الحوكمة","قراءة فقط",
      `<table style="width:100%;border-collapse:collapse;font-size:11px">
        ${gov.map(([k,v,c])=>`<tr><td style="padding:9px 0;border-top:1px solid #eef1f5;font-weight:800;color:${DW.TXT}">${k}</td><td class="ltr" style="padding:9px 0;border-top:1px solid #eef1f5;text-align:end;font-weight:900;color:${c}">${v}</td></tr>`).join("")}
      </table>
      <button onclick="go('adminTrans')" style="width:100%;margin-top:10px;background:#fff;border:1px solid ${DW.BD};border-radius:9px;padding:10px;font:900 11px Cairo;cursor:pointer">سجل الشفافية ←</button>`)}

    ${DW.note("الأدمن يدير المنصة والمال، ولا يملك زرًّا لتعديل نتيجة أو تقييم — وكذلك ديوانك.")}
  </main>`;
};

/* ═══════ 11d + 11e · الميدان ═══════ */
DW.fk = () => "pi_dwf_"+(ME&&ME.id)+"_"+new Date().toISOString().slice(0,10);
DW.fs = () => { try{ return JSON.parse(localStorage.getItem(DW.fk())||"{}"); }catch(e){ return {}; } };
window.dwTap = async name => {
  const s = DW.fs(), cur = s[name]||"none", nx = cur==="none"?"in":cur==="in"?"off":"none";
  s[name]=nx; try{ localStorage.setItem(DW.fk(), JSON.stringify(s)); }catch(e){}
  if(nx==="in"){
    const g = (typeof ACD!=="undefined" && ACD.grpOf) || (()=>null);
    const {error} = await sb.from("attendance").insert({player_name:name, org:ME.org||"", group_name:"عام", recorded_by:ME.name, present:true});
    if(error) toast("تعذّر الحفظ: "+error.message,1); else toast("سُجّل حضور "+String(name).split(" ")[0]+" باسمك");
  }
  render();
};
T.erpField = async () => {
  const org = (ME&&ME.org)||""; if(!org) return DW.empty("لا جهة");
  const D = await DW.load(org);
  const today = new Date().toISOString().slice(0,10);
  const signed = new Set(D.att.filter(a=>String(a.created_at||"").slice(0,10)===today).map(a=>a.player_name));
  const st = DW.fs(), stOf = n => signed.has(n)?"in":(st[n]||"none");
  const inN = D.players.filter(p=>stOf(p.name)==="in").length;
  const RING = {in:DW.INK, off:"#e8531f", none:DW.BD};
  const INK  = {in:DW.INK, off:"#e8531f", none:DW.MUTE};
  const urgent = [
    ...D.players.filter(p=>D.hMap[p.name]&&D.hMap[p.name].state==="out").slice(0,3).map(p=>({g:"🔒",t:`${p.name} — غير متاح`,s:`بقرار ${(D.hMap[p.name].updated_by)||"المختص"} — لا يُقحَم`,bg:"#eef7f4",ink:"#2c8471"})),
    ...D.players.filter(p=>p.age&&p.age<18&&!p.guardian_consent_at).slice(0,3).map(p=>({g:"👤",t:`${p.name} — بلا إذن وليّ`,s:"يُمنع من المباريات الرسمية حتى يُسجَّل الإذن",bg:"#fff8df",ink:"#8a6912"})),
    ...D.seats.filter(s=>!s.linked_id).slice(0,2).map(s=>({g:"⌗",t:`${s.name} — مقعد بلا صاحب`,s:`رمزه ${s.join_code} — حضوره ينتظر المطابقة`,bg:"#eef1f5",ink:DW.INK}))
  ];

  return DW.head("erpField",org) + `<main style="flex:1;padding:14px 16px 118px;display:flex;flex-direction:column;gap:12px;background:${DW.BG}">
    <div style="position:relative;overflow:hidden;background:${DW.INK};border-radius:14px;padding:18px;color:#fff">
      <div style="position:absolute;inset-inline-start:64%;top:-70%;width:70%;height:230%;background:#e8531f;border-radius:50%;opacity:1"></div>
      <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-end;gap:12px">
        <div><span style="display:block;font-size:10px;color:#f5c518;font-weight:900">الميدان · <span class="ltr">${today}</span></span>
          <b class="ltr" style="display:block;font-size:30px;font-weight:700;margin-top:4px">${D.players.length?inN+" / "+D.players.length:DW.dash}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700">حاضرون — بتوقيعك لحظته</span></div>
      </div></div>

    ${DW.panel("اضغط الوجه لتسجيل الحضور","توقيعك = سطر في سجل كل لاعب",
      D.players.length?`<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:7px">
        ${D.players.map(p=>{const s=stOf(p.name);
          return `<button onclick="dwTap('${DW.esn(p.name)}')" style="background:none;border:0;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:Cairo">
            <span style="width:42px;height:42px;border-radius:11px;padding:2px;background:${RING[s]};display:block">${DW.face(p.name,p.avatar_url,38)}</span>
            <span style="font-size:8.5px;font-weight:900;color:${INK[s]}">${esc(String(p.name).split(" ")[0])}</span></button>`;}).join("")}
      </div>
      <span style="display:block;font-size:9.5px;color:${DW.TXT};font-weight:700;margin-top:9px;line-height:1.7">كحلي حاضر · برتقالي اعتذر · رمادي لم يصل. الحاضر يُكتب في القاعدة فورًا ولا يُسحب إلا بتصحيح باسمك.</span>`
      :DW.empty("لا لاعبين في كشفك"))}

    ${urgent.length?DW.panel("قرارات لا تحتمل الانتظار","",
      urgent.map(u=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #eef1f5">
        ${DW.sq(u.g,u.bg,u.ink,34)}<div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(u.t)}</b><span style="display:block;font-size:9.5px;color:${DW.MUTE};font-weight:700;margin-top:2px">${esc(u.s)}</span></div></div>`).join("")
      ):DW.panel("قرارات لا تحتمل الانتظار","",`<div style="display:flex;gap:11px;align-items:center">${DW.sq("✓","#eaf5ee","#2c6e49",34)}<b style="font-size:12px">لا شيء عاجل في الميدان</b></div>`)}

    ${DW.note("الميدان للجوال: ما يُعمَل واقفًا. القياس والتقييم في عمود المدرب — والديوان يقرأ أثرهما.")}
  </main>`;
};

(function(){
  Object.assign(TITLES,{erp:"الديوان — النبض",erpPeople:"الديوان — الناس",erpOps:"الديوان — التشغيل والمال",erpField:"الديوان — الميدان"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE,{erp:["الديوان","هل الأكاديمية بخير اليوم؟"],erpPeople:["الناس","من عندنا وكيف حالهم"],erpOps:["التشغيل والمال","هل نلعب بانتظام ونكسب"],erpField:["الميدان","ما يُعمَل واقفًا"]});
  if(typeof ACD!=="undefined") ACD.OWN.push("erp","erpPeople","erpOps","erpField");
  if(typeof HUB!=="undefined"){
    HUB.ROLE.academy = [["◉","ملفنا العام","acadHome","#fff6d6","#c78c00"],["▦","الديوان — النبض","erp","#e7ecf1","#243244"],["👤","الناس","erpPeople","#e7ecf1","#243244"],["▮","التشغيل والمال","erpOps","#e7ecf1","#243244"],["⚑","الميدان","erpField","#e7ecf1","#243244"],["▶","مبارياتنا","acadMatches"],["◍","الفرق والتجارب","acadTeams"],["⇪","استيراد الكشف","importPlayers"]];
    ["erpPeople","erpOps","erpField"].forEach(v=>{ if(HUB.ROLE_OK.academy.indexOf(v)<0) HUB.ROLE_OK.academy.push(v); });
  }
  if(typeof NAV!=="undefined") NAV.academy = [["◉","بيتي","acadHome"],["▶","مبارياتنا","acadMatches"],["FAB","","hub"],["⚑","الميدان","erpField"],["▦","الديوان","erp"]];
})();
