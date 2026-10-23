/* PlayIn365 — الحكم ٢: إعادة بناء بما يليق بالدور
   قرارات المالك: الحكم لا يكتب دقائق (ساعة تلقائية) · التبديل باسمين · جاهزية الملعب والمدة والطاقم قبل الصافرة
   · القاصر بإذن وليّه الأول (والإصابة تُبلَّغ فورًا) · وملفه يُسوّق له: إنجازات وشهادات وبطاقة تُشارَك. */
RF.CHK = [["pitch","أرضية الملعب","◍","safety"],["lights","الإضاءة","☀","safety"],["goals","المرمى والقائم","▯","safety"],["nets","الشباك","▦","kit"],["ball","الكرة","⚽","kit"],["water","الماء","◇","kit"],["medic","الإسعاف","✚","safety"]];
RF.CHKV = k => k==="kit"
  ? {ok:["متوفّرة","#2c6e49","#eaf5ee"],poor:["ناقصة","#8a6912","#fff8df"],unsafe:["غير متوفّرة","#a83b25","#fdeee8"]}
  : {ok:["سليمة","#2c6e49","#eaf5ee"],poor:["مقبولة","#8a6912","#fff8df"],unsafe:["غير آمنة","#a83b25","#fdeee8"]};
RF.OFF = [["assistant1","مساعد أول","حكم"],["assistant2","مساعد ثانٍ","حكم"],["fourth","الحكم الرابع","حكم"],["table","مسجّل الطاولة","إدخال"]];
RF.DUR = [[90,2],[80,2],[70,2],[60,2],[50,2],[40,4]];

/* ── الساعة: الدقيقة تُحسب ولا تُكتب ── */
RF.min = m => {
  if(!m) return 1;
  if(!m.kickoff_at) return 1;
  const mins = Math.floor((Date.now() - new Date(m.kickoff_at))/60000);
  return Math.max(1, Math.min((+m.duration_min||90)+8, mins+1));
};
RF.half = m => { const d=+m.duration_min||90, n=+m.halves||2, per=d/n; return Math.min(n, Math.floor((RF.min(m)-1)/per)+1); };
RF.tick = () => { if(RF._t) clearInterval(RF._t); RF._t = setInterval(()=>{ const el=document.getElementById("rf_clock"); if(!el){ clearInterval(RF._t); return; } if(RF._m) el.textContent = RF.min(RF._m)+"′"; }, 15000); };

window.refSetDur = async (mid,d,h) => {
  const {error} = await sb.from("matches").update({duration_min:d, halves:h}).eq("id",mid);
  if(error) return toast("تعذّر: "+error.message,1);
  toast("المدة "+d+" دقيقة · "+h+" أشواط"); render();
};
window.refChk = async (mid,k,v) => {
  const row = {match_id:mid, checked_by:ME.name+" — حكم", checked_at:new Date().toISOString()}; row[k]=v;
  const {error} = await sb.from("pi_match_check").upsert(row, {onConflict:"match_id"});
  if(error) return toast(/pi_match_check/.test(error.message)?"الجاهزية لم تُفعَّل في القاعدة":"تعذّر: "+error.message,1);
  if(v==="unsafe") toast("سُجّلت «غير آمنة» باسمك — لك أن تمنع الانطلاق",1);
  render();
};
window.refOff = async (mid,role) => {
  const who = String(prompt(RF.OFF.find(o=>o[0]===role)[1]+" — الاسم:")||"").trim(); if(!who) return;
  const {error} = await sb.from("pi_officials").insert({match_id:mid, name:who, role, assigned_by:ME.name+" — حكم"});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`أضاف ${RF.OFF.find(o=>o[0]===role)[1]} ${who} لطاقم المباراة`);
  toast("أُضيف للطاقم باسمك"); render();
};
window.refOffDel = async id => { await sb.from("pi_officials").delete().eq("id",id); render(); };

/* ═══ 7b · قبل الصافرة — أعيد بناؤها ═══ */
T.refCheck = async () => {
  const D = await RF.load();
  const mid = (typeof PARAM!=="undefined" && PARAM) || (RF.cur(D)||{}).id;
  const m = D.mine.find(x=>x.id===mid);
  if(!m) return RF.top("قبل الصافرة","الجاهزية والطاقم") + `<main style="flex:1;padding:16px 18px 118px">${RF.empty("لا تعيين عليك")}</main>`;
  const [chkA,offs] = await Promise.all([
    q("c", sb.from("pi_match_check").select("*").eq("match_id",m.id).limit(1)),
    q("o", sb.from("pi_officials").select("*").eq("match_id",m.id))
  ]);
  const chk = chkA[0] || {};
  const js = RF.joinsOf(D,m.id);
  const pfOf = n => D.pf.find(p=>p.name===n) || {};
  const minors = js.filter(j=>{const p=pfOf(j.player_name); return p.age && p.age<18;});
  const dur = +m.duration_min||90, halves = +m.halves||2;
  const doneChk = RF.CHK.filter(([k])=>chk[k]).length;
  const unsafe = RF.CHK.some(([k,,,kind])=>chk[k]==="unsafe" && kind==="safety");
  const ready = doneChk===RF.CHK.length && js.length>=6 && !unsafe;

  return RF.top("قبل الصافرة", esc(m.title)) + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${RF.disc(unsafe?"#e8531f":null)}
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        <div style="flex:none;text-align:center"><b class="ltr" style="display:block;font-size:34px;font-weight:700;color:${ready?"#7fd7a4":unsafe?"#e8531f":"#f5c518"}">${doneChk}/${RF.CHK.length}</b>
          <span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">فُحصت</span></div>
        <div style="flex:1;min-width:0">
          <b style="display:block;font-size:15px;font-weight:900">${unsafe?"عنصر غير آمن — لك أن تمنع الانطلاق":ready?"الملعب جاهز":"أكمل فحصك"}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:4px;line-height:1.8">${esc(m.venue||"—")} · ${esc(m.match_date||"")} <span class="ltr">${esc(m.match_time||"")}</span> · عيّنك ${esc(m.organizer_name||"المنظّم")}</span></div>
      </div></div>

    ${RF.card(`${RF.h("مدة المباراة")}${RF.sub("تُثبَّت قبل الصافرة — والساعة تحسب دقائقك بعدها بلا كتابة")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${RF.DUR.map(([d,h])=>`<button onclick="refSetDur('${m.id}',${d},${h})" style="flex:1;min-width:74px;background:${dur===d&&halves===h?"#151a2e":"#faf8f3"};color:${dur===d&&halves===h?"#faf8f3":"#5b6078"};border:1px solid ${dur===d&&halves===h?"#151a2e":"#e9e4d8"};border-radius:12px;padding:11px 6px;font-family:Cairo;cursor:pointer;text-align:center">
          <b class="ltr" style="display:block;font-size:15px;font-weight:700">${d}</b><span style="font-size:9px;font-weight:900">دقيقة · <span class="ltr">${h}</span> أشواط</span></button>`).join("")}
      </div>`)}

    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("جاهزية الملعب")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">بتوقيعك — لا بقول المنظّم</span></div>
      ${RF.CHK.map(([k,lb,g,kind])=>{const v=chk[k], VS=RF.CHKV(kind);
        return `<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
          ${RF.ic(g, v?VS[v][2]:"#f2f0ea", v?VS[v][1]:"#b0b5c6")}
          <b style="flex:1;min-width:0;font-size:11.5px">${lb}</b>
          <div style="display:flex;gap:4px;flex:none">
            ${Object.entries(VS).map(([kv,V])=>`<button onclick="refChk('${m.id}','${k}','${kv}')" style="background:${v===kv?V[1]:"#faf8f3"};color:${v===kv?"#fff":"#8a8fa5"};border:1px solid ${v===kv?V[1]:"#e9e4d8"};border-radius:8px;padding:6px 9px;font:900 9.5px Cairo;cursor:pointer">${V[0]}</button>`).join("")}
          </div></div>`;}).join("")}
      ${unsafe?`<div style="margin-top:11px;background:#fdeee8;border:1px solid #f3cdbe;border-radius:12px;padding:11px;font-size:10.5px;color:#a83b25;font-weight:800;line-height:1.8">سجّلتَ عنصر سلامة غير آمن. لك أن تمنع الانطلاق — والمنع يُسجَّل باسمك وسببك، ولا يملك المنظّم نقضه. نقص المستلزمات يُسجَّل ولا يمنع.</div>`:""}`)}

    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("طاقم المباراة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${offs.length}</span></span></div>
      ${RF.sub("المساعدون حكّام يوقّعون معك · ومسجّل الطاولة يُدخل ولا يوقّع")}
      ${RF.OFF.map(([role,lb,kind])=>{const o=offs.find(x=>x.role===role);
        return `<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
          ${o?RF.av(o.name,32):RF.ic(kind==="حكم"?"◉":"▤","#f2f0ea","#b0b5c6")}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;color:${o?"#151a2e":"#8a8fa5"}">${o?esc(o.name):lb}</b>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${o?lb+" · "+(kind==="حكم"?"يوقّع معك":"يُدخل ولا يوقّع"):"لم يُسنَد"}</span></div>
          ${o?`<button onclick="refOffDel('${o.id}')" style="flex:none;background:none;border:0;color:#a83b25;font:900 14px Cairo;cursor:pointer">×</button>`
             :`<button onclick="refOff('${m.id}','${role}')" style="flex:none;background:#efedff;color:#4636e3;border:0;border-radius:9px;padding:7px 11px;font:900 10px Cairo;cursor:pointer">＋ أسنِد</button>`}</div>`;}).join("")}`)}

    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("الكشف")}<span style="font-size:10px;color:${js.length>=6?"#2c6e49":"#a83b25"};font-weight:900"><span class="ltr">${js.length}</span> لاعبًا</span></div>
      ${js.length?`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:11px">
        ${js.map(j=>{const p=pfOf(j.player_name);
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center">
            ${RF.av(j.player_name,42,{url:p.avatar_url})}
            <span style="font-size:9px;font-weight:900">${esc(String(j.player_name).split(" ")[0])}</span>
            ${p.age&&p.age<18?`<span style="font-size:8px;font-weight:900;color:#c78c00">قاصر</span>`:""}</div>`;}).join("")}</div>`
      :RF.empty("لا لاعبين مسجَّلين — لا تُدار مباراة بلا كشف")}`)}

    ${minors.length?RF.note(`<span class="ltr">${minors.length}</span> قاصرًا في الكشف. يلعبون <b>بإذن أوليائهم الأول</b> — ولا يُستأذن في كل مباراة. وإصابة القاصر تُبلَّغ وليّه فورًا باسمك ووقتها.`):""}

    <button onclick="${ready?`refStart('${m.id}')`:`toast('${unsafe?"عنصر غير آمن — قرارك المنع أو تعديل التقييم":"أكمل الفحص والكشف أولًا"}',1)`}" style="background:${ready?"#e8531f":"#e9e4d8"};color:${ready?"#fff":"#8a8fa5"};border:0;border-radius:14px;padding:15px;font:900 13.5px Cairo;cursor:pointer;${ready?"box-shadow:0 8px 18px rgba(232,83,31,.3)":""}">🔔 صافرة البداية — وتبدأ الساعة</button>
    ${RF.note("لك أن تعتذر عن التعيين أو تمنع الانطلاق — والسبب يُسجَّل باسمك، ولا يملك المنظّم إجبارك.")}
  </main>`;
};

/* ═══ 7c · إدارة المباراة — الساعة والتبديل باسمين ═══ */
window.refStart = async mid => {
  if(!confirm("صافرة البداية؟ تبدأ الساعة ويصير التسجيل بتوقيعك.")) return;
  const {error} = await sb.from("matches").update({status:"live", kickoff_at:new Date().toISOString()}).eq("id",mid);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans("أطلق صافرة البداية"); toast("بدأت الساعة"); go("refMatch",mid);
};

/* ── منطقة الحدث: يسجّلها الحكم لحظة التوقيع، ومنها تُرسم خريطة اللمسات. اختيارية — لا تُعطّل توقيع هدف ── */
RF.ZONES = [["LA","الجناح الأيسر · الثلث الأخير"],["CA","العمق · الثلث الأخير"],["RA","الجناح الأيمن · الثلث الأخير"],
            ["LM","الجناح الأيسر · الوسط"],["CM","العمق · الوسط"],["RM","الجناح الأيمن · الوسط"]];
RF.zoneAsk = (t,who) => new Promise(res=>{
  const w=document.createElement("div");
  w.style.cssText="position:fixed;inset:0;background:rgba(21,26,46,.55);z-index:900;display:flex;align-items:flex-end;justify-content:center;font-family:Cairo";
  const cells = RF.ZONES.map(([k,lb])=>`<button data-z="${k}" style="background:#1d4a3e;border:1px solid rgba(255,255,255,.22);color:#faf8f3;border-radius:10px;padding:16px 6px;font:900 10px Cairo;cursor:pointer;line-height:1.5">${lb.split(" · ")[0]}<span style="display:block;font-size:8.5px;font-weight:700;opacity:.75;margin-top:3px">${lb.split(" · ")[1]}</span></button>`).join("");
  w.innerHTML = `<div style="background:#faf8f3;border-radius:26px 26px 0 0;width:100%;max-width:520px;padding:16px 18px calc(18px + env(safe-area-inset-bottom));direction:rtl">
    <div style="width:38px;height:4px;border-radius:99px;background:#d5d0c4;margin:0 auto 13px"></div>
    <b style="display:block;font-size:14px;font-weight:900">من أي منطقة؟</b>
    <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8;margin-top:3px">${t==="goal"?"هدف":"صناعة"} لـ${who} — المنطقة تُكتب باسمك ومنها تُرسم خريطة اللمسات. اتركها إن لم تكن متأكدًا.</span>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px">${cells}</div>
    <div style="display:flex;gap:7px;margin-top:11px">
      <button id="zskip" style="flex:1;background:#fff;border:1px solid #e9e4d8;color:#565d78;border-radius:12px;padding:13px;font:900 11.5px Cairo;cursor:pointer">سجّل بلا منطقة</button>
      <button id="zcan" style="flex:none;background:#fff;border:1px solid #e9e4d8;color:#a83b25;border-radius:12px;padding:13px 16px;font:900 11.5px Cairo;cursor:pointer">تراجع</button>
    </div></div>`;
  const done = v => { w.remove(); res(v); };
  w.querySelectorAll("[data-z]").forEach(b=>b.onclick=()=>done(b.getAttribute("data-z")));
  w.querySelector("#zskip").onclick=()=>done(null);
  w.querySelector("#zcan").onclick=()=>done("__cancel");
  w.onclick=e=>{ if(e.target===w) done(null); };
  document.body.appendChild(w);
});
window.refLog = async (mid, who) => {
  let t; try{ t = localStorage.getItem("pi_ref_"+mid); }catch(e){}
  if(!t) return toast("اختر نوع الحدث أولًا",1);
  const m = RF._m; const min = RF.min(m), half = RF.half(m);
  if(t==="yellow"||t==="red") return refCard(mid,who,t,min,half);
  if(t==="sub"){
    let out; try{ out = localStorage.getItem("pi_refsub_"+mid); }catch(e){}
    if(!out){ try{ localStorage.setItem("pi_refsub_"+mid, who); }catch(e){} toast("الخارج: "+String(who).split(" ")[0]+" — اضغط الداخل"); return render(); }
    if(out===who) return toast("اختر لاعبًا آخر للدخول",1);
    const {error} = await sb.from("match_events").insert({match_id:mid, minute:min, half, type:"sub", who:out, who_in:who, recorded_by:ME.name+" — حكم", source:"PlayIn"});
    if(error) return toast("تعذّر: "+error.message,1);
    try{ localStorage.removeItem("pi_refsub_"+mid); }catch(e){}
    await trans(`وقّع تبديلًا — خرج ${out} ودخل ${who} في الدقيقة ${min}`);
    toast(`خرج ${String(out).split(" ")[0]} · دخل ${String(who).split(" ")[0]}`); return render();
  }
  const zone = (t==="goal"||t==="assist") ? await RF.zoneAsk(t,who) : null;
  if(zone==="__cancel") return;
  const {error} = await sb.from("match_events").insert(Object.assign({match_id:mid, minute:min, half, type:t, who, recorded_by:ME.name+" — حكم", source:"PlayIn"}, zone?{zone}:{}));
  if(error) return toast(/zone/.test(error.message)?"منطقة الحدث لم تُفعَّل في القاعدة بعد — سُجّل الحدث بلا منطقة":"تعذّر: "+error.message,1);
  if(t==="goal"){ const {data:mm}=await sb.from("matches").select("score_a,score_b,team_a").eq("id",mid).single();
    if(mm){ const {data:p}=await sb.from("profiles").select("org").eq("name",who).limit(1).single();
      const a = p && String(mm.team_a||"").indexOf(String(p.org||"").replace("أكاديمية","").trim())>=0;
      await sb.from("matches").update(a?{score_a:(+mm.score_a||0)+1}:{score_b:(+mm.score_b||0)+1}).eq("id",mid); } }
  await trans(`وقّع ${(RF.EV.find(e=>e[0]===t)||[])[2]} لـ${who} في الدقيقة ${min}`);
  toast("وُقّع في الدقيقة "+min+" — بلا كتابة"); render();
};
window.refCard = (mid, who, kind, min, half) => {
  const K = kind==="red"?["طرد","#a83b25"]:["إنذار","#c78c00"];
  const sh=document.createElement("div"); sh.id="pi_sheet";
  sh.style.cssText="position:fixed;inset:0;z-index:200;background:rgba(21,26,46,.5);display:flex;align-items:flex-end;justify-content:center";
  sh.onclick=e=>{ if(e.target===sh) sh.remove(); };
  sh.innerHTML=`<div style="background:#faf8f3;width:100%;max-width:520px;border-radius:28px 28px 0 0;padding:18px 18px 24px">
    <div style="width:38px;height:4px;border-radius:99px;background:#d5d0c4;margin:0 auto 14px"></div>
    <div style="display:flex;align-items:center;gap:12px">${RF.av(who,48)}
      <div style="flex:1;min-width:0"><span style="display:block;font-size:10px;font-weight:900;color:${K[1]}">${K[0]} · الدقيقة <span class="ltr">${min}</span></span>
        <b style="display:block;font-size:15px;font-weight:900">${esc(who)}</b></div>
      <span style="width:34px;height:46px;border-radius:6px;background:${kind==="red"?"#a83b25":"#f5c518"};flex:none"></span></div>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin:14px 0 8px;line-height:1.8">لا بطاقة بلا سبب — السبب يظهر في سجل اللاعب ويقرؤه ناديه ووليّ أمره.</span>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${RF.CAUSE.map(c=>`<button onclick="refCardGo('${mid}','${RF.esn(who)}','${kind}','${c}',${min},${half})" style="background:#fff;border:1px solid #e9e4d8;border-radius:999px;padding:9px 13px;font:900 11px Cairo;cursor:pointer">${c}</button>`).join("")}
    </div>
    <button onclick="closeSheet()" style="width:100%;margin-top:14px;background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">إلغاء</button></div>`;
  document.body.appendChild(sh);
};
window.refCardGo = async (mid, who, kind, cause, min, half) => {
  const {error} = await sb.from("match_events").insert({match_id:mid, minute:min, half, type:kind, who, recorded_by:ME.name+" — حكم · "+cause, source:"PlayIn"});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`وقّع ${kind==="red"?"طردًا":"إنذارًا"} لـ${who} — ${cause}`);
  closeSheet(); toast("وُقّعت بسببها في الدقيقة "+min); render();
};
T.refMatch = async () => {
  const D = await RF.load();
  const mid = (typeof PARAM!=="undefined" && PARAM) || (RF.cur(D)||{}).id;
  const m = D.mine.find(x=>x.id===mid);
  if(!m) return RF.top("إدارة المباراة","الساعة واللمستان") + `<main style="flex:1;padding:16px 18px 118px">${RF.empty("لا مباراة تحت إدارتك")}</main>`;
  RF._m = m;
  const js = RF.joinsOf(D,m.id), evs = RF.evOf(D,m.id);
  let sel, subOut; try{ sel = localStorage.getItem("pi_ref_"+m.id); subOut = localStorage.getItem("pi_refsub_"+m.id); }catch(e){}
  const pfOf = n => D.pf.find(p=>p.name===n) || {};
  const teams = String(m.title||"").split("—")[0].split("×").map(s=>s.trim());
  const started = !!m.kickoff_at, min = RF.min(m), half = RF.half(m), dur=+m.duration_min||90;
  const offs = await q("o", sb.from("pi_officials").select("*").eq("match_id",m.id));
  setTimeout(RF.tick, 50);

  return `<div style="position:relative;background:#151a2e;padding:18px 18px 22px;border-radius:0 0 36px 36px;overflow:hidden">${RF.disc("#e8531f")}
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
      <button onclick="go('refHome')" style="width:40px;height:40px;border-radius:${RF.DROP};background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">⌂</button>
      ${started?`<div style="text-align:center"><b id="rf_clock" class="ltr" style="display:block;font-family:'Space Grotesk';font-size:24px;font-weight:700;color:#fff;line-height:1">${min}′</b><span style="font-size:9px;color:#ffd9c8;font-weight:900">الشوط <span class="ltr">${half}</span> · من <span class="ltr">${dur}</span></span></div>`
        :`<span style="background:rgba(255,255,255,.14);color:#faf8f3;border-radius:999px;padding:6px 12px;font-size:10.5px;font-weight:900">لم تبدأ بعد</span>`}
      <button onclick="refWhistle('${m.id}')" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);color:#faf8f3;border-radius:12px;padding:9px 12px;font:900 10.5px Cairo;cursor:pointer">🔔 نهاية</button>
    </div>
    <div style="position:relative;text-align:center;margin-top:12px;color:#faf8f3">
      <div style="display:flex;align-items:center;justify-content:center;gap:18px">
        <div style="text-align:center"><span style="width:44px;height:44px;border-radius:14px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:17px;font-weight:900;margin:0 auto">${esc(ACD.ini(teams[0]||"؟"))}</span><span style="display:block;font-size:10px;font-weight:900;margin-top:5px">${esc(teams[0]||"")}</span></div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:32px;font-weight:700">${m.score_a==null?"0":m.score_a}–${m.score_b==null?"0":m.score_b}</b>
        <div style="text-align:center"><span style="width:44px;height:44px;border-radius:14px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:17px;font-weight:900;margin:0 auto">${esc(ACD.ini(teams[1]||"؟"))}</span><span style="display:block;font-size:10px;font-weight:900;margin-top:5px">${esc(teams[1]||"")}</span></div>
      </div>
      ${offs.length?`<span style="display:block;font-size:9.5px;color:#c6cade;font-weight:700;margin-top:10px">الطاقم: ${offs.map(o=>esc(String(o.name).split(" ")[0])).join(" · ")}</span>`:""}
    </div></div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${!started?RF.card(`<div style="display:flex;gap:12px;align-items:center">${RF.ic("◔","#fff6d6","#c78c00")}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px">لم تُطلق الصافرة</b>${RF.sub("ابدأ من «قبل الصافرة» لتعمل الساعة")}</div>
      <button onclick="go('refCheck','${m.id}')" style="flex:none;background:#4636e3;color:#fff;border:0;border-radius:11px;padding:9px 13px;font:900 10.5px Cairo;cursor:pointer">افتح ←</button></div>`):""}

    ${RF.card(`${RF.h("١ · اختر الحدث")}${RF.sub("الدقيقة تُحسب من الساعة — لا تكتبها")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${RF.EV.map(([k,g,lb,c])=>`<button onclick="refPick('${m.id}','${k}')" style="flex:1;min-width:64px;background:${sel===k?c:"#faf8f3"};color:${sel===k?(k==="yellow"?"#151a2e":"#fff"):"#5b6078"};border:1px solid ${sel===k?c:"#e9e4d8"};border-radius:12px;padding:11px 6px;font:900 11px Cairo;cursor:pointer;text-align:center"><span style="display:block;font-size:16px">${g}</span>${lb}</button>`).join("")}
      </div>`)}

    ${RF.card(`${RF.h(sel==="sub"?(subOut?"٢ · اضغط <b style=\"color:#2c6e49\">الداخل</b>":"٢ · اضغط <b style=\"color:#a83b25\">الخارج</b>"):"٢ · اضغط اللاعب")}
      ${RF.sub(sel==="sub"&&subOut?`الخارج: <b style="color:#a83b25">${esc(subOut)}</b> — اضغط من يدخل مكانه`:sel?`الحدث: <b style="color:#151a2e">${(RF.EV.find(e=>e[0]===sel)||[])[2]}</b>${started?` · الدقيقة <span class="ltr">${min}</span>`:""}`:"لم تختر حدثًا بعد")}
      ${js.length?`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:11px">
        ${js.map(j=>{const p=pfOf(j.player_name), isOut=subOut===j.player_name;
          return `<button onclick="refLog('${m.id}','${RF.esn(j.player_name)}')" style="background:${isOut?"#fdeee8":sel?"#fff":"#faf8f3"};border:1.5px solid ${isOut?"#a83b25":sel?"#ddd8fb":"#e9e4d8"};border-radius:16px;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:${sel?"pointer":"default"};font-family:Cairo;opacity:${sel?1:.6}">
            ${RF.av(j.player_name,40,{url:p.avatar_url})}
            <span style="font-size:9px;font-weight:900;color:${isOut?"#a83b25":"#151a2e"}">${esc(String(j.player_name).split(" ")[0])}</span>
            ${isOut?`<span style="font-size:8px;font-weight:900;color:#a83b25">خارج ↓</span>`:""}</button>`;}).join("")}</div>
        ${subOut?`<button onclick="refSubCancel('${m.id}')" style="width:100%;margin-top:9px;background:#fff;border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:900 11px Cairo;cursor:pointer">ألغِ التبديل</button>`:""}`
      :RF.empty("لا لاعبين مسجَّلين")}`)}

    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("سجل المباراة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${evs.length}</span></span></div>
      ${evs.length?evs.map(e=>{const E=RF.EV.find(x=>x[0]===e.type)||RF.EV[4];
        return `<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">${RF.ic(E[1],E[3]+"18",E[3])}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${e.type==="sub"&&e.who_in?`<span style="color:#a83b25">↓ ${esc(e.who)}</span> · <span style="color:#2c6e49">↑ ${esc(e.who_in)}</span>`:esc(e.who)+" — "+E[2]}</b>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">وقّعه ${esc(e.recorded_by)}${e.half?` · الشوط <span class="ltr">${e.half}</span>`:""}</span></div>
          <b class="ltr" style="font-size:12.5px;color:#4636e3;flex:none">${e.minute}′</b></div>`;}).join("")
      :RF.empty("لا أحداث بعد")}`)}
    ${RF.note("الساعة تحسب دقيقتك وشوطك — أنت تضغط فقط. وتوقيعك يدخل سجل اللاعب لحظته بلا اعتماد ولا اعتراض.")}
  </main>`;
};
window.refSubCancel = mid => { try{ localStorage.removeItem("pi_refsub_"+mid); }catch(e){} render(); };

/* ═══ 7f · سجلي — إنجازات وشهادات وتسويق ═══ */
T.refLog = async () => {
  const D = await RF.load();
  const done = D.mine.filter(m=>m.status==="final");
  const evMine = D.ev.filter(e=>String(e.recorded_by||"").indexOf(ME.name)>=0);
  const [certs,offs] = await Promise.all([
    q("c", sb.from("pi_certs").select("*").eq("person",ME.name).order("year",{ascending:false})),
    q("o", sb.from("pi_officials").select("*").eq("name",ME.name))
  ]);
  const comps = {}; done.forEach(m=>{ const c=m.comp||"ودية"; comps[c]=(comps[c]||0)+1; });
  const cards = evMine.filter(e=>e.type==="yellow"||e.type==="red");
  const perM = done.length?(cards.length/done.length).toFixed(1):null;
  const finals = done.filter(m=>/نهائي|كأس|بطولة/.test(String(m.comp||"")+String(m.title||"")));
  const orgs = new Set(D.mine.map(m=>m.organizer_name).filter(Boolean));
  const ach = [
    ...(finals.length?[{g:"♛",t:`${finals.length} مباراة بطولة`,s:finals.slice(0,2).map(m=>esc(m.comp||m.title)).join(" · "),gold:1}]:[]),
    ...(done.length>=10?[{g:"★",t:`${done.length} مباراة موقّعة`,s:"سجل متّصل بلا انقطاع",gold:1}]:[]),
    ...(certs.filter(c=>c.verified_by).length?[{g:"✓",t:"اعتماد موثّق",s:certs.find(c=>c.verified_by).issuer,gold:1}]:[]),
    ...(offs.length?[{g:"◉",t:`${offs.length} مشاركة في طاقم`,s:"مساعدًا أو رابعًا",gold:0}]:[]),
    ...(perM!=null&&+perM<=2?[{g:"◍",t:"انضباط متّزن",s:`<span class="ltr">${perM}</span> بطاقة لكل مباراة`,gold:0}]:[])
  ];
  const MN=["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"];
  const now=new Date();
  const months=[...Array(6)].map((_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return {k:d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"),lb:MN[d.getMonth()]};});
  const mv = months.map(mm=>done.filter(m=>String(m.match_date||m.created_at||"").startsWith(mm.k)).length);
  const mx = Math.max(1,...mv);

  return RF.top("سجلي واعتمادي","ما وقّعتَه — وما يُسوّق لك") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${RF.disc("#f5c518")}
      <div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
        ${[["مباراة",done.length],["حدثًا",evMine.length],["بطاقة/مباراة",perM],["اعتمادًا",certs.filter(c=>c.verified_by).length]].map(([k,v])=>`<div><b class="ltr" style="display:block;font-size:21px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||RF.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}</div>
      <button onclick="shareCard('${RF.esn(ME.name)}')" style="position:relative;width:100%;margin-top:14px;background:#4636e3;color:#fff;border:0;border-radius:13px;padding:12px;font:900 12px Cairo;cursor:pointer">⇪ شارك بطاقتك — يقرؤها المنظّمون قبل أن يعيّنوك</button></div>

    ${ach.length?RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("أبرز إنجازاتك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">من سجلك لا من قولك</span></div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:11px">
        ${ach.map(a=>`<div style="display:flex;gap:11px;align-items:center;background:${a.gold?"#fff8df":"#faf8f3"};border:1px solid ${a.gold?"#f0e2b4":"#e9e4d8"};border-radius:16px;padding:11px 13px">
          <span style="width:38px;height:38px;border-radius:${RF.DROP};background:${a.gold?"linear-gradient(160deg,#f5c518,#c78c00)":"#efedff"};color:${a.gold?"#151a2e":"#4636e3"};display:grid;place-items:center;font-size:16px;flex:none">${a.g}</span>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${a.t}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${a.s}</span></div></div>`).join("")}
      </div>`):RF.card(`${RF.h("أبرز إنجازاتك")}${RF.empty("تُكتب من مبارياتك الموقّعة — لا تُكتب بيدك")}`)}

    ${done.length?RF.card(`${RF.h("مبارياتك في ستة أشهر")}
      <div style="display:flex;align-items:flex-end;gap:6px;height:82px;margin-top:10px">
        ${mv.map((v,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
          <b class="ltr" style="font-size:9px;font-weight:700;color:${v?"#4636e3":"#c9c2b2"}">${v||""}</b>
          <span style="width:100%;border-radius:6px 6px 3px 3px;background:${v?"#4636e3":"#f0ece2"};height:${Math.max(3,Math.round(v/mx*54))}px"></span>
          <span style="font-size:8px;font-weight:800;color:#8a8fa5">${months[i].lb}</span></div>`).join("")}</div>`):""}

    ${Object.keys(comps).length?RF.card(`${RF.h("بطولاتك")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${Object.entries(comps).map(([c,n])=>`<span style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:999px;padding:6px 12px;font-size:10.5px;font-weight:900">${esc(c)} · <span class="ltr">${n}</span></span>`).join("")}</div>`):""}

    ${orgs.size?RF.card(`${RF.h("من يعيّنك")}${RF.sub("ثقة متكرّرة — لا إعلان")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${[...orgs].map(o=>{const n=D.mine.filter(m=>m.organizer_name===o).length;
        return `<span style="background:#efedff;color:#4636e3;border-radius:999px;padding:6px 12px;font-size:10.5px;font-weight:900">${esc(o)} · <span class="ltr">${n}</span></span>`;}).join("")}</div>`):""}

    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("الشهادات والاعتمادات")}<button onclick="cvAdd('cert')" style="background:#4636e3;color:#fff;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">＋ اعتماد</button></div>
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
