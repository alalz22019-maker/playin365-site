/* PlayIn365 — الديوان الموسّع: سطح المكتب والآيباد (Academy Console 11a–11c بعمودين)
   قرار المالك: زر «الديوان الموسّع» يفكّ قشرة الجوال ويفتح التخطيط العريض — للأكاديمية وحدها. */
DW.wkey = "pi_dw_wide";
DW.wide = () => { try{ return localStorage.getItem(DW.wkey)==="1"; }catch(e){ return false; } };
DW.wideOK = () => window.innerWidth >= 900;
window.dwWide = on => {
  try{ localStorage.setItem(DW.wkey, on?"1":"0"); }catch(e){}
  if(on && !DW.wideOK()) toast("افتحه من آيباد أفقي أو لابتوب — الشاشة أضيق من أن تتّسع للعمودين",1);
  DW.apply(); render();
};
DW.apply = () => {
  const sh = document.querySelector(".shell"); if(!sh) return;
  const on = DW.wide() && DW.wideOK() && ME && ME.role==="academy" && ["erp","erpPeople","erpOps"].indexOf(VIEW)>=0;
  sh.style.maxWidth = on ? "1440px" : "520px";
  sh.style.background = on ? "#eef1f5" : "#faf8f3";
  document.body.style.background = on ? "#e6eaef" : (document.body.style.background||"");
  DW.on = on;
};
DW.toggle = () => `<button onclick="dwWide(${DW.wide()?"false":"true"})" style="flex:none;background:${DW.wide()?"#f5c518":"rgba(255,255,255,.12)"};border:1px solid ${DW.wide()?"#f5c518":"rgba(255,255,255,.2)"};color:${DW.wide()?"#151a2e":"#fff"};border-radius:9px;padding:7px 11px;font:900 10px Cairo;cursor:pointer">${DW.wide()?"⤡ عُد للجوال":"⤢ الديوان الموسّع"}</button>`;

/* رأس الديوان: زر التوسيع بجانب «الملف العام» */
(function(){
  const _head = DW.head;
  DW.head = (cur, org) => _head(cur,org).replace(
    `<button onclick="go('acadHome','${DW.esn(org)}')"`,
    DW.toggle() + `<button onclick="go('acadHome','${DW.esn(org)}')"`);
})();

/* لوحة عريضة: عمودان — المحتوى وعمود القرارات */
DW.two = (main, side) => DW.on
  ? `<div style="display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:16px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:14px;min-width:0">${main}</div>
      <div style="display:flex;flex-direction:column;gap:14px;position:sticky;top:120px">${side}</div></div>`
  : `<div style="display:flex;flex-direction:column;gap:12px">${main}${side}</div>`;
DW.cols = (n, inner) => DW.on ? `<div style="display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:14px;align-items:start">${inner}</div>` : `<div style="display:flex;flex-direction:column;gap:12px">${inner}</div>`;

/* إعادة تركيب الشاشات الثلاث للعرض العريض — نفس البيانات، هيئة مختلفة */
(function(){
  ["erp","erpPeople","erpOps","erpField"].forEach(v=>{
    const orig = T[v];
    T[v] = async () => {
      DW.apply();
      const html = await orig();
      if(!DW.on) return html;
      /* في العريض: main يصير شبكة من عمودين، والبطاقات تتوزّع.
         النمط لا يعتمد على قيمة الحشو — تغيّرها مرة فكسر التخطيط بصمت. */
      return html.replace(
        /<main style="flex:1;padding:[^"]*?;display:flex;flex-direction:column;gap:12px;background:#f4f6f8">/,
        `<main style="flex:1;padding:20px 24px 40px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start;background:#eef1f5">`);
    };
  });
  const _r = window.render;
  window.render = render = async function(){ await _r(); try{ DW.apply(); }catch(e){} };
})();

/* تلميح على الجوال: الموسّع متاح من جهاز أعرض */
DW.hint = () => (!DW.wideOK() && ME && ME.role==="academy")
  ? DW.note(`⤢ <b>الديوان الموسّع</b> — عمودان وجداول أوسع — يفتح من الآيباد الأفقي أو اللابتوب على العنوان نفسه. زرّه في رأس الديوان.`) : "";

/* في العريض: المسرح الكحلي والميزانية يمتدّان على العمودين — قراءةٌ واحدة لا نصفان */
(function(){
  const css = document.createElement("style");
  css.id = "dw-wide-span";
  css.textContent = `
.shell[style*="1440px"] main > div[style*="border-radius:14px"][style*="#243244"]{grid-column:1 / -1}
.shell[style*="1440px"] main > div:first-child{grid-column:1 / -1}
.shell[style*="1440px"] main{align-content:start}
`;
  const mount = () => document.head.appendChild(css);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
