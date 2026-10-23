
(function(){
'use strict';
if(typeof window==='undefined'||!window.PR)return;
const CV=window.CV={version:'2026.10.23-cinematic-v2'};
const STADIUM="https://images.unsplash.com/photo-1767916732786-a83902ffc25c?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=72&w=1800";
const PLAYER="https://images.unsplash.com/photo-1761225091881-0d3bda9f6d5a?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=78&w=1500";
CV.close=()=>{PR.close();document.getElementById('cvFabMenu')?.remove()};
CV.go=(v,p)=>{CV.close();go(v,p)};
CV.brand=()=>'<span class="cv-brand"><span class="play">Play</span><span class="in">In</span><sup>365</sup></span>';
CV.photo=(p,cls)=>'<div class="'+cls+'">'+(p&&p.avatar_url?'<img src="'+PR.e(p.avatar_url)+'" alt="">':'<span class="cv-fallback"></span>')+'</div>';
CV.top=(pub,back)=>'<header class="'+(pub?'cv-public-top':'cv-top')+'"><button class="cv-side" onclick="'+back+'">←</button><button style="border:0;background:none" onclick="window.CV.go(\'feed\')">'+CV.brand()+'</button><button class="cv-side" onclick="'+(pub?'if(window.shareCard)shareCard(ME.name)':'PR.openServices()')+'">'+(pub?'⇪':'◈')+'</button></header>';
CV.nav=()=>{const a=[['⌂','الرئيسية','feed'],['◎','الفرص','opps'],['◈','الخدمات','services'],['▤','أدائي','records'],['♡','هويتي','publicView']];return'<nav class="cv-nav">'+a.map(x=>x[2]==='services'?'<button onclick="window.PR.openServices()"><span>'+x[0]+'</span><b>'+x[1]+'</b></button>':'<button class="'+(VIEW===x[2]?'on':'')+'" onclick="window.CV.go(\''+x[2]+'\')"><span>'+x[0]+'</span><b>'+x[1]+'</b></button>').join('')+'</nav>'};
CV.toggleFab=()=>{const m=document.getElementById('cvFabMenu');if(m){m.remove();return}document.getElementById('cvFab')?.insertAdjacentHTML('beforebegin','<div class="cv-fab-menu" id="cvFabMenu"><button onclick="window.CV.fab(\'share\')"><span>⇪</span>شارك هويتك</button><button onclick="window.CV.fab(\'media\')"><span>▣</span>أضف لقطة</button><button onclick="window.CV.go(\'opps\')"><span>◎</span>افتح الفرص</button><button onclick="window.PR.openServices()"><span>◈</span>كل الخدمات</button></div>')};
CV.fab=a=>{document.getElementById('cvFabMenu')?.remove();if(a==='share'&&typeof shareCard==='function')return shareCard(ME.name);if(a==='media'){if(typeof addMedia==='function')return addMedia();return CV.go('publicView')}};
CV.spark=vals=>{const v=(vals||[]).filter(Number.isFinite).slice(-8);if(v.length<2)return'<div style="height:82px;display:flex;align-items:end;font-size:8px;color:#8f96ab">يظهر منحنى الأداء بعد اكتمال البيانات</div>';const mn=Math.min(...v),mx=Math.max(...v),d=(mx-mn)||1,pts=v.map((n,i)=>(8+i*(184/(v.length-1)))+','+(67-((n-mn)/d)*49)).join(' ');return'<svg viewBox="0 0 200 78" preserveAspectRatio="none"><polyline points="'+pts+'" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+v.map((n,i)=>'<circle cx="'+(8+i*(184/(v.length-1)))+'" cy="'+(67-((n-mn)/d)*49)+'" r="3.5"/>').join('')+'</svg>'};
CV.news=(news,matches,opps)=>{const a=[];(news||[]).slice(0,3).forEach(n=>a.push(['NEWS',n.title||n.summary||'خبر رياضي']));if(a.length<3)(matches||[]).filter(m=>['live','today','open'].includes(m.status)).slice(0,3-a.length).forEach(m=>a.push([m.status==='live'?'LIVE':'MATCH',(m.title||'مباراة')+(m.match_time?' · '+m.match_time:'')]));if(a.length<3)(opps||[]).slice(0,3-a.length).forEach(o=>a.push(['OPPORTUNITY',o.title||o.kind||'فرصة جديدة']));if(!a.length)a.push(['PLAYIN365','هويتك الرياضية تتحرك مع كل مشاركة موثقة']);const s=[...a,...a];return'<div class="cv-news"><strong><i class="cv-live"></i>PLAYIN NOW</strong><div class="cv-news-window"><div class="cv-news-track">'+s.map(x=>'<span><i>'+PR.e(x[0])+'</i>'+PR.e(x[1])+'</span>').join('')+'</div></div></div>'};

const baseFeed=T.feed,basePublic=T.publicView;
T.feed=async()=>{
 if(!PR.isPlayer())return baseFeed();
 try{
  const [matches,joins,evs,cal,hs,att,views,opps,badges,subs,news]=await Promise.all([
   PR.safe('cvm',sb.from('matches').select('*').order('created_at',{ascending:false}).limit(24)),
   PR.safe('cvj',sb.from('match_joins').select('*,matches(title,status,match_time,venue,comp)').eq('player_id',ME.id)),
   PR.safe('cve',sb.from('match_events').select('*,matches(title,comp,organizer_name)').eq('who',ME.name).order('created_at',{ascending:false}).limit(100)),
   PR.safe('cvc',sb.from('calendar_items').select('*').eq('player_name',ME.name).limit(20)),
   PR.safe('cvh',sb.from('health_status').select('*').eq('player_name',ME.name).limit(1)),
   PR.safe('cva',sb.from('attendance').select('*').eq('player_name',ME.name).limit(250)),
   PR.safe('cvv',sb.from('pi_views').select('*').eq('subject',ME.name).limit(20)),
   PR.safe('cvo',sb.from('pi_opps').select('*').eq('player_name',ME.name).limit(10)),
   PR.safe('cvb',sb.from('pi_badges').select('*').eq('person',ME.name).limit(10)),
   PR.safe('cvs',sb.from('subscriptions').select('*').eq('player_name',ME.name).limit(20)),
   PR.safe('cvn',sb.from('pi_news').select('*').limit(8))
  ]);
  const per=window.P3&&P3.byMatch?P3.byMatch(evs):[],series=per.map(g=>window.P3&&P3.score?P3.score(g):0).filter(Number.isFinite);
  const rating=series.length?(series.reduce((a,b)=>a+b,0)/series.length).toFixed(1):'—';
  const verified=new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  const goals=evs.filter(e=>e.type==='goal').length,assists=evs.filter(e=>e.type==='assist').length;
  const next=matches.find(m=>m.status==='live')||matches.find(m=>m.status==='today')||matches.find(m=>m.status==='open');
  const h=hs[0],states={available:['جاهز','#45d2a0'],rehab:['تأهيل','#f6c84c'],limited:['بقيود','#f6c84c'],out:['غير متاح','#ff5d73']},hx=h?(states[h.state]||[h.state||'مسجل','#8f75ff']):['غير محدد','#8f75ff'];
  const pending=opps.filter(o=>!['closed','declined','done'].includes(String(o.status||'').toLowerCase())).length+cal.filter(x=>x.needs_confirm&&!x.confirmed).length+subs.filter(s=>!s.paid).length;
  const code=ME.athlete_id||ME.handle||('person:'+String(ME.name||'player').toLowerCase().replace(/\s+/g,'-'));
  const quick=PR.services.filter(x=>['records','opps','wallet','health','messages','viewLog'].includes(x[3]));
  const updateSeed=(news||[]).slice(0,3);while(updateSeed.length<3)updateSeed.push({title:updateSeed.length===0?'كأس الصيف للأكاديميات':updateSeed.length===1?'تجربة أداء جديدة':'مباراة مفتوحة',summary:''});
  const bg=[STADIUM,PLAYER,STADIUM];
  return '<div class="cv-page">'+CV.top(false,'PR.openServices()')+'<main class="cv-main">'+CV.news(news,matches,opps)+
   '<section class="cv-hero"><div class="cv-hero-bg"></div><div class="cv-hero-glow"></div><div class="cv-hero-grain"></div><div class="cv-hero-inner">'+
    '<div class="cv-hero-kicker"><span class="cv-chip">هويتك الرياضية</span><button class="cv-share" onclick="window.CV.fab(\'share\')">⇪</button></div>'+
    '<div class="cv-player-stage">'+CV.photo(ME,'cv-drop-photo')+'<div class="cv-player-copy"><small>PLAYER OS · '+PR.e(ME.age?'U'+ME.age:'ATHLETE')+'</small><h1>'+PR.e(ME.display_name||ME.name)+'</h1><p>'+PR.e(ME.pos||'لاعب')+(ME.org?' · '+PR.e(ME.org):'')+'</p><code>'+PR.e(code)+'</code></div></div>'+
    '<div class="cv-next"><small>'+(next&&next.status==='live'?'LIVE NOW':'NEXT MOVE')+'</small><b>'+PR.e(next?next.title:'اكتشف فرصتك القادمة')+'</b><p>'+PR.e(next?[(next.match_time||''),(next.venue||'')].filter(Boolean).join(' · '):'مباريات · أكاديميات · تجارب أداء')+'</p><button onclick="'+(next?"go('matchView','"+PR.e(next.id)+"')":"CV.go('explore')")+'">'+(next?'فتح تفاصيل المباراة':'اكتشف حولك')+' ←</button></div>'+
    '<div class="cv-proof"><div><b>'+verified+'</b><span>مباراة</span></div><div><b>'+goals+'</b><span>هدف</span></div><div><b>'+assists+'</b><span>صناعة</span></div><div><b>'+PR.e(rating)+'</b><span>تقييم</span></div></div>'+
   '</div></section>'+
   '<section><div class="cv-head"><div><small>PLAYER HUB</small><h2>كل شيء قريب منك</h2></div><button onclick="window.PR.openServices()">كل الخدمات</button></div><div class="cv-launch">'+quick.map(x=>'<button onclick="window.CV.go(\''+x[3]+'\')"><i>'+x[0]+'</i><b>'+x[1]+'</b><small>'+x[2]+'</small></button>').join('')+'</div></section>'+
   '<section><div class="cv-head"><div><small>SPORTS PULSE</small><h2>آخر المستجدات</h2></div><button onclick="window.CV.go(\'news\')">عرض الكل</button></div><div class="cv-updates">'+updateSeed.map((n,i)=>'<button class="cv-update" onclick="window.CV.go(\'news\')"><div class="cv-update-bg" style="background-image:url('+bg[i]+')"></div><div class="cv-update-copy"><span>'+(i===0?'بطولة':i===1?'فرصة':'مباراة')+'</span><b>'+PR.e(n.title||'مستجد رياضي')+'</b><small>'+PR.e(n.summary||'من نبض PlayIn365')+'</small></div></button>').join('')+'</div></section>'+
   '<section><div class="cv-head"><div><small>PERFORMANCE MIX</small><h2>أداؤك بصورة يفهمها الجميع</h2></div><button onclick="window.CV.go(\'records\')">التفاصيل</button></div><div class="cv-performance"><div class="cv-chart"><div class="cv-chart-head"><div><small>FORM INDEX</small><b>'+PR.e(rating)+'</b></div><small>'+verified+' مباريات</small></div>'+CV.spark(series)+'<div class="cv-bars"><div class="cv-bar"><span>تهديف</span><div class="cv-bar-track"><div class="cv-bar-fill" style="width:'+Math.min(100,goals*13+24)+'%"></div></div><b>'+goals+'</b></div><div class="cv-bar"><span>صناعة</span><div class="cv-bar-track"><div class="cv-bar-fill" style="width:'+Math.min(100,assists*17+20)+'%"></div></div><b>'+assists+'</b></div><div class="cv-bar"><span>ثبات</span><div class="cv-bar-track"><div class="cv-bar-fill" style="width:'+Math.min(100,verified*10+22)+'%"></div></div><b>'+verified+'</b></div></div></div><div class="cv-sidecards"><button onclick="window.CV.go(\'cabinet\')"><b>'+badges.length+'</b><span>إنجازات</span></button><button onclick="window.CV.go(\'viewLog\')"><b>'+views.length+'</b><span>ظهور ملفك</span></button><button onclick="window.CV.go(\'wallet\')"><b>'+att.filter(a=>a.present).length+'</b><span>حضور موثق</span></button></div></div></section>'+
   '<section><div class="cv-head"><div><small>OPPORTUNITIES</small><h2>فرص تستاهل تتحرك لها</h2></div><button onclick="window.CV.go(\'opps\')">كل الفرص</button></div><div class="cv-opps">'+(opps.length?opps:[{kind:'اكتشاف',title:'ابدأ باكتشاف الفرص حولك',org:'PlayIn365',status:'open'}]).slice(0,5).map(o=>'<button class="cv-opp" onclick="window.CV.go(\'opps\')"><span>'+PR.e(o.kind||'فرصة')+'</span><b>'+PR.e(o.title||'فرصة رياضية')+'</b><small>'+PR.e(o.org||'')+'</small><i>'+PR.e(o.status||'جديدة')+'</i></button>').join('')+'</div></section>'+
   '<section class="cv-private"><div class="cv-head"><div><small>PRIVATE ZONE</small><h2>مساحتك الخاصة</h2></div><button onclick="window.CV.go(\'privacy\')">إدارة الخصوصية</button></div><div class="cv-private-grid"><button onclick="window.CV.go(\'health\')"><span>⌁</span><b>الجاهزية</b><small>'+PR.e(hx[0])+'</small></button><button onclick="window.CV.go(\'messages\')"><span>✉</span><b>الرسائل</b><small>بإذن</small></button><button onclick="window.CV.go(\'wallet\')"><span>▦</span><b>المحفظة</b><small>'+pending+' بانتظارك</small></button><button onclick="window.CV.go(\'viewLog\')"><span>◉</span><b>من رآك</b><small>'+views.length+' زيارة</small></button></div></section>'+
  '</main>'+CV.nav()+'<button id="cvFab" class="cv-fab" onclick="window.CV.toggleFab()">＋</button></div>';
 }catch(e){console.error('CV feed',e);return baseFeed()}
};

T.publicView=async()=>{
 try{
  const who=PARAM||ME.name,owner=who===ME.name;
  const [pf,evs,joins,att,badges,media,visits]=await Promise.all([
   PR.safe('cvpp',sb.from('profiles').select('*').eq('name',who).limit(1)),
   PR.safe('cvpe',sb.from('match_events').select('*,matches(title,comp,organizer_name)').eq('who',who).order('created_at',{ascending:false}).limit(120)),
   PR.safe('cvpj',sb.from('match_joins').select('*,matches(title,comp)').eq('player_name',who)),
   PR.safe('cvpa',sb.from('attendance').select('*').eq('player_name',who).limit(300)),
   PR.safe('cvpb',sb.from('pi_badges').select('*').eq('person',who).limit(12)),
   PR.safe('cvpm',sb.from('pi_media').select('*').eq('subject',who).limit(12)),
   PR.safe('cvpv',sb.from('pi_views').select('*').eq('subject',who).limit(20))
  ]);
  const P=pf[0]||(owner?ME:{name:who});
  if(!owner&&window.VW&&VW.log)VW.log(who,'profile','فتح الملف العام');
  const per=window.P3&&P3.byMatch?P3.byMatch(evs):[],series=per.map(g=>window.P3&&P3.score?P3.score(g):0).filter(Number.isFinite);
  const rating=series.length?(series.reduce((a,b)=>a+b,0)/series.length).toFixed(1):'—';
  const verified=new Set([...evs.map(e=>e.match_id),...joins.filter(j=>j.attended).map(j=>j.match_id)]).size;
  const goals=evs.filter(e=>e.type==='goal').length,assists=evs.filter(e=>e.type==='assist').length;
  const comps=[...new Set(evs.map(e=>e.matches&&e.matches.comp).filter(Boolean))],orgs=[...new Set(evs.map(e=>e.matches&&e.matches.organizer_name).filter(Boolean))];
  const code=P.athlete_id||P.handle||('person:'+String(P.name||'player').toLowerCase().replace(/\s+/g,'-'));
  const reel=media.length?media.slice(0,6):[{label:'لقطة من مسيرته',url:PLAYER,kind:'video'},{label:'مباراة تحت الأضواء',url:STADIUM,kind:'image'},{label:'تجربة أداء',url:PLAYER,kind:'video'}];
  const donut=Math.max(0,Math.min(360,(Number(rating)||0)*36));
  return '<div class="cv-public">'+CV.top(true,owner?"CV.go('feed')":"(typeof back==='function'?back():history.back())")+
   '<section class="cv-profile-hero"><div class="cv-profile-bg"></div><div class="cv-profile-glow"></div><div class="cv-profile-inner"><div class="cv-profile-kicker"><small>PLAYER PROFILE · '+(P.age?'U'+PR.e(P.age):'ATHLETE')+'</small><span class="cv-verified">✓ هوية رياضية موثقة</span></div><div class="cv-profile-stage">'+CV.photo(P,'cv-profile-photo')+'<div class="cv-profile-copy"><small>'+PR.e(P.pos||'PLAYER')+'</small><h1>'+PR.e(P.display_name||P.name)+'</h1><p>'+PR.e(P.org||'لا توجد جهة حالية')+'</p><code>'+PR.e(code)+'</code></div></div><div class="cv-profile-actions">'+(owner?'<button class="primary" onclick="window.CV.go(\'settings\')">حسّن ظهورك</button><button onclick="window.CV.fab(\'share\')">شارك هويتك</button>':'<button class="primary" onclick="window.CV.go(\'opps\')">دعوة للانضمام</button><button onclick="window.CV.go(\'messages\')">تواصل بإذن</button>')+'<button onclick="if(window.shareCard)shareCard(\''+PR.e(who)+'\')">⇪</button></div><div class="cv-profile-stats"><div><b>'+verified+'</b><span>مباراة</span></div><div><b>'+goals+'</b><span>هدف</span></div><div><b>'+assists+'</b><span>صناعة</span></div><div><b>'+PR.e(rating)+'</b><span>تقييم</span></div></div></div></section>'+
   '<main class="cv-public-main"><section class="cv-section dark-photo"><div class="cv-head"><div><small>SCOUT SNAPSHOT</small><h2>ليش هذا اللاعب يستحق المتابعة؟</h2></div></div><div class="cv-scout"><div><b>'+att.filter(a=>a.present).length+'</b><span>حضور تدريبي</span></div><div><b>'+comps.length+'</b><span>مسابقات</span></div><div><b>'+orgs.length+'</b><span>جهات موثقة</span></div></div></section>'+
   '<section class="cv-section"><div class="cv-head"><div><small>PERFORMANCE MIX</small><h2>رقم واضح.. مو انطباع</h2></div></div><div style="display:grid;grid-template-columns:130px 1fr;gap:14px;align-items:center"><div style="width:122px;height:122px;border-radius:50%;background:conic-gradient(var(--cv-v2) 0 '+donut+'deg,var(--cv-g) '+donut+'deg '+Math.min(360,donut+65)+'deg,#252b42 '+Math.min(360,donut+65)+'deg 360deg);display:grid;place-items:center"><div style="width:84px;height:84px;border-radius:50%;background:#0d1224;display:grid;place-items:center;text-align:center"><b style="font:700 31px Space Grotesk">'+PR.e(rating)+'</b></div></div><div>'+CV.spark(series)+'</div></div></section>'+
   '<section class="cv-section"><div class="cv-head"><div><small>HIGHLIGHTS</small><h2>شوفه قبل ما تحكم عليه</h2></div></div><div class="cv-reel">'+reel.map(m=>'<article><div class="cv-reel-bg" style="background-image:url('+PR.e(m.url||PLAYER)+')"></div><div class="cv-reel-copy"><span>'+(m.kind==='video'?'▶':'▣')+'</span><b>'+PR.e(m.label||m.match_title||'لقطة رياضية')+'</b><small>'+PR.e(m.match_title||m.event_type||'من ملف اللاعب')+'</small></div></article>').join('')+'</div></section>'+
   '<section class="cv-section"><div class="cv-head"><div><small>TROPHY ROOM</small><h2>إنجازات بدليلها</h2></div></div><div class="cv-badges">'+(badges.length?badges.slice(0,9).map(b=>'<div class="cv-badge"><span>🏆</span><b>'+PR.e(b.title||b.badge_key||'إنجاز')+'</b><small>'+PR.e(b.org||b.source||'موثق')+'</small></div>').join(''):'<div class="cv-badge" style="grid-column:1/-1"><span>✦</span><b>المسار ما زال يتكوّن</b><small>تظهر الإنجازات عند توثيقها</small></div>')+'</div></section>'+
   '<section class="cv-section"><div class="cv-head"><div><small>TRUST</small><h2>اللي تشوفه.. واللي يبقى خاص</h2></div></div><div class="cv-scout"><div><b>عام</b><span>الهوية والأداء والإنجازات المنشورة</span></div><div><b>موثّق</b><span>كل رقم مرتبط بسجل أو جهة</span></div><div><b>خاص</b><span>الصحة والرسائل والمحفظة لا تظهر</span></div></div></section></main>'+
   (owner?CV.nav():'<div class="cv-visitor-cta"><button class="primary" onclick="window.CV.go(\'opps\')">دعوة / فرصة</button><button onclick="window.CV.go(\'messages\')">تواصل بإذن</button></div>')+'</div>';
 }catch(e){console.error('CV public',e);return basePublic()}
};
T.myCard=T.publicView;

const priorRender=window.render;
window.render=render=async function(){
 CV.close();document.body.classList.remove('cv-player');
 await priorRender();
 try{
  if(!PR.isPlayer()||VIEW==='auth'||VIEW==='role')return;
  document.body.classList.add('cv-player');
  document.querySelectorAll('.pr-nav,#prFab,#prFabMenu').forEach(n=>n.remove());
  if(VIEW==='feed'||VIEW==='publicView'){
    document.getElementById('app')?.classList.remove('pr-route');
    document.querySelectorAll('.pr-route-head').forEach(n=>n.remove());
  }
  if(VIEW!=='publicView'&&!document.getElementById('cvFab')&&!document.querySelector('.cv-page')){
    document.body.insertAdjacentHTML('beforeend','<button id="cvFab" class="cv-fab" onclick="window.CV.toggleFab()">＋</button>');
  }
  if(!['feed','publicView'].includes(VIEW)&&!document.querySelector('.cv-nav')){
    document.getElementById('app')?.insertAdjacentHTML('beforeend',CV.nav());
  }
 }catch(e){console.warn('CV render',e)}
};
})();