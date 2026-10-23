/* PlayIn365 — الدفعة ٦: تفصيل مصادر التقييم · بطاقتي كصورة — إكمال مسار اللاعب ١٠٠٪ */
const RD={};

/* ── مصادر التقييم الأربعة بأوزانها وسقفها الصلب ── */
RD.SRC=[
  {k:"recorded",ar:"مسجَّل",w:50,c:"#151a2e",d:"أحداث وثّقها منظم مسؤول في مباريات مكتملة"},
  {k:"experts",ar:"خبراء",w:30,c:"#4636e3",d:"مدربون ومحللون وكشافون موثّقون — ووزن كل خبير يتحرك بسجله"},
  {k:"backers",ar:"داعمون موثّقون",w:15,c:"#c78c00",d:"أعضاء عضويات موثّقون — رأيهم مسموع لا حاكم"},
  {k:"public",ar:"جمهور",w:5,c:"#c9c2b2",d:"التقدير العام — أقل وزن عن قصد"}
];

T.ratingDetail=async()=>{
  const [evs,joins,tr,pf]=await Promise.all([
    q("e",sb.from("match_events").select("*,matches(title,organizer_name,status)").eq("who",ME.name).order("created_at",{ascending:false})),
    q("j",sb.from("match_joins").select("match_id,attended").eq("player_id",ME.id)),
    q("t",sb.from("transparency").select("actor,action,created_at").order("created_at",{ascending:false}).limit(60)),
    q("p",sb.from("profiles").select("name,role,org").in("role",["coach","scout","medical"]).limit(30))
  ]);
  const per={};evs.forEach(e=>{(per[e.match_id]=per[e.match_id]||[]).push(e)});
  const groups=Object.values(per);
  const verified=new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  const ready=groups.length>=5;
  const sc=g=>{let s=6;g.forEach(e=>{if(e.type==="goal")s+=.5;if(e.type==="assist")s+=.3;if(e.type==="red")s-=.5});return Math.max(1,Math.min(10,s))};
  const recorded=ready?(groups.reduce((a,g)=>a+sc(g),0)/groups.length):null;

  /* من ساهم فعلًا: المنظمون الذين وثّقوا أحداثك */
  const organizers={};
  evs.forEach(e=>{ if(e.recorded_by) organizers[e.recorded_by]=(organizers[e.recorded_by]||0)+1; });
  const orgList=Object.entries(organizers).sort((a,b)=>b[1]-a[1]);
  const experts=pf.filter(p=>p.name&&p.org===ME.org).slice(0,4);

  const bar=(pct,c)=>`<div style="height:8px;background:#f0ece2;border-radius:99px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${c};border-radius:99px"></div></div>`;

  const srcCard=s=>{
    const active=s.k==="recorded"&&recorded!==null;
    const val=active?recorded.toFixed(1):"—";
    const contrib=s.k==="recorded"?orgList.length:s.k==="experts"?experts.length:0;
    return `<div class="card" style="border-radius:20px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px">
        <b style="font-size:12.5px">${s.ar} — <span class="ltr" style="font-family:'Space Grotesk';color:${s.c}">${s.w}٪</span></b>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:15px;color:${active?s.c:"#c9c2b2"}">${val}</b></div>
      ${bar(s.w*2,s.c)}
      <span class="muted" style="display:block;line-height:1.9;margin-top:7px">${s.d}</span>
      ${s.k==="recorded"&&orgList.length?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid #f0ece2;display:flex;flex-direction:column;gap:6px">
        <span style="font-size:10px;font-weight:900;color:#8a8fa5">من وثّق أحداثك</span>
        ${orgList.map(([n,c])=>`<div style="display:flex;justify-content:space-between;align-items:center;background:#faf8f3;border:1px solid #efece3;border-radius:11px;padding:8px 11px">
          <span style="font-size:11px;font-weight:800">${esc(n)} — منظم مسؤول</span>
          <span class="ltr" style="font-size:10.5px;font-weight:900;color:#4636e3">${c} حدثًا</span></div>`).join("")}
      </div>`:""}
      ${s.k==="experts"?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid #f0ece2">
        ${experts.length?`<span style="font-size:10px;font-weight:900;color:#8a8fa5;display:block;margin-bottom:6px">خبراء جهتك المؤهّلون للتقييم</span>
        <div style="display:flex;flex-direction:column;gap:6px">${experts.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;background:#faf8f3;border:1px solid #efece3;border-radius:11px;padding:8px 11px">
          <span style="font-size:11px;font-weight:800">${esc(p.name)}</span>
          <span style="font-size:10px;font-weight:900;color:#8a8fa5">${esc(roleAr[p.role]||p.role)}</span></div>`).join("")}</div>
        <span class="muted" style="display:block;margin-top:8px">لم يُسجَّل تقييم خبير بعد — الوزن محفوظ ولا يُوزَّع على غيره.</span>`
        :`<span class="muted">لا خبراء مؤهّلون في جهتك بعد.</span>`}</div>`:""}
      ${(s.k==="backers"||s.k==="public")?`<div style="margin-top:9px;padding-top:9px;border-top:1px solid #f0ece2"><span class="muted">لا مساهمات بعد — والسقف يمنع تجاوزها ٢٠٪ مهما بلغ العدد.</span></div>`:""}
    </div>`;
  };

  return `<main>
    <div class="stage" style="border-radius:26px">
      <div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
      <div style="position:relative;display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="min-width:0">
          <b style="font-size:15px;color:#f5c518">تفصيل التقييم</b>
          <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">رقم واحد ظاهر، وتحته أربعة مصادر بأوزانها — وكل مصدر يقول من ساهم فيه بالاسم.</span>
        </div>
        <b class="ltr" style="font-family:'Space Grotesk';font-size:34px;line-height:1;flex:none">${ready?recorded.toFixed(1):"—"}</b>
      </div>
    </div>

    <div class="card" style="border-radius:26px">
      <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">تركيبة الوزن</b>
      ${P3.compBar()}
      <div style="background:#fff6d6;border:1px solid #f0e2b4;border-radius:14px;padding:11px 13px;margin-top:12px">
        <b style="font-size:11px;color:#8a6a1e;display:block;margin-bottom:4px">سقف صلب</b>
        <span style="font-size:11.5px;font-weight:700;color:#8a6a1e;line-height:1.85">الداعمون + الجمهور ≤ <span class="ltr">٢٠٪</span> مهما كان عددهم. الشعبية لا تصنع سمعة رياضية.</span>
      </div>
    </div>

    ${ready?"":`<div class="card" style="border-radius:26px;text-align:center;padding:24px">
      <b style="font-size:13px">لا تقييم قبل <span class="ltr">٥</span> مباريات موثّقة</b>
      <span class="muted" style="display:block;margin-top:6px;line-height:1.9">عندك <span class="ltr">${verified}</span> — و«—» انتظار لا صفر: الصفر يُقرأ حكمًا والشرطة تُقرأ انتظارًا.</span>
      <div style="display:flex;gap:5px;justify-content:center;margin-top:13px">
        ${[...Array(5)].map((_,i)=>`<span style="width:26px;height:8px;border-radius:99px;background:${i<verified?"#4636e3":"#efece3"}"></span>`).join("")}</div></div>`}

    <div style="display:flex;flex-direction:column;gap:10px">
      <b class="h2" style="color:#4636e3">المصادر الأربعة</b>
      ${RD.SRC.map(srcCard).join("")}
    </div>

    <div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:9px">المعادلة المعلنة</b>
      <div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:14px;padding:13px;font-family:'Space Grotesk';font-size:12px;font-weight:700;direction:ltr;text-align:left;color:#151a2e;line-height:1.9;unicode-bidi:isolate">
        6.0 + (0.5 × goal) + (0.3 × assist) − (0.5 × red)</div>
      <span class="muted" style="display:block;margin-top:9px;line-height:1.9">تُحسب لكل مباراة موثّقة ثم يُؤخذ متوسطها. المعادلة معلنة ولا تُغيَّر إلا بقرار معلن في سجل الشفافية — لا بزر.</span>
    </div>

    ${groups.length?`<div class="card" style="border-radius:26px">
      <b class="h2" style="display:block;margin-bottom:9px">أثر كل مباراة على رقمك</b>
      ${groups.slice(0,6).map((g,i)=>{const v=sc(g),m=g[0].matches||{};
        const gl=g.filter(e=>e.type==="goal").length,as=g.filter(e=>e.type==="assist").length;
        return `<div class="lrow">
          <span class="ic">${i+1}</span>
          <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(m.title||"مباراة")}</b>
            <span class="muted" style="display:block">${gl?`<span class="ltr">${gl}</span> هدف · `:""}${as?`<span class="ltr">${as}</span> صناعة · `:""}وثّقه ${esc(g[0].recorded_by||"المنظم")}</span></div>
          <b class="ltr" style="font-family:'Space Grotesk';font-size:13px;color:${v>=7?"#2c6e49":v>=6?"#4636e3":"#a83b25"};flex:none">${v.toFixed(1)}</b></div>`}).join("")}
    </div>`:""}

    <div class="dnote">لا أحد يرفع تقييمك بالمجاملة ولا يخفضه بالمزاج. كل نقطة مرتبطة بحدث موثّق باسم مسؤول عنه — والاعتراض غير موجود لأن التصحيح باسم صاحبه.</div>
  </main>`;
};

/* ── بطاقتي كصورة: رسم على Canvas بهوية برايم ── */
T.myCard=async()=>{
  const [evs,joins]=await Promise.all([
    q("e",sb.from("match_events").select("type,match_id,minute,created_at,recorded_by,matches(title,comp,organizer_name)").eq("who",ME.name)),
    q("j",sb.from("match_joins").select("match_id,attended").eq("player_id",ME.id))
  ]);
  const per={};evs.forEach(e=>{(per[e.match_id]=per[e.match_id]||[]).push(e)});
  const gs=Object.values(per),ready=gs.length>=5;
  const sc=g=>{let s=6;g.forEach(e=>{if(e.type==="goal")s+=.5;if(e.type==="assist")s+=.3;if(e.type==="red")s-=.5});return Math.max(1,Math.min(10,s))};
  const rating=ready?(gs.reduce((a,g)=>a+sc(g),0)/gs.length).toFixed(1):"—";
  const ms=new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  const goals=evs.filter(e=>e.type==="goal").length, assists=evs.filter(e=>e.type==="assist").length;
  /* المحطة الأبرز — أعلى إنجاز موثّق في مباراة واحدة، باسم من سجّله */
  const peak=(()=>{
    let best=null;
    Object.values(per).forEach(g=>{
      const gl=g.filter(e=>e.type==="goal").length, as=g.filter(e=>e.type==="assist").length;
      if(!gl&&!as) return;
      const w=gl*2+as;
      if(!best||w>best.w) best={w,gl,as,g};
    });
    if(!best) return null;
    const e0=best.g[0]||{}, m=e0.matches||{};
    const label = best.gl>=3 ? "هاتريك" : best.gl>=2 ? "ثنائية" : best.gl&&best.as ? "هدف وصناعة" : best.gl ? "هدف" : best.as>=2 ? "صناعتان" : "صناعة";
    return { label, gl:best.gl, as:best.as,
      title: m.title||"مباراة موثّقة",
      by: e0.recorded_by||m.organizer_name||"",
      at: String(e0.created_at||"").slice(0,10) };
  })();
  window.__PICARD={peak,name:ME.name,pos:ME.pos||"لاعب",org:ME.org||"",age:ME.age||"",rating,ms,goals,assists,id:String(ME.id).slice(0,8)};
  return `<main>
    <div class="note">بطاقتك تُصدَّر صورة جاهزة للنشر — بأرقامك الموثّقة فقط، ولا تحمل شيئًا محجوبًا.</div>
    <div id="cardWrap" style="background:#151a2e;border-radius:26px;padding:24px 22px;color:#faf8f3;position:relative;overflow:hidden">
      <div style="position:absolute;inset-inline-start:60%;top:-75%;width:72%;height:240%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.52"></div>
      <div style="position:relative">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="wm" dir="ltr" style="unicode-bidi:isolate;font-size:17px"><span style="color:#faf8f3">Play</span><span style="color:#f5c518">In</span><span style="color:#4636e3;font-size:.46em;vertical-align:super;letter-spacing:0">365</span></span>
          <span style="font-size:10px;font-weight:800;color:#c6cade">سجل موثّق</span>
        </div>
        <div style="display:flex;align-items:center;gap:14px;margin-top:20px">
          <span style="width:74px;height:74px;flex:none;border-radius:50% 50% 50% 13px;background:linear-gradient(160deg,#f5c518,#c78c00);display:grid;place-items:center;color:#151a2e;font-size:27px;font-weight:900">${esc((ME.name||"؟")[0])}</span>
          <div style="min-width:0">
            <b style="font-size:19px;display:block">${esc(ME.name)}</b>
            <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:700;margin-top:4px">${esc(ME.pos||"لاعب")}${ME.age?` · <span class="ltr">${ME.age}</span> سنة`:""}${ME.org?" · "+esc(ME.org):""}</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:20px">
          ${[[rating,"التقييم","#f5c518"],[ms,"مباراة","#faf8f3"],[goals,"هدف","#faf8f3"],[assists,"صناعة","#faf8f3"]].map(([v,l,c])=>`<div style="background:rgba(255,255,255,.09);border-radius:14px;padding:12px 6px;text-align:center">
            <b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:19px;color:${c}">${v}</b>
            <span style="font-size:8.5px;color:#9aa0b8;font-weight:800">${l}</span></div>`).join("")}
        </div>
        ${peak?`<div style="margin-top:14px;background:rgba(245,197,24,.12);border:1px solid rgba(245,197,24,.3);border-radius:16px;padding:13px 14px;display:flex;gap:12px;align-items:center">
          <span style="width:38px;height:38px;flex:none;border-radius:50% 50% 50% 9px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:16px">★</span>
          <div style="flex:1;min-width:0">
            <span style="display:block;font-size:9px;font-weight:900;color:#f5c518">المحطة الأبرز</span>
            <b style="display:block;font-size:12.5px;font-weight:900;margin-top:2px">${peak.label} — ${esc(peak.title)}</b>
            <span style="display:block;font-size:9px;color:#9aa0b8;font-weight:700;margin-top:3px">${peak.by?"وقّعها "+esc(peak.by):"بلا مصدر مسجَّل"}${peak.at?' · <span class="ltr">'+esc(peak.at)+'</span>':""}</span>
          </div></div>`:""}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding-top:14px;border-top:1px solid #333a55">
          <span style="font-size:9.5px;color:#9aa0b8;font-weight:700;line-height:1.7">كل رقم موثّق باسم منظم مسؤول</span>
          <span class="ltr" style="font-size:9.5px;font-family:'Space Grotesk';font-weight:700;color:#c6cade">#${String(ME.id).slice(0,8)}</span>
        </div>
      </div>
    </div>
    <button class="btn" onclick="cardPNG(this)">نزّل البطاقة صورة</button>
    <button class="btn ghost" onclick="soStory()">شارِك الرابط</button>
    <span class="muted" style="display:block;text-align:center;line-height:1.9">الصورة بمقاس <span class="ltr">1080×1350</span> — مناسبة للنشر، وتحمل معرّفك للتحقق.</span>
  </main>`;
};

window.cardPNG=async(btn)=>{
  const D=window.__PICARD; if(!D) return toast("أعد فتح البطاقة",1);
  if(btn){btn.disabled=true;btn.textContent="جارٍ الرسم…";}
  try{
    const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;
    const x=c.getContext("2d");
    x.fillStyle="#151a2e";x.fillRect(0,0,W,H);
    const g=x.createLinearGradient(W*0.2,0,W,H*0.75);
    g.addColorStop(0,"#4636e3");g.addColorStop(1,"#7b5cff");
    x.save();x.globalAlpha=.5;x.fillStyle=g;x.beginPath();
    x.ellipse(W*0.95,H*0.16,W*0.62,H*0.42,0,0,Math.PI*2);x.fill();x.restore();

    const wm=(cx,cy,size)=>{
      x.textAlign="left";x.direction="ltr";
      x.font=`700 ${size}px 'Space Grotesk', sans-serif`;
      let w=x.measureText("Play").width;
      x.fillStyle="#faf8f3";x.fillText("Play",cx,cy);
      x.fillStyle="#f5c518";x.fillText("In",cx+w,cy);
      const w2=x.measureText("In").width;
      x.font=`700 ${size*0.46}px 'Space Grotesk', sans-serif`;
      x.fillStyle="#4636e3";x.fillText("365",cx+w+w2,cy-size*0.42);
    };
    wm(72,120,58);
    x.textAlign="right";x.direction="rtl";
    x.font="800 30px Cairo, sans-serif";x.fillStyle="#c6cade";
    x.fillText("سجل موثّق",W-72,120);

    // القطرة
    const ax=W-72-108, ay=250;
    const grd=x.createLinearGradient(ax,ay,ax+216,ay+216);
    grd.addColorStop(0,"#f5c518");grd.addColorStop(1,"#c78c00");
    x.fillStyle=grd;x.beginPath();
    const r=108,cx0=ax+r,cy0=ay+r;
    x.moveTo(cx0-r,cy0); x.arc(cx0,cy0,r,Math.PI,Math.PI*1.5); x.arc(cx0,cy0,r,Math.PI*1.5,0);
    x.arc(cx0,cy0,r,0,Math.PI*0.5); x.lineTo(cx0-r+34,cy0+r); x.quadraticCurveTo(cx0-r,cy0+r,cx0-r,cy0+r-34);
    x.closePath();x.fill();
    x.fillStyle="#151a2e";x.font="900 92px Cairo, sans-serif";x.textAlign="center";x.textBaseline="middle";
    x.fillText((D.name||"؟")[0],cx0,cy0+4);
    x.textBaseline="alphabetic";

    x.textAlign="right";
    x.fillStyle="#faf8f3";x.font="900 66px Cairo, sans-serif";
    x.fillText(D.name,W-72-244,ay+92);
    x.fillStyle="#c6cade";x.font="700 34px Cairo, sans-serif";
    x.fillText([D.pos,D.age?D.age+" سنة":"",D.org].filter(Boolean).join(" · "),W-72-244,ay+152);

    const stats=[[D.rating,"التقييم","#f5c518"],[D.ms,"مباراة","#faf8f3"],[D.goals,"هدف","#faf8f3"],[D.assists,"صناعة","#faf8f3"]];
    const bw=(W-144-3*18)/4, by=620;
    stats.forEach((s,i)=>{
      const bx=W-72-bw-(i*(bw+18));
      x.fillStyle="rgba(255,255,255,.09)";
      if(x.roundRect){x.beginPath();x.roundRect(bx,by,bw,190,26);x.fill();}else x.fillRect(bx,by,bw,190);
      x.textAlign="center";x.direction="ltr";
      x.fillStyle=s[2];x.font="700 62px 'Space Grotesk', sans-serif";
      x.fillText(String(s[0]),bx+bw/2,by+104);
      x.direction="rtl";x.fillStyle="#9aa0b8";x.font="800 26px Cairo, sans-serif";
      x.fillText(s[1],bx+bw/2,by+152);
    });

    if(D.peak){
      const py=by+230, ph=168;
      x.fillStyle="rgba(245,197,24,.12)";
      if(x.roundRect){x.beginPath();x.roundRect(72,py,W-144,ph,28);x.fill();}else x.fillRect(72,py,W-144,ph);
      x.strokeStyle="rgba(245,197,24,.3)";x.lineWidth=2;
      if(x.roundRect){x.beginPath();x.roundRect(72,py,W-144,ph,28);x.stroke();}
      x.fillStyle="#f5c518";x.beginPath();x.arc(W-72-56,py+ph/2,38,0,Math.PI*2);x.fill();
      x.fillStyle="#151a2e";x.font="900 36px Cairo, sans-serif";x.textAlign="center";x.textBaseline="middle";
      x.fillText("★",W-72-56,py+ph/2+2);x.textBaseline="alphabetic";
      const tx=W-72-116;
      x.textAlign="right";
      x.fillStyle="#f5c518";x.font="900 24px Cairo, sans-serif";
      x.fillText("المحطة الأبرز",tx,py+52);
      x.fillStyle="#faf8f3";x.font="900 36px Cairo, sans-serif";
      let ttl=D.peak.label+" — "+D.peak.title;
      while(x.measureText(ttl).width>W-144-160 && ttl.length>12) ttl=ttl.slice(0,-2);
      x.fillText(ttl,tx,py+100);
      x.fillStyle="#9aa0b8";x.font="700 24px Cairo, sans-serif";
      x.fillText((D.peak.by?"وقّعها "+D.peak.by:"بلا مصدر مسجَّل")+(D.peak.at?" · "+D.peak.at:""),tx,py+140);
    }

    x.strokeStyle="#333a55";x.lineWidth=2;
    x.beginPath();x.moveTo(72,H-190);x.lineTo(W-72,H-190);x.stroke();
    x.textAlign="right";x.fillStyle="#9aa0b8";x.font="700 28px Cairo, sans-serif";
    x.fillText("كل رقم موثّق باسم منظم مسؤول — يمكن لأي جهة التحقق منه",W-72,H-130);
    x.textAlign="left";x.direction="ltr";x.font="700 26px 'Space Grotesk', sans-serif";x.fillStyle="#c6cade";
    x.fillText("playin365.app  ·  #"+D.id,72,H-130);
    x.textAlign="right";x.direction="rtl";
    x.fillStyle="#f5c518";x.font="900 30px Cairo, sans-serif";
    x.fillText("بطاقة الموسم",W-72,H-70);

    const blob=await new Promise(res=>c.toBlob(res,"image/png"));
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="playin365-"+(D.name||"card").replace(/\s+/g,"-")+".png";
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    await trans("تصدير بطاقة الموسم صورة");
    toast("نُزّلت البطاقة صورة — جاهزة للنشر");
  }catch(e){ console.error(e); toast("تعذّر الرسم: "+e.message,1); }
  if(btn){btn.disabled=false;btn.textContent="نزّل البطاقة صورة";}
};

/* ── التركيب ── */
(function(){
  Object.assign(TITLES,{ratingDetail:"تفصيل التقييم",myCard:"بطاقتي"});
  const _pp=P3&&P3.playerProfile;
  if(_pp) P3.playerProfile=async()=>{
    const body=await _pp();
    const rows=`<div class="lrow" onclick="go('ratingDetail')" style="cursor:pointer"><span class="ic">◉</span><div style="flex:1"><b style="font-size:12px">تفصيل التقييم — من ساهم فيه</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('myCard')" style="cursor:pointer"><span class="ic">★</span><div style="flex:1"><b style="font-size:12px">بطاقتي — صورة جاهزة للنشر</b></div><span style="color:#4636e3;font-weight:900">←</span></div>`;
    return body.replace('<b class="h2" style="display:block;margin-bottom:6px">المزيد</b>','<b class="h2" style="display:block;margin-bottom:6px">المزيد</b>'+rows);
  };
  const _feed=T.feed;
  if(_feed) T.feed=async()=>{
    const body=await _feed();
    return body.replace('onclick="soStory()">شارِكها</button>','onclick="go(\'myCard\')">بطاقتي ←</button>');
  };
})();
