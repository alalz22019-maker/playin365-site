/* PlayIn365 — ملف المدرب: التاريخ · الشهادات · شجرة المتدربين · الرسوم البيانية
   يُحمَّل بعد app-co4.js. القانون ٧: ما يكتبه المدرب بنفسه يبقى «بانتظار التوثيق» حتى تؤكّده الجهة. */
const CV = {};
CV.ROLES = ["مدرب","مدرب مساعد","مدرب حراس","مدرب لياقة","محلل أداء","مدير فني"];
CV.LVL   = ["","C","B","A","Pro"];

CV.said = v => v ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#eaf5ee;color:#2c6e49;border-radius:999px;padding:2px 8px;font-size:8.5px;font-weight:900">✓ وثّقتها ${esc(v)}</span>`
                 : `<span style="display:inline-flex;align-items:center;gap:4px;background:#f2f0ea;color:#8a8fa5;border-radius:999px;padding:2px 8px;font-size:8.5px;font-weight:900">بانتظار التوثيق</span>`;

window.cvAdd = kind => {
  const isC = kind === "cert";
  const sh = document.createElement("div"); sh.id = "pi_sheet";
  sh.style.cssText = "position:fixed;inset:0;z-index:200;background:rgba(21,26,46,.45);display:flex;align-items:flex-end;justify-content:center";
  sh.onclick = e => { if(e.target===sh) sh.remove(); };
  const F = (id,lb,ph,type) => `<label style="display:block;margin-top:9px"><span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:4px">${lb}</span>
    <input id="${id}" ${type==="n"?'type="number" inputmode="numeric" class="ltr"':""} placeholder="${ph}" style="width:100%;border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:700 12px Cairo;background:#faf8f3"></label>`;
  sh.innerHTML = `<div style="background:#faf8f3;width:100%;max-width:520px;border-radius:28px 28px 0 0;padding:18px 18px 24px;max-height:86vh;overflow:auto">
    <div style="width:38px;height:4px;border-radius:99px;background:#d5d0c4;margin:0 auto 14px"></div>
    <b style="display:block;font-size:15px;font-weight:900">${isC?"شهادة أو اعتماد":"محطة في مسيرتك"}</b>
    <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">تظهر «بانتظار التوثيق» حتى تؤكّدها الجهة المُصدِرة، فتحمل ختمها.</span>
    ${isC ? F("cv_t","اسم الشهادة","رخصة تدريب B") + F("cv_i","الجهة المُصدِرة","الاتحاد السعودي لكرة القدم") +
      `<label style="display:block;margin-top:9px"><span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:4px">المستوى</span>
        <select id="cv_l" style="width:100%;border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:800 12px Cairo;background:#faf8f3">${CV.LVL.map(l=>`<option value="${l}">${l||"—"}</option>`).join("")}</select></label>` +
      F("cv_y","السنة","2024","n") + F("cv_r","رقم الشهادة (اختياري)","SAFF-2024-1180")
    : F("cv_o","النادي أو الأكاديمية","أكاديمية النخبة") +
      `<label style="display:block;margin-top:9px"><span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:4px">صفتك</span>
        <select id="cv_rl" style="width:100%;border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:800 12px Cairo;background:#faf8f3">${CV.ROLES.map(r=>`<option>${r}</option>`).join("")}</select></label>` +
      F("cv_g","الفئة","U17") +
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${F("cv_f","من سنة","2021","n")}${F("cv_e","إلى سنة (فارغ = حتى الآن)","","n")}</div>` +
      F("cv_n","سطر واحد عمّا حقّقته","صعود U17 لنهائي دوري المناطق")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
      <button onclick="cvSave('${kind}')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">أضف</button>
      <button onclick="closeSheet()" style="background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">إلغاء</button></div>
  </div>`;
  document.body.appendChild(sh);
};
window.cvSave = async kind => {
  const V = id => { const el = document.getElementById(id); return el ? String(el.value||"").trim() : ""; };
  if(kind === "cert"){
    if(!V("cv_t") || !V("cv_i")) return toast("اسم الشهادة والجهة مطلوبان", 1);
    const {error} = await sb.from("pi_certs").insert({owner_id:ME.id, person:ME.name, title:V("cv_t"), issuer:V("cv_i"),
      level:V("cv_l"), year:+V("cv_y")||null, ref_no:V("cv_r")});
    if(error) return toast(/pi_certs/.test(error.message)?"الشهادات لم تُفعَّل في القاعدة بعد":"تعذّر: "+error.message, 1);
    await trans(`أضاف شهادة — ${V("cv_t")} من ${V("cv_i")}`);
  } else {
    if(!V("cv_o")) return toast("اسم الجهة مطلوب", 1);
    const {error} = await sb.from("pi_career").insert({owner_id:ME.id, person:ME.name, org:V("cv_o"),
      title:V("cv_rl")||"مدرب", group_name:V("cv_g"), from_year:+V("cv_f")||null, to_year:+V("cv_e")||null, note:V("cv_n")});
    if(error) return toast(/pi_career/.test(error.message)?"المسيرة لم تُفعَّل في القاعدة بعد":"تعذّر: "+error.message, 1);
    await trans(`أضاف محطة في مسيرته — ${V("cv_o")}`);
  }
  closeSheet(); toast("أُضيفت — بانتظار توثيق الجهة"); render();
};
window.cvDel = async (kind,id) => {
  if(!confirm("حذف؟")) return;
  await sb.from(kind==="cert"?"pi_certs":"pi_career").delete().eq("id",id);
  toast("حُذف"); render();
};

CV.DEST = {club:["نادٍ","#4636e3","▣"],nt:["منتخب","#2c6e49","★"],cup:["بطولة","#c78c00","♛"],uni:["جامعة/ابتعاث","#7b5cff","▤"]};
window.cvAlum = () => {
  const sh=document.createElement("div"); sh.id="pi_sheet";
  sh.style.cssText="position:fixed;inset:0;z-index:200;background:rgba(21,26,46,.45);display:flex;align-items:flex-end;justify-content:center";
  sh.onclick=e=>{ if(e.target===sh) sh.remove(); };
  const F=(id,lb,ph,t)=>`<label style="display:block;margin-top:9px"><span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:4px">${lb}</span>
    <input id="${id}" ${t==="n"?'type="number" inputmode="numeric" class="ltr"':""} placeholder="${ph}" style="width:100%;border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:700 12px Cairo;background:#faf8f3"></label>`;
  sh.innerHTML=`<div style="background:#faf8f3;width:100%;max-width:520px;border-radius:28px 28px 0 0;padding:18px 18px 24px;max-height:86vh;overflow:auto">
    <div style="width:38px;height:4px;border-radius:99px;background:#d5d0c4;margin:0 auto 14px"></div>
    <b style="display:block;font-size:15px;font-weight:900">لاعب تخرّج من تحت إدارتك</b>
    <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">أين وصل بعدك — نادٍ أو منتخب أو بطولة كبيرة. يحمل ختم الجهة حين تؤكّده.</span>
    ${F("al_p","اسم اللاعب","فهد الشمراني")}
    <label style="display:block;margin-top:9px"><span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:4px">إلى أين</span>
      <select id="al_k" style="width:100%;border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:800 12px Cairo;background:#faf8f3">${Object.entries(CV.DEST).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join("")}</select></label>
    ${F("al_d","الجهة أو البطولة","نادي الشباب — الفريق الأول")}
    ${F("al_g","الفئة التي دربتَها","U17")}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">${F("al_f","من","2021","n")}${F("al_t","إلى","2024","n")}${F("al_y","سنة الانتقال","2025","n")}</div>
    ${F("al_n","سطر واحد","انتقل بعد ثلاثة مواسم تحت إدارتك")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
      <button onclick="cvAlumSave()" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">أضف</button>
      <button onclick="closeSheet()" style="background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">إلغاء</button></div></div>`;
  document.body.appendChild(sh);
};
window.cvAlumSave = async () => {
  const V=id=>{const el=document.getElementById(id);return el?String(el.value||"").trim():"";};
  if(!V("al_p")||!V("al_d")) return toast("اسم اللاعب والجهة مطلوبان",1);
  const {error}=await sb.from("pi_alumni").insert({owner_id:ME.id, coach_name:ME.name, player_name:V("al_p"),
    dest:V("al_d"), dest_kind:V("al_k")||"club", group_name:V("al_g"),
    under_from:+V("al_f")||null, under_to:+V("al_t")||null, dest_year:+V("al_y")||null, note:V("al_n")});
  if(error) return toast(/pi_alumni/.test(error.message)?"المتخرّجون لم يُفعَّلوا في القاعدة بعد":"تعذّر: "+error.message,1);
  await trans(`أضاف متخرّجًا — ${V("al_p")} إلى ${V("al_d")}`);
  closeSheet(); toast("أُضيف — بانتظار توثيق الجهة"); render();
};
window.cvAlumDel = async id => { if(!confirm("حذف؟")) return; await sb.from("pi_alumni").delete().eq("id",id); toast("حُذف"); render(); };

/* رسم بياني: أعمدة الحصص شهريًا */
CV.bars = (vals, labels, ink) => {
  const mx = Math.max(...vals, 1);
  return `<div style="display:flex;align-items:flex-end;gap:5px;height:86px;margin-top:10px">
    ${vals.map((v,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
      <b class="ltr" style="font-size:9px;font-weight:700;color:${v?ink:"#c9c2b2"}">${v||""}</b>
      <span style="width:100%;height:${Math.max(3,Math.round(v/mx*58))}px;border-radius:6px 6px 3px 6px;background:${v?ink:"#f0ece2"}"></span>
      <span style="font-size:8px;font-weight:800;color:#8a8fa5">${labels[i]}</span></div>`).join("")}
  </div>`;
};
/* رسم بياني: حلقة توزيع */
CV.ring = parts => {
  const tot = parts.reduce((s,p)=>s+p[1],0) || 1; let acc = 0;
  const seg = parts.map(([lb,v,c])=>{ const a0=acc/tot*360, a1=(acc+v)/tot*360; acc+=v;
    const R=52, r=32, C=64, rad=d=>(d-90)*Math.PI/180;
    const x0=C+R*Math.cos(rad(a0)), y0=C+R*Math.sin(rad(a0)), x1=C+R*Math.cos(rad(a1)), y1=C+R*Math.sin(rad(a1));
    const xi1=C+r*Math.cos(rad(a1)), yi1=C+r*Math.sin(rad(a1)), xi0=C+r*Math.cos(rad(a0)), yi0=C+r*Math.sin(rad(a0));
    const big=(a1-a0)>180?1:0;
    return `<path d="M${x0} ${y0} A${R} ${R} 0 ${big} 1 ${x1} ${y1} L${xi1} ${yi1} A${r} ${r} 0 ${big} 0 ${xi0} ${yi0} Z" fill="${c}"></path>`;}).join("");
  return `<div style="display:flex;align-items:center;gap:14px;margin-top:10px">
    <svg viewBox="0 0 128 128" style="width:104px;height:104px;flex:none">${seg}</svg>
    <div style="flex:1;min-width:0">${parts.map(([lb,v,c])=>`<div style="display:flex;align-items:center;gap:7px;padding:4px 0">
      <span style="width:11px;height:11px;border-radius:3px;background:${c};flex:none"></span>
      <span style="flex:1;min-width:0;font-size:10.5px;font-weight:800">${lb}</span>
      <b class="ltr" style="font-size:11px;color:${c}">${v}</b></div>`).join("")}</div></div>`;
};

T.coachMe = async () => {
  const org = ME.org || "";
  const [roster,att,ev,tr,cal,career,certs,views,hs,alum] = await Promise.all([
    CO.roster(),
    q("a", sb.from("attendance").select("*").eq("recorded_by",ME.name).order("created_at",{ascending:false}).limit(900)),
    q("e", sb.from("match_events").select("*,matches(title)").eq("recorded_by",ME.name).order("created_at",{ascending:false}).limit(80)),
    q("t", sb.from("transparency").select("*").ilike("actor","%"+ME.name+"%").order("created_at",{ascending:false}).limit(40)),
    q("c", sb.from("calendar_items").select("*").eq("created_by",ME.name).limit(400)),
    q("cv", sb.from("pi_career").select("*").eq("person",ME.name).order("from_year",{ascending:false})),
    q("ct", sb.from("pi_certs").select("*").eq("person",ME.name).order("year",{ascending:false})),
    q("v", sb.from("pi_views").select("*").limit(200)),
    q("h", sb.from("health_status").select("player_name,state").limit(140)),
    q("al", sb.from("pi_alumni").select("*").eq("coach_name",ME.name).order("dest_year",{ascending:false}))
  ]);
  const days = [...new Set(att.map(a=>String(a.created_at||"").slice(0,10)))];
  const sessions = days.length;
  const rated = [...new Set(cal.filter(c=>String(c.title||"").includes("تقييم المدرب")).map(c=>c.player_name))];
  const boards = cal.filter(c=>String(c.title||"").includes("لوح تكتيكي")).length;
  const corr = tr.filter(t=>/تصحيح/.test(t.action||"")).length;
  const yrs = career.length ? Math.max(1, career.reduce((s,c)=>s+((c.to_year||new Date().getFullYear())-(c.from_year||new Date().getFullYear())),0)) : null;
  const stats = [["سنة خبرة", yrs],["لاعبًا دربته", new Set([...att.map(a=>a.player_name), ...roster.map(p=>p.name)]).size],["متخرّجًا", alum.length],["شهادة", certs.length]];
  const pid = "PI-C-2026-" + String(1000 + (String(ME.name).split("").reduce((a,c)=>a+c.charCodeAt(0),0) % 8999));
  const hasAv = !!ME.avatar_url || CO.hasAvatar(ME.name);

  /* حصص آخر ٦ أشهر */
  const MN = ["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"];
  const now = new Date();
  const months = [...Array(6)].map((_,i)=>{ const d=new Date(now.getFullYear(), now.getMonth()-5+i, 1);
    return {k:d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"), lb:MN[d.getMonth()]}; });
  const mVals = months.map(m => days.filter(d=>d.startsWith(m.k)).length);

  /* توزيع الفئات */
  const gCount = {}; roster.forEach(p=>{ const g=CO.groupOf(p)||"غير محدّد"; gCount[g]=(gCount[g]||0)+1; });
  const GC = ["#4636e3","#f5c518","#2c6e49","#e8531f","#7b5cff"];
  const gParts = Object.entries(gCount).sort().map(([g,n],i)=>[g,n,GC[i%GC.length]]);

  /* شجرة المتدربين */
  const hMap = {}; hs.forEach(h=>hMap[h.player_name]=h.state);
  const watched = new Set(views.filter(v=>v.viewer_role==="scout"||v.viewer_role==="agent").map(v=>v.subject));
  const tree = roster.map(p => {
    const n = att.filter(a=>a.player_name===p.name).length;
    return {p, n, pct: sessions?Math.round(n/sessions*100):0, rated: rated.indexOf(p.name)>=0, watch: watched.has(p.name)};
  }).sort((a,b)=>b.n-a.n);
  const byGroup = {}; tree.forEach(t=>{ const g=CO.groupOf(t.p)||"غير محدّد"; (byGroup[g]=byGroup[g]||[]).push(t); });

  const fields = [["الصورة",hasAv,"avatarSheet()"],["الاسم",!!ME.name],["الجهة",!!ME.org,"joinByCode()"],["مسيرتك",career.length>0,"cvAdd('career')"],["شهادة",certs.length>0,"cvAdd('cert')"],["متخرّج",alum.length>0,"cvAlum()"],["كشف مرتبط",roster.length>0,"go('squad')"],["حصص موقّعة",sessions>0,"go('session')"],["تقييم بتوقيعك",rated.length>0,"go('rate')"]];
  const comp = Math.round(fields.filter(f=>f[1]).length/fields.length*100);
  const missing = fields.filter(f=>!f[1]);

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('coachHome')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <button onclick="go('settings')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⚙</button>
  </div>
  <main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;color:#faf8f3;box-shadow:0 18px 44px rgba(21,26,46,.18)">
      <div style="position:absolute;inset-inline-start:58%;top:-62%;width:86%;height:210%;background:radial-gradient(circle at 45% 50%,#f5c518,#8a6912);border-radius:50%;opacity:.2"></div>
      <div style="position:relative;padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">${WM(1)}
          <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,197,24,.16);border:1px solid rgba(245,197,24,.45);color:#f5c518;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">★ مدرب${sessions>=5?" موثّق":""}</span></div>
        <div style="display:flex;align-items:flex-end;gap:14px;margin-top:22px">
          <button onclick="toast('تعديل صورة الحساب غير متاح حاليًا',1)" style="position:relative;flex:none;background:none;border:0;padding:0;cursor:pointer">
            ${CO.av(ME.name,110,{url:ME.avatar_url,dark:true,r:"50% 50% 14px 50%",ring:"3px solid #f5c518"})}
            <span style="position:absolute;bottom:-2px;inset-inline-end:-6px;width:28px;height:28px;border-radius:${CO.DROP};background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:12px;border:2px solid #151a2e">✎</span></button>
          <div style="flex:1;min-width:0;padding-bottom:4px">
            <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">${esc((career[0]&&career[0].title)||"مدرب")}${certs.length&&certs[0].level?` · رخصة <span class="ltr">${esc(certs[0].level)}</span>`:""}</span>
            <b style="display:block;font-size:24px;font-weight:900;line-height:1.2;margin-top:3px">${esc(ME.name)}</b>
            <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${org?esc(org):"بلا جهة بعد"}</span></div></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:18px">
          ${stats.map(([k,v])=>`<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:9px 4px;text-align:center">
            <b class="ltr" style="display:block;font-size:19px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||CO.dash}</b>
            <span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:1px">${k}</span></div>`).join("")}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14)">
          <div style="min-width:0"><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">${org?"الجهة":"بلا جهة"}</span>
            <div style="display:flex;gap:6px;margin-top:6px;align-items:center;flex-wrap:wrap">
              ${org?`<span style="display:inline-flex;align-items:center;gap:6px;height:30px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;padding:0 10px 0 4px;font-size:9.5px;font-weight:900"><span style="width:22px;height:22px;border-radius:${CO.DROP};background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:10px">${esc(org.trim()[0])}</span>${esc(org)}</span>`
                :`<span style="height:30px;border-radius:999px;border:1px dashed rgba(255,255,255,.3);color:#c6cade;display:grid;place-items:center;font-size:9px;font-weight:900;padding:0 10px">تُسجَّل حين تضمّك أكاديمية</span>`}</div>
            <span class="ltr" style="display:block;font-family:'Space Grotesk';font-size:10px;font-weight:700;color:#8f9bff;margin-top:8px">${pid}</span></div>
          <div style="flex:none;width:74px;height:74px;background:#fff;border-radius:12px;padding:5px"><img src="${CO.qr(pid,180)}" alt="رمز هوية المدرب" style="width:100%;height:100%;object-fit:contain;display:block"></div>
        </div></div></div>

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("مسيرتي")}<button onclick="cvAdd('career')" style="background:#4636e3;color:#fff;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">＋ محطة</button></div>
      ${career.length?`<div style="margin-top:12px;position:relative">
        ${career.map((c,i)=>`<div style="display:flex;gap:12px;align-items:flex-start;padding-bottom:${i===career.length-1?0:14}px">
          <div style="flex:none;display:flex;flex-direction:column;align-items:center;align-self:stretch">
            <span style="width:34px;height:34px;border-radius:50% 50% 8px 50%;background:${i===0?"#4636e3":"#efedff"};color:${i===0?"#fff":"#4636e3"};display:grid;place-items:center;font-size:14px;font-weight:900;flex:none">${esc(String(c.org).trim()[0])}</span>
            ${i===career.length-1?"":`<span style="flex:1;width:2px;background:#e9e4d8;margin-top:4px"></span>`}</div>
          <div style="flex:1;min-width:0;padding-bottom:4px">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
              <b style="font-size:12.5px;font-weight:900;flex:1;min-width:0">${esc(c.org)}</b>
              <span class="ltr" style="font-size:10px;font-weight:800;color:#8a8fa5;flex:none">${c.from_year||CO.dash}${c.to_year?"–"+c.to_year:c.from_year?" – الآن":""}</span></div>
            <span style="display:block;font-size:10.5px;color:#4636e3;font-weight:800;margin-top:2px">${esc(c.title)}${c.group_name?` · <span class="ltr">${esc(c.group_name)}</span>`:""}</span>
            ${c.note?`<span style="display:block;font-size:10.5px;color:#5b6078;font-weight:700;margin-top:4px;line-height:1.7">${esc(c.note)}</span>`:""}
            <div style="display:flex;gap:6px;align-items:center;margin-top:6px">${CV.said(c.verified_by)}
              <button onclick="cvDel('career','${c.id}')" style="background:none;border:0;color:#a83b25;font:900 13px Cairo;cursor:pointer;padding:0 4px">×</button></div></div></div>`).join("")}
      </div>`
      :CO.empty("لم تُسجّل مسيرتك بعد — أضف الأندية والأكاديميات التي دربت فيها، فالكشاف والنادي يقرآنها قبل أن يقرآ أي رقم")}`)}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("الشهادات والاعتمادات")}<button onclick="cvAdd('cert')" style="background:#4636e3;color:#fff;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">＋ شهادة</button></div>
      ${certs.length?`<div style="display:flex;flex-direction:column;gap:8px;margin-top:11px">
        ${certs.map(c=>`<div style="display:flex;gap:11px;align-items:flex-start;background:${c.verified_by?"#fff8df":"#faf8f3"};border:1px solid ${c.verified_by?"#f0e2b4":"#e9e4d8"};border-radius:16px;padding:11px 13px">
          <span style="width:40px;height:40px;border-radius:50% 50% 9px 50%;background:${c.verified_by?"linear-gradient(160deg,#f5c518,#c78c00)":"#efedff"};color:${c.verified_by?"#151a2e":"#4636e3"};display:grid;place-items:center;font-size:16px;flex:none">${c.level?`<b class="ltr" style="font-size:14px">${esc(c.level)}</b>`:"▣"}</span>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
              <b style="font-size:12.5px;font-weight:900;flex:1;min-width:0">${esc(c.title)}</b>
              <span class="ltr" style="font-size:10px;font-weight:800;color:#8a8fa5;flex:none">${c.year||CO.dash}</span></div>
            <span style="display:block;font-size:10.5px;color:#5b6078;font-weight:700;margin-top:2px">${esc(c.issuer)}${c.ref_no?` · <span class="ltr">${esc(c.ref_no)}</span>`:""}</span>
            <div style="display:flex;gap:6px;align-items:center;margin-top:6px">${CV.said(c.verified_by)}
              <button onclick="cvDel('cert','${c.id}')" style="background:none;border:0;color:#a83b25;font:900 13px Cairo;cursor:pointer;padding:0 4px">×</button></div></div></div>`).join("")}
      </div>`
      :CO.empty("لا شهادة مسجّلة — أضف رخصك واعتماداتك؛ تحمل ختم الجهة حين تؤكّدها")}`)}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("متخرّجون من تحت إدارتك")}<button onclick="cvAlum()" style="background:#4636e3;color:#fff;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">＋ متخرّج</button></div>
      ${CO.sub("أين وصلوا بعدك — وهذا أصدق ما يُقاس به مدرب")}
      ${alum.length?`<div style="display:flex;flex-direction:column;gap:9px;margin-top:11px">
        ${alum.map(x=>{const D=CV.DEST[x.dest_kind]||CV.DEST.club;
        return `<div style="display:flex;gap:11px;align-items:flex-start;background:${x.verified_by?"#fff8df":"#faf8f3"};border:1px solid ${x.verified_by?"#f0e2b4":"#e9e4d8"};border-radius:16px;padding:11px 13px">
          ${CO.av(x.player_name,42,{dark:true,r:"50% 50% 10px 50%",ring:x.verified_by?"2px solid #f5c518":""})}
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
              <b style="font-size:12.5px;font-weight:900;flex:1;min-width:0">${esc(x.player_name)}</b>
              <span class="ltr" style="font-size:10px;font-weight:800;color:#8a8fa5;flex:none">${x.dest_year||CO.dash}</span></div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
              <span style="font-size:11px;flex:none;color:${D[1]}">${D[2]}</span>
              <span style="flex:1;min-width:0;font-size:11px;color:${D[1]};font-weight:900">${esc(x.dest)}</span></div>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:800;margin-top:3px">تحت إدارتك${x.group_name?` · <span class="ltr">${esc(x.group_name)}</span>`:""}${x.under_from?` · <span class="ltr">${x.under_from}–${x.under_to||""}</span>`:""}</span>
            ${x.note?`<span style="display:block;font-size:10.5px;color:#5b6078;font-weight:700;margin-top:4px;line-height:1.7">${esc(x.note)}</span>`:""}
            <div style="display:flex;gap:6px;align-items:center;margin-top:6px">${CV.said(x.verified_by)}
              <button onclick="cvAlumDel('${x.id}')" style="background:none;border:0;color:#a83b25;font:900 13px Cairo;cursor:pointer;padding:0 4px">×</button></div></div></div>`;}).join("")}
      </div>
      ${(()=>{const k={};alum.forEach(x=>k[x.dest_kind]=(k[x.dest_kind]||0)+1);
        return `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:11px;padding-top:11px;border-top:1px solid #f0ece2">
          ${Object.entries(k).map(([kk,n])=>{const D=CV.DEST[kk]||CV.DEST.club;
            return `<span style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:999px;padding:5px 11px;font-size:10px;font-weight:900;color:${D[1]}">${D[2]} <span class="ltr">${n}</span> ${D[0]}</span>`;}).join("")}</div>`;})()}`
      :CO.empty("لم تُسجّل متخرّجين بعد — من وصل ناديًا أو منتخبًا أو بطولة كبيرة بعد أن دربتَه، سجّله هنا")}`)}

    ${sessions?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("حصصك في ستة أشهر")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">كلها بتوقيعك</span></div>
      ${CV.bars(mVals, months.map(m=>m.lb), "#4636e3")}`):""}

    ${gParts.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("فئاتك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${roster.length}</span> لاعبًا</span></div>
      ${CV.ring(gParts)}`):""}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("أثرك — بالأرقام")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">من نشاط موثّق</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px">
        ${[["تقييمًا وقّعته",rated.length,"#4636e3"],["لوحًا نشرته",boards,"#c78c00"],["حدثًا سجّلته",ev.length,"#2c6e49"],["تصحيحًا باسمك",corr,"#e8531f"]].map(([k,v,c])=>`
          <div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:16px;padding:12px">
            <b class="ltr" style="display:block;font-size:24px;font-weight:700;color:${v?c:"#c9c2b2"}">${v||CO.dash}</b>
            <span style="display:block;font-size:10px;font-weight:800;color:#5b6078;margin-top:2px">${k}</span></div>`).join("")}
      </div>`)}

    ${tree.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("شجرة متدربيك")}<a onclick="go('squad')" style="font-size:11px;font-weight:900;cursor:pointer">الكشف ←</a></div>
      ${CO.sub("من دربتَهم بفئاتهم — والتزام كلٍّ محسوب من حصص وقّعتها أنت")}
      ${Object.entries(byGroup).sort().map(([g,arr])=>`<div style="margin-top:13px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="width:4px;height:14px;border-radius:99px;background:#4636e3;flex:none"></span>
          <b style="font-size:11.5px;font-weight:900"><span class="ltr">${esc(g)}</span></b>
          <span style="font-size:9.5px;color:#8a8fa5;font-weight:800"><span class="ltr">${arr.length}</span> لاعبًا</span></div>
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:2px">
          ${arr.map(t=>`<button onclick="sqSheet('${CO.esn(t.p.name)}')" style="flex:none;width:76px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:16px;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-family:Cairo;position:relative">
            ${t.watch?`<span style="position:absolute;top:5px;inset-inline-end:6px;width:8px;height:8px;border-radius:50%;background:#e8531f" title="يراقبه كشاف"></span>`:""}
            ${CO.av(t.p.name,42,{url:t.p.avatar_url,dark:true,r:"50% 50% 10px 50%",ring:t.rated?"2px solid #f5c518":""})}
            <span style="font-size:9px;font-weight:900">${esc(String(t.p.name).split(" ")[0])}</span>
            <span style="width:100%;height:5px;border-radius:999px;background:#f0ece2;overflow:hidden"><span style="display:block;height:100%;width:${t.pct}%;background:${t.pct>=80?"#2c6e49":t.pct>=50?"#4636e3":"#c78c00"}"></span></span>
            <span class="ltr" style="font-size:8.5px;font-weight:800;color:#8a8fa5">${t.pct}%</span></button>`).join("")}
        </div></div>`).join("")}
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;font-size:9px;font-weight:800;color:#8a8fa5;padding-top:10px;border-top:1px solid #f0ece2">
        <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;border:2px solid #f5c518;vertical-align:-1px"></span> قيّمتَه</span>
        <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#e8531f;vertical-align:-1px"></span> يراقبه كشاف</span>
        <span>الشريط = التزامه بحصصك</span></div>`):""}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("اكتمال ملفك")}<b class="ltr" style="font-size:11px;color:#4636e3">${comp}%</b></div>
      <div style="height:8px;border-radius:999px;background:#f0ece2;margin-top:10px;overflow:hidden"><span style="display:block;height:100%;width:${comp}%;background:#4636e3;border-radius:999px"></span></div>
      ${missing.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${missing.map(f=>f[2]
        ?`<button onclick="${f[2]}" style="background:#efedff;color:#4636e3;border:0;border-radius:999px;padding:5px 11px;font:900 10px Cairo;cursor:pointer">${f[0]==="الجهة"?"⌗ ارتبط برمز":"＋ "+f[0]}</button>`
        :`<span style="background:#f2f0ea;color:#8a8fa5;border-radius:999px;padding:5px 11px;font-size:10px;font-weight:900">${f[0]} — بتوقيع غيرك</span>`).join("")}</div>`
      :CO.sub("مكتمل — كل حقل مسنود بمصدره")}`)}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("توقيعك في سلسلة الثقة")}<a onclick="go('chain')" style="font-size:11px;font-weight:900;cursor:pointer">السلسلة ←</a></div>
      ${CO.sub("خطوتان لا ثلاث: توقيعك يدخل السجل لحظته — بلا اعتماد ولا انتظار، والخطأ يُصحَّح باسمك")}
      <div style="display:flex;align-items:center;margin-top:12px">
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <span style="width:32px;height:32px;border-radius:${CO.DROP};background:#4636e3;color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900">أنت</span>
          <span style="font-size:9px;font-weight:800;color:#4636e3">المدرب المسؤول</span></div>
        <span style="flex:1;height:2.5px;background:#4636e3;margin-top:-14px"></span>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <span style="width:32px;height:32px;border-radius:${CO.DROP};background:#2c6e49;color:#fff;display:grid;place-items:center;font-size:13px">✓</span>
          <span style="font-size:9px;font-weight:800;color:#2c6e49">السجل — فورًا</span></div></div>`)}

    ${tr.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("آخر قراراتك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">قراءة فقط — حتى لك</span></div>
      ${tr.slice(0,5).map(t=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${CO.ic("▤","#efedff","#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;line-height:1.6">${esc(t.action)}</b>
          <span class="ltr" style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(new Date(t.created_at).toLocaleString("en-GB"))}</span></div></div>`).join("")}`):""}

    <div style="background:#151a2e;border-radius:20px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden">${CO.disc()}
      <div style="position:relative"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">دورك الحالي</span><b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.2">مدرب</b></div>
      <button onclick="go('role')" style="position:relative;background:#fff;color:#151a2e;border:0;border-radius:999px;padding:9px 14px;font:900 11px Cairo;cursor:pointer">⇄ تغيير الدور</button></div>

    ${CO.note("مسيرتك وشهاداتك ومتخرّجوك تكتبهم أنت، ويحملون ختم الجهة حين تؤكّدهم — والأرقام كلها من نشاط موقّع، لا من تقدير.")}
  </main>`;
};
