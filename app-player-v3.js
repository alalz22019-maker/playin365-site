(function(){
'use strict';
if(!window.PZ)return;
var oldHome=PZ.home;
PZ.meta.myCard=['profile','PLAYER CARD','بطاقة اللاعب','بطاقة مشاركة جاهزة'];
PZ.services=[['profile','هويتي الرياضية','الواجهة العامة التي تسوّق لك','publicView','private'],['profile','بطاقة اللاعب','شارك إنجازاتك وهويتك','myCard','private']].concat(PZ.services.filter(function(s){return s[3]!=='publicView'&&s[3]!=='myCard'}));
PZ.nav=function(active){
 var a=[['home','الرئيسية','feed'],['records','تقدمي','records'],['opps','فرصي وتفاعلي','opps'],['profile','هويتي','publicView']];
 return '<nav class="pz-nav pz-nav-v3">'+a.map(function(x){
  return '<button class="'+(active===x[2]?'on':'')+'" onclick="window.PZ.go(\''+x[2]+'\')"><span class="pz-nav-icon">'+PZ.icon(x[0])+'</span><b>'+x[1]+'</b></button>';
 }).join('')+'<button class="pz-nav-services" onclick="window.PZ.openServices()"><span class="pz-nav-icon">'+PZ.icon('services')+'</span><b>الخدمات</b></button></nav>';
};
function val(n){return PZ.e(n==null?'—':n)}
function qr(name){var u=location.origin+location.pathname+'?player='+encodeURIComponent(name||ME.name);return 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data='+encodeURIComponent(u)}
PZ.myCard=async function(){
 var d=await Promise.all([
  PZ.safe('events',sb.from('match_events').select('*').eq('who',ME.name).order('created_at',{ascending:false}).limit(120)),
  PZ.safe('joins',sb.from('match_joins').select('*').eq('player_name',ME.name)),
  PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).limit(8))
 ]);
 var evs=d[0],joins=d[1],badges=d[2],verified=new Set(evs.map(function(e){return e.match_id}).concat(joins.filter(function(j){return j.attended}).map(function(j){return j.match_id}))).size;
 var goals=evs.filter(function(e){return e.type==='goal'}).length, assists=evs.filter(function(e){return e.type==='assist'}).length;
 var groups=PZ.byMatch(evs),rating=groups.length?(groups.map(PZ.score).reduce(function(a,b){return a+b},0)/groups.length).toFixed(1):'—';
 var code=ME.athlete_id||ME.handle||('PI-'+String(ME.id||'').slice(0,8).toUpperCase());
 var trophies=badges.slice(0,3).map(function(b){return '<span>'+val(b.title||b.name||'إنجاز موثق')+'</span>'}).join('')||'<span>أول إنجاز يبدأ من الملعب</span>';
 var body='<section class="pz-card-wrap"><div class="pz-share-card"><div class="pz-card-top"><span>'+PZ.brand()+'</span><span>'+val(ME.org||'PlayIn365')+' · موسم 2026/27</span></div><div class="pz-card-main">'+PZ.photo(ME,'pz-card-photo')+'<div class="pz-card-copy"><small>ATHLETE IDENTITY</small><h1>'+PZ.playerName(ME.display_name||ME.name)+'</h1><p>'+val(ME.pos||'لاعب')+' · '+val(ME.city||'الرياض')+'</p><code>'+val(code)+'</code></div></div><div class="pz-card-stats"><div><b>'+verified+'</b><span>مباراة</span></div><div><b>'+goals+'</b><span>هدف</span></div><div><b>'+assists+'</b><span>صناعة</span></div></div><div class="pz-card-trophies">'+trophies+'</div><div class="pz-card-bottom"><img src="'+qr(ME.name)+'" alt="رمز QR لفتح هوية اللاعب"><div><small>التقييم العام</small><strong>'+val(rating)+'<em>/10</em></strong><span>هوية رياضية موثقة · '+val(code)+'</span></div></div></div><div class="pz-card-actions"><button class="pz-action primary" onclick="window.PZ.share(\''+PZ.e(ME.name)+'\')">شارك البطاقة</button><button class="pz-action" onclick="window.PZ.go(\'publicView\')">عرض البروفايل</button></div></section>';
 return PZ.page('myCard',body);
};
PZ.home=async function(){
 var d=await Promise.all([
  PZ.safe('matches',sb.from('matches').select('*').order('created_at',{ascending:false}).limit(20)),
  PZ.safe('events',sb.from('match_events').select('*').eq('who',ME.name).order('created_at',{ascending:false}).limit(100)),
  PZ.safe('joins',sb.from('match_joins').select('*').eq('player_id',ME.id)),
  PZ.safe('opps',sb.from('pi_opps').select('*').eq('player_name',ME.name).order('created_at',{ascending:false}).limit(8)),
  PZ.safe('views',sb.from('pi_views').select('*').eq('subject',ME.name).limit(30)),
  PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).limit(20)),
  PZ.safe('health',sb.from('health_status').select('*').eq('player_name',ME.name).limit(1)),
  PZ.safe('calendar',sb.from('calendar_items').select('*').eq('player_name',ME.name).order('on_date',{ascending:true}).limit(7)),
  PZ.safe('news',sb.from('pi_news').select('*').limit(6))
 ]);
 var matches=d[0],evs=d[1],joins=d[2],opps=d[3],views=d[4],badges=d[5],health=d[6],cal=d[7],news=d[8];
 var groups=PZ.byMatch(evs),series=groups.map(PZ.score),rating=series.length?(series.reduce(function(a,b){return a+b},0)/series.length).toFixed(1):'—';
 var goals=evs.filter(function(e){return e.type==='goal'}).length,assists=evs.filter(function(e){return e.type==='assist'}).length;
 var verified=new Set(evs.map(function(e){return e.match_id}).concat(joins.filter(function(j){return j.attended}).map(function(j){return j.match_id}))).size;
 var today=matches.find(function(m){return ['live','today'].includes(m.status)}), next=today||matches.find(function(m){return m.status==='open'});
 var fatigue=health[0]&&health[0].state?health[0].state:'لم تُسجل بعد';
 var coachText='آخر تقييم أو توصية من مدربك تظهر هنا عند اعتمادها.';
 var schedule=cal.length?cal.slice(0,4).map(function(c){return '<div class="pz-daily-row"><b>'+val(c.on_date||'هذا الأسبوع')+'</b><span>'+val(c.title||'حصة تدريب')+(c.start_time?' · '+val(c.start_time):'')+'</span></div>'}).join(''):'<div class="pz-empty"><b>لا توجد خطة منشورة</b><small>تظهر هنا خطة المدرب عند مشاركتها معك.</small></div>';
 var alerts=(opps||[]).slice(0,3).map(function(o){return '<button class="pz-daily-item" onclick="window.PZ.go(\'opps\')"><b>'+val(o.title||'فرصة رياضية')+'</b><small>'+val(o.org||o.kind||'فرصة')+' · '+val(o.status||'جديدة')+'</small></button>'}).join('');
 var body='<div class="pz-daily-marquee"><div><i>مباريات اليوم</i><span>'+val(today?today.title:'لا توجد مباراة اليوم')+(today&&today.match_time?' · '+val(today.match_time):'')+'</span></div><div><i>تنبيهك التالي</i><span>'+val(opps[0]&&opps[0].title||'لا توجد تنبيهات جديدة')+'</span></div></div>';
 body+='<section class="pz-daily-welcome"><div><span class="pz-eyebrow">PLAYER DAILY OS</span><h1>هلا '+val(ME.name)+' 👋</h1><p>وش تحتاج تسوي اليوم عشان تتقدم؟</p></div><button onclick="window.PZ.go(\'myCard\')">بطاقتي</button></section>';
 body+='<section class="pz-daily-readiness"><div class="pz-section-head"><div><span class="pz-eyebrow">TODAY CHECK-IN</span><h2>جاهزيتك اليوم</h2></div><button onclick="window.PZ.go(\'health\')">سجّل الآن</button></div><div class="pz-ready-grid"><div><b>'+val(fatigue)+'</b><span>الحالة الحالية</span></div><div><b>'+val(rating)+'</b><span>آخر تقييم أداء</span></div><div><b>'+verified+'</b><span>مباريات موثقة</span></div></div><p class="pz-daily-hint">تقييم سريع للنوم والأكل والإجهاد، ويُخصص حسب نموذج مدربك.</p></section>';
 body+='<section class="pz-daily-match"><div class="pz-section-head"><div><span class="pz-eyebrow">PLAYIN NOW</span><h2>مباريات اليوم</h2></div><button onclick="window.PZ.go(\'explore\')">استكشف</button></div><div class="pz-match-stack">'+[today,next].filter(function(m,i,a){return m&&a.findIndex(function(x){return x&&x.id===m.id})===i}).slice(0,2).map(function(m){return '<button onclick="window.PZ.go(\'matchView\',\''+PZ.e(m.id)+'\')"><b>'+val(m.title)+'</b><small>'+val(m.match_time||'اليوم')+' · '+val(m.venue||'ملعب رياضي')+'</small><em>'+val(m.status==='live'?'مباشر':m.status==='today'?'اليوم':'قريبًا')+'</em></button>'}).join('')||'<div class="pz-empty"><b>لا مباريات اليوم</b><small>تظهر هنا المباريات المرتبطة بك.</small></div>'+'</div></section>';
 body+='<section class="pz-daily-coach"><div class="pz-section-head"><div><span class="pz-eyebrow">COACH & AI</span><h2>الخطة والتوصية</h2></div><button onclick="window.PZ.go(\'coachBrief\')">التفاصيل</button></div><div class="pz-coach-note"><b>'+coachText+'</b><small>لا نعرض توصية غير معتمدة على أنها من المدرب.</small></div><div class="pz-week-plan">'+schedule+'</div></section>';
 body+='<section><div class="pz-section-head"><div><span class="pz-eyebrow">PROGRESS</span><h2>تقدمك وإنجازاتك</h2></div><button onclick="window.PZ.go(\'records\')">كل التقدم</button></div><div class="pz-progress-grid"><button onclick="window.PZ.go(\'records\')"><b>'+val(rating)+'</b><span>التقييم الحالي</span><small>آخر '+verified+' مباريات</small></button><button onclick="window.PZ.go(\'cabinet\')"><b>'+badges.length+'</b><span>إنجازات مفتوحة</span><small>شاهد ما تبقى لك</small></button><button onclick="window.PZ.go(\'viewLog\')"><b>'+views.length+'</b><span>اهتمام بملفك</span><small>مشاهدات موثقة</small></button></div></section>';
 body+='<section><div class="pz-section-head"><div><span class="pz-eyebrow">INTERACTION</span><h2>وش وصلك؟</h2></div><button onclick="window.PZ.go(\'opps\')">عرض الكل</button></div><div class="pz-daily-list">'+(alerts||'<div class="pz-empty"><b>ما عندك شيء جديد</b><small>كل شيء هادئ حاليًا.</small></div>')+'</div></section>';
 body+='<section><div class="pz-section-head"><div><span class="pz-eyebrow">QUICK ACCESS</span><h2>الخدمات الأساسية</h2></div><button onclick="window.PZ.openServices()">كل الخدمات</button></div><div class="pz-quick-grid"><button onclick="window.PZ.go(\'records\')">تقدمي</button><button onclick="window.PZ.go(\'health\')">الجاهزية</button><button onclick="window.PZ.go(\'opps\')">فرصي وتفاعلي</button><button onclick="window.PZ.go(\'publicView\')">هويتي</button></div></section>';
 return '<div class="pz-page">'+PZ.top()+'<main class="pz-main pz-main-daily">'+body+'</main>'+PZ.nav('feed')+'<button class="pz-fab pz-basmat-fab" onclick="window.PZ.toggleFab()">'+PZ.icon('plus')+'</button></div>';
};
PZ.bind('feed',PZ.home);PZ.bind('home',PZ.home);PZ.bind('myCard',PZ.myCard);
})();