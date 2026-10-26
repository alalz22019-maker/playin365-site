/* PlayIn365 — مفتاح التنقّل السريع: الزر الأوسط يفتح «كل الخدمات» كما في التصميم القديم.
   الشاشات القديمة تبقى كما هي — هذا مدخل إليها لا بديل عنها.
   لا يُعرض إلا ما هو موجود فعلًا: كل بطاقة تُفحص بـ typeof T[v]==="function" قبل رسمها. */
const HUB = {};

HUB.SHARED = [
  ["⚽","الملعب","pitch"],
  ["●","مباشر الآن","liveNow","#fdeee8","#e8531f"],
  ["♫","البطولات والأخبار","tours","#fff6d6","#c78c00"],
  ["◎","الخريطة والبحث","explore"],
  ["◔","مهامي","opps","#fff6d6","#c78c00"],
  ["▣","بطاقتي","publicView"],
  ["✉","الرسائل","messages"],
  ["▤","السوق","market","#fdeee8","#e8531f"]
];

HUB.ROLE = {
  player:[
    ["◈","لوحتي","feed","#efedff","#7b5cff"],
    ["▤","سجلي وتقييمي","records"],
    ["✦","خزانتي","cabinet","#fff6d6","#c78c00"],
    ["🔒","ملفي الطبي","health","#eef7f4","#2c8471"],
    ["▦","المحفظة والجدول","wallet","#eaf5ee","#2c6e49"],
    ["◷","تقويمي","calendar"]
  ],
  coach:[
    ["◔","مساحة المدرب","coachHome"],
    ["▦","فريقي","squad"],
    ["◈","حصة اليوم","session","#eaf5ee","#2c6e49"],
    ["◷","الحصص ومخططها","sessions","#efedff","#4636e3"],
    ["▤","بنك التمارين","drills","#efedff","#4636e3"],
    ["✎","تعليمات الحصة","brief"],
    ["★","تقييم اللاعب","rate","#fff6d6","#c78c00"],
    ["⚽","التشكيلة والاحتياط","tactics","#fff6d6","#c78c00"],
    ["↗","لوحاتي التكتيكية","boards","#fff6d6","#c78c00"],
    ["♙","فريقك في الملعب","pitch","#eaf5ee","#2c6e49"],
    ["✓","سلسلة الثقة","chain","#eaf5ee","#2c6e49"],
    ["▥","مهامي","coachTasks","#e7ecf1","#243244"],
    ["♛","ملفي المهني","coachMe","#fff6d6","#c78c00"],
    ["▣","التقارير","reports","#e7ecf1","#243244"],
    ["▶","المباريات والتسجيل","orgMatch","#fdeee8","#e8531f"]
  ],
  organizer:[
    ["▶","مبارياتي","orgMatch"],
    ["＋","أنشئ مباراة","newMatch","#fdeee8","#e8531f"],
    ["▦","الملاعب والذروة","pitches","#eaf5ee","#2c6e49"],
    ["♛","البطولة","tournament","#fff6d6","#c78c00"],
    ["✓","الموافقات","approvals","#e7ecf1","#243244"]
  ],
  referee:[
    ["◉","تعييناتي","refDuty"],
    ["▶","مبارياتي","orgMatch"],
    ["▥","التقارير","reports","#e7ecf1","#243244"]
  ],
  scout:[
    ["★","قائمة متابعتي","scout","#efedff","#7b5cff"],
    ["▥","التقارير","reports","#e7ecf1","#243244"]
  ],
  guardian:[
    ["👤","إشراف ولي الأمر","guardian"],
    ["◷","التحديثات","updates","#eaf5ee","#2c6e49"],
    ["🔒","الطبي بإذني","medical","#eef7f4","#2c8471"]
  ],
  academy:[
    ["▦","ملف الأكاديمية","acadProfile","#e7ecf1","#243244"],
    ["▥","الأكاديمية","acad","#e7ecf1","#243244"],
    ["◍","الفئات والفرق","acadSquads"],
    ["✎","اختبارات القبول","acadTryouts","#fff6d6","#c78c00"],
    ["⇪","استيراد القوائم","acadRosterImport"]
  ],
  venue:[
    ["▦","ملعبي","venue","#eaf5ee","#2c6e49"],
    ["◷","الذروة والصيانة","pitches"]
  ],
  club:[
    ["♛","لوحة النادي","club","#e7ecf1","#243244"],
    ["▦","ديوان الجهة","erp","#e7ecf1","#243244"],
    ["♛","البطولة","tournament","#fff6d6","#c78c00"]
  ],
  fed:[
    ["★","الاعتماد","accredit","#fff6d6","#c78c00"],
    ["♛","البطولة","tournament"],
    ["▥","التقارير","reports","#e7ecf1","#243244"]
  ],
  medical:[
    ["🔒","الحالات والجاهزية","medical","#eef7f4","#2c8471"]
  ],
  fan:[
    ["⚽","فريق الحي","hood","#eaf5ee","#2c6e49"],
    ["👏","التقدير","cheer","#fdeee8","#e8531f"],
    ["▣","عضوياتي","memberships"],
    ["◎","ما حولك","explore"]
  ],
  investor:[
    ["◈","محفظتي","investor","#efedff","#7b5cff"],
    ["⇄","غرف التعاقد","deals","#fff6d6","#c78c00"]
  ],
  admin:[
    ["▥","لوحة الأدمن","admin","#e7ecf1","#243244"],
    ["◉","لوحة المالك","owner","#e7ecf1","#243244"],
    ["▤","سجل الشفافية","adminTrans"]
  ]
};

HUB.ALL = [
  ["▤","أدوات المدرب","squad","#fff6d6","#c78c00"],
  ["▦","الديوان","erp","#e7ecf1","#243244"],
  ["⇄","غرف التعاقد","deals","#fff6d6","#c78c00"],
  ["▣","السوق والمزاد","market","#fdeee8","#e8531f"],
  ["●","التسجيل المباشر","orgMatch","#fdeee8","#e8531f"],
  ["🔒","الطبية","medical","#eef7f4","#2c8471"],
  ["◎","مباريات مفتوحة","explore","#eaf5ee","#2c6e49"],
  ["▢","المحفظة والجدول","wallet"],
  ["✉","الرسائل","messages"],
  ["★","الكشاف والمحلل","scout","#efedff","#7b5cff"],
  ["♛","البطولات","tournament","#fff6d6","#c78c00"],
  ["▥","التقارير","reports","#e7ecf1","#243244"],
  ["◐","سجل الاطلاع","viewLog"],
  ["🔒","خصوصيتي","privacy","#eef7f4","#2c8471"],
  ["⇄","أدواري","role"],
  ["⚙","الإعدادات","settings"]
];

/* أسطح مفتوحة لكل دور — معلومة عامة لا صلاحية على بيانات أحد */
HUB.OPEN = ["liveNow","tours","toursOfficial","toursNews"];

/* أسطح كل دور — القائمة البيضاء. الظهور = ملكية الدور لا وجود الدالة (القانون ٤) */
HUB.ROLE_OK = {
  player:["pitch","explore","opps","publicView","messages","market","feed","records","cabinet","health","wallet","calendar","viewLog","privacy","role","settings"],
  coach:["pitch","explore","messages","market","coachHome","squad","session","sessions","drills","brief","rate","tactics","boards","coachTasks","coachMe","chain","reports","orgMatch","role","settings"],
  organizer:["pitch","explore","messages","market","orgMatch","newMatch","pitches","tournament","approvals","reports","role","settings"],
  referee:["pitch","explore","messages","refDuty","orgMatch","reports","role","settings"],
  scout:["pitch","explore","messages","market","scout","reports","deals","role","settings"],
  guardian:["pitch","explore","messages","guardian","updates","medical","role","settings"],
  academy:["pitch","explore","messages","market","erp","acad","teams","tryouts","importPlayers","reports","deals","role","settings"],
  venue:["explore","messages","venue","pitches","reports","role","settings"],
  club:["pitch","explore","messages","market","club","erp","tournament","reports","deals","role","settings"],
  fed:["explore","messages","accredit","tournament","reports","role","settings"],
  medical:["messages","medical","role","settings"],
  fan:["pitch","explore","messages","market","hood","cheer","memberships","role","settings"],
  investor:["explore","messages","market","investor","deals","reports","role","settings"],
  admin:["admin","owner","adminTrans","reports","market","explore","messages","role","settings"]
};
HUB.dest = v => {
  const role=(ME&&ME.role)||"player";
  if(role==="academy") return ({erp:"acadProfile",teams:"acadSquads",tryouts:"acadTryouts",importPlayers:"acadRosterImport",reports:"acadPerformance"})[v]||v;
  return v;
};
HUB.has = v => {
  if(typeof T[v] !== "function") return false;
  if(HUB.OPEN.indexOf(v) >= 0) return true;
  const ok = HUB.ROLE_OK[(ME&&ME.role)||"player"];
  return !ok || ok.indexOf(v) >= 0;
};
HUB.icon = route => {
  const names = {
    pitch:"field", tactics:"field", hood:"field", orgMatch:"play", liveNow:"pulse",
    tours:"trophy", toursOfficial:"trophy", tournament:"trophy", explore:"search",
    venue:"pin", pitches:"pin", opps:"target", deals:"arrows", role:"arrows",
    publicView:"card", messages:"chat", market:"store", feed:"dashboard", records:"list",
    cabinet:"badge", health:"lock", medical:"heart", privacy:"lock", wallet:"wallet",
    investor:"wallet", calendar:"calendar", coachHome:"home", squad:"users", session:"calendarCheck",
    sessions:"calendar", drills:"board", brief:"clipboard", rate:"star", boards:"board",
    chain:"link", coachTasks:"check", coachMe:"badge", reports:"chart", newMatch:"plus",
    approvals:"check", refDuty:"clipboard", scout:"target", guardian:"users", updates:"bell",
    erp:"building", acad:"building", teams:"users", tryouts:"clipboard", importPlayers:"upload",
    club:"building", accredit:"badge", cheer:"heart", memberships:"card", admin:"settings",
    owner:"building", adminTrans:"list", viewLog:"list", settings:"settings"
  };
  const paths = {
    field:'<rect x="3.5" y="4" width="17" height="16" rx="1.5"/><path d="M12 4v16M3.5 12h4.2a4.3 4.3 0 0 0 8.6 0h4.2"/><circle cx="12" cy="12" r="2.2"/>',
    play:'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    pulse:'<path d="M3 12h4l2.2-5 4.2 10 2.2-5H21"/>',
    trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6"/>',
    search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/>',
    arrows:'<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    card:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
    chat:'<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8 8 0 0 1-3.5-.8L4 20l1.5-3.7A7 7 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z"/><path d="M8 12h8M8 9h5"/>',
    store:'<path d="M4 9h16l-1.4 11H5.4L4 9Z"/><path d="m5 9 2-5h10l2 5M9 9a3 3 0 0 0 6 0"/>',
    dashboard:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>',
    list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="18" r=".8"/>',
    badge:'<path d="M12 3 15 5l3.5.5.5 3.5 2 3-2 3-.5 3.5L15 19l-3 2-3-2-3.5-.5L5 15l-2-3 2-3 .5-3.5L9 5z"/><path d="m9 12 2 2 4-4"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/>',
    heart:'<path d="M20.8 8.8c0 5.1-8.8 11-8.8 11s-8.8-5.9-8.8-11A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 8.8 2.3Z"/>',
    wallet:'<rect x="3" y="5" width="18" height="15" rx="2.5"/><path d="M3 9h18M15 14h3"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6"/>',
    calendarCheck:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M7 3v4M17 3v4M3 10h18m4 4 2 2 4-4"/>',
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-1.3A4.7 4.7 0 0 1 8.2 14h1.6a4.7 4.7 0 0 1 4.7 4.7V20zM16 5.3a3 3 0 0 1 0 5.8M16.5 14.2a4.4 4.4 0 0 1 4 4.4V20h-2"/>',
    board:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h5M7 16h10M16 11l3 2-3 2"/>',
    clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8 10h8M8 14h8M8 18h5"/>',
    star:'<path d="m12 3 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z"/>',
    link:'<path d="M10 13.5 14 9.5M8 16l-1.5 1.5a3.5 3.5 0 0 1-5-5L5 9a3.5 3.5 0 0 1 5 0M16 8l1.5-1.5a3.5 3.5 0 0 1 5 5L19 14a3.5 3.5 0 0 1-5 0"/>',
    chart:'<path d="M3 20V4M3 20h18M7 15l4-4 3 2 6-7M16 6h4v4"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    check:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7 12 3 3 7-7"/>',
    bell:'<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
    building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
    upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 15v5h16v-5"/>',
    settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"/>'
  };
  const icon = names[route] || "dashboard";
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[icon]||paths.dashboard}</svg>`;
};
HUB.tile = ([g,lb,v,bg,ink]) => `<button onclick="go('${HUB.dest(v)}')" style="background:#11182d;border:1px solid rgba(112,139,190,.24);border-radius:20px;padding:14px 8px;display:flex;flex-direction:column;align-items:center;gap:7px;cursor:pointer;font-family:Cairo;color:#f1f4ff;text-align:center">
  <span style="width:40px;height:40px;border-radius:${(typeof ME!=="undefined"&&ME&&ME.role==="coach")?"50% 50% 8px 50%":"50% 50% 50% 8px"};background:rgba(112,80,255,.14);color:#b09aff;display:grid;place-items:center;flex:none">${HUB.icon(v)}</span>
  <b style="font-size:11.5px;font-weight:900;line-height:1.5">${lb}</b></button>`;


HUB.group = (label,code,ink,items) => {
  const live = items.filter(it=>HUB.has(it[2]));
  if(!live.length) return "";
  return `<div style="display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:center;gap:9px">
      <span style="width:4px;height:16px;border-radius:99px;background:${ink};flex:none"></span>
      <b style="font-size:13px;font-weight:900">${label}</b>
      <span class="ltr" style="font-size:9.5px;font-weight:700;color:#8a8fa5;letter-spacing:.06em">${code}</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${live.map(HUB.tile).join("")}</div>
  </div>`;
};

T.hub = async () => {
  const r = (ME&&ME.role)||"player";
  const RN = (typeof roleAr!=="undefined"&&roleAr[r])||r;
  const own = HUB.ROLE[r] || HUB.ROLE.player;
  const seen = new Set([...HUB.SHARED,...own].map(x=>x[2]));
  const markup = `<main style="flex:1;padding:16px 18px 160px;display:flex;flex-direction:column;gap:20px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
      <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        ${typeof PL3!=="undefined"?PL3.av(ME.name,52,{role:r,dark:true,r:r==="coach"?"50% 50% 10px 50%":"50% 50% 50% 10px"}):""}
        <div style="flex:1;min-width:0">
          <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">دورك الحالي · ${esc(RN)}</span>
          <b style="display:block;font-size:17px;font-weight:900;line-height:1.25;margin-top:2px">${esc((ME.name||"").split(" ")[0])}${ME.org?` <span style="font-size:11px;color:#c6cade;font-weight:700">· ${esc(ME.org)}</span>`:""}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;line-height:1.8;margin-top:4px">هنا تجد الخدمات المتاحة لحسابك.</span></div>
        <button onclick="go('role')" style="background:#fff;color:#151a2e;border:0;border-radius:999px;padding:8px 12px;font:900 10.5px Cairo;cursor:pointer;flex:none">⇄ غيّر</button>
      </div>
    </div>
    ${HUB.group("لكل الأدوار","SHARED","#4636e3",HUB.SHARED)}
    ${HUB.group("خاص بدورك","ROLE · "+String(r).toUpperCase(),"#c78c00",own)}
    ${HUB.group("كل الخدمات","ALL SURFACES","#243244",HUB.ALL.filter(x=>!seen.has(x[2])))}
    <div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">تظهر هنا الخدمات المناسبة لحسابك ودورك.</div>
  </main>`;
  if(r==="player"&&window.PZ&&typeof window.PZ.page==="function") return window.PZ.page("hub",markup);
  if(r==="coach") return '<header class="pz5-top"><button aria-label="الرئيسية" title="الرئيسية" onclick="go(&quot;coachHome&quot;)">'+window.PZ.icon('back')+'</button><div class="pz5-brand">Play<span>In</span><sup>365</sup></div><button aria-label="ملفي" title="ملفي" onclick="go(&quot;coachMe&quot;)">'+window.PZ.icon('profile')+'</button></header>'+markup;
  return markup;
};

(function(){
  Object.assign(TITLES,{hub:"تنقّل سريع"});
  if(typeof PL3!=="undefined"){
    PL3.TITLE.hub = ["تنقّل سريع","خدماتك المتاحة كلها في مكان واحد"];
    PL3.navItems = PL3.navItems.map(it => it[0]==="FAB" ? ["FAB","تنقّل","hub"] : it);
  }
  /* الشريط العام للأدوار الأخرى: الزر الأوسط يفتح المفتاح بدل «أنشئ مباراة» — وإنشاء المباراة يبقى في مجموعة دورك */
  if(typeof NAV!=="undefined") Object.keys(NAV).forEach(k=>{
    NAV[k] = NAV[k].map(it => it[0]==="FAB" ? ["FAB","",  "hub"] : it);
  });
})();
