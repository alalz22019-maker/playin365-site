/* PlayIn365 — دفعة V3: ثوب الديوان · تصليحات التخطيط · من يملك الوصول
   طبقة عرض بحتة — لا تمسّ قاعدة بيانات ولا صلاحية. */
/* ── العدد والمعدود: العربية تُعرب المعدود بحسب العدد، والرقم متغيّر فلا تُكتب صيغة واحدة ──
   ١ → «حدث واحد» · ٢ → «حدثان» · ٣–١٠ → جمع مجرور «أحداث» · ١١+ → مفرد منصوب «حدثًا» */
window.piN = (n, one, two, few, many) => {
  n = +n || 0;
  const num = '<span class="ltr">'+n+'</span>';
  if(n === 1) return one;
  if(n === 2) return two || (num+" "+one+"ان");
  if(n >= 3 && n <= 10) return num+" "+few;
  return num+" "+many;
};
window.piEvents  = n => piN(n,"حدث واحد","حدثان","أحداث","حدثًا");
window.piDays    = n => piN(n,"يوم واحد","يومان","أيام","يومًا");
window.piMatches = n => piN(n,"مباراة واحدة","مباراتان","مباريات","مباراة");

(function(){
  const css = `
/* ١ · الرقاقات لا تنكسر */
.chip{white-space:nowrap}
/* ٣ · ثوب الديوان — سطح مؤسسي رمادي بلا بنفسجي وبلا قطرات */
body.erp-skin{background:#eef1f4}
body.erp-skin .stage{background:#243244;border-radius:12px}
body.erp-skin .stage::before{display:none}
body.erp-skin .card{border-radius:12px;border-color:#d9dfe5}
body.erp-skin .btn:not(.ghost){background:#243244;box-shadow:none;border-radius:10px}
body.erp-skin .btn.ghost{border-radius:10px;border-color:#d9dfe5;color:#5a6a7c}
body.erp-skin .btn.ghost:hover{border-color:#243244;color:#243244}
body.erp-skin .ic{border-radius:8px;background:#eef1f4;color:#243244}
body.erp-skin .stat{border-radius:10px;border-color:#d9dfe5}
body.erp-skin .chip{border-radius:8px}
body.erp-skin a{color:#243244}
/* ٤ · حاشية الأوزان ثلاثة أسطر */
.wnote>span{display:block;margin-top:4px}
`;
  const s=document.createElement("style"); s.id="v3fix"; s.textContent=css;
  const mount=()=>document.head.appendChild(s);
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mount); else mount();

  /* ثوب الديوان يُلبس على شاشات الديوان وحدها */
  const ERP=/^(erp|erpOps|erpPeople|erpField|approvals|accredit|club|tournament)$/;
  const _r=window.render;
  window.render=async function(){
    await _r.apply(this,arguments);
    try{ document.body.classList.toggle("erp-skin", ERP.test(typeof VIEW!=="undefined"?VIEW:"")); }catch(e){}
  };

  /* ═══ من يملك الوصول — أذونات سارية وزر سحب (اللاعب) ═══ */
  const RISK={record:["السجل الرياضي","#4636e3"],readiness:["حالة الجاهزية","#2c6e49"],contact:["التواصل عبرك","#c78c00"],medical:["الملف الطبي","#a83b25"]};
  const _pv=T.privacy;
  if(_pv) T.privacy=async()=>{
    const body=await _pv();
    let rows=[];
    try{ rows=await q("cq", sb.from("pi_consent_req").select("*").eq("player",ME.name).order("created_at",{ascending:false}).limit(40)); }catch(e){}
    const live=rows.filter(r=>r.status==="granted"||r.granted_at);
    const panel=`<div class="card" style="border-radius:26px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <b class="h2" style="color:#4636e3">من يملك الوصول</b>
        <span style="font-size:10px;font-weight:900;color:#8a8fa5">${live.length?`<span class="ltr">${live.length}</span> إذنًا ساريًا`:"لا أذونات"}</span></div>
      <span class="muted" style="display:block;line-height:1.9;margin-bottom:11px">الإذن ليس مربعًا واحدًا: نطاقٌ لجهةٍ بعينها لغرض مكتوب — ويُسحب متى شئت بلا سبب.</span>
      ${live.length?live.map(r=>{const S=RISK[r.scope]||RISK.record;
        return `<div style="background:#faf8f3;border:1px solid #e9e4d8;border-radius:16px;padding:12px 14px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div style="min-width:0"><b style="font-size:12.5px">${esc(r.requester||"جهة")}</b>
            <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:800;margin-top:3px">${esc(r.req_role==="scout"?"كشاف":r.req_role||"")}${r.created_at?` · منذ <span class="ltr">${esc(String(r.created_at).slice(0,10))}</span>`:""}</span></div>
          <span class="chip" style="background:${S[1]}18;color:${S[1]};flex:none">${S[0]}</span></div>
        ${r.reason?`<span class="muted" style="display:block;margin-top:8px;line-height:1.8">الغرض: ${esc(r.reason)}</span>`:""}
        <button class="btn ghost" style="margin-top:10px;padding:9px;font-size:10.5px" onclick="pvRevoke('${r.id}','${esc(r.requester||"")}')">اسحب الإذن</button>
      </div>`}).join("")
      :`<div style="border:1.5px dashed #d5d0c4;border-radius:16px;padding:18px;text-align:center"><span class="muted">لا جهة تملك إذنًا على سجلك الآن — وأي طلب يصلك قبل أن يُفتح شيء</span></div>`}
      <span class="muted" style="display:block;margin-top:9px;line-height:1.85">الطبي لا يُمنح من هنا أبدًا — يمرّ بالمختص الطبي حصرًا وكل اطّلاع عليه مسجَّل.</span>
    </div>`;
    return body.replace("</main>", panel+"</main>");
  };
  window.pvRevoke=async(id,who)=>{
    if(!confirm(`سحب إذن ${who}؟\nيتوقف اطّلاعه فورًا، ويُدوَّن السحب باسمك.`)) return;
    const {error}=await sb.from("pi_consent_req").update({status:"revoked"}).eq("id",id);
    if(error) return toast("تعذّر: "+error.message,1);
    await trans(`سحب إذن اطلاع — ${who}`);
    toast("سُحب الإذن — لا اطّلاع بعد الآن"); render();
  };
})();
