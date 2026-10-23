/* PlayIn365 — عمود الملعب مطابقًا للتصميم المعتمد «Venue Mobile» (6c…6h)
   يُحمّل آخرًا فيتقدّم على T.venue القديمة. كل رقم من صفوف موجودة، ولا إغلاق ولا عطل بلا اسم. */
const VN = {};
VN.dash = "—";
VN.DROP = "50% 50% 50% 6px";
VN.ic   = (g,bg,ink) => `<span style="width:32px;height:32px;flex:none;border-radius:${VN.DROP};background:${bg||"#efedff"};color:${ink||"#4636e3"};display:grid;place-items:center;font-size:14px">${g}</span>`;
VN.card = (inner,pad) => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:${pad||"16px"}">${inner}</div>`;
VN.h    = t => `<b style="display:block;font-size:13px;font-weight:900">${t}</b>`;
VN.sub  = t => `<span style="display:block;font-size:10.5px;font-weight:500;color:#8a8fa5;line-height:1.8;margin-top:3px">${t}</span>`;
VN.who  = () => (ME && ME.org) || "ملعبي";
VN.SEV  = { high:["عالٍ","#a83b25","#fdeee8"], mid:["متوسط","#c78c00","#fff6d6"], low:["منخفض","#4636e3","#efedff"] };

VN.TABS = [["vnHome","اليوم"],["vnSpaces","المساحات"],["vnGate","البوابة"],["vnFix","الصيانة"],["vnMoney","المال"],["vnProfile","الملعب"]];
VN.tabs = cur => `<div class="sx" style="display:flex;gap:6px;overflow-x:auto;padding:1px 0;flex:none">
  ${VN.TABS.map(([v,t])=>`<span onclick="go('${v}')" style="flex:none;cursor:pointer;background:${v===cur?"#4636e3":"#fff"};color:${v===cur?"#fff":"#565d78"};border:1px solid ${v===cur?"#4636e3":"#e9e4d8"};border-radius:999px;padding:8px 14px;font-size:10.5px;font-weight:${v===cur?900:800}">${t}</span>`).join("")}
</div>`;

VN.head = (title, sub) => `<div class="hd" style="padding:16px 18px 0;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
  <div style="min-width:0"><b style="display:block;font-size:20px;font-weight:900;line-height:1.9;white-space:nowrap">${title}</b>
    <span style="display:block;font-size:10.5px;font-weight:700;color:#8a8fa5;margin-top:3px">${sub}</span></div>
  <span style="flex:none;font-size:10px;font-weight:900;color:#8a8fa5">${esc(VN.who())}</span>
</div>`;

VN.load = async () => {
  const v = VN.who();
  const [bk, sp, fl, gt, tr] = await Promise.all([
    q("bk", sb.from("bookings").select("*").eq("venue",v).order("created_at",{ascending:false}).limit(300)),
    q("sp", sb.from("pi_spaces").select("*").eq("venue",v).order("name")),
    q("fl", sb.from("pi_faults").select("*").eq("venue",v).order("created_at",{ascending:false}).limit(60)),
    q("gt", sb.from("pi_gate").select("*").eq("venue",v).order("created_at",{ascending:false}).limit(40)),
    q("tr", sb.from("transparency").select("*").ilike("action","%"+v+"%").order("created_at",{ascending:false}).limit(40))
  ]);
  const paid = (bk||[]).filter(b=>b.status==="paid"||b.status==="accepted");
  const req  = (bk||[]).filter(b=>b.status==="requested");
  const free = (bk||[]).filter(b=>b.status==="free");
  return { v, bk:bk||[], sp:sp||[], fl:fl||[], gt:gt||[], tr:tr||[], paid, req, free,
           rev: paid.reduce((s,b)=>s+(+b.price||0),0) };
};

/* ═══ 6c · اليوم على الأرض ═══ */
T.vnHome = async () => {
  const D = await VN.load();
  const openFaults = D.fl.filter(f=>f.status!=="done");
  const busy = D.sp.filter(s=>s.open).length;
  const inside = D.gt.filter(g=>g.kind==="in").length - D.gt.filter(g=>g.kind==="out").length;
  /* البرتقالي للحيّ والعاجل فقط — لا لمجرّد وجود حجوزات */
  const hotFault = openFaults.some(f=>f.severity==="high");
  const hot = hotFault;
  const hotWhy = "عطل عالٍ الآن";
  return VN.head("اليوم على الأرض","ما يجري في المجمّع الآن") + VN.tabs("vnHome") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
      <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:${hot?"#e8531f":"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:${hot?1:.5};pointer-events:none"></div>
      <div style="position:relative">
        ${hot?`<span style="display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:900;color:#f5c518"><span style="width:7px;height:7px;border-radius:50%;background:#e8531f"></span>${hotWhy}</span>`:inside>0?`<span style="display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:900;color:#f5c518"><span style="width:7px;height:7px;border-radius:50%;background:#f5c518"></span><span class="ltr">${inside}</span> داخل المجمّع الآن</span>`:""}
        <b style="display:block;font-size:18px;font-weight:900;line-height:1.45;margin-top:6px">${D.sp.length?`<span class="ltr">${busy}</span> من <span class="ltr">${D.sp.length}</span> مساحات مفتوحة${inside>0?` · <span class="ltr">${inside}</span> داخل المجمّع`:""}`:"لم تُسجَّل مساحات بعد"}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;line-height:1.8;margin-top:5px">${D.sp.length ? (D.sp.filter(s=>s.open).slice(0,3).map(s=>esc(s.name)).join(" · ")||"كل المساحات مغلقة الآن") : (D.paid.length?`<span class="ltr">${D.paid.length}</span> حجزًا على ساعات غير مُسندة لمساحة — سجّل مساحاتك لتُسند إليها`:"أضف مساحاتك من شاشة المساحات")}</span>
        <button onclick="go('vnSpaces')" style="margin-top:13px;background:#4636e3;color:#fff;border:0;border-radius:14px;padding:11px 16px;font:900 12px Cairo;cursor:pointer">افتح المساحات ←</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px">
      ${[["إشغال", D.bk.length?Math.round(D.paid.length/D.bk.length*100)+"%":VN.dash, "#4636e3"],
         ["طلب معلّق", D.req.length||VN.dash, "#c78c00"],
         ["عطل مفتوح", openFaults.length||VN.dash, openFaults.length?"#a83b25":"#8a8fa5"]]
        .map(([k,val,c])=>`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:16px;padding:12px 9px;text-align:center">
        <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:19px;font-weight:700;color:${c}">${val}</b>
        <span style="font-size:9px;font-weight:800;color:#8a8fa5">${k}</span></div>`).join("")}
    </div>

    ${VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("القادم")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">${D.req.length+D.paid.length?`<span class="ltr">${Math.min(4,D.req.length+D.paid.length)}</span>`:VN.dash}</span></div>
      ${(D.req.concat(D.paid)).slice(0,4).map(b=>`<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-top:1px solid #f0ece2">
        ${VN.ic(b.status==="requested"?"◔":"●", b.status==="requested"?"#fff6d6":"#efedff", b.status==="requested"?"#c78c00":"#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(b.who||"شاغر")}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(b.slot||"—")} · ${b.status==="requested"?"بانتظار قرارك":"مؤكَّد"}</span></div>
        <b class="ltr" style="font-size:12px;color:#151a2e;flex:none">${(+b.price||0)||VN.dash}</b>
      </div>`).join("") || `<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:16px;text-align:center;margin-top:11px"><span style="font-size:10.5px;color:#8a8fa5;font-weight:700">لا حجز قادمًا — الساعات تظهر هنا لحظة يطلبها أحد</span></div>`}`)}

    ${openFaults.length?VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("يحتاج يدك")}<span style="font-size:10px;font-weight:900;color:#a83b25"><span class="ltr">${openFaults.length}</span></span></div>
      ${openFaults.slice(0,3).map(f=>{const S=VN.SEV[f.severity]||VN.SEV.low;
        return `<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-top:1px solid #f0ece2">
        ${VN.ic("⚠️",S[2],S[1])}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(f.title)}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">بلّغه ${esc(f.reported_by)}${f.space?" · "+esc(f.space):""}</span></div>
        <span style="flex:none;font-size:9px;font-weight:900;color:${S[1]}">${S[0]}</span>
      </div>`}).join("")}
      <button onclick="go('vnFix')" style="width:100%;margin-top:11px;background:#fff;color:#4636e3;border:1px solid #e9e4d8;border-radius:12px;padding:11px;font:900 11px Cairo;cursor:pointer">الصيانة كاملة ←</button>`):""}
  </main>`;
};

/* ═══ 6d · المساحات — فتح وإغلاق بسبب مكتوب ═══ */
T.vnSpaces = async () => {
  const D = await VN.load();
  return VN.head("المساحات","لا تُغلق مساحة بلا سبب مكتوب") + VN.tabs("vnSpaces") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${D.sp.length?D.sp.map(s=>`<div style="background:#fff;border:1px solid ${s.open?"#e9e4d8":"#f0e2b4"};border-radius:20px;padding:15px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        ${VN.ic(s.open?"▦":"▧", s.open?"#eaf5ee":"#fff6d6", s.open?"#2c6e49":"#c78c00")}
        <div style="flex:1;min-width:0">
          <b style="display:block;font-size:13px;font-weight:900">${esc(s.name)}</b>
          <span style="display:block;font-size:9.5px;font-weight:800;color:#8a8fa5;margin-top:3px">${s.kind?esc(s.kind):"—"}${s.capacity?` · سعة <span class="ltr">${s.capacity}</span>`:""}</span>
        </div>
        <span style="flex:none;background:${s.open?"#eaf5ee":"#fff6d6"};color:${s.open?"#2c6e49":"#8a6912"};border-radius:999px;padding:5px 11px;font-size:9.5px;font-weight:900">${s.open?"مفتوحة":"مغلقة"}</span>
      </div>
      ${!s.open&&s.closed_why?`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:13px;padding:10px 12px;margin-top:11px">
        <span style="display:block;font-size:10.5px;font-weight:800;color:#8a6912;line-height:1.75">${esc(s.closed_why)}</span>
        <span style="display:block;font-size:9px;font-weight:700;color:#b09550;margin-top:3px">أغلقها ${esc(s.closed_by||"—")}</span></div>`:""}
      <button onclick="vnToggle('${s.id}','${esc(s.name)}',${s.open?1:0})" style="width:100%;margin-top:11px;background:${s.open?"#fff":"#4636e3"};color:${s.open?"#a83b25":"#fff"};border:1px solid ${s.open?"#e9e4d8":"#4636e3"};border-radius:12px;padding:11px;font:900 11.5px Cairo;cursor:pointer">${s.open?"أغلقها بسبب":"أعد فتحها"}</button>
    </div>`).join("")
    :`<div style="border:1.5px dashed #d5d0c4;border-radius:20px;padding:22px;text-align:center">
      <b style="display:block;font-size:13px">لم تُسجَّل مساحات بعد</b>
      <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.85;margin-top:6px">المجمّع ليس ملعبًا واحدًا — سجّل كل مساحة باسمها ونوعها، وتصير قابلة للحجز والإغلاق منفردة</span></div>`}
    <button onclick="vnAddSpace()" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12px Cairo;cursor:pointer">أضف مساحة</button>
    ${VN.card(`${VN.h("لماذا السبب إلزامي")}${VN.sub("المساحة المغلقة تُخفي إيرادًا وتُربك حاجزًا. السبب المكتوب واسم من أغلقها يظهران لكل من يفتح الشاشة — فالإغلاق قرار يُسأل عنه لا زرّ.")}`)}
  </main>`;
};

window.vnAddSpace = async () => {
  const name = prompt("اسم المساحة (مثال: الملعب الرئيسي):"); if(!name) return;
  const kind = prompt("النوع (رئيسي · ٥×٥ · بادل · صالة):","رئيسي") || null;
  const cap  = prompt("السعة (اتركها فارغة إن لم تُحدَّد):","") || null;
  const {error} = await sb.from("pi_spaces").insert({venue:VN.who(), name, kind, capacity: cap?+cap:null});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إضافة مساحة — ${name} · ${VN.who()}`);
  toast("أُضيفت"); render();
};
window.vnToggle = async (id, name, isOpen) => {
  if(isOpen){
    const why = prompt(`سبب إغلاق ${name}؟\nالسبب يظهر لكل من يفتح الشاشة.`);
    if(!why) return toast("لا إغلاق بلا سبب",1);
    const {error} = await sb.from("pi_spaces").update({open:false, closed_why:why, closed_by:ME.name, updated_at:new Date().toISOString()}).eq("id",id);
    if(error) return toast("تعذّر: "+error.message,1);
    await trans(`إغلاق مساحة — ${name} · السبب: ${why}`);
    toast("أُغلقت — والسبب مسجَّل باسمك");
  } else {
    const {error} = await sb.from("pi_spaces").update({open:true, closed_why:null, closed_by:null, updated_at:new Date().toISOString()}).eq("id",id);
    if(error) return toast("تعذّر: "+error.message,1);
    await trans(`إعادة فتح مساحة — ${name}`);
    toast("أُعيد فتحها");
  }
  render();
};

/* ═══ 6e · البوابة — وصول وحجز فوري ═══ */
T.vnGate = async () => {
  const D = await VN.load();
  const today = new Date(); today.setHours(0,0,0,0);
  const arrivals = D.gt.filter(g=>new Date(g.created_at)>=today);
  return VN.head("البوابة","من وصل، ومن يقف أمامك الآن") + VN.tabs("vnGate") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("وصلوا اليوم")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">${arrivals.length?`<span class="ltr">${arrivals.length}</span>`:VN.dash}</span></div>
      ${arrivals.length?arrivals.slice(0,8).map(g=>`<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-top:1px solid #f0ece2">
        ${VN.ic(g.kind==="in"?"→":"←", g.kind==="in"?"#eaf5ee":"#f4f2ec", g.kind==="in"?"#2c6e49":"#8a8fa5")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(g.who)}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${g.space?esc(g.space)+" · ":""}سجّله ${esc(g.logged_by)}</span></div>
        <span class="ltr" style="font-size:9.5px;font-weight:700;color:#8a8fa5;flex:none">${esc(String(g.created_at||"").slice(11,16))}</span>
      </div>`).join("")
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:16px;text-align:center;margin-top:11px"><span style="font-size:10.5px;color:#8a8fa5;font-weight:700">لا وصول مسجَّلًا اليوم — سجّل أول واصل بالزر أدناه</span></div>`}
      <button onclick="vnGateLog()" style="width:100%;margin-top:11px;background:#4636e3;color:#fff;border:0;border-radius:12px;padding:12px;font:900 11.5px Cairo;cursor:pointer">سجّل وصولًا</button>`)}

    ${VN.card(`${VN.h("حجز فوري — للواقف أمامك")}${VN.sub("ساعة شاغرة تُحوَّل إلى محجوزة باسم من يقف عندك، وتُسجَّل باسمك أنت")}
      ${D.free.length?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px">
        ${D.free.slice(0,9).map(b=>`<button onclick="vnQuick('${b.id}','${esc(b.slot||"")}')" style="background:#eaf5ee;border:1px solid #cfe5dd;color:#2c6e49;border-radius:12px;padding:11px 6px;font:900 10.5px Cairo;cursor:pointer">${esc(b.slot||"—")}</button>`).join("")}
      </div>`:`<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:16px;text-align:center;margin-top:11px"><span style="font-size:10.5px;color:#8a8fa5;font-weight:700">لا ساعة شاغرة الآن</span></div>`}`)}
  </main>`;
};

window.vnGateLog = async () => {
  const who = prompt("اسم الواصل أو الجهة:"); if(!who) return;
  const space = prompt("المساحة (اختياري):","") || null;
  const {error} = await sb.from("pi_gate").insert({venue:VN.who(), who, space, kind:"in", logged_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  toast("سُجّل الوصول باسمك"); render();
};
window.vnQuick = async (id, slot) => {
  const who = prompt(`حجز ${slot} لمن؟`); if(!who) return;
  const price = prompt("السعر (ر.س):","") || null;
  const patch = {who, status:"accepted"}; if(price) patch.price = +price;
  const {error} = await sb.from("bookings").update(patch).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`حجز فوري — ${slot} · ${who} · ${VN.who()}`);
  toast("حُجزت — وسُجّل باسمك"); render();
};

/* ═══ 6f · الصيانة ═══ */
T.vnFix = async () => {
  const D = await VN.load();
  const open = D.fl.filter(f=>f.status!=="done"), done = D.fl.filter(f=>f.status==="done");
  return VN.head("الصيانة","كل عطل باسم مبلّغه، وكل إصلاح باسم من أصلحه") + VN.tabs("vnFix") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <button onclick="vnFault()" style="background:#e8531f;color:#fff;border:0;border-radius:14px;padding:14px;font:900 12.5px Cairo;cursor:pointer">بلّغ عن عطل</button>

    ${VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("الأعطال المفتوحة")}<span style="font-size:10px;font-weight:900;color:${open.length?"#a83b25":"#8a8fa5"}">${open.length||VN.dash}</span></div>
      ${open.length?open.map(f=>{const S=VN.SEV[f.severity]||VN.SEV.low;
        return `<div style="display:flex;gap:11px;align-items:flex-start;padding:11px 0;border-top:1px solid #f0ece2">
        ${VN.ic("⚠️",S[2],S[1])}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(f.title)}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">بلّغه ${esc(f.reported_by)}${f.space?" · "+esc(f.space):""} · <span class="ltr">${esc(String(f.created_at||"").slice(0,10))}</span></span>
          <button onclick="vnFixed('${f.id}','${esc(f.title)}')" style="margin-top:8px;background:#fff;color:#2c6e49;border:1px solid #cfe5dd;border-radius:10px;padding:8px 13px;font:900 10px Cairo;cursor:pointer">أُصلح — باسمي</button>
        </div>
        <span style="flex:none;font-size:9px;font-weight:900;color:${S[1]}">${S[0]}</span>
      </div>`}).join("")
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:16px;text-align:center;margin-top:11px"><span style="font-size:10.5px;color:#8a8fa5;font-weight:700">لا عطل مفتوحًا — وهذا لا يُدَّعى، هو ما في السجل</span></div>`}`)}

    ${done.length?VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("أُصلحت")}<span style="font-size:10px;font-weight:800;color:#2c6e49"><span class="ltr">${done.length}</span></span></div>
      ${done.slice(0,5).map(f=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:9px 0;border-top:1px solid #f0ece2">
        <span style="font-size:11px;font-weight:800;color:#565d78">${esc(f.title)}</span>
        <span style="font-size:9.5px;font-weight:700;color:#8a8fa5;flex:none;text-align:end">أصلحه ${esc(f.fixed_by||"—")}</span></div>`).join("")}`):""}

    ${VN.card(`${VN.h("البلاغ لا يُحذف")}${VN.sub("العطل يبقى في السجل بعد إصلاحه — لأن تاريخ الأعطال هو ما يقول أي مساحة تحتاج استبدالًا لا ترقيعًا.")}`)}
  </main>`;
};

window.vnFault = async () => {
  const title = prompt("وصف العطل:"); if(!title) return;
  const space = prompt("المساحة (اختياري):","") || null;
  const sv = prompt("الخطورة: high أو mid أو low","mid");
  const severity = ["high","mid","low"].indexOf(sv)>=0 ? sv : "mid";
  const {error} = await sb.from("pi_faults").insert({venue:VN.who(), title, space, severity, reported_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`بلاغ عطل — ${title} · ${VN.who()}`);
  toast("سُجّل البلاغ باسمك"); render();
};
window.vnFixed = async (id, title) => {
  if(!confirm(`تأكيد إصلاح «${title}» باسمك؟`)) return;
  const {error} = await sb.from("pi_faults").update({status:"done", fixed_by:ME.name, fixed_at:new Date().toISOString()}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إصلاح عطل — ${title}`);
  toast("سُجّل الإصلاح باسمك"); render();
};

/* ═══ 6g · المال ═══ */
T.vnMoney = async () => {
  const D = await VN.load();
  const due = D.bk.filter(b=>b.status==="requested"||b.status==="unpaid");
  const dueSum = due.reduce((s,b)=>s+(+b.price||0),0);
  const mx = Math.max(D.rev, dueSum, 1);
  return VN.head("المال","المحصَّل والمتأخر — بأسماء أصحابها") + VN.tabs("vnMoney") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${VN.card(`${VN.h("الوارد مقابل المتأخر")}
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:13px">
        ${[["محصَّل", D.rev, "#2c6e49"],["متأخر", dueSum, dueSum?"#c78c00":"#8a8fa5"]].map(([k,val,c])=>
        `<div><div style="display:flex;justify-content:space-between;align-items:baseline">
          <b style="font-size:11.5px;font-weight:800">${k}</b>
          <b class="ltr" style="font-size:13px;font-weight:900;color:${c}">${val?val.toLocaleString("en"):VN.dash}</b></div>
        <div style="height:7px;background:#f0ece2;border-radius:99px;margin-top:5px;overflow:hidden"><span style="display:block;height:100%;width:${Math.round(val/mx*100)}%;background:${c};border-radius:99px"></span></div></div>`).join("")}
      </div>
      <span style="display:block;font-size:9.5px;font-weight:700;color:#8a8fa5;line-height:1.8;margin-top:11px">المحصَّل من حجوزات مؤكَّدة، والمتأخر من طلبات لم تُدفع. لا رقم يدويًّا.</span>`)}

    ${VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("متأخرات")}<span style="font-size:10px;font-weight:900;color:${due.length?"#c78c00":"#8a8fa5"}">${due.length||VN.dash}</span></div>
      ${due.length?due.slice(0,8).map(b=>`<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-top:1px solid #f0ece2">
        ${VN.ic("◔","#fff6d6","#c78c00")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(b.who||"—")}</b>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(b.slot||"—")}</span></div>
        <b class="ltr" style="font-size:12px;color:#c78c00;flex:none">${(+b.price||0)||VN.dash}</b>
      </div>`).join("")
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:16px;text-align:center;margin-top:11px"><span style="font-size:10.5px;color:#8a8fa5;font-weight:700">لا متأخرات في السجل</span></div>`}`)}

    ${D.tr.length?VN.card(`${VN.h("سجل الشفافية")}${VN.sub("كل حركة على هذا الملعب باسم من نفّذها")}
      ${D.tr.slice(0,6).map(t=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:9px 0;border-top:1px solid #f0ece2">
        <span style="font-size:10.5px;font-weight:800;color:#565d78;line-height:1.7">${esc(t.action||"—")}</span>
        <span class="ltr" style="font-size:9px;font-weight:700;color:#8a8fa5;flex:none">${esc(String(t.created_at||"").slice(0,10))}</span></div>`).join("")}`):""}
  </main>`;
};

/* ═══ 6h · الملعب — الملف والتغطية ═══ */
T.vnProfile = async () => {
  const D = await VN.load();
  const cov = [
    ["المساحات مسجَّلة", D.sp.length>0, "كل مساحة باسمها ونوعها"],
    ["ساعات معروضة", D.bk.length>0, "الشاغر قابل للحجز"],
    ["البوابة تعمل", D.gt.length>0, "الوصول يُسجَّل باسم مسجّله"],
    ["الصيانة مفتوحة", D.fl.length>0, "العطل يُبلَّغ ويُصلَح بأسماء"],
    ["تحصيل موثّق", D.rev>0, "الإيراد من حجوزات مؤكَّدة"],
    ["سجل شفافية", D.tr.length>0, "كل حركة باسم من نفّذها"]
  ];
  const okN = cov.filter(c=>c[1]).length;
  return VN.head(esc(D.v),"ملف الملعب وجرد التغطية") + VN.tabs("vnProfile") +
  `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
      <img src="assets/cv-day-grass.png" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.3">
      <div style="position:relative">
        <b style="display:block;font-size:19px;font-weight:900">${esc(D.v)}</b>
        <span style="display:block;font-size:10.5px;font-weight:700;color:#c6cade;margin-top:5px">${D.sp.length?`<span class="ltr">${D.sp.length}</span> مساحات · `:""}<span class="ltr">${D.paid.length}</span> حجزًا مؤكَّدًا</span>
      </div>
    </div>

    ${VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("جرد التغطية")}<span style="font-size:10px;font-weight:900;color:${okN===cov.length?"#2c6e49":"#c78c00"}"><span class="ltr">${okN}/${cov.length}</span></span></div>
      ${VN.sub("ما يعمل فعلًا في ملعبك — لا قائمة ميزات")}
      <div style="display:flex;flex-direction:column;gap:7px;margin-top:12px">
        ${cov.map(([k,ok,s])=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid #f0ece2">
          <span style="width:20px;height:20px;flex:none;border-radius:6px;background:${ok?"#eaf5ee":"#f4f2ec"};color:${ok?"#2c6e49":"#c9cdd9"};display:grid;place-items:center;font-size:10px;font-weight:900">${ok?"✓":"—"}</span>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;font-weight:800;color:${ok?"#151a2e":"#8a8fa5"}">${k}</b>
            <span style="display:block;font-size:9.5px;font-weight:700;color:#8a8fa5;line-height:1.7;margin-top:2px">${s}</span></div>
        </div>`).join("")}
      </div>`)}

    ${VN.card(`${VN.h("الصلاحية في القاعدة")}${VN.sub("من يفتح مساحة أو يسجّل وصولًا أو يصلح عطلًا — اسمه يُكتب مع الحركة. والملعب لا يملك زرًّا لتعديل نتيجة مباراة لُعبت عليه.")}`)}
  </main>`;
};

/* ═══ التركيب ═══ */
(function(){
  const OWN = ["vnHome","vnSpaces","vnGate","vnFix","vnMoney","vnProfile"];
  if(typeof TITLES!=="undefined")
    Object.assign(TITLES, {vnHome:"اليوم على الأرض", vnSpaces:"المساحات", vnGate:"البوابة", vnFix:"الصيانة", vnMoney:"المال", vnProfile:"الملعب"});
  if(typeof NAV!=="undefined")
    NAV.venue = [["⌂","اليوم","vnHome"],["▦","المساحات","vnSpaces"],["FAB","","hub"],["◔","البوابة","vnGate"],["▤","المال","vnMoney"]];
  if(typeof HUB!=="undefined"){
    HUB.ROLE.venue = [["⌂","اليوم على الأرض","vnHome"],["▦","المساحات","vnSpaces","#eaf5ee","#2c6e49"],["◔","البوابة","vnGate"],["⚠️","الصيانة","vnFix","#fdeee8","#e8531f"],["▤","المال","vnMoney","#fff6d6","#c78c00"],["◉","ملف الملعب","vnProfile"],["▦","شبكة الساعات","pitches"]];
    if(HUB.ROLE_OK && HUB.ROLE_OK.venue) HUB.ROLE_OK.venue.push(...OWN);
  }
  /* الملعب القديم يصير مدخلًا للجديد */
  T.venue = T.vnHome;
})();
