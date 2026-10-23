/* PlayIn365 — المنظّم: إنشاء مباراة (5b) — أعيد بناؤها في عمود المنظّم
   لمسات قليلة: الاسم · النوع · الملعب · الموعد · المقاعد والرسم · حكم — ثم تُفتح للتسجيل. */
ORG.NK = [["ودية","⚽","#4636e3"],["دوري","♛","#c78c00"],["بطولة","★","#c78c00"],["تجارب أداء","◉","#2c6e49"]];
ORG.mk = () => { try{ return JSON.parse(localStorage.getItem("pi_newm_"+(ME&&ME.id))||"{}"); }catch(e){ return {}; } };
ORG.setMk = o => { try{ localStorage.setItem("pi_newm_"+(ME&&ME.id), JSON.stringify(Object.assign(ORG.mk(),o))); }catch(e){} };
window.nmSet = (k,v) => { ORG.setMk({[k]:v}); if(["kind","slots","fee","ref","when"].indexOf(k)>=0) render(); };
window.nmCreate = async () => {
  const m = ORG.mk();
  const a = String(m.teamA||"").trim(), b = String(m.teamB||"").trim();
  if(!a || !b) return toast("اكتب اسمي الفريقين",1);
  if(!m.venue) return toast("اكتب الملعب",1);
  if(!m.date) return toast("اختر التاريخ",1);
  const title = `${a} × ${b}${m.kind&&m.kind!=="ودية"?" — "+m.kind:""}`;
  const row = {title, team_a:a, team_b:b, comp:m.kind||"ودية", venue:m.venue, match_date:m.date,
    match_time:m.time||"18:00", slots:+m.slots||14, fee:+m.fee||0, status:"open",
    organizer_name:ME.name, referee_name:m.ref||null, duration_min:+m.dur||90, halves:2};
  const {data,error} = await sb.from("matches").insert(row).select("id").single();
  if(error) return toast("تعذّر الإنشاء: "+error.message,1);
  if(m.ref) await sb.from("pi_refs").insert({match_id:data.id, match_title:title, referee:m.ref, assigned_by:ME.name+" — منظم"});
  await trans(`أنشأ مباراة ${title} في ${m.venue}${m.ref?` وعيّن الحكم ${m.ref}`:""}`);
  try{ localStorage.removeItem("pi_newm_"+ME.id); }catch(e){}
  toast("أُنشئت — فُتحت للتسجيل وظهر مقعدها لكل لاعب قريب");
  go("orgPeople", data.id);
};
ORG._newMatch = T.newMatch;
T.newMatch = async () => {
  if(!ME || ME.role!=="organizer") return ORG._newMatch ? ORG._newMatch() : "";
  const m = ORG.mk();
  const D = await ORG.load();
  const venues = D.venues.slice(0,6);
  const fee = +m.fee||0, slots = +m.slots||14;
  const ready = m.teamA && m.teamB && m.venue && m.date;
  const F = (k,ph,type,val) => `<input value="${ORG.esn(val==null?(m[k]||""):val)}" oninput="nmSet('${k}',this.value)" ${type?`type="${type}"`:""} ${type==="number"||type==="date"||type==="time"?'class="ltr"':""} placeholder="${ph}" style="width:100%;border:1px solid #e9e4d8;border-radius:12px;padding:11px;font:700 12px ${type==="number"?"'Space Grotesk'":"Cairo"};background:#faf8f3;color:#151a2e">`;
  const L = t => `<span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:5px">${t}</span>`;

  return ORG.top("أنشئ مباراة","لمسات قليلة — ثم تُفتح للتسجيل") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${ORG.disc()}
      <div style="position:relative">
        <span style="display:block;font-size:10px;color:#b9b0f5;font-weight:900">${m.kind||"ودية"}</span>
        <b style="display:block;font-size:19px;font-weight:900;margin-top:4px;line-height:1.35">${m.teamA&&m.teamB?esc(m.teamA)+" × "+esc(m.teamB):"اكتب اسمي الفريقين"}</b>
        <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:5px;line-height:1.8">${m.venue?"◎ "+esc(m.venue):"بلا ملعب بعد"}${m.date?` · ${esc(m.date)} <span class="ltr">${esc(m.time||"18:00")}</span>`:""}<br><span class="ltr">${slots}</span> مقعدًا${fee?` · <span class="ltr">${fee}</span> ر.س`:" · مجانية"}${m.ref?` · الحكم ${esc(m.ref)}`:" · بلا حكم"}</span>
      </div></div>

    ${ORG.card(`${ORG.h("النوع")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${ORG.NK.map(([k,g,c])=>`<button onclick="nmSet('kind','${k}')" style="flex:1;min-width:76px;background:${(m.kind||"ودية")===k?c:"#faf8f3"};color:${(m.kind||"ودية")===k?"#fff":"#5b6078"};border:1px solid ${(m.kind||"ودية")===k?c:"#e9e4d8"};border-radius:12px;padding:11px 6px;font:900 11px Cairo;cursor:pointer;text-align:center"><span style="display:block;font-size:15px">${g}</span>${k}</button>`).join("")}
      </div>`)}

    ${ORG.card(`${ORG.h("الفريقان")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <div>${L("الفريق الأول")}${F("teamA","النخبة")}</div>
        <div>${L("الفريق الثاني")}${F("teamB","الصقور")}</div></div>`)}

    ${ORG.card(`${ORG.h("الملعب والموعد")}
      <div style="margin-top:10px">${L("الملعب")}${F("venue","ملعب المروج")}</div>
      ${venues.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px">${venues.map(v=>`<button onclick="nmSet('venue','${ORG.esn(v)}')" style="background:${m.venue===v?"#efedff":"#faf8f3"};color:${m.venue===v?"#4636e3":"#5b6078"};border:1px solid ${m.venue===v?"#4636e3":"#e9e4d8"};border-radius:999px;padding:6px 11px;font:900 10px Cairo;cursor:pointer">${esc(v)}</button>`).join("")}</div>`:""}
      <div style="display:grid;grid-template-columns:1fr 110px;gap:8px;margin-top:11px">
        <div>${L("التاريخ")}${F("date","","date")}</div>
        <div>${L("الوقت")}${F("time","","time",m.time||"18:00")}</div></div>`)}

    ${ORG.card(`${ORG.h("المقاعد والرسم")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <div>${L("عدد المقاعد")}${F("slots","14","number",slots)}</div>
        <div>${L("الرسم للاعب (ر.س)")}${F("fee","0","number",fee||"")}</div></div>
      ${fee?ORG.sub(`المحصَّل المتوقّع <span class="ltr">${(fee*slots).toLocaleString("en")}</span> ر.س — ونسبة المنصة <span class="ltr">5%</span> تُخصم في التسوية`):ORG.sub("مجانية — لا تسوية مالية")}`)}

    ${ORG.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${ORG.h("الحكم")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">${m.ref?"معيَّن":"اختياري الآن"}</span></div>
      ${ORG.sub("تعيينه يجعل النتيجة موثّقة بتوقيعه لا بتوقيعك وحدك — وله أن يعتذر")}
      ${D.refsList.length?`<div style="display:flex;gap:6px;margin-top:10px;overflow-x:auto">
        ${D.refsList.map(r=>`<button onclick="nmSet('ref','${ORG.esn(r.name)}')" style="flex:none;display:flex;align-items:center;gap:7px;background:${m.ref===r.name?"#efedff":"#faf8f3"};border:1.5px solid ${m.ref===r.name?"#4636e3":"#e9e4d8"};border-radius:999px;padding:5px 12px 5px 5px;font:900 10px Cairo;cursor:pointer;color:${m.ref===r.name?"#4636e3":"#5b6078"}">${ORG.av(r.name,26,{url:r.avatar_url})}${esc(r.name)}</button>`).join("")}
        ${m.ref?`<button onclick="nmSet('ref','')" style="flex:none;background:#fff;border:1px solid #e9e4d8;color:#a83b25;border-radius:999px;padding:7px 12px;font:900 10px Cairo;cursor:pointer">ألغِ</button>`:""}</div>`
      :ORG.empty("لا حكّام مسجَّلون بعد — يمكنك التعيين لاحقًا من «وش حولك»")}`)}

    <button onclick="nmCreate()" style="background:${ready?"#4636e3":"#e9e4d8"};color:${ready?"#fff":"#8a8fa5"};border:0;border-radius:14px;padding:15px;font:900 13.5px Cairo;cursor:pointer;${ready?"box-shadow:0 8px 18px rgba(70,54,227,.3)":""}">＋ أنشئ وافتح التسجيل</button>
    ${ORG.note("لحظة الإنشاء يظهر مقعدها لكل لاعب قريب في «وش حولك»، وتُقيَّد باسمك في سجل الشفافية. والإلغاء بسبب مكتوب يردّ الرسوم.")}
  </main>`;
};
(function(){
  Object.assign(TITLES,{newMatch:"أنشئ مباراة"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE,{newMatch:["أنشئ مباراة","لمسات قليلة ثم تُفتح للتسجيل"]});
  if(typeof ORG!=="undefined" && ORG.OWN.indexOf("newMatch")<0) ORG.OWN.push("newMatch");
})();
