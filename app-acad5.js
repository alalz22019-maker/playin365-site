/* PlayIn365 — الأكاديمية ٣: مبارياتنا الحقيقية · الملعب بعين الأكاديمية · الشريط الصحيح · برايم معطّلة · المفتاح */
T.acadMatches = async () => {
  const org = ACD.who(); const sh = ACD.short(org);
  const [ms,pf,ev] = await Promise.all([
    q("m", sb.from("matches").select("*").order("created_at",{ascending:false}).limit(80)),
    q("p", sb.from("profiles").select("name").eq("org",org).eq("role","player").limit(300)),
    q("e", sb.from("match_events").select("*").order("created_at",{ascending:false}).limit(400))
  ]);
  const names = new Set(pf.map(p=>p.name));
  const mine = ms.filter(m => String(m.title||"").indexOf(sh)>=0 || String(m.team_a||"").indexOf(sh)>=0 || String(m.team_b||"").indexOf(sh)>=0);
  const live = mine.filter(m=>m.status==="live"), soon = mine.filter(m=>m.status==="today"||m.status==="open"), done = mine.filter(m=>m.status==="final");
  const evOf = id => ev.filter(e=>e.match_id===id);
  const ours = id => evOf(id).filter(e=>names.has(e.who));
  const res = m => { if(m.score_a==null) return null; const us = String(m.team_a||"").indexOf(sh)>=0 || (String(m.title||"").indexOf(sh)<String(m.title||"").indexOf("×")); const a=+m.score_a,b=+m.score_b; const w=us?a>b:b>a, d=a===b; return d?["تعادل","#8a8fa5"]:w?["فوز","#2c6e49"]:["خسارة","#a83b25"]; };
  const wins = done.filter(m=>{const r=res(m);return r&&r[0]==="فوز";}).length, draws = done.filter(m=>{const r=res(m);return r&&r[0]==="تعادل";}).length;
  const gf = done.reduce((s,m)=>s+ours(m.id).filter(e=>e.type==="goal").length,0);
  const form = done.slice(0,5).map(m=>res(m)).filter(Boolean);
  const card = (m,k) => { const r=res(m), g=ours(m.id).filter(e=>e.type==="goal"), teams=String(m.title||"").split("—")[0].split("×").map(s=>s.trim());
    return `<button onclick="go('matchView','${m.id}')" style="width:100%;background:#fff;border:1px solid ${k==="live"?"#f3cdbe":"#e9e4d8"};border-radius:20px;padding:14px 16px;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e;position:relative;overflow:hidden">
      ${k==="live"?`<span style="position:absolute;top:0;inset-inline-start:0;width:4px;height:100%;background:#e8531f"></span>`:""}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <span style="font-size:9.5px;font-weight:900;color:#8a8fa5">${esc(m.comp||"ودية")} · ${esc(m.match_date||"")} <span class="ltr">${esc(m.match_time||"")}</span></span>
        ${k==="live"?`<span style="display:inline-flex;align-items:center;gap:5px;background:#e8531f;color:#fff;border-radius:999px;padding:3px 9px;font-size:9px;font-weight:900"><span style="width:6px;height:6px;border-radius:50%;background:#fff;animation:pulse 1.4s infinite"></span>مباشر</span>`
         :k==="soon"?`<span style="background:#fff6d6;color:#c78c00;border-radius:999px;padding:3px 9px;font-size:9px;font-weight:900">${m.status==="today"?"اليوم":"قادمة"}</span>`
         :r?`<span style="background:${r[1]}18;color:${r[1]};border-radius:999px;padding:3px 9px;font-size:9px;font-weight:900">${r[0]}</span>`:""}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
        <div style="flex:1;text-align:center"><span style="width:44px;height:44px;border-radius:14px;background:${String(teams[0]||"").indexOf(sh)>=0?"#f5c518":"#efedff"};color:${String(teams[0]||"").indexOf(sh)>=0?"#151a2e":"#4636e3"};display:grid;place-items:center;font-size:17px;font-weight:900;margin:0 auto">${esc(ACD.ini(teams[0]||"؟"))}</span><b style="display:block;font-size:11px;font-weight:900;margin-top:5px">${esc(teams[0]||"")}</b></div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:${m.score_a!=null?"26px":"14px"};font-weight:700;color:${k==="live"?"#e8531f":"#151a2e"};flex:none;min-width:60px;text-align:center">${m.score_a!=null?`${m.score_a}–${m.score_b}`:"VS"}</b>
        <div style="flex:1;text-align:center"><span style="width:44px;height:44px;border-radius:14px;background:${String(teams[1]||"").indexOf(sh)>=0?"#f5c518":"#151a2e"};color:${String(teams[1]||"").indexOf(sh)>=0?"#151a2e":"#f5c518"};display:grid;place-items:center;font-size:17px;font-weight:900;margin:0 auto">${esc(ACD.ini(teams[1]||"؟"))}</span><b style="display:block;font-size:11px;font-weight:900;margin-top:5px">${esc(teams[1]||"")}</b></div>
      </div>
      ${g.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid #f0ece2">${g.slice(0,4).map(e=>`<span style="display:inline-flex;align-items:center;gap:5px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:999px;padding:3px 8px 3px 3px;font-size:9.5px;font-weight:900">${PL3.av(e.who,18,{dark:true,r:"50% 50% 50% 5px"})}${esc(String(e.who).split(" ")[0])} <span class="ltr" style="color:#4636e3">${e.minute}′</span></span>`).join("")}</div>`:""}
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:8px">◎ ${esc(m.venue||"—")} · المنظّم ${esc(m.organizer_name||"—")}${m.referee_name?` · الحكم ${esc(m.referee_name)}`:""}</span></button>`; };

  return ACD.head("مبارياتنا",`${sh} — ما لُعب وما سيُلعب، بتوقيع حكّامه`) + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ACD.disc()}
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        <div style="flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">
          ${[["لُعبت",done.length,"#faf8f3"],["فوز",wins,"#7fd7a4"],["تعادل",draws,"#c6cade"],["هدفًا لنا",gf,"#f5c518"]].map(([k,v,c])=>`<div><b class="ltr" style="display:block;font-size:22px;font-weight:700;color:${v?c:"#8a93b0"}">${v||ACD.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800">${k}</span></div>`).join("")}</div></div>
      ${form.length?`<div style="position:relative;display:flex;align-items:center;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.14)"><span style="font-size:9.5px;color:#c6cade;font-weight:800;flex:none">آخر ٥</span>${form.map(r=>`<span style="width:26px;height:26px;border-radius:8px;background:${r[1]};color:#fff;display:grid;place-items:center;font-size:10px;font-weight:900">${r[0][0]}</span>`).join("")}</div>`:""}
    </div>
    ${live.length?`${ACD.h("الآن")}${live.map(m=>card(m,"live")).join("")}`:""}
    ${soon.length?`${ACD.h("القادمة")}${soon.map(m=>card(m,"soon")).join("")}`:""}
    ${done.length?`${ACD.h("النتائج")}${done.slice(0,8).map(m=>card(m,"done")).join("")}`:""}
    ${!mine.length?ACD.empty("لا مباريات باسم "+esc(sh)+" بعد — تظهر هنا لحظة ينشئها منظّم"):""}
    ${ACD.note("النتيجة يوقّعها الحكم أو المنظّم لا الأكاديمية — والخطأ يُصحَّح باسم من صحّحه في سجل الشفافية.")}
  </main>`;
};

/* الملعب بعين الأكاديمية — نفس منطق المدرب على كشف الجهة */
(function(){
  const _p = T.pitch;
  T.pitch = async () => {
    if(!ME || ME.role!=="academy") return _p();
    const org = ME.org||""; const sh = ACD.short(org);
    const [pf,evs,views,med] = await Promise.all([
      q("p", sb.from("profiles").select("name,role,avatar_url").eq("org",org).limit(300)),
      q("e", sb.from("match_events").select("*,matches(title,comp)").order("created_at",{ascending:false}).limit(150)),
      q("v", sb.from("pi_views").select("*").order("created_at",{ascending:false}).limit(100)),
      q("m", sb.from("pi_media").select("*").order("created_at",{ascending:false}).limit(40))
    ]);
    const names = new Set(pf.filter(p=>p.role==="player").map(p=>p.name));
    const myEv = evs.filter(e=>names.has(e.who)), myV = views.filter(v=>names.has(v.subject));
    const scouts = myV.filter(v=>v.viewer_role==="scout"||v.viewer_role==="agent");
    const EV = {goal:["⚽","#fff6d6","#c78c00","هدف موثّق"],assist:["◎","#efedff","#4636e3","صناعة موثقة"],yellow:["▮","#151a2e","#f5c518","إنذار"],red:["▮","#fdeee8","#a83b25","طرد"],sub:["⇄","#efedff","#4636e3","تبديل"]};
    const top = {}; myEv.forEach(e=>{ if(e.type==="goal"||e.type==="assist") top[e.who]=(top[e.who]||0)+1; });
    const rank = Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,3);
    return ACD.head(`${esc(sh)} في الملعب`,"ما دخل سجلات لاعبيكم · ومن يراقبهم من خارج الأكاديمية") + `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
      <div style="background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${[["حدثًا للاعبيكم",myEv.length],["اطّلاع كشاف",scouts.length],["لقطة رفعوها",med.filter(m=>names.has(m.subject)).length]].map(([k,v])=>`<div style="text-align:center"><b class="ltr" style="display:block;font-size:26px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||ACD.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}</div></div>
      ${scouts.length?ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h("من يراقب لاعبيكم")}<span style="font-size:10px;color:#e8531f;font-weight:900">يهمّكم</span></div>
        ${scouts.slice(0,5).map(v=>`<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">${PL3.av(v.viewer,34,{r:"50% 50% 50% 8px"})}<div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(v.viewer||"غير معروف")}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(roleAr[v.viewer_role]||v.viewer_role||"")} فتح ملف <b style="color:#4636e3">${esc(v.subject)}</b></span></div><span style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${VW.rel(v.created_at)}</span></div>`).join("")}`):""}
      ${rank.length?ACD.card(`${ACD.h("الأكثر إسهامًا هذا الموسم")}${ACD.sub("من أهداف وصناعات وقّعها حكامها")}
        <div style="display:grid;grid-template-columns:repeat(${rank.length},1fr);gap:9px;margin-top:11px">${rank.map(([n,c],i)=>`<button onclick="go('publicView','${ACD.esn(n)}')" style="background:${i===0?"#fff8df":"#faf8f3"};border:1px solid ${i===0?"#f0e2b4":"#e9e4d8"};border-radius:16px;padding:12px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:Cairo">${PL3.av(n,42,{dark:true,r:"50% 50% 50% 10px",ring:i===0?"2.5px solid #f5c518":""})}<b style="font-size:10.5px;font-weight:900">${esc(String(n).split(" ")[0])}</b><span class="ltr" style="font-size:12px;font-weight:700;color:${i===0?"#c78c00":"#4636e3"}">${c}</span></button>`).join("")}</div>`):""}
      ${ACD.card(`${ACD.h("آخر ما دخل سجلاتهم")}
        ${myEv.length?myEv.slice(0,6).map(e=>{const [g,bg,ink,lb]=EV[e.type]||EV.sub; return `<button onclick="go('publicView','${ACD.esn(e.who)}')" style="width:100%;background:none;border:0;border-top:1px solid #f0ece2;padding:10px 0;display:flex;gap:11px;align-items:flex-start;cursor:pointer;font-family:Cairo;text-align:start"><span style="width:32px;height:32px;border-radius:50% 50% 50% 6px;background:${bg};color:${ink};display:grid;place-items:center;font-size:13px;flex:none">${g}</span><div style="flex:1;min-width:0"><b style="display:block;font-size:12px;line-height:1.5">${esc(e.who)} — ${lb}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} · <span class="ltr">${e.minute}′</span> — سجّله ${esc(e.recorded_by)}</span></div><span style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${VW.rel(e.created_at)}</span></button>`;}).join("")
        :`<div style="border-top:1px solid #f0ece2;padding-top:12px">${ACD.empty("لا أحداث لفريقكم بعد")}</div>`}`)}
      ${ACD.note("مرآة لا منشورات: ما وقّعه غيركم في سجلات لاعبيكم، ومن اطّلع عليهم من خارج الأكاديمية.")}
    </main>`;
  };
})();

/* برايم معطّلة حاليًا — قرار المالك */
window.acPrimeOff = () => toast("عضوية برايم غير متاحة حاليًا — تُفتح بقرار الأكاديمية");

(function(){
  Object.assign(TITLES,{acadMatches:"مبارياتنا"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE,{acadMatches:["مبارياتنا","بتوقيع حكّامها"], pitch:["الملعب","فريقكم في الملعب"]});
  ACD.OWN.push("acadMatches","pitch");
  if(typeof NAV!=="undefined") NAV.academy = [["◉","بيتي","acadHome"],["▶","مبارياتنا","acadMatches"],["FAB","","hub"],["⚽","الملعب","pitch"],["▦","الديوان","erp"]];
  if(typeof HUB!=="undefined"){
    /* استيراد القوائم واختبارات القبول أدوات تشغيل — مكانها الديوان لا المفتاح */
    HUB.ROLE.academy = [["◉","ملفنا العام","acadHome","#fff6d6","#c78c00"],["▶","مبارياتنا","acadMatches"],["⚽","فريقنا في الملعب","pitch"],["▦","الديوان","erp","#e7ecf1","#243244"],["◍","الفرق والتجارب","acadTeams"],["★","الفخر","acadPride","#fff6d6","#c78c00"],["◎","الشبكة والرعاة","acadNet"],["✓","الموافقات","approvals","#eaf5ee","#2c6e49"]];
    HUB.ROLE_OK.academy.push("acadMatches");
  }
})();
