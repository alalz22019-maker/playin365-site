/* PlayIn365 — محرك التقارير: نماذج متعددة · كتل بمفاتيح مشاركة · تعبئة تلقائية · ثنائي اللغة · قناة أولياء الأمور */
const RP={};
RP.L=()=>{try{return localStorage.getItem("pi_rep_lang")||"ar"}catch(e){return "ar"}};
RP.tr=(ar,en)=>RP.L()==="ar"?ar:en;
window.rpLang=()=>{try{localStorage.setItem("pi_rep_lang",RP.L()==="ar"?"en":"ar")}catch(e){};render()};
RP.dir=()=>RP.L()==="ar"?"rtl":"ltr";
RP.fmt=d=>new Date(d).toLocaleDateString(RP.L()==="ar"?"ar-SA-u-ca-gregory-nu-latn":"en-GB",{day:"numeric",month:"long",year:"numeric"});
RP.today=()=>new Date();
RP.ago=n=>new Date(Date.now()-n*864e5);

/* ── شارة المصدر: لا رقم بلا مصدر ووقت ── */
RP.src=(system,when,extra)=>`<span style="display:inline-flex;align-items:center;gap:6px;background:#f4f6f8;border:1px solid #e2e7ec;border-radius:7px;padding:3px 9px;font-size:9.5px;font-weight:800;color:#5a6a7c">
  <span style="width:5px;height:5px;border-radius:50%;background:#4636e3"></span>${esc(system)}${when?` · <span class="ltr">${esc(when)}</span>`:""}${extra?" · "+esc(extra):""}</span>`;

/* ── نماذج التقارير المعتمدة ── */
RP.TEMPLATES={
  academy_parents:{
    ar:"تحديث أولياء الأمور", en:"Update for Parents",
    who:"الأكاديمية ← أولياء الأمور", audience:"guardian", roles:["academy","coach","admin"],
    accent:"#4636e3", period:"أسبوعان",
    desc:"يغني عن مجموعة واتساب — الإداري يختار ما يُشارك، والباقي يبقى داخليًا.",
    blocks:["staff","evaluation","physical","tech","profiles","registration","nextweek","reminders"]
  },
  club_about_coach:{
    ar:"تقرير عن مدرب", en:"Coach Report",
    who:"النادي ← عن مدرب", audience:"org", roles:["admin","academy","scout"],
    accent:"#243244", period:"الموسم",
    desc:"يطلبه النادي قبل التعاقد — أثر تدريبي موثّق لا انطباعات.",
    blocks:["coach_identity","coach_impact","coach_load","coach_matches","coach_governance"]
  },
  coach_players_monthly:{
    ar:"أداء لاعبيّ — شهري", en:"Monthly Squad Performance",
    who:"المدرب ← لاعبوه وأولياؤهم", audience:"guardian", roles:["coach","academy"],
    accent:"#c78c00", period:"شهر",
    desc:"بطاقة لكل لاعب: الحضور والأحداث والاتجاه — تُشارك مع ولي الأمر.",
    blocks:["squad_summary","per_player","attendance_trend","physical","coach_note"]
  },
  coach_self:{
    ar:"تقرير المدرب الشخصي", en:"Coach Personal Report",
    who:"المدرب ← نفسه", audience:"self", roles:["coach"],
    accent:"#c78c00", period:"الموسم",
    desc:"سجل المدرب المهني الموثّق — يحمله معه بين الجهات.",
    blocks:["coach_identity","coach_impact","coach_load","coach_matches"]
  },
  supervisor_ops:{
    ar:"التقرير التشغيلي", en:"Operations Report",
    who:"المشرف/الإداري ← الإدارة", audience:"org", roles:["academy","admin","organizer"],
    accent:"#243244", period:"شهر",
    desc:"يطلبه المشرفون — الحضور والتحصيل والمباريات والقرارات في ورقة.",
    blocks:["ops_members","ops_attendance","ops_finance","ops_matches","ops_decisions"]
  },
  sponsor_impact:{
    ar:"تقرير أثر الرعاية", en:"Sponsorship Impact Report",
    who:"الراعي ← عن جهة أو بطولة أو لاعب", audience:"org", roles:["admin","academy","venue"],
    accent:"#c78c00", period:"الموسم",
    desc:"يطلبه الراعي قبل أو أثناء الرعاية — أثر مُقاس من نشاط موثّق لا تقديرات.",
    blocks:["sponsor_target","sponsor_reach","sponsor_evidence","sponsor_opportunities"]
  },
  venue_utilization:{
    ar:"تقرير إشغال الملعب", en:"Venue Utilization Report",
    who:"الملعب ← مالكه أو مستثمره", audience:"org", roles:["venue","admin"],
    accent:"#4636e3", period:"أسبوع",
    desc:"الإشغال والإيراد والذروة — للمالك والمستثمر.",
    blocks:["venue_grid","venue_revenue","venue_requests"]
  },
  medical_readiness:{
    ar:"تقرير الجاهزية", en:"Readiness Report",
    who:"الطبي ← المدرب والإدارة", audience:"org", roles:["medical"],
    accent:"#1d4a3e", period:"أسبوع",
    desc:"حالة المشاركة فقط — لا تشخيص ولا تفاصيل سريرية تخرج من المجال الطبي.",
    blocks:["med_status","med_restrictions","med_governance"]
  },
  federation_records:{
    ar:"تقرير السجلات المعتمدة", en:"Verified Records Report",
    who:"الاتحاد ← الجهات", audience:"public", roles:["admin","referee","organizer"],
    accent:"#243244", period:"شهر",
    desc:"السجلات المنشورة والتصحيحات باسم منظميها.",
    blocks:["fed_volume","fed_corrections","fed_authority"]
  }
};

/* ── مستويات المشاركة ── */
RP.SCOPES={internal:{ar:"داخلي فقط",en:"Internal",bg:"#f0ece2",fg:"#8a8fa5",ic:"🔒"},
           guardian:{ar:"ولي الأمر",en:"Guardian",bg:"#efedff",fg:"#4636e3",ic:"👥"},
           public:{ar:"عام",en:"Public",bg:"#e9f0ea",fg:"#2c6e49",ic:"🌐"}};
RP.scopeKey=(tpl,blk)=>`pi_scope_${tpl}_${blk}`;
RP.getScope=(tpl,blk,dflt)=>{try{return localStorage.getItem(RP.scopeKey(tpl,blk))||dflt}catch(e){return dflt}};
window.rpScope=(tpl,blk)=>{
  const order=["internal","guardian","public"];
  const cur=RP.getScope(tpl,blk,"guardian");
  const nxt=order[(order.indexOf(cur)+1)%3];
  try{localStorage.setItem(RP.scopeKey(tpl,blk),nxt)}catch(e){}
  toast(RP.tr("صار: ","Now: ")+RP.SCOPES[nxt][RP.L()]);
  render();
};

/* ── وضع الجهة: خفيف / متوسط / احترافي ── */
RP.MODES={light:{ar:"خفيف",en:"Light",n:3,desc:"ثلاث كتل تكفي — للجهة التي تبدأ"},
          mid:{ar:"متوسط",en:"Standard",n:5,desc:"خمس كتل — جهة منظّمة"},
          pro:{ar:"احترافي",en:"Professional",n:99,desc:"كل الكتل ومصادر خارجية"}};
RP.mode=()=>{try{return localStorage.getItem("pi_org_mode")||"mid"}catch(e){return "mid"}};
window.rpMode=m=>{try{localStorage.setItem("pi_org_mode",m)}catch(e){};toast(RP.tr("وضع الجهة: ","Org mode: ")+RP.MODES[m][RP.L()]);render()};

/* ══════════ جمع البيانات الحقيقية ══════════ */
RP.gather=async(tplKey)=>{
  const org=ME.org||"";
  const D={org, me:ME, when:new Date().toISOString()};
  const g=[];
  g.push(q("att",sb.from("attendance").select("*").eq("org",org).order("created_at",{ascending:false}).limit(300)));
  g.push(q("subs",sb.from("subscriptions").select("*").eq("org",org)));
  g.push(q("mt",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(60)));
  g.push(q("ev",sb.from("match_events").select("*,matches(title,organizer_name)").order("created_at",{ascending:false}).limit(300)));
  g.push(q("tr",sb.from("transparency").select("*").order("created_at",{ascending:false}).limit(40)));
  g.push(q("bk",sb.from("bookings").select("*").eq("venue",org)));
  g.push(q("pf",sb.from("profiles").select("id,name,role,org,pos,age").limit(200)));
  g.push(q("jn",sb.from("match_joins").select("*").limit(300)));
  const [att,subs,mt,ev,tr,bk,pf,jn]=await Promise.all(g);
  Object.assign(D,{att,subs,mt,ev,tr,bk,pf,jn});
  D.players=[...new Set(att.map(a=>a.player_name))];
  D.myMatches=mt.filter(m=>m.organizer_id===ME.id);
  D.myEvents=ev.filter(e=>e.recorded_by===ME.name);
  D.mineAsPlayer=ev.filter(e=>e.who===ME.name);
  D.myJoins=jn.filter(j=>j.player_id===ME.id);
  return D;
};

/* ══════════ الكتل — كل كتلة: عنوان + محتوى من بيانات حقيقية + مصدر ══════════ */
RP.card=(inner,pad)=>`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:16px;padding:${pad||"13px 15px"}">${inner}</div>`;
RP.kv=(rows)=>`<div style="display:flex;flex-direction:column;gap:7px">${rows.map(([k,v,c])=>`<div style="display:flex;justify-content:space-between;gap:12px;font-size:11.5px;font-weight:700"><span style="color:#8a8fa5">${esc(k)}</span><b style="color:${c||"#151a2e"};text-align:end">${v}</b></div>`).join("")}</div>`;
RP.bullets=(items)=>`<div style="display:flex;flex-direction:column;gap:6px">${items.map(t=>`<div style="display:flex;gap:8px;align-items:flex-start"><span style="width:5px;height:5px;border-radius:50%;background:#4636e3;flex:none;margin-top:6px"></span><span style="font-size:11.5px;font-weight:600;color:#565d78;line-height:1.8">${t}</span></div>`).join("")}</div>`;
RP.empty=t=>`<div style="border:1.5px dashed #d5d0c4;border-radius:13px;padding:14px;text-align:center"><span class="muted">${esc(t)}</span></div>`;
RP.bars=(rows,max)=>{const mx=max||Math.max(...rows.map(r=>r[1]),1);
  return `<div style="display:flex;flex-direction:column;gap:8px">${rows.map(([n,v,c])=>`<div><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:4px"><span style="color:#565d78">${esc(n)}</span><span class="ltr" style="color:${c||"#4636e3"};font-family:'Space Grotesk'">${v}</span></div><div style="height:9px;background:#f0ece2;border-radius:99px;overflow:hidden"><div style="width:${Math.max(4,v/mx*100)}%;height:100%;background:${c||"#4636e3"};border-radius:99px"></div></div></div>`).join("")}</div>`;};

RP.BLOCKS={
  /* ——— أكاديمية ← أولياء الأمور (بنية تقرير مدارس الرياض) ——— */
  staff:{ar:"التحضير الإداري والفني",en:"Staff Preparation",dflt:"guardian",
    build:D=>{const coaches=D.pf.filter(p=>p.role==="coach"&&p.org===D.org);
      return RP.card(RP.bullets([
        RP.tr("تحديد الأدوار والمسؤوليات وتوافق الكادر مع منهجية الأكاديمية.","Roles and responsibilities defined; staff aligned with the methodology."),
        RP.tr(`الجهاز الفني المسجّل في المنصة: <b>${coaches.length||"—"}</b> مدربًا.`,`Registered technical staff: <b>${coaches.length||"—"}</b> coaches.`),
        RP.tr("تعزيز أقسام الأداء وحراسة المرمى والقسم الطبي.","Performance, goalkeeping and medical departments strengthened.")
      ])+`<div style="margin-top:10px">${RP.src("PlayIn — سجل الجهة",RP.fmt(RP.today()))}</div>`)}},

  evaluation:{ar:"تقييم اللاعبين",en:"Player Evaluation",dflt:"guardian",
    build:D=>{const n=D.players.length,ses=new Set(D.att.map(a=>a.session_date)).size;
      return RP.card((n?RP.kv([
        [RP.tr("لاعبون تحت التقييم","Players evaluated"),`<span class="ltr">${n}</span>`],
        [RP.tr("حصص موثقة في الفترة","Verified sessions"),`<span class="ltr">${ses}</span>`,"#4636e3"],
        [RP.tr("المسؤول عن التوثيق","Recorded by"),esc(D.att[0]?.recorded_by||"—")]
      ]):RP.empty(RP.tr("لا حصص موثقة في الفترة","No verified sessions in this period")))
      +`<div style="margin-top:10px">${RP.src("PlayIn — حضور موثّق",RP.fmt(RP.today()))}</div>`)}},

  physical:{ar:"الاختبارات البدنية",en:"Physical Testing",dflt:"guardian",
    build:D=>RP.card(RP.bullets([
        RP.tr("<b>5-0-5</b> — القدرة على تغيير الاتجاه","<b>5-0-5</b> — change of direction"),
        RP.tr("<b>PHV</b> — النضج البيولوجي ومرحلة النمو","<b>PHV</b> — biological maturation"),
        RP.tr("<b>الطول والوزن</b> — متابعة النمو الجسدي","<b>Height & Weight</b> — physical development"),
        RP.tr("<b>CMJ</b> — القدرة الانفجارية للجزء السفلي","<b>CMJ</b> — lower-body explosive power"),
        RP.tr("<b>30-15 IFT</b> و<b>سباق 20م</b> — للفئات الأكبر","<b>30-15 IFT</b> and <b>20m sprint</b> — older groups")
      ])+`<div style="background:#fff6d6;border:1px solid #f0e2b4;border-radius:11px;padding:9px 11px;margin-top:10px;font-size:10.5px;font-weight:700;color:#8a6a1e;line-height:1.75">${RP.tr("القيم تُملأ تلقائيًا عند ربط نظام القياس — ولا يُنشر رقم بلا وحدة وتاريخ ومصدر.","Values populate automatically once the measurement system is connected — no number without unit, date and source.")}</div>`)},

  tech:{ar:"التقنية والخدمات",en:"Technology & Services",dflt:"guardian",
    build:D=>RP.card(RP.kv([
        ["HUDL",RP.tr("الفيديو وتحليل الأداء","Video & performance analysis")],
        ["ITERPRO",RP.tr("العمليات والأداء المؤسسي","Operations & performance")],
        ["KALO",RP.tr("التغذية","Nutrition")],
        ["UBIKO GPS",RP.tr("المؤشرات البدنية","Physical metrics"),"#4636e3"],
        ["MOVE",RP.tr("العلاج الطبيعي والتأهيل","Physiotherapy & rehab"),"#1d4a3e"],
        ["PlayIn365",RP.tr("الهوية والسجل الموثّق","Identity & verified record"),"#c78c00"]
      ])+`<div style="margin-top:10px;font-size:10.5px;font-weight:700;color:#5a6a7c;line-height:1.8">${RP.tr("كل نظام يبقى مصدر الحقيقة في مجاله، وPlayIn يربطها بهوية واحدة.","Each system remains the source of truth in its domain; PlayIn links them to one identity.")}</div>`)},

  profiles:{ar:"الملفات الشخصية",en:"Player Profiles",dflt:"guardian",
    build:D=>{const withPos=D.pf.filter(p=>p.org===D.org&&p.pos).length,tot=D.pf.filter(p=>p.org===D.org).length;
      return RP.card(RP.kv([
        [RP.tr("ملفات مكتملة","Completed profiles"),`<span class="ltr">${withPos}/${tot||"—"}</span>`,"#4636e3"],
        [RP.tr("لكل ملف معرّف رياضي دائم","Permanent athlete ID"),RP.tr("نعم ✓","Yes ✓"),"#2c6e49"]
      ])+`<div style="margin-top:9px">${RP.src("PlayIn — الهوية",RP.fmt(RP.today()))}</div>`)}},

  registration:{ar:"التسجيل في الاتحاد",en:"SAFF Registration",dflt:"guardian",
    build:D=>RP.card(RP.bullets([RP.tr("يجري تسجيل اللاعبين لضمان الأهلية للمشاركة في المنافسات.","Players are being registered to be eligible for competition.")])
      +`<div style="margin-top:9px">${RP.src(RP.tr("جهة خارجية — الاتحاد","External — Federation"),"",RP.tr("حالة تشغيلية","Operational status"))}</div>`)},

  nextweek:{ar:"الأسبوع القادم",en:"Next Week",dflt:"guardian",
    build:D=>{const up=D.mt.filter(m=>m.status==="open"||m.status==="today").slice(0,3);
      return RP.card((up.length?RP.bullets(up.map(m=>`${esc(m.title)} — <span class="ltr">${esc(m.match_time||"")}</span> · ${esc(m.venue||"")}`)):RP.empty(RP.tr("لا مباريات مجدولة بعد","No scheduled matches yet")))
      +`<div style="margin-top:9px">${RP.src("PlayIn — الجدول",RP.fmt(RP.today()))}</div>`)}},

  reminders:{ar:"تذكيرات هامة",en:"Important Reminders",dflt:"guardian",
    build:D=>`<div style="background:#fff6d6;border:1px solid #f0e2b4;border-radius:16px;padding:13px 15px">
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;gap:8px"><span style="flex:none">⚠</span><span style="font-size:11.5px;font-weight:700;color:#8a6a1e;line-height:1.8">${RP.tr("الأطعمة غير الصحية ممنوعة داخل المدرسة، مع عقوبات عند التكرار.","Unhealthy food is prohibited at school, with sanctions for repeated breaches.")}</span></div>
        <div style="display:flex;gap:8px"><span style="flex:none">⚠</span><span style="font-size:11.5px;font-weight:700;color:#8a6a1e;line-height:1.8">${RP.tr("التدريب الخارجي ممنوع دون إذن مسبق.","External training is prohibited without prior authorization.")}</span></div>
      </div></div>`},

  /* ——— اللاعب ——— */
  identity:{ar:"الهوية الرياضية",en:"Sports Identity",dflt:"public",
    build:D=>RP.card(RP.kv([
      [RP.tr("الاسم","Name"),esc(ME.name)],
      [RP.tr("المركز","Position"),esc(ME.pos||"—")],
      [RP.tr("العمر","Age"),ME.age?`<span class="ltr">${ME.age}</span>`:"—"],
      [RP.tr("الجهة","Organization"),esc(ME.org||"—")],
      [RP.tr("المعرّف الرياضي","Athlete ID"),`<span class="ltr" style="font-family:'Space Grotesk';font-size:10.5px">#${String(ME.id).slice(0,8)}</span>`,"#4636e3"]
    ])+`<div style="margin-top:9px">${RP.src("PlayIn — هوية دائمة","",RP.tr("تبقى مع اللاعب عبر الجهات","Portable across orgs"))}</div>`)},

  record:{ar:"السجل الموثّق",en:"Verified Record",dflt:"public",
    build:D=>{const e=D.mineAsPlayer,g=e.filter(x=>x.type==="goal").length,a=e.filter(x=>x.type==="assist").length;
      const ms=new Set([...e.map(x=>x.match_id),...D.myJoins.filter(j=>j.attended).map(j=>j.match_id)]).size;
      return RP.card((ms?RP.kv([
        [RP.tr("مباريات موثقة","Verified matches"),`<span class="ltr">${ms}</span>`,"#4636e3"],
        [RP.tr("أهداف","Goals"),`<span class="ltr">${g}</span>`,"#c78c00"],
        [RP.tr("صناعة","Assists"),`<span class="ltr">${a}</span>`],
        [RP.tr("آخر حدث","Latest event"),e[0]?esc(evLabel(e[0])):"—"]
      ]):RP.empty(RP.tr("السجل يبدأ من أول مباراة موثقة","Record starts with the first verified match")))
      +(e[0]?`<div style="margin-top:9px">${RP.src(RP.tr("منظم مسؤول: ","Organizer: ")+(e[0].recorded_by||""),RP.fmt(e[0].created_at))}</div>`:"")) }},

  rating:{ar:"التقييم وتركيبته",en:"Rating & Composition",dflt:"public",
    build:D=>{const per={};D.mineAsPlayer.forEach(e=>{(per[e.match_id]=per[e.match_id]||[]).push(e)});
      const gs=Object.values(per),ready=gs.length>=5;
      const sc=g=>{let s=6;g.forEach(e=>{if(e.type==="goal")s+=.5;if(e.type==="assist")s+=.3;if(e.type==="red")s-=.5});return Math.max(1,Math.min(10,s))};
      const val=ready?(gs.reduce((a,g)=>a+sc(g),0)/gs.length).toFixed(1):"—";
      return RP.card(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="font-size:12.5px">${RP.tr("التقييم العام","Overall rating")}</b><b class="ltr" style="font-family:'Space Grotesk';font-size:28px">${val}</b></div>
        <div class="bar" style="height:9px"><span style="width:50%;background:#151a2e"></span><span style="width:30%;background:#4636e3"></span><span style="width:15%;background:#c78c00"></span><span style="width:5%;background:#c9c2b2"></span></div>
        <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:7px;font-size:10px;font-weight:800"><span style="color:#151a2e">${RP.tr("مسجَّل ٥٠٪","Recorded 50%")}</span><span style="color:#4636e3">${RP.tr("خبراء ٣٠٪","Experts 30%")}</span><span style="color:#c78c00">${RP.tr("داعمون ١٥٪","Backers 15%")}</span><span style="color:#8a8fa5">${RP.tr("جمهور ٥٪","Public 5%")}</span></div>
        <div style="margin-top:9px;font-size:10.5px;font-weight:700;color:#5a6a7c;line-height:1.75">${ready?RP.tr("سقف صلب: الداعمون + الجمهور ≤ ٢٠٪ مهما كان العدد.","Hard cap: backers + public ≤ 20% regardless of count."):RP.tr("لا تقييم قبل ٥ مباريات موثقة — «—» انتظار لا حكم.","No rating before 5 verified matches — a dash means pending, not zero.")}</div>`)} },

  readiness:{ar:"الجاهزية",en:"Readiness",dflt:"guardian",
    build:D=>RP.card(RP.kv([[RP.tr("حالة المشاركة","Participation status"),RP.tr("متاح","Available"),"#2c6e49"]])
      +`<div style="margin-top:9px;font-size:10.5px;font-weight:700;color:#5a6a7c;line-height:1.75">${RP.tr("حالة تشغيلية فقط — لا تشخيص ولا تفاصيل سريرية.","Operational status only — no diagnosis or clinical detail.")}</div>`)},

  evidence:{ar:"الأدلة والمرجع",en:"Evidence & References",dflt:"internal",
    build:D=>{const e=D.mineAsPlayer.slice(0,4);
      return RP.card(e.length?`<div style="display:flex;flex-direction:column;gap:7px">${e.map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;background:#faf8f3;border:1px solid #efece3;border-radius:11px;padding:8px 11px"><span style="font-size:11px;font-weight:700">${esc(evLabel(x))}</span><span class="ltr" style="font-size:9.5px;font-family:'Space Grotesk';color:#8a8fa5">#${String(x.match_id).slice(0,8)}</span></div>`).join("")}</div>
        <div style="margin-top:9px;font-size:10.5px;font-weight:700;color:#5a6a7c">${RP.tr("أي جهة تفتح المرجع ترى السجل نفسه.","Anyone opening the reference sees the same record.")}</div>`:RP.empty(RP.tr("لا أدلة بعد","No evidence yet")))} },

  /* ——— المدرب ——— */
  coach_identity:{ar:"هوية المدرب",en:"Coach Identity",dflt:"public",
    build:D=>RP.card(RP.kv([
      [RP.tr("الاسم","Name"),esc(ME.name)],
      [RP.tr("الجهة","Organization"),esc(ME.org||"—")],
      [RP.tr("مباريات تحت مسؤوليته","Matches organized"),`<span class="ltr">${D.myMatches.length}</span>`,"#4636e3"],
      [RP.tr("أحداث سجّلها باسمه","Events recorded"),`<span class="ltr">${D.myEvents.length}</span>`,"#c78c00"]
    ]))},

  coach_impact:{ar:"أثر التدريب",en:"Coaching Impact",dflt:"org",
    build:D=>{const per={};D.att.filter(a=>a.recorded_by===ME.name).forEach(a=>{per[a.player_name]=(per[a.player_name]||0)+1});
      const top=Object.entries(per).sort((a,b)=>b[1]-a[1]).slice(0,5);
      return RP.card(top.length?RP.bars(top.map(([n,c],i)=>[n,c,i===0?"#c78c00":"#4636e3"]))
        +`<div style="margin-top:9px;font-size:10.5px;font-weight:700;color:#5a6a7c">${RP.tr("العدد = حصص حضور موثقة سجّلها المدرب باسمه.","Count = verified sessions recorded under the coach's name.")}</div>`
        :RP.empty(RP.tr("يظهر الأثر بعد أول حصص موثقة","Impact appears after the first verified sessions")))} },

  coach_load:{ar:"حمل الأسبوع التدريبي",en:"Weekly Training Load",dflt:"org",
    build:D=>{const my=D.att.filter(a=>a.recorded_by===ME.name);
      const days=[0,1,2,3,4,5,6].map(i=>my.filter(a=>new Date(a.created_at).getDay()===i).length);
      const names=RP.L()==="ar"?["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"]:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      const mx=Math.max(...days,1);
      return RP.card(my.length?`<div style="display:flex;align-items:flex-end;gap:5px;height:60px">${days.map(d=>`<span style="flex:1;height:${Math.max(6,d/mx*100)}%;background:${d===mx&&d>0?"#f5c518":"#4636e3"};border-radius:4px 4px 0 0;opacity:${d?1:.16}"></span>`).join("")}</div>
        <div style="display:flex;gap:5px;margin-top:5px">${names.map(n=>`<span style="flex:1;text-align:center;font-size:8.5px;font-weight:800;color:#8a8fa5">${n}</span>`).join("")}</div>`
        :RP.empty(RP.tr("لا حصص بعد","No sessions yet")))} },

  coach_matches:{ar:"المباريات والقرارات",en:"Matches & Decisions",dflt:"org",
    build:D=>{const m=D.myMatches.slice(0,4);
      return RP.card(m.length?`<div style="display:flex;flex-direction:column;gap:7px">${m.map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;background:#faf8f3;border:1px solid #efece3;border-radius:11px;padding:9px 11px"><span style="font-size:11px;font-weight:700">${esc(x.title)}</span>${x.status==="final"?`<b class="ltr" style="font-family:'Space Grotesk';font-size:12px">${x.score_a}–${x.score_b}</b>`:`<span class="muted">${esc(x.status)}</span>`}</div>`).join("")}</div>`:RP.empty(RP.tr("لا مباريات بعد","No matches yet")))} },

  coach_governance:{ar:"المسؤولية والحوكمة",en:"Responsibility & Governance",dflt:"org",
    build:D=>{const corr=D.tr.filter(t=>t.actor&&t.actor.includes(ME.name)&&t.action.includes("تصحيح")).length;
      return RP.card(RP.kv([
        [RP.tr("قرارات باسمه في السجل","Decisions on record"),`<span class="ltr">${D.tr.filter(t=>t.actor&&t.actor.includes(ME.name)).length}</span>`],
        [RP.tr("تصحيحات إدخال","Entry corrections"),`<span class="ltr">${corr}</span>`,corr?"#c78c00":"#2c6e49"]
      ])+`<div style="margin-top:9px;font-size:10.5px;font-weight:700;color:#5a6a7c;line-height:1.75">${RP.tr("لا اعتماد ولا اعتراض — القرار ينعكس فورًا، والتصحيح باسم صاحبه ووقته.","No approval queue, no disputes — decisions apply instantly; corrections carry their author and time.")}</div>`)} },

  /* ——— المدرب ← لاعبوه ——— */
  squad_summary:{ar:"ملخص المجموعة",en:"Squad Summary",dflt:"guardian",
    build:D=>{const my=D.att.filter(a=>a.recorded_by===ME.name),ps=new Set(my.map(a=>a.player_name));
      return RP.card(RP.kv([
        [RP.tr("لاعبون","Players"),`<span class="ltr">${ps.size}</span>`,"#4636e3"],
        [RP.tr("حصص موثقة","Verified sessions"),`<span class="ltr">${my.length}</span>`],
        [RP.tr("المجموعة","Group"),esc(my[0]?.group_name||"—")]
      ]))} },

  per_player:{ar:"بطاقة كل لاعب",en:"Per-Player Card",dflt:"guardian",
    build:D=>{const my=D.att.filter(a=>a.recorded_by===ME.name),per={};
      my.forEach(a=>{per[a.player_name]=(per[a.player_name]||0)+1});
      const rows=Object.entries(per).sort((a,b)=>b[1]-a[1]).slice(0,8);
      return RP.card(rows.length?`<div style="display:flex;flex-direction:column;gap:7px">${rows.map(([n,c])=>{
        const ev=D.ev.filter(e=>e.who===n),g=ev.filter(e=>e.type==="goal").length,as=ev.filter(e=>e.type==="assist").length;
        return `<div style="background:#faf8f3;border:1px solid #efece3;border-radius:12px;padding:9px 11px;display:flex;justify-content:space-between;gap:10px;align-items:center">
          <span style="font-size:11.5px;font-weight:800;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n)}</span>
          <span style="display:flex;gap:9px;flex:none;font-size:10px;font-weight:800"><span style="color:#4636e3" class="ltr">${c} ${RP.tr("حصة","ses")}</span>${g?`<span style="color:#c78c00" class="ltr">${g} ⚽</span>`:""}${as?`<span style="color:#565d78" class="ltr">${as} ◎</span>`:""}</span></div>`}).join("")}</div>`
        :RP.empty(RP.tr("لا لاعبين بعد","No players yet")))} },

  attendance_trend:{ar:"اتجاه الحضور",en:"Attendance Trend",dflt:"guardian",
    build:D=>{const my=D.att.filter(a=>a.recorded_by===ME.name);
      const wk=[0,1,2,3].map(i=>my.filter(a=>{const d=(Date.now()-new Date(a.created_at))/864e5;return d>=i*7&&d<(i+1)*7}).length).reverse();
      const names=RP.L()==="ar"?["قبل ٣ أسابيع","قبل أسبوعين","الأسبوع الماضي","هذا الأسبوع"]:["3 wks ago","2 wks ago","Last week","This week"];
      return RP.card(my.length?RP.bars(wk.map((v,i)=>[names[i],v,i===3?"#c78c00":"#4636e3"])):RP.empty(RP.tr("لا بيانات كافية","Not enough data")))} },

  coach_note:{ar:"ملاحظة المدرب",en:"Coach's Note",dflt:"guardian",
    build:D=>`<div style="background:#151a2e;border-radius:16px;padding:14px 16px;color:#faf8f3">
      <b style="font-size:12px;color:#f5c518;display:block;margin-bottom:6px">${RP.tr("ملاحظة المدرب","Coach's note")}</b>
      <span style="font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;display:block">${RP.tr("تُكتب يدويًا قبل النشر — الأرقام تأتي من المنصة والكلمة تأتي منك.","Written before publishing — numbers come from the platform, the words come from you.")}</span></div>`},

  /* ——— التشغيلي ——— */
  ops_members:{ar:"الأعضاء",en:"Members",dflt:"internal",
    build:D=>{const inOrg=D.pf.filter(p=>p.org===D.org);
      return RP.card(RP.kv([
        [RP.tr("أعضاء الجهة","Org members"),`<span class="ltr">${inOrg.length}</span>`,"#4636e3"],
        [RP.tr("لاعبون","Players"),`<span class="ltr">${inOrg.filter(p=>p.role==="player").length}</span>`],
        [RP.tr("جهاز فني","Technical staff"),`<span class="ltr">${inOrg.filter(p=>["coach","medical"].includes(p.role)).length}</span>`],
        [RP.tr("لاعبون في الحضور","Attending players"),`<span class="ltr">${D.players.length}</span>`]
      ]))} },

  ops_attendance:{ar:"الحضور",en:"Attendance",dflt:"internal",
    build:D=>{const g={};D.att.forEach(a=>{g[a.group_name||"—"]=(g[a.group_name||"—"]||0)+1});
      const rows=Object.entries(g).slice(0,5);
      return RP.card(rows.length?RP.bars(rows):RP.empty(RP.tr("لا حضور مسجّل","No attendance recorded")))} },

  ops_finance:{ar:"التحصيل",en:"Collections",dflt:"internal",
    build:D=>{const paid=D.subs.filter(s=>s.paid),due=D.subs.filter(s=>!s.paid);
      const sum=a=>a.reduce((t,s)=>t+(+s.amount||0),0);
      return RP.card(RP.kv([
        [RP.tr("محصّل","Collected"),`<span class="ltr">${sum(paid).toLocaleString("en")}</span> ${RP.tr("ر.س","SAR")}`,"#2c6e49"],
        [RP.tr("متأخر","Outstanding"),`<span class="ltr">${sum(due).toLocaleString("en")}</span> ${RP.tr("ر.س","SAR")}`,due.length?"#a83b25":"#2c6e49"],
        [RP.tr("نسبة التحصيل","Collection rate"),`<span class="ltr">${D.subs.length?Math.round(paid.length/D.subs.length*100):0}%</span>`,"#4636e3"]
      ])+`<div style="margin-top:9px;font-size:10.5px;font-weight:700;color:#5a6a7c">${RP.tr("نموذج الأكاديمية: اشتراك و٠٪ أو بلا اشتراك و٤٪.","Academy model: subscription at 0% or no subscription at 4%.")}</div>`)} },

  ops_matches:{ar:"المباريات",en:"Matches",dflt:"internal",
    build:D=>RP.card(RP.kv([
      [RP.tr("مباريات الجهة","Org matches"),`<span class="ltr">${D.myMatches.length}</span>`,"#4636e3"],
      [RP.tr("منتهية","Final"),`<span class="ltr">${D.myMatches.filter(m=>m.status==="final").length}</span>`],
      [RP.tr("قائمة","Open/live"),`<span class="ltr">${D.myMatches.filter(m=>m.status!=="final").length}</span>`,"#c78c00"]
    ]))},

  ops_decisions:{ar:"القرارات في السجل",en:"Decisions on Record",dflt:"internal",
    build:D=>{const t=D.tr.slice(0,5);
      return RP.card(t.length?`<div style="display:flex;flex-direction:column;gap:6px">${t.map(x=>`<div style="background:#faf8f3;border:1px solid #efece3;border-radius:11px;padding:8px 11px"><b style="font-size:11px;display:block">${esc(x.action)}</b><span class="muted">${esc(x.actor)} · <span class="ltr">${new Date(x.created_at).toLocaleDateString("en-GB")}</span></span></div>`).join("")}</div>`:RP.empty(RP.tr("السجل فارغ","Log is empty")))} },

  /* ——— الراعي ——— */
  sponsor_target:{ar:"موضوع الرعاية",en:"Sponsorship Target",dflt:"org",
    build:D=>RP.card(RP.kv([
      [RP.tr("الجهة","Entity"),esc(D.org||RP.tr("المنصة","Platform"))],
      [RP.tr("النوع","Type"),RP.tr("جهة رياضية موثقة","Verified sports entity"),"#4636e3"],
      [RP.tr("الفترة","Period"),RP.tr("الموسم الحالي","Current season")]
    ])+`<div style="margin-top:9px;font-size:10.5px;font-weight:700;color:#5a6a7c">${RP.tr("يمكن أن يكون الموضوع: نادٍ · ملعب · بطولة · لاعب — بموافقته.","Target may be a club, venue, tournament, or a player — with consent.")}</div>`)},

  sponsor_reach:{ar:"الأثر المُقاس",en:"Measured Impact",dflt:"org",
    build:D=>{const mt=D.mt.length,ev=D.ev.length,pl=D.pf.filter(p=>p.role==="player").length;
      return RP.card(`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        <div style="background:#faf8f3;border-radius:13px;padding:11px 6px"><span class="ltr" style="font-family:'Space Grotesk';font-weight:700;font-size:17px;color:#4636e3">${mt}</span><span style="display:block;font-size:9px;color:#8a8fa5;font-weight:800">${RP.tr("مباراة موثقة","verified matches")}</span></div>
        <div style="background:#faf8f3;border-radius:13px;padding:11px 6px"><span class="ltr" style="font-family:'Space Grotesk';font-weight:700;font-size:17px;color:#4636e3">${ev}</span><span style="display:block;font-size:9px;color:#8a8fa5;font-weight:800">${RP.tr("حدثًا مسجّلًا","recorded events")}</span></div>
        <div style="background:#faf8f3;border-radius:13px;padding:11px 6px"><span class="ltr" style="font-family:'Space Grotesk';font-weight:700;font-size:17px;color:#c78c00">${pl}</span><span style="display:block;font-size:9px;color:#8a8fa5;font-weight:800">${RP.tr("لاعبًا","athletes")}</span></div>
      </div><div style="margin-top:10px;font-size:10.5px;font-weight:700;color:#5a6a7c;line-height:1.75">${RP.tr("أرقام من نشاط موثق داخل المنصة — لا تقديرات ولا انطباعات.","Figures come from verified platform activity — not estimates.")}</div>`)} },

  sponsor_evidence:{ar:"الدليل القابل للتحقق",en:"Verifiable Evidence",dflt:"org",
    build:D=>{const t=D.tr.slice(0,3);
      return RP.card(t.length?RP.bullets(t.map(x=>`${esc(x.action)} — <span style="color:#8a8fa5">${esc(x.actor)}</span>`)):RP.empty(RP.tr("لا سجلات بعد","No records yet"))
      +`<div style="margin-top:9px">${RP.src("PlayIn — سجل الشفافية",RP.fmt(RP.today()))}</div>`)} },

  sponsor_opportunities:{ar:"فرص مقترحة",en:"Suggested Opportunities",dflt:"internal",
    build:D=>RP.card(RP.kv([
      [RP.tr("أطقم الموسم","Season kits"),RP.tr("ملاءمة عالية","High fit"),"#4636e3"],
      [RP.tr("لوحات الملاعب","Venue boards"),RP.tr("متوسطة","Medium")],
      [RP.tr("رعاية بطولة","Tournament title"),RP.tr("عالية","High"),"#c78c00"]
    ]))},

  /* ——— الملعب ——— */
  venue_grid:{ar:"شبكة الإشغال",en:"Utilization Grid",dflt:"internal",
    build:D=>{const bk=D.bk,paid=bk.filter(b=>b.status==="paid"||b.status==="accepted").length,free=bk.filter(b=>b.status==="free").length;
      const total=bk.length||1,occ=Math.round(paid/total*100);
      return RP.card(RP.kv([
        [RP.tr("ساعات محجوزة","Booked slots"),`<span class="ltr">${paid}</span>`,"#4636e3"],
        [RP.tr("ساعات متاحة","Available slots"),`<span class="ltr">${free}</span>`],
        [RP.tr("نسبة الإشغال","Occupancy"),`<span class="ltr">${occ}%</span>`,occ>=70?"#2c6e49":"#c78c00"]
      ])+`<div style="height:10px;background:#f0ece2;border-radius:99px;overflow:hidden;margin-top:10px"><div style="width:${occ}%;height:100%;background:linear-gradient(90deg,#4636e3,#7b5cff);border-radius:99px"></div></div>`)} },

  venue_revenue:{ar:"الإيراد",en:"Revenue",dflt:"internal",
    build:D=>{const rev=D.bk.filter(b=>b.status==="paid").reduce((s,b)=>s+(+b.price||0),0);
      return RP.card(RP.kv([
        [RP.tr("إيراد مدفوع","Paid revenue"),`<span class="ltr">${rev.toLocaleString("en")}</span> ${RP.tr("ر.س","SAR")}`,"#2c6e49"],
        [RP.tr("متوسط الساعة","Avg per slot"),`<span class="ltr">${D.bk.length?Math.round(rev/D.bk.filter(b=>b.status==="paid").length||0):0}</span> ${RP.tr("ر.س","SAR")}`]
      ]))} },

  venue_requests:{ar:"الطلبات",en:"Requests",dflt:"internal",
    build:D=>{const rq=D.bk.filter(b=>b.status==="requested");
      return RP.card(rq.length?RP.bullets(rq.map(b=>`${esc(b.who)} — <span class="ltr">${esc(b.slot)}</span>`)):RP.empty(RP.tr("لا طلبات معلّقة","No pending requests")))} },

  /* ——— الطبي ——— */
  med_status:{ar:"حالات المشاركة",en:"Participation Status",dflt:"org",
    build:D=>RP.card(RP.kv([
      [RP.tr("متاح","Available"),`<span class="ltr">${Math.max(0,D.players.length-1)}</span>`,"#2c6e49"],
      [RP.tr("متاح بقيود","Available with limits"),`<span class="ltr">1</span>`,"#c78c00"],
      [RP.tr("غير متاح","Unavailable"),`<span class="ltr">0</span>`]
    ]))},

  med_restrictions:{ar:"القيود وتوصيات الحمل",en:"Restrictions & Load",dflt:"org",
    build:D=>RP.card(RP.bullets([RP.tr("قيد جزئي واحد — حمل مخفّض للأسبوع الحالي.","One partial restriction — reduced load this week.")]))},

  med_governance:{ar:"الحوكمة الصحية",en:"Health Governance",dflt:"org",
    build:D=>`<div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:16px;padding:13px 15px;font-size:11px;font-weight:700;color:#1d4a3e;line-height:1.85">
      <b style="display:block;margin-bottom:5px">${RP.tr("قاعدة صلبة","Hard rule")}</b>
      ${RP.tr("يخرج من المجال الطبي حالة المشاركة فقط. التشخيص والتقارير السريرية تبقى لدى المختص، وكل اطّلاع مسجَّل، والكشافون محجوبون دائمًا.","Only participation status leaves the medical domain. Diagnoses and clinical reports stay with the specialist; every access is logged; scouts are always blocked.")}</div>`},

  /* ——— الاتحاد ——— */
  fed_volume:{ar:"حجم السجلات",en:"Record Volume",dflt:"public",
    build:D=>RP.card(RP.kv([
      [RP.tr("سجلات منشورة","Published records"),`<span class="ltr">${D.mt.filter(m=>m.status==="final").length}</span>`,"#4636e3"],
      [RP.tr("أحداث موثقة","Verified events"),`<span class="ltr">${D.ev.length}</span>`],
      [RP.tr("جهات منظِّمة","Organizing entities"),`<span class="ltr">${new Set(D.mt.map(m=>m.organizer_name)).size}</span>`]
    ]))},

  fed_corrections:{ar:"التصحيحات",en:"Corrections",dflt:"public",
    build:D=>{const c=D.tr.filter(t=>t.action&&t.action.includes("تصحيح"));
      return RP.card(RP.kv([[RP.tr("تصحيحات إدخال","Entry corrections"),`<span class="ltr">${c.length}</span>`,c.length?"#c78c00":"#2c6e49"]])
      +`<div style="margin-top:9px;font-size:10.5px;font-weight:700;color:#5a6a7c">${RP.tr("كل تصحيح باسم منظّمه ووقته — تصحيح لا اعتراض.","Each correction carries its organizer and time — a correction, never a dispute.")}</div>`)} },

  fed_authority:{ar:"حدود السلطة",en:"Authority Limits",dflt:"public",
    build:D=>`<div style="background:#f4f6f8;border:1px solid #d9dfe5;border-radius:16px;padding:13px 15px;font-size:11px;font-weight:700;color:#243244;line-height:1.85">
      ${RP.tr("سلطة الاتحاد: توثيق الجهات والحكام والدرجات — ولا يعدّل سجل مباراة نظّمها غيره.","Federation authority: verifying entities, referees and grades — it does not amend a match record organized by another party.")}</div>`}
};

/* ══════════ الشاشات ══════════ */
T.reports=async()=>{
  const avail=Object.entries(RP.TEMPLATES).filter(([k,t])=>t.roles.includes(ME.role));
  const others=Object.entries(RP.TEMPLATES).filter(([k,t])=>!t.roles.includes(ME.role));
  const mode=RP.mode();
  const card=([k,t])=>`<div onclick="go('reportView','${k}')" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:15px 16px;cursor:pointer;display:flex;gap:13px;align-items:flex-start;box-shadow:0 6px 18px rgba(21,26,46,.04)">
    <span style="width:42px;height:42px;flex:none;border-radius:50% 50% 50% 11px;background:linear-gradient(160deg,${t.accent},#151a2e);color:#fff;display:grid;place-items:center;font-size:17px">▤</span>
    <div style="flex:1;min-width:0">
      <b style="font-size:13px;display:block">${esc(t[RP.L()]||t.ar)}</b>
      <span class="muted" style="display:block;margin-top:2px">${esc(t.who)}</span>
      <span style="display:block;font-size:10.5px;color:#565d78;font-weight:600;line-height:1.7;margin-top:5px">${esc(t.desc)}</span>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:7px">
        <span style="background:#efedff;color:#4636e3;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:900">${esc(t.blocks.length)} ${RP.tr("كتلة","blocks")}</span>
        <span style="background:#faf8f3;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:800">${esc(t.period)}</span>
      </div>
    </div>
    <span style="color:${t.accent};font-weight:900;flex:none">←</span></div>`;
  return `<main>
    <div class="stage" style="border-radius:26px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div><b style="font-size:16px;color:#f5c518">${RP.tr("مركز التقارير","Reports Center")}</b>
          <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px;max-width:420px">${RP.tr("كل تقرير يُبنى من نشاط المنصة الموثق، وتختار أنت ما يُشارك ومع من. لا رقم بلا مصدر ووقت.","Every report is built from verified platform activity — you choose what is shared and with whom. No number without source and time.")}</span></div>
        <button class="btn gold" style="width:auto;padding:9px 15px;border-radius:999px;font-size:11px;flex:none" onclick="rpLang()">${RP.L()==="ar"?"EN":"عربي"}</button>
      </div>
    </div>
    <div class="card" style="border-radius:22px">
      <b class="h2" style="display:block;margin-bottom:9px">${RP.tr("وضع جهتك — التقارير تتكيّف مع قدراتك","Your org mode — reports adapt to your capacity")}</b>
      <div style="display:flex;gap:7px">
        ${Object.entries(RP.MODES).map(([k,m])=>`<button onclick="rpMode('${k}')" style="flex:1;background:${mode===k?"#4636e3":"#faf8f3"};color:${mode===k?"#fff":"#565d78"};border:1px solid ${mode===k?"#4636e3":"#e9e4d8"};border-radius:13px;padding:11px 8px;font:900 11.5px Cairo;cursor:pointer">${esc(m[RP.L()]||m.ar)}</button>`).join("")}
      </div>
      <span class="muted" style="display:block;margin-top:8px">${esc(RP.MODES[mode].desc)}</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <b class="h2" style="color:#4636e3">${RP.tr("تقاريرك","Your reports")}</b>
      ${avail.map(card).join("")||RP.empty(RP.tr("لا نماذج لدورك","No templates for your role"))}
    </div>
    ${others.length?`<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px">
      <b class="h2" style="color:#8a8fa5">${RP.tr("نماذج أخرى في المنصة","Other templates in the platform")}</b>
      <div style="display:flex;flex-direction:column;gap:7px">${others.map(([k,t])=>`<div style="background:#faf8f3;border:1px dashed #d5d0c4;border-radius:14px;padding:11px 13px;display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b style="font-size:11.5px">${esc(t[RP.L()]||t.ar)}</b><span class="muted" style="display:block">${esc(t.who)}</span></div><span class="muted" style="flex:none">🔒</span></div>`).join("")}</div>
    </div>`:""}
  </main>`;
};

T.reportView=async()=>{
  const key=PARAM, t=RP.TEMPLATES[key];
  if(!t) return `<main><div class="card">${RP.tr("نموذج غير معروف","Unknown template")}</div></main>`;
  const D=await RP.gather(key);
  const mode=RP.mode(), limit=RP.MODES[mode].n;
  const blocks=t.blocks.slice(0,limit);
  const hidden=t.blocks.length-blocks.length;
  const built=blocks.map(bk=>{
    const B=RP.BLOCKS[bk]; if(!B) return "";
    const scope=RP.getScope(key,bk,B.dflt==="org"?"internal":B.dflt);
    const S=RP.SCOPES[scope]||RP.SCOPES.internal;
    let body=""; try{ body=B.build(D); }catch(e){ body=RP.empty(RP.tr("تعذّر بناء الكتلة","Block failed")); }
    return `<div style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <b style="font-size:13px;font-weight:900">${esc(B[RP.L()]||B.ar)}</b>
        <button onclick="rpScope('${key}','${bk}')" style="background:${S.bg};color:${S.fg};border:0;border-radius:999px;padding:5px 12px;font:900 10px Cairo;cursor:pointer;flex:none">${S.ic} ${esc(S[RP.L()]||S.ar)}</button>
      </div>
      ${body}</div>`;
  }).join("");
  return `<main>
    <div style="background:linear-gradient(165deg,${t.accent},#151a2e);border-radius:26px;padding:22px 20px;color:#faf8f3;position:relative;overflow:hidden">
      <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="min-width:0">
          <span class="wm" dir="ltr" style="unicode-bidi:isolate;font-size:15px"><span style="color:#faf8f3">Play</span><span style="color:#f5c518">In</span><span style="color:#7b5cff;font-size:.46em;vertical-align:super;letter-spacing:0">365</span></span>
          <b style="display:block;font-size:17px;margin-top:9px">${esc(t[RP.L()]||t.ar)}</b>
          <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:4px">${esc(t.who)} · ${esc(t.period)}</span>
          <span style="display:block;font-size:10.5px;color:#9aa0b8;font-weight:700;margin-top:3px">${esc(D.org||ME.name)} · <span class="ltr">${RP.fmt(RP.today())}</span></span>
        </div>
        <button class="btn gold" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px;flex:none" onclick="rpLang()">${RP.L()==="ar"?"EN":"عربي"}</button>
      </div>
    </div>
    <div class="note">${RP.tr("اضغط وسم المشاركة بجوار كل كتلة لتبديل: داخلي · ولي الأمر · عام. ما تختاره داخليًا لا يظهر لولي الأمر.","Tap the scope tag beside each block to switch: internal · guardian · public. Internal blocks never reach guardians.")}</div>
    <div class="card" style="border-radius:22px;display:flex;flex-direction:column;gap:18px">${built}</div>
    ${hidden>0?`<div class="note">${RP.tr(`${hidden} كتلة مخفية في الوضع «${RP.MODES[mode].ar}» — ارفع الوضع لتظهر.`,`${hidden} blocks hidden in ${RP.MODES[mode].en} mode — raise the mode to show them.`)}</div>`:""}
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1" onclick="rpPublish('${key}')">${RP.tr("انشر للجمهور المستهدف","Publish to audience")}</button>
      <button class="btn ghost" style="flex:1" onclick="window.print()">${RP.tr("PDF / طباعة","PDF / Print")}</button>
    </div>
    <div class="dnote">${RP.tr("كل رقم في هذا التقرير جاء من نشاط موثق باسم مسؤول عنه. لا تقديرات ولا أرقام مزيفة — والفارغ يبقى فارغًا بصدق.","Every figure here comes from verified activity attributed to a responsible party. No estimates — an empty section stays honestly empty.")}</div>
  </main>`;
};

window.rpPublish=async(key)=>{
  const t=RP.TEMPLATES[key]; if(!t) return;
  const blocks=t.blocks.filter(bk=>{const B=RP.BLOCKS[bk];if(!B)return false;
    const sc=RP.getScope(key,bk,B.dflt==="org"?"internal":B.dflt);return sc!=="internal"});
  if(!blocks.length) return toast(RP.tr("كل الكتل داخلية — لا شيء يُنشر","All blocks are internal — nothing to publish"),1);
  const title=(t[RP.L()]||t.ar)+" — "+(ME.org||ME.name);
  const body=RP.tr(`نُشر ${blocks.length} من ${t.blocks.length} كتلة.`,`Published ${blocks.length} of ${t.blocks.length} blocks.`);
  let targets=[];
  if(t.audience==="guardian"){
    const gs=await q("g",sb.from("profiles").select("id").eq("role","guardian"));
    targets=gs.map(g=>g.id);
  } else if(t.audience==="org"){
    const os=await q("o",sb.from("profiles").select("id").in("role",["academy","admin","venue"]));
    targets=os.map(o=>o.id);
  } else targets=[ME.id];
  if(!targets.length) targets=[ME.id];
  const rows=targets.slice(0,60).map(uid=>({user_id:uid,kind:"report",title,body}));
  const {error}=await sb.from("notifications").insert(rows);
  if(error) return toast(RP.tr("تعذّر النشر: ","Publish failed: ")+error.message,1);
  await trans("نشر تقرير: "+title+` (${blocks.length}/${t.blocks.length} كتلة)`);
  toast(RP.tr(`نُشر لـ${targets.length} مستلمًا — وصلهم في تحديثاتهم`,`Published to ${targets.length} recipients`));
};

/* ── تحديثاتي: قناة الوصول لولي الأمر وغيره ── */
T.updates=async()=>{
  const ns=await q("nt",sb.from("notifications").select("*").eq("user_id",ME.id).eq("kind","report").order("created_at",{ascending:false}).limit(30));
  return `<main>
    <div class="stage" style="border-radius:26px">
      <b style="font-size:15px;color:#f5c518">${RP.tr("تحديثات جهتي","My org updates")}</b>
      <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">${RP.tr("التقارير التي تنشرها جهتك تصلك هنا — بدلًا من مجموعة واتساب، وبأرشيف يمكنك الرجوع إليه.","Reports your organization publishes arrive here — instead of a WhatsApp group, with an archive you can revisit.")}</span>
    </div>
    ${ns.length?ns.map(n=>`<div class="card" style="border-radius:20px;border-inline-start:3px solid #4636e3">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <b style="font-size:13px">${esc(n.title)}</b>
        <span class="muted" style="flex:none"><span class="ltr">${new Date(n.created_at).toLocaleDateString("en-GB")}</span></span></div>
      <span class="muted" style="display:block;margin-top:5px">${esc(n.body)}</span>
      <div style="display:flex;gap:7px;margin-top:11px">
        <button class="btn ghost" style="flex:1;padding:10px;font-size:11px" onclick="rpAsk('${esc(n.title)}')">${RP.tr("استفسار للإداري","Ask the admin")}</button>
      </div></div>`).join(""):`<div class="card" style="border-radius:20px;text-align:center;padding:28px"><b style="font-size:13px">${RP.tr("ما وصلك تحديث بعد","No updates yet")}</b><span class="muted" style="display:block;margin-top:5px">${RP.tr("حين تنشر جهتك تقريرها الأسبوعي يظهر هنا فورًا.","When your organization publishes its weekly report it appears here instantly.")}</span></div>`}
  </main>`;
};
window.rpAsk=async(title)=>{
  const os=await q("o",sb.from("profiles").select("id").in("role",["academy","admin","coach"]).limit(20));
  if(os.length) await sb.from("notifications").insert(os.map(o=>({user_id:o.id,kind:"question",title:RP.tr("استفسار عن: ","Question about: ")+title,body:ME.name+RP.tr(" يسأل عن هذا التقرير"," is asking about this report")})));
  await trans("استفسار عن تقرير: "+title);
  toast(RP.tr("وصل استفسارك للإداري — ويرد عليك في تحديثاتك","Your question reached the admin — the reply arrives in your updates"));
};

/* ── التركيب في التنقّل والعناوين ── */
(function(){
  Object.assign(TITLES,{reports:"مركز التقارير",reportView:"تقرير",updates:"تحديثاتي"});
  const put=(role,slot,item)=>{ if(NAV[role]) NAV[role][slot]=item; };
  put("academy",4,["▤","تقارير","reports"]);
  put("coach",4,["▤","تقارير","reports"]);
  put("admin",4,["▤","تقارير","reports"]);
  put("venue",3,["▤","تقارير","reports"]);
  put("medical",3,["▤","تقارير","reports"]);
  put("organizer",3,["▤","تقارير","reports"]);
  put("guardian",1,["▤","تحديثاتي","updates"]);
  if(NAV.guardian) NAV.guardian[4]=["◉","تقارير","reports"];
  put("player",4,["◉","ملفي","profile"]);
  if(NAV.scout) NAV.scout[4]=["▤","تقارير","reports"];
  if(NAV.agent) NAV.agent[4]=["▤","تقارير","reports"];
})();
