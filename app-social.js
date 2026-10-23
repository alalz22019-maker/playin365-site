/* PlayIn365 — الدفعة ٣: الطبقة الاجتماعية · خط زمني حيّ · قصة الموسم · إنجازات تنبثق */
const SO={};

/* ── الإنجازات: كل درع بمرجعه الموثق ── */
SO.BADGES=[
  {k:"first_goal", ar:"أول هدف موثق",  ic:"⚽", g:"linear-gradient(160deg,#f5c518,#c78c00)", test:s=>s.goals>=1,  need:"سجّل هدفك الأول"},
  {k:"five_matches",ar:"خمس مباريات",   ic:"▤", g:"linear-gradient(160deg,#4636e3,#2a2260)", test:s=>s.matches>=5,need:"أكمل ٥ مباريات موثقة"},
  {k:"hattrick",   ar:"هاتريك",        ic:"✦", g:"linear-gradient(160deg,#e8531f,#a83b25)", test:s=>s.hat,      need:"٣ أهداف في مباراة"},
  {k:"provider",   ar:"صانع الفرص",     ic:"◎", g:"linear-gradient(160deg,#4636e3,#7b5cff)", test:s=>s.assists>=3,need:"٣ صناعات موثقة"},
  {k:"regular",    ar:"منتظم",          ic:"◈", g:"linear-gradient(160deg,#2c6e49,#1d4a3e)", test:s=>s.weeks>=4, need:"نشاط في ٤ أسابيع"},
  {k:"ten_goals",  ar:"عشرة أهداف",     ic:"★", g:"linear-gradient(160deg,#c78c00,#8a6a1e)", test:s=>s.goals>=10,need:"١٠ أهداف موثقة"}
];
SO.stats=(evs,joins)=>{
  const per={};evs.forEach(e=>{(per[e.match_id]=per[e.match_id]||[]).push(e)});
  const wk=new Set([...evs,...joins].map(x=>{const d=new Date(x.created_at);return d.getFullYear()+"-"+Math.floor((d-new Date(d.getFullYear(),0,1))/6048e5)}));
  return {
    goals:evs.filter(e=>e.type==="goal").length,
    assists:evs.filter(e=>e.type==="assist").length,
    matches:new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size,
    hat:Object.values(per).some(g=>g.filter(e=>e.type==="goal").length>=3),
    weeks:wk.size
  };
};
SO.seen=()=>{try{return JSON.parse(localStorage.getItem("pi_badges_seen")||"[]")}catch(e){return []}};
SO.markSeen=ks=>{try{localStorage.setItem("pi_badges_seen",JSON.stringify(ks))}catch(e){}};

/* ── خط زمني حيّ: كل بطاقة حدث حقيقي بمصدره ── */
SO.timeline=(evs,joins,matches,att,name)=>{
  const items=[];
  evs.forEach(e=>items.push({t:e.created_at,kind:"event",e}));
  joins.forEach(j=>items.push({t:j.created_at,kind:"join",j}));
  att.filter(a=>a.player_name===name).forEach(a=>items.push({t:a.created_at,kind:"session",a}));
  matches.filter(m=>m.status==="live").forEach(m=>items.push({t:new Date().toISOString(),kind:"live",m}));
  return items.sort((a,b)=>new Date(b.t)-new Date(a.t)).slice(0,14);
};
SO.rel=d=>{
  const s=(Date.now()-new Date(d))/1000;
  if(s<3600) return "قبل قليل";
  if(s<86400) return `قبل ${Math.floor(s/3600)} ساعة`;
  if(s<604800) return `قبل ${Math.floor(s/86400)} يوم`;
  if(s<2592000) return `قبل ${Math.floor(s/604800)} أسبوع`;
  return `قبل ${Math.floor(s/2592000)} شهر`;
};

T.feed=async()=>{
  const [evs,joins,matches,att]=await Promise.all([
    q("ev",sb.from("match_events").select("*,matches(title,organizer_name,score_a,score_b)").eq("who",ME.name).order("created_at",{ascending:false}).limit(60)),
    q("jn",sb.from("match_joins").select("*,matches(title,status)").eq("player_id",ME.id).order("created_at",{ascending:false}).limit(40)),
    q("mt",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(20)),
    q("att",sb.from("attendance").select("*").eq("player_name",ME.name).order("created_at",{ascending:false}).limit(40))
  ]);
  const st=SO.stats(evs,joins);
  const earned=SO.BADGES.filter(b=>b.test(st));
  const fresh=earned.filter(b=>!SO.seen().includes(b.k));
  if(fresh.length) SO.markSeen(earned.map(b=>b.k));
  const tl=SO.timeline(evs,joins,matches,att,ME.name);
  const live=matches.find(m=>m.status==="live");
  const streakWeeks=st.weeks;

  const row=(it)=>{
    if(it.kind==="live") return `<div onclick="go('matchView','${it.m.id}')" style="background:#151a2e;border-radius:20px;padding:15px 17px;color:#faf8f3;cursor:pointer;position:relative;overflow:hidden">
      <div style="position:absolute;inset-inline-start:70%;top:-60%;width:65%;height:220%;background:#e8531f;border-radius:50%;opacity:.4"></div>
      <div style="position:relative;display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div><span style="display:inline-flex;align-items:center;gap:6px;background:#e8531f;border-radius:999px;padding:3px 11px;font-size:10px;font-weight:900"><span style="width:6px;height:6px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite"></span>مباشر</span>
          <b style="display:block;font-size:13px;margin-top:6px">${esc(it.m.title)}</b>
          <span style="font-size:10.5px;color:#c6cade;font-weight:700">المنظم: ${esc(it.m.organizer_name)}</span></div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:26px;flex:none">${it.m.score_a}–${it.m.score_b}</b></div></div>`;
    if(it.kind==="event"){const e=it.e,isG=e.type==="goal",isA=e.type==="assist";
      return `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start">
        <span style="width:40px;height:40px;flex:none;border-radius:50% 50% 50% 10px;background:${isG?"linear-gradient(160deg,#f5c518,#c78c00)":isA?"linear-gradient(160deg,#4636e3,#7b5cff)":"#f0ece2"};color:${isG||isA?"#fff":"#8a8fa5"};display:grid;place-items:center;font-size:17px">${isG?"⚽":isA?"◎":"▮"}</span>
        <div style="flex:1;min-width:0">
          <b style="font-size:13px;display:block">${esc(evLabel(e))}</b>
          <span class="muted" style="display:block;margin-top:2px">${esc(e.matches?.title||"مباراة")} · الدقيقة ${N(e.minute)}</span>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:7px">
            <span style="background:#fff6d6;color:#c78c00;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:900">وثّقه ${esc(e.recorded_by)} ✓</span>
            <span style="background:#faf8f3;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:800">${SO.rel(e.created_at)}</span></div></div></div>`;}
    if(it.kind==="join"){const j=it.j;
      return `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:13px 16px;display:flex;gap:12px;align-items:center">
        <span style="width:36px;height:36px;flex:none;border-radius:11px;background:${j.attended?"#e9f0ea":"#fff6d6"};color:${j.attended?"#2c6e49":"#c78c00"};display:grid;place-items:center;font-size:15px">${j.attended?"✓":"◔"}</span>
        <div style="flex:1;min-width:0"><b style="font-size:12.5px">${esc(j.matches?.title||"مباراة")}</b>
          <span class="muted" style="display:block">${j.attended?"حضور مؤكد":"بانتظار تأكيد حضورك"} · ${SO.rel(j.created_at)}</span></div>
        ${!j.attended?`<button class="btn" style="width:auto;padding:7px 13px;border-radius:999px;font-size:10px;flex:none" onclick="confAtt('${j.id}')">أكّد</button>`:""}</div>`;}
    const a=it.a;
    return `<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:18px;padding:12px 15px;display:flex;gap:11px;align-items:center">
      <span style="width:32px;height:32px;flex:none;border-radius:10px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:14px">◈</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">حصة تدريب — ${esc(a.group_name||"")}</b>
        <span class="muted" style="display:block">سجّلها ${esc(a.recorded_by)} · ${SO.rel(a.created_at)}</span></div></div>`;
  };

  return `<main>
  ${fresh.length?`<div style="background:linear-gradient(160deg,#f5c518,#c78c00);border-radius:26px;padding:20px;color:#151a2e;position:relative;overflow:hidden;animation:popin .5s cubic-bezier(.2,1.3,.4,1)">
    <div style="position:relative;display:flex;gap:14px;align-items:center">
      <span style="width:56px;height:64px;flex:none;background:#151a2e;clip-path:polygon(50% 0,100% 16%,100% 66%,50% 100%,0 66%,0 16%);display:grid;place-items:center;font-size:23px;color:#f5c518">${fresh[0].ic}</span>
      <div style="flex:1;min-width:0"><span style="font-size:10.5px;font-weight:900;opacity:.75">إنجاز جديد</span>
        <b style="display:block;font-size:17px;margin-top:2px">${esc(fresh[0].ar)}</b>
        <span style="font-size:11px;font-weight:700;opacity:.8">دخل خزانتك بمرجعه الموثق${fresh.length>1?` · و${N(fresh.length-1)} غيره`:""}</span></div></div></div>`:""}

  <div class="stage" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div style="min-width:0"><b style="font-size:17px">هلا ${esc(ME.name.split(" ")[0])} 👋</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:600;margin-top:3px">${live?"مباراة مباشرة الآن — تابعها":streakWeeks>=2?`نشاطك متصل ${N(streakWeeks)} أسبوعًا — واصل`:"استكشف القريب منك وابدأ سجلك"}</span></div>
      <div style="display:flex;gap:7px;flex:none">
        <div style="text-align:center"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:19px;color:#f5c518">${st.goals}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">هدف</span></div>
        <div style="text-align:center"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:19px;color:#faf8f3">${st.matches}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">مباراة</span></div>
      </div></div>
  </div>

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#4636e3">خزانة الإنجازات</b>
      <span class="muted">${N(earned.length)}/${N(SO.BADGES.length)}</span></div>
    <div style="display:flex;gap:9px;flex-wrap:wrap">
      ${SO.BADGES.map(b=>{const has=b.test(st);
        return `<div title="${esc(has?b.ar:b.need)}" style="display:flex;flex-direction:column;align-items:center;gap:5px;width:62px">
          <span style="width:56px;height:64px;background:${has?b.g:"#efece3"};${has?"":"border:2px dashed #d5d0c4;"}clip-path:polygon(50% 0,100% 16%,100% 66%,50% 100%,0 66%,0 16%);display:grid;place-items:center;font-size:${has?"20px":"15px"};color:${has?"#fff":"#b0aa9c"}">${has?b.ic:"؟"}</span>
          <span style="font-size:8.5px;font-weight:800;color:${has?"#565d78":"#b0aa9c"};text-align:center;line-height:1.4">${esc(has?b.ar:"مقفل")}</span></div>`}).join("")}
    </div>
    <span class="muted" style="display:block;margin-top:10px">كل درع مرتبط بحدث موثق باسم منظمه — لا شارات مجانية.</span>
  </div>

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
      <b class="h2" style="color:#4636e3">قصة موسمي</b>
      <button class="btn ghost" style="width:auto;padding:7px 14px;border-radius:999px;font-size:10.5px" onclick="soStory()">شارِكها</button></div>
    ${st.matches?`<div style="background:linear-gradient(165deg,#4636e3,#151a2e);border-radius:20px;padding:18px;color:#faf8f3">
      <span class="wm" dir="ltr" style="unicode-bidi:isolate;font-size:13px"><span style="color:#faf8f3">Play</span><span style="color:#f5c518">In</span><span style="color:#7b5cff;font-size:.46em;vertical-align:super;letter-spacing:0">365</span></span>
      <b style="display:block;font-size:15px;margin-top:11px">${esc(ME.name)}</b>
      <span style="font-size:11px;color:#c6cade;font-weight:700">${esc(ME.pos||"لاعب")}${ME.org?" · "+esc(ME.org):""}</span>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px">
        <div style="background:rgba(255,255,255,.09);border-radius:13px;padding:11px 6px;text-align:center"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:20px;color:#f5c518">${st.matches}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">مباراة موثقة</span></div>
        <div style="background:rgba(255,255,255,.09);border-radius:13px;padding:11px 6px;text-align:center"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:20px;color:#faf8f3">${st.goals}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">هدف</span></div>
        <div style="background:rgba(255,255,255,.09);border-radius:13px;padding:11px 6px;text-align:center"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:20px;color:#faf8f3">${st.assists}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">صناعة</span></div>
      </div>
      <span style="display:block;font-size:10px;color:#9aa0b8;font-weight:700;margin-top:11px;line-height:1.7">كل رقم موثق باسم منظم مسؤول — يمكن لأي جهة التحقق منه.</span></div>`
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:18px;padding:20px;text-align:center"><b style="font-size:12.5px">قصتك تبدأ من أول مباراة</b><span class="muted" style="display:block;margin-top:4px">انضم لمباراة قريبة ليبدأ سجلك</span><button class="btn" style="margin-top:11px" onclick="go('explore')">استكشف</button></div>`}
  </div>

  <div style="display:flex;flex-direction:column;gap:9px">
    <b class="h2" style="color:#4636e3">خط نشاطك</b>
    ${tl.length?tl.map(row).join(""):`<div class="card" style="border-radius:20px;text-align:center;padding:24px"><span class="muted">لا نشاط بعد — كل حدث يوثقه منظم يظهر هنا لحظتها</span></div>`}
  </div>
  </main>`;
};
window.soStory=()=>{
  const url="https://playin365.app";
  const txt=`سجلي الرياضي الموثق على PlayIn365 — ${ME.name}`;
  if(navigator.share) navigator.share({title:"PlayIn365",text:txt,url}).catch(()=>{});
  else { try{navigator.clipboard.writeText(txt+" "+url)}catch(e){} toast("نُسخ رابط قصتك"); }
};

/* ── التركيب: خط النشاط أول شاشة اللاعب ── */
(function(){
  Object.assign(TITLES,{feed:"نشاطي"});
  if(NAV.player) NAV.player=[["⌂","نشاطي","feed"],["◎","استكشف","explore"],["FAB","","newMatch"],["▤","سجلي","records"],["◉","ملفي","profile"]];
})();
