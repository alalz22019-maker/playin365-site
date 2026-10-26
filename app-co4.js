/* PlayIn365 — عمود المدرب ٢: التشكيلة والاحتياط · فريقي بخيارات حقيقية · الملعب بعين المدرب
   يُحمَّل بعد app-co3b.js فيتقدّم عليه. قطرة المدرب أسفل-يمين. */
const TAC = {};
TAC.FORMS = {
  "5 لاعبين": [[1,"حارس"],[2,"دفاع"],[2,"هجوم"]],
  "7 لاعبين": [[1,"حارس"],[2,"دفاع"],[3,"وسط"],[1,"هجوم"]],
  "9 لاعبين": [[1,"حارس"],[3,"دفاع"],[3,"وسط"],[2,"هجوم"]],
  "4-3-3":  [[1,"حارس"],[4,"دفاع"],[3,"وسط"],[3,"هجوم"]],
  "4-4-2":  [[1,"حارس"],[4,"دفاع"],[4,"وسط"],[2,"هجوم"]],
  "4-2-3-1":[[1,"حارس"],[4,"دفاع"],[2,"ارتكاز"],[3,"صناعة"],[1,"رأس حربة"]],
  "3-5-2":  [[1,"حارس"],[3,"دفاع"],[5,"وسط"],[2,"هجوم"]],
  "5-3-2":  [[1,"حارس"],[5,"دفاع"],[3,"وسط"],[2,"هجوم"]],
  "3-4-3":  [[1,"حارس"],[3,"دفاع"],[4,"وسط"],[3,"هجوم"]]
};
TAC.FIT = {"حارس":["حارس"],"دفاع":["مدافع","ظهير"],"ارتكاز":["وسط","مدافع"],"وسط":["وسط","جناح"],"صناعة":["جناح","وسط","مهاجم"],"رأس حربة":["مهاجم"],"هجوم":["مهاجم","جناح"]};
TAC.defaultForm = roster => {
  const team=roster||[],ages=team.map(p=>p.age==null||String(p.age).trim()===""?NaN:Number(p.age)).filter(Number.isFinite);
  let f=ages.length?(Math.max(...ages)<=8?"5 لاعبين":Math.max(...ages)<=10?"7 لاعبين":Math.max(...ages)<=14?"9 لاعبين":"4-3-3"):(team.length<=5?"5 لاعبين":team.length<=7?"7 لاعبين":team.length<=9?"9 لاعبين":"4-3-3");
  if(team.length<5)return "5 لاعبين";
  if(team.length<TAC.slots(f).length){const choices=Object.keys(TAC.FORMS).filter(k=>TAC.slots(k).length<=team.length);if(choices.length)f=choices[choices.length-1];}
  return f;
};
TAC.key  = () => "pi_line_" + (ME && ME.id) + "_" + (CO.grp ? CO.grp() : "all");
TAC.get  = () => { try { return JSON.parse(localStorage.getItem(TAC.key())||"null") || {f:"", slots:{}, out:[]}; } catch(e){ return {f:"", slots:{}, out:[]}; } };
TAC.set  = o => { try{ localStorage.setItem(TAC.key(), JSON.stringify(o)); }catch(e){} };
TAC.date = st => { const v=String(st&&st.date||""); const d=new Date(v+"T00:00:00Z"); return v.length===10&&!Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v?v:CO.today(); };
TAC.time = st => { const v=String(st&&st.time||""); const h=+v.slice(0,2),m=+v.slice(3,5); return v.length===5&&v[2]===":"&&h>=0&&h<=23&&m>=0&&m<=59?v:"18:00"; };
window.tacDate = v => { const d=new Date(String(v||"")+"T00:00:00Z"); if(String(v||"").length===10&&!Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v&&v>=CO.today()){const st=TAC.get();st.date=v;TAC.set(st);} };
window.tacTime = v => { const h=+(v||"").slice(0,2),m=+(v||"").slice(3,5); if(String(v||"").length===5&&(v||"")[2]===":"&&h>=0&&h<=23&&m>=0&&m<=59){const st=TAC.get();st.time=v;TAC.set(st);} };
TAC.slots = f => { const out=[]; (TAC.FORMS[f]||TAC.FORMS["4-3-3"]).forEach(([n,lb],li)=>{ for(let i=0;i<n;i++) out.push({i:out.length, line:li, lb, n}); }); return out; };
TAC.pick = null;

TAC.auto = (st, roster) => {
  const available = new Set(roster.map(p=>p.name));
  st.slots = Object.fromEntries(Object.entries(st.slots||{}).filter(([,name])=>available.has(name)));
  st.out = (st.out||[]).filter(name=>available.has(name));
  const slots = TAC.slots(st.f), used = new Set(Object.values(st.slots));
  const free = roster.filter(p => !used.has(p.name) && st.out.indexOf(p.name)<0);
  slots.forEach(s => {
    if(st.slots[s.i]) return;
    const want = TAC.FIT[s.lb] || [];
    let k = free.findIndex(p => want.indexOf(p.pos)===0);
    if(k<0) k = free.findIndex(p => want.indexOf(p.pos)>=0);
    if(k<0 && s.lb!=="حارس") k = free.findIndex(p => p.pos!=="حارس");
    if(k>=0){ st.slots[s.i]=free[k].name; free.splice(k,1); }
  });
  return st;
};
window.tacForm2 = f => { const st=TAC.get(); st.f=f; st.manual=true; st.slots={}; TAC.set(st); TAC.pick=null; render(); };
window.tacAuto  = () => { const st=TAC.get(); st.slots={}; TAC.set(st); toast("رُتّبت التشكيلة بالمراكز — بدّل ما تشاء"); render(); };
window.tacTap   = (kind, val) => {
  const st = TAC.get();
  if(kind==="slot"){
    const cur = st.slots[val] || null;
    if(!TAC.pick){ if(!cur) return toast("اختر لاعبًا من الاحتياط أولًا",1); TAC.pick={from:"slot", i:+val, name:cur}; }
    else if(TAC.pick.from==="slot"){ const a=TAC.pick.i, b=+val, t=st.slots[a]; st.slots[a]=st.slots[b]||null; st.slots[b]=t;
      if(!st.slots[a]) delete st.slots[a]; TAC.pick=null; TAC.set(st); toast("بُدِّلا"); }
    else { const out=TAC.pick.name; if(cur) st.slots[val]=out; else st.slots[val]=out;
      Object.keys(st.slots).forEach(k=>{ if(+k!==+val && st.slots[k]===out) delete st.slots[k]; });
      if(cur && cur!==out) toast(`${String(out).split(" ")[0]} بدل ${String(cur).split(" ")[0]}`);
      TAC.pick=null; TAC.set(st); }
  } else {
    if(TAC.pick && TAC.pick.from==="slot"){ delete st.slots[TAC.pick.i]; TAC.pick=null; TAC.set(st); toast("خرج للاحتياط"); }
    else TAC.pick = TAC.pick && TAC.pick.name===val ? null : {from:"bench", name:val};
  }
  render();
};
window.tacOut = n => { const st=TAC.get(); st.out=st.out||[];
  st.out = st.out.indexOf(n)>=0 ? st.out.filter(x=>x!==n) : [...st.out, n];
  Object.keys(st.slots).forEach(k=>{ if(st.slots[k]===n) delete st.slots[k]; });
  TAC.set(st); render(); };
window.tacPub2 = async () => {
  if(TAC._publishing)return toast("يجري إعلان التشكيلة الآن",1);
  const st=TAC.get(),[roster,health]=await Promise.all([CO.roster(),q("h",sb.from("health_status").select("player_name,state").limit(140))]),slots=TAC.slots(st.f);
  const healthByName={};health.forEach(h=>healthByName[h.player_name]=h);
  const allowed=p=>!!p&&(!healthByName[p.name]||healthByName[p.name].state==="available");
  const plannedDate=TAC.date(st),plannedTime=TAC.time(st);
  if(plannedDate<CO.today())return toast("اختر اليوم أو موعدًا لاحقًا",1);
  const start=slots.map(s=>st.slots[s.i]).filter(Boolean);
  if(start.length<slots.length)return toast("أكمل التشكيلة — ناقص "+(slots.length-start.length),1);
  const restrictedStarts=start.filter(name=>!allowed(roster.find(p=>p.name===name)));
  if(restrictedStarts.length)return toast("لا يمكن إعلان التشكيلة قبل إزالة لاعب عليه قيد طبي",1);
  const recipients=roster.filter(p=>(st.out||[]).indexOf(p.name)<0&&allowed(p));
  if(!recipients.length)return toast("لا يوجد لاعبون لإبلاغهم",1);
  const bench=recipients.map(p=>p.name).filter(n=>start.indexOf(n)<0);
  TAC._publishing=true;
  try{
    const prior=await q("c",sb.from("calendar_items").select("player_name,title,on_date,at_time,created_by").eq("created_by",ME.name).eq("kind","match").eq("on_date",plannedDate).eq("at_time",plannedTime).ilike("title","تشكيلة "+st.f+"%").limit(500));
    if(prior.some(x=>String(x.on_date||"").slice(0,10)===plannedDate&&x.at_time===plannedTime))return toast("سبق إعلان تشكيلة لهذا الموعد — غيّر الموعد لتجنب تكرار الإعلان",1);
    const summary="راجع التشكيلة قبل الإعلان\nالخطة: "+st.f+" · "+start.length+" أساسيًا · "+bench.length+" احتياطيًا\nالمستلمون: "+recipients.length+" "+CO.playerCount(recipients.length)+"\nالموعد: "+plannedDate+" · "+plannedTime+"\nهل تريد الإعلان؟";
    if(!confirm(summary))return;
    const rows=recipients.map(p=>{
      const si=slots.find(s=>st.slots[s.i]===p.name);
      return {player_name:p.name,kind:"match",title:si?("تشكيلة "+st.f+" · أساسي — "+si.lb):("تشكيلة "+st.f+" · احتياط"),
        subtitle:"الأساسيون: "+start.map(n=>String(n).split(" ")[0]).join(" · ")+" — أعلنها "+ME.name+" — مدرب",
        at_time:plannedTime,on_date:plannedDate,org:ME.org||"",needs_confirm:true,created_by:ME.name};
    });
    const {error}=await sb.from("calendar_items").insert(rows);
    if(error)return toast("تعذّر النشر: "+error.message,1);
    await trans("أعلن تشكيلة "+st.f+" — "+start.length+" أساسيًا و"+bench.length+" احتياطًا");
    toast("وصلت التشكيلة إلى "+recipients.length+" "+CO.playerCount(recipients.length));
  }finally{TAC._publishing=false;}
};

T.tactics = async () => {
  const [roster,hs,att] = await Promise.all([
    CO.roster(),
    q("h", sb.from("health_status").select("player_name,state,phase").limit(140)),
    q("a", sb.from("attendance").select("player_name,created_at,present,session_date,session_id").eq("org",ME.org||"").limit(600))
  ]);
  const hMap = {}; hs.forEach(h=>hMap[h.player_name]=h);
  const ok = p => !hMap[p.name] || hMap[p.name].state==="available";
  const knownAges=roster.map(p=>p.age==null||String(p.age).trim()===""?NaN:Number(p.age)).filter(Number.isFinite);
  const formKeys=knownAges.length&&Math.max(...knownAges)<=14?["5 لاعبين","7 لاعبين","9 لاعبين"]:Object.keys(TAC.FORMS);
  const state=TAC.get(); if(!formKeys.includes(state.f)||(!state.manual&&roster.length<TAC.slots(state.f).length))state.f=TAC.defaultForm(roster);
  const st = TAC.auto(state, roster.filter(ok));
  TAC.set(st);
  const slots = TAC.slots(st.f), lines = TAC.FORMS[st.f]||TAC.FORMS["4-3-3"];
  const byName = {}; roster.forEach(p=>byName[p.name]=p);
  const start = slots.map(s=>st.slots[s.i]).filter(Boolean);
  const bench = roster.filter(p => start.indexOf(p.name)<0 && (st.out||[]).indexOf(p.name)<0 && ok(p));
  const unav = roster.filter(p => !ok(p));
  const incomplete = start.length < slots.length;
  const rest = roster.filter(p => (st.out||[]).indexOf(p.name)>=0);
  const load = n => CO.load(att, n);
  const fullRoster=CO._roster||roster, groups={};
  fullRoster.forEach(p=>{const g=CO.groupOf(p);if(g)groups[g]=(groups[g]||0)+1;});
  const selectedGroup=CO.grp();
  const countLabel=n=>n===0||n===1?"لاعب":n===2?"لاعبان":n>=11?"لاعبًا":"لاعبين";
  const chip = (p,sel,on) => `<button onclick="${on}" style="flex:none;width:74px;background:${sel?"#efedff":"#fff"};border:1.5px solid ${sel?"#4636e3":"#e9e4d8"};border-radius:16px;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-family:Cairo">
    ${CO.av(p.name,42,{url:p.avatar_url,dark:true,r:"50% 50% 10px 50%"})}
    <span style="font-size:9px;font-weight:900;color:${sel?"#4636e3":"#151a2e"}">${esc(String(p.name).split(" ")[0])}</span>
    <span style="font-size:8.5px;font-weight:800;color:${CO.loadInk(load(p.name))}">${p.shirt?`<span class="ltr">#${p.shirt}</span> · `:""}${esc(p.pos||"")}</span></button>`;
  let si = -1;

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="coBack()" aria-label="رجوع للصفحة السابقة" title="رجوع" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">←</button>
    <button onclick="go('boards')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">✎</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">التشكيلة والاحتياط</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">اختر خطة 5 أو 7 أو 9 أو 11 لاعبًا؛ 4-3-3 و4-4-2 خطط من 11 · اختر اللاعب ثم المركز لتبديل المراكز</span>
    <span style="display:inline-block;margin-top:8px;padding:5px 10px;border-radius:999px;background:#efedff;color:#4636e3;font-size:10px;font-weight:900">الفئة: ${selectedGroup==="all"?"كل الفئات":esc(selectedGroup)} · <span class="ltr">${roster.length}</span> ${countLabel(roster.length)}</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${Object.keys(groups).length ? '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:2px"><button onclick="coGrp(\'all\')" style="flex:none;background:'+(selectedGroup==="all"?"#151a2e":"#fff")+';color:'+(selectedGroup==="all"?"#faf8f3":"#5b6078")+';border:1px solid '+(selectedGroup==="all"?"#151a2e":"#e9e4d8")+';border-radius:999px;padding:8px 12px;font:900 10.5px Cairo;cursor:pointer">كل الفئات · <span class="ltr">'+fullRoster.length+'</span></button>'+Object.entries(groups).sort().map(([g,n])=>'<button onclick="coGrp(\''+g+'\')" style="flex:none;background:'+(selectedGroup===g?"#151a2e":"#fff")+';color:'+(selectedGroup===g?"#faf8f3":"#5b6078")+';border:1px solid '+(selectedGroup===g?"#151a2e":"#e9e4d8")+';border-radius:999px;padding:8px 12px;font:900 10.5px Cairo;cursor:pointer">'+esc(g)+' · <span class="ltr">'+n+'</span></button>').join("")+'</div>' : ""}
    ${roster.length<slots.length?CO.note(`الفئة الحالية تضم ${roster.length} ${countLabel(roster.length)}، بينما تحتاج خطة ${esc(st.f)} إلى ${slots.length} أساسيين. اختر فئة أكبر أو خطة تناسب عدد اللاعبين.`):""}
    <div style="display:flex;gap:6px;overflow-x:auto">
      ${formKeys.map(k=>`<button onclick="tacForm2('${k}')" dir="ltr" style="flex:none;background:${k===st.f?"#151a2e":"#fff"};color:${k===st.f?"#faf8f3":"#5b6078"};border:1px solid ${k===st.f?"#151a2e":"#e9e4d8"};border-radius:13px;padding:11px 15px;font:700 13px 'Space Grotesk';cursor:pointer">${k}</button>`).join("")}
    </div>

    ${TAC.pick?`<div style="background:#efedff;border:1px solid #ddd8fb;border-radius:14px;padding:11px 13px;display:flex;align-items:center;gap:10px">
      ${CO.av(TAC.pick.name,30,{dark:true,r:"50% 50% 8px 50%"})}
      <b style="flex:1;min-width:0;font-size:11.5px;color:#4636e3">${esc(TAC.pick.name)} — اضغط المركز الذي يدخله${TAC.pick.from==="slot"?" أو اضغط «الاحتياط» ليخرج":""}</b>
      <button onclick="tacTap('bench','__cancel__')" style="background:none;border:0;font:900 15px Cairo;color:#8a8fa5;cursor:pointer">×</button></div>`:""}

    <div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;overflow:hidden">
      <div style="background:linear-gradient(170deg,#1d4a3e,#0f2b24);padding:20px 10px;position:relative">
        <div style="position:absolute;inset:14px;border:1.5px solid rgba(255,255,255,.14);border-radius:10px"></div>
        <div style="position:absolute;inset-inline:14px;top:50%;height:1.5px;background:rgba(255,255,255,.12)"></div>
        <div style="position:absolute;inset-inline-start:50%;top:50%;width:70px;height:70px;border:1.5px solid rgba(255,255,255,.12);border-radius:50%;transform:translate(-50%,-50%)"></div>
        <div style="position:relative;display:flex;flex-direction:column-reverse;gap:14px">
          ${lines.map(([n,lb])=>`<div style="display:flex;justify-content:space-around;align-items:flex-start">
            ${[...Array(n)].map(()=>{ si++; const nm=st.slots[si], p=byName[nm], sel=TAC.pick&&TAC.pick.from==="slot"&&TAC.pick.i===si;
              return `<button onclick="tacTap('slot',${si})" style="background:none;border:0;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;width:60px;font-family:Cairo">
                ${p?CO.av(p.name,38,{url:p.avatar_url,dark:true,r:"50% 50% 9px 50%",ring:`2.5px solid ${sel?"#4636e3":"rgba(245,197,24,.9)"}`})
                   :`<span style="width:38px;height:38px;border-radius:50% 50% 9px 50%;background:rgba(255,255,255,.1);border:1.5px dashed rgba(255,255,255,.4);display:grid;place-items:center;font-size:15px;color:#c6cade">＋</span>`}
                <span style="font-size:8.5px;font-weight:900;color:${p?(sel?"#b9b0f5":"#f5c518"):"#8fa5a0"};text-align:center;line-height:1.3">${p?esc(String(p.name).split(" ")[0]):lb}</span>
                ${p&&p.shirt?`<span class="ltr" style="font-size:8px;font-weight:700;color:#c6cade">#${p.shirt}</span>`:""}</button>`; }).join("")}
          </div>`).join("")}
        </div>
      </div>
      <div style="padding:12px 15px;display:flex;justify-content:space-between;align-items:center;gap:10px">
        <span style="font-size:11px;font-weight:900">الأساسيون <b class="ltr" style="color:#4636e3">${start.length}/${slots.length}</b></span>
        <button onclick="tacAuto()" style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:11px;padding:8px 12px;font:900 10.5px Cairo;cursor:pointer">↺ رتّب بالمراكز</button>
      </div>
    </div>

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h(`الاحتياط · <span class="ltr">${bench.length}</span>`)}<span style="font-size:10px;color:#8a8fa5;font-weight:800">اضغط لاعبًا ثم مركزًا</span></div>
      ${bench.length?`<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px">
        ${bench.map(p=>chip(p, TAC.pick&&TAC.pick.from==="bench"&&TAC.pick.name===p.name, `tacTap('bench','${CO.esn(p.name)}')`)).join("")}</div>`
      :CO.empty("كل المتاحين في التشكيلة")}`)}

    ${unav.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h(`خارج الحسبة · <span class="ltr">${unav.length}</span>`)}<span style="font-size:10px;color:#2c8471;font-weight:800">بقرار المختص لا بقرارك</span></div>
      ${unav.map(p=>{const h=hMap[p.name], S=CO.HS[h.state]||CO.HS.out;
        return `<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
          ${CO.av(p.name,32,{url:p.avatar_url,dark:true,r:"50% 50% 8px 50%",style:"filter:grayscale(.7)"})}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(p.name)}</b>
            <span style="display:block;font-size:9.5px;font-weight:800;color:${S[1]}">${S[0]}${h.phase?" · "+esc(h.phase):""} — ${esc(h.updated_by||"المختص")}</span></div></div>`;}).join("")}`):""}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("مُراحون بقرارك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">${rest.length?`<span class="ltr">${rest.length}</span>`:"لا أحد"}</span></div>
      ${CO.sub("إراحة اللاعب قرار فنّي باسمك — يظهر في تقويمه ولا يُحسب غيابًا")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px">
        ${roster.filter(ok).map(p=>`<button onclick="tacOut('${CO.esn(p.name)}')" style="background:${(st.out||[]).indexOf(p.name)>=0?"#151a2e":"#faf8f3"};color:${(st.out||[]).indexOf(p.name)>=0?"#faf8f3":"#5b6078"};border:1px solid ${(st.out||[]).indexOf(p.name)>=0?"#151a2e":"#e9e4d8"};border-radius:999px;padding:6px 11px;font:900 10px Cairo;cursor:pointer">${esc(String(p.name).split(" ")[0])}</button>`).join("")}
      </div>`)}

    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:8px">
      <label style="font-size:10px;font-weight:900;color:#5b6078">موعد التشكيلة
        <input type="date" value="${TAC.date(st)}" min="${CO.today()}" onchange="tacDate(this.value)" style="display:block;width:100%;margin-top:5px;border:1px solid #e9e4d8;border-radius:11px;padding:9px 8px;font:800 11px Cairo;background:#fff;color:#151a2e"></label>
      <label style="font-size:10px;font-weight:900;color:#5b6078">الوقت
        <input type="time" value="${TAC.time(st)}" onchange="tacTime(this.value)" style="display:block;width:100%;margin-top:5px;border:1px solid #e9e4d8;border-radius:11px;padding:9px 8px;font:800 11px Cairo;background:#fff;color:#151a2e"></label>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button onclick="tacPub2()" ${incomplete?"disabled":""} style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:13px 10px;font:900 12px Cairo;cursor:${incomplete?"not-allowed":"pointer"};${incomplete?"opacity:.5;":"box-shadow:0 8px 18px rgba(70,54,227,.3)"}">${incomplete?"أكمل الأساسيين ("+start.length+"/"+slots.length+")":"أعلن التشكيلة"}</button>
      <button onclick="openBoard()" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:13px 10px;font:900 12px Cairo;cursor:pointer">✎ ارسم لوحًا</button></div>
    ${CO.note("الإعلان يصل كل لاعب: الأساسي يعرف مركزه والاحتياطي يعرف موقعه — بتأكيد حضور. والجاهزية الطبية تمنع الإقحام ولا تُتجاوز من الشاشة.")}
  </main>`;
};

/* ── فريقي: خيارات تفيد المدرب فعلًا ── */
CO.SORT = [["load","انتظام الحضور"],["att","عدد الحصص"],["name","الاسم"],["pos","المركز"]];
CO.sk = () => "pi_sq_"+(ME&&ME.id);
CO.sq = () => { try{ return JSON.parse(localStorage.getItem(CO.sk())||"null")||{sort:"load",q:""}; }catch(e){ return {sort:"load",q:""}; } };
CO.setSq = o => { try{ localStorage.setItem(CO.sk(), JSON.stringify(Object.assign(CO.sq(),o))); }catch(e){} };
window.sqSort = s => { CO.setSq({sort:s}); render(); };
window.sqFind = v => { CO.setSq({q:v}); const el=document.getElementById("sq_list"); if(el) render(); };
window.sqSheet = async name => {
  const st = CO.sq();
  const sh=document.createElement("div"); sh.id="pi_sheet";
  sh.style.cssText="position:fixed;inset:0;z-index:200;background:rgba(21,26,46,.45);display:flex;align-items:flex-end;justify-content:center";
  sh.onclick=e=>{ if(e.target===sh) sh.remove(); };
  const A=[["★","قيّم بتوقيعك",`closeSheet();go('rate','${CO.esn(name)}')`],
           ["✎","أرسل له تعليمات",`closeSheet();coTo('${CO.esn(name)}');coScope('one');go('brief')`],
           ["▣","افتح بطاقته",`closeSheet();go('publicView','${CO.esn(name)}')`],
           ["◈","سجّل حضوره اليوم",`closeSheet();coTap('${CO.esn(name)}')`],
           ["🔒","حالته الطبية",`closeSheet();go('squad')`]];
  sh.innerHTML=`<div style="background:#faf8f3;width:100%;max-width:520px;border-radius:28px 28px 0 0;padding:18px 18px 24px">
    <div style="width:38px;height:4px;border-radius:99px;background:#d5d0c4;margin:0 auto 14px"></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">${CO.av(name,52,{dark:true,r:"50% 50% 12px 50%"})}
      <div style="flex:1;min-width:0"><b style="display:block;font-size:15px;font-weight:900">${esc(name)}</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">كل ما تختاره يُسجَّل باسمك</span></div></div>
    ${A.map(([g,lb,fn])=>`<button onclick="${fn}" style="width:100%;background:#fff;border:1px solid #e9e4d8;border-radius:16px;padding:13px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;margin-bottom:8px">
      ${CO.ic(g,"#efedff","#4636e3","50% 50% 8px 50%")}<b style="flex:1;font-size:12.5px">${lb}</b><span style="color:#8a8fa5">←</span></button>`).join("")}
    <button onclick="closeSheet()" style="width:100%;background:#fff;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">إغلاق</button></div>`;
  document.body.appendChild(sh);
};

/* ── الملعب بعين المدرب — ومع حفظ شاشة اللاعب كما هي ── */
CO._pitch = T.pitch;
T.pitch = async () => {
  if(!ME || ME.role!=="coach") return CO._pitch ? CO._pitch() : "";
  const org = ME.org||"";
  const [roster,evs,views,med,tr] = await Promise.all([
    CO.roster(),
    q("e", sb.from("match_events").select("*,matches(title,comp)").order("created_at",{ascending:false}).limit(120)),
    q("v", sb.from("pi_views").select("*").order("created_at",{ascending:false}).limit(60)),
    q("m", sb.from("pi_media").select("*").order("created_at",{ascending:false}).limit(40)),
    q("t", sb.from("transparency").select("*").order("created_at",{ascending:false}).limit(60))
  ]);
  const mine = new Set(roster.map(p=>p.name));
  const myEv = evs.filter(e=>mine.has(e.who));
  const myViews = views.filter(v=>mine.has(v.subject));
  const scouts = myViews.filter(v=>v.viewer_role==="scout"||v.viewer_role==="agent");
  const myMed = med.filter(m=>mine.has(m.subject));
  const EV = {goal:["⚽","#fff6d6","#c78c00","هدف موثّق"],assist:["◎","#efedff","#4636e3","صناعة موثقة"],yellow:["▮","#151a2e","#f5c518","إنذار"],red:["▮","#fdeee8","#a83b25","طرد"],sub:["⇄","#efedff","#4636e3","تبديل"]};
  const top = {}; myEv.forEach(e=>{ if(e.type==="goal"||e.type==="assist") top[e.who]=(top[e.who]||0)+1; });
  const rank = Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const stat = [["حدثًا لفريقك", myEv.length],["اطّلاع كشاف", scouts.length],["لقطة رفعوها", myMed.length]];

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="coBack()" aria-label="رجوع للصفحة السابقة" title="رجوع" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">←</button>
    <button onclick="go('explore')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">◎</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">فريقك في الملعب</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">ما دخل سجلات لاعبيك · ومن يراقبهم من خارج الأكاديمية</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${CO.disc()}
      <div style="position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${stat.map(([k,v])=>`<div style="text-align:center"><b class="ltr" style="display:block;font-size:26px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||CO.dash}</b>
          <span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}
      </div></div>

    ${scouts.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("من يراقب لاعبيك")}<span style="font-size:10px;color:#e8531f;font-weight:900">يهمّك</span></div>
      ${CO.sub("كل اطّلاع باسم صاحبه ووقته — وولي الأمر يملك الإذن لا أنت")}
      ${scouts.slice(0,5).map(v=>`<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
        ${CO.av(v.viewer,34,{r:"50% 50% 8px 50%"})}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(v.viewer||"غير معروف")}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(roleAr[v.viewer_role]||v.viewer_role||"")} فتح ملف <b style="color:#4636e3">${esc(v.subject)}</b></span></div>
        <span style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${VW.rel(v.created_at)}</span></div>`).join("")}`):""}

    ${rank.length?CO.card(`${CO.h("الأكثر إسهامًا هذا الموسم")}${CO.sub("محسوب من أهداف وصناعات وقّعها حكامها — لا من رأيك")}
      <div style="display:grid;grid-template-columns:repeat(${rank.length},1fr);gap:9px;margin-top:11px">
        ${rank.map(([n,c],i)=>`<button onclick="sqSheet('${CO.esn(n)}')" style="background:${i===0?"#fff8df":"#faf8f3"};border:1px solid ${i===0?"#f0e2b4":"#e9e4d8"};border-radius:16px;padding:12px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:Cairo">
          ${CO.av(n,42,{dark:true,r:"50% 50% 10px 50%",ring:i===0?"2.5px solid #f5c518":""})}
          <b style="font-size:10.5px;font-weight:900">${esc(String(n).split(" ")[0])}</b>
          <span class="ltr" style="font-size:12px;font-weight:700;color:${i===0?"#c78c00":"#4636e3"}">${c}</span></button>`).join("")}
      </div>`):""}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("آخر ما دخل سجلاتهم")}<a onclick="go('squad')" style="font-size:11px;font-weight:900;cursor:pointer">الكشف ←</a></div>
      ${myEv.length?myEv.slice(0,6).map(e=>{const [g,bg,ink,lb]=EV[e.type]||EV.sub;
        return `<button onclick="sqSheet('${CO.esn(e.who)}')" style="width:100%;background:none;border:0;border-top:1px solid #f0ece2;padding:10px 0;display:flex;gap:11px;align-items:flex-start;cursor:pointer;font-family:Cairo;text-align:start">
          ${CO.ic(g,bg,ink)}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;line-height:1.5">${esc(e.who)} — ${lb}</b>
            <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.matches?e.matches.title:"")} · الدقيقة <span class="ltr">${e.minute}</span> — سجّله ${esc(e.recorded_by)}</span></div>
          <span style="font-size:9.5px;color:#8a8fa5;font-weight:800;flex:none">${VW.rel(e.created_at)}</span></button>`;}).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px">${CO.empty("لا أحداث لفريقك بعد — تدخل هنا لحظة يوقّعها حكم أو منظم")}</div>`}`)}

    ${myMed.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("لقطات رفعوها")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">ملكهم — تراها ولا تحذفها</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        ${myMed.slice(0,4).map(m=>`<div style="position:relative;border-radius:14px;overflow:hidden;background:#151a2e;aspect-ratio:4/3">
          <img src="${esc(m.url)}" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
          <span style="position:absolute;bottom:6px;inset-inline-start:6px;background:rgba(21,26,46,.88);color:#faf8f3;border-radius:999px;padding:3px 8px;font-size:8.5px;font-weight:900">${CO.esn(m.subject)}</span></div>`).join("")}
      </div>`):""}

    ${CO.note("هذه الشاشة مرآة لفريقك لا منشورات: ما وقّعه غيرك في سجلات لاعبيك، ومن اطّلع عليهم من خارج الأكاديمية. لا يُنشر منها شيء باسمك.")}
  </main>`;
};

(function(){
  Object.assign(CO.TITLE, {tactics:["التشكيلة والاحتياط","من يبدأ ومن ينتظر — بقرارك"], pitch:["فريقك في الملعب","ما دخل سجلاتهم ومن يراقبهم"]});
  Object.assign(TITLES, {tactics:"التشكيلة والاحتياط"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE, CO.TITLE);
  CO.OWN.push("pitch");
  /* الشريط: «فريقي» بدل «لوحاتي» — واللوحات من الاختصارات والمفتاح */
  if(typeof NAV!=="undefined")
    NAV.coach = [["home","الرئيسية","coachHome"],["community","فريقي","squad"],["services","الخدمات","hub"],["match","التشكيلة","tactics"],["profile","ملفي","coachMe"]];
})();
