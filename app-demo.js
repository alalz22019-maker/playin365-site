/* PlayIn365 — الطبقة التجريبية المنفصلة
   قرار المالك (هجرة ٨ سبتمبر): «التجريبي لا يكتب في الحقيقي» — الحسابات التجريبية
   تقرأ وتكتب في نسختها داخل التطبيق. هذا الملف هو تلك النسخة:
   بيانات كاملة لكل دور + طبقة قراءة/كتابة تعمل بالكامل، ولا تلمس القاعدة الحقيقية.
   المحتوى يبقى محفوظًا لكل حساب على جهازه، ويُصفَّر من الإعدادات. */
const DEMO = { on:false, uid:null, store:null };

DEMO.isDemoEmail = e => /@demo\.playin365\.app$/i.test(String(e||""));
DEMO.TABLES = ["matches","match_events","match_joins","transparency","subscriptions","notifications","pi_refs","bookings","pi_media","pi_spaces","pi_faults","pi_gate","pi_sponsors","pi_venue_meta","pi_tours","pi_news","pi_follows","pi_names","pi_consent_req","pi_approvals","pi_slots","pi_comp_teams"];

/* ── البذرة: عالم أكاديمية النخبة ودوري الحي ── */
DEMO.seed = () => {
  const d = n => new Date(Date.now() - n*864e5).toISOString();
  const h = n => new Date(Date.now() - n*36e5).toISOString();
  const ORG = "تركي الرشيد", REF = "ماجد السبيعي", CO = "عبدالله المطيري";
  const M = (id,o) => Object.assign({id,score_a:0,score_b:0,fee:0,referee_name:"",organizer_name:ORG,organizer_id:"demo-organizer",venue:"ملعب المروج"},o);
  const matches = [
    M("dm-01",{title:"الصقور × الشرق — الجولة ٣",comp:"دوري الحي ٢٠٢٥",team_a:"الصقور",team_b:"الشرق",status:"final",score_a:4,score_b:1,match_time:"20:00",referee_name:REF,created_at:d(41)}),
    M("dm-02",{title:"النخبة × الرواد — ودية",comp:"ودية",status:"final",score_a:2,score_b:2,match_time:"19:30",referee_name:REF,created_at:d(27)}),
    M("dm-03",{title:"الصقور × الشرق — الجولة ٤",comp:"دوري الحي ٢٠٢٥",team_a:"الصقور",team_b:"الشرق",status:"final",score_a:3,score_b:2,match_time:"20:00",referee_name:REF,created_at:d(12)}),
    M("dm-04",{title:"النخبة × الفيصل — ودية",comp:"ودية",status:"final",score_a:2,score_b:1,match_time:"19:00",referee_name:REF,created_at:d(6)}),
    M("dm-05",{title:"الصقور × النخبة — الجولة ٥",comp:"دوري الحي ٢٠٢٥",team_a:"الصقور",team_b:"النخبة",status:"live",score_a:1,score_b:1,match_time:"21:00",referee_name:REF,created_at:h(1)}),
    M("dm-06",{title:"سباعية الحي — مساء الخميس",comp:"مفتوحة",status:"open",fee:25,match_time:"22:00",created_at:h(5)}),
    M("dm-07",{title:"سداسية الشباب — الجمعة",comp:"مفتوحة",status:"open",fee:15,match_time:"17:30",created_at:h(9)}),
    M("dm-08",{title:"النخبة × هيرو — تجارب أداء",comp:"تجارب أداء",status:"today",match_time:"18:00",referee_name:REF,created_at:h(3)})
  ];
  const byRef = REF+" — الحكم", byOrg = ORG+" — المنظم";
  let n=0; const E=(mid,minute,type,who,by,ago)=>({id:"de-"+(++n),match_id:mid,minute,type,who,recorded_by:by,created_at:ago});
  const events = [
    E("dm-01",14,"goal","سعود القحطاني",byRef,d(41)), E("dm-01",31,"assist","سلطان الحربي",byRef,d(41)),
    E("dm-01",52,"goal","بندر القرني",byRef,d(41)),   E("dm-01",70,"goal","سعود القحطاني",byRef,d(41)),
    E("dm-01",78,"yellow","محمد العتيبي",byRef,d(41)),E("dm-01",88,"goal","سعود القحطاني",byRef,d(41)),
    E("dm-02",22,"assist","سعود القحطاني",byRef,d(27)),E("dm-02",44,"goal","عبدالعزيز الغامدي",byRef,d(27)),
    E("dm-02",61,"goal","سعود القحطاني",byRef,d(27)), E("dm-02",83,"sub","بندر القرني",byRef,d(27)),
    E("dm-03",9,"goal","سعود القحطاني",byRef,d(12)),  E("dm-03",27,"assist","سعود القحطاني",byRef,d(12)),
    E("dm-03",38,"goal","سلطان الحربي",byRef,d(12)),  E("dm-03",55,"yellow","سعود القحطاني",byRef,d(12)),
    E("dm-03",67,"goal","بندر القرني",byRef,d(12)),   E("dm-03",74,"sub","محمد العتيبي",byOrg,d(12)),
    E("dm-04",18,"goal","سعود القحطاني",byRef,d(6)),  E("dm-04",49,"assist","عبدالعزيز الغامدي",byRef,d(6)),
    E("dm-04",57,"goal","سلطان الحربي",byRef,d(6)),   E("dm-04",80,"yellow","بندر القرني",byRef,d(6)),
    E("dm-05",12,"goal","سعود القحطاني",byRef,h(1)),  E("dm-05",34,"assist","محمد العتيبي",byRef,h(1))
  ];
  const PL = ["سعود القحطاني","سلطان الحربي","محمد العتيبي","عبدالعزيز الغامدي","فيصل الزهراني","بندر القرني"];
  let j=0; const joins=[];
  ["dm-01","dm-02","dm-03","dm-04"].forEach((mid,mi)=>PL.forEach(p=>joins.push({
    id:"dj-"+(++j),match_id:mid,player_id:"demo-"+p,player_name:p,attended:true,created_at:d([41,27,12,6][mi])})));
  PL.slice(0,4).forEach(p=>joins.push({id:"dj-"+(++j),match_id:"dm-05",player_id:"demo-"+p,player_name:p,attended:true,created_at:h(1)}));
  PL.slice(0,3).forEach(p=>joins.push({id:"dj-"+(++j),match_id:"dm-08",player_id:"demo-"+p,player_name:p,attended:false,created_at:h(2)}));

  let t=0; const TR=(actor,action,ago)=>({id:"dt-"+(++t),actor,action,created_at:ago});
  const transparency = [
    TR(ORG+" — منظم","إنشاء مباراة: الصقور × الشرق — الجولة ٤",d(13)),
    TR(REF+" — حكم","تسجيل هدف — سعود القحطاني · الدقيقة 9 · الصقور × الشرق — الجولة ٤",d(12)),
    TR(REF+" — حكم","تسجيل بطاقة صفراء — سعود القحطاني · الدقيقة 55",d(12)),
    TR(ORG+" — منظم","إعلان نتيجة الصقور × الشرق — الجولة ٤: 3-2 — نهائية لحظة الإعلان",d(12)),
    TR(ORG+" — منظم","تصحيح نتيجة النخبة × الرواد — ودية: من 2-1 إلى 2-2 · السبب: هدف الدقيقة 90 لم يُسجَّل وقتها",d(26)),
    TR(CO+" — مدرب","تسجيل حضور حصة U18 — 6 لاعبين · شدة 7",d(3)),
    TR("مشرف أكاديمية النخبة — أكاديمية","تحصيل اشتراك سبتمبر — سلطان الحربي · 450 ر.س",d(4)),
    TR("د. ريم الحربي — طبي","تحديث حالة الجاهزية — سعود القحطاني: متاح بقيود",d(2)),
    TR("ناصر الدوسري — كشاف","طلب إذن اطلاع — سلطان الحربي (عبر ولي الأمر)",d(2)),
    TR(REF+" — حكم","تسجيل هدف — سعود القحطاني · الدقيقة 12 · الصقور × النخبة — الجولة ٥",h(1))
  ];
  const subscriptions = PL.map((p,i)=>({id:"ds-"+i,org:"أكاديمية النخبة",player_name:p,month:"سبتمبر",amount:450,paid:i<4,group_name:"U18",created_at:d(8)}));
  const pi_refs = ["dm-03","dm-04","dm-05","dm-08"].map((mid,i)=>({id:"dr-"+i,match_id:mid,
    match_title:(matches.find(m=>m.id===mid)||{}).title,referee:REF,grade:"درجة أولى",assigned_by:ORG,created_at:d([13,7,1,1][i])}));
  const notifications = [
    {id:"dn-1",user_id:"*guardian",kind:"report",title:"تحديث أولياء الأمور — الأسبوع ٣٦",body:"حضور ابنك ٤ من ٤ حصص · هدفان موثقان في مباراتين. نشرَه: مشرف أكاديمية النخبة.",created_at:d(2)},
    {id:"dn-2",user_id:"*guardian",kind:"consent",title:"طلب إذن اطلاع",body:"ناصر الدوسري (كشاف) يطلب إذن اطلاع على السجل الرياضي — الغرض: تقييم للانتقال · لمدة ٣٠ يومًا.",created_at:d(2)},
    {id:"dn-3",user_id:"*player",kind:"report",title:"دخل سجلك حدث جديد",body:"هدف — الدقيقة 12 · الصقور × النخبة — الجولة ٥ · سجّله ماجد السبيعي (الحكم).",created_at:h(1)},
    {id:"dn-4",user_id:"*referee",kind:"report",title:"تعيين جديد",body:"عيّنك تركي الرشيد حكمًا لمباراة الصقور × النخبة — الجولة ٥ · اليوم 21:00.",created_at:h(4)},
    {id:"dn-5",user_id:"*coach",kind:"report",title:"حالة جاهزية تغيّرت",body:"سعود القحطاني: متاح بقيود — من د. ريم الحربي. الجاهزية فقط، بلا تشخيص.",created_at:d(2)},
    {id:"dn-6",user_id:"*scout",kind:"consent",title:"وصل ردّ على طلبك",body:"ولي أمر سلطان الحربي منح إذن اطلاع على السجل الرياضي لمدة ٣٠ يومًا — الغرض: تقييم للانتقال.",created_at:d(1)},
    {id:"dn-7",user_id:"*organizer",kind:"report",title:"طلب حجز جديد",body:"ملعب المروج — الخميس 22:00 · بانتظار رد الملعب.",created_at:h(6)},
    {id:"dn-8",user_id:"*academy",kind:"report",title:"اشتراكان متأخران",body:"فيصل الزهراني وبندر القرني — سبتمبر · 450 ر.س لكل منهما.",created_at:d(1)},
    {id:"dn-9",user_id:"*medical",kind:"report",title:"عودة من تأهيل",body:"سعود القحطاني أكمل أسبوعين تأهيل — يحتاج مراجعة حالة المشاركة.",created_at:d(2)},
    {id:"dn-10",user_id:"*venue",kind:"report",title:"طلب حجز معلّق",body:"دوري الحي يطلب الخميس 22:00 — القرار لك.",created_at:h(6)},
    {id:"dn-11",user_id:"*agent",kind:"report",title:"صفقة تقدّمت مرحلة",body:"سعود القحطاني — أكاديمية النخبة ← نادي الهلال: دخلت مرحلة «عقد بقوالب الاتحاد».",created_at:d(1)},
    {id:"dn-12",user_id:"*admin",kind:"report",title:"قيد جديد في سجل الشفافية",body:"١٠ قيود هذا الأسبوع — كلها باسم أصحابها.",created_at:h(2)}
  ];
  const bookings=[
    {id:"db-1",venue:"ملعب المروج",slot:"اليوم 18:00–19:00",who:"شاغر",status:"free",price:120,created_at:d(2)},
    {id:"db-2",venue:"ملعب المروج",slot:"اليوم 19:00–20:00",who:"دوري الحي",status:"paid",price:150,created_at:d(3)},
    {id:"db-3",venue:"ملعب المروج",slot:"غدًا 17:00–18:00",who:"أكاديمية النخبة",status:"paid",price:150,created_at:d(3)},
    {id:"db-4",venue:"ملعب المروج",slot:"الخميس 18:00–19:00",who:"شاغر",status:"free",price:120,created_at:d(1)},
    {id:"db-5",venue:"ملعب المروج",slot:"غدًا 20:00–21:00",who:"تركي الرشيد",status:"accepted",price:150,created_at:h(6)},
    {id:"db-6",venue:"ملعب المروج",slot:"الخميس 22:00–23:00",who:"دوري الحي",status:"requested",price:150,created_at:h(6)}
  ];
  const V="ملعب المروج";
  const pi_spaces=[
    {id:"ds-1",venue:V,name:"الملعب الرئيسي",kind:"رئيسي",capacity:22,open:true,price_hour:320,peak_hour:450,size_label:"11×11",services:[{k:"كور",n:6,inc:true},{k:"تقسيمات",n:24,inc:true},{k:"مياه مبرّدة",inc:true},{k:"مخاريط",n:20,inc:true},{k:"أهداف صغيرة",n:4,inc:true},{k:"إضاءة ليلية",inc:true},{k:"غرف تغيير",inc:true},{k:"حكم معتمد",inc:false},{k:"تصوير المباراة",inc:false},{k:"إسعافات أولية",inc:true}]},
    {id:"ds-2",venue:V,name:"ملعب ٧×٧ أ",kind:"٧×٧",capacity:14,open:true,price_hour:180,peak_hour:260,size_label:"7×7",services:[{k:"كور",n:4,inc:true},{k:"تقسيمات",n:14,inc:true},{k:"مياه مبرّدة",inc:true},{k:"مخاريط",n:12,inc:true},{k:"إضاءة ليلية",inc:true},{k:"غرف تغيير",inc:true},{k:"حكم معتمد",inc:false}]},
    {id:"ds-3",venue:V,name:"ملعب ٥×٥ مغلق",kind:"٥×٥",capacity:10,open:false,closed_why:"تلف في النجيلة الصناعية — بانتظار قطعة الاستبدال",closed_by:"سعد الغامدي",price_hour:140,peak_hour:200,size_label:"5×5",services:[{k:"كور",n:3,inc:true},{k:"تقسيمات",n:10,inc:true},{k:"مياه مبرّدة",inc:true},{k:"إضاءة ليلية",inc:true}]},
    {id:"ds-4",venue:V,name:"صالة بادل",kind:"بادل",capacity:4,open:true,price_hour:90,peak_hour:130,size_label:"10×20",services:[{k:"مضارب",n:4,inc:false},{k:"كور بادل",n:6,inc:true},{k:"مياه مبرّدة",inc:true},{k:"مكيّف",inc:true},{k:"غرف تغيير",inc:true}]}
  ];
  const pi_faults=[
    {id:"df-1",venue:V,space:"ملعب ٥×٥ مغلق",title:"تلف النجيلة في الزاوية الشمالية",severity:"high",status:"open",reported_by:"سعد الغامدي",created_at:h(9)},
    {id:"df-2",venue:V,space:"الملعب الرئيسي",title:"كشّاف إضاءة مطفأ — البرج الغربي",severity:"mid",status:"open",reported_by:"تركي الرشيد",created_at:d(1)},
    {id:"df-3",venue:V,space:"صالة بادل",title:"مقبض باب الصالة",severity:"low",status:"done",reported_by:"نورة الشهري",fixed_by:"سعد الغامدي",fixed_at:d(2),created_at:d(4)}
  ];
  const pi_gate=[
    {id:"dg-1",venue:V,who:"أكاديمية النخبة — U16",space:"الملعب الرئيسي",kind:"in",logged_by:"سعد الغامدي",created_at:h(2)},
    {id:"dg-2",venue:V,who:"دوري الحي — فريق النرجس",space:"ملعب ٧×٧ أ",kind:"in",logged_by:"سعد الغامدي",created_at:h(1)},
    {id:"dg-3",venue:V,who:"تركي الرشيد",space:"صالة بادل",kind:"in",logged_by:"نورة الشهري",created_at:h(1)},
    {id:"dg-4",venue:V,who:"خالد الشهري",space:"صالة بادل",kind:"out",logged_by:"نورة الشهري",created_at:h(3)}
  ];
  const pi_sponsors=[
    {id:"dp-1",venue:V,name:"مياه نقاء",kind:"لوحات",amount:4000,until:"2027-05-31",added_by:"سعد الغامدي",created_at:d(30)},
    {id:"dp-2",venue:V,name:"رياضية المروج",kind:"قميص",amount:2500,until:"2027-01-31",added_by:"سعد الغامدي",created_at:d(60)},
    {id:"dp-3",venue:V,name:"كافيه الركن",kind:"فعالية",amount:1200,until:"2026-12-31",added_by:"سعد الغامدي",created_at:d(15)}
  ];
  const pi_venue_meta=[
    {id:"dv-1",venue:V,city:"الرياض",district:"حي المروج",address:"طريق الأمير تركي الأول",accredited:true,license_to:"2027-06-30",
     hours:[{d:"السبت–الأربعاء",t:"06:00 — 00:00"},{d:"الخميس",t:"06:00 — 02:00"},{d:"الجمعة",t:"13:00 — 02:00"}],
     amenities:["مواقف مظلّلة","غرف تغيير","مغاسل","كافيه","إضاءة ليلية","مدرجات","إسعافات أولية","واي‑فاي"],
     updated_by:"سعد الغامدي",since:2019}
  ];
  const B=(id,space,hh,who,status,price)=>({id,venue:V,space,slot:"اليوم "+hh+":00",who,status,price,created_at:h(4)});
  bookings.push(
    B("dbs-1","الملعب الرئيسي","17","أكاديمية النخبة","accepted",320),
    B("dbs-2","الملعب الرئيسي","18","دوري الحي","accepted",320),
    B("dbs-3","الملعب الرئيسي","19","شاغر","free",320),
    B("dbs-4","الملعب الرئيسي","20","أكاديمية الفجر","accepted",450),
    B("dbs-5","الملعب الرئيسي","21","مدرسة النرجس","requested",450),
    B("dbs-6","ملعب ٧×٧ أ","16","تركي الرشيد","accepted",180),
    B("dbs-7","ملعب ٧×٧ أ","17","فريق المروج","accepted",180),
    B("dbs-8","ملعب ٧×٧ أ","18","شاغر","free",180),
    B("dbs-9","ملعب ٧×٧ أ","19","مدرسة النرجس","requested",180),
    B("dbs-10","ملعب ٧×٧ أ","20","دوري الحي","accepted",260),
    B("dbs-11","صالة بادل","17","تركي الرشيد","accepted",90),
    B("dbs-12","صالة بادل","18","خالد الشهري","accepted",90),
    B("dbs-13","صالة بادل","19","شاغر","free",90),
    B("dbs-14","صالة بادل","20","نورة الشهري","accepted",130),
    B("dbs-15","صالة بادل","21","شاغر","free",130)
  );
  subscriptions.push(
    {id:"dsv-1",org:V,player_name:"أكاديمية النخبة",group_name:"عقود أكاديميات",amount:9200,paid:true,month:"مايو",created_at:d(20)},
    {id:"dsv-2",org:V,player_name:"دوري الحي",group_name:"اشتراكات شهرية",amount:4800,paid:true,month:"مايو",created_at:d(20)},
    {id:"dsv-3",org:V,player_name:"فريق المروج",group_name:"اشتراكات شهرية",amount:3600,paid:true,month:"مايو",created_at:d(20)},
    {id:"dsv-4",org:V,player_name:"نادي الحي",group_name:"اشتراكات شهرية",amount:2400,paid:false,month:"مايو",created_at:d(20)}
  );
  transparency.push(
    {id:"dtv-1",action:"إغلاق مساحة — ملعب ٥×٥ مغلق · السبب: تلف النجيلة — "+V,by:"سعد الغامدي",created_at:h(9)},
    {id:"dtv-2",action:"إضافة راعٍ — مياه نقاء · "+V,by:"سعد الغامدي",created_at:d(30)},
    {id:"dtv-3",action:"حجز فوري — اليوم 20:00 · نورة الشهري · "+V,by:"نورة الشهري",created_at:h(4)}
  );
  /* دوري الحي: ثمانية فرق · دوري ذهاب · ٢٨ مباراة في ٧ جولات — ثلاث جولات انتهت بنتائجها الموقَّعة */
  const LT=["النرجس","الياسمين","الملقا","الصحافة","العقيق","الندى","قرطبة","حطين"];
  const LEAGUE="دوري الحي";
  const ds = n => new Date(Date.now() + n*864e5).toISOString().slice(0,10);
  const pi_comp_teams=LT.map((t,i)=>({id:"dct-"+i,comp:LEAGUE,team:t,added_by:ORG,created_at:d(45)}));
  (()=>{
    const arr=LT.slice(), n=arr.length, rounds=[];
    for(let r=0;r<n-1;r++){ const p=[];
      for(let i=0;i<n/2;i++){ const a=arr[i], b=arr[n-1-i]; p.push(r%2?[b,a]:[a,b]); }
      rounds.push(p); arr.splice(1,0,arr.pop()); }
    const SC=[[2,1],[0,0],[3,1],[1,2],[1,1],[4,2],[2,2],[0,1],[2,0],[1,3],[3,3],[1,0]];
    let k=0;
    rounds.forEach((p,ri)=>{
      const played = ri<4;
      p.forEach((pair,pi)=>{
        const [a,b]=pair, sc = played?SC[(k++)%SC.length]:null;
        matches.push(M("dl-"+ri+"-"+pi, {
          title:a+" × "+b, team_a:a, team_b:b, comp:LEAGUE, round:ri+1,
          venue:V, match_date:ds(-42+ri*7), match_time:pi%2?"21:00":"19:00",
          status: played?"final":(ri===4?"today":"open"),
          score_a: sc?sc[0]:null, score_b: sc?sc[1]:null,
          referee_name: played||ri===4?REF:null, created_at:d(45-ri*7)
        }));
      });
    });
  })();

  /* البطولات: محلية بمنظّم مسؤول · رسمية معلومة بمصدرها المعلن (لا تدخل سجل أحد) */
  const pi_tours=[
    {id:"dt-1",name:LEAGUE,org:ORG,created_by:ORG,scope:"local",state:"live",teams:8,format:"rr",venue:V,day_time:"19:00",fee_team:600,reg_open:false,starts_at:ds(-42),ends_at:ds(21),created_at:d(45)},
    {id:"dt-2",name:"سباعيات المروج الليلية",org:ORG,created_by:ORG,format:"ko",venue:V,scope:"local",state:"open",teams:8,reg_open:true,starts_at:"2026-09-05",ends_at:"2026-09-26",created_at:d(9)},
    {id:"dt-3",name:"كأس المدارس — تحت ١٦",org:ORG,created_by:ORG,format:"groups",venue:V,scope:"local",state:"soon",teams:16,reg_open:true,starts_at:"2026-10-02",ends_at:"2026-10-30",created_at:d(3)},
    {id:"dt-10",name:"دوري روشن السعودي",scope:"official",grp:"السعودية",source:"رابطة دوري روشن السعودي",stage:"الموسم ٢٠٢٦/٢٧",teams:18,ext_id:307},
    {id:"dt-11",name:"كأس خادم الحرمين الشريفين",scope:"official",grp:"السعودية",source:"الاتحاد السعودي لكرة القدم",stage:"دور الـ٣٢",teams:32},
    {id:"dt-12",name:"دوري يلو",scope:"official",grp:"السعودية",source:"رابطة الدوري السعودي للدرجة الأولى",stage:"الموسم ٢٠٢٦/٢٧",teams:18},
    {id:"dt-13",name:"دوري أبطال آسيا للنخبة",scope:"official",grp:"آسيا",source:"الاتحاد الآسيوي لكرة القدم",stage:"دور المجموعات",teams:24},
    {id:"dt-14",name:"دوري أبطال أوروبا",scope:"official",grp:"أوروبا",source:"الاتحاد الأوروبي لكرة القدم",stage:"مرحلة الدوري",teams:36,ext_id:2},
    {id:"dt-15",name:"الدوري الإنجليزي الممتاز",scope:"official",grp:"أوروبا",source:"رابطة الدوري الإنجليزي الممتاز",stage:"الموسم ٢٠٢٦/٢٧",teams:20,ext_id:39},
    {id:"dt-16",name:"كأس العالم للأندية",scope:"official",grp:"عالمية",source:"الاتحاد الدولي لكرة القدم",stage:"—",teams:32}
  ];
  const pi_news=[
    {id:"dn-0",org:"أكاديمية النخبة",source:"أكاديمية النخبة",title:"معسكر الصيف U18 — التسجيل يفتح الأحد لأعضاء الأكاديمية أولًا",summary:"عشرة أيام في أبها · المقاعد ٢٤ · الأولوية لمن أكمل حضور الموسم",added_by:"إدارة أكاديمية النخبة",created_at:d(1)},
    {id:"dn-1",title:"انطلاق تسجيل فرق سباعيات المروج الليلية",source:"إدارة ملعب المروج",summary:"ثمانية فرق كحدّ أقصى، والتسجيل يُقفل قبل أول مباراة بأربعٍ وعشرين ساعة.",added_by:"سعد الغامدي",published_at:d(2),created_at:d(2)},
    {id:"dn-2",title:"دوري الحي يدخل جولته الخامسة",source:"تركي الرشيد — منظّم دوري الحي",summary:"عشرة فرق، وكل نتيجة موقّعة بحكمها في سجل المنصة.",added_by:"تركي الرشيد",published_at:d(5),created_at:d(5)},
    {id:"dn-3",title:"أكاديمية النخبة تفتح اختبارات القبول لفئة تحت ١٦",source:"أكاديمية النخبة",summary:"الاختبار على ملعب المروج، والنتيجة تصل ولي الأمر في تحديثاته.",added_by:"مشرف أكاديمية النخبة",published_at:d(7),created_at:d(7)}
  ];
  /* الموافقات الإدارية: طابور توقيع إداري — لا يمسّ نتيجة ولا تقييمًا */
  const pi_approvals=[
    {id:"da-1",org:"دوري الحي",title:"ميزانية تحكيم الجولة السادسة",kind:"budget",amount:4800,status:"open",step:2,requested_by:ORG,note:"",created_at:d(2)},
    {id:"da-2",org:"دوري الحي",title:"نقل فريقين لمباراة الختام",kind:"travel",amount:1600,status:"open",step:1,requested_by:ORG,note:"",created_at:d(1)},
    {id:"da-3",org:"دوري الحي",title:"عقد تغطية إسعافية للموسم",kind:"contract",amount:9000,status:"approved",step:4,requested_by:ORG,decided_by:"إدارة المنصة",created_at:d(14)},
    {id:"da-4",org:"أكاديمية النخبة",title:"ميزانية أطقم فئة تحت ١٦",kind:"budget",amount:7200,status:"open",step:3,requested_by:"مشرف أكاديمية النخبة",created_at:d(4)},
    {id:"da-5",org:"أكاديمية النخبة",title:"سفر بعثة تحت ١٧ — بطولة المنطقة",kind:"travel",amount:12500,status:"rejected",step:2,requested_by:"مشرف أكاديمية النخبة",decided_by:"مدير الأكاديمية",note:"التاريخ يصادف اختبارات القبول — أُعيد للدراسة",created_at:d(8)}
  ];
  /* شبكة ساعات الملعب: حالة كل ساعة في كل مساحة */
  const pi_slots=(()=>{
    const out=[], HS=[18,19,20,21,22,23];
    /* الحالة مرتبطة باسم المساحة لا بترتيبها — الشاشة ترتّب أبجديًا */
    const ST={
      "الملعب الرئيسي":{18:"booked",19:"booked",20:"peak",21:"peak",22:"booked",23:"free"},
      "ملعب ٧×٧ أ":   {18:"booked",19:"free",  20:"peak",21:"booked",22:"maint",23:"free"},
      "صالة بادل":     {18:"booked",19:"booked",20:"peak",21:"free",  22:"free", 23:"free"}
    };
    Object.keys(ST).forEach((p,pi)=>HS.forEach(h=>out.push({id:"dsl-"+pi+"-"+h,venue:V,pitch:p,hour:h,state:ST[p][h],updated_by:"سعد الغامدي"})));
    return out;
  })();
  const pi_follows=[{id:"df-1",person:"سعود القحطاني",kind:"tour",target:"دوري الحي",created_at:d(11)}];
  return {matches,match_events:events,match_joins:joins,transparency,subscriptions,pi_refs,notifications,bookings,pi_spaces,pi_faults,pi_gate,pi_sponsors,pi_venue_meta,pi_tours,pi_news,pi_follows,pi_approvals,pi_slots,pi_comp_teams};
};

/* ── تخزين لكل حساب: تجربة كل مستخدم تبقى له ── */
DEMO.key = () => "pi_demo_v9_" + (DEMO.uid||"anon");
DEMO.load = () => {
  let s=null;
  try{ const raw=localStorage.getItem(DEMO.key()); if(raw) s=JSON.parse(raw); }catch(e){}
  if(!s||!s.matches){ s=DEMO.seed(); DEMO.save(s); }
  DEMO.TABLES.forEach(t=>{ if(!s[t]) s[t]=[]; });
  DEMO.store=s; return s;
};
DEMO.save = s => { try{ localStorage.setItem(DEMO.key(), JSON.stringify(s||DEMO.store)); }catch(e){} };
DEMO.reset = () => { try{ localStorage.removeItem(DEMO.key()); }catch(e){} DEMO.load(); };
DEMO.rows = t => (DEMO.store&&DEMO.store[t])||[];

/* المعرّفات المزروعة تُربط بصاحبها لحظة القراءة — كل دور يرى ما يملكه فعلًا */
DEMO.mine = (t,rows) => {
  if(!ME) return rows;
  if(t==="notifications") return rows.map(r=>String(r.user_id||"").startsWith("*")
    ? {...r, user_id: ME.role===r.user_id.slice(1) ? ME.id : r.user_id} : r);
  if(t==="matches") return ME.role==="organizer"
    ? rows.map(r=>r.organizer_id==="demo-organizer"?{...r,organizer_id:ME.id}:r) : rows;
  if(t==="match_joins") return rows.map(r=>r.player_name===ME.name?{...r,player_id:ME.id}:r);
  return rows;
};

/* ── باني الاستعلام: نفس واجهة supabase-js لما يستعمله التطبيق ── */
DEMO.EMBED = { matches:"match_id" };
DEMO.uuid = () => "dx-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);

DEMO.query = function(table){
  const F=[]; let ord=null, lim=null, one=false, pick="*", mode="select", payload=null, conflictKey=null;
  const cmp = {
    eq:(a,b)=>String(a)===String(b), neq:(a,b)=>String(a)!==String(b),
    gt:(a,b)=>a>b, gte:(a,b)=>a>=b, lt:(a,b)=>a<b, lte:(a,b)=>a<=b,
    in:(a,b)=>b.some(x=>String(x)===String(a)),
    is:(a,b)=>(b===null||b==="null")?(a===null||a===undefined):a===b,
    like:(a,b)=>String(a).includes(String(b).replace(/%/g,"")),
    ilike:(a,b)=>String(a).toLowerCase().includes(String(b).replace(/%/g,"").toLowerCase())
  };
  const apply = rows => {
    let out = rows.filter(r=>F.every(f=>{
      const v=r[f.c], fn=cmp[f.op]||cmp.eq, hit=fn(v,f.v);
      return f.neg?!hit:hit;
    }));
    if(ord){ const {c,asc}=ord; out=[...out].sort((a,b)=>{const x=a[c],y=b[c];return (x>y?1:x<y?-1:0)*(asc?1:-1)}); }
    if(lim!=null) out=out.slice(0,lim);
    /* التضمين: matches(title,...) */
    const emb=[...String(pick).matchAll(/([a-z_]+)\s*\(/g)].map(m=>m[1]).filter(n=>DEMO.EMBED[n]);
    if(emb.length) out=out.map(r=>{const o={...r};emb.forEach(n=>{o[n]=DEMO.rows(n).find(x=>String(x.id)===String(r[DEMO.EMBED[n]]))||null});return o;});
    return out;
  };
  const run = () => {
    const all = DEMO.mine(table, DEMO.rows(table));
    if(mode==="select"){ const out=apply(all); return {data: one?(out[0]||null):out, error: one&&!out[0]?{message:"no rows"}:null, count: out.length}; }
    const S=DEMO.store;
    if(mode==="insert"||mode==="upsert"){
      const list=(Array.isArray(payload)?payload:[payload]).map(r=>({id:r.id||DEMO.uuid(),created_at:r.created_at||new Date().toISOString(),...r}));
      list.forEach(r=>{ if(!r.id) r.id=DEMO.uuid();
        let i=-1;
        if(mode==="upsert"&&conflictKey){ const ks=conflictKey.split(","); const mp=DEMO.mine(table,S[table]);
          i=mp.findIndex(x=>ks.every(k=>String(x[k])===String(r[k]))); }
        if(i<0) i=S[table].findIndex(x=>String(x.id)===String(r.id));
        if(i>=0) S[table][i]={...S[table][i],...r}; else S[table].unshift(r);
      });
      DEMO.save(); return {data:list,error:null};
    }
    if(mode==="update"){ const hit=apply(DEMO.mine(table,S[table])); hit.forEach(r=>{const i=S[table].findIndex(x=>x.id===r.id); if(i>=0) S[table][i]={...S[table][i],...payload};});
      DEMO.save(); return {data:hit.map(r=>({...r,...payload})),error:null}; }
    if(mode==="delete"){ const hit=apply(DEMO.mine(table,S[table])); S[table]=S[table].filter(r=>!hit.some(x=>x.id===r.id));
      DEMO.save(); return {data:hit,error:null}; }
    return {data:[],error:null};
  };
  const B={};
  ["eq","neq","gt","gte","lt","lte","in","is","like","ilike"].forEach(op=>B[op]=(c,v)=>{F.push({c,op,v});return B;});
  B.not=(c,op,v)=>{F.push({c,op:op||"eq",v,neg:true});return B;};
  B.filter=(c,op,v)=>{F.push({c,op,v});return B;};
  B.order=(c,o)=>{ord={c,asc:!o||o.ascending!==false};return B;};
  B.limit=n=>{lim=n;return B;};
  B.range=(a,b)=>{lim=b+1;return B;};
  B.select=(p,o)=>{ if(mode==="select"){pick=p||"*"; if(o&&o.head)one=false;} return B; };
  B.single=()=>{one=true;return B;};
  B.maybeSingle=()=>{one=true;return B;};
  B.insert=r=>{mode="insert";payload=r;return B;};
  B.upsert=(r,o)=>{mode="upsert";payload=r;conflictKey=o&&o.onConflict;return B;};
  B.update=r=>{mode="update";payload=r;return B;};
  B.delete=()=>{mode="delete";return B;};
  B.then=(res,rej)=>{ try{ return Promise.resolve(run()).then(res,rej); }catch(e){ return Promise.resolve({data:one?null:[],error:{message:String(e)}}).then(res,rej); } };
  B.catch=f=>B.then(v=>v,f);
  return B;
};

/* ── الغلاف: يوجّه الجداول الأساسية للنسخة التجريبية، والباقي للقاعدة ── */
DEMO.wrap = real => ({
  auth: real.auth,
  storage: real.storage,
  rpc: (...a) => real.rpc(...a),
  channel: (...a) => real.channel(...a),
  removeChannel: (...a) => real.removeChannel(...a),
  from(t){ return (DEMO.on && DEMO.TABLES.indexOf(t)>=0) ? DEMO.query(t) : real.from(t); }
});

DEMO.begin = (uid,email) => {
  DEMO.on = DEMO.isDemoEmail(email);
  DEMO.uid = uid;
  if(DEMO.on) DEMO.load();
};
window.DEMO = DEMO;
window.piResetDemo = () => { DEMO.reset(); toast("أُعيدت نسختك إلى حالتها الأولى"); render(); };
