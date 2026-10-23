/* PlayIn365 — واجهة الأكاديمية ٢: بطاقة تُشوّق وتُنشَر — يُحمَّل بعد app-acad3.js فيتقدّم على T.acadHome
   ما طلبه المالك: الإنجازات · الاعتماد · الرعاة · الخرّيجون (أندية/منتخبات) · المعرّف والباركود · توثيق PlayIn365/الاتحاد · المتابعون
   + التوقّع ولاعب الشهر والفخر (إنجاز الموسم · الدروع · من خرّجناهم) في الواجهة نفسها. */
ACD.short = org => String(org||"").replace("أكاديمية","").trim();
ACD.pid = org => "PI-A-2026-" + String(1000 + (String(org).split("").reduce((a,c)=>a+c.charCodeAt(0),0) % 8999));
ACD.KD = {club:["أندية","#4636e3","#efedff","▣"],nt:["منتخبات ★","#c78c00","#fff8df","★"],cup:["بطولات","#4636e3","#efedff","♛"],uni:["ابتعاث","#7b5cff","#efedff","▤"]};

T.acadHome = async () => {
  const org = ACD.who(); if(!org) return ACD.empty("لا أكاديمية محدّدة");
  const D = await ACD.load(org); const sh = ACD.short(org);
  if(!ACD.mine()) VW.log(org,"profile","فتح ملف الأكاديمية");
  const accredit = D.accredit;
  const piVerified = D.att.length>=100 && D.evs.length>0;
  const sponsors = D.sponsors;
  const mainSp = sponsors.find(s=>/رئيسي/.test(s.tier||"")) || sponsors[0];
  const nt = D.alumni.filter(a=>a.dest_kind==="nt").length, clubs = D.alumni.filter(a=>a.dest_kind==="club").length;
  const gold = D.tro.filter(t=>/بطل|وصيف|نهائي/.test(t.stage||"")).length;
  const live = D.allM.find(m=>m.status==="live" && String(m.title||"").indexOf(sh)>=0);
  const next = D.allM.find(m=>(m.status==="today"||m.status==="open") && String(m.title||"").indexOf(sh)>=0);
  const groups = [...new Set(D.players.map(p=>ACD.grpOf(p.age)).filter(g=>g&&g!=="SEN"))].sort();
  const coachesV = [...new Set(D.certs.filter(c=>c.verified_by).map(c=>c.person))].length;
  const pid = ACD.pid(org);
  const seasonTop = [...D.tro].sort((a,b)=>(b.won||0)-(a.won||0))[0];
  const month = new Date().toISOString().slice(0,7);
  const tally = {}; D.evs.filter(e=>String(e.created_at||"").startsWith(month)&&(e.type==="goal"||e.type==="assist")).forEach(e=>tally[e.who]=(tally[e.who]||0)+1);
  const poll = Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0,3); const tot = poll.reduce((s,p)=>s+p[1],0)||1;
  const pk = "pi_pred_"+(next&&next.id); const my = (()=>{try{return localStorage.getItem(pk)}catch(e){return null}})();
  const kinds = {}; D.alumni.forEach(a=>kinds[a.dest_kind]=(kinds[a.dest_kind]||0)+1);
  const chip = (t,gold) => `<span style="display:inline-flex;align-items:center;gap:5px;background:${gold?"rgba(245,197,24,.16)":"rgba(255,255,255,.1)"};border:1px solid ${gold?"rgba(245,197,24,.5)":"rgba(255,255,255,.22)"};color:${gold?"#f5c518":"#faf8f3"};border-radius:999px;padding:5px 10px;font-size:9.5px;font-weight:900">${t}</span>`;

  return `<div style="position:relative;background:#151a2e;overflow:hidden;border-radius:0 0 36px 36px">
    <img src="assets/cv-day-grass.png" alt="" style="position:absolute;inset:0;width:100%;height:230px;object-fit:cover;object-position:center 42%">
    <div style="position:absolute;inset:0;width:100%;height:230px;background:linear-gradient(180deg,rgba(21,26,46,.55) 0%,rgba(21,26,46,.12) 30%,rgba(21,26,46,.82) 74%,#151a2e 100%)"></div>
    <div style="position:absolute;inset-inline-start:60%;top:34%;width:80%;height:120%;background:#f5c518;border-radius:50%;opacity:.12"></div>
    <div style="position:relative;padding:18px 18px 22px;color:#faf8f3">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button onclick="${ACD.mine()?"go('settings')":"back()"}" style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);display:grid;place-items:center;font-size:15px;color:#faf8f3;cursor:pointer;font-family:Cairo">${ACD.mine()?"⚙":"→"}</button>
        ${WM(1)}
        <button onclick="shareCard('${ACD.esn(org)}')" style="width:40px;height:40px;border-radius:12px;background:#f5c518;border:0;display:grid;place-items:center;font-size:14px;color:#151a2e;cursor:pointer;font-family:Cairo;box-shadow:0 8px 18px rgba(245,197,24,.3)">⇪</button>
      </div>
      ${live?`<button onclick="go('matchView','${live.id}')" style="margin-top:12px;display:inline-flex;align-items:center;gap:6px;background:#e8531f;color:#fff;border:0;border-radius:999px;padding:6px 12px;font:900 10.5px Cairo;cursor:pointer"><span style="width:7px;height:7px;border-radius:50%;background:#fff;animation:pulse 1.4s infinite"></span>مباشر الآن · ${esc(live.title)}${live.score_a!=null?` <span class="ltr">${live.score_a}–${live.score_b}</span>`:""}</button>`:""}

      <div style="display:flex;align-items:flex-end;gap:14px;margin-top:${live?92:126}px">
        <div style="position:relative;flex:none">
          <span style="width:84px;height:84px;border-radius:22px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:36px;font-weight:900;border:4px solid #faf8f3;box-shadow:0 14px 34px rgba(21,26,46,.35)">${esc(ACD.ini(org))}</span>
          ${accredit?`<img src="avatars/seal-verified.png" alt="معتمدة" style="position:absolute;bottom:-8px;inset-inline-end:-10px;width:40px;height:40px;filter:drop-shadow(0 3px 6px rgba(21,26,46,.4))">`:""}
        </div>
        <div style="flex:1;min-width:0;padding-bottom:4px">
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            ${accredit?chip("★ معتمدة من الاتحاد",true):""}
            ${piVerified?chip("✓ موثّقة PlayIn365",false):""}
          </div>
          <b style="display:block;font-size:26px;font-weight:900;line-height:1.2;margin-top:6px">${esc(org)}</b>
          <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${groups.length?`<span class="ltr">${groups.length}</span> فئات`:"فئات قيد التكوين"}${D.coaches.length?` · <span class="ltr">${D.coaches.length}</span> مدربين`:""}${D.follows?` · <span class="ltr">${D.follows}</span> متابع`:""}</span>
        </div></div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:16px">
        ${[["لاعبًا",D.players.length,"#faf8f3"],["خرّيجًا",D.alumni.length,"#f5c518"],["بطولة",D.tro.length,"#f5c518"],["مدربًا معتمدًا",coachesV,"#faf8f3"]].map(([k,v,ink])=>`<div style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:9px 6px;text-align:center"><b class="ltr" style="display:block;font-size:19px;color:${v?ink:"#8a93b0"}">${v||ACD.dash}</b><span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:1px">${k}</span></div>`).join("")}
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">
        ${gold?chip(`★ <span class="ltr">${gold}</span> ${gold===1?"لقب":"ألقاب"}`,true):""}
        ${nt?chip(`★ <span class="ltr">${nt}</span> في المنتخبات`,true):""}
        ${clubs?chip(`▣ <span class="ltr">${clubs}</span> في الأندية`,false):""}
        ${D.attPct!=null?chip(`✓ حضور <span class="ltr">${D.attPct}%</span>`,false):""}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14)">
        <div style="min-width:0;flex:1">
          <span style="display:block;font-size:9px;color:#c6cade;font-weight:800">${mainSp?"الراعي الرئيسي":"رعاة الموسم"}</span>
          ${mainSp?`<div style="display:inline-flex;align-items:center;gap:8px;margin-top:6px;background:rgba(245,197,24,.14);border:1px solid rgba(245,197,24,.4);border-radius:999px;padding:4px 10px 4px 4px"><span style="width:24px;height:24px;border-radius:8px;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:11px">★</span><b style="font-size:10.5px;color:#f5c518">${esc(mainSp.title)}</b>${sponsors.length>1?`<span style="font-size:9px;color:#c6cade;font-weight:800">+<span class="ltr">${sponsors.length-1}</span></span>`:""}</div>`
            :`<span style="display:inline-block;margin-top:6px;height:28px;line-height:28px;border-radius:999px;border:1px dashed rgba(255,255,255,.3);color:#c6cade;font-size:9px;font-weight:900;padding:0 10px">تُسجَّل مع أول عقد رعاية</span>`}
          <span class="ltr" style="display:block;font-family:'Space Grotesk';font-size:10px;font-weight:700;color:#8f9bff;margin-top:8px">${pid}</span>
        </div>
        <div style="flex:none;width:74px;height:74px;background:#fff;border-radius:12px;padding:5px"><svg viewBox="0 0 21 21" shape-rendering="crispEdges" style="width:100%;height:100%;display:block"><rect width="21" height="21" fill="#fff"></rect><path d="${PL3.qr(pid)}" fill="#151a2e"></path></svg></div>
      </div>
    </div>
  </div>

  <main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button onclick="go('acadTeams','${ACD.esn(org)}')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">سجّل ابنك — تجربة مجانية</button>
      <button onclick="acFollow('${ACD.esn(org)}')" style="background:#fff;border:1px solid #e9e4d8;color:#151a2e;border-radius:14px;padding:13px;font:900 12.5px Cairo;cursor:pointer">تابع${D.follows?` · <span class="ltr">${D.follows}</span>`:""}</button>
    </div>
    ${ACD.tabs("acadHome")}

    ${next?`<div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ACD.disc("#e8531f",.9)}
      <div style="position:relative">
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:900;color:#fff"><span style="width:7px;height:7px;border-radius:50%;background:#fff;animation:pulse 1.4s infinite"></span>${next.status==="live"?"مباشر — التوقّع مغلق":"توقّع مفتوح — يُغلق عند الصافرة"}</span>
        <b style="display:block;font-size:17px;font-weight:900;margin-top:6px">${esc(next.title)} — من يفوز؟</b>
        <div style="display:flex;gap:6px;margin-top:12px">
          ${[["a",esc(next.team_a||sh)],["d","تعادل"],["b",esc(next.team_b||"الخصم")]].map(([k,lb])=>`<button onclick="acPredict('${next.id}','${k}')" style="flex:1;text-align:center;background:${my===k?"#faf8f3":"rgba(255,255,255,.14)"};color:${my===k?"#151a2e":"#faf8f3"};border:1px solid ${my===k?"#faf8f3":"rgba(255,255,255,.3)"};border-radius:12px;padding:10px 4px;font:900 11px Cairo;cursor:pointer">${lb}</button>`).join("")}</div>
      </div></div>`:""}

    ${poll.length?ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h("لاعب الشهر")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">من أحداث موثّقة · لا يدخل التقييم</span></div>
      ${poll.map(([n,c],i)=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        ${PL3.av(n,40,{dark:true,r:"50% 50% 50% 10px",ring:i===0?"2px solid #f5c518":""})}
        <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:baseline;font-size:11.5px;font-weight:900"><span>${esc(n)}</span><span style="font-size:9.5px;color:#8a8fa5;font-weight:800"><b class="ltr" style="color:${i===0?"#4636e3":"#b9b0f5"};font-size:11px">${c}</b> ${c===1?"حدث موثّق":"أحداث موثّقة"}</span></div><div style="height:7px;background:#f0ece2;border-radius:99px;overflow:hidden;margin-top:6px"><div style="height:100%;background:${i===0?"#4636e3":"#b9b0f5"};width:${Math.round(c/(poll[0][1]||1)*100)}%"></div></div></div>
        <button onclick="clapPlayer('${ACD.esn(n)}')" style="background:#efedff;color:#4636e3;border:0;border-radius:10px;padding:8px 10px;font:900 11px Cairo;cursor:pointer;flex:none">👏</button></div>`).join("")}`):""}

    ${seasonTop?`<div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;min-height:200px;display:flex;align-items:flex-end">
      <img src="assets/cv-night-strike.png" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.8">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,26,46,0) 20%,rgba(21,26,46,.96) 100%)"></div>
      <div style="position:relative;padding:18px;color:#faf8f3;width:100%">
        <div style="display:flex;justify-content:space-between;align-items:center">${chip("★ إنجاز الموسم",true)}<button onclick="go('acadPride','${ACD.esn(org)}')" style="background:none;border:0;color:#f5c518;font:900 10.5px Cairo;cursor:pointer">كل الفخر ←</button></div>
        <b style="display:block;font-size:19px;font-weight:900;line-height:1.35;margin-top:8px">${esc(seasonTop.name)}${seasonTop.stage?" — "+esc(seasonTop.stage):""}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:4px"><span class="ltr">${seasonTop.played||ACD.dash}</span> مباراة · فاز <span class="ltr">${seasonTop.won||0}</span> · سجّلها ${esc(seasonTop.created_by||"المنظم")}</span>
      </div></div>`:""}

    ${D.tro.length?ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h("خزانة الدروع")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">الذهبي يُكتسب — كل درع بمصدره</span></div>
      <div style="display:flex;gap:8px;overflow-x:auto;margin-top:12px;padding-bottom:2px">
        ${D.tro.map(t=>{const g=/بطل|وصيف|نهائي/.test(t.stage||""); return `<div style="flex:none;width:86px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:5px"><span style="width:58px;height:58px;border-radius:16px;display:grid;place-items:center;font-size:22px;background:${g?"linear-gradient(160deg,#f5c518,#c78c00)":"#fff8df"};color:${g?"#151a2e":"#c78c00"};border:1px solid ${g?"#c78c00":"#f0e2b4"}">★</span><span style="font-size:9px;font-weight:900;color:#151a2e;line-height:1.4">${esc(t.name)}</span><span style="font-size:8.5px;font-weight:800;color:${g?"#c78c00":"#8a8fa5"}">${esc(t.stage||"")}</span></div>`;}).join("")}
        ${accredit?`<div style="flex:none;width:86px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:5px"><span style="width:58px;height:58px;border-radius:16px;display:grid;place-items:center;font-size:22px;background:#151a2e;color:#f5c518">✓</span><span style="font-size:9px;font-weight:900;color:#151a2e;line-height:1.4">اعتماد الاتحاد</span></div>`:""}
      </div>`):""}

    ${D.alumni.length?ACD.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ACD.h(`من خرّجناهم — <span class="ltr">${D.alumni.length}</span>`)}<button onclick="go('acadPride','${ACD.esn(org)}')" style="background:none;border:0;font:900 11px Cairo;color:#4636e3;cursor:pointer">الكل ←</button></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${Object.entries(kinds).map(([k,n])=>{const K=ACD.KD[k]||ACD.KD.club; return `<span style="background:${K[2]};color:${K[1]};border-radius:999px;padding:5px 11px;font-size:10px;font-weight:900">${K[3]} <span class="ltr">${n}</span> ${K[0]}</span>`;}).join("")}</div>
      <div style="display:flex;gap:8px;overflow-x:auto;margin-top:10px;padding-bottom:2px">
        ${D.alumni.slice(0,6).map(a=>{const K=ACD.KD[a.dest_kind]||ACD.KD.club; return `<div style="flex:none;width:80px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:5px">${PL3.av(a.player_name,48,{dark:true,r:"50% 50% 50% 12px",ring:a.dest_kind==="nt"?"2px solid #f5c518":""})}<span style="font-size:9.5px;font-weight:900;line-height:1.3">${esc(String(a.player_name).split(" ")[0])}</span><span style="font-size:8.5px;font-weight:800;color:${K[1]};line-height:1.3">${esc(String(a.dest).split("—")[0].trim())}</span></div>`;}).join("")}
      </div>`):""}

    ${ACD.card(`${ACD.h("أنت هنا لأنك…")}
      ${[
        ["head-guardian-male","وليّ أمر — أبحث لابني عن مكان","المقاعد الحقيقية · تجربة مجانية · إذن واحد يكفي","acadTeams","50% 50% 50% 10px"],
        ["player-violet","لاعب — أريد الانضمام","حسابك يبقى لك، وسجلك يبدأ من أول حصة موقّعة","acadTeams","50% 50% 50% 10px"],
        ["coach","مدرب — أبحث عن فريق أدرّبه","كشف بأحمال · حصص بتوقيعك · لوح تكتيك","acadNet","50% 50% 10px 50%"],
        ["scout","كشّاف — أبحث عن مواهب","أحداث موثّقة لا مقاطع مختارة · والاطّلاع مسجَّل","acadPride","50% 50% 50% 10px"],
        ["fan-male","مشجّع — أتابع وأتوقّع","المباشر · التوقّع · لاعب الشهر · المدرّج","acadHub","50% 50% 50% 10px"],
        ["organizer","راعٍ أو شريك — أريد أثرًا مُقاسًا","تقرير أثر من نشاط موثّق لا من تقدير","acadNet","12px"],
        ["referee","حكم أو منظّم — أبحث عن مباريات","مبارياتنا وملاعبنا وتعييناتها","acadMatches","50% 50% 50% 10px"],
        ["gk-coach","جهة أو نادٍ — أبحث عن شراكة","الشبكة والخرّيجون والاعتماد","acadNet","50% 50% 10px 50%"]
      ].map(([img,t,s,v,r])=>`<button onclick="go('${v}','${ACD.esn(org)}')" style="width:100%;display:flex;gap:11px;align-items:center;padding:11px 0;border:0;border-top:1px solid #f0ece2;background:none;cursor:pointer;font-family:Cairo;text-align:start;color:#151a2e">
        <img src="avatars/${img}.png" alt="" style="width:40px;height:40px;border-radius:${r};object-fit:cover;object-position:top;background:#efedff;flex:none">
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${t}</b><span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${s}</span></div>
        <span style="flex:none;font-size:14px;color:#4636e3">←</span></button>`).join("")}`)}
  </main>`;
};
