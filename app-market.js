/* PlayIn365 — التجارة: المتجر · العضويات الرقمية · الرعاية */
const MK={};
MK.card=(i,x)=>`<div class="card" style="border-radius:24px;${x||""}">${i}</div>`;
MK.h=(t,c)=>`<b class="h2" style="color:${c||"#4636e3"};display:block;margin-bottom:11px">${t}</b>`;
MK.empty=t=>`<div style="border:1.5px dashed #d5d0c4;border-radius:15px;padding:16px;text-align:center"><span class="muted">${esc(t)}</span></div>`;

/* ══════════ المتجر ══════════ */
T.market=async()=>{
  const ls=await q("l",sb.from("listings").select("*").order("created_at",{ascending:false}));
  const fixed=ls.filter(l=>l.type==="fixed"), auc=ls.filter(l=>l.type==="auction");
  const aucCard=auc.map(l=>`<div style="background:#151a2e;border-radius:18px;padding:14px 16px;color:#faf8f3;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
        <div style="min-width:0"><b style="display:block;font-size:12.5px;line-height:1.5">${esc(l.name)}</b>
          ${l.chain?`<span style="display:inline-block;background:rgba(245,197,24,.15);color:#f5c518;border-radius:6px;padding:2px 9px;font-size:9.5px;font-weight:900;margin-top:6px">سلسلة إثبات: ${esc(l.chain)}</span>`:""}
          <span class="muted" style="display:block;margin-top:5px;color:#9aa0b8">البائع: ${esc(l.seller||"—")}</span></div>
        <div style="flex:none;text-align:center">
          <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:17px;color:${+l.price?"#f5c518":"#8a93b0"}">${+l.price?(+l.price).toLocaleString("en"):"—"}</b>
          <span style="display:block;font-size:8.5px;font-weight:800;color:#9aa0b8">${+l.price?"أعلى مزايدة ر.س":"لا مزايدة بعد"}</span></div></div>
      <button class="btn" style="margin-top:11px" onclick="bid('${l.id}',${+l.price||0},'${esc(l.name)}')">زايد</button></div>`).join("");
  const fixedCard=fixed.map(l=>`<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:16px;padding:12px 14px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
        <div style="min-width:0"><b style="font-size:12.5px">${esc(l.name)}</b>
          ${l.chain?`<span class="chip ok" style="margin-top:5px">سلسلة إثبات: ${esc(l.chain)}</span>`:""}
          <span class="muted" style="display:block;margin-top:4px">${esc(l.seller||"—")}</span></div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:15px;flex:none">${(+l.price||0).toLocaleString("en")} <span style="font-size:9px;color:#8a8fa5">ر.س</span></b></div>
      <button class="btn" style="margin-top:10px;padding:10px" onclick="buy('${l.id}','${esc(l.name)}',${+l.price||0})">اشترِ — الدفع عبر المنصة</button></div>`).join("");
  return `<main>
    <div class="stage" style="border-radius:26px">
      <b style="font-size:15px;color:#f5c518">السوق</b>
      <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">النسبة معلنة قبل النشر، والدفع عبر المنصة. القميص الموثّق يحمل شهادته من السجل.</span>
    </div>
    ${(()=>{
      const mine = ls.filter(l=>l.buyer_name===ME.name);
      const lead = auc.filter(l=>l.top_bidder===ME.name);
      if(!mine.length && !lead.length) return MK.card(MK.h("خزانتي")+
        `<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center">
          <b style="display:block;font-size:12.5px">خزانتك تبدأ من أول قطعة موثّقة</b>
          <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8;margin-top:5px">ما تشتريه أو تفوز به يدخل هنا بسلسلة إثباته — ولا يُحذف بعدها</span></div>`);
      return MK.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${MK.h("خزانتي")}<span style="font-size:9.5px;font-weight:900;color:#8a8fa5">${mine.length?'<span class="ltr">'+mine.length+'</span> قطعة':"—"}${lead.length?' · متصدّر <span class="ltr">'+lead.length+'</span>':""}</span></div>
      ${mine.map(l=>`<div style="background:#151a2e;border-radius:18px;padding:14px 16px;color:#faf8f3;margin-bottom:8px;position:relative;overflow:hidden">
        <div style="position:absolute;inset-inline-start:70%;top:-70%;width:60%;height:240%;background:#f5c518;border-radius:50%;opacity:.14"></div>
        <div style="position:relative">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
            <div style="min-width:0"><b style="font-size:12.5px">${esc(l.name)}</b>
              <span style="display:block;font-size:9.5px;color:#9aa0b8;font-weight:700;margin-top:4px">من ${esc(l.seller||"—")}${l.sold_at?' · <span class="ltr">'+esc(String(l.sold_at).slice(0,10))+'</span>':""}</span></div>
            <b class="ltr" style="font-family:'Space Grotesk';font-size:15px;color:#f5c518;flex:none">${(+l.price||0).toLocaleString("en")}</b></div>
          <div style="margin-top:11px;padding-top:10px;border-top:1px solid #333a55">
            <span style="display:block;font-size:9px;font-weight:900;color:#f5c518">سلسلة الإثبات</span>
            <div style="display:flex;align-items:center;gap:6px;margin-top:7px;flex-wrap:wrap">
              ${[l.chain||"الجهة البائعة", "بيع عبر المنصة", "باسمك"].map((s,i)=>`${i?'<span style="color:#5b6480;font-size:11px">←</span>':""}<span style="background:rgba(255,255,255,.1);border-radius:7px;padding:4px 9px;font-size:9px;font-weight:800">${esc(s)}</span>`).join("")}
            </div>
            <span style="display:block;font-size:9px;color:#9aa0b8;font-weight:700;line-height:1.7;margin-top:8px">أي جهة تفتح السلسلة ترى المصدر نفسه — والقطعة بلا سلسلة تبقى بلا شهادة.</span>
          </div></div></div>`).join("")}
      ${lead.length?`<div style="border-top:1px solid #f0ece2;padding-top:11px;margin-top:3px">
        <b style="display:block;font-size:11.5px;font-weight:900;margin-bottom:8px">مزادات أنت متصدّرها</b>
        ${lead.map(l=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #f0ece2">
          <div style="flex:1;min-width:0"><b style="font-size:11.5px">${esc(l.name)}</b>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700">مزايدتك الأعلى — ولم يُحسم بعد</span></div>
          <b class="ltr" style="font-size:13px;color:#c78c00;flex:none">${(+l.price||0).toLocaleString("en")}</b></div>`).join("")}
      </div>`:""}`);
    })()}

    ${auc.length?MK.card(MK.h("مزادات — قمصان موثقة","#c78c00")+aucCard):""}
    ${MK.card(MK.h("معروض للبيع")+(fixed.length?fixedCard:MK.empty("السوق فارغ بعد")))}
    ${MK.card(MK.h("أدرج منتجًا")+
      `<div class="fld"><label>اسم المنتج</label><input id="ls_n" placeholder="قميص الموسم الموثّق"></div>
       <div class="fld"><label>السعر بالريال</label><input id="ls_p" dir="ltr" type="number" placeholder="180"></div>
       <div class="fld"><label>النوع</label><select id="ls_t" style="width:100%;box-sizing:border-box;border:1px solid #e3ded2;border-radius:11px;padding:11px;font:700 12px Cairo;background:#fff"><option value="fixed">سعر ثابت</option><option value="auction">مزاد</option></select></div>
       <button class="btn" onclick="addList()">أدرج — النسبة معلنة</button>`)}
    <div class="note">النِّسب: بضاعة ٨–١٠٪ · منتج رقمي وتذاكر ١٥–٢٠٪ · قميص موثّق ١٨–٢٠٪ — تُعلن قبل الإدراج لا بعده.</div>
  </main>`;
};
window.buy=async(id,n,p)=>{
  const {error}=await sb.from("listings").update({buyer_name:ME.name,buyer_id:ME.id,status:"sold",sold_at:new Date().toISOString()}).eq("id",id);
  if(error&&!/buyer|sold/.test(error.message)) return toast("تعذّر: "+error.message,1);
  await trans(`شراء عبر المنصة: ${n} — ${p} ر.س`);
  toast(error?"سُجّل الشراء في سجل الشفافية — والخزانة تنتظر ترحيل القاعدة":"دخل خزانتك — بسلسلة إثباته"); render();
};
window.bid=async(id,p,n)=>{ const nv=(+p||0)+50;
  const {error}=await sb.from("listings").update({price:nv,top_bidder:ME.name}).eq("id",id);
  if(error&&!/top_bidder/.test(error.message)) return toast("تعذّر: "+error.message,1);
  if(error) await sb.from("listings").update({price:nv}).eq("id",id);
  await trans(`مزايدة على ${n||"قميص موثّق"} — ${nv} ر.س`);
  toast("زايدت — أنت الأعلى الآن باسمك"); render(); };
window.addList=async()=>{
  const n=($("#ls_n").value||"").trim(); if(!n) return toast("اكتب اسم المنتج",1);
  const {error}=await sb.from("listings").insert({name:n,price:+$("#ls_p").value||0,type:$("#ls_t").value,seller:ME.org||ME.name,status:"active",chain:ME.org||null});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans("إدراج في السوق: "+n); toast("أُدرج — النسبة معلنة"); render();
};

/* ══════════ العضويات الرقمية ══════════ */
T.memberships=async()=>{
  const ms=await q("m",sb.from("memberships").select("*").order("created_at",{ascending:false}).limit(40));
  const mine=ms.filter(m=>m.member_id===ME.id);
  const TIERS=[
    ["مشجع","بطاقة رقمية · تحديثات النادي",120],
    ["داعم","+ تصويت استشاري في التيفو والفعاليات",300],
    ["داعم موثّق","+ صوتك يُحتسب داخل سقف الداعمين — لا حصة تُشترى",600]
  ];
  return `<main>
    <div class="stage" style="border-radius:26px">
      <b style="font-size:15px;color:#f5c518">العضويات الرقمية</b>
      <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">منتج رقمي للجمهور البعيد — لا نسخة رقمية من عضوية الحضور. النادي يختار من مكتبة المزايا ويسعّر.</span>
    </div>
    ${MK.card(MK.h("مستويات العضوية")+
      TIERS.map(([t,d,p])=>{const on=mine.some(m=>m.tier===t);
        return `<div style="display:flex;align-items:center;gap:11px;background:${on?"#f2f8f5":"#faf8f3"};border:1px solid ${on?"#d8e6de":"#e9e4d8"};border-radius:16px;padding:12px 14px;margin-bottom:8px">
        <div style="flex:1;min-width:0"><b style="font-size:12.5px">${t}</b><span class="muted" style="display:block;margin-top:2px">${d}</span></div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:14px;flex:none">${p}</b>
        ${on?`<span style="color:#2c6e49;font-weight:900;font-size:10.5px;flex:none">عضو ✓</span>`
            :`<button class="btn" style="width:auto;padding:8px 14px;border-radius:999px;font-size:10.5px;flex:none" onclick="joinTier('${t}',${p})">انضم</button>`}</div>`}).join(""))}
    ${(()=>{
      const tier = mine.length ? (mine.some(m=>m.tier==="داعم موثّق")?"داعم موثّق":mine.some(m=>m.tier==="داعم")?"داعم":"مشجع") : null;
      const W = [
        {k:"التيفو والفعاليات والتصميم", p:100, c:"#2c6e49", d:"صوتك كامل — هذا مجاله"},
        {k:"التقييم العام", p:15, c:"#c78c00", d:"سقف صلب لكل الداعمين مجتمعين — لا نصيب فرديًّا يُشترى", cap:true},
        {k:"القرار الفنّي — تشكيل وتبديل", p:0, c:"#a83b25", d:"صفر — للمدرب وحده"},
        {k:"التعاقدات والانتقالات", p:0, c:"#a83b25", d:"صفر — للنادي ووكيل اللاعب"}
      ];
      return MK.card(MK.h("ثقل صوتك")+
      `<span class="muted" style="display:block;line-height:1.95;margin-bottom:13px">${tier?"أنت «"+tier+"» — وهذا ما يزنه صوتك في كل مجال:":"لو انضممت، هذا ما يزنه صوتك في كل مجال — قبل أن تدفع ريالًا:"}</span>
      <div style="display:flex;flex-direction:column;gap:11px">
        ${W.map(w=>`<div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <b style="font-size:11.5px;font-weight:800">${w.k}</b>
            <b class="ltr" style="font-size:12px;font-weight:900;color:${w.c};white-space:nowrap">${w.p}%${w.cap?" سقفًا":""}</b></div>
          <div style="height:7px;background:#f0ece2;border-radius:99px;margin-top:5px;overflow:hidden">
            <span style="display:block;height:100%;width:${w.p||2}%;border-radius:99px;background:${w.p?w.c:"#e0dbcd"}"></span></div>
          <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:4px;line-height:1.7">${w.d}</span>
        </div>`).join("")}
      </div>
      <div class="dnote" style="margin-top:13px"><b style="color:#f5c518">المال لا يشتري وزنًا.</b> العضوية تفتح مجال التيفو والفعاليات، ولا تزيد نصيبك في تقييم لاعب ولا تمنحك رأيًا في قرار فنّي أو تعاقدي. والجمهور لا يُحتسب إلا بعتبة ظهور.</div>
      <div class="dnote" style="margin-top:9px">لقاءات المعجبين للمحترفين البالغين في الأندية الكبيرة فقط — بإشراف النادي واعتماد اللاعب ووكيله، ولا تخص الفئات السنية.</div>`);
    })()}
    ${ms.length?MK.card(MK.h("أعضاء ناديك")+ms.slice(0,8).map(m=>`<div class="lrow"><span class="ic">◉</span><div style="flex:1;min-width:0"><b style="font-size:12px">${esc(m.member_name||"عضو")}</b><span class="muted" style="display:block">${esc(m.tier||"")} · ${esc(m.org||"")}</span></div><b class="ltr" style="flex:none;color:#2c6e49">${(+m.price||0).toLocaleString("en")}</b></div>`).join("")):""}
  </main>`;
};
window.joinTier=async(t,p)=>{
  const {error}=await sb.from("memberships").insert({org:ME.org||"نادي",member_id:ME.id,member_name:ME.name,tier:t,price:p});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans("عضوية رقمية: "+t); toast("انضممت — بطاقتك الرقمية جاهزة"); render();
};

/* ══════════ الرعاية ══════════ */
T.sponsor=async()=>{
  const [mt,ev,pf,ls]=await Promise.all([
    q("m",sb.from("matches").select("id,status,organizer_name").limit(200)),
    q("e",sb.from("match_events").select("id").limit(500)),
    q("p",sb.from("profiles").select("id,role,org").limit(300)),
    q("l",sb.from("listings").select("id,seller").limit(100))
  ]);
  const orgs=[...new Set(pf.map(p=>p.org).filter(Boolean))];
  const players=pf.filter(p=>p.role==="player").length;
  return `<main>
    <div class="stage" style="border-radius:26px">
      <b style="font-size:15px;color:#f5c518">الرعايات</b>
      <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">أثر مُقاس من نشاط موثق — لا تقديرات. الموضوع قد يكون نادٍ أو ملعب أو بطولة أو لاعب بموافقته.</span>
    </div>
    <div class="stat3">
      <div class="stat"><b style="color:#4636e3" class="ltr">${mt.filter(m=>m.status==="final").length}</b><span class="muted">مباراة موثقة</span></div>
      <div class="stat"><b style="color:#151a2e" class="ltr">${ev.length}</b><span class="muted">حدثًا مسجّلًا</span></div>
      <div class="stat"><b style="color:#c78c00" class="ltr">${players}</b><span class="muted">لاعبًا</span></div>
    </div>
    ${MK.card(MK.h("جهات قابلة للرعاية")+
      (orgs.length?orgs.slice(0,6).map(o=>`<div class="lrow"><span class="ic">◈</span><div style="flex:1;min-width:0"><b style="font-size:12px">${esc(o)}</b><span class="muted" style="display:block">${pf.filter(p=>p.org===o).length} عضوًا · ${ls.filter(l=>l.seller===o).length} معروضًا</span></div><button class="btn ghost" style="width:auto;padding:7px 13px;border-radius:999px;font-size:10px;flex:none" onclick="go('reports')">تقرير الأثر</button></div>`).join(""):MK.empty("لا جهات بعد")))}
    ${MK.card(MK.h("فرص مقترحة","#c78c00")+
      `<div style="display:flex;flex-direction:column;gap:7px">
        ${[["أطقم الموسم","ملاءمة عالية","#4636e3"],["رعاية بطولة","عالية","#c78c00"],["لوحات الملاعب","متوسطة","#8a8fa5"]].map(([a,b,c])=>`<div style="display:flex;justify-content:space-between;align-items:center;background:#faf8f3;border:1px solid #e9e4d8;border-radius:13px;padding:11px 13px"><b style="font-size:11.5px">${a}</b><span style="font-size:10.5px;font-weight:900;color:${c}">${b}</span></div>`).join("")}
      </div>`)}
    <div class="note">كل رقم هنا من سجل موثق باسم مسؤول عنه — يمكن للراعي التحقق منه بنفسه.</div>
  </main>`;
};

(function(){
  Object.assign(TITLES,{market:"السوق",memberships:"العضويات",sponsor:"الرعايات"});
})();
