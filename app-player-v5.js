(function(){
'use strict';
if(!window.PZ)return;
var esc=PZ.e||function(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var v=function(x,f){return esc(x==null||x===''?(f||'—'):x)};
var qr=function(){var u=location.origin+location.pathname+'?player='+encodeURIComponent(ME.name||'سعود القحطاني');return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data='+encodeURIComponent(u)};
var num=function(x){return x==null||x===''?'—':x};
var top5=function(){return '<header class="pz5-top"><button onclick="window.PZ.openServices()">☰</button><div class="pz5-brand">Play<span>In</span><sup>365</sup></div><button onclick="window.PZ.go(\'publicView\')">〈</button></header>'};
PZ.page=function(route,body){return body};
PZ.nav=function(active){
 var a=[['home','الرئيسية','feed'],['records','تقدمي','records'],['opps','فرصي وتفاعلي','opps'],['profile','هويتي','publicView']];
 return '<nav class="pz5-nav">'+a.map(function(x){return '<button class="'+(active===x[2]?'on':'')+'" onclick="window.PZ.go(\''+x[2]+'\')"><span>'+PZ.icon(x[0])+'</span><b>'+x[1]+'</b></button>'}).join('')+'<button onclick="window.PZ.openServices()"><span>'+PZ.icon('services')+'</span><b>المزيد</b></button></nav>';
};
function stat(value,label,accent){return '<div class="pz5-stat"><strong class="'+(accent||'')+'">'+v(value)+'</strong><span>'+label+'</span></div>'}
function eventLine(c,i){return '<div class="pz5-event '+(i===0?'now':'')+'"><span class="pz5-time">'+v(c.start_time,'—')+'</span><span class="pz5-dot"></span><div><b>'+v(c.title,'جلسة تدريب')+'</b><small>'+v(c.location,'خطة المدرب')+'</small></div></div>'}
function matchRow(m){
 var title=String(m.title||'مباراة اليوم'), sides=title.split('×');
 var home=m.home||m.home_team||(sides[0]||'الصقور').replace(/\s+—.*$/,'').trim();
 var away=m.away||m.away_team||(sides[1]||'النجمة').split('—')[0].trim();
 return '<button class="pz5-match" onclick="window.PZ.go(\'matchView\',\''+v(m.id,'')+'\')"><span class="pz5-live">'+(m.status==='live'?'مباشر':'اليوم')+'</span><div><b>'+v(home)+'</b><small>'+v(m.match_time||m.time,'21:00')+'</small></div><em>×</em><div><b>'+v(away)+'</b><small>'+v(m.venue,'ملعب المباراة')+'</small></div><i>›</i></button>'
}
PZ.home=async function(){
 var d=await Promise.all([
  PZ.safe('matches',sb.from('matches').select('*').order('created_at',{ascending:false}).limit(30)),
  PZ.safe('events',sb.from('match_events').select('*').eq('who',ME.name).order('created_at',{ascending:false}).limit(120)),
  PZ.safe('joins',sb.from('match_joins').select('*').eq('player_id',ME.id)),
  PZ.safe('opps',sb.from('pi_opps').select('*').eq('player_name',ME.name).order('created_at',{ascending:false}).limit(8)),
  PZ.safe('health',sb.from('health_status').select('*').eq('player_name',ME.name).limit(1)),
  PZ.safe('calendar',sb.from('calendar_items').select('*').eq('player_name',ME.name).order('on_date',{ascending:true}).limit(7)),
  PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).limit(20))
 ]);
 var matches=d[0]||[],ev=d[1]||[],joins=d[2]||[],opps=d[3]||[],health=d[4]||[],cal=d[5]||[],badges=d[6]||[];
 var groups=PZ.byMatch(ev),rating=groups.length?(groups.map(PZ.score).reduce(function(a,b){return a+b},0)/groups.length).toFixed(1):'6.8';
 var verified=new Set(ev.map(function(e){return e.match_id}).concat(joins.filter(function(j){return j.attended}).map(function(j){return j.match_id}))).size||5;
 var goals=ev.filter(function(e){return e.type==='goal'}).length||7;
 var readiness=health[0]&&health[0].state?health[0].state:'جاهز جزئيًا';
 var alertText=opps.map(function(o){return v(o.title,'تحديث جديد')}).join('   ◆   ')||'تقييم المدرب الأخير جاهز للمراجعة   ◆   أكاديمية النخبة تتابع ملفك';
 var matchText=matches.map(function(m){return v(m.title,'مباراة اليوم')+'  '+v(m.match_time,'اليوم')}).join('   ◆   ')||'دوري روشن   ◆   دوري الأبطال   ◆   مباريات عالمية';
 var week=cal.slice(0,4).map(eventLine).join('')||'<div class="pz5-empty">لم يشارك المدرب خطة الأسبوع بعد.</div>';
 var matchList=matches.slice(0,3).map(matchRow).join('')||'<div class="pz5-empty">لا توجد مباريات مضافة اليوم.</div>';
 var badgeList=badges.slice(0,3).map(function(b){return '<span>✦ '+v(b.title||b.name,'إنجاز موثق')+'</span>'}).join('')||'<span>افتح أول إنجاز لك من الملعب</span>';
 var body='<div class="pz5-page">'+top5()+
 '<div class="pz5-rails"><div class="pz5-rail alert"><b>تنبيهاتك</b><div><span>'+alertText+'</span><span>'+alertText+'</span></div></div><div class="pz5-rail games"><b>المباريات التي تهمك</b><div><span>'+matchText+'</span><span>'+matchText+'</span></div></div></div>'+
 '<main class="pz5-main">'+
 '<section class="pz5-hero"><div class="pz5-hero-orbit"></div><div class="pz5-eyebrow">PLAYER COMMAND CENTER <span>● LIVE</span></div><h1>يا '+v(ME.display_name||ME.name,'سعود')+'،<br><mark>خلّ يومك يلعب لصالحك.</mark></h1><p>قراراتك الرياضية اليوم في مكان واحد: جاهزيتك، خطتك، مبارياتك، وفرصك.</p><div class="pz5-hero-bottom"><div class="pz5-score"><span>FORM</span><strong>'+v(rating)+'</strong><small>/10</small></div><div class="pz5-hero-action"><button onclick="window.PZ.go(\'health\')">سجّل جاهزيتك <b>+</b></button><small>'+v(readiness)+'</small></div></div></section>'+
 '<section class="pz5-readiness"><div class="pz5-section-head"><div><span class="pz5-label">TODAY CHECK-IN</span><h2>كيف جسمك اليوم؟</h2></div><button onclick="window.PZ.go(\'health\')">تحديث</button></div><div class="pz5-readiness-row"><div class="pz5-ring"><div><strong>72</strong><span>جاهزية</span></div></div><div class="pz5-readiness-copy"><b>إشارة اليوم: خفّف الحمل قليلًا</b><p>أكمل تقييم النوم، الأكل، الألم والإجهاد ليبني المدرب توصيتك بدقة.</p><button onclick="window.PZ.go(\'health\')">ابدأ التقييم السريع ↗</button></div></div></section>'+
 '<section class="pz5-snapshot"><div class="pz5-section-head"><div><span class="pz5-label">YOUR SNAPSHOT</span><h2>صورة أدائك الآن</h2></div><button onclick="window.PZ.go(\'records\')">كل التقدم</button></div><div class="pz5-stats">'+stat(verified,'مباراة موثقة','gold')+stat(goals,'هدف','purple')+stat(rating,'آخر تقييم','teal')+stat('3','إنجازات قريبة','orange')+'</div><div class="pz5-achievements"><div><b>الإنجاز التالي</b><span>أكمل مباراتين لفتح شارة الاستمرارية</span></div><strong>3/5</strong></div></section>'+
 '<section class="pz5-radar"><div class="pz5-section-head"><div><span class="pz5-label">LIVE RADAR</span><h2>المشهد الرياضي اليوم</h2></div><button onclick="window.PZ.go(\'explore\')">تخصيص</button></div><div class="pz5-filter"><button class="on">الكل</button><button>روشن</button><button>الأبطال</button><button>عالمي</button></div><div class="pz5-matches">'+matchList+'</div></section>'+
 '<section class="pz5-two-col"><article class="pz5-focus"><span class="pz5-label">NEXT MOVE</span><h2>خطوتك التالية</h2><b>'+v(cal[0]&&cal[0].title,'حصة تدريب فني')+'</b><small>'+v(cal[0]&&cal[0].on_date,'اليوم · حسب خطة المدرب')+'</small><button onclick="window.PZ.go(\'coachBrief\')">شوف توصية المدرب ↗</button></article><article class="pz5-focus signal"><span class="pz5-label">SIGNALS</span><h2>وش وصلك؟</h2><b>'+v(opps[0]&&opps[0].title,'ملفك يشهد اهتمامًا جديدًا')+'</b><small>'+opps.length+' تحديثات تحتاج انتباهك</small><button onclick="window.PZ.go(\'opps\')">افتح التفاعلات ↗</button></article></section>'+
 '<section class="pz5-week"><div class="pz5-section-head"><div><span class="pz5-label">YOUR WEEK</span><h2>خطتك على خط زمني</h2></div><button onclick="window.PZ.go(\'calendar\')">كل الجدول</button></div><div class="pz5-timeline">'+week+'</div></section>'+
 '<section class="pz5-badges"><div><span class="pz5-label">MILESTONES</span><h2>إنجازاتك تتحرك معك</h2><p>كل دقيقة، مباراة، هدف وتقييم موثق يفتح لك خطوة جديدة.</p></div><div class="pz5-badge-list">'+badgeList+'</div></section>'+
 '</main>'+PZ.nav('feed')+'</div>';
 return PZ.page('feed',body)
};
PZ.myCard=async function(){
 var d=await Promise.all([PZ.safe('events',sb.from('match_events').select('*').eq('who',ME.name).limit(120)),PZ.safe('joins',sb.from('match_joins').select('*').eq('player_name',ME.name)),PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).limit(8))]);
 var ev=d[0]||[],joins=d[1]||[],badges=d[2]||[],verified=new Set(ev.map(function(e){return e.match_id}).concat(joins.filter(function(j){return j.attended}).map(function(j){return j.match_id}))).size||5;
 var goals=ev.filter(function(e){return e.type==='goal'}).length||7, assists=ev.filter(function(e){return e.type==='assist'}).length||2, code=ME.athlete_id||ME.handle||'PI-89A89D4D';
 var achievements=badges.slice(0,4).map(function(b){return '<li><span>✦</span>'+v(b.title||b.name,'إنجاز موثق')+'</li>'}).join('')||'<li><span>✦</span>أول موسم موثق</li><li><span>✦</span>حضور مستمر</li>';
 var body='<div class="pz5-profile-page">'+PZ.top()+'<main class="pz5-profile-main"><section class="pz5-identity"><div class="pz5-identity-top"><span class="pz5-label">PUBLIC ATHLETE IDENTITY</span><span class="pz5-verified">✓ هوية موثقة</span></div><div class="pz5-identity-grid"><div class="pz5-avatar">'+PZ.photo(ME,'pz5-avatar-img')+'<span class="pz5-avatar-mark">365</span></div><div><h1>'+v(ME.display_name||ME.name,'سعود القحطاني')+'</h1><p>'+v(ME.pos,'مهاجم')+' · '+v(ME.city,'الرياض')+' · U16</p><strong class="pz5-athlete-id">'+v(code)+'</strong><div class="pz5-tags"><span>موثق</span><span>مهاجم</span><span>الرياض</span></div></div></div><div class="pz5-profile-actions"><button class="primary" onclick="window.PZ.share(\''+esc(ME.name)+'\')">شارك الهوية ↗</button><button onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href)">انسخ الرابط</button></div></section>'+
 '<section class="pz5-profile-metrics">'+stat(verified,'مباراة موثقة','gold')+stat(goals,'هدف','purple')+stat(assists,'صناعة','teal')+stat('6.8','تقييم عام','orange')+'</section>'+
 '<section class="pz5-profile-block"><div class="pz5-section-head"><div><span class="pz5-label">PROOF OF WORK</span><h2>الأرقام التي تتكلم عنك</h2></div></div><div class="pz5-proof-grid"><div><strong>6.8</strong><span>متوسط التقييم</span><i style="width:68%"></i></div><div><strong>82%</strong><span>حضور والتزام</span><i style="width:82%"></i></div><div><strong>+14</strong><span>تقدم هذا الموسم</span><i style="width:54%"></i></div></div></section>'+
 '<section class="pz5-profile-block pz5-achieve-block"><div><span class="pz5-label">HIGHLIGHTS</span><h2>أبرز الإنجازات</h2></div><ul>'+achievements+'</ul></section>'+
 '<section class="pz5-profile-share"><div><span class="pz5-label">SCAN TO OPEN</span><h2>هوية رياضية قابلة للمشاركة</h2><p>صورة اللاعب، هويته، أرقامه وإنجازاته في رابط واحد.</p></div><img src="'+qr()+'" alt="رمز QR لهوية اللاعب"><b>'+v(code)+'</b></section></main>'+PZ.nav('publicView')+'</div>';
 return PZ.page('myCard',body)
};
PZ.bind('feed',PZ.home);PZ.bind('home',PZ.home);PZ.bind('myCard',PZ.myCard);
})();