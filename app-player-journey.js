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
    var digits = String(value).replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); }).replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); });
    var match = digits.match(/(?:19|20)\d{2}/);
    return match ? match[0] : '';
  }
  function matchDate(match) { return match && (match.match_date || match.scheduled_at || match.kickoff_at || match.date || match.starts_at) || ''; }
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
    // Use the exact value shown on the identity card so the pitch marker can
    // never contradict the player's public position label.
    var raw = norm(player.identity_position || player.position_code || player.pos_en || player.position || player.pos || '');
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
      var officialDate = matchDate(match);
      var d = dateParts(officialDate || (!yearOf(match.comp) ? match.created_at : ''));
      var title = match.comp || match.title || match.name || 'مشاركة رسمية';
      items.push({ year: d.year || yearOf(match.comp), month: d.month, date: d.stamp, type: 'tournament', icon: 'match', title: title, meta: match.title && match.comp ? match.title : 'مشاركة موثّقة', verified: true, matchId: String(match.id), matchTitle: match.title || match.name || '' });
    });
    data.events.forEach(function (event) {
      var kind = readableType(event.type);
      if (!kind) return;
      var match = event.matches || null;
      var officialDate = matchDate(match);
      var d = dateParts(officialDate || (!yearOf(match && match.comp) ? event.created_at || match && match.created_at : ''));
      var seasonYear = yearOf(match && match.comp);
      items.push({ year: d.year, month: d.month, date: d.stamp, type: kind.kind, icon: kind.icon, title: kind.label, meta: [event.matches && (event.matches.title || event.matches.comp), event.minute ? event.minute + '′' : ''].filter(Boolean).join(' · '), verified: !!event.recorded_by, matchId: event.match_id ? String(event.match_id) : '', matchTitle: event.matches && (event.matches.title || event.matches.name) || '' });
      if (!d.year && seasonYear) items[items.length - 1].year = seasonYear;
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
      return Number(b.year || 0) - Number(a.year || 0) || (monthNames.indexOf(b.month) - monthNames.indexOf(a.month));
    });
  }
  function academyStations(player, data) {
    var stations = data.career.filter(hasProof).map(function (row) {
      return { name: row.org, year: yearOf(row.from_year || row.to_year), meta: [row.group_name, row.title].filter(Boolean).join(' · '), icon: 'academy' };
    });
    data.alumni.filter(hasProof).forEach(function (row) {
      stations.push({ name: row.dest, year: yearOf(row.dest_year), meta: 'انتقال موثّق', icon: 'arrow' });
    });
    var identityOrg = player.identity_org || player.org;
    if (identityOrg) stations.push({ name: identityOrg, year: '', meta: player.org ? 'المحطة الحالية' : 'الجهة المعروضة في الهوية', icon: 'academy', current: true });
    var unique = [];
    stations.forEach(function (station) { if (!unique.some(function (s) { return norm(s.name) === norm(station.name); })) unique.push(station); });
    unique.sort(function (a, b) { return Number(a.year || 9999) - Number(b.year || 9999); });
    return unique;
  }
  function academyRail(player, data) {
    var unique = academyStations(player, data);
    if (!unique.length) return '<div class="pj-empty-trail"><span class="pj-empty-mark">' + icon('academy') + '</span><div><b>المسار يبدأ من أول محطة موثّقة</b><small>تظهر انتقالات اللاعب هنا بعد اعتمادها من الأكاديمية، دون إدخال محطات غير مؤكدة.</small></div></div>';
    return '<div class="pj-stations" role="list">' + unique.map(function (station, index) {
      return '<div class="pj-station ' + (station.current ? 'is-current' : '') + '" role="listitem"><span class="pj-station-connector" aria-hidden="true"></span><span class="pj-station-mark">' + icon(station.icon) + '</span><div class="pj-station-copy"><small>' + (station.current ? 'الجهة المسجلة' : station.year ? e(station.year) : 'محطة موثقة') + '</small><b>' + e(station.name) + '</b><span>' + e(station.meta || 'أكاديمية موثقة') + '</span></div><span class="pj-station-seal">' + (station.current ? 'من الملف' : 'موثّق') + '</span></div>';
    }).join('') + '</div>';
  }
  function foldMatchMoments(items) {
    var moments = [], byMatch = {};
    items.forEach(function (item) {
      if (!item.matchId || !['tournament', 'goal', 'assist', 'match'].includes(item.type)) { moments.push(item); return; }
      var key = item.year + '|' + item.month + '|' + item.matchId;
      var moment = byMatch[key];
      if (!moment) {
        moment = byMatch[key] = { year: item.year, month: item.month, date: item.date, type: 'match', icon: 'match', title: item.type === 'tournament' ? item.title : (item.matchTitle || item.title), meta: item.type === 'tournament' ? (item.matchTitle || 'مشاركة موثّقة') : 'لحظة من المباراة', verified: item.type === 'tournament', goals: [], assists: [], matchId: item.matchId };
        moments.push(moment);
      }
      if (item.type === 'tournament') {
        moment.title = item.title;
        moment.meta = item.matchTitle || item.meta || 'مشاركة موثّقة';
        moment.verified = true;
      } else if (item.type === 'goal') {
        var minute = (item.meta || '').match(/\d+['′]/);
        moment.goals.push({ minute: minute ? minute[0] : '', verified: item.verified });
      } else if (item.type === 'assist') {
        var assistMinute = (item.meta || '').match(/\d+['′]/);
        moment.assists.push({ minute: assistMinute ? assistMinute[0] : '', verified: item.verified });
      }
      if (item.date && (!moment.date || Date.parse(item.date) > Date.parse(moment.date))) moment.date = item.date;
    });
    return moments;
  }
  function eventRow(item) {
    var proof = item.type === 'goal' || item.type === 'assist' ? 'مسجّل' : item.verified ? 'موثّق' : 'مضاف';
    var signals = [];
    if (item.goals && item.goals.length) signals.push('<span class="pj-signal pj-signal-goal">' + icon('goal') + '<b>' + e(item.goals.length) + ' أهداف</b></span>');
    if (item.assists && item.assists.length) signals.push('<span class="pj-signal pj-signal-assist">' + icon('assist') + '<b>' + e(item.assists.length) + ' صناعة</b></span>');
    if (item.goals && item.goals.some(function (x) { return x.minute; })) signals.push('<small class="pj-minute-list">' + e(item.goals.map(function (x) { return x.minute; }).filter(Boolean).join(' · ')) + '</small>');
    return '<article class="pj-event pj-event-' + e(item.type) + '"><span class="pj-event-icon">' + icon(item.icon) + '</span><div class="pj-event-copy"><b>' + e(item.title) + '</b>' + (item.meta ? '<small>' + e(item.meta) + '</small>' : '') + (signals.length ? '<span class="pj-event-signals">' + signals.join('') + '</span>' : '') + '</div><span class="pj-event-proof" title="' + proof + '">' + (item.verified ? '✓' : '•') + '</span></article>';
  }
  function seasonAtlas(items) {
    var groups = monthTimeline(foldMatchMoments(items));
    if (!groups.length) return '<div class="pj-empty-trail"><span class="pj-empty-mark">' + icon('star') + '</span><div><b>لا توجد محطات منشورة بعد</b><small>عندما تُسجّل المباريات والإنجازات أو تعتمد الأكاديمية انتقالًا، ستظهر هنا كرحلة مرتبة حسب الموسم والشهر.</small></div></div>';
    var years = [...new Set(groups.map(function (g) { return g.year; }).filter(Boolean))];
    return '<div class="pj-atlas-head"><span class="pj-atlas-line"></span><div class="pj-year-orbit" role="tablist" aria-label="تصفية الرحلة حسب السنة"><button class="pj-year-node is-selected" role="tab" type="button" data-pj-year="all" aria-selected="true" aria-pressed="true"><i>الكل</i><small>المسيرة</small></button>' + years.map(function (year) { return '<button class="pj-year-node" role="tab" type="button" data-pj-year="' + e(year) + '" aria-selected="false" aria-pressed="false"><i>' + e(year) + '</i><small>الموسم</small></button>'; }).join('') + '</div></div><div class="pj-month-stream">' + groups.map(function (group) {
      return '<section class="pj-month-group" data-pj-group-year="' + e(group.year || 'غير مؤرخ') + '"><div class="pj-month-marker"><span></span><b>' + e(group.month) + '</b>' + (group.year ? '<small>' + e(group.year) + '</small>' : '') + '</div><div class="pj-month-events">' + group.items.map(eventRow).join('') + '</div></section>';
    }).join('') + '</div>';
  }
  function academyRoute(player, data) {
    var stations = academyStations(player, data).slice(-5);
    var dots = stations.length ? stations.map(function (station, i) {
      var label = station.year || (station.current ? 'الآن' : 'موثّق');
      return '<span class="pj-route-dot ' + (station.current ? 'live' : '') + '" style="--step:' + i + ';--offset:' + (i % 2 ? '10px' : '-10px') + '"><i>' + e(label) + '</i><small>' + e(station.name) + '</small></span>';
    }).join('') : '<span class="pj-route-origin">أول محطة موثّقة تظهر بعد اعتمادها</span>';
    var count = data.career.filter(hasProof).length + data.alumni.filter(hasProof).length;
    var identityOrg = player.identity_org || player.org;
    return '<section class="pj-route"><div class="pj-route-top"><span class="pj-label">ACADEMY ROUTE</span><span class="pj-route-count">' + e(count) + ' <small>محطات معتمدة</small></span></div><div class="pj-route-art"><svg viewBox="0 0 440 118" preserveAspectRatio="none" aria-hidden="true"><path class="pj-route-pitch" d="M0 10h440v98H0zM220 10v98m0-65a16 16 0 1 0 0 32 16 16 0 0 0 0-32M0 39h54v40H0m440-40h-54v40h54"/><path class="pj-route-path" d="M15 83 C78 83 74 34 139 43 S204 87 251 58 S333 28 425 35"/></svg><div class="pj-route-dots">' + dots + '</div></div><p class="pj-route-caption">' + (identityOrg ? (player.org ? 'المحطة الحالية من الملف · ' : 'الجهة المعروضة في الهوية · ') + e(identityOrg) + ' — الانتقالات لا تظهر إلا بعد توثيقها' : 'مسار الأكاديميات يُبنى من محطات موثّقة فقط') + '</p></section>';
  }
  function isTournament(match) {
    var name = norm(match.comp || match.competition_name || match.tournament_name || match.title || match.name || '');
    if (!name || /ودية|ودّية|تدريب|تمرين|تجربة أداء|friendly|training|scrimmage|practice|tryout/.test(name)) return false;
    if (match.tournament_id || match.competition_id || match.is_tournament === true) return true;
    return /دوري|بطولة|كأس|كاس|league|tournament|cup|championship/.test(name);
  }
  function tournamentTrail(data) {
    var comps = {};
    data.matches.forEach(function (match) {
      var attended = data.joins.some(function (join) { return isAttended(join) && String(join.match_id) === String(match.id); });
      if (!attended || !isCompleted(match) || !isTournament(match)) return;
      var name = match.comp || match.competition_name || match.tournament_name || match.title;
      if (!name) return;
      comps[name] = comps[name] || { name: name, appearances: 0, last: matchDate(match) || yearOf(name) };
      comps[name].appearances++;
      var current = comps[name].last, next = matchDate(match) || yearOf(name);
      if (next && (!current || (Date.parse(next) || Number(yearOf(next))) > (Date.parse(current) || Number(yearOf(current)))) ) comps[name].last = next;
    });
    var list = Object.keys(comps).map(function (key) { return comps[key]; }).sort(function (a, b) { return Date.parse(b.last || 0) - Date.parse(a.last || 0); });
    if (!list.length) return '<div class="pj-tournament-empty"><span class="pj-cup-ghost">' + icon('trophy') + '</span><p>مشاركته التالية ستضيف أول علامة على خط البطولات.</p></div>';
    return '<div class="pj-cup-rail">' + list.map(function (cup, i) {
      return '<article class="pj-cup-stop"><span class="pj-cup-wire" aria-hidden="true"></span><span class="pj-cup-emblem ' + (i === 0 ? 'gold' : i === 1 ? 'purple' : '') + '">' + icon('trophy') + '</span><div><b>' + e(cup.name) + '</b><small>' + (cup.appearances > 1 ? e(cup.appearances) + ' مشاركات موثقة' : 'مشاركة موثقة') + (cup.last ? ' · ' + e(yearOf(cup.last)) : '') + '</small></div></article>';
    }).join('') + '</div>';
  }
  function honors(data) {
    var items = data.badges.concat(data.certs.filter(function (row) { return row.title; }).map(function (row) { return { title: row.title, proof: row.issuer, verified_by: row.verified_by }; })).sort(function (a, b) { return Number(hasProof(b)) - Number(hasProof(a)); }).slice(0, 6);
    if (!items.length) return '<div class="pj-honor-empty"><span class="pj-honor-empty-orbit">' + icon('trophy') + '</span><div><b>مكان أول إنجاز موثّق</b><small>حين تعتمده الأكاديمية، يظهر هنا كوسام في رحلة اللاعب.</small></div><span class="pj-honor-empty-stars" aria-hidden="true">✦　✧　✦</span></div>';
    var verified = items.filter(hasProof), unverified = items.filter(function (x) { return !hasProof(x); });
    return '<div class="pj-honor-field"><div class="pj-honor-feature">' + icon('trophy') + '<small>' + (verified.length ? 'أقوى إشارة موثقة' : 'إنجاز أضافه اللاعب') + '</small><b>' + e((verified[0] || items[0]).title || (verified[0] || items[0]).badge_key || 'إنجاز') + '</b><span>' + e((verified[0] || items[0]).proof || (verified[0] || items[0]).signed_by || (hasProof(verified[0] || items[0]) ? 'اعتماد الجهة' : 'بانتظار توثيق الجهة')) + '</span></div><div class="pj-honor-constellation">' + items.slice(verified.length ? 1 : 0).map(function (item, index) { return '<div class="pj-honor-star ' + (hasProof(item) ? 'verified' : '') + '" style="--star:' + index + '"><span>' + icon('star') + '</span><b>' + e(item.title || item.badge_key || 'إنجاز') + '</b><small>' + (hasProof(item) ? 'موثّق' : 'مضاف') + '</small></div>'; }).join('') + '</div></div>';
  }
  function roleMap(player) {
    var pos = getPosition(player);
    return '<div class="pj-role-map"><div class="pj-role-copy"><span class="pj-label">POSITION MAP</span><div class="pj-position-name"><b>' + e(pos[0]) + '</b><small>المركز المسجل في الهوية</small></div><p>موضع اللاعب على أرض الملعب — قراءة تعريفية، لا تقييم فني افتراضي.</p></div><svg class="pj-pitch" viewBox="0 0 300 250" role="img" aria-label="تمثيل تقريبي لمركز ' + e(pos[0]) + '"><defs><linearGradient id="pjPitch" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b5470"/><stop offset=".5" stop-color="#0b3158"/><stop offset="1" stop-color="#071a39"/></linearGradient><radialGradient id="pjPulse"><stop stop-color="#f5c518" stop-opacity=".88"/><stop offset="1" stop-color="#f5c518" stop-opacity="0"/></radialGradient></defs><rect x="18" y="10" width="264" height="230" rx="18" fill="url(#pjPitch)" stroke="#61dfff" stroke-opacity=".68"/><path d="M18 125h264M82 10v38h136V10M82 240v-38h136v38M118 10v15h64V10M118 240v-15h64v15M18 79h44v92H18m264-92h-44v92h44" fill="none" stroke="#a5eaff" stroke-opacity=".48" stroke-width="1.4"/><circle cx="150" cy="125" r="34" fill="none" stroke="#a5eaff" stroke-opacity=".52" stroke-width="1.4"/><circle cx="150" cy="125" r="2.5" fill="#a5eaff" fill-opacity=".8"/><circle cx="' + (18 + pos[1] * 2.64) + '" cy="' + (10 + pos[2] * 2.3) + '" r="34" fill="url(#pjPulse)"/><circle cx="' + (18 + pos[1] * 2.64) + '" cy="' + (10 + pos[2] * 2.3) + '" r="8" fill="#f5c518" stroke="#fff" stroke-width="2.5"/><circle cx="' + (18 + pos[1] * 2.64) + '" cy="' + (10 + pos[2] * 2.3) + '" r="14" fill="none" stroke="#ffe776" stroke-opacity=".75" stroke-width="1.5"/><path d="M' + (18 + pos[1] * 2.64) + ' ' + (10 + pos[2] * 2.3) + 'v-18" stroke="#ffe776" stroke-width="1.5" stroke-dasharray="2 3"/></svg></div>';
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
    var identityPosition = player.identity_position || player.position_code || player.pos_en || 'RB';
    var years = [...new Set(items.map(function (item) { return item.year; }).filter(Boolean))].sort();
    var yearRange = years.length ? years[0] + (years.length > 1 ? ' — ' + years[years.length - 1] : '') : 'PLAYER ARC';
    return '<section class="pj-journey" aria-label="رحلة اللاعب"><header class="pj-heading"><div><span class="pj-label">THE PLAYER ARC · ' + e(yearRange) + '</span><h2>من هنا… تبدأ الحكاية</h2><p>مسار اللاعب على أرض الملعب: جهاته، مواسمه، لحظاته، وكل إنجاز له شاهد.</p></div><span class="pj-arc-seal"><i></i> سجل موثّق</span></header>'+ 
      academyRoute(player, data)+
      '<section class="pj-story-section pj-atlas"><div class="pj-section-title"><div><span class="pj-label">SEASONS · MONTHS · MOMENTS</span><h3>رحلة اللاعب عبر الزمن</h3><p>اختر موسمًا، ثم تتبّع محطاته شهرًا بشهر.</p></div><span class="pj-title-glyph purple">' + icon('arrow') + '</span></div>' + seasonAtlas(items) + '</section>'+
      '<section class="pj-story-section pj-proof-deck"><div class="pj-proof-column"><div class="pj-section-title"><div><span class="pj-label">CLUB TO CLUB</span><h3>من أكاديمية إلى أخرى</h3></div><span class="pj-title-glyph">' + icon('academy') + '</span></div>' + academyRail(player, data) + '</div><div class="pj-proof-column"><div class="pj-section-title"><div><span class="pj-label">TOURNAMENT FOOTPRINT</span><h3>بصمته في البطولات</h3></div><span class="pj-title-glyph gold">' + icon('trophy') + '</span></div>' + tournamentTrail(data) + '</div></section>'+
      '<section class="pj-story-section pj-proof-deck pj-proof-deck-honors"><div class="pj-proof-column"><div class="pj-section-title"><div><span class="pj-label">PROOF OF PROGRESS</span><h3>إنجازات لها شاهد</h3></div><span class="pj-title-glyph gold">' + icon('star') + '</span></div>' + honors(data) + '</div><div class="pj-proof-column"><div class="pj-section-title"><div><span class="pj-label">TACTICAL FOOTPRINT</span><h3>مكانه في الملعب</h3></div><span class="pj-title-glyph cyan">' + icon('match') + '</span></div>' + roleMap(Object.assign({}, player, { identity_position: identityPosition })) + '</div></section>'+
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
    cardCapture = { events: events || [], joins: joins || [], badges: badges || [], position: ME && (ME.position_code || ME.pos_en || 'RB'), org: ME && (ME.org || 'أكاديمية النخبة'), player: ME ? Object.assign({}, ME) : null };
    return baseIdentityCard.apply(this, arguments);
  };

  P.myCard = async function () {
    cardCapture = null;
    var markup = await baseMyCard.apply(this, arguments);
    try {
      var player = Object.assign({}, cardCapture && cardCapture.player || ME, { identity_position: cardCapture && cardCapture.position || (ME && (ME.position_code || ME.pos_en || 'RB')), identity_org: cardCapture && cardCapture.org || (ME && (ME.org || 'أكاديمية النخبة')) });
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

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-pj-year]');
    if (!button) return;
    var atlas = button.closest('.pj-atlas');
    if (!atlas) return;
    var year = button.getAttribute('data-pj-year');
    atlas.querySelectorAll('[data-pj-year]').forEach(function (tab) {
      var active = tab === button;
      tab.classList.toggle('is-selected', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    atlas.querySelectorAll('[data-pj-group-year]').forEach(function (group) {
      group.hidden = year !== 'all' && group.getAttribute('data-pj-group-year') !== year;
    });
  });

  async function renderPublicProfile(name) {
    var who = String(name || '').trim();
    if (!who) return '<main><div class="card">لم يُحدّد اللاعب.</div></main>';
    var records = await safe('journey-profile', sb.from('profiles').select('*').eq('name', who).limit(1));
    var source = records[0];
    if (!source || source.role && source.role !== 'player') return '<div class="pi-id-page"><header class="pz5-top">' + P.brand() + '</header><main class="pi-id-main"><div class="pj-not-found"><span>' + icon('academy') + '</span><b>الهوية غير متاحة</b><small>قد يكون الرابط غير صحيح أو أن اللاعب لم ينشر ملفه.</small></div></main></div>';
    var player = Object.assign({}, source, {
      age_group: source.age_group || source.category || (source.age ? 'U' + source.age : ''),
      jersey_number: source.jersey_number || source.shirt_number,
      position_code: source.position_code || source.pos_en || source.position || source.pos,
      identity_position: source.position_code || source.pos_en || 'RB',
      identity_org: source.org || 'أكاديمية النخبة'
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
    if (target) return renderPublicProfile(target);
    return originalPublicProfile.apply(this, arguments);
  };
  T.profile = async function () {
    var target = PARAM && String(PARAM).trim();
    if (target) return renderPublicProfile(target);
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
