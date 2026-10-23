/* PlayIn365 — عمود الحكم مطابقًا للتصميم المعتمد «Referee App» (7a–7g)
   يُحمَّل بعد app-org3.js. توقيع الحكم هو ما يجعل النتيجة موثّقة — وبه تكتمل الحلقة. */
const RF = {};
RF.DROP="50% 50% 50% 8px"; RF.dash="—";
RF.esn = s => esc(String(s==null?"":s));
RF.av  = (n,sz,o) => PL3.av(n, sz||34, Object.assign({dark:true, r:"50% 50% 50% "+Math.max(4,Math.round((sz||34)*.22))+"px"}, o||{}));
RF.ic  = (g,bg,ink,r) => `<span style="width:32px;height:32px;border-radius:${r||RF.DROP};background:${bg||"#efedff"};color:${ink||"#4636e3"};display:grid;place-items:center;font-size:13px;font-weight:900;flex:none">${g}</span>`;
RF.card= i => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:16px">${i}</div>`;
RF.h   = t => `<b style="font-size:13px;font-weight:900">${t}</b>`;
RF.sub = t => `<span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">${t}</span>`;
RF.note= t => `<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">${t}</div>`;
RF.empty=t => `<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">${t}</div>`;
RF.disc= c => `<div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:${c||"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:${c==="#f5c518"?".14":c?".9":".5"}"></div>`;
RF.top = (title,sub,back) => `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('${back||"refHome"}')" style="width:40px;height:40px;border-radius:${RF.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">${back?"←":"⌂"}</button>
    <span style="font-size:10.5px;font-weight:900;color:#8a8fa5">حكم</span></div>
  <div style="text-align:center;padding:6px 18px 0"><b style="display:block;font-size:26px;font-weight:900;line-height:1.3">${title}</b><span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">${sub}</span></div>`;
RF.EV = [["goal","⚽","هدف","#f5c518"],["assist","◎","صناعة","#4636e3"],["yellow","▮","إنذار","#c78c00"],["red","▮","طرد","#a83b25"],["sub","⇄","تبديل","#4636e3"]];
RF.CAUSE = ["لعب خشن","إعاقة هجمة","اعتراض","تأخير اللعب","سلوك غير رياضي","دخول بلا إذن"];

RF.load = async () => {
  const me = ME.name;
  const [ms,refs,joins,ev,pf] = await Promise.all([
    q("m", sb.from("matches").select("*").order("created_at",{ascending:false}).limit(80)),
    q("r", sb.from("pi_refs").select("*").order("created_at",{ascending:false}).limit(80)),
    q("j", sb.from("match_joins").select("*").limit(600)),
    q("e", sb.from("match_events").select("*").order("created_at",{ascending:false}).limit(400)),
    q("p", sb.from("profiles").select("id,name,role,org,pos,age,avatar_url").limit(400))
  ]);
  const mine = ms.filter(m=>m.referee_name===me);
  const myAssign = refs.filter(r=>r.referee===me);
  return {ms, mine, myAssign, joins, ev, pf,
    open: ms.filter(m=>!m.referee_name && m.status!=="final")};
};
RF.joinsOf = (D,id) => D.joins.filter(j=>j.match_id===id);
RF.evOf = (D,id) => D.ev.filter(e=>e.match_id===id);
RF.cur = D => D.mine.find(m=>m.status==="live") || D.mine.find(m=>m.status==="today") || D.mine.find(m=>m.status==="open") || D.mine[0];

/* ═══ 7a · تعييناتي ═══ */
T.refHome = async () => {
  const D = await RF.load();
  const live = D.mine.find(m=>m.status==="live");
  const next = RF.cur(D);
  const done = D.mine.filter(m=>m.status==="final");
  const noRep = done.filter(m=>!RF.evOf(D,m.id).length);
  const signed = done.length;
  const cards = D.mine.filter(m=>m.status!=="final");
  const evMine = D.ev.filter(e=>String(e.recorded_by||"").indexOf(ME.name)>=0);
  const acts = [
    ...(live?[["●","مباراة جارية — أدرها بلمستين",RF.esn(live.title),"refMatch","#fdeee8","#e8531f",1]]:[]),
    ...(next&&!live?[["◔","تعيين قادم — تحقّق من الكشف",RF.esn(next.title),"refCheck","#fff6d6","#c78c00",0]]:[]),
    ...(noRep.length?[["▤",`${noRep.length} مباراة بلا تقرير`,"التقرير يجعل النتيجة موثّقة","refReport","#fdeee8","#a83b25",1]]:[])
  ];
  const SC = [
    ["✓","قبل الصافرة","الكشف والتحقق","refCheck","#efedff","#4636e3"],
    ["●","إدارة المباراة","اللمستان والوقت","refMatch","#fdeee8","#e8531f"],
    ["▮","الانضباط","بطاقة بسببها","refCards","#fff6d6","#c78c00"],
    ["▤","التقرير","بعد الصافرة","refReport","#efedff","#4636e3"],
    ["★","سجلي","واعتمادي","refLog","#fff6d6","#c78c00"],
    ["◉","ملفي","وخصوصيتي","refMe","#efedff","#4636e3"]
  ];
  return `<div style="position:relative;background:#151a2e;padding:18px 18px 24px;border-radius:0 0 36px 36px;overflow:hidden">${RF.disc(live?"#e8531f":null)}
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
      <button onclick="go('refLog')" style="width:40px;height:40px;border-radius:${RF.DROP};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">★</button>
      ${WM(1)}
      <button onclick="go('settings')" style="width:40px;height:40px;border-radius:${RF.DROP};background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">⚙</button>
    </div>
    <div style="position:relative;display:flex;align-items:center;gap:16px;margin-top:18px">
      <button onclick="go('refMe')" style="flex:none;background:none;border:0;padding:0;cursor:pointer">${RF.av(ME.name,80,{r:"50% 50% 50% 12px",ring:"4px solid #4636e3"})}</button>
      <div style="flex:1;min-width:0">
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:800">أهلًا بك</span>
        <b style="display:block;font-size:24px;font-weight:900;color:#faf8f3;line-height:1.2">${esc((ME.name||"").split(" ")[0])} 👋</b>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">حكم${ME.org?" · "+esc(ME.org):""}</span>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <span style="background:rgba(245,197,24,.15);color:#f5c518;border-radius:999px;padding:3px 11px;font-size:10.5px;font-weight:800"><span class="ltr">${signed||RF.dash}</span> مباراة وقّعتها</span>
          <span style="background:rgba(255,255,255,.1);color:#faf8f3;border-radius:999px;padding:3px 11px;font-size:10.5px;font-weight:800"><span class="ltr">${evMine.length||RF.dash}</span> حدثًا</span>
        </div></div></div>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;border-radius:22px;overflow:hidden;background:#151a2e;min-height:224px;display:flex">${RF.disc(live?"#e8531f":null)}
      <div style="position:relative;padding:18px;display:flex;flex-direction:column;gap:8px;width:66%">
        ${live?`<span style="display:inline-flex;align-items:center;gap:6px;background:#e8531f;color:#fff;border-radius:999px;padding:4px 11px;font-size:10.5px;font-weight:900;width:fit-content"><span style="width:6px;height:6px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite"></span>مباشر الآن</span>`
          :`<span style="color:#b9b0f5;font-size:10.5px;font-weight:900">◉ ${next?"تعيينك القادم":"تعييناتك"}</span>`}
        <b style="display:block;font-size:19px;font-weight:900;color:#faf8f3;line-height:1.3">${esc(next?next.title:"لا تعيين عليك")}</b>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;line-height:1.9">${next
          ?`◔ <span class="ltr">${esc(next.match_time||RF.dash)}</span> · ${esc(next.match_date||"")}<br>◎ ${esc(next.venue||RF.dash)}<br><span style="color:#8f9bff">عيّنك ${esc(next.organizer_name||"المنظّم")}</span>`
          :"المنظّمون يعيّنونك من «وش حولك» — ويصلك التعيين هنا فتقبله أو تعتذر"}</span>
        <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
          ${live?`<button onclick="go('refMatch')" style="background:#e8531f;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(232,83,31,.3)">أدر المباراة</button>`
            :next?`<button onclick="go('refCheck')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">قبل الصافرة</button>`
            :`<button onclick="go('explore')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer">استكشف القريب</button>`}
        </div></div>
      <div style="position:absolute;inset-inline-end:16px;bottom:16px;width:88px;height:88px;border-radius:50%;display:grid;place-items:center;background:#151a2e;box-shadow:0 0 0 6px ${live?"#e8531f":"#4636e3"}">
        <div style="text-align:center"><b class="ltr" style="display:block;font-size:24px;font-weight:700;color:#faf8f3">${cards.length||RF.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">تعيينًا قائمًا</span></div></div>
    </div>

    ${acts.length?acts.map(([g,t,s,v,bg,ink,u])=>`<button onclick="go('${v}')" style="background:#fff;border:1px solid ${u?"#f3cdbe":"#e9e4d8"};border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;width:100%;color:#151a2e">
      <span style="width:40px;height:40px;border-radius:${RF.DROP};background:${bg};color:${ink};display:grid;place-items:center;font-size:16px;flex:none">${g}</span>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900">${esc(t)}</b><span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(s)}</span></div>
      <span style="color:${u?"#e8531f":"#8a8fa5"}">←</span></button>`).join("")
    :RF.card(`<div style="display:flex;gap:12px;align-items:center">${RF.ic("✓","#eaf5ee","#2c6e49")}<div style="flex:1"><b style="display:block;font-size:12.5px">لا شيء ينتظر توقيعك</b>${RF.sub("كل مبارياتك لها تقرير")}</div></div>`)}

    ${RF.h("مداخلك")}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${SC.map(([g,t,s,v,bg,ink])=>`<button onclick="go('${v}')" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;color:#151a2e;cursor:pointer;font-family:Cairo">
        <span style="width:40px;height:40px;border-radius:${RF.DROP};display:grid;place-items:center;font-size:17px;background:${bg};color:${ink}">${g}</span>
        <b style="font-size:12px;font-weight:900">${t}</b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800">${s}</span></button>`).join("")}
    </div>

    ${D.mine.length?RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("تعييناتك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${D.mine.length}</span></span></div>
      ${D.mine.slice(0,5).map(m=>{const S=ORG.ST[m.status]||ORG.ST.open;
        return `<button onclick="go('${m.status==="live"?"refMatch":m.status==="final"?"refReport":"refCheck"}','${m.id}')" style="width:100%;display:flex;gap:11px;align-items:center;padding:10px 0;border:0;border-top:1px solid #f0ece2;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
          <span style="width:34px;height:34px;border-radius:${RF.DROP};background:${S[1]}18;color:${S[1]};display:grid;place-items:center;font-size:13px;flex:none">${m.status==="live"?"●":m.status==="final"?"✓":"◔"}</span>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(m.title)}</b>
            <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(m.venue||"—")} · ${esc(m.match_date||"")} · عيّنك ${esc(m.organizer_name||"—")}</span></div>
          ${m.score_a!=null?`<b class="ltr" style="font-size:14px;font-weight:700;flex:none">${m.score_a}–${m.score_b}</b>`:`<span style="font-size:9.5px;font-weight:900;color:${S[1]};flex:none">${S[0]}</span>`}</button>`;}).join("")}`)
    :RF.empty("لا تعيينات بعد — يعيّنك المنظّمون، ولك أن تقبل أو تعتذر")}

    <div style="background:#151a2e;border-radius:20px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden">${RF.disc()}
      <div style="position:relative"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">دورك الحالي</span><b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.2">حكم</b></div>
      <button onclick="go('role')" style="position:relative;background:#fff;color:#151a2e;border:0;border-radius:999px;padding:9px 14px;font:900 11px Cairo;cursor:pointer">⇄ تغيير الدور</button></div>
  </main>`;
};

/* ═══ 7b · قبل الصافرة ═══ */
window.refStart = async mid => {
  if(!confirm("بدء المباراة؟ تصير مباشرة ويبدأ التسجيل بتوقيعك.")) return;
  const {error} = await sb.from("matches").update({status:"live"}).eq("id",mid);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans("أطلق صافرة البداية"); toast("بدأت — بتوقيعك"); go("refMatch",mid);
};
T.refCheck = async () => {
  const D = await RF.load();
  const mid = (typeof PARAM!=="undefined" && PARAM) || (RF.cur(D)||{}).id;
  const m = D.mine.find(x=>x.id===mid);
  if(!m) return RF.top("قبل الصافرة","الكشف والتحقق") + `<main style="flex:1;padding:16px 18px 118px">${RF.empty("لا تعيين عليك")}</main>`;
  const js = RF.joinsOf(D,m.id);
  const pfOf = n => D.pf.find(p=>p.name===n) || {};
  const minors = js.filter(j=>{const p=pfOf(j.player_name); return p.age && p.age<18;});
  const checks = [
    ["الملعب", m.venue||null, m.venue?"#2c6e49":"#a83b25"],
    ["الموعد", (m.match_date||"")+" "+(m.match_time||""), m.match_date?"#2c6e49":"#a83b25"],
    ["المنظّم المسؤول", m.organizer_name||null, m.organizer_name?"#2c6e49":"#a83b25"],
    ["الكشف", js.length?js.length+" لاعبًا":null, js.length>=6?"#2c6e49":js.length?"#c78c00":"#a83b25"]
  ];
  const ready = checks.every(c=>c[1]) && js.length>=6;
  return RF.top("قبل الصافرة", esc(m.title)) + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${RF.card(`${RF.h("تحقّقك أنت")}${RF.sub("لا تبدأ حتى تطمئن — والبدء بتوقيعك لا بتوقيع المنظّم")}
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:8px">
        ${checks.map(([k,v,c])=>`<tr><td style="padding:10px 0;border-top:1px solid #f0ece2;font-weight:800;color:#5b6078">${k}</td>
          <td style="padding:10px 0;border-top:1px solid #f0ece2;text-align:end;font-weight:900;color:${c}">${v?esc(v):"غير مثبَّت"}</td></tr>`).join("")}
      </table>`)}
    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("الكشف")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${js.length}</span> لاعبًا</span></div>
      ${js.length?`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:11px">
        ${js.map(j=>{const p=pfOf(j.player_name);
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center">
            ${RF.av(j.player_name,42,{url:p.avatar_url})}
            <span style="font-size:9px;font-weight:900">${esc(String(j.player_name).split(" ")[0])}</span>
            ${p.age&&p.age<18?`<span style="font-size:8px;font-weight:900;color:#c78c00">قاصر</span>`:""}</div>`;}).join("")}</div>`
      :RF.empty("لا لاعبين مسجَّلين — لا تُدار مباراة بلا كشف")}`)}
    ${minors.length?RF.note(`<span class="ltr">${minors.length}</span> قاصرًا في الكشف — يلعبون بإذن أوليائهم الأول، ولا يُستأذن في كل مباراة. وإصابة القاصر تُبلَّغ وليّه فورًا.`):""}
    <button onclick="${ready?`refStart('${m.id}')`:`toast('أكمل التحقق أولًا',1)`}" style="background:${ready?"#e8531f":"#e9e4d8"};color:${ready?"#fff":"#8a8fa5"};border:0;border-radius:14px;padding:14px;font:900 13px Cairo;cursor:pointer;${ready?"box-shadow:0 8px 18px rgba(232,83,31,.3)":""}">🔔 صافرة البداية</button>
    ${RF.note("لك أن تعتذر عن التعيين أو تؤجّل الصافرة — والسبب يُسجَّل باسمك، ولا يملك المنظّم إجبارك.")}
  </main>`;
};

/* ═══ 7c · إدارة المباراة ═══ */
window.refPick = (mid,t) => { try{ localStorage.setItem("pi_ref_"+mid, t); }catch(e){} render(); };
window.refLog = async (mid, who) => {
  let t; try{ t = localStorage.getItem("pi_ref_"+mid); }catch(e){}
  if(!t) return toast("اختر نوع الحدث أولًا",1);
  if(t==="yellow"||t==="red") return refCard(mid,who,t);
  const min = +(prompt("الدقيقة:","")||0); if(!min) return;
  const {error} = await sb.from("match_events").insert({match_id:mid, minute:min, type:t, who, recorded_by:ME.name+" — حكم", source:"PlayIn"});
  if(error) return toast("تعذّر: "+error.message,1);
  if(t==="goal"){ const {data:m}=await sb.from("matches").select("score_a,score_b,team_a").eq("id",mid).single();
    if(m){ const {data:p}=await sb.from("profiles").select("org").eq("name",who).limit(1).single();
      const a = p && String(m.team_a||"").indexOf(String(p.org||"").replace("أكاديمية","").trim())>=0;
      await sb.from("matches").update(a?{score_a:(+m.score_a||0)+1}:{score_b:(+m.score_b||0)+1}).eq("id",mid); } }
  await trans(`وقّع ${(RF.EV.find(e=>e[0]===t)||[])[2]} لـ${who} في الدقيقة ${min}`);
  toast("وُقّع — دخل سجل اللاعب لحظته"); render();
};
window.refWhistle = async mid => {
  if(!confirm("الصافرة الأخيرة؟ تُقفل النتيجة وتدخل سجلات اللاعبين.")) return;
  const {error} = await sb.from("matches").update({status:"final"}).eq("id",mid);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans("أطلق الصافرة الأخيرة وأقفل النتيجة"); toast("أُقفلت بتوقيعك"); go("refReport",mid);
};
T.refMatch = async () => {
  const D = await RF.load();
  const mid = (typeof PARAM!=="undefined" && PARAM) || (RF.cur(D)||{}).id;
  const m = D.mine.find(x=>x.id===mid);
  if(!m) return RF.top("إدارة المباراة","اللمستان والوقت") + `<main style="flex:1;padding:16px 18px 118px">${RF.empty("لا مباراة تحت إدارتك")}</main>`;
  const js = RF.joinsOf(D,m.id), evs = RF.evOf(D,m.id);
  let sel; try{ sel = localStorage.getItem("pi_ref_"+m.id); }catch(e){}
  const pfOf = n => D.pf.find(p=>p.name===n) || {};
  const teams = String(m.title||"").split("—")[0].split("×").map(s=>s.trim());
  return `<div style="position:relative;background:#151a2e;padding:18px 18px 22px;border-radius:0 0 36px 36px;overflow:hidden">${RF.disc("#e8531f")}
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
      <button onclick="go('refHome')" style="width:40px;height:40px;border-radius:${RF.DROP};background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">⌂</button>
      <span style="display:inline-flex;align-items:center;gap:6px;background:#e8531f;color:#fff;border-radius:999px;padding:5px 12px;font-size:10.5px;font-weight:900"><span style="width:6px;height:6px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite"></span>${m.status==="live"?"مباشر":"جاهزة"}</span>
      <button onclick="refWhistle('${m.id}')" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);color:#faf8f3;border-radius:12px;padding:9px 12px;font:900 10.5px Cairo;cursor:pointer">🔔 نهاية</button>
    </div>
    <div style="position:relative;text-align:center;margin-top:14px;color:#faf8f3">
      <b style="display:block;font-size:15px;font-weight:900">${esc(m.title)}</b>
      <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-top:10px">
        <div style="text-align:center"><span style="width:46px;height:46px;border-radius:14px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:18px;font-weight:900;margin:0 auto">${esc(ACD.ini(teams[0]||"؟"))}</span><span style="display:block;font-size:10px;font-weight:900;margin-top:5px">${esc(teams[0]||"")}</span></div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:34px;font-weight:700">${m.score_a==null?"0":m.score_a}–${m.score_b==null?"0":m.score_b}</b>
        <div style="text-align:center"><span style="width:46px;height:46px;border-radius:14px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:18px;font-weight:900;margin:0 auto">${esc(ACD.ini(teams[1]||"؟"))}</span><span style="display:block;font-size:10px;font-weight:900;margin-top:5px">${esc(teams[1]||"")}</span></div>
      </div>
      <span style="display:block;font-size:10px;color:#c6cade;font-weight:700;margin-top:9px">كل حدث يحمل توقيعك — <b style="color:#f5c518">${esc(ME.name)}</b></span>
    </div></div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${RF.card(`${RF.h("١ · اختر الحدث")}${RF.sub("البطاقة تفتح شاشة السبب — لا بطاقة بلا سبب")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${RF.EV.map(([k,g,lb,c])=>`<button onclick="refPick('${m.id}','${k}')" style="flex:1;min-width:64px;background:${sel===k?c:"#faf8f3"};color:${sel===k?(k==="yellow"?"#151a2e":"#fff"):"#5b6078"};border:1px solid ${sel===k?c:"#e9e4d8"};border-radius:12px;padding:11px 6px;font:900 11px Cairo;cursor:pointer;text-align:center"><span style="display:block;font-size:16px">${g}</span>${lb}</button>`).join("")}
      </div>`)}
    ${RF.card(`${RF.h("٢ · اضغط اللاعب")}${RF.sub(sel?`الحدث المختار: <b style="color:#151a2e">${(RF.EV.find(e=>e[0]===sel)||[])[2]}</b>`:"لم تختر حدثًا بعد")}
      ${js.length?`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:11px">
        ${js.map(j=>{const p=pfOf(j.player_name);
          return `<button onclick="refLog('${m.id}','${RF.esn(j.player_name)}')" style="background:${sel?"#fff":"#faf8f3"};border:1.5px solid ${sel?"#ddd8fb":"#e9e4d8"};border-radius:16px;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:${sel?"pointer":"default"};font-family:Cairo;opacity:${sel?1:.6}">
            ${RF.av(j.player_name,40,{url:p.avatar_url})}
            <span style="font-size:9px;font-weight:900">${esc(String(j.player_name).split(" ")[0])}</span></button>`;}).join("")}</div>`
      :RF.empty("لا لاعبين مسجَّلين")}`)}
    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("سجل المباراة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${evs.length}</span></span></div>
      ${evs.length?evs.map(e=>{const E=RF.EV.find(x=>x[0]===e.type)||RF.EV[4];
        return `<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">${RF.ic(E[1],E[3]+"18",E[3])}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(e.who)} — ${E[2]}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">وقّعه ${esc(e.recorded_by)}</span></div>
          <b class="ltr" style="font-size:12.5px;color:#4636e3;flex:none">${e.minute}′</b></div>`;}).join("")
      :RF.empty("لا أحداث بعد")}`)}
    ${RF.note("توقيعك يدخل سجل اللاعب لحظته — بلا اعتماد ولا اعتراض. والخطأ يُصحَّح باسمك ووقتك وسببك في سجل الشفافية.")}
  </main>`;
};

/* ═══ 7d · الانضباط — بطاقة بسببها ═══ */
window.refCard = (mid, who, kind) => {
  const K = kind==="red"?["طرد","#a83b25"]:["إنذار","#c78c00"];
  const sh=document.createElement("div"); sh.id="pi_sheet";
  sh.style.cssText="position:fixed;inset:0;z-index:200;background:rgba(21,26,46,.5);display:flex;align-items:flex-end;justify-content:center";
  sh.onclick=e=>{ if(e.target===sh) sh.remove(); };
  sh.innerHTML=`<div style="background:#faf8f3;width:100%;max-width:520px;border-radius:28px 28px 0 0;padding:18px 18px 24px">
    <div style="width:38px;height:4px;border-radius:99px;background:#d5d0c4;margin:0 auto 14px"></div>
    <div style="display:flex;align-items:center;gap:12px">${RF.av(who,48)}
      <div style="flex:1;min-width:0"><span style="display:block;font-size:10px;font-weight:900;color:${K[1]}">${K[0]}</span>
        <b style="display:block;font-size:15px;font-weight:900">${esc(who)}</b></div>
      <span style="width:34px;height:46px;border-radius:6px;background:${kind==="red"?"#a83b25":"#f5c518"};flex:none"></span></div>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin:14px 0 8px;line-height:1.8">لا بطاقة بلا سبب — السبب يظهر في سجل اللاعب ويقرؤه ناديه ووليّ أمره.</span>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${RF.CAUSE.map(c=>`<button onclick="refCardGo('${mid}','${RF.esn(who)}','${kind}','${c}')" style="background:#fff;border:1px solid #e9e4d8;border-radius:999px;padding:9px 13px;font:900 11px Cairo;cursor:pointer">${c}</button>`).join("")}
    </div>
    <button onclick="closeSheet()" style="width:100%;margin-top:14px;background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">إلغاء</button></div>`;
  document.body.appendChild(sh);
};
window.refCardGo = async (mid, who, kind, cause) => {
  const min = +(prompt("الدقيقة:","")||0); if(!min) return;
  const {error} = await sb.from("match_events").insert({match_id:mid, minute:min, type:kind, who, recorded_by:ME.name+" — حكم · "+cause, source:"PlayIn"});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`وقّع ${kind==="red"?"طردًا":"إنذارًا"} لـ${who} — ${cause}`);
  closeSheet(); toast("وُقّعت بسببها — ودخلت سجله"); render();
};
T.refCards = async () => {
  const D = await RF.load();
  const mine = D.ev.filter(e=>(e.type==="yellow"||e.type==="red") && String(e.recorded_by||"").indexOf(ME.name)>=0);
  const cur = RF.cur(D);
  const y = mine.filter(e=>e.type==="yellow").length, r = mine.filter(e=>e.type==="red").length;
  const perM = D.mine.filter(m=>m.status==="final").length;
  return RF.top("الانضباط","بطاقة بسببها — ولا بطاقة بلا سبب") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${RF.disc()}
      <div style="position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        ${[["إنذارًا",y,"#f5c518"],["طردًا",r,"#e8531f"],["لكل مباراة",perM?(mine.length/perM).toFixed(1):null,"#faf8f3"]].map(([k,v,c])=>`<div><b class="ltr" style="display:block;font-size:24px;font-weight:700;color:${v?c:"#8a93b0"}">${v||RF.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}</div></div>
    ${cur&&cur.status!=="final"?RF.card(`${RF.h("بطاقة الآن")}${RF.sub(esc(cur.title))}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <button onclick="go('refMatch','${cur.id}')" style="background:#f5c518;color:#151a2e;border:0;border-radius:13px;padding:13px;font:900 12px Cairo;cursor:pointer">▮ إنذار</button>
        <button onclick="go('refMatch','${cur.id}')" style="background:#a83b25;color:#fff;border:0;border-radius:13px;padding:13px;font:900 12px Cairo;cursor:pointer">▮ طرد</button></div>
      ${RF.sub("تُختار من شاشة إدارة المباراة — الحدث ثم اللاعب ثم السبب")}`):""}
    ${RF.card(`${RF.h("بطاقاتك الموقّعة")}
      ${mine.length?mine.slice(0,10).map(e=>{const red=e.type==="red";
        return `<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
          <span style="width:26px;height:34px;border-radius:5px;background:${red?"#a83b25":"#f5c518"};flex:none"></span>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(e.who)}</b>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(String(e.recorded_by||"").split("·")[1]||"بلا سبب مسجَّل")}</span></div>
          <b class="ltr" style="font-size:12px;color:${red?"#a83b25":"#c78c00"};flex:none">${e.minute}′</b></div>`;}).join("")
      :RF.empty("لم توقّع بطاقة بعد")}`)}
    ${RF.note("البطاقة قرار فنّي باسمك — لا يُعترض عليه ولا يُعتمد من أحد. والتصحيح باسمك في سجل الشفافية.")}
  </main>`;
};

/* ═══ 7e · التقرير ═══ */
T.refReport = async () => {
  const D = await RF.load();
  const done = D.mine.filter(m=>m.status==="final");
  const mid = (typeof PARAM!=="undefined" && PARAM) || (done[0]||{}).id;
  const m = done.find(x=>x.id===mid) || done[0];
  if(!m) return RF.top("تقرير المباراة","بعد الصافرة الأخيرة") + `<main style="flex:1;padding:16px 18px 118px">${RF.empty("لا مباريات منتهية بعد")}</main>`;
  const evs = RF.evOf(D,m.id), js = RF.joinsOf(D,m.id);
  const cards = evs.filter(e=>e.type==="yellow"||e.type==="red");
  return RF.top("تقرير المباراة", esc(m.title)) + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${done.length>1?`<div style="display:flex;gap:6px;overflow-x:auto">${done.slice(0,6).map(x=>`<button onclick="go('refReport','${x.id}')" style="flex:none;background:${x.id===m.id?"#151a2e":"#fff"};color:${x.id===m.id?"#faf8f3":"#5b6078"};border:1px solid ${x.id===m.id?"#151a2e":"#e9e4d8"};border-radius:999px;padding:8px 13px;font:900 10.5px Cairo;cursor:pointer">${esc(String(x.title).split("—")[0])}</button>`).join("")}</div>`:""}
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${RF.disc("#f5c518")}
      <div style="position:relative;text-align:center">
        <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">النتيجة النهائية — بتوقيعك</span>
        <b class="ltr" style="display:block;font-size:38px;font-weight:700;margin-top:4px">${m.score_a==null?RF.dash:m.score_a+"–"+m.score_b}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:4px">${esc(m.venue||"")} · ${esc(m.match_date||"")}</span></div></div>
    ${RF.card(`${RF.h("ما وقّعتَه")}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:11px">
        ${[["حدثًا",evs.length],["هدفًا",evs.filter(e=>e.type==="goal").length],["إنذارًا",evs.filter(e=>e.type==="yellow").length],["طردًا",evs.filter(e=>e.type==="red").length]].map(([k,v])=>`<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:14px;padding:10px 6px;text-align:center"><b class="ltr" style="display:block;font-size:18px;color:${v?"#4636e3":"#b0b5c6"}">${v||RF.dash}</b><span style="display:block;font-size:9px;color:#8a8fa5;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}
      </div>`)}
    ${cards.length?RF.card(`${RF.h("الانضباط")}
      ${cards.map(e=>`<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
        <span style="width:22px;height:30px;border-radius:4px;background:${e.type==="red"?"#a83b25":"#f5c518"};flex:none"></span>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(e.who)}</b><span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(String(e.recorded_by||"").split("·")[1]||"—")}</span></div>
        <b class="ltr" style="font-size:12px;flex:none">${e.minute}′</b></div>`).join("")}`):""}
    ${RF.card(`${RF.h("ما دخل سجلات اللاعبين")}${RF.sub(`<span class="ltr">${js.length}</span> لاعبًا · كل سطر بتوقيعك`)}
      ${evs.length?evs.slice(0,8).map(e=>{const E=RF.EV.find(x=>x[0]===e.type)||RF.EV[4];
        return `<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">${RF.ic(E[1],E[3]+"18",E[3])}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(e.who)} — ${E[2]}</b></div>
          <b class="ltr" style="font-size:12px;color:#4636e3;flex:none">${e.minute}′</b></div>`;}).join("")
      :RF.empty("لم يُسجَّل حدث — سجلات اللاعبين لم تتغيّر بهذه المباراة")}`)}
    ${RF.note("التقرير مُقفل. التصحيح ممكن باسمك ووقتك وسببك — ويظهر في سجل الشفافية للجميع.")}
  </main>`;
};

/* ═══ 7f · سجلي واعتمادي ═══ */
T.refLog = async () => {
  const D = await RF.load();
  const done = D.mine.filter(m=>m.status==="final");
  const evMine = D.ev.filter(e=>String(e.recorded_by||"").indexOf(ME.name)>=0);
  const certs = await q("c", sb.from("pi_certs").select("*").eq("person",ME.name).order("year",{ascending:false}));
  const comps = {}; done.forEach(m=>{ const c=m.comp||"ودية"; comps[c]=(comps[c]||0)+1; });
  const MN=["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"];
  const now=new Date();
  const months=[...Array(6)].map((_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return {k:d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"),lb:MN[d.getMonth()]};});
  const mv = months.map(mm=>done.filter(m=>String(m.match_date||m.created_at||"").startsWith(mm.k)).length);
  const mx = Math.max(1,...mv);
  return RF.top("سجلي واعتمادي","ما وقّعتَه — لا ما قيل عنك") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${RF.disc("#f5c518")}
      <div style="position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        ${[["مباراة وقّعتها",done.length],["حدثًا",evMine.length],["اعتمادًا",certs.filter(c=>c.verified_by).length]].map(([k,v])=>`<div><b class="ltr" style="display:block;font-size:24px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||RF.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}</div></div>
    ${done.length?RF.card(`${RF.h("مبارياتك في ستة أشهر")}
      <div style="display:flex;align-items:flex-end;gap:6px;height:82px;margin-top:10px">
        ${mv.map((v,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
          <b class="ltr" style="font-size:9px;font-weight:700;color:${v?"#4636e3":"#c9c2b2"}">${v||""}</b>
          <span style="width:100%;border-radius:6px 6px 3px 3px;background:${v?"#4636e3":"#f0ece2"};height:${Math.max(3,Math.round(v/mx*54))}px"></span>
          <span style="font-size:8px;font-weight:800;color:#8a8fa5">${months[i].lb}</span></div>`).join("")}</div>`):""}
    ${Object.keys(comps).length?RF.card(`${RF.h("بطولاتك")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${Object.entries(comps).map(([c,n])=>`<span style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:999px;padding:6px 12px;font-size:10.5px;font-weight:900">${esc(c)} · <span class="ltr">${n}</span></span>`).join("")}</div>`):""}
    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("الاعتمادات")}<button onclick="cvAdd('cert')" style="background:#4636e3;color:#fff;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">＋ اعتماد</button></div>
      ${certs.length?certs.map(c=>`<div style="display:flex;gap:11px;align-items:flex-start;background:${c.verified_by?"#fff8df":"#faf8f3"};border:1px solid ${c.verified_by?"#f0e2b4":"#e9e4d8"};border-radius:16px;padding:11px 13px;margin-top:8px">
        <span style="width:40px;height:40px;border-radius:${RF.DROP};background:${c.verified_by?"linear-gradient(160deg,#f5c518,#c78c00)":"#efedff"};color:${c.verified_by?"#151a2e":"#4636e3"};display:grid;place-items:center;font-size:15px;flex:none">${c.level?`<b class="ltr">${esc(c.level)}</b>`:"▣"}</span>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(c.title)}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(c.issuer)}${c.year?` · <span class="ltr">${c.year}</span>`:""}</span>
          <span style="display:inline-block;margin-top:5px;background:${c.verified_by?"#eaf5ee":"#f2f0ea"};color:${c.verified_by?"#2c6e49":"#8a8fa5"};border-radius:999px;padding:2px 8px;font-size:8.5px;font-weight:900">${c.verified_by?"✓ وثّقتها "+esc(c.verified_by):"بانتظار التوثيق"}</span></div>
        <button onclick="cvDel('cert','${c.id}')" style="background:none;border:0;color:#a83b25;font:900 13px Cairo;cursor:pointer;flex:none">×</button></div>`).join("")
      :`<div style="margin-top:10px">${RF.empty("لا اعتماد مسجَّل — أضف رخصتك، وتظهر «بقولك» حتى توثّقها الجهة")}</div>`}`)}
    ${RF.note("سجلك من مباريات وقّعتها فعلًا — لا من تقييم أحد لك. ولا يملك منظّم ولا نادٍ تعديل سطر منه.")}
  </main>`;
};

/* ═══ 7g · ملفي ═══ */
T.refMe = async () => {
  const D = await RF.load();
  const done = D.mine.filter(m=>m.status==="final");
  const evMine = D.ev.filter(e=>String(e.recorded_by||"").indexOf(ME.name)>=0);
  const certs = await q("c", sb.from("pi_certs").select("*").eq("person",ME.name).limit(20));
  const tr = await q("t", sb.from("transparency").select("*").ilike("actor","%"+ME.name+"%").order("created_at",{ascending:false}).limit(20));
  const orgs = new Set(D.mine.map(m=>m.organizer_name).filter(Boolean));
  const stats = [["مباراة",done.length],["حدثًا",evMine.length],["منظّمًا",orgs.size],["اعتمادًا",certs.filter(c=>c.verified_by).length]];
  const pid = "PI-R-2026-" + String(1000 + (String(ME.name).split("").reduce((a,c)=>a+c.charCodeAt(0),0)%8999));
  const hasAv = !!PL3.avUrl(ME.name);
  const fields = [["الصورة",hasAv,"avatarSheet()"],["الاسم",!!ME.name],["اعتماد",certs.length>0,"cvAdd('cert')"],["مباراة موقّعة",done.length>0],["تعيين",D.mine.length>0]];
  const comp = Math.round(fields.filter(f=>f[1]).length/fields.length*100);
  const missing = fields.filter(f=>!f[1]);
  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('refHome')" style="width:40px;height:40px;border-radius:${RF.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <button onclick="go('settings')" style="width:40px;height:40px;border-radius:${RF.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⚙</button></div>
  <main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;color:#faf8f3;box-shadow:0 18px 44px rgba(21,26,46,.18)">
      <div style="position:absolute;inset-inline-start:58%;top:-62%;width:86%;height:210%;background:radial-gradient(circle at 45% 50%,#f5c518,#8a6912);border-radius:50%;opacity:.2"></div>
      <div style="position:relative;padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">${WM(1)}
          <span style="background:rgba(245,197,24,.16);border:1px solid rgba(245,197,24,.45);color:#f5c518;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">★ حكم${done.length>=5?" موثّق":""}</span></div>
        <div style="display:flex;align-items:flex-end;gap:14px;margin-top:20px">
          <button onclick="avatarSheet()" style="position:relative;flex:none;background:none;border:0;padding:0;cursor:pointer">
            ${RF.av(ME.name,104,{r:"50% 50% 50% 14px",ring:"3px solid #f5c518"})}
            <span style="position:absolute;bottom:-2px;inset-inline-start:-6px;width:28px;height:28px;border-radius:${RF.DROP};background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:12px;border:2px solid #151a2e">✎</span></button>
          <div style="flex:1;min-width:0;padding-bottom:4px">
            <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">حكم${certs[0]&&certs[0].level?` · رخصة <span class="ltr">${esc(certs[0].level)}</span>`:""}</span>
            <b style="display:block;font-size:23px;font-weight:900;line-height:1.2;margin-top:3px">${esc(ME.name)}</b>
            <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${ME.org?esc(ME.org):"مستقل"}</span></div></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:18px">
          ${stats.map(([k,v])=>`<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:9px 4px;text-align:center"><b class="ltr" style="display:block;font-size:19px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||RF.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:1px">${k}</span></div>`).join("")}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14)">
          <div style="min-width:0"><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">التعيينات من</span>
            <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">${orgs.size?[...orgs].slice(0,2).map(o=>`<span style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">${esc(o)}</span>`).join(""):`<span style="border:1px dashed rgba(255,255,255,.3);color:#c6cade;border-radius:999px;padding:4px 10px;font-size:9px;font-weight:900">لا تعيينات بعد</span>`}</div>
            <span class="ltr" style="display:block;font-family:'Space Grotesk';font-size:10px;font-weight:700;color:#8f9bff;margin-top:8px">${pid}</span></div>
          <div style="flex:none;width:72px;height:72px;background:#fff;border-radius:12px;padding:5px"><svg viewBox="0 0 21 21" shape-rendering="crispEdges" style="width:100%;height:100%;display:block"><rect width="21" height="21" fill="#fff"></rect><path d="${PL3.qr(pid)}" fill="#151a2e"></path></svg></div>
        </div></div></div>
    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("اكتمال ملفك")}<b class="ltr" style="font-size:11px;color:#4636e3">${comp}%</b></div>
      <div style="height:8px;border-radius:999px;background:#f0ece2;margin-top:10px;overflow:hidden"><span style="display:block;height:100%;width:${comp}%;background:#4636e3;border-radius:999px"></span></div>
      ${missing.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${missing.map(f=>f[2]?`<button onclick="${f[2]}" style="background:#efedff;color:#4636e3;border:0;border-radius:999px;padding:5px 11px;font:900 10px Cairo;cursor:pointer">＋ ${f[0]}</button>`:`<span style="background:#f2f0ea;color:#8a8fa5;border-radius:999px;padding:5px 11px;font-size:10px;font-weight:900">${f[0]} — بتعيين غيرك</span>`).join("")}</div>`:RF.sub("مكتمل")}`)}
    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("سلسلة الثقة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">خطوتان لا ثلاث</span></div>
      <div style="display:flex;align-items:center;margin-top:12px">
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><span style="width:32px;height:32px;border-radius:${RF.DROP};background:#4636e3;color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900">أنت</span><span style="font-size:9px;font-weight:800;color:#4636e3">الحكم المسؤول</span></div>
        <span style="flex:1;height:2.5px;background:#4636e3;margin-top:-14px"></span>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><span style="width:32px;height:32px;border-radius:${RF.DROP};background:#2c6e49;color:#fff;display:grid;place-items:center;font-size:13px">✓</span><span style="font-size:9px;font-weight:800;color:#2c6e49">السجل — فورًا</span></div></div>
      ${RF.sub("توقيعك نهائي: لا يعتمده منظّم ولا يعترض عليه نادٍ. والخطأ يُصحَّح باسمك.")}`)}
    ${tr.length?RF.card(`${RF.h("آخر قراراتك")}${RF.sub("قراءة فقط — حتى لك")}
      ${tr.slice(0,5).map(t=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${RF.ic("▤","#efedff","#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;line-height:1.6">${esc(t.action)}</b><span class="ltr" style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(new Date(t.created_at).toLocaleString("en-GB"))}</span></div></div>`).join("")}`):""}
    <div style="background:#151a2e;border-radius:20px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden">${RF.disc()}
      <div style="position:relative"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">دورك الحالي</span><b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.2">حكم</b></div>
      <button onclick="go('role')" style="position:relative;background:#fff;color:#151a2e;border:0;border-radius:999px;padding:9px 14px;font:900 11px Cairo;cursor:pointer">⇄ تغيير الدور</button></div>
  </main>`;
};

(function(){
  Object.assign(TITLES,{refHome:"تعييناتي",refCheck:"قبل الصافرة",refMatch:"إدارة المباراة",refCards:"الانضباط",refReport:"تقرير المباراة",refLog:"سجلي",refMe:"ملفي"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE,{refHome:["تعييناتي","ما أُسند إليك"],refCheck:["قبل الصافرة","الكشف والتحقق"],refMatch:["إدارة المباراة","اللمستان والوقت"],refCards:["الانضباط","بطاقة بسببها"],refReport:["تقرير المباراة","بعد الصافرة الأخيرة"],refLog:["سجلي واعتمادي","ما وقّعتَه"],refMe:["ملفي","وخصوصيتي"]});
  RF.OWN = ["refHome","refCheck","refMatch","refCards","refReport","refLog","refMe"];
  if(typeof NAV!=="undefined") NAV.referee = [["◉","ملفي","refMe"],["★","سجلي","refLog"],["FAB","","hub"],["●","المباراة","refMatch"],["⌂","تعييناتي","refHome"]];
  if(typeof HUB!=="undefined"){
    HUB.ROLE.referee = [["⌂","تعييناتي","refHome","#efedff","#7b5cff"],["✓","قبل الصافرة","refCheck"],["●","إدارة المباراة","refMatch","#fdeee8","#e8531f"],["▮","الانضباط","refCards","#fff6d6","#c78c00"],["▤","التقرير","refReport"],["★","سجلي واعتمادي","refLog","#fff6d6","#c78c00"],["◉","ملفي","refMe"]];
    HUB.ROLE_OK.referee = ["pitch","explore","messages","refHome","refCheck","refMatch","refCards","refReport","refLog","refMe","reports","role","settings"];
  }
  if(typeof homeFor==="function"){ const _h=homeFor; window.homeFor=function(){ return ME && ME.role==="referee" ? "refHome" : _h(); }; }
  /* شريط موحّد للمنظّم والحكم: الزر الأوسط «تنقّل» لا «+» */
  RF.nav = items => `<nav style="position:fixed;bottom:12px;inset-inline:12px;max-width:496px;margin:0 auto;background:#fff;border:1px solid #e9e4d8;border-radius:999px;display:flex;justify-content:space-around;align-items:center;padding:8px 10px;box-shadow:0 10px 26px rgba(21,26,46,.07);z-index:50">
${items.map(([g,lb,v])=>{ const on=VIEW===v;
  if(g==="FAB") return `<button onclick="go('${v}')" style="width:58px;height:58px;border-radius:50% 50% 50% 14px;background:${on?"#4636e3":"#151a2e"};color:#faf8f3;margin-top:-34px;box-shadow:0 10px 22px rgba(21,26,46,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;border:4px solid #faf8f3;cursor:pointer;font-family:Cairo;flex:none"><span style="font-size:18px">⌂</span><span style="font-size:8.5px;font-weight:900">تنقّل</span></button>`;
  return `<button onclick="go('${v}')" style="background:none;border:0;font-size:9.5px;font-weight:${on?900:800};color:${on?"#4636e3":"#8a8fa5"};display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font-family:Cairo;padding:0"><span style="font-size:16px">${g}</span>${lb}</button>`;}).join("")}
</nav>`;
  const _nav = window.navHtml || navHtml;
  window.navHtml = navHtml = function(){
    if(ME && ME.role==="referee") return RF.nav(NAV.referee);
    if(ME && ME.role==="organizer") return RF.nav(NAV.organizer);
    return _nav();
  };
  const _r = window.render;
  window.render = render = async function(){
    await _r();
    try{
      if(!ME || ME.role!=="referee" || VIEW==="auth" || VIEW==="role") return;
      if(RF.OWN.indexOf(VIEW)>=0){ const hd=$("#app").querySelector(".hd"); if(hd) hd.remove(); }
      if(VIEW==="explore") setTimeout(()=>{ try{ PL3.drawMap && PL3.drawMap(); }catch(e){} },80);
      const NOT_MINE=["feed","records","cabinet","publicView","myCard","opps","wallet","calendar","health","coachHome","squad","session","drills","brief","rate","tactics","coachTasks","coachMe","boards","acadHome","erp","erpPeople","erpOps","erpField","orgHome","orgLive","orgPeople","orgNear","orgSettle","orgTasks","orgMe"];
      if(NOT_MINE.indexOf(VIEW)>=0){ go("refHome"); }
    }catch(e){ console.error("RF",e); }
  };
})();
