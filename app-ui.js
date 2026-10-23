/* PlayIn365 — ورقة موحّدة بدل نوافذ المتصفّح العارية (قرار المالك ٢٦ سبتمبر: عمود اللاعب أولًا)
   PI.sheet({icon,title,sub,fields:[{id,label,placeholder,type}],note,ok,cancel}) → Promise<obj|null>
   PI.confirmSheet({icon,title,body,ok,cancel}) → Promise<bool>
   يستبدل: prompt() في «رمز الأكاديمية» و«إذن ولي الأمر»، ويوصل «انشر لقطة من هدفك». ويحجب كاشف الأخطاء عن غير التجريبي.
   كاشف الأخطاء الوردي يظهر للحسابات التجريبية فقط. */
(function(){
  const K="#151a2e", P="#4636e3", MU="#8a8fa5", BD="#e9e4d8";
  window.PI = window.PI || {};
  const open = (html) => new Promise(res=>{
    const old=document.getElementById("pi_ushe"); if(old) old.remove();
    const wrap=document.createElement("div"); wrap.id="pi_ushe";
    wrap.style.cssText="position:fixed;inset:0;z-index:9998;background:rgba(21,26,46,.45);display:flex;align-items:flex-end;justify-content:center";
    wrap.innerHTML=`<div style="width:100%;max-width:520px;background:#fff;border-radius:26px 26px 0 0;padding:14px 20px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -14px 34px rgba(21,26,46,.12);font-family:Cairo,sans-serif;direction:rtl">
      <span style="display:block;width:44px;height:4px;border-radius:99px;background:${BD};margin:0 auto 14px"></span>${html}</div>`;
    wrap.addEventListener("click",e=>{ if(e.target===wrap){ if(wrap._off) wrap._off(); wrap.remove(); res(null); } });
    wrap._done = v => { if(wrap._off) wrap._off(); wrap.remove(); res(v); };
    document.body.appendChild(wrap);
    /* لوحة مفاتيح iOS لا تُصغّر النافذة — نرفع الورقة بقدر ما غطّته */
    const panel=wrap.firstElementChild; const vv=window.visualViewport;
    const fit=()=>{ if(!vv) return; const covered=Math.max(0, window.innerHeight - vv.height - vv.offsetTop); panel.style.transform=covered?`translateY(-${covered}px)`:""; };
    if(vv){ vv.addEventListener("resize",fit); vv.addEventListener("scroll",fit); wrap._off=()=>{ vv.removeEventListener("resize",fit); vv.removeEventListener("scroll",fit); }; }
    panel.style.maxHeight="86vh"; panel.style.overflowY="auto";
    const f=wrap.querySelector("input,textarea"); if(f) setTimeout(()=>{ f.focus(); fit(); },60);
  });
  const head = (icon,title,sub) => `<div style="display:flex;gap:12px;align-items:center">
      <span style="width:40px;height:40px;border-radius:50% 50% 50% 8px;background:#efedff;color:${P};display:grid;place-items:center;font-size:17px;flex:none">${icon||"◉"}</span>
      <div><b style="display:block;font-size:15px;font-weight:900;color:${K}">${title}</b>${sub?`<span style="display:block;font-size:11px;font-weight:700;color:${MU};margin-top:2px;line-height:1.7">${sub}</span>`:""}</div></div>`;
  const btns = (ok,cancel) => `<div style="display:flex;gap:10px;margin-top:14px">
      <button data-ok style="flex:1;background:${P};color:#fff;border:0;border-radius:14px;padding:14px;font:900 13px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">${ok||"تأكيد"}</button>
      <button data-cancel style="background:#fff;color:#565d78;border:1px solid ${BD};border-radius:14px;padding:14px 20px;font:800 13px Cairo;cursor:pointer">${cancel||"لاحقًا"}</button></div>`;
  PI.sheet = async ({icon,title,sub,fields=[],note,ok,cancel}) => {
    const html = head(icon,title,sub) +
      fields.map(f=>`<label style="display:block;margin-top:${fields.indexOf(f)?10:16}px"><span style="display:block;font-size:11px;font-weight:800;color:${MU};margin-bottom:6px">${f.label}</span>
        <input data-f="${f.id}" type="${f.type||"text"}" placeholder="${f.placeholder||""}" ${f.ltr?'dir="ltr" class="ltr"':''} style="width:100%;box-sizing:border-box;border:1px solid ${BD};border-radius:14px;padding:13px 16px;background:#faf8f3;font:${f.ltr?"700 18px 'Space Grotesk'":"700 13px Cairo"};color:${K};letter-spacing:${f.ltr?".14em":"0"}"></label>`).join("") +
      (note?`<span style="display:block;font-size:10.5px;font-weight:700;color:#565d78;line-height:1.8;margin-top:10px">${note}</span>`:"") + btns(ok,cancel);
    const p = open(html); const w=document.getElementById("pi_ushe");
    w.querySelector("[data-cancel]").onclick=()=>w._done(null);
    const submit=()=>{ const o={}; let miss=false; w.querySelectorAll("[data-f]").forEach(i=>{ o[i.dataset.f]=i.value.trim(); if(!o[i.dataset.f]) miss=true; }); if(miss){ w.querySelector("[data-f]").style.borderColor="#a83b25"; return; } w._done(o); };
    w.querySelector("[data-ok]").onclick=submit; w.querySelectorAll("[data-f]").forEach(i=>i.addEventListener("keydown",e=>{ if(e.key==="Enter") submit(); }));
    return p;
  };
  PI.confirmSheet = async ({icon,title,body,ok,cancel}) => {
    const p = open(head(icon,title,"") + `<div style="font-size:12px;font-weight:700;color:#565d78;line-height:1.9;margin-top:14px;white-space:pre-line">${body||""}</div>` + btns(ok,cancel));
    const w=document.getElementById("pi_ushe"); w.querySelector("[data-cancel]").onclick=()=>w._done(false); w.querySelector("[data-ok]").onclick=()=>w._done(true); return p;
  };

  /* ٥ · كاشف الأخطاء للحسابات التجريبية فقط */
  const gate=()=>{ const d=document.getElementById("__piErr"); if(!d) return; const demo = (typeof DEMO!=="undefined"&&DEMO.on); d.style.display = demo ? "" : "none"; };
  new MutationObserver(gate).observe(document.documentElement,{childList:true,subtree:true}); gate();
})();
