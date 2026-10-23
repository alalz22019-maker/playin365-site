
(function(){
'use strict';
if(typeof window==='undefined')return;
const PZ=window.PZ={version:'2026.10.23-zero-1'};
const ROUTES=['feed','home','profile','publicView','myCard','records','rating','ratingDetail','cabinet','opps','calendar','wallet','health','messages','viewLog','privacy','explore','find','pitch','news','market','memberships','settings','notifications','coachBrief','matchView'];
const OLD={};ROUTES.forEach(function(n){OLD[n]=T[n]||null});
PZ.e=function(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
PZ.safe=async function(name,builder){try{const r=await builder;if(r&&r.error)throw r.error;return r&&r.data?r.data:[]}catch(e){console.warn('PZ '+name,e);return[]}};
PZ.go=function(v,p){PZ.close();go(v,p)};
PZ.close=function(){document.querySelectorAll('.pz-sheet,.pz-sheet-bg').forEach(function(n){n.remove()})};
PZ.brand=function(){return '<span class="pz-brand"><span class="play">Play</span><span class="in">In</span><sup>365</sup></span>'};
PZ.basmat=function(cls){return '<span class="pz-basmat '+(cls||'')+'" aria-hidden="true"></span>'};
PZ.photo=function(p,cls){
 const demoId='89a89d4d-6792-48ff-9017-086532d128b0';
 const demoPhoto='https://images.unsplash.com/photo-1761225091881-0d3bda9f6d5a?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1200';
 const src=(p&&String(p.id)===demoId)?demoPhoto:((p&&p.avatar_url)||demoPhoto);
 return '<div class="'+cls+' pz-basmat-photo"><img src="'+PZ.e(src)+'" alt="صورة اللاعب"></div>'
};
PZ.playerName=function(name){
 const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
 if(parts.length<=1)return '<span>'+PZ.e(parts[0]||'لاعب')+'</span>';
 const first=parts.shift(),rest=parts.join(' ');
 return '<span>'+PZ.e(first)+'</span><span>'+PZ.e(rest)+'</span>'
};
PZ.icon=function(name,cls){
 const icons={
  home:'<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1Z"/>',
  opps:'<circle cx="10" cy="12" r="5"/><path d="m14 8 5-5m0 0v4m0-4h-4M8 12h4m-2-2v4"/>',
  services:'<path d="M8 3.5c2.2 2.6 3.5 4.4 3.5 6.2A3.5 3.5 0 1 1 4.5 9.7C4.5 7.9 5.8 6.1 8 3.5Z"/><path d="M16 10.5c2.2 2.6 3.5 4.4 3.5 6.2a3.5 3.5 0 1 1-7 0c0-1.8 1.3-3.6 3.5-6.2Z"/>',
  records:'<path d="M4 19V5m0 14h16"/><path d="m7 15 3-4 3 2 5-6"/><circle cx="7" cy="15" r=".8"/><circle cx="10" cy="11" r=".8"/><circle cx="13" cy="13" r=".8"/><circle cx="18" cy="7" r=".8"/>',
  profile:'<path d="M12 3.5c3.2 3.8 5 6.2 5 8.6a5 5 0 0 1-10 0c0-2.4 1.8-4.8 5-8.6Z"/><circle cx="12" cy="10.5" r="1.6"/><path d="M9.5 15c.8-1.3 1.7-2 2.5-2s1.7.7 2.5 2"/>',
  rating:'<path d="M5 16a7 7 0 1 1 14 0"/><path d="m12 12 4-3"/><circle cx="12" cy="12" r="1"/><path d="M7 18h10"/>',
  trophy:'<path d="M8 4h8v4a4 4 0 0 1-8 0Z"/><path d="M8 6H5v1a3 3 0 0 0 3 3m8-4h3v1a3 3 0 0 1-3 3M12 12v4m-3 4h6m-5-4h4"/>',
  wallet:'<rect x="4" y="6" width="16" height="13" rx="3"/><path d="M7 6V4m10 2V4M4 10h16m-5 4h3"/>',
  health:'<path d="M12 20S4.5 15.7 4.5 9.5A4 4 0 0 1 12 7.4a4 4 0 0 1 7.5 2.1C19.5 15.7 12 20 12 20Z"/><path d="m7.5 12 2.2 0 1.2-2.4 2.1 4.8 1.1-2.4h2.4"/>',
  messages:'<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h6"/>',
  views:'<path d="M2.8 12s3.3-5 9.2-5 9.2 5 9.2 5-3.3 5-9.2 5-9.2-5-9.2-5Z"/><circle cx="12" cy="12" r="2.2"/>',
  privacy:'<path d="M12 3 19 6v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6Z"/><path d="M9.5 12.5 11 14l3.8-4"/>',
  explore:'<circle cx="12" cy="12" r="8"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8Z"/>',
  search:'<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',
  community:'<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19c.7-3 2.6-4.5 5.5-4.5s4.8 1.5 5.5 4.5m0-.5c.6-2.1 1.9-3.2 4-3.2 1.1 0 2 .3 2.8.9"/>',
  news:'<path d="M5 4h13a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  market:'<path d="M6 8h12l1 12H5Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  settings:'<path d="M5 7h14M8 12h8M5 17h14"/><circle cx="9" cy="7" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="11" cy="17" r="1.7"/>',
  memberships:'<path d="M4 7h16v12H4Z"/><path d="M8 7V5h8v2M8 12h8m-8 3h5"/>',
  notifications:'<path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5ZM10 20h4"/>',
  coach:'<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 4V3h6v1m-6 5h6m-6 4h4m-4 4h6"/>',
  match:'<circle cx="12" cy="12" r="8"/><path d="m12 8 3 2-1 3h-4l-1-3Zm-3-3 1 3m5-3-1 3m-6 8 2-3m6 3-2-3"/>',
  menu:'<path d="M5 7h14M5 12h14M5 17h14"/>',
  back:'<path d="m15 5-7 7 7 7"/>',
  plus:'<path d="M12 6v12M6 12h12"/>',
  share:'<path d="M12 4v11"/><path d="m8 8 4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'
 };
 return '<svg class="pz-icon '+(cls||'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(icons[name]||icons.services)+'</svg>';
};

PZ.services=[
['profile','هويتي الرياضية','الواجهة العامة التي تسوّق لك','publicView','private'],
['records','السجل والأداء','مباريات وأحداث وتطور','records','private'],
['rating','تفاصيل التقييم','كيف يتكوّن رقمك','ratingDetail','private'],
['trophy','خزانة الإنجازات','شارات وألقاب موثقة','cabinet','private'],
['opps','الفرص والدعوات','تجارب وعروض واهتمامات','opps','private'],
['wallet','الجدول والمحفظة','مواعيد ومدفوعات','wallet','private'],
['health','الصحة والجاهزية','الحالة وخطة العودة','health','private'],
['messages','الرسائل','تواصل بإذن','messages','shared'],
['views','من رأى ملفك','سجل الزيارات','viewLog','private'],
['privacy','الخصوصية','من يرى ماذا','privacy','private'],
['explore','اكتشف حولك','مباريات وملاعب وأكاديميات','explore','shared'],
['search','البحث','لاعبون ومدربون وجهات','find','shared'],
['community','المجتمع الرياضي','محتوى وتفاعل','pitch','shared'],
['news','الأخبار','نبض رياضي وفعاليات','news','shared'],
['market','السوق والخدمات','منتجات وخدمات رياضية','market','shared'],
['settings','الإعدادات','الحساب والتفضيلات','settings','private']
];
PZ.meta={
records:['records','PERFORMANCE RECORD','السجل والأداء','مسيرتك الرياضية الموثقة'],
ratingDetail:['rating','RATING MODEL','تفاصيل التقييم','رقم مفهوم وليس صندوقًا أسود'],
cabinet:['trophy','TROPHY ROOM','خزانة الإنجازات','كل لقب مرتبط بدليل'],
opps:['opps','OPPORTUNITIES','الفرص والدعوات','قراراتك لا تظهر في ملفك العام'],
wallet:['wallet','PLAYER WALLET','الجدول والمحفظة','مواعيدك ومدفوعاتك في مكان واحد'],
health:['health','READINESS','الصحة والجاهزية','الخصوصية الطبية أولًا'],
messages:['messages','MESSAGES','الرسائل','تواصل رياضي موثق'],
viewLog:['views','VISIBILITY LOG','من رأى ملفك','كل اطلاع قابل للتتبع'],
privacy:['privacy','PRIVACY','الخصوصية','أنت المتحكم'],
explore:['explore','DISCOVER','اكتشف حولك','ما يحدث رياضيًا حولك'],
find:['search','UNIFIED SEARCH','البحث','ابحث عن أي كيان رياضي'],
pitch:['community','COMMUNITY','المجتمع الرياضي','التفاعل لا يساوي التقييم'],
news:['news','SPORTS PULSE','الأخبار','جهتك ودورياتك والعالم'],
market:['market','SPORTS MARKET','السوق والخدمات','احتياجاتك الرياضية'],
memberships:['memberships','MEMBERSHIPS','العضويات','مزايا رقمية واضحة'],
settings:['settings','SETTINGS','الإعدادات','حسابك وهويتك وتفضيلاتك'],
notifications:['notifications','NOTIFICATIONS','الإشعارات','كل ما يحتاج قرارك'],
coachBrief:['coach','COACH BRIEF','خطة التدريب','ما تحتاجه قبل الحصة'],
matchView:['match','MATCH','تفاصيل المباراة','المصدر الواحد لأحداث المباراة']
};
PZ.top=function(back){return '<header class="pz-top"><button class="pz-side" onclick="'+(back||"window.PZ.openServices()")+'">'+PZ.icon(back?'back':'services')+'</button><button style="border:0;background:none" onclick="window.PZ.go(\'feed\')">'+PZ.brand()+'</button><button class="pz-side" onclick="window.PZ.openServices()">'+PZ.icon('menu')+'</button></header>'};
PZ.nav=function(active){
 const a=[['home','مساحتي','feed'],['opps','فرصي','opps'],['services','الخدمات','services'],['records','أدائي','records'],['profile','هويتي','publicView']];
 return '<nav class="pz-nav">'+a.map(function(x){
  const icon='<span class="pz-nav-icon">'+PZ.icon(x[0])+'</span>';
  if(x[2]==='services')return '<button class="pz-nav-services" onclick="window.PZ.openServices()">'+icon+'<b>'+x[1]+'</b></button>';
  return '<button class="'+(active===x[2]?'on':'')+'" onclick="window.PZ.go(\''+x[2]+'\')">'+icon+'<b>'+x[1]+'</b></button>'
 }).join('')+'</nav>'
};
PZ.page=function(route,body){const m=PZ.meta[route]||['services','PLAYER SPACE',route,'هويتك الرياضية'];return '<div class="pz-page">'+PZ.top("window.PZ.go('feed')")+'<section class="pz-route-head"><div class="pz-route-title"><span>'+PZ.icon(m[0])+'</span><div><small>'+m[1]+'</small><h1>'+PZ.e(m[2])+'</h1><p>'+PZ.e(m[3])+'</p></div></div></section><main class="pz-route-main">'+body+'</main>'+PZ.nav(route)+'<button class="pz-fab pz-basmat-fab" onclick="window.PZ.toggleFab()">'+PZ.icon('plus')+'</button></div>'};
PZ.empty=function(t,s,a,r){return '<div class="pz-empty"><b>'+PZ.e(t)+'</b><small>'+PZ.e(s||'')+'</small>'+(a?'<div class="pz-actions" style="justify-content:center"><button class="pz-action primary" onclick="window.PZ.go(\''+r+'\')">'+PZ.e(a)+'</button></div>':'')+'</div>'};
PZ.grid=function(f,q){f=f||'all';q=String(q||'').trim().toLowerCase();const rows=PZ.services.filter(function(s){return(f==='all'||s[4]===f)&&(!q||(s[1]+' '+s[2]).toLowerCase().includes(q))});return rows.map(function(s){return '<button class="pz-service-row" data-kind="'+s[4]+'" onclick="window.PZ.go(\''+s[3]+'\')"><i>'+PZ.icon(s[0])+'</i><span><b>'+s[1]+'</b><small>'+s[2]+'</small></span><em class="pz-kind">'+(s[4]==='private'?'خاص':'مشترك')+'</em></button>'}).join('')||PZ.empty('لا توجد نتيجة','جرّب كلمة أخرى')};
PZ.openServices=function(){PZ.close();document.body.insertAdjacentHTML('beforeend','<div class="pz-sheet-bg" onclick="window.PZ.close()"></div><section class="pz-sheet"><div class="pz-sheet-grab"></div><div class="pz-sheet-head"><div><b>كل خدمات اللاعب</b><small>وصول واحد لكل شيء</small></div><button onclick="window.PZ.close()">×</button></div><label class="pz-search"><span>⌕</span><input id="pzServiceSearch" data-filter="all" placeholder="ابحث عن خدمة..." oninput="window.PZ.searchServices(this)"></label><div class="pz-filters"><button class="on" onclick="window.PZ.filterServices(\'all\',this)">الكل</button><button onclick="window.PZ.filterServices(\'private\',this)">خاص</button><button onclick="window.PZ.filterServices(\'shared\',this)">مشترك</button></div><div class="pz-all-services" id="pzServiceGrid">'+PZ.grid('all','')+'</div></section>')};
PZ.searchServices=function(i){const g=document.getElementById('pzServiceGrid');if(g)g.innerHTML=PZ.grid(i.dataset.filter||'all',i.value)};
PZ.filterServices=function(f,b){document.querySelectorAll('.pz-filters button').forEach(function(x){x.classList.remove('on')});if(b)b.classList.add('on');const i=document.getElementById('pzServiceSearch');if(i)i.dataset.filter=f;const g=document.getElementById('pzServiceGrid');if(g)g.innerHTML=PZ.grid(f,i?i.value:'')};
PZ.share=async function(name){const url=location.origin+location.pathname+'?player='+encodeURIComponent(name||ME.name);try{if(navigator.share){await navigator.share({title:'PlayIn365 — هويتك الرياضية',url:url});return}await navigator.clipboard.writeText(url);toast('نُسخ رابط هويتك')}catch(e){try{await navigator.clipboard.writeText(url);toast('نُسخ رابط هويتك')}catch(x){}}};
PZ.byMatch=function(evs){const m={};(evs||[]).forEach(function(e){(m[e.match_id]=m[e.match_id]||[]).push(e)});return Object.values(m)};
PZ.score=function(g){let s=6;(g||[]).forEach(function(e){if(e.type==='goal')s+=.5;if(e.type==='assist')s+=.3;if(e.type==='red')s-=.5});return Math.max(1,Math.min(10,Math.round(s*10)/10))};
PZ.spark=function(vals){const v=(vals||[]).filter(Number.isFinite).slice(-8);if(v.length<2)return '<div style="height:84px;display:flex;align-items:end;font-size:8px;color:#8f96aa">يظهر المنحنى بعد اكتمال البيانات</div>';const mn=Math.min.apply(null,v),mx=Math.max.apply(null,v),d=(mx-mn)||1;const pts=v.map(function(n,i){return(8+i*(184/(v.length-1)))+','+(68-((n-mn)/d)*50)}).join(' ');return '<svg viewBox="0 0 200 80" preserveAspectRatio="none"><polyline points="'+pts+'" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+v.map(function(n,i){return '<circle cx="'+(8+i*(184/(v.length-1)))+'" cy="'+(68-((n-mn)/d)*50)+'" r="3.5"/>'}).join('')+'</svg>'};

PZ.radar=function(vals,labels){
 vals=(vals||[]).map(function(v){return Math.max(0,Math.min(1,Number(v)||0))});
 labels=labels||['تهديف','صناعة','خبرة','توثيق','ثبات'];
 const cx=80,cy=80,r=55,n=vals.length||5;
 function pt(i,v){const a=-Math.PI/2+i*2*Math.PI/n,rr=r*v;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]}
 const outer=vals.map(function(_,i){return pt(i,1).join(',')}).join(' ');
 const poly=vals.map(function(v,i){return pt(i,v).join(',')}).join(' ');
 return '<svg class="pz-radar" viewBox="0 0 160 160" aria-label="بصمة اللاعب">'+
  '<polygon points="'+outer+'" class="pz-radar-outer"/>'+
  [.33,.66].map(function(q){return '<polygon points="'+vals.map(function(_,i){return pt(i,q).join(',')}).join(' ')+'" class="pz-radar-grid"/>'}).join('')+
  '<polygon points="'+poly+'" class="pz-radar-data"/>'+
  vals.map(function(v,i){const p=pt(i,v);return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" class="pz-radar-dot"/>'}).join('')+
  labels.map(function(l,i){const p=pt(i,1.16);return '<text x="'+p[0]+'" y="'+p[1]+'" text-anchor="middle" dominant-baseline="middle">'+PZ.e(l)+'</text>'}).join('')+
 '</svg>'
};
PZ.toggleFab=function(){
 const old=document.getElementById('pzFabMenu');if(old){old.remove();return}
 document.body.insertAdjacentHTML('beforeend','<div class="pz-fab-menu" id="pzFabMenu">'+
  '<button onclick="window.PZ.share(window.ME&&ME.name)"><span>'+PZ.icon('profile')+'</span><b>شارك هويتك</b></button>'+
  '<button onclick="window.PZ.go(\'find\')"><span>'+PZ.icon('search')+'</span><b>بحث سريع</b></button>'+
  '<button onclick="window.PZ.go(\'health\')"><span>'+PZ.icon('health')+'</span><b>الجاهزية</b></button>'+
  '<button onclick="window.PZ.go(\'privacy\')"><span>'+PZ.icon('privacy')+'</span><b>الخصوصية</b></button>'+
  '<button onclick="window.PZ.openServices()"><span>'+PZ.icon('services')+'</span><b>كل الخدمات</b></button>'+
 '</div>')
};

PZ.pulse=function(news,matches){const a=[];(news||[]).slice(0,3).forEach(function(n){a.push(['NEWS',n.title||n.summary||'خبر رياضي'])});if(a.length<3)(matches||[]).filter(function(m){return['live','today','open'].includes(m.status)}).slice(0,3-a.length).forEach(function(m){a.push([m.status==='live'?'LIVE':'MATCH',(m.title||'مباراة')+(m.match_time?' · '+m.match_time:'')])});if(!a.length)a.push(['PLAYIN365','هويتك الرياضية تتحرك مع كل مشاركة موثقة']);const s=a.concat(a);return '<div class="pz-pulse"><strong><i class="pz-live"></i>PLAYIN NOW</strong><div class="pz-pulse-window"><div class="pz-pulse-track">'+s.map(function(x){return '<span><i>'+PZ.e(x[0])+'</i>'+PZ.e(x[1])+'</span>'}).join('')+'</div></div></div>'};

PZ.home=async function(){
 const d=await Promise.all([
  PZ.safe('matches',sb.from('matches').select('*').order('created_at',{ascending:false}).limit(20)),
  PZ.safe('events',sb.from('match_events').select('*').eq('who',ME.name).order('created_at',{ascending:false}).limit(100)),
  PZ.safe('joins',sb.from('match_joins').select('*').eq('player_id',ME.id)),
  PZ.safe('news',sb.from('pi_news').select('*').limit(8)),
  PZ.safe('opps',sb.from('pi_opps').select('*').eq('player_name',ME.name).order('created_at',{ascending:false}).limit(8)),
  PZ.safe('views',sb.from('pi_views').select('*').eq('subject',ME.name).limit(30)),
  PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).limit(20)),
  PZ.safe('health',sb.from('health_status').select('*').eq('player_name',ME.name).limit(1))
 ]);
 const matches=d[0],evs=d[1],joins=d[2],news=d[3],opps=d[4],views=d[5],badges=d[6],health=d[7];
 const groups=PZ.byMatch(evs),series=groups.map(PZ.score),rating=series.length?(series.reduce(function(a,b){return a+b},0)/series.length).toFixed(1):'—';
 const goals=evs.filter(function(e){return e.type==='goal'}).length,assists=evs.filter(function(e){return e.type==='assist'}).length;
 const verified=new Set(evs.map(function(e){return e.match_id}).concat(joins.filter(function(j){return j.attended}).map(function(j){return j.match_id}))).size;
 const next=matches.find(function(m){return m.status==='live'})||matches.find(function(m){return m.status==='today'})||matches.find(function(m){return m.status==='open'});
 const code=ME.athlete_id||ME.handle||('PI-'+String(ME.id||'').slice(0,8).toUpperCase());
 const quick=PZ.services.filter(function(s){return['records','opps','wallet','health','messages','viewLog'].includes(s[3])});
 const photos=['https://images.unsplash.com/photo-1767916732786-a83902ffc25c?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=72&w=1200','https://images.unsplash.com/photo-1761225091881-0d3bda9f6d5a?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=76&w=1000','https://images.unsplash.com/photo-1767916732786-a83902ffc25c?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=72&w=1200'];
 const updates=(news||[]).slice(0,3);while(updates.length<3)updates.push({title:updates.length===0?'بطولة جديدة':updates.length===1?'تجربة أداء':'مباراة مفتوحة',summary:''});
 let body=PZ.pulse(news,matches);
 body+='<section class="pz-hero pz-hero-v2"><div class="pz-hero-bg"></div><div class="pz-hero-grain"></div><div class="pz-hero-drop-glow"></div><div class="pz-hero-in"><div class="pz-kicker"><span class="pz-chip">'+PZ.basmat('pz-basmat-mini')+'هويتك الرياضية</span><button class="pz-share" onclick="window.PZ.share(\''+PZ.e(ME.name)+'\')">'+PZ.icon('share')+'</button></div><div class="pz-person pz-person-v2">'+PZ.photo(ME,'pz-photo')+'<div class="pz-person-copy"><small>ATHLETE IDENTITY · '+PZ.e(ME.age?'U'+ME.age:'ATHLETE')+'</small><h1 class="pz-player-name">'+PZ.playerName(ME.display_name||ME.name)+'</h1><p>'+PZ.e(ME.pos||'لاعب')+(ME.org?' · '+PZ.e(ME.org):'')+'</p><code>'+PZ.e(code)+'</code></div></div><div class="pz-proof pz-proof-v2"><div><b>'+verified+'</b><span>مباراة موثقة</span></div><div><b>'+goals+'</b><span>هدف</span></div><div><b>'+assists+'</b><span>صناعة</span></div><div class="featured"><b>'+PZ.e(rating)+'</b><span>التقييم</span></div></div><div class="pz-next"><small>'+(next&&next.status==='live'?'LIVE NOW':'NEXT MOVE')+'</small><b>'+PZ.e(next?next.title:'اكتشف خطوتك القادمة')+'</b><p>'+PZ.e(next?[(next.match_time||''),(next.venue||'')].filter(Boolean).join(' · '):'مباراة · أكاديمية · تجربة أداء')+'</p><button onclick="'+(next?"window.PZ.go('matchView','"+PZ.e(next.id)+"')":"window.PZ.go('explore')")+'">'+(next?'فتح التفاصيل':'اكتشف حولك')+' ←</button></div></div></section>';
 body+='<section><div class="pz-section-head"><div><span class="pz-eyebrow">PLAYER HUB</span><h2>كل شيء قريب منك</h2></div><button onclick="window.PZ.openServices()">كل الخدمات</button></div><div class="pz-service-grid">'+quick.map(function(s){return '<button class="pz-service-tile" onclick="window.PZ.go(\''+s[3]+'\')"><i class="pz-service-icon">'+PZ.icon(s[0])+'</i><b>'+s[1]+'</b><small>'+s[2]+'</small></button>'}).join('')+'</div></section>';
 body+='<section><div class="pz-section-head"><div><span class="pz-eyebrow">SPORTS PULSE</span><h2>آخر المستجدات</h2></div><button onclick="window.PZ.go(\'news\')">عرض الكل</button></div><div class="pz-horizontal">'+updates.map(function(n,i){return '<button class="pz-news-card" onclick="window.PZ.go(\'news\')"><div class="pz-news-bg" style="background-image:url('+photos[i]+')"></div><div class="pz-news-copy"><em>'+(i===0?'بطولة':i===1?'فرصة':'مباراة')+'</em><b>'+PZ.e(n.title||'مستجد رياضي')+'</b><small>'+PZ.e(n.summary||'من نبض PlayIn365')+'</small></div></button>'}).join('')+'</div></section>';
 body+='<section><div class="pz-section-head"><div><span class="pz-eyebrow">PERFORMANCE</span><h2>أداؤك في لقطة</h2></div><button onclick="window.PZ.go(\'records\')">التفاصيل</button></div><div class="pz-performance"><div class="pz-chart"><div class="pz-chart-top"><div><small>FORM INDEX</small><b>'+PZ.e(rating)+'</b></div><small>'+verified+' مباريات</small></div>'+PZ.spark(series)+'</div><div class="pz-stat-stack"><button onclick="window.PZ.go(\'cabinet\')"><b>'+badges.length+'</b><span>إنجازات</span></button><button onclick="window.PZ.go(\'viewLog\')"><b>'+views.length+'</b><span>ظهور ملفك</span></button><button onclick="window.PZ.go(\'health\')"><b>'+PZ.e(health[0]&&health[0].state||'—')+'</b><span>الجاهزية</span></button></div></div></section>';
 body+='<section><div class="pz-section-head"><div><span class="pz-eyebrow">OPPORTUNITIES</span><h2>وش ينتظرك؟</h2></div><button onclick="window.PZ.go(\'opps\')">كل الفرص</button></div><div class="pz-horizontal">'+(opps.length?opps:[{kind:'اكتشاف',title:'ابدأ باكتشاف الفرص حولك',org:'PlayIn365',status:'open'}]).slice(0,5).map(function(o){return '<button class="pz-opp-card" onclick="window.PZ.go(\'opps\')"><em>'+PZ.e(o.kind||'فرصة')+'</em><b>'+PZ.e(o.title||'فرصة رياضية')+'</b><small>'+PZ.e(o.org||'')+'</small><i>'+PZ.e(o.status||'جديدة')+'</i></button>'}).join('')+'</div></section>';
 return '<div class="pz-page">'+PZ.top()+'<main class="pz-main">'+body+'</main>'+PZ.nav('feed')+'<button class="pz-fab" onclick="window.PZ.toggleFab()">'+PZ.icon('plus')+'</button></div>';
};

PZ.publicProfile=async function(){
 const who=PARAM||ME.name,owner=who===ME.name;
 const d=await Promise.all([
  PZ.safe('profile',sb.from('profiles').select('*').eq('name',who).limit(1)),
  PZ.safe('events',sb.from('match_events').select('*,matches(title,comp,organizer_name)').eq('who',who).order('created_at',{ascending:false}).limit(120)),
  PZ.safe('joins',sb.from('match_joins').select('*').eq('player_name',who)),
  PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',who).limit(12)),
  PZ.safe('media',sb.from('pi_media').select('*').eq('subject',who).limit(12)),
  PZ.safe('attendance',sb.from('attendance').select('*').eq('player_name',who).limit(300))
 ]);
 const p=d[0][0]||(owner?ME:{name:who}),evs=d[1],joins=d[2],badges=d[3],media=d[4],attendance=d[5]||[],groups=PZ.byMatch(evs),series=groups.map(PZ.score);
 const rating=series.length?(series.reduce(function(a,b){return a+b},0)/series.length).toFixed(1):'—',goals=evs.filter(function(e){return e.type==='goal'}).length,assists=evs.filter(function(e){return e.type==='assist'}).length,verified=new Set(evs.map(function(e){return e.match_id}).concat(joins.filter(function(j){return j.attended}).map(function(j){return j.match_id}))).size;
 const code=p.athlete_id||p.handle||('PI-'+String(p.id||'').slice(0,8).toUpperCase()),fallback='https://images.unsplash.com/photo-1761225091881-0d3bda9f6d5a?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=78&w=1000';
 const comps=[...new Set(evs.map(function(e){return e.matches&&e.matches.comp}).filter(Boolean))],orgs=[...new Set(evs.map(function(e){return e.matches&&e.matches.organizer_name}).filter(Boolean))],recorders=[...new Set(evs.map(function(e){return e.recorded_by}).filter(Boolean))];
 const yellows=evs.filter(function(e){return e.type==='yellow'}).length,reds=evs.filter(function(e){return e.type==='red'}).length;
 const radarVals=[Math.min(1,goals/8),Math.min(1,assists/5),Math.min(1,verified/8),Math.min(1,recorders.length/4),Math.max(.15,Math.min(1,(verified*2+evs.length/8)/(Math.max(1,verified)*3)))];
 const reel=media.length?media.slice(0,6):[];
 let out='<div class="pz-profile">'+PZ.top(owner?"window.PZ.go('feed')":"history.back()")+'<section class="pz-profile-cover pz-profile-cover-v2"><div class="pz-profile-bg"></div><div class="pz-profile-in"><div class="pz-profile-kicker"><small>PLAYER PROFILE · '+(p.age?'U'+PZ.e(p.age):'ATHLETE')+'</small><span class="pz-verified">✓ هوية رياضية موثقة</span></div><div class="pz-profile-stage pz-profile-stage-v2">'+PZ.photo(p,'pz-profile-photo')+'<div class="pz-profile-copy"><small>'+PZ.e(p.pos||'PLAYER')+'</small><h1 class="pz-player-name">'+PZ.playerName(p.display_name||p.name)+'</h1><p>'+(p.org?PZ.e(p.org):(owner?'<button class="pz-inline-link" onclick="window.PZ.go(\'settings\')">+ أضف ناديك أو أكاديميتك</button>':'غير مرتبط بجهة حاليًا'))+'</p><code>'+PZ.e(code)+'</code></div></div><div class="pz-profile-actions">'+(owner?'<button class="primary" onclick="window.PZ.go(\'settings\')">حسّن ظهورك</button><button onclick="window.PZ.share(\''+PZ.e(who)+'\')">شارك هويتك</button>':'<button class="primary" onclick="window.PZ.go(\'opps\')">دعوة / فرصة</button><button onclick="window.PZ.go(\'messages\')">تواصل بإذن</button>')+'<button onclick="window.PZ.share(\''+PZ.e(who)+'\')">⇪</button></div><div class="pz-proof"><div><b>'+verified+'</b><span>مباراة</span></div><div><b>'+goals+'</b><span>هدف</span></div><div><b>'+assists+'</b><span>صناعة</span></div><div><b>'+PZ.e(rating)+'</b><span>تقييم</span></div></div></div></section>';
 out+='<main class="pz-profile-main"><section class="pz-panel pz-scout-panel"><div class="pz-section-head"><div><span class="pz-eyebrow">SCOUT SNAPSHOT</span><h2>ليش يستحق المتابعة؟</h2></div><span class="pz-verified-mini">موثق</span></div><div class="pz-scout-grid"><div><b>'+verified+'</b><span>مباراة موثقة</span></div><div><b>'+attendance.filter(function(a){return a.present}).length+'</b><span>حضور تدريبي</span></div><div><b>'+comps.length+'</b><span>مسابقات</span></div><div><b>'+recorders.length+'</b><span>مصادر توثيق</span></div></div><div class="pz-proof-chain"><span>'+PZ.icon('privacy')+'</span><div><b>سلسلة الثقة</b><small>'+(recorders.length?PZ.e(recorders.slice(0,3).join(' · ')):'تظهر الجهات التي وثّقت مشاركاته هنا')+'</small></div></div></section><section class="pz-panel"><div class="pz-section-head"><div><span class="pz-eyebrow">PERFORMANCE</span><h2>أداؤه بالأدلة</h2></div></div><div class="pz-profile-analytics"><div class="pz-chart"><div class="pz-chart-top"><div><small>FORM INDEX</small><b>'+PZ.e(rating)+'</b></div><small>'+verified+' مباريات</small></div>'+PZ.spark(series)+'</div><div class="pz-fingerprint"><small>PLAYER FINGERPRINT</small>'+PZ.radar(radarVals,['تهديف','صناعة','خبرة','توثيق','ثبات'])+'<span>مشتقة من السجل الموثق</span></div></div></section>';
 out+='<section class="pz-panel"><div class="pz-section-head"><div><span class="pz-eyebrow">HIGHLIGHTS</span><h2>شوفه قبل ما تحكم عليه</h2></div></div>'+(reel.length?'<div class="pz-highlight-reel">'+reel.map(function(m){return '<article class="pz-highlight"><div class="pz-highlight-bg" style="background-image:url('+PZ.e(m.url||fallback)+')"></div><div class="pz-highlight-copy"><span>'+PZ.icon(m.kind==='video'?'match':'news')+'</span><b>'+PZ.e(m.label||m.match_title||'لقطة رياضية')+'</b><small>'+PZ.e(m.match_title||m.event_type||'من ملف اللاعب')+'</small></div></article>'}).join('')+'</div>':'<div class="pz-premium-empty"><span class="pz-empty-drop">'+PZ.icon('profile')+'</span><b>لا توجد لقطات عامة حتى الآن</b><small>لن نملأ البروفايل بصور وهمية. أضف لقطة موثقة من مباراة أو تدريب.</small>'+(owner?'<button onclick="window.PZ.go(\'records\')">ابدأ من سجلك</button>':'')+'</div>')+'</section>';
 out+='<section class="pz-panel"><div class="pz-section-head"><div><span class="pz-eyebrow">TROPHY ROOM</span><h2>إنجازات بدليلها</h2></div></div><div class="pz-badges">'+(badges.length?badges.map(function(b){return '<div class="pz-badge"><span>🏆</span><b>'+PZ.e(b.title||b.badge_key||'إنجاز')+'</b><small>'+PZ.e(b.proof||b.signed_by||'موثق')+'</small></div>'}).join(''):'<div class="pz-premium-empty"><span class="pz-empty-drop gold">'+PZ.icon('trophy')+'</span><b>الإنجاز التالي يبدأ من الملعب</b><small>كل شارة هنا يجب أن ترتبط بدليل موثّق — لا شارات تجميلية.</small></div>')+'</div></section></main>';
 out+=(owner?PZ.nav('publicView'):'<div class="pz-visitor-cta"><button class="primary" onclick="window.PZ.go(\'opps\')">دعوة / فرصة</button><button onclick="window.PZ.go(\'messages\')">تواصل بإذن</button></div>')+'</div>';
 return out;
};

PZ.records=async function(){
 const d=await Promise.all([PZ.safe('events',sb.from('match_events').select('*,matches(title,comp,organizer_name)').eq('who',ME.name).order('created_at',{ascending:false}).limit(100)),PZ.safe('joins',sb.from('match_joins').select('*').eq('player_id',ME.id)),PZ.safe('attendance',sb.from('attendance').select('*').eq('player_name',ME.name).limit(200))]);
 const evs=d[0],joins=d[1],attendance=d[2]||[],groups=PZ.byMatch(evs),series=groups.map(PZ.score),rating=series.length?(series.reduce(function(a,b){return a+b},0)/series.length).toFixed(1):'—';
 const goals=evs.filter(function(e){return e.type==='goal'}).length,assists=evs.filter(function(e){return e.type==='assist'}).length,cards=evs.filter(function(e){return e.type==='yellow'||e.type==='red'}).length;
 const verified=new Set(evs.map(function(e){return e.match_id}).concat(joins.filter(function(j){return j.attended}).map(function(j){return j.match_id}))).size;
 const recorders=[...new Set(evs.map(function(e){return e.recorded_by}).filter(Boolean))];
 const radarVals=[Math.min(1,goals/8),Math.min(1,assists/5),Math.min(1,verified/8),Math.min(1,recorders.length/4),Math.min(1,attendance.filter(function(a){return a.present}).length/12)];
 let body='<section class="pz-record-hero"><div><span class="pz-eyebrow">SEASON SIGNAL</span><h2>موسمك في لقطة</h2><p>الأرقام هنا مأخوذة من مشاركاتك الموثقة فقط.</p></div><div class="pz-record-score"><b>'+PZ.e(rating)+'</b><small>FORM INDEX</small></div></section>';
 body+='<section class="pz-panel"><div class="pz-profile-analytics"><div class="pz-chart"><div class="pz-chart-top"><div><small>PERFORMANCE TREND</small><b>'+PZ.e(rating)+'</b></div><small>'+verified+' مباريات</small></div>'+PZ.spark(series)+'<div class="pz-mini-metrics"><span><b>'+goals+'</b> أهداف</span><span><b>'+assists+'</b> صناعة</span><span><b>'+cards+'</b> بطاقات</span></div></div><div class="pz-fingerprint"><small>PLAYER FINGERPRINT</small>'+PZ.radar(radarVals,['تهديف','صناعة','خبرة','توثيق','التزام'])+'<span>تتغير تلقائيًا مع سجلك</span></div></div></section>';
 body+='<section class="pz-panel"><div class="pz-section-head"><div><span class="pz-eyebrow">EVENT TIMELINE</span><h2>أحداثك الموثقة</h2></div><span class="pz-row-side">'+evs.length+' حدث</span></div>'+(evs.length?'<div class="pz-event-list">'+evs.map(function(e){const k=e.type==='goal'?'goal':e.type==='assist'?'assist':(e.type==='yellow'||e.type==='red'?'card':'event');return '<div class="pz-event '+k+'"><span class="pz-event-icon">'+(k==='goal'?PZ.icon('match'):k==='assist'?PZ.icon('opps'):k==='card'?PZ.icon('notifications'):PZ.icon('records'))+'</span><div><b>'+PZ.e(typeof evLabel==='function'?evLabel(e):e.type)+'</b><small>'+PZ.e(e.matches&&e.matches.title||'مباراة')+' · '+PZ.e(e.recorded_by||'جهة موثقة')+'</small></div><em>'+(e.minute?PZ.e(e.minute)+"'":'')+'</em></div>'}).join('')+'</div>':PZ.empty('لا أحداث موثقة بعد','يبدأ سجلك من أول مشاركة فعلية','اكتشف','explore'))+'</section>';
 return PZ.page('records',body);
};
PZ.ratingDetail=async function(){
 const evs=await PZ.safe('events',sb.from('match_events').select('*').eq('who',ME.name).limit(100)),groups=PZ.byMatch(evs),series=groups.map(PZ.score),rating=series.length?(series.reduce(function(a,b){return a+b},0)/series.length).toFixed(1):'—',angle=(Number(rating)||0)*36;
 const src=[['مسجّل',50,'أحداث موثقة'],['خبراء',30,'مدربون وكشافون موثّقون'],['داعمون',15,'سقف محدود'],['جمهور',5,'أقل وزن']];
 let body='<section class="pz-panel"><div class="pz-rating-layout"><div><div class="pz-donut" style="--angle:'+angle+'deg"><div><b>'+PZ.e(rating)+'</b><small>من 10</small></div></div><p class="pz-rating-note">الرقم النهائي لا يخفي مصادره. كل وزن ظاهر وقابل للتفسير.</p></div><div class="pz-rating-sources">'+src.map(function(s){return '<div class="pz-rating-source"><div><b>'+s[0]+'</b><span>'+s[1]+'%</span></div><small>'+s[2]+'</small><div class="pz-source-track"><i style="width:'+s[1]+'%"></i></div></div>'}).join('')+'</div></div></section>';
 return PZ.page('ratingDetail',body);
};
PZ.cabinet=async function(){const b=await PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).limit(30));return PZ.page('cabinet','<section class="pz-panel"><div class="pz-badges">'+(b.length?b.map(function(x){return '<div class="pz-badge"><span>🏆</span><b>'+PZ.e(x.title||x.badge_key||'إنجاز')+'</b><small>'+PZ.e(x.proof||x.signed_by||'موثق')+'</small></div>'}).join(''):PZ.empty('خزانتك تنتظر أول إنجاز','كل شارة تظهر بدليلها','افتح سجلك','records'))+'</div></section>')};
PZ.opps=async function(){const r=await PZ.safe('opps',sb.from('pi_opps').select('*').eq('player_name',ME.name).order('created_at',{ascending:false}).limit(40));return PZ.page('opps','<section class="pz-panel">'+(r.length?r.map(function(o){return '<div class="pz-row"><span class="pz-row-icon">◎</span><div class="pz-row-body"><b>'+PZ.e(o.title||o.kind||'فرصة')+'</b><small>'+PZ.e(o.org||'جهة رياضية')+'</small></div><span class="pz-row-side">'+PZ.e(o.status||'open')+'</span></div>'}).join(''):PZ.empty('لا فرص الآن','تظهر هنا عند وصول فرصة جديدة','اكتشف حولك','explore'))+'</section>')};
PZ.wallet=async function(){const d=await Promise.all([PZ.safe('cal',sb.from('calendar_items').select('*').eq('player_name',ME.name).order('on_date',{ascending:true}).limit(30)),PZ.safe('sub',sb.from('subscriptions').select('*').eq('player_name',ME.name).limit(30))]);let body='<section class="pz-panel">'+(d[0].length?d[0].map(function(x){return '<div class="pz-row"><span class="pz-row-icon">◫</span><div class="pz-row-body"><b>'+PZ.e(x.title||x.kind||'موعد')+'</b><small>'+PZ.e(x.on_date||'')+(x.start_time?' · '+PZ.e(x.start_time):'')+'</small></div></div>'}).join(''):PZ.empty('لا مواعيد قادمة','يتجمع جدولك تلقائيًا'))+'</section><section class="pz-panel">'+(d[1].length?d[1].map(function(x){return '<div class="pz-row"><span class="pz-row-icon">▦</span><div class="pz-row-body"><b>'+PZ.e(x.label||x.org||'اشتراك')+'</b><small>'+PZ.e(x.period||'')+'</small></div><span class="pz-row-side">'+(x.paid?'مدفوع':(x.amount!=null?PZ.e(x.amount)+' ر.س':'مستحق'))+'</span></div>'}).join(''):PZ.empty('لا مستحقات','لا توجد دفعات حالية'))+'</section>';return PZ.page('wallet',body)};
PZ.health=async function(){const h=await PZ.safe('health',sb.from('health_status').select('*').eq('player_name',ME.name).limit(1)),x=h[0];return PZ.page('health','<section class="pz-panel"><div class="pz-proof"><div><b>'+PZ.e(x&&x.state||'جاهز')+'</b><span>الحالة</span></div><div><b>🔒</b><span>خاص</span></div><div><b>'+PZ.e(x&&x.week||'—')+'</b><span>أسبوع</span></div><div><b>'+PZ.e(x&&x.updated_by||'—')+'</b><span>المختص</span></div></div></section><section class="pz-panel"><div class="pz-row"><span class="pz-row-icon">⚽</span><div class="pz-row-body"><b>المدرب يرى الجاهزية فقط</b><small>لا يظهر التشخيص الطبي إلا بصلاحية مستقلة.</small></div></div></section>')};
PZ.messages=async function(){const r=await PZ.safe('msg',sb.from('pi_msgs').select('*').or('sender.eq.'+ME.name+',recipient.eq.'+ME.name).order('created_at',{ascending:false}).limit(60));return PZ.page('messages','<section class="pz-panel">'+(r.length?r.map(function(m){const other=m.sender===ME.name?m.recipient:m.sender;return '<div class="pz-row"><span class="pz-row-icon">✉</span><div class="pz-row-body"><b>'+PZ.e(other||'محادثة')+'</b><small>'+PZ.e(m.body||m.message||'رسالة')+'</small></div></div>'}).join(''):PZ.empty('لا رسائل الآن','تظهر القنوات بعد وجود علاقة أو قبول تواصل'))+'</section>')};
PZ.viewLog=async function(){const r=await PZ.safe('views',sb.from('pi_views').select('*').eq('subject',ME.name).order('created_at',{ascending:false}).limit(80)),u=new Set(r.map(function(x){return x.viewer})).size;return PZ.page('viewLog','<section class="pz-panel"><div class="pz-proof"><div><b>'+r.length+'</b><span>اطلاع</span></div><div><b>'+u+'</b><span>جهة</span></div><div><b>'+r.filter(function(x){return x.scope==='medical'}).length+'</b><span>طبي</span></div><div><b>∞</b><span>سجل</span></div></div></section><section class="pz-panel">'+(r.length?r.slice(0,30).map(function(x){return '<div class="pz-row"><span class="pz-row-icon">◉</span><div class="pz-row-body"><b>'+PZ.e(x.viewer||'جهة')+'</b><small>'+PZ.e(x.scope||'profile')+'</small></div><span class="pz-row-side">'+PZ.e(String(x.created_at||'').slice(0,10))+'</span></div>'}).join(''):PZ.empty('لا زيارات بعد','أول مشاهدة موثقة تظهر هنا'))+'</section>')};
PZ.privacy=async function(){const items=[['explore','الظهور في الاستكشاف'],['location','مشاركة الموقع أثناء الفعاليات'],['scout','إشعارات الكشافين']];return PZ.page('privacy','<section class="pz-panel">'+items.map(function(x){let on=true;try{on=localStorage.getItem('pz_priv_'+x[0])!=='0'}catch(e){}return '<div class="pz-row"><div class="pz-row-body"><b>'+x[1]+'</b><small>يمكنك تغييره في أي وقت.</small></div><button class="pz-toggle '+(on?'on':'')+'" onclick="window.PZ.togglePrivacy(\''+x[0]+'\',this)"></button></div>'}).join('')+'</section>')};
PZ.togglePrivacy=function(k,b){try{const on=localStorage.getItem('pz_priv_'+k)!=='0';localStorage.setItem('pz_priv_'+k,on?'0':'1');b.classList.toggle('on',!on);toast('حُفظ الخيار')}catch(e){}};
PZ.explore=async function(){const r=await PZ.safe('matches',sb.from('matches').select('*').in('status',['open','today','live']).order('created_at',{ascending:false}).limit(30));return PZ.page('explore','<section class="pz-panel">'+(r.length?r.map(function(m){return '<div class="pz-row"><span class="pz-row-icon">⚽</span><div class="pz-row-body"><b>'+PZ.e(m.title)+'</b><small>'+PZ.e(m.match_time||'')+' · '+PZ.e(m.venue||'')+'</small></div><button class="pz-action primary" onclick="window.PZ.joinMatch(\''+PZ.e(m.id)+'\')">انضم</button></div>'}).join(''):PZ.empty('لا مباريات مفتوحة الآن','تظهر فور نشرها'))+'</section>')};
PZ.joinMatch=async function(id){try{const r=await sb.from('match_joins').upsert({match_id:id,player_id:ME.id,player_name:ME.name,attended:false},{onConflict:'match_id,player_id'});if(r.error)throw r.error;toast('انضممت — دخلت المباراة تقويمك')}catch(e){toast('تعذّر الانضمام',1)}};
PZ.find=async function(){const r=await PZ.safe('profiles',sb.from('profiles').select('id,name,role,org,pos').limit(100));PZ.findCache=r;return PZ.page('find','<section class="pz-panel"><label class="pz-search" style="margin:0"><span>⌕</span><input id="pzEntitySearch" placeholder="اسم لاعب أو مدرب أو أكاديمية أو ملعب" oninput="window.PZ.renderFind(this.value)"></label><div id="pzFindResults" style="margin-top:10px">'+PZ.findRows('',r)+'</div></section>')};
PZ.findRows=function(q,r){q=String(q||'').toLowerCase();const a=(r||[]).filter(function(x){return !q||(String(x.name||'')+' '+String(x.org||'')+' '+String(x.pos||'')).toLowerCase().includes(q)}).slice(0,30);return a.length?a.map(function(x){return '<div class="pz-row" onclick="'+(x.role==='player'?"window.PZ.go('publicView','"+PZ.e(x.name)+"')":"void 0")+'"><span class="pz-row-icon">'+PZ.e((x.role||'?').slice(0,1).toUpperCase())+'</span><div class="pz-row-body"><b>'+PZ.e(x.name)+'</b><small>'+PZ.e(x.org||x.pos||x.role)+'</small></div><span class="pz-row-side">'+PZ.e(x.role)+'</span></div>'}).join(''):PZ.empty('لا نتيجة','جرّب اسمًا آخر')};
PZ.renderFind=function(q){const b=document.getElementById('pzFindResults');if(b)b.innerHTML=PZ.findRows(q,PZ.findCache||[])};
PZ.pitch=async function(){const r=await PZ.safe('events',sb.from('match_events').select('*,matches(title)').order('created_at',{ascending:false}).limit(30));return PZ.page('pitch','<section class="pz-panel">'+(r.length?r.map(function(e){return '<div class="pz-row"><span class="pz-row-icon">'+(e.type==='goal'?'⚽':'◎')+'</span><div class="pz-row-body"><b>'+PZ.e(e.who||'لاعب')+'</b><small>'+PZ.e(typeof evLabel==='function'?evLabel(e):e.type)+' · '+PZ.e(e.matches&&e.matches.title||'')+'</small></div></div>'}).join(''):PZ.empty('المجتمع هادئ الآن','المحتوى الرياضي الموثق يظهر هنا'))+'</section>')};
PZ.news=async function(){const r=await PZ.safe('news',sb.from('pi_news').select('*').order('published_at',{ascending:false}).limit(50));return PZ.page('news','<section class="pz-panel">'+(r.length?r.map(function(n){return '<div class="pz-row"><span class="pz-row-icon">▣</span><div class="pz-row-body"><b>'+PZ.e(n.title||'خبر')+'</b><small>'+PZ.e(n.summary||n.body||'')+'</small></div></div>'}).join(''):PZ.empty('لا أخبار الآن','نبض PlayIn365 يتحدث مع وصول مستجدات'))+'</section>')};
PZ.market=async function(){const r=await PZ.safe('market',sb.from('listings').select('*').order('created_at',{ascending:false}).limit(50));return PZ.page('market','<section class="pz-panel">'+(r.length?r.map(function(l){return '<div class="pz-row"><span class="pz-row-icon">◆</span><div class="pz-row-body"><b>'+PZ.e(l.title||l.name||'عرض')+'</b><small>'+PZ.e(l.seller||l.org||'بائع')+(l.price!=null?' · '+PZ.e(l.price)+' ر.س':'')+'</small></div></div>'}).join(''):PZ.empty('لا عروض حاليًا','تظهر المنتجات والخدمات عند نشرها'))+'</section>')};
PZ.memberships=async function(){const r=await PZ.safe('memberships',sb.from('memberships').select('*').limit(40));return PZ.page('memberships','<section class="pz-panel">'+(r.length?r.map(function(m){return '<div class="pz-row"><span class="pz-row-icon">♛</span><div class="pz-row-body"><b>'+PZ.e(m.name||m.level||m.tier||'عضوية')+'</b><small>'+PZ.e(m.org||m.club||'')+'</small></div></div>'}).join(''):PZ.empty('لا عضويات نشطة','تظهر عضوياتك الرقمية هنا'))+'</section>')};
PZ.settings=async function(){return PZ.page('settings','<section class="pz-panel"><div class="pz-form-grid"><label><span class="pz-label">الاسم</span><input id="pzName" class="pz-input" value="'+PZ.e(ME.name||'')+'"></label><label><span class="pz-label">المركز</span><input id="pzPos" class="pz-input" value="'+PZ.e(ME.pos||'')+'"></label><label><span class="pz-label">العمر</span><input id="pzAge" class="pz-input" type="number" value="'+PZ.e(ME.age||'')+'"></label><label><span class="pz-label">رقم القميص</span><input id="pzShirt" class="pz-input" type="number" value="'+PZ.e(ME.shirt||'')+'"></label></div><div class="pz-actions"><button class="pz-action primary" onclick="window.PZ.saveSettings()">حفظ</button><button class="pz-action" onclick="window.PZ.go(\'publicView\')">شاهد هويتك</button></div></section>')};
PZ.saveSettings=async function(){const patch={name:(document.getElementById('pzName')||{}).value||ME.name,pos:(document.getElementById('pzPos')||{}).value||null,age:+((document.getElementById('pzAge')||{}).value||0)||null,shirt:+((document.getElementById('pzShirt')||{}).value||0)||null};try{const r=await sb.from('profiles').update(patch).eq('id',ME.id);if(r.error)throw r.error;Object.assign(ME,patch);toast('حُفظت بياناتك');render()}catch(e){toast('تعذّر الحفظ',1)}};
PZ.notifications=async function(){const r=await PZ.safe('notifications',sb.from('notifications').select('*').eq('user_id',ME.id).order('created_at',{ascending:false}).limit(50));return PZ.page('notifications','<section class="pz-panel">'+(r.length?r.map(function(n){return '<div class="pz-row"><span class="pz-row-icon">◉</span><div class="pz-row-body"><b>'+PZ.e(n.title||n.kind||'إشعار')+'</b><small>'+PZ.e(n.body||'')+'</small></div></div>'}).join(''):PZ.empty('لا شيء يحتاج انتباهك','كل شيء هادئ الآن'))+'</section>')};
PZ.coachBrief=async function(){const r=await PZ.safe('calendar',sb.from('calendar_items').select('*').eq('player_name',ME.name).order('on_date',{ascending:true}).limit(10)),n=r[0];return PZ.page('coachBrief','<section class="pz-panel">'+(n?'<div class="pz-row"><span class="pz-row-icon">◫</span><div class="pz-row-body"><b>'+PZ.e(n.title||'حصة تدريب')+'</b><small>'+PZ.e(n.on_date||'')+(n.start_time?' · '+PZ.e(n.start_time):'')+'</small></div></div>':PZ.empty('لا حصة قادمة','مدربك يرسل الخطة حين يعتمدها'))+'</section>')};
PZ.matchView=async function(){const id=PARAM,d=await Promise.all([PZ.safe('match',sb.from('matches').select('*').eq('id',id).limit(1)),PZ.safe('events',sb.from('match_events').select('*').eq('match_id',id).order('minute',{ascending:true}))]),m=d[0][0],evs=d[1];if(!m)return PZ.page('matchView',PZ.empty('المباراة غير موجودة','عد للاستكشاف','اكتشف','explore'));let body='<section class="pz-panel"><div class="pz-section-head"><div><span class="pz-eyebrow">'+PZ.e(m.comp||'MATCH')+'</span><h2>'+PZ.e(m.title)+'</h2></div><span class="pz-row-side">'+PZ.e(m.status||'')+'</span></div><div class="pz-proof"><div><b>'+PZ.e(m.score_a==null?'—':m.score_a)+'</b><span>فريق 1</span></div><div><b>'+PZ.e(m.score_b==null?'—':m.score_b)+'</b><span>فريق 2</span></div><div><b>'+PZ.e(m.match_time||'—')+'</b><span>الوقت</span></div><div><b>'+PZ.e(m.venue||'—')+'</b><span>الملعب</span></div></div></section><section class="pz-panel">'+(evs.length?evs.map(function(e){return '<div class="pz-row"><span class="pz-row-icon">'+(e.type==='goal'?'⚽':e.type==='assist'?'◎':'▮')+'</span><div class="pz-row-body"><b>'+PZ.e(typeof evLabel==='function'?evLabel(e):e.type)+'</b><small>سجّله '+PZ.e(e.recorded_by||'المنظم')+'</small></div><span class="pz-row-side">'+PZ.e(e.minute||'')+'</span></div>'}).join(''):PZ.empty('لا أحداث بعد','تظهر لحظة تسجيلها'))+'</section>';return PZ.page('matchView',body)};

PZ.bind=function(name,fn){const prev=OLD[name];T[name]=async function(){if(ME&&ME.role==='player')return fn.apply(PZ,arguments);if(prev)return prev.apply(this,arguments);return '<main><div class="card">غير متاح لهذا الدور</div></main>'}};
PZ.bind('feed',PZ.home);PZ.bind('home',PZ.home);PZ.bind('profile',PZ.publicProfile);PZ.bind('publicView',PZ.publicProfile);PZ.bind('myCard',PZ.publicProfile);
PZ.bind('records',PZ.records);PZ.bind('rating',PZ.ratingDetail);PZ.bind('ratingDetail',PZ.ratingDetail);PZ.bind('cabinet',PZ.cabinet);PZ.bind('opps',PZ.opps);
PZ.bind('calendar',PZ.wallet);PZ.bind('wallet',PZ.wallet);PZ.bind('health',PZ.health);PZ.bind('messages',PZ.messages);PZ.bind('viewLog',PZ.viewLog);PZ.bind('privacy',PZ.privacy);
PZ.bind('explore',PZ.explore);PZ.bind('find',PZ.find);PZ.bind('pitch',PZ.pitch);PZ.bind('news',PZ.news);PZ.bind('market',PZ.market);PZ.bind('memberships',PZ.memberships);
PZ.bind('settings',PZ.settings);PZ.bind('notifications',PZ.notifications);PZ.bind('coachBrief',PZ.coachBrief);PZ.bind('matchView',PZ.matchView);
if(typeof NAV!=='undefined')NAV.player=[];
const oldRender=window.render;window.render=render=async function(){PZ.close();document.body.classList.remove('pz-player');await oldRender();try{if(!ME||ME.role!=='player'||VIEW==='auth'||VIEW==='role')return;document.body.classList.add('pz-player');document.querySelectorAll('.hd,.nav').forEach(function(n){n.remove()})}catch(e){console.warn('PZ render',e)}};
})();