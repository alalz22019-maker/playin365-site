/* PlayIn365 — البحث الموحَّد: اسم واحد يجد ملعبًا أو مدربًا أو أكاديمية أو لاعبًا.
   مدخل من الرئيسية ومن صفحات الزوار — والنتيجة تفتح صفحة الكيان نفسها لا نسخة مصغّرة.
   القانون: الأفراد بأسمائهم العامة فقط — لا عنوان ولا بيانات طبية في البحث،
   والقاصر يُعلَّم بأن الاطلاع على سجله بإذن وليّه. */
const FN = {};
FN.dash = "—";
FN.K="#151a2e"; FN.P="#4636e3"; FN.G="#c78c00"; FN.BD="#e9e4d8"; FN.MU="#8a8fa5"; FN.TX="#565d78";
FN.q = ""; FN.k = "all"; FN.D = null; FN.at = 0;

FN.drop = n => (ME && ME.role==="coach") ? `50% 50% ${n}px 50%` : `50% 50% 50% ${n}px`;
FN.norm = s => String(s||"")
  .replace(/[\u064B-\u0652\u0640\u0670]/g,"")
  .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[ؤ]/g,"و").replace(/[ئ]/g,"ي")
  .toLowerCase().trim();
FN.hit = (hay,qq) => {
  const h = FN.norm(hay), ts = FN.norm(qq).split(/\s+/).filter(Boolean);
  return ts.length ? ts.every(t=>h.indexOf(t)>=0) : true;
};

FN.KINDS = [["all","الكل"],["venue","ملاعب"],["academy","أكاديميات"],["coach","مدربون"],["player","لاعبون"]];
FN.META = {
  venue:   {g:"⚑", bg:"#151a2e", ink:"#f5c518", lb:"ملاعب", all:"كل الملاعب"},
  academy: {g:"◈", bg:"#efedff", ink:"#4636e3", lb:"أكاديميات وجهات", all:"كل الأكاديميات والجهات"},
  coach:   {g:"◉", bg:"#efedff", ink:"#4636e3", lb:"مدربون", all:"كل المدربين"},
  player:  {g:"◎", bg:"#faf8f3", ink:"#565d78", lb:"لاعبون", all:"كل اللاعبين"}
};

FN.load = async () => {
  if(FN.D && Date.now()-FN.at < 45000) return FN.D;
  const [pf,vm,bk,om,ms,sp,su,tr] = await Promise.all([
    q("fn_pf", sb.from("profiles").select("id,name,role,org,pos,age,avatar_url,guardian_name").limit(400)),
    q("fn_vm", sb.from("pi_venue_meta").select("*").limit(120)),
    q("fn_bk", sb.from("bookings").select("venue").limit(400)),
    q("fn_om", sb.from("pi_org_meta").select("*").limit(120)),
    q("fn_ms", sb.from("matches").select("venue,organizer_name,comp").limit(300)),
    q("fn_sp", sb.from("pi_spaces").select("venue").limit(200)),
    q("fn_su", sb.from("subscriptions").select("org").limit(400)),
    q("fn_tr", sb.from("pi_tours").select("name").limit(120))
  ]);
  const put = (map,name,row) => { const n=String(name||"").trim(); if(!n) return; if(!map[n]) map[n]=Object.assign({name:n},row); else Object.assign(map[n], Object.fromEntries(Object.entries(row).filter(([,v])=>v!=null&&v!==""))); };

  const V = {};
  (vm||[]).forEach(m=>put(V,m.venue,{kind:"venue", where:[m.city,m.district].filter(Boolean).join(" · "), accredited:!!m.accredited, by:m.updated_by||"", since:m.since||null}));
  (bk||[]).forEach(b=>put(V,b.venue,{kind:"venue", booked:true}));
  (sp||[]).forEach(s=>put(V,s.venue,{kind:"venue"}));
  (ms||[]).forEach(m=>put(V,m.venue,{kind:"venue", played:true}));
  (pf||[]).filter(p=>p.role==="venue").forEach(p=>put(V,p.org||p.name,{kind:"venue"}));

  const A = {};
  (om||[]).forEach(m=>put(A,m.org,{kind:"academy", where:m.city||"", by:m.updated_by||""}));
  (pf||[]).filter(p=>p.role==="academy"||p.role==="club").forEach(p=>put(A,p.org||p.name,{kind:"academy", where:"", head:p.name}));
  const VN = new Set(Object.keys(V));
  (pf||[]).filter(p=>p.org && !VN.has(p.org)).forEach(p=>put(A,p.org,{kind:"academy"}));
  (su||[]).filter(s=>s.org && !VN.has(s.org)).forEach(s=>put(A,s.org,{kind:"academy", paying:true}));
  (ms||[]).filter(m=>m.organizer_name).forEach(m=>put(A,m.organizer_name,{kind:"academy", organizer:true, comp:m.comp||""}));
  const TN = new Set((tr||[]).map(t=>String(t.name||"").trim()));
  Object.values(A).forEach(a=>{ if(TN.has(a.name)) a.tour=true; });
  (ms||[]).filter(m=>m.comp && TN.has(String(m.comp).trim())).forEach(m=>put(A,m.comp,{kind:"academy", tour:true}));

  const person = r => ({kind:r.role, name:r.name, org:r.org||"", pos:r.pos||"", age:r.age||null,
                        av:r.avatar_url||null, minor:!!(r.age && +r.age<18), guardian:r.guardian_name||""});
  const C = (pf||[]).filter(p=>p.role==="coach" && p.name).map(person);
  const P = (pf||[]).filter(p=>p.role==="player" && p.name).map(person);

  FN.D = {venue:Object.values(V), academy:Object.values(A), coach:C, player:P};
  FN.at = Date.now();
  return FN.D;
};

FN.hay = e => e.kind==="venue" ? [e.name,e.where].join(" ")
            : e.kind==="academy" ? [e.name,e.where,e.head,e.comp].join(" ")
            : [e.name,e.org,e.pos].join(" ");

FN.sub = e => {
  if(e.kind==="venue") return e.where || (e.booked||e.played ? "ملعب — له سجل مباريات وحجوزات" : "ملعب");
  if(e.kind==="academy" && e.tour) return "بطولة — تفتح غرفتها ومبارياتها";
  if(e.kind==="academy") return [e.where, e.head?"المسؤول "+e.head:"", e.organizer?"جهة منظِّمة"+(e.comp?" · "+e.comp:""):""].filter(Boolean).join(" · ") || "جهة رياضية في سجل المنصة";
  return [e.pos||(e.kind==="coach"?"مدرب":"لاعب"), e.org].filter(Boolean).join(" · ");
};

FN.open = e => e.kind==="venue" ? `go('venuePage','${esc(e.name)}')`
            : e.kind==="academy" ? (e.tour ? `go('tournament','${esc(e.name)}')` : `go('acadHome','${esc(e.name)}')`)
            : `go('publicView','${esc(e.name)}')`;

FN.row = e => {
  const M = FN.META[e.kind] || FN.META.player;
  const icon = (e.kind==="coach"||e.kind==="player") && typeof PL3!=="undefined"
    ? PL3.av(e.name, 42, {role:e.kind, dark:true, r: e.kind==="coach"?"50% 50% 8px 50%":"50% 50% 50% 8px", url:e.av||null})
    : `<span style="width:42px;height:42px;flex:none;border-radius:${FN.drop(8)};background:${M.bg};color:${M.ink};display:grid;place-items:center;font-size:17px">${M.g}</span>`;
  const tags = [];
  if(e.kind==="venue" && e.accredited) tags.push(`<span style="background:#fff8df;border:1px solid #f0e2b4;color:#8a6912;border-radius:999px;padding:3px 9px;font-size:9.5px;font-weight:900">★ منشأة معتمدة</span>`);
  if(e.kind==="venue" && e.since) tags.push(`<span style="background:#faf8f3;border:1px solid ${FN.BD};color:${FN.TX};border-radius:999px;padding:3px 9px;font-size:9.5px;font-weight:900">يعمل منذ <span class="ltr">${esc(e.since)}</span></span>`);
  if(e.minor) tags.push(`<span style="background:#eef7f4;color:#2c8471;border-radius:999px;padding:3px 9px;font-size:9.5px;font-weight:900">قاصر — الاطلاع بإذن وليّه</span>`);
  if(e.kind==="academy" && e.head) tags.push(`<span style="background:#efedff;color:${FN.P};border-radius:999px;padding:3px 9px;font-size:9.5px;font-weight:900">جهة مسجَّلة</span>`);
  return `<button onclick="${FN.open(e)}" style="width:100%;background:#fff;border:1px solid ${FN.BD};border-radius:20px;padding:13px 14px;display:flex;gap:12px;align-items:center;cursor:pointer;font-family:Cairo;text-align:start">
    ${icon}
    <div style="flex:1;min-width:0">
      <b style="display:block;font-size:12.5px;font-weight:900;color:${FN.K}">${esc(e.name)}</b>
      <span style="display:block;font-size:10.5px;font-weight:700;color:${FN.MU};margin-top:3px">${esc(FN.sub(e))}</span>
      ${tags.length?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:7px">${tags.join("")}</div>`:""}
      ${e.by?`<span style="display:block;font-size:9.5px;font-weight:800;color:${FN.MU};margin-top:6px">حدّث بياناته: ${esc(e.by)}</span>`:""}
    </div>
    <span style="color:${FN.P};font-weight:900;flex:none">←</span></button>`;
};

FN.group = (kind,rows,cap) => {
  const M = FN.META[kind];
  const shown = cap ? rows.slice(0,cap) : rows;
  if(!shown.length) return "";
  return `<div style="display:flex;flex-direction:column;gap:9px">
    <div style="display:flex;align-items:center;gap:9px">
      <span style="width:4px;height:15px;border-radius:99px;background:${kind==="venue"?FN.K:FN.P};flex:none"></span>
      <b style="font-size:12.5px;font-weight:900;color:${FN.K}">${M.lb}</b>
      <span class="ltr" style="font-size:10px;font-weight:700;color:${FN.MU}">${rows.length}</span>
    </div>
    ${shown.map(FN.row).join("")}
    ${cap&&rows.length>cap?`<button onclick="fnK('${kind}')" style="background:#faf8f3;border:1px dashed #d6d0c2;border-radius:14px;padding:10px;font:900 10.5px Cairo;color:${FN.P};cursor:pointer">${M.all} (<span class="ltr">${rows.length}</span>) ←</button>`:""}
  </div>`;
};

FN.results = () => {
  const D = FN.D || {venue:[],academy:[],coach:[],player:[]};
  const kinds = FN.k==="all" ? ["venue","academy","coach","player"] : [FN.k];
  const qq = FN.q.trim();
  const sets = kinds.map(k=>[k, (D[k]||[]).filter(e=>FN.hit(FN.hay(e), qq))]);
  const total = sets.reduce((a,[,r])=>a+r.length,0);
  if(!total) return `<div style="background:#fff;border:1px solid ${FN.BD};border-radius:20px;padding:26px 18px;text-align:center">
    <b style="display:block;font-size:13px;font-weight:900;color:${FN.K}">${qq?"لا نتيجة بهذا الاسم":"لا شيء مسجَّل في هذا المرشّح بعد"}</b>
    <span style="display:block;font-size:11px;font-weight:700;color:${FN.MU};line-height:1.85;margin-top:7px">${qq?"جرّب اسمًا أقصر — أو ابحث بالحيّ أو المدينة لملعب، وبالجهة لمدرب.":"الجهات تظهر هنا فور تسجيلها، والأفراد فور إكمال ملفاتهم."}</span></div>`;
  const cap = FN.k==="all" ? (qq?4:3) : 0;
  return sets.map(([k,r])=>FN.group(k,r,cap)).filter(Boolean).join(`<div style="height:2px"></div>`);
};

FN.meta = () => {
  const D = FN.D || {}; const qq = FN.q.trim();
  const kinds = FN.k==="all" ? ["venue","academy","coach","player"] : [FN.k];
  const n = kinds.reduce((a,k)=>a+(D[k]||[]).filter(e=>FN.hit(FN.hay(e), qq)).length, 0);
  if(qq && !n) return `<span style="color:${FN.MU}">لا نتيجة لـ«${esc(qq)}»</span>`;
  return `<span class="ltr" style="font-family:'Space Grotesk';font-weight:700;color:${n?FN.P:FN.MU}">${n||FN.dash}</span> ${qq?"نتيجة لـ«"+esc(qq)+"»":"مسجَّل الآن"}`;
};

FN.chips = () => FN.KINDS.map(([k,t])=>`<button onclick="fnK('${k}')" style="flex:none;border-radius:999px;padding:7px 13px;font:900 10.5px Cairo;cursor:pointer;background:${FN.k===k?FN.K:"#fff"};color:${FN.k===k?"#faf8f3":FN.TX};border:1px solid ${FN.k===k?FN.K:FN.BD}">${t}</button>`).join("");

FN.paint = () => {
  const r = document.getElementById("fn_res"); if(r) r.innerHTML = FN.results();
  const m = document.getElementById("fn_meta"); if(m) m.innerHTML = FN.meta();
  const c = document.getElementById("fn_chips"); if(c) c.innerHTML = FN.chips();
  const x = document.getElementById("fn_x"); if(x) x.style.visibility = FN.q.trim()?"visible":"hidden";
};
window.fnQ = v => { FN.q = String(v||""); FN.paint(); };
window.fnK = k => { FN.k = k; FN.paint(); const i=document.getElementById("fn_in"); if(i) i.focus(); };
window.fnClear = () => { FN.q=""; const i=document.getElementById("fn_in"); if(i){ i.value=""; i.focus(); } FN.paint(); };

T.find = async () => {
  await FN.load();
  return `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:13px">

    <div style="display:flex;align-items:center;gap:9px;background:#fff;border:1px solid ${FN.BD};border-radius:16px;padding:12px 14px">
      <span style="color:${FN.P};font-size:15px;flex:none">⌕</span>
      <input id="fn_in" value="${esc(FN.q)}" oninput="fnQ(this.value)" placeholder="اسم ملعب أو مدرب أو أكاديمية أو لاعب" autocomplete="off"
        style="flex:1;min-width:0;border:0;outline:0;background:none;font:700 13px Cairo;color:${FN.K}">
      <button id="fn_x" onclick="fnClear()" style="flex:none;visibility:${FN.q?"visible":"hidden"};background:#faf8f3;border:1px solid ${FN.BD};border-radius:999px;width:26px;height:26px;font:900 12px Cairo;color:${FN.TX};cursor:pointer">×</button>
    </div>

    <div id="fn_chips" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:2px">${FN.chips()}</div>
    <span id="fn_meta" style="font-size:10.5px;font-weight:800;color:${FN.MU}">${FN.meta()}</span>
    <div id="fn_res" style="display:flex;flex-direction:column;gap:14px">${FN.results()}</div>

    <div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">
      الجهات تُعرض بموقعها، والأفراد بأسمائهم العامة وحدها — لا عنوان ولا رقم ولا بيانات طبية في البحث. سجل القاصر لا يُفتح إلا بإذن وليّه، والاطلاع يُسجَّل.
    </div>
  </main>`;
};

/* ── المداخل: شريط بحث في أعلى الشاشات التي يبدأ منها المستخدم ── */
FN.ENTRY = {feed:1, home:1, explore:1, hub:1, pitch:1, venuePage:1, acadHome:1, orgHome:1, coachHome:1, venue:1, guardian:1, scout:1};
FN.bar = () => {
  const b = document.createElement("button");
  b.id = "fn_bar";
  b.setAttribute("onclick","go('find')");
  b.style.cssText = `width:100%;background:#fff;border:1px solid ${FN.BD};border-radius:16px;padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;font-family:Cairo;text-align:start;flex:none;margin-bottom:2px`;
  b.innerHTML = `<span style="color:${FN.P};font-size:15px;flex:none">⌕</span>
    <span style="flex:1;min-width:0;font-size:11.5px;font-weight:800;color:${FN.MU}">ابحث باسم ملعب · أكاديمية · مدرب · لاعب</span>
    <span style="flex:none;color:${FN.P};font-weight:900">←</span>`;
  return b;
};
FN.inject = () => {
  if(!ME || !FN.ENTRY[VIEW]) return;
  if(document.getElementById("fn_bar")) return;
  const m = document.querySelector("#app main"); if(!m) return;
  m.insertBefore(FN.bar(), m.firstChild);
};

(function(){
  if(typeof TITLES!=="undefined") TITLES.find = "البحث بالاسم";
  if(typeof PL3!=="undefined" && PL3.TITLE) PL3.TITLE.find = ["ابحث بالاسم","ملعب · أكاديمية · مدرب · لاعب — من سجل المنصة"];
  if(typeof HUB!=="undefined"){
    HUB.OPEN.push("find");
    if(!HUB.SHARED.some(x=>x[2]==="find")) HUB.SHARED.splice(1,0,["⌕","ابحث بالاسم","find"]);
  }
  const _r = window.render;
  window.render = render = async function(){
    await _r.apply(this, arguments);
    try{ FN.inject(); }catch(e){}
  };
})();
window.FN = FN;

/* منفذ فحص: يقرأ حالة التطبيق بلا تعديلها — يستخدمه سكربت فحص الأدوار */
window.piState = () => ({role: (typeof ME!=="undefined"&&ME)?ME.role:null, name:(typeof ME!=="undefined"&&ME)?ME.name:null, org:(typeof ME!=="undefined"&&ME)?ME.org:null, view: typeof VIEW!=="undefined"?VIEW:null, has: v => typeof T==="object" && typeof T[v]==="function"});
window.piDb = () => sb; /* نفس عميل القاعدة الموجود في الصفحة — الصلاحية في القاعدة لا هنا */
window.piWho = () => (typeof ACD!=="undefined"&&ACD.who)?ACD.who():null;
window.piCall = async v => { try{ const h = await T[v](); return {len:h.length, snip:String(h).slice(0,300)}; }catch(e){ return {err:String(e&&e.message||e)}; } };
