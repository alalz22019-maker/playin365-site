/* PlayIn365 Player VNext — additive player shell; legacy services remain the source of truth. */
(function(){
  'use strict';
  if(typeof window==='undefined') return;
  const PV = window.PV = window.PV || {};
  PV.version='2026.10.23-player-vnext';
  PV.topViews=new Set(['feed','publicView','records','explore','opps']);
  PV.escape = v => (typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])));
  PV.num = v => `<span class="ltr">${PV.escape(v??'—')}</span>`;
  PV.av = (name,size=54) => (window.PL3&&PL3.av)?PL3.av(name,size,{dark:true,r:'50% 50% 50% 14px'}):`<div class="pv-avatar" style="width:${size}px;height:${size}px">${PV.escape((name||'?')[0])}</div>`;
  PV.safe = async(p,b)=>{ try{ const r=await q(p,b); return r||[]; }catch(e){ console.warn('PV',p,e); return []; } };
  PV.go = v => { PV.closeSheets(); go(v); };
  PV.closeSheets=()=>document.querySelectorAll('.pv-sheet,.pv-scrim').forEach(x=>x.remove());

  PV.services=[
    ['◈','هويتي الرياضية','بطاقتك العامة الموثقة','publicView','private'],
    ['▤','السجل والأداء','مباريات · أهداف · صناعة · تقييم','records','private'],
    ['◔','تفاصيل التقييم','منهجية الأداء وتوزيع الأوزان','ratingDetail','private'],
    ['✦','خزانة الإنجازات','ألقاب وشارات وأدلتها','cabinet','private'],
    ['◎','الفرص والدعوات','تجارب · دعوات · عروض','opps','private'],
    ['▦','الجدول والمحفظة','مواعيد · اشتراكات · مدفوعات','wallet','private'],
    ['⌁','الصحة والجاهزية','حالتك وخطة العودة للعب','health','private'],
    ['✉','الرسائل','تواصل بإذن وسجل واضح','messages','shared'],
    ['◉','من رأى ملفك','سجل الزيارات والصلاحيات','viewLog','private'],
    ['⌾','الخصوصية','تحكم كامل بمن يرى ماذا','privacy','private'],
    ['⌖','اكتشف حولك','ملاعب · مباريات · بطولات','explore','shared'],
    ['⌕','البحث','لاعبون · مدربون · أكاديميات','find','shared'],
    ['♟','المجتمع الرياضي','محتوى وتفاعل دون خلطه بالأداء','pitch','shared'],
    ['▣','الأخبار','نبض رياضي وفعاليات','news','shared'],
    ['◆','السوق والخدمات','متجر وخدمات رياضية','market','shared'],
    ['⚙','الإعدادات','الحساب والهوية والتفضيلات','settings','private']
  ];

  PV.serviceGrid=(limit)=>{
    const arr=limit?PV.services.slice(0,limit):PV.services;
    return `<div class="pv-service-grid">${arr.map(([ic,t,s,v,kind])=>`<button class="pv-service" onclick="PV.go('${v}')"><span class="pv-service-icon">${ic}</span><span class="pv-service-copy"><b>${t}</b><small>${s}</small></span><span class="pv-service-kind">${kind==='private'?'خاص':'مشترك'}</span></button>`).join('')}</div>`;
  };

  PV.openServices=()=>{
    PV.closeSheets();
    document.body.insertAdjacentHTML('beforeend',`<div class="pv-scrim" onclick="PV.closeSheets()"></div><section class="pv-sheet pv-services-sheet"><div class="pv-sheet-grab"></div><div class="pv-sheet-head"><div><b>كل خدمات اللاعب</b><span>كل شيء في مكان واحد — بدون إسقاط أي خدمة</span></div><button onclick="PV.closeSheets()">×</button></div>${PV.serviceGrid()}</section>`);
  };
  PV.toggleFab=()=>{
    const m=document.getElementById('pv-fab-menu'); if(m){m.remove();return;}
    const fab=document.getElementById('pv-fab'); if(!fab)return;
    fab.insertAdjacentHTML('beforebegin',`<div id="pv-fab-menu" class="pv-fab-menu">
      <button onclick="PV.fab('media')"><span>▣</span>أضف لقطة</button>
      <button onclick="PV.fab('join')"><span>⌗</span>اربط أكاديميتك</button>
      <button onclick="PV.fab('share')"><span>⇪</span>شارك هويتك</button>
      <button onclick="PV.fab('opp')"><span>◎</span>افتح الفرص</button>
      <button onclick="PV.openServices()"><span>⋮</span>كل الخدمات</button>
    </div>`);
  };
  PV.fab=(a)=>{
    const m=document.getElementById('pv-fab-menu'); if(m)m.remove();
    if(a==='media'){ if(typeof window.addMedia==='function') return window.addMedia(); return PV.go('myCard'); }
    if(a==='join'){ if(typeof window.joinByCode==='function') return window.joinByCode(); }
    if(a==='share'){ if(typeof window.shareCard==='function') return window.shareCard(ME.name); }
    if(a==='opp') return PV.go('opps');
  };

  PV.header=()=>{
    const top=PV.topViews.has(VIEW);
    const title={feed:'مساحتي',publicView:'هويتي الرياضية',records:'أدائي',explore:'اكتشف',opps:'فرصي'}[VIEW]||((typeof TITLES!=='undefined'&&TITLES[VIEW])||'اللاعب');
    return `<header class="pv-head"><div class="pv-head-row">
      ${top?`<button class="pv-head-btn" onclick="PV.openServices()" aria-label="كل الخدمات">☰</button>`:`<button class="pv-head-btn" onclick="PV.go('feed')" aria-label="رجوع">→</button>`}
      <button class="pv-wordmark" onclick="PV.go('feed')" aria-label="PlayIn365"><span>Play</span><em>In</em><sup>365</sup></button>
      <button class="pv-avatar-btn" onclick="PV.go('publicView')">${PV.av(ME&&ME.name,40)}</button>
    </div><div class="pv-head-title"><b>${title}</b><span>${VIEW==='feed'?'هويتك الرياضية — كل يومك في مكان واحد':'تنقّل سريع · رجوع واضح · بيانات موثقة'}</span></div></header>`;
  };

  PV.nav=()=>{
    const items=[['⌂','مساحتي','feed'],['⌕','اكتشف','explore'],['▥','أدائي','records'],['◎','فرصي','opps'],['◈','هويتي','publicView']];
    return `<nav class="pv-nav">${items.map(([i,l,v])=>`<button class="${VIEW===v?'on':''}" onclick="PV.go('${v}')"><span>${i}</span><b>${l}</b></button>`).join('')}</nav>`;
  };

  PV.newsTicker=(news,matches,opps)=>{
    const items=[];
    (news||[]).slice(0,4).forEach(n=>items.push({tag:'خبر',text:n.title||n.summary||'خبر رياضي'}));
    if(!items.length)(matches||[]).filter(m=>m.status==='live'||m.status==='today'||m.status==='open').slice(0,3).forEach(m=>items.push({tag:m.status==='live'?'مباشر':'مباراة',text:m.title+' · '+(m.match_time||'')}));
    if(items.length<3)(opps||[]).slice(0,3-items.length).forEach(o=>items.push({tag:'فرصة',text:o.title||o.kind||'فرصة جديدة'}));
    if(!items.length)items.push({tag:'PlayIn365',text:'هويتك الرياضية تبدأ من مشاركاتك الموثقة'});
    const stream=[...items,...items];
    return `<div class="pv-ticker" role="marquee"><span class="pv-ticker-label">نبضك الرياضي</span><div class="pv-ticker-window"><div class="pv-ticker-track">${stream.map(x=>`<span><i>${PV.escape(x.tag)}</i>${PV.escape(x.text)}</span>`).join('')}</div></div></div>`;
  };

  PV.spark=(vals)=>{
    const v=(vals||[]).filter(Number.isFinite).slice(-8); if(v.length<2)return `<div class="pv-spark-empty">يظهر المنحنى بعد اكتمال بيانات الأداء</div>`;
    const mn=Math.min(...v),mx=Math.max(...v),den=(mx-mn)||1;
    const pts=v.map((n,i)=>`${8+i*(184/(v.length-1))},${62-((n-mn)/den)*48}`).join(' ');
    return `<svg class="pv-spark" viewBox="0 0 200 72" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${v.map((n,i)=>`<circle cx="${8+i*(184/(v.length-1))}" cy="${62-((n-mn)/den)*48}" r="3.5"/>`).join('')}</svg>`;
  };

  const legacyFeed = T.feed;
  const legacyPublic = T.publicView;

  T.feed = async()=>{
    try{
      const [matches,joins,evs,cal,hs,att,views,opps,badges,subs,media,news] = await Promise.all([
        PV.safe('matches',sb.from('matches').select('*').order('created_at',{ascending:false}).limit(24)),
        PV.safe('joins',sb.from('match_joins').select('*,matches(title,status,match_time,venue,comp)').eq('player_id',ME.id)),
        PV.safe('events',sb.from('match_events').select('*,matches(title,comp,organizer_name)').eq('who',ME.name).order('created_at',{ascending:false}).limit(80)),
        PV.safe('calendar',sb.from('calendar_items').select('*').eq('player_name',ME.name).order('on_date',{ascending:true}).limit(20)),
        PV.safe('health',sb.from('health_status').select('*').eq('player_name',ME.name).limit(1)),
        PV.safe('attendance',sb.from('attendance').select('*').eq('player_name',ME.name).order('created_at',{ascending:false}).limit(200)),
        PV.safe('views',sb.from('pi_views').select('*').eq('subject',ME.name).order('created_at',{ascending:false}).limit(12)),
        PV.safe('opps',sb.from('pi_opps').select('*').eq('player_name',ME.name).order('created_at',{ascending:false}).limit(8)),
        PV.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).order('earned_at',{ascending:false}).limit(8)),
        PV.safe('subs',sb.from('subscriptions').select('*').eq('player_name',ME.name).order('month',{ascending:false}).limit(12)),
        PV.safe('media',sb.from('pi_media').select('*').eq('subject',ME.name).order('created_at',{ascending:false}).limit(6)),
        PV.safe('news',sb.from('pi_news').select('*').order('published_at',{ascending:false}).limit(6))
      ]);
      const next=matches.find(m=>m.status==='live')||matches.find(m=>m.status==='today')||matches.find(m=>m.status==='open');
      const per=(window.P3&&P3.byMatch)?P3.byMatch(evs):[];
      const series=per.map(g=>(window.P3&&P3.score)?P3.score(g):0).filter(Number.isFinite);
      const rating=series.length?(series.reduce((a,b)=>a+b,0)/series.length).toFixed(1):'—';
      const verified=new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
      const goals=evs.filter(e=>e.type==='goal').length, assists=evs.filter(e=>e.type==='assist').length;
      const h=hs[0];
      const pending=opps.filter(o=>!['closed','declined','done'].includes(String(o.status||'').toLowerCase())).length + cal.filter(x=>x.needs_confirm&&!x.confirmed).length + subs.filter(s=>!s.paid).length;
      const profileCode=ME.athlete_id||ME.handle||('person:'+String(ME.name||'player').toLowerCase().replace(/\s+/g,'-'));
      const age=ME.age?`U${ME.age}`:'';
      const statusMap={available:['جاهز','#39c889'],rehab:['تأهيل','#f5c518'],limited:['بقيود','#f5c518'],out:['غير متاح','#e8531f']};
      const hsx=h?(statusMap[h.state]||[h.state||'مسجل','#8f9bff']):['غير محدد','#8f9bff'];
      const today=cal.find(x=>String(x.on_date||'').slice(0,10)===new Date().toISOString().slice(0,10))||cal[0];
      const mainAction=next?{k:next.status==='live'?'مباشر الآن':'خطوتك القادمة',t:next.title||'مباراة قادمة',s:`${next.match_time||''}${next.venue?' · '+next.venue:''}`,v:'matchView',p:next.id}:{k:'ابدأ الآن',t:'اكتشف فرصة جديدة',s:'مباريات · أكاديميات · مدربون · ملاعب',v:'explore'};
      return `<div class="pv-page pv-home">
        ${PV.header()}
        <main class="pv-main">
          ${PV.newsTicker(news,matches,opps)}
          <section class="pv-hero">
            <div class="pv-hero-orbit"></div><div class="pv-hero-content">
              <div class="pv-identity-row"><div class="pv-avatar-wrap">${PV.av(ME.name,72)}<span class="pv-ready-dot" style="background:${hsx[1]}"></span></div>
                <div class="pv-identity-copy"><small>PLAYER OS · ${PV.escape(age||'PLAYER')}</small><h1>${PV.escape(ME.display_name||ME.name)}</h1><p>${PV.escape(ME.pos||'لاعب')}${ME.org?' · '+PV.escape(ME.org):''}</p><code>${PV.escape(profileCode)}</code></div>
                <button class="pv-share" onclick="PV.fab('share')">⇪</button></div>
              <div class="pv-kpis"><button onclick="PV.go('records')"><b>${PV.num(verified)}</b><span>مباراة موثقة</span></button><button onclick="PV.go('records')"><b>${PV.num(goals)}</b><span>هدف</span></button><button onclick="PV.go('records')"><b>${PV.num(assists)}</b><span>صناعة</span></button><button onclick="PV.go('ratingDetail')"><b>${PV.num(rating)}</b><span>التقييم</span></button></div>
              <div class="pv-hero-foot"><span><i style="background:${hsx[1]}"></i>${PV.escape(hsx[0])}</span><span>${badges.length} إنجازات</span><span>${views.length} زيارات حديثة</span></div>
            </div>
          </section>
          <section class="pv-next"><div class="pv-section-title"><div><small>${PV.escape(mainAction.k)}</small><b>${PV.escape(mainAction.t)}</b><span>${PV.escape(mainAction.s)}</span></div><button onclick="${mainAction.p?`go('${mainAction.v}','${PV.escape(mainAction.p)}')`:`PV.go('${mainAction.v}')`}">فتح ←</button></div>
            <div class="pv-next-meta">${today?`<span>▦ ${PV.escape(today.title||today.kind||'موعد')} · ${PV.escape(today.at_time||'')}</span>`:'<span>▦ لا موعد إضافي اليوم</span>'}<span class="${pending?'warn':''}">◔ ${pending} بانتظارك</span></div></section>
          <section><div class="pv-section-head"><div><small>اختصاراتك</small><h2>كل ما تحتاجه بسرعة</h2></div><button onclick="PV.openServices()">عرض الكل</button></div>${PV.serviceGrid(8)}</section>
          <section class="pv-performance"><div class="pv-section-head"><div><small>PERFORMANCE PULSE</small><h2>أداؤك في لمحة</h2></div><button onclick="PV.go('records')">التفاصيل</button></div>
            <div class="pv-performance-grid"><div class="pv-chart-card"><div><b>${PV.num(rating)}</b><span>متوسط الأداء</span></div>${PV.spark(series)}</div>
              <div class="pv-mini-grid"><button onclick="PV.go('cabinet')"><b>${badges.length}</b><span>شارات</span></button><button onclick="PV.go('viewLog')"><b>${views.length}</b><span>زيارات</span></button><button onclick="PV.go('calendar')"><b>${att.filter(a=>a.present).length}</b><span>حضور</span></button><button onclick="PV.go('wallet')"><b>${subs.filter(s=>!s.paid).length}</b><span>مستحق</span></button></div></div></section>
          <section class="pv-opps"><div class="pv-section-head"><div><small>FOR YOU</small><h2>فرصك الحالية</h2></div><button onclick="PV.go('opps')">كل الفرص</button></div>
            <div class="pv-horizontal">${(opps.length?opps:[{kind:'اكتشاف',title:'استكشف فرصًا حولك',org:'PlayIn365',status:'open'}]).slice(0,4).map(o=>`<button class="pv-opp-card" onclick="PV.go('opps')"><span>${PV.escape(o.kind||'فرصة')}</span><b>${PV.escape(o.title||'فرصة رياضية')}</b><small>${PV.escape(o.org||'')}</small><i>${PV.escape(o.status||'جديدة')}</i></button>`).join('')}</div></section>
          <section class="pv-private"><div class="pv-section-head"><div><small>PRIVATE ZONE</small><h2>مساحتك الخاصة</h2></div><span>لا تظهر للزائر</span></div><div class="pv-private-row"><button onclick="PV.go('health')">⌁<b>الجاهزية</b><span>${PV.escape(hsx[0])}</span></button><button onclick="PV.go('privacy')">⌾<b>الخصوصية</b><span>تحكم كامل</span></button><button onclick="PV.go('messages')">✉<b>الرسائل</b><span>بإذن</span></button><button onclick="PV.go('wallet')">▦<b>المحفظة</b><span>اشتراكاتك</span></button></div></section>
          <section class="pv-media"><div class="pv-section-head"><div><small>YOUR STORY</small><h2>لقطاتك وإنجازاتك</h2></div><button onclick="PV.fab('media')">+ إضافة</button></div>
            <div class="pv-media-strip">${media.length?media.slice(0,5).map((m,i)=>`<button onclick="PV.go('publicView')" class="pv-media-card"><span>${m.kind==='video'?'▶':'▣'}</span><b>${PV.escape(m.label||m.match_title||'لقطة رياضية')}</b><small>${PV.escape(m.match_title||'موثقة في ملفك')}</small></button>`).join(''):`<button class="pv-media-empty" onclick="PV.fab('media')"><span>＋</span><b>أضف أول لقطة</b><small>صورة أو فيديو ويمكن ربطها بحدث موثّق</small></button>`}</div></section>
          <section class="pv-all"><div class="pv-section-head"><div><small>PLAYER SERVICES</small><h2>جميع خدمات اللاعب</h2></div><button onclick="PV.openServices()">الخريطة الكاملة</button></div>${PV.serviceGrid()}</section>
        </main>${PV.nav()}</div>`;
    }catch(e){ console.error('PV feed',e); return legacyFeed(); }
  };

  T.publicView = async()=>{
    try{
      const who=PARAM||ME.name, owner=who===ME.name;
      const [pf,evs,joins,att,badges,media,visits]=await Promise.all([
        PV.safe('pf',sb.from('profiles').select('*').eq('name',who).limit(1)),
        PV.safe('ev',sb.from('match_events').select('*,matches(title,comp,organizer_name)').eq('who',who).order('created_at',{ascending:false}).limit(120)),
        PV.safe('jn',sb.from('match_joins').select('*,matches(title,comp)').eq('player_name',who)),
        PV.safe('at',sb.from('attendance').select('*').eq('player_name',who).limit(300)),
        PV.safe('bd',sb.from('pi_badges').select('*').eq('person',who).order('earned_at',{ascending:false}).limit(12)),
        PV.safe('md',sb.from('pi_media').select('*').eq('subject',who).order('created_at',{ascending:false}).limit(12)),
        PV.safe('vw',sb.from('pi_views').select('*').eq('subject',who).order('created_at',{ascending:false}).limit(12))
      ]);
      const P=pf[0]||(owner?ME:{name:who});
      if(!owner && window.VW&&VW.log) VW.log(who,'profile','فتح الملف العام');
      const per=(window.P3&&P3.byMatch)?P3.byMatch(evs):[];
      const series=per.map(g=>(window.P3&&P3.score)?P3.score(g):0).filter(Number.isFinite);
      const rating=series.length?(series.reduce((a,b)=>a+b,0)/series.length).toFixed(1):'—';
      const verified=new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
      const goals=evs.filter(e=>e.type==='goal').length, assists=evs.filter(e=>e.type==='assist').length;
      const age=P.age?`U${P.age}`:'';
      const code=P.athlete_id||P.handle||('person:'+String(P.name||'player').toLowerCase().replace(/\s+/g,'-'));
      const comps=[...new Set(evs.map(e=>e.matches&&e.matches.comp).filter(Boolean))];
      return `<div class="pv-page pv-public">
        <header class="pv-public-head"><button onclick="${owner?"PV.go('feed')":"back()"}">→</button><span>هوية رياضية · عرض الزائر</span><button onclick="shareCard('${PV.escape(who)}')">⇪</button></header>
        <main class="pv-main">
          <section class="pv-passport"><div class="pv-passport-watermark">ONE<br>IDENTITY</div><div class="pv-passport-top"><div class="pv-wordmark static"><span>Play</span><em>In</em><sup>365</sup></div><small>DIGITAL SPORTS IDENTITY</small></div>
            <div class="pv-passport-person"><div class="pv-passport-avatar">${PV.av(P.name,92)}<span>موثقة بالمسار الرياضي</span></div><div><small>${PV.escape(age)} · ${PV.escape(P.pos||'لاعب')}</small><h1>${PV.escape(P.display_name||P.name)}</h1><p>${PV.escape(P.org||'لا توجد جهة حالية')}</p><code>${PV.escape(code)}</code></div></div>
            <div class="pv-shirt"><span>${P.shirt||'10'}</span><small>PLAYIN365</small></div>
            <div class="pv-passport-stats"><div><b>${verified}</b><span>مباراة</span></div><div><b>${goals}</b><span>هدف</span></div><div><b>${assists}</b><span>صناعة</span></div><div><b>${rating}</b><span>تقييم</span></div></div>
            <div class="pv-passport-actions">${owner?`<button onclick="PV.fab('media')">+ أضف لقطة</button><button onclick="PV.go('settings')">تعديل هويتك</button>`:`<button class="primary" onclick="PV.go('messages')">تواصل</button><button onclick="PV.go('opps')">دعوة / فرصة</button>`}</div></section>
          <section class="pv-profile-performance"><div class="pv-section-head"><div><small>PERFORMANCE</small><h2>أثر موثّق، لا مجرد أرقام</h2></div><button onclick="${owner?"PV.go('records')":"void(0)"}">${owner?'التفاصيل':''}</button></div><div class="pv-profile-score"><div><b>${rating}</b><span>/ 10</span><small>${verified} مباراة موثقة</small></div>${PV.spark(series)}</div></section>
          <section><div class="pv-section-head"><div><small>THE TROPHY ROOM</small><h2>الإنجازات والشارات</h2></div>${owner?`<button onclick="PV.go('cabinet')">الخزانة</button>`:''}</div><div class="pv-badges">${badges.length?badges.slice(0,8).map(b=>`<div><span>✦</span><b>${PV.escape(b.title||b.badge_key)}</b><small>${PV.escape(b.match_title||b.signed_by||'موثق')}</small></div>`).join(''):`<div class="pv-empty"><span>✦</span><b>المسار قيد التكوين</b><small>كل إنجاز موثّق سيظهر هنا</small></div>`}</div></section>
          <section><div class="pv-section-head"><div><small>CAREER MAP</small><h2>مسيرته الرياضية</h2></div><span>${comps.length} مسابقات</span></div><div class="pv-career"><div><b>${att.filter(a=>a.present).length}</b><span>حضور تدريبي</span></div><div><b>${comps.length}</b><span>مسابقات</span></div><div><b>${new Set(evs.map(e=>e.matches&&e.matches.organizer_name).filter(Boolean)).size}</b><span>جهات موثقة</span></div><div><b>${badges.length}</b><span>إنجازات</span></div></div></section>
          <section><div class="pv-section-head"><div><small>MEDIA</small><h2>لقطات من مسيرته</h2></div>${owner?`<button onclick="PV.fab('media')">+ إضافة</button>`:''}</div><div class="pv-gallery">${media.length?media.map(m=>`<article><span>${m.kind==='video'?'▶':'▣'}</span><b>${PV.escape(m.label||m.match_title||'لقطة')}</b><small>${PV.escape(m.match_title||m.event_type||'')}</small></article>`).join(''):`<div class="pv-empty"><span>▣</span><b>لا لقطات عامة بعد</b><small>خصوصية اللاعب مقدمة على ملء الصفحة</small></div>`}</div></section>
          <section class="pv-public-trust"><div><b>ما الذي يراه الزائر؟</b><p>الهوية العامة، السجل الرياضي الموثق، الأداء، الإنجازات واللقطات المنشورة فقط.</p></div><div><b>ما الذي يبقى خاصًا؟</b><p>الصحة، الرسائل، المحفظة، المواعيد الخاصة وإعدادات الحساب لا تظهر هنا.</p></div></section>
          ${owner?`<section class="pv-owner-insight"><div><b>${visits.length}</b><span>زيارة حديثة لملفك</span></div><button onclick="PV.go('viewLog')">من زار ملفك ←</button></section>`:''}
        </main>${owner?PV.nav():''}</div>`;
    }catch(e){console.error('PV public',e);return legacyPublic();}
  };
  T.myCard=T.publicView;

  if(window.PL3){ PL3.nav=PV.nav; PL3.header=PV.header; PL3.navItems=[]; }
  if(typeof NAV!=='undefined') NAV.player=[];
  if(typeof TITLES!=='undefined') Object.assign(TITLES,{feed:'مساحتي',publicView:'هويتي الرياضية',records:'أدائي',explore:'اكتشف',opps:'فرصي'});

  const prevRender=window.render;
  window.render=render=async function(){
    /* Deterministic shell: never let a quick-action/menu from a previous route leak
       into auth, public visitor mode, or another role. */
    document.querySelectorAll('#pv-fab,#pv-fab-menu,.pv-sheet,.pv-scrim').forEach(n=>n.remove());
    document.body.classList.remove('pvnext-active');
    const before=document.getElementById('app'); if(before) before.classList.remove('pvnext-shell');
    await prevRender();
    try{
      if(!ME||ME.role!=='player'||VIEW==='auth'||VIEW==='role') return;
      document.body.classList.add('pvnext-active');
      const app=document.getElementById('app'); if(app) app.classList.add('pvnext-shell');
      if(VIEW!=='publicView'){
        document.body.insertAdjacentHTML('beforeend',`<button id="pv-fab" class="pv-fab" onclick="PV.toggleFab()" aria-label="إجراءات سريعة">＋</button>`);
      }
      document.querySelectorAll('.nav').forEach(n=>{ if(!n.classList.contains('pv-nav')) n.style.display='none'; });
    }catch(e){console.warn('PV decorate',e);}
  };
})();