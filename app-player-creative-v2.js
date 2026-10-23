/* PlayIn365 Player Creative V2 — additive UX polish */
(function(){
  'use strict';
  if(typeof window==='undefined') return;
  const PVC=window.PVC=window.PVC||{};
  PVC.version='2026.10.23-creative-v2';

  PVC.isPlayer=()=>{try{return !!(typeof ME!=='undefined'&&ME&&ME.role==='player')}catch(e){return false}};
  PVC.num=(s)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/);return m?Number(m[0]):0};
  PVC.decorateServices=()=>{
    document.querySelectorAll('.pv-service').forEach((el,i)=>{
      const kind=((el.querySelector('.pv-service-kind')||{}).textContent||'').includes('مشترك')?'shared':'private';
      el.dataset.pvcKind=kind; el.style.setProperty('--i',i); el.classList.add('pvc-in');
    });
  };
  PVC.glance=()=>{
    if(!PVC.isPlayer()||VIEW!=='feed'||document.querySelector('.pvc-glance')) return;
    const hero=document.querySelector('.pv-hero'); if(!hero) return;
    const k=[...document.querySelectorAll('.pv-kpis b')].map(x=>PVC.num(x.textContent));
    const verified=k[0]||0, goals=k[1]||0, assists=k[2]||0, rating=k[3]||0;
    const pending=PVC.num((document.querySelector('.pv-next-meta .warn')||{}).textContent);
    const vtxt=[...document.querySelectorAll('.pv-hero-foot span')].find(x=>(x.textContent||'').includes('زيارات'));
    const visits=PVC.num(vtxt&&vtxt.textContent);
    const momentum=Math.max(12,Math.min(100,Math.round(rating?rating*10:verified*12+goals*4+assists*3)));
    const ring=Math.round(momentum*3.6);
    hero.insertAdjacentHTML('afterend',`
      <section class="pvc-glance" aria-label="نظرة سريعة">
        <button class="pvc-glance-card pvc-momentum" onclick="PV.go('records')">
          <span class="pvc-ring" style="--p:${ring}deg"><b>${momentum}</b></span>
          <span><strong>زخمك الرياضي</strong><small>مؤشر بصري مبني على نشاطك الموثق</small></span>
        </button>
        <button class="pvc-glance-card pvc-mini ${pending?'warn':'ok'}" onclick="PV.go('opps')"><b>${pending}</b><strong>بانتظارك</strong><small>فرص أو تأكيدات</small></button>
        <button class="pvc-glance-card pvc-mini" onclick="PV.go('viewLog')"><b>${visits}</b><strong>ظهور ملفك</strong><small>زيارات حديثة</small></button>
      </section>`);
  };
  PVC.trust=()=>{
    if(!PVC.isPlayer()||VIEW!=='feed'||document.querySelector('.pvc-trustbar')) return;
    const ticker=document.querySelector('.pv-ticker'); if(!ticker) return;
    ticker.insertAdjacentHTML('afterend',`<div class="pvc-trustbar" aria-label="ثقة وخصوصية">
      <span><i></i>سجل رياضي موثّق</span><span><i></i>الخاص خاص افتراضيًا</span><span><i></i>المجتمع منفصل عن التقييم</span><span><i></i>كل اطلاع قابل للتتبع</span>
    </div>`);
  };
  PVC.scroll=()=>{
    if(!PVC.isPlayer()){document.querySelector('.pvc-scroll')?.remove();return}
    let bar=document.querySelector('.pvc-scroll');
    if(!bar){bar=document.createElement('div');bar.className='pvc-scroll';document.body.appendChild(bar)}
    const h=document.documentElement.scrollHeight-innerHeight;
    bar.style.width=(h>0?Math.max(0,Math.min(100,scrollY/h*100)):0)+'%';
  };

  PVC.renderSheet=(filter='all',q='')=>{
    if(!window.PV||!Array.isArray(PV.services)) return '';
    const term=String(q||'').trim().toLowerCase();
    const arr=PV.services.filter(([ic,t,s,v,kind])=>{
      if(filter!=='all'&&kind!==filter)return false;
      return !term||(t+' '+s+' '+v).toLowerCase().includes(term);
    });
    return arr.map(([ic,t,s,v,kind])=>`<button class="pvc-sheet-item" data-kind="${kind}" onclick="PV.go('${v}')"><span>${ic}</span><span><b>${t}</b><small>${s}</small></span></button>`).join('')||'<div class="pv-empty" style="grid-column:1/-1"><b>لا نتيجة</b><small>جرّب كلمة أخرى</small></div>';
  };
  PVC.filter=(kind,btn)=>{
    document.querySelectorAll('.pvc-filter button').forEach(x=>x.classList.remove('on')); if(btn)btn.classList.add('on');
    const input=document.getElementById('pvcServiceSearch'); const grid=document.getElementById('pvcServiceGrid');
    if(grid)grid.innerHTML=PVC.renderSheet(kind,input?input.value:''); if(input)input.dataset.kind=kind;
  };
  PVC.search=(input)=>{
    const grid=document.getElementById('pvcServiceGrid'); if(grid)grid.innerHTML=PVC.renderSheet(input.dataset.kind||'all',input.value);
  };
  PVC.openServices=()=>{
    if(!window.PV) return;
    PV.closeSheets();
    document.body.insertAdjacentHTML('beforeend',`<div class="pv-scrim" onclick="PV.closeSheets()"></div>
      <section class="pv-sheet pv-services-sheet">
        <div class="pv-sheet-grab"></div>
        <div class="pv-sheet-head"><div><b>مركز خدمات اللاعب</b><span>ابحث أو صفِّ — كل خدماتك موجودة</span></div><button onclick="PV.closeSheets()">×</button></div>
        <label class="pvc-service-search"><span>⌕</span><input id="pvcServiceSearch" data-kind="all" placeholder="ابحث عن خدمة..." oninput="PVC.search(this)"></label>
        <div class="pvc-filter"><button class="on" onclick="PVC.filter('all',this)">الكل</button><button onclick="PVC.filter('private',this)">خاص</button><button onclick="PVC.filter('shared',this)">مشترك</button></div>
        <div class="pvc-sheet-grid" id="pvcServiceGrid">${PVC.renderSheet()}</div>
      </section>`);
    setTimeout(()=>document.getElementById('pvcServiceSearch')?.focus(),120);
  };
  PVC.press=()=>{
    if(window.__pvcPressBound)return; window.__pvcPressBound=true;
    document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b)return;b.classList.add('pvc-press');setTimeout(()=>b.classList.remove('pvc-press'),160)},{passive:true});
  };
  PVC.enhance=()=>{
    if(!PVC.isPlayer()) return;
    if(window.PV) PV.openServices=PVC.openServices;
    PVC.decorateServices(); PVC.glance(); PVC.trust(); PVC.scroll(); PVC.press(); PVC.deep();
  };

  PVC.routeMeta={
    records:{g:'performance',ic:'▤',en:'PERFORMANCE',t:'السجل والأداء',s:'كل مباراة موثقة تبني قصتك الرياضية',chips:['مباريات موثقة','أهداف وصناعة','منحنى الأداء']},
    ratingDetail:{g:'performance',ic:'◔',en:'RATING MODEL',t:'تفاصيل التقييم',s:'افهم كيف يتكوّن رقمك الرياضي',chips:['منهجية واضحة','أوزان معلنة','لا حكم بلا بيانات']},
    cabinet:{g:'performance',ic:'✦',en:'TROPHY ROOM',t:'خزانة الإنجازات',s:'إنجازاتك مع دليلها وسياقها',chips:['شارات','ألقاب','أدلة موثقة']},
    opps:{g:'opportunity',ic:'◎',en:'OPPORTUNITIES',t:'الفرص والدعوات',s:'تجارب وعروض واهتمامات — في مكان واحد',chips:['دعوات','تجارب','قرارات']},
    explore:{g:'opportunity',ic:'⌖',en:'DISCOVER',t:'اكتشف حولك',s:'مباريات وملاعب وأكاديميات قريبة',chips:['خريطة','مسافة','انضم سريعًا']},
    find:{g:'opportunity',ic:'⌕',en:'UNIFIED SEARCH',t:'البحث',s:'اسم واحد يوصلك للكيان الصحيح',chips:['لاعبون','مدربون','أكاديميات']},
    health:{g:'health',ic:'⌁',en:'READINESS',t:'الصحة والجاهزية',s:'خصوصيتك الطبية أولًا — وقرار العودة للعب موثق',chips:['جاهزية','تأهيل','سجل اطلاع']},
    wallet:{g:'commerce',ic:'▦',en:'WALLET',t:'الجدول والمحفظة',s:'مواعيدك واشتراكاتك ومدفوعاتك',chips:['تقويم','اشتراكات','مدفوعات']},
    market:{g:'commerce',ic:'◆',en:'SPORTS MARKET',t:'السوق والخدمات',s:'خدمات ومنتجات رياضية مرتبطة باحتياجك',chips:['متجر','خدمات','طلبات']},
    memberships:{g:'commerce',ic:'♛',en:'MEMBERSHIPS',t:'العضويات',s:'عضويات رقمية بمزايا واضحة',chips:['خطط','مزايا','حالة العضوية']},
    messages:{g:'privacy',ic:'✉',en:'MESSAGES',t:'الرسائل',s:'تواصل بإذن — بدون فتح باب عشوائي',chips:['إذن','محادثات','سجل واضح']},
    viewLog:{g:'privacy',ic:'◉',en:'VISIBILITY LOG',t:'من رأى ملفك',s:'كل اطلاع باسم صاحبه ووقته',chips:['زيارات','صلاحيات','شفافية']},
    privacy:{g:'privacy',ic:'⌾',en:'PRIVACY',t:'الخصوصية',s:'أنت تتحكم بمن يرى ماذا ومتى',chips:['أذونات','سحب فوري','تتبّع']},
    settings:{g:'privacy',ic:'⚙',en:'PREFERENCES',t:'الإعدادات',s:'حسابك وهويتك وتفضيلاتك',chips:['الحساب','التنبيهات','ساعات الهدوء']},
    pitch:{g:'content',ic:'♟',en:'COMMUNITY',t:'المجتمع الرياضي',s:'محتوى وتفاعل — بدون خلطه بالأداء',chips:['منشورات','تفاعل','بلاغات']},
    news:{g:'content',ic:'▣',en:'SPORTS PULSE',t:'الأخبار',s:'نبض رياضي وفعاليات تهمك',chips:['أحداث','مستجدات','مباشر']}
  };
  PVC.relatedMap={
    records:[['◔','التقييم','ratingDetail'],['✦','الإنجازات','cabinet'],['◈','هويتي','publicView']],
    ratingDetail:[['▤','السجل','records'],['✦','الإنجازات','cabinet'],['◎','الفرص','opps']],
    cabinet:[['▤','الأداء','records'],['◈','هويتي','publicView'],['⇪','مشاركة','publicView']],
    opps:[['⌖','اكتشف','explore'],['⌕','ابحث','find'],['▦','تقويمي','wallet']],
    explore:[['◎','فرصي','opps'],['⌕','بحث','find'],['◈','هويتي','publicView']],
    find:[['⌖','اكتشف','explore'],['◎','فرصي','opps'],['♟','المجتمع','pitch']],
    health:[['▦','تقويمي','wallet'],['✉','الرسائل','messages'],['⌾','الخصوصية','privacy']],
    wallet:[['◆','السوق','market'],['♛','العضويات','memberships'],['◎','الفرص','opps']],
    market:[['▦','محفظتي','wallet'],['♛','العضويات','memberships'],['⌖','حولك','explore']],
    memberships:[['▦','محفظتي','wallet'],['◆','السوق','market'],['⚙','الإعدادات','settings']],
    messages:[['◉','من رأى ملفك','viewLog'],['⌾','الخصوصية','privacy'],['◎','الفرص','opps']],
    viewLog:[['⌾','الخصوصية','privacy'],['◈','هويتي','publicView'],['⚙','الإعدادات','settings']],
    privacy:[['◉','سجل الاطلاع','viewLog'],['✉','الرسائل','messages'],['⚙','الإعدادات','settings']],
    settings:[['⌾','الخصوصية','privacy'],['◈','هويتي','publicView'],['▦','المحفظة','wallet']],
    pitch:[['▣','الأخبار','news'],['⌕','البحث','find'],['⌖','اكتشف','explore']],
    news:[['♟','المجتمع','pitch'],['⌖','حولك','explore'],['◎','الفرص','opps']]
  };
  PVC.deep=()=>{
    if(!PVC.isPlayer()) return;
    const v=typeof VIEW!=='undefined'?VIEW:'';
    document.body.dataset.pvView=v;
    const meta=PVC.routeMeta[v];
    if(!meta){delete document.body.dataset.pvGroup;return}
    document.body.dataset.pvGroup=meta.g;
    const main=document.querySelector('#app .pv-legacy-main');
    if(!main)return;
    if(!main.querySelector('.pvc-route-banner')){
      main.insertAdjacentHTML('afterbegin',`<section class="pvc-route-banner">
        <div class="pvc-route-row"><span class="pvc-route-icon">${meta.ic}</span><div class="pvc-route-copy"><small>${meta.en}</small><b>${meta.t}</b><span>${meta.s}</span></div><button class="pvc-route-action" onclick="PVC.openServices()">كل الخدمات</button></div>
        <div class="pvc-route-strip">${meta.chips.map(x=>'<span>'+x+'</span>').join('')}</div>
      </section><div class="pvc-route-context"><button onclick="PV.go('feed')">⌂ مساحتي</button><button onclick="PV.go('publicView')">◈ هويتي</button><button onclick="PVC.openServices()">☰ كل الخدمات</button></div>`);
    }
    if(!main.querySelector('.pvc-related')){
      const rel=(PVC.relatedMap[v]||[]).filter(x=>{try{return typeof T[x[2]]==='function'}catch(e){return false}});
      if(rel.length)main.insertAdjacentHTML('beforeend',`<section class="pvc-related"><div class="pvc-related-head"><div><small>NEXT MOVE</small><b>قد تحتاج أيضًا</b></div><span>اختصارات ذكية</span></div><div class="pvc-related-grid">${rel.map(x=>'<button onclick="PV.go(\''+x[2]+'\')"><span>'+x[0]+'</span>'+x[1]+'</button>').join('')}</div></section>`);
    }
  };

  addEventListener('scroll',PVC.scroll,{passive:true});
  const old=window.render;
  if(typeof old==='function'){
    window.render=async function(){const r=await old.apply(this,arguments);requestAnimationFrame(PVC.enhance);return r};
    try{render=window.render}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(PVC.enhance,60));else setTimeout(PVC.enhance,60);
})();