/* PlayIn365 — صفحة هبوط الملعب للزوار: أكبر مسوّق له.
   قاعدة المالك: أرقام كبيرة ورسوم وصور وأحداث وتفاعل — لا قوائم باهتة.
   تُفتح لأي زائر: go('venuePage','اسم الملعب'). */
const VP = {};
VP.dash = "—";
VP.K="#151a2e"; VP.P="#4636e3"; VP.G="#f5c518"; VP.IV="#faf8f3"; VP.BD="#e9e4d8"; VP.MU="#8a8fa5"; VP.TX="#565d78";
VP.who = () => (typeof PARAM!=="undefined" && PARAM) || (ME && ME.org) || "ملعب المروج";
VP.card = (inner,pad,r) => `<div style="background:#fff;border:1px solid ${VP.BD};border-radius:${r||20}px;padding:${pad||"16px"}">${inner}</div>`;
VP.h = t => `<b style="display:block;font-size:14px;font-weight:900;color:${VP.K}">${t}</b>`;
VP.sub = t => `<span style="display:block;font-size:11px;font-weight:500;color:${VP.MU};line-height:1.85;margin-top:4px">${t}</span>`;

VP.load = async v => {
  const [bk, sp, meta, spons, fl, ev] = await Promise.all([
    q("bk", sb.from("bookings").select("*").eq("venue",v).limit(400)),
    q("sp", sb.from("pi_spaces").select("*").eq("venue",v).order("name")),
    q("mt", sb.from("pi_venue_meta").select("*").eq("venue",v).limit(1)),
    q("sn", sb.from("pi_sponsors").select("*").eq("venue",v)),
    q("fl", sb.from("pi_faults").select("*").eq("venue",v).limit(40)),
    q("ev", sb.from("matches").select("*").eq("venue",v).order("created_at",{ascending:false}).limit(30))
  ]);
  const ok = (bk||[]).filter(b=>b.status==="paid"||b.status==="accepted");
  return { v, bk:bk||[], sp:sp||[], meta:(meta&&meta[0])||{}, spons:spons||[], fl:fl||[], ev:ev||[], ok,
           free:(bk||[]).filter(b=>b.status==="free") };
};

T.venuePage = async () => {
  const v = VP.who(), D = await VP.load(v), M = D.meta;
  const HRS = ["16","17","18","19","20","21","22"];
  const hourOf = s => { const m=String(s||"").match(/(\d{1,2}):/); return m?m[1]:null; };
  const byHour = HRS.map(h=>({k:h, v:D.ok.filter(b=>hourOf(b.slot)===h).length}));
  const mxH = Math.max(1,...byHour.map(x=>x.v));
  const occ = D.bk.length ? Math.round(D.ok.length/D.bk.length*100) : null;
  const openSp = D.sp.filter(s=>s.open);
  const locationReady = [M.city,M.district,M.address].some(value=>String(value||"").trim());
  const canBook = openSp.length > 0 && locationReady;
  const amen = Array.isArray(M.amenities)?M.amenities:[];
  const hours = Array.isArray(M.hours)?M.hours:[];
  const prices = D.sp.filter(s=>s.price_hour).map(s=>+s.price_hour);
  const minP = prices.length?Math.min(...prices):null;
  const years = M.since ? (new Date().getFullYear() - M.since) : null;
  const votes = {};
  try{ const r = await q("vt", sb.from("pi_follows").select("target").eq("kind","vote_space")); (r||[]).forEach(x=>votes[x.target]=(votes[x.target]||0)+1); }catch(e){}
  const vTot = Object.values(votes).reduce((a,b)=>a+b,0);

  return `<main style="flex:1;padding:0 0 118px;display:flex;flex-direction:column;gap:14px;background:${VP.IV}">

    <div style="position:relative;min-height:330px;display:flex;align-items:flex-end;background:${VP.K};overflow:hidden">
      <img src="assets/cv-day-grass.png" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.5">
      <div style="position:absolute;inset-inline:0;bottom:0;height:75%;background:linear-gradient(to top,rgba(21,26,46,.96) 22%,rgba(21,26,46,.4) 65%,transparent);pointer-events:none"></div>
      <div style="position:relative;padding:18px;width:100%">
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">
          ${M.accredited?`<span style="background:${VP.G};color:${VP.K};border-radius:999px;padding:5px 12px;font-size:10px;font-weight:900;white-space:nowrap">★ منشأة معتمدة</span>`:""}
          ${openSp.length?`<span style="background:rgba(44,110,73,.9);color:#fff;border-radius:999px;padding:5px 12px;font-size:10px;font-weight:900;white-space:nowrap"><span class="ltr">${openSp.length}</span> مساحات مفتوحة</span>`:""}
          ${years?`<span style="background:rgba(255,255,255,.16);color:#fff;border-radius:999px;padding:5px 12px;font-size:10px;font-weight:900;white-space:nowrap">يعمل منذ <span class="ltr">${M.since}</span></span>`:""}
        </div>
        <b style="display:block;font-size:26px;font-weight:900;color:#fff;line-height:1.35">${esc(v)}</b>
        <span style="display:block;font-size:11.5px;font-weight:700;color:#c6cade;line-height:1.8;margin-top:6px">${[M.city,M.district,M.address].filter(Boolean).map(esc).join(" · ")||"الموقع لم يُسجَّل بعد"}</span>
        <div style="display:flex;gap:9px;margin-top:15px;flex-wrap:wrap">
          ${canBook?`<button onclick="vpBook('${esc(v)}','',0)" style="background:${VP.P};color:#fff;border:0;border-radius:14px;padding:13px 20px;font:900 12.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.35);white-space:nowrap">احجز ساعتك${minP?` — من <span class="ltr">${minP}</span> ر.س`:""}</button>`:`<button type="button" disabled aria-disabled="true" title="سجّل موقع الملعب وافتح مساحة للحجز" style="background:rgba(255,255,255,.12);color:#c6cade;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:13px 20px;font:900 12.5px Cairo;cursor:not-allowed;opacity:.6;white-space:nowrap">الحجز غير متاح</button>`}
          <button onclick="vpFollow('${esc(v)}')" style="background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:13px 18px;font:900 12.5px Cairo;cursor:pointer;white-space:nowrap">تابع الملعب</button>
        </div>
      </div>
    </div>

    <div style="padding:0 18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:11px">
      ${[["مباريات لُعبت", D.ev.length||VP.dash, "على أرضه — موثّقة", VP.P],
         ["ساعة محجوزة", D.ok.length||VP.dash, "بسجل المنصة", "#2c6e49"],
         ["متوسط الإشغال", occ!=null?occ+"%":VP.dash, "من الساعات المعروضة", "#c78c00"],
         ["مساحات", D.sp.length||VP.dash, openSp.length?`<span class="ltr">${openSp.length}</span> مفتوحة الآن`:"—", VP.K]]
        .map(([k,val,sub,c])=>`<div style="background:#fff;border:1px solid ${VP.BD};border-radius:18px;padding:15px 13px;text-align:center">
        <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:26px;font-weight:700;color:${c};line-height:1.1">${typeof val==="number"?val.toLocaleString("en"):val}</b>
        <span style="display:block;font-size:10.5px;font-weight:900;color:${VP.K};margin-top:5px">${k}</span>
        <span style="display:block;font-size:9px;font-weight:700;color:${VP.MU};margin-top:2px">${sub}</span></div>`).join("")}
    </div>

    <div style="padding:0 18px">
      ${VP.card(`${VP.h("أي ساعة يمتلئ فيها")}${VP.sub("من حجوزات مؤكَّدة في سجل المنصة — اختر ساعةً هادئة إن أردت ملعبًا أوسع")}
        <div style="display:flex;align-items:flex-end;gap:7px;height:112px;margin-top:14px">
          ${byHour.map(x=>`<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%">
            <span class="ltr" style="font-size:9.5px;font-weight:900;color:${x.v?VP.K:"#c9cdd9"}">${x.v||"—"}</span>
            <span style="width:100%;height:${x.v?Math.max(7,Math.round(x.v/mxH*76)):3}px;border-radius:6px 6px 2px 2px;background:${x.v===mxH&&x.v?"#f5c518":VP.P}"></span>
            <span class="ltr" style="font-size:9px;font-weight:800;color:${VP.MU}">${x.k}</span>
          </div>`).join("")}
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid #f0ece2;font-size:9.5px;font-weight:800;color:${VP.TX||"#565d78"}">
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${VP.P};margin-inline-end:5px"></span>حجوزات الساعة</span>
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:#f5c518;border:1px solid #d9ab1a;margin-inline-end:5px"></span>الأكثر امتلاءً</span>
        </div>
        <div style="display:none">
        </div>
        <div style="display:flex;gap:14px;margin-top:11px;font-size:9.5px;font-weight:800;color:${VP.TX}">
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:#f5c518;margin-inline-end:5px"></span>الذروة</span>
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${VP.P};margin-inline-end:5px"></span>بقيّة الساعات</span>
        </div>`)}
    </div>

    <div style="padding:0 18px;display:flex;flex-direction:column;gap:12px">
      <b style="font-size:15px;font-weight:900;color:${VP.K}">المساحات وما فيها</b>
      ${D.sp.length?D.sp.map(s=>{
        const svc = Array.isArray(s.services)?s.services:[];
        const inc = svc.filter(x=>x.inc!==false), ext = svc.filter(x=>x.inc===false);
        return `<div style="background:#fff;border:1px solid ${s.open?VP.BD:"#f0e2b4"};border-radius:20px;overflow:hidden">
        <div style="position:relative;height:140px;background:#f4f2ec">
          <img src="assets/${s.kind==="بادل"?"cv-indoor-futsal":s.kind==="٥×٥"?"cv-futsal":"cv-night-kick"}.png" alt="" style="width:100%;height:100%;object-fit:cover;${s.open?"":"filter:grayscale(1);opacity:.55"}">
          <span style="position:absolute;top:10px;inset-inline-end:10px;background:${s.open?"rgba(44,110,73,.92)":"rgba(138,105,18,.92)"};color:#fff;border-radius:999px;padding:4px 11px;font-size:9.5px;font-weight:900;white-space:nowrap">${s.open?"متاحة للحجز":"مغلقة مؤقتًا"}</span>
          ${s.price_hour?`<span style="position:absolute;bottom:10px;inset-inline-start:10px;background:rgba(21,26,46,.88);color:#f5c518;border-radius:10px;padding:6px 11px;font-size:11px;font-weight:900"><span class="ltr">${(+s.price_hour).toLocaleString("en")}</span> ر.س/ساعة</span>`:""}
        </div>
        <div style="padding:15px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
            <b style="font-size:14px;font-weight:900;color:${VP.K}">${esc(s.name)}</b>
            <span style="flex:none;font-size:10px;font-weight:800;color:${VP.MU}">${VP.dash===s.size_label||!s.size_label?"":esc(s.size_label)}${s.capacity?` · <span class="ltr">${s.capacity}</span> لاعبًا`:""}</span>
          </div>
          ${!s.open&&s.closed_why?`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:12px;padding:10px 12px;margin-top:10px;font-size:10.5px;font-weight:800;color:#8a6912;line-height:1.75">${esc(s.closed_why)}</div>`:""}
          ${inc.length?`<span style="display:block;font-size:10px;font-weight:900;color:#2c6e49;margin-top:12px">مشمول بالسعر</span>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">
            ${inc.map(x=>`<span style="background:#eaf5ee;border:1px solid #cfe5dd;color:#1d4a3e;border-radius:9px;padding:6px 10px;font-size:10px;font-weight:800;white-space:nowrap">${esc(x.k)}${x.n?` <span class="ltr">×${x.n}</span>`:""}</span>`).join("")}
          </div>`:""}
          ${ext.length?`<span style="display:block;font-size:10px;font-weight:900;color:#c78c00;margin-top:11px">بمقابل إضافي</span>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">
            ${ext.map(x=>`<span style="background:#fff6d6;border:1px solid #f0e2b4;color:#8a6912;border-radius:9px;padding:6px 10px;font-size:10px;font-weight:800;white-space:nowrap">${esc(x.k)}${x.n?` <span class="ltr">×${x.n}</span>`:""}</span>`).join("")}
          </div>`:""}
          ${!svc.length?`<span style="display:block;font-size:10.5px;font-weight:700;color:${VP.MU};line-height:1.8;margin-top:10px">خدمات هذه المساحة لم تُسجَّل بعد — ولا تُذكر خدمة غير مسجَّلة</span>`:""}
          ${s.open&&locationReady?`<button onclick="vpBook('${esc(v)}','${esc(s.name)}',${+s.price_hour||0})" style="width:100%;margin-top:13px;background:${VP.P};color:#fff;border:0;border-radius:13px;padding:12px;font:900 12px Cairo;cursor:pointer">اطلب حجز هذه المساحة</button>`:""}
        </div>
      </div>`;}).join("")
      :VP.card(`<div style="text-align:center;padding:8px"><b style="display:block;font-size:13px">لم تُسجَّل مساحات بعد</b>${VP.sub("صفحة الملعب تُبنى من مساحاته — تظهر هنا لحظة يسجّلها")}</div>`)}
    </div>

    ${D.sp.length>1?`<div style="padding:0 18px">
      ${VP.card(`${VP.h("صوّت — أي مساحة أفضل؟")}${VP.sub(vTot?`<span class="ltr">${vTot}</span> صوتًا من زوّار الملعب · صوت واحد لكل حساب`:"لا أصوات بعد — كن أول من يصوّت")}
        <div style="display:flex;flex-direction:column;gap:9px;margin-top:13px">
          ${D.sp.map(s=>{const n=votes[s.name]||0, pct=vTot?Math.round(n/vTot*100):0;
            return `<div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
              <b style="font-size:11.5px;font-weight:800;color:${VP.K}">${esc(s.name)}</b>
              <span style="flex:none;font-size:10px;font-weight:900;color:${VP.P}"><span class="ltr">${n||0}</span>${vTot?` · <span class="ltr">${pct}%</span>`:""}</span></div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
              <div style="flex:1;height:8px;background:#f0ece2;border-radius:99px;overflow:hidden"><span style="display:block;height:100%;width:${pct}%;background:${VP.P};border-radius:99px"></span></div>
              <button onclick="vpVote('${esc(s.name)}')" style="flex:none;background:#fff;color:${VP.P};border:1px solid ${VP.BD};border-radius:9px;padding:7px 13px;font:900 10px Cairo;cursor:pointer">صوّت</button>
            </div></div>`;}).join("")}
        </div>`)}
    </div>`:""}

    ${D.ev.length?`<div style="padding:0 18px">
      ${VP.card(`${VP.h("ما لُعب هنا")}${VP.sub("مباريات موثّقة على أرض هذا الملعب — بأسماء منظّميها")}
        <div style="display:flex;flex-direction:column;gap:2px;margin-top:12px">
          ${D.ev.slice(0,5).map(m=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 0;border-top:1px solid #f0ece2">
            <div style="min-width:0"><b style="display:block;font-size:12px;color:${VP.K}">${esc(m.title||"مباراة")}</b>
              <span style="display:block;font-size:9.5px;font-weight:700;color:${VP.MU};margin-top:2px">${esc(m.comp||"ودية")}${m.organizer_name?" · نظّمها "+esc(m.organizer_name):""}</span></div>
            ${m.status==="final"?`<b class="ltr" style="flex:none;font-size:13px;font-weight:900;color:${VP.K}">${m.score_a||0} : ${m.score_b||0}</b>`
              :`<span style="flex:none;background:${m.status==="live"?"#fdeee8":"#efedff"};color:${m.status==="live"?"#e8531f":VP.P};border-radius:8px;padding:4px 10px;font-size:9.5px;font-weight:900;white-space:nowrap">${m.status==="live"?"● مباشر":"قادمة"}</span>`}
          </div>`).join("")}
        </div>`)}
    </div>`:""}

    <div style="padding:0 18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">
      ${hours.length?VP.card(`${VP.h("أوقات العمل")}
        <div style="display:flex;flex-direction:column;gap:2px;margin-top:11px">
          ${hours.map(o=>`<div style="display:flex;justify-content:space-between;gap:9px;font-size:11.5px;font-weight:800;padding:8px 0;border-top:1px solid #f0ece2">
            <span style="color:${VP.TX}">${esc(o.d||"—")}</span><b class="ltr" style="color:${VP.K}">${esc(o.t||"—")}</b></div>`).join("")}
        </div>`):""}
      ${amen.length?VP.card(`${VP.h("مرافق المجمّع")}
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:11px">
          ${amen.map(a=>`<span style="background:${VP.IV};border:1px solid ${VP.BD};color:${VP.TX};border-radius:9px;padding:7px 11px;font-size:10.5px;font-weight:800;white-space:nowrap">${esc(a)}</span>`).join("")}
        </div>`):""}
    </div>

    ${D.spons.length?`<div style="padding:0 18px">
      ${VP.card(`${VP.h("رعاة الملعب")}${VP.sub(`<span class="ltr">${D.spons.length}</span> راعيًا بعقود سارية`)}
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
          ${D.spons.map(s=>`<span style="background:${VP.IV};border:1px solid ${VP.BD};border-radius:12px;padding:9px 13px;font-size:11px;font-weight:900;color:${VP.K}">${esc(s.name)}${s.kind?`<span style="font-size:9px;font-weight:700;color:${VP.MU}"> · ${esc(s.kind)}</span>`:""}</span>`).join("")}
        </div>`)}
    </div>`:""}

    <div style="padding:0 18px">
      <div style="background:${VP.K};border-radius:22px;padding:19px;color:#faf8f3;position:relative;overflow:hidden">
        <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5;pointer-events:none"></div>
        <div style="position:relative">
          <b style="display:block;font-size:14px;font-weight:900;color:${VP.G}">أرقام هذه الصفحة من السجل لا من الإعلان</b>
          <span style="display:block;font-size:11.5px;font-weight:500;color:#c6cade;line-height:1.9;margin-top:7px">كل رقم هنا محسوب من حجوزات ومباريات مسجَّلة بأسماء أصحابها${M.accredited?" · والاعتماد من رخصة سارية في القاعدة":" · ولا ختم اعتماد بلا رخصة سارية"}. والخدمة غير المسجَّلة لا تُذكر.</span>
          ${canBook&&D.free.length?`<button onclick="vpBook('${esc(v)}','',0)" style="margin-top:14px;background:${VP.P};color:#fff;border:0;border-radius:13px;padding:12px 20px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)"><span class="ltr">${D.free.length}</span> ساعة شاغرة — احجز الآن</button>`:""}
        </div>
      </div>
    </div>
  </main>`;
};

window.vpVote = async name => {
  if(!ME) return toast("سجّل دخولك للتصويت",1);
  try{
    const {error} = await sb.from("pi_follows").insert({person:ME.name, kind:"vote_space", target:name});
    if(error) throw error;
    toast("سُجّل صوتك — صوت واحد لكل حساب"); render();
  }catch(e){ toast("صوتك مسجَّل مسبقًا",1); }
};
window.vpFollow = async v => {
  if(!ME) return toast("سجّل دخولك للمتابعة",1);
  try{
    const {error} = await sb.from("pi_follows").insert({person:ME.name, kind:"venue", target:v});
    if(error) throw error;
    toast("تتابع الملعب — تصلك ساعاته الشاغرة وفعالياته");
  }catch(e){ toast("تتابعه بالفعل",1); }
};

(function(){
  if(typeof TITLES!=="undefined") TITLES.venuePage = "صفحة الملعب";
  if(typeof PL3!=="undefined") PL3.TITLE.venuePage = ["صفحة الملعب","ما يراه الزائر قبل أن يحجز"];
  if(typeof HUB!=="undefined"){
    if(!HUB.OPEN) HUB.OPEN=[];
    if(HUB.OPEN.indexOf("venuePage")<0) HUB.OPEN.push("venuePage");
    /* مدخل واحد: الملعب يراها «صفحتنا للزوار» في عموده؛ بقية الأدوار «صفحات الملاعب» في المشترك */
    const _shared=HUB.SHARED.slice(); Object.defineProperty(HUB,"SHARED",{get(){ return (ME&&ME.role==="venue")?_shared:[..._shared.slice(0,2),["▦","صفحات الملاعب","venuePage","#eaf5ee","#2c6e49"],..._shared.slice(2)]; }, set(x){ _shared.length=0; _shared.push(...x); }, configurable:true});
    if(HUB.ROLE.venue) HUB.ROLE.venue.splice(1,0,["◉","صفحتنا للزوار","venuePage","#eaf5ee","#2c6e49"]);
  }
})();

/* طلب حجز حقيقي من صفحة الزوار — يصل بوابة الملعب بحالة requested */
window.vpBook = async (venue, space, price) => {
  if(!ME){ toast("سجّل دخولك أولًا لتحجز",1); return; }
  const venueData=await VP.load(venue),venueMeta=venueData.meta||{};
  const hasLocation=[venueMeta.city,venueMeta.district,venueMeta.address].some(value=>String(value||"").trim());
  if(!hasLocation||!(venueData.sp||[]).some(item=>item.open)){toast("الحجز يتطلب موقعًا مسجلًا ومساحة مفتوحة",1);return;}
  const hour = prompt("الساعة المطلوبة (مثال 19):",""); if(!hour) return;
  const slot = "اليوم "+String(+hour)+":00–"+String(+hour+1)+":00";
  const row = {venue, slot, who:ME.name, status:"requested", price:+price||null}; if(space) row.space=space;
  const {error} = await sb.from("bookings").insert(row);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`طلب حجز — ${venue}${space?" · "+space:""} · ${slot}`);
  toast("أُرسل طلب الحجز — يردّ الملعب من بوابته");
};
