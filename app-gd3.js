/* PlayIn365 — عمود وليّ الأمر: طمأنينة بلا عبء
   قرار المالك: إذن واحد دائم للتعاملات العادية — ولا يُستأذن إلا في الجسيم (تعاقد · انتقال · طبي · نشر تجاري).
   وليّ الأمر ليس موظّفًا: يرى ابنه، ويُخطَر بما يهمّ، ويقرّر في الجسيم وحده. */
const GD = {};
GD.DROP="50% 50% 50% 8px"; GD.dash="—";
GD.esn = s => esc(String(s==null?"":s));
GD.av  = (n,sz,o) => PL3.av(n, sz||34, Object.assign({dark:true, r:"50% 50% 50% "+Math.max(4,Math.round((sz||34)*.22))+"px"}, o||{}));
GD.ic  = (g,bg,ink,r) => `<span style="width:32px;height:32px;border-radius:${r||GD.DROP};background:${bg||"#efedff"};color:${ink||"#4636e3"};display:grid;place-items:center;font-size:13px;font-weight:900;flex:none">${g}</span>`;
GD.card= i => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:16px">${i}</div>`;
GD.h   = t => `<b style="font-size:13px;font-weight:900">${t}</b>`;
GD.sub = t => `<span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">${t}</span>`;
GD.note= t => `<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">${t}</div>`;
GD.empty=t => `<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">${t}</div>`;
GD.disc= c => `<div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:${c||"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:${c==="#f5c518"?".14":c?".9":".5"}"></div>`;
GD.top = (title,sub) => `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('gdHome')" style="width:40px;height:40px;border-radius:${GD.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <span style="font-size:10.5px;font-weight:900;color:#8a8fa5">وليّ أمر</span></div>
  <div style="text-align:center;padding:6px 18px 0"><b style="display:block;font-size:26px;font-weight:900;line-height:1.3">${title}</b><span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">${sub}</span></div>`;
/* الجسيم وحده يستأذن */
GD.GRAVE = [["تعاقد","⇄","عقد أو انضمام لنادٍ"],["انتقال","▶","انتقال من جهة لأخرى"],["اطّلاع طبي","🔒","فتح الملف الطبي"],["نشر تجاري","▣","استخدام صورته تجاريًا"]];
GD.kids = () => { try{ return JSON.parse(localStorage.getItem("pi_gd_"+(ME&&ME.id))||"[]"); }catch(e){ return []; } };
GD.setKids = a => { try{ localStorage.setItem("pi_gd_"+(ME&&ME.id), JSON.stringify(a)); }catch(e){} };

GD.load = async () => {
  const pf = await q("p", sb.from("profiles").select("id,name,role,org,pos,age,shirt,avatar_url,guardian_name,guardian_consent_at").eq("role","player").limit(400));
  let kids = pf.filter(p=>p.guardian_name && p.guardian_name===ME.name);
  const linked = GD.kids();
  if(linked.length) kids = [...kids, ...pf.filter(p=>linked.indexOf(p.name)>=0 && kids.every(k=>k.name!==p.name))];
  if(!kids.length && ME.org) kids = pf.filter(p=>p.org===ME.org && p.age && p.age<18).slice(0,2);
  const names = kids.map(k=>k.name);
  const [att,ev,cal,hs,views,subs,ms] = await Promise.all([
    q("a", sb.from("attendance").select("*").limit(1500)),
    q("e", sb.from("match_events").select("*,matches(title)").order("created_at",{ascending:false}).limit(300)),
    q("c", sb.from("calendar_items").select("*").order("on_date",{ascending:false}).limit(300)),
    q("h", sb.from("health_status").select("*").limit(200)),
    q("v", sb.from("pi_views").select("*").order("created_at",{ascending:false}).limit(200)),
    q("s", sb.from("subscriptions").select("*").limit(300)),
    q("m", sb.from("matches").select("*").order("created_at",{ascending:false}).limit(60))
  ]);
  const F = a => a.filter(x=>names.indexOf(x.player_name||x.who||x.subject)>=0);
  return {kids, names, att:F(att), evs:ev.filter(e=>names.indexOf(e.who)>=0), cal:F(cal), hs:hs.filter(h=>names.indexOf(h.player_name)>=0), views:views.filter(v=>names.indexOf(v.subject)>=0), subs:F(subs), ms};
};
GD.pick = () => { try{ return localStorage.getItem("pi_gdsel_"+(ME&&ME.id)); }catch(e){ return null; } };
window.gdPick = n => { try{ localStorage.setItem("pi_gdsel_"+(ME&&ME.id), n); }catch(e){} render(); };
window.gdLink = async () => {
  const n = String(prompt("اسم ابنك كما هو في المنصة:")||"").trim(); if(!n) return;
  const {data} = await sb.from("profiles").select("id,name,age").eq("name",n).limit(1).single();
  if(!data) return toast("لا حساب بهذا الاسم",1);
  const {error} = await sb.from("profiles").update({guardian_name:ME.name, guardian_consent_at:new Date().toISOString(), guardian_scope:"عادي"}).eq("id",data.id);
  if(error) return toast("تعذّر: "+error.message,1);
  GD.setKids([...new Set([...GD.kids(), n])]);
  await sb.from("transparency").insert({actor:ME.name+" — وليّ أمر", action:`أذِن بمتابعة ${n} وتعاملاته العادية — ويبقى الجسيم باستئذانه`});
  toast("ارتبطتَ بـ"+n+" — إذن واحد يكفي"); render();
};

/* ═══ الرئيسية — اطمئن ═══ */
T.gdHome = async () => {
  const D = await GD.load();
  if(!D.kids.length) return GD.top("أبنائي","اربط حسابك بابنك") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${GD.card(`<div style="display:flex;gap:12px;align-items:center">${GD.ic("👤","#efedff","#4636e3",44)}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:13px">لم تربط ابنًا بعد</b>${GD.sub("اربطه مرة واحدة، ويصير الإذن دائمًا للتعاملات العادية")}</div></div>
      <button onclick="gdLink()" style="width:100%;margin-top:12px;background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">اربط ابنك</button>`)}
    ${GD.note("إذن واحد ودائم للمتابعة والتدريب والحضور والتقييم — ولا يُستأذن إلا في تعاقد أو انتقال أو اطّلاع طبي أو نشر تجاري.")}</main>`;
  const sel = D.kids.find(k=>k.name===GD.pick()) || D.kids[0];
  const kAtt = D.att.filter(a=>a.player_name===sel.name);
  const kEv = D.evs.filter(e=>e.who===sel.name);
  const h = D.hs.find(x=>x.player_name===sel.name);
  const today = new Date().toISOString().slice(0,10);
  const nextCal = D.cal.filter(c=>c.player_name===sel.name && String(c.on_date||"")>=today).sort((a,b)=>String(a.on_date).localeCompare(String(b.on_date)))[0];
  const lastAtt = kAtt[0];
  const unpaid = D.subs.filter(s=>s.player_name===sel.name && !s.paid);
  const scouts = D.views.filter(v=>v.subject===sel.name && (v.viewer_role==="scout"||v.viewer_role==="agent"));
  const HS = {available:["بخير","#2c6e49","#eaf5ee"],rehab:["تأهيل","#8a6912","#fff8df"],limited:["بقيود","#8a6912","#fff8df"],out:["غير متاح","#a83b25","#fdeee8"]};
  const S = h?(HS[h.state]||HS.available):HS.available;
  const days = [...new Set(kAtt.map(a=>String(a.created_at||"").slice(0,10)))];
  const w4 = kAtt.filter(a=>(Date.now()-new Date(a.created_at))/864e5<=28).length;
  const alerts = [
    ...(h&&h.state!=="available"?[["🔒",`${sel.name} — ${S[0]}`,`${h.phase?esc(h.phase)+" · ":""}سجّلها ${esc(h.updated_by||"المختص")}`,"gdHealth","#eef7f4","#2c8471",1]]:[]),
    ...(unpaid.length?[["▮",`اشتراك غير محصَّل`,`<span class="ltr">${unpaid.length}</span> — يصلك إيصال لحظة الدفع`,"gdPay","#fdeee8","#a83b25",0]]:[]),
    ...(scouts.length?[["◎",`${scouts.length} كشّافًا اطّلع على ملفه`,"كل اطّلاع باسمه ووقته — والطبي محجوب عنه","gdPrivacy","#efedff","#4636e3",0]]:[])
  ];

  return `<div style="position:relative;background:#151a2e;padding:18px 18px 24px;border-radius:0 0 36px 36px;overflow:hidden">${GD.disc()}
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
      <button onclick="go('gdPrivacy')" style="width:40px;height:40px;border-radius:${GD.DROP};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">🔒</button>
      ${WM(1)}
      <button onclick="go('settings')" style="width:40px;height:40px;border-radius:${GD.DROP};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">⚙</button>
    </div>
    <div style="position:relative;display:flex;align-items:center;gap:16px;margin-top:18px">
      <button onclick="go('publicView','${GD.esn(sel.name)}')" style="flex:none;background:none;border:0;padding:0;cursor:pointer">${GD.av(sel.name,84,{url:sel.avatar_url,r:"50% 50% 50% 12px",ring:"4px solid #4636e3"})}</button>
      <div style="flex:1;min-width:0">
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:800">ابنك</span>
        <b style="display:block;font-size:23px;font-weight:900;color:#faf8f3;line-height:1.2">${esc(sel.name)}</b>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${esc(sel.pos||"لاعب")}${sel.age?` · <span class="ltr">${ACD.grpOf(sel.age)||sel.age}</span>`:""}${sel.org?" · "+esc(sel.org):""}</span>
        <span style="display:inline-block;margin-top:8px;background:${S[1]}22;color:${S[1]==="#2c6e49"?"#7fd7a4":"#f5c518"};border-radius:999px;padding:3px 11px;font-size:10.5px;font-weight:800">${S[0]}${h?" — بقول المختص":""}</span>
      </div></div>
    ${D.kids.length>1?`<div style="position:relative;display:flex;gap:6px;margin-top:14px;overflow-x:auto">${D.kids.map(k=>`<button onclick="gdPick('${GD.esn(k.name)}')" style="flex:none;display:flex;align-items:center;gap:7px;background:${k.name===sel.name?"#fff":"rgba(255,255,255,.1)"};color:${k.name===sel.name?"#151a2e":"#faf8f3"};border:1px solid ${k.name===sel.name?"#fff":"rgba(255,255,255,.22)"};border-radius:999px;padding:5px 12px 5px 5px;font:900 10.5px Cairo;cursor:pointer">${GD.av(k.name,24,{url:k.avatar_url})}${esc(String(k.name).split(" ")[0])}</button>`).join("")}</div>`:""}
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;border-radius:22px;overflow:hidden;background:#151a2e;min-height:200px;display:flex">${GD.disc()}
      <div style="position:relative;padding:18px;display:flex;flex-direction:column;gap:8px;width:66%">
        <span style="color:#b9b0f5;font-size:10.5px;font-weight:900">◷ ${nextCal?"القادم":"يومه"}</span>
        <b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.3">${esc(nextCal?nextCal.title:"لا موعد مثبَّت")}</b>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;line-height:1.9">${nextCal
          ?`◔ <span class="ltr">${esc(nextCal.at_time||GD.dash)}</span> · ${esc(String(nextCal.on_date||"").slice(0,10))}<br>◎ ${esc(nextCal.place||nextCal.org||"")}<br><span style="color:#8f9bff">${nextCal.created_by?"أسندها "+esc(nextCal.created_by):""}</span>`
          :`يصلك كل موعد يسنده مدربه — بلا مجموعة واتساب`}</span>
        <button onclick="go('gdTimeline')" style="margin-top:4px;align-self:flex-start;background:#4636e3;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">ما وصله اليوم</button>
      </div>
      <div style="position:absolute;inset-inline-end:16px;bottom:16px;width:88px;height:88px;border-radius:50%;display:grid;place-items:center;background:#151a2e;box-shadow:0 0 0 6px #4636e3">
        <div style="text-align:center"><b class="ltr" style="display:block;font-size:22px;font-weight:700;color:#faf8f3">${w4||GD.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">حصة/شهر</span></div></div>
    </div>

    ${alerts.length?alerts.map(([g,t,s,v,bg,ink,u])=>`<button onclick="go('${v}')" style="background:#fff;border:1px solid ${u?"#cfe5dd":"#e9e4d8"};border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;width:100%;color:#151a2e">
      <span style="width:40px;height:40px;border-radius:${GD.DROP};background:${bg};color:${ink};display:grid;place-items:center;font-size:16px;flex:none">${g}</span>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">${t}</b><span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${s}</span></div>
      <span style="color:#8a8fa5">←</span></button>`).join("")
    :GD.card(`<div style="display:flex;gap:12px;align-items:center">${GD.ic("✓","#eaf5ee","#2c6e49")}<div style="flex:1"><b style="display:block;font-size:12.5px">كل شيء على ما يُرام</b>${GD.sub("لا قيد طبي ولا اشتراك متأخّر — ولن نزعجك بلا سبب")}</div></div>`)}

    ${GD.h("مداخلك")}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${[["◷","ما وصله","اليوم وأمس","gdTimeline","#efedff","#4636e3"],["▤","سجله","بتوقيع غيرنا","gdRecord","#efedff","#4636e3"],["🔒","صحته","بإذنك وحدك","gdHealth","#eef7f4","#2c8471"],["▮","المدفوعات","بإيصال","gdPay","#fff6d6","#c78c00"],["👤","أذوني","ما أذنت به","gdPrivacy","#efedff","#4636e3"],["▣","بطاقته","كما يراها الزائر","publicView","#efedff","#4636e3"]]
        .map(([g,t,s,v,bg,ink])=>`<button onclick="go('${v}'${v==="publicView"?`,'${GD.esn(sel.name)}'`:""})" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;color:#151a2e;cursor:pointer;font-family:Cairo">
        <span style="width:40px;height:40px;border-radius:${GD.DROP};display:grid;place-items:center;font-size:17px;background:${bg};color:${ink}">${g}</span>
        <b style="font-size:12px;font-weight:900">${t}</b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800">${s}</span></button>`).join("")}
    </div>

    ${GD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${GD.h("آخر ما دخل سجله")}<a onclick="go('gdRecord')" style="font-size:11px;font-weight:900;cursor:pointer">السجل ←</a></div>
      ${kEv.length?kEv.slice(0,3).map(e=>{const E=RF.EV.find(x=>x[0]===e.type)||RF.EV[4];
        return `<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">${GD.ic(E[1],E[3]+"18",E[3])}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(evLabel(e))}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — سجّله ${esc(e.recorded_by)}</span></div>
          <b class="ltr" style="font-size:12px;color:#4636e3;flex:none">${e.minute}′</b></div>`;}).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px">${GD.empty("سجله يبدأ من أول مباراة يوقّعها حكمها")}</div>`}`)}

    ${GD.note("نُخطرك بما يهمّك فقط: إصابة · قرار طبي · اطّلاع كشّاف · اشتراك. وما دون ذلك يمضي بإذنك الأول بلا إزعاج.")}
  </main>`;
};

/* ═══ ما وصله ═══ */
T.gdTimeline = async () => {
  const D = await GD.load(); if(!D.kids.length) return T.gdHome();
  const sel = D.kids.find(k=>k.name===GD.pick()) || D.kids[0];
  const items = [
    ...D.cal.filter(c=>c.player_name===sel.name).map(c=>({t:c.title, s:c.subtitle||"", by:c.created_by, at:c.on_date, g:"◷", bg:"#efedff", ink:"#4636e3"})),
    ...D.att.filter(a=>a.player_name===sel.name).slice(0,8).map(a=>({t:"حضر الحصة", s:"", by:a.recorded_by, at:String(a.created_at||"").slice(0,10), g:"✓", bg:"#eaf5ee", ink:"#2c6e49"})),
    ...D.evs.filter(e=>e.who===sel.name).slice(0,6).map(e=>({t:evLabel(e), s:(e.matches&&e.matches.title)||"", by:e.recorded_by, at:String(e.created_at||"").slice(0,10), g:"⚽", bg:"#fff6d6", ink:"#c78c00"}))
  ].sort((a,b)=>String(b.at||"").localeCompare(String(a.at||""))).slice(0,20);
  return GD.top("ما وصله", esc(sel.name)+" — كل سطر باسم من سجّله") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${GD.card(items.length?items.map(x=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:11px 0;border-top:1px solid #f0ece2">
      ${GD.ic(x.g,x.bg,x.ink)}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;line-height:1.5">${esc(x.t)}</b>
        ${x.s?`<span style="display:block;font-size:10px;color:#5b6078;font-weight:700;margin-top:2px;line-height:1.7">${esc(x.s)}</span>`:""}
        <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:3px">${x.by?"سجّله "+esc(x.by):""}</span></div>
      <span class="ltr" style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${esc(x.at||"")}</span></div>`).join("")
    :GD.empty("لا شيء بعد — يصلك كل ما يسجّله مدربه أو حكمه"))}
    ${GD.note("هذه الشاشة تغني عن مجموعة الواتساب: لا إشاعة ولا صورة بلا مصدر — كل سطر باسم من سجّله ووقته.")}
  </main>`;
};

/* ═══ سجله ═══ */
T.gdRecord = async () => {
  const D = await GD.load(); if(!D.kids.length) return T.gdHome();
  const sel = D.kids.find(k=>k.name===GD.pick()) || D.kids[0];
  const ev = D.evs.filter(e=>e.who===sel.name), att = D.att.filter(a=>a.player_name===sel.name);
  const goals = ev.filter(e=>e.type==="goal").length, assists = ev.filter(e=>e.type==="assist").length;
  const cards = ev.filter(e=>e.type==="yellow"||e.type==="red");
  const matches = new Set(ev.map(e=>e.match_id)).size;
  const days = [...new Set(att.map(a=>String(a.created_at||"").slice(0,10)))].length;
  return GD.top("سجله", esc(sel.name)+" — بتوقيع غيرنا لا بقولنا") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${GD.disc("#f5c518")}
      <div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
        ${[["مباراة",matches],["هدفًا",goals],["صناعة",assists],["حصة",days]].map(([k,v])=>`<div><b class="ltr" style="display:block;font-size:21px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||GD.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}</div></div>
    ${GD.card(`${GD.h("الأحداث الموثّقة")}
      ${ev.length?ev.slice(0,10).map(e=>{const E=RF.EV.find(x=>x[0]===e.type)||RF.EV[4];
        return `<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">${GD.ic(E[1],E[3]+"18",E[3])}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(evLabel(e))}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — ${esc(e.recorded_by)}</span></div>
          <b class="ltr" style="font-size:12px;color:#4636e3;flex:none">${e.minute}′</b></div>`;}).join("")
      :GD.empty("لا أحداث بعد")}`)}
    ${cards.length?GD.card(`${GD.h("الانضباط")}${GD.sub("كل بطاقة بسببها — تقرؤها كما كتبها الحكم")}
      ${cards.map(e=>`<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
        <span style="width:22px;height:30px;border-radius:4px;background:${e.type==="red"?"#a83b25":"#f5c518"};flex:none"></span>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(String(e.recorded_by||"").split("·")[1]||"بلا سبب مسجَّل")}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} — ${esc(String(e.recorded_by||"").split("·")[0])}</span></div>
        <b class="ltr" style="font-size:12px;flex:none">${e.minute}′</b></div>`).join("")}`):""}
    <button onclick="go('publicView','${GD.esn(sel.name)}')" style="background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer">▣ بطاقته كما يراها الزائر</button>
    ${GD.note("لا نملك تعديل سطر من سجله ولا أنت — التصحيح باسم من صحّحه في سجل الشفافية.")}
  </main>`;
};

/* ═══ صحته ═══ */
T.gdHealth = async () => {
  const D = await GD.load(); if(!D.kids.length) return T.gdHome();
  const sel = D.kids.find(k=>k.name===GD.pick()) || D.kids[0];
  const h = D.hs.find(x=>x.player_name===sel.name);
  const opens = D.views.filter(v=>v.subject===sel.name && v.scope==="medical");
  const HS = {available:["بخير — متاح","#2c6e49","#eaf5ee"],rehab:["تأهيل","#8a6912","#fff8df"],limited:["بقيود","#8a6912","#fff8df"],out:["غير متاح","#a83b25","#fdeee8"]};
  const S = h?(HS[h.state]||HS.available):null;
  return GD.top("صحته 🔒","بإذنك وحدك — وكل اطّلاع مسجَّل") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="background:#eef7f4;border:1px solid #cfe5dd;border-radius:22px;padding:18px">
      <div style="display:flex;align-items:center;gap:14px">
        ${GD.av(sel.name,56,{url:sel.avatar_url})}
        <div style="flex:1;min-width:0"><span style="display:block;font-size:10px;color:#2c8471;font-weight:900">الحالة الآن</span>
          <b style="display:block;font-size:18px;font-weight:900;color:${S?S[1]:"#8a8fa5"};margin-top:2px">${S?S[0]:"لا سجل طبي"}</b>
          <span style="display:block;font-size:10.5px;color:#4a6d62;font-weight:700;margin-top:3px">${h?`${h.phase?esc(h.phase)+" · ":""}سجّلها ${esc(h.updated_by||"المختص")}`:"يكتبها المختص الطبي — لا الأكاديمية ولا أنت"}</span></div></div>
      ${h&&h.note?`<div style="margin-top:12px;background:#fff;border:1px solid #cfe5dd;border-radius:14px;padding:12px;font-size:11px;color:#1d4a3e;font-weight:700;line-height:1.85">${esc(h.note)}</div>`:""}
    </div>
    ${GD.card(`${GD.h("من اطّلع على ملفه الطبي")}${GD.sub("بإذنك المنفصل — ولا يراه كشّاف ولا وكيل أبدًا")}
      ${opens.length?opens.map(v=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">${GD.av(v.viewer,32)}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(v.viewer)}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(roleAr[v.viewer_role]||v.viewer_role||"")}</span></div>
        <span style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${VW.rel(v.created_at)}</span></div>`).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px">${GD.empty("لم يطّلع أحد — ولن يطّلع إلا بإذنك، ويُسجَّل اسمه ووقته")}</div>`}`)}
    <div style="background:#eef7f4;border:1px solid #cfe5dd;border-radius:16px;padding:13px;font-size:11px;color:#1d4a3e;font-weight:700;line-height:1.85">🔒 الملف الطبي بإذن منفصل عن إذنك العام — فحتى بعد أن أذنتَ بالمتابعة، يبقى الطبي مقفلًا حتى تأذن به وحده. وإصابة ابنك تصلك فورًا بلا استئذان.</div>
  </main>`;
};

/* ═══ المدفوعات ═══ */
T.gdPay = async () => {
  const D = await GD.load(); if(!D.kids.length) return T.gdHome();
  const sel = D.kids.find(k=>k.name===GD.pick()) || D.kids[0];
  const subs = D.subs.filter(s=>s.player_name===sel.name);
  const paid = subs.filter(s=>s.paid), unpaid = subs.filter(s=>!s.paid);
  const sum = a => a.reduce((s,x)=>s+(+x.amount||0),0);
  return GD.top("المدفوعات", esc(sel.name)+" — كل ريال بإيصال") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${GD.disc()}
      <div style="position:relative;display:grid;grid-template-columns:repeat(2,1fr);gap:10px;text-align:center">
        <div><b class="ltr" style="display:block;font-size:24px;font-weight:700;color:#7fd7a4">${sum(paid)?sum(paid).toLocaleString("en"):GD.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">مدفوع (ر.س)</span></div>
        <div><b class="ltr" style="display:block;font-size:24px;font-weight:700;color:${unpaid.length?"#f5c518":"#8a93b0"}">${sum(unpaid)?sum(unpaid).toLocaleString("en"):GD.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">مستحق</span></div>
      </div></div>
    ${GD.card(`${GD.h("السجل المالي")}
      ${subs.length?subs.map(s=>`<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        ${GD.ic(s.paid?"✓":"◷", s.paid?"#eaf5ee":"#fff6d6", s.paid?"#2c6e49":"#c78c00")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(s.group_name||"اشتراك")}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(s.org||"")}${s.paid?" · وصلك إيصال":" · لم يُحصَّل بعد"}</span></div>
        <b class="ltr" style="font-size:13px;color:${s.paid?"#2c6e49":"#c78c00"};flex:none">${(+s.amount||0).toLocaleString("en")}</b></div>`).join("")
      :GD.empty("لا اشتراكات مسجَّلة")}`)}
    ${GD.note("كل ريال عبر المنصة بإيصال باسم دافعه — والإلغاء بسبب مكتوب يردّ المبلغ. ولا تُطالَب بمبلغ خارج المنصة.")}
  </main>`;
};

/* ═══ أذوني ═══ */
window.gdGrant = async (kid, kind, on) => {
  await sb.from("transparency").insert({actor:ME.name+" — وليّ أمر", action:`${on?"أذِن":"سحب الإذن"} في «${kind}» عن ${kid}`});
  const k = "pi_gdg_"+(ME&&ME.id)+"_"+kid;
  let g={}; try{ g=JSON.parse(localStorage.getItem(k)||"{}"); }catch(e){}
  g[kind]=on; try{ localStorage.setItem(k, JSON.stringify(g)); }catch(e){}
  toast(on?"أُذن — ويُسجَّل باسمك":"سُحب الإذن — ويُسجَّل باسمك"); render();
};
T.gdPrivacy = async () => {
  const D = await GD.load(); if(!D.kids.length) return T.gdHome();
  const sel = D.kids.find(k=>k.name===GD.pick()) || D.kids[0];
  let g={}; try{ g=JSON.parse(localStorage.getItem("pi_gdg_"+(ME&&ME.id)+"_"+sel.name)||"{}"); }catch(e){}
  const views = D.views.filter(v=>v.subject===sel.name);
  return GD.top("أذوني", esc(sel.name)+" — إذن واحد للعادي، واستئذان للجسيم") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${GD.card(`<div style="display:flex;gap:12px;align-items:center">${GD.ic("✓","#eaf5ee","#2c6e49",40)}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px">إذنك العام — سارٍ</b>
        ${GD.sub(sel.guardian_consent_at?`مأذون منذ <span class="ltr">${esc(String(sel.guardian_consent_at).slice(0,10))}</span> — التدريب والحضور والتقييم والانضمام لفئة تمضي بلا استئذان`:"التدريب والحضور والتقييم تمضي بلا استئذان")}</div></div>`)}
    ${GD.card(`${GD.h("ما يستأذنك — الجسيم وحده")}${GD.sub("هذه وحدها تحتاج ردّك · وما دونها يمضي")}
      ${GD.GRAVE.map(([k,ic,d])=>`<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-top:1px solid #f0ece2">
        ${GD.ic(ic, g[k]?"#eaf5ee":"#f2f0ea", g[k]?"#2c6e49":"#8a8fa5")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${k}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${d}</span></div>
        <button onclick="gdGrant('${GD.esn(sel.name)}','${k}',${g[k]?"false":"true"})" style="flex:none;background:${g[k]?"#2c6e49":"#fff"};color:${g[k]?"#fff":"#5b6078"};border:1px solid ${g[k]?"#2c6e49":"#e9e4d8"};border-radius:999px;padding:7px 13px;font:900 10px Cairo;cursor:pointer">${g[k]?"مأذون ✓":"يستأذنك"}</button></div>`).join("")}`)}
    ${GD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${GD.h("من اطّلع على ملفه")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${views.length}</span></span></div>
      ${views.length?views.slice(0,6).map(v=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">${GD.av(v.viewer,32)}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(v.viewer||"غير معروف")}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(roleAr[v.viewer_role]||v.viewer_role||"")}</span></div>
        <span style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${VW.rel(v.created_at)}</span></div>`).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px">${GD.empty("لم يفتح ملفه أحد بعد")}</div>`}`)}
    ${GD.note("لا محادثة خاصة بين بالغ وابنك: الكشّاف يسأل الأكاديمية أو يسألك أنت — لا الطفل. وكل اطّلاع باسم صاحبه ووقته.")}
  </main>`;
};

(function(){
  Object.assign(TITLES,{gdHome:"أبنائي",gdTimeline:"ما وصله",gdRecord:"سجله",gdHealth:"صحته",gdPay:"المدفوعات",gdPrivacy:"أذوني"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE,{gdHome:["أبنائي","اطمئن — بلا مجموعة واتساب"],gdTimeline:["ما وصله","كل سطر باسم من سجّله"],gdRecord:["سجله","بتوقيع غيرنا"],gdHealth:["صحته 🔒","بإذنك وحدك"],gdPay:["المدفوعات","كل ريال بإيصال"],gdPrivacy:["أذوني","الجسيم وحده يستأذنك"]});
  GD.OWN = ["gdHome","gdTimeline","gdRecord","gdHealth","gdPay","gdPrivacy"];
  if(typeof NAV!=="undefined") NAV.guardian = [["🔒","صحته","gdHealth"],["▤","سجله","gdRecord"],["FAB","","hub"],["◷","ما وصله","gdTimeline"],["⌂","أبنائي","gdHome"]];
  if(typeof HUB!=="undefined"){
    HUB.ROLE.guardian = [["⌂","أبنائي","gdHome","#efedff","#7b5cff"],["◷","ما وصله","gdTimeline"],["▤","سجله","gdRecord"],["🔒","صحته","gdHealth","#eef7f4","#2c8471"],["▮","المدفوعات","gdPay","#fff6d6","#c78c00"],["👤","أذوني","gdPrivacy"]];
    HUB.ROLE_OK.guardian = ["pitch","explore","messages","market","gdHome","gdTimeline","gdRecord","gdHealth","gdPay","gdPrivacy","publicView","acadHome","role","settings"];
  }
  if(typeof homeFor==="function"){ const _h=homeFor; window.homeFor=function(){ return ME && ME.role==="guardian" ? "gdHome" : _h(); }; }
  const _nav = window.navHtml || navHtml;
  window.navHtml = navHtml = function(){ return (ME && ME.role==="guardian" && typeof RF!=="undefined" && RF.nav) ? RF.nav(NAV.guardian) : _nav(); };
  const _r = window.render;
  window.render = render = async function(){
    await _r();
    try{
      if(!ME || ME.role!=="guardian" || VIEW==="auth" || VIEW==="role") return;
      if(GD.OWN.indexOf(VIEW)>=0){ const hd=$("#app").querySelector(".hd"); if(hd) hd.remove(); }
      if(VIEW==="explore") setTimeout(()=>{ try{ PL3.drawMap && PL3.drawMap(); }catch(e){} },80);
      const NOT_MINE=["feed","records","cabinet","myCard","opps","wallet","calendar","health","coachHome","squad","session","drills","brief","rate","tactics","coachTasks","coachMe","boards","erp","erpPeople","erpOps","erpField","orgHome","orgLive","orgPeople","orgNear","orgSettle","orgTasks","orgMe","refHome","refCheck","refMatch","refCards","refReport","refLog","refMe"];
      if(NOT_MINE.indexOf(VIEW)>=0){ go("gdHome"); }
    }catch(e){ console.error("GD",e); }
  };
})();
