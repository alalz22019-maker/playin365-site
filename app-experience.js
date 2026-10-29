/* PlayIn365 — Experience Consolidation
   One role-aware control layer across Training Day, Match Day,
   Subscription & Payment, and Tryouts & Opportunities.
   No source-of-truth table is duplicated; every journey keeps its own governed RPCs. */
(function(){
'use strict';
if(typeof T==='undefined') return;

var XP=window.PLAYIN_EXPERIENCE=window.PLAYIN_EXPERIENCE||{};
XP.version='2026.10.29-experience-consolidation-v1';
XP.cache={key:null,at:0,data:null};
XP.routes=['trainingDay','matchDay','subscriptionPayment','tryoutOpportunity'];
XP.roleRoutes={
 academy:['trainingDay','matchDay','subscriptionPayment','tryoutOpportunity'],
 coach:['trainingDay','matchDay','tryoutOpportunity'],
 guardian:['subscriptionPayment','tryoutOpportunity'],
 player:['trainingDay','matchDay','subscriptionPayment','tryoutOpportunity']
};
XP.roleMeta={
 academy:{kicker:'ORGANIZATION JOURNEY CONTROL',title:'من التشغيل إلى القبول — في مشهد واحد',description:'قرارات الأكاديمية والتدريب والمباريات والاشتراكات والفرص مترابطة دون تكرار البيانات.',orientation:'TL',accent:'#105350'},
 coach:{kicker:'TECHNICAL JOURNEY CONTROL',title:'ما يحتاجه الفريق الآن وما يأتي بعده',description:'خطة التدريب، جاهزية المباراة، وتقييم تجربة الأداء في تسلسل فني واحد.',orientation:'BL',accent:'#00A6D6'},
 guardian:{kicker:'GUARDIAN JOURNEY CONTROL',title:'قرارات الأبناء والتزاماتهم في مكان واحد',description:'الموافقات والاشتراكات والعروض تظهر لك بحدود الخصوصية الصحيحة.',orientation:'TR',accent:'#D5B642'},
 player:{kicker:'ATHLETE JOURNEY CONTROL',title:'رحلتك الرياضية من يومك إلى فرصتك',description:'تدريبك ومباراتك وعضويتك وفرصتك تتحرك على خط زمني واحد.',orientation:'BR',accent:'#4636E3'}
};
XP.labels={
 scheduled:'مجدول',open:'مفتوح',active:'نشط',completed:'مكتمل',closed:'مغلق',draft:'مسودة',published:'منشور',
 pending:'بانتظار الإجراء',pending_guardian:'بانتظار ولي الأمر',pending_finance:'بانتظار السداد',issued:'فاتورة صادرة',
 paid:'مدفوع',partially_paid:'مدفوع جزئيًا',overdue:'متأخر',accepted:'مقبول',approved:'معتمد',eligible:'مؤهل',
 trial:'تجربة الأداء',offer:'العرض',admitted:'تم الانضمام',selected:'مختار',confirmed:'مؤكد',ready:'جاهز',
 unavailable:'غير متاح',not_started:'لم يبدأ',in_progress:'قيد التنفيذ',cancelled:'ملغي',rejected:'مرفوض'
};
XP.e=function(v){return typeof esc==='function'?esc(v):String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})};
XP.num=function(v){if(v===null||v===undefined||v==='')return '0';try{return Number(v).toLocaleString('en-US',{maximumFractionDigits:2})}catch(e){return String(v)}};
XP.money=function(v,c){return XP.num(Number(v||0))+' '+(c==='SAR'||!c?'ر.س':XP.e(c))};
XP.label=function(v){return XP.labels[String(v||'').toLowerCase()]||String(v||'غير محدد').replace(/_/g,' ')};
XP.rows=function(v){
 if(!v)return [];
 if(Array.isArray(v))return v.reduce(function(a,x){return a.concat(XP.rows(x))},[]);
 if(typeof v==='object'){
  if(v.id||v.title||v.event_type||v.created_at||v.occurred_at||v.request_type)return [v];
  return Object.keys(v).reduce(function(a,k){return a.concat(XP.rows(v[k]))},[]);
 }
 return [];
};
XP.ts=function(v){var n=v?new Date(v).getTime():NaN;return Number.isFinite(n)?n:null};
XP.date=function(v){if(!v)return 'بدون موعد';try{return new Intl.DateTimeFormat('ar-SA-u-nu-latn',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Riyadh'}).format(new Date(v))}catch(e){return String(v)}};
XP.relative=function(v){if(!v)return '';try{return window.PI3&&PI3.relative?PI3.relative(v):XP.date(v)}catch(e){return XP.date(v)}};
XP.next=function(rows,dateKey){
 rows=(rows||[]).filter(Boolean);if(!rows.length)return null;var now=Date.now();
 var future=rows.filter(function(x){return XP.ts(x[dateKey||'starts_at'])>=now}).sort(function(a,b){return XP.ts(a[dateKey||'starts_at'])-XP.ts(b[dateKey||'starts_at'])});
 if(future.length)return future[0];
 return rows.slice().sort(function(a,b){return (XP.ts(b[dateKey||'starts_at'])||0)-(XP.ts(a[dateKey||'starts_at'])||0)})[0];
};
XP.pick=function(obj,keys){for(var i=0;i<keys.length;i++)if(obj&&obj[keys[i]]!==null&&obj[keys[i]]!==undefined)return obj[keys[i]];return null};
XP.statusTone=function(status,priority){status=String(status||'').toLowerCase();if(priority==='urgent'||/overdue|rejected|unavailable|cancelled/.test(status))return 'danger';if(priority==='high'||/pending|issued|limited|offer/.test(status))return 'warn';if(/active|paid|completed|approved|accepted|ready|eligible/.test(status))return 'ok';return 'info'};
XP.safeCall=async function(name,fn){try{return {ok:true,name:name,data:await fn()}}catch(e){return {ok:false,name:name,error:String(e&&e.message||e)}}};
XP.contextKey=async function(){
 var role=ME&&ME.role||'guest',ctx=null;try{ctx=window.PI3&&PI3.loadContext?await PI3.loadContext(false):null}catch(e){}
 var selected=ctx&&PI3.selected?PI3.selected(ctx):ctx&&ctx.selected||{};
 return role+'|'+String(selected&&selected.context_type||'personal')+'|'+String(selected&&selected.organization_id||'')+'|'+String(selected&&selected.responsibility_code||'');
};
XP.load=async function(force){
 var key=await XP.contextKey(),fresh=XP.cache.data&&XP.cache.key===key&&(Date.now()-XP.cache.at)<20000;
 if(!force&&fresh)return XP.cache.data;
 var role=ME&&ME.role||'player',homePromise=XP.safeCall('home',function(){return window.PI3&&PI3.loadHome?PI3.loadHome(!!force):Promise.resolve({})});
 var trainingPromise=(role==='academy'||role==='coach'||role==='player')&&window.TRAINING_DAY?XP.safeCall('training',function(){return TRAINING_DAY.load(!!force,null)}):Promise.resolve({ok:false,name:'training',error:'not_in_role'});
 var matchPromise=(role==='academy'||role==='coach'||role==='player')&&window.MATCH_DAY?XP.safeCall('match',function(){return MATCH_DAY.load(!!force,null)}):Promise.resolve({ok:false,name:'match',error:'not_in_role'});
 var financePromise=(role==='academy'||role==='guardian'||role==='player')&&window.SUBSCRIPTION_PAYMENT?XP.safeCall('finance',function(){return SUBSCRIPTION_PAYMENT.load(!!force,null)}):Promise.resolve({ok:false,name:'finance',error:'not_in_role'});
 var opportunityPromise=['academy','coach','guardian','player'].indexOf(role)>=0&&window.TRYOUT_OPPORTUNITY?XP.safeCall('opportunity',function(){return TRYOUT_OPPORTUNITY.load(!!force,null)}):Promise.resolve({ok:false,name:'opportunity',error:'not_in_role'});
 var result=await Promise.all([homePromise,trainingPromise,matchPromise,financePromise,opportunityPromise]);
 var raw={};result.forEach(function(x){raw[x.name]=x});
 var data={key:key,role:role,raw:raw,home:raw.home&&raw.home.ok?raw.home.data||{}:{}};
 data.journeys=XP.buildJourneys(data);
 data.decisions=XP.buildDecisions(data);
 data.timeline=XP.buildTimeline(data);
 data.urgent=data.journeys.filter(function(x){return x.priority==='urgent'||x.priority==='high'}).length+data.decisions.filter(function(x){return x.priority==='urgent'||x.priority==='high'}).length;
 XP.cache={key:key,at:Date.now(),data:data};return data;
};
XP.homeEvents=function(d){return XP.rows(d.home&&d.home.upcoming).filter(function(x){return x&&typeof x==='object'})};
XP.findHomeEvent=function(d,types){types=types||[];var rows=XP.homeEvents(d).filter(function(x){var t=String(x.event_type||x.type||'').toLowerCase();return types.some(function(q){return t.indexOf(q)>=0})});return XP.next(rows,'starts_at')};
XP.trainingJourney=function(d){
 var role=d.role,r=d.raw.training&&d.raw.training.ok?d.raw.training.data||{}:{},center=r.center||{},session=center.session||null;
 if(!session){var rows=XP.rows(r.index).filter(function(x){return x&&x.title&&(x.starts_at||x.ends_at)});session=XP.next(rows,'starts_at')}
 var fallback=XP.findHomeEvent(d,['training','open_training']),item=session||fallback,available=!!session&&typeof T.trainingDay==='function',route=available?'trainingDay':(fallback&&typeof T.eventHub==='function'?'eventHub':null),param=available&&session?session.id:fallback&&fallback.id;
 var stats=center.stats||{},response=center.own_response||null,readiness=center.own_readiness||null,action='افتح يوم التدريب',priority='normal';
 if(role==='coach'){if(!center.plan){action='ابنِ خطة الحصة';priority='high'}else if(Number(stats.ready||0)<Number(stats.roster||0)){action='راجع جاهزية الفريق';priority='high'}else action='راجع الخطة'}
 else if(role==='player'){var rs=response&&String(response.response_status||response.status||'');if(!rs||rs==='pending'){action='أكد حضورك';priority='high'}else if(!readiness){action='حدّث جاهزيتك';priority='high'}else action='استعد للحصة'}
 else if(role==='academy'){action=Number(stats.confirmed||0)?'تابع تشغيل الحصة':'راجع الدعوات';priority=Number(stats.confirmed||0)?'normal':'high'}
 else action='راجع موعد التدريب';
 var detail=role==='coach'||role==='academy'?XP.num(stats.confirmed||0)+' مؤكد · '+XP.num(stats.ready||0)+' جاهز · '+XP.num(stats.evaluated||0)+' مقيم':role==='player'?(readiness?'الجاهزية: '+XP.label(readiness.readiness_state||readiness.status):'الجاهزية لم تُحدّث بعد'):(item&&item.venue_label||'ضمن أحداث اللاعب');
 return {key:'training',eyebrow:'TRAINING DAY',icon:'T',route:route,param:param,title:item&&item.title||'يوم التدريب',detail:detail,status:item&&item.status||'scheduled',time:item&&item.starts_at,action:action,priority:priority,available:!!route,tone:XP.statusTone(item&&item.status,priority)};
};
XP.matchJourney=function(d){
 var role=d.role,r=d.raw.match&&d.raw.match.ok?d.raw.match.data||{}:{},center=r.center||{},match=center.match||null;
 if(!match){var rows=XP.rows(r.index).filter(function(x){return x&&x.title&&x.starts_at});match=XP.next(rows,'starts_at')}
 var fallback=XP.findHomeEvent(d,['match']),item=match||fallback,available=!!match&&typeof T.matchDay==='function',route=available?'matchDay':(fallback&&typeof T.eventHub==='function'?'eventHub':null),param=available&&match?match.id:fallback&&fallback.id;
 var stats=center.stats||{},action='افتح يوم المباراة',priority='normal';
 if(role==='coach'){if(!center.plan){action='ثبّت القائمة والتشكيلة';priority='high'}else action='راجع الجاهزية'}
 else if(role==='player'){var response=center.own_response,ready=center.own_readiness,selection=center.own_selection;if(!response||String(response.response_status||response.status||'pending')==='pending'){action='أكد توفرّك';priority='high'}else if(!ready){action='حدّث جاهزيتك';priority='high'}else if(selection)action='راجع دورك في المباراة';else action='تابع إعلان القائمة'}
 else if(role==='academy'){action='تابع قرارات المباراة';priority=Number(stats.pending_responses||0)>0?'high':'normal'}
 else action='راجع موعد المباراة';
 var detail=match?([match.home_team_name,match.away_team_name].filter(Boolean).join(' × ')||match.venue_label||'مباراة قادمة'):(item&&item.title||'');
 if((role==='coach'||role==='academy')&&stats)detail=XP.num(stats.confirmed||0)+' متاح · '+XP.num(stats.ready||0)+' جاهز · '+XP.num(stats.selected||0)+' بالقائمة';
 return {key:'match',eyebrow:'MATCH DAY',icon:'M',route:route,param:param,title:item&&item.title||'يوم المباراة',detail:detail,status:item&&item.status||'scheduled',time:item&&item.starts_at,action:action,priority:priority,available:!!route,tone:XP.statusTone(item&&item.status,priority)};
};
XP.financeJourney=function(d){
 var role=d.role,allowed=role==='academy'||role==='guardian'||role==='player',r=d.raw.finance&&d.raw.finance.ok?d.raw.finance.data||{}:{},stats=r.stats||{},subs=XP.rows(r.subscriptions),invoices=XP.rows(r.invoices),sub=subs[0]||null,invoice=invoices.filter(function(x){return Number(x.outstanding_amount||0)>0})[0]||invoices[0]||null;
 if(!allowed)return {key:'finance',eyebrow:'SUBSCRIPTION & PAYMENT',icon:'﷼',route:null,title:'المسار المالي مستقل',detail:'خارج الصلاحيات الفنية للمدرب',status:'unavailable',time:null,action:'غير مطلوب في دورك',priority:'normal',available:false,tone:'muted'};
 var action='افتح الاشتراك',priority='normal';
 if(role==='academy'){if(Number(stats.pending_submissions||0)>0){action='راجع طلبات الدفع';priority='urgent'}else if(Number(stats.invoices_open||0)>0){action='تابع الفواتير المفتوحة';priority='high'}else action='راجع الاشتراكات'}
 else if(role==='guardian'){if(invoice&&invoice.can_submit_payment){action='أرسل إثبات الدفع';priority='urgent'}else if(invoice){action='راجع الفاتورة';priority='high'}else action='راجع اشتراك الابن'}
 else {action=sub&&sub.status==='active'?'عضويتك مفعّلة':'تابع حالة عضويتك';priority=sub&&sub.status==='active'?'normal':'high'}
 var title=sub&&sub.plan_name||invoice&&invoice.invoice_type==='subscription'?'عضوية الأكاديمية':'الاشتراك والدفع';
 if(sub&&sub.plan_name)title=sub.plan_name;
 var detail=invoice?XP.money(invoice.outstanding_amount,invoice.currency)+' متبقي · '+XP.label(invoice.status):sub?(XP.label(sub.status)+' · '+(sub.athlete_name||'')):'لا يوجد التزام مالي مفتوح';
 return {key:'finance',eyebrow:'SUBSCRIPTION & PAYMENT',icon:'﷼',route:typeof T.subscriptionPayment==='function'?'subscriptionPayment':null,param:invoice&&invoice.id,title:title,detail:detail,status:invoice&&invoice.status||sub&&sub.status||'active',time:invoice&&invoice.due_at||sub&&sub.next_billing_at,action:action,priority:priority,available:typeof T.subscriptionPayment==='function',tone:XP.statusTone(invoice&&invoice.status||sub&&sub.status,priority)};
};
XP.opportunityJourney=function(d){
 var role=d.role,r=d.raw.opportunity&&d.raw.opportunity.ok?d.raw.opportunity.data||{}:{},op=r.opportunity||XP.next(XP.rows(r.opportunities),'event_starts_at')||XP.findHomeEvent(d,['trial','opportunity']),candidate=r.candidate||null,requests=XP.rows(r.guardian_requests),offers=XP.rows(r.offers),stats=r.stats||{},action='افتح الفرص',priority='normal',status=op&&op.status||candidate&&candidate.stage||'open';
 if(role==='academy'){action=Number(stats.total||0)?'تابع مسار المرشحين':'انشر فرصة جديدة';priority=Number(stats.pending||stats.applied||0)>0?'high':'normal'}
 else if(role==='coach'){action=Number(stats.checked_in||0)>Number(stats.evaluated||0)?'أكمل تقييم الحاضرين':'راجع تجربة الأداء';priority=Number(stats.checked_in||0)>Number(stats.evaluated||0)?'high':'normal'}
 else if(role==='guardian'){if(requests.length){action='اتخذ قرار الموافقة';priority='urgent';status=requests[0].status||'pending'}else action='راجع فرص الأبناء'}
 else if(candidate){status=candidate.stage||status;if(candidate.stage==='offer'){var offer=offers[0];action=offer&&offer.status==='pending_guardian'?'بانتظار موافقة ولي الأمر':'راجع عرضك';priority='high'}else if(candidate.stage==='trial'){action='استعد لتجربة الأداء';priority='high'}else action='تابع طلبك'}
 else action='اكتشف فرصة جديدة';
 var detail=role==='academy'?XP.num(stats.total||0)+' طلب · '+XP.num(stats.trial||0)+' في التجربة':role==='coach'?XP.num(stats.checked_in||0)+' حاضر · '+XP.num(stats.evaluated||0)+' مقيم':role==='guardian'?XP.num(requests.length)+' موافقة تنتظر قرارك':candidate?('مرحلتك: '+XP.label(candidate.stage)):(op&&[op.age_category,op.city].filter(Boolean).join(' · ')||'فرص متاحة');
 return {key:'opportunity',eyebrow:'TRYOUTS & OPPORTUNITIES',icon:'O',route:typeof T.tryoutOpportunity==='function'?'tryoutOpportunity':null,param:op&&op.id,title:op&&op.title||'التجارب والفرص',detail:detail,status:status,time:op&&(op.event_starts_at||op.closes_at||op.starts_at),action:action,priority:priority,available:typeof T.tryoutOpportunity==='function',tone:XP.statusTone(status,priority)};
};
XP.buildJourneys=function(d){return [XP.trainingJourney(d),XP.matchJourney(d),XP.financeJourney(d),XP.opportunityJourney(d)]};
XP.buildDecisions=function(d){
 var decisions=XP.rows(d.home&&d.home.decisions).map(function(x){return {id:x.id,title:x.title||'قرار مطلوب',description:x.description||'',status:x.status||'pending',priority:x.priority==='critical'?'urgent':x.priority||'normal',time:x.due_at||x.expires_at,route:x.action_route&&typeof T[x.action_route]==='function'?x.action_route:null}});
 var approvals=XP.rows(d.home&&d.home.approvals).map(function(x){return {id:x.id,title:'طلب موافقة: '+XP.label(x.request_type),description:'بانتظار قرارك',status:x.status||'pending',priority:'high',time:x.expires_at,route:typeof T.tryoutOpportunity==='function'?'tryoutOpportunity':null}});
 return decisions.concat(approvals).slice(0,12);
};
XP.timelineRoute=function(x){var type=String(x.event_type||x.type||'').toLowerCase();if(type.indexOf('trial')>=0||type.indexOf('opportunity')>=0)return 'tryoutOpportunity';if(type.indexOf('match')>=0&&XP.roleRoutes[ME.role||'player'].indexOf('matchDay')>=0)return 'matchDay';if(type.indexOf('training')>=0&&XP.roleRoutes[ME.role||'player'].indexOf('trainingDay')>=0)return 'trainingDay';return typeof T.eventHub==='function'?'eventHub':null};
XP.buildTimeline=function(d){
 var items=[];
 d.journeys.forEach(function(j){if(j.time)items.push({key:'journey:'+j.key+':'+String(j.param||j.time),kind:j.key,title:j.title,detail:j.action,status:j.status,time:j.time,route:j.route,param:j.param,tone:j.tone})});
 XP.homeEvents(d).forEach(function(x){var time=x.starts_at||x.event_starts_at||x.closes_at;if(!time||!x.title)return;items.push({key:'event:'+String(x.id||x.title)+':'+time,kind:String(x.event_type||x.type||'event'),title:x.title,detail:XP.label(x.status||x.event_type),status:x.status,time:time,route:XP.timelineRoute(x),param:x.id,tone:'info'})});
 d.decisions.forEach(function(x){if(x.time)items.push({key:'decision:'+String(x.id||x.title),kind:'decision',title:x.title,detail:x.description||'قرار ينتظر إجراءك',status:x.status,time:x.time,route:x.route,param:null,tone:XP.statusTone(x.status,x.priority)})});
 XP.rows(d.home&&d.home.updates).slice(0,6).forEach(function(x){var time=x.occurred_at||x.created_at;if(!time||!x.title)return;items.push({key:'update:'+String(x.id||x.title)+':'+time,kind:'update',title:x.title,detail:x.summary||'',status:x.verification_status,time:time,route:null,param:null,tone:'muted'})});
 var seen={},unique=items.filter(function(x){var k=x.key||x.title+'|'+x.time;if(seen[k])return false;seen[k]=1;return true}),now=Date.now();
 unique.sort(function(a,b){var at=XP.ts(a.time)||0,bt=XP.ts(b.time)||0,af=at>=now,bf=bt>=now;if(af!==bf)return af?-1:1;return af?at-bt:bt-at});
 return unique.slice(0,14);
};
XP.routeCall=function(route,param){if(!route||typeof T[route]!=='function')return '';return "go('"+XP.e(route)+"'"+(param?",'"+XP.e(param)+"'":'')+")"};
XP.journeyCard=function(j,compact){
 var tag=j.available?'button':'div',call=j.available?' onclick="'+XP.routeCall(j.route,j.param)+'"':'',disabled=j.available?'':' aria-disabled="true"';
 return '<article class="xp-journey xp-'+XP.e(j.key)+' xp-tone-'+XP.e(j.tone)+(compact?' is-compact':'')+'"><'+tag+' class="xp-journey-hit"'+call+disabled+'><div class="xp-journey-mark"><b>'+XP.e(j.icon)+'</b><i></i></div><div class="xp-journey-copy"><span>'+XP.e(j.eyebrow)+'</span><h3>'+XP.e(j.title)+'</h3><p>'+XP.e(j.detail)+'</p><div class="xp-journey-meta"><em>'+XP.e(XP.label(j.status))+'</em>'+(j.time?'<time>'+XP.e(XP.date(j.time))+'</time>':'')+'</div></div><strong>'+XP.e(j.action)+'<i>←</i></strong></'+tag+'></article>';
};
XP.timelineHtml=function(items,limit){items=(items||[]).slice(0,limit||8);if(!items.length)return '<div class="xp-empty"><b>لا يوجد حدث قريب</b><span>ستظهر الرحلات والقرارات هنا عند توفرها.</span></div>';return '<div class="xp-timeflow">'+items.map(function(x,i){var call=x.route?' onclick="'+XP.routeCall(x.route,x.param)+'"':'';return '<article class="xp-time-item xp-tone-'+XP.e(x.tone||'info')+'"'+call+' tabindex="'+(x.route?'0':'-1')+'"><div class="xp-time-axis"><i></i><span>'+XP.e(XP.date(x.time))+'</span></div><div><small>'+XP.e(String(x.kind||'EVENT').toUpperCase())+'</small><h3>'+XP.e(x.title)+'</h3><p>'+XP.e(x.detail||XP.label(x.status))+'</p></div>'+(x.route?'<b>فتح ←</b>':'')+'</article>'}).join('')+'</div>'};
XP.decisionsHtml=function(items){items=(items||[]).slice(0,6);if(!items.length)return '<div class="xp-empty"><b>لا توجد قرارات معلقة</b><span>كل الرحلات تحت السيطرة الآن.</span></div>';return '<div class="xp-decision-list">'+items.map(function(x){var call=x.route?' onclick="'+XP.routeCall(x.route)+'"':'';return '<article class="xp-decision xp-tone-'+XP.e(XP.statusTone(x.status,x.priority))+'"><div><span>'+XP.e(XP.label(x.status))+'</span><h3>'+XP.e(x.title)+'</h3><p>'+XP.e(x.description||'بانتظار الإجراء')+'</p></div>'+(x.route?'<button'+call+'>فتح القرار</button>':'')+'</article>'}).join('')+'</div>'};
XP.cockpit=function(d){
 var next=d.timeline.slice(0,3),active=d.journeys.filter(function(x){return x.available}).length;
 return '<section class="xp-cockpit" data-xp-unified="1"><div class="xp-cockpit-head"><div><span>PLAYIN JOURNEY CONTROL</span><h2>رحلاتك في مسار واحد</h2><p>'+XP.num(active)+' رحلات متاحة · '+XP.num(d.urgent)+' عناصر تحتاج انتباهك</p></div><button onclick="go(\'experienceCenter\')">فتح مركز الرحلات <i>←</i></button></div><div class="xp-cockpit-rail">'+d.journeys.map(function(j){return XP.journeyCard(j,true)}).join('')+'</div>'+(next.length?'<div class="xp-cockpit-next"><b>القادم على خطك الزمني</b>'+next.map(function(x){return '<span><i></i><time>'+XP.e(XP.date(x.time))+'</time><em>'+XP.e(x.title)+'</em></span>'}).join('')+'</div>':'')+'</section>';
};
XP.stripLegacySignals=function(html){return String(html||'').replace(/<section class="(?:td|md|sp|to)-home-signal\b[\s\S]*?<\/section>/g,'')};
XP.insertAfterHero=function(html,block){var at=html.indexOf('</section>');return at>=0?html.slice(0,at+10)+block+html.slice(at+10):block+html};
XP.centerHtml=function(d){
 var meta=XP.roleMeta[d.role]||XP.roleMeta.player,identity=d.home.identity||{},ctx=d.home.context||{},name=identity.name||identity.display_name||ME.name||'PlayIn365',contextLabel=ctx.context_type==='organization'?'سياق الجهة':'السياق الشخصي',shape=window.PI3&&PI3.shape?PI3.shape(meta.orientation,name,null,{className:'xp-hero-shape',label:'PI',accentHex:meta.accent}):'<div class="xp-shape-fallback">PI</div>',identityRoute=ctx.context_type==='organization'&&typeof T.organizationIdentity==='function'?'organizationIdentity':'identityHub';
 return '<main class="xp-center" data-xp-role="'+XP.e(d.role)+'"><section class="xp-hero"><div class="xp-hero-copy"><span>'+XP.e(meta.kicker)+'</span><h1>'+XP.e(meta.title)+'</h1><p>'+XP.e(meta.description)+'</p><div class="xp-hero-stats"><b>'+XP.num(d.journeys.filter(function(x){return x.available}).length)+'<small>رحلات</small></b><b>'+XP.num(d.urgent)+'<small>تحتاجك</small></b><b>'+XP.num(d.timeline.length)+'<small>محطات</small></b></div><div class="xp-hero-actions"><button onclick="PLAYIN_EXPERIENCE.refresh(this)">تحديث المشهد</button><button class="secondary" onclick="go(\'smartHome\')">الصفحة الرئيسية</button></div></div><div class="xp-hero-visual">'+shape+'<em>'+XP.e(contextLabel)+'</em><strong>'+XP.e(name)+'</strong></div></section><section class="xp-section xp-journey-stage"><div class="xp-section-head"><div><span>GOLDEN JOURNEYS</span><h2>من يومك إلى نتيجتك</h2></div><p>كل بطاقة تفتح المصدر التشغيلي نفسه؛ لا توجد نسخة ثانية من البيانات.</p></div><div class="xp-journey-grid">'+d.journeys.map(function(j){return XP.journeyCard(j,false)}).join('')+'</div></section><section class="xp-section xp-flow-stage"><div class="xp-section-head"><div><span>UNIFIED TIMELINE</span><h2>ما حدث وما سيأتي</h2></div><p>التدريب والمباراة والاستحقاق المالي والفرصة مرتبة زمنيًا.</p></div>'+XP.timelineHtml(d.timeline,12)+'</section><section class="xp-split"><article class="xp-section"><div class="xp-section-head"><div><span>DECISION INBOX</span><h2>ما ينتظر قرارك</h2></div></div>'+XP.decisionsHtml(d.decisions)+'</article><article class="xp-section xp-identity-bridge"><div class="xp-section-head"><div><span>IDENTITY BRIDGE</span><h2>الأثر على الهوية</h2></div></div><p>كل رحلة تكتب أثرها مرة واحدة على هوية الشخص أو الجهة أو الحدث.</p><button onclick="go(\''+XP.e(identityRoute)+'\')">فتح الهوية</button><button onclick="go(\'eventHub\')">هوية الأحداث</button><button onclick="go(\'hub\')">جميع الخدمات</button></article></section></main>';
};
XP.refresh=async function(btn){if(btn){btn.disabled=true;btn.dataset.text=btn.textContent;btn.textContent='جارٍ التحديث…'}XP.cache={key:null,at:0,data:null};try{if(window.PI3&&PI3.clear)PI3.clear();await XP.load(true);await render();if(typeof toast==='function')toast('تم تحديث مشهد الرحلات')}catch(e){console.warn('Experience refresh',e);if(typeof toast==='function')toast('تعذر تحديث المشهد',1)}finally{if(btn&&btn.isConnected){btn.disabled=false;btn.textContent=btn.dataset.text||'تحديث المشهد'}}};
T.experienceCenter=async function(){try{return XP.centerHtml(await XP.load(false))}catch(e){console.warn('Experience center',e);return '<main class="xp-center"><div class="xp-empty"><b>تعذر تحميل مركز الرحلات</b><span>'+XP.e(e&&e.message||'')+'</span><button onclick="PLAYIN_EXPERIENCE.refresh(this)">إعادة المحاولة</button></div></main>'}};

var xpLegacySmartHome=typeof T.smartHome==='function'?T.smartHome:null;
if(xpLegacySmartHome)T.smartHome=async function(){var html=await xpLegacySmartHome();try{var d=await XP.load(false);html=XP.stripLegacySignals(html);return XP.insertAfterHero(html,XP.cockpit(d))}catch(e){console.warn('Experience home consolidation',e);return html}};
if(typeof T.smartHome==='function')T.myHome=async function(){return T.smartHome()};

try{
 if(typeof TITLES!=='undefined'){
  TITLES.experienceCenter='مركز الرحلات';
  TITLES.trainingDay=TITLES.trainingDay||'يوم التدريب';TITLES.matchDay=TITLES.matchDay||'يوم المباراة';TITLES.subscriptionPayment=TITLES.subscriptionPayment||'الاشتراك والدفع';TITLES.tryoutOpportunity=TITLES.tryoutOpportunity||'التجارب والفرص';
 }
 if(typeof HUB!=='undefined'){
  ['academy','coach','guardian','player'].forEach(function(role){HUB.ROLE_OK[role]=Array.from(new Set((HUB.ROLE_OK[role]||[]).concat(['experienceCenter'].concat(XP.roleRoutes[role]||[]))))});
  if(HUB.SHARED&&!HUB.SHARED.some(function(x){return x[2]==='experienceCenter'}))HUB.SHARED.unshift(['◫','مركز الرحلات','experienceCenter','#edf5ff','#26374D']);
 }
 if(typeof NAV!=='undefined'){
  ['academy','coach','guardian','player'].forEach(function(role){var nav=NAV[role];if(!Array.isArray(nav))return;var home=nav.find(function(x){return x[0]==='⌂'});if(home){home[1]='الرئيسية';home[2]='smartHome'}var fab=nav.find(function(x){return x[0]==='FAB'});if(fab){fab[1]='الرحلات';fab[2]='experienceCenter'}});
 }
 if(window.PI3&&PI3.quickRoutes&&PI3.quickRoutes.personal){
  ['academy','coach','guardian','player'].forEach(function(role){var a=PI3.quickRoutes.personal[role]||[];if(!a.some(function(x){return x[2]==='experienceCenter'}))a.unshift(['◫','مركز الرحلات','experienceCenter','التدريب · المباراة · الاشتراك · الفرص']);PI3.quickRoutes.personal[role]=a});
 }
}catch(e){console.warn('Experience route registration',e)}

try{
 var xpLegacyHomeFor=typeof homeFor==='function'?homeFor:null;
 if(xpLegacyHomeFor){homeFor=function(){var role=ME&&ME.role;if(['academy','coach','guardian','player'].indexOf(role)>=0)return 'smartHome';return xpLegacyHomeFor()};window.homeFor=homeFor}
}catch(e){console.warn('Experience home route',e)}

XP.switcherHtml=function(){var role=ME&&ME.role||'player',routes=['experienceCenter'].concat(XP.roleRoutes[role]||[]),meta={experienceCenter:['◫','المركز'],trainingDay:['T','التدريب'],matchDay:['M','المباراة'],subscriptionPayment:['﷼','الاشتراك'],tryoutOpportunity:['O','الفرص']};return '<nav class="xp-journey-switcher" aria-label="التنقل بين الرحلات">'+routes.filter(function(r){return typeof T[r]==='function'}).map(function(r){var m=meta[r]||['•',r];return '<button class="'+(VIEW===r?'active':'')+'" onclick="go(\''+XP.e(r)+'\')"><i>'+XP.e(m[0])+'</i><span>'+XP.e(m[1])+'</span></button>'}).join('')+'</nav>'};
XP.decorate=function(){document.querySelectorAll('.xp-journey-switcher').forEach(function(x){x.remove()});document.body.classList.toggle('xp-experience-active',VIEW==='experienceCenter');if(!ME||['experienceCenter'].concat(XP.routes).indexOf(VIEW)<0)return;var main=document.querySelector('#app main');if(main)main.insertAdjacentHTML('afterbegin',XP.switcherHtml())};
try{var xpLegacyRender=render;render=async function(){await xpLegacyRender();try{XP.decorate()}catch(e){console.warn('Experience switcher',e)}};window.render=render}catch(e){console.warn('Experience render wrapper',e)}


/* Consolidated aliases, unified timeline and command search. */
XP.commandEntries=function(){
 var role=ME&&ME.role||'player',rows=[['⌂','الرئيسية','smartHome'],['◫','مركز الرحلات','experienceCenter'],['↗','الخط الزمني','activityTimeline'],['✉','الرسائل','messages'],['◉','هويتي','identityHub'],['⊞','كل الخدمات','hub']];
 try{rows=rows.concat(HUB.SHARED||[],HUB.ROLE&&HUB.ROLE[role]||[])}catch(e){}
 var seen={};return rows.filter(function(x){if(!x||!x[2]||seen[x[2]]||typeof T[x[2]]!=='function')return false;seen[x[2]]=1;return true});
};
XP.openCommand=function(){
 XP.closeCommand();var rows=XP.commandEntries(),x=document.createElement('div');x.id='xpCommand';x.className='xp-command-backdrop';
 x.innerHTML='<section class="xp-command" role="dialog" aria-modal="true"><header><div><span>PLAYIN COMMAND</span><h2>ابحث أو نفّذ</h2></div><button onclick="PLAYIN_EXPERIENCE.closeCommand()" aria-label="إغلاق">×</button></header><label><i>⌕</i><input id="xpCommandSearch" autocomplete="off" placeholder="اكتب اسم الخدمة أو الرحلة…" oninput="PLAYIN_EXPERIENCE.filterCommand(this.value)"></label><div id="xpCommandList">'+rows.map(function(r){return '<button data-search="'+XP.e((r[1]+' '+r[2]).toLowerCase())+'" onclick="PLAYIN_EXPERIENCE.closeCommand();go(\''+XP.e(r[2])+'\')"><i>'+XP.e(r[0]||'•')+'</i><span><b>'+XP.e(r[1]||r[2])+'</b><small>'+XP.e(r[2])+'</small></span><em>↵</em></button>'}).join('')+'</div></section>';
 x.addEventListener('click',function(ev){if(ev.target===x)XP.closeCommand()});document.body.appendChild(x);document.body.classList.add('xp-command-open');setTimeout(function(){var i=document.getElementById('xpCommandSearch');if(i)i.focus()},20);
};
XP.closeCommand=function(){var x=document.getElementById('xpCommand');if(x)x.remove();document.body.classList.remove('xp-command-open')};
XP.filterCommand=function(q){q=String(q||'').trim().toLowerCase();document.querySelectorAll('#xpCommandList button').forEach(function(b){b.hidden=!!q&&String(b.dataset.search||'').indexOf(q)<0})};
XP.timelinePage=async function(){
 var d=await XP.load(false),meta=XP.roleMeta[d.role]||XP.roleMeta.player,name=d.home.identity&&((d.home.identity.name||d.home.identity.display_name))||ME.name||'PlayIn365',shape=window.PI3&&PI3.shape?PI3.shape(meta.orientation,name,null,{className:'xp-hero-shape',label:'PI',accentHex:meta.accent}):'';
 return '<main class="xp-center xp-timeline-page" data-xp-role="'+XP.e(d.role)+'"><section class="xp-hero xp-timeline-hero"><div class="xp-hero-copy"><span>UNIFIED ACTIVITY TIMELINE</span><h1>سجل واحد للأفراد والجهات والأحداث</h1><p>التدريب والمباراة والاشتراك والفرص والقرارات في خط قابل للتتبع.</p><div class="xp-hero-actions"><button onclick="PLAYIN_EXPERIENCE.openCommand()">بحث وأوامر</button><button class="secondary" onclick="go(\'experienceCenter\')">مركز الرحلات</button></div></div><div class="xp-hero-visual">'+shape+'<em>'+XP.e(XP.roleLabel?XP.roleLabel(d.role):d.role)+'</em><strong>'+XP.e(name)+'</strong></div></section><section class="xp-section"><div class="xp-section-head"><div><span>LIVE HISTORY</span><h2>ما حدث وما سيأتي</h2></div><button onclick="PLAYIN_EXPERIENCE.refresh(this)">تحديث</button></div>'+XP.timelineHtml(d.timeline,60)+'</section></main>';
};
T.journeyCenter=T.experienceCenter;
T.activityTimeline=async function(){try{return await XP.timelinePage()}catch(e){console.warn('Experience timeline',e);return '<main class="xp-center"><div class="xp-empty"><b>تعذر تحميل الخط الزمني</b><span>'+XP.e(e&&e.message||'')+'</span></div></main>'}};
if(typeof TITLES!=='undefined'){TITLES.journeyCenter='رحلاتي';TITLES.activityTimeline='الخط الزمني'}
if(typeof HUB!=='undefined'){
 ['academy','coach','guardian','player'].forEach(function(role){HUB.ROLE_OK[role]=Array.from(new Set((HUB.ROLE_OK[role]||[]).concat(['journeyCenter','activityTimeline'])))});
 if(HUB.SHARED&&!HUB.SHARED.some(function(x){return x[2]==='activityTimeline'}))HUB.SHARED.splice(1,0,['↗','الخط الزمني','activityTimeline','#eef6ff','#26374D']);
}
var xpSwitcherBase=XP.switcherHtml;
XP.switcherHtml=function(){var html=xpSwitcherBase();return html.replace('</nav>','<button class="xp-command-trigger" onclick="PLAYIN_EXPERIENCE.openCommand()"><i>⌕</i><span>بحث</span></button></nav>')};
var xpDecorateBase=XP.decorate;
XP.decorate=function(){xpDecorateBase();if(['journeyCenter','activityTimeline'].indexOf(VIEW)>=0){document.querySelectorAll('.xp-journey-switcher').forEach(function(x){x.remove()});var main=document.querySelector('#app main');if(main)main.insertAdjacentHTML('afterbegin',XP.switcherHtml())}};
document.addEventListener('keydown',function(ev){var tag=(document.activeElement&&document.activeElement.tagName||'').toLowerCase();if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();XP.openCommand()}else if(ev.key==='/'&&['input','textarea','select'].indexOf(tag)<0&&!document.getElementById('xpCommand')){ev.preventDefault();XP.openCommand()}else if(ev.key==='Escape')XP.closeCommand()});

})();
