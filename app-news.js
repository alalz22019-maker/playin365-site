/* PlayIn365 — الدفعة ٢: قدرة واحدة End-to-End — «إعلانات الجهة لأعضائها»
   التصميم: Player App «معسكر الصيف U18 — التسجيل يفتح الأحد لأعضاء الأكاديمية أولًا · نشرته إدارة الواحة».
   بوابة التكرار: pi_news كان أخبار البطولات فقط (app-tours) — نفس الجدول بحقل org يميّز إعلان الجهة، لا جدول ثانٍ.
   المسار: الأكاديمية/الملعب تنشر (acadHome · vnHome) → pi_news{org} → يظهر للاعب (feed) ولولي الأمر (gdHome) والمدرب (coachHome).
   الصلاحية في القاعدة: من يكتب يجب أن يكون org=ME.org — والعرض يقرأ org عضوية القارئ. */
(function(){
  const K="#151a2e", P="#4636e3", MU="#8a8fa5", BD="#e9e4d8";
  const NW={};
  NW.mine = async (org) => { if(!org) return []; try{ const {data,error}=await sb.from("pi_news").select("*").eq("org",org).order("created_at",{ascending:false}).limit(5); return error?[]:(data||[]); }catch(e){ return []; } };
  NW.when = s => { const d=new Date(s), h=(Date.now()-d)/36e5; return h<1?"الآن":h<24?"اليوم":h<48?"أمس":d.toLocaleDateString("ar-SA",{day:"numeric",month:"short"}); };
  /* بطاقة الإعلان كما في التصميم: أيقونة قطرة · العنوان · «نشرته فلان · متى» */
  NW.card = (rows, forOrg, canPost) => {
    if(!rows.length && !canPost) return "";
    return `<div style="background:#fff;border:1px solid ${BD};border-radius:20px;padding:16px;flex:none">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
        <b style="font-size:13px;font-weight:900;color:${K}">من ${esc(forOrg||"جهتك")}</b>
        ${canPost?`<button onclick="nwPost()" style="background:#efedff;color:${P};border:0;border-radius:10px;padding:6px 12px;font:900 10.5px Cairo;cursor:pointer;white-space:nowrap">+ إعلان</button>`:`<span style="font-size:9.5px;font-weight:800;color:${MU};white-space:nowrap">لأعضائها فقط</span>`}
      </div>
      ${rows.length?rows.map(n=>`<div style="display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-top:1px solid #f0ece2">
        <span style="width:32px;height:32px;border-radius:50% 50% 50% 6px;background:#efedff;color:${P};display:grid;place-items:center;font-size:14px;flex:none">▤</span>
        <div style="flex:1;min-width:0">
          <b style="display:block;font-size:12px;font-weight:900;color:${K};line-height:1.5">${esc(n.title)}</b>
          ${n.summary?`<span style="display:block;font-size:10.5px;font-weight:500;color:#565d78;line-height:1.75;margin-top:3px">${esc(n.summary)}</span>`:""}
          <span style="display:block;font-size:9.5px;font-weight:700;color:${MU};margin-top:4px">نشرته ${esc(n.added_by||n.source||"—")} · ${NW.when(n.created_at)}</span>
        </div>
      </div>`).join("")
      :`<span style="display:block;font-size:10.5px;color:${MU};font-weight:700;line-height:1.8;margin-top:10px">لا إعلان بعد — أول إعلان تنشره يصل أعضاءك وأولياء أمورهم هنا</span>`}
    </div>`;
  };
  window.nwPost = async () => {
    const title=prompt("عنوان الإعلان — سطر واحد:"); if(!title||!title.trim()) return;
    const summary=prompt("تفصيل (اختياري):","")||null;
    const {error}=await sb.from("pi_news").insert({title:title.trim(), summary, org:ME.org, source:ME.org, added_by:ME.name});
    if(error) return toast("تعذّر: "+error.message,1);
    await trans(`إعلان لأعضاء ${ME.org}: ${title.trim()}`);
    toast("نُشر — يصل أعضاءك الآن"); render();
  };
  const inject = (html, card) => { if(!card) return html; const i=html.lastIndexOf("دورك الحالي"); if(i>0){ const cut=html.lastIndexOf("<div",i); if(cut>0) return html.slice(0,cut)+card+html.slice(cut); } return html.replace(/<\/main>\s*$/, card+"</main>"); };
  /* الناشر: الأكاديمية والملعب */
  for(const v of ["acadHome","vnHome"]){ const _o=T[v]; if(!_o) continue;
    T[v]=async()=>{ const html=await _o(); if(!ME||!ME.org) return html; const rows=await NW.mine(ME.org); return inject(html, NW.card(rows, ME.org, true)); }; }
  /* القارئ: اللاعب والمدرب بجهتهما — وولي الأمر بجهة ابنه */
  for(const v of ["feed","coachHome"]){ const _o=T[v]; if(!_o) continue;
    T[v]=async()=>{ const html=await _o(); if(!ME||!ME.org||ME.role==="venue"||ME.role==="academy") return html; const rows=await NW.mine(ME.org); return rows.length?inject(html, NW.card(rows, ME.org, false)):html; }; }
  const _gd=T.gdHome; if(_gd) T.gdHome=async()=>{ const html=await _gd(); try{ const D=await GD.load(); const sel=D.kids.find(k=>k.name===GD.pick())||D.kids[0]; const org=sel&&sel.org; if(!org) return html; const rows=await NW.mine(org); return rows.length?inject(html, NW.card(rows, org, false)):html; }catch(e){ return html; } };
  window.NW=NW;
})();
