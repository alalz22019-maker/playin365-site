/* PlayIn365 — عمود المنظّم مطابقًا للتصميم المعتمد «Organizer App» (5a–5h)
   يُحمَّل بعد app-erp-wide.js. قطرة اللاعب/العام أسفل-يسار · المباشر بقرص برتقالي.
   يحمل ما اعتُمد مؤخرًا: الصور الشخصية · رمز الانضمام · إذن وليّ الأمر مرة واحدة · مفتاح التنقّل. */
const ORG = {};
ORG.DROP="50% 50% 50% 8px"; ORG.dash="—";
ORG.esn = s => esc(String(s==null?"":s));
ORG.av  = (n,sz,o) => PL3.av(n, sz||34, Object.assign({dark:true, r:"50% 50% 50% "+Math.max(4,Math.round((sz||34)*.22))+"px"}, o||{}));
ORG.ic  = (g,bg,ink,r) => `<span style="width:32px;height:32px;border-radius:${r||ORG.DROP};background:${bg||"#efedff"};color:${ink||"#4636e3"};display:grid;place-items:center;font-size:13px;font-weight:900;flex:none">${g}</span>`;
ORG.card= i => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:16px">${i}</div>`;
ORG.h   = t => `<b style="font-size:13px;font-weight:900">${t}</b>`;
ORG.sub = t => `<span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">${t}</span>`;
ORG.note= t => `<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">${t}</div>`;
ORG.empty=t => `<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">${t}</div>`;
ORG.disc= o => `<div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:${o?"#e8531f":"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:${o?".9":".5"}"></div>`;
ORG.top = (title,sub,left,right) => `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">${left||`<button onclick="go('orgHome')" style="width:40px;height:40px;border-radius:${ORG.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>`}${right||`<span style="font-size:10.5px;font-weight:900;color:#8a8fa5">${ORG.esn(ME.org||"منظّم")}</span>`}</div>
  <div style="text-align:center;padding:6px 18px 0"><b style="display:block;font-size:26px;font-weight:900;line-height:1.3">${title}</b><span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">${sub}</span></div>`;
ORG.ST = {live:["مباشر","#e8531f"],today:["اليوم","#c78c00"],open:["مفتوحة","#4636e3"],final:["انتهت","#2c6e49"]};

ORG.load = async () => {
  const me = ME.name;
  const [ms,joins,ev,bk,refs,pf,subs] = await Promise.all([
    q("m", sb.from("matches").select("*").order("created_at",{ascending:false}).limit(80)),
    q("j", sb.from("match_joins").select("*").limit(600)),
    q("e", sb.from("match_events").select("*").order("created_at",{ascending:false}).limit(400)),
    q("b", sb.from("bookings").select("*").order("created_at",{ascending:false}).limit(80)),
    q("r", sb.from("pi_refs").select("*").order("created_at",{ascending:false}).limit(80)),
    q("p", sb.from("profiles").select("id,name,role,org,pos,age,avatar_url").limit(400)),
    q("s", sb.from("subscriptions").select("*").limit(300))
  ]);
  const mine = ms.filter(m=>m.organizer_name===me);
  return {ms, mine, joins, ev, bk, refs, pf, subs,
    refsList: pf.filter(p=>p.role==="referee"),
    venues: [...new Set(ms.map(m=>m.venue).filter(Boolean))]};
};
ORG.joinsOf = (D,id) => D.joins.filter(j=>j.match_id===id);
ORG.evOf = (D,id) => D.ev.filter(e=>e.match_id===id);

/* ═══ 5a · يومك ═══ */
T.orgHome = async () => {
  const D = await ORG.load();
  const live = D.mine.find(m=>m.status==="live");
  const today = D.mine.filter(m=>m.status==="today");
  const open = D.mine.filter(m=>m.status==="open");
  const done = D.mine.filter(m=>m.status==="final");
  const next = live || today[0] || open[0];
  const nJoin = next?ORG.joinsOf(D,next.id).length:0;
  const noRef = D.mine.filter(m=>m.status!=="final" && !m.referee_name);
  const thin  = D.mine.filter(m=>m.status==="open" && ORG.joinsOf(D,m.id).length < (+m.slots||10)*0.6);
  const unsettled = done.filter(m=>m.score_a==null);
  const acts = [
    ...(live?[["●",`مباراة جارية — سجّل بلمستين`,ORG.esn(live.title),"orgLive","#fdeee8","#e8531f",1]]:[]),
    ...(noRef.length?[["▮",`${noRef.length} مباراة بلا حكم معيَّن`,"التعيين يجعل النتيجة موثّقة","orgNear","#fff6d6","#c78c00",0]]:[]),
    ...(thin.length?[["◔",`${thin.length} مباراة مقاعدها ناقصة`,"شاركها أو مدّد التسجيل","orgPeople","#efedff","#4636e3",0]]:[]),
    ...(unsettled.length?[["▤",`${unsettled.length} مباراة بلا نتيجة مسجَّلة`,"أقفلها بالتسوية والتقرير","orgSettle","#fdeee8","#a83b25",0]]:[])
  ];
  const SC = [
    ["＋","أنشئ","مباراة أو فعالية","newMatch","#4636e3","#fff"],
    ["●","المباشر","بلمستين","orgLive","#fdeee8","#e8531f"],
    ["👥","المشاركون","والتحصيل","orgPeople","#efedff","#4636e3"],
    ["◎","حولك","ملاعب وحكّام","orgNear","#eaf5ee","#2c6e49"],
    ["▤","التسوية","بعد الحدث","orgSettle","#efedff","#4636e3"],
    ["◉","ملفي","سجل ما نظّمته","orgMe","#efedff","#4636e3"]
  ];
  const totalPlayers = new Set(D.joins.filter(j=>D.mine.some(m=>m.id===j.match_id)).map(j=>j.player_name)).size;

  return `<div style="position:relative;background:#151a2e;padding:18px 18px 24px;border-radius:0 0 36px 36px;overflow:hidden">${ORG.disc(!!live)}
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
      <button onclick="go('orgTasks')" style="position:relative;width:40px;height:40px;border-radius:${ORG.DROP};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">◔${acts.length?`<span style="position:absolute;top:7px;inset-inline-end:8px;width:8px;height:8px;border-radius:50%;background:#e8531f;border:2px solid #151a2e"></span>`:""}</button>
      ${WM(1)}
      <button onclick="go('settings')" style="width:40px;height:40px;border-radius:${ORG.DROP};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">⚙</button>
    </div>
    <div style="position:relative;display:flex;align-items:center;gap:16px;margin-top:18px">
      <button onclick="go('orgMe')" style="flex:none;background:none;border:0;padding:0;cursor:pointer">${ORG.av(ME.name,80,{r:"50% 50% 50% 12px",ring:"4px solid #4636e3"})}</button>
      <div style="flex:1;min-width:0">
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:800">أهلًا بك</span>
        <b style="display:block;font-size:24px;font-weight:900;color:#faf8f3;line-height:1.2">${esc((ME.name||"").split(" ")[0])} 👋</b>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">منظّم${ME.org?" · "+esc(ME.org):""}</span>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <span style="background:rgba(245,197,24,.15);color:#f5c518;border-radius:999px;padding:3px 11px;font-size:10.5px;font-weight:800"><span class="ltr">${done.length||ORG.dash}</span> مباراة أُقفلت</span>
          <span style="background:rgba(255,255,255,.1);color:#faf8f3;border-radius:999px;padding:3px 11px;font-size:10.5px;font-weight:800"><span class="ltr">${totalPlayers||ORG.dash}</span> لاعبًا</span>
        </div></div></div>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;border-radius:22px;overflow:hidden;background:#151a2e;min-height:230px;display:flex">${ORG.disc(!!live)}
      <div style="position:relative;padding:18px;display:flex;flex-direction:column;gap:8px;width:64%">
        ${live?`<span style="display:inline-flex;align-items:center;gap:6px;background:#e8531f;color:#fff;border-radius:999px;padding:4px 11px;font-size:10.5px;font-weight:900;width:fit-content"><span style="width:6px;height:6px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite"></span>مباشر الآن</span>`
          :`<span style="color:#b9b0f5;font-size:10.5px;font-weight:900">⚽ ${next?"القادمة":"يومك"}</span>`}
        <b style="display:block;font-size:19px;font-weight:900;color:#faf8f3;line-height:1.3">${esc(next?next.title:"لا مباراة تحت مسؤوليتك")}</b>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;line-height:1.9">${next
          ?`◔ <span class="ltr">${esc(next.match_time||ORG.dash)}</span> · ${esc(next.match_date||"")}<br>◎ ${esc(next.venue||ORG.dash)}<br><span style="color:${next.referee_name?"#8f9bff":"#f5c518"}">${next.referee_name?"الحكم "+esc(next.referee_name):"لم يُعيَّن حكم بعد"}</span>`
          :"أنشئ مباراة — تُفتح للتسجيل ويظهر مقعدها في «وش حولك» لكل لاعب قريب"}</span>
        <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
          ${live?`<button onclick="go('orgLive')" style="background:#e8531f;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(232,83,31,.3)">سجّل الآن</button>`
            :`<button onclick="go('newMatch')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">＋ أنشئ مباراة</button>`}
          ${next?`<button onclick="go('orgPeople')" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);color:#faf8f3;border-radius:14px;padding:10px 12px;font:900 11.5px Cairo;cursor:pointer">المشاركون</button>`:""}
        </div></div>
      <div style="position:absolute;inset-inline-end:16px;bottom:16px;width:92px;height:92px;border-radius:50%;display:grid;place-items:center;background:#151a2e;box-shadow:0 0 0 6px ${live?"#e8531f":"#4636e3"}">
        <div style="text-align:center"><b class="ltr" style="display:block;font-size:${next?"20px":"26px"};font-weight:700;color:#faf8f3">${next?nJoin+"/"+(next.slots||ORG.dash):ORG.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">انضمّوا</span></div></div>
    </div>

    ${acts.length?acts.map(([g,t,s,v,bg,ink,u])=>`<button onclick="go('${v}')" style="background:#fff;border:1px solid ${u?"#f3cdbe":"#e9e4d8"};border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;width:100%;color:#151a2e">
      <span style="width:40px;height:40px;border-radius:${ORG.DROP};background:${bg};color:${ink};display:grid;place-items:center;font-size:16px;flex:none">${g}</span>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">${esc(t)}</b><span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(s)}</span></div>
      <span style="color:${u?"#e8531f":"#8a8fa5"}">←</span></button>`).join("")
    :ORG.card(`<div style="display:flex;gap:12px;align-items:center">${ORG.ic("✓","#eaf5ee","#2c6e49")}<div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px">لا شيء ينتظر قرارك</b>${ORG.sub("كل مبارياتك لها حكم ونتيجة")}</div></div>`)}

    ${ORG.h("مداخلك")}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${SC.map(([g,t,s,v,bg,ink])=>`<button onclick="go('${v}')" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;color:#151a2e;cursor:pointer;font-family:Cairo">
        <span style="width:40px;height:40px;border-radius:${ORG.DROP};display:grid;place-items:center;font-size:17px;background:${bg};color:${ink}">${g}</span>
        <b style="font-size:12px;font-weight:900">${t}</b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800">${s}</span></button>`).join("")}
    </div>

    ${D.mine.length?ORG.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ORG.h("مبارياتك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${D.mine.length}</span></span></div>
      ${D.mine.slice(0,5).map(m=>{const S=ORG.ST[m.status]||ORG.ST.open, n=ORG.joinsOf(D,m.id).length;
        return `<button onclick="go('${m.status==="live"?"orgLive":"orgPeople"}','${m.id}')" style="width:100%;display:flex;gap:11px;align-items:center;padding:10px 0;border:0;border-top:1px solid #f0ece2;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
          <span style="width:34px;height:34px;border-radius:${ORG.DROP};background:${S[1]}18;color:${S[1]};display:grid;place-items:center;font-size:13px;flex:none">${m.status==="live"?"●":m.status==="final"?"✓":"⚽"}</span>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(m.title)}</b>
            <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(m.venue||"—")} · <span class="ltr">${n}</span> لاعبًا${m.referee_name?` · ${esc(m.referee_name)}`:" · بلا حكم"}</span></div>
          ${m.score_a!=null?`<b class="ltr" style="font-size:14px;font-weight:700;flex:none">${m.score_a}–${m.score_b}</b>`:`<span style="font-size:9.5px;font-weight:900;color:${S[1]};flex:none">${S[0]}</span>`}</button>`;}).join("")}`)
    :ORG.empty("لم تنظّم مباراة بعد — أنشئ أولى مبارياتك، ويبدأ سجل كل من يلعبها")}

    <div style="background:#151a2e;border-radius:20px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden">${ORG.disc()}
      <div style="position:relative"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">دورك الحالي</span><b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.2">منظّم</b></div>
      <button onclick="go('role')" style="position:relative;background:#fff;color:#151a2e;border:0;border-radius:999px;padding:9px 14px;font:900 11px Cairo;cursor:pointer">⇄ تغيير الدور</button></div>
  </main>`;
};

/* ═══ 5c · المشاركون والتحصيل ═══ */
T.orgPeople = async () => {
  const D = await ORG.load();
  const mid = (typeof PARAM!=="undefined" && PARAM) || (D.mine.find(m=>m.status==="live")||D.mine.find(m=>m.status!=="final")||D.mine[0]||{}).id;
  const m = D.mine.find(x=>x.id===mid) || D.mine[0];
  if(!m) return ORG.top("المشاركون","لا مباراة بعد") + `<main style="flex:1;padding:16px 18px 118px">${ORG.empty("أنشئ مباراة أولًا")}</main>`;
  const js = ORG.joinsOf(D,m.id);
  const cap = +m.slots||10, fee = +m.fee||0;
  const paid = js.filter(j=>j.attended).length;
  const pfOf = n => D.pf.find(p=>p.name===n) || {};
  return ORG.top("المشاركون والتحصيل", esc(m.title)) + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${D.mine.length>1?`<div style="display:flex;gap:6px;overflow-x:auto">${D.mine.slice(0,6).map(x=>`<button onclick="go('orgPeople','${x.id}')" style="flex:none;background:${x.id===m.id?"#151a2e":"#fff"};color:${x.id===m.id?"#faf8f3":"#5b6078"};border:1px solid ${x.id===m.id?"#151a2e":"#e9e4d8"};border-radius:999px;padding:8px 13px;font:900 10.5px Cairo;cursor:pointer">${esc(String(x.title).split("—")[0])}</button>`).join("")}</div>`:""}
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ORG.disc()}
      <div style="position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        ${[["انضمّوا",js.length],["المقاعد",cap],["حضروا",paid]].map(([k,v])=>`<div><b class="ltr" style="display:block;font-size:24px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||ORG.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}</div>
      <div style="position:relative;height:8px;border-radius:99px;background:rgba(255,255,255,.14);margin-top:14px;overflow:hidden"><span style="display:block;height:100%;background:#f5c518;width:${Math.min(100,Math.round(js.length/cap*100))}%"></span></div>
      <span style="position:relative;display:block;font-size:10px;color:#c6cade;font-weight:700;margin-top:7px">${js.length>=cap?"اكتمل العدد":`باقٍ <span class="ltr">${cap-js.length}</span> مقعدًا`}${fee?` · الرسم <span class="ltr">${fee}</span> ر.س`:" · بلا رسوم"}</span>
    </div>
    ${ORG.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ORG.h("من انضمّ")}<button onclick="orgShare('${m.id}')" style="background:#efedff;color:#4636e3;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">شارك المقعد</button></div>
      ${js.length?js.map(j=>{const p=pfOf(j.player_name);
        return `<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
          ${ORG.av(j.player_name,34,{url:p.avatar_url})}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(j.player_name)}</b>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(p.pos||"لاعب")}${p.org?" · "+esc(p.org):""}${p.age&&p.age<18?" · قاصر":""}</span></div>
          <span style="flex:none;background:${j.attended?"#eaf5ee":"#f2f0ea"};color:${j.attended?"#2c6e49":"#8a8fa5"};border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">${j.attended?"حضر ✓":"مسجَّل"}</span></div>`;}).join("")
      :ORG.empty("لا مشاركين بعد — شارك المقعد فيصل من هم قريبون")}`)}
    ${ORG.note("التحصيل عبر المنصة بإيصال باسم دافعه، والإلغاء بسبب مكتوب يردّ المبلغ. والقاصر يلعب بإذن وليّه الأول — لا يُستأذن في كل مباراة.")}
  </main>`;
};
window.orgShare = async id => {
  const url = location.origin + "/?m=" + id;
  try{ if(navigator.share) await navigator.share({title:"مقعد في مباراة — PlayIn365", url}); else { await navigator.clipboard.writeText(url); toast("نُسخ الرابط"); } }catch(e){}
};

/* ═══ 5d · التسجيل المباشر بلمستين ═══ */
ORG.EV = [["goal","⚽","هدف","#f5c518"],["assist","◎","صناعة","#4636e3"],["yellow","▮","إنذار","#c78c00"],["red","▮","طرد","#a83b25"],["sub","⇄","تبديل","#4636e3"]];
ORG.lk = id => "pi_orglive_"+id;
window.orgPick = (mid,t) => { try{ localStorage.setItem(ORG.lk(mid)+"_t", t); }catch(e){} render(); };
window.orgLog = async (mid, who) => {
  let t; try{ t = localStorage.getItem(ORG.lk(mid)+"_t"); }catch(e){}
  if(!t) return toast("اختر نوع الحدث أولًا",1);
  const min = +(prompt("الدقيقة:","")||0); if(!min) return;
  const {error} = await sb.from("match_events").insert({match_id:mid, minute:min, type:t, who, recorded_by:ME.name+" — منظم", source:"PlayIn"});
  if(error) return toast("تعذّر: "+error.message,1);
  if(t==="goal"){ const {data:m}=await sb.from("matches").select("score_a,score_b,team_a").eq("id",mid).single();
    if(m){ const {data:p}=await sb.from("profiles").select("org").eq("name",who).limit(1).single();
      const a = p && String(m.team_a||"").indexOf(String(p.org||"").replace("أكاديمية","").trim())>=0;
      await sb.from("matches").update(a?{score_a:(+m.score_a||0)+1}:{score_b:(+m.score_b||0)+1}).eq("id",mid); } }
  await trans(`سجّل ${(ORG.EV.find(e=>e[0]===t)||[])[2]} لـ${who} في الدقيقة ${min}`);
  toast("سُجّل وانعكس فورًا — باسمك"); render();
};
window.orgEnd = async mid => {
  if(!confirm("إنهاء المباراة؟ النتيجة تُقفل وتدخل سجلات اللاعبين.")) return;
  const {error} = await sb.from("matches").update({status:"final"}).eq("id",mid);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans("أنهى المباراة وأقفل نتيجتها"); toast("أُقفلت — والتصحيح باسمك في الشفافية"); go("orgSettle",mid);
};
T.orgLive = async () => {
  const D = await ORG.load();
  const mid = (typeof PARAM!=="undefined" && PARAM) || (D.mine.find(m=>m.status==="live")||D.mine.find(m=>m.status==="today")||D.mine[0]||{}).id;
  const m = D.mine.find(x=>x.id===mid);
  if(!m) return ORG.top("التسجيل المباشر","لا مباراة") + `<main style="flex:1;padding:16px 18px 118px">${ORG.empty("لا مباراة تحت مسؤوليتك الآن")}</main>`;
  const js = ORG.joinsOf(D,m.id), evs = ORG.evOf(D,m.id);
  let sel; try{ sel = localStorage.getItem(ORG.lk(m.id)+"_t"); }catch(e){}
  const pfOf = n => D.pf.find(p=>p.name===n) || {};
  const teams = String(m.title||"").split("—")[0].split("×").map(s=>s.trim());

  return `<div style="position:relative;background:#151a2e;padding:18px 18px 22px;border-radius:0 0 36px 36px;overflow:hidden">${ORG.disc(true)}
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
      <button onclick="go('orgHome')" style="width:40px;height:40px;border-radius:${ORG.DROP};background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">⌂</button>
      <span style="display:inline-flex;align-items:center;gap:6px;background:#e8531f;color:#fff;border-radius:999px;padding:5px 12px;font-size:10.5px;font-weight:900"><span style="width:6px;height:6px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite"></span>${m.status==="live"?"مباشر":"جاهزة للبدء"}</span>
      <button onclick="orgEnd('${m.id}')" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);color:#faf8f3;border-radius:12px;padding:9px 12px;font:900 10.5px Cairo;cursor:pointer">أنهِ</button>
    </div>
    <div style="position:relative;text-align:center;margin-top:14px;color:#faf8f3">
      <b style="display:block;font-size:15px;font-weight:900">${esc(m.title)}</b>
      <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-top:10px">
        <div style="text-align:center"><span style="width:46px;height:46px;border-radius:14px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:18px;font-weight:900;margin:0 auto">${esc(ACD.ini(teams[0]||"؟"))}</span><span style="display:block;font-size:10px;font-weight:900;margin-top:5px">${esc(teams[0]||"")}</span></div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:34px;font-weight:700">${m.score_a==null?"0":m.score_a}–${m.score_b==null?"0":m.score_b}</b>
        <div style="text-align:center"><span style="width:46px;height:46px;border-radius:14px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:18px;font-weight:900;margin:0 auto">${esc(ACD.ini(teams[1]||"؟"))}</span><span style="display:block;font-size:10px;font-weight:900;margin-top:5px">${esc(teams[1]||"")}</span></div>
      </div>
      <span style="display:block;font-size:10px;color:#c6cade;font-weight:700;margin-top:9px">${m.referee_name?"الحكم "+esc(m.referee_name):"بلا حكم معيَّن — النتيجة تبقى بتوقيعك"}</span>
    </div></div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${ORG.card(`${ORG.h("١ · اختر الحدث")}${ORG.sub("ثم اضغط اللاعب — لمستان لا أكثر")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${ORG.EV.map(([k,g,lb,c])=>`<button onclick="orgPick('${m.id}','${k}')" style="flex:1;min-width:64px;background:${sel===k?c:"#faf8f3"};color:${sel===k?"#fff":"#5b6078"};border:1px solid ${sel===k?c:"#e9e4d8"};border-radius:12px;padding:11px 6px;font:900 11px Cairo;cursor:pointer;text-align:center"><span style="display:block;font-size:16px">${g}</span>${lb}</button>`).join("")}
      </div>`)}
    ${ORG.card(`${ORG.h("٢ · اضغط اللاعب")}${ORG.sub(sel?`الحدث المختار: <b style="color:#151a2e">${(ORG.EV.find(e=>e[0]===sel)||[])[2]}</b>`:"لم تختر حدثًا بعد")}
      ${js.length?`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:11px">
        ${js.map(j=>{const p=pfOf(j.player_name);
          return `<button onclick="orgLog('${m.id}','${ORG.esn(j.player_name)}')" style="background:${sel?"#fff":"#faf8f3"};border:1.5px solid ${sel?"#ddd8fb":"#e9e4d8"};border-radius:16px;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:${sel?"pointer":"default"};font-family:Cairo;opacity:${sel?1:.6}">
            ${ORG.av(j.player_name,40,{url:p.avatar_url})}
            <span style="font-size:9px;font-weight:900">${esc(String(j.player_name).split(" ")[0])}</span></button>`;}).join("")}</div>`
      :ORG.empty("لا مشاركين — لا يمكن التسجيل بلا لاعبين مسجَّلين")}`)}
    ${ORG.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ORG.h("سجل المباراة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${evs.length}</span> حدثًا</span></div>
      ${evs.length?evs.map(e=>{const E=ORG.EV.find(x=>x[0]===e.type)||ORG.EV[4];
        return `<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
          ${ORG.ic(E[1],E[3]+"18",E[3])}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(e.who)} — ${E[2]}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">سجّله ${esc(e.recorded_by)}</span></div>
          <b class="ltr" style="font-size:12.5px;color:#4636e3;flex:none">${e.minute}′</b></div>`;}).join("")
      :ORG.empty("لا أحداث بعد — أول حدث يدخل سجل اللاعب لحظته")}`)}
    ${ORG.note("الحدث يُسجَّل باسمك ووقته وينعكس فورًا في سجل اللاعب. لا اعتماد ولا اعتراض — والخطأ يُصحَّح باسمك في سجل الشفافية.")}
  </main>`;
};

/* ═══ 5e · وش حولك — ملاعب وحكّام ═══ */
window.orgAssign = async (mid, ref) => {
  const m = (await q("m", sb.from("matches").select("id,title").eq("id",mid).limit(1)))[0]; if(!m) return;
  const {error} = await sb.from("matches").update({referee_name:ref}).eq("id",mid);
  if(error) return toast("تعذّر: "+error.message,1);
  await sb.from("pi_refs").insert({match_id:mid, match_title:m.title, referee:ref, assigned_by:ME.name+" — منظم"});
  await trans(`عيّن الحكم ${ref} على ${m.title}`);
  toast("عُيِّن — يصله التعيين ويقبله أو يعتذر"); render();
};
T.orgNear = async () => {
  const D = await ORG.load();
  const noRef = D.mine.filter(m=>m.status!=="final" && !m.referee_name);
  const venues = D.venues.map(v=>({v, n:D.ms.filter(m=>m.venue===v).length}));
  const bkOpen = D.bk.filter(b=>b.status!=="cancelled").slice(0,4);
  return ORG.top("وش حولك؟","ملاعب للحجز وحكّام للتعيين") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${noRef.length?ORG.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ORG.h("مباريات بلا حكم")}<b class="ltr" style="font-size:11px;color:#c78c00">${noRef.length}</b></div>
      ${ORG.sub("التعيين يجعل النتيجة موثّقة بتوقيع الحكم لا بتوقيعك وحدك")}
      ${noRef.map(m=>`<div style="padding:10px 0;border-top:1px solid #f0ece2">
        <b style="display:block;font-size:11.5px">${esc(m.title)}</b>
        <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(m.venue||"—")} · ${esc(m.match_date||"")} <span class="ltr">${esc(m.match_time||"")}</span></span>
        ${D.refsList.length?`<div style="display:flex;gap:6px;margin-top:8px;overflow-x:auto">${D.refsList.map(r=>`<button onclick="orgAssign('${m.id}','${ORG.esn(r.name)}')" style="flex:none;display:flex;align-items:center;gap:7px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:999px;padding:5px 11px 5px 5px;font:900 10px Cairo;cursor:pointer">${ORG.av(r.name,24,{url:r.avatar_url})}${esc(r.name)}</button>`).join("")}</div>`
          :`<span style="display:block;font-size:9.5px;color:#a83b25;font-weight:800;margin-top:6px">لا حكّام مسجَّلون في المنصة بعد</span>`}
      </div>`).join("")}`):""}
    ${ORG.card(`${ORG.h("الحكّام")}${ORG.sub("يقبل التعيين أو يعتذر — ولا يُفرض عليه")}
      ${D.refsList.length?D.refsList.map(r=>{const n=D.refs.filter(x=>x.referee===r.name).length;
        return `<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
          ${ORG.av(r.name,34,{url:r.avatar_url})}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(r.name)}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">حكم${r.org?" · "+esc(r.org):""} · <span class="ltr">${n}</span> تعيينًا</span></div></div>`;}).join("")
      :ORG.empty("لا حكّام بعد")}`)}
    ${venues.length?ORG.card(`${ORG.h("الملاعب")}${ORG.sub("الجهات بموقع دقيق — والأفراد لا تُكشف عناوينهم")}
      ${venues.map(x=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
        ${ORG.ic("◎","#eaf5ee","#2c6e49","12px")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(x.v)}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px"><span class="ltr">${x.n}</span> مباراة أُقيمت فيه</span></div>
        <button onclick="go('explore')" style="flex:none;background:#efedff;color:#4636e3;border:0;border-radius:10px;padding:7px 11px;font:900 10px Cairo;cursor:pointer">على الخريطة</button></div>`).join("")}`):""}
    ${bkOpen.length?ORG.card(`${ORG.h("حجوزاتك")}
      ${bkOpen.map(b=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(b.venue)}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(b.slot||"—")}</span></div>
        <b class="ltr" style="font-size:12px;color:#4636e3">${b.price||ORG.dash}</b></div>`).join("")}`):""}
    <button onclick="go('explore')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">افتح الخريطة</button>
  </main>`;
};

/* ═══ 5f · التسوية ═══ */
T.orgSettle = async () => {
  const D = await ORG.load();
  const done = D.mine.filter(m=>m.status==="final");
  const mid = (typeof PARAM!=="undefined" && PARAM) || (done[0]||{}).id;
  const m = done.find(x=>x.id===mid) || done[0];
  if(!m) return ORG.top("التسوية","بعد الحدث") + `<main style="flex:1;padding:16px 18px 118px">${ORG.empty("لا مباريات منتهية بعد")}</main>`;
  const js = ORG.joinsOf(D,m.id), evs = ORG.evOf(D,m.id);
  const att = js.filter(j=>j.attended).length, fee=+m.fee||0;
  const gross = att*fee, plat = Math.round(gross*0.05), net = gross-plat;
  const lines = [["المحصَّل من الحضور",gross,"#151a2e"],["نسبة المنصة (٥٪)",-plat,"#a83b25"],["صافي لك",net,"#2c6e49"]];
  return ORG.top("التسوية والتقرير", esc(m.title)) + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${done.length>1?`<div style="display:flex;gap:6px;overflow-x:auto">${done.slice(0,6).map(x=>`<button onclick="go('orgSettle','${x.id}')" style="flex:none;background:${x.id===m.id?"#151a2e":"#fff"};color:${x.id===m.id?"#faf8f3":"#5b6078"};border:1px solid ${x.id===m.id?"#151a2e":"#e9e4d8"};border-radius:999px;padding:8px 13px;font:900 10.5px Cairo;cursor:pointer">${esc(String(x.title).split("—")[0])}</button>`).join("")}</div>`:""}
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ORG.disc()}
      <div style="position:relative;text-align:center">
        <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">النتيجة النهائية</span>
        <b class="ltr" style="display:block;font-size:38px;font-weight:700;margin-top:4px">${m.score_a==null?ORG.dash:m.score_a+"–"+m.score_b}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:4px">${m.referee_name?"وقّعها الحكم "+esc(m.referee_name):"بتوقيعك — بلا حكم معيَّن"}</span></div></div>
    ${ORG.card(`${ORG.h("التقرير")}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px">
        ${[["حضروا",att],["أحداثًا",evs.length],["أهدافًا",evs.filter(e=>e.type==="goal").length]].map(([k,v])=>`<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:14px;padding:11px;text-align:center"><b class="ltr" style="display:block;font-size:19px;color:${v?"#4636e3":"#b0b5c6"}">${v||ORG.dash}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}
      </div>`)}
    ${ORG.card(`${ORG.h("التسوية المالية")}${ORG.sub("كل سطر بمصدره")}
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:8px">
        ${lines.map(([k,v,c])=>`<tr><td style="padding:9px 0;border-top:1px solid #f0ece2;font-weight:800;color:#5b6078">${k}</td><td class="ltr" style="padding:9px 0;border-top:1px solid #f0ece2;text-align:end;font-weight:900;color:${c}">${fee?v.toLocaleString("en")+" ر.س":ORG.dash}</td></tr>`).join("")}
      </table>
      ${!fee?ORG.sub("مباراة بلا رسوم — لا تسوية مالية"):""}`)}
    ${ORG.card(`${ORG.h("ما دخل سجلات اللاعبين")}
      ${evs.length?evs.slice(0,6).map(e=>{const E=ORG.EV.find(x=>x[0]===e.type)||ORG.EV[4];
        return `<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">${ORG.ic(E[1],E[3]+"18",E[3])}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(e.who)} — ${E[2]}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">سجّله ${esc(e.recorded_by)}</span></div>
          <b class="ltr" style="font-size:12px;color:#4636e3">${e.minute}′</b></div>`;}).join("")
      :ORG.empty("لم يُسجَّل حدث في هذه المباراة")}`)}
    ${ORG.note("النتيجة أُقفلت ودخلت سجلات اللاعبين. لا اعتماد ولا اعتراض — والتصحيح باسم من صحّحه ووقته وسببه في سجل الشفافية.")}
  </main>`;
};

/* ═══ 5g · مهامي ═══ */
T.orgTasks = async () => {
  const D = await ORG.load();
  const live = D.mine.filter(m=>m.status==="live");
  const noRef = D.mine.filter(m=>m.status!=="final" && !m.referee_name);
  const thin = D.mine.filter(m=>m.status==="open" && ORG.joinsOf(D,m.id).length < (+m.slots||10)*0.6);
  const unsettled = D.mine.filter(m=>m.status==="final" && m.score_a==null);
  const noEv = D.mine.filter(m=>m.status==="final" && !ORG.evOf(D,m.id).length);
  const T1 = [
    ...live.map(m=>({g:"●",bg:"#fdeee8",ink:"#e8531f",t:"مباراة جارية — سجّل بلمستين",s:esc(m.title),v:"orgLive",id:m.id,u:1})),
    ...noRef.map(m=>({g:"▮",bg:"#fff6d6",ink:"#c78c00",t:"بلا حكم معيَّن",s:esc(m.title),v:"orgNear",id:"",u:0})),
    ...thin.map(m=>({g:"◔",bg:"#efedff",ink:"#4636e3",t:"مقاعد ناقصة",s:esc(m.title)+" — شاركها",v:"orgPeople",id:m.id,u:0})),
    ...unsettled.map(m=>({g:"▤",bg:"#fdeee8",ink:"#a83b25",t:"انتهت بلا نتيجة",s:esc(m.title),v:"orgSettle",id:m.id,u:1})),
    ...noEv.map(m=>({g:"⚠",bg:"#fff6d6",ink:"#c78c00",t:"انتهت بلا أحداث مسجَّلة",s:esc(m.title)+" — سجل اللاعبين لم يتغيّر",v:"orgSettle",id:m.id,u:0}))
  ];
  return ORG.top("مهامي","ما ينتظر قرارك أنت — بترتيب الأهمية") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ORG.disc(T1.some(t=>t.u))}
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        <div style="flex:none;text-align:center"><b class="ltr" style="display:block;font-size:40px;font-weight:700;line-height:1;color:${T1.length?"#f5c518":"#7fd7a4"}">${T1.length||"✓"}</b>
          <span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:3px">${T1.length?"ينتظر قرارك":"لا شيء ينتظرك"}</span></div>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;line-height:1.9;flex:1">${T1.length?"لا شيء يمرّ بلا علمك — وكل قرار يحمل اسمك ووقته.":"مبارياتك لها حكّام ونتائج وأحداث موثّقة."}</span>
      </div></div>
    ${T1.length?T1.map(t=>`<button onclick="go('${t.v}'${t.id?`,'${t.id}'`:""})" style="background:#fff;border:1px solid ${t.u?"#f3cdbe":"#e9e4d8"};border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;width:100%;color:#151a2e">
      <span style="width:40px;height:40px;border-radius:${ORG.DROP};background:${t.bg};color:${t.ink};display:grid;place-items:center;font-size:16px;flex:none">${t.g}</span>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">${t.t}</b><span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${t.s}</span></div>
      <span style="color:${t.u?"#e8531f":"#8a8fa5"}">←</span></button>`).join("")
    :ORG.card(`<div style="display:flex;gap:12px;align-items:center">${ORG.ic("✓","#eaf5ee","#2c6e49")}<div style="flex:1"><b style="display:block;font-size:12.5px">كل شيء مُقفل</b>${ORG.sub("لا مباراة بلا حكم ولا نتيجة بلا تسجيل")}</div></div>`)}
    ${ORG.note("المهام محسوبة من حالة مبارياتك في القاعدة لا من تقدير — والمباراة التي تنتهي بلا أحداث لا تغيّر سجل أحد.")}
  </main>`;
};

/* ═══ 5h · ملفي ═══ */
T.orgMe = async () => {
  const D = await ORG.load();
  const done = D.mine.filter(m=>m.status==="final");
  const evAll = D.ev.filter(e=>D.mine.some(m=>m.id===e.match_id));
  const players = new Set(D.joins.filter(j=>D.mine.some(m=>m.id===j.match_id)).map(j=>j.player_name));
  const venues = new Set(D.mine.map(m=>m.venue).filter(Boolean));
  const refs = new Set(D.mine.map(m=>m.referee_name).filter(Boolean));
  const tr = await q("t", sb.from("transparency").select("*").ilike("actor","%"+ME.name+"%").order("created_at",{ascending:false}).limit(20));
  const stats = [["مباراة نظّمتها",D.mine.length],["أُقفلت",done.length],["لاعبًا",players.size],["حدثًا سجّلته",evAll.filter(e=>String(e.recorded_by||"").indexOf(ME.name)>=0).length]];
  const pid = "PI-O-2026-" + String(1000 + (String(ME.name).split("").reduce((a,c)=>a+c.charCodeAt(0),0)%8999));
  const hasAv = !!PL3.avUrl(ME.name);
  const fields = [["الصورة",hasAv,"avatarSheet()"],["الاسم",!!ME.name],["الجهة",!!ME.org,"joinByCode()"],["مباراة منظَّمة",D.mine.length>0,"go('newMatch')"],["حكم معيَّن",refs.size>0,"go('orgNear')"],["نتيجة مقفلة",done.length>0,"go('orgSettle')"]];
  const comp = Math.round(fields.filter(f=>f[1]).length/fields.length*100);
  const missing = fields.filter(f=>!f[1]);

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('orgHome')" style="width:40px;height:40px;border-radius:${ORG.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <button onclick="go('settings')" style="width:40px;height:40px;border-radius:${ORG.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⚙</button></div>
  <main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;color:#faf8f3;box-shadow:0 18px 44px rgba(21,26,46,.18)">
      <div style="position:absolute;inset-inline-start:58%;top:-62%;width:86%;height:210%;background:radial-gradient(circle at 45% 50%,#f5c518,#8a6912);border-radius:50%;opacity:.2"></div>
      <div style="position:relative;padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">${WM(1)}
          <span style="background:rgba(245,197,24,.16);border:1px solid rgba(245,197,24,.45);color:#f5c518;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">★ منظّم${done.length>=5?" موثّق":""}</span></div>
        <div style="display:flex;align-items:flex-end;gap:14px;margin-top:20px">
          <button onclick="avatarSheet()" style="position:relative;flex:none;background:none;border:0;padding:0;cursor:pointer">
            ${ORG.av(ME.name,104,{r:"50% 50% 50% 14px",ring:"3px solid #f5c518"})}
            <span style="position:absolute;bottom:-2px;inset-inline-start:-6px;width:28px;height:28px;border-radius:${ORG.DROP};background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:12px;border:2px solid #151a2e">✎</span></button>
          <div style="flex:1;min-width:0;padding-bottom:4px">
            <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">منظّم</span>
            <b style="display:block;font-size:23px;font-weight:900;line-height:1.2;margin-top:3px">${esc(ME.name)}</b>
            <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${ME.org?esc(ME.org):"بلا جهة بعد"}</span></div></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:18px">
          ${stats.map(([k,v])=>`<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:9px 4px;text-align:center"><b class="ltr" style="display:block;font-size:19px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||ORG.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:1px">${k}</span></div>`).join("")}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14)">
          <div style="min-width:0"><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">شبكتك</span>
            <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
              <span style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900"><span class="ltr">${venues.size||0}</span> ملاعب</span>
              <span style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900"><span class="ltr">${refs.size||0}</span> حكّام</span></div>
            <span class="ltr" style="display:block;font-family:'Space Grotesk';font-size:10px;font-weight:700;color:#8f9bff;margin-top:8px">${pid}</span></div>
          <div style="flex:none;width:72px;height:72px;background:#fff;border-radius:12px;padding:5px"><svg viewBox="0 0 21 21" shape-rendering="crispEdges" style="width:100%;height:100%;display:block"><rect width="21" height="21" fill="#fff"></rect><path d="${PL3.qr(pid)}" fill="#151a2e"></path></svg></div>
        </div></div></div>
    ${ORG.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ORG.h("اكتمال ملفك")}<b class="ltr" style="font-size:11px;color:#4636e3">${comp}%</b></div>
      <div style="height:8px;border-radius:999px;background:#f0ece2;margin-top:10px;overflow:hidden"><span style="display:block;height:100%;width:${comp}%;background:#4636e3;border-radius:999px"></span></div>
      ${missing.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${missing.map(f=>f[2]?`<button onclick="${f[2]}" style="background:#efedff;color:#4636e3;border:0;border-radius:999px;padding:5px 11px;font:900 10px Cairo;cursor:pointer">${f[0]==="الجهة"?"⌗ ارتبط برمز":"＋ "+f[0]}</button>`:`<span style="background:#f2f0ea;color:#8a8fa5;border-radius:999px;padding:5px 11px;font-size:10px;font-weight:900">${f[0]}</span>`).join("")}</div>`:ORG.sub("مكتمل")}`)}
    ${ORG.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ORG.h("سلسلة الثقة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">خطوتان لا ثلاث</span></div>
      <div style="display:flex;align-items:center;margin-top:12px">
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><span style="width:32px;height:32px;border-radius:${ORG.DROP};background:#4636e3;color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900">أنت</span><span style="font-size:9px;font-weight:800;color:#4636e3">المنظّم المسؤول</span></div>
        <span style="flex:1;height:2.5px;background:#4636e3;margin-top:-14px"></span>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><span style="width:32px;height:32px;border-radius:${ORG.DROP};background:#2c6e49;color:#fff;display:grid;place-items:center;font-size:13px">✓</span><span style="font-size:9px;font-weight:800;color:#2c6e49">السجل — فورًا</span></div></div>
      ${ORG.sub("قرارك ينعكس فورًا. لا اعتماد ولا اعتراض — والخطأ يُصحَّح باسمك ووقتك وسببك.")}`)}
    ${tr.length?ORG.card(`${ORG.h("آخر قراراتك")}${ORG.sub("قراءة فقط — حتى لك")}
      ${tr.slice(0,5).map(t=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${ORG.ic("▤","#efedff","#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;line-height:1.6">${esc(t.action)}</b><span class="ltr" style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(new Date(t.created_at).toLocaleString("en-GB"))}</span></div></div>`).join("")}`):""}
    <div style="background:#151a2e;border-radius:20px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden">${ORG.disc()}
      <div style="position:relative"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">دورك الحالي</span><b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.2">منظّم</b></div>
      <button onclick="go('role')" style="position:relative;background:#fff;color:#151a2e;border:0;border-radius:999px;padding:9px 14px;font:900 11px Cairo;cursor:pointer">⇄ تغيير الدور</button></div>
  </main>`;
};

(function(){
  Object.assign(TITLES,{orgHome:"يومك",orgPeople:"المشاركون",orgLive:"التسجيل المباشر",orgNear:"وش حولك",orgSettle:"التسوية",orgTasks:"مهامي",orgMe:"ملفي"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE,{orgHome:["يومك","ما تحت مسؤوليتك اليوم"],orgPeople:["المشاركون والتحصيل","من انضمّ ومن حضر"],orgLive:["التسجيل المباشر","بلمستين — والتصحيح باسمك"],orgNear:["وش حولك؟","ملاعب وحكّام"],orgSettle:["التسوية","بعد الحدث"],orgTasks:["مهامي","ما ينتظر قرارك"],orgMe:["ملفي","سجل ما نظّمته"]});
  ORG.OWN = ["orgHome","orgPeople","orgLive","orgNear","orgSettle","orgTasks","orgMe"];
  if(typeof NAV!=="undefined") NAV.organizer = [["◉","ملفي","orgMe"],["▶","مبارياتي","orgPeople"],["FAB","","hub"],["●","المباشر","orgLive"],["☰","مهامي","orgTasks"]];
  if(typeof HUB!=="undefined"){
    HUB.ROLE.organizer = [["⌂","يومك","orgHome","#efedff","#7b5cff"],["＋","أنشئ مباراة","newMatch","#fdeee8","#e8531f"],["●","التسجيل المباشر","orgLive","#fdeee8","#e8531f"],["👥","المشاركون","orgPeople"],["◎","ملاعب وحكّام","orgNear","#eaf5ee","#2c6e49"],["▤","التسوية","orgSettle"],["◉","ملفي","orgMe"],["♛","البطولة","tournament","#fff6d6","#c78c00"]];
    HUB.ROLE_OK.organizer = ["pitch","explore","messages","market","orgHome","orgPeople","orgLive","orgNear","orgSettle","orgTasks","orgMe","newMatch","tournament","pitches","approvals","reports","role","settings"];
  }
  if(typeof homeFor==="function"){ const _h=homeFor; window.homeFor=function(){ return ME && ME.role==="organizer" ? "orgHome" : _h(); }; }
  const _r = window.render;
  window.render = render = async function(){
    await _r();
    try{
      if(!ME || ME.role!=="organizer" || VIEW==="auth" || VIEW==="role") return;
      if(ORG.OWN.indexOf(VIEW)>=0){ const hd=$("#app").querySelector(".hd"); if(hd) hd.remove(); }
      if(VIEW==="explore") setTimeout(()=>{ try{ PL3.drawMap && PL3.drawMap(); }catch(e){} },80);
      const PLAYER_ONLY=["feed","records","cabinet","publicView","myCard","opps","wallet","calendar","health","coachHome","squad","session","drills","brief","rate","tactics","coachTasks","coachMe","boards","acadHome","erp","erpPeople","erpOps","erpField"];
      if(PLAYER_ONLY.indexOf(VIEW)>=0){ go("orgHome"); }
    }catch(e){ console.error("OR",e); }
  };
})();
