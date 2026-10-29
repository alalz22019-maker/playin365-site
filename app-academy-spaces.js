/* PlayIn365 — Academy Spaces Wave 1
   Five clear operating spaces over every existing academy service.
   No existing page, route, action, or data source is removed. */
(function(){
'use strict';
if(typeof T==='undefined'||!window.ACOPS||!window.PI3)return;
var A=window.ACADEMY_SPACES=window.ACADEMY_SPACES||{},O=window.ACOPS,P=window.PI3;
A.version='2026.10.29-academy-spaces-wave1';A.cache=null;A.cacheAt=0;
A.e=function(v){return O.esc(v)};A.n=function(v){return O.num(Number(v||0))};
A.money=function(v){return O.money(Number(v||0))};
A.spaces=[
 {key:'today',route:'smartHome',icon:'⌂',title:'اليوم',kicker:'TODAY COMMAND',desc:'القرارات، الاستثناءات، المواعيد، التنبيهات وما يحتاج إجراءً الآن.',accent:'#00A6D6'},
 {key:'people',route:'academyPeople',icon:'◉',title:'الأشخاص',kicker:'PEOPLE NETWORK',desc:'اللاعبون، أولياء الأمور، المدربون، الموظفون، الفرق والصلاحيات.',accent:'#6D4CFF'},
 {key:'field',route:'academyField',icon:'⚽',title:'الملعب',kicker:'FIELD OPERATIONS',desc:'التدريب، الحضور، المباريات، التجارب، الجاهزية والأداء.',accent:'#25A173'},
 {key:'business',route:'academyBusiness',icon:'▣',title:'الأعمال',kicker:'BUSINESS FLOW',desc:'الاشتراكات، الفواتير، التحصيل، الحجوزات، المتجر والمالية.',accent:'#D5B642'},
 {key:'growth',route:'academyGrowth',icon:'↗',title:'النمو',kicker:'GROWTH ENGINE',desc:'التسجيل، التسويق، العروض، النماذج، الموقع والتكاملات.',accent:'#D97B29'}
];
A.routeGroups={
 today:['smartHome','academyToday','opsHome','opsInbox'],
 people:['academyPeople','opsCustomers','opsStaff','opsBranches','acadSquads','messages','communicationCenter','communicationInbox','identityHub','organizationIdentity'],
 field:['academyField','trainingDay','matchDay','opsAttendance','acadSessions','acadMatches','acadPerformance','acadTryouts','tactics','boards','acad','acadHome'],
 business:['academyBusiness','subscriptionPayment','opsSubscriptions','opsCashier','opsOrders','opsReservations','opsFinance','opsReports','opsDocuments','opsMobile','settings'],
 growth:['academyGrowth','tryoutOpportunity','opps','opsMarketing','opsOffers','opsForms','opsWebsite','opsIntegrations','opsEngagement','communicationReports','opsAssistant','publicView']
};
A.modules={
 people:[
  ['opsCustomers','اللاعبون والعملاء','الهوية، العضوية، بيانات التواصل والحالة','◉'],
  ['acadSquads','الفرق والفئات','توزيع اللاعبين والطاقم والفئات العمرية','⚽'],
  ['opsStaff','الموظفون والصلاحيات','الإدارة والمالية والموارد البشرية والتشغيل','◎'],
  ['communicationCenter','التواصل المؤسسي','إرسال جماعي للاعبين والمدربين وأولياء الأمور','✉'],
  ['opsBranches','الفروع والتشغيل','الفروع، المواقع وطرق الدفع','◇'],
  ['organizationIdentity','هوية الأكاديمية','الصفحة العامة والإنجازات والفرص','▦'],
  ['identityHub','هويتي المهنية','المسيرة الشخصية والإنجازات الموثقة','▣'],
  ['messages','المحادثات المباشرة','التواصل الفردي المحكوم','↔']
 ],
 field:[
  ['trainingDay','يوم التدريب','الخطة، الجاهزية، الحضور والتقييم','◫'],
  ['matchDay','يوم المباراة','القائمة، التشكيلة، الأحداث والنتيجة','⚽'],
  ['opsAttendance','الحضور والبوابة','الحضور اليومي والاستثناءات','✓'],
  ['acadSessions','الحصص والبرامج','الجدول وبرامج التدريب','▤'],
  ['acadMatches','المباريات','السجل والمباريات القادمة','◉'],
  ['acadPerformance','الأداء والتطور','المؤشرات والتقييمات وخطط التطور','↗'],
  ['acadTryouts','التجارب','الإعلان والتقييم والقبول','◎'],
  ['boards','السبورة الفنية','الخطط والرسومات التكتيكية','▧']
 ],
 business:[
  ['subscriptionPayment','الاشتراك والدفع','الرحلة المالية المشتركة والإيصالات','﷼'],
  ['opsSubscriptions','الاشتراكات والفواتير','الباقات والاستحقاقات والفواتير','▣'],
  ['opsCashier','الكاشير والتحصيل','نقطة البيع وإغلاق الصندوق','◈'],
  ['opsOrders','المتجر والطلبات','المنتجات والطلبات والتسليم','▤'],
  ['opsReservations','الحجوزات','الملاعب والمساحات والمواعيد','◷'],
  ['opsFinance','المالية والمصروفات','التحصيل والمصروفات والتدفق','﷼'],
  ['opsReports','التقارير','التقارير التشغيلية والمالية','▥'],
  ['opsDocuments','المستندات','العقود والإيصالات والوثائق','▧'],
  ['settings','الإعدادات','هوية التشغيل والسياسات والخصوصية','⚙']
 ],
 growth:[
  ['tryoutOpportunity','التجارب والفرص','من الإعلان إلى القبول والانضمام','◎'],
  ['opsMarketing','التسويق والعملاء المحتملون','الحملات والتحويل ومصادر الطلب','↗'],
  ['opsOffers','العروض والولاء','القسائم والهدايا والنقاط','◇'],
  ['opsForms','النماذج العامة','التسجيل، الاستبيانات والطلبات','▧'],
  ['opsWebsite','الموقع العام','الصفحة العامة والمحتوى وSEO','⌘'],
  ['communicationReports','التقارير الدورية','الإنجاز والحضور وملخصات الإدارة','✉'],
  ['opsIntegrations','التكاملات','الدفع والرسائل والأنظمة الخارجية','⌁'],
  ['opsAssistant','المساعد الذكي','التحليل والتقارير والمهام المساندة','✦']
 ]
};
A.active=function(route){route=route||VIEW;for(var k in A.routeGroups)if(A.routeGroups[k].indexOf(route)>=0)return k;return null};
A.space=function(key){return A.spaces.find(function(x){return x.key===key})||A.spaces[0]};
A.load=async function(force){if(!force&&A.cache&&Date.now()-A.cacheAt<15000)return A.cache;var settled=await Promise.allSettled([O.load(force),P.loadHome(force)]);A.cache={ops:settled[0].status==='fulfilled'?settled[0].value:{},home:settled[1].status==='fulfilled'?settled[1].value:{}};A.cacheAt=Date.now();return A.cache};
A.invalidate=function(){A.cache=null;A.cacheAt=0;try{O.invalidate()}catch(e){}try{P.clear()}catch(e){}};
A.rail=function(active){return '<nav class="as-rail" aria-label="مساحات الأكاديمية">'+A.spaces.map(function(s){return '<button class="'+(active===s.key?'on':'')+'" style="--as-accent:'+s.accent+'" onclick="go(\''+s.route+'\')"><i>'+s.icon+'</i><span>'+s.title+'</span></button>'}).join('')+'<button class="as-all" onclick="go(\'hub\')"><i>＋</i><span>كل الخدمات</span></button></nav>'};
A.routeExists=function(route){return typeof T[route]==='function'};
A.moduleHtml=function(item){var route=item[0],ok=A.routeExists(route);return '<article class="as-module '+(ok?'':'disabled')+'"><button '+(ok?'onclick="go(\''+route+'\')"':'disabled')+' aria-label="فتح '+A.e(item[1])+'"></button><i>'+item[3]+'</i><div><h3>'+A.e(item[1])+'</h3><p>'+A.e(item[2])+'</p><small>'+(ok?'فتح التفاصيل ←':'غير مستخدمة في هذا السياق')+'</small></div></article>'};
A.metrics=function(key,d){var o=d.ops||{},e=o.erp||{},w=o.workspace||{},inv=e.invoices||[],paid=inv.reduce(function(n,x){return n+Number(x.paid_amount||0)},0),due=inv.reduce(function(n,x){return n+Math.max(0,Number(x.total_amount||0)-Number(x.paid_amount||0))},0),profiles=o.profiles||[],players=profiles.filter(function(x){return x.role==='player'}).length+(o.seats||[]).length,coaches=profiles.filter(function(x){return x.role==='coach'}).length,staff=profiles.filter(function(x){return !['player','coach','guardian'].includes(x.role)}).length,teams=(w.teams||[]).length,events=(w.events||[]),today=new Date().toISOString().slice(0,10),attendance=(o.attendance||[]),todayAtt=attendance.filter(function(x){return String(x.session_date||x.created_at||'').slice(0,10)===today}),orders=(o.store&&o.store.orders)||[],leads=o.leads||[],campaigns=o.marketing||[],features=o.features||[],integrations=e.integrations||[],ready=integrations.filter(function(x){return x.status==='connected'||x.status==='active'}).length;
 var map={
  people:[['الأفراد',players+coaches+staff,'لاعبون ومدربون وموظفون'],['اللاعبون',players,'ملفات ومقاعد'],['المدربون',coaches,'ضمن الجهة'],['الفرق',teams,'فرق وفئات']],
  field:[['الفرق',teams,'في التشغيل'],['حضور اليوم',todayAtt.filter(function(x){return x.present!==false}).length,todayAtt.length+' تسجيل'],['الأحداث',events.length,'مباريات وحصص وفرص'],['سجل الحضور',attendance.length,'إجمالي السجلات']],
  business:[['الفواتير',inv.length,'إجمالي الفواتير'],['المحصل',A.money(paid),'مدفوع'],['المستحق',A.money(due),'بانتظار التحصيل'],['الطلبات',orders.length,'متجر وخدمات']],
  growth:[['العملاء المحتملون',leads.length,'طلبات جديدة'],['الحملات',campaigns.length,'نشطة ومؤرشفة'],['العروض',features.length,'خصومات وولاء'],['التكاملات',ready+'/'+integrations.length,'متصل/مجهز']]
 };
 return map[key]||[]};
A.priority=function(key,d){var o=d.ops||{},h=d.home||{},e=o.erp||{},w=o.workspace||{},decisions=(h.decisions||[]).concat(h.approvals||[]),inv=e.invoices||[],due=inv.filter(function(x){return Number(x.total_amount||0)>Number(x.paid_amount||0)}),today=new Date().toISOString().slice(0,10),attendance=(o.attendance||[]).filter(function(x){return String(x.session_date||x.created_at||'').slice(0,10)===today});
 if(key==='people')return decisions.length?{title:decisions[0].title||'قرار إداري ينتظر الإجراء',sub:'ابدأ بالقرار الأعلى أولوية ثم افتح ملف الشخص المعني.',route:decisions[0].action_route||'opsInbox',tone:'#6D4CFF'}:{title:'راجع اكتمال ملفات الأفراد',sub:'الهوية، العضوية، الفريق ووسيلة التواصل.',route:'opsCustomers',tone:'#6D4CFF'};
 if(key==='field')return attendance.length?{title:'راجع تشغيل اليوم في الملعب',sub:attendance.length+' تسجيل حضور اليوم، مع ربط التدريب والمباراة بنفس السجل.',route:'opsAttendance',tone:'#25A173'}:{title:'جهّز الحدث الرياضي القادم',sub:'أنشئ الحصة أو المباراة ثم انشرها للأطراف.',route:'trainingDay',tone:'#25A173'};
 if(key==='business')return due.length?{title:'هناك '+due.length+' فاتورة تحتاج متابعة',sub:'راجع الاستحقاق وطلب السداد قبل تفعيل الاشتراك.',route:'subscriptionPayment',tone:'#D5B642'}:{title:'الوضع المالي دون استحقاقات عاجلة',sub:'راجع الأداء والتحصيل وإغلاق الصندوق.',route:'opsFinance',tone:'#D5B642'};
 return (o.leads||[]).length?{title:'حوّل العملاء المحتملين إلى تسجيل فعلي',sub:'اربط الطلب بالتجربة ثم الاشتراك والدفع.',route:'opsMarketing',tone:'#D97B29'}:{title:'انشر فرصة أو حملة جديدة',sub:'ابدأ من التجارب والفرص أو نموذج التسجيل.',route:'tryoutOpportunity',tone:'#D97B29'};
};
A.hero=function(space,d){var p=A.priority(space.key,d),org=(d.ops&&d.ops.org)||'الأكاديمية';return '<section class="as-hero" style="--as-accent:'+space.accent+'"><div><span>'+space.kicker+'</span><h1>'+space.title+'</h1><p>'+space.desc+'</p><small>'+A.e(org)+' · مساحة تشغيل موحدة</small></div>'+P.shape('TL',org,null,{className:'as-hero-shape',label:P.sceneInitial(org),accentHex:space.accent})+'<article class="as-next"><i>→</i><div><span>NEXT BEST ACTION</span><h2>'+A.e(p.title)+'</h2><p>'+A.e(p.sub)+'</p></div><button onclick="go(\''+p.route+'\')">نفّذ الآن ←</button></article></section>'};
A.metricHtml=function(rows){return '<section class="as-metrics">'+rows.map(function(x,i){return '<div><span>'+A.e(x[0])+'</span><b>'+A.e(x[1])+'</b><small>'+A.e(x[2])+'</small></div>'}).join('')+'</section>'};
A.page=async function(key){var d=await A.load(false),s=A.space(key),mods=A.modules[key]||[];return '<main class="as-main" data-space="'+key+'">'+A.hero(s,d)+A.rail(key)+A.metricHtml(A.metrics(key,d))+'<section class="as-section"><div class="as-section-head"><div><span>SERVICE MAP</span><h2>الخدمات داخل '+s.title+'</h2></div><button onclick="go(\'hub\')">كل خدمات الأكاديمية ←</button></div><div class="as-modules">'+mods.map(A.moduleHtml).join('')+'</div></section><section class="as-section as-continuity"><div><span>NO SERVICE LOST</span><h2>التفاصيل المتخصصة محفوظة</h2><p>هذه المساحة تختصر الوصول والقرار فقط. جميع الصفحات والعمليات الحالية ما زالت متاحة بالروابط المباشرة والبحث ومركز الخدمات.</p></div><button onclick="PLAYIN_EXPERIENCE&&PLAYIN_EXPERIENCE.openCommand?PLAYIN_EXPERIENCE.openCommand():go(\'hub\')">بحث وأوامر</button></section></main>'};
A.inject=function(){if(!ME||ME.role!=='academy')return;var active=A.active(VIEW),main=document.querySelector('#app main');document.body.classList.toggle('academy-spaces-active',!!active);if(!active||!main)return;if(!main.classList.contains('as-main')&&!main.querySelector(':scope > .as-rail'))main.insertAdjacentHTML('afterbegin',A.rail(active));main.setAttribute('data-academy-space',active)};
T.academyToday=async function(){return T.smartHome()};
T.academyPeople=async function(){return A.page('people')};
T.academyField=async function(){return A.page('field')};
T.academyBusiness=async function(){return A.page('business')};
T.academyGrowth=async function(){return A.page('growth')};
try{
 TITLES.academyToday='اليوم';TITLES.academyPeople='الأشخاص';TITLES.academyField='الملعب';TITLES.academyBusiness='الأعمال';TITLES.academyGrowth='النمو';
 HUB.ROLE_OK.academy=Array.from(new Set((HUB.ROLE_OK.academy||[]).concat(['academyToday','academyPeople','academyField','academyBusiness','academyGrowth'])));
 var additions=[['⌂','اليوم','smartHome'],['◉','الأشخاص','academyPeople'],['⚽','الملعب','academyField'],['▣','الأعمال','academyBusiness'],['↗','النمو','academyGrowth']];
 HUB.ROLE.academy=additions.concat((HUB.ROLE.academy||[]).filter(function(x){return !additions.some(function(a){return a[2]===x[2]})}));
 NAV.academy=[['⌂','اليوم','smartHome'],['◉','الأشخاص','academyPeople'],['⚽','الملعب','academyField'],['▣','الأعمال','academyBusiness'],['↗','النمو','academyGrowth']];
}catch(e){console.warn('Academy spaces navigation',e)}
var priorRender=render;render=async function(){await priorRender();A.inject()};window.render=render;
})();
