/* PlayIn365 — الدفعة ١ (استعادة): مدير الملعب في الجوال — ما صُمّم في Venue Mobile 6f/6g/6h وسقط من الكود
   ١. بلاغ عطل بصورة وموقع ونوع (6f «التقط الحالة») — الصورة تُختم بالوقت، وتُخزَّن في pi_media كما بقية الوسائط.
   ٢. «الاشتراكات والعقود» في المال (6g).
   ٣. «الفريق وصلاحياته» + «ما يراه الملعب وما لا يراه» في الملعب (6h).
   يُحمَّل بعد app-vn4.js. لا يمسّ القاعدة: يقرأ profiles/subscriptions/pi_faults/pi_media الموجودة. */
(function(){
  if(typeof VN==="undefined") return;
  const K="#151a2e", P="#4636e3", MU="#8a8fa5", TX="#565d78", BD="#e9e4d8", GR="#2c6e49";
  const KINDS=[["إضاءة","light"],["أرضية وعشب","ground"],["مرافق ودورات","facility"],["أمن وسلامة","safety"]];

  /* الملعب لا يرى شاشة اللاعب: «الرئيسية» عنده هي «اليوم على الأرض» (Venue Mobile 6c) */
  const _feedV=T.feed;
  T.feed = async () => (ME && ME.role==="venue") ? T.vnHome() : _feedV();
  if(typeof TITLES!=="undefined") TITLES.feed = TITLES.feed || "الرئيسية";
  let pick={kind:"light", closes:false, photo:null};

  /* ═══ ١ · بلاغ عطل بصورة — يستبدل نموذج vnFix النصّي بنموذج التصميم ═══ */
  T.vnFix = async () => {
    const D = await VN.load();
    const open = D.fl.filter(f=>f.status!=="done"), done=D.fl.filter(f=>f.status==="done");
    D.fm = await q("fm", sb.from("pi_media").select("event_id,url").eq("subject",VN.who()).eq("kind","fault").limit(60)).catch(()=>[]) || [];
    const SEV = VN.SEV;
    return VN.head("الصيانة","صورة وموقع وسطر واحد — والباقي يُملأ تلقائيًا") + VN.tabs("vnFix") +
    `<main style="flex:1;padding:14px 18px 118px;display:flex;flex-direction:column;gap:12px">
      ${VN.card(`${VN.h("التقط الحالة")}
        <label id="vnf_drop" style="display:flex;margin-top:11px;border:1.5px dashed #d9dfe5;border-radius:14px;height:130px;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:#faf8f3;cursor:pointer;overflow:hidden;position:relative">
          <input type="file" accept="image/*" capture="environment" onchange="vnfPhoto(this)" style="position:absolute;inset:0;opacity:0;cursor:pointer">
          <span style="font-size:22px;color:#8fa0b0">▣</span>
          <span style="font-size:11px;font-weight:800;color:#5b6078">صوّر العطل — الصورة تُختم بالوقت والموقع</span>
        </label>
        <div id="vnf_kinds" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px">
          ${KINDS.map(([t,k])=>`<span onclick="vnfKind('${k}')" data-k="${k}" style="cursor:pointer;border-radius:12px;padding:11px;text-align:center;font-size:11px;font-weight:900;background:${k===pick.kind?K:"#fff"};border:1px solid ${k===pick.kind?K:BD};color:${k===pick.kind?"#fff":K}">${t}</span>`).join("")}
        </div>
        <input id="vnf_title" placeholder="كشّاف رقم ٤ لا يعمل — الجهة الجنوبية" style="margin-top:11px;width:100%;border:1px solid ${BD};border-radius:12px;padding:12px;background:#faf8f3;font:700 11.5px Cairo;color:${K};box-sizing:border-box">
        <select id="vnf_space" style="margin-top:8px;width:100%;border:1px solid ${BD};border-radius:12px;padding:11px;background:#fff;font:700 11.5px Cairo;color:${K}">
          <option value="">المساحة — اختياري</option>${D.sp.map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("")}
        </select>
        <div onclick="vnfToggle()" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;background:${pick.closes?"#fdeee8":"#faf8f3"};border:1px solid ${pick.closes?"#f3cfc4":BD};border-radius:12px;padding:11px 12px;cursor:pointer">
          <span style="font-size:11px;font-weight:800;color:${pick.closes?"#a83b25":TX}">يُغلق المساحة تلقائيًا؟ ${pick.closes?"— نعم، عطل عالٍ":""}</span>
          <span style="width:44px;height:26px;border-radius:99px;position:relative;background:${pick.closes?"#a83b25":"#d6d0c2"}"><span style="position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;${pick.closes?"inset-inline-end:3px":"inset-inline-start:3px"}"></span></span>
        </div>
        <button onclick="vnfSend()" style="margin-top:11px;width:100%;background:#e8531f;color:#fff;border:0;border-radius:14px;padding:13px;font:900 12.5px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(232,83,31,.28)">أرسل البلاغ — باسم ${esc(ME.name)}</button>`)}

      ${VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("الأعطال المفتوحة")}<span style="font-size:10px;color:${MU};font-weight:800"><span class="ltr">${open.length}</span> مفتوح · <span class="ltr">${done.length}</span> أُغلقت</span></div>
        ${open.length?open.map(f=>{const S=SEV[f.severity]||SEV.low; const ph=(D.fm||[]).find(m=>m.event_id===f.id);
          return `<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-top:1px solid #f0ece2">
          ${ph?`<img src="${esc(ph.url)}" alt="" style="width:34px;height:34px;border-radius:12px;object-fit:cover;flex:none">`:VN.ic("⚠️",S[2],S[1])}
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(f.title)}</b>
            <span style="display:block;font-size:10px;color:${MU};font-weight:700;margin-top:2px">بلّغه ${esc(f.reported_by)}${f.space?" · "+esc(f.space):""}${f.created_at?" · "+new Date(f.created_at).toLocaleDateString("ar-SA",{day:"numeric",month:"short"}):""}</span></div>
          <span onclick="vnFixed('${f.id}','${esc(f.title)}')" style="flex:none;cursor:pointer;font-size:10px;font-weight:900;color:${S[1]}">${f.severity==="high"?"يُغلق المساحة":S[0]} · أُصلح</span>
        </div>`;}).join("")
        :`<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:16px;text-align:center;margin-top:11px"><span style="font-size:10.5px;color:${MU};font-weight:700">لا عطل مفتوحًا — والمجمّع كما تركتَه</span></div>`}`)}

      <div style="background:#fff8df;border:1px solid #f0e2b4;border-radius:16px;padding:12px 13px;font-size:11px;color:#8a6912;font-weight:700;line-height:1.85">البلاغ لا يُحذف — يُغلق بمن أصلحه وتاريخه. ومن أبلغ عنه من خارج إدارتك (منظّم أو مشترك) يظهر اسمه كما هو.</div>
    </main>`;
  };
  window.vnfKind = k => { pick.kind=k; document.querySelectorAll('#vnf_kinds [data-k]').forEach(el=>{ const on=el.dataset.k===k; el.style.background=on?K:"#fff"; el.style.borderColor=on?K:BD; el.style.color=on?"#fff":K; }); };
  window.vnfToggle = () => { pick.closes=!pick.closes; render(); };
  window.vnfPhoto = inp => { const f=inp.files&&inp.files[0]; if(!f) return; const r=new FileReader(); r.onload=e=>{ pick.photo=e.target.result; const d=document.getElementById('vnf_drop'); if(d) d.innerHTML=`<img src="${pick.photo}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><span style="position:absolute;bottom:8px;inset-inline-start:10px;background:rgba(21,26,46,.8);color:#fff;border-radius:8px;padding:4px 9px;font-size:9.5px;font-weight:900">${new Date().toLocaleString("ar-SA",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"})}</span>`; }; r.readAsDataURL(f); };
  window.vnfSend = async () => {
    const title=(document.getElementById('vnf_title')||{}).value||""; if(!title.trim()){ toast("اكتب سطرًا واحدًا عن العطل",true); return; }
    const space=(document.getElementById('vnf_space')||{}).value||null;
    const KIND={light:"إضاءة",ground:"أرضية وعشب",facility:"مرافق ودورات",safety:"أمن وسلامة"};
    const row={venue:VN.who(), title:KIND[pick.kind]+" — "+title.trim(), space, severity:pick.closes?"high":"mid", status:"open", reported_by:ME.name};
    const {data,error}=await sb.from("pi_faults").insert(row).select().single();
    if(error){ toast("لم يُسجَّل البلاغ — "+error.message,true); return; }
    if(pick.photo && data){ await sb.from("pi_media").insert({owner_id:ME.id, subject:VN.who(), kind:"fault", url:pick.photo, event_id:data.id, event_type:"fault", label:title.trim(), uploaded_by:ME.name}).then(()=>{}).catch(()=>{}); }
    if(pick.closes && space){ await sb.from("pi_spaces").update({open:false, closed_why:"عطل: "+title.trim(), closed_by:ME.name, updated_at:new Date().toISOString()}).eq("venue",VN.who()).eq("name",space).then(()=>{}).catch(()=>{}); }
    await trans(`بلاغ عطل — ${title.trim()}${space?" · "+space:""} · ${VN.who()}`);
    toast("سُجّل البلاغ باسمك"+(pick.closes&&space?" — وأُغلقت "+space:""));
    pick={kind:"light",closes:false,photo:null}; render();
  };

  /* ═══ ٢ · الاشتراكات والعقود — في المال ═══ */
  const _money=T.vnMoney;
  T.vnMoney = async () => {
    let body=await _money();
    const V=VN.who();
    const subs=await q("vs", sb.from("subscriptions").select("*").eq("org",V)).catch(()=>[]);
    const active=(subs||[]).filter(s=>s.paid), late=(subs||[]).filter(s=>!s.paid);
    const groups={}; (subs||[]).forEach(s=>{ const k=s.group_name||"عام"; groups[k]=(groups[k]||0)+1; });
    const card=VN.card(`${VN.h("الاشتراكات والعقود")}
      ${Object.entries(groups).map(([g,n])=>{ const rows=(subs||[]).filter(s=>(s.group_name||"عام")===g); const sum=rows.reduce((a,s)=>a+(+s.amount||0),0); const unpaid=rows.filter(s=>!s.paid).length; const isContract=/عقد/.test(g);
        return `<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-top:1px solid #f0ece2">
        ${VN.ic(isContract?"★":"▤", isContract?"#fff6d6":"#efedff", isContract?"#c78c00":P)}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(g)} — <span class="ltr">${n}</span></b><span style="display:block;font-size:10px;color:${MU};font-weight:700;margin-top:2px">${rows.map(s=>esc(s.player_name)).slice(0,3).join(" · ")}${rows.length>3?" …":""} · <span class="ltr">${sum.toLocaleString("en")}</span> ر.س</span></div>
        <span style="flex:none;font-size:10px;font-weight:900;color:${unpaid?"#c78c00":P}">${unpaid?unpaid+" متأخر":"يعمل"}</span></div>`; }).join("")}
      ${!(subs||[]).length?`<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:16px;text-align:center;margin-top:11px"><span style="font-size:10.5px;color:${MU};font-weight:700">لا اشتراك بعد — أول عقد يظهر هنا بتاريخ انتهائه</span></div>`:""}
      <div style="display:flex;gap:12px;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid #f0ece2">
        ${VN.ic("▤","#eef1f5","#5a6a7c")}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">الفواتير والتقارير المالية</b><span style="display:block;font-size:10px;color:${MU};font-weight:700;margin-top:2px">تصدير · ضريبة · مطابقة بنكية — يفتح في الديوان</span></div>
        <span onclick="go(T['vndMoney']?'vndMoney':'vnMoney')" style="flex:none;cursor:pointer;background:#eef1f5;color:#5a6a7c;border-radius:999px;padding:6px 11px;font-size:10px;font-weight:900">افتح</span>
      </div>`);
    return body.replace(/<\/main>\s*$/, card+"</main>");
  };

  /* ═══ ٣ · الفريق وصلاحياته + ما يراه الملعب — في «ملفي» ═══ */
  const _me=T.vnMe;
  T.vnMe = async () => {
    let body=await _me();
    const V=VN.who();
    const team=await q("vt", sb.from("profiles").select("name,role,avatar_url").eq("org",V).limit(12)).catch(()=>[]);
    const ROLE={venue:["مالك","#efedff",P],venue_staff:["تشغيل","#eef1f5","#5a6a7c"],organizer:["منظّم","#eef1f5","#5a6a7c"],referee:["حكم","#eef1f5","#5a6a7c"]};
    const teamCard=VN.card(`<div style="display:flex;justify-content:space-between;align-items:baseline">${VN.h("الفريق وصلاحياته")}<span style="font-size:10px;color:${MU};font-weight:800">الصلاحية في القاعدة لا في الشاشة</span></div>
      ${(team||[]).length?(team||[]).map(t=>{const R=ROLE[t.role]||["عضو","#eef1f5","#5a6a7c"]; const me=t.name===ME.name;
        return `<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-top:1px solid #f0ece2">
        ${t.avatar_url?`<img src="${esc(t.avatar_url)}" alt="" style="width:38px;height:38px;border-radius:12px;object-fit:cover;object-position:top;background:#eef1f5;flex:none">`:`<span style="width:38px;height:38px;border-radius:12px;background:#eef1f5;color:#5a6a7c;display:grid;place-items:center;font-size:14px;flex:none">👤</span>`}
        <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${esc(t.name)}${me?" — أنت":""}</b><span style="display:block;font-size:10px;color:${MU};font-weight:700;margin-top:2px">${me?"مدير المنشأة · كل الصلاحيات":R[0]==="تشغيل"?"إدارية · حجوزات وتحصيل":"يرى ما يخصّه فقط"}</span></div>
        <span style="flex:none;background:${R[1]};border:1px solid ${R[1]};color:${R[2]};border-radius:999px;padding:5px 11px;font-size:10px;font-weight:900">${me?"مالك":R[0]}</span>
      </div>`;}).join("")
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:14px;padding:16px;text-align:center;margin-top:11px"><span style="font-size:10.5px;color:${MU};font-weight:700">أنت وحدك حتى الآن — أضف طاقمك من الديوان</span></div>`}
      <span style="display:block;font-size:9.5px;color:${MU};font-weight:700;margin-top:10px;line-height:1.8">التعديل على الصلاحيات من الديوان — الجوال يعرضها فقط.</span>`);
    const SEES=[["✓","#eaf5ee",GR,"حجوزات مساحاتك وأسماء من حجزها — لأنك طرف في العقد"],["✓","#eaf5ee",GR,"من داخل المجمّع الآن — بالعدد والاسم عند البوابة"],["✗","#fdeee8","#a83b25","سجل اللاعب وتقييمه — ليس من شأن الملعب"],["✗","#fdeee8","#a83b25","الملف الطبي لأي لاعب — بإذن منفصل ولا يمرّ من هنا"]];
    const seesCard=VN.card(`${VN.h("ما يراه الملعب وما لا يراه")}
      ${SEES.map(([i,bg,ink,t])=>`<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #f0ece2">
        <span style="width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-size:12px;font-weight:900;flex:none;background:${bg};color:${ink}">${i}</span>
        <span style="flex:1;min-width:0;font-size:11.5px;font-weight:700;color:${TX};line-height:1.7">${t}</span></div>`).join("")}`);
    return body.replace(/<\/main>\s*$/, teamCard+seesCard+"</main>");
  };
  T.vnProfile = T.vnMe;
})();
