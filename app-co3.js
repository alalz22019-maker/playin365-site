/* PlayIn365 — عمود المدرب مطابقًا للتصميم المعتمد «Coach App» (4a · 4c · 4d · 4f)
   يُحمّل بعد app-coach.js فيتقدّم عليه. قطرة المدرب أسفل-يمين في كل عنصر بلا استثناء. */
const CO = {};
CO.DROP  = "50% 50% 6px 50%";
CO.dash  = "—";
CO.esn   = s => esc(String(s == null ? "" : s));
CO.av    = (n,sz,o) => {
  const opt = Object.assign({role:"coach", r:`50% 50% ${Math.max(4,Math.round((sz||32)*0.16))}px 50%`}, o||{});
  if(typeof PL3 !== "undefined" && PL3 && typeof PL3.av === "function") return PL3.av(n, sz, opt);
  const size = Math.max(24, Number(sz) || 32), name = String(n == null ? "" : n).trim();
  const initials = name.split(/\s+/).filter(Boolean).slice(0,2).map(part => part.charAt(0)).join("") || "؟";
  const extra = [opt.ring ? `border:${opt.ring}` : "", opt.style || ""].filter(Boolean).join(";");
  const style = `width:${size}px;height:${size}px;border-radius:${opt.r||CO.DROP};${extra ? extra + ";" : ""}`;
  if(opt.url) return `<img src="${CO.esn(opt.url)}" alt="${CO.esn(name)}" style="${style}display:block;object-fit:cover;background:#efedff">`;
  const bg = opt.dark ? "linear-gradient(160deg,#4636e3,#2a2260)" : "#efedff", color = opt.dark ? "#fff" : "#4636e3";
  return `<span aria-label="${CO.esn(name)}" style="${style}display:grid;place-items:center;background:${bg};color:${color};font-size:${Math.max(12,Math.round(size*.32))}px;font-weight:900;flex:none">${CO.esn(initials)}</span>`;
};
CO.hasAvatar = n => typeof PL3 !== "undefined" && PL3 && typeof PL3.avUrl === "function" && !!PL3.avUrl(n);
CO.qr = (value,size=180) => `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(String(value==null?"":value))}`;
CO.ic    = (g,bg,ink,r) => `<span style="width:32px;height:32px;border-radius:${r||CO.DROP};background:${bg||"#efedff"};color:${ink||"#4636e3"};display:grid;place-items:center;font-size:13px;font-weight:900;flex:none">${g}</span>`;
CO.card  = inner => `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:16px">${inner}</div>`;
CO.h     = t => `<b style="font-size:13px;font-weight:900">${t}</b>`;
CO.sub   = t => `<span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">${t}</span>`;
CO.note  = t => `<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">${t}</div>`;
CO.empty = t => `<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8">${t}</div>`;
CO.disc  = orange => `<div style="position:absolute;inset-inline-start:62%;top:-70%;width:70%;height:230%;background:${orange?"#e8531f":"linear-gradient(200deg,#4636e3,#7b5cff)"};border-radius:50%;opacity:${orange?".55":".5"}"></div>`;
CO.TITLE = {};
CO.today = () => new Date().toISOString().slice(0,10);
CO.isSession = c => c && c.kind === "training" && !/تقييم المدرب|تعليمات المدرب|خطة راحة/.test(String(c.title||""));
CO.sessionsOf = cal => (cal||[]).filter(CO.isSession);
CO.grpOf = age => { const a=Number(age); if(!Number.isFinite(a)||a<4||a>70)return null; if(a<6)return "براعم أقل من 6"; if(a<=8)return "براعم 6–8"; if(a<=10)return "براعم 9–10"; if(a<=12)return "ناشئون 11–12"; if(a<=14)return "ناشئون 13–14"; if(a<=16)return "شباب 15–16"; if(a<=18)return "شباب 17–18"; if(a<=23)return "U23"; return "الفريق الأول"; };
CO.groupOf = p => { const group=p&&(p.group_name||p.age_group||p.cohort); return group?String(group).trim():(p?(CO.grpOf(p.age)||"غير مصنّف"):null); };

/* الفئة المختارة — تبقى مع المدرب */
CO.gkey = () => "pi_cgrp_" + (ME && ME.id);
CO.grp  = () => { try { return localStorage.getItem(CO.gkey()) || "all"; } catch(e){ return "all"; } };
window.coGrp = g => { try{ localStorage.setItem(CO.gkey(), g); }catch(e){} render(); };

/* كشف المدرب: لاعبو جهته */
CO.roster = async () => {
  const org = ME.org || "";
  const pf = await q("p", sb.from("profiles").select("id,name,role,org,pos,age,shirt,avatar_url").eq("role","player").not("name","is",null).limit(120));
  const mine = pf.filter(p => !org || p.org === org);
  const g = CO.grp();
  CO._roster = mine;
  return g === "all" ? mine : mine.filter(p => CO.groupOf(p) === g);
};
CO.load = (att, name) => {
  const sessions=new Map();
  att.filter(a=>a.player_name===name&&a.present!==false).forEach(a=>{const key=CO.sessionKey(a),day=CO.rowDate(a);if(key&&day)sessions.set(key,day);});
  const ages=[...sessions.values()].map(day=>(Date.now()-Date.parse(day+"T00:00:00Z"))/864e5).filter(days=>days>=0&&days<=28);
  const d7=ages.filter(days=>days<=7).length,d28=ages.length;
  if(!d28)return null;
  return +(d7/(d28/4)).toFixed(2);
};
CO.loadInk = v => v==null ? "#b0b5c6" : v>1.3 ? "#4636e3" : v<0.8 ? "#c78c00" : "#2c6e49";
CO.HS = {available:["متاح","#2c6e49"],rehab:["تأهيل","#c78c00"],limited:["بقيود","#c78c00"],out:["غير متاح","#a83b25"]};

/* ═══════════ 4a · مساحة المدرب ═══════════ */
T.coachHome = async () => {
  const org = ME.org || "";
  const [roster,att,cal,hs,mt,ev] = await Promise.all([
    CO.roster(),
    q("a", sb.from("attendance").select("*").eq("org",org).order("created_at",{ascending:false}).limit(400)),
    q("c", sb.from("calendar_items").select("*").eq("created_by",ME.name).order("on_date",{ascending:true}).limit(60)),
    q("h", sb.from("health_status").select("*").limit(120)),
    q("m", sb.from("matches").select("*").order("created_at",{ascending:false}).limit(20)),
    q("e", sb.from("match_events").select("*,matches(title)").eq("recorded_by",ME.name).order("created_at",{ascending:false}).limit(20))
  ]);
  const hMap = {}; hs.forEach(h => hMap[h.player_name] = h);
  const ses = CO.sessionsOf(cal);
  const today = ses.find(c => String(c.on_date||"").slice(0,10) === CO.today()) || ses.find(c => String(c.on_date||"") >= CO.today());
  const live  = mt.find(m => m.status === "live");
  const nextM = mt.find(m => m.status === "today") || mt.find(m => m.status === "open");
  const groupNames = new Set(roster.map(p=>p.name));
  const conf  = today ? new Set(att.filter(a=>CO.rowDate(a)===String(today.on_date||"").slice(0,10)&&a.present!==false&&groupNames.has(a.player_name)).map(a=>a.player_name)).size : 0;
  const ready = roster.filter(p => !hMap[p.name] || hMap[p.name].state === "available").length;
  const rehab = roster.filter(p => hMap[p.name] && hMap[p.name].state === "rehab").length;
  const out   = roster.filter(p => hMap[p.name] && hMap[p.name].state === "out").length;
  const limited = roster.filter(p => hMap[p.name] && hMap[p.name].state === "limited").length;
  const stat  = [["جاهز", ready||CO.dash, "#2c6e49"],["تأهيل", rehab||CO.dash, "#c78c00"],["بقيود", limited||CO.dash, "#c78c00"],["غير متاح", out||CO.dash, "#a83b25"]];
  const flags = roster.map(p => {
    const h = hMap[p.name], lv = CO.load(att, p.name);
    const last = att.find(a => a.player_name === p.name&&a.present!==false);
    const off  = last ? Math.floor((Date.now()-Date.parse(CO.rowDate(last)+"T00:00:00Z"))/864e5) : null;
    if(h && h.state === "out")   return {n:p.name, w:"غير متاح — بقرار المختص", ink:"#a83b25"};
    if(h && h.state === "rehab") return {n:p.name, w:"عائد من إصابة · "+(h.phase||"تأهيل"), ink:"#c78c00"};
    if(lv!==null && lv < 0.8)     return {n:p.name, w:"حضور أقل من المعتاد · "+Math.round(lv*100)+"٪", ink:"#c78c00"};
    if(off !== null && off >= 14) return {n:p.name, w:"غائب "+off+" يومًا", ink:"#c78c00"};
    return null;
  }).filter(Boolean).slice(0,3);
  const SC = [
    ["✎","أرسل تعليمات","للاعبيك","brief","#efedff","#4636e3"],
    ["▦","فريقي","الكشف والانتظام","squad","#efedff","#4636e3"],
    ["◈","حصة اليوم","الحضور بنقرة","session","#eaf5ee","#2c6e49"],
    ["★","قيّم لاعبًا","بتوقيعك","rate","#fff6d6","#c78c00"],
    ["▤","بنك التمارين","وخطة الحصة","drills","#efedff","#4636e3"],
    ["✎","لوح التكتيك","ارسم وانشر","boards","#fff6d6","#c78c00"]
  ];
  const log = [
    ...ev.slice(0,3).map(e => ({t:evLabel(e), by:(e.matches?e.matches.title:"مباراة")+" — وقّعته أنت", v:e.minute+"′", ink:"#4636e3", g:e.type==="goal"?"⚽":e.type==="assist"?"◎":"▮"})),
    ...att.filter(a => a.recorded_by === ME.name).slice(0,3).map(a => ({t:"حضور "+a.player_name, by:"حصة "+String(a.created_at||"").slice(0,10)+" — وقّعتها أنت", v:"✓", ink:"#2c6e49", g:"✓"}))
  ].slice(0,4);

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('coachTasks')" style="position:relative;width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">◔${flags.length?`<span style="position:absolute;top:8px;inset-inline-end:9px;width:7px;height:7px;border-radius:50%;background:#e8531f"></span>`:""}</button>
    ${WM()}
    <button onclick="go('coachMe')" style="position:relative;background:none;border:0;padding:0;cursor:pointer;flex:none">${CO.av(ME.name,44,{dark:true,r:"50% 50% 10px 50%"})}</button>
  </div>
  <div style="text-align:center;padding:10px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">مساحة المدرب</b>
    <span style="display:block;font-size:12.5px;font-weight:800;color:#4636e3;margin-top:2px">هلا كابتن ${esc((ME.name||"").split(" ")[0])} 👋</span>
    <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">فريقك اليوم — من يحضر ومن يحتاجك</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;border-radius:22px;overflow:hidden;background:#151a2e;min-height:236px;display:flex">${CO.disc()}
      <div style="position:relative;padding:18px;display:flex;flex-direction:column;gap:8px;width:64%">
        <span style="color:#b9b0f5;font-size:10.5px;font-weight:900">⚽ ${today?(String(today.on_date||"").slice(0,10)===CO.today()?"حصة اليوم":"الحصة القادمة"):"يومك"}${CO.grp()!=="all"?` · <span class="ltr">${CO.grp()}</span>`:""}</span>
        <b style="display:block;font-size:20px;font-weight:900;color:#faf8f3;line-height:1.3">${esc(today?today.title:"لا حصة مثبّتة اليوم")}</b>
        <span style="display:block;font-size:11px;color:#c6cade;font-weight:700;line-height:1.9">
          ${today?`◔ <span class="ltr">${esc(today.at_time||CO.dash)}</span><br>◎ ${esc(today.place||today.org||org||CO.dash)}<br><span style="color:#8f9bff">أكّد <span class="ltr">${conf||CO.dash}</span> من <span class="ltr">${roster.length||CO.dash}</span></span>`
            :`تقويمك فارغ اليوم — ابنِ حصتك من بنك التمارين وانشرها فتدخل تقاويم لاعبيك باسمك`}</span>
        <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
          <button onclick="go('${today?"session":"drills"}')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:10px 14px;font:900 11.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">${today?"افتح الحصة":"ابنِ حصة"}</button>
          <button onclick="go('brief')" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);color:#faf8f3;border-radius:14px;padding:10px 12px;font:900 11.5px Cairo;cursor:pointer">أرسل تعليمات</button>
        </div>
      </div>
      <div style="position:absolute;inset-inline-end:16px;bottom:16px;width:92px;height:92px;border-radius:50%;display:grid;place-items:center;background:#151a2e;box-shadow:0 0 0 6px #4636e3,inset 0 2px 10px rgba(21,26,46,.08)">
        <div style="text-align:center"><b class="ltr" style="display:block;font-size:${roster.length?"22px":"26px"};font-weight:700;color:#faf8f3">${roster.length?conf+"/"+roster.length:CO.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800">أكّدوا</span></div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;overflow:hidden;display:flex;flex-direction:column">
        <div style="background:#151a2e;color:#faf8f3;padding:9px 14px;font-size:12px;font-weight:900;text-align:center">جاهزية الفريق</div>
        <div style="padding:10px 14px 12px;flex:1">
          ${stat.map(([k,v,ink])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f0ece2"><span style="font-size:11px;font-weight:800">${k}</span><b class="ltr" style="font-size:12.5px;color:${ink}">${v}</b></div>`).join("")}
          <span style="display:block;font-size:9px;color:#8a8fa5;font-weight:700;margin-top:8px;line-height:1.6">${roster.length?`يكتبها المختص الطبي — لا أنت`:"لا كشف مرتبط بجهتك بعد"}</span>
        </div></div>
      <div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;overflow:hidden;display:flex;flex-direction:column">
        <div style="background:${flags.length?"#e8531f":"#2c6e49"};color:#fff;padding:9px 14px;font-size:12px;font-weight:900;text-align:center">${flags.length?"يحتاجون نظرتك":"لا تنبيه"}</div>
        <div style="padding:10px 14px 12px;flex:1">
          ${flags.length?flags.map(f=>`<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #f0ece2">
            ${CO.av(f.n,26,{dark:true,r:"50% 50% 12px 50%"})}
            <div style="flex:1;min-width:0"><b style="display:block;font-size:10.5px">${esc(f.n)}</b>
              <span style="display:block;font-size:9px;font-weight:800;color:${f.ink}">${esc(f.w)}</span></div></div>`).join("")
          :`<span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;line-height:1.8;padding-top:6px">${roster.length?"كل اللاعبين في المسار ✓ — لا حمل حادّ ولا غياب طويل":"يظهر التنبيه بعد أول حصة موقّعة"}</span>`}
        </div></div>
    </div>

    ${!ME.org?`<button onclick="joinByCode()" style="background:#fff;border:1.5px dashed #b9b0f5;border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:Cairo;text-align:start;width:100%;color:#151a2e">
      <span style="width:40px;height:40px;border-radius:50% 50% 8px 50%;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:17px;flex:none">⌗</span>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:13px;font-weight:900">عندك رمز من أكاديميتك؟</b>
        <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">أدخله فترتبط بها — ويصير كشفها كشفك</span></div>
      <span style="color:#4636e3">←</span></button>`:""}
    ${CO.h("اختصارات سريعة")}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${SC.map(([g,t,s,v,bg,ink])=>`<button onclick="go('${v}')" style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;color:#151a2e;cursor:pointer;font-family:Cairo">
        <span style="width:40px;height:40px;border-radius:50% 50% 8px 50%;display:grid;place-items:center;font-size:17px;background:${bg};color:${ink}">${g}</span>
        <b style="font-size:12px;font-weight:900">${t}</b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800">${s}</span></button>`).join("")}
    </div>

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">${CO.h("آخر ما سجّلته أنت")}<a onclick="go('squad')" style="font-size:11px;font-weight:900;cursor:pointer">الفريق ←</a></div>
      ${log.length?log.map(e=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${CO.ic(e.g,"#efedff","#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px;line-height:1.5">${esc(e.t)}</b>
          <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.by)}</span></div>
        <b class="ltr" style="font-size:12.5px;flex:none;color:${e.ink}">${e.v}</b></div>`).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px">${CO.empty("لم توقّع شيئًا بعد — أول حضور تسجّله يدخل سجل اللاعب باسمك لحظته")}</div>`}`)}

    ${(live||nextM)?`<button onclick="go('orgMatch')" style="background:#151a2e;border:0;border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;color:#faf8f3;position:relative;overflow:hidden;cursor:pointer;font-family:Cairo;text-align:start;width:100%">${CO.disc(true)}
      <span style="position:relative;width:40px;height:40px;border-radius:50% 50% 8px 50%;background:#e8531f;color:#fff;display:grid;place-items:center;font-size:15px;flex:none${live?";animation:pulse 1.4s infinite":""}">●</span>
      <div style="position:relative;flex:1;min-width:0"><b style="display:block;font-size:13px;font-weight:900">${live?"مباراة مباشرة — التسجيل بلمستين":"المباراة القادمة — التسجيل بلمستين"}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:2px">${esc((live||nextM).title)} · <span class="ltr">${esc((live||nextM).match_time||"")}</span></span></div>
      <span style="position:relative;color:#f5c518">←</span></button>`:""}

    <div style="background:#151a2e;border-radius:20px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden">${CO.disc()}
      <div style="position:relative"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">دورك الحالي</span><b style="display:block;font-size:18px;font-weight:900;color:#faf8f3;line-height:1.2">مدرب</b></div>
      <button onclick="go('role')" style="position:relative;background:#fff;color:#151a2e;border:0;border-radius:999px;padding:9px 14px;font:900 11px Cairo;cursor:pointer">⇄ تغيير الدور</button></div>
  </main>`;
};

/* ═══════════ 4c · فريقي ═══════════ */
T.squad = async () => {
  const org = ME.org || "";
  const [roster,all,att,hs] = await Promise.all([
    CO.roster(),
    q("p", sb.from("profiles").select("age,org,role").eq("role","player").limit(200)),
    q("a", sb.from("attendance").select("*").eq("org",org).order("created_at",{ascending:false}).limit(500)),
    q("h", sb.from("health_status").select("*").limit(120))
  ]);
  const hMap = {}; hs.forEach(h => hMap[h.player_name] = h);
  const mine = all.filter(p => !org || p.org === org);
  const groups = {}; mine.forEach(p => { const g = CO.groupOf(p); if(g) groups[g] = (groups[g]||0)+1; });
  const gsel = CO.grp();
  const sessionKeys = [...new Set(att.filter(a=>a.present!==false).map(CO.sessionKey).filter(Boolean))];
  const sessions = sessionKeys.length;
  const last2 = sessionKeys.slice(0,2);
  const hex = roster.map(p => {
    const days = new Set(att.filter(a=>a.player_name===p.name&&a.present!==false).map(CO.sessionKey).filter(Boolean));
    const n = days.size, pct = sessions ? n/sessions : 0;
    const gone = n>0 && last2.length===2 && last2.every(d=>!days.has(d));
    return {n:p.name, v:(p.shirt||String(p.name).trim()[0]), bg: !n?"#f2f0ea": gone?"#fdeee8": pct>=0.9?"#151a2e":"#efedff", ink: !n?"#b0b5c6": gone?"#a83b25": pct>=0.9?"#f5c518":"#4636e3"};
  });
  const SQ = (typeof CO.sq==="function") ? CO.sq() : {sort:"load",q:""};
  const nAtt = n => new Set(att.filter(x=>x.player_name===n&&x.present!==false).map(CO.sessionKey).filter(Boolean)).size;
  let rows = roster.map(p => {
    const h = hMap[p.name], lv = CO.load(att, p.name), st = CO.HS[h?h.state:"available"] || CO.HS.available;
    return {p, st, lv, n:nAtt(p.name), pct: lv==null?0:Math.min(100, Math.round(lv/2*100)), ink: CO.loadInk(lv)};
  });
  if(SQ.q) rows = rows.filter(r => String(r.p.name).indexOf(SQ.q)>=0 || String(r.p.pos||"").indexOf(SQ.q)>=0);
  rows.sort((x,y) => SQ.sort==="name" ? String(x.p.name).localeCompare(y.p.name,"ar")
    : SQ.sort==="pos" ? String(x.p.pos||"").localeCompare(y.p.pos||"","ar")
    : SQ.sort==="att" ? y.n-x.n : (y.lv||0)-(x.lv||0));
  const bench = rows.filter(r => r.st[0] === "متاح").slice(-5).reverse();

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('coachHome')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <button onclick="go('explore')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌕</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">فريقي</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">الحالة الطبية المسجلة ومؤشر انتظام الحضور لكل لاعب</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    ${Object.keys(groups).length?`<div style="display:flex;gap:6px;flex-wrap:wrap">
      <button onclick="coGrp('all')" style="flex:none;background:${gsel==="all"?"#151a2e":"#fff"};color:${gsel==="all"?"#faf8f3":"#5b6078"};border:1px solid ${gsel==="all"?"#151a2e":"#e9e4d8"};border-radius:999px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">الكل · <span class="ltr">${mine.length}</span></button>
      ${Object.entries(groups).sort().map(([g,n])=>`<button onclick="coGrp('${g}')" style="flex:none;background:${gsel===g?"#151a2e":"#fff"};color:${gsel===g?"#faf8f3":"#5b6078"};border:1px solid ${gsel===g?"#151a2e":"#e9e4d8"};border-radius:999px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer"><span class="ltr">${g}</span> · <span class="ltr">${n}</span></button>`).join("")}
    </div>`:""}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("خلية الحضور")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${roster.length||CO.dash}</span> لاعبًا × <span class="ltr">${sessions||CO.dash}</span> حصة</span></div>
      ${roster.length?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px">
        ${hex.map(x=>`<span title="${CO.esn(x.n)}" style="width:34px;height:38px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);display:grid;place-items:center;font-size:9px;font-weight:900;background:${x.bg};color:${x.ink}" class="ltr">${CO.esn(x.v)}</span>`).join("")}</div>
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:8px">داكن = التزام فوق <span class="ltr">90%</span> · فاتح = دونه · برتقالي = غياب متتالٍ · رمادي = بلا حصة موقّعة</span>`
      :CO.empty("لا كشف بعد — أنشئ مجموعتك الأولى أو اقبل دعوة أكاديمية")}`)}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("الكشف والانتظام")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">مؤشر مقارنة بمتوسط آخر ٤ أسابيع</span></div>
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
        <input value="${CO.esn(SQ.q)}" oninput="sqFind(this.value)" placeholder="ابحث باسم أو مركز" style="flex:1;min-width:120px;border:1px solid #e9e4d8;border-radius:11px;padding:8px 11px;font:700 11px Cairo;background:#faf8f3">
        ${(CO.SORT||[]).map(([k,lb])=>`<button onclick="sqSort('${k}')" style="flex:none;background:${SQ.sort===k?"#151a2e":"#faf8f3"};color:${SQ.sort===k?"#faf8f3":"#5b6078"};border:1px solid ${SQ.sort===k?"#151a2e":"#e9e4d8"};border-radius:999px;padding:7px 11px;font:900 10px Cairo;cursor:pointer">${lb}</button>`).join("")}
      </div>
      ${rows.length?rows.map(r=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
        ${CO.av(r.p.name,36,{url:r.p.avatar_url,dark:true,r:"50% 50% 12px 50%"})}
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-size:12px">${esc(r.p.name)}</b><span style="font-size:9.5px;font-weight:900;color:${r.st[1]};flex:none">${r.st[0]}</span></div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <span style="font-size:9px;color:#8a8fa5;font-weight:800;flex:none">${esc(r.p.pos||"لاعب")}</span>
            <div style="flex:1;height:6px;border-radius:999px;background:#f0ece2;overflow:hidden;position:relative">
              <span style="position:absolute;inset-inline-start:40%;width:25%;height:100%;background:#eaf5ee"></span>
              <span style="display:block;height:100%;border-radius:999px;background:${r.ink};width:${r.pct}%"></span></div>
            <b class="ltr" style="font-size:10.5px;flex:none;color:${r.ink}">${r.lv==null?CO.dash:Math.round(r.lv*100)+"٪"}</b></div></div>
        <button onclick="sqSheet('${CO.esn(r.p.name)}')" style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:10px;color:#4636e3;font:900 12px Cairo;cursor:pointer;flex:none;padding:7px 10px">⋯</button></div>`).join("")
      :CO.empty(SQ.q?"لا نتيجة لبحثك":"لا لاعبين في هذه الفئة")}`)}

    ${bench.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h(`الاحتياط · <span class="ltr">${bench.length}</span>`)}<span style="font-size:10px;color:#8a8fa5;font-weight:800">أقل حضورًا مؤخرًا — راجع الحالة</span></div>
      <div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto">
        ${bench.map(b=>`<div style="flex:none;width:64px;text-align:center;background:#faf8f3;border:1px solid #e9e4d8;border-radius:16px;padding:8px 4px">
          <b class="ltr" style="display:block;font-size:16px;color:#4636e3">${b.p.shirt||CO.dash}</b>
          <span style="display:block;font-size:9px;font-weight:900;margin-top:2px">${esc(String(b.p.name).split(" ")[0])}</span>
          <span class="ltr" style="display:block;font-size:9px;font-weight:800;color:${b.ink};margin-top:2px">${b.lv==null?CO.dash:Math.round(b.lv*100)+"٪"}</span></div>`).join("")}
      </div>`):""}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button onclick="go('session')" style="background:#4636e3;color:#fff;border:0;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">سجّل حضور اليوم</button>
      <button onclick="go('tactics')" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">التشكيلة والاحتياط</button>
      <button onclick="go('brief')" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">تعليمات للكشف</button>
      <button onclick="go('rate')" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:14px;padding:12px;font:900 12px Cairo;cursor:pointer">قيّم لاعبًا</button>
    </div>
    ${CO.note("مؤشر انتظام الحضور يقارن آخر ٧ أيام بمتوسط أربعة أسابيع؛ ولا يعبّر عن شدة التدريب أو حالة طبية. الحالة الطبية يحدّثها المختص.")}
  </main>`;
};

/* ═══════════ 4d · حصة اليوم ═══════════ */
CO.PLAN = [
  {min:15, t:"إحماء ومرونة", s:"جري خفيف · إطالات فعّالة", tag:"خفيف", tagBg:"#efedff", tagInk:"#4636e3"},
  {min:30, t:"قوة وتحمّل", s:"دوائر · تسارع ٢٠م × ٦", tag:"عالٍ", tagBg:"#fdeee8", tagInk:"#e8531f"},
  {min:30, t:"لعب مقسّم", s:"استقبال تحت الضغط · روندو", tag:"متوسط", tagBg:"#fff6d6", tagInk:"#c78c00"},
  {min:15, t:"استشفاء", s:"إطالات · تنفّس", tag:"خفيف", tagBg:"#eaf5ee", tagInk:"#2c6e49"}
];
CO.akey = () => "pi_att_" + (ME&&ME.id) + "_" + CO.today();
CO.attState = () => { try { return JSON.parse(localStorage.getItem(CO.akey())||"{}"); } catch(e){ return {}; } };
CO.rowDate = row => String((row&&row.session_date)||((row&&row.created_at)||"").slice(0,10)||"").slice(0,10);
CO.rowState = row => {
  if(!row) return "none";
  if(row.present===true || row.status==="present") return "in";
  const source=String(row.source||row.status||"").toLowerCase();
  return source==="coach_excused"||source==="excused"||source==="off" ? "off" : "none";
};
CO.sessionKey = row => String((row&&row.session_id)||CO.rowDate(row)||"");
window.coTap = async name => {
  const s=CO.attState();
  const prior=(CO._attendanceRows||[]).filter(r=>r.player_name===name).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))[0];
  const cur=Object.prototype.hasOwnProperty.call(s,name)?s[name]:CO.rowState(prior);
  const nx=cur==="none"?"in":cur==="in"?"off":"none";
  s[name]=nx;
  try{localStorage.setItem(CO.akey(),JSON.stringify(s));}catch(e){}
  toast("تم تحديد الحالة. احفظ القائمة لتثبيتها");
  render();
};
window.coSaveAttendance = async silent => {
  const st=CO.attState(), roster=CO._roster||[];
  const people=roster.filter(p=>Object.prototype.hasOwnProperty.call(st,p.name));
  if(!people.length){if(!silent)toast("لا توجد حالات جديدة للحفظ");return true;}
  const {data,error}=await sb.from("attendance").select("*").eq("org",ME.org||"").order("created_at",{ascending:false}).limit(500);
  if(error){toast("تعذّر تحميل سجل الحضور",1);return false;}
  const day=CO.today(), dayRows=(data||[]).filter(a=>CO.rowDate(a)===day);
  const work=people.map(p=>{
    const rows=dayRows.filter(a=>a.player_name===p.name);
    const latest=rows[0]||null, next=st[p.name], previous=CO.rowState(latest);
    return {p,rows,next,previous,correction:!!latest&&previous!==next};
  }).filter(x=>!x.rows.length||x.previous!==x.next);
  if(!work.length){
    const remaining={...st}; people.forEach(p=>delete remaining[p.name]);
    try{if(Object.keys(remaining).length)localStorage.setItem(CO.akey(),JSON.stringify(remaining));else localStorage.removeItem(CO.akey());}catch(e){}
    if(!silent)toast("الحالات المسجلة مطابقة للقائمة");
    render();return true;
  }
  const corrections=work.filter(x=>x.correction);
  let reason="";
  if(corrections.length){
    const answer=typeof PI!=="undefined"&&PI.sheet?await PI.sheet({icon:"↺",title:"سبب تصحيح الحضور",sub:"التعديل يحفظ اسمك ووقته في سجل المراجعة.",fields:[{id:"reason",label:"سبب التصحيح",placeholder:"مثال: سُجلت الحالة بالخطأ"}],ok:"سجّل التصحيح"}):null;
    if(!answer||!String(answer.reason||"").trim())return false;
    reason=String(answer.reason).trim();
  }
  let saved=0;
  for(const item of work){
    const p=item.p, state=item.next;
    const row={player_name:p.name,org:ME.org||"",group_name:CO.groupOf(p)||"عام",session_date:day,recorded_by:ME.name,present:state==="in",source:state==="in"?"coach_present":state==="off"?"coach_excused":"coach_absent"};
    if(item.rows.length){
      const ids=item.rows.map(r=>r.id).filter(Boolean);
      if(!ids.length){toast("تعذّر تحديد سجل اللاعب لتصحيحه",1);return false;}
      const {data:updated,error:updateError}=await sb.from("attendance").update(row).in("id",ids).select("id");
      if(updateError||!updated||!updated.length){toast("تعذّر حفظ تصحيح الحضور",1);return false;}
    }else{
      const {error:insertError}=await sb.from("attendance").insert(row);
      if(insertError){toast("تعذّر حفظ الحضور",1);return false;}
    }
    saved++;
  }
  if(corrections.length) await trans("تصحيح الحضور ("+corrections.map(x=>x.p.name).join("، ")+") · السبب: "+reason);
  else await trans("حفظ حالات حضور الحصة · "+saved+" لاعبًا");
  const remaining={...st}; people.forEach(p=>delete remaining[p.name]);
  try{if(Object.keys(remaining).length)localStorage.setItem(CO.akey(),JSON.stringify(remaining));else localStorage.removeItem(CO.akey());}catch(e){}
  if(!silent)toast("حُفظت حالات الحضور والتصحيحات باسمك");
  render();return true;
};
window.coStart = async () => {
  const st=CO.attState(), roster=CO._roster||[];
  const current=name=>Object.prototype.hasOwnProperty.call(st,name)?st[name]:CO.rowState((CO._attendanceRows||[]).find(a=>a.player_name===name));
  const present=roster.filter(p=>current(p.name)==="in").length;
  if(!present)return toast("سجّل حضور لاعب واحد على الأقل أولًا",1);
  if(Object.keys(st).length){const ok=await coSaveAttendance(true);if(!ok)return;}
  await trans("بدأ حصة اليوم بـ"+present+" حاضرًا");
  toast("بدأت الحصة — وقّعتها باسمك");
};
T.session = async () => {
  const org = ME.org || "";
  const [roster,att,cal] = await Promise.all([
    CO.roster(),
    q("a", sb.from("attendance").select("*").eq("org",org).order("created_at",{ascending:false}).limit(500)),
    q("c", sb.from("calendar_items").select("*").eq("created_by",ME.name).order("on_date",{ascending:true}).limit(40))
  ]);
  const st = CO.attState();
  CO._attendanceRows=att;
  const today = CO.sessionsOf(cal).find(c => String(c.on_date||"").slice(0,10) === CO.today());
  const todayRows=att.filter(a=>CO.rowDate(a)===CO.today()), savedToday={};
  todayRows.forEach(a=>{if(!savedToday[a.player_name])savedToday[a.player_name]=a;});
  const stOf = n => Object.prototype.hasOwnProperty.call(st,n) ? st[n] : CO.rowState(savedToday[n]);
  const inN  = roster.filter(p => stOf(p.name) === "in").length;
  const offN = roster.filter(p => stOf(p.name) === "off").length;
  const noN  = roster.length - inN - offN;
  const savedKeys = typeof CH !== "undefined" && typeof CH.plan === "function" ? CH.plan() : [];
  const selected = typeof CH !== "undefined" && Array.isArray(savedKeys) && Array.isArray(CH.DRILLS)
    ? savedKeys.map(k => CH.DRILLS.find(d => d.k === k)).filter(Boolean) : [];
  const tint = {tactic:"#efedff", tech:"#fff6d6", phys:"#fdeee8", recover:"#eaf5ee"};
  const plan = selected.length ? selected.map(d => {
    const aim = (CH.AIM || {})[d.aim] || {};
    return {min:Math.max(0,Number(d.min)||0), t:d.ar||"تمرين", s:d.d||"", tag:aim.ar||"تمرين", tagBg:tint[d.aim]||"#f2f0ea", tagInk:aim.c||"#4636e3"};
  }) : CO.PLAN;
  const mins = plan.reduce((s,p) => s+p.min, 0);
  const RING = {in:"#4636e3", off:"#e8531f", none:"#e9e4d8"};
  const INK  = {in:"#4636e3", off:"#e8531f", none:"#8a8fa5"};
  const four = [...roster];
  const gsz  = Math.max(1, Math.ceil(four.length/4));
  const gr   = [0,1,2,3].map(i => four.slice(i*gsz, (i+1)*gsz)).filter(g => g.length);

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('coachHome')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <button onclick="go('drills')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">✎</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">حصة اليوم</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">الحضور بنقرة · تقسيم الفريق · سجل الحضور</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${CO.disc()}
      <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-end;gap:12px">
        <div style="min-width:0"><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">${esc(today?today.title:"حصة غير مثبّتة")} · <span class="ltr">${mins}</span> دقيقة</span>
          <b class="ltr" style="display:block;font-size:32px;font-weight:700;margin-top:4px">${roster.length?inN+" / "+roster.length:CO.dash}</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700">حاضرون · اعتذر <span class="ltr">${offN||CO.dash}</span> · لم يصل <span class="ltr">${noN||CO.dash}</span></span></div>
        <button onclick="coStart()" style="background:#fff;color:#151a2e;border:0;border-radius:14px;padding:12px 14px;font:900 12px Cairo;cursor:pointer;flex:none">ابدأ الحصة ▶</button>
      </div></div>

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("الحضور بنقرة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">حدّد الحالة ثم احفظ القائمة مرة واحدة</span></div>
      ${roster.length?`<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:7px;margin-top:10px">
        ${roster.map(p=>{const s=stOf(p.name);
          return `<button onclick="coTap('${CO.esn(p.name)}')" style="background:none;border:0;padding:0;cursor:pointer;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:Cairo">
            <span style="width:42px;height:42px;border-radius:50% 50% 12px 50%;padding:2px;background:${RING[s]};display:block">${CO.av(p.name,38,{url:p.avatar_url,dark:true,r:"50% 50% 11px 50%",ring:"2px solid #fff"})}</span>
            <span style="font-size:8.5px;font-weight:900;color:${INK[s]}">${esc(String(p.name).split(" ")[0])}</span></button>`;}).join("")}</div>
      <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:8px">بنفسجي حاضر · برتقالي اعتذر · رمادي غائب — اضغط لاختيار الحالة، ثم احفظ. أي تصحيح يحتاج سببًا ويحفظ باسمك.</span><button onclick="coSaveAttendance()" style="display:block;width:100%;margin-top:10px;background:#4636e3;color:#fff;border:0;border-radius:12px;padding:11px;font:900 11px Cairo;cursor:pointer">احفظ الحضور</button>`
      :CO.empty("لا لاعبين في كشفك بعد")}`)}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("خطة الحصة")}<span style="font-size:10px;color:#8a8fa5;font-weight:800"><span class="ltr">${mins}</span> دقيقة</span></div>
      <div style="display:flex;gap:4px;margin-top:12px;height:10px;border-radius:999px;overflow:hidden">
        ${plan.map(p=>`<span style="flex:${p.min};background:${p.tagInk}"></span>`).join("")}</div>
      <div style="margin-top:6px">${plan.map(p=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:9px 0;border-top:1px solid #f0ece2">
        <b class="ltr" style="font-size:12px;color:#4636e3;flex:none;width:34px">${p.min}′</b>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${p.t}</b>
          <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${p.s}</span></div>
        <span style="font-size:9.5px;font-weight:900;border-radius:999px;padding:3px 8px;flex:none;background:${p.tagBg};color:${p.tagInk}">${p.tag}</span></div>`).join("")}</div>
      <button onclick="go('drills')" style="display:block;width:100%;margin-top:8px;background:none;border:0;text-align:center;font:900 11px Cairo;color:#4636e3;cursor:pointer">+ تمرين من البنك ←</button>`)}

    ${gr.length>1?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h(`التقسيمات · <span class="ltr">${gr.length}</span> مجموعات`)}<span style="font-size:10px;color:#8a8fa5;font-weight:800">تقسيم يشمل كامل الكشف</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        ${gr.map((g,i)=>`<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:15px;padding:10px">
          <div style="display:flex;justify-content:space-between"><b style="font-size:11px;font-weight:900">مجموعة ${["أ","ب","ج","د"][i]}</b><b class="ltr" style="font-size:10.5px;color:#4636e3">${g.length}</b></div>
          <span style="display:block;font-size:9.5px;color:#5b6078;font-weight:700;margin-top:4px;line-height:1.6">${g.map(p=>esc(String(p.name).split(" ")[0])).join(" · ")}</span></div>`).join("")}
      </div>`):""}

    ${CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("سجل حضور الفريق")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">مشاركات اللاعبين المسجلة لكل أسبوع</span></div>
      ${(()=>{ const wk=[...Array(8)].map((_,i)=>{const seen=new Set();att.forEach(a=>{const age=(Date.now()-Date.parse(CO.rowDate(a)+"T00:00:00Z"))/864e5;if(a.present!==false&&age>=(7-i)*7&&age<(8-i)*7)seen.add(CO.sessionKey(a)+"|"+a.player_name);});return seen.size;});
        const mx=Math.max(...wk,1), X=i=>10+i*(320/7), Y=v=>78-(v/mx)*56;
        if(!att.length) return CO.empty("يظهر المنحنى بعد تسجيل أول حضور");
        return `<svg viewBox="0 0 340 90" style="width:100%;height:90px;display:block;margin-top:8px">
          <polyline points="${wk.map((v,i)=>X(i).toFixed(0)+","+Y(v).toFixed(0)).join(" ")}" fill="none" stroke="#4636e3" stroke-width="2.5" stroke-linejoin="round"></polyline>
          <line x1="10" y1="84" x2="330" y2="84" stroke="#e9e4d8"></line></svg>
        <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:4px">مشاركات اللاعبين خلال ثمانية أسابيع — أعلى أسبوع <span class="ltr">${mx}</span></span>`; })()}`)}
  </main>`;
};


/* ── تخطيط التمرين: الأقمع والحركة على العشب ── */
CO.CONE = "#f5c518";
CO.DIA = {
  press:  {w:"الثلث الأخير · ٣ ضد ٢", c:[[14,18],[14,74],[62,18],[62,74]], p:[[26,30],[26,62],[40,46]], d:[[54,34],[54,58]], b:[[40,46]], a:[[44,46,66,46]]},
  rondo:  {w:"روندو ٥ ضد ٢ — دائرة", c:[[16,16],[84,16],[16,84],[84,84]], p:[[50,12],[86,38],[74,84],[26,84],[14,38]], d:[[44,48],[58,56]], b:[[50,12]], a:[[54,16,84,36]]},
  transition:{w:"تحوّل ٤ ضد ٣ — ٦ ثوان", c:[[50,10],[50,90]], p:[[16,24],[16,50],[16,76],[30,50]], d:[[64,32],[64,50],[64,68]], b:[[30,50]], a:[[34,50,88,50]]},
  finish: {w:"عرضيات وإنهاء بلمسة", c:[[20,12],[20,88],[46,12],[46,88]], g:[[92,50]], p:[[22,16],[22,84],[62,38],[62,62]], b:[[22,16]], a:[[26,20,60,40],[66,50,88,50]]},
  speed:  {w:"تسارع ٢٠م × ٦", c:[[10,50],[26,50],[42,50],[58,50],[74,50],[90,50]], p:[[8,32]], a:[[10,32,90,32]]},
  cod:    {w:"مكوك — تغيير اتجاه (٥-٠-٥)", c:[[12,50],[38,22],[64,78],[90,50]], p:[[10,68]], a:[[12,64,38,28],[40,26,64,72],[66,74,90,54]]},
  recover:{w:"استشفاء — حمل خفيف", c:[[50,14],[86,50],[50,86],[14,50]], p:[[34,34],[66,34],[34,66],[66,66]], a:[[38,38,62,62]]},
  gk:     {w:"حراسة — تصدٍّ وتوزيع", g:[[90,50]], d:[[76,50]], p:[[30,26],[30,50],[30,74]], b:[[34,26],[34,50],[34,74]], a:[[38,50,72,50]]}
};
CO.dia = k => {
  const D = CO.DIA[k]; if(!D) return "";
  const cone = ([x,y]) => `<path d="M${x} ${y-4.6} L${x+3.6} ${y+3.4} L${x-3.6} ${y+3.4} Z" fill="${CO.CONE}"></path>`;
  const pl   = ([x,y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#4636e3" stroke="#faf8f3" stroke-width="1.2"></circle>`;
  const df   = ([x,y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#faf8f3" stroke="#151a2e" stroke-width="1.6"></circle>`;
  const bl   = ([x,y]) => `<circle cx="${x}" cy="${y}" r="2.3" fill="#fff" stroke="#151a2e" stroke-width=".9"></circle>`;
  const gl   = ([x,y]) => `<rect x="${x-2}" y="${y-13}" width="4" height="26" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2"></rect>`;
  const ar   = ([x1,y1,x2,y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f5c518" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#coArr)"></line>`;
  const M = (arr,fn) => (arr||[]).map(fn).join("");
  return `<div style="border-radius:14px;overflow:hidden;background:#1d4a3e;position:relative;margin-top:9px">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:112px;display:block">
      <defs><marker id="coArr" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 1 L7 4 L0 7 Z" fill="#f5c518"></path></marker></defs>
      <rect width="100" height="100" fill="#1d4a3e"></rect>
      <rect x="3" y="4" width="94" height="92" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1"></rect>
      <line x1="50" y1="4" x2="50" y2="96" stroke="rgba(255,255,255,.12)" stroke-width="1"></line>
      <circle cx="50" cy="50" r="13" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"></circle>
      ${M(D.a,ar)}${M(D.g,gl)}${M(D.c,cone)}${M(D.d,df)}${M(D.p,pl)}${M(D.b,bl)}
    </svg>
    <span style="position:absolute;bottom:7px;inset-inline-start:9px;background:rgba(21,26,46,.85);color:#faf8f3;border-radius:999px;padding:3px 9px;font-size:9px;font-weight:900">${CO.esn(D.w)}</span>
  </div>`;
};
CO.diaKey = `<div style="display:flex;gap:11px;flex-wrap:wrap;margin-top:8px;font-size:9px;font-weight:800;color:#8a8fa5">
  <span><span style="display:inline-block;width:0;height:0;border-inline:4px solid transparent;border-bottom:7px solid ${CO.CONE};vertical-align:-1px"></span> قمع</span>
  <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#4636e3;vertical-align:-1px"></span> لاعبك</span>
  <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#fff;border:1.5px solid #151a2e;vertical-align:-1px"></span> خصم</span>
  <span><span style="display:inline-block;width:14px;height:0;border-top:1.6px dashed #f5c518;vertical-align:-4px"></span> الحركة</span>
</div>`;

/* ═══════════ 4f · بنك التمارين ═══════════ */
T.drills = async () => {
  const roster = await CO.roster(), allRoster = CO._roster || [];
  const groups = [...new Set(allRoster.map(p=>CO.groupOf(p)).filter(Boolean))];
  const groupOptions = [["كل الفئات","all",allRoster.length],...groups.map(g=>[g,g,allRoster.filter(p=>CO.groupOf(p)===g).length])];
  const eligible = CH.DRILLS.filter(d=>CH.suitable(d,roster));
  const plan = CH.plan().map(k => CH.DRILLS.find(d => d.k === k)).filter(Boolean);
  const incompatible = plan.filter(d=>!CH.suitable(d,roster));
  const mins = plan.reduce((s,d) => s+d.min, 0);
  const filt = (()=>{ try{ return localStorage.getItem("pi_drill_f")||"all"; }catch(e){ return "all"; } })();
  const shown = filt === "all" ? eligible : eligible.filter(d => d.aim === filt);
  const byAim = {}; plan.forEach(d => byAim[d.aim] = (byAim[d.aim]||0)+d.min);

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('coachHome')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <button onclick="go('boards')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">✎</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">بنك التمارين</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">ابنِ حصتك، وانشرها فتدخل تقاويم لاعبيك باسمك</span>
  </div>
  <main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${CO.disc()}
      <div style="position:relative">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px">
          <div><span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">مخطط حصتك</span>
            <b class="ltr" style="display:block;font-size:32px;font-weight:700;margin-top:4px">${plan.length?mins:CO.dash}</b>
            <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700">${plan.length?`دقيقة · <span class="ltr">${plan.length}</span> تمرين`:"فارغ — اضغط ＋ على أي تمرين"}</span></div>
          ${plan.length?`<button onclick="chPublish()" ${incompatible.length?"disabled":""} style="background:#fff;color:#151a2e;border:0;border-radius:14px;padding:12px 14px;font:900 12px Cairo;cursor:pointer;flex:none;${incompatible.length?"opacity:.5;":""}">انشرها ←</button>`:""}
        </div>
        ${plan.length?`<div style="display:flex;gap:3px;margin-top:14px;height:10px;border-radius:999px;overflow:hidden">
          ${Object.entries(byAim).map(([a,m])=>`<span style="flex:${m};background:${CH.AIM[a].c}" title="${CH.AIM[a].ar}"></span>`).join("")}</div>`:""}
      </div></div>

    ${plan.length?CO.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${CO.h("ترتيب حصتك")}<button onclick="chClear()" style="background:none;border:0;font:900 10.5px Cairo;color:#a83b25;cursor:pointer">أفرغ</button></div>
      ${plan.map((d,i)=>`<div style="display:flex;gap:11px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
        <span style="width:30px;height:30px;border-radius:50% 50% 6px 50%;background:${CH.AIM[d.aim].c};color:#fff;display:grid;place-items:center;font:700 12px 'Space Grotesk';flex:none">${i+1}</span>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(d.ar)}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px"><span class="ltr">${d.min}</span> دقيقة · ${esc(d.grp)}</span></div>
        <button onclick="chRm('${d.k}')" style="background:none;border:0;color:#a83b25;font:900 15px Cairo;cursor:pointer;flex:none;padding:4px 8px">×</button></div>
        ${CO.dia(d.k)}`).join("")}`):""}

    <div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:14px 16px">
      <label style="display:block;font-size:12px;font-weight:900;color:#151a2e">الفئة المستهدفة
        <select onchange="coGrp(this.value)" style="display:block;width:100%;margin-top:8px;border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:800 11.5px Cairo;background:#faf8f3">
          ${groupOptions.map(([label,value,count])=>'<option value="'+CO.esn(value)+'"'+(CO.grp()===value?' selected':'')+'>'+CO.esn(label)+' · '+count+' لاعب</option>').join("")}
        </select>
      </label>
      <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:7px">تظهر التمارين الملائمة لأعمار المجموعة المختارة.</span>
    </div>
    ${plan.length?CO.card(`<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:8px">
      <label style="font-size:10px;font-weight:900;color:#5b6078">موعد الحصة
        <input type="date" value="${CH.date()}" min="${CH.today()}" onchange="chDate(this.value)" style="display:block;width:100%;margin-top:5px;border:1px solid #e9e4d8;border-radius:11px;padding:9px 8px;font:800 11px Cairo;background:#faf8f3;color:#151a2e"></label>
      <label style="font-size:10px;font-weight:900;color:#5b6078">الوقت
        <input type="time" value="${CH.time()}" onchange="chTime(this.value)" style="display:block;width:100%;margin-top:5px;border:1px solid #e9e4d8;border-radius:11px;padding:9px 8px;font:800 11px Cairo;background:#faf8f3;color:#151a2e"></label>
    </div>
    ${incompatible.length?`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:13px;padding:10px;font-size:10px;color:#8a6912;font-weight:800;line-height:1.8;margin-top:9px">أزل تمارين الفئات الأكبر قبل النشر: ${incompatible.map(d=>CO.esn(d.ar)).join("، ")}</div>`:""}
    <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:7px">سيصل المخطط إلى <span class="ltr">${roster.length}</span> لاعبًا في ${CO.grp()!=="all"?CO.esn(CO.grp()):"كل الفئات"}.</span>`):""}
\n    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button onclick="drillFilt('all')" style="background:${filt==="all"?"#151a2e":"#fff"};color:${filt==="all"?"#faf8f3":"#5b6078"};border:1px solid ${filt==="all"?"#151a2e":"#e9e4d8"};border-radius:999px;padding:7px 13px;font:900 10.5px Cairo;cursor:pointer">الكل</button>
      ${Object.entries(CH.AIM).map(([k,a])=>`<button onclick="drillFilt('${k}')" style="background:${filt===k?a.c:"#fff"};color:${filt===k?"#fff":"#5b6078"};border:1px solid ${filt===k?a.c:"#e9e4d8"};border-radius:999px;padding:7px 13px;font:900 10.5px Cairo;cursor:pointer">${a.ar}</button>`).join("")}
    </div>

    <button onclick="openBoard()" style="background:#151a2e;border:0;border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:12px;color:#faf8f3;cursor:pointer;font-family:Cairo;text-align:start;width:100%;position:relative;overflow:hidden">${CO.disc()}
      <span style="position:relative;width:40px;height:40px;border-radius:50% 50% 8px 50%;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:18px;flex:none">✎</span>
      <div style="position:relative;flex:1;min-width:0"><b style="display:block;font-size:13px;font-weight:900">ارسم تمرينك بنفسك</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:2px">لوح كامل بإصبعك — ويُحفظ في بنكك باسمك</span></div>
      <span style="position:relative;color:#f5c518">←</span></button>
    ${CO.card(`${CO.h("مفتاح التخطيط")}${CO.sub("كل تمرين مرسوم على العشب — الأقمع والحركة، لا وصفًا نصيًّا")}${CO.diaKey}`)}
    ${shown.length?shown.map(d=>{ const inP = CH.plan().includes(d.k), A = CH.AIM[d.aim];
      return `<div style="background:#fff;border:1px solid ${inP?"#ddd8fb":"#e9e4d8"};border-radius:20px;padding:14px 16px;display:flex;gap:12px;align-items:center">
        ${CO.ic("▤", inP?"#efedff":"#faf8f3", A.c, "50% 50% 8px 50%")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12.5px">${esc(d.ar)}</b>
          <span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:2px;line-height:1.7">${esc(d.d)}</span>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:7px">
            <span style="background:#faf8f3;border:1px solid #e9e4d8;color:${A.c};border-radius:999px;padding:3px 9px;font-size:9.5px;font-weight:900">${A.ar}</span>
            <span style="background:#faf8f3;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:999px;padding:3px 9px;font-size:9.5px;font-weight:800"><span class="ltr">${d.min}</span> د</span>
            <span style="background:#faf8f3;border:1px solid #e9e4d8;color:#8a8fa5;border-radius:999px;padding:3px 9px;font-size:9.5px;font-weight:800">${esc(d.grp)}</span></div>
          ${CO.dia(d.k)}</div>
        <button onclick="chAdd('${d.k}')" ${inP?"disabled":""} style="width:36px;height:36px;flex:none;border-radius:50% 50% 8px 50%;background:${inP?"#efedff":"#4636e3"};color:${inP?"#4636e3":"#fff"};border:0;font:900 17px Cairo;cursor:${inP?"default":"pointer"}">${inP?"✓":"＋"}</button></div>`;}).join(""):CO.empty("لا توجد تمارين مناسبة لهذه الفئة والغرض")}

    ${CO.note("التمارين مرجع فنّي لك — ونشرها يكتب في تقويم كل لاعب سطرًا باسمك وصفتك. لا يمسّ تقييم أحد.")}
  </main>`;
};

Object.assign(CO.TITLE, {
  coachHome: ["مساحة المدرب","فريقك اليوم — من يحضر ومن يحتاجك"],
  squad:     ["فريقي","الحالة والشدة لكل لاعب"],
  session:   ["حصة اليوم","الحضور بنقرة · تقسيم الفريق · سجل الحضور"],
  drills:    ["بنك التمارين","ابنِ حصتك وانشرها باسمك"]
});
