/* PlayIn365 — ديوان الملعب مطابقًا للتصميم المعتمد «Venue Diwan» (6a · 6b)
   مقام الديوان: رمادي مؤسسي #243244 · زوايا 12px · جداول · بلا بنفسجي وبلا قطرات.
   يُحمّل بعد app-vn3.js. كل رقم من صفوف موجودة، و«—» حيث لا بيان. */
const VD = {};
VD.INK="#243244"; VD.BG="#f4f6f8"; VD.BD="#d9dfe5"; VD.MUTE="#8fa0b0"; VD.TXT="#5a6a7c"; VD.dash="—";
VD.who = () => (ME && ME.org) || "ملعبي";
VD.n   = v => (v==null||v==="") ? VD.dash : (typeof v==="number" ? v.toLocaleString("en") : esc(String(v)));

VD.panel = (title, right, inner, pad) => `<div style="background:#fff;border:1px solid ${VD.BD};border-radius:12px;overflow:hidden">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid ${VD.BD}">
    <b style="font-size:12.5px;font-weight:900;color:${VD.INK};white-space:nowrap">${title}</b>
    ${right?`<span style="font-size:10px;font-weight:800;color:${VD.MUTE};white-space:nowrap">${right}</span>`:""}</div>
  <div style="padding:${pad||"14px 16px"}">${inner}</div></div>`;

VD.empty = t => `<div style="border:1.5px dashed ${VD.BD};border-radius:10px;padding:16px;text-align:center;font-size:10.5px;color:${VD.MUTE};font-weight:700;line-height:1.8">${t}</div>`;

VD.TOP = [["vndBoard","اللوحة"],["vnSpaces","المساحات"],["vnMoney","المالية"],["vndProfile","ملف الملعب"],["vnFix","الصيانة"]];
VD.head = cur => `<div style="background:${VD.INK};padding:12px 18px;display:flex;align-items:center;gap:18px;color:#fff;position:sticky;top:0;z-index:20;flex-wrap:wrap">
  <span class="wm" style="font-size:17px"><span style="color:#fff">Play</span><span style="color:#f5c518">In</span><span style="color:#b9b0f5;font-size:.46em;vertical-align:super">365</span></span>
  <div style="display:flex;gap:4px;flex:1 1 auto;flex-wrap:wrap;min-width:0">
    ${VD.TOP.map(([v,t])=>`<button onclick="go('${v}')" style="flex:none;border:0;border-radius:8px;padding:8px 14px;font:800 11.5px Cairo;cursor:pointer;background:${cur===v?"rgba(255,255,255,.16)":"transparent"};color:${cur===v?"#fff":"#c6cade"};white-space:nowrap">${t}</button>`).join("")}
  </div>
  <span style="font-size:11px;font-weight:800;color:#c6cade;white-space:nowrap">${esc(VD.who())}</span>
</div>`;

VD.side = (cur, D) => {
  const G = [
    ["التشغيل", [["vndBoard","نظرة اليوم",null],["vnSpaces","المساحات والأوقات",D.sp.length||null],["vnFix","الصيانة",D.fl.filter(f=>f.status!=="done").length||null]]],
    ["العملاء", [["vnMoney","المشتركون",D.subs.length||null],["vnGate","طلبات حجز",D.req.length||null],["vndProfile","الرعاة",D.spons.length||null]]]
  ];
  return `<div style="background:#fff;border-inline-end:1px solid ${VD.BD};padding:16px 12px;display:flex;flex-direction:column;gap:16px;width:232px;flex:none">
    ${G.map(([g,items])=>`<div>
      <span style="display:block;font-size:9.5px;font-weight:900;color:${VD.MUTE};padding:0 8px 7px">${g}</span>
      ${items.map(([v,t,n])=>`<button onclick="go('${v}')" style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;border:0;border-radius:9px;padding:10px 10px;margin-bottom:2px;cursor:pointer;background:${cur===v?"#eef1f5":"transparent"};color:${cur===v?VD.INK:VD.TXT};font:${cur===v?900:800} 11px Cairo;text-align:start">
        <span style="white-space:nowrap">${t}</span>${n?`<span class="ltr" style="flex:none;background:#eef1f5;color:${VD.TXT};border-radius:6px;padding:2px 7px;font-size:9.5px">${n}</span>`:""}</button>`).join("")}
    </div>`).join("")}
    <div style="margin-top:auto;padding:11px;background:${VD.BG};border:1px solid ${VD.BD};border-radius:10px">
      <span style="display:block;font-size:9.5px;font-weight:900;color:${VD.MUTE};margin-bottom:5px">الحوكمة</span>
      <span style="display:block;font-size:10px;font-weight:700;color:${VD.TXT};line-height:1.8">الملعب يقرأ ولا يصحّح نتيجة — والتصحيح باسم من صحّحه في سجل الشفافية</span>
    </div>
  </div>`;
};

VD.load = async () => {
  const v = VD.who();
  const [bk, sp, fl, subs, spons, meta, tr] = await Promise.all([
    q("bk", sb.from("bookings").select("*").eq("venue",v).order("created_at",{ascending:false}).limit(300)),
    q("sp", sb.from("pi_spaces").select("*").eq("venue",v).order("name")),
    q("fl", sb.from("pi_faults").select("*").eq("venue",v).order("created_at",{ascending:false}).limit(40)),
    q("su", sb.from("subscriptions").select("*").eq("org",v).limit(300)),
    q("sn", sb.from("pi_sponsors").select("*").eq("venue",v).order("created_at",{ascending:false})),
    q("mt", sb.from("pi_venue_meta").select("*").eq("venue",v).limit(1)),
    q("tr", sb.from("transparency").select("*").ilike("action","%"+v+"%").order("created_at",{ascending:false}).limit(20))
  ]);
  const paid = (bk||[]).filter(b=>b.status==="paid"||b.status==="accepted");
  const req  = (bk||[]).filter(b=>b.status==="requested");
  return { v, bk:bk||[], sp:sp||[], fl:fl||[], subs:subs||[], spons:spons||[], tr:tr||[],
           meta:(meta&&meta[0])||null, paid, req,
           rev: paid.reduce((s,b)=>s+(+b.price||0),0),
           subRev: (subs||[]).filter(s=>s.paid).reduce((s,x)=>s+(+x.amount||0),0) };
};

/* ═══════ 6a · نظرة اليوم ═══════ */
T.vndBoard = async () => {
  const D = await VD.load();
  const HRS = ["8","9","10","11","12","13","14","15","16","17","18","19","20","21"];
  const cell = (space, h) => {
    const hit = D.bk.find(b=>String(b.slot||"").indexOf(h+":")>=0 && String(b.space||"")===space.name);
    if(!space.open) return {bg:"#fdeee8",bd:"#f3cbbd",ink:"#a83b25",t:"صيانة",ti:"مغلقة: "+(space.closed_why||"—")};
    if(!hit)        return {bg:"#fff",bd:"#eef1f5",ink:"#c9cdd9",t:"",ti:"متاح"};
    if(hit.status==="paid"||hit.status==="accepted") return {bg:VD.INK,bd:VD.INK,ink:"#fff",t:"●",ti:"محجوز: "+(hit.who||"")};
    if(hit.status==="requested") return {bg:"#fff8df",bd:"#f0e2b4",ink:"#8a6912",t:"◔",ti:"بانتظار: "+(hit.who||"")};
    return {bg:"#fff",bd:"#eef1f5",ink:"#c9cdd9",t:"",ti:"شاغر"};
  };
  const occ = D.bk.length ? Math.round(D.paid.length/D.bk.length*100) : null;
  const revSrc = [
    ["حجوزات بالساعة", D.rev, VD.INK],
    ["اشتراكات شهرية", D.subRev, "#5a6a7c"],
    ["رعاية", D.spons.reduce((s,x)=>s+(+x.amount||0),0), "#8fa0b0"]
  ];
  const total = revSrc.reduce((s,r)=>s+r[1],0);
  const dec = [
    ...D.req.slice(0,3).map(b=>({t:"طلب حجز — "+esc(b.who||"—"), s:esc(b.slot||"—"), tag:"جديد", c:"#8a6912", bg:"#fff8df", fn:`go('vnGate')`})),
    ...D.fl.filter(f=>f.status!=="done"&&f.severity==="high").slice(0,2).map(f=>({t:"عطل عالٍ — "+esc(f.title), s:"بلّغه "+esc(f.reported_by), tag:"يحتاجك", c:"#a83b25", bg:"#fdeee8", fn:`go('vnFix')`})),
    ...D.sp.filter(s=>!s.open).slice(0,2).map(s=>({t:"مساحة مغلقة — "+esc(s.name), s:esc(s.closed_why||"بلا سبب"), tag:"مغلقة", c:"#8a6912", bg:"#fff8df", fn:`go('vnSpaces')`}))
  ];

  return VD.head("vndBoard") + `<div style="display:flex;align-items:stretch;flex-wrap:wrap;min-height:calc(100vh - 56px);background:${VD.BG}">
    ${VD.side("vndBoard", D)}
    <div style="flex:1 1 420px;min-width:0;padding:18px;display:flex;flex-direction:column;gap:14px">

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px">
        ${[["إشغال اليوم", occ!=null?occ+"%":VD.dash, D.bk.length?`<span class="ltr">${D.paid.length}</span> من <span class="ltr">${D.bk.length}</span> فتحة`:"لا ساعات معروضة", VD.INK],
           ["حجوزات مؤكَّدة", D.paid.length||VD.dash, D.req.length?`<span class="ltr">${D.req.length}</span> طلبًا بانتظارك`:"لا طلب معلّق", VD.INK],
           ["تحصيل اليوم", D.rev||VD.dash, "ر.س — من حجوزات مؤكَّدة", "#2c6e49"],
           ["أعطال مفتوحة", D.fl.filter(f=>f.status!=="done").length||VD.dash, "بأسماء مبلّغيها", D.fl.filter(f=>f.status!=="done").length?"#a83b25":VD.MUTE]]
          .map(([k,val,sub,c])=>`<div style="background:#fff;border:1px solid ${VD.BD};border-radius:12px;padding:14px 16px">
          <span style="display:block;font-size:10px;color:${VD.MUTE};font-weight:900;margin-bottom:4px">${k}</span>
          <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:26px;font-weight:700;color:${c};line-height:1.1">${typeof val==="number"?val.toLocaleString("en"):val}</b>
          <span style="display:block;font-size:10px;color:${VD.MUTE};font-weight:700;margin-top:4px">${sub}</span></div>`).join("")}
      </div>

      ${VD.panel("شبكة اليوم", D.sp.length?`<span class="ltr">${D.sp.length}</span> مساحات × <span class="ltr">14</span> ساعة${occ!=null?` · الإشغال <span class="ltr">${occ}%</span>`:""}`:"",
        D.sp.length?`<div style="overflow-x:auto">
          <div style="min-width:640px">
            <div style="display:grid;grid-template-columns:120px repeat(14,1fr);gap:4px;font-size:9px;font-weight:900;color:${VD.MUTE};margin-bottom:6px">
              <span></span>${HRS.map(h=>`<span class="ltr" style="text-align:center">${h}</span>`).join("")}</div>
            ${D.sp.map(s=>`<div style="display:grid;grid-template-columns:120px repeat(14,1fr);gap:4px;margin-bottom:4px;align-items:center">
              <span style="font-size:11px;font-weight:800;color:${VD.INK};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.name)}</span>
              ${HRS.map(h=>{const c=cell(s,h); return `<span title="${c.ti}" style="height:32px;border-radius:6px;background:${c.bg};border:1px solid ${c.bd};display:grid;place-items:center;font-size:9px;font-weight:900;color:${c.ink}">${c.t}</span>`;}).join("")}
            </div>`).join("")}
            <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:11px;font-size:9.5px;font-weight:800;color:${VD.TXT}">
              <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${VD.INK};margin-inline-end:5px"></span>محجوز</span>
              <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:#fff8df;border:1px solid #f0e2b4;margin-inline-end:5px"></span>بانتظار</span>
              <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:#fdeee8;border:1px solid #f3cbbd;margin-inline-end:5px"></span>صيانة</span>
              <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:#fff;border:1px solid #eef1f5;margin-inline-end:5px"></span>متاح</span>
            </div>
          </div></div>`
        :VD.empty("لا مساحات مسجَّلة — الشبكة تُرسم لحظة تسجّل أول مساحة"))}

      ${VD.panel("حجوزات اليوم", D.bk.length?`<span class="ltr">${D.bk.length}</span>`:"",
        D.bk.length?`<div style="overflow-x:auto"><table style="width:100%;min-width:560px;border-collapse:collapse;font-size:11px">
          <thead><tr>${["المستأجر","الساعة","المساحة","الحالة","المبلغ"].map(h=>`<th style="text-align:start;padding:8px 10px;background:${VD.BG};border-bottom:1px solid ${VD.BD};font-size:10px;font-weight:900;color:${VD.MUTE};white-space:nowrap">${h}</th>`).join("")}</tr></thead>
          <tbody>${D.bk.slice(0,10).map(b=>{
            const st = (b.status==="paid"||b.status==="accepted")?["مؤكَّد","#2c6e49","#eaf5ee"]:b.status==="requested"?["بانتظار قرارك","#8a6912","#fff8df"]:["شاغر",VD.MUTE,"#eef1f5"];
            return `<tr><td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:800;color:${VD.INK}">${esc(b.who||VD.dash)}</td>
              <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${VD.TXT}">${esc(b.slot||VD.dash)}</td>
              <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${VD.TXT}">${esc(b.space||VD.dash)}</td>
              <td style="padding:9px 10px;border-bottom:1px solid #eef1f5"><span style="background:${st[2]};color:${st[1]};border-radius:7px;padding:3px 9px;font-size:9.5px;font-weight:900;white-space:nowrap">${st[0]}</span></td>
              <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${VD.INK}">${(+b.price||0)||VD.dash}</td></tr>`;}).join("")}
          </tbody></table></div>`
        :VD.empty("لا حجز اليوم"), "0")}

    </div>

    <div style="flex:1 1 300px;max-width:340px;background:#fff;border-inline-start:1px solid ${VD.BD};padding:18px 16px;display:flex;flex-direction:column;gap:14px">
      ${VD.panel("بانتظار قرارك", dec.length?`<span class="ltr">${dec.length}</span>`:"",
        dec.length?dec.map(d=>`<div onclick="${d.fn}" style="cursor:pointer;display:flex;justify-content:space-between;gap:9px;align-items:flex-start;padding:10px 0;border-top:1px solid #eef1f5">
          <div style="min-width:0"><b style="display:block;font-size:11.5px;color:${VD.INK};line-height:1.5">${d.t}</b>
            <span style="display:block;font-size:9.5px;color:${VD.MUTE};font-weight:700;margin-top:2px">${d.s}</span></div>
          <span style="flex:none;background:${d.bg};color:${d.c};border-radius:7px;padding:3px 9px;font-size:9px;font-weight:900;white-space:nowrap">${d.tag}</span>
        </div>`).join("")
        :VD.empty("لا شيء ينتظرك — وهذا ما في السجل لا ادّعاء"), "4px 16px 14px")}

      ${VD.panel("الإيراد ومصدره", total?`<span class="ltr">${total.toLocaleString("en")}</span> ر.س`:"",
        total?`<div style="display:flex;gap:3px;height:10px;border-radius:999px;overflow:hidden;margin-bottom:12px">
          ${revSrc.filter(r=>r[1]>0).map(r=>`<span style="flex:${r[1]};background:${r[2]}"></span>`).join("")}</div>
        ${revSrc.map(r=>`<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:800;padding:5px 0">
          <span style="display:flex;align-items:center;gap:7px;color:${VD.TXT}"><span style="width:9px;height:9px;border-radius:3px;background:${r[2]}"></span>${r[0]}</span>
          <b class="ltr" style="color:${VD.INK}">${r[1]?r[1].toLocaleString("en"):VD.dash}</b></div>`).join("")}
        <div style="border-top:1px solid #eef1f5;padding-top:10px;margin-top:5px;display:flex;justify-content:space-between;font-size:11.5px;font-weight:900;color:${VD.INK}">
          <span>الإجمالي</span><b class="ltr">${total.toLocaleString("en")}</b></div>`
        :VD.empty("لا إيراد مسجَّلًا بعد"))}

      ${VD.panel("ختم الاعتماد","",
        D.meta&&D.meta.accredited
          ? `<div style="display:flex;align-items:center;gap:10px;font-size:11.5px;font-weight:800;color:${VD.INK}">منشأة معتمدة${D.meta.license_to?` — سارية حتى <span class="ltr">${esc(String(D.meta.license_to).slice(0,10))}</span>`:""}
              <span style="width:18px;height:18px;flex:none;background:#f5c518;color:${VD.INK};border-radius:5px;display:grid;place-items:center;font-size:10px;font-weight:900">✓</span></div>`
          : VD.empty("لا اعتماد مسجَّلًا — والختم لا يُطبع بلا رخصة سارية في القاعدة"))}

      ${VD.panel("ملاحظة الحوكمة","",
        `<span style="font-size:11px;color:${VD.TXT};font-weight:600;line-height:1.95">إلغاء حجز مدفوع يحتاج سببًا مكتوبًا باسمك — ويصل المستأجر إشعارٌ بالسبب. وإغلاق مساحة كذلك. والملعب لا يملك زرًّا لتعديل نتيجة مباراة لُعبت عليه.</span>`)}
    </div>
  </div>`;
};

/* ═══════ 6b · ملف الملعب ═══════ */
T.vndProfile = async () => {
  const D = await VD.load();
  const M = D.meta || {};
  const hours = Array.isArray(M.hours)?M.hours:[];
  const amen  = Array.isArray(M.amenities)?M.amenities:[];
  const byGroup = {};
  D.subs.forEach(s=>{ const g=s.group_name||"عام"; (byGroup[g]=byGroup[g]||[]).push(s); });

  return VD.head("vndProfile") + `<div style="display:flex;align-items:stretch;flex-wrap:wrap;min-height:calc(100vh - 56px);background:${VD.BG}">
    ${VD.side("vndProfile", D)}
    <div style="flex:1 1 420px;min-width:0;padding:18px;display:flex;flex-direction:column;gap:14px">

      <div style="position:relative;border-radius:12px;overflow:hidden;min-height:200px;display:flex;align-items:flex-end;background:${VD.INK}">
        <img src="assets/cv-day-grass.svg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.42">
        <div style="position:relative;padding:18px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px;width:100%;flex-wrap:wrap">
          <div style="min-width:0">
            <b style="display:block;font-size:20px;font-weight:900;color:#fff">${esc(D.v)}</b>
            <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:700;margin-top:4px">${[M.city,M.district,M.address].filter(Boolean).map(esc).join(" · ")||"لم يُسجَّل الموقع بعد"}${M.city?" — <b>موقع دقيق بدبوس</b> (جهة لا فرد)":""}</span>
          </div>
          ${M.accredited?`<span style="background:rgba(245,197,24,.16);border:1px solid rgba(245,197,24,.45);color:#f5c518;border-radius:8px;padding:6px 12px;font-size:10.5px;font-weight:900;flex:none;white-space:nowrap">★ منشأة معتمدة</span>`:""}
        </div>
      </div>

      ${VD.panel("المساحات والتسعير", D.sp.length?`<span class="ltr">${D.sp.length}</span>`:"",
        D.sp.length?`<div style="overflow-x:auto"><table style="width:100%;min-width:600px;border-collapse:collapse;font-size:11px">
          <thead><tr>${["المساحة","النوع","المقاس","سعر الساعة","سعر الذروة","الحالة"].map(h=>`<th style="text-align:start;padding:8px 10px;background:${VD.BG};border-bottom:1px solid ${VD.BD};font-size:10px;font-weight:900;color:${VD.MUTE};white-space:nowrap">${h}</th>`).join("")}</tr></thead>
          <tbody>${D.sp.map(s=>`<tr>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${VD.INK}">${esc(s.name)}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${VD.TXT}">${VD.n(s.kind)}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${VD.TXT}">${VD.n(s.size_label)}</td>
            <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${VD.INK}">${s.price_hour?(+s.price_hour).toLocaleString("en"):VD.dash}</td>
            <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:#8a6912">${s.peak_hour?(+s.peak_hour).toLocaleString("en"):VD.dash}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5"><span style="background:${s.open?"#eaf5ee":"#fff8df"};color:${s.open?"#2c6e49":"#8a6912"};border-radius:7px;padding:3px 9px;font-size:9.5px;font-weight:900;white-space:nowrap">${s.open?"مفتوحة":"مغلقة"}</span></td>
          </tr>`).join("")}</tbody></table></div>
        <div style="padding:11px 0 0"><button onclick="vdPrice()" style="background:${VD.INK};color:#fff;border:0;border-radius:9px;padding:10px 16px;font:900 11px Cairo;cursor:pointer">حدّث تسعير مساحة</button></div>`
        :VD.empty("لا مساحات — سجّلها من شاشة المساحات في الجوال"), "0 0 14px")}

      ${VD.panel("الاشتراكات الشهرية", D.subs.length?`<span class="ltr">${D.subs.length}</span> مشتركًا`:"",
        Object.keys(byGroup).length?`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
          ${Object.entries(byGroup).map(([g,rows])=>{
            const paidN=rows.filter(r=>r.paid).length, sum=rows.filter(r=>r.paid).reduce((s,r)=>s+(+r.amount||0),0);
            return `<div style="border:1px solid ${VD.BD};border-radius:12px;padding:14px">
              <b style="display:block;font-size:12.5px;font-weight:900;color:${VD.INK}">${esc(g)}</b>
              <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:22px;color:${VD.INK};margin-top:6px">${sum?sum.toLocaleString("en"):VD.dash}</b>
              <span style="display:block;font-size:10.5px;color:${VD.MUTE};font-weight:700;margin-top:4px"><span class="ltr">${paidN}</span> من <span class="ltr">${rows.length}</span> دفعوا</span>
              <div style="margin-top:10px;height:6px;border-radius:999px;background:#eef1f5;overflow:hidden"><span style="display:block;height:100%;background:${VD.INK};width:${Math.round(paidN/rows.length*100)}%"></span></div>
            </div>`;}).join("")}
        </div>`:VD.empty("لا اشتراكات مسجَّلة على هذا الملعب"))}

    </div>

    <div style="flex:1 1 300px;max-width:340px;background:#fff;border-inline-start:1px solid ${VD.BD};padding:18px 16px;display:flex;flex-direction:column;gap:14px">
      ${VD.panel("أوقات العمل","",
        hours.length?hours.map(o=>`<div style="display:flex;justify-content:space-between;gap:9px;font-size:11px;font-weight:800;padding:5px 0">
          <span style="color:${VD.TXT}">${esc(o.d||"—")}</span><b class="ltr" style="color:${VD.INK}">${esc(o.t||"—")}</b></div>`).join("")
        :VD.empty("لم تُسجَّل أوقات العمل"))}

      ${VD.panel("المرافق", amen.length?`<span class="ltr">${amen.length}</span>`:"",
        amen.length?`<div style="display:flex;flex-wrap:wrap;gap:7px">
          ${amen.map(a=>`<span style="background:${VD.BG};border:1px solid ${VD.BD};color:${VD.TXT};border-radius:8px;padding:6px 11px;font-size:10.5px;font-weight:800">${esc(a)}</span>`).join("")}</div>`
        :VD.empty("لم تُسجَّل المرافق"))}

      ${VD.panel("الرعاة", D.spons.length?`<span class="ltr">${D.spons.length}</span>`:"",
        D.spons.length?D.spons.map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:1px solid #eef1f5">
          <div style="min-width:0"><b style="display:block;font-size:11.5px;color:${VD.INK}">${esc(s.name)}</b>
            <span style="display:block;font-size:10px;color:${VD.MUTE};font-weight:700;margin-top:2px">${VD.n(s.kind)}${s.until?` · حتى <span class="ltr">${esc(String(s.until).slice(0,10))}</span>`:""}</span></div>
          <b class="ltr" style="flex:none;font-size:11.5px;color:${VD.INK}">${s.amount?(+s.amount).toLocaleString("en"):VD.dash}</b>
        </div>`).join("")+`<button onclick="vdSponsor()" style="width:100%;margin-top:11px;background:#fff;color:${VD.INK};border:1px solid ${VD.BD};border-radius:9px;padding:10px;font:900 11px Cairo;cursor:pointer">أضف راعيًا</button>`
        :VD.empty("لا رعاة مسجَّلين")+`<button onclick="vdSponsor()" style="width:100%;margin-top:11px;background:${VD.INK};color:#fff;border:0;border-radius:9px;padding:10px;font:900 11px Cairo;cursor:pointer">أضف راعيًا</button>`, "4px 16px 14px")}

      ${VD.panel("الصيانة المفتوحة", D.fl.filter(f=>f.status!=="done").length?`<span class="ltr">${D.fl.filter(f=>f.status!=="done").length}</span>`:"",
        D.fl.filter(f=>f.status!=="done").length
          ? D.fl.filter(f=>f.status!=="done").slice(0,4).map(f=>`<div style="padding:8px 0;border-top:1px solid #eef1f5">
              <b style="display:block;font-size:11.5px;color:${VD.INK};line-height:1.5">${esc(f.title)}</b>
              <span style="display:block;font-size:9.5px;color:${VD.MUTE};font-weight:700;margin-top:2px">بلّغه ${esc(f.reported_by)}${f.space?" · "+esc(f.space):""}</span></div>`).join("")
          : VD.empty("لا عطل مفتوحًا"), "4px 16px 14px")}

      ${VD.panel("ملف الملعب","",
        `<button onclick="vdMeta()" style="width:100%;background:${VD.INK};color:#fff;border:0;border-radius:9px;padding:11px;font:900 11px Cairo;cursor:pointer">حدّث الموقع والأوقات والمرافق</button>
         <span style="display:block;font-size:10px;color:${VD.MUTE};font-weight:700;line-height:1.85;margin-top:9px">الملعب <b style="color:${VD.INK}">جهة</b>: موقعه دقيق بدبوس على الخريطة — بخلاف الأفراد الذين لا تُكشف عناوينهم.</span>`)}
    </div>
  </div>`;
};

window.vdMeta = async () => {
  const city = prompt("المدينة:", (VD._m&&VD._m.city)||"") || null;
  const district = prompt("الحي:","") || null;
  const address = prompt("الطريق/العنوان:","") || null;
  const hrs = prompt("أوقات العمل — مثال: السبت–الأربعاء = 06:00 — 00:00","") || "";
  const am  = prompt("المرافق مفصولة بفاصلة — مواقف, مغاسل, كافيه","") || "";
  const hours = hrs ? hrs.split(";").map(x=>{const [d,t]=x.split("=");return {d:(d||"").trim(),t:(t||"").trim()};}).filter(x=>x.d) : [];
  const amenities = am ? am.split(",").map(x=>x.trim()).filter(Boolean) : [];
  const {error} = await sb.from("pi_venue_meta").upsert({venue:VD.who(), city, district, address, hours, amenities, updated_by:ME.name, updated_at:new Date().toISOString()});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`تحديث ملف الملعب — ${VD.who()}`);
  toast("حُدّث باسمك"); render();
};
window.vdSponsor = async () => {
  const name = prompt("اسم الراعي:"); if(!name) return;
  const kind = prompt("نوع الرعاية (لوحات · قميص · فعالية):","لوحات") || null;
  const amount = prompt("المبلغ (ر.س):","") || null;
  const until = prompt("سارية حتى YYYY-MM-DD:","") || null;
  const {error} = await sb.from("pi_sponsors").insert({venue:VD.who(), name, kind, amount:amount?+amount:null, until, added_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`إضافة راعٍ — ${name} · ${VD.who()}`);
  toast("أُضيف باسمك"); render();
};
window.vdPrice = async () => {
  const D = await VD.load();
  if(!D.sp.length) return toast("لا مساحات",1);
  const nm = prompt("اسم المساحة:\n"+D.sp.map(s=>s.name).join(" · ")); if(!nm) return;
  const s = D.sp.find(x=>x.name===nm); if(!s) return toast("لم تُوجد",1);
  const p = prompt("سعر الساعة:", s.price_hour||"") || null;
  const k = prompt("سعر الذروة:", s.peak_hour||"") || null;
  const z = prompt("المقاس (مثال 11×11):", s.size_label||"") || null;
  const {error} = await sb.from("pi_spaces").update({price_hour:p?+p:null, peak_hour:k?+k:null, size_label:z, updated_at:new Date().toISOString()}).eq("id",s.id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`تحديث تسعير — ${nm} · ${VD.who()}`);
  toast("حُدّث التسعير باسمك"); render();
};

(function(){
  if(typeof TITLES!=="undefined") Object.assign(TITLES,{vndBoard:"ديوان الملعب — نظرة اليوم", vndProfile:"ديوان الملعب — ملف الملعب"});
  if(typeof HUB!=="undefined"){
    if(HUB.ROLE.venue) HUB.ROLE.venue.unshift(["▦","ديوان الملعب","vndBoard","#e7ecf1","#243244"]);
    if(HUB.ROLE_OK && HUB.ROLE_OK.venue) HUB.ROLE_OK.venue.push("vndBoard","vndProfile");
  }

  /* الديوان سطح مكتب: يفكّ قشرة الجوال ويُخفي رأسها وشريطها السفلي */
  VD.VIEWS = ["vndBoard","vndProfile"];
  VD.isVnd = () => typeof VIEW!=="undefined" && VD.VIEWS.indexOf(VIEW)>=0;
  VD.wideOK = () => true; /* قرار المالك ١٤ سبتمبر: الديوان يُفتح من الجوال بعرضه الكامل وتمرير أفقي */
  VD.apply = () => {
    const sh = document.querySelector(".shell");
    const on = VD.isVnd() && VD.wideOK();
    if(sh){
      sh.style.maxWidth = on ? "1560px" : ""; sh.style.overflowX = on ? "auto" : "";
      sh.style.background = on ? VD.BG : "";
      sh.style.borderRadius = on ? "0" : "";
      sh.style.boxShadow = on ? "none" : "";
    }
    document.body.style.background = on ? "#e6eaef" : "";
    if(on){
      const fr = document.querySelector(".shell > div:not(.hd):not(nav)"); if(fr && window.innerWidth<1100) fr.style.minWidth="1100px";
      const hd = document.querySelector(".shell .hd"); if(hd) hd.style.display="none";
      document.querySelectorAll(".shell nav, .shell .nav").forEach(n=>n.style.display="none");
    }
  };
  const _r = window.render;
  window.render = async function(){
    await _r.apply(this, arguments);
    try{ VD.apply(); }catch(e){}
  };
  window.addEventListener("resize", ()=>{ try{ if(VD.isVnd()) VD.apply(); }catch(e){} });

  /* على الجوال: لا يُرسم مشوَّهًا — يقول من أين يُفتح */
  const wrap = (fn, title) => async () => {
    if(!VD.wideOK()) return `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
      <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:20px;text-align:center">
        <span style="display:block;font-size:26px;margin-bottom:8px">⤢</span>
        <b style="display:block;font-size:14px;font-weight:900;color:#243244">${title}</b>
        <span style="display:block;font-size:11px;color:#5a6a7c;font-weight:700;line-height:1.9;margin-top:7px">سطح مكتب — عمودان وجداول لا تُقرأ على عرض الجوال. افتح العنوان نفسه من لابتوب أو آيباد أفقي.</span>
        <button onclick="go('vnHome')" style="margin-top:14px;background:#243244;color:#fff;border:0;border-radius:10px;padding:11px 18px;font:900 11.5px Cairo;cursor:pointer">الملعب في جيبك ←</button>
      </div>
      <div style="background:#f4f6f8;border:1px solid #d9dfe5;border-radius:12px;padding:14px 16px">
        <span style="font-size:10.5px;color:#5a6a7c;font-weight:700;line-height:1.9">ما في الديوان: شبكة اليوم · حجوزات اليوم · الإيراد ومصدره · ختم الاعتماد · المساحات والتسعير · الاشتراكات · أوقات العمل · المرافق · الرعاة · الصيانة المفتوحة.</span>
      </div>
    </main>`;
    return fn();
  };
  const _b = T.vndBoard, _p = T.vndProfile;
  T.vndBoard   = wrap(_b, "ديوان الملعب — نظرة اليوم");
  T.vndProfile = wrap(_p, "ديوان الملعب — ملف الملعب");
})();
