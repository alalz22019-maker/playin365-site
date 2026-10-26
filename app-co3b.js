/* PlayIn365 — عمود المدرب: بقية الشاشات المعتمدة (4b · 4e · 4g · 4j · 4k)
   يُحمَّل بعد app-co3.js. قطرة المدرب أسفل-يمين في كل عنصر. */

/* ═══════════ 4b · تعليمات الحصة ═══════════ */
CO.bkey = () => "pi_brief_" + (ME&&ME.id);
CO.bdateKey = () => "pi_brief_date_" + (ME&&ME.id);
CO.btimeKey = () => "pi_brief_time_" + (ME&&ME.id);
CO.briefDate = () => { try { const v=localStorage.getItem(CO.bdateKey())||""; return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:CO.today(); } catch(e) { return CO.today(); } };
CO.briefTime = () => { try { const v=localStorage.getItem(CO.btimeKey())||""; return /^\d{2}:\d{2}$/.test(v)?v:"18:00"; } catch(e) { return "18:00"; } };
window.coBriefDate = v => { if(/^\d{4}-\d{2}-\d{2}$/.test(String(v||"")))try{localStorage.setItem(CO.bdateKey(),v)}catch(e){} };
window.coBriefTime = v => { if(/^\d{2}:\d{2}$/.test(String(v||"")))try{localStorage.setItem(CO.btimeKey(),v)}catch(e){} };
CO.brief = () => { try { return JSON.parse(localStorage.getItem(CO.bkey())||"{}"); } catch(e){ return {}; } };
CO.setBrief = o => { try{ localStorage.setItem(CO.bkey(), JSON.stringify(Object.assign(CO.brief(), o))); }catch(e){} };
CO.KIT = [["ماء قبل الحصة","water"],["واقي الساق","shin"],["حذاء عشب طبيعي","boots"],["ملابس تبديل","kit"]];
window.coScope = s => { CO.setBrief({scope:s, to:null}); render(); };
window.coTo    = n => { CO.setBrief({to:n}); render(); };
window.coKit   = k => { const b=CO.brief(), on=b.kit||[]; CO.setBrief({kit: on.includes(k)?on.filter(x=>x!==k):[...on,k]}); render(); };
window.coMsg   = v => CO.setBrief({msg:v});
window.coSend = async () => {
  if(CO._briefSending)return toast("يجري الإرسال الآن",1);
  const b=CO.brief(), msg=String(b.msg||"").trim();
  if(!msg)return toast("اكتب رسالتك أولًا",1);
  const roster=await CO.roster();
  const names=[...new Set((b.scope==="one"?(b.to?[b.to]:[]):roster.map(p=>p.name)).map(n=>String(n||"").trim()).filter(Boolean))];
  if(!names.length)return toast(b.scope==="one"?"اختر اللاعب":"لا لاعبين في الفئة المختارة",1);
  const plannedDate=CO.briefDate(),plannedTime=CO.briefTime();
  if(plannedDate<CO.today())return toast("اختر اليوم أو موعدًا لاحقًا",1);
  const kit=(b.kit||[]).map(k=>(CO.KIT.find(x=>x[1]===k)||[])[0]).filter(Boolean);
  const sub=["سجّلها "+ME.name+" — مدرب",kit.length?("يُرفق: "+kit.join(" · ")):""].filter(Boolean).join(" · ");
  const title="تعليمات المدرب — "+(msg.length>60?msg.slice(0,60)+"…":msg);
  const scope=b.scope==="one"?"للاعب "+names[0]:"لـ"+names.length+" "+CO.playerCount(names.length);
  const summary="راجع الإرسال قبل التأكيد\n"+scope+"\nالموعد: "+plannedDate+" · "+plannedTime+(kit.length?"\nالمرفقات: "+kit.join("، "):"")+"\n\n"+msg+"\n\nهل تريد الإرسال؟";
  CO._briefSending=true;
  try{
    const prior=await q("c",sb.from("calendar_items").select("player_name,title,on_date,created_by").eq("created_by",ME.name).eq("on_date",plannedDate).eq("kind","training").ilike("title","تعليمات المدرب —%").limit(500));
    const already=new Set(prior.filter(x=>x.title===title&&String(x.on_date||"").slice(0,10)===plannedDate).map(x=>x.player_name));
    const recipients=names.filter(n=>!already.has(n));
    if(!recipients.length)return toast("سبق إرسال هذه التعليمات إلى الجميع في هذا الموعد",1);
    const skipped=names.length-recipients.length;
    const finalSummary=summary.replace("\n\nهل تريد الإرسال؟",(skipped?"\nأُرسلت سابقًا إلى "+skipped+"؛ لن تُكرر لهم.":"")+"\n\nهل تريد الإرسال للمتبقين؟");
    if(!confirm(finalSummary))return;
    const rows=recipients.map(n=>({player_name:n,kind:"training",title,subtitle:sub,at_time:plannedTime,on_date:plannedDate,org:ME.org||"",needs_confirm:false,created_by:ME.name}));
    const {error}=await sb.from("calendar_items").insert(rows);
    if(error)return toast("تعذّر الإرسال: "+error.message,1);
    await trans("أرسل تعليمات الحصة لـ"+recipients.length+" "+CO.playerCount(recipients.length));
    CO.setBrief({msg:""});
    toast("وصلت التعليمات لـ"+recipients.length+" "+CO.playerCount(recipients.length)+(skipped?" · دون تكرار":"")+" — باسمك");
    render();
  }finally{CO._briefSending=false;}
};
T.brief = async () => {
  const roster = await CO.roster();
  const b = CO.brief(), scope = b.scope || "all", kit = b.kit || [], plannedDate=CO.briefDate(), plannedTime=CO.briefTime();
  const cal = await q("c", sb.from("calendar_items").select("*").eq("created_by",ME.name).ilike("title","%تعليمات المدرب%").order("on_date",{ascending:false}).limit(3));
  const CH_ = [["للجميع","all"],["لاعب محدّد","one"]];

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="coBack()" aria-label="رجوع للصفحة السابقة" title="رجوع" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">←</button>
    <button onclick="coSend()" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">✓</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">تعليمات الحصة</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">تصل اللاعب وولي أمره — باسمك وصفتك</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${CO.disc()}
      <div style="position:relative">
        <div style="display:flex;align-items:center;gap:12px">
          ${CO.ic("⚽","#efedff","#4636e3","50% 50% 8px 50%")}
          <div style="flex:1;min-width:0"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">إلى</span>
            <b style="display:block;font-size:15px;font-weight:900">${scope==="one"?(b.to?esc(b.to):"اختر لاعبًا"):`كشفك${CO.grp()!=="all"?` · <span class="ltr">${CO.grp()}</span>`:""} · <span class="ltr">${roster.length||CO.dash}</span> ${CO.playerCount(roster.length)}`}</b>
            <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:2px">${ME.org?esc(ME.org)+" · ":""}${plannedDate} · ${plannedTime}</span></div>
        </div>
        <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
          ${CH_.map(([lb,v])=>`<button onclick="coScope('${v}')" style="background:${scope===v?"#faf8f3":"rgba(255,255,255,.1)"};color:${scope===v?"#151a2e":"#faf8f3"};border:1px solid ${scope===v?"#faf8f3":"rgba(255,255,255,.22)"};border-radius:999px;padding:5px 11px;font:900 10px Cairo;cursor:pointer">${lb}</button>`).join("")}
        </div>
      </div></div>

    ${scope==="one"?CO.card(`${CO.h("اختر اللاعب")}
      ${roster.length?`<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto">
        ${roster.map(p=>`<button onclick="coTo('${CO.esn(p.name)}')" style="flex:none;width:70px;background:${b.to===p.name?"#efedff":"#faf8f3"};border:1.5px solid ${b.to===p.name?"#4636e3":"#e9e4d8"};border-radius:16px;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-family:Cairo">
          ${CO.av(p.name,40,{url:p.avatar_url,dark:true,r:"50% 50% 10px 50%"})}
          <span style="font-size:9px;font-weight:900;color:${b.to===p.name?"#4636e3":"#5b6078"}">${esc(String(p.name).split(" ")[0])}</span></button>`).join("")}</div>`
      :CO.empty("لا لاعبين في كشفك بعد")}`):""}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("موعد وصول التعليمات")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">اختر اليوم والوقت</span></div>
      <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:8px;margin-top:10px">
        <label style="font-size:10px;font-weight:900;color:#5b6078">التاريخ
          <input type="date" value="${plannedDate}" min="${CO.today()}" onchange="coBriefDate(this.value)" style="display:block;width:100%;margin-top:5px;border:1px solid #e9e4d8;border-radius:11px;padding:9px 8px;font:800 11px Cairo;background:#faf8f3;color:#151a2e"></label>
        <label style="font-size:10px;font-weight:900;color:#5b6078">الوقت
          <input type="time" value="${plannedTime}" onchange="coBriefTime(this.value)" style="display:block;width:100%;margin-top:5px;border:1px solid #e9e4d8;border-radius:11px;padding:9px 8px;font:800 11px Cairo;background:#faf8f3;color:#151a2e"></label>
      </div>`)}

    ${CO.card(`${CO.h("رسالتك")}
      <textarea oninput="coMsg(this.value)" placeholder="مثال: حصة اليوم شدّتها عالية. ناموا جيدًا وتعالوا شاربين لترًا قبلها بساعة." style="width:100%;margin-top:8px;border:1px solid #e9e4d8;border-radius:12px;padding:12px;font:700 12px Cairo;line-height:1.95;min-height:96px;background:#faf8f3;color:#151a2e;resize:vertical;text-wrap:pretty">${CO.esn(b.msg||"")}</textarea>
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:7px">تُرسل موقّعة «${esc(ME.name)} — مدرب». لا تُعدَّل بعد الإرسال إلا بتصحيح باسمك.</span>`)}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("تُرفق مع الرسالة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">${kit.length?`<span class="ltr">${kit.length}</span> مختارة`:"اختياري"}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${CO.KIT.map(([lb,k])=>`<button onclick="coKit('${k}')" style="background:${kit.includes(k)?"#4636e3":"#faf8f3"};color:${kit.includes(k)?"#fff":"#5b6078"};border:1px solid ${kit.includes(k)?"#4636e3":"#e9e4d8"};border-radius:999px;padding:6px 11px;font:900 10px Cairo;cursor:pointer">${kit.includes(k)?"✓":"＋"} ${lb}</button>`).join("")}
      </div>`)}

    <div style="display:grid;grid-template-columns:1fr;gap:8px">
      <button onclick="coSend()" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px 14px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">أرسل الآن</button>
    </div>

    ${cal.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("آخر ما أرسلته")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">وصلت وسُجّلت</span></div>
      ${cal.map(c=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${CO.ic("✉","#efedff","#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;line-height:1.6">${esc(String(c.title).replace("تعليمات المدرب — ",""))}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(c.player_name)} · <span class="ltr">${esc(String(c.on_date||"").slice(0,10))}</span></span></div></div>`).join("")}`):""}

    ${CO.note("ترى من قرأها ومن أكّد الحضور في «مهامي». والملاحظة الشخصية تصل صاحبها وولي أمره وحدهما — لا الكشف كله.")}
  </main>`;
};

/* ═══════════ 4e · تقييم بتوقيعك ═══════════ */
CO.AXES = [["tech","الفنّي","التحكّم والتمرير والإنهاء"],["tact","التكتيكي","القراءة والتمركز والقرار"],["phys","البدني","السرعة والتحمّل والقوة"],["ment","الذهني","الالتزام والقيادة والهدوء"]];
CO.rkey = () => "pi_rate_" + (ME&&ME.id);
CO.rate = () => { try { return JSON.parse(localStorage.getItem(CO.rkey())||"{}"); } catch(e){ return {}; } };
CO.setRate = o => { try{ localStorage.setItem(CO.rkey(), JSON.stringify(Object.assign(CO.rate(), o))); }catch(e){} };
window.coPick = n => { CO.setRate({who:n}); render(); };
window.coAxis = (k,v) => { const r=CO.rate(); CO.setRate({vals:Object.assign(r.vals||{}, {[k]:+v})}); render(); };
window.coNote = v => CO.setRate({note:v});
window.coSign = async () => {
  if(CO._ratingSaving)return toast("يجري حفظ التقييم الآن",1);
  const r=CO.rate(),who=r.who,vals=r.vals||{};
  if(!who)return toast("اختر اللاعب أولًا",1);
  if(CO.AXES.some(([k])=>!vals[k]))return toast("أكمل المحاور الأربعة",1);
  const avg=(CO.AXES.reduce((s,[k])=>s+vals[k],0)/CO.AXES.length).toFixed(1);
  const details=CO.AXES.map(([k,ar])=>ar+" "+vals[k]+"/10").join(" · ");
  const body=details+(String(r.note||"").trim()?" — "+String(r.note).trim():"");
  const title="تقييم المدرب · "+avg+" من 10";
  CO._ratingSaving=true;
  try{
    const prior=await q("c",sb.from("calendar_items").select("player_name,title,on_date,created_by").eq("created_by",ME.name).eq("player_name",who).eq("on_date",CO.today()).ilike("title","تقييم المدرب ·%").limit(100));
    if(prior.some(x=>x.player_name===who&&x.title===title&&String(x.on_date||"").slice(0,10)===CO.today()))return toast("سُجّل التقييم نفسه اليوم؛ لن نضيف نسخة مكررة",1);
    const summary="مراجعة التقييم قبل التوقيع\nاللاعب: "+who+"\nالمتوسط: "+avg+" من 10\n"+details+(String(r.note||"").trim()?"\nالملاحظة: "+String(r.note).trim():"")+"\n\nسيصل التقييم إلى اللاعب وولي أمره. هل تعتمد الإرسال؟";
    if(!confirm(summary))return;
    const {error}=await sb.from("calendar_items").insert({player_name:who,kind:"training",title,subtitle:body+" — وقّعه "+ME.name+" — مدرب",at_time:"20:00",on_date:CO.today(),org:ME.org||"",needs_confirm:false,created_by:ME.name});
    if(error)return toast("تعذّر: "+error.message,1);
    await trans("قيّم "+who+" — "+avg+" من 10 بتوقيعه");
    CO.setRate({who:null,vals:{},note:""});
    toast("وقّعتَ التقييم — دخل سجل اللاعب باسمك");
    render();
  }finally{CO._ratingSaving=false;}
};
T.rate = async () => {
  const roster = await CO.roster();
  const r = CO.rate();
  const who = (typeof PARAM !== "undefined" && PARAM) || r.who;
  if(who && r.who !== who) CO.setRate({who});
  const vals = r.vals || {};
  const done = CO.AXES.filter(([k]) => vals[k]).length;
  const avg  = done === CO.AXES.length ? (CO.AXES.reduce((s,[k]) => s+vals[k], 0)/CO.AXES.length).toFixed(1) : null;
  const past = who ? await q("c", sb.from("calendar_items").select("*").eq("player_name",who).ilike("title","%تقييم المدرب%").order("on_date",{ascending:false}).limit(3)) : [];

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('squad')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">→</button>
    <button onclick="coBack()" aria-label="رجوع للصفحة السابقة" title="رجوع" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">←</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">تقييم بتوقيعك</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">أربعة محاور — يدخل سجل اللاعب باسمك لحظته</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${CO.card(`${CO.h("اللاعب")}
      ${roster.length?`<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto">
        ${roster.map(p=>`<button onclick="coPick('${CO.esn(p.name)}')" style="flex:none;width:70px;background:${who===p.name?"#efedff":"#faf8f3"};border:1.5px solid ${who===p.name?"#4636e3":"#e9e4d8"};border-radius:16px;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-family:Cairo">
          ${CO.av(p.name,40,{url:p.avatar_url,dark:true,r:"50% 50% 10px 50%"})}
          <span style="font-size:9px;font-weight:900;color:${who===p.name?"#4636e3":"#5b6078"}">${esc(String(p.name).split(" ")[0])}</span></button>`).join("")}</div>`
      :CO.empty("لا لاعبين في كشفك بعد")}`)}

    ${who?`<div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${CO.disc()}
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        ${CO.av(who,64,{dark:true,r:"50% 50% 12px 50%",ring:"3px solid #4636e3"})}
        <div style="flex:1;min-width:0"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">تقييمك الآن</span>
          <b style="display:block;font-size:18px;font-weight:900;line-height:1.25">${esc(who)}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:3px"><span class="ltr">${done}</span> من <span class="ltr">${CO.AXES.length}</span> محاور</span></div>
        <div style="flex:none;text-align:center"><b class="ltr" style="display:block;font-size:34px;font-weight:700;color:${avg?"#f5c518":"#8a93b0"};line-height:1">${avg??CO.dash}</b>
          <span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800">من <span class="ltr">10</span></span></div>
      </div></div>

    ${CO.AXES.map(([k,ar,desc])=>`${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h(ar)}<b class="ltr" style="font-size:13px;color:${vals[k]?"#4636e3":"#b0b5c6"}">${vals[k]??CO.dash}</b></div>
      ${CO.sub(desc)}
      <div style="display:flex;gap:4px;margin-top:10px">
        ${[...Array(10)].map((_,i)=>`<button onclick="coAxis('${k}',${i+1})" style="flex:1;height:34px;border-radius:9px;background:${vals[k]>=i+1?"#4636e3":"#faf8f3"};color:${vals[k]>=i+1?"#fff":"#8a8fa5"};border:1px solid ${vals[k]>=i+1?"#4636e3":"#e9e4d8"};font:700 11px 'Space Grotesk';cursor:pointer">${i+1}</button>`).join("")}
      </div>`)}`).join("")}

    ${CO.card(`${CO.h("ملاحظة للاعب")}${CO.sub("تصله وولي أمره — لا الكشف")}
      <textarea oninput="coNote(this.value)" placeholder="مثال: ركّز على الاستقبال بالقدم اليسرى قبل السبت." style="width:100%;margin-top:8px;border:1px solid #e9e4d8;border-radius:12px;padding:12px;font:700 12px Cairo;line-height:1.95;min-height:74px;background:#faf8f3;color:#151a2e;resize:vertical">${CO.esn(r.note||"")}</textarea>`)}

    <button onclick="coSign()" style="background:${avg?"#4636e3":"#e9e4d8"};color:${avg?"#fff":"#8a8fa5"};border:0;border-radius:14px;padding:13px 14px;font:900 12px Cairo;cursor:pointer;${avg?"box-shadow:0 8px 18px rgba(70,54,227,.3)":""}">وقّع التقييم</button>

    ${past.length?CO.card(`${CO.h("تقييماته السابقة")}
      ${past.map(p=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${CO.ic("★","#fff6d6","#c78c00")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(p.title)}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px;line-height:1.7">${esc(p.subtitle||"")}</span></div>
        <span class="ltr" style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${esc(String(p.on_date||"").slice(0,10))}</span></div>`).join("")}`):""}
    `:CO.empty("اختر لاعبًا لتبدأ التقييم")}

    ${CO.note("تقييمك رأي فنّي موقّع باسمك — يُراجع قبل التوقيع ويصل إلى اللاعب وولي أمره وحدهما.")}
  </main>`;
};

/* ═══════════ 4g · لوح التكتيك ═══════════ */
T.tactics = async () => {
  const f = (()=>{ try{ return localStorage.getItem("pi_form_"+ME.id)||"4-3-3"; }catch(e){ return "4-3-3"; } })();
  const lines = CH.FORMS[f] || CH.FORMS["4-3-3"];
  const [roster,hs] = await Promise.all([CO.roster(), q("h", sb.from("health_status").select("player_name,state").limit(120))]);
  const hMap = {}; hs.forEach(h => hMap[h.player_name] = h.state);
  const avail = roster.filter(p => (hMap[p.name]||"available") === "available");
  const total = lines.reduce((s,l) => s+l[0], 0);
  let idx = 0;

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="coBack()" aria-label="رجوع للصفحة السابقة" title="رجوع" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">←</button>
    <button onclick="go('boards')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">✎</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">التشكيل</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">التشكيل ونشره في تقاويم لاعبيك — والجاهزية من المختص لا منك</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${Object.keys(CH.FORMS).map(k=>`<button onclick="tacForm('${k}')" dir="ltr" style="flex:1;min-width:70px;background:${k===f?"#151a2e":"#fff"};color:${k===f?"#faf8f3":"#5b6078"};border:1px solid ${k===f?"#151a2e":"#e9e4d8"};border-radius:13px;padding:12px 8px;font:700 13px 'Space Grotesk';cursor:pointer">${k}</button>`).join("")}
    </div>

    <div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:0;overflow:hidden">
      <div style="background:linear-gradient(170deg,#1d4a3e,#0f2b24);padding:22px 16px;position:relative">
        <div style="position:absolute;inset:16px;border:1.5px solid rgba(255,255,255,.14);border-radius:10px"></div>
        <div style="position:absolute;inset-inline-start:16px;inset-inline-end:16px;top:50%;height:1.5px;background:rgba(255,255,255,.14)"></div>
        <div style="position:absolute;inset-inline-start:50%;top:50%;width:64px;height:64px;border:1.5px solid rgba(255,255,255,.14);border-radius:50%;transform:translate(-50%,-50%)"></div>
        <div style="position:relative;display:flex;flex-direction:column-reverse;gap:16px">
          ${lines.map(([n])=>`<div style="display:flex;justify-content:space-around;align-items:center">
            ${[...Array(n)].map(()=>{ const p = avail[idx++]; return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:52px">
              ${p?CO.av(p.name,34,{url:p.avatar_url,dark:true,r:"50% 50% 8px 50%",ring:"2px solid rgba(245,197,24,.9)"})
                 :`<span style="width:34px;height:34px;border-radius:50% 50% 8px 50%;background:rgba(255,255,255,.12);border:1.5px dashed rgba(255,255,255,.35);display:grid;place-items:center;font-size:12px;color:#c6cade">${CO.dash}</span>`}
              <span style="font-size:8px;font-weight:900;color:${p?"#f5c518":"#8fa5a0"};text-align:center;line-height:1.3">${p?esc(String(p.name).split(" ")[0]):"فراغ"}</span></div>`; }).join("")}
          </div>`).join("")}
        </div>
      </div>
      <div style="padding:14px 16px;display:flex;flex-direction:column;gap:7px">
        ${lines.slice().reverse().map(([n,label])=>`<div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;padding:4px 0;border-bottom:1px solid #f0ece2"><span style="color:#5b6078">${label}</span><b class="ltr" style="color:#4636e3">${n}</b></div>`).join("")}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <span style="font-size:11px;font-weight:900">المتاحون للتشكيل</span>
          <span style="background:${avail.length>=total?"#eaf5ee":"#fff6d6"};color:${avail.length>=total?"#2c6e49":"#c78c00"};border-radius:999px;padding:4px 11px;font-size:10.5px;font-weight:900"><span class="ltr">${avail.length} / ${total}</span></span></div>
      </div>
    </div>

    ${avail.length<total?CO.note(`المتاحون أقل من التشكيل بـ<span class="ltr">${total-avail.length}</span> — التشكيل قابل للنشر والنقص يظهر صريحًا، لا مخفيًّا.`):""}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button onclick="tacPublish('${f}')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px 10px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">انشر التشكيل</button>
      <button onclick="openBoard()" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:13px 10px;font:900 12px Cairo;cursor:pointer">✎ ارسم لوحًا</button></div>
    ${CO.note("التشكيل قرار فنّي باسمك — يدخل تقويم اللاعبين ويُسجَّل في الشفافية، ولا يمسّ تقييم أحد.")}
  </main>`;
};

/* ═══════════ 4j · مهامي ═══════════ */
T.coachTasks = async () => {
  const org = ME.org || "";
  const [roster,att,cal,hs,mt] = await Promise.all([
    CO.roster(),
    q("a", sb.from("attendance").select("*").eq("org",org).order("created_at",{ascending:false}).limit(400)),
    q("c", sb.from("calendar_items").select("*").eq("created_by",ME.name).order("on_date",{ascending:true}).limit(60)),
    q("h", sb.from("health_status").select("*").limit(120)),
    q("m", sb.from("matches").select("*").order("created_at",{ascending:false}).limit(20))
  ]);
  const hMap = {}; hs.forEach(h => hMap[h.player_name] = h);
  CO._sessionOptions=CO.sessionOptions(cal,roster); CO._currentSession=CO.activeSession(CO._sessionOptions);
  CO._allowLegacyAttendance=CO._sessionOptions[0]&&CO._currentSession.id===CO._sessionOptions[0].id;
  const activeCoachSession=CO._currentSession;
  const live = mt.find(m => m.status === "live");
  const T1 = [];
  if(live) T1.push({g:"●", bg:"#fdeee8", ink:"#e8531f", t:"مباراة مباشرة — سجّل بلمستين", s:esc(live.title)+" · أُسند التسجيل", v:"orgMatch", urg:true});
  const noSess = !activeCoachSession||!activeCoachSession.planned;
  if(noSess) T1.push({g:"◈", bg:"#efedff", ink:"#4636e3", t:"لا حصة مثبّتة اليوم", s:"ابنِ حصتك من البنك وانشرها باسمك", v:"drills"});
  const unsigned = roster.filter(p => !att.some(a => a.player_name===p.name && CO.rowDate(a)===CO.today() && (a.session_id===activeCoachSession.id || (!a.session_id&&CO._allowLegacyAttendance))));
  if(activeCoachSession&&activeCoachSession.planned&&unsigned.length)
    T1.push({g:"✓", bg:"#fff6d6", ink:"#c78c00", t:`لم توقّع حضور ${unsigned.length} ${CO.playerCount(unsigned.length)}`, s:"الحضور بنقرة في «حصة اليوم»", v:"session"});
  const rehab = roster.filter(p => hMap[p.name] && ["rehab","out","limited"].includes(hMap[p.name].state));
  if(rehab.length) T1.push({g:"🔒", bg:"#eef7f4", ink:"#2c8471", t:`${rehab.length} ${CO.playerCount(rehab.length)} بقيود طبية`, s:"يكتبها المختص — احترم القيد في حصتك", v:"squad"});
  const heavy = roster.filter(p => { const l = CO.load(att, p.name); return l && l > 1.3; });
  if(heavy.length) T1.push({g:"▲", bg:"#fdeee8", ink:"#e8531f", t:`انتظام أعلى من المعتاد عند ${heavy.length}`, s:heavy.slice(0,3).map(p=>esc(String(p.name).split(" ")[0])).join(" · "), v:"squad", urg:true});
  const norate = roster.filter(p => !cal.some(c => c.player_name===p.name && String(c.title||"").includes("تقييم المدرب")));
  if(norate.length) T1.push({g:"★", bg:"#fff6d6", ink:"#c78c00", t:`${norate.length} بلا تقييم منك`, s:"أربعة محاور وتوقيع واحد", v:"rate"});
  const soon = cal.filter(c => String(c.on_date||"") > CO.today()).slice(0,4);

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="coBack()" aria-label="رجوع للصفحة السابقة" title="رجوع" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">←</button>
    <button onclick="go('hub')" aria-label="جميع الخدمات" title="جميع الخدمات" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">☰</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">مهامي</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">ما ينتظر توقيعك أنت — بترتيب الأهمية</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${CO.disc(T1.some(t=>t.urg))}
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        <div style="flex:none;text-align:center"><b class="ltr" style="display:block;font-size:40px;font-weight:700;line-height:1;color:${T1.length?"#f5c518":"#7fd7a4"}">${T1.length||"✓"}</b>
          <span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:3px">${T1.length?"ينتظر توقيعك":"لا شيء ينتظرك"}</span></div>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;line-height:1.9;flex:1;min-width:0">${T1.length?"لا شيء يمرّ بلا علمك — وكل توقيع يحمل اسمك ووقته.":"كشفك في المسار، وحصصك موقّعة. تظهر المهمة هنا لحظة نشوئها."}</span>
      </div></div>

    ${T1.length?T1.map(t=>`<button onclick="go('${t.v}')" style="background:#fff;border:1px solid ${t.urg?"#f3cdbe":"#e9e4d8"};border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;width:100%;color:#151a2e">
      <span style="width:40px;height:40px;border-radius:50% 50% 8px 50%;background:${t.bg};color:${t.ink};display:grid;place-items:center;font-size:16px;flex:none">${t.g}</span>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px;font-weight:900;line-height:1.5">${t.t}</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${t.s}</span></div>
      <span style="color:${t.urg?"#e8531f":"#8a8fa5"};flex:none">←</span></button>`).join("")
    :CO.card(`<div style="display:flex;gap:12px;align-items:center">${CO.ic("✓","#eaf5ee","#2c6e49","50% 50% 8px 50%")}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px">كل شيء موقّع</b>${CO.sub("لا مؤشر انتظام لافت ولا حضور ناقص ولا قيد مهمَل")}</div></div>`)}

    ${soon.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("القادم في تقويمك")}<a onclick="coBack()" aria-label="رجوع للصفحة السابقة" title="رجوع" style="font-size:11px;font-weight:900;cursor:pointer">مساحتك ←</a></div>
      ${soon.map(c=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${CO.ic("◷","#efedff","#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;line-height:1.5">${esc(c.title)}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(c.player_name)} · <span class="ltr">${esc(c.at_time||"")}</span></span></div>
        <span class="ltr" style="font-size:10px;color:#8a8fa5;font-weight:800;flex:none">${esc(String(c.on_date||"").slice(0,10))}</span></div>`).join("")}`):""}

    ${CO.note("المهام محسوبة من نشاط موثّق لا من تقدير: حصص موقّعة · أحمال · قيود المختص الطبي · مباريات أُسند إليك تسجيلها.")}
  </main>`;
};

/* ═══════════ 4k · ملفي ═══════════ */
T.coachMe = async () => {
  const org = ME.org || "";
  const [roster,att,ev,tr,cal] = await Promise.all([
    CO.roster(),
    q("a", sb.from("attendance").select("*").eq("recorded_by",ME.name).order("created_at",{ascending:false}).limit(400)),
    q("e", sb.from("match_events").select("*,matches(title)").eq("recorded_by",ME.name).order("created_at",{ascending:false}).limit(60)),
    q("t", sb.from("transparency").select("*").ilike("actor","%"+ME.name+"%").order("created_at",{ascending:false}).limit(40)),
    q("c", sb.from("calendar_items").select("*").eq("created_by",ME.name).limit(200))
  ]);
  const sessions = [...new Set(att.map(a => String(a.created_at||"").slice(0,10)))].length;
  const rated    = [...new Set(cal.filter(c => String(c.title||"").includes("تقييم المدرب")).map(c => c.player_name))].length;
  const corr     = tr.filter(t => /تصحيح/.test(t.action||"")).length;
  const stats    = [["حصة موقّعة",sessions],["لاعبًا",roster.length],["حدثًا باسمك",ev.length],["تصحيحًا",corr]];
  const pid      = "PI-C-2026-" + String(1000 + (String(ME.name).split("").reduce((a,c) => a+c.charCodeAt(0), 0) % 8999));
  const hasAv    = !!ME.avatar_url || CO.hasAvatar(ME.name);
  const fields   = [["الصورة",hasAv,"avatarSheet()"],["الاسم",!!ME.name],["الجهة",!!ME.org],["كشف مرتبط",roster.length>0,"go('squad')"],["حصص موقّعة",sessions>0,"go('session')"],["تقييم بتوقيعك",rated>0,"go('rate')"]];
  const comp     = Math.round(fields.filter(f => f[1]).length / fields.length * 100);
  const missing  = fields.filter(f => !f[1]);

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="coBack()" aria-label="رجوع للصفحة السابقة" title="رجوع" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">←</button>
    <button onclick="go('settings')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⚙</button>
  </div>
  <main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;border-radius:26px;overflow:hidden;background:#151a2e;color:#faf8f3;box-shadow:0 18px 44px rgba(21,26,46,.18)">
      <div style="position:absolute;inset-inline-start:58%;top:-62%;width:86%;height:210%;background:radial-gradient(circle at 45% 50%,#f5c518,#8a6912);border-radius:50%;opacity:.2"></div>
      <div style="position:relative;padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">${WM(1)}
          <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,197,24,.16);border:1px solid rgba(245,197,24,.45);color:#f5c518;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900">★ مدرب${sessions>=5?" موثّق":""}</span>
        </div>
        <div style="display:flex;align-items:flex-end;gap:14px;margin-top:22px">
          <button onclick="toast('تعديل صورة الحساب غير متاح حاليًا',1)" title="تعديل صورة الحساب غير متاح حاليًا" style="position:relative;flex:none;background:none;border:0;padding:0;cursor:pointer">
            ${CO.av(ME.name,110,{url:ME.avatar_url,dark:true,r:"50% 50% 14px 50%",ring:"3px solid #f5c518"})}
            <span style="position:absolute;bottom:-2px;inset-inline-end:-6px;width:28px;height:28px;border-radius:${CO.DROP};background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:12px;border:2px solid #151a2e">✎</span></button>
          <div style="flex:1;min-width:0;padding-bottom:4px">
            <span style="display:block;font-size:10px;color:#f5c518;font-weight:900">مدرب${CO.grp()!=="all"?` · <span class="ltr">${CO.grp()}</span>`:""}</span>
            <b style="display:block;font-size:24px;font-weight:900;line-height:1.2;margin-top:3px">${esc(ME.name)}</b>
            <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;margin-top:3px">${org?esc(org):"بلا جهة بعد"}</span>
          </div></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:18px">
          ${stats.map(([k,v])=>`<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:9px 4px;text-align:center">
            <b class="ltr" style="display:block;font-size:19px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||CO.dash}</b>
            <span style="display:block;font-size:8.5px;color:#c6cade;font-weight:800;margin-top:1px">${k}</span></div>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14)">
          <div style="min-width:0"><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">${org?"الجهة":"بلا جهة"}</span>
            <div style="display:flex;gap:6px;margin-top:6px;align-items:center;flex-wrap:wrap">
              ${org?`<span style="display:inline-flex;align-items:center;gap:6px;height:30px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;padding:0 10px 0 4px;font-size:9.5px;font-weight:900"><span style="width:22px;height:22px;border-radius:${CO.DROP};background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:10px">${esc(org.trim()[0])}</span>${esc(org)}</span>`
                :`<span style="height:30px;border-radius:999px;border:1px dashed rgba(255,255,255,.3);color:#c6cade;display:grid;place-items:center;font-size:9px;font-weight:900;padding:0 10px">تُسجَّل حين تضمّك أكاديمية</span>`}
            </div>
            <span class="ltr" style="display:block;font-family:'Space Grotesk';font-size:10px;font-weight:700;color:#8f9bff;margin-top:8px">${pid}</span>
          </div>
          <div style="flex:none;width:74px;height:74px;background:#fff;border-radius:12px;padding:5px"><img src="${CO.qr(pid,180)}" alt="رمز هوية المدرب" style="width:100%;height:100%;object-fit:contain;display:block"></div>
        </div>
      </div></div>

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("اكتمال ملفك")}<b class="ltr" style="font-size:11px;color:#4636e3">${comp}%</b></div>
      <div style="height:8px;border-radius:999px;background:#f0ece2;margin-top:10px;overflow:hidden"><span style="display:block;height:100%;width:${comp}%;background:#4636e3;border-radius:999px"></span></div>
      ${missing.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${missing.map(f=>f[2]
        ?`<button onclick="${f[2]}" style="background:#efedff;color:#4636e3;border:0;border-radius:999px;padding:5px 11px;font:900 10px Cairo;cursor:pointer">＋ ${f[0]}</button>`
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
          <span style="font-size:9px;font-weight:800;color:#2c6e49">السجل — فورًا</span></div>
      </div>`)}

    ${tr.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("آخر قراراتك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">قراءة فقط — حتى لك</span></div>
      ${tr.slice(0,5).map(t=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${CO.ic("▤","#efedff","#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;line-height:1.6">${esc(t.action)}</b>
          <span class="ltr" style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(new Date(t.created_at).toLocaleString("en-GB"))}</span></div></div>`).join("")}`)
    :CO.card(`${CO.h("آخر قراراتك")}${CO.empty("لم توقّع شيئًا بعد — أول حضور أو تقييم يظهر هنا باسمك")}`)}

    <div style="background:#151a2e;border-radius:20px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden">${CO.disc()}
      <div style="position:relative"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">دورك الحالي</span><b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.2">مدرب</b></div>
      <button onclick="go('role')" style="position:relative;background:#fff;color:#151a2e;border:0;border-radius:999px;padding:9px 14px;font:900 11px Cairo;cursor:pointer">⇄ تغيير الدور</button></div>

    ${CO.note("ملفك يعرض ما وقّعته أنت — لا رقمًا وقّعه غيرك. ولا يملك أحد زرًّا لتعديل توقيعك؛ التصحيح باسمك في سجل الشفافية.")}
  </main>`;
};

/* ═══════════ التركيب ═══════════ */
(function(){
  Object.assign(CO.TITLE, {
    tactics:    ["التشكيل","الجاهزية من المختص لا منك"],
    brief:      ["تعليمات الحصة","تصل اللاعب وولي أمره باسمك"],
    rate:       ["تقييم بتوقيعك","أربعة محاور وتوقيع واحد"],
    tactics:    ["لوح التكتيك","التشكيل ونشره باسمك"],
    coachTasks: ["مهامي","ما ينتظر توقيعك أنت"],
    coachMe:    ["ملفي","ما وقّعته أنت — لا ما وقّعه غيرك"]
  });
  Object.assign(TITLES, {
    coachHome:"مساحة المدرب", squad:"فريقي", session:"حصة اليوم", drills:"بنك التمارين",
    brief:"تعليمات الحصة", rate:"تقييم بتوقيعك", tactics:"لوح التكتيك", coachTasks:"مهامي", coachMe:"ملفي"
  });
  /* الشريط السفلي موحّد بصريًا مع حساب اللاعب */
  if(typeof NAV !== "undefined")
    NAV.coach = [["home","الرئيسية","coachHome"],["community","فريقي","squad"],["services","الخدمات","hub"],["match","التشكيلة","tactics"],["profile","ملفي","coachMe"]];
  if(typeof homeFor === "function"){ const _h = homeFor; window.homeFor = function(){ return ME && ME.role === "coach" ? "coachHome" : _h(); }; }
  /* عنوان الشاشة: عمود المدرب يتقدّم على العناوين العامة */
  if(typeof PL3 !== "undefined") Object.assign(PL3.TITLE, CO.TITLE);

  CO.OWN = ["coachHome","squad","session","drills","brief","rate","tactics","coachTasks","coachMe"];
  CO.nav = () => {
    const items = [["home","الرئيسية","coachHome"],["community","فريقي","squad"],["services","الخدمات","hub"],["match","التشكيلة","tactics"],["profile","ملفي","coachMe"]];
    return '<nav class="pz5-nav coach-bottom-nav">'+items.map(([g,lb,v])=>{
      const on = VIEW===v;
      return '<button class="'+(on?'on':'')+'" aria-label="'+lb+'" onclick="go(&quot;'+v+'&quot;)"><span>'+window.PZ.icon(g)+'</span><b>'+lb+'</b></button>';
    }).join("")+'</nav><button class="pz-fab pz-basmat-fab coach-quick-fab" aria-label="اختصارات المدرب" title="اختصارات المدرب" onclick="window.CO.toggleFab()">'+window.PZ.icon('plus')+'</button>';
  };
  CO.toggleFab = function(){
    const old=document.getElementById("pzFabMenu");if(old){old.remove();return}
    const items=[["coach","الحصص والحضور","session"],["profile","فريقي","squad"],["rating","تقييم لاعب","rate"],["match","لوح التكتيك","boards"],["services","كل الخدمات","hub"]];
    document.body.insertAdjacentHTML("beforeend",'<div class="pz-fab-menu" id="pzFabMenu" role="menu" aria-label="اختصارات المدرب">'+items.map(function(x){return '<button role="menuitem" onclick="go(&quot;'+x[2]+'&quot;)"><span>'+window.PZ.icon(x[0])+'</span><b>'+x[1]+'</b></button>'}).join('')+'</div>');
  };
  const _nav2 = window.navHtml || navHtml;
  window.navHtml = navHtml = function(){ return (ME && ME.role === "coach") ? CO.nav() : _nav2(); };

  const _r2 = window.render;
  window.render = render = async function(){
    await _r2();
    try{
      if(!ME || ME.role !== "coach" || VIEW === "auth" || VIEW === "role") return;
      const app = $("#app"), hd = app.querySelector(".hd");
      /* شاشات المدرب المعتمدة تحمل رأسها معها — الرأس العام يُزال منها فقط */
      if(hd && CO.OWN.indexOf(VIEW) >= 0) hd.remove();
      if(VIEW === "explore" && typeof PL3 !== "undefined") setTimeout(()=>PL3.drawMap && PL3.drawMap(), 60);
      document.body.style.removeProperty("background");
      const sh = document.querySelector(".shell"); if(sh) sh.style.removeProperty("background");
    }catch(e){ console.error("CO", e); }
  };
})();
