/* PlayIn365 — عمود الأكاديمية مطابقًا للتصميم المعتمد «Academy Profile» (10a–10g)
   يُحمَّل بعد app-co5.js. الأكاديمية جهة: لا قطرات على عناصرها (زوايا 14px) — القطرة للأفراد داخلها.
   الملف العام يراه كل زائر · «بيتي» يراه مشرف الأكاديمية. كل رقم من القاعدة أو «—». */
const ACD = {};
ACD.dash = "—";
ACD.esn = s => esc(String(s == null ? "" : s));
ACD.card  = inner => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:16px">${inner}</div>`;
ACD.h     = t => `<b style="font-size:13px;font-weight:900">${t}</b>`;
ACD.sub   = t => `<span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">${t}</span>`;
ACD.note  = t => `<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">${t}</div>`;
ACD.empty = t => `<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">${t}</div>`;
ACD.disc  = (c,o) => `<div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:${c||"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:${o||.5}"></div>`;
ACD.sq    = (t,bg,ink,sz) => `<span style="width:${sz||36}px;height:${sz||36}px;border-radius:${Math.round((sz||36)*.3)}px;background:${bg||"#efedff"};color:${ink||"#4636e3"};display:grid;place-items:center;font-size:${Math.round((sz||36)*.4)}px;font-weight:900;flex:none">${t}</span>`;
ACD.grpOf = a => a ? (a<=13?"U13":a<=14?"U14":a<=15?"U15":a<=16?"U16":a<=17?"U17":a<=19?"U19":a<=23?"U23":"SEN") : null;
ACD.ini   = s => { const t=String(s||"").replace("أكاديمية","").trim(); return (t.indexOf("ال")===0?t.slice(2):t).trim()[0] || "أ"; };
ACD.who   = () => (typeof PARAM!=="undefined" && PARAM) || (ME && ME.org) || "";
ACD.mine  = () => ME && ME.role==="academy" && (!PARAM || PARAM===ME.org);
ACD.back  = v => `<button onclick="${v?`go('${v}','${ACD.esn(ACD.who())}')`:"back()"}" style="width:40px;height:40px;border-radius:12px;background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">→</button>`;
ACD.head  = (title, sub, right) => `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">${ACD.back("acadHome")}${right||`<span style="font-size:10.5px;font-weight:900;color:#8a8fa5">${ACD.esn(ACD.who())}</span>`}</div>
  <div style="text-align:center;padding:6px 18px 0"><b style="display:block;font-size:26px;font-weight:900;line-height:1.3">${title}</b><span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">${sub}</span></div>`;
ACD.tabs  = cur => {
  const T_ = [["acadHome","الواجهة"],["acadPride","الفخر"],["acadTeams","الفرق والتجارب"],["acadNet","الشبكة والرعاة"],["acadHub","المجتمع"],["acadMedia","الوسائط"],["acadNext","الجاي"]];
  return `<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:2px">${T_.map(([v,t])=>`<button onclick="go('${v}','${ACD.esn(ACD.who())}')" style="flex:none;border-radius:999px;padding:8px 13px;font:900 10.5px Cairo;background:${cur===v?"#151a2e":"#fff"};color:${cur===v?"#faf8f3":"#151a2e"};border:1px solid ${cur===v?"#151a2e":"#e9e4d8"};cursor:pointer">${t}</button>`).join("")}</div>`;
};

/* البيانات المشتركة للأكاديمية — تُجلب مرة واحدة لكل شاشة */
ACD.load = async org => {
  const [pf,att,ev,alum,certs,subs,tr,tro,try_,med,mem,ms,fol,views,meta] = await Promise.all([
    q("p", sb.from("profiles").select("id,name,role,org,pos,age,shirt,avatar_url").eq("org",org).limit(300)),
    q("a", sb.from("attendance").select("player_name,created_at,recorded_by").eq("org",org).limit(2000)),
    q("e", sb.from("match_events").select("*,matches(title,comp,organizer_name,referee_name)").order("created_at",{ascending:false}).limit(300)),
    q("al", sb.from("pi_alumni").select("*").order("dest_year",{ascending:false}).limit(60)),
    q("ct", sb.from("pi_certs").select("person,level,issuer,verified_by").limit(200)),
    q("s", sb.from("subscriptions").select("player_name,group_name,amount,paid").eq("org",org).limit(500)),
    q("t", sb.from("transparency").select("*").ilike("action","%"+org.replace("أكاديمية","").trim()+"%").order("created_at",{ascending:false}).limit(300)),
    q("to", sb.from("pi_tours").select("*").eq("org",org).limit(20)),
    q("ty", sb.from("pi_tryouts").select("*").eq("org",org).order("created_at",{ascending:false}).limit(60)),
    q("md", sb.from("pi_media").select("*").order("created_at",{ascending:false}).limit(60)),
    q("mm", sb.from("memberships").select("*").eq("org",org).limit(500)),
    q("m", sb.from("matches").select("*").order("created_at",{ascending:false}).limit(60)),
    q("f", sb.from("follows").select("id").eq("target_name",org).limit(5000)),
    q("v", sb.from("pi_views").select("viewer,viewer_role,subject,created_at").order("created_at",{ascending:false}).limit(300)),
    q("om", sb.from("pi_org_meta").select("*").eq("org",org).limit(40))
  ]);
  const posts = [];
  const players = pf.filter(p=>p.role==="player"), coaches = pf.filter(p=>p.role==="coach"), names = new Set(players.map(p=>p.name));
  const coachN = new Set(coaches.map(c=>c.name));
  const evs = ev.filter(e=>names.has(e.who));
  const mine = ms.filter(m => String(m.title||"").indexOf(org.replace("أكاديمية ","").trim())>=0 || String(m.team_a||"").indexOf(org)>=0 || String(m.team_b||"").indexOf(org)>=0);
  const days = new Set(att.map(a=>String(a.created_at||"").slice(0,10)));
  const attPct = players.length && days.size ? Math.round(att.length / (players.length*days.size) * 100) : null;
  const alumni = alum.filter(a=>coachN.has(a.coach_name));
  return {org, meta, accredit:meta.find(m=>m.kind==="accredit"), sponsors:meta.filter(m=>m.kind==="sponsor"), players, coaches, evs, alumni, certs:certs.filter(c=>coachN.has(c.person)), subs, tr, tro, tryouts:try_, media:med.filter(m=>names.has(m.subject)), mem, matches:mine, allM:ms, follows:fol.length, views:views.filter(v=>names.has(v.subject)), posts, att, days:days.size, attPct};
};

/* ═══════════ 10a · الواجهة ═══════════ */
T.acadHome = async () => {
  const org = ACD.who(); if(!org) return `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px"><div style="background:#151a2e;border-radius:22px;padding:20px;color:#faf8f3"><b style="display:block;font-size:17px;font-weight:900;line-height:1.5">حسابك بلا جهة بعد</b><span style="display:block;font-size:11.5px;font-weight:500;color:#c6cade;line-height:1.85;margin-top:8px">اسم أكاديميتك يظهر هنا ويجمع لاعبيك وحصصك وحضورك. أضِفه من الإعدادات — سطر واحد.</span><button onclick="go('settings')" style="margin-top:14px;background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px 20px;font:900 12.5px Cairo;cursor:pointer">أضف اسم الجهة</button></div></main>`;
  const D = await ACD.load(org);
  if(!ACD.mine()) VW.log(org,"profile","فتح ملف الأكاديمية");
  const live = D.allM.find(m=>m.status==="live" && (String(m.title||"").indexOf(org.replace("أكاديمية ",""))>=0));
  const groups = [...new Set(D.players.map(p=>ACD.grpOf(p.age)).filter(g=>g&&g!=="SEN"))].sort();
  const gk = D.coaches.some(c=>/حراس/.test(c.pos||"")) || D.certs.some(c=>/حراس/.test(c.level||""));
  const est = D.tr.filter(t=>/اعتماد|أُنشئت/.test(t.action||"") && String(t.actor||"").indexOf(org)>=0).slice(-1)[0];
  const parents = D.views.filter(v=>v.viewer_role==="guardian").length;
  const stats = [["لاعبًا",D.players.length,"#faf8f3"],["خرّيجًا",D.alumni.length,"#f5c518"],["حضور",D.attPct!=null?D.attPct+"%":null,"#faf8f3"],["مدربًا معتمدًا",D.certs.filter(c=>c.verified_by).map(c=>c.person).filter((v,i,a)=>a.indexOf(v)===i).length,"#f5c518"]];
  const you = [
    ["head-guardian-male","وليّ أمر — أبحث لابني عن مكان","المقاعد الحقيقية · تجربة مجانية · ما يصلك بعد كل حصة","acadTeams","50% 50% 50% 10px"],
    ["player-violet","لاعب — أريد الانضمام","حسابك يبقى لك، وسجلك يبدأ من أول حصة","acadTeams","50% 50% 50% 10px"],
    ["scout","كشّاف — أبحث عن مواهب","أحداث موثّقة · الاطلاع على القاصر بإذن وليّه","acadPride","50% 50% 50% 10px"],
    ["fan-male","مشجّع — أتابع وأتوقّع","المباشر · التوقّع · لاعب الشهر · المدرّج","acadHub","50% 50% 50% 10px"],
    ["organizer","راعٍ أو شريك — أريد أثرًا مُقاسًا","رعاة الموسم · تقرير أثر من نشاط موثّق","acadNet","12px"]
  ];
  const accredited = D.tr.some(t=>/اعتماد/.test(t.action||"") && String(t.action).indexOf(org.replace("أكاديمية","").trim())>=0 && !/طلب/.test(t.action));
  const nt = D.alumni.filter(a=>a.dest_kind==="nt").length, clubs = D.alumni.filter(a=>a.dest_kind==="club").length;

  return `<div style="position:relative;height:400px;background:#151a2e;overflow:hidden;border-radius:0 0 36px 36px">
    <img src="avatars/hero-stands.png" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,26,46,.55) 0%,rgba(21,26,46,.05) 35%,rgba(21,26,46,.25) 60%,rgba(21,26,46,.97) 100%)"></div>
    <div style="position:absolute;top:18px;inset-inline:18px;display:flex;justify-content:space-between;align-items:center">
      <button onclick="${ACD.mine()?"go('hub')":"back()"}" style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">${ACD.mine()?"☰":"→"}</button>
      ${WM(1)}
      <button onclick="shareCard('${ACD.esn(org)}')" style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);display:grid;place-items:center;font-size:14px;color:#faf8f3;cursor:pointer;font-family:Cairo">⇪</button>
    </div>
    ${live?`<button onclick="go('matchView','${live.id}')" style="position:absolute;top:74px;inset-inline-start:18px;display:inline-flex;align-items:center;gap:6px;background:#e8531f;color:#fff;border:0;border-radius:999px;padding:6px 12px;font:900 10.5px Cairo;cursor:pointer"><span style="width:7px;height:7px;border-radius:50%;background:#fff;animation:pulse 1.4s infinite"></span>مباشر الآن · ${esc(live.title)}${live.score_a!=null?` <span class="ltr">${live.score_a}–${live.score_b}</span>`:""}</button>`:""}
    <div style="position:absolute;bottom:0;inset-inline:0;padding:0 18px 20px;color:#faf8f3">
      <div style="display:flex;align-items:flex-end;gap:14px">
        <span style="width:78px;height:78px;border-radius:20px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:34px;font-weight:900;flex:none;border:4px solid #faf8f3;box-shadow:0 14px 34px rgba(21,26,46,.35)">${esc(org.replace("أكاديمية","").trim()[0]||"أ")}</span>
        <div style="flex:1;min-width:0;padding-bottom:4px">
          ${accredited?`<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(245,197,24,.18);border:1px solid rgba(245,197,24,.5);color:#f5c518;border-radius:999px;padding:3px 10px;font-size:9.5px;font-weight:900">★ معتمدة من الاتحاد</span>`:`<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);color:#c6cade;border-radius:999px;padding:3px 10px;font-size:9.5px;font-weight:900">أكاديمية</span>`}
          <b style="display:block;font-size:26px;font-weight:900;line-height:1.2;margin-top:6px">${esc(org)}</b>
          <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${groups.length?`<span class="ltr">${groups.length}</span> فئات`:"فئات قيد التكوين"}${gk?" وتدريب حراس":""}${D.coaches.length?` · <span class="ltr">${D.coaches.length}</span> مدربين`:""}</span>
        </div></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:16px">
        ${stats.map(([k,v,ink])=>`<div style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:9px 6px;text-align:center"><b class="ltr" style="display:block;font-size:19px;color:${v?ink:"#8a93b0"}">${v||ACD.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:1px">${k}</span></div>`).join("")}
      </div>
    </div>
  </div>
  <main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button onclick="go('acadTeams','${ACD.esn(org)}')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">سجّل ابنك — تجربة مجانية</button>
      <button onclick="acFollow('${ACD.esn(org)}')" style="background:#fff;border:1px solid #e9e4d8;color:#151a2e;border-radius:14px;padding:13px;font:900 12.5px Cairo;cursor:pointer">تابع${D.follows?` · <span class="ltr">${D.follows}</span>`:""}</button>
    </div>
    ${ACD.tabs("acadHome")}
    ${ACD.card(`${ACD.h("أنت هنا لأنك…")}
      ${you.map(([img,t,s,v,r])=>`<button onclick="go('${v}','${ACD.esn(org)}')" style="width:100%;display:flex;gap:11px;align-items:center;padding:11px 0;border:0;border-top:1px solid #f0ece2;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
        <img src="avatars/${img}.png" alt="" style="width:40px;height:40px;border-radius:${r};object-fit:cover;object-position:top;background:#efedff;flex:none">
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${t}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${s}</span></div>
        <span style="flex:none;font-size:14px;color:#4636e3">←</span></button>`).join("")}`)}
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ACD.disc("#f5c518",.14)}
      <div style="position:relative">
        <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">لماذا ${esc(org.replace("أكاديمية","").trim())} — بأرقام موثّقة لا وعود</span>
        <b style="display:block;font-size:16px;font-weight:900;margin-top:6px;line-height:1.5">${[clubs?`<span class="ltr">${clubs}</span> خرّيجًا في الأندية`:"",nt?`<span class="ltr">${nt}</span> في المنتخبات السنية`:"",D.attPct!=null?`حضور <span class="ltr">${D.attPct}%</span>`:"",D.evs.length?`<span class="ltr">${D.evs.length}</span> حدثًا وقّعه حكّام`:""].filter(Boolean).join(" · ")||"السجل يبدأ من أول حصة موثّقة"}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:6px">كل رقم من سجل المنصة باسم من سجّله — لا نطبع «الأفضل» ولا «١٠٠٪».</span>
      </div></div>
  </main>`;
};
window.acFollow = async org => {
  const {error} = await sb.from("follows").insert({follower_id:ME.id, target_type:"org", target_name:org});
  if(error) return toast(/duplicate/.test(error.message)?"أنت تتابعها":"تعذّر: "+error.message, 1);
  toast("تتابع "+org+" — تصلك مبارياتها وفعالياتها"); render();
};

/* ═══════════ 10b · الفخر ═══════════ */
T.acadPride = async () => {
  const org = ACD.who(); const D = await ACD.load(org);
  const seasonTop = D.tro.sort((a,b)=>(b.won||0)-(a.won||0))[0];
  const ACC = D.accredit;
  const TRO = [
    ...D.tro.map(t=>({icon:"★",t:t.name+(t.stage?" — "+t.stage:""),y:String(t.created_at||"").slice(0,4),gold:/بطل|وصيف|نهائي/.test(t.stage||"")})),
    ...(ACC?[{icon:"✓",t:"اعتماد الاتحاد",y:String(ACC.from_year||""),dark:true}]:[]),
    ...(D.att.length>=1000?[{icon:"▤",t:"١٠٠٠ حصة موثّقة",y:"",vi:true}]:D.att.length>=100?[{icon:"▤",t:"١٠٠ حصة موثّقة",y:"",vi:true}]:[])
  ];
  const kinds = {}; D.alumni.forEach(a=>kinds[a.dest_kind]=(kinds[a.dest_kind]||0)+1);
  const KD = {club:["أندية","#4636e3","#efedff"],nt:["منتخبات سنية ★","#c78c00","#fff8df"],cup:["بطولات كبرى","#4636e3","#efedff"],uni:["ابتعاث","#4636e3","#efedff"]};
  const kk = Object.entries(kinds);
  const goals = D.evs.filter(e=>e.type==="goal").length, cards = D.evs.filter(e=>e.type==="yellow"||e.type==="red").length;
  const mCount = new Set(D.evs.map(e=>e.match_id)).size;
  const nums = [["مباراة موثّقة",mCount,"#151a2e"],["هدفًا مسجَّلًا",goals,"#4636e3"],["بطاقة/مباراة",mCount?(cards/mCount).toFixed(1):null,"#151a2e"],["حصة موثّقة",D.att.length,"#151a2e"],["مدربًا معتمدًا",[...new Set(D.certs.filter(c=>c.verified_by).map(c=>c.person))].length,"#c78c00"]];

  return ACD.head("الفخر","وش حقّقتم؟ — الإنجازات والخرّيجون") + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${ACD.tabs("acadPride")}
    <div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;min-height:230px;display:flex;align-items:flex-end">
      <img src="assets/cv-night-strike.png" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.8">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,26,46,0) 20%,rgba(21,26,46,.96) 100%)"></div>
      <div style="position:relative;padding:18px;color:#faf8f3">
        ${seasonTop?`<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(245,197,24,.18);border:1px solid rgba(245,197,24,.5);color:#f5c518;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">★ إنجاز الموسم</span>
          <b style="display:block;font-size:20px;font-weight:900;line-height:1.35;margin-top:8px">${esc(seasonTop.name)}${seasonTop.stage?" — "+esc(seasonTop.stage):""}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:4px"><span class="ltr">${seasonTop.played||ACD.dash}</span> مباراة · فاز <span class="ltr">${seasonTop.won||0}</span> · سجّلها ${esc(seasonTop.created_by||"المنظم")}</span>`
        :`<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);color:#c6cade;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">الموسم الجاري</span>
          <b style="display:block;font-size:20px;font-weight:900;line-height:1.35;margin-top:8px">${mCount?`<span class="ltr">${mCount}</span> مباراة موثّقة هذا الموسم`:"الإنجاز يُكتب من أول بطولة موثّقة"}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:4px">${goals?`<span class="ltr">${goals}</span> هدفًا وقّعها حكّامها`:"لا نطبع إنجازًا بلا مصدر"}</span>`}
      </div></div>
    ${ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h("خزانة الدروع")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">الذهبي يُكتسب — كل درع بمصدره</span></div>
      ${TRO.length?`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px">
        ${TRO.slice(0,8).map(t=>`<div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:5px"><span style="width:58px;height:58px;border-radius:16px;display:grid;place-items:center;font-size:22px;background:${t.gold?"linear-gradient(160deg,#f5c518,#c78c00)":t.dark?"#151a2e":t.vi?"#efedff":"#fff8df"};color:${t.gold?"#151a2e":t.dark?"#f5c518":t.vi?"#4636e3":"#c78c00"};border:1px solid ${t.gold?"#c78c00":t.dark?"#151a2e":t.vi?"#efedff":"#f0e2b4"}">${t.icon}</span><span style="font-size:9px;font-weight:900;color:#151a2e;line-height:1.4">${esc(t.t)}</span>${t.y?`<span class="ltr" style="font-size:8.5px;font-weight:800;color:#8a8fa5">${t.y}</span>`:""}</div>`).join("")}</div>`
      :`<div style="margin-top:10px">${ACD.empty("الخزانة فارغة بعد — أول بطولة يسجّلها منظّمها تدخل هنا")}</div>`}`)}
    ${ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h(`من خرّجناهم — <span class="ltr">${D.alumni.length||ACD.dash}</span>`)}<span style="font-size:10px;color:#8a8fa5;font-weight:800">بشهادة مدربيهم</span></div>
      ${kk.length?`<svg viewBox="0 0 340 118" style="width:100%;height:118px;display:block;margin-top:10px">
        ${kk.map((k,i)=>{const n=kk.length,x=n===1?170:40+i*(260/(n-1));const K=KD[k[0]]||KD.club;
          return `<path d="M170 106 C 170 80, ${x} 84, ${x} 44" fill="none" stroke="${k[0]==="nt"?"#f5c518":"#b9b0f5"}" stroke-width="${k[0]==="nt"?2.5:2}"></path>
          <circle cx="${x}" cy="30" r="16" fill="${K[2]}" stroke="${K[1]}" stroke-width="1.5"></circle><text x="${x}" y="34" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="11" fill="${K[1]}">${k[1]}</text>
          <text x="${x}" y="8" text-anchor="middle" font-family="Cairo" font-weight="800" font-size="8.5" fill="${K[1]}">${K[0]}</text>`;}).join("")}
        <rect x="140" y="96" width="60" height="20" rx="8" fill="#151a2e"></rect><text x="170" y="110" text-anchor="middle" font-family="Cairo" font-weight="900" font-size="9" fill="#f5c518">${esc(org.replace("أكاديمية","").trim())}</text></svg>
      ${D.alumni.slice(0,4).map(a=>{const K=KD[a.dest_kind]||KD.club;
        return `<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
          ${PL3.av(a.player_name,40,{dark:true,r:"50% 50% 50% 10px"})}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(a.player_name)}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${a.group_name?`<span class="ltr">${esc(a.group_name)}</span> · `:""}انتقل <span class="ltr">${a.dest_year||ACD.dash}</span> · أشرف عليه ${esc(a.coach_name)}</span></div>
          <span style="flex:none;background:${K[2]};color:${K[1]};border-radius:999px;padding:5px 10px;font-size:9.5px;font-weight:900">${esc(a.dest).split("—")[0].trim()}</span></div>`;}).join("")}
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:9px;line-height:1.8">يظهر الخرّيج هنا بشهادة المدرب الذي أشرف عليه — ويظهر في «متخرّجون من تحت إدارتك» في ملفه.</span>`
      :`<div style="margin-top:10px">${ACD.empty("لا خرّيجين مسجّلين بعد — يسجّلهم المدربون في ملفاتهم فيظهرون هنا")}</div>`}`)}
    ${ACD.card(`${ACD.h("أرقام الموسم — موثّقة")}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:11px">
        ${nums.map(([k,v,ink])=>`<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:14px;padding:10px 8px;text-align:center"><b class="ltr" style="display:block;font-size:18px;color:${v?ink:"#b0b5c6"}">${v||ACD.dash}</b><span style="display:block;font-size:9px;color:#8a8fa5;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}
      </div>`)}
  </main>`;
};

/* ═══════════ 10c · الفرق والتجارب ═══════════ */
T.acadTeams = async () => {
  const org = ACD.who(); const D = await ACD.load(org);
  const byG = {}; D.players.forEach(p=>{const g=ACD.grpOf(p.age); if(g&&g!=="SEN") (byG[g]=byG[g]||[]).push(p);});
  const coachOf = g => D.coaches.find(c=>String(c.pos||"").indexOf(g)>=0) || D.coaches[0];
  const certOf = n => { const c=D.certs.find(x=>x.person===n && x.level); return c?"رخصة "+c.level:""; };
  const feeOf = g => { const s=D.subs.filter(x=>x.group_name===g); return s.length?Math.round(s.reduce((a,b)=>a+(+b.amount||0),0)/s.length):null; };
  const CAP = 22;
  const openTry = D.tryouts.filter(t=>t.status==="open"||t.status==="pending").length;
  const gk = D.coaches.filter(c=>/حراس/.test(String(c.pos||"")+String(c.name||"")));
  const cards = Object.entries(byG).sort().map(([g,arr])=>{
    const c=coachOf(g), fee=feeOf(g), seats=Math.max(0,CAP-arr.length);
    return {g, n:arr.length, t:g==="U10"?"براعم":g==="U12"?"أشبال":g==="U14"||g==="U16"?"ناشئون":g==="U18"?"شباب":"الفريق", s:`${fee?`<span class="ltr">${fee}</span> ر.س/شهر`:"الرسوم عند التسجيل"} · مسجَّلون <span class="ltr">${arr.length}</span>`,
      seats: seats>3?seats+" مقاعد":seats>0?seats+" مقاعد أخيرة":"مكتمل — قائمة انتظار", seatInk: seats>3?"#2c6e49":seats>0?"#c78c00":"#8a8fa5",
      coach:c, cert:c?certOf(c.name):"", cta: seats>0?"سجّل":"انتظر"};
  });
  const nextTry = D.tryouts.find(t=>t.status==="open");
  const parentGets = [["✓","إشعار حضور ابنك لحظة تسجيله — باسم من سجّله"],["▤","تقييم المدرب بتوقيعه — يغني عن مجموعة الواتساب"],["🔒","الطبي والتعاقد وحدهما يستأذنانك — وما دونهما يمضي بإذنك الأول"],["▮","كل ريال عبر المنصة بإيصال — والإلغاء بسبب مكتوب يردّ المبلغ"]];

  return ACD.head("وين ابنك فيكم؟",`${cards.length?`<span class="ltr">${cards.length}</span> فئات · `:""}المقاعد المتاحة حقيقية — تُحدَّث من الكشوف`) + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${ACD.tabs("acadTeams")}
    ${cards.length?cards.map(t=>`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 15px;display:flex;gap:12px;align-items:center">
      <span style="width:54px;height:54px;border-radius:14px;display:grid;place-items:center;flex:none;background:${t.cta==="انتظر"?"#f2f0ea":"#efedff"};color:${t.cta==="انتظر"?"#8a8fa5":"#4636e3"}"><span class="ltr" style="font-size:15px;font-weight:700">${esc(t.g)}</span></span>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-size:12.5px;font-weight:900">${t.t}</b><span style="font-size:10px;font-weight:900;color:${t.seatInk}">${t.seats}</span></div>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${t.s}</span>
        <div style="display:flex;align-items:center;gap:8px;margin-top:7px">
          ${t.coach?PL3.av(t.coach.name,22,{role:"coach",url:t.coach.avatar_url,dark:true,r:"50% 50% 6px 50%"}):""}
          <span style="font-size:9.5px;font-weight:800;color:#5b6078">${t.coach?esc(t.coach.name)+(t.cert?" · "+t.cert:""):"يُعلَن — معتمد فقط"}</span>
          <button onclick="acApply('${ACD.esn(org)}','${t.g}')" style="margin-inline-start:auto;background:none;border:0;font:900 10px Cairo;color:#4636e3;cursor:pointer;padding:0">${t.cta} ←</button></div></div></div>`).join("")
    :ACD.empty("لا فئات مسجّلة بعد — تظهر من كشوف الأكاديمية")}
    ${gk.length?`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 15px;display:flex;gap:12px;align-items:center">
      <span style="width:54px;height:54px;border-radius:14px;display:grid;place-items:center;flex:none;background:#efedff;color:#4636e3"><span class="ltr" style="font-size:15px;font-weight:700">GK</span></span>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">مدرسة الحراس — كل الفئات</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">حصتان تخصصيتان</span>
        <div style="display:flex;align-items:center;gap:8px;margin-top:7px">${PL3.av(gk[0].name,22,{role:"coach",dark:true,r:"50% 50% 6px 50%"})}<span style="font-size:9.5px;font-weight:800;color:#5b6078">${esc(gk[0].name)} · مدرب حراس</span></div></div></div>`:""}
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ACD.disc()}
      <div style="position:relative">
        <span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">تجربة أداء ${nextTry?"مفتوحة":""}</span>
        <b style="display:block;font-size:17px;font-weight:900;margin-top:5px;line-height:1.4">${nextTry?`<span class="ltr">${esc(nextTry.group_name||"")}</span> — ${esc(nextTry.note||"مقر الأكاديمية")} · مجانية`:"تُعلَن التجربة القادمة هنا"}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:5px;line-height:1.8">${openTry?`<span class="ltr">${openTry}</span> مسجَّلًا · `:""}إذن وليّ الأمر يُعطى مرة واحدة عند فتح الحساب — ولا يُستأذن في كل تسجيل.</span>
        <button onclick="acApply('${ACD.esn(org)}','${ACD.esn(nextTry?nextTry.group_name:"")}')" style="margin-top:12px;background:#f5c518;color:#151a2e;border:0;border-radius:14px;padding:11px 16px;font:900 12px Cairo;cursor:pointer">سجّل ابنك للتجربة</button>
      </div></div>
    ${ACD.card(`${ACD.h("ما يحصل عليه وليّ الأمر")}
      ${parentGets.map(([i,t])=>`<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">${ACD.sq(i,"#efedff","#4636e3",30)}<span style="flex:1;min-width:0;font-size:11.5px;font-weight:700;color:#5b6078;line-height:1.7">${t}</span></div>`).join("")}`)}
  </main>`;
};
window.acApply = async (org, grp) => {
  if(!ME) return toast("سجّل دخولك أولًا",1);
  const nm = prompt("اسم اللاعب:", ME.role==="player"?ME.name:""); if(!nm) return;
  const age = +prompt("عمره:", "") || null;
  const {error} = await sb.from("pi_tryouts").insert({org, applicant:nm, age, group_name:grp||ACD.grpOf(age)||"", guardian_ok:ME.role==="guardian"||age>=18, guardian_name:ME.role==="guardian"?ME.name:null, status:"pending", created_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`طلب تجربة أداء — ${nm} في ${org}`);
  toast(age&&age<18&&ME.role!=="guardian"?"سُجّل الطلب — يُستكمل بإذن وليّ الأمر":"سُجّل الطلب — تصلك النتيجة باسم من قرّرها");
};

/* ═══════════ 10d · الشبكة والرعاة ═══════════ */
T.acadNet = async () => {
  const org = ACD.who(); const D = await ACD.load(org);
  const cnt = (role) => D.views.filter(v=>v.viewer_role===role).map(v=>v.viewer).filter((v,i,a)=>a.indexOf(v)===i).length;
  const refs = [...new Set(D.matches.map(m=>m.referee_name).filter(Boolean))].length;
  const clubs = [...new Set(D.matches.flatMap(m=>[m.team_a,m.team_b]).filter(x=>x&&String(x).indexOf(org)<0))].length;
  const venues = [...new Set(D.matches.map(m=>m.venue).filter(Boolean))].length;
  const sponsors = D.sponsors;
  const ring = [["رعاة",sponsors.length,"★","#fff8df","#f0e2b4","#c78c00"],["الاتحاد",D.accredit?1:0,"◈","#151a2e","#151a2e","#f5c518"],["ملاعب",venues,"🏟","#eef1f5","#d9dfe5","#5a6a7c"],["أندية",clubs,"◉","#efedff","#efedff","#4636e3"],["حكّام",refs,"▮","#fff","#e9e4d8","#151a2e"],["كشّافون",cnt("scout"),"◎","#fff","#e9e4d8","#151a2e"],["أولياء أمور",cnt("guardian"),"👤","#efedff","#efedff","#4636e3"],["متابعون",D.follows,"👏","#fdeee7","#f6cdba","#e8531f"]];
  const pos=(deg,r)=>{const a=deg*Math.PI/180;return [(50+r*Math.cos(a)).toFixed(1),(50+r*Math.sin(a)).toFixed(1)];};
  const partners = [
    ...(D.accredit?[["◈","#151a2e","#f5c518","اعتماد الاتحاد",`سارٍ${D.accredit.to_year?` حتى <span class="ltr">${D.accredit.to_year}</span>`:""} — ${esc(D.accredit.issuer||"")}`,"accredit"]]:[]),
    ...(venues?[["🏟","#eef1f5","#5a6a7c",`<span class="ltr">${venues}</span> ملاعب`,"تُلعب فيها مبارياتنا الموثّقة","explore"]]:[]),
    ...(clubs?[["◉","#efedff","#4636e3",`<span class="ltr">${clubs}</span> أندية شريكة`,"وديات ومباريات موثّقة","explore"]]:[]),
    ...(cnt("scout")?[["◎","#fff","#151a2e",`<span class="ltr">${cnt("scout")}</span> كشّافًا يتابعون`,"يرون الأحداث الموثّقة — والقاصر بإذن وليّه","acadPride"]]:[])
  ];

  return ACD.head(`شبكة ${esc(org.replace("أكاديمية","").trim())}`,"النواة التي يلتقي حولها الجميع") + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${ACD.tabs("acadNet")}
    ${ACD.card(`<div style="position:relative;width:100%;aspect-ratio:1/1;max-width:330px;margin:0 auto">
      <span style="position:absolute;inset:8%;border-radius:50%;border:1px dashed #d9d3c4"></span>
      <span style="position:absolute;inset:26%;border-radius:50%;border:1px dashed #d9d3c4"></span>
      <span style="position:absolute;inset:0;border-radius:50%;animation:orbit 30s linear infinite"><span style="position:absolute;top:8%;left:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#4636e3"></span></span>
      <span style="position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px;border-radius:24px;background:#151a2e;color:#f5c518;display:grid;place-items:center;font-size:30px;font-weight:900;box-shadow:0 14px 34px rgba(21,26,46,.25)">${esc(org.replace("أكاديمية","").trim()[0]||"أ")}</span>
      ${ring.map((o,i)=>{const [x,y]=pos(-90+i*45,40);
        return `<div style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px;width:70px">
          <span style="width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:16px;background:${o[3]};color:${o[5]};border:1px solid ${o[4]}">${o[2]}</span>
          <span style="font-size:8.5px;font-weight:900;color:#151a2e;text-align:center;line-height:1.3">${o[0]}</span>
          <span class="ltr" style="font-size:9px;font-weight:700;color:${o[1]?"#4636e3":"#b0b5c6"}">${o[1]||ACD.dash}</span></div>`;}).join("")}
    </div>
    <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:6px;text-align:center">كل عدد من علاقة موثّقة في المنصة — مباراة أو تعيين أو متابعة أو اطّلاع.</span>`)}
    ${ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h("رعاة الموسم")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">الذهبي للراعي الرئيسي</span></div>
      ${sponsors.length?sponsors.slice(0,4).map((s,i)=>i===0?`<div style="margin-top:12px;background:#151a2e;border-radius:18px;padding:16px;display:flex;gap:12px;align-items:center;color:#faf8f3">
        ${ACD.sq("★","#f5c518","#151a2e",56)}<div style="flex:1;min-width:0"><span style="display:block;font-size:9.5px;color:#f5c518;font-weight:900">★ الراعي ${esc(s.tier||"الرئيسي")}</span><b style="display:block;font-size:13.5px;font-weight:900;margin-top:2px">${esc(s.title)}</b><span style="display:block;font-size:10px;color:#c6cade;font-weight:700;margin-top:2px">سجّلته ${esc(s.verified_by||org)}${s.from_year?` · موسم <span class="ltr">${s.from_year}</span>`:""}</span></div></div>`
        :`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">${ACD.sq("★","#fff8df","#c78c00",32)}<div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(s.title)}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:800;margin-top:2px">راعي ${esc(s.tier||"داعم")}</span></div></div>`).join("")
      :`<div style="margin-top:10px">${ACD.empty("لا رعاة مسجَّلين هذا الموسم")}</div>`}
      <div style="margin-top:12px;background:#fff8df;border:1px solid #f0e2b4;border-radius:14px;padding:12px 13px;display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div><b style="display:block;font-size:11.5px;color:#8a6912">ارعَ الموسم القادم</b><span style="display:block;font-size:10px;color:#8a6912;font-weight:700;margin-top:2px">تقرير أثر مُقاس من نشاط موثّق — لا تقديرات</span></div>
        <button onclick="go('messages')" style="flex:none;background:#151a2e;color:#f5c518;border:0;border-radius:12px;padding:9px 13px;font:900 10.5px Cairo;cursor:pointer">تواصل</button></div>`)}
    ${ACD.card(`${ACD.h("شركاء التشغيل")}
      ${partners.length?partners.map(([i,bg,ink,t,s,v])=>`<button onclick="go('${v}')" style="width:100%;display:flex;gap:11px;align-items:center;padding:10px 0;border:0;border-top:1px solid #f0ece2;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
        ${ACD.sq(i,bg,ink,36)}<div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${t}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${s}</span></div><span style="flex:none;font-size:10px;font-weight:900;color:#4636e3">←</span></button>`).join("")
      :`<div style="margin-top:10px">${ACD.empty("الشركاء يظهرون من مباريات وتعيينات موثّقة")}</div>`}`)}
  </main>`;
};

/* ═══════════ 10e · المجتمع ═══════════ */
T.acadHub = async () => {
  const org = ACD.who(); const D = await ACD.load(org);
  const short = org.replace("أكاديمية","").trim();
  const next = D.allM.find(m=>(m.status==="live"||m.status==="today"||m.status==="open") && String(m.title||"").indexOf(short)>=0);
  const pk = "pi_pred_"+(next&&next.id);
  const my = (()=>{try{return localStorage.getItem(pk)}catch(e){return null}})();
  const month = new Date().toISOString().slice(0,7);
  const tally = {}; D.evs.filter(e=>String(e.created_at||"").startsWith(month)&&(e.type==="goal"||e.type==="assist")).forEach(e=>tally[e.who]=(tally[e.who]||0)+1);
  const poll = Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const tot = poll.reduce((s,p)=>s+p[1],0)||1;
  const ROLE = {player:["لاعب","#efedff","#4636e3"],coach:["مدرب","#fff8df","#c78c00"],guardian:["وليّ أمر","#efedff","#4636e3"],scout:["كشّاف","#eef1f5","#5a6a7c"],fan:["مشجّع","#fdeee7","#e8531f"],academy:["الجهة","#151a2e","#f5c518"],organizer:["منظّم","#eef1f5","#5a6a7c"]};
  const EVL = {goal:"سجّل هدفًا",assist:"صنع هدفًا",yellow:"نال إنذارًا",red:"نال طردًا",sub:"شارك تبديلًا"};
  const wall = [
    ...D.evs.slice(0,4).map(e=>({who:e.who,role:"لاعب",txt:`${EVL[e.type]||"حدث"} في ${(e.matches&&e.matches.title)||"مباراة"} — الدقيقة ${e.minute} · سجّله ${e.recorded_by}`,at:e.created_at})),
    ...[...new Set(D.att.map(x=>String(x.created_at||"").slice(0,10)))].slice(0,2).map(d=>{const n=D.att.filter(x=>String(x.created_at||"").slice(0,10)===d);
      return {who:(n[0]&&n[0].recorded_by)||"المدرب",role:"مدرب",txt:`وقّع حضور ${n.length} لاعبًا في حصة ${d}`,at:d};}),
    ...D.alumni.slice(0,2).map(al=>({who:al.coach_name,role:"مدرب",txt:`شهد بتخرّج ${al.player_name} إلى ${String(al.dest).split("—")[0].trim()}`,at:al.created_at}))
  ].sort((x,y)=>new Date(y.at)-new Date(x.at)).slice(0,6);

  return ACD.head("المجتمع",`${D.follows?`<span class="ltr">${D.follows}</span> متابع · `:""}وش أسوي هنا؟ — التصويت والتفاعل`) + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${ACD.tabs("acadHub")}
    ${false?`<div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ACD.disc("#e8531f",.9)}
      <div style="position:relative">
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:900;color:#fff"><span style="width:7px;height:7px;border-radius:50%;background:#fff;animation:pulse 1.4s infinite"></span>${next.status==="live"?"مباشر — التوقّع مغلق":"توقّع مفتوح — يُغلق عند الصافرة"}</span>
        <b style="display:block;font-size:17px;font-weight:900;margin-top:6px">${esc(next.title)} — من يفوز؟</b>
        <div style="display:flex;gap:6px;margin-top:12px">
          ${[["a",esc(next.team_a||short)],["d","تعادل"],["b",esc(next.team_b||"الخصم")]].map(([k,lb])=>`<button onclick="acPredict('${next.id}','${k}')" ${next.status==="live"?"disabled":""} style="flex:1;text-align:center;background:${my===k?"#faf8f3":"rgba(255,255,255,.14)"};color:${my===k?"#151a2e":"#faf8f3"};border:1px solid ${my===k?"#faf8f3":"rgba(255,255,255,.3)"};border-radius:12px;padding:10px 4px;font:900 11px Cairo;cursor:pointer">${lb}</button>`).join("")}</div>
        <span style="display:block;font-size:10px;color:#ffd9c8;font-weight:800;margin-top:8px">${my?"توقّعك مسجَّل — يُقارن بالنتيجة الموثّقة":"توقّعك اجتماعي — لا يمسّ نتيجة ولا تقييمًا"}</span>
      </div></div>`:""}
    ${false?ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h("لاعب الشهر — من الأحداث الموثّقة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">اجتماعي · لا يدخل التقييم</span></div>
      ${poll.length?poll.map(([n,c],i)=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        ${PL3.av(n,40,{dark:true,r:"50% 50% 50% 10px"})}
        <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:900"><span>${esc(n)}</span><b class="ltr" style="color:${i===0?"#4636e3":"#b9b0f5"}">${Math.round(c/tot*100)}%</b></div><div style="height:7px;background:#f0ece2;border-radius:99px;overflow:hidden;margin-top:6px"><div style="height:100%;background:${i===0?"#4636e3":"#b9b0f5"};width:${Math.round(c/tot*100)}%"></div></div><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:4px"><span class="ltr">${c}</span> ${c===1?"حدث موثّق":"أحداث موثّقة"} هذا الشهر</span></div>
        <button onclick="clapPlayer('${ACD.esn(n)}')" style="background:#efedff;color:#4636e3;border:0;border-radius:10px;padding:8px 10px;font:900 11px Cairo;cursor:pointer;flex:none">👏</button></div>`).join("")
      :`<div style="margin-top:10px">${ACD.empty("لا أحداث موثّقة هذا الشهر بعد — المرشّحون يظهرون من الأهداف والصناعات التي يوقّعها الحكّام")}</div>`}
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:9px;line-height:1.8">التصويت على قاصر بإذن وليّه فقط.</span>`):""}
    ${ACD.card(`<div style="display:flex;gap:11px;align-items:center">${ACD.sq("★","#fff8df","#c78c00",40)}<div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px">التوقّع ولاعب الشهر في الواجهة</b>${ACD.sub("جمعناهما مع البطاقة ليراهما كل زائر من أول شاشة")}</div><button onclick="go('acadHome','${ACD.esn(org)}')" style="flex:none;background:#151a2e;color:#f5c518;border:0;border-radius:12px;padding:9px 13px;font:900 10.5px Cairo;cursor:pointer">افتح ←</button></div>`)}
    ${ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h("الساحة — ما جرى حول "+esc(short))}<span style="font-size:10px;color:#8a8fa5;font-weight:800">كل سطر باسم صاحبه</span></div>
      ${wall.length?wall.map(w=>{const R=(w.role==="مدرب"?ROLE.coach:ROLE.player);
        return `<div style="display:flex;gap:10px;align-items:flex-start;padding:11px 0;border-top:1px solid #f0ece2">
          ${PL3.av(w.who,36,{role:w.role==="مدرب"?"coach":"",dark:true,r:w.role==="مدرب"?"50% 50% 9px 50%":"50% 50% 50% 9px"})}
          <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><b style="font-size:11.5px">${esc(w.who)}</b><span style="background:${R[1]};color:${R[2]};border-radius:999px;padding:2px 8px;font-size:8.5px;font-weight:900">${esc(w.role)}</span><span style="font-size:9px;color:#8a8fa5;font-weight:700">${VW.rel(w.at)}</span></div>
            <span style="display:block;font-size:11px;font-weight:700;color:#151a2e;line-height:1.75;margin-top:4px">${esc(w.txt)}</span></div></div>`;}).join("")
      :`<div style="margin-top:10px">${ACD.empty("الساحة تمتلئ من نشاط موثّق — حضور، أحداث، تصحيحات")}</div>`}`)}
    ${ACD.note("التعليق باسمك وبدورك — وممنوع على النتائج الموثّقة. لا محادثة خاصة بين بالغ وقاصر: الكشّاف يسأل الأكاديمية أو وليّ الأمر، لا الطفل.")}
  </main>`;
};
window.acPredict = async (mid,k) => { try{ localStorage.setItem("pi_pred_"+mid,k); }catch(e){} toast("سُجّل توقّعك — يُقارن بالنتيجة الموثّقة"); render(); };

/* ═══════════ 10f · الوسائط ═══════════ */
T.acadMedia = async () => {
  const org = ACD.who(); const D = await ACD.load(org);
  const f = (()=>{try{return localStorage.getItem("pi_acmf")||"all"}catch(e){return "all"}})();
  const all = D.media.map(m=>({m, tag: m.event_type==="goal"?"⚽ هدف":m.event_id?"✓ موثّقة":/حصة|تدريب/.test(m.label||"")?"حصة":/فعالية|يوم/.test(m.label||"")?"فعالية":"لقطة", k: m.event_type==="goal"?"goal":/حصة|تدريب/.test(m.label||"")?"train":/فعالية|يوم/.test(m.label||"")?"event":"other"}));
  const shown = f==="all"?all:all.filter(x=>x.k===f);
  const hero = all.find(x=>x.k==="goal")||all[0];
  const rules = [["✓","#eaf5ee","#2c6e49","الصورة تُحيي الشاشة ولا تصدّق رقمًا — كل لقطة مربوطة بحدث موثّق باسم من سجّله"],["👤","#efedff","#4636e3","صور القاصرين جماعية وبلا أسماء إلا ما أذن به وليّ الأمر لكل صورة"],["▶","#fff8df","#c78c00","اللقطة ملك من صوّرها — والأكاديمية ترخّص نشرها؛ لاعبٌ يطلب إزالة صورته تُزال فورًا"]];

  return ACD.head("الوسائط","ورّوني — صور وفيديو مربوطة بالحدث") + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${ACD.tabs("acadMedia")}
    ${hero?`<div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;aspect-ratio:16/10">
      ${hero.m.kind==="video"?`<video src="${esc(hero.m.url)}" playsinline controls preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>`:`<img src="${esc(hero.m.url)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`}
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,26,46,.1) 40%,rgba(21,26,46,.92) 100%);pointer-events:none"></div>
      <div style="position:absolute;bottom:14px;inset-inline:16px;color:#faf8f3;pointer-events:none">
        <span style="display:inline-flex;align-items:center;gap:5px;background:${hero.m.event_id?"#4636e3":"rgba(255,255,255,.18)"};border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">${hero.tag}${hero.m.minute?` · <span class="ltr">${hero.m.minute}′</span>`:""}</span>
        <b style="display:block;font-size:14px;font-weight:900;margin-top:6px">${esc(hero.m.label||"لقطة")} — ${esc(hero.m.subject)}${hero.m.match_title?` · ${esc(hero.m.match_title)}`:""}</b>
        <span style="display:block;font-size:9.5px;color:#c6cade;font-weight:700;margin-top:2px">${esc(String(hero.m.created_at||"").slice(0,10))} · رفعها ${esc(hero.m.uploaded_by||"صاحبها")}</span></div></div>`
    :`<div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;aspect-ratio:16/10"><img src="assets/cv-night-duel.png" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55"><div style="position:absolute;inset:0;display:grid;place-items:center;padding:20px;text-align:center;color:#faf8f3"><span style="font-size:12px;font-weight:800;line-height:1.8">لا لقطات منشورة بعد — يرفعها اللاعبون من بطاقاتهم، والمربوطة بحدث تحمل «موثّقة»</span></div></div>`}
    <div style="display:flex;gap:6px">
      ${[["all","الكل"],["goal","أهداف"],["train","التدريب"],["event","الفعاليات"]].map(([k,lb])=>`<button onclick="acMf('${k}')" style="flex:1;text-align:center;background:${f===k?"#151a2e":"#fff"};color:${f===k?"#faf8f3":"#5b6078"};border:1px solid ${f===k?"#151a2e":"#e9e4d8"};border-radius:999px;padding:8px;font:900 10.5px Cairo;cursor:pointer">${lb}</button>`).join("")}</div>
    ${shown.length>1?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${shown.slice(hero?1:0,7).map(x=>`<div style="position:relative;border-radius:18px;overflow:hidden;background:#151a2e;aspect-ratio:4/3">
        <img src="${esc(x.m.url)}" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,26,46,0) 45%,rgba(21,26,46,.9) 100%)"></div>
        <span style="position:absolute;top:10px;inset-inline-start:10px;background:${x.m.event_id?"#f5c518":"#efedff"};color:${x.m.event_id?"#151a2e":"#4636e3"};border-radius:999px;padding:3px 8px;font-size:8.5px;font-weight:900">${x.tag}</span>
        <div style="position:absolute;bottom:10px;inset-inline:10px;color:#faf8f3"><b style="display:block;font-size:10.5px;font-weight:900;line-height:1.4">${esc(x.m.label||"لقطة")}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:700;margin-top:2px">${esc(x.m.subject)}</span></div></div>`).join("")}</div>`:""}
    ${ACD.card(`${ACD.h("قاعدة الصورة")}
      ${rules.map(([i,bg,ink,t])=>`<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">${ACD.sq(i,bg,ink,26)}<span style="flex:1;min-width:0;font-size:11.5px;font-weight:700;color:#5b6078;line-height:1.7">${t}</span></div>`).join("")}`)}
  </main>`;
};
window.acMf = k => { try{ localStorage.setItem("pi_acmf",k); }catch(e){} render(); };

/* ═══════════ 10g · الفعاليات والعضوية ═══════════ */
T.acadNext = async () => {
  const org = ACD.who(); const D = await ACD.load(org);
  const short = org.replace("أكاديمية","").trim();
  const today = new Date(); const dow = ["أحد","إثن","ثلا","أرب","خمي","جمع","سبت"];
  const week = [...Array(7)].map((_,i)=>{const d=new Date(today); d.setDate(d.getDate()-d.getDay()+i); const k=d.toISOString().slice(0,10);
    const m = D.allM.some(x=>String(x.match_date||x.created_at||"").slice(0,10)===k && String(x.title||"").indexOf(short)>=0);
    const t = D.tryouts.some(x=>String(x.created_at||"").slice(0,10)===k);
    const tr = D.att.filter(x=>String(x.created_at||"").slice(0,10)===k).length;
    return {d:dow[d.getDay()], m, t, tr, today:k===today.toISOString().slice(0,10)};});
  const mxTr = Math.max(1,...week.map(w=>w.tr));
  const ups = D.allM.filter(m=>(m.status==="open"||m.status==="today") && String(m.title||"").indexOf(short)>=0).slice(0,2);
  const tryo = D.tryouts.find(t=>t.status==="open");
  const events = [
    ...(tryo?[{img:"assets/cv-night-duel2.png",when:"تجربة أداء · مجانية",wi:"#b9b0f5",t:`تجربة أداء ${esc(tryo.group_name||"")}`,s:`${esc(tryo.note||"مقر الأكاديمية")} · التسجيل من وليّ الأمر`,cta:"سجّل ابنك",cb:"#f5c518",ci:"#151a2e",fn:`acApply('${ACD.esn(org)}','${ACD.esn(tryo.group_name||"")}')`}]:[]),
    ...ups.map(m=>({img:"assets/cv-night-kick.png",when:`${esc(m.match_date||"قريبًا")} · ${esc(m.match_time||"")} · ${esc(m.comp||"ودية")}`,wi:"#f5c518",t:esc(m.title),s:`${esc(m.venue||"")} · التوقّع يُغلق عند الصافرة`,cta:"احضر · توقّع",cb:"#fff",ci:"#151a2e",fn:`go('acadHub','${ACD.esn(org)}')`}))
  ];
  const active = D.mem.filter(m=>m.active), tier = active[0], price = tier?tier.price:null;
  const items = D.tr.filter(t=>/متجر|قميص|مزاد/.test(t.action||"")&&String(t.action).indexOf(short)>=0).slice(0,2);

  return ACD.head("وش الجاي؟","الفعاليات والعضوية والمتجر") + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${ACD.tabs("acadNext")}
    ${ACD.card(`${ACD.h("قوس الأسبوع")}
      <div style="display:flex;gap:6px;margin-top:12px;align-items:flex-end;height:70px">
        ${week.map(w=>{const h=w.m?100:w.t?78:w.tr?Math.round(22+w.tr/mxTr*44):8;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end">${w.tr&&!w.m&&!w.t?`<b class="ltr" style="font-size:9px;font-weight:700;color:#8a8fa5">${w.tr}</b>`:""}<span style="width:100%;border-radius:8px 8px 4px 4px;background:${w.m?"#151a2e":w.t?"#4636e3":w.tr?"#c9c2f0":"#f2f0ea"};height:${h}%"></span><span style="font-size:9px;font-weight:900;color:${w.today?"#4636e3":w.m?"#151a2e":"#8a8fa5"}">${w.d}${w.today?" ·":""}</span></div>`;}).join("")}</div>
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:8px">داكن مباراة · بنفسجي تجربة أداء · فاتح حضور تدريب بعدده</span>`)}
    ${events.length?events.map(e=>`<div style="position:relative;border-radius:22px;overflow:hidden;background:#151a2e;min-height:150px;display:flex">
      <img src="${e.img}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:left center;opacity:.7">
      <div style="position:absolute;inset:0;background:linear-gradient(270deg,rgba(21,26,46,.97) 0%,rgba(21,26,46,.85) 55%,rgba(21,26,46,.15) 100%)"></div>
      <div style="position:relative;padding:16px;display:flex;flex-direction:column;gap:6px;width:72%;color:#faf8f3">
        <span style="font-size:10px;font-weight:900;color:${e.wi}">${e.when}</span><b style="font-size:15px;font-weight:900;line-height:1.4">${e.t}</b>
        <span style="font-size:10px;color:#c6cade;font-weight:700;line-height:1.7">${e.s}</span>
        <button onclick="${e.fn}" style="margin-top:4px;align-self:flex-start;background:${e.cb};color:${e.ci};border:0;border-radius:12px;padding:9px 13px;font:900 11px Cairo;cursor:pointer">${e.cta}</button></div></div>`).join("")
    :ACD.empty("لا فعاليات مفتوحة الآن — تُعلَن التجارب والمباريات هنا لحظة إنشائها")}
    ${ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h(`عضوية برايم — ${esc(short)}`)}<span style="font-size:10px;color:#8a8fa5;font-weight:900">معطّلة حاليًا</span></div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:11px">${ACD.sq("★","#f2f0ea","#b0b5c6",48)}<div style="flex:1"><span style="display:block;font-size:10.5px;color:#5b6078;font-weight:800;line-height:1.8">مدرّج الأعضاء · بثّ الحصص · لقاء المدربين · أولوية التجارب</span><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:4px">تُفتح بقرار الأكاديمية — ولا سعر معلن قبل ذلك</span></div></div>
      <button onclick="acPrimeOff()" style="display:block;width:100%;margin-top:11px;background:#f2f0ea;color:#8a8fa5;border:0;border-radius:14px;padding:12px;text-align:center;font:900 12px Cairo;cursor:not-allowed">غير متاحة حاليًا</button>`)}
    ${ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h("المتجر — موثّق المصدر")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">الكشّافون يشترون أيضًا</span></div>
      ${items.length?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px">${items.map(s=>`<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:16px;padding:12px"><span style="display:block;font-size:9.5px;font-weight:900;color:#c78c00">★ موثّق المصدر</span><b style="display:block;font-size:11.5px;font-weight:900;margin-top:4px;line-height:1.4">${esc(s.action)}</b></div>`).join("")}</div>`
      :`<div style="margin-top:10px">${ACD.empty("المتجر يُفتح مع أول منتج موثّق المصدر")}</div>`}
      <button onclick="go('market')" style="display:block;width:100%;margin-top:10px;background:none;border:0;font:900 11px Cairo;color:#4636e3;cursor:pointer">السوق ←</button>`)}
  </main>`;
};

/* ═══════════ التركيب ═══════════ */
(function(){
  Object.assign(TITLES, {acadHome:"الأكاديمية", acadPride:"الفخر", acadTeams:"الفرق والتجارب", acadNet:"الشبكة والرعاة", acadHub:"المجتمع", acadMedia:"الوسائط", acadNext:"الجاي"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE, {acadHome:["الأكاديمية","الصفحة التي تجذب الجميع"], acadPride:["الفخر","وش حقّقتم؟"], acadTeams:["الفرق والتجارب","وين ابنك فيكم؟"], acadNet:["الشبكة والرعاة","من معكم؟"], acadHub:["المجتمع","وش أسوي هنا؟"], acadMedia:["الوسائط","ورّوني"], acadNext:["الجاي","وش الجاي؟"]});
  ACD.OWN = ["acadHome","acadPride","acadTeams","acadNet","acadHub","acadMedia","acadNext"];
  if(typeof NAV!=="undefined")
    NAV.academy = [["◉","بيتي","acadHome"],["▦","الديوان","erp"],["FAB","","hub"],["▶","مبارياتنا","orgMatch"],["☰","الموافقات","approvals"]];
  if(typeof HUB!=="undefined"){
    HUB.ROLE.academy = [["◉","ملفنا العام","acadHome","#fff6d6","#c78c00"],["▦","الديوان","erp","#e7ecf1","#243244"],["◍","الفرق والتجارب","acadTeams"],["★","الفخر","acadPride","#fff6d6","#c78c00"],["◎","الشبكة والرعاة","acadNet"],["▤","الوسائط","acadMedia"],["◷","الجاي","acadNext","#eaf5ee","#2c6e49"],["✎","اختبارات القبول","tryouts","#fff6d6","#c78c00"],["⇪","استيراد القوائم","importPlayers"]];
    HUB.ROLE_OK.academy.push(...ACD.OWN);
    Object.keys(HUB.ROLE_OK).forEach(k=>{ if(HUB.ROLE_OK[k].indexOf("acadHome")<0) HUB.ROLE_OK[k].push("acadHome"); });
  }
  if(typeof homeFor==="function"){ const _h=homeFor; window.homeFor=function(){ return ME && ME.role==="academy" ? "acadHome" : _h(); }; }
  /* رأس الشاشة: شاشات الأكاديمية تحمل رأسها معها · وشريطها بزوايا 12px (جهة لا فرد) */
  ACD.ERPV = v => /^(erp|erpOps|erpPeople|erpField|approvals|accredit|club|tournament)$/.test(v||"");
  ACD.nav = () => { const A = ACD.ERPV(VIEW) ? "#243244" : "#4636e3"; return `<nav style="position:fixed;bottom:12px;inset-inline:12px;max-width:496px;margin:0 auto;background:#fff;border:1px solid #e9e4d8;border-radius:999px;display:flex;justify-content:space-around;align-items:center;padding:8px 10px;box-shadow:0 10px 26px rgba(21,26,46,.07);z-index:50">
${NAV.academy.map(([g,lb,v])=>{ const on=VIEW===v;
  if(g==="FAB") return `<button onclick="go('${v}')" style="width:58px;height:58px;border-radius:18px;background:${on?A:"#151a2e"};color:#faf8f3;margin-top:-34px;box-shadow:0 10px 22px rgba(21,26,46,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;border:4px solid #faf8f3;cursor:pointer;font-family:Cairo;flex:none"><span style="font-size:18px">⌂</span><span style="font-size:8.5px;font-weight:900">تنقّل</span></button>`;
  return `<button onclick="go('${v}')" style="background:none;border:0;font-size:9.5px;font-weight:${on?900:800};color:${on?A:"#8a8fa5"};display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font-family:Cairo;padding:0"><span style="font-size:16px">${g}</span>${lb}</button>`;}).join("")}
</nav>`; };
  const _nav3 = window.navHtml || navHtml;
  window.navHtml = navHtml = function(){ return (ME && ME.role==="academy") ? ACD.nav() : _nav3(); };
  const _r3 = window.render;
  window.render = render = async function(){
    await _r3();
    try{
      if(!ME || VIEW==="auth" || VIEW==="role") return;
      if(ME.role==="academy"){
        const PLAYER_ONLY=["feed","records","cabinet","publicView","myCard","opps","wallet","calendar","health","privacy","viewLog","coachHome","squad","session","drills","brief","rate","tactics","coachTasks","coachMe","boards"];
        if(PLAYER_ONLY.indexOf(VIEW)>=0){ go("acadHome", ME.org); return; }
      }
      if(VIEW === "explore") setTimeout(()=>{ try{ PL3.drawMap && PL3.drawMap(); }catch(e){} }, 80);
      if(ACD.ERPV(VIEW)){ document.body.style.background="#eef1f4";
        const hd=$("#app").querySelector(".hd"); if(hd) hd.remove();
        const sh=document.querySelector(".shell"); if(sh) sh.style.background="#f4f6f8"; }
      else if(ACD.OWN.indexOf(VIEW)>=0){ const hd=$("#app").querySelector(".hd"); if(hd) hd.remove();
        document.body.style.background="#eeeae0"; const sh=document.querySelector(".shell"); if(sh) sh.style.background="#faf8f3"; }
    }catch(e){ console.error("ACD",e); }
  };
})();
