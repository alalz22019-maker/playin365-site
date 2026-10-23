/* PlayIn365 — الحكم: سجلي (6e) والانضباط (6f) — الشاشتان الناقصتان
   القاعدة: الحكم يوقّع ولا يُعتمد عليه؛ والبطاقة تُعطى بسببها المكتوب. */
RF.DISC = [["yellow","إنذار","▮","#151a2e","#f5c518"],["red","طرد","▮","#fdeee8","#a83b25"]];
RF.WHY = {yellow:["اعتراض","تأخير اللعب","لعب خشن","سلوك غير رياضي","دخول/خروج بلا إذن"],
          red:["خشونة بالغة","سلوك عنيف","بصق","منع فرصة هدف محققة","إنذاران"]};
RF.dkey = () => "pi_disc_"+(ME&&ME.id);
RF.d = () => { try{ return JSON.parse(localStorage.getItem(RF.dkey())||"{}"); }catch(e){ return {}; } };
RF.setD = o => { try{ localStorage.setItem(RF.dkey(), JSON.stringify(Object.assign(RF.d(),o))); }catch(e){} };
window.rdSet = (k,v) => { RF.setD({[k]:v}); render(); };
window.rdSign = async () => {
  const d = RF.d();
  if(!d.mid) return toast("اختر المباراة",1);
  if(!d.who) return toast("اختر اللاعب",1);
  if(!d.kind) return toast("إنذار أم طرد؟",1);
  if(!d.why) return toast("السبب مطلوب — لا بطاقة بلا سبب مكتوب",1);
  const m = (RF._ms||[]).find(x=>String(x.id)===String(d.mid));
  const {error} = await sb.from("match_events").insert({match_id:d.mid, match_title:m?m.title:"", who:d.who,
    type:d.kind, minute:RF.min(m), note:d.why, recorded_by:ME.name+" — حكم"});
  if(error) return toast("تعذّر: "+error.message,1);
  await trans(`وقّع ${d.kind==="red"?"طردًا":"إنذارًا"} لـ${d.who} — ${d.why}`);
  RF.setD({who:null, kind:null, why:null});
  toast("وُقّعت بسببها — دخلت سجل اللاعب باسمك");
};
T.refDisc = async () => {
  if(!ME || ME.role!=="referee") return RF._disc ? RF._disc() : "";
  const [ms,evs,joins] = await Promise.all([
    q("m", sb.from("matches").select("*").eq("referee_name",ME.name).order("created_at",{ascending:false}).limit(20)),
    q("e", sb.from("match_events").select("*,matches(title)").eq("recorded_by",ME.name+" — حكم").in("type",["yellow","red"]).order("created_at",{ascending:false}).limit(30)),
    q("j", sb.from("match_joins").select("match_id,player_name").limit(400))
  ]);
  RF._ms = ms;
  const d = RF.d();
  const live = ms.filter(m=>m.status==="live"||m.status==="today"||m.status==="open");
  const mid = d.mid || (live[0]&&live[0].id);
  if(mid && d.mid!==mid) RF.setD({mid});
  const players = joins.filter(j=>String(j.match_id)===String(mid)).map(j=>j.player_name);
  const y = evs.filter(e=>e.type==="yellow").length, r = evs.filter(e=>e.type==="red").length;

  return RF.top("الانضباط","بطاقة بسببها — لا بطاقة بلا سبب مكتوب") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${RF.disc()}
      <div style="position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="text-align:center"><b class="ltr" style="display:block;font-size:30px;font-weight:700;color:${y?"#f5c518":"#8a93b0"}">${y||RF.dash}</b><span style="display:block;font-size:9.5px;color:#c6cade;font-weight:800">إنذارًا وقّعته</span></div>
        <div style="text-align:center"><b class="ltr" style="display:block;font-size:30px;font-weight:700;color:${r?"#e8531f":"#8a93b0"}">${r||RF.dash}</b><span style="display:block;font-size:9.5px;color:#c6cade;font-weight:800">طردًا وقّعته</span></div>
      </div></div>

    ${live.length?RF.card(`${RF.h("المباراة")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${live.map(m=>`<button onclick="rdSet('mid','${m.id}')" style="flex:1;min-width:130px;background:${String(mid)===String(m.id)?"#efedff":"#faf8f3"};color:${String(mid)===String(m.id)?"#4636e3":"#5b6078"};border:1.5px solid ${String(mid)===String(m.id)?"#4636e3":"#e9e4d8"};border-radius:12px;padding:10px 8px;font:900 10.5px Cairo;cursor:pointer;text-align:start;line-height:1.5">${esc(m.title)}<br><span style="font-size:9px;color:#8a8fa5">${esc(m.venue||"")}</span></button>`).join("")}
      </div>`)
    :RF.empty("لا مباريات مفتوحة لك الآن — البطاقة تُوقَّع أثناء المباراة")}

    ${mid?RF.card(`${RF.h("اللاعب")}
      ${players.length?`<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto">
        ${players.map(p=>`<button onclick="rdSet('who','${RF.esn(p)}')" style="flex:none;width:72px;background:${d.who===p?"#efedff":"#faf8f3"};border:1.5px solid ${d.who===p?"#4636e3":"#e9e4d8"};border-radius:16px;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-family:Cairo">
          ${PL3.av(p,40,{dark:true,r:"50% 50% 50% 10px"})}<span style="font-size:9px;font-weight:900;color:${d.who===p?"#4636e3":"#151a2e"}">${esc(String(p).split(" ")[0])}</span></button>`).join("")}</div>`
      :RF.empty("لا مشاركين مسجَّلين في هذه المباراة")}`):""}

    ${d.who?RF.card(`${RF.h("البطاقة")}
      <div style="display:flex;gap:8px;margin-top:10px">
        ${RF.DISC.map(([k,lb,g,bg,ink])=>`<button onclick="rdSet('kind','${k}')" style="flex:1;background:${d.kind===k?ink:"#faf8f3"};color:${d.kind===k?(k==="yellow"?"#151a2e":"#fff"):"#5b6078"};border:1.5px solid ${d.kind===k?ink:"#e9e4d8"};border-radius:13px;padding:13px;font:900 12px Cairo;cursor:pointer"><span style="display:block;font-size:17px">${g}</span>${lb}</button>`).join("")}
      </div>
      ${d.kind?`<div style="margin-top:12px">${RF.h("السبب")}${RF.sub("يظهر للاعب ولوليّ أمره كما كتبتَه — ولا يُحذف")}
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px">
          ${(RF.WHY[d.kind]||[]).map(w=>`<button onclick="rdSet('why','${RF.esn(w)}')" style="background:${d.why===w?"#151a2e":"#faf8f3"};color:${d.why===w?"#faf8f3":"#5b6078"};border:1px solid ${d.why===w?"#151a2e":"#e9e4d8"};border-radius:999px;padding:7px 12px;font:900 10px Cairo;cursor:pointer">${w}</button>`).join("")}
        </div></div>`:""}`):""}

    ${d.who&&d.kind&&d.why?`<button onclick="rdSign()" style="background:${d.kind==="red"?"#a83b25":"#4636e3"};color:#fff;border:0;border-radius:14px;padding:15px;font:900 13.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">وقّع ${d.kind==="red"?"الطرد":"الإنذار"} — ${esc(d.who)}</button>`:""}

    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("ما وقّعته")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">لا يُحذف — يُصحَّح باسمك</span></div>
      ${evs.length?evs.slice(0,6).map(e=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">
        ${RF.ic("▮", e.type==="red"?"#fdeee8":"#151a2e", e.type==="red"?"#a83b25":"#f5c518")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(e.who)} — ${e.type==="red"?"طرد":"إنذار"}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(e.note||"بلا سبب مكتوب")} · ${esc(e.matches?e.matches.title:"")}</span></div>
        <b class="ltr" style="font-size:12px;color:#4636e3;flex:none">${e.minute}′</b></div>`).join("")
      :`<div style="border-top:1px solid #f0ece2;padding-top:12px">${RF.empty("لم توقّع بطاقة بعد")}</div>`}`)}
    ${RF.note("البطاقة قرار فنّي باسمك لحظتها — لا يعتمدها منظّم ولا يعترض عليها نادٍ. والخطأ يُصحَّح باسمك وسببك في سجل الشفافية.")}
  </main>`;
};

T.refRecord = async () => {
  if(!ME || ME.role!=="referee") return RF._record ? RF._record() : "";
  const [ms,evs,tr,certs] = await Promise.all([
    q("m", sb.from("matches").select("*").eq("referee_name",ME.name).order("created_at",{ascending:false}).limit(60)),
    q("e", sb.from("match_events").select("*,matches(title)").eq("recorded_by",ME.name+" — حكم").order("created_at",{ascending:false}).limit(200)),
    q("t", sb.from("transparency").select("*").ilike("actor","%"+ME.name+"%").order("created_at",{ascending:false}).limit(60)),
    q("c", sb.from("pi_certs").select("*").eq("person",ME.name).order("year",{ascending:false}))
  ]);
  const done = ms.filter(m=>m.status==="final");
  const goals = evs.filter(e=>e.type==="goal").length;
  const cards = evs.filter(e=>e.type==="yellow"||e.type==="red").length;
  const corr = tr.filter(t=>/تصحيح/.test(t.action||"")).length;
  const perM = done.length?(cards/done.length).toFixed(1):null;
  const orgs = [...new Set(ms.map(m=>m.organizer_name).filter(Boolean))];
  const MN=["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"], now=new Date();
  const months=[...Array(6)].map((_,i)=>{const dd=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    return {k:dd.getFullYear()+"-"+String(dd.getMonth()+1).padStart(2,"0"), lb:MN[dd.getMonth()]};});
  const mv=months.map(m=>done.filter(x=>String(x.match_date||x.created_at||"").startsWith(m.k)).length);
  const mx=Math.max(...mv,1);
  const stats=[["مباراة أدرتها",done.length],["حدثًا وقّعته",evs.length],["بطاقة/مباراة",perM],["تصحيحًا باسمك",corr]];

  return RF.top("سجلي واعتمادي","ما وقّعته أنت — لا ما وقّعه غيرك") + `<main style="flex:1;padding:16px 18px 118px;display:flex;flex-direction:column;gap:12px">
    <div style="position:relative;overflow:hidden;background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">${RF.disc()}
      <div style="position:relative;display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        ${stats.map(([k,v])=>`<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px;text-align:center">
          <b class="ltr" style="display:block;font-size:22px;font-weight:700;color:${v?"#f5c518":"#8a93b0"}">${v||RF.dash}</b>
          <span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}
      </div></div>

    ${done.length?RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("مبارياتك في ستة أشهر")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">كلها بتوقيعك</span></div>
      <div style="display:flex;align-items:flex-end;gap:5px;height:80px;margin-top:12px">
        ${mv.map((v,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
          <b class="ltr" style="font-size:9px;font-weight:700;color:${v?"#4636e3":"#c9c2b2"}">${v||""}</b>
          <span style="width:100%;height:${Math.max(4,Math.round(v/mx*52))}px;border-radius:6px 6px 3px 6px;background:${v?"#4636e3":"#f0ece2"}"></span>
          <span style="font-size:8px;font-weight:800;color:#8a8fa5">${months[i].lb}</span></div>`).join("")}</div>`):""}

    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("تركيبة ما وقّعته")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">من أحداث موثّقة</span></div>
      ${evs.length?`<div style="display:flex;gap:4px;margin-top:12px;height:12px;border-radius:999px;overflow:hidden">
        ${[["#4636e3",goals],["#f5c518",evs.filter(e=>e.type==="yellow").length],["#a83b25",evs.filter(e=>e.type==="red").length],["#b9b0f5",evs.filter(e=>e.type==="assist"||e.type==="sub").length]].filter(x=>x[1]).map(([c,n])=>`<span style="flex:${n};background:${c}"></span>`).join("")}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:9px;font-size:9.5px;font-weight:800;color:#5b6078">
        <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:#4636e3;vertical-align:-1px"></span> أهداف <b class="ltr">${goals}</b></span>
        <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:#f5c518;vertical-align:-1px"></span> إنذارات <b class="ltr">${evs.filter(e=>e.type==="yellow").length}</b></span>
        <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:#a83b25;vertical-align:-1px"></span> طرود <b class="ltr">${evs.filter(e=>e.type==="red").length}</b></span></div>`
      :`<div style="margin-top:10px">${RF.empty("سجلك يبدأ من أول مباراة تديرها")}</div>`}`)}

    ${orgs.length?RF.card(`${RF.h("من يعيّنك")}${RF.sub("التعيين قرار المنظّم — والاعتذار حقّك")}
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        ${orgs.map(o=>`<span style="display:inline-flex;align-items:center;gap:7px;background:#faf8f3;border:1px solid #e9e4d8;border-radius:999px;padding:5px 12px 5px 5px;font:900 10.5px Cairo">${PL3.av(o,26,{dark:true,r:"50% 50% 50% 7px"})}${esc(o)}<b class="ltr" style="color:#4636e3">${ms.filter(m=>m.organizer_name===o).length}</b></span>`).join("")}
      </div>`):""}

    ${RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("اعتمادك")}<button onclick="cvAdd('cert')" style="background:#4636e3;color:#fff;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">＋ شهادة</button></div>
      ${certs.length?certs.map(c=>`<div style="display:flex;gap:11px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        ${RF.ic(c.level?`<b class="ltr" style="font-size:13px">${esc(c.level)}</b>`:"▣", c.verified_by?"#fff8df":"#efedff", c.verified_by?"#c78c00":"#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(c.title)}</b>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(c.issuer)}${c.year?` · <span class="ltr">${c.year}</span>`:""}</span></div>
        <span style="flex:none;font-size:8.5px;font-weight:900;border-radius:999px;padding:3px 8px;background:${c.verified_by?"#eaf5ee":"#f2f0ea"};color:${c.verified_by?"#2c6e49":"#8a8fa5"}">${c.verified_by?"✓ موثّقة":"بانتظار التوثيق"}</span></div>`).join("")
      :`<div style="margin-top:10px">${RF.empty("لا اعتماد مسجَّل — أضف رخصتك؛ تظهر بانتظار توثيق الجهة المُصدِرة")}</div>`}`)}

    ${tr.length?RF.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${RF.h("آخر قراراتك")}<span style="font-size:10px;color:#8a8fa5;font-weight:800">قراءة فقط — حتى لك</span></div>
      ${tr.slice(0,5).map(t=>`<div style="display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid #f0ece2">${RF.ic("▤","#efedff","#4636e3")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px;line-height:1.6">${esc(t.action)}</b>
          <span class="ltr" style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(new Date(t.created_at).toLocaleString("en-GB"))}</span></div></div>`).join("")}`):""}
    ${RF.note("سجلك يعرض ما وقّعته أنت. لا يملك منظّم ولا نادٍ زرًّا لتعديله — والتصحيح باسمك وسببك في سجل الشفافية.")}
  </main>`;
};

(function(){
  RF._disc = T.refDisc; RF._record = T.refRecord;
  Object.assign(TITLES,{refDisc:"الانضباط", refRecord:"سجلي واعتمادي"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE,{refDisc:["الانضباط","بطاقة بسببها"], refRecord:["سجلي واعتمادي","ما وقّعته أنت"]});
  if(typeof RF!=="undefined" && RF.OWN){ ["refDisc","refRecord"].forEach(v=>{ if(RF.OWN.indexOf(v)<0) RF.OWN.push(v); }); }
})();
