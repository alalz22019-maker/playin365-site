/* PlayIn365 — عمود اللاعب: بقية الشاشات المعتمدة (3b · 3e · 3f · 3g · 3i · 3j · 3k)
   يُحمَّل بعد app-pl3.js. كل رقم من القاعدة أو نسخته التجريبية — و«—» حيث لا مصدر. */
(function(){
const D = PL3.DROP, dash = PL3.dash;
const card = PL3.card, h = PL3.h, sub = PL3.sub, ic = PL3.ic;
const ar = n => Number(n||0).toLocaleString("ar-EG");
const dayN = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const dayS = ["أحد","إثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];
/* الرقم داخل نص القاعدة يُعزل LTR — وإلا انكسرت النتيجة على سطرين */
const esn = s => esc(s).replace(/(\d[\d:\-\u2013\/.٫٬]*\d|\d)/g,'<span class="ltr">$1</span>');
PL3.esn = esn;
const iso = d => new Date(d).toISOString().slice(0,10);
const relDay = d => { const k=Math.round((new Date(iso(d))-new Date(iso(Date.now())))/864e5);
  return k===0?"اليوم":k===1?"غدًا":k===-1?"أمس":dayN[new Date(d).getDay()]; };

Object.assign(PL3.TITLE,{
  coachBrief:["الحصة القادمة","ما يريده مدربك منك — قبل أن تصل"],
  wallet:    ["جدولي ومحفظتي","هذا الأسبوع — والتعارضات ظاهرة"],
  pitch:     ["الملعب","التقدير هنا — والتقييم في السجل. لا يختلطان"],
  news:      ["الأخبار","كل خبر باسم جهته — لا خبر بلا مصدر"]
});

/* ════════ 3b · تعليمات المدرب للحصة القادمة ════════ */
T.coachBrief = async () => {
  const [cal,msgs,att,evs,pf] = await Promise.all([
    q("c",sb.from("calendar_items").select("*").eq("player_name",ME.name).order("on_date",{ascending:true})),
    q("m",sb.from("pi_msgs").select("*").order("created_at",{ascending:false}).limit(30)),
    q("a",sb.from("attendance").select("*").eq("player_name",ME.name).order("created_at",{ascending:false}).limit(60)),
    q("e",sb.from("match_events").select("type").eq("who",ME.name)),
    q("p",sb.from("profiles").select("name,role,org").eq("role","coach").limit(5))
  ]);
  const up = cal.filter(c=>new Date(c.on_date)>=new Date(iso(Date.now())));
  const S = up[0] || cal[cal.length-1] || null;
  const coach = (S&&S.recorded_by) || (pf.find(p=>p.org===ME.org)||pf[0]||{}).name || null;
  const note = msgs.find(m=>/حصة|تدريب|تعليمات/.test(String(m.body||m.text||"")));
  const mins = (S&&+S.minutes)||90, intensity = (S&&+S.intensity)||7;
  const conf = (()=>{try{return localStorage.getItem("pi_conf_"+(S&&S.id))==="1"}catch(e){return false}})();
  const bring = [["🧴","ماء — لتر قبل الحصة بساعة",true],["👟","حذاء العشب الصناعي",true],["🎽","قميص التدريب الأزرق",false],["🩹","رباط الكاحل",false]];
  const ready = bring.filter(b=>b[2]).length;
  const plan = [[Math.round(mins*.15),"إحماء ديناميكي","جري خفيف وإطالات","تهيئة","#efedff","#4636e3"],
    [Math.round(mins*.30),"تمرين استقبال وتمرير","لمستان تحت ضغط","مهاري","#efedff","#4636e3"],
    [Math.round(mins*.30),"لعب مصغّر <span class=\"ltr\">5×5</span>","ضغط عالٍ ومساحات ضيقة","شدة","#151a2e","#f5c518"],
    [Math.round(mins*.15),"تهدئة","إطالة ثابتة وتنفّس","استشفاء","#eaf5ee","#2c6e49"]];
  /* التركيز الشخصي: المحور الأضعف من بصمته الموثقة */
  const goals = evs.filter(e=>e.type==="goal").length, assists = evs.filter(e=>e.type==="assist").length;
  const axes = [["التسديد",goals?Math.min(95,40+goals*8):null],["الصناعة",assists?Math.min(95,40+assists*10):null],["الانتظام",att.length?Math.min(95,att.length*5):null]];
  const weak = axes.filter(a=>a[1]!=null).sort((a,b)=>a[1]-b[1])[0];

  if(!S) return `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${card(`${h("لا حصة قادمة مسندة إليك")}${sub("مدربك يسندها من مساحته — وتصلك هنا فور إرسالها باسمه ووقتها")}
      <button onclick="go('feed')" style="margin-top:12px;background:#4636e3;color:#fff;border:0;border-radius:14px;padding:11px 16px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">عد للرئيسية</button>`)}</main>`;

  return `<div style="position:relative;background:#151a2e;padding:18px 18px 22px;border-radius:0 0 36px 36px;overflow:hidden">
    <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
      <button onclick="go('feed')" style="width:40px;height:40px;border-radius:${D};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">⌂</button>
      <div style="text-align:center"><b style="display:block;font-size:22px;font-weight:900;color:#faf8f3">الحصة القادمة</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:2px">ما يريده مدربك منك — قبل أن تصل</span></div>
      <button onclick="go('calendar')" style="width:40px;height:40px;border-radius:${D};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">→</button>
    </div>
    <div style="position:relative;display:flex;align-items:center;gap:14px;margin-top:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:14px">
      ${PL3.av(coach,60,{role:"coach",dark:true,r:"50% 50% 10px 50%"})}
      <div style="flex:1;min-width:0">
        <b style="display:block;font-size:15px;font-weight:900;color:#faf8f3">${esc(coach?"المدرب "+coach:"مدرب غير مسمّى")}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:2px">${esc(S.title||"حصة تدريب")} · ${relDay(S.on_date)}${S.at_time?` · <span class="ltr">${esc(S.at_time)}</span>`:""}${S.place?" · "+esc(S.place):""}</span>
        <span style="display:inline-block;margin-top:6px;background:#eaf5ee;color:#2c6e49;border-radius:999px;padding:3px 10px;font-size:9.5px;font-weight:900">${coach?"موثق ✓ · أسندها باسمه":"بانتظار إسناد"}</span>
      </div></div>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${card(`${h("رسالة المدرب")}
      ${note?`<p style="margin:8px 0 0;font-size:12px;font-weight:700;line-height:1.95;text-wrap:pretty">«${esn(note.body||note.text)}»</p>
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:8px;border-top:1px solid #f0ece2;padding-top:8px">كتبها ${esc(note.from_name||coach||"المدرب")} — بصفته · تصلك أنت وولي أمرك</span>`
      :`<span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:8px;line-height:1.9">لا رسالة مرفقة بهذه الحصة — والرسالة حين تصل تحمل اسم كاتبها ووقتها.</span>`}`)}

    ${card(`<div style="display:flex;justify-content:space-between;align-items:center">${h("ما تجلبه معك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${ready}</span> / <span class="ltr">${bring.length}</span> جاهز</span></div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        ${bring.map(([g,t,on],i)=>`<button onclick="tglBring(${i})" style="display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:15px;background:${on?"#eaf5ee":"#faf8f3"};border:1px solid ${on?"#cfe5dd":"#e9e4d8"};cursor:pointer;font-family:Cairo;text-align:start;width:100%">
          <span style="width:26px;height:26px;border-radius:${D};display:grid;place-items:center;font-size:12px;font-weight:900;flex:none;background:${on?"#2c6e49":"#efedff"};color:${on?"#fff":"#4636e3"}">${on?"✓":g}</span>
          <span style="flex:1;font-size:11.5px;font-weight:800;color:${on?"#1d4a3e":"#151a2e"}">${t}</span></button>`).join("")}
      </div>`)}

    ${card(`${h(`خطة الحصة · <span class="ltr">${mins}</span> دقيقة`)}
      ${sub(`حملك المتوقّع <span class="ltr">${mins} × ${intensity} = ${mins*intensity}</span> وحدة — ${mins*intensity<=700?"ضمن نطاقك الآمن":"مرتفع عن معدلك"}`)}
      <div style="display:flex;gap:4px;margin-top:12px;height:10px;border-radius:999px;overflow:hidden">
        <span style="flex:15;background:#b9b0f5"></span><span style="flex:30;background:#4636e3"></span><span style="flex:30;background:#151a2e"></span><span style="flex:15;background:#b9b0f5"></span></div>
      <div style="margin-top:10px">${plan.map(([m,t,s,tag,bg,ink])=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:9px 0;border-top:1px solid #f0ece2">
        <b class="ltr" style="font-size:12px;font-weight:700;color:#4636e3;flex:none;width:34px">${m}′</b>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${t}</b><span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${s}</span></div>
        <span style="font-size:9.5px;font-weight:900;border-radius:999px;padding:3px 8px;flex:none;background:${bg};color:${ink}">${tag}</span></div>`).join("")}</div>
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:8px">الخطة قالب المنصة للشدة المسجَّلة — التفاصيل النهائية عند مدربك</span>`)}

    ${weak?card(`${h("تركيزك الشخصي")}
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
        <div style="flex:1;min-width:0"><span style="display:block;font-size:11px;font-weight:800">${weak[0]} — محورك الأضعف الآن</span>
          <div style="height:8px;border-radius:999px;background:#f0ece2;margin-top:6px;overflow:hidden"><span style="display:block;height:100%;width:${weak[1]}%;background:#4636e3;border-radius:999px"></span></div>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:5px">محسوب من أحداثك الموثقة — لا من تقدير</span></div>
        <b class="ltr" style="font-size:26px;font-weight:700;color:#4636e3">${weak[1]}</b></div>`):""}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button onclick="confSession('${S.id}')" style="background:${conf?"#2c6e49":"#4636e3"};color:#fff;border:0;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">${conf?"أكّدتَ حضورك ✓":"قرأت وسأحضر ✓"}</button>
      <button onclick="go('messages')" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer">اسأل المدرب</button></div>
    <div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">تأكيدك ينعكس عند المدرب فورًا باسمك ووقته — واعتذارك المتأخر يُسجَّل غيابًا بسببه.</div>
  </main>`;
};
window.tglBring = i => { try{const k="pi_bring_"+i;localStorage.setItem(k,localStorage.getItem(k)==="1"?"0":"1")}catch(e){} render(); };
window.confSession = async id => {
  try{localStorage.setItem("pi_conf_"+id,"1")}catch(e){}
  await sb.from("transparency").insert({actor:ME.name+" — لاعب",action:"أكّد حضور الحصة القادمة"});
  toast("أُكّد حضورك — أُخطر المدرب"); render();
};

/* ════════ 3e · خزانتي — طريق الشارات: ما اكتسبتَه وكيف تكسب القادم. العرض للزائر في «ملفي العام» ════════ */
PL3.BADGE_HOW = {hattrick:"ثلاثة أهداف في مباراة واحدة",scorer:"خمسة أهداف موثقة",maker:"ثلاث صناعات موثقة",first:"أول هدف يوقّعه حكم",clean:"ستة أحداث بلا بطاقة حمراء",regular:"عشر حصص موقّعة",loyal:"خمس وعشرون حصة موقّعة",duo:"هدف وصناعة في مباراة واحدة"};
T.cabinet = async () => {
  const [evs,att,joins,tours,allBadges] = await Promise.all([
    q("e",sb.from("match_events").select("*,matches(title,comp,organizer_name)").eq("who",ME.name).order("created_at",{ascending:false})),
    q("a",sb.from("attendance").select("*").eq("player_name",ME.name).limit(300)),
    q("j",sb.from("match_joins").select("match_id,attended").eq("player_name",ME.name)),
    q("to",sb.from("pi_tours").select("*").limit(60)),
    q("ba",sb.from("pi_badges").select("badge_key,person").limit(3000))
  ]);
  await BG.sync(ME.name, evs, att);
  const earned = await BG.of(ME.name, evs, att);
  const got = earned.filter(b=>b.on).length;
  const goals = evs.filter(e=>e.type==="goal").length, assists = evs.filter(e=>e.type==="assist").length;
  const next = [["هدّاف",goals,5,"أهداف موثقة"],["صانع",assists,3,"صناعات موثقة"],["منتظم",att.length,10,"حصص موقّعة"],["وفاء الموسم",att.length,25,"حصة موقّعة"]]
    .filter(x=>x[1]<x[2]).sort((a,b)=>(b[1]/b[2])-(a[1]/a[2]))[0];
  const verified = new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  /* الألقاب: بطولات لعبها فعلًا — البطولة من pi_tours ومشاركته موثّقة */
  const myComps = [...new Set(evs.map(e=>(e.matches&&e.matches.comp)||"").filter(Boolean))];
  const titles = tours.filter(t=>myComps.indexOf(t.name)>=0 || myComps.some(c=>String(t.name||"").indexOf(c)>=0))
    .map(t=>({ nm:t.name||"بطولة", stage:t.stage||"", org:t.org||"", y:String(t.created_at||"").slice(0,4),
      gold:/بطل|وصيف|نهائي/.test(t.stage||"") }));
  /* النُدرة: كم لاعبًا يحمل الشارة نفسها — من القاعدة لا من تقدير */
  const holders={}; (allBadges||[]).forEach(r=>{ (holders[r.badge_key]=holders[r.badge_key]||new Set()).add(r.person); });
  const totalPeople = new Set((allBadges||[]).map(r=>r.person)).size;
  const rar = k => { const n=holders[k]?holders[k].size:0;
    if(!n||!totalPeople) return null;
    const pct = Math.round(n/totalPeople*100);
    return { n, pct, lb: pct<=10?"نادرة":pct<=35?"قليلة":"شائعة", c: pct<=10?"#c78c00":pct<=35?"#4636e3":"#8a8fa5" }; };
  const hasAv = !!PL3.avUrl(ME.name);
  const fields = [["الصورة",hasAv,"avatarSheet()"],["الاسم",!!ME.name],["المركز",!!ME.pos,"go('settings')"],["العمر",!!ME.age,"go('settings')"],["الجهة",!!ME.org,"joinByCode()"],["مباراة موثقة",verified>0,"go('explore')"],["حصص موقّعة",att.length>0],["شارة",got>0]];
  const done = fields.filter(f=>f[1]).length, comp = Math.round(done/fields.length*100);
  const missing = fields.filter(f=>!f[1]);

  return `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
      <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:#f5c518;border-radius:50%;opacity:.14"></div>
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        <div style="flex:none;text-align:center"><b class="ltr" style="display:block;font-size:40px;font-weight:700;line-height:1;color:#f5c518">${got}</b>
          <span style="display:block;font-size:10px;color:#c6cade;font-weight:800;margin-top:3px">من <span class="ltr">${earned.length}</span> شارات</span></div>
        <div style="flex:1;min-width:0">
          ${next?`<span style="display:block;font-size:10px;color:#f5c518;font-weight:900">الشارة القادمة · «${next[0]}»</span>
            <div style="display:flex;gap:4px;margin-top:8px">${[...Array(next[2])].map((_,i)=>`<span style="flex:1;height:8px;border-radius:999px;background:${i<next[1]?"#f5c518":"rgba(255,255,255,.14)"}"></span>`).join("")}</div>
            <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:6px"><span class="ltr">${next[1]}</span> من <span class="ltr">${next[2]}</span> ${next[3]} — الباقي <span class="ltr">${next[2]-next[1]}</span></span>`
          :`<span style="display:block;font-size:10px;color:#f5c518;font-weight:900">كل الشارات المتاحة مكتسبة</span><b style="display:block;font-size:14px;font-weight:900;margin-top:4px">لا شارة مقفلة على مسارك الحالي</b>`}
        </div></div>
      <span style="display:block;position:relative;font-size:9.5px;color:#b9b0f5;font-weight:700;margin-top:12px;line-height:1.7">الشارة تُمنح لحظة تسجيل الحدث الذي يكملها — لا بطلب ولا بشراء</span>
    </div>

    ${card(`${h("الشارات وطريقها")}${sub("المكتسبة بالذهبي — والمقفلة تبقى ظاهرة بشرطها")}
      <div style="margin-top:6px">${earned.map(b=>`<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        <span style="width:44px;height:44px;border-radius:50% 50% 50% 9px;display:grid;place-items:center;font-size:18px;flex:none;background:${b.on?"linear-gradient(160deg,#f5c518,#c78c00)":"#f2f0ea"};color:${b.on?"#151a2e":"#c9c2b2"};border:1px solid ${b.on?"#c78c00":"#e9e4d8"}">${b.g}</span>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900;color:${b.on?"#151a2e":"#8a8fa5"}">${b.nm}</b>
          <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${(b.row&&b.row.signed_by)?`${esc(b.row.match_title||"")} — وقّعه ${esc(b.row.signed_by)}`:b.how}</span></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none">
          <span style="font-size:9.5px;font-weight:900;border-radius:999px;padding:3px 9px;background:${b.sealed?"#fff8df":b.on?"#eaf5ee":"#f2f0ea"};color:${b.sealed?"#8a6912":b.on?"#2c6e49":"#b0aa9c"}">${b.sealed?"مختومة ✓":b.on?"تُختم الآن":"مقفلة"}</span>
          ${(()=>{const R=b.on?rar(b.k):null; return R?`<span style="font-size:8.5px;font-weight:900;color:${R.c};white-space:nowrap">${R.lb} · <span class="ltr">${R.pct}%</span> من الحاملين</span>`:"";})()}
        </div></div>`).join("")}</div>
      ${PL3.sub("المختومة مكتوبة في القاعدة بتاريخها والحدث الذي أكملها — تبقى ولو تغيّر التطبيق")}`)}

    ${card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${h("الألقاب")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">${titles.length?`<span class="ltr">${titles.length}</span> بطولة لعبتها`:"—"}</span></div>
      ${sub("بطولاتٌ شاركت فيها بمباريات موثّقة — والذهبي لمن بلغ دورًا نهائيًا")}
      ${titles.length?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px">
        ${titles.slice(0,6).map(t=>`<div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px">
          <span style="width:56px;height:56px;border-radius:15px;display:grid;place-items:center;font-size:21px;background:${t.gold?"linear-gradient(160deg,#f5c518,#c78c00)":"#f4f2ec"};color:${t.gold?"#151a2e":"#b0aa9c"};border:1px solid ${t.gold?"#c78c00":"#e9e4d8"}">★</span>
          <b style="font-size:10px;font-weight:900;line-height:1.4;color:${t.gold?"#151a2e":"#8a8fa5"}">${esc(t.nm)}</b>
          <span style="font-size:8.5px;font-weight:800;color:#8a8fa5;line-height:1.4">${t.stage?esc(t.stage):"مشاركة"}${t.y?` · <span class="ltr">${t.y}</span>`:""}</span>
        </div>`).join("")}
      </div>`
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;margin-top:11px">
        <b style="display:block;font-size:12.5px">خزانتك تبدأ من أول بطولة</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8;margin-top:5px">اللقب يدخل هنا لحظة يسجّل منظّم البطولة دورك فيها — لا بطلب منك</span></div>`}
      ${PL3.sub("اللقب لا يُكتب باسمك إلا من سجل بطولة قائمة — ولا يُحذف بعدها")}`)}

    ${card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${h("اكتمال ملفك — يفتح لك فرصًا")}<b class="ltr" style="font-size:11px;color:#4636e3">${comp}%</b></div>
      <div style="height:8px;border-radius:999px;background:#f0ece2;margin-top:10px;overflow:hidden"><span style="display:block;height:100%;width:${comp}%;background:#4636e3;border-radius:999px"></span></div>
      ${missing.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${missing.map(f=>f[2]
          ?`<button onclick="${f[2]}" style="background:#efedff;color:#4636e3;border:0;border-radius:999px;padding:5px 11px;font:900 10px Cairo;cursor:pointer">${f[0]==="الجهة"?"⌗ ارتبط برمز":"＋ "+f[0]}</button>`
          :`<span style="background:#f2f0ea;color:#8a8fa5;border-radius:999px;padding:5px 11px;font-size:10px;font-weight:900">${f[0]} — بتوقيع غيرك</span>`).join("")}</div>`
        :`<span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:6px">مكتمل — كل حقل مسنود بمصدره</span>`}`)}

    <button onclick="go('publicView')" style="background:#fff;border:1px dashed #d6d0c2;border-radius:20px;padding:14px 16px;display:flex;gap:12px;align-items:center;cursor:pointer;font-family:Cairo;text-align:start;width:100%">
      ${ic("▣","#fff6d6","#c78c00","50% 50% 50% 8px")}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;font-weight:900">ألقابك وشاراتك المكتسبة تظهر في ملفك العام</b>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">كما يراها الكشاف والنادي — بلا الطريق ولا المقفل</span></div>
      <span style="color:#8a8fa5">←</span></button>
  </main>`;
};

/* ════════ 3f · جدولي ومحفظتي ════════ */
T.wallet = async () => {
  const [cal,mt,subs,att] = await Promise.all([
    q("c",sb.from("calendar_items").select("*").eq("player_name",ME.name).order("on_date",{ascending:true})),
    q("m",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(20)),
    q("s",sb.from("subscriptions").select("*").eq("player_name",ME.name)),
    q("a",sb.from("attendance").select("*").eq("player_name",ME.name).limit(60))
  ]);
  const today = new Date(iso(Date.now()));
  const week = [...Array(7)].map((_,i)=>{ const d=new Date(today); d.setDate(d.getDate()+i-today.getDay());
    const k=iso(d), has=cal.filter(c=>iso(c.on_date)===k), isT=k===iso(Date.now());
    return {d,k,n:d.getDate(),name:dayS[d.getDay()],has:has.length,isT}; });
  const items = [];
  const isMatch = c => /مباراة|ودية|بطولة|دوري|تجارب/.test(String(c.title||""));
  cal.filter(c=>new Date(c.on_date)>=new Date(iso(Date.now()))).slice(0,5).forEach(c=>items.push({
    time:c.at_time||dash, day:relDay(c.on_date), t:c.title||"موعد", s:(c.place||c.org||"")+(c.recorded_by?" · أسندها "+c.recorded_by:""),
    tag:isMatch(c)?"مباراة":"حصة", bg:isMatch(c)?"#151a2e":"#efedff", ink:isMatch(c)?"#f5c518":"#4636e3", key:iso(c.on_date)+(c.at_time||"") }));
  mt.filter(m=>m.status==="today"||m.status==="open"||m.status==="live").slice(0,3).forEach(m=>items.push({
    time:m.match_time||dash, day:m.status==="live"?"الآن":"اليوم", t:m.title, s:(m.venue||"")+(m.organizer_name?" · "+m.organizer_name:""),
    tag:m.status==="live"?"مباشر":"مباراة", bg:m.status==="live"?"#e8531f":"#151a2e", ink:m.status==="live"?"#fff":"#f5c518", key:iso(Date.now())+(m.match_time||"") }));
  /* التعارض: موعدان في اليوم والساعة نفسها */
  const seen={}, clash=[]; items.forEach(i=>{ if(seen[i.key]) clash.push([seen[i.key],i]); else seen[i.key]=i; });
  const dues = subs.filter(s=>!s.paid);
  const paid = subs.filter(s=>s.paid).reduce((a,s)=>a+(+s.amount||0),0);
  const owed = dues.reduce((a,s)=>a+(+s.amount||0),0);
  const bal = (()=>{try{return +(localStorage.getItem("pi_wallet")||0)}catch(e){return 0}})();

  return `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
      ${week.map(w=>`<div style="text-align:center;border-radius:14px;padding:8px 2px;background:${w.isT?"#151a2e":w.has?"#efedff":"#fff"};border:1px solid ${w.isT?"#151a2e":w.has?"#b9b0f5":"#e9e4d8"}">
        <span style="display:block;font-size:9px;font-weight:800;color:${w.isT?"#c6cade":"#8a8fa5"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w.name}</span>
        <b class="ltr" style="display:block;font-size:14px;color:${w.isT?"#faf8f3":"#151a2e"}">${w.n}</b>
        <span style="display:block;width:5px;height:5px;border-radius:50%;margin:4px auto 0;background:${w.has?"#4636e3":"transparent"}"></span></div>`).join("")}
    </div>

    ${card(`${h("مواعيدك")}
      ${items.length?items.map(e=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">
        <div style="flex:none;width:44px;text-align:center"><b class="ltr" style="display:block;font-size:12px;color:#4636e3">${esc(e.time)}</b>
          <span style="display:block;font-size:8.5px;color:#8a8fa5;font-weight:800">${e.day}</span></div>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(e.t)}</b>
          <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.s)||dash}</span></div>
        <span style="font-size:9.5px;font-weight:900;border-radius:999px;padding:3px 8px;flex:none;background:${e.bg};color:${e.ink}">${e.tag}</span></div>`).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">لا مواعيد قادمة — جدولك يتجمّع تلقائيًا من جهتك ومبارياتك.</div>`}`)}

    ${clash.length?`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;display:flex;gap:10px;align-items:center">
      <span style="width:30px;height:30px;border-radius:${D};background:#e8531f;color:#fff;display:grid;place-items:center;font-size:13px;flex:none">⚠️</span>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;font-weight:900;color:#8a6912">تعارض ${clash[0][0].day} — ${esc(clash[0][0].t)} × ${esc(clash[0][1].t)}</b>
        <span style="display:block;font-size:10px;color:#a3862f;font-weight:700;margin-top:2px">الموعدان في الساعة نفسها — قرار الأولوية عند جهتك</span></div></div>`:""}

    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
      <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
      <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-end;gap:12px">
        <div><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">محفظتك</span>
          <b class="ltr" style="display:block;font-size:32px;font-weight:700;margin-top:4px">${bal?ar(bal):dash}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700">ريال · تُصرف على التزاماتك فقط</span></div>
        <button onclick="topUp()" style="background:#fff;color:#151a2e;border:0;border-radius:13px;padding:11px 16px;font:900 11.5px Cairo;cursor:pointer">أضف رصيدًا</button></div>
      <span style="display:block;position:relative;font-size:9.5px;color:#b9b0f5;font-weight:700;margin-top:10px">الدفع خارج التجربة — الرصيد هنا تمرين على التدفق لا معاملة مالية</span>
    </div>

    ${card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${h("التزامات قادمة")}<b class="ltr" style="font-size:12px;color:${owed?"#a83b25":"#2c6e49"}">${owed?ar(owed)+" ر.س":"لا متأخرات ✓"}</b></div>
      ${dues.length?dues.map(d=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">اشتراك ${esc(d.month||"")}${d.group_name?" · "+esc(d.group_name):""}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">تصدرها ${esc(d.org||"جهتك")}</span></div>
        <b class="ltr" style="font-size:14px;flex:none">${ar(d.amount)}</b>
        <button onclick="paySub('${d.id}')" style="flex:none;background:#efedff;color:#4636e3;border:0;border-radius:10px;padding:8px 12px;font:900 10.5px Cairo;cursor:pointer">سدّد</button></div>`).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">${subs.length?`كل اشتراكاتك مسدَّدة — <span class="ltr">${ar(paid)}</span> ر.س هذا الموسم.`:"لا التزامات مسجَّلة عليك."}</div>`}`)}

    ${card(`${h("منح ودعم")}${sub("تُصرف على التزاماتك مباشرة — لا نقدًا")}
      <div style="display:flex;gap:11px;align-items:center;padding:10px 0 0;margin-top:8px;border-top:1px solid #f0ece2">
        <span style="width:32px;height:32px;border-radius:${D};background:linear-gradient(160deg,#f5c518,#c78c00);color:#151a2e;display:grid;place-items:center;font-size:13px;flex:none">★</span>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">منحة موهبة — اتحاد المنطقة</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">تُراجَع بسجلك لا بتوصية · ${att.length>=10?"سجلك مؤهّل للتقديم":`تحتاج <span class="ltr">${10-att.length}</span> حصة موقّعة`}</span></div>
        <button onclick="${att.length>=10?"applyGrant()":"toast('تحتاج سجلًا أطول أولًا',1)"}" style="flex:none;background:${att.length>=10?"#4636e3":"#f2f0ea"};color:${att.length>=10?"#fff":"#b0aa9c"};border:0;border-radius:10px;padding:8px 12px;font:900 10.5px Cairo;cursor:pointer">تقدّم</button></div>`)}
  </main>`;
};
window.topUp = () => { try{localStorage.setItem("pi_wallet",String((+localStorage.getItem("pi_wallet")||0)+100))}catch(e){} toast("أُضيف 100 ر.س — رصيد تجريبي"); render(); };
window.paySub = async id => {
  await sb.from("subscriptions").update({paid:true}).eq("id",id);
  await sb.from("transparency").insert({actor:ME.name+" — لاعب",action:"سدّد اشتراكًا من محفظته"});
  toast("سُدّد — وصل إيصال لجهتك"); render();
};
window.applyGrant = async () => {
  await sb.from("transparency").insert({actor:ME.name+" — لاعب",action:"تقدّم لمنحة موهبة — اتحاد المنطقة"});
  toast("أُرسل طلبك — يُراجَع بسجلك");
};

/* ════════ 3g · مهامي والإشعارات ════════ */
T.opps = async () => {
  const [ns,mt,joins,subs,ops] = await Promise.all([
    q("n",sb.from("notifications").select("*").eq("user_id",ME.id).order("created_at",{ascending:false}).limit(30)),
    q("m",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(20)),
    q("j",sb.from("match_joins").select("*,matches(title,match_time,venue,status)").eq("player_name",ME.name)),
    q("s",sb.from("subscriptions").select("*").eq("player_name",ME.name).eq("paid",false)),
    q("o",sb.from("pi_opps").select("*").limit(20))
  ]);
  const _t0=new Date(); _t0.setHours(0,0,0,0);
  const oLive = x => !x.deadline || new Date(x.deadline) >= _t0;
  const passed = (()=>{try{return JSON.parse(localStorage.getItem("pi_opp_pass_"+ME.id)||"[]")}catch(e){return []}})();
  const opsOpen = ops.filter(oLive).filter(o=>!passed.includes(String(o.id)));
  const oSel = opsOpen[0] || null;
  const tasks = [];
  joins.filter(j=>!j.attended&&j.matches&&j.matches.status!=="final").forEach(j=>tasks.push({
    tag:"تأكيد حضور", ink:"#4636e3", t:esc(j.matches.title),
    by:`${esc(j.matches.venue||"")}${j.matches.match_time?` · <span class="ltr">${esc(j.matches.match_time)}</span>`:""}`,
    yes:"أحضر", no:"أعتذر", fn:`confAtt('${j.id}')`, no_fn:`declineAtt('${j.id}')` }));
  subs.forEach(s=>tasks.push({ tag:"التزام مالي", ink:"#a83b25", t:`اشتراك ${esc(s.month||"")} — <span class="ltr">${ar(s.amount)}</span> ر.س`,
    by:"تصدرها "+esc(s.org||"جهتك"), yes:"سدّد", no:"لاحقًا", fn:`paySub('${s.id}')`, no_fn:`toast('أُجّل — يبقى في التزاماتك')` }));
  opsOpen.slice(0,2).forEach(o=>tasks.push({ tag:"فرصة", ink:"#c78c00", t:esc(o.title||"فرصة"),
    by:(String(o.title||"").indexOf(String(o.org||"·"))<0?esc(o.org||o.by||"جهة موثقة")+" · ":"")+(o.deadline?"يُغلق "+esc(String(o.deadline).slice(0,10)):"بلا موعد إغلاق"), yes:"أرغب", no:"لا يناسبني", fn:`oppWant('${o.id}','${esc(o.title||"")}','${esc(o.org||o.by||"")}')`, no_fn:`oppPass('${o.id}')` }));
  ops.filter(x=>!oLive(x)).slice(0,1).forEach(o=>tasks.push({ tag:"فرصة أُغلقت", ink:"#8a8fa5", t:esc(o.title||"فرصة"),
    by:(String(o.title||"").indexOf(String(o.org||"·"))<0?esc(o.org||o.by||"جهة موثقة")+" · ":"")+"أُغلق باب التقديم", closed:true }));
  const open = mt.filter(m=>m.status==="open"&&!joins.some(j=>j.match_id===m.id));
  const NI = {report:["▤","#efedff","#4636e3"],consent:["🔒","#eef7f4","#2c8471"],alert:["⚠️","#fff6d6","#c78c00"]};
  const quiet = (()=>{try{return localStorage.getItem("pi_quiet")!=="0"}catch(e){return true}})();

  return `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;gap:8px">
      <span style="flex:1;text-align:center;background:#151a2e;color:#faf8f3;border-radius:999px;padding:9px;font-size:11.5px;font-weight:900">تنتظر قرارك · <span class="ltr">${tasks.filter(t=>!t.closed).length||"—"}</span></span>
      <span style="flex:1;text-align:center;background:#fff;border:1px solid #e9e4d8;color:#5b6078;border-radius:999px;padding:9px;font-size:11.5px;font-weight:900">للعلم · <span class="ltr">${ns.length||"—"}</span></span></div>

    ${tasks.length?tasks.map(t=>`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start">
      ${ic("!","#efedff","#4636e3","50% 50% 50% 8px")}
      <div style="flex:1;min-width:0">
        <span style="font-size:9.5px;font-weight:900;color:${t.ink}">${t.tag}</span>
        <b style="display:block;font-size:12.5px;font-weight:900;margin-top:2px;line-height:1.5">${t.t}</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${t.by}</span>
        ${t.closed?`<span style="display:inline-block;margin-top:9px;background:#f4f2ec;color:#8a8fa5;border-radius:8px;padding:6px 12px;font-size:10px;font-weight:900">لا إجراء — الباب مغلق</span>`
        :`<div style="display:flex;gap:6px;margin-top:10px">
          <button onclick="${t.fn}" style="background:#4636e3;color:#fff;border:0;border-radius:10px;padding:8px 14px;font:900 10.5px Cairo;cursor:pointer">${t.yes}</button>
          <button onclick="${t.no_fn}" style="background:#fff;color:#5b6078;border:1px solid #e9e4d8;border-radius:10px;padding:8px 14px;font:900 10.5px Cairo;cursor:pointer">${t.no}</button></div>`}
      </div></div>`).join("")
    :card(`${h("لا شيء ينتظر قرارك")}${sub("كل ما يحتاج ردّك يظهر هنا أولًا — والباقي «للعلم» تحته")}`)}

    ${(()=>{ const o=oSel; if(!o) return "";
      const vm=new Set(joins.filter(j=>j.attended).map(j=>j.match_id)).size;
      const dProfile = ME.pos ? esc(ME.pos)+(ME.age?' · <span class="ltr">'+ME.age+"</span> سنة":"") : "المركز والعمر لم يُسجَّلا";
      const dRecord  = vm ? '<span class="ltr">'+vm+"</span> مباراة موثّقة" : "يبدأ من أول مباراة يوقّعها منظّم";
      const steps=[
        {t:"ملفك", s:ME.pos&&ME.age?"مكتمل":"ناقص", ok:!!(ME.pos&&ME.age), d:dProfile},
        {t:"سجلك", s:vm?"موثّق":"فارغ", ok:vm>0, d:dRecord},
        {t:"اهتمامك", s:"بيدك", ok:false, d:"زر «أرغب» يُرسل اسمك للجهة — ولا شيء يُرسل قبله"},
        {t:"القرار", s:"عندها", ok:false, d:"القرار عند "+esc(o.org||o.by||"الجهة")+" — ومصدره الموثّق وحده"}
      ];
      const at=steps.findIndex(x=>!x.ok);
      return card(`${h("جسر الملاءمة")}${sub("الطريق من ملفك إلى قرار الجهة — وأين تقف الآن")}
      <div style="display:flex;align-items:flex-start;margin-top:14px">
        ${steps.map((x,i)=>{const done=x.ok, cur=i===at;
          return `${i?`<span style="flex:1;height:2.5px;margin-top:16px;background:${done?"#4636e3":"repeating-linear-gradient(90deg,#e0dbcd 0 5px,transparent 5px 10px)"}"></span>`:""}
          <div style="flex:none;width:64px;display:flex;flex-direction:column;align-items:center;gap:5px">
            <span style="width:32px;height:32px;flex:none;display:grid;place-items:center"><span style="width:${cur?32:28}px;height:${cur?32:28}px;border-radius:50% 50% 50% 7px;background:${done?"#4636e3":cur?"#fff6d6":"#f0ece2"};color:${done?"#fff":cur?"#c78c00":"#b0b5c6"};border:${cur?"2px solid #f5c518":"0"};display:grid;place-items:center;font-size:${done?"12px":"11px"};font-weight:900">${done?"✓":i+1}</span></span>
            <b style="font-size:10px;font-weight:900;color:${done?"#4636e3":cur?"#c78c00":"#b0b5c6"};text-align:center">${x.t}</b>
            <span style="font-size:8.5px;font-weight:800;color:#8a8fa5;text-align:center">${x.s}</span></div>`}).join("")}
      </div>
      <div style="margin-top:13px;border-top:1px solid #f0ece2;padding-top:11px;display:flex;flex-direction:column;gap:6px">
        ${steps.map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline">
          <b style="font-size:10.5px;font-weight:800;color:#565d78;flex:none">${x.t}</b>
          <span style="font-size:10px;font-weight:700;color:#8a8fa5;text-align:end;line-height:1.7">${x.d}</span></div>`).join("")}
      </div>
      <div style="margin-top:10px;font-size:10px;color:#8a8fa5;font-weight:700;line-height:1.85">الجسر لا يَعِد بقبول — يقول أين تقف. والخطوتان الأخيرتان ليستا بيدك ولا بيد المنصة.</div>`);
    })()}

    ${(()=>{ const o=oSel; if(!o) return "";
      const vm=new Set(joins.filter(j=>j.attended).map(j=>j.match_id)).size;
      const body=String(o.body||"");
      const posHit = ME.pos && body.indexOf(String(ME.pos))>=0;
      const sameOrg = !!(o.org && ME.org && String(o.org).trim()===String(ME.org).trim());
      const dl = o.deadline ? Math.ceil((new Date(o.deadline)-Date.now())/864e5) : null;
      const rows=[
        { lb:"مركزك في نصّ الجهة",
          w: ME.pos ? (posHit?"ذُكر":"لم يُذكر") : "مركزك لم يُسجَّل",
          c: ME.pos ? (posHit?"#2c6e49":"#c78c00") : "#b0b5c6",
          p: ME.pos ? (posHit?100:34) : 0,
          d: ME.pos ? (posHit? "مركزك «"+esc(ME.pos)+"» مذكور في نصّ الطلب" : "طلب الجهة لا يذكر «"+esc(ME.pos)+"» — وقد يكون المطلوب مركزًا غيره") : "سجّل مركزك في الإعدادات لتقرأ العدسة" },
        { lb:"جهتك",
          w: ME.org ? (sameOrg?"الجهة نفسها":"جهة أخرى") : "بلا جهة",
          c: ME.org ? (sameOrg?"#2c6e49":"#4636e3") : "#b0b5c6",
          p: ME.org ? (sameOrg?100:50) : 0,
          d: ME.org ? (sameOrg? "أنت مسجَّل في "+esc(o.org) : "أنت في "+esc(ME.org)+" والفرصة من "+esc(o.org||"جهة أخرى")) : "لم ترتبط بجهة بعد — والفرص لا تشترط ذلك" },
        { lb:"سجلك الموثّق",
          w: vm? String(vm)+" مباراة" : "يبدأ بعد",
          c: vm?"#4636e3":"#b0b5c6", p: vm?Math.min(100,vm*20):0,
          d: vm? "ما تقرؤه الجهة: "+vm+" مباراة وقّعها منظّموها — لا تقديرات" : "سجلك يبدأ من أول مباراة يوقّعها منظّم" },
        { lb:"الموعد",
          w: dl==null? "مفتوح" : dl<0? "انتهى" : dl===0? "اليوم" : dl+" يومًا",
          c: dl==null?"#4636e3": dl<0?"#a83b25": dl<=2?"#e8531f":"#2c6e49",
          p: dl==null?100: dl<0?0: Math.max(12,Math.min(100,dl*12)),
          d: dl==null? "الجهة لم تحدّد موعدًا للإغلاق" : dl<0? "أُغلق باب التقديم" : "يُغلق بعد "+dl+" يومًا من اليوم" }
      ];
      return card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${h("عدسة المطابقة")}<span style="font-size:9.5px;font-weight:900;color:#8a8fa5">على ما كتبته الجهة</span></div>
      ${sub(esc(o.title||"فرصة")+(o.org&&String(o.title||"").indexOf(String(o.org))<0?" — "+esc(o.org):""))}
      ${body?`<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:15px;padding:11px 13px;margin-top:11px;font-size:11px;font-weight:700;color:#565d78;line-height:1.85">نصّ الطلب: ${esc(body)}</div>`:""}
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
        ${rows.map(r=>`<div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <b style="font-size:11.5px;font-weight:800">${r.lb}</b>
            <span style="font-size:9.5px;font-weight:900;color:${r.c};white-space:nowrap">${r.w}</span></div>
          <div style="height:6px;background:#f0ece2;border-radius:99px;overflow:hidden;margin-top:5px"><span style="display:block;height:100%;width:${r.p}%;background:${r.c};border-radius:99px"></span></div>
          <span style="display:block;font-size:9px;color:#8a8fa5;font-weight:700;margin-top:4px;line-height:1.7">${r.d}</span>
        </div>`).join("")}
      </div>
      <div style="margin-top:11px;border-top:1px solid #f0ece2;padding-top:10px;font-size:10px;color:#8a8fa5;font-weight:700;line-height:1.85">العدسة تقرأ نصّ الجهة وسجلك الموثّق — ولا تُصدر رقمًا واحدًا يخفي أجزاءه. وما لم تكتبه الجهة لا تخترعه المنصة.</div>`);
    })()}

    ${card(`${h("للعلم فقط")}
      ${ns.length?ns.slice(0,6).map(n=>{const [g,bg,ink]=NI[n.kind]||NI.report;
        return `<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">
          <span style="width:30px;height:30px;border-radius:${D};display:grid;place-items:center;font-size:12px;flex:none;background:${bg};color:${ink}">${g}</span>
          <div style="flex:1;min-width:0"><span style="display:block;font-size:11.5px;font-weight:800;line-height:1.5">${esn(n.title||"")}</span>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esn(n.body||"")} · ${VW.rel(n.created_at)}</span></div></div>`;}).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">لا إشعارات — كل ما يدخل سجلك يصلك هنا باسم من سجّله.</div>`}`)}

    ${open.length?card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${h("مباريات مفتوحة قريبة")}<a onclick="go('explore')" style="font-size:11px;font-weight:900;cursor:pointer">الكل ←</a></div>
      ${open.slice(0,3).map(m=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        ${ic("⚽","#fff6d6","#c78c00")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(m.title)}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(m.venue||"")}${m.match_time?` · <span class="ltr">${esc(m.match_time)}</span>`:""}${m.fee?` · <span class="ltr">${ar(m.fee)}</span> ر.س`:" · مجانية"}</span></div>
        <button onclick="joinMatch('${m.id}')" style="flex:none;background:#4636e3;color:#fff;border:0;border-radius:10px;padding:8px 12px;font:900 10.5px Cairo;cursor:pointer">انضم</button></div>`).join("")}`):""}

    <div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div style="min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">ساعات الهدوء</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">لا إشعارات <span class="ltr">23:00 – 07:00</span> · إلا ما يخصّ حصة الغد</span></div>
      <button onclick="tglQuiet()" style="flex:none;width:44px;height:26px;border-radius:99px;background:${quiet?"#4636e3":"#e9e4d8"};position:relative;border:0;cursor:pointer;padding:0">
        <span style="position:absolute;top:3px;inset-inline-start:${quiet?"21px":"3px"};width:20px;height:20px;border-radius:50%;background:#fff;transition:180ms ease"></span></button></div>

    <button onclick="go('messages')" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;width:100%">
      ${ic("✉")}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">الرسائل — بإذن</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">لا يراسلك إلا من سمحت له${ME.age&&ME.age<18?" · وطلبات المراسلة تمرّ بولي أمرك":""}</span></div>
      <span style="color:#8a8fa5">←</span></button>
  </main>`;
};
window.tglQuiet = () => { try{const v=localStorage.getItem("pi_quiet")!=="0";localStorage.setItem("pi_quiet",v?"0":"1")}catch(e){} render(); };
window.declineAtt = async id => {
  await sb.from("match_joins").delete().eq("id",id);
  await sb.from("transparency").insert({actor:ME.name+" — لاعب",action:"اعتذر عن مباراة — أُخطر المنظم"});
  toast("أُرسل اعتذارك — أُخطر المنظم"); render();
};

/* ════════ 3i · وش حولك؟ ════════ */
T.explore = async () => {
  const [mt,pf,bk] = await Promise.all([
    q("m",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(30)),
    q("p",sb.from("profiles").select("id,name,role,org,pos").limit(80)),
    q("b",sb.from("bookings").select("*").limit(40))
  ]);
  const open = mt.filter(m=>m.status==="open"||m.status==="today"||m.status==="live");
  const venues = [...new Set(bk.map(b=>b.venue).filter(Boolean))];
  const orgs = [...new Set(pf.filter(p=>["academy","venue","federation"].includes(p.role)).map(p=>p.org||p.name).filter(Boolean))];
  const people = pf.filter(p=>["player","coach","referee"].includes(p.role)&&p.name&&p.name!==ME.name);
  /* المسافة قيمة ثابتة لكل كيان — لا عشوائية تتغيّر كل رسم */
  const dist = s => (1 + (String(s).split("").reduce((a,c)=>a+c.charCodeAt(0),0)%42)/10).toFixed(1);
  const F = PARAM || "all";
  const filters = [["all","الكل"],["match","مباريات"],["venue","ملاعب"],["org","أكاديميات"],["people","لاعبون"]];
  const on = k => F==="all"||F===k;
  const pins = [
    ...(on("venue")?venues.slice(0,3).map(v=>({kind:"venue",g:"⚑",bg:"#151a2e",ink:"#f5c518",t:v})):[]),
    ...(on("org")?orgs.slice(0,3).map(o=>({kind:"org",g:"◈",bg:"#4636e3",ink:"#fff",t:o})):[]),
    ...(on("match")?open.slice(0,3).map(m=>({kind:"match",g:"⚡",bg:"#e8531f",ink:"#fff",t:m.title,id:m.id})):[])
  ];
  const blobs = on("people")?people.filter(p=>p.role==="player").slice(0,4).map(p=>({t:p.name})):[];
  /* الإحداثيات ثابتة لكل اسم — الموقع الحقيقي يأتي من القاعدة حين يُسجّل */
  PL3.mapData = {pins,blobs,me:ME.name};
  const nearby = [
    ...(on("match")?open.slice(0,2).map(m=>({g:"⚽",bg:"#fff6d6",ink:"#c78c00",t:m.title,s:(m.venue||"")+(m.organizer_name?" · "+m.organizer_name:""),d:dist(m.title),go:`go('matchView','${m.id}')`})):[]),
    ...(on("venue")?venues.slice(0,2).map(v=>({g:"⚑",bg:"#efedff",ink:"#4636e3",t:v,s:"ملعب — موقع دقيق بدبوس",d:dist(v),go:`toast('صفحة الملعب قادمة')`})):[]),
    ...(on("org")?orgs.slice(0,2).map(o=>({g:"◈",bg:"#efedff",ink:"#4636e3",t:o,s:"جهة موثقة — موقع دقيق",d:dist(o),go:`toast('صفحة الجهة قادمة')`})):[]),
    ...(on("people")?people.filter(p=>p.role==="player").slice(0,3).map(p=>({g:"◉",bg:"#fdeee8",ink:"#a83b25",av:p.name,t:p.name,s:(p.pos||"لاعب")+" — نطاق تقريبي",d:dist(p.name),go:`go('publicView','${esc(p.name)}')`})):[])
  ];
  const hot = open.find(m=>m.status==="open");

  return `<div style="position:relative;height:420px;overflow:hidden;background:#e9e4d8">
    <div id="pi_map" style="position:absolute;inset:0"></div>
    <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(250,248,243,.96) 0%,rgba(250,248,243,0) 26%,rgba(250,248,243,0) 76%,rgba(250,248,243,.98) 100%);z-index:401"></div>
    <div style="position:absolute;top:18px;inset-inline:18px;display:flex;justify-content:space-between;align-items:center;z-index:402">
      <button onclick="go('feed')" style="width:40px;height:40px;border-radius:${D};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
      <div style="text-align:center"><b style="display:block;font-size:20px;font-weight:900">وش حولك؟</b>
        <span style="display:block;font-size:10px;color:#5b6078;font-weight:800">${esc(ME.org?ME.org+" · ":"")}نطاق <span class="ltr">5</span> كم</span></div>
      <button onclick="go('publicView')" style="position:relative;width:40px;height:40px;border-radius:50% 50% 50% 10px;background:none;padding:0;border:0;cursor:pointer;flex:none;box-shadow:0 4px 12px rgba(21,26,46,.2)">${PL3.av(ME.name,40,{dark:true,r:"50% 50% 50% 10px"})}</button>
    </div>
    <div style="position:absolute;top:70px;inset-inline:18px;display:flex;gap:6px;overflow-x:auto;z-index:402">
      ${filters.map(([k,t])=>`<button onclick="go('explore','${k}')" style="flex:none;border-radius:999px;padding:6px 11px;font:900 10px Cairo;background:${F===k?"#151a2e":"#fff"};color:${F===k?"#faf8f3":"#5b6078"};border:1px solid ${F===k?"#151a2e":"#e9e4d8"};cursor:pointer;box-shadow:0 4px 10px rgba(21,26,46,.08)">${t}</button>`).join("")}
    </div>
    <button onclick="locateMe()" style="position:absolute;bottom:14px;inset-inline-start:18px;z-index:402;background:#151a2e;color:#faf8f3;border:0;border-radius:999px;padding:10px 14px;font:900 11px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(21,26,46,.25)">◎ استخدم موقعي</button>
    <span style="position:absolute;bottom:14px;inset-inline-end:18px;z-index:402;background:#fff;border:1px solid #e9e4d8;border-radius:999px;padding:8px 11px;font-size:9.5px;font-weight:900;color:#5b6078">الأفراد لا تُكشف عناوينهم</span>
  </div>
  <main style="flex:1;padding:6px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;gap:10px;font-size:10px;font-weight:800;color:#5b6078">
      <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50% 50% 50% 2px;background:#151a2e;display:inline-block"></span>جهة — دبوس دقيق</span>
      <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;border:1.5px dashed #e8531f;display:inline-block"></span>فرد — نطاق تقريبي</span></div>
    <b style="font-size:13px;font-weight:900">الأقرب إليك</b>
    ${nearby.length?nearby.map(n=>`<button onclick="${n.go}" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:12px 14px;display:flex;gap:12px;align-items:center;cursor:pointer;font-family:Cairo;text-align:start;width:100%">
      ${n.av?PL3.av(n.av,44,{dark:true,r:"50% 50% 50% 8px"}):`<span style="width:44px;height:44px;border-radius:50% 50% 50% 8px;display:grid;place-items:center;font-size:17px;font-weight:900;flex:none;background:${n.bg};color:${n.ink}">${n.g}</span>`}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">${esc(n.t)}</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(n.s)}</span></div>
      <div style="text-align:center;flex:none"><b class="ltr" style="display:block;font-size:12px;color:#4636e3">${n.d}</b>
        <span style="display:block;font-size:8.5px;color:#8a8fa5;font-weight:800">كم</span></div></button>`).join("")
    :card(`${h("لا شيء في هذا المرشّح قريبًا")}${sub(F==="all"?"المنظمون ينشئون المباريات من زر +، والجهات تظهر هنا فور توثيقها":"جرّب «الكل» لترى كل ما حولك")}`)}

    ${(hot&&on("match"))?`<button onclick="joinMatch('${hot.id}')" style="background:#151a2e;border:0;border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;color:#faf8f3;position:relative;overflow:hidden;cursor:pointer;font-family:Cairo;text-align:start;width:100%">
      <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
      <span style="position:relative;width:40px;height:40px;border-radius:50% 50% 50% 8px;background:#e8531f;color:#fff;display:grid;place-items:center;font-size:15px;flex:none">⚡</span>
      <div style="position:relative;flex:1;min-width:0"><b style="display:block;font-size:13px;font-weight:900">${esc(hot.title)} — <span class="ltr">${dist(hot.title)}</span> كم</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:2px">${esc(hot.venue||"")}${hot.match_time?` · <span class="ltr">${esc(hot.match_time)}</span>`:""} · نظّمها ${esc(hot.organizer_name||"—")}</span></div>
      <span style="position:relative;color:#f5c518">←</span></button>`:""}

    <button onclick="go('pitch')" style="background:#fff;border:1px dashed #d6d0c2;border-radius:20px;padding:14px 16px;display:flex;gap:12px;align-items:center;cursor:pointer;font-family:Cairo;text-align:start;width:100%">
      ${ic("◎","#efedff","#4636e3","50% 50% 50% 8px")}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;font-weight:900">الملعب — مجتمعك ومن تتابع</b>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">التقدير هناك — والتقييم في السجل</span></div>
      <span style="color:#8a8fa5">←</span></button>
    <button onclick="go('news')" style="background:#fff;border:1px dashed #d6d0c2;border-radius:20px;padding:14px 16px;display:flex;gap:12px;align-items:center;cursor:pointer;font-family:Cairo;text-align:start;width:100%">
      ${ic("▤","#efedff","#4636e3","50% 50% 50% 8px")}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;font-weight:900">الأخبار — جهتك ودورياتك</b>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">كل خبر باسم جهته — لا خبر بلا مصدر</span></div>
      <span style="color:#8a8fa5">←</span></button>
  </main>`;
};
window.joinMatch = async id => {
  const {data:ex} = await sb.from("match_joins").select("id").eq("match_id",id).eq("player_name",ME.name);
  if(ex&&ex.length) return toast("أنت مسجَّل فيها بالفعل");
  await sb.from("match_joins").insert({match_id:id,player_id:ME.id,player_name:ME.name,attended:false});
  await sb.from("transparency").insert({actor:ME.name+" — لاعب",action:"انضم لمباراة مفتوحة"});
  toast("انضممت — أكّد حضورك من مهامك"); render();
};

/* ════════ 3j · الملعب ════════ */
T.pitch = async () => {
  const [pf,evs,tr,ns] = await Promise.all([
    q("p",sb.from("profiles").select("id,name,role,org,pos,age").limit(80)),
    q("e",sb.from("match_events").select("*,matches(title,comp)").order("created_at",{ascending:false}).limit(30)),
    q("t",sb.from("transparency").select("*").order("created_at",{ascending:false}).limit(30)),
    q("n",sb.from("notifications").select("*").eq("user_id",ME.id).limit(10))
  ]);
  const mates = pf.filter(p=>p.name&&p.name!==ME.name&&(p.role==="player"&&p.org===ME.org)).slice(0,6);
  const follows = (()=>{try{return JSON.parse(localStorage.getItem("pi_follow")||"[]")}catch(e){return []}})();
  const followers = pf.filter(p=>p.role==="player"&&p.org===ME.org&&p.name!==ME.name).length;
  const claps = (()=>{try{return JSON.parse(localStorage.getItem("pi_claps")||"{}")}catch(e){return {}}})();
  /* المنشورات = أحداث موثقة لغيرك، موسومة بحدثها */
  const posts = evs.filter(e=>e.who&&e.who!==ME.name&&(e.type==="goal"||e.type==="assist")).slice(0,4).map(e=>({
    id:e.id, who:e.who, sub:(e.matches&&e.matches.comp)||"مباراة", tag:e.type==="goal"?"هدف موثّق":"صناعة موثقة",
    tagBg:e.type==="goal"?"#fff6d6":"#efedff", tagInk:e.type==="goal"?"#c78c00":"#4636e3",
    text:`${e.type==="goal"?"هدف":"صناعة"} في الدقيقة ${e.minute} — ${(e.matches&&e.matches.title)||""}. سجّله ${e.recorded_by}.`,
    when:VW.rel(e.created_at), claps:claps[e.id]||0 }));
  const myGoal = evs.find(e=>e.who===ME.name&&e.type==="goal");
  const req = mates.find(m=>!follows.includes(m.name));

  return `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 16px;display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center">
      <div><b class="ltr" style="display:block;font-size:20px;font-weight:700">${followers||dash}</b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800">في مجتمعك</span></div>
      <div style="border-inline:1px solid #f0ece2"><b class="ltr" style="display:block;font-size:20px;font-weight:700">${follows.length||dash}</b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800">تتابعهم</span></div>
      <div><b class="ltr" style="display:block;font-size:20px;font-weight:700;color:${req?"#e8531f":"#151a2e"}">${req?1:dash}</b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800">طلبات متابعة</span></div></div>

    ${mates.length?`<div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:2px">
      ${mates.map(m=>`<button onclick="tglFollow('${esc(m.name)}')" style="flex:none;width:62px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:5px;background:none;border:0;cursor:pointer;font-family:Cairo">
        <span style="width:56px;height:56px;border-radius:50% 50% 50% 12px;padding:2px;background:${follows.includes(m.name)?"linear-gradient(160deg,#f5c518,#c78c00)":"#e9e4d8"};display:block">
          ${PL3.av(m.name,52,{dark:true,r:"50% 50% 50% 11px",ring:"2px solid #faf8f3"})}</span>
        <span style="font-size:9px;font-weight:900;line-height:1.3;max-width:62px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.name)}</span></button>`).join("")}
    </div>`:""}

    ${req&&ME.age&&ME.age<18?`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;display:flex;gap:10px;align-items:center">
      ${PL3.av(req.name,32,{dark:true})}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;font-weight:900;color:#8a6912">طلب متابعة — ${esc(req.name)}${req.pos?" · "+esc(req.pos):""}</b>
        <span style="display:block;font-size:10px;color:#a3862f;font-weight:700;margin-top:2px">متابعتك تمرّ بولي أمرك لأنك دون <span class="ltr">18</span></span></div>
      <button onclick="toast('أُحيل الطلب لولي أمرك')" style="flex:none;background:#151a2e;color:#faf8f3;border:0;border-radius:10px;padding:8px 12px;font:900 10.5px Cairo;cursor:pointer">أحِل</button></div>`:""}

    ${posts.length?posts.map(p=>`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:22px;overflow:hidden">
      <div style="display:flex;gap:11px;align-items:center;padding:12px 14px">
        ${PL3.av(p.who,36,{dark:true,r:"50% 50% 50% 8px"})}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;font-weight:900">${esc(p.who)}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700">${esc(p.sub)}</span></div>
        <span style="font-size:9.5px;font-weight:900;border-radius:999px;padding:3px 9px;flex:none;background:${p.tagBg};color:${p.tagInk}">${p.tag}</span></div>
      <p style="margin:0;padding:0 14px 6px;font-size:11.5px;font-weight:700;line-height:1.85;text-wrap:pretty">${esn(p.text)}</p>
      <div style="display:flex;gap:6px;padding:6px 14px 12px;align-items:center">
        <button onclick="clap('${p.id}')" style="display:inline-flex;align-items:center;gap:5px;background:#efedff;color:#4636e3;border:0;border-radius:999px;padding:5px 10px;font:900 10px Cairo;cursor:pointer">👏 <span class="ltr">${p.claps||0}</span> تقدير</button>
        <span style="flex:1"></span><span style="font-size:9px;color:#8a8fa5;font-weight:800">${p.when}</span></div>
    </div>`).join("")
    :card(`${h("الملعب هادئ الآن")}${sub("يمتلئ بأحداث موثقة لمن حولك — لا بمنشورات حرة")}`)}

    <div onclick="${myGoal?`postClip('${myGoal.id}',${myGoal.minute})`:"go('records')"}" style="cursor:pointer;background:#fff;border:1px dashed #d6d0c2;border-radius:20px;padding:14px 16px;display:flex;gap:12px;align-items:center">
      ${ic("▶","#efedff","#4636e3","50% 50% 50% 8px")}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;font-weight:900">${myGoal?`انشر لقطة من هدفك — الدقيقة <span class="ltr">${myGoal.minute}</span>`:"لا حدث موثق لك بعد"}</b>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${myGoal?"توسَم بحدث موثّق · التعليقات على اللقطة لا على النتيجة":"اللقطة توسَم بحدث موثق — ولا لقطة بلا حدث"}</span></div>
      <span style="color:#8a8fa5">←</span></div>

    <div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">التقدير هنا لا يدخل تقييمك — الجمهور بعتبة ظهور، والتقييم من أحداث موقّعة وحدها.</div>
  </main>`;
};
window.tglFollow = n => { try{const l=JSON.parse(localStorage.getItem("pi_follow")||"[]");
  localStorage.setItem("pi_follow",JSON.stringify(l.includes(n)?l.filter(x=>x!==n):[...l,n]));}catch(e){} render(); };
window.clap = id => { try{const c=JSON.parse(localStorage.getItem("pi_claps")||"{}");c[id]=(c[id]||0)+1;localStorage.setItem("pi_claps",JSON.stringify(c));}catch(e){} render(); };

/* ════════ 3k · الأخبار ════════ */
T.news = async () => {
  const [mt,tr,evs,pf] = await Promise.all([
    q("m",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(40)),
    q("t",sb.from("transparency").select("*").order("created_at",{ascending:false}).limit(30)),
    q("e",sb.from("match_events").select("*,matches(title,comp)").order("created_at",{ascending:false}).limit(60)),
    q("p",sb.from("profiles").select("name,role,org").limit(60))
  ]);
  const tab = PARAM || "org";
  const tabs = [["org","جهتي"],["comp","دورياتي"],["world","العالم"]];
  /* دورياتي = البطولات التي لك فيها حدث موثق */
  const myComps = [...new Set(evs.filter(e=>e.who===ME.name&&e.matches&&e.matches.comp).map(e=>e.matches.comp))];
  const orgOf = t => String(t.actor||"").split("—")[0].trim();
  const inOrg = t => !!(ME.org&&(String(t.actor||"").includes(ME.org)||String(t.action||"").includes(ME.org)))
    || pf.some(p=>p.org===ME.org&&p.name&&String(t.actor||"").includes(p.name));
  const mComp = m => myComps.indexOf(m.comp)>=0;
  const mOrg = m => !!(ME.org&&(String(m.title||"").includes(ME.org)||m.organizer_name&&pf.some(p=>p.org===ME.org&&p.name===m.organizer_name)))
    || (evs.some(e=>e.match_id===m.id&&pf.some(p=>p.org===ME.org&&p.name===e.who)));
  const trTab = tab==="org"?tr.filter(inOrg):tab==="comp"?tr.filter(t=>myComps.some(c=>String(t.action||"").includes(c))):tr.filter(t=>!inOrg(t));
  const mtTab = tab==="org"?mt.filter(mOrg):tab==="comp"?mt.filter(mComp):mt.filter(m=>!mOrg(m)&&!mComp(m));
  /* الترتيب من نتائج نهائية وقّعها حكامها — ومباريات العالم لا تدخل الجدول */
  const table = {};
  (tab==="world"?[]:mtTab.filter(m=>m.status==="final")).forEach(m=>{
    const [a,b] = String(m.title||"").split("×").map(s=>s.replace(/—.*$/,"").trim());
    if(!a||!b) return;
    [[a,+m.score_a,+m.score_b],[b,+m.score_b,+m.score_a]].forEach(([t,f,g])=>{
      table[t]=table[t]||{t,p:0,w:0,d:0,l:0,gf:0,ga:0};
      const r=table[t]; r.p++; r.gf+=f; r.ga+=g; if(f>g)r.w++; else if(f===g)r.d++; else r.l++; });
  });
  const rows = Object.values(table).map(r=>({...r,pts:r.w*3+r.d})).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
  const lead = trTab.find(t=>/إعلان نتيجة|بطولة|معسكر|تسجيل/.test(t.action||"")) || trTab[0];
  const feed = trTab.slice(0,6).map(t=>({src:String(t.actor||"").split("—").pop().trim()||"جهة",
    who:String(t.actor||"").split("—")[0].trim(), t:t.action, when:VW.rel(t.created_at)}));
  const finals = mtTab.filter(m=>m.status==="final").slice(0,4);
  const live = mtTab.filter(m=>m.status==="live");
  const TL = {org:["أخبار جهتك","ما يخص "+(ME.org||"جهتك")+" ومن فيها"],
    comp:["دورياتك",myComps.length?myComps.join(" · "):"لا بطولة لك فيها حدث موثق بعد"],
    world:["خارج نطاقك","للاطلاع — لا تدخل سجلك ولا ترتيبك"]}[tab];

  return `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;gap:6px">${tabs.map(([k,t])=>`<button onclick="go('news','${k}')" style="flex:1;text-align:center;background:${tab===k?"#151a2e":"#fff"};color:${tab===k?"#faf8f3":"#5b6078"};border:1px solid ${tab===k?"#151a2e":"#e9e4d8"};border-radius:999px;padding:8px;font:900 10.5px Cairo;cursor:pointer">${t}</button>`).join("")}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:13px;font-weight:900">${TL[0]}</b><span style="font-size:10px;color:#8a8fa5;font-weight:800">${esc(TL[1])}</span></div>

    ${lead?`<div style="position:relative;border-radius:22px;overflow:hidden;background:#151a2e;min-height:180px;display:flex;align-items:flex-end">
      <div style="position:absolute;inset-inline-start:58%;top:-60%;width:74%;height:210%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
      <div style="position:relative;padding:16px;color:#faf8f3">
        <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:3px 9px;font-size:9.5px;font-weight:900">
          ${PL3.av(String(lead.actor||"").split("—")[0].trim(),16,{dark:true,r:"50%"})}${esc(String(lead.actor||"").split("—").pop().trim())} · موثّقة</span>
        <b style="display:block;font-size:16px;font-weight:900;line-height:1.4;margin-top:8px">${esn(lead.action)}</b>
        <span style="display:block;font-size:10px;color:#c6cade;font-weight:700;margin-top:4px">نشرها ${esc(String(lead.actor||"").split("—")[0].trim())} · ${VW.rel(lead.created_at)}</span></div>
    </div>`:""}

    ${feed.length?feed.map(n=>`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start">
      ${PL3.av(n.who,36,{dark:true,role:/مدرب/.test(n.src)?"coach":"",r:/مدرب/.test(n.src)?"50% 50% 8px 50%":"50% 50% 50% 8px"})}
      <div style="flex:1;min-width:0"><span style="font-size:9.5px;font-weight:900;color:#4636e3">${esc(n.src)}</span>
        <b style="display:block;font-size:12px;font-weight:900;margin-top:2px;line-height:1.5">${esn(n.t)}</b>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:3px">${esc(n.who)} · ${n.when}</span></div></div>`).join("")
    :card(`${h("لا خبر في هذا النطاق بعد")}${sub(tab==="comp"?"دورياتك تظهر هنا فور دخول حدث موثق لك فيها":"كل خبر يدخل هنا باسم جهته ووقته")}`)}

    ${tab==="world"?`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">مباريات خارج نطاقك — لا تدخل سجلك ولا تبني جدول ترتيبك.</div>`
    :card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${h("الترتيب")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">من نتائج وقّعها الحكام</span></div>
      ${rows.length?`<div style="margin-top:6px">${rows.map((r,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #f0ece2">
        <b class="ltr" style="width:18px;text-align:center;font-size:11px;color:#8a8fa5">${i+1}</b>
        <span style="width:26px;height:26px;border-radius:${D};display:grid;place-items:center;font-size:11px;font-weight:900;background:${i===0?"#151a2e":"#efedff"};color:${i===0?"#f5c518":"#4636e3"}">${esc(r.t[0])}</span>
        <span style="flex:1;font-size:11.5px;font-weight:900">${esc(r.t)}</span>
        <span class="ltr" style="font-size:10px;color:#8a8fa5;font-weight:800">${r.w}-${r.d}-${r.l}</span>
        <b class="ltr" style="width:24px;text-align:end;font-size:12px">${r.pts}</b></div>`).join("")}</div>`
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px;margin-top:6px;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">لا ترتيب قبل نتيجة نهائية موقّعة — الجدول يبني نفسه من المباريات المنتهية.</div>`}`)}

    ${card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${h("نتائج وقّعها حكامها")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">تدخل سجل لاعبيها</span></div>
      ${[...live,...finals].length?[...live,...finals].map(m=>{const [a,b]=String(m.title||"").split("×").map(s=>s.replace(/—.*$/,"").trim());
        return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #f0ece2">
          <span style="flex:1;font-size:11.5px;font-weight:900;text-align:end">${esc(a||"")}</span>
          <span class="ltr" style="flex:none;background:${m.status==="live"?"#e8531f":"#151a2e"};color:${m.status==="live"?"#fff":"#f5c518"};border-radius:10px;padding:4px 10px;font-size:11px;font-weight:700;min-width:54px;text-align:center">${m.score_a}-${m.score_b}</span>
          <span style="flex:1;font-size:11.5px;font-weight:900">${esc(b||"")}</span></div>`;}).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px;font-size:10.5px;color:#8a8fa5;font-weight:700">لا نتائج في هذا النطاق.</div>`}`)}
  </main>`;
};

/* ── الخريطة الواقعية: طبقة OSM أساسًا + طبقة من القاعدة فوقها (قرار المالك) ──
   الجهات بدبوس دقيق · الأفراد بدائرة نطاق تقريبي لا يُكشف مركزها. */
PL3.CITY = [24.7136, 46.6753];
PL3.geo = (name, spread) => { /* إحداثية ثابتة لكل اسم — لا تقفز بين الرسمات */
  let h=0; for(const c of String(name)) h=(h*131+c.charCodeAt(0))>>>0;
  const a=(h%360)*Math.PI/180, r=((h>>9)%100)/100*(spread||0.035)+0.006;
  return [PL3.CITY[0]+r*Math.cos(a), PL3.CITY[1]+r*Math.sin(a)*1.6];
};
/* مكتبة الخريطة تُحمَّل عند فتح شاشتها فقط — لا تحجب إقلاع التطبيق أبدًا */
PL3.loadLeaflet = () => {
  if(window.L) return Promise.resolve(true);
  if(PL3._lp) return PL3._lp;
  const B = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/";
  PL3._lp = new Promise(res=>{
    const css=document.createElement("link"); css.rel="stylesheet"; css.href=B+"leaflet.css"; document.head.appendChild(css);
    const js=document.createElement("script"); js.src=B+"leaflet.js";
    js.onload=()=>res(true); js.onerror=()=>res(false);
    setTimeout(()=>res(!!window.L),9000);
    document.head.appendChild(js);
  });
  return PL3._lp;
};
PL3.drawMap = async () => {
  const el = document.getElementById("pi_map");
  if(!el || !PL3.mapData) return;
  const ok = await PL3.loadLeaflet();
  if(!ok || !window.L || !document.getElementById("pi_map")) {
    if(el) el.innerHTML = `<div style="height:100%;display:grid;place-items:center;background:#e6e1d5;text-align:center;padding:20px">
      <span style="font-size:11px;font-weight:800;color:#5b6078;line-height:1.9">تعذّر تحميل الخريطة الآن — القائمة أسفلها تعمل</span></div>`;
    return;
  }
  if(PL3._map){ try{PL3._map.remove()}catch(e){} PL3._map=null; }
  const map = L.map(el,{zoomControl:false,attributionControl:false,scrollWheelZoom:false,touchZoom:true,dragging:true,tap:true,bounceAtZoomLimits:false}).setView(PL3.CITY,12);
  PL3._map = map;
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);
  L.control.attribution({prefix:false,position:"bottomright"}).addAttribution("© OpenStreetMap").addTo(map);
  const {pins,blobs,me} = PL3.mapData, bounds=[];
  const mine = PL3.geo(me||"me",0.02);
  bounds.push(mine);
  L.circle(mine,{radius:1400,color:"#4636e3",weight:2,fillColor:"#4636e3",fillOpacity:.12}).addTo(map);
  L.marker(mine,{icon:L.divIcon({className:"",iconSize:[34,34],iconAnchor:[17,17],
    html:PL3.av(me,34,{dark:true,r:"50%",ring:"3px solid #4636e3",style:"box-shadow:0 4px 12px rgba(21,26,46,.3)"})})}).addTo(map);
  pins.forEach(p=>{ const ll=PL3.geo(p.t); bounds.push(ll);
    const nm = String(p.t).length>18 ? String(p.t).slice(0,17)+"…" : String(p.t);
    L.marker(ll,{icon:L.divIcon({className:"",iconSize:[150,58],iconAnchor:[75,36],
      html:`<span style="display:flex;flex-direction:column;align-items:center;width:150px;pointer-events:none">
        <span style="width:32px;height:32px;border-radius:50% 50% 50% 4px;transform:rotate(45deg);display:grid;place-items:center;background:${p.bg};color:${p.ink};box-shadow:0 6px 14px rgba(21,26,46,.3);border:2px solid #fff;pointer-events:auto"><span style="transform:rotate(-45deg);font-size:13px;font-weight:900">${p.g}</span></span>
        <span style="margin-top:4px;background:#fff;border:1px solid #e9e4d8;border-radius:999px;padding:2px 8px;font:900 9px Cairo;color:#151a2e;white-space:nowrap;box-shadow:0 3px 8px rgba(21,26,46,.14);pointer-events:auto">${esc(nm)}</span></span>`})})
      .addTo(map)
      .on("click",()=>{ if(p.kind==="match"&&p.id) go("matchView",p.id); }); });
  blobs.forEach(b=>{ const ll=PL3.geo(b.t,0.03); bounds.push(ll);
    L.circle(ll,{radius:900,color:"#e8531f",weight:1.5,dashArray:"5 5",fillColor:"#e8531f",fillOpacity:.13}).addTo(map);
    L.marker(ll,{interactive:false,icon:L.divIcon({className:"",iconSize:[130,18],iconAnchor:[65,9],
      html:`<span style="display:block;text-align:center;font:900 9px Cairo;color:#a83b25;background:rgba(255,255,255,.9);border:1px solid rgba(232,83,31,.35);border-radius:999px;padding:1px 7px;white-space:nowrap">فرد — نطاق تقريبي</span>`})}).addTo(map); });
  if(bounds.length>1) map.fitBounds(bounds,{padding:[70,60],maxZoom:13});
  setTimeout(()=>map.invalidateSize(),120);
};
window.locateMe = () => {
  if(!navigator.geolocation||!PL3._map) return toast("الموقع غير متاح على هذا الجهاز",1);
  toast("جارٍ تحديد موقعك…");
  try{ navigator.geolocation.getCurrentPosition(
    p=>{ try{ PL3.CITY=[p.coords.latitude,p.coords.longitude]; if(PL3._map) PL3._map.setView(PL3.CITY,13); render(); }catch(e){ toast("تعذّر تحريك الخريطة",1); } },
    ()=>toast("لم يُسمح بالموقع — الخريطة على الرياض",1), {timeout:8000}); }catch(e){ toast("الموقع غير متاح على هذا الجهاز",1); }
};

/* ── التوصيل: اختصارات الرئيسية وقائمة الملف تشير للشاشات الجديدة ── */
Object.assign(TITLES,{coachBrief:"الحصة القادمة",cabinet:"خزانتي",wallet:"جدولي ومحفظتي",pitch:"الملعب",news:"الأخبار"});
T.calendar = T.wallet;
T.myCard = T.publicView;
window.oppWant = async (id,title,org) => {
  await sb.from("pi_views").insert({subject:org||"جهة", viewer:ME.name, viewer_role:ME.role, scope:"opp", permit:title||null}).then(()=>{}).catch(()=>{});
  await trans(`أبدى اهتمامًا بفرصة: ${title||id}${org?" — "+org:""}`);
  toast("أُرسل اهتمامك باسمك — القرار عند "+(org||"الجهة")); render();
};
window.oppPass = id => { try{ const k="pi_opp_pass_"+ME.id; const l=JSON.parse(localStorage.getItem(k)||"[]"); if(!l.includes(String(id))) l.push(String(id)); localStorage.setItem(k,JSON.stringify(l)); }catch(e){} toast("أُخفيت — لا تظهر لك مجددًا"); render(); };
})();
