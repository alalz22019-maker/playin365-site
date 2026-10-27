/* PlayIn365 — part 2: أكاديمية · ملعب · ولي · كشاف · طبي · تعاقدات · سوق · أدمن · إشعارات · الهيكل */
T.acad=async()=>{
  const org=ME.org||"أكاديميتي";
  const subs=await q("subs",sb.from("subscriptions").select("*").eq("org",org).order("paid"));
  const att=await q("att",sb.from("attendance").select("*").eq("org",org).order("created_at",{ascending:false}).limit(8));
  const due=subs.filter(s=>!s.paid);
  return `<main>
    <div class="dnote" style="background:#151a2e"><b style="color:#f5c518">الوضع الخفيف — ثلاث مهام تكفي اليوم:</b> حضور بنقرة · نتيجة المباراة · التحصيل تلقائي.</div>
    <div class="card"><b class="h2" style="display:block;margin-bottom:10px">حضور اليوم</b>
      <div class="grid2"><div class="fld" style="margin:0"><input id="at_p" placeholder="اسم اللاعب"></div><div class="fld" style="margin:0"><input id="at_g" value="U18" dir="ltr"></div></div>
      <button class="btn" style="margin-top:9px" onclick="markAtt()">سجّل حضورًا بنقرة</button>
      ${att.length?`<div style="margin-top:11px">${att.slice(0,5).map(a=>`<div class="lrow"><span class="ic">✓</span><div style="flex:1"><b style="font-size:12px">${esc(a.player_name)} · ${esc(a.group_name)}</b><span class="muted" style="display:block">سجّله ${esc(a.recorded_by)}</span></div></div>`).join("")}</div>`:""}</div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b class="h2">التحصيل</b><span class="chip ${due.length?"warn":"ok"}">${due.length?"متأخرات: "+due.length:"مكتمل ✓"}</span></div>
      ${subs.map(s=>`<div class="lrow"><div style="flex:1"><b style="font-size:12px">${esc(s.player_name)} · ${esc(s.month)}</b><span class="muted" style="display:block">${esc(s.group_name)} · <span class="ltr">${s.amount}</span> ر.س</span></div>
        ${s.paid?`<span class="chip ok">مدفوع ✓</span>`:`<button class="btn" style="width:auto;padding:8px 16px;border-radius:999px;font-size:10.5px" onclick="collect('${s.id}')">حصّل</button>`}</div>`).join("")||`<span class="muted">أضف اشتراكات لاعبيك.</span>`}
      <div class="grid2" style="margin-top:10px"><input id="sb_p" placeholder="اسم اللاعب" style="border:1px solid #e3ded2;border-radius:11px;padding:11px;font:600 12px Cairo"><input id="sb_a" dir="ltr" type="number" placeholder="450" style="border:1px solid #e3ded2;border-radius:11px;padding:11px;font:600 12px Cairo"></div>
      <button class="btn ghost" style="margin-top:8px" onclick="addSub()">أضف اشتراك سبتمبر</button></div>
    <div class="note">نموذج الأكاديمية: اشتراك و${'\u200e'}0% أو بلا اشتراك و${'\u200e'}4% — تختار واحدًا، والتبديل مرة كل موسم.</div>
  </main>`;
};
window.markAtt=async()=>{ const p=$("#at_p").value.trim(); if(!p) return toast("اكتب اسم اللاعب",1);
  const {error}=await sb.from("attendance").insert({org:ME.org||"أكاديميتي",group_name:$("#at_g").value||"U18",player_name:p,recorded_by:ME.name});
  if(error) return toast(error.message,1); toast("سُجّل الحضور"); render(); };
window.collect=async(id)=>{ await sb.from("subscriptions").update({paid:true,paid_at:new Date().toISOString()}).eq("id",id); await trans("تحصيل اشتراك"); toast("حُصّل — وصل للمشترك إيصال"); render(); };
window.addSub=async()=>{ const p=$("#sb_p").value.trim(), a=+$("#sb_a").value; if(!p||!a) return toast("الاسم والمبلغ",1);
  await sb.from("subscriptions").insert({org:ME.org||"أكاديميتي",player_name:p,month:"سبتمبر",amount:a,group_name:$("#at_g")?$("#at_g").value:"U18"}); toast("أُضيف"); render(); };

T.venue=async()=>{
  const v=ME.org||"ملعبي";
  const bs=await q("bk",sb.from("bookings").select("*").eq("venue",v).order("created_at",{ascending:false}));
  const reqs=bs.filter(b=>b.status==="requested");
  return `<main>
    <div class="stat3"><div class="stat"><b>${bs.filter(b=>b.status==="paid"||b.status==="accepted").length}</b><span class="muted">حجوزات</span></div><div class="stat"><b style="color:#c78c00">${reqs.length}</b><span class="muted">بانتظار ردّك</span></div><div class="stat"><b style="color:#2c6e49" class="ltr">${bs.filter(b=>b.status==="paid").reduce((s,b)=>s+(+b.price||0),0)}</b><span class="muted">إيراد ر.س</span></div></div>
    ${reqs.length?`<div class="card"><b class="h2" style="display:block;margin-bottom:9px">طلبات حجز — «بانتظار الاعتماد» مشروعة هنا (معاملة تجارية لا نتيجة)</b>
      ${reqs.map(b=>`<div class="lrow"><div style="flex:1"><b style="font-size:12px">${esc(b.who)}</b><span class="muted" style="display:block">${esc(b.slot)} · <span class="ltr">${b.price||0}</span> ر.س</span></div>
        <button class="btn" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px" onclick="bookAct('${b.id}','accepted')">اقبل</button>
        <button class="btn ghost" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px" onclick="bookAct('${b.id}','rejected')">ارفض</button></div>`).join("")}</div>`:""}
    <div class="card"><b class="h2" style="display:block;margin-bottom:9px">جدول اليوم</b>
      ${bs.filter(b=>b.status!=="requested"&&b.status!=="rejected").map(b=>`<div class="lrow"><div style="flex:1"><b style="font-size:12px" class="ltr">${esc(b.slot)}</b><span class="muted" style="display:block">${esc(b.who)}</span></div><span class="chip ${b.status==="paid"?"ok":b.status==="accepted"?"warn":"ok"}">${b.status==="paid"?"مدفوع":b.status==="accepted"?"مقبول — بانتظار الدفع":esc(b.status)}</span></div>`).join("")||`<span class="muted">لا حجوزات بعد.</span>`}
      <div class="grid2" style="margin-top:10px"><input id="bk_s" dir="ltr" placeholder="20–22" style="border:1px solid #e3ded2;border-radius:11px;padding:11px;font:600 12px Cairo"><input id="bk_p" dir="ltr" type="number" placeholder="120" style="border:1px solid #e3ded2;border-radius:11px;padding:11px;font:600 12px Cairo"></div>
      <button class="btn ghost" style="margin-top:8px" onclick="addSlot()">أضف ساعة شاغرة معروضة في استكشف</button></div>
  </main>`;
};
window.bookAct=async(id,st)=>{ await sb.from("bookings").update({status:st}).eq("id",id); await trans((st==="accepted"?"قبول":"رفض")+" طلب حجز"); toast(st==="accepted"?"قُبل — يدفع الطالب عبر المنصة":"رُفض"); render(); };
window.addSlot=async()=>{ const s=$("#bk_s").value.trim(); if(!s) return toast("اكتب الفترة",1);
  await sb.from("bookings").insert({venue:ME.org||"ملعبي",slot:s,who:"شاغر",status:"free",price:+$("#bk_p").value||0}); toast("أُضيفت"); render(); };

T.guardian=async()=>`<main>
  <div class="card"><b class="h2" style="display:block;margin-bottom:9px">إشراف ولي الأمر</b>
    <div class="lrow"><span class="ic">👤</span><div style="flex:1"><b style="font-size:12px">طلب تواصل — وكيل مرخّص ✓</b><span class="muted" style="display:block">موافقة فردية لكل طلب — لا شيء يمرّ بدونك</span></div>
      <button class="btn" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px" onclick="toast('وافقت — تُفتح محادثة بنسخة توثيقية لك')">وافق</button>
      <button class="btn ghost" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px" onclick="toast('رفضت — بلا أي أثر على الابن')">ارفض</button></div>
    <div class="lrow"><span class="ic">🔒</span><div style="flex:1"><b style="font-size:12px">إذن طبي مؤقت — طبيب خارجي</b><span class="muted" style="display:block"><span class="ltr">14</span> يومًا · تسحبه متى شئت</span></div><button class="btn ghost" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px" onclick="toast('سُحب الإذن فورًا وسُجّل في سجل الاطلاع')">اسحب</button></div></div>
  <div class="dnote">القاصر لا يراسله غريب: كل محادثة كشاف/وكيل تُفتح بموافقتك وبنسخة لك، وكل اطّلاع طبي مسجّل باسم صاحبه.</div></main>`;

T.scout=async()=>{
  const ps=await q("pl",sb.from("profiles").select("*").eq("role","player").limit(20));
  return `<main>
    <div class="card"><b class="h2" style="display:block;margin-bottom:9px">بحث الكشافة — صلاحياتك أوسع من الجمهور، والطبي محجوب عنك دائمًا</b>
      ${ps.map(p=>`<div class="lrow"><span class="ic" style="background:linear-gradient(160deg,#f5c518,#c78c00);color:#151a2e">${esc((p.name||"?")[0])}</span><div style="flex:1"><b style="font-size:12px">${esc(p.name)}</b><span class="muted" style="display:block">${esc(p.pos||"لاعب")}${p.age?" · "+p.age+" سنة":""}</span></div>
        <button class="btn ghost" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px" onclick="toast('أُرسل طلب التواصل — يمرّ بولي الأمر إن كان قاصرًا')">اطلب تواصلًا</button></div>`).join("")||`<span class="muted">لا لاعبين مسجّلين بعد.</span>`}</div>
  </main>`;
};

T.medical=async()=>`<main>
  <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b class="h2">حالة نشطة 🔒</b><span class="chip warn">تأهيل — أسبوع <span class="ltr">2</span>/<span class="ltr">3</span></span></div>
    <b style="font-size:12.5px">التواء كاحل — درجة أولى</b><span class="muted" style="display:block;margin-top:3px">كتبها: ${esc(ME.name)} · العودة المتوقعة: الجمعة</span>
    <div class="bar" style="margin-top:10px"><span style="width:70%;background:#2c6e49"></span></div>
    <button class="btn" style="margin-top:11px" onclick="trans('جلسة تأهيل جديدة');toast('سُجّلت الجلسة باسمك في الملف وفي سجل الاطلاع')">سجّل جلسة اليوم</button></div>
  <div class="card"><b class="h2" style="display:block;margin-bottom:8px">من يرى هذا الملف</b>
    <div class="lrow"><div style="flex:1"><b style="font-size:12px">أنت — أخصائي الجهة</b></div><span class="chip ok">دائم</span></div>
    <div class="lrow"><div style="flex:1"><b style="font-size:12px">المدرب</b><span class="muted" style="display:block">جاهزية فقط: جاهز/تدرّج/غير جاهز — بلا تشخيص</span></div><span class="chip warn">محدود</span></div>
    <div class="lrow"><div style="flex:1"><b style="font-size:12px">الكشافون</b></div><span class="chip bad">ممنوع دائمًا</span></div></div>
  <div class="dnote">كل اطّلاع يُسجّل: من فتح الملف ومتى — واللاعب أو وليّه يمنح الإذن المؤقت ويسحبه.</div></main>`;

T.deals=async()=>{
  const ds=await q("deals",sb.from("deals").select("*").order("created_at",{ascending:false}));
  const stages=["فتح","مفاوضة","عقد بقوالب الاتحاد","توقيع رقمي","دفع 2.5% + إخطار الاتحاد"];
  return `<main>
    ${ds.map(d=>`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:13px">${esc(d.player)}</b><b class="ltr" style="font-family:'Space Grotesk';color:#c78c00">${(+d.value).toLocaleString("en")} ر.س</b></div>
      <span class="muted" style="display:block;margin-top:4px">${esc(d.from_club)} ← ${esc(d.to_club)}</span>
      <div style="display:flex;gap:4px;margin-top:11px">${stages.map((s,i)=>`<span style="flex:1;height:7px;border-radius:99px;background:${i<=d.stage?"#4636e3":"#f0ece2"}"></span>`).join("")}</div>
      <span class="muted" style="display:block;margin-top:6px">المرحلة: ${stages[d.stage]}</span>
      ${d.stage<4?`<button class="btn" style="margin-top:10px" onclick="advDeal('${d.id}',${d.stage+1})">قدّم للمرحلة التالية</button>`:`<span class="chip ok" style="margin-top:10px">اكتملت — حصة المنصة <span class="ltr">2.5%</span> اقتُطعت وأُخطر الاتحاد</span>`}</div>`).join("")||""}
    <div class="card"><b class="h2" style="display:block;margin-bottom:9px">افتح صفقة (محترف بالغ فقط)</b>
      <div class="fld"><label>اللاعب</label><input id="dl_p" placeholder="الاسم"></div>
      <div class="grid2"><div class="fld"><label>من</label><input id="dl_f" placeholder="النادي البائع"></div><div class="fld"><label>إلى</label><input id="dl_t" placeholder="النادي المشتري"></div></div>
      <div class="fld"><label>قيمة العقد (ر.س)</label><input id="dl_v" dir="ltr" type="number" placeholder="12000000"></div>
      <button class="btn" onclick="newDeal()">افتح الغرفة</button></div>
    <div class="note">النسبة ثابتة <span class="ltr">2.5%</span> مهما بلغ العقد — للمستوى الاحترافي فقط، وتعديلها قرار مجلس لا زر.</div>
  </main>`;
};
window.advDeal=async(id,st)=>{ await sb.from("deals").update({stage:st}).eq("id",id); if(st===4) await trans("إتمام صفقة: دفع عبر المنصة 2.5% + إخطار الاتحاد"); toast("تقدّمت الصفقة"); render(); };
window.newDeal=async()=>{ const p=$("#dl_p").value.trim(); if(!p) return toast("اسم اللاعب",1);
  await sb.from("deals").insert({player:p,from_club:$("#dl_f").value,to_club:$("#dl_t").value,value:+$("#dl_v").value||0,stage:0}); toast("فُتحت الغرفة"); render(); };

T.market=async()=>{
  const ls=await q("list",sb.from("listings").select("*").order("created_at",{ascending:false}));
  return `<main>
    ${ls.map(l=>`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:12.5px">${esc(l.name)}</b><b class="ltr" style="font-family:'Space Grotesk'">${(+l.price).toLocaleString("en")} ر.س</b></div>
      ${l.chain?`<span class="chip ok" style="margin-top:7px">سلسلة إثبات: ${esc(l.chain)}</span>`:""}
      <button class="btn ${l.type==="auction"?"dark":""}" style="margin-top:10px" onclick="toast('${l.type==="auction"?"زايدت — أنت الأعلى الآن":"أُضيف للسلة — الدفع عبر المنصة"}')">${l.type==="auction"?"زايد":"اشترِ"}</button></div>`).join("")||`<div class="card" style="text-align:center;padding:26px"><b>السوق فارغ بعد</b></div>`}
    <div class="card"><b class="h2" style="display:block;margin-bottom:9px">أدرج منتجًا</b>
      <div class="grid2"><input id="ls_n" placeholder="الاسم" style="border:1px solid #e3ded2;border-radius:11px;padding:11px;font:600 12px Cairo"><input id="ls_p" dir="ltr" type="number" placeholder="180" style="border:1px solid #e3ded2;border-radius:11px;padding:11px;font:600 12px Cairo"></div>
      <button class="btn ghost" style="margin-top:8px" onclick="addList()">أدرج — النسبة معلنة قبل النشر</button></div>
  </main>`;
};
window.addList=async()=>{ const n=$("#ls_n").value.trim(); if(!n) return toast("الاسم",1);
  await sb.from("listings").insert({name:n,price:+$("#ls_p").value||0,seller:ME.name}); toast("أُدرج"); render(); };

T.admin=async()=>{
  const [pr,mt,tr]=await Promise.all([q("p",sb.from("profiles").select("id,name")),q("m",sb.from("matches").select("id")),q("t",sb.from("transparency").select("*").order("created_at",{ascending:false}).limit(10))]);
  return `<main>
    <div class="stat3"><div class="stat"><b>${pr.length}</b><span class="muted">حساب</span></div><div class="stat"><b style="color:#4636e3">${mt.length}</b><span class="muted">مباراة</span></div><div class="stat"><b style="color:#c78c00" class="ltr">2.5%</b><span class="muted">العقود — مقفلة</span></div></div>
    <div class="card"><b class="h2" style="display:block;margin-bottom:9px">سجل الشفافية — قراءة فقط، حتى لك</b>
      ${tr.map(t=>`<div class="lrow"><span class="ic">▤</span><div style="flex:1"><b style="font-size:12px">${esc(t.action)}</b><span class="muted" style="display:block">${esc(t.actor)} · <span class="ltr">${new Date(t.created_at).toLocaleString("en-GB")}</span></span></div></div>`).join("")||`<span class="muted">فارغ بعد.</span>`}</div>
    <div class="note">الأدمن يدير المنصة والمال — ولا يملك أي زر لتعديل نتيجة أو حدث أو تقييم.</div>
  </main>`;
};
T.adminTrans=T.admin;

T.notifications=async()=>{
  const ns=await q("nt",sb.from("notifications").select("*").eq("user_id",ME.id).order("created_at",{ascending:false}).limit(20));
  return `<main>
    ${ns.length?ns.map(n=>`<div class="card" style="padding:13px 14px;${n.kind==="decision"?"border-inline-start:3px solid #4636e3":""}"><div style="display:flex;justify-content:space-between"><b style="font-size:12px">${esc(n.title)}</b><span class="muted" class="ltr">${new Date(n.created_at).toLocaleDateString("en-GB")}</span></div><span class="muted" style="display:block;margin-top:3px">${esc(n.body)}</span></div>`).join(""):`<div class="card" style="text-align:center;padding:30px"><b style="font-size:13px">ما عندك شيء يحتاج انتباهك الآن</b></div>`}
  </main>`;
};

/* ---------- SHELL & ROUTER ---------- */
const NAV={
  player:[["⌂","الرئيسية","home"],["◎","استكشف","explore"],["FAB","","newMatch"],["▤","سجلي","records"],["◉","تقييمي","rating"]],
  coach:[["⌂","مبارياتي","orgMatch"],["◎","استكشف","explore"],["FAB","","newMatch"],["▤","أكاديمية","acad"],["◉","إشعارات","notifications"]],
  organizer:[["⌂","مبارياتي","orgMatch"],["◎","استكشف","explore"],["FAB","","newMatch"],["▤","إشعارات","notifications"],["◉","الشفافية","admin"]],
  referee:[["⌂","مبارياتي","orgMatch"],["◎","استكشف","explore"],["FAB","","newMatch"],["▤","إشعارات","notifications"],["◉","الشفافية","admin"]],
  academy:[["⌂","الخفيف","acad"],["▶","مبارياتنا","orgMatch"],["FAB","","newMatch"],["◎","استكشف","explore"],["◉","إشعارات","notifications"]],
  venue:[["⌂","اليوم","venue"],["◎","استكشف","explore"],["FAB","","venue"],["▤","إشعارات","notifications"],["◉","الشفافية","admin"]],
  guardian:[["⌂","الإشراف","guardian"],["◎","استكشف","explore"],["FAB","","explore"],["▤","إشعارات","notifications"],["◉","الطبي","medical"]],
  scout:[["⌂","الكشافة","scout"],["◎","استكشف","explore"],["FAB","","explore"],["▤","إشعارات","notifications"],["◉","السوق","market"]],
  admin:[["⌂","النبض","admin"],["◎","السوق","market"],["FAB","","newMatch"],["▤","استكشف","explore"],["◉","إشعارات","notifications"]],
  medical:[["⌂","الطبي","medical"],["◎","استكشف","explore"],["FAB","","explore"],["▤","إشعارات","notifications"],["◉","الشفافية","admin"]],
  agent:[["⌂","التعاقدات","deals"],["◎","السوق","market"],["FAB","","deals"],["▤","إشعارات","notifications"],["◉","استكشف","explore"]]
};
const TITLES={home:"الرئيسية",records:"سجلي",rating:"تقييمي",explore:"استكشف",newMatch:"إنشاء مباراة",orgMatch:"مبارياتي",live:"تسجيل مباشر",correct:"تصحيح المنظم",matchView:"مباراة",acad:"الوضع الخفيف",venue:"جدول الملعب",guardian:"الإشراف",scout:"الكشافة",medical:"الطبي 🔒",deals:"غرفة التعاقدات",market:"السوق",admin:"النبض",notifications:"الإشعارات",role:"اختيار الدور",auth:""};
function _piFail(msg){
  const a=document.querySelector("#app"); if(!a) return;
  a.innerHTML='<main><div class="card" style="border-radius:24px;text-align:center;padding:26px">'
   +'<b style="font-size:14px;display:block">تعذّر عرض الشاشة</b>'
   +'<span class="muted" style="display:block;margin:7px 0 13px;line-height:1.8">قد تكون نسخة محفوظة قديمة في متصفحك. اضغط تحديث لتحميل أحدث نسخة.</span>'
   +'<button class="btn" onclick="location.replace(location.pathname+\'?v=\'+Date.now())">تحديث الآن</button>'
   +'<span class="muted" style="display:block;margin-top:10px;direction:ltr;text-align:left;font-size:9.5px">'+String(msg).slice(0,160)+'</span></div></main>';
}
window.addEventListener("error",e=>{ const a=document.querySelector("#app"); if(a&&!a.innerHTML.trim()) _piFail(e.message); });
async function render(){ try{ await _render(); }catch(e){ console.error(e); _piFail(e&&e.message||e); } }
async function _render(){
  const app=$("#app");
  if(!ME||VIEW==="auth"){ app.innerHTML=T.auth(); return; }
  if(VIEW==="role"){ app.innerHTML=`<header class="hd">${WM()}<div style="display:flex;align-items:center;gap:9px"><span class="muted">${esc(ME.name)}</span><button onclick="signOut(this)" style="background:#fff;border:1px solid #e9e4d8;border-radius:999px;padding:6px 12px;font:900 10.5px Cairo;color:#565d78;cursor:pointer">خروج</button></div></header>`+T.role(); return; }
  app.innerHTML=`<header class="hd">${WM()}<div style="display:flex;align-items:center;gap:9px"><span class="muted">${TITLES[VIEW]||""}</span><button onclick="signOut(this)" style="background:#fff;border:1px solid #e9e4d8;border-radius:999px;padding:6px 12px;font:900 10.5px Cairo;color:#565d78;cursor:pointer">خروج</button></div></header><main><div class="skel" style="height:120px"></div><div class="skel" style="height:80px"></div></main>${navHtml()}`;
  const fn=T[VIEW]||T.home;
  const html=await fn();
  app.innerHTML=`<header class="hd">${WM()}<div style="display:flex;align-items:center;gap:9px"><span class="muted">${TITLES[VIEW]||""}</span><button onclick="signOut(this)" style="background:#fff;border:1px solid #e9e4d8;border-radius:999px;padding:6px 12px;font:900 10.5px Cairo;color:#565d78;cursor:pointer">خروج</button></div></header>${html}${navHtml()}`;
}
function navHtml(){
  const items=NAV[ME.role]||NAV.player;
  return `<nav class="nav">${items.map(([ic,lb,v])=>ic==="FAB"?`<button class="fab" onclick="go('${v}')">+</button>`:`<button class="${VIEW===v?"on":""}" onclick="go('${v}')"><i>${ic}</i>${lb}</button>`).join("")}</nav>`;
}
window.go=go; window.render=render; window.toast=toast;
window.signOut=async(btn)=>{ const label=btn?.textContent||"خروج"; if(btn){btn.disabled=true;btn.textContent="جارٍ الخروج…";} try{ const {error}=await sb.auth.signOut(); if(error) throw error; location.hash=""; }catch(e){ if(btn){btn.disabled=false;btn.textContent=label;} toast("تعذّر تسجيل الخروج: "+(e&&e.message||"حاول مرة أخرى"),1); } };
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",boot);}else{boot();}
