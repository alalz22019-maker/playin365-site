(function(){
'use strict';
if(!window.PZ)return;
var esc=PZ.e||function(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var v=function(x,f){return esc(x==null||x===''?(f||'—'):x)};
var qr=function(){var u=location.origin+location.pathname+'?player='+encodeURIComponent(ME.name||'اللاعب');return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data='+encodeURIComponent(u)};
var num=function(x){return x==null||x===''?'—':x};
function isPreviewDemo(){try{return location.hostname.endsWith('.vercel.app')&&location.hostname.indexOf('-git-codex-player-ac-')>=0&&new URLSearchParams(location.search).get('demo')==='1'}catch(_){return false}}
function demoBanner(){return isPreviewDemo()?'<aside class="pz5-demo-banner" role="status"><span>PREVIEW</span><b>بيانات تجريبية</b><small>للاختبار فقط · لا تمثل مباريات أو تفاعلات حقيقية</small></aside>':''}
function demoPack(today){
 var matchId='demo-player-match-'+today;
 var comps=['دوري الناشئين التجريبي','بطولة الرياض التجريبية','كأس الأكاديميات التجريبي'];
 var matches=[{id:matchId,title:'أكاديمية النخبة × أكاديمية الرياض',comp:'مباراة تجريبية U14',match_date:today,match_time:'19:15',status:'NS',team_a:'أكاديمية النخبة',team_b:'أكاديمية الرياض التجريبية',venue:'ملعب تجريبي',demo:true}];
 var events=[],joins=[];
 [5,3,2,0].forEach(function(i){
  var date=new Date(today+'T12:00:00+03:00');
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth()-i);
  date.setUTCDate(6+(i%3)*5);
  var played=date.toISOString().slice(0,10),id='demo-player-history-'+i;
  var match={id:id,title:'مباراة تجريبية · الجولة '+(6-i),comp:comps[i%comps.length],match_date:played+'T18:30:00+03:00',status:'FT',score_a:i%2?2:3,score_b:1,team_a:ME.org||'أكاديمية النخبة التجريبية',team_b:'فريق تجريبي',demo:true};
  matches.push(match);
  joins.push({id:'demo-player-join-'+i,player_id:ME.id,player_name:ME.name,match_id:id,attended:true,demo:true});
  events.push({id:'demo-player-goal-'+i,who:ME.name,match_id:id,type:'goal',minute:14+i*7,recorded_by:'demo',created_at:played+'T20:00:00+03:00',demo:true});
  if(i%2===0)events.push({id:'demo-player-assist-'+i,who:ME.name,match_id:id,type:'assist',minute:61,recorded_by:'demo',created_at:played+'T20:20:00+03:00',demo:true});
 });
 return {
  matches:matches,events:events,joins:joins,
  opps:[{id:'demo-interest-'+today,title:'اهتمام استكشافي تجريبي',created_at:new Date().toISOString()}],
  health:[{state:'ready',phase:'جاهز للتدريب',note:'تقييم يومي تجريبي — النوم جيد، الإجهاد منخفض.',updated_at:new Date().toISOString()}],
  calendar:[
   {id:'demo-session-1',on_date:addIsoDays(today,1),at_time:'17:30',title:'حصة مهارية · تجريبي',org:'أكاديمية النخبة (بيانات تجريبية)'},
   {id:'demo-session-2',on_date:addIsoDays(today,3),at_time:'18:00',title:'استشفاء وحركة · تجريبي',org:'خطة أسبوعية تجريبية'},
   {id:'demo-session-3',on_date:addIsoDays(today,5),at_time:'19:15',title:'مباراة ودية · تجريبي',org:'ملعب تجريبي'}
  ],
  badges:[
   {id:'demo-badge-1',title:'إنجاز تجريبي · أول هدف',person:ME.name},
   {id:'demo-badge-2',title:'إنجاز تجريبي · لاعب الجولة',person:ME.name},
   {id:'demo-badge-3',title:'إنجاز تجريبي · هدف وصناعة في مباراة',person:ME.name}
  ]
 }
}
var top5=function(){return '<header class="pz5-top"><button onclick="window.PZ.openServices()">☰</button><div class="pz5-brand">Play<span>In</span><sup>365</sup></div><button onclick="window.PZ.go(\'publicView\')">〈</button></header>'};
PZ.page=function(route,body){
 var markup=String(body||'');
 if(isPreviewDemo()&&markup.indexOf('pz5-demo-banner')<0&&markup.indexOf('pj-demo-banner')<0)markup=demoBanner()+markup;
 return markup
};
PZ.nav=function(active){
 var a=[['home','الرئيسية','feed'],['records','تقدمي','records'],['opps','فرصي وتفاعلي','opps'],['profile','هويتي','publicView']];
 return '<nav class="pz5-nav">'+a.map(function(x){return '<button class="'+(active===x[2]?'on':'')+'" onclick="window.PZ.go(\''+x[2]+'\')"><span>'+PZ.icon(x[0])+'</span><b>'+x[1]+'</b></button>'}).join('')+'<button onclick="window.PZ.openServices()"><span>'+PZ.icon('services')+'</span><b>المزيد</b></button></nav>';
};
function stat(value,label,accent){return '<div class="pz5-stat"><strong class="'+(accent||'')+'">'+v(value)+'</strong><span>'+label+'</span></div>'}
function isoInRiyadh(value){
 if(!value)return '';
 var raw=String(value);
 if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
 var date=new Date(raw);if(!Number.isFinite(date.getTime()))return '';
 var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date),map={};
 parts.forEach(function(p){map[p.type]=p.value});
 return map.year+'-'+map.month+'-'+map.day
}
function todayRiyadh(){return isoInRiyadh(new Date().toISOString())}
function dayLabel(value){var iso=isoInRiyadh(value);return iso?new Intl.DateTimeFormat('ar-SA',{timeZone:'Asia/Riyadh',day:'numeric',month:'short'}).format(new Date(iso+'T12:00:00+03:00')):''}
function addIsoDays(iso,days){var p=iso.split('-').map(Number),d=new Date(Date.UTC(p[0],p[1]-1,p[2]));d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
function matchDay(m){return isoInRiyadh(m.match_date||m.kickoff_at||m.starts_at||m.date||m.kickoff)}
function matchState(m){var s=m.status&&typeof m.status==='object'?(m.status.short||m.status.long||''):m.status;return String(s||'').trim().toUpperCase()}
function isLiveMatch(m){return /^(1H|2H|HT|ET|BT|P|LIVE)$/.test(matchState(m))}
function isEndedMatch(m){return /^(FT|AET|PEN|FINAL|FINISHED|COMPLETED|COMPLETE)$/.test(matchState(m))}
function isCancelledMatch(m){return /^(CANC|PST|ABD|SUSP|INT|TBD|WO|AWD)$/.test(matchState(m))}
function matchClock(m){
 if(isLiveMatch(m)&&m.elapsed!=null)return String(m.elapsed)+'′';
 if(m.match_time||m.time||m.at_time)return String(m.match_time||m.time||m.at_time);
 var raw=m.date||m.kickoff_at||m.starts_at;if(!raw)return '—';
 var d=new Date(raw);if(!Number.isFinite(d.getTime()))return '—';
 return new Intl.DateTimeFormat('ar-SA',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit'}).format(d)
}
function matchCategory(m){
 var name=String(m.league_name||m.competition||m.comp||'').toLowerCase(),country=String(m.country||'').toLowerCase();
 if((/saudi|السعود/.test(country))&&(/pro league|دوري روشن|دوري المحترفين/.test(name)))return 'roshn';
 if(/champions league|دوري أبطال أوروبا|دوري الابطال/.test(name))return 'champions';
 if(/premier league|la liga|bundesliga|serie a|ligue 1|eredivisie|primeira liga|copa libertadores|europa league|world cup|كأس العالم|الدوري الإنجليزي|الدوري الاسباني|الدوري الألماني|الدوري الإيطالي|الدوري الفرنسي/.test(name))return 'global';
 return ''
}
function eventLine(c,i){
 var time=[c.on_date?dayLabel(c.on_date):'',c.at_time||c.start_time||''].filter(Boolean).join(' · ')||'—',detail=c.org||c.subtitle||'';
 var state=c.confirmed===false?'بانتظار التأكيد':(detail||'موعد في الجدول');
 return '<div class="pz5-event '+(i===0?'now':'')+'"><span class="pz5-time">'+v(time)+'</span><span class="pz5-dot"></span><div><b>'+v(c.title,'موعد')+'</b><small>'+v(state)+'</small></div></div>'
}
function matchRow(m){
 var teams=m.teams||{},title=String(m.title||''),sides=title.split('×');
 var home=m.home||m.home_team||(teams.home&&teams.home.name)||m.team_a||(sides[0]||'').replace(/\s+—.*$/,'').trim();
 var away=m.away||m.away_team||(teams.away&&teams.away.name)||m.team_b||(sides[1]||'').split('—')[0].trim();
 var status=m.demo&&isLiveMatch(m)?'مباشر · تجريبي':(isLiveMatch(m)?'مباشر':(isEndedMatch(m)?'انتهت':(matchDay(m)===todayRiyadh()?'اليوم':'قادمة')));
 var goals=m.goals||{};
 var score=(goals.home!=null&&goals.away!=null)?goals.home+' : '+goals.away:((m.score_a!=null&&m.score_b!=null)?m.score_a+' : '+m.score_b:'×');
 var comp=m.league_name||m.competition||m.comp||'';
 var time=matchClock(m);
 return '<article class="pz5-match '+(isLiveMatch(m)?'is-live':'')+(m.demo?' is-demo':'')+'"><span class="pz5-live">'+v(status)+'</span><div><b>'+v(home,'—')+'</b><small>'+v(comp,'مباراة اليوم')+(m.demo?' · تجريبي':'')+'</small></div><em>'+v(score)+'</em><div><b>'+v(away,'—')+'</b><small>'+v(time)+'</small></div></article>'
}
PZ._radarFixtures=PZ._radarFixtures||[];
PZ._playerMatches=PZ._playerMatches||[];
PZ._radarStatus='';
PZ._radarCategory='all';
function renderRadarRows(){
 var today=todayRiyadh(),selected=PZ._radarCategory||'all';
 var external=(PZ._radarFixtures||[]).filter(function(m){return matchDay(m)===today&&!isCancelledMatch(m)&&!!matchCategory(m)});
 var own=(PZ._playerMatches||[]).filter(function(m){return matchDay(m)===today&&!isCancelledMatch(m)});
 var rows=selected==='all'?own.concat(external):external.filter(function(m){return matchCategory(m)===selected});
 rows.sort(function(a,b){return String(a.date||a.kickoff_at||a.starts_at||a.match_time||'').localeCompare(String(b.date||b.kickoff_at||b.starts_at||b.match_time||''))});
 var box=document.querySelector('.pz5-matches');
 if(box){var empty=PZ._radarStatus==='unconfigured'?'الربط المباشر للمباريات غير مهيأ حاليًا.':(PZ._radarStatus==='error'?'تعذّر تحديث المباريات الآن.':(selected==='all'?'لا توجد مباريات مجدولة اليوم.':'لا توجد مباريات اليوم في هذا التصنيف.'));box.innerHTML=rows.length?rows.slice(0,6).map(matchRow).join(''):'<div class="pz5-empty">'+empty+'</div>'}
 var ticker=document.querySelector('.pz5-rail.games div');
 if(ticker){var line=rows.length?rows.slice(0,10).map(function(m){var h=m.home||m.team_a||((m.title||'').split('×')[0]||'');var a=m.away||m.team_b||((m.title||'').split('×')[1]||'');return v(h)+' × '+v(a)+' · '+v(matchClock(m))+(m.demo?' · تجريبي':'')}).join('　◆　'):(PZ._radarStatus==='unconfigured'?'الربط المباشر للمباريات غير مهيأ حاليًا':(PZ._radarStatus==='error'?'تعذّر تحديث المباريات الآن':'لا توجد مباريات مدرجة اليوم'));ticker.innerHTML='<span>'+line+'</span><span>'+line+'</span>'}
}
PZ.filterMatches=function(kind){
 PZ._radarCategory=kind||'all';
 document.querySelectorAll('.pz5-filter button[data-kind]').forEach(function(button){var active=button.getAttribute('data-kind')===PZ._radarCategory;button.classList.toggle('on',active);button.setAttribute('aria-pressed',active?'true':'false')});
 renderRadarRows()
};
PZ.loadSportsRadar=async function(){
 PZ._radarStatus='loading';
 try{
  var demo=isPreviewDemo(),query='?date='+encodeURIComponent(todayRiyadh())+(demo?'&demo=1':'');var response=await fetch('/api/football-fixtures'+query,{headers:{Accept:'application/json'}});
  if(!response.ok){PZ._radarStatus=response.status===503?'unconfigured':'error';throw new Error('FIXTURES_UNAVAILABLE')}
  var payload=await response.json();PZ._radarFixtures=Array.isArray(payload.fixtures)?payload.fixtures:[];PZ._radarStatus=payload.mode==='preview-demo'?'demo':'ready'
 }catch(error){PZ._radarFixtures=[];if(PZ._radarStatus==='loading')PZ._radarStatus='error'}
 renderRadarRows()
};
PZ.home=async function(){
 var today=todayRiyadh(),weekEnd=addIsoDays(today,6),demo=isPreviewDemo();
 var d=demo?[[],[],[],[],[],[],[]]:await Promise.all([
  PZ.safe('matches',sb.from('matches').select('*').order('created_at',{ascending:false}).limit(60)),
  PZ.safe('events',sb.from('match_events').select('*').eq('who',ME.name).order('created_at',{ascending:false}).limit(120)),
  PZ.safe('joins',sb.from('match_joins').select('*').eq('player_id',ME.id)),
  PZ.safe('opps',sb.from('pi_opps').select('*').eq('player_name',ME.name).order('created_at',{ascending:false}).limit(8)),
  PZ.safe('health',sb.from('health_status').select('*').eq('player_name',ME.name).order('updated_at',{ascending:false}).limit(1)),
  PZ.safe('calendar',sb.from('calendar_items').select('*').eq('player_name',ME.name).gte('on_date',today).lte('on_date',weekEnd).order('on_date',{ascending:true}).limit(7)),
  PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).limit(20))
 ]);
 var matches=d[0]||[],ev=d[1]||[],joins=d[2]||[],opps=d[3]||[],health=d[4]||[],cal=d[5]||[],badges=d[6]||[];
 var coachRating='—',coachMeta='لا يوجد تقييم حديث';
 if(demo){var sample=demoPack(today);matches=sample.matches;ev=sample.events;joins=sample.joins;opps=sample.opps;health=sample.health;cal=sample.calendar;badges=sample.badges;coachRating='6.8';coachMeta='تقييم تجريبي · آخر حصة'}
 var trustedEvents=ev.filter(function(e){return !!e.recorded_by});
 var goals=trustedEvents.filter(function(e){return e.type==='goal'}).length;
 var assists=trustedEvents.filter(function(e){return e.type==='assist'}).length;
 var verifiedIds=new Set(trustedEvents.map(function(e){return e.match_id}).concat(joins.filter(function(j){return j.attended}).map(function(j){return j.match_id})).filter(Boolean));
 var verified=verifiedIds.size;
 var latestHealth=health[0],healthDate=latestHealth?isoInRiyadh(latestHealth.updated_at):'',healthToday=healthDate===today;
 var readiness=healthToday?(latestHealth.state==='rehab'?'تأهيل':(latestHealth.state==='ready'?'جاهز':(latestHealth.state||'مسجّل'))):'غير مسجّلة اليوم';
 var healthNote=healthToday?(latestHealth.phase||latestHealth.note||'تم حفظ تقييم اليوم.'): (latestHealth&&healthDate?'آخر تحديث '+dayLabel(healthDate)+' · سجّل تقييم اليوم.':'سجّل النوم والأكل والألم والإجهاد.');
 var joined=new Set(joins.map(function(j){return String(j.match_id)}));
 PZ._playerMatches=matches.filter(function(m){return joined.has(String(m.id))&&matchDay(m)===today&&!isCancelledMatch(m)});
 var alertText=opps.map(function(o){return v(o.title,'تحديث جديد')}).join('   ◆   ')||'ما عندك تنبيهات جديدة.';
 var week=cal.slice(0,4).map(eventLine).join('')||'<div class="pz5-empty">لا توجد مواعيد في الأيام السبعة القادمة.</div>';
 var next=cal[0],nextDate=next&&next.on_date?new Intl.DateTimeFormat('ar-SA',{timeZone:'Asia/Riyadh',day:'numeric',month:'short'}).format(new Date(next.on_date+'T12:00:00+03:00')):'';
 var matchList=PZ._playerMatches.length?PZ._playerMatches.map(matchRow).join(''):'<div class="pz5-empty">جارٍ تحميل مباريات اليوم.</div>';
 var badgeList=badges.slice(0,3).map(function(b){return '<span>✦ '+v(b.title||b.name,'إنجاز مسجل')+'</span>'}).join('')||'<span>لا توجد إنجازات مسجلة بعد.</span>';
 var body='<div class="pz5-page">'+top5()+demoBanner()+
 '<div class="pz5-rails"><div class="pz5-rail alert"><b>تنبيهاتك</b><div><span>'+alertText+'</span><span>'+alertText+'</span></div></div><div class="pz5-rail games"><b>مباريات اليوم</b><div><span>جارٍ جلب المباريات الموثوقة…</span><span>جارٍ جلب المباريات الموثوقة…</span></div></div></div>'+
 '<main class="pz5-main">'+
 '<section class="pz5-hero"><div class="pz5-hero-orbit"></div><div class="pz5-eyebrow">PLAYER COMMAND CENTER <span>● TODAY</span></div><h1>يا '+v(ME.display_name||ME.name,'اللاعب')+'،<br><mark>خلّ يومك يلعب لصالحك.</mark></h1><p>جاهزيتك، خطتك، مبارياتك، وفرصك في مكان واحد.</p><div class="pz5-hero-bottom"><div class="pz5-score"><span>تقييم المدرب</span><strong>'+v(coachRating)+'</strong><small>'+v(coachMeta)+'</small></div><div class="pz5-hero-action"><button onclick="window.PZ.go(\'health\')">سجّل جاهزيتك <b>+</b></button><small>'+v(readiness)+'</small></div></div></section>'+
 '<section class="pz5-readiness"><div class="pz5-section-head"><div><span class="pz5-label">TODAY CHECK-IN</span><h2>جاهزيتك اليوم</h2></div><button onclick="window.PZ.go(\'health\')">'+(healthToday?'عدّل التقييم':'سجّل اليوم')+'</button></div><div class="pz5-readiness-row"><div class="pz5-ring"><div><strong>'+(healthToday?'✓':'+')+'</strong><span>فحص اليوم</span></div></div><div class="pz5-readiness-copy"><b>'+v(readiness)+'</b><p>'+v(healthNote)+'</p><button onclick="window.PZ.go(\'health\')">'+(healthToday?'عدّل تقييم اليوم':'ابدأ التقييم السريع ↗')+'</button></div></div></section>'+
 '<section class="pz5-snapshot"><div class="pz5-section-head"><div><span class="pz5-label">YOUR SNAPSHOT</span><h2>أداؤك المسجل</h2></div><button onclick="window.PZ.go(\'records\')">كل التقدم</button></div><div class="pz5-stats">'+stat(verified,demo?'مباراة تجريبية':'مباراة موثقة','gold')+stat(goals,demo?'هدف تجريبي':'هدف مسجل','purple')+stat(coachRating,demo?'تقييم تجريبي':'تقييم المدرب','teal')+stat(badges.length,demo?'إنجاز تجريبي':'إنجاز مسجل','orange')+'</div><div class="pz5-achievements"><div><b>إنجازاتك</b><span>'+v(badges.length?(demo?'آخر مثال تجريبي':'آخر إنجاز مسجل'):'تظهر هنا بعد تسجيل أول إنجاز')+'</span></div><strong>'+v(badges.length)+'</strong></div></section>'+
 '<section class="pz5-radar"><div class="pz5-section-head"><div><span class="pz5-label">LIVE RADAR</span><h2>مباريات اليوم</h2></div><button onclick="window.PZ.go(\'explore\')">تخصيص</button></div><div class="pz5-filter"><button class="on" type="button" data-kind="all" aria-pressed="true" onclick="window.PZ.filterMatches(\'all\')">الكل</button><button type="button" data-kind="roshn" aria-pressed="false" onclick="window.PZ.filterMatches(\'roshn\')">روشن</button><button type="button" data-kind="champions" aria-pressed="false" onclick="window.PZ.filterMatches(\'champions\')">الأبطال</button><button type="button" data-kind="global" aria-pressed="false" onclick="window.PZ.filterMatches(\'global\')">عالمي</button></div><div class="pz5-matches">'+matchList+'</div></section>'+
 '<section class="pz5-two-col"><article class="pz5-focus"><span class="pz5-label">NEXT MOVE</span><h2>خطوتك التالية</h2><b>'+v(next&&next.title,'لا يوجد موعد قادم')+'</b><small>'+v(nextDate,next?'':'أضف موعدًا إلى جدولك')+'</small><button onclick="window.PZ.go(\'calendar\')">'+(next?'افتح الجدول ↗':'أضف موعدًا ↗')+'</button></article><article class="pz5-focus signal"><span class="pz5-label">SIGNALS</span><h2>وش وصلك؟</h2><b>'+v(opps[0]&&opps[0].title,'ما فيه تفاعلات جديدة')+'</b><small>'+opps.length+' تحديثات</small><button onclick="window.PZ.go(\'opps\')">افتح التفاعلات ↗</button></article></section>'+
 '<section class="pz5-week"><div class="pz5-section-head"><div><span class="pz5-label">YOUR WEEK</span><h2>خطتك هذا الأسبوع</h2></div><button onclick="window.PZ.go(\'calendar\')">كل الجدول</button></div><div class="pz5-timeline">'+week+'</div></section>'+
 '<section class="pz5-badges"><div><span class="pz5-label">MILESTONES</span><h2>إنجازاتك</h2><p>'+(demo?'أمثلة تجريبية لا تمثل إنجازات حقيقية.':'الإنجاز يظهر بعد تسجيله واعتماده.')+'</p></div><div class="pz5-badge-list">'+badgeList+'</div></section>'+
 '</main>'+PZ.nav('feed')+'</div>';
 var result=PZ.page('feed',body);
 setTimeout(function(){PZ.loadSportsRadar()},0);
 return result
};
PZ.myCard=async function(){
 var d=await Promise.all([PZ.safe('events',sb.from('match_events').select('*').eq('who',ME.name).limit(120)),PZ.safe('joins',sb.from('match_joins').select('*').eq('player_name',ME.name)),PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).limit(8))]);
 var ev=(d[0]||[]).filter(function(e){return !!e.recorded_by}),joins=d[1]||[],badges=d[2]||[];
 var verified=new Set(ev.map(function(e){return e.match_id}).concat(joins.filter(function(j){return j.attended}).map(function(j){return j.match_id})).filter(Boolean)).size;
 var goals=ev.filter(function(e){return e.type==='goal'}).length,assists=ev.filter(function(e){return e.type==='assist'}).length;
 var code=ME.athlete_id||ME.handle||'—';
 var achievements=badges.slice(0,4).map(function(b){return '<li><span>✦</span>'+v(b.title||b.name,'إنجاز مسجل')+'</li>'}).join('')||'<li><span>✦</span>لا توجد إنجازات مسجلة بعد.</li>';
 var ageGroup=ME.age_group||ME.age_group_label||(Number(ME.age)?'U'+ME.age:'—');
 var position=ME.position_code||ME.pos||'—',city=ME.city||'—';
 var body='<div class="pz5-profile-page">'+PZ.top()+demoBanner()+'<main class="pz5-profile-main"><section class="pz5-identity"><div class="pz5-identity-top"><span class="pz5-label">PLAYER IDENTITY</span><span class="pz5-verified">هوية اللاعب</span></div><div class="pz5-identity-grid"><div class="pz5-avatar">'+PZ.photo(ME,'pz5-avatar-img')+'<span class="pz5-avatar-mark">365</span></div><div><h1>'+v(ME.display_name||ME.name,'اللاعب')+'</h1><p>'+v(position)+' · '+v(city)+' · '+v(ageGroup)+'</p><strong class="pz5-athlete-id">'+v(code)+'</strong><div class="pz5-tags"><span>'+v(position)+'</span><span>'+v(city)+'</span><span>'+v(ageGroup)+'</span></div></div></div><div class="pz5-profile-actions"><button class="primary" onclick="window.PZ.share(\''+esc(ME.name)+'\')">شارك الهوية ↗</button><button onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href)">انسخ الرابط</button></div></section>'+
 '<section class="pz5-profile-metrics">'+stat(verified,'مشاركة موثقة','gold')+stat(goals,'هدف مسجل','purple')+stat(assists,'صناعة مسجلة','teal')+stat('—','تقييم مدرب','orange')+'</section>'+
 '<section class="pz5-profile-block pz5-achieve-block"><div><span class="pz5-label">HIGHLIGHTS</span><h2>أبرز الإنجازات</h2></div><ul>'+achievements+'</ul></section>'+
 '<section class="pz5-profile-share"><div><span class="pz5-label">SCAN TO OPEN</span><h2>هوية اللاعب</h2><p>شارك الرابط لعرض بيانات اللاعب المسجلة.</p></div><img src="'+qr()+'" alt="رمز QR لهوية اللاعب"><b>'+v(code)+'</b></section></main>'+PZ.nav('publicView')+'</div>';
 return PZ.page('myCard',body)
};
PZ.previewDemoMode=isPreviewDemo;
PZ.demoNotice=function(message){if(typeof toast==='function')toast(message);else if(window.alert)window.alert(message)};
if(isPreviewDemo()){
 if(typeof PZ.joinMatch==='function')PZ.joinMatch=async function(){PZ.demoNotice('وضع التجربة: لم يتم الانضمام ولم تُحفظ بيانات.')};
 if(typeof PZ.saveSettings==='function')PZ.saveSettings=async function(){PZ.demoNotice('وضع التجربة: لم يتم حفظ التغييرات في قاعدة البيانات.')};
 document.addEventListener('submit',function(event){event.preventDefault();event.stopImmediatePropagation();PZ.demoNotice('وضع التجربة للعرض فقط؛ لم تُحفظ البيانات.')},true);
}
PZ.bind('feed',PZ.home);PZ.bind('home',PZ.home);PZ.bind('myCard',PZ.myCard);PZ.bind('publicView',PZ.myCard);
})();