/* PlayIn365 — Academy experimental assistant and unified inbox. */
(function(){
'use strict';
var O=window.ACOPS;if(!O||typeof T==='undefined')return;

var previousStatus=O.status;
O.status=function(v){
  var x=String(v||'');
  var map={
    experimental:'تجريبي',queued:'في قائمة الانتظار',processing:'قيد التنفيذ',completed:'مكتمل',
    failed:'فشل',received:'مستلم',processed:'تمت المعالجة',ignored:'تم التجاهل',
    sent:'مرسل',delivered:'تم التسليم',new:'جديد',contacted:'تم التواصل',qualified:'مؤهل',
    enrolled:'تم التسجيل',closed:'مغلق',spam:'مزعج'
  };
  return map[x]||previousStatus(v);
};

if(!O.providers.some(function(x){return x[1]==='openai-api'}))
  O.providers.push(['general','openai-api','OpenAI API',['responses','tools','embeddings']]);
if(!O.providers.some(function(x){return x[1]==='anthropic-api'}))
  O.providers.push(['general','anthropic-api','Anthropic API',['messages','tools','batch']]);

function addRoute(after,route,label){
  if(O.serviceRoutes.some(function(x){return x[0]===route}))return;
  var at=O.serviceRoutes.findIndex(function(x){return x[0]===after});
  O.serviceRoutes.splice(at<0?O.serviceRoutes.length:at+1,0,[route,label]);
}
addRoute('opsMarketing','opsAssistant','المساعد الذكي');
addRoute('opsEngagement','opsInbox','صندوق الوارد الموحد');

O.aiCenter=async function(){
  var d=await O.load();
  return O.rpc('my_organization_ai_center',{p_organization_id:d.oid,p_limit:200});
};
O.createAiRequest=function(btn){return O.withAction(btn,async function(){
  var d=await O.load(),prompt=O.val('opsAiPrompt'),type=O.val('opsAiType')||'assistant',provider=O.val('opsAiProvider')||null;
  if(prompt.length<3)throw new Error('اكتب طلبًا واضحًا للمساعد');
  await O.rpc('create_my_organization_ai_request',{
    p_organization_id:d.oid,p_request_type:type,p_prompt:prompt,p_provider_code:provider,
    p_context:{source:'academy_operations',route:VIEW,experimental:true,organization_name:d.org}
  });
},'تم حفظ طلب المساعد بحالة تجريبية')};
O.cancelAiRequest=function(id,btn){return O.withAction(btn,async function(){
  var d=await O.load();
  await O.rpc('cancel_my_organization_ai_request',{p_organization_id:d.oid,p_request_id:id});
},'تم إلغاء الطلب')};
O.aiResponseText=function(x){
  if(!x||!x.response)return '';
  var r=x.response;
  if(typeof r==='string')return r;
  return r.text||r.output_text||r.answer||r.summary||JSON.stringify(r);
};

T.opsAssistant=async function(){
  var center=await O.aiCenter(),requests=center.requests||[],counts=center.counts||{},providers=(O.cache&&O.cache.erp&&O.cache.erp.integrations)||[];
  var aiProviders=['openai-api','anthropic-api'].map(function(code){
    var rec=providers.find(function(x){return x.provider_code===code});
    return {code:code,label:code==='openai-api'?'OpenAI API':'Anthropic API',record:rec};
  });
  var rows=requests.map(function(x){
    var answer=O.aiResponseText(x),act=x.status==='queued'?O.btn('إلغاء','ACOPS.cancelAiRequest(\''+x.id+'\',this)','tiny danger'):'';
    return '<tr><td><b>'+O.esc(x.request_type)+'</b><small>'+O.esc(x.provider_code||'بدون مزود محدد')+'</small></td><td><span class="ops-clamp">'+O.esc(x.prompt)+'</span></td><td>'+O.badge(O.status(x.status),x.status==='completed'?'ok':x.status==='failed'?'bad':'warn')+'</td><td>'+O.when(x.created_at)+'</td><td>'+(answer?'<span class="ops-clamp">'+O.esc(answer)+'</span>':O.esc(x.error_message||'—'))+'</td><td>'+act+'</td></tr>';
  }).join('');
  var providerCards=aiProviders.map(function(p){var x=p.record;return '<div class="ops-mini"><b>'+p.label+'</b><strong>'+(x?O.status(x.status):'غير مجهز')+'</strong><span>'+(x&&x.status==='connected'?'جاهز للتنفيذ الحقيقي':'تشغيل تجريبي فقط — لا يُرسل محتوى خارجيًا')+'</span>'+(x?'':O.btn('تجهيز','ACOPS.registerIntegration(\''+p.code+'\',this)','tiny'))+'</div>'}).join('');
  return O.page('EXPERIMENTAL AI','المساعد الذكي التجريبي','ينشئ طلبات منظمة ويحفظها في طابور آمن. التنفيذ الخارجي يتوقف حتى تفعيل مزود الذكاء الاصطناعي.',
    '<section class="ops-kpis">'+
      O.kpi('طلبات الانتظار',O.num(counts.queued||0),'محفوظة وغير مرسلة','orange')+
      O.kpi('قيد التنفيذ',O.num(counts.processing||0),'ينفذها العامل الخلفي','blue')+
      O.kpi('مكتملة',O.num(counts.completed||0),'ردود محفوظة','green')+
      O.kpi('فشلت',O.num(counts.failed||0),'تحتاج مراجعة','dark')+
    '</section>'+
    O.card('حالة المزودات','<div class="ops-mini-grid">'+providerCards+'</div><p class="ops-hint">الحالة «تجريبي» تعني أن الواجهة والطابور جاهزان، لكن الطلب لا يغادر PlayIn365 حتى إضافة مفتاح المزود في أسرار Vercel واختبار الاتصال.</p>')+
    O.card('طلب جديد','<div class="ops-form cols-3"><label>نوع المهمة<select id="opsAiType"><option value="assistant">مساعد عام</option><option value="report">إعداد تقرير</option><option value="marketing">محتوى تسويقي</option><option value="customer_reply">رد على عميل</option><option value="operations">تحسين تشغيل</option><option value="analysis">تحليل بيانات</option></select></label><label>المزود التجريبي<select id="opsAiProvider"><option value="">اختيار تلقائي لاحقًا</option><option value="openai-api">OpenAI API</option><option value="anthropic-api">Anthropic API</option></select></label><div class="ops-form-action">'+O.btn('حفظ الطلب التجريبي','ACOPS.createAiRequest(this)','primary')+'</div></div><label class="ops-wide-label">المطلوب<textarea id="opsAiPrompt" rows="5" placeholder="مثال: حلل غياب اللاعبين هذا الأسبوع واقترح رسالة متابعة لأولياء الأمور"></textarea></label>')+
    O.card('سجل الطلبات',rows?O.rows(['النوع والمزود','الطلب','الحالة','الإنشاء','النتيجة','الإجراء'],[rows]):O.empty('لا توجد طلبات','أنشئ أول طلب تجريبي')),
    O.btn('التكاملات','go(\'opsIntegrations\')','secondary')+O.btn('صندوق الوارد','go(\'opsInbox\')','primary')
  );
};

O.leadAction=function(id,status,btn){return O.withAction(btn,async function(){
  var d=await O.load();await O.rpc('act_my_organization_lead',{p_organization_id:d.oid,p_lead_id:id,p_status:status});
},'تم تحديث طلب العميل')};
O.markNotification=function(id,btn){return O.withAction(btn,async function(){await O.rpc('mark_my_notification_read',{p_notification_id:id})},'تم تعليم الإشعار كمقروء')};
O.inboxItem=function(kind,title,sub,status,when,actions,tone){
  return '<article class="ops-inbox-item"><div class="ops-inbox-kind '+(tone||'')+'">'+O.esc(kind)+'</div><div class="ops-inbox-body"><b>'+O.esc(title)+'</b><p>'+O.esc(sub||'')+'</p><small>'+O.when(when)+'</small></div><div class="ops-inbox-side">'+O.badge(O.status(status),status==='completed'||status==='closed'||status==='delivered'?'ok':status==='failed'||status==='spam'?'bad':'warn')+'<div>'+((actions)||'')+'</div></div></article>';
};

T.opsInbox=async function(){
  var d=await O.load(true),items=[];
  (d.leads||[]).forEach(function(x){
    var acts=x.status==='new'?O.btn('تم التواصل','ACOPS.leadAction(\''+x.id+'\',\'contacted\',this)','tiny')+O.btn('مؤهل','ACOPS.leadAction(\''+x.id+'\',\'qualified\',this)','tiny'):x.status==='contacted'||x.status==='qualified'?O.btn('تم التسجيل','ACOPS.leadAction(\''+x.id+'\',\'enrolled\',this)','tiny')+O.btn('إغلاق','ACOPS.leadAction(\''+x.id+'\',\'closed\',this)','tiny danger'):'';
    items.push({at:x.created_at,html:O.inboxItem('عميل محتمل',x.name,(x.phone||'')+' · '+(x.interest||'تسجيل'),x.status,x.created_at,acts,'lead')});
  });
  ((d.forms&&d.forms.submissions)||[]).forEach(function(x){
    var acts=x.status==='new'?O.btn('تم التواصل','ACOPS.submissionAction(\''+x.id+'\',\'contacted\',this)','tiny')+O.btn('مؤهل','ACOPS.submissionAction(\''+x.id+'\',\'qualified\',this)','tiny'):x.status==='contacted'||x.status==='qualified'?O.btn('مكتمل','ACOPS.submissionAction(\''+x.id+'\',\'completed\',this)','tiny')+O.btn('إغلاق','ACOPS.submissionAction(\''+x.id+'\',\'closed\',this)','tiny danger'):'';
    items.push({at:x.created_at,html:O.inboxItem('نموذج',x.name,(x.phone||x.email||'رد جديد'),x.status,x.created_at,acts,'form')});
  });
  (d.outbound||[]).forEach(function(x){
    var acts=['draft','queued'].indexOf(x.status)>=0?O.btn('إلغاء','ACOPS.messageAction(\''+x.id+'\',\'cancel\',this)','tiny danger'):'';
    items.push({at:x.created_at,html:O.inboxItem('رسالة خارجية',x.recipient,x.subject||x.body,x.status,x.scheduled_at||x.created_at,acts,'message')});
  });
  (((d.integrationEvents||{}).events)||[]).forEach(function(x){
    items.push({at:x.received_at,html:O.inboxItem('حدث تكامل',x.provider_code,x.event_type+' · '+(x.external_event_id||x.request_id||''),x.status,x.received_at,'','integration')});
  });
  (d.notifications||[]).forEach(function(x){
    var unread=!x.read_at&&!x.is_read,acts=unread?O.btn('تعليم كمقروء','ACOPS.markNotification(\''+x.id+'\',this)','tiny'):'';
    items.push({at:x.created_at,html:O.inboxItem('إشعار',x.title||x.kind,x.body||'',unread?'new':'closed',x.created_at,acts,'notification')});
  });
  items.sort(function(a,b){return new Date(b.at||0)-new Date(a.at||0)});
  var leads=(d.leads||[]).filter(function(x){return ['new','contacted','qualified'].indexOf(x.status)>=0}).length;
  var forms=((d.forms&&d.forms.submissions)||[]).filter(function(x){return ['new','contacted','qualified'].indexOf(x.status)>=0}).length;
  var queued=(d.outbound||[]).filter(function(x){return ['draft','queued'].indexOf(x.status)>=0}).length;
  var failed=(((d.integrationEvents||{}).events)||[]).filter(function(x){return x.status==='failed'}).length;
  return O.page('UNIFIED INBOX','صندوق الوارد الموحد','يجمع طلبات التسجيل والنماذج والرسائل والأحداث والإشعارات في تسلسل واحد.',
    '<section class="ops-kpis">'+O.kpi('عملاء يحتاجون متابعة',O.num(leads),'طلبات التسجيل والاهتمام','orange')+O.kpi('ردود نماذج مفتوحة',O.num(forms),'نماذج عامة','violet')+O.kpi('رسائل تنتظر الإرسال',O.num(queued),'التكامل التجريبي','blue')+O.kpi('أحداث ربط فاشلة',O.num(failed),'تحتاج تدخل','dark')+'</section>'+
    O.card('كل الوارد <span class="ops-count">'+O.num(items.length)+'</span>','<div class="ops-inbox-list">'+(items.length?items.slice(0,300).map(function(x){return x.html}).join(''):O.empty('صندوق الوارد فارغ','ستظهر الطلبات والرسائل والأحداث هنا'))+'</div>'),
    O.btn('تحديث','ACOPS.invalidate();render()','secondary')+O.btn('الرسائل الداخلية','go(\'messages\')','primary')
  );
};

var titles={opsAssistant:'المساعد الذكي التجريبي',opsInbox:'صندوق الوارد الموحد'};
if(typeof TITLES!=='undefined')Object.keys(titles).forEach(function(k){TITLES[k]=titles[k]});
if(typeof HUB!=='undefined'){
  var cards=[['✦','المساعد الذكي التجريبي','opsAssistant','#efeaff','#7656e8'],['▤','صندوق الوارد الموحد','opsInbox','#e7f7ff','#087ea4']];
  HUB.ROLE.academy=(HUB.ROLE.academy||[]).concat(cards.filter(function(x){return !(HUB.ROLE.academy||[]).some(function(y){return y[2]===x[2]})}));
  HUB.ROLE_OK.academy=Array.from(new Set((HUB.ROLE_OK.academy||[]).concat(Object.keys(titles))));
}
var css=document.createElement('style');css.textContent='\
.ops-wide-label textarea{width:100%;box-sizing:border-box;border:1px solid rgba(105,137,187,.26);background:#0c1628;color:#edf3ff;border-radius:11px;padding:11px;font:700 10px/1.8 Cairo;resize:vertical;outline:none}.ops-wide-label textarea:focus{border-color:#7b5cff;box-shadow:0 0 0 3px rgba(123,92,255,.1)}\
.ops-clamp{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;max-width:340px;white-space:normal}.ops-inbox-list{display:grid;gap:8px}.ops-inbox-item{display:grid;grid-template-columns:78px 1fr auto;gap:12px;align-items:center;background:#0d182b;border:1px solid rgba(106,136,183,.17);border-radius:14px;padding:11px}.ops-inbox-kind{display:grid;place-items:center;min-height:48px;border-radius:11px;background:rgba(123,92,255,.12);color:#b7a8ff;font:900 8px Cairo;text-align:center}.ops-inbox-kind.lead{background:rgba(217,123,41,.12);color:#efb578}.ops-inbox-kind.form{background:rgba(0,166,214,.12);color:#74d9ef}.ops-inbox-kind.message{background:rgba(37,161,115,.12);color:#79d9b4}.ops-inbox-kind.integration{background:rgba(213,182,66,.12);color:#ead876}.ops-inbox-body b,.ops-inbox-body p,.ops-inbox-body small{display:block}.ops-inbox-body b{font:900 10px Cairo}.ops-inbox-body p{font:600 9px/1.6 Cairo;color:#91a2bd;margin:4px 0}.ops-inbox-body small{font:600 8px Cairo;color:#7083a3}.ops-inbox-side{display:grid;justify-items:end;gap:7px}.ops-inbox-side>div{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}@media(max-width:620px){.ops-inbox-item{grid-template-columns:60px 1fr}.ops-inbox-side{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center}}';document.head.appendChild(css);
})();
