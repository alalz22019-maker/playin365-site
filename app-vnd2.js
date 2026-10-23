/* PlayIn365 — شاشات ديوان الملعب السبع: كل بند في العمود له شاشة ديوان لا إحالة لشاشة جوال.
   قاعدة المالك: رقم كبير ثم رسم يحكي معنى النطاق — والقائمة النصّية أخيرًا لا أولًا.
   يُحمّل بعد app-vnd.js. */
(function(){
  const K = () => VD.INK, BG = () => VD.BG, BD = () => VD.BD, MU = () => VD.MUTE, TX = () => VD.TXT;

  /* رقم كبير */
  VD.kpi = (k,val,sub,c) => `<div style="background:#fff;border:1px solid ${BD()};border-radius:12px;padding:14px 16px">
    <span style="display:block;font-size:10px;color:${MU()};font-weight:900;margin-bottom:4px">${k}</span>
    <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:26px;font-weight:700;color:${c||K()};line-height:1.1">${typeof val==="number"?val.toLocaleString("en"):val}</b>
    <span style="display:block;font-size:10px;color:${MU()};font-weight:700;margin-top:4px">${sub||""}</span></div>`;
  VD.kpis = arr => `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px">${arr.join("")}</div>`;

  /* أعمدة بالساعة */
  VD.bars = (rows, unit) => {
    const mx = Math.max(1, ...rows.map(r=>r.v));
    return `<div style="display:flex;align-items:flex-end;gap:5px;height:120px">
      ${rows.map(r=>`<div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%">
        <span class="ltr" style="font-size:9px;font-weight:900;color:${r.v?K():"#c9cdd9"}">${r.v||"—"}</span>
        <span title="${esc(r.t||"")}" style="width:100%;height:${r.v?Math.max(6,Math.round(r.v/mx*84)):3}px;border-radius:5px 5px 2px 2px;background:${r.c||K()}"></span>
        <span class="ltr" style="font-size:8.5px;font-weight:800;color:${MU()}">${r.k}</span>
      </div>`).join("")}
    </div>${unit?`<span style="display:block;font-size:9.5px;font-weight:700;color:${MU()};margin-top:8px">${unit}</span>`:""}`;
  };

  /* خريطة حرارة */
  VD.heat = (cols, rows) => `<div style="overflow-x:auto"><div style="min-width:${Math.max(420, cols.length*46+130)}px">
    <div style="display:grid;grid-template-columns:128px repeat(${cols.length},1fr);gap:4px;font-size:9px;font-weight:900;color:${MU()};margin-bottom:6px">
      <span></span>${cols.map(c=>`<span style="text-align:center">${c}</span>`).join("")}</div>
    ${rows.map(r=>`<div style="display:grid;grid-template-columns:128px repeat(${cols.length},1fr);gap:4px;margin-bottom:4px;align-items:center">
      <span style="font-size:10.5px;font-weight:800;color:${K()};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.name)}</span>
      ${r.cells.map(c=>`<span title="${esc(c.t||"")}" style="height:30px;border-radius:5px;background:${c.bg};border:1px solid ${c.bd||"transparent"};display:grid;place-items:center;font-size:9px;font-weight:900;color:${c.ink||"#fff"}">${c.v||""}</span>`).join("")}
    </div>`).join("")}
  </div></div>`;

  VD.legend = items => `<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:11px;font-size:9.5px;font-weight:800;color:${TX()}">
    ${items.map(([lb,bg,bd])=>`<span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${bg};border:1px solid ${bd||bg};margin-inline-end:5px"></span>${lb}</span>`).join("")}</div>`;

  /* شريط أفقي مقسوم */
  VD.split = rows => {
    const tot = rows.reduce((s,r)=>s+r.v,0) || 1;
    return `<div style="display:flex;gap:3px;height:12px;border-radius:999px;overflow:hidden;margin-bottom:13px">
      ${rows.filter(r=>r.v>0).map(r=>`<span title="${esc(r.k)}" style="flex:${r.v};background:${r.c}"></span>`).join("")||`<span style="flex:1;background:#eef1f5"></span>`}</div>
    ${rows.map(r=>`<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:800;padding:5px 0">
      <span style="display:flex;align-items:center;gap:7px;color:${TX()}"><span style="width:9px;height:9px;border-radius:3px;background:${r.c}"></span>${r.k}</span>
      <b class="ltr" style="color:${K()}">${r.v?r.v.toLocaleString("en"):VD.dash}</b></div>`).join("")}
    <div style="border-top:1px solid #eef1f5;padding-top:10px;margin-top:5px;display:flex;justify-content:space-between;font-size:11.5px;font-weight:900;color:${K()}">
      <span>الإجمالي</span><b class="ltr">${tot>1?tot.toLocaleString("en"):VD.dash}</b></div>`;
  };

  VD.HRS = ["8","9","10","11","12","13","14","15","16","17","18","19","20","21"];
  VD.hourOf = slot => { const m=String(slot||"").match(/(\d{1,2}):/); return m?m[1]:null; };
  VD.stOf = b => (b.status==="paid"||b.status==="accepted") ? "ok" : b.status==="requested" ? "wait" : "free";

  VD.frame = (cur, D, body) => VD.head(cur) + `<div style="display:flex;align-items:stretch;flex-wrap:wrap;min-height:calc(100vh - 56px);background:${BG()}">
    ${VD.side(cur, D)}
    <div style="flex:1 1 420px;min-width:0;padding:18px;display:flex;flex-direction:column;gap:14px">${body}</div>
  </div>`;

  /* ═══ المساحات والأوقات ═══ */
  T.vndSpaces = async () => {
    const D = await VD.load();
    const per = D.sp.map(s=>{
      const rows = D.bk.filter(b=>String(b.space||"")===s.name);
      const ok = rows.filter(b=>VD.stOf(b)==="ok");
      return { s, rows, ok, rev: ok.reduce((a,b)=>a+(+b.price||0),0), util: rows.length?Math.round(ok.length/rows.length*100):0 };
    });
    const heatRows = per.map(p=>({ name:p.s.name, cells: VD.HRS.map(h=>{
      const hit = p.rows.find(b=>VD.hourOf(b.slot)===h);
      if(!p.s.open) return {bg:"#fdeee8",bd:"#f3cbbd",ink:"#a83b25",v:"×",t:"مغلقة: "+(p.s.closed_why||"—")};
      if(!hit) return {bg:"#fff",bd:"#eef1f5",ink:"#c9cdd9",v:"",t:"متاح"};
      const st = VD.stOf(hit);
      return st==="ok" ? {bg:K(),ink:"#fff",v:"●",t:"محجوز: "+(hit.who||"")}
           : st==="wait" ? {bg:"#fff8df",bd:"#f0e2b4",ink:"#8a6912",v:"◔",t:"بانتظار: "+(hit.who||"")}
           : {bg:"#eaf5ee",bd:"#cfe5dd",ink:"#2c6e49",v:"○",t:"شاغر"};
    })}));
    const openN = D.sp.filter(s=>s.open).length;
    return VD.frame("vndSpaces", D, `
      ${VD.kpis([
        VD.kpi("مساحات مفتوحة", D.sp.length?openN+" / "+D.sp.length:VD.dash, D.sp.length-openN?`<span class="ltr">${D.sp.length-openN}</span> مغلقة بسبب مكتوب`:"لا مساحة مغلقة", openN===D.sp.length?"#2c6e49":"#8a6912"),
        VD.kpi("أعلى إشغال", per.length?(per.slice().sort((a,b)=>b.util-a.util)[0].util+"%"):VD.dash, per.length?esc(per.slice().sort((a,b)=>b.util-a.util)[0].s.name):"", K()),
        VD.kpi("أعلى إيراد", per.length?per.slice().sort((a,b)=>b.rev-a.rev)[0].rev:VD.dash, per.length?esc(per.slice().sort((a,b)=>b.rev-a.rev)[0].s.name):"", "#2c6e49"),
        VD.kpi("ساعات شاغرة", D.bk.filter(b=>VD.stOf(b)==="free").length||VD.dash, "قيمة ضائعة يمكن بيعها", "#8a6912")
      ])}
      ${VD.panel("خريطة الإشغال — مساحة × ساعة", D.sp.length?`<span class="ltr">${D.sp.length}</span> × <span class="ltr">14</span>`:"",
        D.sp.length ? VD.heat(VD.HRS, heatRows) + VD.legend([["محجوز",K()],["بانتظار","#fff8df","#f0e2b4"],["شاغر","#eaf5ee","#cfe5dd"],["مغلقة","#fdeee8","#f3cbbd"],["غير معروضة","#fff","#eef1f5"]])
                    : VD.empty("لا مساحات — تُسجَّل من الجوال، وتُرسم هنا فورًا"))}
      ${VD.panel("إشغال كل مساحة", "", per.length ? VD.bars(per.map(p=>({k:p.s.name.replace("ملعب ","").slice(0,8), v:p.util, c:p.s.open?K():"#f3cbbd", t:p.s.name+" — "+p.util+"%"})), "النسبة من الساعات المعروضة لكل مساحة") : VD.empty("لا بيان"))}
      ${VD.panel("تسعير المساحات", "", D.sp.length?`<div style="overflow-x:auto"><table style="width:100%;min-width:560px;border-collapse:collapse;font-size:11px">
        <thead><tr>${["المساحة","المقاس","سعر الساعة","الذروة","إشغال","الحالة"].map(x=>`<th style="text-align:start;padding:8px 10px;background:${BG()};border-bottom:1px solid ${BD()};font-size:10px;font-weight:900;color:${MU()};white-space:nowrap">${x}</th>`).join("")}</tr></thead>
        <tbody>${per.map(p=>`<tr>
          <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${K()}">${esc(p.s.name)}</td>
          <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${VD.n(p.s.size_label)}</td>
          <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${K()}">${p.s.price_hour?(+p.s.price_hour).toLocaleString("en"):VD.dash}</td>
          <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:#8a6912">${p.s.peak_hour?(+p.s.peak_hour).toLocaleString("en"):VD.dash}</td>
          <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${TX()}">${p.rows.length?p.util+"%":VD.dash}</td>
          <td style="padding:9px 10px;border-bottom:1px solid #eef1f5"><span style="background:${p.s.open?"#eaf5ee":"#fff8df"};color:${p.s.open?"#2c6e49":"#8a6912"};border-radius:7px;padding:3px 9px;font-size:9.5px;font-weight:900;white-space:nowrap">${p.s.open?"مفتوحة":"مغلقة"}</span></td>
        </tr>`).join("")}</tbody></table></div>
        <div style="padding:11px 16px 0"><button onclick="vdPrice()" style="background:${K()};color:#fff;border:0;border-radius:9px;padding:10px 16px;font:900 11px Cairo;cursor:pointer">حدّث تسعير مساحة</button></div>`
        :VD.empty("لا مساحات"), "0 0 14px")}
      ${D.sp.filter(s=>!s.open).length?VD.panel("مغلقة — بسبب مكتوب باسم من أغلقها","",
        D.sp.filter(s=>!s.open).map(s=>`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:11px;padding:11px 13px;margin-bottom:8px">
          <b style="display:block;font-size:11.5px;color:#8a6912">${esc(s.name)}</b>
          <span style="display:block;font-size:10.5px;font-weight:700;color:#8a6912;line-height:1.75;margin-top:3px">${esc(s.closed_why||"بلا سبب")}</span>
          <span style="display:block;font-size:9.5px;font-weight:700;color:#b09550;margin-top:3px">أغلقها ${esc(s.closed_by||"—")}</span></div>`).join("")):""}
    `);
  };

  /* ═══ الصيانة ═══ */
  T.vndFix = async () => {
    const D = await VD.load();
    const open = D.fl.filter(f=>f.status!=="done"), done = D.fl.filter(f=>f.status==="done");
    const sev = k => open.filter(f=>f.severity===k).length;
    return VD.frame("vndFix", D, `
      ${VD.kpis([
        VD.kpi("أعطال مفتوحة", open.length||VD.dash, open.length?"تحتاج يدًا":"لا شيء مفتوح", open.length?"#a83b25":"#2c6e49"),
        VD.kpi("خطورة عالية", sev("high")||VD.dash, "توقف مساحة أو تمنع لعبًا", sev("high")?"#a83b25":MU()),
        VD.kpi("أُصلحت", done.length||VD.dash, "باسم من أصلحها", "#2c6e49"),
        VD.kpi("مساحات متأثّرة", new Set(open.map(f=>f.space).filter(Boolean)).size||VD.dash, "من أصل "+D.sp.length, "#8a6912")
      ])}
      ${VD.panel("الأعطال بخطورتها","",
        open.length||done.length ? VD.split([
          {k:"عالية", v:sev("high"), c:"#a83b25"},
          {k:"متوسطة", v:sev("mid"), c:"#8a6912"},
          {k:"منخفضة", v:sev("low"), c:K()},
          {k:"أُصلحت", v:done.length, c:"#2c6e49"}
        ]) : VD.empty("لا سجل أعطال — وهذا ما في السجل لا ادّعاء"))}
      ${VD.panel("سجل الأعطال", D.fl.length?`<span class="ltr">${D.fl.length}</span>`:"",
        D.fl.length?`<div style="overflow-x:auto"><table style="width:100%;min-width:600px;border-collapse:collapse;font-size:11px">
          <thead><tr>${["العطل","المساحة","الخطورة","بلّغه","الحالة","أصلحه"].map(x=>`<th style="text-align:start;padding:8px 10px;background:${BG()};border-bottom:1px solid ${BD()};font-size:10px;font-weight:900;color:${MU()};white-space:nowrap">${x}</th>`).join("")}</tr></thead>
          <tbody>${D.fl.map(f=>{const S=f.severity==="high"?["عالية","#a83b25","#fdeee8"]:f.severity==="mid"?["متوسطة","#8a6912","#fff8df"]:["منخفضة",K(),"#eef1f5"];
            return `<tr>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${K()}">${esc(f.title)}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${VD.n(f.space)}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5"><span style="background:${S[2]};color:${S[1]};border-radius:7px;padding:3px 9px;font-size:9.5px;font-weight:900;white-space:nowrap">${S[0]}</span></td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${esc(f.reported_by)}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:800;color:${f.status==="done"?"#2c6e49":"#8a6912"}">${f.status==="done"?"أُصلح":"مفتوح"}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${VD.n(f.fixed_by)}</td>
          </tr>`;}).join("")}</tbody></table></div>`
        :VD.empty("لا أعطال"), "0")}
      ${VD.panel("البلاغ لا يُحذف","",`<span style="font-size:11px;color:${TX()};font-weight:600;line-height:1.95">العطل يبقى في السجل بعد إصلاحه — لأن تاريخ الأعطال هو ما يقول أي مساحة تحتاج استبدالًا لا ترقيعًا. وكل بلاغ باسم مبلّغه وكل إصلاح باسم من أصلحه.</span>`)}
    `);
  };

  /* ═══ المالية ═══ */
  T.vndMoney = async () => {
    const D = await VD.load();
    const ok = D.paid, byHour = VD.HRS.map(h=>({ k:h, v: ok.filter(b=>VD.hourOf(b.slot)===h).reduce((a,b)=>a+(+b.price||0),0) }));
    const peak = byHour.slice().sort((a,b)=>b.v-a.v)[0];
    const dead = byHour.filter(x=>!x.v).length;
    const spons = D.spons.reduce((a,s)=>a+(+s.amount||0),0);
    const unpaid = D.subs.filter(s=>!s.paid).reduce((a,s)=>a+(+s.amount||0),0);
    return VD.frame("vndMoney", D, `
      ${VD.kpis([
        VD.kpi("تحصيل الحجوزات", D.rev||VD.dash, "ر.س من حجوزات مؤكَّدة", "#2c6e49"),
        VD.kpi("اشتراكات محصَّلة", D.subRev||VD.dash, unpaid?`<span class="ltr">${unpaid.toLocaleString("en")}</span> متأخرة`:"لا متأخرات", K()),
        VD.kpi("رعاية", spons||VD.dash, `<span class="ltr">${D.spons.length}</span> راعيًا`, "#8a6912"),
        VD.kpi("ساعة الذروة", peak&&peak.v?peak.k+":00":VD.dash, peak&&peak.v?`<span class="ltr">${peak.v.toLocaleString("en")}</span> ر.س`:"لا بيان", "#e8531f")
      ])}
      ${VD.panel("الإيراد ومصدره","", VD.split([
        {k:"حجوزات بالساعة", v:D.rev, c:K()},
        {k:"اشتراكات شهرية", v:D.subRev, c:"#5a6a7c"},
        {k:"رعاية", v:spons, c:"#8fa0b0"}
      ]))}
      ${VD.panel("الإيراد بالساعة", dead?`<span class="ltr">${dead}</span> ساعة بلا إيراد`:"",
        ok.length ? VD.bars(byHour.map(x=>({k:x.k, v:x.v, c:x.v?(peak&&x.k===peak.k?"#e8531f":K()):"#eef1f5"})), "الذروة بالبرتقالي — والساعة الفارغة قيمة ضائعة تُباع")
                  : VD.empty("لا حجوزات مؤكَّدة بعد"))}
      ${VD.panel("المشتركون والمتأخرات", D.subs.length?`<span class="ltr">${D.subs.length}</span>`:"",
        D.subs.length?`<div style="overflow-x:auto"><table style="width:100%;min-width:480px;border-collapse:collapse;font-size:11px">
          <thead><tr>${["المشترك","الفئة","المبلغ","الحالة"].map(x=>`<th style="text-align:start;padding:8px 10px;background:${BG()};border-bottom:1px solid ${BD()};font-size:10px;font-weight:900;color:${MU()};white-space:nowrap">${x}</th>`).join("")}</tr></thead>
          <tbody>${D.subs.map(s=>`<tr>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${K()}">${esc(s.player_name||VD.dash)}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${esc(s.group_name||VD.dash)}</td>
            <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${K()}">${(+s.amount||0).toLocaleString("en")}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5"><span style="background:${s.paid?"#eaf5ee":"#fff8df"};color:${s.paid?"#2c6e49":"#8a6912"};border-radius:7px;padding:3px 9px;font-size:9.5px;font-weight:900;white-space:nowrap">${s.paid?"مدفوع ✓":"متأخر"}</span></td>
          </tr>`).join("")}</tbody></table></div>`:VD.empty("لا مشتركين"), "0")}
    `);
  };

  /* ═══ المشتركون ═══ */
  T.vndSubs = async () => {
    const D = await VD.load();
    const g = {}; D.subs.forEach(s=>{ const k=s.group_name||"عام"; (g[k]=g[k]||[]).push(s); });
    const paidN = D.subs.filter(s=>s.paid).length;
    return VD.frame("vndSubs", D, `
      ${VD.kpis([
        VD.kpi("مشتركون", D.subs.length||VD.dash, `<span class="ltr">${paidN}</span> دفعوا`, K()),
        VD.kpi("نسبة التحصيل", D.subs.length?Math.round(paidN/D.subs.length*100)+"%":VD.dash, "من عدد المشتركين", paidN===D.subs.length?"#2c6e49":"#8a6912"),
        VD.kpi("محصَّل", D.subRev||VD.dash, "ر.س", "#2c6e49"),
        VD.kpi("متأخر", D.subs.filter(s=>!s.paid).reduce((a,s)=>a+(+s.amount||0),0)||VD.dash, "ر.س", "#8a6912")
      ])}
      ${VD.panel("التحصيل بالفئات","", Object.keys(g).length?`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px">
        ${Object.entries(g).map(([k,rows])=>{const p=rows.filter(r=>r.paid).length, sum=rows.filter(r=>r.paid).reduce((a,r)=>a+(+r.amount||0),0);
        return `<div style="border:1px solid ${BD()};border-radius:12px;padding:14px">
          <b style="display:block;font-size:12.5px;font-weight:900;color:${K()}">${esc(k)}</b>
          <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:22px;color:${K()};margin-top:6px">${sum?sum.toLocaleString("en"):VD.dash}</b>
          <span style="display:block;font-size:10.5px;color:${MU()};font-weight:700;margin-top:4px"><span class="ltr">${p}</span> من <span class="ltr">${rows.length}</span> دفعوا</span>
          <div style="margin-top:10px;height:7px;border-radius:999px;background:#eef1f5;overflow:hidden"><span style="display:block;height:100%;background:${p===rows.length?"#2c6e49":K()};width:${Math.round(p/rows.length*100)}%"></span></div>
        </div>`;}).join("")}</div>`:VD.empty("لا اشتراكات على هذا الملعب"))}
    `);
  };

  /* ═══ طلبات الحجز ═══ */
  T.vndReq = async () => {
    const D = await VD.load();
    const val = D.req.reduce((a,b)=>a+(+b.price||0),0);
    return VD.frame("vndReq", D, `
      ${VD.kpis([
        VD.kpi("بانتظار قرارك", D.req.length||VD.dash, D.req.length?"كل طلب يحتاج قبولًا أو سببًا":"لا طلب معلّق", D.req.length?"#8a6912":"#2c6e49"),
        VD.kpi("قيمة الطلبات", val||VD.dash, "ر.س إن قُبلت كلها", K()),
        VD.kpi("ساعات شاغرة", D.bk.filter(b=>VD.stOf(b)==="free").length||VD.dash, "قابلة للبيع الآن", "#8a6912"),
        VD.kpi("مؤكَّدة اليوم", D.paid.length||VD.dash, "حجزًا", "#2c6e49")
      ])}
      ${VD.panel("الطلبات", D.req.length?`<span class="ltr">${D.req.length}</span>`:"",
        D.req.length?D.req.map(b=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #eef1f5;flex-wrap:wrap">
          <div style="min-width:0"><b style="display:block;font-size:12.5px;color:${K()}">${esc(b.who||VD.dash)}</b>
            <span style="display:block;font-size:10px;color:${MU()};font-weight:700;margin-top:2px">${esc(b.slot||VD.dash)}${b.space?" · "+esc(b.space):""}</span></div>
          <div style="display:flex;align-items:center;gap:8px;flex:none">
            <b class="ltr" style="font-size:12.5px;color:${K()}">${(+b.price||0)||VD.dash}</b>
            <button onclick="vdReqAct('${b.id}','${esc(b.who||"")}',1)" style="background:#2c6e49;color:#fff;border:0;border-radius:9px;padding:9px 14px;font:900 10.5px Cairo;cursor:pointer">اقبل</button>
            <button onclick="vdReqAct('${b.id}','${esc(b.who||"")}',0)" style="background:#fff;color:#a83b25;border:1px solid ${BD()};border-radius:9px;padding:9px 14px;font:900 10.5px Cairo;cursor:pointer">اعتذر بسبب</button>
          </div>
        </div>`).join("")
        :VD.empty("لا طلب بانتظارك — وحين يصل طلب يظهر هنا فورًا"), "4px 16px 14px")}
      ${VD.panel("قاعدة الاعتذار","",`<span style="font-size:11px;color:${TX()};font-weight:600;line-height:1.95">الاعتذار عن طلب يحتاج سببًا مكتوبًا باسمك — ويصل الطالب إشعارٌ بالسبب. ولا يُحذف الطلب من السجل.</span>`)}
    `);
  };

  window.vdReqAct = async (id, who, ok) => {
    let why = null;
    if(!ok){ why = prompt(`سبب الاعتذار عن طلب ${who}؟\nيصل الطالب إشعارٌ بالسبب.`); if(!why) return toast("لا اعتذار بلا سبب",1); }
    const {error} = await sb.from("bookings").update({status: ok?"accepted":"free", who: ok?who:"شاغر"}).eq("id",id);
    if(error) return toast("تعذّر: "+error.message,1);
    await trans(ok?`قبول طلب حجز — ${who} · ${VD.who()}`:`اعتذار عن طلب — ${who} · السبب: ${why} · ${VD.who()}`);
    toast(ok?"قُبل — وصل الطالب تأكيد باسمك":"اعتُذر — والسبب يصل الطالب"); render();
  };

  /* ═══ الرعاة ═══ */
  T.vndSponsors = async () => {
    const D = await VD.load();
    const tot = D.spons.reduce((a,s)=>a+(+s.amount||0),0);
    const byKind = {}; D.spons.forEach(s=>{ const k=s.kind||"أخرى"; byKind[k]=(byKind[k]||0)+(+s.amount||0); });
    const COL = {"لوحات":K(),"قميص":"#5a6a7c","فعالية":"#8fa0b0","أخرى":"#c9cdd9"};
    return VD.frame("vndSponsors", D, `
      ${VD.kpis([
        VD.kpi("رعاة", D.spons.length||VD.dash, "عقود سارية", K()),
        VD.kpi("قيمة الرعاية", tot||VD.dash, "ر.س", "#2c6e49"),
        VD.kpi("أعلى عقد", D.spons.length?Math.max(...D.spons.map(s=>+s.amount||0)):VD.dash, D.spons.length?esc(D.spons.slice().sort((a,b)=>(+b.amount||0)-(+a.amount||0))[0].name):"", "#8a6912"),
        VD.kpi("نسبة من الإيراد", (D.rev+D.subRev+tot)?Math.round(tot/(D.rev+D.subRev+tot)*100)+"%":VD.dash, "من إجمالي الدخل", "#8fa0b0")
      ])}
      ${VD.panel("الرعاية بأنواعها","", Object.keys(byKind).length?VD.split(Object.entries(byKind).map(([k,v])=>({k, v, c:COL[k]||COL["أخرى"]}))):VD.empty("لا رعاة مسجّلين"))}
      ${VD.panel("عقود الرعاة", D.spons.length?`<span class="ltr">${D.spons.length}</span>`:"",
        D.spons.length?`<div style="overflow-x:auto"><table style="width:100%;min-width:480px;border-collapse:collapse;font-size:11px">
          <thead><tr>${["الراعي","النوع","المبلغ","سارٍ حتى","أضافه"].map(x=>`<th style="text-align:start;padding:8px 10px;background:${BG()};border-bottom:1px solid ${BD()};font-size:10px;font-weight:900;color:${MU()};white-space:nowrap">${x}</th>`).join("")}</tr></thead>
          <tbody>${D.spons.map(s=>`<tr>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${K()}">${esc(s.name)}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${VD.n(s.kind)}</td>
            <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${K()}">${s.amount?(+s.amount).toLocaleString("en"):VD.dash}</td>
            <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${s.until?esc(String(s.until).slice(0,10)):VD.dash}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${VD.n(s.added_by)}</td>
          </tr>`).join("")}</tbody></table></div>
          <div style="padding:11px 16px 0"><button onclick="vdSponsor()" style="background:${K()};color:#fff;border:0;border-radius:9px;padding:10px 16px;font:900 11px Cairo;cursor:pointer">أضف راعيًا</button></div>`
        :VD.empty("لا رعاة")+`<div style="padding:11px 0 0"><button onclick="vdSponsor()" style="background:${K()};color:#fff;border:0;border-radius:9px;padding:10px 16px;font:900 11px Cairo;cursor:pointer">أضف راعيًا</button></div>`, "0 0 14px")}
    `);
  };

  /* ═══ الأكاديميات المستضافة ═══ */
  T.vndAcads = async () => {
    const D = await VD.load();
    const tenants = {};
    D.bk.filter(b=>VD.stOf(b)==="ok").forEach(b=>{ const k=b.who||"—"; (tenants[k]=tenants[k]||{n:0,rev:0,hrs:[]}); tenants[k].n++; tenants[k].rev+=(+b.price||0); if(VD.hourOf(b.slot)) tenants[k].hrs.push(VD.hourOf(b.slot)); });
    const rows = Object.entries(tenants).sort((a,b)=>b[1].rev-a[1].rev);
    const subMap = {}; D.subs.forEach(s=>{ subMap[s.player_name||""]=(subMap[s.player_name||""]||0)+(+s.amount||0); });
    return VD.frame("vndAcads", D, `
      ${VD.kpis([
        VD.kpi("جهات مستضافة", rows.length||VD.dash, "لها حجوزات مؤكَّدة", K()),
        VD.kpi("أكثرها حضورًا", rows.length?rows[0][1].n:VD.dash, rows.length?esc(rows[0][0]):"", "#2c6e49"),
        VD.kpi("أعلى إيرادًا", rows.length?rows[0][1].rev:VD.dash, "ر.س", "#2c6e49"),
        VD.kpi("بعقد شهري", Object.keys(subMap).length||VD.dash, "لا بالساعة", "#8a6912")
      ])}
      ${VD.panel("الجهات بإيرادها","", rows.length ? VD.bars(rows.slice(0,8).map(([k,v])=>({k:k.slice(0,9), v:v.rev, c:K(), t:k+" — "+v.rev})), "الإيراد من الحجوزات المؤكَّدة لكل جهة") : VD.empty("لا جهات مستضافة بعد"))}
      ${VD.panel("سجل الجهات", rows.length?`<span class="ltr">${rows.length}</span>`:"",
        rows.length?`<div style="overflow-x:auto"><table style="width:100%;min-width:520px;border-collapse:collapse;font-size:11px">
          <thead><tr>${["الجهة","حجوزات","إيراد بالساعة","عقد شهري","ساعاتها"].map(x=>`<th style="text-align:start;padding:8px 10px;background:${BG()};border-bottom:1px solid ${BD()};font-size:10px;font-weight:900;color:${MU()};white-space:nowrap">${x}</th>`).join("")}</tr></thead>
          <tbody>${rows.map(([k,v])=>`<tr>
            <td style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${K()}">${esc(k)}</td>
            <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${v.n}</td>
            <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${K()}">${v.rev.toLocaleString("en")}</td>
            <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:900;color:${subMap[k]?"#2c6e49":"#c9cdd9"}">${subMap[k]?subMap[k].toLocaleString("en"):VD.dash}</td>
            <td class="ltr" style="padding:9px 10px;border-bottom:1px solid #eef1f5;font-weight:700;color:${TX()}">${[...new Set(v.hrs)].sort((a,b)=>a-b).join(" · ")||VD.dash}</td>
          </tr>`).join("")}</tbody></table></div>`:VD.empty("لا جهات"), "0")}
    `);
  };

  /* ═══ التركيب: العمود يشير لشاشات ديوان فقط ═══ */
  const OWN = ["vndBoard","vndProfile","vndSpaces","vndFix","vndMoney","vndSubs","vndReq","vndSponsors","vndAcads"];
  if(typeof TITLES!=="undefined") Object.assign(TITLES,{
    vndSpaces:"ديوان الملعب — المساحات والأوقات", vndFix:"ديوان الملعب — الصيانة",
    vndMoney:"ديوان الملعب — المالية", vndSubs:"ديوان الملعب — المشتركون",
    vndReq:"ديوان الملعب — طلبات الحجز", vndSponsors:"ديوان الملعب — الرعاة",
    vndAcads:"ديوان الملعب — الأكاديميات المستضافة"});

  VD.TOP = [["vndBoard","اللوحة"],["vndSpaces","المساحات"],["vndMoney","المالية"],["vndSubs","المشتركون"],["vndProfile","ملف الملعب"],["vndFix","الصيانة"]];
  VD.side = (cur, D) => {
    const G = [
      ["التشغيل", [["vndBoard","نظرة اليوم",null],["vndSpaces","المساحات والأوقات",D.sp.length||null],["vndFix","الصيانة",D.fl.filter(f=>f.status!=="done").length||null]]],
      ["العملاء", [["vndSubs","المشتركون",D.subs.length||null],["vndAcads","الأكاديميات المستضافة",null],["vndReq","طلبات حجز",D.req.length||null],["vndSponsors","الرعاة",D.spons.length||null]]],
      ["المال",   [["vndMoney","المالية",null],["vndProfile","ملف الملعب",null]]]
    ];
    return `<div style="background:#fff;border-inline-end:1px solid ${BD()};padding:16px 12px;display:flex;flex-direction:column;gap:16px;width:232px;flex:none">
      ${G.map(([g,items])=>`<div>
        <span style="display:block;font-size:9.5px;font-weight:900;color:${MU()};padding:0 8px 7px">${g}</span>
        ${items.map(([v,t,n])=>`<button onclick="go('${v}')" style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;border:0;border-radius:9px;padding:10px 10px;margin-bottom:2px;cursor:pointer;background:${cur===v?"#eef1f5":"transparent"};color:${cur===v?K():TX()};font:${cur===v?900:800} 11px Cairo;text-align:start">
          <span style="white-space:nowrap">${t}</span>${n?`<span class="ltr" style="flex:none;background:#eef1f5;color:${TX()};border-radius:6px;padding:2px 7px;font-size:9.5px">${n}</span>`:""}</button>`).join("")}
      </div>`).join("")}
      <div style="margin-top:auto;padding:11px;background:${BG()};border:1px solid ${BD()};border-radius:10px">
        <span style="display:block;font-size:9.5px;font-weight:900;color:${MU()};margin-bottom:5px">الحوكمة</span>
        <span style="display:block;font-size:10px;font-weight:700;color:${TX()};line-height:1.8">الملعب يقرأ ولا يصحّح نتيجة — والتصحيح باسم من صحّحه في سجل الشفافية</span>
      </div>
    </div>`;
  };

  if(typeof HUB!=="undefined" && HUB.ROLE_OK && HUB.ROLE_OK.venue) OWN.forEach(v=>{ if(HUB.ROLE_OK.venue.indexOf(v)<0) HUB.ROLE_OK.venue.push(v); });
  VD.VIEWS = OWN;

  /* على الجوال: لا تُرسم مشوَّهة */
  const narrow = title => `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:20px;text-align:center">
      <span style="display:block;font-size:26px;margin-bottom:8px">⤢</span>
      <b style="display:block;font-size:14px;font-weight:900;color:#243244">${title}</b>
      <span style="display:block;font-size:11px;color:#5a6a7c;font-weight:700;line-height:1.9;margin-top:7px">سطح مكتب — جداول ورسوم لا تُقرأ على عرض الجوال. افتح العنوان نفسه من لابتوب أو آيباد أفقي.</span>
      <button onclick="go('vnHome')" style="margin-top:14px;background:#243244;color:#fff;border:0;border-radius:10px;padding:11px 18px;font:900 11.5px Cairo;cursor:pointer">الملعب في جيبك ←</button>
    </div></main>`;
  ["vndSpaces","vndFix","vndMoney","vndSubs","vndReq","vndSponsors","vndAcads"].forEach(v=>{
    const _f = T[v], ttl = (typeof TITLES!=="undefined" && TITLES[v]) || "ديوان الملعب";
    T[v] = async () => VD.wideOK() ? _f() : narrow(ttl);
  });
})();
