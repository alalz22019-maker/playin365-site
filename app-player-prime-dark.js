/* PlayIn365 — Player Prime Dark enhancer */
(function(){
'use strict';
if(typeof window==='undefined')return;
const PD=window.PD=window.PD||{};
PD.safe=async(name,b)=>{try{return await q(name,b)||[]}catch(e){console.warn('PD',name,e);return[]}};
PD.isPlayer=()=>{try{return typeof ME!=='undefined'&&ME&&ME.role==='player'}catch(e){return false}};
PD.matchBar=async()=>{
  const main=document.querySelector('#app .pv-main'); if(!main||document.querySelector('.pd-pulse'))return;
  const matches=await PD.safe('pd_matches',sb.from('matches').select('*').order('created_at',{ascending:false}).limit(12));
  const hot=matches.filter(m=>['live','today','open'].includes(m.status)).slice(0,2);
  const a=hot[0]||{title:'لا مباراة نشطة الآن',comp:'PlayIn365',match_time:'—'};
  const b=hot[1]||{title:'استكشف مباريات حولك',comp:'فرص',match_time:'—'};
  main.insertAdjacentHTML('afterbegin',`<section class="pd-pulse">
    <div class="pd-pulse-head"><div><b>نبض الملعب</b><span>مبارياتك وما يحدث حولك</span></div><button onclick="PV.go('explore')">عرض الكل ←</button></div>
    <div class="pd-pulse-tabs"><span class="on">الكل</span><span>روشن</span><span>الأبطال</span><span>بطولات</span><span>تجارب</span></div>
    <div class="pd-pulse-games"><button class="pd-game" onclick="PV.go('explore')" style="background:none;border:0;text-align:start;font-family:Cairo"><small>${PV.escape(a.comp||'مباراة')}</small><b>${PV.escape(a.title||'')}</b><span>${PV.escape(a.match_time||'')}</span></button><button class="pd-game" onclick="PV.go('explore')" style="background:none;border:0;text-align:start;font-family:Cairo"><small>${PV.escape(b.comp||'فرصة')}</small><b>${PV.escape(b.title||'')}</b><span>${PV.escape(b.match_time||'')}</span></button></div>
  </section>
  <div class="pd-safety"><i>▣</i> ملفك الرياضي موثّق · الخاص لا يظهر للزائر · كل اطلاع قابل للتتبع</div>
  <nav class="pd-tabs"><button class="on" onclick="PV.go('feed')"><i>⌂</i><b>مساحتي</b></button><button onclick="PV.go('records')"><i>▥</i><b>أدائي</b></button><button onclick="PV.go('wallet')"><i>▦</i><b>مشاركاتي</b></button><button onclick="PV.go('opps')"><i>◎</i><b>فرصي</b></button><button onclick="PV.go('publicView')"><i>◈</i><b>هويتي</b></button></nav>`);
};
PD.classify=()=>{
  if(!PD.isPlayer())return;
  document.body.classList.add('pd-player');
  const main=document.querySelector('#app .pv-main');
  if(main){
    [...main.querySelectorAll('section')].forEach(s=>{
      const h=(s.querySelector('h2')||{}).textContent||'';
      if(h.includes('كل ما تحتاجه بسرعة'))s.classList.add('pd-shortcuts');
    });
  }
  const ticker=document.querySelector('.pv-ticker-label');if(ticker)ticker.textContent='نبضك الرياضي';
};
PD.trophy=async()=>{
  if(!PD.isPlayer()||VIEW!=='feed'||document.querySelector('.pd-trophy'))return;
  const anchor=document.querySelector('.pv-next');if(!anchor)return;
  const badges=await PD.safe('pd_badges',sb.from('pi_badges').select('*').eq('person',ME.name).order('earned_at',{ascending:false}).limit(3));
  const defaults=[
    {title:'بطلك القادم',sub:'إنجاز موثّق جديد',ic:'♛'},
    {title:'هاتريك',sub:'أهداف موثّقة',ic:'⚽'},
    {title:'ثقة المدرب',sub:'مشاركات متتالية',ic:'10'}
  ];
  const list=(badges.length?badges.map((x,i)=>({title:x.title||x.name||'إنجاز',sub:x.story||x.description||'موثّق في سجلك',ic:i===0?'♛':i===1?'⚽':'★'})):defaults).slice(0,3);
  anchor.insertAdjacentHTML('afterend',`<section class="pd-trophy">
    <div class="pd-trophy-top"><small>THE TROPHY ROOM / 2026</small><button onclick="PV.go('cabinet')">خزانة الألقاب ←</button></div>
    <h2>${badges.length?'لحظات تستاهل الذهب.':'الإنجاز القادم يبدأ من هنا.'}</h2>
    <p>${badges.length?'كل لقب بدليله وسياقه الرياضي.':'شارك، وثّق، وتطور — ثم دع سجلك يتكلم.'}</p>
    <div class="pd-trophy-grid">${list.map(x=>`<div class="pd-medal"><span>${PV.escape(x.ic)}</span><b>${PV.escape(x.title)}</b><small>${PV.escape(x.sub)}</small></div>`).join('')}</div>
  </section>`);
};
PD.cleanup=()=>{
  if(!PD.isPlayer()){document.body.classList.remove('pd-player');return}
  document.querySelectorAll('.pvc-glance,.pvc-trustbar,.pvc-route-banner,.pvc-route-context,.pvc-related').forEach(n=>n.remove());
};
PD.enhance=async()=>{PD.cleanup();PD.classify();if(VIEW==='feed'){await PD.matchBar();await PD.trophy();}};
const old=window.render;
if(typeof old==='function'){
 window.render=async function(){const r=await old.apply(this,arguments);try{await PD.enhance()}catch(e){console.warn('PD enhance',e)}return r};
 try{render=window.render}catch(e){}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(PD.enhance,80));else setTimeout(PD.enhance,80);
})();