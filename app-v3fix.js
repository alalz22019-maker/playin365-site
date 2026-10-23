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

  })();
