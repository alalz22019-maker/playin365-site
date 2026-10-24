(function(){
'use strict';
if(!window.PZ)return;

var BR_PATH='M500 0 A500 500 0 0 1 1000 500 L1000 750 A250 250 0 0 1 750 1000 L500 1000 A500 500 0 0 1 500 0 Z';

function playerSrc(p){
  var demoId='89a89d4d-6792-48ff-9017-086532d128b0';
  var demoPhoto='https://images.unsplash.com/photo-1761225091881-0d3bda9f6d5a?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1200';
  return (p&&String(p.id)===demoId)?demoPhoto:((p&&p.avatar_url)||demoPhoto);
}
function e(x){return PZ.e?PZ.e(x):String(x==null?'':x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function val(x,f){return e(x==null||x===''?(f||'—'):x)}
function stat(value,label,accent){return '<div class="pi-id-stat"><strong class="'+(accent||'')+'">'+val(value)+'</strong><span>'+label+'</span></div>'}
function badge(icon,title,meta){return '<div class="pi-id-badge"><span class="pi-id-badge-icon">'+icon+'</span><div><b>'+title+'</b><small>'+meta+'</small></div></div>'}

PZ.identityCard=function(ev,joins,badges){
  ev=ev||[];joins=joins||[];badges=badges||[];
  var code=ME.athlete_id||ME.handle||'PI-89A89D4D';
  var verified=new Set(ev.map(function(x){return x.match_id}).concat(joins.filter(function(x){return x.attended}).map(function(x){return x.match_id}))).size||5;
  var goals=ev.filter(function(x){return x.type==='goal'}).length||7;
  var assists=ev.filter(function(x){return x.type==='assist'}).length||2;
  var src=e(playerSrc(ME));
  var b1=badges[0]&&badges[0].title||'هداف موسم 2025';
  var b2=badges[1]&&badges[1].title||'أفضل لاعب في بطولة الاتحاد السعودي';
  var b3=badges[2]&&badges[2].title||'1000 دقيقة لعب خلال الموسم';
  return '<section class="pi-id-card" aria-label="بطاقة هوية اللاعب">'+
    '<div class="pi-id-card-top"><div><span class="pi-id-kicker">PLAYER IDENTITY · VERIFIED ATHLETE</span><div class="pi-id-brand">Play<span>In</span><sup>365</sup></div></div><span class="pi-id-verified"><i>✓</i> موثق</span></div>'+
    '<div class="pi-id-card-body">'+
      '<div class="pi-id-photo-wrap"><svg class="pi-id-photo" viewBox="0 0 1000 1000" role="img" aria-label="صورة اللاعب"><defs><clipPath id="pi-br-clip"><path d="'+BR_PATH+'"/></clipPath><linearGradient id="pi-photo-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00a6d6" stop-opacity=".28"/><stop offset=".65" stop-color="#4636e3" stop-opacity=".08"/><stop offset="1" stop-color="#d5b642" stop-opacity=".28"/></linearGradient></defs><rect width="1000" height="1000" fill="#151a2e"/><image href="'+src+'" x="0" y="0" width="1000" height="1000" preserveAspectRatio="xMidYMid slice" clip-path="url(#pi-br-clip)"/><path d="'+BR_PATH+'" fill="url(#pi-photo-shine)" clip-path="url(#pi-br-clip)"/><path d="'+BR_PATH+'" fill="none" stroke="#d5b642" stroke-width="18"/><path d="'+BR_PATH+'" fill="none" stroke="#4636e3" stroke-width="7" opacity=".75" transform="translate(22 22) scale(.956)"/></svg><span class="pi-id-photo-label">صورة اللاعب</span></div>'+
      '<div class="pi-id-summary"><div class="pi-id-name-row"><div><h1>'+val(ME.display_name||ME.name,'سعود القحطاني')+'</h1><p>'+val(ME.org||'أكاديمية النخبة','أكاديمية النخبة')+'</p></div><strong class="pi-id-shirt">18</strong></div>'+
        '<div class="pi-id-data"><div><b>U14</b><small>الفئة</small></div><div><b>18</b><small>رقم القميص</small></div><div><b>RB</b><small>المركز</small></div><div><b>Right foot</b><small>القدم المفضلة</small></div></div>'+
        '<div class="pi-id-performance"><div><span>المباريات</span><b>'+verified+'</b></div><div><span>الأهداف</span><b>'+goals+'</b></div><div><span>الصناعة</span><b>'+assists+'</b></div><div><span>التقييم</span><b>6.8</b></div></div>'+
      '</div>'+
    '</div>'+
    '<div class="pi-id-lower"><div class="pi-id-achievements"><div class="pi-id-section-title"><span>CAREER SIGNALS</span><b>أبرز الإنجازات</b></div>'+badge('⚽',b1,'موسم 2025')+badge('✦',b2,'إنجاز موثق')+badge('◷',b3,'إحصائية الموسم')+'</div>'+
      '<div class="pi-id-qr"><img src="'+('https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data='+encodeURIComponent(location.origin+location.pathname+'?player='+encodeURIComponent(ME.name||'سعود القحطاني'))) +'" alt="باركود هوية اللاعب"><b>'+val(code)+'</b><small>امسح لفتح الهوية الرقمية</small></div>'+
    '</div>'+
    '<div class="pi-id-footer"><span>هوية رياضية موثقة وقابلة للمشاركة</span><span>PLAYIN365</span></div>'+
  '</section>';
};

PZ.myCard=async function(){
  var d=await Promise.all([
    PZ.safe('events',sb.from('match_events').select('*').eq('who',ME.name).limit(120)),
    PZ.safe('joins',sb.from('match_joins').select('*').eq('player_name',ME.name)),
    PZ.safe('badges',sb.from('pi_badges').select('*').eq('person',ME.name).limit(8))
  ]);
  var ev=d[0]||[],joins=d[1]||[],badges=d[2]||[];
  var code=ME.athlete_id||ME.handle||'PI-89A89D4D';
  var body='<div class="pi-id-page">'+PZ.top()+
    '<main class="pi-id-main">'+
      '<div class="pi-id-page-head"><div><span class="pi-id-kicker">PUBLIC ATHLETE IDENTITY</span><h1>هوية اللاعب</h1><p>بطاقة واحدة تجمع صورتك، هويتك، مركزك، أرقامك وإنجازاتك — جاهزة للمشاركة.</p></div><button onclick="window.PZ.share(\''+e(ME.name||'سعود القحطاني')+'\')">شارك الهوية ↗</button></div>'+
      PZ.identityCard(ev,joins,badges)+
      '<div class="pi-id-actions"><button class="primary" onclick="window.PZ.share(\''+e(ME.name||'سعود القحطاني')+'\')">شارك البطاقة</button><button onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href)">انسخ رابط الهوية</button><span>الرقم الرقمي داخل البطاقة وتحت الباركود مباشرة: <b>'+val(code)+'</b></span></div>'+
    '</main>'+PZ.nav('publicView')+'</div>';
  return body;
};
PZ.bind('myCard',PZ.myCard);PZ.bind('publicView',PZ.myCard);
})();