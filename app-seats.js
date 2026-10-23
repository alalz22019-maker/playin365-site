/* PlayIn365 — الأكاديمية ٤: استيراد الكشف بمقاعد وأرموز · ربط اللاعب بنفسه · إذن وليّ الأمر مرة واحدة
   قرار المالك (١٠ سبتمبر): الأكاديمية لا تربط حسابًا بلاعب — اللاعب يرتبط برمزه.
   وإذن وليّ الأمر يُعطى مرة واحدة للمتابعة والتعاملات العادية؛ ولا يُستأذن إلا في الجسيم. */
const SEAT = {};
SEAT.code = () => { const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<6;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; };
SEAT.grp  = a => (typeof ACD!=="undefined"?ACD.grpOf(a):null) || "";
/* المهمّ الجسيم وحده يستأذن — قرار المالك */
SEAT.GRAVE = ["تعاقد","انتقال لنادٍ","اطّلاع طبي","نشر تجاري"];

SEAT.parse = txt => String(txt||"").split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(l=>{
  const p = l.split(/[،,\t|]+/).map(s=>s.trim());
  const num = p.filter(s=>/^\d+$/.test(s)).map(Number);
  const age = num.find(n=>n>=6&&n<=45) ?? null;
  const shirt = num.find(n=>n!==age && n>=1 && n<=99) ?? null;
  const phone = (p.find(s=>/^0\d{9}$/.test(s.replace(/\D/g,"")))||"").replace(/\D/g,"");
  const grp = (p.find(s=>/^U\d{2}$/i.test(s))||"").toUpperCase();
  const pos = p.find(s=>/حارس|مدافع|ظهير|وسط|جناح|مهاجم/.test(s)) || "";
  return {name:p[0]||"", group_name:grp||SEAT.grp(age), pos, age, shirt, phone};
}).filter(r=>r.name && !/^\d+$/.test(r.name));

T.importPlayers = async () => {
  const org = (ME&&ME.org)||"";
  const [seats,pf] = await Promise.all([
    q("s", sb.from("pi_seats").select("*").eq("org",org).order("created_at",{ascending:false}).limit(300)),
    q("p", sb.from("profiles").select("id,name,role").eq("org",org).eq("role","player").limit(300))
  ]);
  const open = seats.filter(s=>!s.linked_id), done = seats.filter(s=>s.linked_id);
  const byG = {}; open.forEach(s=>{ const g=s.group_name||"بلا فئة"; (byG[g]=byG[g]||[]).push(s); });
  const C = typeof ACD!=="undefined" ? ACD : {card:i=>`<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;padding:16px">${i}</div>`, h:t=>`<b style="font-size:13px;font-weight:900">${t}</b>`, sub:t=>`<span style="display:block;font-size:10.5px;color:#8a8fa5;font-weight:700;margin-top:3px;line-height:1.8">${t}</span>`, empty:t=>`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center;font-size:10.5px;color:#8a8fa5;font-weight:700">${t}</div>`, note:t=>`<div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">${t}</div>`, esn:s=>esc(String(s==null?"":s)), dash:"—"};

  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('erp')" style="width:40px;height:40px;border-radius:12px;background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">→</button>
    <span style="font-size:10.5px;font-weight:900;color:#8a8fa5">${C.esn(org)}</span></div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">استيراد الكشف</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">الصق كشفك — ويرتبط كل لاعب بحسابه برمزه</span></div>
  <main style="flex:1;padding:16px 18px 96px;display:flex;flex-direction:column;gap:12px">
    <div style="background:#151a2e;border-radius:22px;padding:18px;color:#faf8f3">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        ${[["مقعدًا",seats.length,"#faf8f3"],["مرتبطًا",done.length,"#7fd7a4"],["بانتظار الرمز",open.length,"#f5c518"]].map(([k,v,c])=>`<div><b class="ltr" style="display:block;font-size:24px;font-weight:700;color:${v?c:"#8a93b0"}">${v||C.dash}</b><span style="display:block;font-size:9px;color:#c6cade;font-weight:800;margin-top:2px">${k}</span></div>`).join("")}
      </div></div>

    ${C.card(`${C.h("الصق الكشف")}${C.sub("سطر لكل لاعب: <b>الاسم، الفئة، المركز، العمر، الرقم، الجوال</b> — الترتيب لا يهم، والناقص يُترك «—»")}
      <textarea id="imp_txt" placeholder="ريان الشمري، U17، مهاجم، 17، 9، 0551234567&#10;خالد المالكي، U17، وسط، 17، 8" style="width:100%;margin-top:9px;border:1px solid #e9e4d8;border-radius:12px;padding:12px;font:700 12px Cairo;line-height:2;min-height:120px;background:#faf8f3;color:#151a2e;resize:vertical"></textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <button onclick="impPreview()" style="background:#fff;border:1px solid #e9e4d8;border-radius:13px;padding:12px;font:900 12px Cairo;cursor:pointer">اقرأ الكشف</button>
        <button onclick="impSave()" style="background:#4636e3;color:#fff;border:0;border-radius:13px;padding:12px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">أنشئ المقاعد</button></div>
      <div id="imp_prev"></div>`)}

    ${open.length?C.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${C.h("مقاعد بانتظار أصحابها")}<button onclick="impCopyAll()" style="background:#efedff;color:#4636e3;border:0;border-radius:10px;padding:7px 12px;font:900 10.5px Cairo;cursor:pointer">انسخ الأرموز</button></div>
      ${C.sub("أرسل لكل لاعب رمزه — يُدخله في حسابه فيرتبط. لا نربط نحن عنه.")}
      ${Object.entries(byG).sort().map(([g,arr])=>`<div style="margin-top:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px"><span style="width:4px;height:14px;border-radius:99px;background:#4636e3"></span><b style="font-size:11.5px"><span class="ltr">${C.esn(g)}</span></b><span style="font-size:9.5px;color:#8a8fa5;font-weight:800"><span class="ltr">${arr.length}</span></span></div>
        ${arr.map(s=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ece2">
          <span style="width:34px;height:34px;border-radius:50% 50% 50% 8px;background:#efedff;color:#4636e3;display:grid;place-items:center;font-size:13px;font-weight:900;flex:none">${C.esn(String(s.name).trim()[0])}</span>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:11.5px">${esc(s.name)}</b>
            <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:2px">${esc(s.pos||"—")}${s.age?` · <span class="ltr">${s.age}</span> سنة`:""}${s.shirt?` · <span class="ltr">#${s.shirt}</span>`:""}</span></div>
          <button onclick="impCopy('${s.join_code}')" class="ltr" style="flex:none;background:#151a2e;color:#f5c518;border:0;border-radius:10px;padding:8px 11px;font:700 12px 'Space Grotesk';cursor:pointer;letter-spacing:.08em">${s.join_code}</button>
          <button onclick="impDel('${s.id}')" style="flex:none;background:none;border:0;color:#a83b25;font:900 15px Cairo;cursor:pointer;padding:2px 5px">×</button></div>`).join("")}
      </div>`).join("")}`):""}

    ${done.length?C.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${C.h("ارتبطوا بحساباتهم")}<b class="ltr" style="font-size:11px;color:#2c6e49">${done.length}</b></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${done.map(s=>`<span style="background:#eaf5ee;color:#2c6e49;border-radius:999px;padding:5px 11px;font-size:10px;font-weight:900">✓ ${esc(s.name)}</span>`).join("")}</div>`):""}

    ${C.note("المقعد ليس حسابًا: لا سجل عامًّا له ولا بطاقة. حضورٌ يوقّعه المدرب على مقعد غير مرتبط يبقى «بانتظار المطابقة» ولا يدخل سجل أحد — فإذا ارتبط صاحبه انتقل كاملًا باسم من وقّعه ووقته.")}
  </main>`;
};
window.impPreview = () => {
  const rows = SEAT.parse((document.getElementById("imp_txt")||{}).value);
  const el = document.getElementById("imp_prev"); if(!el) return;
  if(!rows.length){ el.innerHTML = `<div style="margin-top:10px;background:#fdeee8;border:1px solid #f3cdbe;border-radius:12px;padding:11px;font-size:10.5px;color:#a83b25;font-weight:800">لم أقرأ سطرًا صالحًا — تأكّد أن كل سطر يبدأ بالاسم</div>`; return; }
  el.innerHTML = `<div style="margin-top:11px;border-top:1px solid #f0ece2;padding-top:10px">
    <b style="font-size:11.5px">قرأتُ <span class="ltr">${rows.length}</span> لاعبًا</b>
    <div style="margin-top:8px;max-height:220px;overflow:auto">${rows.map(r=>`<div style="display:flex;gap:8px;align-items:baseline;padding:6px 0;border-bottom:1px solid #f6f3ec;font-size:10.5px;font-weight:700">
      <b style="flex:1;min-width:0">${esc(r.name)}</b>
      <span style="color:#8a8fa5">${r.group_name?`<span class="ltr">${esc(r.group_name)}</span>`:"—"} · ${esc(r.pos||"—")} · <span class="ltr">${r.age||"—"}</span>${r.shirt?` · <span class="ltr">#${r.shirt}</span>`:""}</span></div>`).join("")}</div></div>`;
};
window.impSave = async () => {
  const rows = SEAT.parse((document.getElementById("imp_txt")||{}).value);
  if(!rows.length) return toast("لا سطور صالحة", 1);
  const org = ME.org||"";
  const payload = rows.map(r=>Object.assign({}, r, {org, join_code:SEAT.code(), created_by:ME.name}));
  const {error} = await sb.from("pi_seats").insert(payload);
  if(error) return toast(/pi_seats/.test(error.message)?"الاستيراد لم يُفعَّل في القاعدة بعد":"تعذّر: "+error.message, 1);
  await trans(`استورد كشفًا — ${rows.length} مقعدًا في ${org}`);
  const t=document.getElementById("imp_txt"); if(t) t.value="";
  toast(`أُنشئ ${rows.length} مقعدًا — أرسل لكل لاعب رمزه`); render();
};
window.impCopy = c => { try{ navigator.clipboard.writeText(c); }catch(e){} toast("نُسخ الرمز "+c); };
window.impCopyAll = async () => {
  const s = await q("s", sb.from("pi_seats").select("name,join_code").eq("org",ME.org||"").is("linked_id",null).limit(300));
  const txt = s.map(x=>x.name+" — "+x.join_code).join("\n");
  try{ await navigator.clipboard.writeText(txt); toast("نُسخت "+s.length+" رموز"); }catch(e){ toast("تعذّر النسخ",1); }
};
window.impDel = async id => { if(!confirm("حذف المقعد؟")) return; await sb.from("pi_seats").delete().eq("id",id); toast("حُذف"); render(); };

/* ── اللاعب: ارتبط بمقعدك برمزك ── */
window.joinByCode = async () => {
  const c = String(prompt("رمز الانضمام من أكاديميتك:")||"").trim().toUpperCase();
  if(!c) return;
  const {data:seat} = await sb.from("pi_seats").select("*").eq("join_code",c).limit(1).single();
  if(!seat) return toast("رمز غير معروف", 1);
  if(seat.linked_id) return toast("هذا المقعد مرتبط بحساب آخر", 1);
  if(!confirm(`مقعد «${seat.name}» في ${seat.org}${seat.group_name?" · "+seat.group_name:""}\nتربطه بحسابك؟`)) return;
  const up = {linked_id:ME.id, linked_at:new Date().toISOString()};
  const {error} = await sb.from("pi_seats").update(up).eq("id",seat.id);
  if(error) return toast("تعذّر: "+error.message, 1);
  const patch = {org:seat.org};
  if(ME.role==="coach"){ await trans(`ارتبط كمدرب بـ${seat.org} برمزه`); }
  if(seat.pos && !ME.pos) patch.pos = seat.pos;
  if(seat.age && !ME.age) patch.age = seat.age;
  if(seat.shirt && !ME.shirt) patch.shirt = seat.shirt;
  await sb.from("profiles").update(patch).eq("id",ME.id);
  Object.assign(ME, patch);
  await sb.from("attendance").update({player_name:ME.name}).eq("seat_id",seat.id);
  await trans(`ارتبط بمقعده في ${seat.org} برمزه — لا بربط الجهة`);
  toast("ارتبطتَ بـ"+seat.org+" — وانتقل ما وُقّع لك"); render();
};

/* ── إذن وليّ الأمر: مرة واحدة للمتابعة والتعاملات العادية ── */
window.guardianConsent = async () => {
  const g = String(prompt("اسم وليّ الأمر (يُسجَّل معك):")||"").trim();
  if(!g) return;
  if(!confirm(`إذن واحد ودائم:\n• متابعة ${ME.name} وتعاملاته العادية — التدريب والحضور والتقييم والانضمام لفئة — بلا استئذان في كل مرة.\n• ويبقى الاستئذان لازمًا في: ${SEAT.GRAVE.join(" · ")}.\n\nتوافق؟`)) return;
  const {error} = await sb.from("profiles").update({guardian_name:g, guardian_consent_at:new Date().toISOString(), guardian_scope:"عادي"}).eq("id",ME.id);
  if(error) return toast(/guardian/.test(error.message)?"الإذن لم يُفعَّل في القاعدة بعد":"تعذّر: "+error.message, 1);
  Object.assign(ME,{guardian_name:g, guardian_consent_at:new Date().toISOString()});
  await sb.from("transparency").insert({actor:g+" — وليّ أمر", action:`أذِن بمتابعة ${ME.name} وتعاملاته العادية — ويبقى الجسيم باستئذان`});
  toast("سُجّل الإذن باسم "+g); render();
};

(function(){
  Object.assign(TITLES,{importPlayers:"استيراد الكشف"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE,{importPlayers:["استيراد الكشف","مقاعد وأرموز — واللاعب يرتبط بنفسه"]});
  if(typeof ACD!=="undefined") ACD.OWN.push("importPlayers");
  if(typeof HUB!=="undefined" && HUB.ROLE_OK.academy.indexOf("importPlayers")<0) HUB.ROLE_OK.academy.push("importPlayers");
})();
