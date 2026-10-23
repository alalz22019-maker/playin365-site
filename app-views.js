/* PlayIn365 — الدفعة ١١: سجل الاطلاع الفعلي — من فتح ملفك ومتى وبأي إذن */
const VW={};
VW.SCOPE={
  record:{ar:"السجل الرياضي",c:"#4636e3",ic:"▤"},
  readiness:{ar:"حالة الجاهزية",c:"#c78c00",ic:"◈"},
  medical:{ar:"الملف الطبي",c:"#1d4a3e",ic:"🔒"},
  profile:{ar:"الملف العام",c:"#8a8fa5",ic:"◉"}
};
VW.rel=d=>{
  const s=(Date.now()-new Date(d))/1000;
  if(s<3600) return "قبل قليل";
  if(s<86400) return `قبل ${Math.floor(s/3600)} ساعة`;
  if(s<604800) return `قبل ${Math.floor(s/86400)} يوم`;
  if(s<2592000) return `قبل ${Math.floor(s/604800)} أسبوع`;
  return `قبل ${Math.floor(s/2592000)} شهر`;
};

/* تسجيل اطّلاع — يُنادى من كل شاشة تفتح ملف غيرك */
VW.due=(subject,scope)=>{
  if(!subject||subject===ME.name) return false;
  const key=`pi_vseen_${subject}_${scope}`;
  try{ const last=+(localStorage.getItem(key)||0); if(Date.now()-last<6e5) return false; localStorage.setItem(key,String(Date.now())); }catch(e){}
  return true;
};
/* دفعة واحدة، بلا انتظار — الشاشة تُرسم أولًا */
VW.logMany=(subjects,scope,permit)=>{
  const rows=(subjects||[]).filter(n=>VW.due(n,scope))
    .map(n=>({subject:n,viewer:ME.name,viewer_role:ME.role,scope:scope||"record",permit:permit||null}));
  if(!rows.length) return;
  Promise.resolve().then(()=>sb.from("pi_views").insert(rows)).catch(()=>{});
};
VW.log=(subject,scope,permit)=>VW.logMany([subject],scope,permit);

T.viewLog=async()=>{
  const subject=PARAM||ME.name;
  const own=subject===ME.name;
  const rows=await q("v",sb.from("pi_views").select("*").eq("subject",subject).order("created_at",{ascending:false}).limit(60));
  const byScope={};rows.forEach(r=>{byScope[r.scope]=(byScope[r.scope]||0)+1});
  const viewers=[...new Set(rows.map(r=>r.viewer))].length;
  const week=rows.filter(r=>(Date.now()-new Date(r.created_at))/864e5<=7).length;
  const med=rows.filter(r=>r.scope==="medical");
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
    <div style="position:relative">
      <b style="font-size:15px;color:#f5c518">سجل الاطلاع${own?"":" — "+esc(subject)}</b>
      <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">من فتح ${own?"ملفك":"هذا الملف"} ومتى وبأي إذن. قراءة فقط — لا يُحرَّر ولا يُحذف، حتى منك.</span>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px">
        ${[[rows.length,"اطّلاعًا"],[viewers,"جهة مختلفة"],[week,"هذا الأسبوع"]].map(([v,l])=>`<div style="background:rgba(255,255,255,.08);border:1px solid #333a55;border-radius:14px;padding:11px 8px;text-align:center">
          <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:19px;color:#faf8f3">${v}</b>
          <span style="font-size:8.5px;color:#9aa0b8;font-weight:800">${l}</span></div>`).join("")}
      </div>
    </div>
  </div>

  ${rows.length?(()=>{ const days=[...Array(7)].map((_,i)=>{
      const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(6-i));
      const nx=new Date(d); nx.setDate(nx.getDate()+1);
      const hit=rows.filter(r=>{const t=new Date(r.created_at); return t>=d&&t<nx;});
      return {d, n:hit.length, med:hit.filter(r=>r.scope==="medical").length,
        lb:["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"][d.getDay()], today:i===6};
    });
    const mx=Math.max(...days.map(x=>x.n),1);
    return `<div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
      <b class="h2" style="color:#4636e3">سجل الوصول — آخر سبعة أيام</b>
      <span style="font-size:9.5px;font-weight:900;color:#8a8fa5">أعلى يوم <span class="ltr">${mx}</span></span></div>
    <span class="muted" style="display:block;line-height:1.9;margin-bottom:13px">عمودٌ لكل يوم بعدد من فتح ${own?"ملفك":"هذا الملف"} فيه — واليوم الخالي «—» لا صفرًا.</span>
    <div style="display:flex;align-items:flex-end;gap:6px;height:84px">
      ${days.map(x=>`<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%">
        <span class="ltr" style="font-size:9.5px;font-weight:900;color:${x.n?(x.today?"#c78c00":"#565d78"):"#c9cdd9"}">${x.n||"—"}</span>
        <span style="width:100%;height:${x.n?Math.max(8,x.n/mx*58):3}px;border-radius:6px 6px 3px 3px;background:${x.n?(x.med?"#2c8471":x.today?"#f5c518":"#4636e3"):"#f0ece2"}"></span>
      </div>`).join("")}
    </div>
    <div style="display:flex;gap:6px;margin-top:6px">
      ${days.map(x=>`<span style="flex:1;text-align:center;font-size:8.5px;font-weight:800;color:${x.today?"#c78c00":"#8a8fa5"}">${x.lb}</span>`).join("")}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;border-top:1px solid #f0ece2;padding-top:11px">
      <span style="font-size:9.5px;font-weight:800;color:#4636e3">■ اطّلاع عادي</span>
      <span style="font-size:9.5px;font-weight:800;color:#c78c00">■ اليوم</span>
      <span style="font-size:9.5px;font-weight:800;color:#2c8471">■ فيه اطّلاع طبي 🔒</span></div>
    ${med.length?`<span style="display:block;font-size:10px;color:#1d4a3e;font-weight:800;line-height:1.85;margin-top:9px">الطبي اطُّلع عليه <span class="ltr">${med.length}</span> مرة — كل مرة باسم المختص وإذنٍ منفصل.</span>`
      :`<span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;line-height:1.85;margin-top:9px">لا اطّلاع طبيًّا في السجل كله — الطبي لا يُفتح إلا بإذن منفصل.</span>`}
  </div>`;})():""}

  ${rows.length?`<div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">ما اطُّلع عليه</b>
    ${Object.entries(byScope).sort((a,b)=>b[1]-a[1]).map(([k,n])=>{const S=VW.SCOPE[k]||VW.SCOPE.record;const mx=Math.max(...Object.values(byScope),1);
      return `<div style="margin-bottom:9px">
      <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;margin-bottom:4px">
        <span style="color:#565d78">${S.ic} ${S.ar}</span><span class="ltr" style="color:${S.c};font-family:'Space Grotesk'">${n}</span></div>
      <div style="height:8px;background:#f0ece2;border-radius:99px;overflow:hidden"><div style="width:${n/mx*100}%;height:100%;background:${S.c};border-radius:99px"></div></div></div>`}).join("")}
  </div>`:""}

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#4636e3">كل اطّلاع باسمه</b>
      <span class="muted">الأحدث أولًا</span></div>
    ${rows.length?rows.map(r=>{const S=VW.SCOPE[r.scope]||VW.SCOPE.record;
      return `<div style="background:#faf8f3;border:1px solid #e9e4d8;border-inline-start:3px solid ${S.c};border-radius:15px;padding:11px 13px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <div style="min-width:0">
          <b style="font-size:12px;display:block">${esc(r.viewer||"غير معروف")}${r.viewer_role?` <span style="font-size:9.5px;font-weight:800;color:#8a8fa5">— ${esc(roleAr[r.viewer_role]||r.viewer_role)}</span>`:""}</b>
          <span style="display:block;font-size:10.5px;font-weight:800;color:${S.c};margin-top:3px">${S.ic} ${S.ar}</span></div>
        <span class="muted" style="flex:none;text-align:end">${VW.rel(r.created_at)}<span style="display:block;font-size:9px" class="ltr">${new Date(r.created_at).toLocaleString("en-GB")}</span></span></div>
      ${r.permit?`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:9px;padding:6px 9px;margin-top:8px">
        <span style="font-size:9.5px;font-weight:800;color:#8a8fa5">بإذن: </span><span style="font-size:10px;font-weight:800;color:#565d78">${esc(r.permit)}</span></div>`:""}
    </div>`}).join("")
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:20px;text-align:center">
        <b style="font-size:12.5px">لم يفتح ${own?"ملفك":"هذا الملف"} أحد بعد</b>
        <span class="muted" style="display:block;margin-top:5px;line-height:1.9">كل اطّلاع مستقبلي سيظهر هنا باسم صاحبه ووقته وإذنه</span></div>`}
  </div>

  ${med.length?`<div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:20px;padding:15px 17px">
    <b style="font-size:12.5px;color:#1d4a3e;display:block;margin-bottom:6px">🔒 الاطلاع الطبي</b>
    <span style="font-size:11.5px;font-weight:700;color:#1d4a3e;line-height:1.9;display:block"><span class="ltr">${med.length}</span> اطّلاعًا على الملف الطبي — كلها من مختصين. الكشافون والأندية محجوبون عنه دائمًا بقاعدة صلبة لا إعداد.</span></div>`:""}

  ${own?`<div class="card" style="border-radius:26px">
    <b class="h2" style="display:block;margin-bottom:9px">تحكّمك</b>
    <div class="lrow" onclick="go('privacy')" style="cursor:pointer"><span class="ic">🔒</span><div style="flex:1"><b style="font-size:12px">دوائر الرؤية — من يرى ماذا</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
    <div class="lrow" onclick="go('publicView')" style="cursor:pointer"><span class="ic">◉</span><div style="flex:1"><b style="font-size:12px">ملفي كما يراه الآخرون</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
    <span class="muted" style="display:block;margin-top:9px;line-height:1.9">سحب الإذن يوقف الاطّلاع من لحظته — ولا يمسح ما سُجّل قبله.</span>
  </div>`:""}
  <div class="dnote">السجل قراءة فقط — لا يُحرَّر ولا يُحذف، حتى من صاحب الملف. هذه هي قيمته: لو أمكن تعديله لم يكن سجلًا.</div>
  </main>`;
};

/* ── التركيب: تسجيل الاطّلاع في الشاشات التي تفتح ملفات الغير ── */
(function(){
  Object.assign(TITLES,{viewLog:"سجل الاطلاع"});

  /* الكشاف: بطاقات اللاعبين في قائمة المتابعة */
  const _sc=T.scout;
  if(_sc) T.scout=async()=>{
    const body=await _sc();
    try{
      const watch=(()=>{try{return JSON.parse(localStorage.getItem("pi_watch_"+ME.id)||"[]")}catch(e){return []}})();
      VW.logMany(watch.slice(0,8),"record","قائمة متابعة الكشاف");
    }catch(e){}
    return body;
  };

  /* الطبي: فتح لوحة الحالات = اطّلاع طبي على من فيها */
  const _md=T.medical;
  if(_md) T.medical=async()=>{
    const body=await _md();
    try{
      const org=ME.org||"";
      const names=[...new Set((body.match(/<b style="font-size:12px">([^<]+)<\/b>/g)||[]).map(m=>m.replace(/<[^>]+>/g,"")))];
      VW.logMany(names.slice(0,10),"medical","المختص الطبي — حصري");
    }catch(e){}
    return body;
  };

  /* المدرب: لوحة الفريق = اطّلاع على جاهزية لاعبيه */
  const _sq=T.squad;
  if(_sq) T.squad=async()=>{
    const body=await _sq();
    try{
      const names=[...new Set((body.match(/<b style="font-size:12px">([^<]+)<\/b>/g)||[]).map(m=>m.replace(/<[^>]+>/g,"")))];
      VW.logMany(names.slice(0,10),"readiness","مدرب الجهة");
    }catch(e){}
    return body;
  };

  /* ولي الأمر: يرى سجل اطّلاع ابنه */
  const _gd=T.guardian;
  if(_gd) T.guardian=async()=>{
    const body=await _gd();
    const linked=(()=>{try{return JSON.parse(localStorage.getItem("pi_children_"+ME.id)||"[]")}catch(e){return []}})();
    const kid=linked[0];
    if(!kid) return body;
    let n=0;
    try{ n=(await q("v",sb.from("pi_views").select("id").eq("subject",kid))).length; }catch(e){}
    const row=`<div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:6px">الرقابة</b>
      <div class="lrow" onclick="go('viewLog','${esc(kid)}')" style="cursor:pointer">
        <span class="ic">◉</span>
        <div style="flex:1;min-width:0"><b style="font-size:12px">سجل الاطلاع على ملف ${esc(kid.split(" ")[0])}</b>
          <span class="muted" style="display:block">${n?`<span class="ltr">${n}</span> اطّلاعًا مسجَّلًا باسم أصحابه`:"لا اطّلاع بعد"}</span></div>
        <span style="color:#4636e3;font-weight:900">←</span></div></div>`;
    return body.replace("</main>",row+"</main>");
  };

  /* اللاعب: منفذ من الخصوصية وملفي */
  const _pv=T.privacy;
  if(_pv) T.privacy=async()=>{
    const body=await _pv();
    let n=0;
    try{ n=(await q("v",sb.from("pi_views").select("id").eq("subject",ME.name))).length; }catch(e){}
    const row=`<div class="card" style="border-radius:26px">
      <div class="lrow" onclick="go('viewLog')" style="cursor:pointer">
        <span class="ic">◉</span>
        <div style="flex:1;min-width:0"><b style="font-size:12px">سجل الاطلاع — من فتح ملفك ومتى</b>
          <span class="muted" style="display:block">${n?`<span class="ltr">${n}</span> اطّلاعًا باسم صاحبه وإذنه`:"لا اطّلاع بعد"}</span></div>
        <span style="color:#4636e3;font-weight:900">←</span></div></div>`;
    return body.replace("</main>",row+"</main>");
  };

  const _pp=P3&&P3.playerProfile;
  if(_pp) P3.playerProfile=async()=>{
    const body=await _pp();
    const row=`<div class="lrow" onclick="go('viewLog')" style="cursor:pointer"><span class="ic">◉</span><div style="flex:1"><b style="font-size:12px">سجل الاطلاع — من فتح ملفك</b></div><span style="color:#4636e3;font-weight:900">←</span></div>`;
    return body.replace('<b class="h2" style="display:block;margin-bottom:6px">المزيد</b>','<b class="h2" style="display:block;margin-bottom:6px">المزيد</b>'+row);
  };
})();
