(function () {
  'use strict';

  var P = window.PZ;
  if (!P || typeof sb === 'undefined' || !sb || !P.identityCard) return;

  var baseMyCard = P.myCard;
  var baseIdentityCard = P.identityCard;
  var baseProfileRoute = T.profile;
  var basePublicViewRoute = T.publicView;
  var monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  function e(value) { return P.e(value == null ? '' : value); }
  function safe(name, query) { return P.safe(name, query); }
  function norm(value) { return String(value || '').trim().toLowerCase(); }
  function hasProof(row) { return !!(row && (row.verified_by || row.verified_at || row.is_verified === true)); }
  function isAttended(row) { return !!(row && (row.attended === true || row.attended === 'true' || row.attended === 1)); }
  function yearOf(value) {
    if (!value) return '';
    var match = String(value).match(/(?:19|20)\d{2}/);
    return match ? match[0] : '';
  }
  function dateParts(value) {
    if (!value) return { year: '', month: '', stamp: '' };
    var date = new Date(value);
    if (isNaN(date.getTime())) return { year: yearOf(value), month: '', stamp: '' };
    return { year: String(date.getFullYear()), month: monthNames[date.getMonth()], stamp: date.toISOString() };
  }
  function icon(name) {
    var paths = {
      academy: '<path d="M3 9.5 12 4l9 5.5-9 5.3-9-5.3Z"/><path d="M6 12.5v4.2c3.8 2.7 8.2 2.7 12 0v-4.2M21 10v6"/>',
      trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4M12 13v5m-4 2h8m-7-2h6"/>',
      goal: '<circle cx="12" cy="12" r="8.5"/><path d="m8.7 6.6 3.3-2 3.3 2 1.2 3.8-2.8 2.1-3.4-.1-2.7-2.1 1.1-3.7Zm.1 3.7-3.9.4m9.6-.3 4.1-.5m-7.4 2.6-.4 4.8m-2.5-3 2.5-1.8 2.9 1.8 2.1 4.4"/>',
      assist: '<path d="M5 17 18 5M9 5h9v9"/><circle cx="6" cy="18" r="2"/>',
      match: '<path d="M4 5h16v14H4z"/><path d="M12 5v14m0-10a3 3 0 0 0 0 6m-8-3h2m12 0h2"/>',
      star: '<path d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1.1 6.2-5.5-2.9-5.5 2.9 1.1-6.2L3 9.5l6.2-.9L12 3Z"/>',
      arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
      boot: '<path d="M4 15c2.7.5 4.6-.7 5.3-3.6l.8-3.1 4.4 1.2 1 4.2 4.2 1.6c1.3.5 1.8 1.2 1.8 2.4V20H4v-5Z"/><path d="m10.5 8.8 3-1.1"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.star) + '</svg>';
  }
  function readableType(type) {
    var t = norm(type);
    if (t === 'goal') return { label: 'هدف مسجّل', icon: 'goal', kind: 'goal' };
    if (t === 'assist') return { label: 'صناعة هدف', icon: 'assist', kind: 'assist' };
    if (t === 'appearance' || t === 'played' || t === 'participation') return { label: 'مشاركة موثقة', icon: 'match', kind: 'match' };
    return null;
  }
  function getPosition(player) {
    var raw = norm(player.position_code || player.pos_en || player.position || player.pos || '');
    var code = raw.match(/(?:^|[^a-z])(gk|rb|rwb|lb|lwb|cb|rcb|lcb|dm|cdm|cm|cam|am|rw|lw|rm|lm|st|cf|fw)(?:$|[^a-z])/);
    if (code) raw = code[1];
    var map = {
      gk: ['حارس المرمى', 50, 88], goalkeeper: ['حارس المرمى', 50, 88],
      rb: ['ظهير أيمن', 82, 66], rwb: ['ظهير أيمن', 82, 58], lb: ['ظهير أيسر', 18, 66], lwb: ['ظهير أيسر', 18, 58],
      cb: ['قلب دفاع', 50, 70], rcb: ['قلب دفاع', 62, 72], lcb: ['قلب دفاع', 38, 72],
      dm: ['محور', 50, 57], cdm: ['محور', 50, 57], cm: ['وسط', 50, 46], cam: ['وسط هجومي', 50, 34], am: ['وسط هجومي', 50, 34],
      rw: ['جناح أيمن', 82, 27], lw: ['جناح أيسر', 18, 27], rm: ['وسط أيمن', 78, 43], lm: ['وسط أيسر', 22, 43],
      st: ['مهاجم', 50, 16], cf: ['مهاجم', 50, 20], fw: ['مهاجم', 50, 16]
    };
    var item = map[raw] || null;
    if (!item) {
      var arabic = String(player.position || player.pos || '').trim();
      if (/حارس/.test(arabic)) item = map.gk;
      else if (/ظهير.*(أيمن|يمين)/.test(arabic)) item = map.rb;
      else if (/ظهير.*(أيسر|يسار)/.test(arabic)) item = map.lb;
      else if (/دفاع|قلب/.test(arabic)) item = map.cb;
      else if (/وسط/.test(arabic)) item = map.cm;
      else if (/جناح/.test(arabic)) item = /أيمن|يمين/.test(arabic) ? map.rw : map.lw;
      else if (/مهاجم|رأس حربة/.test(arabic)) item = map.st;
    }
    return item || ['مركز اللاعب', 50, 46];
  }
  function groupHistory(data) {
    var items = [];
    data.career.filter(hasProof).forEach(function (row) {
      var yr = yearOf(row.from_year || row.to_year || row.created_at);
      items.push({ year: yr, month: '', date: '', type: 'academy', icon: 'academy', title: row.org || 'أكاديمية', meta: [row.title, row.group_name, row.from_year && row.to_year ? row.from_year + ' — ' + row.to_year : row.from_year || row.to_year].filter(Boolean).join(' · '), verified: true });
    });
    data.alumni.filter(hasProof).forEach(function (row) {
      items.push({ year: yearOf(row.dest_year || row.created_at), month: '', date: '', type: 'move', icon: 'arrow', title: row.dest || 'محطة جديدة', meta: ['انتقال موثّق', row.group_name].filter(Boolean).join(' · '), verified: true });
    });
    data.badges.forEach(function (row) {
      var d = dateParts(row.created_at || row.awarded_at);
      items.push({ year: yearOf(row.year) || d.year, month: row.year && !row.created_at && !row.awarded_at ? '' : d.month, date: d.stamp, type: 'award', icon: 'trophy', title: row.title || row.badge_key || 'إنجاز', meta: row.proof || row.signed_by || (hasProof(row) ? 'اعتماد الجهة' : 'إنجاز مضاف للملف'), verified: hasProof(row) });
    });
    data.certs.filter(function (row) { return row.title; }).forEach(function (row) {
      items.push({ year: yearOf(row.year || row.created_at), month: '', date: '', type: 'award', icon: 'trophy', title: row.title, meta: [row.issuer, hasProof(row) ? 'اعتماد الجهة' : 'شهادة مضافة'].filter(Boolean).join(' · '), verified: hasProof(row) });
    });
    data.matches.forEach(function (match) {
      var attended = data.joins.some(function (join) { return isAttended(join) && String(join.match_id) === String(match.id); });
      if (!attended || !isCompleted(match)) return;
      var d = dateParts(match.created_at || match.match_date || match.date);
      var title = match.comp || match.title || match.name || 'مشاركة رسمية';
      items.push({ year: d.year, month: d.month, date: d.stamp, type: 'tournament', icon: 'match', title: title, meta: match.title && match.comp ? match.title : 'مشاركة موثّقة', verified: true });
    });
    data.events.forEach(function (event) {
      var kind = readableType(event.type);
      if (!kind) return;
      var d = dateParts(event.created_at || event.matches && event.matches.created_at);
      items.push({ year: d.year, month: d.month, date: d.stamp, type: kind.kind, icon: kind.icon, title: kind.label, meta: [event.matches && (event.matches.title || event.matches.comp), event.minute ? event.minute + '′' : ''].filter(Boolean).join(' · '), verified: !!event.recorded_by });
    });
    return items.filter(function (item) { return item.year || item.title; }).sort(function (a, b) {
      var ta = a.date ? Date.parse(a.date) : Number(a.year || 0) * 10000;
      var tb = b.date ? Date.parse(b.date) : Number(b.year || 0) * 10000;
      return ta - tb;
    });
  }
  function isCompleted(match) {
    var status = norm(match.status || match.state);
    return /final|finished|complete|completed|انته/.test(status) || match.final === true || (Number.isFinite(Number(match.score_a)) && Number.isFinite(Number(match.score_b)) && match.score_a !== null && match.score_b !== null);
  }
  function monthTimeline(items) {
    var grouped = {};
    items.forEach(function (item) {
      var key = (item.year || 'journey') + '|' + (item.month || (item.year ? 'الموسم' : '')); 
      (grouped[key] || (grouped[key] = { year: item.year, month: item.month || (item.year ? 'محطة الموسم' : 'مسار اللاعب'), items: [] })).items.push(item);
    });
    return Object.keys(grouped).map(function (key) { return grouped[key]; }).sort(function (a, b) {
      return Number(a.year || 0) - Number(b.year || 0) || (monthNames.indexOf(a.month) - monthNames.indexOf(b.month));
    });
  }
  function academyRail(player, data) {
    var stations = data.career.filter(hasProof).map(function (row) {
      return { name: row.org, year: yearOf(row.from_year || row.to_year), meta: [row.group_name, row.title].filter(Boolean).join(' · '), icon: 'academy' };
    });
    data.alumni.filter(hasProof).forEach(function (row) {
      stations.push({ name: row.dest, year: yearOf(row.dest_year), meta: 'انتقال موثّق', icon: 'arrow' });
    });
    if (player.org) stations.push({ name: player.org, year: '', meta: 'المحطة الحالية', icon: 'academy', current: true });
    var unique = [];
    stations.forEach(function (station) { if (!unique.some(function (s) { return norm(s.name) === norm(station.name); })) unique.push(station); });
    unique.sort(function (a, b) { return Number(a.year || 9999) - Number(b.year || 9999); });
    if (!unique.length) return '<div class="pj-empty-trail"><span class="pj-empty-mark">' + icon('academy') + '</span><div><b>المسار يبدأ من أول محطة موثّقة</b><small>تظهر انتقالات اللاعب هنا بعد اعتمادها من الأكاديمية، دون إدخال محطات غير مؤكدة.</small></div></div>';
    return '<div class="pj-stations" role="list">' + unique.map(function (station, index) {
      return '<div class="pj-station ' + (station.current ? 'is-current' : '') + '" role="listitem"><span class="pj-station-connector" aria-hidden="true"></span><span class="pj-station-mark">' + icon(station.icon) + '</span><div class="pj-station-copy"><small>' + (station.current ? 'الجهة المسجلة' : station.year ? e(station.year) : 'محطة موثقة') + '</small><b>' + e(station.name) + '</b><span>' + e(station.meta || 'أكاديمية موثقة') + '</span></div><span class="pj-station-seal">' + (station.current ? 'من الملف' : 'موثّق') + '</span></div>';
    }).join('') + '</div>';
  }
  function eventRow(item) {
    var proof = item.type === 'goal' || item.type === 'assist' ? 'مسجّل' : item.verified ? 'موثّق' : 'مضاف';
    return '<article class="pj-event pj-event-' + e(item.type) + '"><span class="pj-event-icon">' + icon(item.icon) + '</span><div class="pj-event-copy"><b>' + e(item.title) + '</b>' + (item.meta ? '<small>' + e(item.meta) + '</small>' : '') + '</div><span class="pj-event-proof" title="' + proof + '">' + (item.verified ? '✓' : '•') + '</span></article>';
  }
  function seasonAtlas(items) {
    var groups = monthTimeline(items);
    if (!groups.length) return '<div class="pj-empty-trail"><span class="pj-empty-mark">' + icon('star') + '</span><div><b>لا توجد محطات منشورة بعد</b><small>عندما تُسجّل المباريات والإنجازات أو تعتمد الأكاديمية انتقالًا، ستظهر هنا كرحلة مرتبة حسب الموسم والشهر.</small></div></div>';
    var years = [...new Set(groups.map(function (g) { return g.year; }).filter(Boolean))];
    return '<div class="pj-atlas-head"><span class="pj-atlas-line"></span><div class="pj-year-orbit">' + years.map(function (year, i) { return '<span class="pj-year-node ' + (i === years.length - 1 ? 'active' : '') + '"><i>' + e(year) + '</i><small>' + (i === years.length - 1 ? 'الأحدث' : 'موسم') + '</small></span>'; }).join('') + '</div></div><div class="pj-month-stream">' + groups.map(function (group) {
      return '<section class="pj-month-group"><div class="pj-month-marker"><span></span><b>' + e(group.month) + '</b>' + (group.year ? '<small>' + e(group.year) + '</small>' : '') + '</div><div class="pj-month-events">' + group.items.map(eventRow).join('') + '</div></section>';
    }).join('') + '</div>';
  }
  function tournamentTrail(data) {
    var comps = {};
    data.matches.forEach(function (match) {
      var attended = data.joins.some(function (join) { return isAttended(join) && String(join.match_id) === String(match.id); });
      if (!attended || !isCompleted(match)) return;
      var name = match.comp || match.title;
      if (!name) return;
      comps[name] = comps[name] || { name: name, appearances: 0, last: match.created_at || match.match_date || match.date };
      comps[name].appearances++;
      var current = comps[name].last, next = match.created_at || match.match_date || match.date;
      if (next && (!current || Date.parse(next) > Date.parse(current))) comps[name].last = next;
    });
    var list = Object.keys(comps).map(function (key) { return comps[key]; }).sort(function (a, b) { return Date.parse(b.last || 0) - Date.parse(a.last || 0); });
    if (!list.length) return '<div class="pj-tournament-empty"><span class="pj-cup-ghost">' + icon('trophy') + '</span><p>مشاركته التالية ستضيف أول علامة على خط البطولات.</p></div>';
    return '<div class="pj-cup-rail">' + list.map(function (cup, i) {
      return '<article class="pj-cup-stop"><span class="pj-cup-wire" aria-hidden="true"></span><span class="pj-cup-emblem ' + (i === 0 ? 'gold' : i === 1 ? 'purple' : '') + '">' + icon('trophy') + '</span><div><b>' + e(cup.name) + '</b><small>' + (cup.appearances > 1 ? e(cup.appearances) + ' مشاركات موثقة' : 'مشاركة موثقة') + (cup.last ? ' · ' + e(yearOf(cup.last)) : '') + '</small></div></article>';
    }).join('') + '</div>';
  }
  function honors(data) {
    var items = data.badges.concat(data.certs.filter(function (row) { return row.title; }).map(function (row) { return { title: row.title, proof: row.issuer, verified_by: row.verified_by }; })).sort(function (a, b) { return Number(hasProof(b)) - Number(hasProof(a)); }).slice(0, 6);
    if (!items.length) return '<div class="pj-honor-empty"><span>' + icon('trophy') + '</span><div><b>مساحة الإنجاز محفوظة للدليل</b><small>لا نضيف جوائز افتراضية؛ يظهر هنا ما يسجله اللاعب وما تؤكده الجهة.</small></div></div>';
    var verified = items.filter(hasProof), unverified = items.filter(function (x) { return !hasProof(x); });
    return '<div class="pj-honor-field"><div class="pj-honor-feature">' + icon('trophy') + '<small>' + (verified.length ? 'أقوى إشارة موثقة' : 'إنجاز أضافه اللاعب') + '</small><b>' + e((verified[0] || items[0]).title || (verified[0] || items[0]).badge_key || 'إنجاز') + '</b><span>' + e((verified[0] || items[0]).proof || (verified[0] || items[0]).signed_by || (hasProof(verified[0] || items[0]) ? 'اعتماد الجهة' : 'بانتظار توثيق الجهة')) + '</span></div><div class="pj-honor-constellation">' + items.slice(verified.length ? 1 : 0).map(function (item, index) { return '<div class="pj-honor-star ' + (hasProof(item) ? 'verified' : '') + '" style="--star:' + index + '"><span>' + icon('star') + '</span><b>' + e(item.title || item.badge_key || 'إنجاز') + '</b><small>' + (hasProof(item) ? 'موثّق' : 'مضاف') + '</small></div>'; }).join('') + '</div></div>';
  }
  function roleMap(player) {
    var pos = getPosition(player);
    return '<div class="pj-role-map"><div class="pj-role-copy"><span class="pj-label">TACTICAL FOOTPRINT</span><h3>مكانه في الملعب</h3><p>قراءة بصرية للمركز المسجل في الهوية، لا تقييم فني افتراضي.</p><b>' + e(pos[0]) + '</b></div><svg class="pj-pitch" viewBox="0 0 300 250" role="img" aria-label="تمثيل تقريبي لمركز ' + e(pos[0]) + '"><defs><linearGradient id="pjPitch" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0a3b72"/><stop offset="1" stop-color="#071a39"/></linearGradient><radialGradient id="pjPulse"><stop stop-color="#f5c518" stop-opacity=".72"/><stop offset="1" stop-color="#f5c518" stop-opacity="0"/></radialGradient></defs><rect x="18" y="10" width="264" height="230" rx="18" fill="url(#pjPitch)" stroke="#5f8de1" stroke-opacity=".55"/><path d="M18 125h264M82 10v38h136V10M82 240v-38h136v38M118 10v15h64V10M118 240v-15h64v15" fill="none" stroke="#8bb6ff" stroke-opacity=".38"/><circle cx="150" cy="125" r="34" fill="none" stroke="#8bb6ff" stroke-opacity=".4"/><circle cx="150" cy="125" r="2.5" fill="#8bb6ff" fill-opacity=".6"/><circle cx="' + (18 + pos[1] * 2.64) + '" cy="' + (10 + pos[2] * 2.3) + '" r="29" fill="url(#pjPulse)"/><circle cx="' + (18 + pos[1] * 2.64) + '" cy="' + (10 + pos[2] * 2.3) + '" r="7" fill="#f5c518" stroke="#fff" stroke-width="2"/><path d="M' + (18 + pos[1] * 2.64) + ' ' + (10 + pos[2] * 2.3) + 'v-18" stroke="#f5c518" stroke-dasharray="2 3"/></svg></div>';
  }
  function clipReel(data) {
    var eventIds = new Set(data.events.map(function (event) { return String(event.id); }));
    var clips = data.media.filter(function (media) {
      var consent = media.public === true || media.is_public === true || media.consent === true || media.consent_status === 'granted';
      return consent && media.url && media.event_id && eventIds.has(String(media.event_id));
    }).slice(0, 5);
    if (!clips.length) return '<div class="pj-clips-empty"><span>' + icon('match') + '</span><p>اللقطات المرتبطة بحدث موثّق ومسموح نشره ستظهر هنا.</p></div>';
    return '<div class="pj-clips">' + clips.map(function (item) { return '<a class="pj-clip" href="' + e(item.url) + '" target="_blank" rel="noopener noreferrer"><span>' + icon(item.kind === 'video' ? 'match' : 'star') + '</span><b>' + e(item.label || item.match_title || 'لقطة موثقة') + '</b><small>' + e(item.match_title || 'من سجل المباراة') + ' ↗</small></a>'; }).join('') + '</div>';
  }
  function journeyView(player, data, owner) {
    var items = groupHistory(data);
    var seasons = [...new Set(items.map(function (item) { return item.year; }).filter(Boolean))];
    var verifiedStations = data.career.filter(hasProof).length + data.alumni.filter(hasProof).length;
    return '<section class="pj-journey" aria-label="رحلة اللاعب"><header class="pj-heading"><div><span class="pj-label">THE PLAYER ARC</span><h2>مسيرة تُرى… لا أرقام تُرصّ</h2><p>محطات اللاعب كما جرت، مرتبة من الملعب إلى الإنجاز، وكل علامة مرتبطة بسجل أو اعتماد.</p></div><span class="pj-arc-seal"><i></i> سجل حي</span></header>'+
      '<section class="pj-route"><div class="pj-route-top"><span class="pj-label">ACADEMY ROUTE</span><span class="pj-route-count">' + e(verifiedStations) + ' <small>محطة معتمدة</small></span></div><div class="pj-route-art"><svg viewBox="0 0 440 118" preserveAspectRatio="none" aria-hidden="true"><path class="pj-route-pitch" d="M0 10h440v98H0zM220 10v98m0-65a16 16 0 1 0 0 32 16 16 0 0 0 0-32M0 39h54v40H0m440-40h-54v40h54"/><path class="pj-route-path" d="M15 83 C78 83 74 34 139 43 S204 87 251 58 S333 28 425 35"/></svg><div class="pj-route-dots">' + (seasons.length ? seasons.slice(-5).map(function (year, i) { return '<span class="pj-route-dot ' + (i === seasons.length - 1 ? 'live' : '') + '" style="--step:' + i + ';--offset:' + (i % 2 ? '10px' : '-10px') + '"><i>' + e(year) + '</i></span>'; }).join('') : '<span class="pj-route-origin">' + (player.org ? e(player.org) : 'أول محطة موثقة') + '</span>') + '</div></div><p class="pj-route-caption">' + (player.org ? 'الجهة المسجلة في الهوية · ' + e(player.org) : 'يُبنى الخط من المحطات التي تعتمدها الأكاديمية') + '</p></section>'+
      '<section class="pj-story-section"><div class="pj-section-title"><div><span class="pj-label">CLUB TO CLUB</span><h3>محطات المسيرة</h3></div><span class="pj-title-glyph">' + icon('academy') + '</span></div>' + academyRail(player, data) + '</section>'+
      '<section class="pj-story-section pj-atlas"><div class="pj-section-title"><div><span class="pj-label">SEASONS · MONTHS · MOMENTS</span><h3>سنوات صنعت فرقًا</h3></div><span class="pj-title-glyph purple">' + icon('arrow') + '</span></div>' + seasonAtlas(items) + '</section>'+
      '<section class="pj-story-section"><div class="pj-section-title"><div><span class="pj-label">TOURNAMENT FOOTPRINT</span><h3>أثره في البطولات</h3></div><span class="pj-title-glyph gold">' + icon('trophy') + '</span></div>' + tournamentTrail(data) + '</section>'+
      '<section class="pj-story-section pj-honors"><div class="pj-section-title"><div><span class="pj-label">PROOF OF PROGRESS</span><h3>إنجازات لها شاهد</h3></div><span class="pj-title-glyph gold">' + icon('star') + '</span></div>' + honors(data) + '</section>'+
      '<section class="pj-story-section">' + roleMap(player) + '</section>'+
      '<section class="pj-story-section"><div class="pj-section-title"><div><span class="pj-label">MATCH EVIDENCE</span><h3>لقطات من أرض الملعب</h3></div><span class="pj-title-glyph cyan">' + icon('match') + '</span></div>' + clipReel(data) + '</section>'+
      '<footer class="pj-footnote"><span>PLAYIN365 · PLAYER STORY</span><small>' + (owner ? 'أنت تتحكم بما يظهر في هذا الملف.' : 'المعروض هنا مقتصر على البيانات المنشورة والموثّقة.') + '</small></footer></section>';
  }
  function completedMatches(events, joins, records) {
    var matches = {};
    (events || []).forEach(function (event) { if (event.matches && event.matches.id) matches[String(event.matches.id)] = event.matches; });
    (records || []).forEach(function (match) { matches[String(match.id)] = match; });
    return Object.keys(matches).map(function (key) { return matches[key]; });
  }
  async function loadHistory(player, preloaded) {
    var who = player.name;
    var results = await Promise.all([
      preloaded ? Promise.resolve(preloaded.events || []) : safe('journey-events', sb.from('match_events').select('*').eq('who', who).order('created_at', { ascending: true }).limit(200)),
      preloaded ? Promise.resolve(preloaded.joins || []) : safe('journey-joins', sb.from('match_joins').select('*').eq('player_name', who).limit(300)),
      preloaded ? Promise.resolve(preloaded.badges || []) : safe('journey-badges', sb.from('pi_badges').select('*').eq('person', who).limit(60)),
      safe('journey-career', sb.from('pi_career').select('*').eq('person', who).order('from_year', { ascending: true }).limit(60)),
      safe('journey-certs', sb.from('pi_certs').select('*').eq('person', who).order('year', { ascending: true }).limit(40)),
      safe('journey-alumni', sb.from('pi_alumni').select('*').eq('player_name', who).order('dest_year', { ascending: true }).limit(40)),
      safe('journey-media', sb.from('pi_media').select('*').eq('subject', who).limit(40))
    ]);
    var events = results[0] || [], joins = results[1] || [], ids = [...new Set(events.map(function (event) { return event.match_id; }).concat(joins.map(function (join) { return join.match_id; })).filter(Boolean))].slice(0, 100);
    var matches = [];
    if (ids.length) matches = await safe('journey-matches', sb.from('matches').select('*').in('id', ids));
    matches = completedMatches(events, joins, matches);
    var matchById = {};
    matches.forEach(function (match) { matchById[String(match.id)] = match; });
    events.forEach(function (event) { if (!event.matches && matchById[String(event.match_id)]) event.matches = matchById[String(event.match_id)]; });
    return { events: events, joins: joins, badges: results[2] || [], career: results[3] || [], certs: results[4] || [], alumni: results[5] || [], media: results[6] || [], matches: matches };
  }

  var cardCapture = null;
  P.identityCard = function (events, joins, badges) {
    cardCapture = { events: events || [], joins: joins || [], badges: badges || [] };
    return baseIdentityCard.apply(this, arguments);
  };

  P.myCard = async function () {
    cardCapture = null;
    var markup = await baseMyCard.apply(this, arguments);
    try {
      var player = ME;
      var history = await loadHistory(player, cardCapture);
      var mount = '<div class="pj-mount">' + journeyView(player, history, true) + '</div>';
      return markup.replace('</main>', mount + '</main>');
    } catch (error) {
      console.warn('PlayIn365 player journey', error);
      return markup;
    }
  };
  P.bind('myCard', P.myCard);
  P.bind('publicView', P.myCard);

  async function renderPublicProfile(name) {
    var who = String(name || '').trim();
    if (!who) return '<main><div class="card">لم يُحدّد اللاعب.</div></main>';
    var records = await safe('journey-profile', sb.from('profiles').select('*').eq('name', who).limit(1));
    var source = records[0];
    if (!source || source.role && source.role !== 'player') return '<div class="pi-id-page"><header class="pz5-top">' + P.brand() + '</header><main class="pi-id-main"><div class="pj-not-found"><span>' + icon('academy') + '</span><b>الهوية غير متاحة</b><small>قد يكون الرابط غير صحيح أو أن اللاعب لم ينشر ملفه.</small></div></main></div>';
    var player = Object.assign({}, source, {
      age_group: source.age_group || source.category || (source.age ? 'U' + source.age : ''),
      jersey_number: source.jersey_number || source.shirt_number,
      position_code: source.position_code || source.pos_en || source.position || source.pos
    });
    var history = await loadHistory(player);
    var previous = ME;
    var card = '';
    try { ME = player; card = P.identityCard(history.events, history.joins, history.badges); }
    finally { ME = previous; }
    return '<div class="pi-id-page pj-public-page">' + P.top("history.back()") + '<main class="pi-id-main"><div class="pj-public-heading"><span class="pj-label">PLAYER STORY · VERIFIED RECORD</span><h1>رحلة اللاعب</h1><p>بطاقة الهوية أولًا، ثم محطات المسيرة والبطولات والإنجازات.</p></div>' + card + '<div class="pi-id-actions"><button class="primary" onclick="window.PZ.share(\'' + e(player.name) + '\')">شارك الهوية ↗</button></div><div class="pj-mount">' + journeyView(player, history, false) + '</div></main></div>';
  }

  var originalPublicProfile = P.publicProfile;
  P.publicProfile = function () {
    var target = PARAM && String(PARAM).trim();
    if (target && (!ME || target !== ME.name)) return renderPublicProfile(target);
    return originalPublicProfile.apply(this, arguments);
  };
  T.profile = async function () {
    var target = PARAM && String(PARAM).trim();
    if (target && (!ME || target !== ME.name)) return renderPublicProfile(target);
    return baseProfileRoute.apply(this, arguments);
  };
  T.publicView = async function () {
    var target = PARAM && String(PARAM).trim();
    if (target && (!ME || target !== ME.name)) return renderPublicProfile(target);
    if (ME && ME.role === 'player') return P.myCard.apply(this, arguments);
    return basePublicViewRoute ? basePublicViewRoute.apply(this, arguments) : '<main><div class="card">اختر لاعبًا لعرض هويته.</div></main>';
  };

  var sharedPlayer = '';
  try { sharedPlayer = new URLSearchParams(location.search).get('player') || ''; } catch (_) {}
  if (sharedPlayer) {
    var priorRender = window.render;
    window.render = render = async function () {
      if (ME && VIEW !== 'auth' && VIEW !== 'role' && sharedPlayer) {
        var target = sharedPlayer;
        sharedPlayer = '';
        P.go('profile', target);
        return;
      }
      return priorRender.apply(this, arguments);
    };
  }
})();
