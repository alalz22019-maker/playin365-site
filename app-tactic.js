/* PlayIn365 — لوح التكتيك: محرّر حقيقي يرسم به المدرب بيده
   جوال وآيباد بنفس الملف · سحب · رسم · أدوات ميدان · لقطات متحركة · ملء الشاشة · حفظ · نشر
   القاعدة: اللوح أداة فنّية باسم المدرب — لا يمسّ رقمًا وقّعه غيره. */
const TB = {};
TB.W = 1040; TB.H = 680;

/* ── الأدوات ── */
TB.OBJ = [
  ["p",   "لاعبك"],   ["o",  "خصم"],    ["gk", "حارس"],   ["nt", "محايد"],
  ["cone","قمع"],     ["disc","طوق"],   ["ball","كرة"],   ["goal","مرمى"],
  ["mini","مرمى صغير"],["man","مجسم"],  ["pole","شاخص"],  ["lad","سلم"]
];
TB.PEN = [
  ["run","حركة"],["pass","تمريرة"],["drib","مراوغة"],["shot","تسديدة"],
  ["zone","منطقة"],["circ","دائرة"],["free","رسم حر"],["text","نص"]
];
TB.COLORS = ["#f5c518","#4636e3","#e8531f","#faf8f3","#2c6e49"];
TB.PITCH = [["full","ملعب كامل"],["half","نصف ملعب"],["third","ثلث"],["box","مربع تمرين"],["none","بلا خطوط"]];
TB.AIM = {tact:["تكتيكي","#4636e3"],tech:["مهاري","#c78c00"],phys:["بدني","#e8531f"],rec:["استشفاء","#2c6e49"]};

/* ── الحالة ── */
TB.s = null;
TB.blank = () => ({
  pitch:"full", land:true, zoom:1,
  frames:[{objs:[],shapes:[]}],
  meta:{title:"لوح بلا اسم", aim:"tact", minutes:15, group:"كل الفئات", notes:""}
});
TB.fr   = () => TB.s.frames[TB.s.f];
TB.uid  = () => "x"+Math.random().toString(36).slice(2,9);
TB.hist = []; TB.fut = [];
TB.snap = () => { TB.hist.push(JSON.stringify(TB.s.frames)); if(TB.hist.length>50) TB.hist.shift(); TB.fut.length=0; TB.syncUndo(); };
TB.syncUndo = () => {
  const u=document.getElementById("tb_undo"), r=document.getElementById("tb_redo");
  if(u) u.style.opacity = TB.hist.length?1:.35;
  if(r) r.style.opacity = TB.fut.length?1:.35;
};
window.tbUndo = () => { if(!TB.hist.length) return; TB.fut.push(JSON.stringify(TB.s.frames)); TB.s.frames=JSON.parse(TB.hist.pop()); TB.s.f=Math.min(TB.s.f,TB.s.frames.length-1); TB.paint(); TB.syncUndo(); };
window.tbRedo = () => { if(!TB.fut.length) return; TB.hist.push(JSON.stringify(TB.s.frames)); TB.s.frames=JSON.parse(TB.fut.pop()); TB.paint(); TB.syncUndo(); };

/* ── رسم الملعب ── */
TB.pitchSvg = k => {
  const L='stroke="rgba(255,255,255,.42)" stroke-width="3" fill="none"';
  if(k==="none") return "";
  if(k==="box")  return `<rect x="60" y="50" width="920" height="580" ${L}></rect><line x1="520" y1="50" x2="520" y2="630" ${L}></line>`;
  if(k==="third")return `<rect x="60" y="50" width="920" height="580" ${L}></rect>
    <rect x="60" y="200" width="150" height="280" ${L}></rect><rect x="60" y="270" width="60" height="140" ${L}></rect>
    <path d="M210 265 A 90 90 0 0 1 210 415" ${L}></path><rect x="20" y="290" width="40" height="100" ${L}></rect>`;
  if(k==="half") return `<rect x="60" y="50" width="920" height="580" ${L}></rect>
    <rect x="60" y="170" width="200" height="340" ${L}></rect><rect x="60" y="255" width="80" height="170" ${L}></rect>
    <path d="M260 250 A 110 110 0 0 1 260 430" ${L}></path><rect x="20" y="280" width="40" height="120" ${L}></rect>
    <circle cx="175" cy="340" r="5" fill="rgba(255,255,255,.42)"></circle>
    <path d="M980 190 A 160 160 0 0 0 980 490" ${L}></path>`;
  return `<rect x="60" y="50" width="920" height="580" ${L}></rect>
    <line x1="520" y1="50" x2="520" y2="630" ${L}></line>
    <circle cx="520" cy="340" r="92" ${L}></circle><circle cx="520" cy="340" r="5" fill="rgba(255,255,255,.42)"></circle>
    <rect x="60" y="190" width="130" height="300" ${L}></rect><rect x="60" y="260" width="52" height="160" ${L}></rect>
    <rect x="850" y="190" width="130" height="300" ${L}></rect><rect x="928" y="260" width="52" height="160" ${L}></rect>
    <rect x="24" y="285" width="36" height="110" ${L}></rect><rect x="980" y="285" width="36" height="110" ${L}></rect>
    <path d="M190 268 A 92 92 0 0 1 190 412" ${L}></path><path d="M850 268 A 92 92 0 0 0 850 412" ${L}></path>`;
};

/* ── رسم عنصر ── */
TB.objSvg = o => {
  const g = (inner,extra) => `<g data-id="${o.id}" transform="translate(${o.x},${o.y})" style="cursor:grab"${extra||""}>${inner}</g>`;
  const lbl = t => t ? `<text y="42" text-anchor="middle" font-family="Cairo" font-size="19" font-weight="900" fill="#faf8f3" stroke="#0e2620" stroke-width="4" paint-order="stroke">${TB.esc(t)}</text>` : "";
  const num = (t,c) => `<text y="7" text-anchor="middle" font-family="Space Grotesk" font-size="19" font-weight="700" fill="${c}">${TB.esc(t)}</text>`;
  switch(o.t){
    case "p":   return g(`<circle r="21" fill="${o.c||"#4636e3"}" stroke="#faf8f3" stroke-width="3.5"></circle>${num(o.n||"","#fff")}${lbl(o.label)}`);
    case "o":   return g(`<circle r="21" fill="#faf8f3" stroke="#151a2e" stroke-width="3.5"></circle>${num(o.n||"","#151a2e")}${lbl(o.label)}`);
    case "gk":  return g(`<circle r="21" fill="#f5c518" stroke="#151a2e" stroke-width="3.5"></circle>${num(o.n||"GK","#151a2e")}${lbl(o.label)}`);
    case "nt":  return g(`<circle r="21" fill="#2c6e49" stroke="#faf8f3" stroke-width="3.5"></circle>${num(o.n||"","#fff")}${lbl(o.label)}`);
    case "cone":return g(`<path d="M0 -20 L16 15 L-16 15 Z" fill="${o.c||"#f5c518"}" stroke="#0e2620" stroke-width="2"></path>${lbl(o.label)}`);
    case "disc":return g(`<ellipse rx="17" ry="7" fill="none" stroke="${o.c||"#e8531f"}" stroke-width="5"></ellipse>${lbl(o.label)}`);
    case "ball":return g(`<circle r="11" fill="#fff" stroke="#151a2e" stroke-width="2.5"></circle><path d="M0 -6 L5 -2 L3 4 L-3 4 L-5 -2 Z" fill="#151a2e"></path>`);
    case "goal":return g(`<rect x="-9" y="-46" width="18" height="92" fill="none" stroke="#faf8f3" stroke-width="5"></rect><line x1="-9" y1="-46" x2="9" y2="-46" stroke="#faf8f3" stroke-width="5"></line>`);
    case "mini":return g(`<rect x="-7" y="-26" width="14" height="52" fill="none" stroke="#faf8f3" stroke-width="4.5"></rect>`);
    case "man": return g(`<circle cy="-22" r="9" fill="#e8531f"></circle><path d="M-11 -10 L11 -10 L14 28 L-14 28 Z" fill="#e8531f" stroke="#0e2620" stroke-width="2"></path>`);
    case "pole":return g(`<rect x="-2.5" y="-34" width="5" height="60" fill="#f5c518"></rect><ellipse cy="27" rx="13" ry="5" fill="#151a2e" opacity=".55"></ellipse>`);
    case "lad": return g(`<rect x="-22" y="-40" width="44" height="80" fill="none" stroke="#faf8f3" stroke-width="3"></rect>${[-20,0,20].map(y=>`<line x1="-22" y1="${y}" x2="22" y2="${y}" stroke="#faf8f3" stroke-width="3"></line>`).join("")}`);
  }
  return "";
};
TB.esc = s => String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
TB.wavy = (x1,y1,x2,y2) => {
  const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1, n=Math.max(3,Math.floor(L/26)), ux=dx/L, uy=dy/L, px=-uy, py=ux;
  let d=`M${x1} ${y1}`;
  for(let i=1;i<=n;i++){ const t=i/n, a=(i%2?1:-1)*9, mx=x1+dx*(t-0.5/n)+px*a, my=y1+dy*(t-0.5/n)+py*a;
    d+=` Q${mx} ${my} ${x1+dx*t} ${y1+dy*t}`; }
  return d;
};
TB.shapeSvg = s => {
  const c=s.c||"#f5c518", w=s.t==="shot"?7:5, arr=`marker-end="url(#tbA)"`;
  const [x1,y1,x2,y2]=s.p||[0,0,0,0];
  if(s.t==="text") return `<g data-id="${s.id}" transform="translate(${x1},${y1})" style="cursor:grab"><text font-family="Cairo" font-size="26" font-weight="900" fill="${c}" stroke="#0e2620" stroke-width="5" paint-order="stroke" text-anchor="middle">${TB.esc(s.text||"")}</text></g>`;
  if(s.t==="zone") return `<g data-id="${s.id}"><rect x="${Math.min(x1,x2)}" y="${Math.min(y1,y2)}" width="${Math.abs(x2-x1)}" height="${Math.abs(y2-y1)}" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-width="4" stroke-dasharray="12 8"></rect></g>`;
  if(s.t==="circ") return `<g data-id="${s.id}"><ellipse cx="${(x1+x2)/2}" cy="${(y1+y2)/2}" rx="${Math.abs(x2-x1)/2}" ry="${Math.abs(y2-y1)/2}" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-width="4"></ellipse></g>`;
  if(s.t==="free") return `<g data-id="${s.id}"><polyline points="${(s.pts||[]).join(" ")}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></polyline></g>`;
  if(s.t==="drib") return `<g data-id="${s.id}"><path d="${TB.wavy(x1,y1,x2,y2)}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" ${arr}></path></g>`;
  const dash = s.t==="pass" ? `stroke-dasharray="16 11"` : "";
  return `<g data-id="${s.id}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${dash} ${arr}></line></g>`;
};

/* ── الرسم الكامل ── */
TB.scene = (st, fi, sel) => {
  const f = st.frames[fi||0] || {objs:[],shapes:[]};
  return `<defs><marker id="tbA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 Z" fill="context-stroke"></path></marker></defs>
    <rect width="${TB.W}" height="${TB.H}" fill="#1d4a3e"></rect>
    ${[...Array(8)].map((_,i)=>`<rect x="${i*TB.W/8}" width="${TB.W/8}" height="${TB.H}" fill="#20543f" opacity="${i%2?.55:0}"></rect>`).join("")}
    ${TB.pitchSvg(st.pitch)}
    ${(f.shapes||[]).map(TB.shapeSvg).join("")}
    ${(f.objs||[]).map(TB.objSvg).join("")}
    ${sel?`<g pointer-events="none">${TB.selRing(f,sel)}</g>`:""}`;
};
TB.selRing = (f,id) => {
  const o=(f.objs||[]).find(x=>x.id===id); if(!o) return "";
  return `<circle cx="${o.x}" cy="${o.y}" r="31" fill="none" stroke="#f5c518" stroke-width="3" stroke-dasharray="7 6"></circle>`;
};
TB.paint = () => {
  const svg = document.getElementById("tb_svg"); if(!svg || !TB.s) return;
  svg.innerHTML = TB.scene(TB.s, TB.s.f, TB.sel);
  const z = TB.s.zoom||1, w=TB.W/z, h=TB.H/z;
  svg.setAttribute("viewBox", `${(TB.W-w)/2} ${(TB.H-h)/2} ${w} ${h}`);
  const fr=document.getElementById("tb_frames"); if(fr) fr.innerHTML = TB.framesBar();
  const n=document.getElementById("tb_name"); if(n && n.value!==TB.s.meta.title) n.value=TB.s.meta.title;
};

/* ── التفاعل ── */
TB.pt = e => {
  const svg=document.getElementById("tb_svg"), r=svg.getBoundingClientRect();
  const vb=svg.getAttribute("viewBox").split(" ").map(Number);
  const t=e.touches?e.touches[0]:e;
  return { x: vb[0] + (t.clientX-r.left)/r.width*vb[2], y: vb[1] + (t.clientY-r.top)/r.height*vb[3] };
};
TB.bind = () => {
  const svg = document.getElementById("tb_svg"); if(!svg) return;
  let drag=null, draw=null;
  const down = e => {
    if(!TB.s) return;
    const p = TB.pt(e), f = TB.fr();
    const g = e.target.closest && e.target.closest("g[data-id]");
    if(TB.tool==="sel" || (g && TB.tool==="sel")){
      if(g){ const id=g.getAttribute("data-id");
        const o=(f.objs||[]).find(x=>x.id===id) || (f.shapes||[]).find(x=>x.id===id);
        if(o){ TB.snap(); TB.sel=id; drag={o,g,dx:p.x-(o.x!=null?o.x:(o.p||[0])[0]),dy:p.y-(o.y!=null?o.y:(o.p||[0,0])[1])};
          e.preventDefault(); return; } }
      TB.sel=null; TB.paint(); return;
    }
    if(TB.tool==="erase"){ if(g){ const id=g.getAttribute("data-id"); TB.snap();
        f.objs=(f.objs||[]).filter(x=>x.id!==id); f.shapes=(f.shapes||[]).filter(x=>x.id!==id); TB.paint(); } return; }
    if(TB.objMode){ TB.snap(); const t=TB.tool;
      const nextN = (f.objs||[]).filter(x=>x.t===t).length+1;
      const teamObj = ["p","o","gk","nt","ball","goal","mini","man","pole","lad"].indexOf(t)>=0;
      f.objs=[...(f.objs||[]), {id:TB.uid(), t, x:Math.round(p.x), y:Math.round(p.y), c:teamObj?null:TB.color,
        n:["p","o","nt"].indexOf(t)>=0?String(nextN):(t==="gk"?"GK":"")}];
      TB.paint(); e.preventDefault(); return; }
    if(TB.tool==="text"){ const t=prompt("النص على اللوح:"); if(!t) return; TB.snap();
      f.shapes=[...(f.shapes||[]), {id:TB.uid(), t:"text", p:[Math.round(p.x),Math.round(p.y)], text:t, c:TB.color}];
      TB.paint(); return; }
    TB.snap();
    draw={id:TB.uid(), t:TB.tool, p:[p.x,p.y,p.x,p.y], c:TB.color, pts:TB.tool==="free"?[Math.round(p.x)+","+Math.round(p.y)]:null};
    f.shapes=[...(f.shapes||[]), draw]; e.preventDefault();
  };
  const move = e => {
    if(!TB.s) return;
    const p = TB.pt(e);
    if(drag){ const o=drag.o;
      if(o.x!=null){ o.x=Math.round(p.x-drag.dx); o.y=Math.round(p.y-drag.dy); drag.g.setAttribute("transform",`translate(${o.x},${o.y})`); }
      else { const w=o.p[2]-o.p[0], h=o.p[3]-o.p[1]; o.p[0]=Math.round(p.x-drag.dx); o.p[1]=Math.round(p.y-drag.dy); o.p[2]=o.p[0]+w; o.p[3]=o.p[1]+h; TB.paint(); }
      e.preventDefault(); return; }
    if(draw){ draw.p[2]=Math.round(p.x); draw.p[3]=Math.round(p.y);
      if(draw.t==="free") draw.pts.push(Math.round(p.x)+","+Math.round(p.y));
      TB.paint(); e.preventDefault(); }
  };
  const up = () => {
    if(draw && draw.t!=="free" && Math.hypot(draw.p[2]-draw.p[0], draw.p[3]-draw.p[1])<14){
      const f=TB.fr(); f.shapes=f.shapes.filter(s=>s.id!==draw.id); TB.paint(); }
    if(drag) TB.paint();
    drag=null; draw=null;
  };
  svg.addEventListener("pointerdown",down); svg.addEventListener("pointermove",move);
  window.addEventListener("pointerup",up); svg.addEventListener("pointerleave",up);
  svg.style.touchAction="none";
};

/* ── أوامر الشريط ── */
window.tbTool  = t => { TB.tool=t; TB.objMode = TB.OBJ.some(o=>o[0]===t); TB.sel=null; TB.chrome(); TB.paint(); };
window.tbColor = c => { TB.color=c; TB.chrome(); };
window.tbPitch = p => { TB.s.pitch=p; TB.chrome(); TB.paint(); };
window.tbZoom  = d => { TB.s.zoom=Math.max(1,Math.min(2.4,(TB.s.zoom||1)+d)); TB.paint(); };
window.tbClear = () => { if(!confirm("تفريغ اللقطة الحالية؟")) return; TB.snap(); const f=TB.fr(); f.objs=[]; f.shapes=[]; TB.paint(); };
window.tbDel   = () => { if(!TB.sel) return toast("اختر عنصرًا أولًا",1); TB.snap(); const f=TB.fr();
  f.objs=f.objs.filter(x=>x.id!==TB.sel); f.shapes=f.shapes.filter(x=>x.id!==TB.sel); TB.sel=null; TB.paint(); };
window.tbName  = v => { TB.s.meta.title=v; };
window.tbFrameAdd = () => { TB.snap(); const cur=TB.fr();
  TB.s.frames.splice(TB.s.f+1,0,{objs:JSON.parse(JSON.stringify(cur.objs||[])),shapes:[]}); TB.s.f++; TB.paint();
  toast("لقطة جديدة — حرّك اللاعبين لترى الحركة"); };
window.tbFrameGo  = i => { TB.s.f=i; TB.sel=null; TB.paint(); };
window.tbFrameDel = () => { if(TB.s.frames.length<2) return toast("لا يمكن حذف اللقطة الوحيدة",1);
  TB.snap(); TB.s.frames.splice(TB.s.f,1); TB.s.f=Math.max(0,TB.s.f-1); TB.paint(); };
TB.framesBar = () => TB.s.frames.map((_,i)=>`<button onclick="tbFrameGo(${i})" style="flex:none;width:34px;height:34px;border-radius:50% 50% 8px 50%;background:${i===TB.s.f?"#4636e3":"rgba(255,255,255,.12)"};color:#faf8f3;border:1px solid ${i===TB.s.f?"#4636e3":"rgba(255,255,255,.22)"};font:700 13px 'Space Grotesk';cursor:pointer">${i+1}</button>`).join("")
  + `<button onclick="tbFrameAdd()" style="flex:none;width:34px;height:34px;border-radius:50% 50% 8px 50%;background:rgba(245,197,24,.16);color:#f5c518;border:1px solid rgba(245,197,24,.45);font:900 17px Cairo;cursor:pointer">＋</button>`
  + (TB.s.frames.length>1?`<button onclick="tbFrameDel()" style="flex:none;width:34px;height:34px;border-radius:50% 50% 8px 50%;background:rgba(232,83,31,.16);color:#e8531f;border:1px solid rgba(232,83,31,.4);font:900 15px Cairo;cursor:pointer">×</button>`:"");

window.tbPlay = () => {
  if(TB.s.frames.length<2) return toast("أضف لقطة ثانية لترى الحركة",1);
  if(TB.playing) return; TB.playing=true;
  const svg=document.getElementById("tb_svg"), start=TB.s.f;
  let i=0;
  const step = () => {
    if(i >= TB.s.frames.length-1){ TB.playing=false; TB.s.f=start; TB.paint(); return; }
    const A=TB.s.frames[i], B=TB.s.frames[i+1], t0=performance.now(), D=1100;
    const tick = now => {
      const k=Math.min(1,(now-t0)/D), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      const objs=(B.objs||[]).map(b=>{ const a=(A.objs||[]).find(x=>x.id===b.id)||b;
        return Object.assign({},b,{x:a.x+(b.x-a.x)*e, y:a.y+(b.y-a.y)*e}); });
      svg.innerHTML = TB.scene({pitch:TB.s.pitch, frames:[{objs, shapes:k<.45?(A.shapes||[]):(B.shapes||[])}]},0,null);
      if(k<1) requestAnimationFrame(tick); else { i++; step(); }
    };
    requestAnimationFrame(tick);
  };
  step();
};

/* ── ملء الشاشة ── */
window.tbFull = () => {
  const el=document.getElementById("tb_root"); if(!el) return;
  if(document.fullscreenElement){ document.exitFullscreen&&document.exitFullscreen(); }
  else if(el.requestFullscreen) el.requestFullscreen().catch(()=>{});
  else { TB.wide=!TB.wide; TB.chrome(); }
};

/* ── الحفظ والنشر ── */
window.tbSave = async (silent) => {
  const m=TB.s.meta;
  if(!String(m.title||"").trim() || m.title==="لوح بلا اسم"){ const t=prompt("اسم اللوح:","ضغط عالٍ — 3 ضد 2"); if(!t) return null; m.title=t; }
  const row = {owner_id:ME.id, coach_name:ME.name, org:ME.org||"", title:m.title, aim:m.aim, minutes:m.minutes,
    group_name:m.group, notes:m.notes||"", scene:{pitch:TB.s.pitch, frames:TB.s.frames}, updated_at:new Date().toISOString()};
  let res;
  if(TB.id) res = await sb.from("pi_drills").update(row).eq("id",TB.id).select("id").single();
  else      res = await sb.from("pi_drills").insert(row).select("id").single();
  if(res.error){ toast(/pi_drills/.test(res.error.message)?"لوح التكتيك لم يُفعَّل في القاعدة بعد":"تعذّر الحفظ: "+res.error.message,1); return null; }
  TB.id = res.data.id;
  if(!silent){ await trans(`حفظ لوحًا تكتيكيًا — ${m.title}`); toast("حُفظ في بنكك باسمك"); }
  return TB.id;
};
window.tbPublish = async () => {
  const id = await tbSave(true); if(!id) return;
  const roster = await CO.roster();
  if(!roster.length) return toast("لا لاعبين في كشفك بعد",1);
  const m=TB.s.meta;
  const rows = roster.map(p=>({player_name:p.name, kind:"training",
    title:"لوح تكتيكي · "+m.title,
    subtitle:`${TB.AIM[m.aim][0]} · ${m.minutes} دقيقة · ${TB.s.frames.length} لقطة${m.notes?" — "+m.notes:""} — رسمه ${ME.name} — مدرب`,
    at_time:"18:00", on_date:new Date().toISOString().slice(0,10), org:ME.org||"", needs_confirm:false, created_by:ME.name}));
  const {error} = await sb.from("calendar_items").insert(rows);
  if(error) return toast("تعذّر النشر: "+error.message,1);
  await trans(`نشر لوحًا تكتيكيًا لـ${roster.length} لاعبًا — ${m.title}`);
  toast(`وصل ${roster.length} لاعبًا — يحضرون وهم يعرفون خطتك`);
  TB.close();
};
window.tbMeta = (k,v) => { TB.s.meta[k]= k==="minutes"?(+v||15):v; TB.chrome(); };

/* ── القشرة ── */
TB.tool="sel"; TB.objMode=false; TB.color="#f5c518"; TB.sel=null; TB.wide=false;
TB.btn = (lb,on,fn,extra) => `<button onclick="${fn}" style="flex:none;background:${on?"#4636e3":"rgba(255,255,255,.1)"};color:#faf8f3;border:1px solid ${on?"#4636e3":"rgba(255,255,255,.2)"};border-radius:11px;padding:8px 11px;font:900 11px Cairo;cursor:pointer;white-space:nowrap${extra||""}">${lb}</button>`;
TB.chrome = () => {
  const el=document.getElementById("tb_bars"); if(el) el.innerHTML = TB.bars();
  const t=document.getElementById("tb_meta"); if(t) t.innerHTML = TB.metaBar();
};
TB.bars = () => `
  <div style="display:flex;gap:6px;overflow-x:auto;padding:2px 0">
    ${TB.btn("↖ تحديد", TB.tool==="sel", "tbTool('sel')")}
    ${TB.PEN.map(([k,lb])=>TB.btn(lb, TB.tool===k, `tbTool('${k}')`)).join("")}
    ${TB.btn("⌫ ممحاة", TB.tool==="erase", "tbTool('erase')")}
  </div>
  <div style="display:flex;gap:6px;overflow-x:auto;padding:2px 0">
    ${TB.OBJ.map(([k,lb])=>TB.btn(lb, TB.tool===k, `tbTool('${k}')`)).join("")}
  </div>
  <div style="display:flex;gap:6px;align-items:center;overflow-x:auto;padding:2px 0">
    ${TB.COLORS.map(c=>`<button onclick="tbColor('${c}')" style="flex:none;width:30px;height:30px;border-radius:50% 50% 7px 50%;background:${c};border:2.5px solid ${TB.color===c?"#f5c518":"rgba(255,255,255,.25)"};cursor:pointer"></button>`).join("")}
    <span style="width:1px;height:24px;background:rgba(255,255,255,.18);flex:none"></span>
    ${TB.PITCH.map(([k,lb])=>TB.btn(lb, TB.s.pitch===k, `tbPitch('${k}')`)).join("")}
  </div>`;
TB.metaBar = () => `
  <div style="display:flex;gap:6px;flex-wrap:wrap">
    ${Object.entries(TB.AIM).map(([k,[lb,c]])=>`<button onclick="tbMeta('aim','${k}')" style="background:${TB.s.meta.aim===k?c:"#faf8f3"};color:${TB.s.meta.aim===k?"#fff":"#5b6078"};border:1px solid ${TB.s.meta.aim===k?c:"#e9e4d8"};border-radius:999px;padding:6px 12px;font:900 10.5px Cairo;cursor:pointer">${lb}</button>`).join("")}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px">
    <label style="display:block"><span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:4px">المدة (دقيقة)</span>
      <input type="number" min="5" max="120" value="${TB.s.meta.minutes}" oninput="tbMeta('minutes',this.value)" class="ltr" style="width:100%;border:1px solid #e9e4d8;border-radius:11px;padding:9px;font:700 12px 'Space Grotesk';background:#faf8f3"></label>
    <label style="display:block"><span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:4px">الفئة</span>
      <select onchange="tbMeta('group',this.value)" style="width:100%;border:1px solid #e9e4d8;border-radius:11px;padding:9px;font:800 11.5px Cairo;background:#faf8f3">
        ${["كل الفئات","U15","U16","U17","U19","الفريق الأول"].map(g=>`<option ${TB.s.meta.group===g?"selected":""}>${g}</option>`).join("")}</select></label>
  </div>
  <label style="display:block;margin-top:8px"><span style="display:block;font-size:9.5px;font-weight:900;color:#8a8fa5;margin-bottom:4px">توجيهك للاعبين</span>
    <textarea oninput="tbMeta('notes',this.value)" placeholder="مثال: الضغط يبدأ من المهاجم — الكرة للجهة الضعيفة ثم إغلاق." style="width:100%;border:1px solid #e9e4d8;border-radius:11px;padding:10px;font:700 11.5px Cairo;line-height:1.9;min-height:64px;background:#faf8f3;resize:vertical">${TB.esc(TB.s.meta.notes)}</textarea></label>`;

TB.close = () => { const r=document.getElementById("tb_root"); if(r) r.remove(); document.body.style.overflow=""; render(); };
window.tbClose = () => { if(confirm("إغلاق اللوح؟ احفظ أولًا إن أردت الاحتفاظ به.")) TB.close(); };

window.openBoard = async (id) => {
  TB.id = id || null; TB.hist=[]; TB.fut=[]; TB.sel=null; TB.tool="sel"; TB.objMode=false;
  TB.s = TB.blank(); TB.s.f = 0;
  if(id){
    const {data} = await sb.from("pi_drills").select("*").eq("id",id).single();
    if(data){ TB.s.pitch=(data.scene&&data.scene.pitch)||"full"; TB.s.frames=(data.scene&&data.scene.frames)||[{objs:[],shapes:[]}];
      TB.s.meta={title:data.title, aim:data.aim||"tact", minutes:data.minutes||15, group:data.group_name||"كل الفئات", notes:data.notes||""}; }
  }
  const root=document.createElement("div"); root.id="tb_root";
  root.style.cssText="position:fixed;inset:0;z-index:300;background:#151a2e;display:flex;flex-direction:column;overflow:hidden";
  root.innerHTML=`
    <div style="flex:none;display:flex;align-items:center;gap:8px;padding:10px 12px;background:#151a2e;border-bottom:1px solid rgba(255,255,255,.1)">
      <button onclick="tbClose()" style="flex:none;width:36px;height:36px;border-radius:50% 50% 8px 50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;font:900 15px Cairo;cursor:pointer">→</button>
      <input id="tb_name" value="${TB.esc(TB.s.meta.title)}" oninput="tbName(this.value)" placeholder="اسم اللوح"
        style="flex:1;min-width:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:11px;padding:9px 11px;font:900 12.5px Cairo;color:#faf8f3">
      <button id="tb_undo" onclick="tbUndo()" style="flex:none;width:36px;height:36px;border-radius:50% 50% 8px 50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;font:900 15px Cairo;cursor:pointer;opacity:.35">↶</button>
      <button id="tb_redo" onclick="tbRedo()" style="flex:none;width:36px;height:36px;border-radius:50% 50% 8px 50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;font:900 15px Cairo;cursor:pointer;opacity:.35">↷</button>
      <button onclick="tbFull()" style="flex:none;width:36px;height:36px;border-radius:50% 50% 8px 50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#faf8f3;font:900 14px Cairo;cursor:pointer">⤢</button>
    </div>
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;padding:10px 12px;gap:8px;overflow:auto">
      <div style="flex:none;display:flex;align-items:center;gap:6px">
        <div id="tb_frames" style="flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto"></div>
        <button onclick="tbPlay()" style="flex:none;background:#f5c518;color:#151a2e;border:0;border-radius:11px;padding:8px 13px;font:900 11px Cairo;cursor:pointer">▶ شغّل</button>
      </div>
      <div style="flex:none;border-radius:16px;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.3);background:#1d4a3e">
        <svg id="tb_svg" viewBox="0 0 ${TB.W} ${TB.H}" style="width:100%;height:auto;max-height:62vh;display:block"></svg>
      </div>
      <div style="flex:none;display:flex;gap:6px;align-items:center">
        ${TB.btn("＋","","tbZoom(.2)")}${TB.btn("−","","tbZoom(-.2)")}
        <span style="flex:1"></span>
        ${TB.btn("حذف المحدَّد","","tbDel()")}${TB.btn("تفريغ","","tbClear()")}
      </div>
      <div id="tb_bars" style="flex:none;display:flex;flex-direction:column;gap:6px"></div>
      <div style="flex:none;background:#faf8f3;border-radius:18px;padding:14px">
        <b style="font-size:12.5px;font-weight:900;color:#151a2e">بطاقة التمرين</b>
        <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin:3px 0 10px">تُنشر مع اللوح في تقويم كل لاعب — باسمك وصفتك</span>
        <div id="tb_meta"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
          <button onclick="tbSave()" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:13px;padding:12px;font:900 12px Cairo;cursor:pointer">احفظ في بنكي</button>
          <button onclick="tbPublish()" style="background:#4636e3;color:#fff;border:0;border-radius:13px;padding:12px;font:900 12px Cairo;cursor:pointer;box-shadow:0 8px 18px rgba(70,54,227,.3)">انشره للفريق</button>
        </div>
        <span style="display:block;font-size:9.5px;color:#8a8fa5;font-weight:700;margin-top:9px;line-height:1.7">اللوح قرار فنّي باسمك — يدخل تقويم اللاعبين ويُسجَّل في الشفافية، ولا يمسّ تقييم أحد.</span>
      </div>
      <div style="height:8px"></div>
    </div>`;
  document.body.appendChild(root); document.body.style.overflow="hidden";
  TB.chrome(); TB.paint(); TB.bind(); TB.syncUndo();
};

/* ── شاشة: لوحاتي التكتيكية ── */
T.boards = async () => {
  const rows = await q("d", sb.from("pi_drills").select("*").eq("owner_id",ME.id).order("updated_at",{ascending:false}).limit(40));
  return `<div style="padding:18px 18px 0;display:flex;justify-content:space-between;align-items:center">
    <button onclick="go('coachHome')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">⌂</button>
    <button onclick="go('drills')" style="width:40px;height:40px;border-radius:${CO.DROP};background:#fff;border:1px solid #e9e4d8;display:grid;place-items:center;font-size:15px;cursor:pointer;font-family:Cairo">▤</button>
  </div>
  <div style="text-align:center;padding:6px 18px 0">
    <b style="display:block;font-size:26px;font-weight:900;line-height:1.3">لوحاتي التكتيكية</b>
    <span style="display:block;font-size:11px;color:#8a8fa5;font-weight:700;margin-top:2px">ارسم بيدك · احفظ في بنكك · انشرها فيحضرون جاهزين</span>
  </div>
  <main style="flex:1;padding:16px 18px 96px;display:flex;flex-direction:column;gap:12px">
    <button onclick="openBoard()" style="position:relative;overflow:hidden;background:#151a2e;border:0;border-radius:22px;padding:18px;color:#faf8f3;cursor:pointer;font-family:Cairo;text-align:start;width:100%">${CO.disc()}
      <div style="position:relative;display:flex;align-items:center;gap:14px">
        <span style="width:52px;height:52px;border-radius:50% 50% 12px 50%;background:#f5c518;color:#151a2e;display:grid;place-items:center;font-size:24px;flex:none">✎</span>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:17px;font-weight:900">لوح جديد</b>
          <span style="display:block;font-size:10.5px;color:#c6cade;font-weight:700;margin-top:3px;line-height:1.8">اسحب اللاعبين والأقمع بإصبعك · ارسم الحركة · أضف لقطات فتتحرّك · بملء الشاشة على الآيباد</span></div>
        <span style="color:#f5c518;flex:none">←</span></div></button>

    ${rows.length?rows.map(d=>{const A=TB.AIM[d.aim]||TB.AIM.tact, sc=d.scene||{frames:[]};
      return `<div style="background:#fff;border:1px solid #e9e4d8;border-radius:20px;overflow:hidden">
        <svg viewBox="0 0 ${TB.W} ${TB.H}" preserveAspectRatio="xMidYMid slice" style="width:100%;height:142px;display:block">${TB.scene({pitch:sc.pitch||"full",frames:sc.frames||[{objs:[],shapes:[]}]},0,null)}</svg>
        <div style="padding:13px 15px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <b style="font-size:13px;font-weight:900;flex:1;min-width:0">${esc(d.title)}</b>
            <span style="background:#faf8f3;border:1px solid #e9e4d8;color:${A[1]};border-radius:999px;padding:3px 9px;font-size:9.5px;font-weight:900;flex:none">${A[0]}</span></div>
          <span style="display:block;font-size:10px;color:#8a8fa5;font-weight:700;margin-top:4px"><span class="ltr">${d.minutes}</span> دقيقة · ${esc(d.group_name)} · <span class="ltr">${(sc.frames||[]).length}</span> لقطة</span>
          ${d.notes?`<span style="display:block;font-size:10.5px;color:#5b6078;font-weight:700;margin-top:6px;line-height:1.7">${esc(d.notes)}</span>`:""}
          <div style="display:grid;grid-template-columns:1fr 1fr 40px;gap:7px;margin-top:11px">
            <button onclick="openBoard('${d.id}')" style="background:#4636e3;color:#fff;border:0;border-radius:12px;padding:10px;font:900 11px Cairo;cursor:pointer">افتح وعدّل</button>
            <button onclick="boardPublish('${d.id}')" style="background:#fff;color:#151a2e;border:1px solid #e9e4d8;border-radius:12px;padding:10px;font:900 11px Cairo;cursor:pointer">انشره</button>
            <button onclick="boardDel('${d.id}')" style="background:#fff;color:#a83b25;border:1px solid #e9e4d8;border-radius:12px;padding:10px;font:900 14px Cairo;cursor:pointer">×</button></div>
        </div></div>`;}).join("")
    :CO.empty("لا لوح بعد — ابدأ لوحك الأول، وانشره فيصل تقويم كل لاعب قبل الحصة")}

    ${CO.note("اللوح أداة فنّية باسمك: يُنشر في تقاويم لاعبيك ويُسجَّل في الشفافية، ولا يمسّ رقمًا وقّعه غيرك.")}
  </main>`;
};
window.boardDel = async id => {
  if(!confirm("حذف اللوح؟")) return;
  const {error}=await sb.from("pi_drills").delete().eq("id",id);
  if(error) return toast("تعذّر الحذف",1);
  await trans("حذف لوحًا تكتيكيًا"); toast("حُذف"); render();
};
window.boardPublish = async id => {
  const {data}=await sb.from("pi_drills").select("*").eq("id",id).single();
  if(!data) return toast("تعذّر فتح اللوح",1);
  const roster = await CO.roster();
  if(!roster.length) return toast("لا لاعبين في كشفك بعد",1);
  const A=TB.AIM[data.aim]||TB.AIM.tact, nf=((data.scene||{}).frames||[]).length;
  const rows = roster.map(p=>({player_name:p.name, kind:"training", title:"لوح تكتيكي · "+data.title,
    subtitle:`${A[0]} · ${data.minutes} دقيقة · ${nf} لقطة${data.notes?" — "+data.notes:""} — رسمه ${ME.name} — مدرب`,
    at_time:"18:00", on_date:new Date().toISOString().slice(0,10), org:ME.org||"", needs_confirm:false, created_by:ME.name}));
  const {error}=await sb.from("calendar_items").insert(rows);
  if(error) return toast("تعذّر النشر: "+error.message,1);
  await trans(`نشر لوحًا تكتيكيًا لـ${roster.length} لاعبًا — ${data.title}`);
  toast(`وصل ${roster.length} لاعبًا — يحضرون وهم يعرفون خطتك`);
};

(function(){
  Object.assign(CO.TITLE, {boards:["لوحاتي التكتيكية","ارسم بيدك وانشرها لفريقك"]});
  Object.assign(TITLES, {boards:"لوحاتي التكتيكية"});
  if(typeof PL3!=="undefined") Object.assign(PL3.TITLE, CO.TITLE);
  if(typeof CO!=="undefined") CO.OWN.push("boards");
  if(typeof HUB!=="undefined"){
    HUB.ROLE.coach = [["✎","لوح التكتيك","boards","#fff6d6","#c78c00"], ...HUB.ROLE.coach.filter(x=>x[2]!=="tactics"), ["▦","التشكيل","tactics"]];
    HUB.ROLE_OK.coach.push("boards");
  }
})();
