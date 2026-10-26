/* PlayIn365 Academy workspace — shared mobile identity + complete academy dashboard */
(function(){
  const AC6 = window.AC6 = window.AC6 || {};
  const $ = s => document.querySelector(s);
  const esc6 = s => typeof esc === "function" ? esc(String(s == null ? "" : s)) : String(s == null ? "" : s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const academyName = () => (ME && ME.org && String(ME.org).trim()) || "أكاديمية النخبة";
  const data = {
    groups:[
      {id:"u6",name:"براعم",ages:"6–8 سنوات",players:12,coach:"ناصر العتيبي",time:"الأحد والثلاثاء · 5:00 م",color:"cyan"},
      {id:"u9",name:"براعم متقدمون",ages:"9–10 سنوات",players:16,coach:"فهد المطيري",time:"الأحد والثلاثاء · 6:15 م",color:"purple"},
      {id:"u11",name:"ناشئون",ages:"11–12 سنة",players:20,coach:"سعود القحطاني",time:"الاثنين والأربعاء · 5:30 م",color:"gold"},
      {id:"u13",name:"ناشئون متقدمون",ages:"13–14 سنة",players:18,coach:"ماجد السبيعي",time:"الاثنين والأربعاء · 7:00 م",color:"mint"},
      {id:"u15",name:"شباب",ages:"15–17 سنة",players:20,coach:"تركي الحربي",time:"الثلاثاء والخميس · 7:30 م",color:"blue"}
    ],
    players:[
      {name:"ريان القحطاني",age:12,group:"u11",position:"وسط",status:"منتظم"},
      {name:"فهد الشمري",age:10,group:"u9",position:"حارس",status:"منتظم"},
      {name:"مازن المطيري",age:8,group:"u6",position:"مهاجم",status:"يتطور"},
      {name:"عبدالله العتيبي",age:14,group:"u13",position:"مدافع",status:"منتظم"},
      {name:"سلمان الدوسري",age:16,group:"u15",position:"جناح",status:"متابعة"}
    ],
    coaches:["سعود القحطاني","ناصر العتيبي","فهد المطيري","ماجد السبيعي","تركي الحربي","خالد الغامدي","عبدالرحمن الشهري"],
    sessions:[
      {day:"اليوم",time:"5:30 م",group:"ناشئون · 11–12 سنة",place:"الملعب الرئيسي",focus:"التمرير والتحرك"},
      {day:"اليوم",time:"7:00 م",group:"ناشئون متقدمون · 13–14 سنة",place:"الملعب 2",focus:"الضغط والتحول"},
      {day:"غدًا",time:"5:00 م",group:"براعم · 6–8 سنوات",place:"الملعب الرئيسي",focus:"المهارات الأساسية"}
    ],
    activity:[
      {icon:"✓",title:"اكتمل حضور فئة الناشئين",sub:"الأربعاء · 4:42 م",tone:"mint"},
      {icon:"★",title:"تقييم جديد للاعب ريان القحطاني",sub:"الأربعاء · 3:18 م",tone:"gold"},
      {icon:"◈",title:"تم اعتماد موعد المباراة القادمة",sub:"الثلاثاء · 6:05 م",tone:"purple"}
    ]
  };
  const readState=()=>{try{return JSON.parse(localStorage.getItem("pi_acad_ui_"+(ME&&ME.id||"account"))||"{}")}catch(e){return {}}};
  const saveState=s=>{try{localStorage.setItem("pi_acad_ui_"+(ME&&ME.id||"account"),JSON.stringify(s))}catch(e){}};
  const icons={
    home:'<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
    team:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 19v-1.3A4.7 4.7 0 0 1 8.2 13h1.6a4.7 4.7 0 0 1 4.7 4.7V19zM16 5.3a3 3 0 0 1 0 5.8M16.5 13.2a4.4 4.4 0 0 1 4 4.4V19h-3"/></svg>',
    grid:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6"/></svg>',
    chart:'<svg viewBox="0 0 24 24"><path d="M3 20V4M3 20h18M7 15l4-4 3 2 6-7"/><path d="M16 6h4v4"/></svg>',
    user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    search:'<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
    clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    plus:'<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></svg>',
    back:'<svg viewBox="0 0 24 24"><path d="M19 12H5m7-7-7 7 7 7"/></svg>',
    menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };
  const svg=(name)=>icons[name]||icons.grid;
  const state=()=>{const s=readState();return {extraPlayers:s.extraPlayers||0,extraCoaches:s.extraCoaches||0,attendance:s.attendance||0,selected:s.selected||"all",sessions:s.sessions||[]}};
  const totalPlayers=()=>86+state().extraPlayers;
  const totalCoaches=()=>7+state().extraCoaches;
  const card=(html,cls="")=>`<section class="a6-card ${cls}">${html}</section>`;
  const eyebrow=t=>`<span class="a6-eyebrow">${t}</span>`;
  const btn=(label,action,kind="")=>`<button class="a6-btn ${kind}" onclick="${action}">${label}</button>`;
  const title=(eyebrowText,headline,sub="")=>`<div class="a6-page-title">${eyebrow(eyebrowText)}<h1>${headline}</h1>${sub?`<p>${sub}</p>`:""}</div>`;
  const toast6=t=>{if(typeof toast==="function")toast(t);else alert(t)};

  AC6.groups=data.groups;
  AC6.openQuick=()=>{
    let m=document.getElementById("ac6QuickMenu");
    if(!m){m=document.createElement("div");m.id="ac6QuickMenu";m.className="ac6-quick-menu";m.innerHTML=`<div class="ac6-menu-head"><span>اختصارات الأكاديمية</span><button onclick="AC6.openQuick()" aria-label="إغلاق">×</button></div>
      <button onclick="AC6.openForm('player')">${svg("team")}<span>تسجيل لاعب</span></button>
      <button onclick="go('acadSessions');AC6.closeQuick()">${svg("calendar")}<span>الحصص والحضور</span></button>
      <button onclick="AC6.openForm('coach')">${svg("user")}<span>إضافة مدرب</span></button>
      <button onclick="go('acadSquads');AC6.closeQuick()">${svg("grid")}<span>إدارة الفئات والفرق</span></button>
      <button onclick="go('hub');AC6.closeQuick()">${svg("search")}<span>كل الخدمات</span></button>`;document.body.appendChild(m);}
    m.classList.toggle("open");
  };
  AC6.closeQuick=()=>{const m=document.getElementById("ac6QuickMenu");if(m)m.classList.remove("open")};
  AC6.openForm=kind=>{
    AC6.closeQuick();let old=document.getElementById("ac6Modal");if(old)old.remove();
    const isPlayer=kind==="player";
    const m=document.createElement("div");m.id="ac6Modal";m.className="ac6-modal";
    m.innerHTML=`<div class="ac6-modal-card"><button class="ac6-close" onclick="AC6.closeModal()">×</button><span class="a6-eyebrow">${isPlayer?"إضافة لاعب جديد":"إضافة مدرب"}</span><h2>${isPlayer?"تسجيل لاعب في الأكاديمية":"إضافة مدرب للفريق"}</h2><p>${isPlayer?"أدخل بيانات اللاعب واختر فئته العمرية.":"أدخل بيانات المدرب والفئات التي يشرف عليها."}</p>
      <label>${isPlayer?"اسم اللاعب":"اسم المدرب"}<input id="ac6Name" placeholder="الاسم الكامل"></label>
      ${isPlayer?`<label>العمر<select id="ac6Age"><option value="6">6 سنوات</option><option value="8">8 سنوات</option><option value="10">10 سنوات</option><option value="12" selected>12 سنة</option><option value="14">14 سنة</option><option value="16">16 سنة</option></select></label>`:`<label>التخصص<input id="ac6Specialty" placeholder="مثال: تدريب فئة الناشئين"></label>`}
      <button class="a6-btn primary" onclick="AC6.saveForm('${kind}')">${isPlayer?"حفظ اللاعب":"حفظ المدرب"}</button></div>`;
    document.body.appendChild(m);
  };
  AC6.closeModal=()=>{const m=document.getElementById("ac6Modal");if(m)m.remove()};
  AC6.saveForm=kind=>{
    const name=(document.getElementById("ac6Name")||{}).value||"";if(!name.trim())return toast6("اكتب الاسم أولًا");
    const s=state();if(kind==="player")s.extraPlayers++;else s.extraCoaches++;saveState(s);AC6.closeModal();toast6(kind==="player"?`تم تسجيل ${name.trim()}`:`تمت إضافة ${name.trim()}`);render();
  };
  AC6.recordAttendance=()=>{const s=state();s.attendance++;saveState(s);toast6("تم تسجيل حضور الحصة");render()};
  AC6.selectGroup=id=>{const s=state();s.selected=id;saveState(s);render()};
  AC6.copyLink=async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);toast6("تم نسخ رابط الأكاديمية")}catch(e){toast6("رابط الأكاديمية: "+location.origin)}};

  function home(){
    const org=esc6(academyName());const s=state();
    return `<main class="a6-main">
      <section class="a6-hero">
        <div class="a6-pitch"></div><div class="a6-hero-top">${eyebrow("PLAYIN365 · ACADEMY")}<span class="a6-live"><i></i> الموسم 2026</span></div>
        <div class="a6-hero-copy"><span class="a6-chip">الأكاديمية الرياضية</span><h1>${org}</h1><p>من أول حصة إلى إنجازات الموسم — كل فريقك في مكان واحد.</p></div>
        <div class="a6-hero-stats"><div><b>${totalPlayers()}</b><span>لاعب</span></div><div><b>${totalCoaches()}</b><span>مدرب</span></div><div><b>5</b><span>فئات عمرية</span></div><div><b>91%</b><span>انتظام الحضور</span></div></div>
      </section>
      <div class="a6-actions">${btn(`${svg("team")} تسجيل لاعب`,"AC6.openForm('player')","primary")}${btn(`${svg("calendar")} تسجيل الحضور`,"go('acadSessions')")}</div>
      <div class="a6-section-head"><div>${eyebrow("TODAY · OVERVIEW")}<h2>صورة الأكاديمية اليوم</h2></div><span class="a6-date">الأحد · 26 أكتوبر</span></div>
      <section class="a6-grid4"><div class="a6-kpi"><span>اللاعبون</span><b>${totalPlayers()}</b><small>في 5 فئات</small></div><div class="a6-kpi"><span>المدربون</span><b>${totalCoaches()}</b><small>فرق متخصصة</small></div><div class="a6-kpi"><span>حصص الأسبوع</span><b>14</b><small>3 اليوم</small></div><div class="a6-kpi"><span>الحضور اليوم</span><b>${91+s.attendance}%</b><small>من اللاعبين المسجلين</small></div></section>
      <div class="a6-two-col">
        ${card(`<div class="a6-card-head"><div>${eyebrow("NEXT SESSION")}<h2>الحصة القادمة</h2></div><span class="a6-badge mint">اليوم</span></div><div class="a6-session"><div class="a6-session-time"><b>5:30</b><span>م</span></div><div><strong>فئة الناشئين · 11–12 سنة</strong><p>الملعب الرئيسي · المدرب سعود القحطاني</p><span class="a6-focus">التركيز: التمرير والتحرك</span></div></div><div class="a6-divider"></div><div class="a6-card-foot"><span>20 لاعبًا مسجلًا</span>${btn("فتح الحضور","go('acadSessions')","small")}</div>`,`a6-session-card`)}
        ${card(`<div class="a6-card-head"><div>${eyebrow("ACADEMY PULSE")}<h2>مؤشر الحضور</h2></div><b class="a6-score">91<span>%</span></b></div><div class="a6-chart"><div class="a6-ylabels"><span>100%</span><span>75%</span><span>50%</span></div><svg viewBox="0 0 320 112" role="img" aria-label="تطور الحضور الأسبوعي"><path class="a6-gridline" d="M0 15H320M0 55H320M0 95H320"/><path class="a6-chart-area" d="M8 76L62 64L116 68L170 42L224 48L278 24L312 30L312 104L8 104Z"/><path class="a6-chart-line" d="M8 76L62 64L116 68L170 42L224 48L278 24L312 30"/><g class="a6-chart-dots"><circle cx="8" cy="76" r="4"/><circle cx="62" cy="64" r="4"/><circle cx="116" cy="68" r="4"/><circle cx="170" cy="42" r="4"/><circle cx="224" cy="48" r="4"/><circle cx="278" cy="24" r="4"/><circle cx="312" cy="30" r="4"/></g></svg></div><div class="a6-days"><span>الاثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span><span>السبت</span><span>الأحد</span></div>`,`a6-card-chart`)}
      </div>
      <div class="a6-section-head"><div>${eyebrow("AGE GROUPS")}<h2>الفئات والفرق</h2></div><button class="a6-text-btn" onclick="go('acadSquads')">عرض الكل ${svg("back")}</button></div>
      <section class="a6-group-row">${data.groups.map(g=>`<button class="a6-group-card ${g.color}" onclick="AC6.selectGroup('${g.id}')"><span class="a6-group-mark">${svg("team")}</span><span class="a6-group-age">${g.ages}</span><b>${g.name}</b><span class="a6-group-count"><strong>${g.players}</strong> لاعبًا</span><i>${g.coach}</i></button>`).join("")}</section>
      <div class="a6-section-head"><div>${eyebrow("RECENT ACTIVITY")}<h2>آخر المستجدات</h2></div><button class="a6-text-btn" onclick="go('acadPerformance')">التقارير ${svg("back")}</button></div>
      ${card(data.activity.map(a=>`<div class="a6-activity"><span class="a6-activity-icon ${a.tone}">${a.icon}</span><div><b>${a.title}</b><small>${a.sub}</small></div><span class="a6-activity-arrow">←</span></div>`).join(""))}
      ${card(`<div class="a6-card-head"><div>${eyebrow("ACADEMY SERVICES")}<h2>خدمات تدير بها الأكاديمية</h2></div></div><div class="a6-service-grid"><button onclick="go('acadSquads')">${svg("team")}<b>اللاعبون والفئات</b><small>التسجيل وقوائم الفرق</small></button><button onclick="go('acadSessions')">${svg("calendar")}<b>الحصص والحضور</b><small>الجداول ومتابعة الانتظام</small></button><button onclick="go('acadPerformance')">${svg("chart")}<b>التطوير والتقارير</b><small>تقييمات ومؤشرات الموسم</small></button><button onclick="go('acadProfile')">${svg("user")}<b>ملف الأكاديمية</b><small>الفروع والمدربون والهوية</small></button></div>`)}
    </main>`;
  }

  function squads(){
    const s=state(),filter=s.selected;const rows=data.groups.filter(g=>filter==="all"||g.id===filter);
    return `<main class="a6-main">${title("SQUADS · ROSTER","الفريق والفئات","فئات مرنة تناسب أعمار لاعبي الأكاديمية.")}
      <section class="a6-kpi-strip"><div><b>${totalPlayers()}</b><span>لاعبًا مسجلًا</span></div><div><b>${totalCoaches()}</b><span>مدربًا</span></div><div><b>5</b><span>فئات عمرية</span></div></section>
      <div class="a6-filter-row"><button class="${filter==="all"?"active":""}" onclick="AC6.selectGroup('all')">كل الفئات</button>${data.groups.map(g=>`<button class="${filter===g.id?"active":""}" onclick="AC6.selectGroup('${g.id}')">${g.name} · ${g.ages}</button>`).join("")}</div>
      <div class="a6-section-head"><div>${eyebrow("YOUR TEAMS")}<h2>${rows.length===1?rows[0].name:"فرق الأكاديمية"}</h2></div>${btn(`${svg("plus")} فئة جديدة`,"AC6.openForm('group')","small")}</div>
      ${rows.map(g=>card(`<div class="a6-team-head"><span class="a6-team-mark ${g.color}">${svg("team")}</span><div><span class="a6-group-age">${g.ages}</span><h2>${g.name}</h2></div><span class="a6-team-count"><b>${g.players}</b><small>لاعبًا</small></span></div><div class="a6-team-meta"><span>${svg("user")} ${g.coach}</span><span>${svg("clock")} ${g.time}</span></div><div class="a6-divider"></div><div class="a6-roster">${data.players.filter(p=>p.group===g.id).map(p=>`<div class="a6-player-row"><span class="a6-avatar">${esc6(p.name.slice(0,1))}</span><div><b>${esc6(p.name)}</b><small>${p.age} سنة · ${p.position}</small></div><span class="a6-badge ${p.status==="متابعة"?"gold":"mint"}">${p.status}</span></div>`).join("")||`<span class="a6-muted">قائمة اللاعبين جاهزة للإضافة.</span>`}</div><div class="a6-card-foot">${btn("عرض قائمة اللاعبين","AC6.openForm('player')","small")}${btn("تعديل الفئة","AC6.openForm('group')","small ghost")}</div>`,"a6-team-card")).join("")}
    </main>`;
  }

  function sessions(){
    const s=state();const done=20+s.attendance;
    return `<main class="a6-main">${title("SESSIONS · ATTENDANCE","الحصص والحضور","جدول واضح للحصص، وقائمة حضور تُحدّث مع كل تسجيل.")}
      <div class="a6-session-overview"><div><span>حصص اليوم</span><b>3</b></div><div><span>تم تسجيل الحضور</span><b>${done} / 58</b></div><div><span>نسبة الانتظام</span><b>${91+s.attendance}%</b></div></div>
      <div class="a6-section-head"><div>${eyebrow("TODAY & UPCOMING")}<h2>جدول الأكاديمية</h2></div>${btn(`${svg("plus")} أضف حصة`,"AC6.openForm('session')","small")}</div>
      ${[...s.sessions,...data.sessions].map((x,i)=>card(`<div class="a6-session-row"><div class="a6-time-pill"><b>${x.time}</b><span>${x.day}</span></div><div class="a6-session-info"><b>${x.group}</b><p>${x.place||"الملعب الرئيسي"} · ${x.focus||"حصة تدريبية"}</p><span class="a6-coach-label">${i===0?"المدرب سعود القحطاني":"المدرب ناصر العتيبي"}</span></div><span class="a6-schedule-status ${i===0?"today":""}">${i===0?"قريبًا":"مجدولة"}</span></div><div class="a6-card-foot">${btn("سجّل حضور الحصة","AC6.recordAttendance()","small primary")}${btn("تفاصيل الحصة","AC6.sessionDetails()","small ghost")}</div>`,`a6-session-card`)).join("")}
      ${card(`<div class="a6-card-head"><div>${eyebrow("WEEKLY PLAN")}<h2>خطة الأسبوع</h2></div><span class="a6-badge purple">14 حصة</span></div><div class="a6-week-grid">${[["الأحد","3"],["الاثنين","2"],["الثلاثاء","3"],["الأربعاء","2"],["الخميس","3"],["الجمعة","راحة"],["السبت","1"]].map(([d,n])=>`<div><span>${d}</span><b>${n}</b></div>`).join("")}</div>`)}
    </main>`;
  }

  function performance(){
    return `<main class="a6-main">${title("DEVELOPMENT · INSIGHTS","تطوير اللاعبين والتقارير","متابعة تطور الفرق خلال الموسم بطريقة سهلة وواضحة.")}
      <section class="a6-grid4"><div class="a6-kpi"><span>انتظام الحضور</span><b>91%</b><small>↑ 4% عن الشهر الماضي</small></div><div class="a6-kpi"><span>التقييمات المكتملة</span><b>72</b><small>من 86 لاعبًا</small></div><div class="a6-kpi"><span>المباريات</span><b>18</b><small>12 فوزًا · 3 تعادل</small></div><div class="a6-kpi"><span>تطور المهارات</span><b>+12%</b><small>خلال آخر 8 أسابيع</small></div></section>
      ${card(`<div class="a6-card-head"><div>${eyebrow("PLAYER DEVELOPMENT")}<h2>مؤشر تطور الفريق</h2></div><span class="a6-badge mint">آخر 8 أسابيع</span></div><div class="a6-large-chart"><svg viewBox="0 0 340 150" role="img" aria-label="مؤشر تطور الفريق"><path class="a6-gridline" d="M0 20H340M0 58H340M0 96H340M0 134H340"/><path class="a6-chart-area" d="M8 112L55 102L102 107L149 79L196 82L243 54L290 49L332 27L332 145H8Z"/><path class="a6-chart-line" d="M8 112L55 102L102 107L149 79L196 82L243 54L290 49L332 27"/><g class="a6-chart-dots"><circle cx="8" cy="112" r="4"/><circle cx="55" cy="102" r="4"/><circle cx="102" cy="107" r="4"/><circle cx="149" cy="79" r="4"/><circle cx="196" cy="82" r="4"/><circle cx="243" cy="54" r="4"/><circle cx="290" cy="49" r="4"/><circle cx="332" cy="27" r="4"/></g></svg></div><div class="a6-weeks"><span>الأسبوع 1</span><span>الأسبوع 2</span><span>الأسبوع 4</span><span>الأسبوع 6</span><span>الأسبوع 8</span></div>`)}
      ${card(`<div class="a6-card-head"><div>${eyebrow("SKILL AREAS")}<h2>مجالات التطوير</h2></div><button class="a6-text-btn" onclick="AC6.openForm('evaluation')">إضافة تقييم ${svg("back")}</button></div>${[["التمرير والتحكم",84,"cyan"],["اللياقة والحركة",78,"purple"],["الوعي واتخاذ القرار",72,"gold"],["الالتزام والعمل الجماعي",91,"mint"]].map(([name,n,c])=>`<div class="a6-progress-row"><div><b>${name}</b><span>${n}%</span></div><div class="a6-progress"><i class="${c}" style="width:${n}%"></i></div></div>`).join("")}`)}
      ${card(`<div class="a6-card-head"><div>${eyebrow("MATCHES · SEASON 2026")}<h2>نتائج الفريق</h2></div><button class="a6-text-btn" onclick="go('orgMatch')">كل المباريات ${svg("back")}</button></div><div class="a6-results"><div><b>18</b><span>مباراة</span></div><div><b>12</b><span>فوز</span></div><div><b>3</b><span>تعادل</span></div><div><b>3</b><span>خسارة</span></div></div><div class="a6-note">آخر نتيجة: أكاديمية النخبة 3 — 1 أكاديمية الصقور · دوري الرياض للناشئين</div>`)}
    </main>`;
  }

  function profile(){
    const org=esc6(academyName());
    return `<main class="a6-main">${title("ACADEMY PROFILE","ملف الأكاديمية","بيانات الأكاديمية، فروعها، وطاقمها في بطاقة واحدة.")}
      <section class="a6-profile-hero"><div class="a6-profile-mark">${esc6(org.replace("أكاديمية","").trim().slice(0,1)||"ن")}</div><div><span class="a6-badge gold">★ أكاديمية معتمدة</span><h2>${org}</h2><p>الرياض · حي العارض</p></div><button class="a6-share" onclick="AC6.copyLink()">مشاركة الملف</button></section>
      <div class="a6-section-head"><div>${eyebrow("BRANCHES")}<h2>الفروع والملاعب</h2></div>${btn(`${svg("plus")} إضافة فرع`,"AC6.openForm('branch')","small")}</div>
      ${card(`<div class="a6-branch-row"><span class="a6-branch-icon">⌖</span><div><b>المقر الرئيسي — حي العارض</b><small>الرياض · 3 ملاعب · استقبال يومي 4:00–10:00 م</small></div><span class="a6-badge mint">مفتوح</span></div><div class="a6-branch-row"><span class="a6-branch-icon purple">⌖</span><div><b>فرع شمال الرياض</b><small>الرياض · ملعبان · استقبال الأحد إلى الخميس</small></div><span class="a6-badge mint">مفتوح</span></div>`)}
      <div class="a6-section-head"><div>${eyebrow("COACHING STAFF")}<h2>الطاقم التدريبي</h2></div>${btn(`${svg("plus")} أضف مدربًا`,"AC6.openForm('coach')","small")}</div>
      ${card(data.coaches.map((name,i)=>`<div class="a6-player-row"><span class="a6-avatar coach">${esc6(name.slice(0,1))}</span><div><b>${name}</b><small>${["مدرب فئة الناشئين","مدرب البراعم","مدرب الحراس","مدرب فئة 13–14","مدرب فئة الشباب","مساعد مدرب","مدرب لياقة"][i]}</small></div><span class="a6-badge ${i<5?"mint":"purple"}">${i<5?"معتمد":"مساعد"}</span></div>`).join(""))}
      ${card(`<div class="a6-card-head"><div>${eyebrow("ACADEMY SERVICES")}<h2>خدمات وملفات الأكاديمية</h2></div></div><div class="a6-link-list"><button onclick="go('acadSquads')">الفئات والفرق <span>←</span></button><button onclick="go('acadSessions')">الجداول والحضور <span>←</span></button><button onclick="go('acadPerformance')">التطوير والتقارير <span>←</span></button><button onclick="go('hub')">الخدمات المشتركة <span>←</span></button></div>`)}
    </main>`;
  }

  AC6.sessionDetails=()=>toast6("تفاصيل الحصة: فئة الناشئين · الملعب الرئيسي · المدرب سعود القحطاني");
  AC6.openForm=kind=>{
    if(kind==="group"||kind==="session"||kind==="branch"||kind==="evaluation"){
      AC6.closeQuick();const old=document.getElementById("ac6Modal");if(old)old.remove();
      const labels={group:["إضافة فئة عمرية","اسم الفئة","مثال: مواليد 2015–2016"],session:["إنشاء حصة تدريبية","اسم الحصة","مثال: تدريب فئة الناشئين"],branch:["إضافة فرع","اسم الفرع","اسم الفرع وموقعه"],evaluation:["تسجيل تقييم لاعب","اسم اللاعب","اختر اسم اللاعب"]};
      const [h,l,p]=labels[kind];const m=document.createElement("div");m.id="ac6Modal";m.className="ac6-modal";m.innerHTML=`<div class="ac6-modal-card"><button class="ac6-close" onclick="AC6.closeModal()">×</button><span class="a6-eyebrow">إدارة الأكاديمية</span><h2>${h}</h2><label>${l}<input id="ac6Name" placeholder="${p}"></label>${kind==="group"?`<label>نطاق الأعمار<input id="ac6Age" placeholder="مثال: 11–12 سنة"></label>`:""}<button class="a6-btn primary" onclick="AC6.saveGeneric('${kind}')">حفظ</button></div>`;document.body.appendChild(m);return;
    }
    const old=document.getElementById("ac6Modal");if(old)old.remove();
    const isPlayer=kind==="player";const m=document.createElement("div");m.id="ac6Modal";m.className="ac6-modal";
    m.innerHTML=`<div class="ac6-modal-card"><button class="ac6-close" onclick="AC6.closeModal()">×</button><span class="a6-eyebrow">${isPlayer?"إضافة لاعب جديد":"إضافة مدرب"}</span><h2>${isPlayer?"تسجيل لاعب في الأكاديمية":"إضافة مدرب للفريق"}</h2><p>${isPlayer?"أدخل بيانات اللاعب واختر فئته العمرية.":"أدخل بيانات المدرب والفئات التي يشرف عليها."}</p><label>${isPlayer?"اسم اللاعب":"اسم المدرب"}<input id="ac6Name" placeholder="الاسم الكامل"></label>${isPlayer?`<label>العمر<select id="ac6Age"><option value="6">6 سنوات</option><option value="8">8 سنوات</option><option value="10">10 سنوات</option><option value="12" selected>12 سنة</option><option value="14">14 سنة</option><option value="16">16 سنة</option></select></label>`:`<label>التخصص<input id="ac6Specialty" placeholder="مثال: تدريب فئة الناشئين"></label>`}<button class="a6-btn primary" onclick="AC6.saveForm('${kind}')">${isPlayer?"حفظ اللاعب":"حفظ المدرب"}</button></div>`;document.body.appendChild(m);
  };
  AC6.saveGeneric=kind=>{const name=(document.getElementById("ac6Name")||{}).value||"";if(!name.trim())return toast6("أدخل البيانات المطلوبة");const s=state();if(kind==="session"){s.sessions.push({day:"غدًا",time:"6:30 م",group:name.trim(),place:"الملعب الرئيسي",focus:"حصة تدريبية"});saveState(s)}AC6.closeModal();toast6("تم حفظ المعلومات");render()};

  T.acad=async()=>home();
  T.acadHome=async()=>home();
  T.acadSquads=async()=>squads();
  T.acadSessions=async()=>sessions();
  T.acadPerformance=async()=>performance();
  T.acadProfile=async()=>profile();
  if(typeof NAV!=="undefined")NAV.academy=[[svg("home"),"الرئيسية","acadHome"],[svg("team"),"فريقنا","acadSquads"],[svg("grid"),"الخدمات","hub"],[svg("calendar"),"الحصص","acadSessions"],[svg("user"),"ملفي","acadProfile"]];
  if(typeof TITLES!=="undefined"){TITLES.acad="مساحة الأكاديمية";TITLES.acadHome="مساحة الأكاديمية";TITLES.acadSquads="الفئات والفرق";TITLES.acadSessions="الحصص والحضور";TITLES.acadPerformance="التطوير والتقارير";TITLES.acadProfile="ملف الأكاديمية";}

  const css=`
    body.r-academy{background:#050711!important;color:#f2f5ff!important}
    body.r-academy::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;background:radial-gradient(ellipse at 10% 4%,rgba(25,92,165,.21),transparent 38%),radial-gradient(ellipse at 90% 38%,rgba(105,61,222,.16),transparent 42%),linear-gradient(180deg,#050711,#080d19 64%,#050711)}
    body.r-academy .shell{position:relative;background:linear-gradient(180deg,#080b17,#090d1b)!important;border-inline:1px solid rgba(77,111,166,.18);box-shadow:0 0 60px rgba(0,0,0,.45)}
    body.r-academy .hd{position:sticky;top:0;z-index:70;min-height:66px;padding:10px 18px;background:rgba(7,10,21,.94)!important;backdrop-filter:blur(18px);border-bottom:1px solid rgba(90,119,169,.2)!important;color:#f4f6ff!important;display:flex;align-items:center;justify-content:space-between}
    body.r-academy .nav{inset-inline:unset;left:50%;transform:translateX(-50%);bottom:12px;width:min(500px,calc(100% - 24px));max-width:500px;background:rgba(8,10,22,.94)!important;backdrop-filter:blur(18px);border:1px solid rgba(111,88,195,.34)!important;border-radius:28px;box-shadow:0 18px 46px rgba(0,0,0,.55);padding:8px 10px calc(8px + env(safe-area-inset-bottom));justify-content:space-around;gap:2px}
    body.r-academy .nav button{min-width:50px;color:#9299b6!important;font-size:9.5px;gap:3px}
    body.r-academy .nav button.on{color:#fff!important}
    body.r-academy .nav button i{width:33px;height:33px;border-radius:12px;background:transparent;color:inherit}
    body.r-academy .nav button.on i{background:linear-gradient(135deg,#855fff,#603ce0)!important;color:#fff!important;box-shadow:0 0 24px rgba(120,78,255,.38)}
    body.r-academy .nav button i svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .a6-header-side{width:38px;height:38px;border-radius:13px;background:rgba(18,24,43,.92);border:1px solid rgba(111,130,178,.3);color:#e9eeff;display:grid;place-items:center;cursor:pointer}
    .a6-header-side svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .a6-header-avatar{width:36px;height:36px;border-radius:50% 50% 14px 50%;display:grid;place-items:center;background:linear-gradient(135deg,#855fff,#603ce0);color:#fff;font:900 14px Cairo;border:1px solid rgba(177,157,255,.38)}
    .a6-main{position:relative;z-index:1;min-height:calc(100vh - 130px);padding:17px 16px 126px;display:flex;flex-direction:column;gap:15px;animation:popin .2s ease}
    .a6-eyebrow{display:block;font:700 9px 'Space Grotesk',sans-serif;letter-spacing:2.2px;color:#8e79ff}
    .a6-hero{position:relative;isolation:isolate;overflow:hidden;border-radius:27px;padding:18px 17px 15px;min-height:265px;border:1px solid rgba(91,150,220,.42);background:radial-gradient(ellipse at 2% 100%,rgba(0,166,214,.25),transparent 43%),radial-gradient(ellipse at 95% 2%,rgba(107,72,237,.27),transparent 44%),linear-gradient(145deg,#111d38,#090f20 58%,#111027);box-shadow:0 22px 52px rgba(0,0,0,.38),inset 0 1px 0 rgba(151,197,255,.13)}
    .a6-pitch{position:absolute;inset:18% 5% 24%;border:1px solid rgba(123,173,226,.13);border-radius:90px;z-index:-1}.a6-pitch:before{content:"";position:absolute;top:0;bottom:0;left:50%;border-left:1px solid rgba(123,173,226,.13)}.a6-pitch:after{content:"";position:absolute;left:calc(50% - 35px);top:calc(50% - 35px);width:70px;height:70px;border:1px solid rgba(123,173,226,.13);border-radius:50%}
    .a6-hero-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.a6-live{display:flex;align-items:center;gap:6px;border:1px solid rgba(213,182,66,.28);background:rgba(213,182,66,.08);border-radius:999px;padding:6px 10px;color:#f0d979;font-size:9px;font-weight:900}.a6-live i{width:6px;height:6px;background:#58dfbc;border-radius:50%;box-shadow:0 0 10px #58dfbc}
    .a6-hero-copy{margin-top:27px}.a6-chip{display:inline-block;padding:5px 10px;border-radius:999px;border:1px solid rgba(118,217,250,.24);background:rgba(0,166,214,.09);color:#7bd9f8;font-size:9px;font-weight:900}.a6-hero-copy h1{font-size:clamp(24px,7vw,32px);line-height:1.25;margin:9px 0 2px;font-weight:900;color:#f6f7ff}.a6-hero-copy p{font-size:10.5px;line-height:1.8;color:#b4c0d9;margin:0;font-weight:700}
    .a6-hero-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:18px}.a6-hero-stats>div{padding:8px 3px;text-align:center;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(255,255,255,.07)}.a6-hero-stats b{display:block;font:700 18px 'Space Grotesk',sans-serif;color:#f0d45b}.a6-hero-stats span{display:block;font-size:8px;color:#c4cee2;font-weight:800;margin-top:2px}
    .a6-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.a6-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid rgba(107,132,181,.3);border-radius:14px;padding:11px 12px;background:rgba(15,23,43,.86);color:#dce7fb;font:900 10.5px Cairo;cursor:pointer;transition:.18s}.a6-btn:active{transform:scale(.985)}.a6-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.a6-btn.primary{background:linear-gradient(135deg,#7654ff,#5637d6);border-color:rgba(177,157,255,.3);color:#fff;box-shadow:0 9px 22px rgba(103,70,229,.25)}.a6-btn.small{padding:8px 10px;font-size:9.5px;border-radius:12px}.a6-btn.ghost{background:transparent;color:#abb8d3;box-shadow:none}
    .a6-section-head{display:flex;justify-content:space-between;align-items:end;gap:8px;margin-top:2px}.a6-section-head h2,.a6-card h2{margin:4px 0 0;font-size:15px;font-weight:900;color:#f1f4ff}.a6-section-head .a6-date{font-size:9px;color:#9ba9c3;font-weight:800}.a6-text-btn{display:inline-flex;align-items:center;gap:5px;border:0;background:none;color:#a994ff;font:900 9.5px Cairo;cursor:pointer}.a6-text-btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;transform:rotate(180deg)}
    .a6-card{border:1px solid rgba(91,125,183,.24);border-radius:20px;padding:14px;background:linear-gradient(155deg,#121b33,#0a1020);color:#edf2ff;box-shadow:0 16px 38px rgba(0,0,0,.23)}.a6-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.a6-card-head h2{font-size:13px}.a6-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;font-size:9px;color:#9caac4;font-weight:800}.a6-divider{height:1px;background:rgba(108,135,181,.17);margin:12px 0}
    .a6-grid4{display:grid;grid-template-columns:1fr 1fr;gap:8px}.a6-kpi{min-height:83px;padding:11px 12px;border:1px solid rgba(91,125,183,.22);border-radius:16px;background:linear-gradient(145deg,#111a31,#0a1020)}.a6-kpi span,.a6-kpi small{display:block;font-size:9px;color:#9eacc8;font-weight:800}.a6-kpi b{display:block;font:700 22px 'Space Grotesk',sans-serif;color:#f4f6ff;margin:3px 0}.a6-kpi small{font-size:8px;color:#6edec3}
    .a6-two-col{display:grid;grid-template-columns:1fr 1fr;gap:8px}.a6-badge{display:inline-flex;align-items:center;border:1px solid transparent;border-radius:999px;padding:5px 9px;font-size:8px;font-weight:900;white-space:nowrap}.a6-badge.mint{background:rgba(43,202,162,.11);border-color:rgba(73,218,178,.22);color:#69e0bf}.a6-badge.gold{background:rgba(213,182,66,.12);border-color:rgba(213,182,66,.3);color:#f0d979}.a6-badge.purple{background:rgba(112,80,255,.13);border-color:rgba(143,116,255,.24);color:#b09aff}
    .a6-session{display:flex;align-items:center;gap:11px;margin-top:13px}.a6-session-time{width:55px;height:58px;flex:none;border-radius:15px;background:linear-gradient(140deg,rgba(116,81,248,.28),rgba(0,166,214,.1));border:1px solid rgba(117,121,238,.3);display:flex;flex-direction:column;align-items:center;justify-content:center}.a6-session-time b{font:700 18px 'Space Grotesk';color:#fff}.a6-session-time span{font-size:8px;color:#89dbf4;font-weight:900}.a6-session strong{font-size:10px;color:#edf2ff}.a6-session p{font-size:8px;color:#9daac2;line-height:1.7;margin:3px 0}.a6-focus{font-size:8px;color:#70d9c0;font-weight:800}
    .a6-score{font:700 23px 'Space Grotesk';color:#f0d45b}.a6-score span{font-size:11px}.a6-chart{height:103px;display:flex;gap:7px;align-items:stretch;margin-top:8px}.a6-ylabels{display:flex;flex-direction:column;justify-content:space-between;font-size:7px;color:#8795b1}.a6-chart svg{width:100%;height:100%;overflow:visible}.a6-gridline{fill:none;stroke:rgba(144,165,204,.14);stroke-dasharray:3 4}.a6-chart-area{fill:rgba(130,95,255,.13)}.a6-chart-line{fill:none;stroke:#9474ff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.a6-chart-dots circle{fill:#f0d45b;stroke:#191438;stroke-width:2}.a6-days,.a6-weeks{display:flex;justify-content:space-between;font-size:6.5px;color:#8492ad;margin-top:2px;gap:2px}
    .a6-group-row{display:flex;overflow:auto;gap:8px;padding-bottom:3px;scrollbar-width:none}.a6-group-row::-webkit-scrollbar{display:none}.a6-group-card{flex:0 0 142px;text-align:start;border:1px solid rgba(91,125,183,.25);border-radius:17px;padding:11px;background:linear-gradient(150deg,#121b33,#0b1021);color:#eef3ff;cursor:pointer}.a6-group-mark{width:31px;height:31px;display:grid;place-items:center;background:rgba(106,79,239,.14);border:1px solid rgba(141,114,255,.22);color:#ae9cff;border-radius:11px}.a6-group-mark svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.a6-group-age{display:block;margin-top:8px;font-size:8px;color:#8f9db8;font-weight:900}.a6-group-card b{display:block;margin-top:2px;font-size:11px}.a6-group-count{display:block;margin-top:7px;color:#94a3bf;font-size:8px}.a6-group-count strong{font:700 16px 'Space Grotesk';color:#f2d763}.a6-group-card i{display:block;font-style:normal;font-size:8px;color:#75d9f5;margin-top:4px;font-weight:800}
    .a6-activity{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid rgba(108,135,181,.16)}.a6-activity:first-child{border-top:0}.a6-activity-icon{width:31px;height:31px;border-radius:11px;display:grid;place-items:center;font-size:13px;flex:none}.a6-activity-icon.mint{background:rgba(43,202,162,.12);color:#69e0bf}.a6-activity-icon.gold{background:rgba(213,182,66,.12);color:#f0d979}.a6-activity-icon.purple{background:rgba(112,80,255,.14);color:#b09aff}.a6-activity div{flex:1}.a6-activity b{display:block;font-size:9px}.a6-activity small{display:block;margin-top:2px;color:#8492ad;font-size:8px}.a6-activity-arrow{color:#7d8ca8}
    .a6-service-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}.a6-service-grid button{min-height:87px;padding:10px;border:1px solid rgba(91,125,183,.21);border-radius:15px;background:rgba(7,13,26,.55);color:#dfe8fb;text-align:start;cursor:pointer}.a6-service-grid svg{display:block;width:18px;height:18px;fill:none;stroke:#a994ff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;margin-bottom:7px}.a6-service-grid b{display:block;font-size:9px}.a6-service-grid small{display:block;margin-top:3px;font-size:7.5px;color:#8d9bb5;line-height:1.6}
    .a6-page-title{padding:3px 2px 2px}.a6-page-title h1{font-size:24px;margin:5px 0 3px;color:#f5f6ff}.a6-page-title p{font-size:10px;color:#9eacc7;margin:0;line-height:1.8}
    .a6-kpi-strip,.a6-session-overview{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.a6-kpi-strip>div,.a6-session-overview>div{padding:11px 8px;text-align:center;background:linear-gradient(150deg,#121b33,#0a1020);border:1px solid rgba(91,125,183,.23);border-radius:15px}.a6-kpi-strip b,.a6-session-overview b{display:block;font:700 20px 'Space Grotesk';color:#f0d45b}.a6-kpi-strip span,.a6-session-overview span{display:block;margin-top:3px;font-size:8px;color:#a2afc7;font-weight:800}
    .a6-filter-row{display:flex;overflow:auto;gap:6px;padding:2px 0 5px;scrollbar-width:none}.a6-filter-row button{flex:none;border:1px solid rgba(107,132,181,.3);background:#0d1528;color:#aebbd4;border-radius:999px;padding:7px 10px;font:800 8px Cairo;cursor:pointer}.a6-filter-row button.active{background:linear-gradient(135deg,#7553ff,#5937d8);color:#fff;border-color:#967dff}.a6-team-card{padding:0;overflow:hidden}.a6-team-card>div{padding:13px 14px}.a6-team-head{display:flex;align-items:center;gap:10px}.a6-team-mark{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;flex:none;background:rgba(0,166,214,.13);color:#7bd9f8;border:1px solid rgba(0,166,214,.22)}.a6-team-mark.purple{background:rgba(112,80,255,.13);color:#b09aff}.a6-team-mark.gold{background:rgba(213,182,66,.12);color:#f0d979}.a6-team-mark.mint{background:rgba(43,202,162,.12);color:#69e0bf}.a6-team-mark svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.a6-team-head h2{margin:2px 0 0;font-size:13px}.a6-team-count{margin-inline-start:auto;text-align:center}.a6-team-count b{display:block;font:700 18px 'Space Grotesk';color:#f0d45b}.a6-team-count small{font-size:7px;color:#98a6c0}.a6-team-meta{display:flex;flex-wrap:wrap;gap:10px;color:#aab8d0;font-size:8px;font-weight:800}.a6-team-meta span{display:flex;align-items:center;gap:5px}.a6-team-meta svg{width:13px;height:13px;fill:none;stroke:#8f7aff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.a6-roster{padding-top:0!important;padding-bottom:2px!important}.a6-player-row{display:flex;align-items:center;gap:9px;padding:9px 0;border-top:1px solid rgba(108,135,181,.15)}.a6-player-row:first-child{border-top:0}.a6-avatar{width:34px;height:34px;border-radius:50% 50% 50% 10px;background:linear-gradient(135deg,#164b75,#19213e);color:#9ce8ff;border:1px solid rgba(93,192,232,.3);display:grid;place-items:center;font-weight:900;flex:none}.a6-avatar.coach{background:linear-gradient(135deg,#553fb1,#1b1c3a);color:#d1c4ff;border-color:rgba(143,116,255,.32)}.a6-player-row>div{flex:1}.a6-player-row b{display:block;font-size:9px}.a6-player-row small{display:block;margin-top:2px;color:#92a0b8;font-size:8px}.a6-muted{font-size:9px;color:#8c9bb5}.a6-team-card .a6-card-foot{padding-top:0}
    .a6-session-card .a6-card-foot{border-top:1px solid rgba(108,135,181,.15);padding:10px 13px;margin:0}.a6-session-row{display:flex;align-items:center;gap:10px;padding:13px 14px 8px}.a6-time-pill{width:52px;flex:none;text-align:center;border-radius:13px;background:#101a31;border:1px solid rgba(96,136,197,.25);padding:7px 4px}.a6-time-pill b{display:block;font:700 12px 'Space Grotesk';color:#f0d45b}.a6-time-pill span{font-size:7px;color:#9caac4}.a6-session-info{flex:1;min-width:0}.a6-session-info b{display:block;font-size:9px}.a6-session-info p{margin:3px 0;color:#9eacc7;font-size:8px}.a6-coach-label{font-size:7px;color:#72dafa;font-weight:800}.a6-schedule-status{font-size:7px;color:#77dcbf;font-weight:900}.a6-schedule-status.today{color:#f0d979}.a6-week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:12px}.a6-week-grid>div{text-align:center;padding:8px 2px;border:1px solid rgba(91,125,183,.17);background:rgba(8,14,28,.65);border-radius:11px}.a6-week-grid span{display:block;font-size:6px;color:#94a2bb}.a6-week-grid b{display:block;margin-top:4px;font:700 10px 'Space Grotesk';color:#f0d45b}
    .a6-large-chart{height:155px;margin-top:10px}.a6-large-chart svg{width:100%;height:100%}.a6-weeks{display:flex;justify-content:space-between;font-size:7px;color:#8795b1}.a6-progress-row{padding:12px 0;border-top:1px solid rgba(108,135,181,.16)}.a6-progress-row:first-of-type{margin-top:8px}.a6-progress-row>div:first-child{display:flex;justify-content:space-between;font-size:9px}.a6-progress-row span{color:#72dcbf;font:700 10px 'Space Grotesk'}.a6-progress{height:7px;border-radius:99px;background:#202a42;margin-top:7px;overflow:hidden}.a6-progress i{display:block;height:100%;border-radius:99px;background:#72dafa}.a6-progress i.purple{background:#9474ff}.a6-progress i.gold{background:#edce55}.a6-progress i.mint{background:#58d8b5}.a6-results{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px}.a6-results>div{text-align:center;background:#0c1427;border:1px solid rgba(91,125,183,.18);border-radius:12px;padding:9px 3px}.a6-results b{display:block;font:700 16px 'Space Grotesk';color:#f0d45b}.a6-results span{font-size:7px;color:#98a6c0}.a6-note{margin-top:10px;padding:10px;border-right:2px solid #72dafa;background:rgba(0,166,214,.07);color:#b9c9e3;font-size:8px;line-height:1.8}
    .a6-profile-hero{display:flex;align-items:center;gap:11px;padding:16px;border:1px solid rgba(91,125,183,.3);border-radius:21px;background:radial-gradient(ellipse at 0 100%,rgba(0,166,214,.16),transparent 48%),linear-gradient(145deg,#111b34,#090f20)}.a6-profile-mark{width:54px;height:54px;display:grid;place-items:center;border-radius:18px 18px 18px 7px;background:linear-gradient(135deg,#e2c348,#9d7420);color:#11152a;font-size:24px;font-weight:900;flex:none}.a6-profile-hero>div:nth-child(2){flex:1;min-width:0}.a6-profile-hero h2{font-size:14px;margin:6px 0 1px}.a6-profile-hero p{font-size:8px;color:#9eacc7;margin:0}.a6-share{align-self:flex-start;border:1px solid rgba(143,116,255,.32);border-radius:11px;background:rgba(112,80,255,.15);color:#c5b6ff;padding:7px 8px;font:900 8px Cairo;cursor:pointer}.a6-branch-row{display:flex;align-items:center;gap:9px;padding:11px 0;border-top:1px solid rgba(108,135,181,.15)}.a6-branch-row:first-child{border-top:0}.a6-branch-icon{width:32px;height:32px;border-radius:11px;background:rgba(0,166,214,.1);color:#72dafa;display:grid;place-items:center}.a6-branch-icon.purple{background:rgba(112,80,255,.13);color:#b09aff}.a6-branch-row>div{flex:1}.a6-branch-row b{display:block;font-size:9px}.a6-branch-row small{display:block;margin-top:3px;color:#91a0bb;font-size:7px}.a6-link-list button{width:100%;display:flex;justify-content:space-between;padding:11px 0;border:0;border-top:1px solid rgba(108,135,181,.15);background:none;color:#dbe4f5;font:800 9px Cairo;text-align:start;cursor:pointer}.a6-link-list button span{color:#a994ff}
    .ac6-fab{position:fixed;z-index:100;right:max(20px,calc((100vw - 520px)/2 + 20px));bottom:94px;width:62px;height:62px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(199,181,255,.55);background:linear-gradient(145deg,#865cff,#5c39dc);color:#fff;box-shadow:0 0 0 7px rgba(15,12,32,.9),0 0 0 9px rgba(109,79,224,.38),0 12px 26px rgba(0,0,0,.48);cursor:pointer}.ac6-fab svg{width:29px;height:29px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .ac6-quick-menu{position:fixed;z-index:101;right:max(18px,calc((100vw - 520px)/2 + 18px));bottom:166px;width:min(300px,calc(100vw - 36px));padding:10px;border:1px solid rgba(143,116,255,.37);border-radius:20px;background:rgba(9,12,26,.97);box-shadow:0 22px 55px rgba(0,0,0,.58);backdrop-filter:blur(18px);display:none}.ac6-quick-menu.open{display:block;animation:popin .18s ease}.ac6-menu-head{display:flex;justify-content:space-between;align-items:center;padding:3px 5px 9px;color:#f0f3ff;font-size:11px;font-weight:900}.ac6-menu-head button{background:none;border:0;color:#aebbd4;font-size:20px}.ac6-quick-menu>button{width:100%;display:flex;align-items:center;gap:10px;padding:10px 8px;border:0;border-top:1px solid rgba(108,135,181,.15);background:none;color:#e5ecfc;font:800 10px Cairo;text-align:start;cursor:pointer}.ac6-quick-menu>button svg{width:18px;height:18px;fill:none;stroke:#aa94ff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .ac6-modal{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,4,12,.76);backdrop-filter:blur(6px)}.ac6-modal-card{position:relative;width:min(420px,100%);padding:22px;border:1px solid rgba(143,116,255,.35);border-radius:22px;background:linear-gradient(150deg,#131d36,#090f20);box-shadow:0 24px 70px rgba(0,0,0,.55)}.ac6-modal-card h2{margin:7px 0;color:#f4f6ff;font-size:18px}.ac6-modal-card p{margin:0 0 14px;color:#a6b4cd;font-size:10px;line-height:1.8}.ac6-modal-card label{display:block;margin:11px 0;color:#c8d4e8;font-size:9px;font-weight:900}.ac6-modal-card input,.ac6-modal-card select{display:block;width:100%;margin-top:6px;border:1px solid rgba(107,132,181,.35);border-radius:12px;padding:12px;background:#091124;color:#f2f5ff;font:600 12px Cairo;outline:0}.ac6-modal-card .a6-btn{width:100%;margin-top:8px}.ac6-close{position:absolute;top:12px;inset-inline-end:13px;width:30px;height:30px;border-radius:10px;border:1px solid rgba(107,132,181,.25);background:#111b30;color:#cbd5e8;font-size:19px;cursor:pointer}
    @media(min-width:700px){.a6-main{padding-inline:22px}.a6-hero{min-height:290px}.a6-two-col{gap:12px}.a6-card{padding:17px}.a6-group-card{flex-basis:160px}}
    @media(max-width:370px){.a6-main{padding-inline:12px}.a6-hero-stats b{font-size:15px}.a6-hero-stats span{font-size:7px}.a6-two-col{grid-template-columns:1fr}.a6-grid4 .a6-kpi{padding:9px}.a6-grid4 .a6-kpi b{font-size:20px}.a6-profile-hero{gap:8px;padding:12px}}
  `;
  const style=document.createElement("style");style.id="ac6Styles";style.textContent=css;document.head.appendChild(style);

  const previousRender=window.render;
  window.render=async function(){
    await previousRender.apply(this,arguments);
    try{
      const academy=!!(ME&&ME.role==="academy");
      document.body.classList.toggle("r-academy",academy);
      if(!academy){document.getElementById("ac6Fab")?.remove();AC6.closeQuick();return;}
      const hd=document.querySelector("#app .hd");
      if(hd){const current=VIEW||"acadHome";const home=current==="acad"||current==="acadHome";hd.innerHTML=`<button class="a6-header-side" onclick="${home?"go('hub')":"go('acadHome')"}" aria-label="${home?"الخدمات":"رجوع"}">${svg(home?"menu":"back")}</button><div style="display:flex;align-items:center;justify-content:center;flex:1">${typeof WM==="function"?WM(1):'<b class="wm">Play<span style="color:#e0c346">In</span><small>365</small></b>'}</div><button class="a6-header-avatar" onclick="go('acadProfile')" aria-label="ملف الأكاديمية">ن</button>`;}
      let fab=document.getElementById("ac6Fab");if(!fab){fab=document.createElement("button");fab.id="ac6Fab";fab.className="ac6-fab";fab.setAttribute("aria-label","اختصارات الأكاديمية");fab.title="اختصارات الأكاديمية";fab.innerHTML=svg("plus");fab.onclick=()=>AC6.openQuick();document.body.appendChild(fab);}
    }catch(e){console.error("Academy shell:",e)}
  };
})();
