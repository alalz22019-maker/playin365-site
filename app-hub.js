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
    ["▦","ديوان الجهة","erp","#e7ecf1","#243244"],
    ["▥","الأكاديمية","acad","#e7ecf1","#243244"],
    ["◍","الفئات والفرق","teams"],
    ["✎","اختبارات القبول","tryouts","#fff6d6","#c78c00"],
    ["⇪","استيراد القوائم","importPlayers"]
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
HUB.has = v => {
  if(typeof T[v] !== "function") return false;
  if(HUB.OPEN.indexOf(v) >= 0) return true;
  const ok = HUB.ROLE_OK[(ME&&ME.role)||"player"];
  return !ok || ok.indexOf(v) >= 0;
};
HUB.tile = ([g,lb,v,bg,ink]) => `<button onclick="go('${v}')" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 8px;display:flex;flex-direction:column;align-items:center;gap:7px;cursor:pointer;font-family:Cairo;color:#151a2e;text-align:center">
  <span style="width:40px;height:40px;border-radius:${(typeof ME!=="undefined"&&ME&&ME.role==="coach")?"50% 50% 8px 50%":"50% 50% 50% 8px"};background:${bg||"#efedff"};color:${ink||"#4636e3"};display:grid;place-items:center;font-size:17px;flex:none">${g}</span>
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
  const markup = `<main style="flex:1;padding:16px 18px 100px;display:flex;flex-direction:column;gap:20px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
      <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        ${typeof PL3!=="undefined"?PL3.av(ME.name,52,{role:r,dark:true,r:r==="coach"?"50% 50% 10px 50%":"50% 50% 50% 10px"}):""}
        <div style="flex:1;min-width:0">
          <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">دورك الحالي · ${esc(RN)}</span>
          <b style="display:block;font-size:17px;font-weight:900;line-height:1.25;margin-top:2px">${esc((ME.name||"").split(" ")[0])}${ME.org?` <span style="font-size:11px;color:#c6cade;font-weight:700">· ${esc(ME.org)}</span>`:""}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;line-height:1.8;margin-top:4px">ما تملك الوصول إليه — في شاشة واحدة بلا قوائم متداخلة.</span></div>
        <button onclick="go('role')" style="background:#fff;color:#151a2e;border:0;border-radius:999px;padding:8px 12px;font:900 10.5px Cairo;cursor:pointer;flex:none">⇄ غيّر</button>
      </div>
    </div>
    ${HUB.group("لكل الأدوار","SHARED","#4636e3",HUB.SHARED)}
    ${HUB.group("خاص بدورك","ROLE · "+String(r).toUpperCase(),"#c78c00",own)}
    ${HUB.group("كل الخدمات","ALL SURFACES","#243244",HUB.ALL.filter(x=>!seen.has(x[2])))}
    <div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">ما لا يظهر هنا لا تملك صلاحيته — والصلاحية في القاعدة لا في الشاشة.</div>
  </main>`;
  return r==="player"&&window.PZ&&typeof window.PZ.page==="function" ? window.PZ.page("hub",markup) : markup;
};

(function(){
  Object.assign(TITLES,{hub:"تنقّل سريع"});
  if(typeof PL3!=="undefined"){
    PL3.TITLE.hub = ["تنقّل سريع","كل سطح تملك الوصول إليه — في شاشة واحدة"];
    PL3.navItems = PL3.navItems.map(it => it[0]==="FAB" ? ["FAB","تنقّل","hub"] : it);
  }
  /* الشريط العام للأدوار الأخرى: الزر الأوسط يفتح المفتاح بدل «أنشئ مباراة» — وإنشاء المباراة يبقى في مجموعة دورك */
  if(typeof NAV!=="undefined") Object.keys(NAV).forEach(k=>{
    NAV[k] = NAV[k].map(it => it[0]==="FAB" ? ["FAB","",  "hub"] : it);
  });
})();
