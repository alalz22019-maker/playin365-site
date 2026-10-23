/* PlayIn365 — الدفعة ٨: الجهات — اختبارات القبول · استيراد اللاعبين · الفئات العمرية · الذروة والصيانة */
const OR={};

/* ═══ اختبارات القبول وموافقات الأولياء ═══ */
OR.TY={applied:{ar:"تقدّم",bg:"#efedff",fg:"#4636e3"},tested:{ar:"اختُبر",bg:"#fff6d6",fg:"#c78c00"},accepted:{ar:"قُبل",bg:"#e9f0ea",fg:"#2c6e49"},declined:{ar:"لم يُقبل",bg:"#fbeeea",fg:"#a83b25"}};
T.tryouts=async()=>{
  const org=ME.org||"";
  const ts=await q("t",sb.from("pi_tryouts").select("*").eq("org",org).order("created_at",{ascending:false}));
  const by=k=>ts.filter(t=>t.status===k).length;
  const noOk=ts.filter(t=>!t.guardian_ok&&t.status!=="declined");
  const groups=[...new Set(ts.map(t=>t.group_name).filter(Boolean))].sort();
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
    <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b style="font-size:15px;color:#f5c518">اختبارات القبول</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">لا اختبار لقاصر بلا موافقة ولي أمره — والقبول قرارك يُسجَّل باسمك.</span></div>
      <div style="text-align:center;flex:none"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:24px;color:#f5c518">${ts.length}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">متقدّمًا</span></div>
    </div>
  </div>
  <div class="stat3">
    <div class="stat"><b class="ltr" style="color:#4636e3">${by("applied")}</b><span class="muted">تقدّم</span></div>
    <div class="stat"><b class="ltr" style="color:#c78c00">${by("tested")}</b><span class="muted">اختُبر</span></div>
    <div class="stat"><b class="ltr" style="color:#2c6e49">${by("accepted")}</b><span class="muted">قُبل</span></div>
  </div>
  ${noOk.length?`<div style="background:#fff6d6;border:1px solid #f0e2b4;border-radius:18px;padding:13px 15px">
    <b style="font-size:12px;color:#8a6a1e;display:block;margin-bottom:4px">موافقات ناقصة</b>
    <span style="font-size:11.5px;font-weight:700;color:#8a6a1e;line-height:1.85"><span class="ltr">${noOk.length}</span> متقدّمًا بلا موافقة ولي أمر — لا يُختبرون ولا يُقبلون حتى تُسجَّل الموافقة.</span></div>`:""}
  ${groups.length?`<div class="card" style="border-radius:22px">
    <b class="h2" style="display:block;margin-bottom:9px">توزيع الفئات</b>
    ${groups.map(g=>{const n=ts.filter(t=>t.group_name===g).length,mx=Math.max(...groups.map(x=>ts.filter(t=>t.group_name===x).length),1);
      return `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:4px"><span style="color:#565d78">${esc(g)}</span><span class="ltr" style="color:#4636e3;font-family:'Space Grotesk'">${n}</span></div>
      <div style="height:8px;background:#f0ece2;border-radius:99px;overflow:hidden"><div style="width:${n/mx*100}%;height:100%;background:#4636e3;border-radius:99px"></div></div></div>`}).join("")}</div>`:""}
  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#4636e3">المتقدّمون</b>
      <button class="btn" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px" onclick="tyAdd()">+ متقدّم</button></div>
    ${ts.length?ts.map(t=>{const S=OR.TY[t.status]||OR.TY.applied;
      return `<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:16px;padding:12px 14px;margin-bottom:8px">
      <div style="display:flex;gap:11px;align-items:center">
        <span style="width:36px;height:36px;flex:none;border-radius:50% 50% 50% 7px;background:linear-gradient(160deg,#4636e3,#2a2260);color:#fff;display:grid;place-items:center;font-size:14px;font-weight:900">${esc(t.applicant[0])}</span>
        <div style="flex:1;min-width:0"><b style="font-size:12.5px;display:block">${esc(t.applicant)}</b>
          <span class="muted" style="display:block;margin-top:2px">${esc(t.pos||"")}${t.age?` · <span class="ltr">${t.age}</span> سنة`:""}${t.group_name?" · "+esc(t.group_name):""}</span></div>
        <span style="background:${S.bg};color:${S.fg};border-radius:999px;padding:4px 11px;font-size:9.5px;font-weight:900;flex:none">${S.ar}</span></div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:9px">
        ${t.guardian_ok
          ? `<span style="background:#e9f0ea;color:#2c6e49;border-radius:6px;padding:3px 9px;font-size:9.5px;font-weight:900">موافقة ${esc(t.guardian_name||"ولي الأمر")} ✓</span>`
          : `<span style="background:#fff6d6;color:#c78c00;border-radius:6px;padding:3px 9px;font-size:9.5px;font-weight:900">بلا موافقة ولي أمر</span>`}
        ${t.note?`<span style="background:#fff;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:6px;padding:3px 9px;font-size:9.5px;font-weight:800">${esc(t.note)}</span>`:""}</div>
      <div style="display:flex;gap:6px;margin-top:10px">
        ${!t.guardian_ok?`<button class="btn" style="flex:1;padding:9px;font-size:10.5px" onclick="tyGuardian('${t.id}','${esc(t.applicant)}')">سجّل موافقة ولي الأمر</button>`
          :t.status==="applied"?`<button class="btn" style="flex:1;padding:9px;font-size:10.5px" onclick="tyStage('${t.id}','tested','${esc(t.applicant)}')">سجّل الاختبار</button>`
          :t.status==="tested"?`<button class="btn" style="flex:1;padding:9px;font-size:10.5px" onclick="tyStage('${t.id}','accepted','${esc(t.applicant)}')">اقبله</button>
            <button class="btn ghost" style="flex:1;padding:9px;font-size:10.5px" onclick="tyStage('${t.id}','declined','${esc(t.applicant)}')">لم يُقبل</button>`
          :t.status==="accepted"?`<button class="btn ghost" style="flex:1;padding:9px;font-size:10.5px" onclick="tyEnroll('${esc(t.applicant)}','${esc(t.group_name||"U18")}')">ألحقه بالمجموعة</button>`
          :`<span class="muted" style="flex:1;text-align:center;padding:9px">القرار مسجَّل باسمك — والسبب خاصّ بالمتقدّم</span>`}
      </div></div>`}).join("")
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center"><span class="muted">لا متقدّمين — أضف أول متقدّم أو استورد قائمة</span></div>`}
  </div>
  <div class="note">القاصر لا يُختبر بلا موافقة فردية من وليّه، و«لم يُقبل» لا يظهر في ملفه العام ولا يمسّ تقييمه — يُعرض له مع سببه فقط.</div>
  </main>`;
};
window.tyAdd=async()=>{
  const n=prompt("اسم المتقدّم:"); if(!n||!n.trim())return;
  const a=prompt("العمر:","15"); const p=prompt("المركز:","وسط"); const g=prompt("الفئة (مثل U16):","U16");
  const {error}=await sb.from("pi_tryouts").insert({org:ME.org||"",applicant:n.trim(),age:+a||null,pos:(p||"").trim(),group_name:(g||"").trim(),status:"applied",created_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`تسجيل متقدّم لاختبارات القبول — ${n.trim()}`);
  toast("أُضيف — ينتظر موافقة ولي الأمر"); render();
};
window.tyGuardian=async(id,name)=>{
  const g=prompt(`موافقة ولي أمر ${name}\nاسم ولي الأمر المُوافِق:`); if(!g||!g.trim())return;
  const {error}=await sb.from("pi_tryouts").update({guardian_ok:true,guardian_name:g.trim()}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`تسجيل موافقة ولي أمر — ${name} (${g.trim()})`);
  toast("سُجّلت الموافقة باسم وليّه ووقتها"); render();
};
window.tyStage=async(id,st,name)=>{
  let note=null;
  if(st==="declined"){ note=prompt(`سبب عدم القبول — يُعرض للمتقدّم فقط:`); if(note===null) return; }
  const {error}=await sb.from("pi_tryouts").update({status:st,note:note?note.trim():null}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  const ar=(OR.TY[st]||{}).ar||st;
  await trans(`اختبارات القبول — ${name}: ${ar}`);
  toast(`سُجّل «${ar}» باسمك ووقته`); render();
};
window.tyEnroll=async(name,grp)=>{
  const org=ME.org||"";
  const {error}=await sb.from("attendance").insert({org,group_name:grp,session_date:new Date().toISOString().slice(0,10),player_name:name,present:true,recorded_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إلحاق متقدّم مقبول بالمجموعة ${grp} — ${name}`);
  toast("أُلحق بالمجموعة وسُجّل حضوره اليوم"); render();
};

/* ═══ استيراد قوائم اللاعبين ═══ */
T.importPlayers=async()=>{
  const org=ME.org||"";
  const att=await q("a",sb.from("attendance").select("player_name,group_name").eq("org",org).limit(300));
  const cur=[...new Set(att.map(a=>a.player_name))].length;
  return `<main>
  <div class="stage" style="border-radius:26px">
    <b style="font-size:15px;color:#f5c518">استيراد قوائم اللاعبين</b>
    <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">الصق قائمتك سطرًا لكل لاعب — لا حاجة لإدخال ١٤٢ لاعبًا يدويًا. كل إدخال يُسجَّل باسمك.</span>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:9px">الصيغة</b>
    <div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:14px;padding:13px;font-family:'Space Grotesk';font-size:11.5px;font-weight:500;color:#565d78;line-height:2.1;direction:ltr;text-align:left;unicode-bidi:isolate">
      الاسم, الفئة, المركز, العمر<br>سعود القحطاني, U18, مهاجم, 19<br>سلطان الحربي, U18, وسط, 17</div>
    <span class="muted" style="display:block;margin-top:9px;line-height:1.9">الاسم إلزامي وما بعده اختياري. الفاصلة أو التاب يفصل الأعمدة، والسطر الأول إن كان عنوانًا يُتجاهل.</span>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:9px">الصق القائمة</b>
    <textarea id="impBox" rows="9" placeholder="سعود القحطاني, U18, مهاجم, 19&#10;سلطان الحربي, U18, وسط, 17" style="width:100%;box-sizing:border-box;background:#faf8f3;border:1px solid #e9e4d8;border-radius:14px;padding:13px;font:600 12.5px Cairo;color:#151a2e;resize:vertical;line-height:2"></textarea>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn" style="flex:1" onclick="impPreview()">راجع قبل الإدخال</button>
      <button class="btn ghost" style="flex:none;width:auto;padding:13px 17px" onclick="document.getElementById('impBox').value='';document.getElementById('impOut').innerHTML=''">أفرغ</button></div>
    <div id="impOut" style="margin-top:12px"></div>
  </div>
  <div class="card" style="border-radius:22px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><b style="font-size:12.5px">في جهتك الآن</b><span class="muted" style="display:block">لاعبون لهم حضور موثّق</span></div>
      <b class="ltr" style="font-family:'Space Grotesk';font-size:22px;color:#4636e3">${cur}</b></div>
  </div>
  <div class="note">الاستيراد ينشئ سجل حضور اليوم لكل لاعب باسمك — فيظهر في المجموعة وفي قمع المواهب فورًا. ولا يُنشئ حسابات دخول: اللاعب يسجّل بنفسه ويرتبط باسمه.</div>
  </main>`;
};
window.impParse=(txt)=>{
  const out=[],bad=[];
  txt.split(/\r?\n/).forEach((line,i)=>{
    const t=line.trim(); if(!t) return;
    const cells=t.split(/[,\t؛;]/).map(c=>c.trim());
    if(i===0&&/اسم|name/i.test(cells[0])&&cells.length>1) return;
    const name=cells[0];
    if(!name||name.length<2){ bad.push(t); return; }
    out.push({name,group:cells[1]||"",pos:cells[2]||"",age:parseInt(cells[3],10)||null});
  });
  return {rows:out,bad};
};
window.impPreview=()=>{
  const box=document.getElementById("impBox"); if(!box) return;
  const {rows,bad}=impParse(box.value||"");
  const out=document.getElementById("impOut"); if(!out) return;
  if(!rows.length){ out.innerHTML=`<div style="border:1.5px dashed #e8a48c;background:#fdf3ef;border-radius:14px;padding:14px;text-align:center"><b style="font-size:12px;color:#a83b25">لم أجد أسماء صالحة</b><span style="display:block;font-size:11px;color:#8a6a5e;font-weight:700;margin-top:4px">اكتب سطرًا لكل لاعب — الاسم أولًا</span></div>`; return; }
  const groups={};rows.forEach(r=>{groups[r.group||"بلا فئة"]=(groups[r.group||"بلا فئة"]||0)+1});
  out.innerHTML=`<div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:16px;padding:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <b style="font-size:12.5px;color:#1d4a3e">جاهز للإدخال</b>
      <b class="ltr" style="font-family:'Space Grotesk';font-size:19px;color:#2c6e49">${rows.length}</b></div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">
      ${Object.entries(groups).map(([g,n])=>`<span style="background:#fff;border:1px solid #d8e6de;color:#1d4a3e;border-radius:6px;padding:3px 10px;font-size:9.5px;font-weight:900">${esc(g)} <span class="ltr">${n}</span></span>`).join("")}</div>
    <div style="max-height:150px;overflow:auto;display:flex;flex-direction:column;gap:5px">
      ${rows.slice(0,40).map(r=>`<div style="display:flex;justify-content:space-between;gap:8px;background:#fff;border:1px solid #e6efea;border-radius:10px;padding:7px 10px">
        <span style="font-size:11px;font-weight:800">${esc(r.name)}</span>
        <span class="muted" style="flex:none">${esc(r.group||"—")}${r.pos?" · "+esc(r.pos):""}${r.age?` · <span class="ltr">${r.age}</span>`:""}</span></div>`).join("")}
      ${rows.length>40?`<span class="muted" style="text-align:center;padding:5px">و<span class="ltr">${rows.length-40}</span> غيرهم…</span>`:""}</div>
    ${bad.length?`<div style="background:#fff6d6;border:1px solid #f0e2b4;border-radius:11px;padding:9px 11px;margin-top:10px;font-size:10.5px;font-weight:700;color:#8a6a1e"><span class="ltr">${bad.length}</span> سطرًا تُخطّى لعدم صلاحيته</div>`:""}
    <button class="btn" style="margin-top:11px" onclick="impCommit()">أدخِل <span class="ltr">${rows.length}</span> لاعبًا</button>
  </div>`;
};
window.impCommit=async()=>{
  const box=document.getElementById("impBox"); if(!box) return;
  const {rows}=impParse(box.value||"");
  if(!rows.length) return toast("لا شيء لإدخاله",1);
  const org=ME.org||"", today=new Date().toISOString().slice(0,10);
  const att=rows.map(r=>({org,group_name:r.group||"U18",session_date:today,player_name:r.name,present:true,recorded_by:ME.name}));
  for(let i=0;i<att.length;i+=100){
    const {error}=await sb.from("attendance").insert(att.slice(i,i+100));
    if(error) return toast("تعذّر: "+error.message,1);
  }
  const withMeta=rows.filter(r=>r.pos||r.age);
  await trans(`استيراد ${rows.length} لاعبًا لـ${org}`);
  toast(`أُدخل ${rows.length} لاعبًا — ظهروا في المجموعات والقمع`);
  box.value=""; const out=document.getElementById("impOut"); if(out) out.innerHTML="";
  render();
};

/* ═══ الفئات العمرية والفرق ═══ */
T.teams=async()=>{
  const org=ME.org||"";
  const [att,pf,mt]=await Promise.all([
    q("a",sb.from("attendance").select("*").eq("org",org).limit(400)),
    q("p",sb.from("profiles").select("name,role,org,pos,age").not("name","is",null).limit(200)),
    q("m",sb.from("matches").select("id,title,status,organizer_name").limit(40))
  ]);
  const groups={};
  att.forEach(a=>{const g=a.group_name||"بلا فئة";(groups[g]=groups[g]||new Set()).add(a.player_name)});
  const keys=Object.keys(groups).sort();
  const coaches=pf.filter(p=>p.role==="coach"&&p.org===org);
  const posOf=n=>{const p=pf.find(x=>x.name===n);return p&&p.pos?p.pos:""};
  const g0=(()=>{try{return localStorage.getItem("pi_team_"+org)||keys[0]||""}catch(e){return keys[0]||""}})();
  const members=g0&&groups[g0]?[...groups[g0]]:[];
  const sessions=g=>att.filter(a=>(a.group_name||"بلا فئة")===g).length;
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b style="font-size:15px;color:#f5c518">الفرق والفئات العمرية</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">${esc(org)} · <span class="ltr">${keys.length}</span> فئة · <span class="ltr">${coaches.length}</span> مدرب</span></div>
      <div style="text-align:center;flex:none"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:24px;color:#f5c518">${new Set(att.map(a=>a.player_name)).size}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">لاعبًا</span></div>
    </div>
  </div>
  ${keys.length?`<div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">الفئات</b>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${keys.map(g=>{const n=groups[g].size,mx=Math.max(...keys.map(k=>groups[k].size),1);
        return `<div onclick="teamPick('${esc(org)}','${esc(g)}')" style="background:${g===g0?"#f6f5ff":"#faf8f3"};border:1px solid ${g===g0?"#c9c2f5":"#e9e4d8"};border-radius:16px;padding:12px 14px;cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">
          <b style="font-size:13px">${esc(g)}</b>
          <span style="display:flex;gap:8px;align-items:center;flex:none"><span class="muted"><span class="ltr">${sessions(g)}</span> حصة</span><b class="ltr" style="font-family:'Space Grotesk';font-size:15px;color:#4636e3">${n}</b></span></div>
        <div style="height:8px;background:#f0ece2;border-radius:99px;overflow:hidden"><div style="width:${n/mx*100}%;height:100%;background:${g===g0?"#4636e3":"#b9b0f5"};border-radius:99px"></div></div></div>`}).join("")}
    </div>
    <button class="btn ghost" style="margin-top:11px" onclick="teamAdd('${esc(org)}')">+ فئة جديدة</button>
  </div>
  ${members.length?`<div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2">قائمة ${esc(g0)}</b><span class="muted"><span class="ltr">${members.length}</span> لاعبًا</span></div>
    ${members.map(n=>`<div class="lrow"><span class="ic">${esc(n[0])}</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(n)}</b>
        <span class="muted" style="display:block">${esc(posOf(n)||"لاعب")} · <span class="ltr">${att.filter(a=>a.player_name===n).length}</span> حصة</span></div>
      <button onclick="teamMove('${esc(org)}','${esc(n)}')" style="background:none;border:0;color:#4636e3;font:900 10.5px Cairo;cursor:pointer;flex:none">انقله</button></div>`).join("")}
  </div>`:""}
  ${coaches.length?`<div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:10px">الجهاز الفني</b>
    ${coaches.map(c=>{const own=att.filter(a=>a.recorded_by===c.name);
      const gs=[...new Set(own.map(a=>a.group_name).filter(Boolean))];
      return `<div class="lrow"><span class="ic">${esc(c.name[0])}</span>
        <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(c.name)}</b>
          <span class="muted" style="display:block">${gs.length?gs.join(" · "):"بلا فئة مسندة"} · <span class="ltr">${own.length}</span> حصة موثقة</span></div></div>`}).join("")}
  </div>`:""}`
  :`<div class="card" style="border-radius:26px;text-align:center;padding:26px">
    <b style="font-size:13px">لا فئات بعد</b>
    <span class="muted" style="display:block;margin-top:5px">استورد قائمة لاعبيك لتتكوّن الفئات تلقائيًا</span>
    <button class="btn" style="margin-top:12px" onclick="go('importPlayers')">استورد القائمة</button></div>`}
  <div class="note">الفئة تتكوّن من حضور موثّق لا من إدخال منفصل — فما تراه هنا هو الواقع الفعلي لا قائمة اسمية.</div>
  </main>`;
};
window.teamPick=(org,g)=>{try{localStorage.setItem("pi_team_"+org,g)}catch(e){};render()};
window.teamAdd=async(org)=>{
  const g=prompt("اسم الفئة الجديدة (مثل U15):"); if(!g||!g.trim())return;
  const n=prompt(`أول لاعب في ${g.trim()}:`); if(!n||!n.trim())return;
  const {error}=await sb.from("attendance").insert({org,group_name:g.trim(),session_date:new Date().toISOString().slice(0,10),player_name:n.trim(),present:true,recorded_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  try{localStorage.setItem("pi_team_"+org,g.trim())}catch(e){}
  await trans(`إنشاء فئة ${g.trim()} — أول لاعب ${n.trim()}`);
  toast("أُنشئت الفئة"); render();
};
window.teamMove=async(org,name)=>{
  const g=prompt(`نقل ${name} — الفئة الجديدة:`); if(!g||!g.trim())return;
  const {error}=await sb.from("attendance").insert({org,group_name:g.trim(),session_date:new Date().toISOString().slice(0,10),player_name:name,present:true,recorded_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`نقل لاعب إلى ${g.trim()} — ${name}`);
  toast("نُقل وسُجّل النقل باسمك"); render();
};

/* ═══ الذروة والصيانة — شبكة ساعات متعددة الملاعب ═══ */
OR.SL={booked:{ar:"محجوز",c:"#4636e3"},peak:{ar:"ذروة",c:"#f5c518"},maint:{ar:"صيانة",c:"#e8531f"},free:{ar:"متاح",c:"#efedff"}};
T.pitches=async()=>{
  /* المنظّم لا يملك ملعبًا — يرى شبكة الملعب الذي يحجز فيه، والتعديل لمالكه لا له */
  let venue=ME.org||"", own=true;
  let sl=await q("s",sb.from("pi_slots").select("*").eq("venue",venue));
  if(!sl.length){
    const mine=await q("bm",sb.from("bookings").select("venue,who").eq("who",ME.name).limit(50));
    const cand=(mine[0]||{}).venue;
    if(cand){ venue=cand; own=false; sl=await q("s2",sb.from("pi_slots").select("*").eq("venue",venue)); }
  }
  const bk=await q("b",sb.from("bookings").select("*").eq("venue",venue));
  const HOURS=[18,19,20,21,22,23];
  const pitches=[...new Set(sl.map(s=>s.pitch))].sort();
  const cell=(p,h)=>sl.find(s=>s.pitch===p&&s.hour===h);
  const total=pitches.length*HOURS.length||1;
  const bookedN=sl.filter(s=>s.state==="booked").length;
  const maintN=sl.filter(s=>s.state==="maint").length;
  const occ=Math.round(bookedN/total*100);
  const rev=bk.filter(b=>b.status==="paid").reduce((s,b)=>s+(+b.price||0),0);
  const perHour=HOURS.map(h=>sl.filter(s=>s.hour===h&&s.state==="booked").length);
  const peakHour=HOURS[perHour.indexOf(Math.max(...perHour))];
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b style="font-size:15px;color:#f5c518">${esc(venue)}</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px"><span class="ltr">${pitches.length}</span> ملاعب · إشغال <span class="ltr">${occ}٪</span>${maintN?` · <span class="ltr">${maintN}</span> ساعة صيانة`:""}</span></div>
      <div style="text-align:center;flex:none"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:22px;color:${rev?"#f5c518":"#8a93b0"}">${rev?rev.toLocaleString("en"):"—"}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">إيراد ر.س</span></div>
    </div>
  </div>
  ${pitches.length?`<div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <b class="h2" style="color:#4636e3">إشغال الليلة — شبكة الساعات</b>
      <span class="muted"><span class="ltr">6م → 12م</span></span></div>
    <div style="display:grid;grid-template-columns:auto repeat(6,1fr);gap:4px;font-size:9px;font-weight:900;text-align:center;color:#8a8fa5">
      <span></span>${HOURS.map(h=>`<span class="ltr" style="color:${h===peakHour?"#c78c00":"#8a8fa5"}">${h-12}</span>`).join("")}
      ${pitches.map(p=>`<span style="text-align:start;color:#151a2e;font-size:9.5px">${esc(p)}</span>
        ${HOURS.map(h=>{const c=cell(p,h),st=c?c.state:"free",S=OR.SL[st];
          return `<span ${own?`onclick="slCycle('${esc(venue)}','${esc(p)}',${h})"`:""} title="${esc(p)} ${h}:00 — ${S.ar}" style="height:22px;background:${S.c};border-radius:4px;cursor:pointer;display:block;${st==="free"?"border:1px solid #e0dcf5;":""}"></span>`}).join("")}`).join("")}
    </div>
    <div style="display:flex;gap:11px;flex-wrap:wrap;margin-top:11px">
      ${Object.entries(OR.SL).map(([k,S])=>`<span class="muted" style="color:${k==="free"?"#8a8fa5":S.c}">■ ${S.ar}</span>`).join("")}</div>
    <span class="muted" style="display:block;margin-top:8px">${own?"اضغط أي خلية لتبديل حالتها: متاح ← محجوز ← ذروة ← صيانة. كل تبديل يُسجَّل باسمك.":"أنت ترى شبكة ملعب تحجز فيه — تبديل الحالة لمالكه، والصلاحية في القاعدة لا في الشاشة."}</span>
  </div>
  <div class="stat3">
    <div class="stat"><b class="ltr" style="color:#4636e3">${occ}%</b><span class="muted">إشغال</span></div>
    <div class="stat"><b class="ltr" style="color:#c78c00">${peakHour-12}م</b><span class="muted">ساعة الذروة</span></div>
    <div class="stat"><b class="ltr" style="color:${maintN?"#e8531f":"#2c6e49"}">${maintN}</b><span class="muted">ساعة صيانة</span></div>
  </div>
  <div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:11px">توزيع الطلب على الساعات</b>
    <div style="display:flex;align-items:flex-end;gap:5px;height:60px">
      ${perHour.map((n,i)=>`<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%"><span style="height:${Math.max(6,n/Math.max(...perHour,1)*100)}%;background:${HOURS[i]===peakHour?"#f5c518":"#4636e3"};border-radius:5px 5px 0 0;opacity:${n?1:.16};display:block"></span></div>`).join("")}</div>
    <div style="display:flex;gap:5px;margin-top:6px">${HOURS.map(h=>`<span class="ltr" style="flex:1;text-align:center;font-size:8.5px;font-weight:800;color:#8a8fa5">${h-12}م</span>`).join("")}</div>
    <span class="muted" style="display:block;margin-top:8px">الذهبي ساعة الذروة — سعّرها أعلى، وجدول الصيانة خارجها.</span>
  </div>
  <button class="btn ghost" onclick="slAddPitch('${esc(venue)}')">+ ملعب جديد</button>`
  :`<div class="card" style="border-radius:26px;text-align:center;padding:26px">
    <b style="font-size:13px">لا ملاعب مضافة</b>
    <span class="muted" style="display:block;margin-top:5px">أضف ملعبك الأول لتظهر شبكة الساعات</span>
    <button class="btn" style="margin-top:12px" onclick="slAddPitch('${esc(venue)}')">+ ملعب جديد</button></div>`}
  <div class="note">الصيانة تُخرج الساعة من الحجز فورًا — والعميل لا يرى ساعة معطّلة. الذروة وسم تسعير لا منع.</div>
  </main>`;
};
window.slCycle=async(venue,pitch,hour)=>{
  const order=["free","booked","peak","maint"];
  const cur=await q("c",sb.from("pi_slots").select("*").eq("venue",venue).eq("pitch",pitch).eq("hour",hour).limit(1));
  const st=cur[0]?cur[0].state:"free";
  const nxt=order[(order.indexOf(st)+1)%4];
  if(cur[0]){ const {error}=await sb.from("pi_slots").update({state:nxt}).eq("id",cur[0].id); if(error) return toast("تعذّر: "+error.message,1); }
  else { const {error}=await sb.from("pi_slots").insert({venue,pitch,hour,state:nxt}); if(error) return toast("تعذّر: "+error.message,1); }
  await trans(`تبديل حالة ساعة ${pitch} ${hour}:00 — ${(OR.SL[nxt]||{}).ar}`);
  toast(`${pitch} ${hour}:00 → ${(OR.SL[nxt]||{}).ar}`); render();
};
window.slAddPitch=async(venue)=>{
  const p=prompt("اسم الملعب (مثل م 4):"); if(!p||!p.trim())return;
  const rows=[18,19,20,21,22,23].map(h=>({venue,pitch:p.trim(),hour:h,state:"free"}));
  const {error}=await sb.from("pi_slots").insert(rows);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إضافة ملعب — ${p.trim()}`);
  toast("أُضيف الملعب بست ساعات متاحة"); render();
};

/* ═══ التركيب ═══ */
(function(){
  Object.assign(TITLES,{tryouts:"اختبارات القبول",importPlayers:"استيراد اللاعبين",teams:"الفرق والفئات",pitches:"الملاعب"});
  const _ap=P3&&P3.orgProfile;
  if(_ap) P3.orgProfile=async()=>{
    const body=await _ap();
    const isV=ME.role==="venue";
    const rows=isV
      ? `<div class="lrow" onclick="go('pitches')" style="cursor:pointer"><span class="ic">▦</span><div style="flex:1"><b style="font-size:12px">الملاعب — الذروة والصيانة</b></div><span style="color:#4636e3;font-weight:900">←</span></div>`
      : `<div class="lrow" onclick="go('tryouts')" style="cursor:pointer"><span class="ic">◈</span><div style="flex:1"><b style="font-size:12px">اختبارات القبول وموافقات الأولياء</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
         <div class="lrow" onclick="go('importPlayers')" style="cursor:pointer"><span class="ic">▤</span><div style="flex:1"><b style="font-size:12px">استيراد قوائم اللاعبين</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
         <div class="lrow" onclick="go('teams')" style="cursor:pointer"><span class="ic">▦</span><div style="flex:1"><b style="font-size:12px">الفرق والفئات العمرية</b></div><span style="color:#4636e3;font-weight:900">←</span></div>`;
    const extra=`<div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:6px">إدارة الجهة</b>${rows}
      <div class="lrow" onclick="go('settings')" style="cursor:pointer"><span class="ic">⚙</span><div style="flex:1"><b style="font-size:12px">الإعدادات</b></div><span style="color:#4636e3;font-weight:900">←</span></div></div>`;
    return body.replace("</main>",extra+"</main>");
  };
  const _acad=T.acad;
  if(_acad) T.acad=async()=>{
    const body=await _acad();
    const strip=`<div style="display:flex;gap:8px">
      <button onclick="go('tryouts')" style="flex:1;background:#fff;border:1px solid #e9e4d8;border-radius:18px;padding:13px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:Cairo">
        <span style="width:34px;height:34px;border-radius:50% 50% 50% 6px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:15px">◈</span>
        <span style="font-size:10.5px;font-weight:900;color:#565d78">القبول</span></button>
      <button onclick="go('teams')" style="flex:1;background:#fff;border:1px solid #e9e4d8;border-radius:18px;padding:13px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:Cairo">
        <span style="width:34px;height:34px;border-radius:50% 50% 50% 6px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:15px">▦</span>
        <span style="font-size:10.5px;font-weight:900;color:#565d78">الفئات</span></button>
      <button onclick="go('importPlayers')" style="flex:1;background:#fff;border:1px solid #e9e4d8;border-radius:18px;padding:13px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:Cairo">
        <span style="width:34px;height:34px;border-radius:50% 50% 50% 6px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:15px">▤</span>
        <span style="font-size:10.5px;font-weight:900;color:#565d78">استيراد</span></button>
    </div>`;
    return body.replace("</main>",strip+"</main>");
  };
  const _vn=T.venue;
  if(_vn) T.venue=async()=>{
    const body=await _vn();
    const link=`<button class="btn ghost" onclick="go('pitches')">شبكة الساعات — الذروة والصيانة ←</button>`;
    return body.replace("</main>",link+"</main>");
  };
})();
