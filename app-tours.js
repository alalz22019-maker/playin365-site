/* PlayIn365 — البطولات والأخبار: محلية من القاعدة · رسمية معلَّمة بمصدرها · أخبار بلا مصدر لا تُطبع.
   يُحمّل بعد app-pl3b.js. متاح لكل الأدوار — والتسجيل يبقى بيد المنظّم. */
const TR = {};
TR.DROP = "50% 50% 50% 6px";
TR.card = (inner,pad) => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:${pad||"16px"}">${inner}</div>`;
TR.h = t => `<b style="display:block;font-size:13px;font-weight:900">${t}</b>`;
TR.sub = t => `<span style="display:block;font-size:10.5px;font-weight:500;color:#8a8fa5;line-height:1.8;margin-top:3px">${t}</span>`;
TR.dash = "—";

TR.STATE = {
  open:   ["التسجيل مفتوح", "#2c6e49", "#eaf5ee"],
  live:   ["جارية الآن",    "#e8531f", "#fdeee8"],
  soon:   ["تبدأ قريبًا",    "#4636e3", "#efedff"],
  done:   ["انتهت",          "#8a8fa5", "#f4f2ec"]
};
TR.stateOf = t => {
  const s = String(t.state||"").toLowerCase();
  if(s) return TR.STATE[s] || TR.STATE.soon;
  const st = t.starts_at ? new Date(t.starts_at) : null, en = t.ends_at ? new Date(t.ends_at) : null, now = Date.now();
  if(en && en < now) return TR.STATE.done;
  if(st && st <= now) return TR.STATE.live;
  if(t.reg_open) return TR.STATE.open;
  return TR.STATE.soon;
};

TR.tab = cur => {
  const T_ = [["liveNow","مباشر"],["tours","قريبة منك"],["toursOfficial","الرسمية"],["toursNews","الأخبار"]];
  return `<div class="sx" style="display:flex;gap:7px;overflow-x:auto;padding:1px 0;flex:none">
    ${T_.map(([v,lb])=>`<span onclick="go('${v}')" style="flex:none;cursor:pointer;background:${v===cur?"#4636e3":"#fff"};color:${v===cur?"#fff":"#565d78"};border:1px solid ${v===cur?"#4636e3":"#e9e4d8"};border-radius:999px;padding:9px 16px;font-size:11px;font-weight:${v===cur?900:800}">${lb}</span>`).join("")}
  </div>`;
};

TR.top = (t,s) => `<div class="hd" style="padding:13px 18px;display:flex;align-items:center;gap:11px">
  <span class="wm" style="font-size:17px"><span style="color:#151a2e">Play</span><span style="color:#c78c00">In</span><span style="color:#4636e3;font-size:.46em;vertical-align:super">365</span></span>
  <div style="flex:1;min-width:0"><b style="display:block;font-size:13px;font-weight:900">${t}</b>
    <span style="display:block;font-size:9.5px;font-weight:700;color:#8a8fa5">${s}</span></div>
</div>`;

/* بطاقة بطولة — الاسم والمنظّم والحالة، وكل رقم من صفوف موجودة */
TR.tourCard = (t, mine, matches) => {
  const [lb,c,bg] = TR.stateOf(t);
  const ms = matches.filter(m=>String(m.comp||"")===String(t.name||"") || (t.name && String(m.title||"").indexOf(t.name)>=0));
  const teams = t.teams || (t.grp ? null : null);
  return `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:15px;display:flex;flex-direction:column;gap:11px">
    <div style="display:flex;gap:12px;align-items:flex-start">
      <span style="width:44px;height:44px;flex:none;border-radius:${TR.DROP};background:${bg};color:${c};display:grid;place-items:center;font-size:19px">♛</span>
      <div style="flex:1;min-width:0">
        <b style="display:block;font-size:13px;font-weight:900;line-height:1.45">${esc(t.name||"بطولة")}</b>
        <span style="display:block;font-size:9.5px;font-weight:800;color:#8a8fa5;margin-top:3px">${t.org?esc(t.org):"بلا جهة مسجَّلة"}${t.grp?" · "+esc(t.grp):""}</span>
      </div>
      <span style="flex:none;background:${bg};color:${c};border-radius:999px;padding:5px 11px;font-size:9.5px;font-weight:900;white-space:nowrap">${lb}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      ${[["مباريات", ms.length||null],["فرق", teams],["الجولة", t.stage||null]].map(([k,v])=>
      `<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:12px;padding:9px 7px;text-align:center">
        <b class="ltr" style="display:block;font-size:14px;font-weight:700;color:${v?"#151a2e":"#c9cdd9"}">${v!=null&&v!==""?esc(String(v)):TR.dash}</b>
        <span style="font-size:8.5px;font-weight:800;color:#8a8fa5">${k}</span></div>`).join("")}
    </div>
    ${t.starts_at||t.ends_at?`<span style="font-size:9.5px;font-weight:800;color:#8a8fa5">${t.starts_at?'من '+TR.dt(t.starts_at):""}${t.ends_at?' إلى '+TR.dt(t.ends_at):""}</span>`:""}
    ${mine?`<div style="background:#eaf5ee;border:1px solid #cfe5dd;border-radius:12px;padding:9px 11px;font-size:10.5px;font-weight:800;color:#1d4a3e">أنت فيها — بمباريات موثّقة باسمك</div>`:""}
    <div style="display:flex;gap:7px">
      <button onclick="trFollow('${esc(t.name||"")}')" style="flex:1;background:#fff;color:#4636e3;border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:900 11px Cairo;cursor:pointer">تابعها</button>
      ${ms.length?`<button onclick="go('tournament')" style="flex:1;background:#4636e3;color:#fff;border:0;border-radius:11px;padding:10px;font:900 11px Cairo;cursor:pointer">مبارياتها</button>`:""}
    </div>
  </div>`;
};

TR.load = async () => {
  const [tours, matches, evs] = await Promise.all([
    q("to", sb.from("pi_tours").select("*").limit(120)),
    q("mt", sb.from("matches").select("id,title,comp,created_at").order("created_at",{ascending:false}).limit(300)),
    ME ? q("ev", sb.from("match_events").select("match_id,matches(comp)").eq("who",ME.name).limit(300)) : Promise.resolve([])
  ]);
  const myComps = new Set((evs||[]).map(e=>(e.matches&&e.matches.comp)||"").filter(Boolean));
  return { tours: tours||[], matches: matches||[], myComps };
};

/* ═══ قريبة منك ═══ */
T.tours = async () => {
  const D = await TR.load();
  const local = D.tours.filter(t=>String(t.scope||"local")!=="official");
  const mine  = local.filter(t=>D.myComps.has(t.name));
  const rest  = local.filter(t=>!D.myComps.has(t.name));
  const order = ["live","open","soon","done"];
  rest.sort((a,b)=>order.indexOf(String(TR.stateOf(a)[0])) - order.indexOf(String(TR.stateOf(b)[0])));

  return TR.top("البطولات","المسجَّلة في المنصة — بأسماء منظّميها") + TR.tab("tours") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${mine.length?`<div style="display:flex;flex-direction:column;gap:12px">
      <b style="font-size:13px;font-weight:900">بطولاتك</b>
      ${mine.map(t=>TR.tourCard(t,true,D.matches)).join("")}
    </div>`:""}
    ${rest.length?`<div style="display:flex;flex-direction:column;gap:12px">
      ${mine.length?`<b style="font-size:13px;font-weight:900;margin-top:2px">بطولات أخرى</b>`:""}
      ${rest.map(t=>TR.tourCard(t,false,D.matches)).join("")}
    </div>`:""}
    ${!local.length?`<div style="border:1.5px dashed #d5d0c4;border-radius:20px;padding:22px;text-align:center">
      <b style="display:block;font-size:13px">لا بطولة مسجَّلة بعد</b>
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.85;margin-top:6px">البطولة تظهر هنا لحظة ينشئها منظّم باسمه — لا تُضاف من خارج المنصة</span>
      ${ME&&ME.role==="organizer"?`<button onclick="go('tournament')" style="margin-top:12px;background:#4636e3;color:#fff;border:0;border-radius:12px;padding:12px 20px;font:900 12px Cairo;cursor:pointer">أنشئ بطولة</button>`:""}
    </div>`:""}
    ${TR.card(`${TR.h("ما تراه هنا")}${TR.sub("كل بطولة في هذه الشاشة لها صفوف في القاعدة: منظّمها ومبارياتها وأحداثها. ومشاركتك فيها لا تُكتب إلا من مباراة وقّعها حكمها.")}`)}
  </main>`;
};

/* ═══ مزوّد البيانات — عبر الوسيط، والمفتاح لا يمرّ بالمتصفّح ═══ */
TR.SP = async (op, extra) => {
  /* مهلة ثمانية ثوانٍ: إن تأخّر المزوّد تُرسم الشاشة بما لدينا ويُقال ذلك — ولا تبقى هيكل تحميل */
  return Promise.race([TR._SP(op, extra), new Promise(r=>setTimeout(()=>r(null), 8000))]);
};
TR._SP = async (op, extra) => {
  try{
    const url = window.PI_CONFIG.SUPABASE_URL + "/functions/v1/sports";
    const tok = (sb.auth && sb.auth.session && sb.auth.session() && sb.auth.session().access_token) || window.PI_CONFIG.SUPABASE_ANON_KEY;
    const r = await fetch(url, { method:"POST",
      headers:{ "content-type":"application/json", "authorization":"Bearer "+tok },
      body: JSON.stringify(Object.assign({op}, extra||{})) });
    const d = await r.json();
    return d && d.response ? d : null;
  }catch(e){ return null; }
};
TR.MO = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
TR.dt = s => { if(!s) return "—"; const dd = new Date(s); if(isNaN(dd)) return esc(String(s).slice(0,10));
  return '<span class="ltr">'+dd.getDate()+'</span> '+TR.MO[dd.getMonth()]+' <span class="ltr">'+dd.getFullYear()+'</span>'; };
TR.nm = o => (o && (o.name_ar || o.name)) || "—";
TR.ST = {"1H":["شوط أول","#e8531f"],"2H":["شوط ثانٍ","#e8531f"],"HT":["بين الشوطين","#c78c00"],"ET":["وقت إضافي","#e8531f"],"P":["ركلات ترجيح","#e8531f"],"FT":["انتهت","#8a8fa5"],"AET":["انتهت بالإضافي","#8a8fa5"],"PEN":["انتهت بالترجيح","#8a8fa5"],"NS":["لم تبدأ","#4636e3"]};

TR.liveCard = f => {
  const st = f.fixture && f.fixture.status || {};
  const [lb,c] = TR.ST[st.short] || [st.short||"—","#8a8fa5"];
  const h = f.teams && f.teams.home || {}, a = f.teams && f.teams.away || {};
  const g = f.goals || {};
  return `<div style="background:#151a2e;border-radius:16px;padding:13px 14px;position:relative;overflow:hidden">
    <div style="position:absolute;inset-inline-start:66%;top:-72%;width:64%;height:232%;background:#e8531f;border-radius:50%;opacity:1;pointer-events:none"></div>
    <div style="position:relative">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:9px">
        <span style="width:6px;height:6px;border-radius:50%;background:#e8531f;flex:none"></span>
        <span style="font-size:9px;font-weight:900;color:#faf8f3">${esc(lb)}${st.elapsed?' · <span class="ltr">'+st.elapsed+"′</span>":""}</span>
        <span style="font-size:9px;font-weight:800;color:#9aa0b8;margin-inline-start:auto">${esc(f.league?TR.nm(f.league):"")}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1;min-width:0;display:flex;align-items:center;gap:7px">
          ${h.logo?`<img src="${esc(h.logo)}" alt="" style="width:22px;height:22px;object-fit:contain;flex:none">`:""}
          <b style="font-size:11.5px;font-weight:800;color:#faf8f3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(TR.nm(h))}</b>
        </div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:19px;font-weight:700;color:#f5c518;flex:none">${g.home==null?"—":g.home} : ${g.away==null?"—":g.away}</b>
        <div style="flex:1;min-width:0;display:flex;align-items:center;gap:7px;justify-content:flex-end">
          <b style="font-size:11.5px;font-weight:800;color:#faf8f3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(TR.nm(a))}</b>
          ${a.logo?`<img src="${esc(a.logo)}" alt="" style="width:22px;height:22px;object-fit:contain;flex:none">`:""}
        </div>
      </div>
    </div></div>`;
};

/* ═══ مباشر — شاشة قائمة بذاتها، تحدّث نفسها كل دقيقة ═══ */
T.liveNow = async () => {
  const [liveD, D] = await Promise.all([TR.SP("live"), TR.load()]);
  const all = liveD ? (liveD.response||[]) : [];
  const ids = D.tours.map(t=>t.ext_id).filter(Boolean);
  const mine = all.filter(f=>f.league && ids.indexOf(f.league.id)>=0);
  const rest = all.filter(f=>!f.league || ids.indexOf(f.league.id)<0);

  const groups = {};
  rest.forEach(f=>{ const k = f.league ? TR.nm(f.league) : "أخرى"; (groups[k]=groups[k]||[]).push(f); });
  const gk = Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);

  TR.tick();
  return TR.top("مباشر","النتائج لحظة بلحظة — تُحدَّث تلقائيًا") + TR.tab("liveNow") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:7px;height:7px;border-radius:50%;background:${all.length?"#e8531f":"#c9cdd9"};flex:none"></span>
      <b style="font-size:12.5px;font-weight:900">${all.length?`<span class="ltr">${all.length}</span> مباراة جارية الآن`:"لا مباراة جارية"}</b>
      <span style="font-size:9px;font-weight:800;color:#b0b5c6;margin-inline-start:auto">${liveD&&liveD._age!=null?`قبل <span class="ltr">${liveD._age}</span> ثانية`:"الآن"}</span>
    </div>

    ${mine.length?`<div style="display:flex;flex-direction:column;gap:9px">
      <b style="font-size:12.5px;font-weight:900;color:#c78c00">بطولات تتابعها</b>
      ${mine.map(TR.liveCard).join("")}
    </div>`:""}

    ${gk.map(k=>`<div style="display:flex;flex-direction:column;gap:9px">
      <div style="display:flex;align-items:baseline;gap:8px">
        <b style="font-size:12.5px;font-weight:900">${esc(k)}</b>
        <span style="font-size:9.5px;font-weight:800;color:#8a8fa5"><span class="ltr">${groups[k].length}</span></span>
      </div>
      ${groups[k].map(TR.liveCard).join("")}
    </div>`).join("")}

    ${!all.length?`<div style="border:1.5px dashed #d5d0c4;border-radius:20px;padding:24px;text-align:center">
      <b style="display:block;font-size:13px">لا مباراة جارية في هذه اللحظة</b>
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.85;margin-top:6px">${liveD?"المصدر موصول ويُسأل كل دقيقة — أول مباراة تنطلق في العالم تظهر هنا":"تعذّر الوصول للمزوّد"}</span>
      <button onclick="render()" style="margin-top:13px;background:#4636e3;color:#fff;border:0;border-radius:12px;padding:12px 22px;font:900 12px Cairo;cursor:pointer">حدّث الآن</button>
    </div>`:""}

    ${TR.card(`${TR.h("الأسماء العربية من جدولنا")}${TR.sub("أسماء الأندية والمسابقات بالعربية من جدول نملكه — لا ترجمة آلية. وما لم يُعرَّب بعد يظهر باسمه الأصلي، ولا نخترع له اسمًا.")}`)}
  </main>`;
};

/* تحديث تلقائي كل دقيقة، ويتوقّف حين تترك الشاشة */
TR.tick = () => {
  clearTimeout(TR._t);
  TR._t = setTimeout(()=>{ if(typeof VIEW!=="undefined" && VIEW==="liveNow") render(); }, 60000);
};

/* ═══ الرسمية ═══ */
TR.REGION = {
  "السعودية":["◈","#2c6e49","#eaf5ee"],
  "آسيا":["◎","#4636e3","#efedff"],
  "أوروبا":["★","#c78c00","#fff6d6"],
  "عالمية":["♛","#151a2e","#f4f2ec"],
  "أفريقيا":["◉","#e8531f","#fdeee8"],
  "أمريكا الجنوبية":["◔","#7b5cff","#efedff"]
};
T.toursOfficial = async () => {
  const D = await TR.load();
  const off = D.tours.filter(t=>String(t.scope||"")==="official");
  const ids = off.map(t=>t.ext_id).filter(Boolean);
  const [liveD, standD] = await Promise.all([
    TR.SP("live"),
    (()=>{ const sa = off.filter(t=>t.ext_id===307)[0]; return sa ? TR.SP("standings",{league:307,season:2026}) : Promise.resolve(null); })()
  ]);
  const liveMine = liveD ? (liveD.response||[]).filter(f=>f.league && ids.indexOf(f.league.id)>=0) : [];
  const liveOther = liveD ? (liveD.response||[]).filter(f=>!f.league || ids.indexOf(f.league.id)<0) : [];
  const planBlock = (standD && standD.errors && standD.errors.plan) ? String(standD.errors.plan) : null;
  const table = (()=>{ try{ return standD.response[0].league.standings[0].slice(0,6); }catch(e){ return []; } })();
  const ORDER = ["السعودية","آسيا","أوروبا","عالمية","أفريقيا","أمريكا الجنوبية"];
  const by = {};
  off.forEach(t=>{ const g=t.grp||"أخرى"; (by[g]=by[g]||[]).push(t); });
  const groups = Object.keys(by).sort((a,b)=>{
    const ia=ORDER.indexOf(a), ib=ORDER.indexOf(b);
    return (ia<0?99:ia)-(ib<0?99:ib);
  });
  return TR.top("البطولات الرسمية","الدوريات والبطولات بجهاتها المنظِّمة") + TR.tab("toursOfficial") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:16px">
    ${liveMine.length?`<div style="display:flex;flex-direction:column;gap:9px">
      <div style="display:flex;align-items:baseline;gap:8px">
        <b style="font-size:13px;font-weight:900">مباشر الآن — بطولاتك</b>
        <span style="font-size:9.5px;font-weight:800;color:#e8531f"><span class="ltr">${liveMine.length}</span></span>
      </div>
      ${liveMine.slice(0,8).map(TR.liveCard).join("")}
    </div>`:""}

    ${liveOther.length?`<div style="display:flex;flex-direction:column;gap:9px">
      <div style="display:flex;align-items:baseline;gap:8px">
        <b style="font-size:13px;font-weight:900">${liveMine.length?"مباريات أخرى مباشرة":"مباشر الآن"}</b>
        <span style="font-size:9.5px;font-weight:800;color:#e8531f"><span class="ltr">${liveOther.length}</span> مباراة</span>
      </div>
      ${liveOther.slice(0,6).map(TR.liveCard).join("")}
      ${liveOther.length>6?`<span style="font-size:9.5px;font-weight:800;color:#8a8fa5">و<span class="ltr">${liveOther.length-6}</span> مباراة أخرى جارية</span>`:""}
    </div>`:""}

    ${!liveMine.length&&!liveOther.length?`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:16px;padding:14px 16px;display:flex;gap:11px;align-items:center">
      <span style="width:32px;height:32px;flex:none;border-radius:8px;background:#f4f2ec;color:#8a8fa5;display:grid;place-items:center;font-size:14px">●</span>
      <div><b style="display:block;font-size:11.5px;font-weight:900">لا مباراة مباشرة الآن</b>
        <span style="display:block;font-size:10px;font-weight:700;color:#8a8fa5;margin-top:2px">${liveD?"المصدر موصول — تظهر هنا لحطة انطلاق أي مباراة":"تعذّر الوصول للمزوّد"}</span></div>
    </div>`:""}

    ${table.length?`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:15px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:11px">
        <b style="font-size:13px;font-weight:900">ترتيب دوري روشن</b>
        <span style="font-size:9px;font-weight:700;color:#b0b5c6">${esc((standD&&standD.source)||"")}</span></div>
      ${table.map(r=>`<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1px solid #f0ece2">
        <b class="ltr" style="width:18px;font-size:11px;color:${r.rank<=3?"#c78c00":"#8a8fa5"};flex:none">${r.rank}</b>
        ${r.team&&r.team.logo?`<img src="${esc(r.team.logo)}" alt="" style="width:20px;height:20px;object-fit:contain;flex:none">`:""}
        <b style="flex:1;min-width:0;font-size:11.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.team?TR.nm(r.team):"—")}</b>
        <span class="ltr" style="font-size:9.5px;font-weight:700;color:#8a8fa5;flex:none">${(r.all&&r.all.played)||0}</span>
        <b class="ltr" style="font-size:12px;font-weight:900;color:#4636e3;width:24px;text-align:end;flex:none">${r.points}</b>
      </div>`).join("")}
      <span style="display:block;font-size:9px;font-weight:700;color:#b0b5c6;margin-top:9px">العمود الأول لعبت · الأخير نقاط</span>
    </div>`:planBlock?`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:14px 16px">
      <b style="display:block;font-size:11.5px;font-weight:900;color:#8a6912">الترتيب محجوب على الخطة المجانية</b>
      <span style="display:block;font-size:10.5px;font-weight:700;color:#8a6912;line-height:1.85;margin-top:5px">المزوّد يردّ: «الخطط المجانية لا تصل لهذا الموسم» — متاح لها <span class="ltr">2022–2024</span> فقط. النتائج المباشرة تعمل الآن، والترتيب يُفتح بترقية الخطة.</span>
      <span style="display:block;font-size:9.5px;font-weight:800;color:#b09550;margin-top:7px">ولن نعرض ترتيب موسمٍ قديم على أنّه الحالي.</span>
    </div>`:""}
    ${off.length?groups.map(g=>{
      const [ic,c,bg] = TR.REGION[g] || ["♛","#8a8fa5","#f4f2ec"];
      return `<div style="display:flex;flex-direction:column;gap:9px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:24px;height:24px;flex:none;border-radius:7px;background:${bg};color:${c};display:grid;place-items:center;font-size:12px">${ic}</span>
          <b style="font-size:13px;font-weight:900">${esc(g)}</b>
          <span style="font-size:9.5px;font-weight:800;color:#8a8fa5;margin-inline-start:auto"><span class="ltr">${by[g].length}</span></span>
        </div>
        ${by[g].map(t=>`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:16px;padding:13px 14px;display:flex;gap:12px;align-items:center">
          <span style="width:38px;height:38px;flex:none;border-radius:10px;background:${bg};color:${c};display:grid;place-items:center;font-size:16px">${ic}</span>
          <div style="flex:1;min-width:0">
            <b style="display:block;font-size:12.5px;font-weight:900;line-height:1.4">${esc(t.name||"بطولة")}</b>
            <span style="display:block;font-size:9.5px;font-weight:800;color:#8a8fa5;margin-top:3px">${t.stage?esc(t.stage):"—"}${t.teams?' · <span class="ltr">'+t.teams+'</span> فريقًا':""}</span>
            <span style="display:block;font-size:9px;font-weight:700;color:#b0b5c6;margin-top:3px">المصدر: ${t.source?esc(t.source):"غير مذكور"}</span>
          </div>
          <button onclick="trFollow('${esc(t.name||"")}')" style="flex:none;background:#fff;color:${c};border:1px solid #e9e4d8;border-radius:10px;padding:8px 12px;font:900 10px Cairo;cursor:pointer">تابعها</button>
        </div>`).join("")}
      </div>`;}).join("")
    :`<div style="border:1.5px dashed #d5d0c4;border-radius:20px;padding:22px;text-align:center">
      <b style="display:block;font-size:13px">لا مصدر رسميًّا موصولًا بعد</b>
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.85;margin-top:6px">جدول البطولات الاتحادية والقارية يظهر هنا حين يُوصَل مصدره المعلن</span>
    </div>`}
    ${ME&&ME.role==="admin"?`<button onclick="trAddTour()" style="background:#243244;color:#fff;border:0;border-radius:12px;padding:13px;font:900 12px Cairo;cursor:pointer">أضف بطولة رسمية بمصدرها</button>`:""}
    ${TR.card(`${TR.h("من أين هذه الأرقام")}${TR.sub("النتائج المباشرة والترتيب من API-Football — مصدر خارجي معلن، يُحدَّث لحظيًّا أثناء المباريات. أسماء البطولات وجهاتها من كتالوج المنصة.")}`)}
    ${TR.card(`${TR.h("لماذا «خارج سجلك»")}${TR.sub("البطولة الرسمية معلومة نعرضها لك، لا حدثًا وقّعه أحد باسمك. لا تدخل تقييمك ولا تُكسبك شارة — وسجلك يبقى ما وقّعه حكم أو مدرب في مباراة لعبتها.")}`)}
  </main>`;
};

/* ═══ الأخبار ═══ */
T.toursNews = async () => {
  let news = [];
  try{ news = await q("nw", sb.from("pi_news").select("*").order("published_at",{ascending:false}).limit(40)); }catch(e){ news = []; }
  news = news || [];
  return TR.top("الأخبار","كل خبر باسم مصدره — أو لا يُطبع") + TR.tab("toursNews") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${news.length?news.map(n=>`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;overflow:hidden">
      ${n.image_url?`<div style="height:150px;background:#f4f2ec"><img src="${esc(n.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>`:""}
      <div style="padding:15px">
        <b style="display:block;font-size:13px;font-weight:900;line-height:1.5">${esc(n.title||"—")}</b>
        ${n.summary?`<span style="display:block;font-size:11px;font-weight:500;color:#565d78;line-height:1.85;margin-top:6px">${esc(n.summary)}</span>`:""}
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid #f0ece2">
          <span style="font-size:9.5px;font-weight:800;color:#8a8fa5">${n.source?esc(n.source):"مصدر غير مذكور"}${n.published_at?' · <span class="ltr">'+esc(String(n.published_at).slice(0,10))+'</span>':""}</span>
          ${n.url?`<a href="${esc(n.url)}" target="_blank" rel="noopener" style="flex:none;font-size:9.5px;font-weight:900">المصدر ←</a>`:`<span style="flex:none;background:#f4f2ec;color:#8a8fa5;border-radius:999px;padding:4px 10px;font-size:8.5px;font-weight:900">بلا رابط</span>`}
        </div>
      </div>
    </div>`).join("")
    :`<div style="border:1.5px dashed #d5d0c4;border-radius:20px;padding:22px;text-align:center">
      <b style="display:block;font-size:13px">لا مصدر أخبار موصولًا بعد</b>
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.85;margin-top:6px">حين يُوصَل مصدر معلن، يظهر كل خبر باسمه وتاريخه ورابطه. ولا يُطبع خبر لا يُعرف من قاله.</span>
    </div>`}
    ${ME&&ME.role==="admin"?`<button onclick="trAddNews()" style="background:#243244;color:#fff;border:0;border-radius:12px;padding:13px;font:900 12px Cairo;cursor:pointer">أضف خبرًا بمصدره</button>`:""}
    ${TR.card(`${TR.h("الأخبار لا تمسّ سجلك")}${TR.sub("ما يُنشر هنا معلومة من خارج المنصة — لا تُكسب شارة ولا تدخل تقييمًا ولا تُصحِّح نتيجة. التصحيح يمرّ بسجل الشفافية باسم من صحّحه.")}`)}
  </main>`;
};

window.trAddTour = async () => {
  if(!ME || ME.role!=="admin") return toast("للأدمن فقط",1);
  const name = prompt("اسم البطولة الرسمية:"); if(!name) return;
  const source = prompt("المصدر المعلن (الجهة التي نشرت الجدول) — إلزامي:"); if(!source) return toast("بلا مصدر لا تُنشر",1);
  const org = prompt("الجهة المنظِّمة:","") || null;
  const st = prompt("تاريخ البداية YYYY-MM-DD (اتركه فارغًا إن لم يُعلن):","") || null;
  const en = prompt("تاريخ النهاية YYYY-MM-DD:","") || null;
  const {error} = await sb.from("pi_tours").insert({name, org, scope:"official", source, starts_at:st, ends_at:en});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إضافة بطولة رسمية: ${name} — المصدر ${source}`);
  toast("أُضيفت — بمصدرها وباسمك في سجل الشفافية"); render();
};

window.trAddNews = async () => {
  if(!ME || ME.role!=="admin") return toast("للأدمن فقط",1);
  const title = prompt("عنوان الخبر:"); if(!title) return;
  const source = prompt("المصدر (من قال الخبر) — إلزامي:"); if(!source) return toast("خبر بلا مصدر لا يُطبع",1);
  const summary = prompt("ملخّص سطرين (اختياري):","") || null;
  const url = prompt("رابط المصدر (اختياري):","") || null;
  const {error} = await sb.from("pi_news").insert({title, source, summary, url, added_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إضافة خبر: ${title} — المصدر ${source}`);
  toast("نُشر — باسم مصدره وباسمك كمن أدخله"); render();
};

window.trFollow = async name => {  if(!ME) return toast("سجّل دخولك أولًا",1);
  try{
    const {error} = await sb.from("pi_follows").insert({person:ME.name, kind:"tour", target:name});
    if(error) throw error;
    toast("تتابعها — ستصلك مبارياتها في لوحتك");
  }catch(e){ toast("تعذّر الحفظ — تابعها لاحقًا",1); }
};
