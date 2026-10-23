/* PlayIn365 — الدفعة ٩: لوحة النادي · غرفة البطولة وتعيين الحكام · اعتماد الجهات · طابور الموافقات الإدارية */
const CL={};
CL.empty=t=>`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center"><span class="muted">${esc(t)}</span></div>`;

/* ═══ لوحة النادي الجامعة ═══ */
T.club=async()=>{
  const org=ME.org||"";
  const [pf,ev,mt,ls,mem,opps]=await Promise.all([
    q("p",sb.from("profiles").select("name,role,org,pos,age").not("name","is",null).limit(200)),
    q("e",sb.from("match_events").select("who,type,match_id").limit(300)),
    q("m",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(30)),
    q("l",sb.from("listings").select("*").limit(30)),
    q("mm",sb.from("memberships").select("*").limit(60)),
    q("o",sb.from("pi_opps").select("*").limit(60))
  ]);
  const mine=pf.filter(p=>p.org===org);
  const players=mine.filter(p=>p.role==="player");
  const groups={};players.forEach(p=>{const g=p.age?("U"+(p.age<=15?15:p.age<=17?17:19)):"غير محدد";groups[g]=(groups[g]||0)+1});
  const live=mt.find(m=>m.status==="live"), today=mt.find(m=>m.status==="today");
  const watchAll=(()=>{try{return Object.keys(localStorage).filter(k=>k.startsWith("pi_watch_")).reduce((a,k)=>{try{return a.concat(JSON.parse(localStorage.getItem(k)||"[]"))}catch(e){return a}},[])}catch(e){return []}})();
  const contactSent=opps.filter(o=>o.kind==="contact").length;
  const accepted=opps.filter(o=>o.kind==="contact"&&o.status==="accepted").length;
  const trials=opps.filter(o=>o.kind==="trial").length;
  const sponsors=ls.filter(l=>l.seller===org).length;
  const memRev=mem.filter(m=>m.org===org).reduce((s,m)=>s+(+m.price||0),0);
  return `<main>
  <div class="stage" style="border-radius:26px;padding:22px 20px 24px">
    <div style="position:absolute;inset-inline-start:60%;top:-70%;width:74%;height:240%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.52"></div>
    <div style="position:relative;display:flex;align-items:center;gap:14px">
      <span style="width:58px;height:58px;flex:none;border-radius:50% 50% 8px 50%;background:linear-gradient(160deg,#4636e3,#2a2260);color:#fff;display:grid;place-items:center;font-weight:900;font-size:22px">${esc((org||"؟")[0])}</span>
      <div style="min-width:0">
        <div style="display:flex;align-items:center;gap:7px"><b style="font-size:16px">${esc(org||"النادي")}</b>
          <span style="width:13px;height:16px;background:linear-gradient(160deg,#f5c518,#c78c00);clip-path:polygon(50% 0,100% 16%,100% 66%,50% 100%,0 66%,0 16%);display:inline-block;flex:none"></span></div>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:4px"><span class="ltr">${players.length}</span> لاعبًا · <span class="ltr">${Object.keys(groups).length}</span> فئة عمرية · <span class="ltr">${mine.filter(p=>p.role==="coach").length}</span> مدرب</span>
      </div>
    </div>
  </div>

  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:12px">خط الاستقطاب — عبر كشافيك</b>
    <div style="display:flex;flex-direction:column;gap:9px">
      ${[["قوائم المتابعة",watchAll.length+" لاعبًا","#151a2e"],
         ["طلبات تواصل مرسلة",contactSent+" — عبر أولياء الأمور 🔒","#c78c00"],
         ["دعوات مقبولة",String(accepted),"#4636e3"],
         ["تجارب أداء مفتوحة",String(trials),"#4636e3"]].map(([k,v,c])=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:11.5px;font-weight:700">
        <span style="color:#8a8fa5">${k}</span><b style="color:${c};text-align:end">${v}</b></div>`).join("")}
    </div>
    <div style="display:flex;gap:7px;margin-top:12px">
      <button class="btn ghost" style="flex:1;padding:10px;font-size:11px" onclick="go('scout')">قائمة المتابعة ←</button>
      <button class="btn ghost" style="flex:1;padding:10px;font-size:11px" onclick="clubTrial()">افتح تجربة</button></div>
    <span class="muted" style="display:block;margin-top:9px;line-height:1.9">لا تواصل مباشر مع قاصر — كل طلب يمرّ بولي أمره، ولا اطّلاع على ملف بلا إذنه.</span>
  </div>

  ${live||today?`<div class="stage" style="border-radius:22px;cursor:pointer" onclick="go('matchView','${(live||today).id}')">
    <div style="position:absolute;inset-inline-start:66%;top:-60%;width:66%;height:220%;background:${live?"#e8531f":"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:.45"></div>
    <div style="position:relative;display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div style="min-width:0">
        <b style="font-size:12.5px;color:#f5c518">${live?"مباراة الليلة":"مباراة اليوم"}</b>
        <span style="display:block;font-size:13.5px;font-weight:900;margin-top:5px">${esc((live||today).title)}</span>
        <span style="display:block;font-size:10.5px;color:#9aa0b8;font-weight:700;margin-top:3px">${esc((live||today).venue||"")} · ${esc((live||today).organizer_name||"")}</span></div>
      ${live?`<span style="display:inline-flex;align-items:center;gap:6px;background:#e8531f;color:#fff;border-radius:999px;padding:4px 12px;font-size:10px;font-weight:900;flex:none"><span style="width:6px;height:6px;background:#fff;border-radius:50%;animation:pulse 1.4s infinite"></span>مباشر</span>`
        :`<b class="ltr" style="font-family:'Space Grotesk';font-size:17px;flex:none">${esc((live||today).match_time||"")}</b>`}</div></div>`:""}

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#4636e3">الفرق والفئات</b>
      <a onclick="go('teams')" style="font-size:11.5px;font-weight:900">التفصيل ←</a></div>
    ${Object.keys(groups).length?Object.entries(groups).sort().map(([g,n])=>{const mx=Math.max(...Object.values(groups),1);
      return `<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:4px"><span style="color:#565d78">${esc(g)}</span><span class="ltr" style="color:#4636e3;font-family:'Space Grotesk'">${n}</span></div>
      <div style="height:8px;background:#f0ece2;border-radius:99px;overflow:hidden"><div style="width:${n/mx*100}%;height:100%;background:#4636e3;border-radius:99px"></div></div></div>`}).join(""):CL.empty("لا لاعبين مسجّلين في النادي بعد")}
  </div>

  <div class="card" style="border-radius:26px">
    <b class="h2" style="color:#4636e3;display:block;margin-bottom:11px">الرعايات والعضويات</b>
    <div class="stat3" style="margin-bottom:11px">
      <div class="stat"><b class="ltr" style="color:#c78c00">${sponsors}</b><span class="muted">عرضًا في المتجر</span></div>
      <div class="stat"><b class="ltr" style="color:#4636e3">${mem.filter(m=>m.org===org).length}</b><span class="muted">عضوًا</span></div>
      <div class="stat"><b class="ltr" style="color:#2c6e49">${memRev.toLocaleString("en")}</b><span class="muted">إيراد ر.س</span></div>
    </div>
    <div style="display:flex;gap:7px">
      <button class="btn ghost" style="flex:1;padding:10px;font-size:11px" onclick="go('market')">المتجر ←</button>
      <button class="btn ghost" style="flex:1;padding:10px;font-size:11px" onclick="go('reports')">تقرير الراعي ←</button></div>
    <span class="muted" style="display:block;margin-top:9px;line-height:1.9">تصويت العضو استشاري ومحدود المجال (تيفو · فعاليات · تصميم) ولا يمسّ قرارًا فنيًا أو تعاقديًا.</span>
  </div>
  <div class="note">لوحة النادي تجمع ما كان متفرّقًا: الاستقطاب والفئات والمباشر والرعايات — وكل رقم من مصدره الموثّق.</div>
  </main>`;
};
window.clubTrial=async()=>{
  const t=prompt("عنوان التجربة (مثل: نادي الشرق يفتح تجارب U17):");
  if(!t||!t.trim())return;
  const pf=await q("p",sb.from("profiles").select("name").eq("role","player").not("name","is",null).limit(40));
  if(!pf.length) return toast("لا لاعبين ظاهرين",1);
  const rows=pf.slice(0,20).map(p=>({player_name:p.name,kind:"trial",title:t.trim(),org:ME.org||"",body:"تبحث عن مراكز محددة — سجلك يُراجع قبل الدعوة.",deadline:new Date(Date.now()+7*864e5).toISOString().slice(0,10),status:"open",created_by:ME.name}));
  const {error}=await sb.from("pi_opps").insert(rows);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`فتح تجربة أداء — ${t.trim()} لـ${rows.length} لاعبًا`);
  toast(`ظهرت التجربة في «فرصك» لـ${rows.length} لاعبًا`); render();
};

/* ═══ غرفة البطولة ═══ */
T.tournament=async()=>{
  const rows=await q("t",sb.from("pi_tours").select("*").order("grp",{ascending:true}));
  const mt=await q("m",sb.from("matches").select("*").order("created_at",{ascending:false}).limit(40));
  const refs=await q("r",sb.from("pi_refs").select("*"));
  /* pi_tours يحمل نوعين: صف بطولة (لها اسم ومنظّم) وصف ترتيب فريق (له team ومجموعة).
     خلطهما كان يطبع NaN — والرقم بلا مصدر لا يُطبع. */
  const stand=rows.filter(r=>r.team);
  const tours=rows.filter(r=>!r.team);
  const local=tours.filter(t=>String(t.scope||"local")!=="official");
  const host=local[0]||tours[0]||null;
  const name=host?host.name:"البطولة";
  const teamsN=stand.length||(host&&host.teams)||0;
  const grps=[...new Set(stand.map(r=>r.grp).filter(Boolean))].sort();
  const pts=r=>r.won*3+r.drew;
  const gd=r=>r.gf-r.ga;
  const sorted=g=>stand.filter(r=>r.grp===g).sort((a,b)=>pts(b)-pts(a)||gd(b)-gd(a)||b.gf-a.gf);
  const stage=(()=>{try{return localStorage.getItem("pi_tstage")||"groups"}catch(e){return "groups"}})();
  const STAGES=[["groups","المجموعات"],["knockout","خروج المغلوب"],["final","النهائي"]];
  const unassigned=mt.filter(m=>m.status!=="final"&&!refs.some(r=>r.match_id===m.id));
  const assigned=refs.slice(0,6);
  return `<main>
  <div class="stage" style="border-radius:26px">
    <div style="position:absolute;inset-inline-start:64%;top:-70%;width:70%;height:230%;background:linear-gradient(200deg,#4636e3,#7b5cff);border-radius:50%;opacity:.5"></div>
    <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b style="font-size:15px;color:#f5c518">${esc(name)}</b>
        <span style="display:block;font-size:11.5px;color:#c6cade;font-weight:500;line-height:1.85;margin-top:5px">غرفة التحكم: المجموعات والترتيب وتعيين الحكام. الترتيب محسوب من النتائج المسجّلة لا مدخَل يدويًا.</span></div>
      <div style="text-align:center;flex:none"><b class="ltr" style="display:block;font-family:'Space Grotesk';font-size:22px;color:${teamsN?"#f5c518":"#8a93b0"}">${teamsN||"—"}</b><span style="font-size:8.5px;color:#9aa0b8;font-weight:800">فريقًا</span></div>
    </div>
  </div>

  <div class="card" style="border-radius:22px">
    <b class="h2" style="display:block;margin-bottom:9px">مرحلة البطولة</b>
    <div style="display:flex;gap:6px">
      ${STAGES.map(([k,ar])=>`<button onclick="tStage('${k}')" style="flex:1;background:${stage===k?"#4636e3":"#faf8f3"};color:${stage===k?"#fff":"#565d78"};border:1px solid ${stage===k?"#4636e3":"#e9e4d8"};border-radius:13px;padding:11px 8px;font:900 11.5px Cairo;cursor:pointer">${ar}</button>`).join("")}
    </div>
  </div>

  ${grps.length?grps.map(g=>`<div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#4636e3">المجموعة ${esc(g)}</b>
      <span class="muted">لعب · فائز · تعادل · خاسر · فارق · نقاط</span></div>
    <div style="overflow-x:auto">
      <table style="border-collapse:separate;border-spacing:0 4px;width:100%;min-width:400px">
        <thead><tr>
          <th style="text-align:start;font-size:9.5px;font-weight:900;color:#8a8fa5;padding:0 8px 6px">الفريق</th>
          ${["ل","ف","ت","خ","+/−","ن"].map(h=>`<th style="font-size:9.5px;font-weight:900;color:#8a8fa5;padding:0 5px 6px;text-align:center">${h}</th>`).join("")}
        </tr></thead>
        <tbody>${sorted(g).map((r,i)=>`<tr style="background:${i<2?"#f6f5ff":"#faf8f3"}">
          <td style="padding:9px 8px;border-radius:0 10px 10px 0"><span style="display:flex;align-items:center;gap:8px">
            <span class="ltr" style="width:19px;height:19px;flex:none;border-radius:6px;background:${i<2?"#4636e3":"#e9e4d8"};color:${i<2?"#fff":"#8a8fa5"};display:grid;place-items:center;font:700 10px 'Space Grotesk'">${i+1}</span>
            <b style="font-size:11.5px">${esc(r.team)}</b>${i<2?`<span style="font-size:9px;font-weight:900;color:#4636e3">يتأهّل</span>`:""}</span></td>
          ${[r.played,r.won,r.drew,r.lost,(gd(r)>0?"+":"")+gd(r),pts(r)].map((v,j)=>`<td class="ltr" style="text-align:center;padding:9px 5px;font:${j===5?"700 13px":"600 11.5px"} 'Space Grotesk';color:${j===5?"#4636e3":"#565d78"};${j===5?"border-radius:10px 0 0 10px":""}">${v}</td>`).join("")}
        </tr>`).join("")}</tbody>
      </table></div>
  </div>`).join(""):`<div class="card" style="border-radius:26px;text-align:center">
    <b style="display:block;font-size:13px">لا جدول مجموعات بعد</b>
    <span class="muted" style="display:block;line-height:1.85;margin-top:6px">الترتيب يُحسب من النتائج المسجَّلة — لا يُدخل يدويًا. سجّل مباريات البطولة ويظهر الجدول وحده.</span>
    ${host&&host.teams?`<span class="muted" style="display:block;margin-top:7px">${esc(host.name)} — <span class="ltr">${host.teams}</span> فريقًا مسجَّلًا عند منظّمها</span>`:""}
  </div>`}

  <div class="card" style="border-radius:26px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <b class="h2" style="color:#4636e3">تعيين الحكام</b>
      <span style="background:${unassigned.length?"#fff6d6":"#e9f0ea"};color:${unassigned.length?"#c78c00":"#2c6e49"};border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:900"><span class="ltr">${unassigned.length}</span> بلا حكم</span></div>
    ${unassigned.length?unassigned.slice(0,5).map(m=>`<div class="lrow">
      <span class="ic">▶</span>
      <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(m.title)}</b>
        <span class="muted" style="display:block">${esc(m.venue||"")} · ${esc(m.organizer_name||"")}</span></div>
      <button class="btn" style="width:auto;padding:7px 13px;border-radius:999px;font-size:10px;flex:none" onclick="refAssign('${m.id}','${esc(m.title)}')">عيّن حكمًا</button></div>`).join("")
      :`<div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:15px;padding:14px;text-align:center"><b style="font-size:12px;color:#2c6e49">كل المباريات القائمة لها حكم ✓</b></div>`}
    ${assigned.length?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid #f0ece2">
      <b style="font-size:11px;font-weight:900;color:#8a8fa5;display:block;margin-bottom:8px">التعيينات</b>
      ${assigned.map(r=>`<div class="lrow"><span class="ic" style="background:#efedff;color:#4636e3">✓</span>
        <div style="flex:1;min-width:0"><b style="font-size:11.5px">${esc(r.referee)}</b>
          <span class="muted" style="display:block">${esc(r.match_title||"")}${r.grade?" · "+esc(r.grade):""} · عيّنه ${esc(r.assigned_by||"")}</span></div></div>`).join("")}</div>`:""}
    <div class="note" style="margin-top:11px">تعيين الحكم قرار المنظم ويُسجَّل باسمه. وقرار الحكم بعد ذلك <b>نهائي لحظة إعلانه</b> — لا اعتماد ولا اعتراض.</div>
  </div>
  </main>`;
};
window.tStage=k=>{try{localStorage.setItem("pi_tstage",k)}catch(e){};render()};
window.refAssign=async(mid,title)=>{
  const rf=await q("r",sb.from("profiles").select("name").eq("role","referee").not("name","is",null).limit(20));
  const names=rf.map(r=>r.name);
  const n=prompt("اسم الحكم:"+(names.length?"\n\n"+names.join("\n"):""),names[0]||"");
  if(!n||!n.trim())return;
  const g=prompt("درجة الحكم:","درجة أولى");
  const {error}=await sb.from("pi_refs").insert({match_id:mid,match_title:title,referee:n.trim(),grade:(g||"").trim(),assigned_by:ME.name});
  if(error) return toast("تعذّر: "+error.message,1);
  await sb.from("matches").update({referee_name:n.trim()}).eq("id",mid);
  await trans(`تعيين حكم — ${n.trim()} لمباراة ${title}`);
  toast("عُيّن الحكم وانعكس في المباراة فورًا"); render();
};

/* ═══ اعتماد الجهات — الاتحاد ═══ */
CL.APP={pending:{ar:"ينتظر القرار",bg:"#fff6d6",fg:"#c78c00"},approved:{ar:"معتمد ✓",bg:"#e9f0ea",fg:"#2c6e49"},rejected:{ar:"غير معتمد",bg:"#fbeeea",fg:"#a83b25"}};
CL.KIND={academy:"أكاديمية",club:"نادٍ",venue:"ملعب",referee:"حكم"};
T.accredit=async()=>{
  const apps=await q("a",sb.from("pi_apps").select("*").order("created_at",{ascending:false}));
  const mt=await q("m",sb.from("matches").select("id,status").limit(60));
  const ev=await q("e",sb.from("match_events").select("id").limit(400));
  const tr=await q("t",sb.from("transparency").select("action").limit(80));
  const corr=tr.filter(t=>t.action&&t.action.includes("تصحيح")).length;
  const pend=apps.filter(a=>a.status==="pending");
  return `<main>
  <div style="background:#f4f6f8;border:1px solid #d9dfe5;border-radius:12px;padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
      <div><b style="font-size:15px;color:#243244">اعتماد الجهات والدرجات</b>
        <span style="display:block;font-size:11.5px;color:#5a6a7c;font-weight:600;line-height:1.85;margin-top:4px;max-width:440px">سلطة الاتحاد: توثيق الجهات والحكام ومنح الدرجات — ولا يعدّل سجل مباراة نظّمها غيره.</span></div>
      <span style="background:#fff;border:1px solid #d9dfe5;color:#5a6a7c;border-radius:8px;padding:5px 12px;font-size:10px;font-weight:800;flex:none">سطح رسمي</span>
    </div>
  </div>
  <div class="stat3">
    <div class="stat" style="border-radius:10px"><b class="ltr" style="color:#243244">${apps.filter(a=>a.status==="approved").length}</b><span class="muted">جهة معتمدة</span></div>
    <div class="stat" style="border-radius:10px"><b class="ltr" style="color:#c78c00">${pend.length}</b><span class="muted">ينتظر القرار</span></div>
    <div class="stat" style="border-radius:10px"><b class="ltr" style="color:#4636e3">${mt.filter(m=>m.status==="final").length}</b><span class="muted">سجلًا منشورًا</span></div>
  </div>
  <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:16px 18px">
    <b style="font-size:13px;color:#243244;display:block;margin-bottom:12px">الطلبات</b>
    ${apps.length?apps.map(a=>{const S=CL.APP[a.status]||CL.APP.pending;
      return `<div style="background:#f9fafb;border:1px solid #e6eaee;border-radius:10px;padding:11px 13px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <div style="min-width:0"><b style="font-size:12px;color:#243244">${esc(a.entity)}</b>
          <span style="display:block;font-size:10px;color:#8a95a3;font-weight:700;margin-top:2px">${esc(CL.KIND[a.kind]||a.kind||"")}${a.grade?" · درجة "+esc(a.grade):""}${a.decided_by?" · قرار "+esc(a.decided_by):""}</span></div>
        <span style="background:${S.bg};color:${S.fg};border-radius:999px;padding:4px 11px;font-size:9.5px;font-weight:900;flex:none">${S.ar}</span></div>
      ${a.note?`<span style="display:block;font-size:10.5px;color:#5a6a7c;font-weight:700;margin-top:7px;line-height:1.8">${esc(a.note)}</span>`:""}
      ${a.status==="pending"?`<div style="display:flex;gap:6px;margin-top:10px">
        <button class="btn" style="flex:1;padding:9px;font-size:10.5px" onclick="accDecide('${a.id}','approved','${esc(a.entity)}')">اعتمِد</button>
        <button class="btn ghost" style="flex:1;padding:9px;font-size:10.5px" onclick="accDecide('${a.id}','rejected','${esc(a.entity)}')">لا يُعتمد</button></div>`:""}
    </div>`}).join(""):CL.empty("لا طلبات اعتماد")}
    <button class="btn ghost" style="margin-top:6px" onclick="accAdd()">+ طلب اعتماد</button>
  </div>
  <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:16px 18px">
    <b style="font-size:13px;color:#243244;display:block;margin-bottom:11px">حجم السجلات وحدود السلطة</b>
    <div style="display:flex;flex-direction:column;gap:7px">
      ${[["سجلات منشورة",mt.filter(m=>m.status==="final").length],["أحداث موثقة",ev.length],["تصحيحات إدخال",corr]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:700"><span style="color:#8a95a3">${k}</span><b class="ltr" style="color:#243244">${v}</b></div>`).join("")}
    </div>
    <div style="background:#f2f8f5;border:1px solid #d8e6de;border-radius:10px;padding:11px 13px;margin-top:12px">
      <span style="font-size:10.5px;font-weight:700;color:#1d4a3e;line-height:1.85;display:block">كل تصحيح باسم منظّمه ووقته — تصحيح لا اعتراض. والاتحاد يوثّق الجهات ولا يملك زرًا لتعديل نتيجة.</span></div>
  </div>
  </main>`;
};
window.accDecide=async(id,st,entity)=>{
  let note=null;
  if(st==="rejected"){ note=prompt("سبب عدم الاعتماد — يُدوَّن ويُعرض للجهة:"); if(note===null) return; }
  const {error}=await sb.from("pi_apps").update({status:st,note:note?note.trim():null,decided_by:ME.name}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`${st==="approved"?"اعتماد":"عدم اعتماد"} جهة — ${entity}`);
  toast(st==="approved"?"اعتُمدت الجهة باسمك ووقته":"دُوّن القرار وسببه"); render();
};
window.accAdd=async()=>{
  const e=prompt("اسم الجهة أو الحكم:"); if(!e||!e.trim())return;
  const k=prompt("النوع: academy / club / venue / referee","academy");
  const g=prompt("الدرجة المطلوبة:","أ");
  const {error}=await sb.from("pi_apps").insert({entity:e.trim(),kind:(k||"academy").trim(),grade:(g||"").trim(),status:"pending"});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`تقديم طلب اعتماد — ${e.trim()}`);
  toast("قُدّم الطلب — ينتظر قرار الاتحاد"); render();
};

/* ═══ طابور الموافقات الإدارية ═══ */
CL.STEPS=["المدرب","المشرف","المدير","التنفيذ"];
CL.AK={budget:{ar:"ميزانية",c:"#4636e3"},travel:{ar:"سفر",c:"#c78c00"},contract:{ar:"تعاقد",c:"#2c6e49"}};
T.approvals=async()=>{
  const org=ME.org||"";
  const all=ME.role==="admin";
  const base=sb.from("pi_approvals").select("*").order("created_at",{ascending:false});
  const rows=await q("a",all?base:base.eq("org",org));
  const open=rows.filter(r=>r.status==="open");
  const sum=open.reduce((s,r)=>s+(+r.amount||0),0);
  return `<main>
  <div style="background:#f4f6f8;border:1px solid #d9dfe5;border-radius:12px;padding:18px 20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
      <div><b style="font-size:15px;color:#243244">الموافقات الإدارية${all?" — كل الجهات":""}</b>
        <span style="display:block;font-size:11.5px;color:#5a6a7c;font-weight:600;line-height:1.85;margin-top:4px;max-width:450px">ميزانية · سفر · تعاقد. سلسلة توقيع إدارية بحتة — <b>لا تمسّ نتيجة مباراة ولا حدثًا ولا تقييمًا</b>، فتلك تدخل السجل لحظتها بلا اعتماد.</span></div>
      <span style="background:#fff;border:1px solid #d9dfe5;color:#5a6a7c;border-radius:8px;padding:5px 12px;font-size:10px;font-weight:800;flex:none">سطح رسمي</span>
    </div>
  </div>
  <div class="stat3">
    <div class="stat" style="border-radius:10px"><b class="ltr" style="color:${open.length?"#c78c00":"#8a8fa5"}">${open.length||"—"}</b><span class="muted">طلبًا قائمًا</span></div>
    <div class="stat" style="border-radius:10px"><b class="ltr" style="color:${sum?"#243244":"#8a8fa5"}">${sum?sum.toLocaleString("en"):"—"}</b><span class="muted">قيمتها ر.س</span></div>
    <div class="stat" style="border-radius:10px"><b class="ltr" style="color:${rows.filter(r=>r.status==="approved").length?"#2c6e49":"#8a8fa5"}">${rows.filter(r=>r.status==="approved").length||"—"}</b><span class="muted">اعتُمد</span></div>
  </div>
  <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:16px 18px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <b style="font-size:13px;color:#243244">الطلبات</b>
      <button class="btn" style="width:auto;padding:8px 14px;border-radius:10px;font-size:10.5px" onclick="apAdd()">+ طلب</button></div>
    ${rows.length?rows.map(r=>{const K=CL.AK[r.kind]||CL.AK.budget;
      const done=r.status==="approved"?4:r.status==="rejected"?r.step:r.step;
      return `<div style="background:#f9fafb;border:1px solid #e6eaee;border-radius:10px;padding:13px 14px;margin-bottom:9px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:11px">
        <div style="min-width:0"><b style="font-size:12.5px;color:#243244">${esc(r.title)}</b>
          <span style="display:block;font-size:10px;color:#8a95a3;font-weight:700;margin-top:3px">${all?esc(r.org)+" · ":""}طلبه ${esc(r.requested_by||"")}${r.amount?` · <span class="ltr">${(+r.amount).toLocaleString("en")}</span> ر.س`:""}</span></div>
        <span style="background:${r.status==="approved"?"#e9f0ea":r.status==="rejected"?"#fbeeea":"#fff6d6"};color:${r.status==="approved"?"#2c6e49":r.status==="rejected"?"#a83b25":"#c78c00"};border-radius:8px;padding:4px 10px;font-size:9.5px;font-weight:900;flex:none">${r.status==="approved"?"اعتُمد ✓":r.status==="rejected"?"رُدّ":K.ar}</span></div>
      <div style="display:flex;align-items:center;margin-bottom:${r.status==="open"?"11px":"0"}">
        ${CL.STEPS.map((s,i)=>{const at=i<done, cur=r.status==="open"&&i===done-1;
          return `${i?`<span style="flex:1;height:2.5px;background:${at?"#4636e3":"repeating-linear-gradient(90deg,#d9dfe5 0 5px,transparent 5px 10px)"};margin-top:-13px"></span>`:""}
          <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:none;width:52px">
            <span style="width:${cur?26:22}px;height:${cur?26:22}px;border-radius:50%;background:${at?"#4636e3":"#eef1f4"};color:${at?"#fff":"#a4aeb8"};border:${cur?"2.5px solid #c78c00":"0"};display:grid;place-items:center;font-size:${at?"10px":"9px"};font-weight:900">${at?"✓":i+1}</span>
            <span style="font-size:8.5px;font-weight:800;color:${cur?"#c78c00":at?"#4636e3":"#a4aeb8"}">${s}</span></div>`}).join("")}
      </div>
      ${r.note?`<span style="display:block;font-size:10.5px;color:#5a6a7c;font-weight:700;line-height:1.8;margin-bottom:9px">السبب: ${esc(r.note)}</span>`:""}
      ${r.status==="open"?`<div style="display:flex;gap:6px">
        <button class="btn" style="flex:1;padding:9px;font-size:10.5px" onclick="apStep('${r.id}',${r.step},'${esc(r.title)}')">${r.step>=4?"نفّذ":"وقّع الخطوة "+(r.step+1)}</button>
        <button class="btn ghost" style="flex:1;padding:9px;font-size:10.5px" onclick="apReject('${r.id}','${esc(r.title)}')">ردّ بسبب</button></div>`:""}
      ${r.decided_by?`<span style="display:block;font-size:9.5px;color:#8a95a3;font-weight:700;margin-top:8px">قرار ${esc(r.decided_by)}</span>`:""}
    </div>`}).join(""):CL.empty("لا طلبات إدارية")}
  </div>
  <div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:14px 16px">
    <span style="font-size:10.5px;font-weight:700;color:#5a6a7c;line-height:1.9;display:block">الحدّ الفاصل: هذا الطابور للقرارات الإدارية والمالية فقط. أحداث المباريات ونتائجها وتقييمات اللاعبين لا تدخله — تُسجَّل وتنعكس فورًا باسم منظّمها، وتُصحَّح باسمه إن أخطأ.</span>
  </div>
  </main>`;
};
window.apAdd=async()=>{
  const t=prompt("عنوان الطلب:"); if(!t||!t.trim())return;
  const k=prompt("النوع: budget / travel / contract","budget");
  const a=prompt("القيمة بالريال:","0");
  const {error}=await sb.from("pi_approvals").insert({org:ME.org||"",title:t.trim(),kind:(k||"budget").trim(),amount:+a||0,requested_by:ME.name,step:1,status:"open"});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`طلب موافقة إدارية — ${t.trim()}`);
  toast("قُدّم الطلب — الخطوة الأولى باسمك"); render();
};
window.apStep=async(id,step,title)=>{
  const nxt=step+1;
  const done=nxt>=4;
  const {error}=await sb.from("pi_approvals").update({step:Math.min(4,nxt),status:done?"approved":"open",decided_by:ME.name}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`${done?"تنفيذ":"توقيع خطوة "+nxt} — ${title}`);
  toast(done?"اعتُمد ونُفّذ — باسمك ووقته":"وُقّعت الخطوة باسمك"); render();
};
window.apReject=async(id,title)=>{
  const n=prompt("سبب الردّ — يُدوَّن ويُعرض لمقدّم الطلب:"); if(n===null)return;
  const {error}=await sb.from("pi_approvals").update({status:"rejected",note:(n||"").trim(),decided_by:ME.name}).eq("id",id);
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`ردّ طلب إداري — ${title}`);
  toast("دُوّن الردّ وسببه باسمك"); render();
};

/* ═══ التركيب ═══ */
(function(){
  Object.assign(TITLES,{club:"النادي",tournament:"غرفة البطولة",accredit:"اعتماد الجهات",approvals:"الموافقات الإدارية"});
  const _erp=T.erp;
  if(_erp) T.erp=async()=>{
    const body=await _erp();
    const rows=`<div style="background:#fff;border:1px solid #d9dfe5;border-radius:12px;padding:16px 18px">
      <b style="font-size:13px;color:#243244;display:block;margin-bottom:10px">أقسام الديوان</b>
      <div class="lrow" onclick="go('approvals')" style="cursor:pointer"><span class="ic" style="background:#eef1f4;color:#243244">◈</span><div style="flex:1"><b style="font-size:12px">الموافقات الإدارية — ميزانية وسفر وتعاقد</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('accredit')" style="cursor:pointer"><span class="ic" style="background:#eef1f4;color:#243244">★</span><div style="flex:1"><b style="font-size:12px">اعتماد الجهات والدرجات</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('tournament')" style="cursor:pointer"><span class="ic" style="background:#eef1f4;color:#243244">▦</span><div style="flex:1"><b style="font-size:12px">غرفة البطولة وتعيين الحكام</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
    </div>`;
    return body.replace("</main>",rows+"</main>");
  };
  const _op=P3&&P3.orgProfile;
  if(_op) P3.orgProfile=async()=>{
    const body=await _op();
    const extra=`<div class="card" style="border-radius:26px"><b class="h2" style="display:block;margin-bottom:6px">لوحات إضافية</b>
      <div class="lrow" onclick="go('club')" style="cursor:pointer"><span class="ic">◎</span><div style="flex:1"><b style="font-size:12px">لوحة النادي — الاستقطاب والرعايات</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('tournament')" style="cursor:pointer"><span class="ic">▦</span><div style="flex:1"><b style="font-size:12px">غرفة البطولة وتعيين الحكام</b></div><span style="color:#4636e3;font-weight:900">←</span></div>
      <div class="lrow" onclick="go('approvals')" style="cursor:pointer"><span class="ic">◈</span><div style="flex:1"><b style="font-size:12px">الموافقات الإدارية</b></div><span style="color:#4636e3;font-weight:900">←</span></div></div>`;
    return body.replace("</main>",extra+"</main>");
  };
  const _og=T.orgMatch;
  if(_og) T.orgMatch=async()=>{
    const body=await _og();
    if(!["organizer","referee","admin"].includes(ME.role)) return body;
    const link=`<button class="btn ghost" onclick="go('tournament')">غرفة البطولة وتعيين الحكام ←</button>`;
    return body.replace("</main>",link+"</main>");
  };
})();
