/* PlayIn365 — عمود الكشّاف مطابقًا للتصميم المعتمد «Scout App» (12a–12g)
   القاصر: لا مراسلة ولا طبي — يسأل الأكاديمية أو وليّه، وكل اطّلاع مسجَّل باسمه. */
const SC = {};
SC.DROP="50% 50% 50% 8px"; SC.dash="—";
SC.esn = s => esc(String(s==null?"":s));
SC.av  = (n,sz,o) => PL3.av(n, sz||34, Object.assign({dark:true, r:"50% 50% 50% "+Math.max(4,Math.round((sz||34)*.22))+"px"}, o||{}));
SC.ic  = (g,bg,ink,r) => `<span style="width:32px;height:32px;border-radius:${r||SC.DROP};background:${bg||"#efedff"};color:${ink||"#4636e3"};display:grid;place-items:center;font-size:13px;font-weight:900;flex:none">${g}</span>`;
SC.card= i => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:16px">${i}</div>`;
SC.h   = t => `<b style="font-size:13px;font-weight:900">${t}</b>`;
SC.sub = t => `<span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">${t}</span>`;
SC.note= t => `<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">${t}</div>`;
SC.empty=t => `<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">${t}</div>`;
SC.disc= c => `<div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:${c||"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:${c==="#f5c518"?".14":.5}"></div>`;
SC.top = (title,sub) => `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('scHome')" style="width:40px;height:40px;border-radius:${SC.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <span style="font-size:10.5px;font-weight:900;color:#8a8fa5">كشّاف</span></div>
  <div style="text-align:center;padding:6px 18px 0"><b style="display:block;font-size:26px;font-weight:900;line-height:1.3">${title}</b><span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">${sub}</span></div>`;
SC.STAGE = [["watch","المتابعة","#4636e3","#efedff"],["verify","التحقّق","#c78c00","#fff8df"],["contact","التواصل","#2c8471","#eef7f4"],["decide","القرار","#2c6e49","#eaf5ee"]];
SC.AX = [["tech","الفنّي"],["tact","التكتيكي"],["phys","البدني"],["ment","الذهني"]];

SC.load = async () => {
  const [pf,ev,att,short,reps,reqs,views,ms] = await Promise.all([
    q("p", sb.from("profiles").select("id,name,role,org,pos,age,shirt,avatar_url,guardian_name").eq("role","player").limit(400)),
    q("e", sb.from("match_events").select("*,matches(title,comp)").order("created_at",{ascending:false}).limit(400)),
    q("a", sb.from("attendance").select("player_name,created_at").limit(1500)),
    q("s", sb.from("pi_shortlist").select("*").eq("scout_name",ME.name).order("updated_at",{ascending:false}).limit(80)),
    q("r", sb.from("pi_scout_reports").select("*").eq("scout_name",ME.name).order("created_at",{ascending:false}).limit(60)),
    q("c", sb.from("pi_consent_req").select("*").eq("requester",ME.name).order("created_at",{ascending:false}).limit(60)),
    q("v", sb.from("pi_views").select("*").eq("viewer",ME.name).limit(200)),
    q("m", sb.from("matches").select("*").order("created_at",{ascending:false}).limit(60))
  ]);
  const score = n => { const e=ev.filter(x=>x.who===n); return e.filter(x=>x.type==="goal").length*3 + e.filter(x=>x.type==="assist").length*2 + Math.min(6,new Set(e.map(x=>x.match_id)).size); };
  return {pf, ev, att, short, reps, reqs, views, ms, score,
    minor: n => { const p=pf.find(x=>x.name===n); return p && p.age && p.age<18; },
    pfOf: n => pf.find(x=>x.name===n) || {}};
};
SC.stg = k => SC.STAGE.find(s=>s[0]===k) || SC.STAGE[0];

window.scAdd = async (name, stage) => {
  const {error} = await sb.from("pi_shortlist").insert({scout_id:ME.id, scout_name:ME.name, player:name, stage:stage||"watch"});
  if(error) return toast(/duplicate/.test(error.message)?"في قائمتك":"تعذّر: "+error.message,1);
  VW.log(name,"record","أضافه كشّاف لقائمته");
  toast("أُضيف لقائمتك — والاطّلاع مسجَّل باسمك"); render();
};
window.scStage = async (id, stage) => {
  await sb.from("pi_shortlist").update({stage, updated_at:new Date().toISOString()}).eq("id",id);
  toast("نُقل إلى «"+SC.stg(stage)[1]+"»"); render();
};
window.scDrop = async id => { if(!confirm("إزالة من القائمة؟")) return; await sb.from("pi_shortlist").delete().eq("id",id); render(); };
window.scAsk = async (player, scope) => {
  const D = await SC.load(); const p = D.pfOf(player);
  const why = String(prompt("سبب الطلب — يقرؤه وليّ الأمر:")||"").trim(); if(!why) return;
  const {error} = await sb.from("pi_consent_req").insert({requester:ME.name, req_role:"scout", player, guardian:p.guardian_name||null, scope, reason:why});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`طلب إذن «${scope}» عن ${player} — ${why}`);
  toast(p.age&&p.age<18?"وصل وليّ أمره — لا يصل اللاعب":"وصل صاحب الملف"); render();
};

/* ═══ 12a · لوحة الكشّاف ═══ */
T.scHome = async () => {
  const D = await SC.load();
  const scored = D.pf.map(p=>({p, s:D.score(p.name), ev:D.ev.filter(e=>e.who===p.name)}))
    .filter(x=>x.s>0).sort((a,b)=>b.s-a.s);
  const inList = new Set(D.short.map(s=>s.player));
  const fresh = scored.filter(x=>!inList.has(x.p.name)).slice(0,4);
  const live = D.ms.filter(m=>m.status==="live"||m.status==="today").slice(0,2);
  const pend = D.reqs.filter(r=>r.status==="pending").length;
  const byStage = {}; D.short.forEach(s=>{ byStage[s.stage]=(byStage[s.stage]||0)+1; });

  return `<div style="position:relative;background:#151a2e;padding:18px 18px 24px;border-radius:0 0 36px 36px;overflow:hidden">${SC.disc()}
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
      <button onclick="go('scAlerts')" style="position:relative;width:40px;height:40px;border-radius:${SC.DROP};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">◔${pend?`<span style="position:absolute;top:7px;inset-inline-end:8px;width:8px;height:8px;border-radius:50%;background:#f5c518;border:2px solid #151a2e"></span>`:""}</button>
      ${WM(1)}
      <button onclick="go('scMe')" style="flex:none;background:none;border:0;padding:0;cursor:pointer">${SC.av(ME.name,40,{r:"50% 50% 50% 10px"})}</button>
    </div>
    <div style="position:relative;margin-top:18px">
      <span style="display:block;font-size:11px;color:#c6cade;font-weight:800">لوحة الصباح</span>
      <b style="display:block;font-size:24px;font-weight:900;color:#faf8f3;line-height:1.25;margin-top:2px">من ظهر — بأحداث موثّقة</b>
      <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:5px;line-height:1.8">لا ترشيح ولا إعلان: الترتيب من أهداف وصناعات وقّعها حكّامها.</span>
      <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
        <span style="background:rgba(245,197,24,.15);color:#f5c518;border-radius:999px;padding:3px 11px;font-size:10.5px;font-weight:800"><span class="ltr">${D.short.length||SC.dash}</span> في قائمتك</span>
        <span style="background:rgba(255,255,255,.1);color:#faf8f3;border-radius:999px;padding:3px 11px;font-size:10.5px;font-weight:800"><span class="ltr">${D.reps.length||SC.dash}</span> تقريرًا</span>
      </div></div>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${live.length?SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h("يُلعب اليوم")}<span style="font-size:10px;color:#e8531f;font-weight:900">تابعها</span></div>
      ${live.map(m=>`<button onclick="go('matchView','${m.id}')" style="width:100%;display:flex;gap:11px;align-items:center;padding:10px 0;border:0;border-top:1px solid #f0ece2;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
        ${SC.ic(m.status==="live"?"●":"◷", m.status==="live"?"#fdeee8":"#efedff", m.status==="live"?"#e8531f":"#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(m.title)}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(m.venue||"")} · <span class="ltr">${esc(m.match_time||"")}</span></span></div>
        <span style="color:#8a8fa5">←</span></button>`).join("")}`):""}

    ${SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h("ظهروا هذا الأسبوع")}<a onclick="go('scMap')" style="font-size:11px;font-weight:900;cursor:pointer">الخريطة ←</a></div>
      ${SC.sub("مرتّبون بأحداث موقّعة — لا بترشيح جهة")}
      ${fresh.length?fresh.map(x=>{const g=x.ev.filter(e=>e.type==="goal").length, a=x.ev.filter(e=>e.type==="assist").length, mn=D.minor(x.p.name);
        return `<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-top:1px solid #f0ece2">
          <button onclick="go('scPlayer','${SC.esn(x.p.name)}')" style="background:none;border:0;padding:0;cursor:pointer;flex:none">${SC.av(x.p.name,42,{url:x.p.avatar_url})}</button>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(x.p.name)}${mn?` <span style="font-size:8.5px;font-weight:900;color:#c78c00">قاصر</span>`:""}</b>
            <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(x.p.pos||"لاعب")}${x.p.age?` · <span class="ltr">${ACD.grpOf(x.p.age)||x.p.age}</span>`:""}${x.p.org?" · "+esc(x.p.org):""}</span>
            <span style="display:block;font-size:9.5px;color:#4636e3;font-weight:800;margin-top:3px"><span class="ltr">${g}</span> هدفًا · <span class="ltr">${a}</span> صناعة · <span class="ltr">${new Set(x.ev.map(e=>e.match_id)).size}</span> مباراة</span></div>
          <button onclick="scAdd('${SC.esn(x.p.name)}')" style="flex:none;background:#efedff;color:#4636e3;border:0;border-radius:11px;padding:9px 12px;font:900 10.5px Cairo;cursor:pointer">＋ تابِعه</button></div>`;}).join("")
      :SC.empty("لا أحداث موثّقة هذا الأسبوع — تظهر المواهب حين يوقّع الحكّام")}`)}

    ${SC.h("مداخلك")}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${[["★","قائمتي","المراحل","scList","#fff6d6","#c78c00"],["◎","الخريطة","بفلاترك","scMap","#eaf5ee","#2c6e49"],["▤","تقاريري","من الملعب","scReports","#efedff","#4636e3"],["◔","التنبيهات","وطلباتي","scAlerts","#efedff","#4636e3"],["◉","ملفي","وترخيصي","scMe","#efedff","#4636e3"],["⌕","بحث","في المنصة","explore","#efedff","#4636e3"]]
        .map(([g,t,s,v,bg,ink])=>`<button onclick="go('${v}')" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;color:#151a2e;cursor:pointer;font-family:Cairo">
        <span style="width:40px;height:40px;border-radius:${SC.DROP};display:grid;place-items:center;font-size:17px;background:${bg};color:${ink}">${g}</span>
        <b style="font-size:12px;font-weight:900">${t}</b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800">${s}</span></button>`).join("")}
    </div>

    ${D.short.length?SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h("قائمتك بالمراحل")}<a onclick="go('scList')" style="font-size:11px;font-weight:900;cursor:pointer">افتح ←</a></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:11px">
        ${SC.STAGE.map(([k,lb,c,bg])=>`<div style="background:${bg};border:1px solid ${c}22;border-radius:14px;padding:11px 6px;text-align:center">
          <b class="ltr" style="display:block;font-size:19px;font-weight:700;color:${byStage[k]?c:"#b0b5c6"}">${byStage[k]||SC.dash}</b>
          <span style="display:block;font-size:9px;font-weight:900;color:${c};margin-top:2px">${lb}</span></div>`).join("")}
      </div>`):""}

    ${SC.note("القاصر: لا تراسله ولا ترى ملفه الطبي. تسأل أكاديميته أو وليّ أمره — وكل اطّلاع منك يظهر في «من رأى ملفك» باسمك ووقته.")}
  </main>`;
};

/* ═══ 12b · الخريطة ═══ */
T.scMap = async () => {
  const D = await SC.load();
  const f = (()=>{try{return JSON.parse(localStorage.getItem("pi_scf")||"{}")}catch(e){return {}}})();
  const grps = ["U14","U16","U17","U19"], poss = ["مهاجم","جناح","وسط","مدافع","حارس"];
  let list = D.pf.filter(p=>D.score(p.name)>0);
  if(f.g) list = list.filter(p=>ACD.grpOf(p.age)===f.g);
  if(f.p) list = list.filter(p=>p.pos===f.p);
  list = list.sort((a,b)=>D.score(b.name)-D.score(a.name)).slice(0,12);
  return SC.top("الخريطة أداةً","الجهات بدبوس دقيق · والأفراد بنطاق تقريبي") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${SC.card(`${SC.h("فلاترك")}
      <span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin:10px 0 6px">الفئة</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button onclick="scF('g','')" style="background:${!f.g?"#151a2e":"#faf8f3"};color:${!f.g?"#faf8f3":"#5b6078"};border:1px solid ${!f.g?"#151a2e":"#e9e4d8"};border-radius:999px;padding:7px 12px;font:900 10px Cairo;cursor:pointer">الكل</button>
        ${grps.map(g=>`<button onclick="scF('g','${g}')" style="background:${f.g===g?"#151a2e":"#faf8f3"};color:${f.g===g?"#faf8f3":"#5b6078"};border:1px solid ${f.g===g?"#151a2e":"#e9e4d8"};border-radius:999px;padding:7px 12px;font:900 10px Cairo;cursor:pointer"><span class="ltr">${g}</span></button>`).join("")}
      </div>
      <span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin:12px 0 6px">المركز</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button onclick="scF('p','')" style="background:${!f.p?"#151a2e":"#faf8f3"};color:${!f.p?"#faf8f3":"#5b6078"};border:1px solid ${!f.p?"#151a2e":"#e9e4d8"};border-radius:999px;padding:7px 12px;font:900 10px Cairo;cursor:pointer">الكل</button>
        ${poss.map(p=>`<button onclick="scF('p','${p}')" style="background:${f.p===p?"#151a2e":"#faf8f3"};color:${f.p===p?"#faf8f3":"#5b6078"};border:1px solid ${f.p===p?"#151a2e":"#e9e4d8"};border-radius:999px;padding:7px 12px;font:900 10px Cairo;cursor:pointer">${p}</button>`).join("")}
      </div>`)}
    ${SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h("النتائج")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${list.length}</span></span></div>
      ${list.length?list.map(p=>{const s=D.score(p.name), mn=D.minor(p.name);
        return `<button onclick="go('scPlayer','${SC.esn(p.name)}')" style="width:100%;display:flex;gap:11px;align-items:center;padding:10px 0;border:0;border-top:1px solid #f0ece2;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
          ${SC.av(p.name,38,{url:p.avatar_url})}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(p.name)}${mn?` <span style="font-size:8px;font-weight:900;color:#c78c00">قاصر</span>`:""}</b>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(p.pos||"")}${p.age?` · <span class="ltr">${ACD.grpOf(p.age)||""}</span>`:""} · ${esc(p.org||"مستقل")}</span></div>
          <b class="ltr" style="font-size:13px;color:#4636e3;flex:none">${s}</b></button>`;}).join("")
      :SC.empty("لا نتائج بهذه الفلاتر")}`)}
    <button onclick="go('explore')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">◎ افتح الخريطة الحيّة</button>
    ${SC.note("الأفراد على الخريطة بدائرة نطاق تقريبية — لا تُكشف عناوينهم. والجهات (أكاديمية · ملعب · فعالية) بدبوس دقيق.")}
  </main>`;
};
window.scF = (k,v) => { let f={}; try{ f=JSON.parse(localStorage.getItem("pi_scf")||"{}"); }catch(e){} if(v) f[k]=v; else delete f[k]; try{ localStorage.setItem("pi_scf",JSON.stringify(f)); }catch(e){} render(); };

/* ═══ 12c · ملف اللاعب بعين الكشّاف ═══ */
T.scPlayer = async () => {
  const D = await SC.load();
  const name = (typeof PARAM!=="undefined" && PARAM) || (D.short[0]||{}).player;
  if(!name) return SC.top("ملف اللاعب","") + `<main style="flex:1;padding:16px 18px 118px">${SC.empty("اختر لاعبًا من اللوحة")}</main>`;
  const p = D.pfOf(name), ev = D.ev.filter(e=>e.who===name), mn = D.minor(name);
  const att = D.att.filter(a=>a.player_name===name);
  const inList = D.short.find(s=>s.player===name);
  const reqs = D.reqs.filter(r=>r.player===name);
  const goals = ev.filter(e=>e.type==="goal").length, assists = ev.filter(e=>e.type==="assist").length;
  const matches = new Set(ev.map(e=>e.match_id)).size;
  const days = [...new Set(att.map(a=>String(a.created_at||"").slice(0,10)))].length;
  const myReps = D.reps.filter(r=>r.player===name);
  VW.log(name,"record","اطّلع كشّاف على سجله");
  const RINGS = [["ما تراه الآن","السجل الموثّق · الحضور · الشارات","#2c6e49","✓"],
    ["بطلب الإذن","التواصل مع "+(mn?"وليّ أمره":"صاحب الملف"),"#c78c00","◔"],
    ["محجوب دائمًا",mn?"الملف الطبي · المراسلة المباشرة مع القاصر":"الملف الطبي بإذن منفصل","#a83b25","✕"]];

  return SC.top("ملف اللاعب", esc(name)+" — بعين الكشّاف") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${SC.disc("#f5c518")}
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        ${SC.av(name,72,{url:p.avatar_url,r:"50% 50% 50% 12px",ring:"3px solid #f5c518"})}
        <div style="flex:1;min-width:0">
          <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">${esc(p.pos||"لاعب")}${p.age?` · <span class="ltr">${ACD.grpOf(p.age)||p.age}</span>`:""}${mn?" · قاصر":""}</span>
          <b style="display:block;font-size:20px;font-weight:900;line-height:1.2;margin-top:3px">${esc(name)}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:3px">${esc(p.org||"مستقل")}</span></div></div>
      <div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:16px">
        ${[["مباراة",matches],["هدفًا",goals],["صناعة",assists],["حصة",days]].map(([k,v])=>`<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:9px 4px;text-align:center"><b class="ltr" style="display:block;font-size:18px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||SC.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:1px">${k}</span></div>`).join("")}</div></div>

    ${SC.card(`${SC.h("دوائر الرؤية")}${SC.sub("ما تراه · ما تطلبه · ما لا يُفتح لك أبدًا")}
      ${RINGS.map(([t,s,c,g])=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        ${SC.ic(g,c+"18",c)}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;color:${c}">${t}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${s}</span></div></div>`).join("")}`)}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${inList?`<button onclick="go('scList')" style="background:#eaf5ee;color:#2c6e49;border:0;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer">✓ في «${SC.stg(inList.stage)[1]}»</button>`
        :`<button onclick="scAdd('${SC.esn(name)}')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">＋ أضف لقائمتي</button>`}
      <button onclick="go('scReport','${SC.esn(name)}')" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer">▤ اكتب تقريرًا</button>
    </div>
    <button onclick="scAsk('${SC.esn(name)}','تواصل')" style="background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer">◔ اطلب إذن التواصل ${mn?"من وليّ أمره":""}</button>
    ${reqs.length?SC.card(`${SC.h("طلباتك عنه")}
      ${reqs.map(r=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
        ${SC.ic(r.status==="granted"?"✓":r.status==="denied"?"✕":"◷", r.status==="granted"?"#eaf5ee":r.status==="denied"?"#fdeee8":"#fff8df", r.status==="granted"?"#2c6e49":r.status==="denied"?"#a83b25":"#c78c00")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(r.scope)}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(r.reason||"")}</span></div>
        <span style="font-size:9.5px;font-weight:900;color:#8a8fa5;flex:none">${r.status==="granted"?"مأذون":r.status==="denied"?"رُفض":"بانتظار الردّ"}</span></div>`).join("")}`):""}

    ${SC.card(`${SC.h("سجله الموثّق")}${SC.sub("كل سطر باسم من وقّعه — لا رقم بلا مصدر")}
      ${ev.length?ev.slice(0,8).map(e=>{const E=RF.EV.find(x=>x[0]===e.type)||RF.EV[4];
        return `<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">${SC.ic(E[1],E[3]+"18",E[3])}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(evLabel(e))}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — ${esc(e.recorded_by)}</span></div>
          <b class="ltr" style="font-size:12px;color:#4636e3;flex:none">${e.minute}′</b></div>`;}).join("")
      :SC.empty("لا أحداث موثّقة بعد")}`)}

    ${myReps.length?SC.card(`${SC.h("تقاريرك عنه")}
      ${myReps.map(r=>`<div style="padding:10px 0;border-top:1px solid #f0ece2">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:11.5px">${esc(r.verdict||"تقرير")}</b><span class="ltr" style="font-size:9.5px;color:#8a8fa5;font-weight:800">${esc(String(r.created_at).slice(0,10))}</span></div>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:3px">${SC.AX.map(([k,lb])=>`${lb} <span class="ltr">${r[k]||"—"}</span>`).join(" · ")}</span></div>`).join("")}`):""}

    ${SC.note(mn?"هذا لاعب قاصر: لا مراسلة مباشرة ولا ملف طبي — تسأل أكاديميته أو وليّ أمره، واطّلاعك هذا سُجّل باسمك ووقته.":"اطّلاعك سُجّل باسمك ووقته في «من رأى ملفك».")}
  </main>`;
};

/* ═══ 12d · القائمة المختصرة ═══ */
T.scList = async () => {
  const D = await SC.load();
  const byStage = {}; SC.STAGE.forEach(([k])=>byStage[k]=[]);
  D.short.forEach(s=>{ (byStage[s.stage]=byStage[s.stage]||[]).push(s); });
  return SC.top("قائمتي المختصرة","اسحب اللاعب بين المراحل بضغطة") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${D.short.length?SC.STAGE.map(([k,lb,c,bg])=>`
      <div style="display:flex;align-items:center;gap:9px;margin-top:4px">
        <span style="width:4px;height:16px;border-radius:99px;background:${c};flex:none"></span>
        <b style="font-size:13px;font-weight:900">${lb}</b>
        <span style="font-size:9.5px;color:#8a8fa5;font-weight:800"><span class="ltr">${(byStage[k]||[]).length}</span></span></div>
      ${(byStage[k]||[]).length?(byStage[k]).map(s=>{const p=D.pfOf(s.player), mn=D.minor(s.player), sc=D.score(s.player);
        const nxt = SC.STAGE[Math.min(SC.STAGE.length-1, SC.STAGE.findIndex(x=>x[0]===k)+1)];
        return `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:18px;padding:12px 14px">
          <div style="display:flex;gap:11px;align-items:center">
            <button onclick="go('scPlayer','${SC.esn(s.player)}')" style="background:none;border:0;padding:0;cursor:pointer;flex:none">${SC.av(s.player,40,{url:p.avatar_url})}</button>
            <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(s.player)}${mn?` <span style="font-size:8px;font-weight:900;color:#c78c00">قاصر</span>`:""}</b>
              <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(p.pos||"")}${p.age?` · <span class="ltr">${ACD.grpOf(p.age)||""}</span>`:""} · ${esc(p.org||"مستقل")}</span></div>
            <b class="ltr" style="font-size:13px;color:${c};flex:none">${sc}</b></div>
          <div style="display:flex;gap:6px;margin-top:10px">
            ${k!==nxt[0]?`<button onclick="scStage('${s.id}','${nxt[0]}')" style="flex:1;background:${nxt[3]};color:${nxt[2]};border:0;border-radius:11px;padding:9px;font:900 10px Cairo;cursor:pointer">انقله إلى «${nxt[1]}» ←</button>`:`<button onclick="go('scReport','${SC.esn(s.player)}')" style="flex:1;background:#eaf5ee;color:#2c6e49;border:0;border-radius:11px;padding:9px;font:900 10px Cairo;cursor:pointer">▤ اكتب القرار</button>`}
            <button onclick="scDrop('${s.id}')" style="flex:none;background:#fff;border:1px solid #e9e4d8;color:#a83b25;border-radius:11px;padding:9px 12px;font:900 12px Cairo;cursor:pointer">×</button></div></div>`;}).join("")
      :`<div style="border:1.5px dashed #e2ddd0;border-radius:14px;padding:12px;text-align:center;font-size:10px;color:#b0b5c6;font-weight:800">لا أحد</div>`}
    `).join("")
    :SC.empty("قائمتك فارغة — أضف من «ظهروا هذا الأسبوع» أو من الخريطة")}
    ${SC.note("القائمة خاصّة بك: لا يراها اللاعب ولا أكاديميته. لكن اطّلاعك على ملفه يظهر له باسمك — الشفافية في الاطّلاع لا في نيّتك.")}
  </main>`;
};

/* ═══ 12e · تقرير كشف ═══ */
window.scRep = (k,v) => { let r={}; try{ r=JSON.parse(localStorage.getItem("pi_screp")||"{}"); }catch(e){} r[k]=v; try{ localStorage.setItem("pi_screp",JSON.stringify(r)); }catch(e){} if(k!=="note"&&k!=="match") render(); };
window.scRepSave = async player => {
  let r={}; try{ r=JSON.parse(localStorage.getItem("pi_screp")||"{}"); }catch(e){}
  if(SC.AX.some(([k])=>!r[k])) return toast("أكمل المحاور الأربعة",1);
  if(!r.verdict) return toast("اختر خلاصتك",1);
  const {error} = await sb.from("pi_scout_reports").insert({scout_id:ME.id, scout_name:ME.name, player,
    match_ref:r.match||"", minutes:+r.minutes||null, tech:r.tech, tact:r.tact, phys:r.phys, ment:r.ment, verdict:r.verdict, note:r.note||""});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`كتب تقرير كشف عن ${player} — ${r.verdict}`);
  try{ localStorage.removeItem("pi_screp"); }catch(e){}
  toast("حُفظ باسمك — تقريرك ملكك ولا يدخل تقييم اللاعب"); go("scReports");
};
T.scReport = async () => {
  const D = await SC.load();
  const name = (typeof PARAM!=="undefined" && PARAM) || (D.short[0]||{}).player;
  if(!name) return SC.top("تقرير كشف","") + `<main style="flex:1;padding:16px 18px 118px">${SC.empty("اختر لاعبًا أولًا")}</main>`;
  const p = D.pfOf(name);
  let r={}; try{ r=JSON.parse(localStorage.getItem("pi_screp")||"{}"); }catch(e){}
  const VD = [["يستحق المتابعة","#4636e3"],["جاهز للتجربة","#2c6e49"],["يحتاج وقتًا","#c78c00"],["لا يناسبنا","#8a8fa5"]];
  const avg = SC.AX.every(([k])=>r[k]) ? (SC.AX.reduce((s,[k])=>s+r[k],0)/4).toFixed(1) : null;
  return SC.top("تقرير كشف", esc(name)+" — من الملعب باسمك") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${SC.disc()}
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        ${SC.av(name,60,{url:p.avatar_url,r:"50% 50% 50% 12px"})}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:17px;font-weight:900">${esc(name)}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:2px">${esc(p.pos||"")}${p.org?" · "+esc(p.org):""}</span></div>
        <div style="flex:none;text-align:center"><b class="ltr" style="display:block;font-size:30px;font-weight:700;color:${avg?"#f5c518":"#8a93b0"};line-height:1">${avg??SC.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800">من <span class="ltr">10</span></span></div>
      </div></div>
    ${SC.card(`${SC.h("أين رأيته")}
      <div style="display:grid;grid-template-columns:1fr 90px;gap:8px;margin-top:9px">
        <input value="${SC.esn(r.match||"")}" oninput="scRep('match',this.value)" placeholder="المباراة أو الحصة" style="border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:700 11.5px Cairo;background:#faf8f3">
        <input value="${SC.esn(r.minutes||"")}" oninput="scRep('minutes',this.value)" type="number" class="ltr" placeholder="دقائق" style="border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:700 11.5px 'Space Grotesk';background:#faf8f3"></div>`)}
    ${SC.AX.map(([k,lb])=>SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h(lb)}<b class="ltr" style="font-size:13px;color:${r[k]?"#4636e3":"#b0b5c6"}">${r[k]??SC.dash}</b></div>
      <div style="display:flex;gap:4px;margin-top:9px">
        ${[...Array(10)].map((_,i)=>`<button onclick="scRep('${k}',${i+1})" style="flex:1;height:32px;border-radius:9px;background:${r[k]>=i+1?"#4636e3":"#faf8f3"};color:${r[k]>=i+1?"#fff":"#8a8fa5"};border:1px solid ${r[k]>=i+1?"#4636e3":"#e9e4d8"};font:700 11px 'Space Grotesk';cursor:pointer">${i+1}</button>`).join("")}
      </div>`)).join("")}
    ${SC.card(`${SC.h("خلاصتك")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px">
        ${VD.map(([v,c])=>`<button onclick="scRep('verdict','${v}')" style="background:${r.verdict===v?c:"#faf8f3"};color:${r.verdict===v?"#fff":"#5b6078"};border:1px solid ${r.verdict===v?c:"#e9e4d8"};border-radius:999px;padding:8px 13px;font:900 10.5px Cairo;cursor:pointer">${v}</button>`).join("")}
      </div>
      <textarea oninput="scRep('note',this.value)" placeholder="ملاحظتك الفنّية — تبقى عندك" style="width:100%;margin-top:10px;border:1px solid #e9e4d8;border-radius:12px;padding:11px;font:700 11.5px Cairo;line-height:1.9;min-height:74px;background:#faf8f3;resize:vertical">${SC.esn(r.note||"")}</textarea>`)}
    <button onclick="scRepSave('${SC.esn(name)}')" style="background:${avg&&r.verdict?"#4636e3":"#e9e4d8"};color:${avg&&r.verdict?"#fff":"#8a8fa5"};border:0;border-radius:14px;padding:14px;font:900 13px Cairo;cursor:pointer;${avg&&r.verdict?"box-shadow:0 8px 18px rgba(70,54,227,.3)":""}">احفظ التقرير باسمك</button>
    ${SC.note("تقريرك رأيك أنت: يبقى في ملفك ولا يدخل تقييم اللاعب ولا يظهر لأكاديميته. الأرقام التي تدخل سجله يوقّعها حكم أو مدرب — لا كشّاف.")}
  </main>`;
};

/* ═══ تقاريري ═══ */
T.scReports = async () => {
  const D = await SC.load();
  const VD = {"يستحق المتابعة":"#4636e3","جاهز للتجربة":"#2c6e49","يحتاج وقتًا":"#c78c00","لا يناسبنا":"#8a8fa5"};
  return SC.top("تقاريري","رأيك أنت — لا يدخل تقييم أحد") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${(()=>{
      if(!D.reps.length) return "";
      /* صدق التوقعات: ما فعله سجل اللاعب بعد تاريخ تقريرك — من الأحداث الموثّقة وحدها */
      const rows = D.reps.map(r=>{
        const t0 = new Date(r.created_at);
        const after = D.ev.filter(e=>e.who===r.player && new Date(e.created_at) > t0);
        const days = Math.floor((Date.now()-t0)/864e5);
        return { player:r.player, verdict:r.verdict, after:after.length, days, ripe: days>=30 };
      });
      const ripe = rows.filter(r=>r.ripe);
      if(!ripe.length) return SC.card(`${SC.h("صدق توقعاتك")}${SC.sub("تُقاس بعد ثلاثين يومًا من كل تقرير — وأحدث تقاريرك لم تنضج بعد")}
        <div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:16px;text-align:center;margin-top:11px">
          <span style="font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">أقدم تقريرك عمره <span class="ltr">${Math.max(...rows.map(r=>r.days))}</span> يومًا. اللوحة تفتح عند الثلاثين — لأن الحكم قبلها ظنّ لا قياس.</span></div>`);
      const pos = ["جاهز للتجربة","يستحق المتابعة"];
      const said = ripe.filter(r=>pos.indexOf(r.verdict)>=0);
      const saidNo = ripe.filter(r=>pos.indexOf(r.verdict)<0);
      const hit = said.filter(r=>r.after>0).length;
      const missed = saidNo.filter(r=>r.after>2).length;
      const mx = Math.max(1,...ripe.map(r=>r.after));
      return SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h("صدق توقعاتك")}<span style="font-size:9.5px;font-weight:900;color:#8a8fa5">على <span class="ltr">${ripe.length}</span> تقريرًا ناضجًا</span></div>
      ${SC.sub("ما سجّله غيرك للاعب بعد تاريخ رأيك — لا تقييم لك، مرآة")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px">
        <div style="background:#eaf5ee;border:1px solid #cfe5dd;border-radius:14px;padding:12px;text-align:center">
          <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:22px;font-weight:700;color:#2c6e49">${said.length?hit+"/"+said.length:"—"}</b>
          <span style="display:block;font-size:9px;color:#2c6e49;font-weight:900;margin-top:2px">رشّحتهم فتحرّك سجلهم</span></div>
        <div style="background:${missed?"#fff8df":"#faf8f3"};border:1px solid ${missed?"#f0e2b4":"#e9e4d8"};border-radius:14px;padding:12px;text-align:center">
          <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:22px;font-weight:700;color:${missed?"#8a6912":"#8a8fa5"}">${saidNo.length?missed+"/"+saidNo.length:"—"}</b>
          <span style="display:block;font-size:9px;color:${missed?"#8a6912":"#8a8fa5"};font-weight:900;margin-top:2px">استبعدتهم فتحرّك سجلهم</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
        ${ripe.slice(0,6).map(r=>{const up=pos.indexOf(r.verdict)>=0; const c=up?(r.after?"#2c6e49":"#c78c00"):(r.after>2?"#8a6912":"#8a8fa5");
          return `<div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <b style="font-size:11px;font-weight:800">${esc(r.player)}</b>
            <span style="font-size:9px;font-weight:800;color:#8a8fa5;white-space:nowrap">${esc(r.verdict)} · قبل <span class="ltr">${r.days}</span> يومًا</span></div>
          <div style="height:6px;background:#f0ece2;border-radius:99px;margin-top:5px;overflow:hidden"><span style="display:block;height:100%;width:${r.after?Math.max(10,Math.round(r.after/mx*100)):2}%;background:${r.after?c:"#e0dbcd"};border-radius:99px"></span></div>
          <span style="display:block;font-size:9px;color:#8a8fa5;font-weight:700;margin-top:3px">${r.after?'<span class="ltr">'+r.after+'</span> حدثًا موثّقًا بعد رأيك':"لا حدث موثّقًا بعد رأيك — وقد لا يكون لعب"}</span>
        </div>`}).join("")}
      </div>
      <div style="margin-top:11px;border-top:1px solid #f0ece2;padding-top:10px;font-size:10px;color:#8a8fa5;font-weight:700;line-height:1.85">اللوحة لا تحكم على عينك: «لا حدث» قد يعني أن اللاعب لم يُلعب أصلًا لا أنك أخطأت. والرقم هنا لك وحدك — لا يظهر لأحد ولا يدخل سجل لاعب.</div>`);
    })()}
    ${D.reps.length?D.reps.map(r=>{const p=D.pfOf(r.player), avg=((r.tech+r.tact+r.phys+r.ment)/4).toFixed(1), c=VD[r.verdict]||"#4636e3";
      return `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 16px">
        <div style="display:flex;gap:11px;align-items:center">
          <button onclick="go('scPlayer','${SC.esn(r.player)}')" style="background:none;border:0;padding:0;cursor:pointer;flex:none">${SC.av(r.player,42,{url:p.avatar_url})}</button>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px">${esc(r.player)}</b>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(r.match_ref||"—")}${r.minutes?` · <span class="ltr">${r.minutes}</span> دقيقة`:""} · <span class="ltr">${esc(String(r.created_at).slice(0,10))}</span></span></div>
          <b class="ltr" style="font-size:20px;font-weight:700;color:${c};flex:none">${avg}</b></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
          <span style="background:${c}18;color:${c};border-radius:999px;padding:4px 11px;font-size:9.5px;font-weight:900">${esc(r.verdict)}</span>
          ${SC.AX.map(([k,lb])=>`<span style="background:#faf8f3;border:1px solid #e9e4d8;color:#5b6078;border-radius:999px;padding:4px 9px;font-size:9px;font-weight:800">${lb} <span class="ltr">${r[k]}</span></span>`).join("")}</div>
        ${r.note?`<span style="display:block;font-size:10.5px;color:#5b6078;font-weight:700;margin-top:9px;line-height:1.8">${esc(r.note)}</span>`:""}</div>`;}).join("")
    :SC.empty("لا تقارير بعد — اكتب أول تقرير من ملف لاعب")}
    ${SC.note("تقاريرك خاصّة بك. ولو أردتَ مشاركتها مع ناديك، تُشارَك باسمك ووقتها — ولا تصير رقمًا في سجل اللاعب.")}
  </main>`;
};

/* ═══ 12f · التنبيهات ═══ */
T.scAlerts = async () => {
  const D = await SC.load();
  const watched = new Set(D.short.map(s=>s.player));
  const news = D.ev.filter(e=>watched.has(e.who)).slice(0,10);
  const pend = D.reqs.filter(r=>r.status==="pending");
  const answered = D.reqs.filter(r=>r.status!=="pending").slice(0,5);
  return SC.top("التنبيهات","ما جدّ على من تتابعهم") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${pend.length?SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h("طلبات بانتظار الردّ")}<b class="ltr" style="font-size:11px;color:#c78c00">${pend.length}</b></div>
      ${pend.map(r=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">${SC.ic("◷","#fff8df","#c78c00")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(r.scope)} — ${esc(r.player)}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${r.guardian?"عند وليّ الأمر "+esc(r.guardian):"عند صاحب الملف"}</span></div>
        <span style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${VW.rel(r.created_at)}</span></div>`).join("")}`):""}
    ${SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h("جديد من تتابعهم")}<a onclick="go('scList')" style="font-size:11px;font-weight:900;cursor:pointer">قائمتي ←</a></div>
      ${news.length?news.map(e=>{const E=RF.EV.find(x=>x[0]===e.type)||RF.EV[4], p=D.pfOf(e.who);
        return `<button onclick="go('scPlayer','${SC.esn(e.who)}')" style="width:100%;display:flex;gap:11px;align-items:center;padding:10px 0;border:0;border-top:1px solid #f0ece2;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
          ${SC.av(e.who,36,{url:p.avatar_url})}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(e.who)} — ${E[2]}</b>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — وقّعه ${esc(e.recorded_by)}</span></div>
          <span style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${VW.rel(e.created_at)}</span></button>`;}).join("")
      :SC.empty(D.short.length?"لا جديد على من تتابعهم":"أضف لاعبين لقائمتك ليصلك جديدهم")}`)}
    ${answered.length?SC.card(`${SC.h("ردود على طلباتك")}
      ${answered.map(r=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        ${SC.ic(r.status==="granted"?"✓":"✕", r.status==="granted"?"#eaf5ee":"#fdeee8", r.status==="granted"?"#2c6e49":"#a83b25")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(r.player)} — ${esc(r.scope)}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${r.decided_by?"قرّره "+esc(r.decided_by):""}</span></div>
        <span style="font-size:9.5px;font-weight:900;color:${r.status==="granted"?"#2c6e49":"#a83b25"};flex:none">${r.status==="granted"?"مأذون":"رُفض"}</span></div>`).join("")}`):""}
    ${SC.note("لا يصلك تنبيه عن قاصر إلا ما هو معلن في سجله الموثّق — ولا إشعار بموقعه ولا بجدوله.")}
  </main>`;
};

/* ═══ 12g · ملفي ═══ */
T.scMe = async () => {
  const D = await SC.load();
  const certs = await q("c", sb.from("pi_certs").select("*").eq("person",ME.name).order("year",{ascending:false}));
  const tr = await q("t", sb.from("transparency").select("*").ilike("actor","%"+ME.name+"%").order("created_at",{ascending:false}).limit(20));
  const granted = D.reqs.filter(r=>r.status==="granted").length;
  const stats = [["في قائمتك",D.short.length],["تقريرًا",D.reps.length],["إذنًا مُنح",granted],["اعتمادًا",certs.filter(c=>c.verified_by).length]];
  const pid = "PI-S-2026-" + String(1000 + (String(ME.name).split("").reduce((a,c)=>a+c.charCodeAt(0),0)%8999));
  const hasAv = !!PL3.avUrl(ME.name);
  const fields = [["الصورة",hasAv,"avatarSheet()"],["الاسم",!!ME.name],["الجهة",!!ME.org],["ترخيص",certs.length>0,"cvAdd('cert')"],["تقرير",D.reps.length>0,"go('scList')"]];
  const comp = Math.round(fields.filter(f=>f[1]).length/fields.length*100);
  const missing = fields.filter(f=>!f[1]);
  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('scHome')" style="width:40px;height:40px;border-radius:${SC.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <button onclick="go('settings')" style="width:40px;height:40px;border-radius:${SC.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⚙</button></div>
  <main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;color:#faf8f3;box-shadow:0 18px 44px rgba(21,26,46,.18)">
      <div style="position:absolute;inset-inline-start:58%;top:-62%;width:86%;height:210%;background:radial-gradient(circle at 45% 50%,#f5c518,#8a6912);border-radius:50%;opacity:.2"></div>
      <div style="position:relative;padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">${WM(1)}
          <span style="background:rgba(245,197,24,.16);border:1px solid rgba(245,197,24,.45);color:#f5c518;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">★ كشّاف${certs.some(c=>c.verified_by)?" مرخَّص":""}</span></div>
        <div style="display:flex;align-items:flex-end;gap:14px;margin-top:20px">
          <button onclick="avatarSheet()" style="position:relative;flex:none;background:none;border:0;padding:0;cursor:pointer">
            ${SC.av(ME.name,104,{r:"50% 50% 50% 14px",ring:"3px solid #f5c518"})}
            <span style="position:absolute;bottom:-2px;inset-inline-start:-6px;width:28px;height:28px;border-radius:${SC.DROP};background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:12px;border:2px solid #151a2e">✎</span></button>
          <div style="flex:1;min-width:0;padding-bottom:4px">
            <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">كشّاف</span>
            <b style="display:block;font-size:23px;font-weight:900;line-height:1.2;margin-top:3px">${esc(ME.name)}</b>
            <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${ME.org?esc(ME.org):"مستقل"}</span></div></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:18px">
          ${stats.map(([k,v])=>`<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:9px 4px;text-align:center"><b class="ltr" style="display:block;font-size:19px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||SC.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:1px">${k}</span></div>`).join("")}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14)">
          <div style="min-width:0"><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">ترخيصك</span>
            <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">${certs.length?certs.slice(0,2).map(c=>`<span style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">${esc(c.title)}</span>`).join(""):`<span style="border:1px dashed rgba(255,255,255,.3);color:#c6cade;border-radius:999px;padding:4px 10px;font-size:9px;font-weight:900">لا ترخيص مسجَّل</span>`}</div>
            <span class="ltr" style="display:block;font-family:'Space Grotesk';font-size:10px;font-weight:700;color:#8f9bff;margin-top:8px">${pid}</span></div>
          <div style="flex:none;width:72px;height:72px;background:#fff;border-radius:12px;padding:5px"><svg viewBox="0 0 21 21" shape-rendering="crispEdges" style="width:100%;height:100%;display:block"><rect width="21" height="21" fill="#fff"></rect><path d="${PL3.qr(pid)}" fill="#151a2e"></path></svg></div>
        </div></div></div>
    ${SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h("اكتمال ملفك")}<b class="ltr" style="font-size:11px;color:#4636e3">${comp}%</b></div>
      <div style="height:8px;border-radius:999px;background:#f0ece2;margin-top:10px;overflow:hidden"><span style="display:block;height:100%;width:${comp}%;background:#4636e3;border-radius:999px"></span></div>
      ${missing.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${missing.map(f=>f[2]?`<button onclick="${f[2]}" style="background:#efedff;color:#4636e3;border:0;border-radius:999px;padding:5px 11px;font:900 10px Cairo;cursor:pointer">＋ ${f[0]}</button>`:`<span style="background:#f2f0ea;color:#8a8fa5;border-radius:999px;padding:5px 11px;font-size:10px;font-weight:900">${f[0]}</span>`).join("")}</div>`:SC.sub("مكتمل")}`)}
    ${SC.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${SC.h("الترخيص والاعتمادات")}<button onclick="cvAdd('cert')" style="background:#4636e3;color:#fff;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">＋ ترخيص</button></div>
      ${certs.length?certs.map(c=>`<div style="display:flex;gap:11px;align-items:flex-start;background:${c.verified_by?"#fff8df":"#faf8f3"};border:1px solid ${c.verified_by?"#f0e2b4":"#e9e4d8"};border-radius:16px;padding:11px 13px;margin-top:8px">
        <span style="width:38px;height:38px;border-radius:${SC.DROP};background:${c.verified_by?"linear-gradient(160deg,#f5c518,#c78c00)":"#efedff"};color:${c.verified_by?"#151a2e":"#4636e3"};display:grid;place-items:center;font-size:15px;flex:none">${c.level?`<b class="ltr">${esc(c.level)}</b>`:"▣"}</span>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(c.title)}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(c.issuer)}${c.year?` · <span class="ltr">${c.year}</span>`:""}</span>
          <span style="display:inline-block;margin-top:5px;background:${c.verified_by?"#eaf5ee":"#f2f0ea"};color:${c.verified_by?"#2c6e49":"#8a8fa5"};border-radius:999px;padding:2px 8px;font-size:8.5px;font-weight:900">${c.verified_by?"✓ وثّقتها "+esc(c.verified_by):"بانتظار التوثيق"}</span></div>
        <button onclick="cvDel('cert','${c.id}')" style="background:none;border:0;color:#a83b25;font:900 13px Cairo;cursor:pointer;flex:none">×</button></div>`).join("")
      :`<div style="margin-top:10px">${SC.empty("لا ترخيص — والنادي يسأل عنه قبل أن يقرأ تقريرك")}</div>`}`)}
    ${SC.card(`${SC.h("حدودك — مكتوبة")}
      ${[["✓","#eaf5ee","#2c6e49","ترى السجل الموثّق والحضور والشارات لأي لاعب"],["◔","#fff8df","#c78c00","التواصل بطلب إذن — يقرّره وليّ الأمر للقاصر"],["✕","#fdeee8","#a83b25","لا ملف طبي ولا مراسلة مباشرة مع قاصر — أبدًا"],["▤","#efedff","#4636e3","كل اطّلاع منك يظهر لصاحب الملف باسمك ووقته"]]
        .map(([g,bg,ink,t])=>`<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">${SC.ic(g,bg,ink,26)}<span style="flex:1;min-width:0;font-size:11px;font-weight:700;color:#5b6078;line-height:1.7">${t}</span></div>`).join("")}`)}
    ${tr.length?SC.card(`${SC.h("آخر ما فعلتَه")}${SC.sub("قراءة فقط — حتى لك")}
      ${tr.slice(0,5).map(t=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${SC.ic("▤","#efedff","#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;line-height:1.6">${esc(t.action)}</b><span class="ltr" style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(new Date(t.created_at).toLocaleString("en-GB"))}</span></div></div>`).join("")}`):""}
    <div style="background:#151a2e;border-radius:20px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden">${SC.disc()}
      <div style="position:relative"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">دورك الحالي</span><b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.2">كشّاف</b></div>
      <button onclick="go('role')" style="position:relative;background:#fff;color:#151a2e;border:0;border-radius:999px;padding:9px 14px;font:900 11px Cairo;cursor:pointer">⇄ تغيير الدور</button></div>
  </main>`;
};

(function(){
  Object.assign(TITLES,{scHome:"لوحة الكشّاف",scMap:"الخريطة",scPlayer:"ملف اللاعب",scList:"قائمتي",scReport:"تقرير كشف",scReports:"تقاريري",scAlerts:"التنبيهات",scMe:"ملفي"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE,{scHome:["لوحة الكشّاف","من ظهر بأحداث موثّقة"],scMap:["الخريطة أداةً","بفلاترك"],scPlayer:["ملف اللاعب","دوائر الرؤية"],scList:["قائمتي المختصرة","مراحل المتابعة"],scReport:["تقرير كشف","من الملعب باسمك"],scReports:["تقاريري","رأيك أنت"],scAlerts:["التنبيهات","ما جدّ على من تتابعهم"],scMe:["ملفي","الترخيص والحدود"]});
  SC.OWN = ["scHome","scMap","scPlayer","scList","scReport","scReports","scAlerts","scMe"];
  if(typeof NAV!=="undefined") NAV.scout = [["◉","ملفي","scMe"],["★","قائمتي","scList"],["FAB","","hub"],["◎","الخريطة","scMap"],["◔","التنبيهات","scAlerts"]];
  if(typeof HUB!=="undefined"){
    HUB.ROLE.scout = [["⌂","لوحة الصباح","scHome","#efedff","#7b5cff"],["★","قائمتي","scList","#fff6d6","#c78c00"],["◎","الخريطة","scMap","#eaf5ee","#2c6e49"],["▤","تقاريري","scReports"],["◔","التنبيهات","scAlerts"],["◉","ملفي","scMe"]];
    HUB.ROLE_OK.scout = ["pitch","explore","messages","market","scHome","scMap","scPlayer","scList","scReport","scReports","scAlerts","scMe","publicView","acadHome","reports","role","settings"];
  }
  if(typeof homeFor==="function"){ const _h=homeFor; window.homeFor=function(){ return ME && ME.role==="scout" ? "scHome" : _h(); }; }
  const _nav = window.navHtml || navHtml;
  window.navHtml = navHtml = function(){ return (ME && ME.role==="scout" && typeof RF!=="undefined" && RF.nav) ? RF.nav(NAV.scout) : _nav(); };
  const _r = window.render;
  window.render = render = async function(){
    await _r();
    try{
      if(!ME || ME.role!=="scout" || VIEW==="auth" || VIEW==="role") return;
      if(SC.OWN.indexOf(VIEW)>=0){ const hd=$("#app").querySelector(".hd"); if(hd) hd.remove(); }
      if(VIEW==="explore") setTimeout(()=>{ try{ PL3.drawMap && PL3.drawMap(); }catch(e){} },80);
      const NOT_MINE=["feed","records","cabinet","myCard","opps","wallet","calendar","health","coachHome","squad","session","drills","brief","rate","tactics","coachTasks","coachMe","boards","erp","erpPeople","erpOps","erpField","orgHome","orgLive","orgPeople","orgNear","orgSettle","orgTasks","orgMe","refHome","refCheck","refMatch","refCards","refReport","refLog","refMe","gdHome","gdTimeline","gdRecord","gdHealth","gdPay","gdPrivacy"];
      if(NOT_MINE.indexOf(VIEW)>=0){ go("scHome"); }
    }catch(e){ console.error("SC",e); }
  };
})();
