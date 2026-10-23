/* PlayIn365 — الشارات في القاعدة لا في الشاشة (١١ سبتمبر ٢٠٢٦)
   الشارة تُختم لحظة اكتمالها بحدث وقّعه غيرك، وتحمل معها الحدث ومن وقّعه.
   لا تُمنح ولا تُشترى ولا تُحذف — وتبقى ولو تغيّر الكود. */
const BG = {};
BG.HOW = {hattrick:"ثلاثة أهداف في مباراة واحدة",scorer:"خمسة أهداف موثقة",maker:"ثلاث صناعات موثقة",
  first:"أول هدف يوقّعه حكم",clean:"ستة أحداث بلا بطاقة حمراء",regular:"عشر حصص موقّعة",
  loyal:"خمس وعشرون حصة موقّعة",duo:"هدف وصناعة في مباراة واحدة"};

/* الحدث الذي أكمل الشارة — لنكتب مصدرها لا مجرّد اسمها */
BG.proofOf = (key, evs, att) => {
  const goals = evs.filter(e=>e.type==="goal"), asts = evs.filter(e=>e.type==="assist");
  const last = arr => arr.slice().sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  const pick = e => e ? {e, by:e.recorded_by, t:(e.matches&&e.matches.title)||e.match_title||""} : null;
  switch(key){
    case "first":   return pick(last(goals)[0]);
    case "scorer":  return pick(last(goals)[4]);
    case "maker":   return pick(last(asts)[2]);
    case "hattrick":{ const per={}; for(const g of last(goals)){ per[g.match_id]=(per[g.match_id]||0)+1; if(per[g.match_id]>=3) return pick(g); } return null; }
    case "duo":     { const m={}; for(const e of last(evs)){ m[e.match_id]=m[e.match_id]||new Set(); m[e.match_id].add(e.type);
                        if(m[e.match_id].has("goal")&&m[e.match_id].has("assist")) return pick(e); } return null; }
    case "clean":   return pick(last(evs)[5]);
    case "regular": { const a=last(att)[9]; return a?{e:{id:null,match_id:null},by:a.recorded_by,t:"حصة "+String(a.created_at||"").slice(0,10)}:null; }
    case "loyal":   { const a=last(att)[24]; return a?{e:{id:null,match_id:null},by:a.recorded_by,t:"حصة "+String(a.created_at||"").slice(0,10)}:null; }
  }
  return null;
};

/* الختم: يُكتب مرة واحدة ولا يتكرّر (قيد فريد في القاعدة) */
BG.seal = async (person, evs, att) => {
  if(!person || !sb) return [];
  const earned = PL3.BADGES.filter(([k,g,nm,fn]) => { try{ return !!fn(evs, att); }catch(e){ return false; } });
  if(!earned.length) return [];
  const have = await q("b", sb.from("pi_badges").select("badge_key").eq("person", person));
  const has = new Set((have||[]).map(r=>r.badge_key));
  const fresh = earned.filter(([k])=>!has.has(k));
  if(!fresh.length) return [];
  const rows = fresh.map(([k,g,nm])=>{
    const p = BG.proofOf(k, evs, att);
    return {person, badge_key:k, title:nm, match_id:p&&p.e.match_id?String(p.e.match_id):null,
      match_title:p?p.t:null, event_id:(p&&p.e&&p.e.id&&String(p.e.id).indexOf("-")>0)?p.e.id:null,
      signed_by:p?p.by:null, proof:BG.HOW[k]||""};
  });
  const {error} = await sb.from("pi_badges").insert(rows);
  if(error){ if(!/duplicate|unique|pi_badges/.test(error.message)) console.warn("PI badges:", error.message); return []; }
  for(const r of rows) await trans(`اكتملت شارة «${r.title}» لـ${person}${r.signed_by?" — من حدث وقّعه "+r.signed_by:""}`);
  return rows;
};

/* القراءة: القاعدة أولًا، والحساب احتياطًا حتى تُختم */
BG.of = async (person, evs, att) => {
  const demo = (typeof DEMO !== "undefined" && DEMO.on);
  const rows = demo ? [] : await q("b", sb.from("pi_badges").select("*").eq("person", person).order("earned_at",{ascending:true}));
  const byKey = {}; (rows||[]).forEach(r=>byKey[r.badge_key]=r);
  return PL3.BADGES.map(([k,g,nm,fn]) => {
    const row = byKey[k];
    let live=false; try{ live = !!fn(evs||[], att||[]); }catch(e){}
    return {k, g, nm, on: !!row || live, sealed: !!row || (demo && live), row, how: BG.HOW[k]||""};
  });
};

/* ختم تلقائي حين يفتح صاحب الملف بطاقته أو خزانته */
BG.sync = async (person, evs, att) => {
  if(!ME || person !== ME.name) return;
  /* العالم التجريبي لا يُلوّث سجل الشارات الحقيقي */
  if(typeof DEMO !== "undefined" && DEMO.on) return;
  const sealed = await BG.seal(person, evs, att);
  if(sealed.length) toast(sealed.length===1 ? `اكتملت شارة «${sealed[0].title}» — خُتمت في سجلك` : `اكتملت ${sealed.length} شارات — خُتمت في سجلك`);
};
