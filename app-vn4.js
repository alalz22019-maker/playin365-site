/* PlayIn365 — «اليوم على الأرض» مبنيّة من جديد: حلقة إشغال · أعمدة الساعات · شريط الأسبوع · نبض المال.
   قاعدة المالك: رقم كبير ورسم يحكي — لا قوائم باهتة. يُحمّل بعد app-vn3.js فيتقدّم عليها. */
(function(){
  const K="#151a2e", P="#4636e3", V2="#7b5cff", G="#f5c518", OR="#e8531f", GR="#2c6e49", MU="#8a8fa5", TX="#565d78", BD="#e9e4d8";
  /* لون واحد لكل حالة — يُقرأ في كل رسم ومفتاح (اللون دلالة لا زينة) */
  const ST = {
    ok:   {fill:"#4636e3", bd:"#4636e3", label:"محجوز"},
    wait: {fill:"#fff8df", bd:"#f0e2b4", label:"بانتظار"},
    free: {fill:"#eaf5ee", bd:"#cfe5dd", label:"شاغر معروض"},
    none: {fill:"#ffffff", bd:"#eef1f5", label:"بلا عرض"},
    shut: {fill:"#fdeee8", bd:"#f3cbbd", label:"مساحة مغلقة"},
    peak: {fill:"#f5c518", bd:"#d9ab1a", label:"الذروة"}
  };
  const key = keys => `<div style="display:flex;gap:11px;flex-wrap:wrap;font-size:9.5px;font-weight:800;color:#565d78">${keys.map(k=>`<span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${ST[k].fill};border:1px solid ${ST[k].bd};margin-inline-end:5px"></span>${ST[k].label}</span>`).join("")}</div>`;

  const hourOf = s => { const m=String(s||"").match(/(\d{1,2}):/); return m?m[1]:null; };
  const isOk = b => b.status==="paid"||b.status==="accepted";

  /* حلقة نسبة — SVG */
  const ring = (pct, big, sub, col) => {
    const r=52, c=2*Math.PI*r, on=Math.max(0,Math.min(100,pct||0));
    return `<div style="position:relative;width:128px;height:128px;flex:none;border-radius:50%;background:rgba(21,26,46,.55)">
      <svg viewBox="0 0 120 120" style="width:128px;height:128px;transform:rotate(-90deg)">
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="11"></circle>
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="${col||G}" stroke-width="11" stroke-linecap="round"
          stroke-dasharray="${(c*on/100).toFixed(1)} ${c.toFixed(1)}"></circle>
      </svg>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px">
        <b class="ltr" style="font-family:'Space Grotesk';font-size:27px;font-weight:700;color:#fff;line-height:1">${big}</b>
        <span style="font-size:9px;font-weight:900;color:#c6cade">${sub}</span>
      </div></div>`;
  };

  VN.card = (inner,pad) => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:${pad||"16px"};flex:none">${inner}</div>`;

  T.vnHome = async () => {
    const D = await VN.load();
    const openFaults = D.fl.filter(f=>f.status!=="done");
    const hotFault = openFaults.some(f=>f.severity==="high");
    const inside = D.gt.filter(g=>g.kind==="in").length - D.gt.filter(g=>g.kind==="out").length;
    const openSp = D.sp.filter(s=>s.open);
    const occ = D.bk.length ? Math.round(D.paid.length/D.bk.length*100) : 0;
    const HRS = ["16","17","18","19","20","21","22"];
    const byHour = HRS.map(h=>{
      const rows = D.bk.filter(b=>hourOf(b.slot)===h);
      return { k:h, ok:rows.filter(isOk).length, wait:rows.filter(b=>b.status==="requested").length, free:rows.filter(b=>b.status==="free").length,
               rev: rows.filter(isOk).reduce((a,b)=>a+(+b.price||0),0) };
    });
    const mxH = Math.max(1,...byHour.map(x=>x.ok+x.wait+x.free));
    const peak = byHour.slice().sort((a,b)=>b.rev-a.rev)[0];
    const deadH = byHour.filter(x=>!x.ok&&x.free);
    const lost = deadH.reduce((a,x)=>a+x.free*(D.sp[0]&&+D.sp[0].price_hour||0),0);
    const next = D.req.concat(D.paid).slice(0,4);
    const SEV = {high:["عالٍ","#a83b25","#fdeee8"],mid:["متوسط","#8a6912","#fff8df"],low:["منخفض",P,"#efedff"]};

    return VN.head("اليوم على الأرض","ما يجري في المجمّع الآن") + VN.tabs("vnHome") +
    `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">

      <div style="position:relative;flex:none;background:${K};border-radius:24px;padding:18px;color:#faf8f3">
        <div style="position:absolute;inset:0;border-radius:24px;overflow:hidden;pointer-events:none">
          <div style="position:absolute;inset-inline-start:64%;top:-76%;width:72%;height:240%;background:linear-gradient(200deg,${P},${V2});border-radius:50%;opacity:.42"></div>
          ${hotFault?`<div style="position:absolute;inset-inline-end:-22%;bottom:-64%;width:44%;height:132%;background:${OR};border-radius:50%;opacity:.42"></div>`:""}
        </div>
        <div style="position:relative;display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
          ${ring(occ, occ?occ+"%":VN.dash, "إشغال اليوم", occ>=70?G:occ>=40?"#b9b0f5":"#8f9bff")}
          <div style="flex:1;min-width:150px">
            ${hotFault?`<span style="display:inline-flex;align-items:center;gap:6px;font-size:9.5px;font-weight:900;color:${G};margin-bottom:7px;white-space:nowrap"><span style="width:7px;height:7px;border-radius:50%;background:${OR}"></span>عطل عالٍ الآن</span>`
              :inside>0?`<span style="display:inline-flex;align-items:center;gap:6px;font-size:9.5px;font-weight:900;color:${G};margin-bottom:7px;white-space:nowrap"><span style="width:7px;height:7px;border-radius:50%;background:${G}"></span><span class="ltr">${inside}</span> داخل المجمّع</span>`:""}
            <b style="display:block;font-size:19px;font-weight:900;line-height:1.45">${D.sp.length?`<span class="ltr">${openSp.length}</span> من <span class="ltr">${D.sp.length}</span> مساحات مفتوحة`:"لم تُسجَّل مساحات بعد"}</b>
            <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">
              ${openSp.slice(0,3).map(s=>`<span style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:5px 10px;font-size:9.5px;font-weight:800;white-space:nowrap">${esc(s.name)}</span>`).join("")
                || `<span style="font-size:10.5px;font-weight:700;color:#c6cade">أضف مساحاتك لتُحجز منفردة</span>`}
            </div>
            <div style="display:flex;gap:18px;margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.14);flex-wrap:nowrap">
              <div><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:17px;font-weight:700;color:${GR==="#2c6e49"?"#8ed6a8":"#fff"}">${D.rev?D.rev.toLocaleString("en"):VN.dash}</b>
                <span style="font-size:9px;font-weight:800;color:#9aa0b8;white-space:nowrap">محصَّل</span></div>
              <div><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:17px;font-weight:700;color:${D.req.length?G:"#fff"}">${D.req.length||VN.dash}</b>
                <span style="font-size:9px;font-weight:800;color:#9aa0b8;white-space:nowrap">ينتظر قرارك</span></div>
              <div><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:17px;font-weight:700;color:${openFaults.length?"#ffb4a0":"#fff"}">${openFaults.length||VN.dash}</b>
                <span style="font-size:9px;font-weight:800;color:#9aa0b8;white-space:nowrap">أعطال</span></div>
            </div>
          </div>
        </div>
      </div>

      ${VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
          ${VN.h("ساعات اليوم")}
          <span style="flex:none;font-size:9.5px;font-weight:900;color:${peak&&peak.rev?"#c78c00":MU};white-space:nowrap">${peak&&peak.rev?`الذروة <span class="ltr">${peak.k}:00</span>`:"لا ذروة بعد"}</span>
        </div>
        ${D.bk.length?`<div style="display:flex;align-items:flex-end;gap:6px;height:104px;margin-top:13px">
          ${byHour.map(x=>{const tot=x.ok+x.wait+x.free, hh=tot?Math.max(8,Math.round(tot/mxH*76)):3;
            return `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%">
            <span class="ltr" style="font-size:9px;font-weight:900;color:${x.ok?K:"#c9cdd9"}">${x.ok||"—"}</span>
            <div style="width:100%;height:${hh}px;border-radius:6px 6px 2px 2px;overflow:hidden;display:flex;flex-direction:column-reverse;background:${ST.free.fill};border:1px solid ${ST.free.bd}">
              ${x.ok?`<span style="height:${Math.round(x.ok/tot*100)}%;background:${peak&&x.k===peak.k&&x.rev?ST.peak.fill:ST.ok.fill}"></span>`:""}
              ${x.wait?`<span style="height:${Math.round(x.wait/tot*100)}%;background:${ST.wait.fill};border-top:1px solid ${ST.wait.bd}"></span>`:""}
            </div>
            <span class="ltr" style="font-size:8.5px;font-weight:800;color:${MU}">${x.k}</span>
          </div>`;}).join("")}
        </div>
        <div style="margin-top:11px;padding-top:10px;border-top:1px solid #f0ece2">${key(["ok","wait","peak","free"])}</div>
        ${deadH.length?`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:13px;padding:11px 13px;margin-top:11px">
          <b style="display:block;font-size:11px;font-weight:900;color:#8a6912"><span class="ltr">${deadH.length}</span> ساعة بلا حجز واحد</b>
          <span style="display:block;font-size:10px;font-weight:700;color:#8a6912;line-height:1.75;margin-top:3px">${deadH.map(x=>'<span class="ltr">'+x.k+':00</span>').join(" · ")}${lost?' — قيمة ضائعة نحو <span class="ltr">'+lost.toLocaleString("en")+'</span> ر.س':''}</span>
        </div>`:""}`
        :`<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:18px;text-align:center;margin-top:12px">
          <span style="font-size:10.5px;color:${MU};font-weight:700;line-height:1.8">لا ساعات معروضة — اعرض ساعاتك لتُرسم هنا وتُحجز</span></div>`}`)}

      ${D.sp.length?VN.card(`${VN.h("الأسبوع في شريط")}
        <span style="display:block;font-size:10px;font-weight:700;color:${MU};line-height:1.8;margin-top:3px">كل مساحة وسبع ساعاتها من ١٦ إلى ٢٢</span>
        <div style="margin-top:10px">${key(["ok","wait","free","none","shut"])}</div>
        <div style="display:flex;flex-direction:column;gap:7px;margin-top:13px">
          ${D.sp.map(s=>{
            const cells = HRS.map(h=>{
              const hit = D.bk.find(b=>hourOf(b.slot)===h && String(b.space||"")===s.name);
              if(!s.open) return {bg:ST.shut.fill,bd:ST.shut.bd};
              if(!hit) return {bg:ST.none.fill,bd:ST.none.bd};
              return isOk(hit) ? {bg:ST.ok.fill,bd:ST.ok.bd} : hit.status==="requested" ? {bg:ST.wait.fill,bd:ST.wait.bd} : {bg:ST.free.fill,bd:ST.free.bd};
            });
            const okN = cells.filter(c=>c.bg===ST.ok.fill).length;
            return `<div style="display:flex;align-items:center;gap:9px">
              <span style="width:88px;flex:none;font-size:10px;font-weight:800;color:${s.open?K:"#b09550"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.name)}</span>
              <div style="flex:1;display:flex;gap:3px">
                ${cells.map(c=>`<span style="flex:1;height:22px;border-radius:4px;background:${c.bg};border:1px solid ${c.bd}"></span>`).join("")}
              </div>
              <span class="ltr" style="width:24px;flex:none;text-align:end;font-size:10px;font-weight:900;color:${okN?P:"#c9cdd9"}">${okN||"—"}</span>
            </div>`;}).join("")}
        </div>`):""}

      ${next.length?VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("القادم")}<span style="font-size:9.5px;font-weight:900;color:${MU}"><span class="ltr">${next.length}</span></span></div>
        <div style="display:flex;flex-direction:column;gap:9px;margin-top:12px">
          ${next.map(b=>{const wait=b.status==="requested";
            return `<div style="display:flex;gap:11px;align-items:center;background:${wait?"#fffdf5":"#faf8f3"};border:1px solid ${wait?"#f0e2b4":BD};border-radius:15px;padding:11px 12px">
            <div style="width:42px;flex:none;text-align:center">
              <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:15px;font-weight:700;color:${wait?"#8a6912":P}">${hourOf(b.slot)||"—"}</b>
              <span style="font-size:8px;font-weight:800;color:${MU}">${hourOf(b.slot)?"مساءً":""}</span>
            </div>
            <div style="flex:1;min-width:0;border-inline-start:1px solid ${wait?"#f0e2b4":BD};padding-inline-start:11px">
              <b style="display:block;font-size:12px;font-weight:900;color:${K}">${esc(b.who||"شاغر")}</b>
              <span style="display:block;font-size:9.5px;font-weight:700;color:${MU};margin-top:2px">${esc(b.space||"—")} · ${wait?"بانتظار قرارك":"مؤكَّد"}</span>
            </div>
            <b class="ltr" style="flex:none;font-size:12.5px;font-weight:900;color:${K}">${(+b.price||0)||VN.dash}</b>
          </div>`;}).join("")}
        </div>
        ${D.req.length?`<button onclick="go('vnGate')" style="width:100%;margin-top:11px;background:${P};color:#fff;border:0;border-radius:13px;padding:12px;font:900 11.5px Cairo;cursor:pointer">افصل في <span class="ltr">${D.req.length}</span> طلبًا</button>`:""}`):""}

      ${openFaults.length?VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("يحتاج يدك")}<span style="font-size:9.5px;font-weight:900;color:#a83b25"><span class="ltr">${openFaults.length}</span></span></div>
        <div style="display:flex;flex-direction:column;gap:9px;margin-top:12px">
          ${openFaults.slice(0,3).map(f=>{const S=SEV[f.severity]||SEV.low;
            return `<div style="background:${S[2]};border:1px solid ${S[1]}33;border-radius:15px;padding:12px 13px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:9px">
              <b style="font-size:12px;font-weight:900;color:${K};line-height:1.5">${esc(f.title)}</b>
              <span style="flex:none;background:#fff;color:${S[1]};border-radius:7px;padding:3px 9px;font-size:9px;font-weight:900;white-space:nowrap">${S[0]}</span>
            </div>
            <span style="display:block;font-size:9.5px;font-weight:700;color:${S[1]};margin-top:5px">بلّغه ${esc(f.reported_by)}${f.space?" · "+esc(f.space):""}</span>
            <button onclick="vnFixed('${f.id}','${esc(f.title)}')" style="margin-top:9px;background:#fff;color:${GR};border:1px solid #cfe5dd;border-radius:10px;padding:8px 14px;font:900 10px Cairo;cursor:pointer;white-space:nowrap">أُصلح — باسمي</button>
          </div>`;}).join("")}
        </div>`):""}

      ${VN.card(`${VN.h("ما تراه هنا")}${VN.sub("كل رقم من صفوف مسجَّلة بأسماء أصحابها — الإشغال من ساعاتك المعروضة، والمحصَّل من حجوزات مؤكَّدة، والعطل باسم مبلّغه. و«—» حيث لا بيان لا صفرًا.")}`)}
    </main>`;
  };
  if(typeof homeFor==="function"){ const _h=homeFor; window.homeFor=function(){ return ME && ME.role==="venue" ? "vnHome" : _h(); }; }
  if(typeof HUB!=="undefined" && HUB.ROLE_OK && HUB.ROLE_OK.venue){
    ["vnHome","vnSpaces","vnGate","vnFix","vnMoney","vnProfile","venuePage"].forEach(v=>{ if(HUB.ROLE_OK.venue.indexOf(v)<0) HUB.ROLE_OK.venue.push(v); });
  }
  /* ══════ «ملفي» للملعب — أُعيد بناؤها: هوية · اعتماد · مساحات بأسعارها · إيراد كل مساحة · خدمات · من يراها ══════ */
  T.vnMe = async () => {
    const D = await VN.load();
    const V = ME && (ME.org || ME.venue) || "";
    const [mt, sn, svc, subs] = await Promise.all([
      q("mt", sb.from("pi_venue_meta").select("*").eq("venue",V).limit(1)).catch(()=>[]),
      q("sn", sb.from("pi_sponsors").select("*").eq("venue",V)).catch(()=>[]),
      Promise.resolve([]),
      q("sb2", sb.from("subscriptions").select("*").eq("org",V)).catch(()=>[])
    ]);
    const P0 = (mt && mt[0]) || {};
    /* مصدر واحد للخدمات كما في صفحة الزوار: مرافق المجمّع (amenities) + معدّات المساحات (pi_spaces.services) */
    const amen = (Array.isArray(P0.amenities)?P0.amenities:[]).map(a=>({name:a,included:true}));
    const seen=new Set(amen.map(a=>a.name));
    D.sp.forEach(s=>(Array.isArray(s.services)?s.services:[]).forEach(x=>{ if(!x||!x.k||seen.has(x.k)) return; seen.add(x.k); amen.push({name:x.k, qty:x.n, included:x.inc!==false, price:x.price}); }));
    D.sponsors = sn || []; D.svc = amen; D.subs = subs || [];
    const openSp = D.sp.filter(s=>s.open);
    const revBy = D.sp.map(s=>({ n:s.name, v:D.bk.filter(b=>(b.status==="paid"||b.status==="accepted")&&String(b.space||"")===s.name).reduce((a,b)=>a+(+b.price||0),0), open:s.open, price:+s.price_hour||0, size:s.size }));
    const mx = Math.max(1,...revBy.map(x=>x.v));
    const inc = (D.svc||[]).filter(s=>s.included), pay = (D.svc||[]).filter(s=>!s.included);
    return VN.head("ملفي","ما يراه الزائر عنك — من سجلك لا من إعلانك") +
    `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">

      <div style="position:relative;flex:none;background:${K};border-radius:24px;padding:18px;color:#faf8f3">
        <div style="position:absolute;inset:0;border-radius:24px;overflow:hidden;pointer-events:none">
          <div style="position:absolute;inset-inline-start:64%;top:-76%;width:72%;height:240%;background:linear-gradient(200deg,${P},${V2});border-radius:50%;opacity:.42"></div>
        </div>
        <div style="position:relative">
          <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,197,24,.16);border:1px solid rgba(245,197,24,.4);color:${G};border-radius:999px;padding:5px 11px;font-size:9.5px;font-weight:900;white-space:nowrap">★ منشأة معتمدة</span>
          <b style="display:block;font-size:21px;font-weight:900;line-height:1.4;margin-top:10px">${esc(P0.name||ME.org||"ملعبي")}</b>
          <span style="display:block;font-size:10.5px;font-weight:700;color:#c6cade;line-height:1.8;margin-top:4px">${esc(P0.city||"—")}${P0.district?" · "+esc(P0.district):""}${P0.since?' · يعمل منذ <span class="ltr">'+P0.since+"</span>":""}</span>
          <div style="display:flex;gap:18px;margin-top:13px;padding-top:11px;border-top:1px solid rgba(255,255,255,.14);flex-wrap:nowrap">
            <div><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:17px;font-weight:700;color:#fff">${openSp.length||VN.dash}</b><span style="font-size:9px;font-weight:800;color:#9aa0b8;white-space:nowrap">مساحة مفتوحة</span></div>
            <div><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:17px;font-weight:700;color:${G}">${(D.subs||[]).length||VN.dash}</b><span style="font-size:9px;font-weight:800;color:#9aa0b8;white-space:nowrap">مشترك</span></div>
            <div><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:17px;font-weight:700;color:#fff">${(D.sponsors||[]).length||VN.dash}</b><span style="font-size:9px;font-weight:800;color:#9aa0b8;white-space:nowrap">راعٍ</span></div>
          </div>
          <button onclick="go('venuePage')" style="width:100%;margin-top:13px;background:${P};color:#fff;border:0;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer;white-space:nowrap">اعرضها كما يراها الزائر ←</button>
        </div>
      </div>

      ${VN.card(`${VN.h("مساحاتك وأسعارها")}${VN.sub("والإيراد المحصَّل من كل مساحة — من حجوزات مؤكَّدة")}
        ${revBy.length?`<div style="display:flex;flex-direction:column;gap:11px;margin-top:13px">
          ${revBy.map(x=>`<div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:9px">
              <b style="font-size:11.5px;font-weight:900;color:${x.open?K:"#b09550"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.n)}${x.open?"":" · مغلقة"}</b>
              <span style="flex:none;font-size:10px;font-weight:800;color:${MU};white-space:nowrap">${x.price?'<span class="ltr">'+x.price+"</span> ر.س/ساعة":"—"}${x.size?" · "+esc(x.size):""}</span>
            </div>
            <div style="display:flex;align-items:center;gap:9px;margin-top:6px">
              <div style="flex:1;height:9px;border-radius:5px;background:#f4f2ec;overflow:hidden">
                <span style="display:block;height:100%;width:${x.v?Math.max(6,Math.round(x.v/mx*100)):0}%;background:${x.open?P:"#d9cfae"};border-radius:5px"></span>
              </div>
              <b class="ltr" style="width:52px;flex:none;text-align:end;font-size:11px;font-weight:900;color:${x.v?K:"#c9cdd9"}">${x.v?x.v.toLocaleString("en"):"—"}</b>
            </div>
          </div>`).join("")}
        </div>`:`<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:18px;text-align:center;margin-top:12px"><span style="font-size:10.5px;color:${MU};font-weight:700">لم تُسجَّل مساحات بعد</span></div>`}
        <button onclick="go('vnSpaces')" style="width:100%;margin-top:12px;background:#fff;color:${P};border:1px solid ${BD};border-radius:13px;padding:11px;font:900 11.5px Cairo;cursor:pointer;white-space:nowrap">أدر المساحات والأسعار ←</button>`)}

      ${(inc.length||pay.length)?VN.card(`${VN.h("خدماتك")}${VN.sub("ما هو مشمول وما بمقابل — والزائر يراه قبل أن يحجز")}
        ${inc.length?`<div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:14px;padding:12px 13px;margin-top:12px">
          <b style="display:block;font-size:11px;font-weight:900;color:#1d4a3e;margin-bottom:8px">مشمول بالسعر</b>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${inc.map(s=>`<span style="background:#fff;border:1px solid #cfe5dd;border-radius:8px;padding:5px 10px;font-size:9.5px;font-weight:800;color:#1d4a3e;white-space:nowrap">${esc(s.name)}${s.qty?' <span class="ltr">×'+s.qty+"</span>":""}</span>`).join("")}</div>
        </div>`:""}
        ${pay.length?`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:14px;padding:12px 13px;margin-top:9px">
          <b style="display:block;font-size:11px;font-weight:900;color:#8a6912;margin-bottom:8px">بمقابل إضافي</b>
          <div style="display:flex;flex-direction:column;gap:6px">${pay.map(s=>`<div style="display:flex;justify-content:space-between;align-items:baseline;gap:9px"><span style="font-size:10.5px;font-weight:800;color:#8a6912">${esc(s.name)}</span><b class="ltr" style="flex:none;font-size:10.5px;font-weight:900;color:#8a6912">${s.price?s.price+" ر.س":"—"}</b></div>`).join("")}</div>
        </div>`:""}`):""}

      ${VN.card(`${VN.h("من يرى هذا الملف")}
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:11px">
          ${[["كل الزوار","الاسم · الموقع · المساحات · الأسعار · الخدمات",GR],["المنظّمون والأكاديميات","ساعاتك المتاحة وطلب الحجز",P],["أنت وحدك","الإيراد · المتأخرات · بيانات المشتركين","#a83b25"]]
            .map(([who,what,c])=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid #f0ece2">
            <span style="width:8px;height:8px;border-radius:50% 50% 50% 2px;background:${c};flex:none;margin-top:4px"></span>
            <div><b style="display:block;font-size:11px;font-weight:900;color:${K}">${who}</b><span style="display:block;font-size:10px;font-weight:700;color:${MU};line-height:1.75;margin-top:2px">${what}</span></div>
          </div>`).join("")}
        </div>
        <span style="display:block;font-size:10px;font-weight:700;color:${MU};line-height:1.8;margin-top:10px;padding-top:10px;border-top:1px solid #f0ece2">أرقام صفحتك من السجل لا من الإعلان — والخدمة غير المسجَّلة لا تُذكر.</span>`)}

      ${(()=>{ const cov=[
        ["المساحات مسجَّلة", D.sp.length>0, "كل مساحة باسمها ونوعها"],
        ["ساعات معروضة", D.bk.length>0, "الشاغر قابل للحجز"],
        ["البوابة تعمل", D.gt.length>0, "الوصول يُسجَّل باسم مسجّله"],
        ["الصيانة مفتوحة", D.fl.length>0, "العطل يُبلَّغ ويُصلَح بأسماء"],
        ["تحصيل موثّق", D.rev>0, "الإيراد من حجوزات مؤكَّدة"],
        ["سجل شفافية", (D.tr||[]).length>0, "كل حركة باسم من نفّذها"]
      ]; const okN=cov.filter(c=>c[1]).length;
      return VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("جرد التغطية")}<span style="font-size:10px;font-weight:900;color:${okN===cov.length?"#2c6e49":"#c78c00"}"><span class="ltr">${okN}/${cov.length}</span></span></div>
      ${VN.sub("ما يعمل فعلًا في ملعبك — لا قائمة ميزات")}
      <div style="display:flex;flex-direction:column;gap:7px;margin-top:12px">
        ${cov.map(([k,ok,s])=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid #f0ece2">
          <span style="width:20px;height:20px;flex:none;border-radius:6px;background:${ok?"#eaf5ee":"#f4f2ec"};color:${ok?"#2c6e49":"#c9cdd9"};display:grid;place-items:center;font-size:10px;font-weight:900">${ok?"✓":"—"}</span>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;font-weight:800;color:${ok?"#151a2e":"#8a8fa5"}">${k}</b>
            <span style="display:block;font-size:9.5px;font-weight:700;color:#8a8fa5;line-height:1.7;margin-top:2px">${s}</span></div>
        </div>`).join("")}
      </div>`); })()}

      ${VN.card(`${VN.h("الصلاحية في القاعدة")}${VN.sub("من يفتح مساحة أو يسجّل وصولًا أو يصلح عطلًا — اسمه يُكتب مع الحركة. والملعب لا يملك زرًّا لتعديل نتيجة مباراة لُعبت عليه.")}`)}
    </main>`;
  };
  if(typeof HUB!=="undefined" && HUB.ROLE_OK && HUB.ROLE_OK.venue && HUB.ROLE_OK.venue.indexOf("vnMe")<0) HUB.ROLE_OK.venue.push("vnMe");
  if(typeof P3!=="undefined"){ const _op=P3.orgProfile; P3.orgProfile=async()=>{ if(ME&&ME.role==="venue") return await T.vnMe(); return await _op(); }; }

  T.vnProfile = T.vnMe;
  if(typeof HUB!=="undefined" && HUB.ROLE && HUB.ROLE.venue){
    HUB.ROLE.venue = HUB.ROLE.venue.map(x=> x[2]==="vnProfile" ? [x[0],"ملفي","vnProfile",x[3],x[4]] : x);
  }
})();
