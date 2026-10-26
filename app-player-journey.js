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
  function hasProof(row) { return !!(row && (row.verified_by || row.verified_at || row.signed_by || row.proof || row.is_verified === true)); }
  function previewDemoMode() {
    try { return location.hostname.endsWith('.vercel.app') && location.hostname.indexOf('-git-codex-player-ac-') >= 0 && new URLSearchParams(location.search).get('demo') === '1'; }
    catch (_) { return false; }
  }
  function demoDate(monthOffset, day) {
    var parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit' }).formatToParts(new Date()).forEach(function (part) { parts[part.type] = part.value; });
    return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1 + monthOffset, Math.min(day || 12, 28), 12)).toISOString().slice(0, 10);
  }
  function demoHistory(player) {
    var who = player && player.name || 'Player';
    var events = [], joins = [], badges = [], matches = [], comps = ['دوري الناشئين التجريبي', 'بطولة الرياض التجريبية', 'كأس الأكاديميات التجريبي'];
    for (var i = 5; i >= 0; i--) {
      var date = demoDate(-i, 6 + (i % 3) * 5), id = 'preview-match-' + i;
      var match = { id: id, title: 'مباراة تجريبية · الجولة ' + (6 - i), comp: comps[i % comps.length], match_date: date + 'T18:30:00+03:00', status: 'FT', score_a: i % 2 ? 2 : 3, score_b: 1, team_a: player && player.org || 'أكاديمية تجريبية', team_b: 'فريق تجريبي', demo: true };
      matches.push(match);
      joins.push({ id: 'preview-join-' + i, match_id: id, player_name: who, attended: true, demo: true });
      events.push({ id: 'preview-goal-' + i, who: who, match_id: id, type: 'goal', minute: 14 + i * 7, created_at: date + 'T20:00:00+03:00', matches: match, demo: true });
      if (i % 2 === 0) events.push({ id: 'preview-assist-' + i, who: who, match_id: id, type: 'assist', minute: 61, created_at: date + 'T20:20:00+03:00', matches: match, demo: true });
    }
    [-4, -2, 0].forEach(function (offset, index) {
      var earned = demoDate(offset, 18);
      badges.push({ id: 'preview-badge-' + index, title: ['إنجاز تجريبي · أول هدف', 'إنجاز تجريبي · لاعب الجولة', 'إنجاز تجريبي · 1000 دقيقة'][index], earned_at: earned + 'T12:00:00+03:00', demo: true });
    });
    return { events: events, joins: joins, badges: badges, career: [], certs: [{ title: 'بطولة اختبار الناشئين — تجريبي', issuer: 'جهة اختبارية · بيانات تجريبية', year: '2026', created_at: demoDate(-2, 20), demo: true }], alumni: [], media: [], matches: matches };
  }
  function maySharePublic(player) {
    // A QR code is an identity link, not an age-gated feature. Visibility is
    // governed by the profile's own public/private setting, not the player's age.
    return !!(player && player.role === 'player' && (player.profile_visibility === 'public' || previewDemoMode()));
  }
  function shareNotice(message) {
    if (typeof toast === 'function') toast(message);
    else {
      var note = document.querySelector('.pj-share-note');
      if (note) note.textContent = message;
    }
  }
  function contactStyles() {
    if (document.getElementById('pj-contact-styles')) return;
    var style = document.createElement('style');
    style.id = 'pj-contact-styles';
    style.textContent = `
      .pj-public-actions{display:flex;gap:10px;flex-wrap:wrap}
      .pj-public-actions button{flex:1;min-width:145px}
      .pj-contact-trigger{border:1px solid #4d83c7;background:linear-gradient(135deg,#142f59,#0b1b35);color:#fff;border-radius:14px;padding:13px 18px;font:800 13px Cairo;cursor:pointer}
      .pj-contact-shade{position:fixed;inset:0;z-index:1200;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,8,20,.78);backdrop-filter:blur(10px)}
      .pj-contact-shade.is-open{display:flex}
      .pj-contact-dialog{width:min(100%,460px);max-height:92vh;overflow:auto;border:1px solid rgba(76,144,218,.55);border-radius:24px;padding:22px;background:radial-gradient(ellipse at 0 0,rgba(0,166,214,.18),transparent 50%),linear-gradient(150deg,#102b51,#08162d 72%);color:#f5f7fc;box-shadow:0 28px 90px rgba(0,0,0,.48)}
      .pj-contact-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .pj-contact-head h2{margin:0;font:900 22px Cairo}
      .pj-contact-close{width:38px;height:38px;border-radius:12px;border:1px solid #365277;background:#10223d;color:#fff;font-size:22px;cursor:pointer}
      .pj-contact-dialog>p{margin:8px 0 18px;color:#b8c9e0;font:600 12px/1.8 Cairo}
      .pj-contact-field{display:flex;flex-direction:column;gap:7px;margin-top:13px}
      .pj-contact-field label,.pj-contact-inbox label{font:800 12px Cairo;color:#d9e6f7}
      .pj-contact-dialog input,.pj-contact-dialog select,.pj-contact-dialog textarea,.pj-contact-inbox input{width:100%;border:1px solid #344d70;border-radius:12px;background:#0a1930;color:#fff;padding:12px 13px;font:600 13px Cairo;outline:none}
      .pj-contact-dialog textarea{min-height:92px;resize:vertical}
      .pj-contact-dialog input:focus,.pj-contact-dialog select:focus,.pj-contact-dialog textarea:focus,.pj-contact-inbox input:focus{border-color:#39bde9;box-shadow:0 0 0 3px rgba(57,189,233,.13)}
      .pj-contact-submit,.pj-contact-approve,.pj-contact-reject{border:0;border-radius:12px;padding:12px 16px;font:900 12px Cairo;cursor:pointer}
      .pj-contact-submit,.pj-contact-approve{background:linear-gradient(100deg,#4636e3,#7357ff);color:#fff}
      .pj-contact-submit{width:100%;margin-top:18px}
      .pj-contact-submit:disabled,.pj-contact-approve:disabled,.pj-contact-reject:disabled{opacity:.55;cursor:wait}
      .pj-contact-privacy{display:block;margin-top:10px;color:#9cb0ca;font:600 10px/1.7 Cairo}
      .pj-contact-inbox{margin:16px 0;border:1px solid rgba(63,119,185,.45);border-radius:22px;padding:17px;background:linear-gradient(145deg,#0d2140,#09152a);color:#f6f8fc}
      .pj-contact-inbox h3{margin:0 0 12px;font:900 16px Cairo}
      .pj-contact-request{border-top:1px solid rgba(120,158,201,.2);padding:13px 0}
      .pj-contact-request:first-of-type{border-top:0;padding-top:0}
      .pj-contact-request-head{display:flex;justify-content:space-between;gap:12px;align-items:center}
      .pj-contact-request-head b{font:900 13px Cairo}
      .pj-contact-role{border:1px solid rgba(74,139,216,.45);border-radius:999px;padding:3px 9px;color:#a9d6f1;font:800 10px Cairo;white-space:nowrap}
      .pj-contact-request small{display:block;margin-top:3px;color:#9eafc9;font:600 10px Cairo}
      .pj-contact-request p{margin:8px 0;color:#e4ebf6;font:600 12px/1.8 Cairo}
      .pj-contact-request .pj-contact-method{direction:ltr;unicode-bidi:isolate;text-align:left;color:#f5cf52;font:700 12px 'Space Grotesk',sans-serif;overflow-wrap:anywhere}
      .pj-contact-share{display:block;margin-top:12px}
      .pj-contact-owner-note{flex-basis:100%;margin:0;color:#98abc4;font:600 11px/1.7 Cairo}
      .pj-contact-decision{display:flex;gap:8px;margin-top:10px}
      .pj-contact-decision button{flex:1}
      .pj-contact-reject{border:1px solid #4a5365;background:#141b2b;color:#e7eaf2}
      @media(max-width:420px){.pj-public-actions{flex-direction:column}.pj-public-actions button{width:100%}.pj-contact-dialog{padding:18px}}
    `;
    document.head.appendChild(style);
  }
  function contactModalMarkup(player) {
    contactStyles();
    return '<div class="pj-contact-shade" id="pj-contact-modal" aria-hidden="true" data-target-player-id="' + e(player.id) + '"><section class="pj-contact-dialog" role="dialog" aria-modal="true" aria-labelledby="pj-contact-title">' +
      '<div class="pj-contact-head"><h2 id="pj-contact-title">طلب تواصل</h2><button class="pj-contact-close" type="button" data-pj-contact-close aria-label="إغلاق">×</button></div>' +
      '<p>للكشافين والمنتخبات والأندية والرعاة والجهات الرياضية الموثّقة. يراجع اللاعب أو ولي أمره الطلب قبل تبادل وسائل التواصل.</p>' +
      '<div class="pj-contact-field"><label for="pj-contact-method">وسيلة التواصل</label><select id="pj-contact-method"><option value="phone">رقم الجوال</option><option value="email">البريد الإلكتروني</option></select><input id="pj-contact-value" type="text" inputmode="tel" autocomplete="off" maxlength="120" placeholder="05… أو name@example.com"></div>' +
      '<div class="pj-contact-field"><label for="pj-contact-reason">سبب التواصل</label><textarea id="pj-contact-reason" maxlength="400" placeholder="استقطاب، منتخب، رعاية، تجربة أداء…"></textarea></div>' +
      '<button class="pj-contact-submit" type="button" data-pj-contact-submit>إرسال الطلب</button><small class="pj-contact-privacy">لن تظهر وسيلة تواصلك في الملف العام.</small></section></div>';
  }
  function contactErrorMessage(error) {
    var message = String(error && error.message || '');
    if (message.indexOf('CONTACT_LOGIN_REQUIRED') >= 0) return 'سجّل الدخول أولًا.';
    if (/CONTACT_ROLE_REQUIRED|CONTACT_SCOUT_UNVERIFIED|CONTACT_ACADEMY_UNVERIFIED/.test(message)) return 'التواصل متاح للجهات الرياضية الموثّقة فقط.';
    if (message.indexOf('CONTACT_REQUEST_PENDING') >= 0) return 'لديك طلب قائم لهذا اللاعب.';
    if (message.indexOf('CONTACT_RATE_LIMIT') >= 0) return 'وصلت الحد اليومي لطلبات التواصل.';
    if (message.indexOf('CONTACT_ROUTE_UNAVAILABLE') >= 0) return 'لا يوجد ولي أمر أو أكاديمية موثّقة لاستلام الطلب.';
    if (message.indexOf('CONTACT_PROFILE_UNAVAILABLE') >= 0) return 'ملف اللاعب غير متاح للتواصل.';
    if (/CONTACT_EMAIL_INVALID|CONTACT_PHONE_INVALID|CONTACT_METHOD_INVALID/.test(message)) return 'تحقق من وسيلة التواصل.';
    if (message.indexOf('CONTACT_REASON_INVALID') >= 0) return 'اكتب سببًا من 5 إلى 400 حرف.';
    return 'تعذر إرسال الطلب. حاول مرة أخرى.';
  }
  async function contactInbox(userId) {
    if (!userId) return '';
    var rows = previewDemoMode() ? [{ id: 'preview-contact-1', payload: { requester_name: 'كشاف تجريبي', requester_role: 'scout', requester_organization: 'جهة استقطاب تجريبية', reason: 'طلب تقييم اللاعب بعد مشاركته في بطولة تجريبية.', contact_method: 'email', contact_value: 'scout@example.test' }, created_at: new Date().toISOString() }] : await safe('player-contact-inbox-' + userId, sb.from('approval_requests').select('id,payload,created_at').eq('assigned_to_user_id', userId).eq('request_type', 'contact').eq('status', 'pending').order('created_at', { ascending: false }).limit(8));
    if (!rows || !rows.length) return '';
    contactStyles();
    return '<section class="pj-contact-inbox"><h3>طلبات التواصل <span class="pj-contact-role">' + e(rows.length) + '</span></h3>' + rows.map(function (row) {
      var data = row.payload || {};
      var roleLabels = { scout: 'كشاف', academy: 'أكاديمية', club: 'نادي', national_team: 'منتخب', federation: 'اتحاد أو رابطة', sponsor: 'راعٍ', agent: 'وكيل لاعبين', commercial: 'جهة تجارية', investor: 'مستثمر', marketing_agency: 'وكالة تسويق', media: 'إعلام رياضي', tournament_organizer: 'منظّم بطولات', coach: 'مدرب', head_coach: 'مدرب أول', assistant_coach: 'مدرب مساعد', technical_staff: 'طاقم فني', medical: 'جهة طبية', doctor: 'طبيب', physiotherapist: 'أخصائي علاج طبيعي', performance: 'محلل أداء', performance_analyst: 'محلل أداء', sports_analyst: 'محلل رياضي', technical_analyst: 'محلل فني', equipment_provider: 'مزود معدات', sports_technology_provider: 'مزود تقنية رياضية', strength_conditioning: 'إعداد بدني', government_sports_entity: 'جهة رياضية حكومية' };
      var role = data.requester_role_label || roleLabels[data.requester_role] || 'جهة رياضية';
      var method = data.contact_method === 'email' ? 'البريد' : 'الجوال';
      return '<article class="pj-contact-request"><div class="pj-contact-request-head"><b>' + e(data.requester_name || role) + '</b><span class="pj-contact-role">' + e(role) + '</span></div>' +
        (data.requester_organization ? '<small>' + e(data.requester_organization) + '</small>' : '') +
        '<p>' + e(data.reason || 'طلب تواصل بخصوص ملف اللاعب.') + '</p><div class="pj-contact-method">' + e(method + ': ' + (data.contact_value || '')) + '</div>' +
        '<label class="pj-contact-share">وسيلة تواصل تشاركها معه (اختياري)<input type="text" maxlength="120" data-pj-share-contact="' + e(row.id) + '" placeholder="رقم جوال أو بريد"></label>' +
        '<div class="pj-contact-decision"><button class="pj-contact-approve" type="button" data-pj-contact-decision="approved" data-request-id="' + e(row.id) + '">أوافق</button><button class="pj-contact-reject" type="button" data-pj-contact-decision="rejected" data-request-id="' + e(row.id) + '">رفض</button></div></article>';
    }).join('') + '</section>';
  }
  async function decideContactRequest(requestId, status) {
    if (!ME || !ME.id || !requestId || !['approved', 'rejected'].includes(status)) return;
    var card = Array.prototype.find.call(document.querySelectorAll('[data-request-id]'), function (node) { return node.getAttribute('data-request-id') === requestId; });
    var shareInput = Array.prototype.find.call(document.querySelectorAll('[data-pj-share-contact]'), function (node) { return node.getAttribute('data-pj-share-contact') === requestId; });
    var shared = status === 'approved' && shareInput ? String(shareInput.value || '').trim().slice(0, 120) : '';
    var query = sb.from('approval_requests').select('id,requested_by_user_id,payload').eq('id', requestId).eq('assigned_to_user_id', ME.id).eq('request_type', 'contact').eq('status', 'pending').maybeSingle();
    var result = await query;
    if (result.error || !result.data) return shareNotice('تعذر العثور على الطلب. حدّث الصفحة وحاول مجددًا.');
    var update = await sb.from('approval_requests').update({ status: status, decision_note: shared ? 'وسيلة تواصل مشاركة: ' + shared : null }).eq('id', requestId).eq('assigned_to_user_id', ME.id).eq('status', 'pending').select('id').maybeSingle();
    if (update.error || !update.data) return shareNotice('تعذر تحديث الطلب.');
    var payload = result.data.payload || {};
    var body = status === 'approved'
      ? (shared ? 'وافق ولي الأمر على طلبك. وسيلة التواصل: ' + shared : 'تمت الموافقة على طلب التواصل. سيجري التواصل معك عبر الوسيلة التي أرسلتها.')
      : 'لم تتم الموافقة على طلب التواصل.';
    var notice = await sb.from('notifications').insert({ user_id: result.data.requested_by_user_id, kind: status === 'approved' ? 'contact_approved' : 'contact_rejected', title: status === 'approved' ? 'تمت الموافقة على التواصل' : 'تحديث طلب التواصل', body: body, notification_type: 'contact_decision', data: { approval_request_id: requestId, player_name: payload.player_name || '' } });
    if (notice.error) console.warn('Contact decision notification', notice.error);
    shareNotice(status === 'approved' ? 'تمت الموافقة على الطلب.' : 'تم رفض الطلب.');
    if (card) card.closest('.pj-contact-request').remove();
  }
  window.PJContact = {
    open: function (playerId) {
      if (!ME || !ME.id) { shareNotice('سجّل الدخول لإرسال طلب التواصل.'); if (typeof P.go === 'function') P.go('auth'); return; }
      var modal = document.getElementById('pj-contact-modal');
      if (!modal || !playerId) return;
      modal.setAttribute('data-target-player-id', playerId);
      modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    },
    close: function () {
      var modal = document.getElementById('pj-contact-modal');
      if (modal) { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); }
      document.body.style.overflow = '';
    },
    submit: async function () {
      var modal = document.getElementById('pj-contact-modal');
      if (!modal || !ME || !ME.id) return;
      var button = modal.querySelector('[data-pj-contact-submit]');
      var method = modal.querySelector('#pj-contact-method').value;
      var contact = modal.querySelector('#pj-contact-value').value.trim();
      var reason = modal.querySelector('#pj-contact-reason').value.trim();
      if (!contact || !reason) return shareNotice('أكمل وسيلة التواصل وسبب الطلب.');
      button.disabled = true;
      var result;
      try {
        result = await sb.rpc('submit_profile_contact_request', { p_target_profile_id: modal.getAttribute('data-target-player-id'), p_reason: reason, p_contact_method: method, p_contact_value: contact });
      } catch (error) {
        button.disabled = false;
        return shareNotice('تعذر الإرسال. حاول مرة أخرى.');
      }
      button.disabled = false;
      if (result.error) return shareNotice(contactErrorMessage(result.error));
      window.PJContact.close();
      modal.querySelector('#pj-contact-value').value = ''; modal.querySelector('#pj-contact-reason').value = '';
      shareNotice('وصل طلبك للموافقة.');
    },
    decide: decideContactRequest
  };
  var baseContactSubmit = window.PJContact.submit;
  var baseContactDecide = window.PJContact.decide;
  window.PJContact.submit = async function () {
    if (!previewDemoMode()) return baseContactSubmit.apply(this, arguments);
    var modal = document.getElementById('pj-contact-modal');
    if (modal) {
      var reason = modal.querySelector('#pj-contact-reason');
      var contact = modal.querySelector('#pj-contact-value');
      if (!reason || !reason.value.trim() || !contact || !contact.value.trim()) return shareNotice('أكمل وسيلة التواصل وسبب الطلب.');
      window.PJContact.close();
    }
    shareNotice('تم اختبار الطلب — لم يُرسل ولم يُحفظ.');
  };
  window.PJContact.decide = async function (requestId, status) {
    if (!previewDemoMode()) return baseContactDecide.apply(this, arguments);
    var node = Array.prototype.find.call(document.querySelectorAll('[data-request-id]'), function (item) { return item.getAttribute('data-request-id') === requestId; });
    var request = node && node.closest('.pj-contact-request');
    var inbox = request && request.closest('.pj-contact-inbox');
    if (request) request.remove();
    if (inbox && !inbox.querySelector('.pj-contact-request')) inbox.remove();
    shareNotice(status === 'approved' ? 'تمت الموافقة على الطلب التجريبي؛ لم يُرسل شيء.' : 'رُفض الطلب التجريبي؛ لم يُرسل شيء.');
  };
  var baseShare = P.share;
  if (typeof baseShare === 'function') P.share = async function (name) {
    var target = norm(name || (ME && ME.name));
    if (ME && target === norm(ME.name) && !maySharePublic(ME)) {
      shareNotice('الهوية غير منشورة للعامة بعد.');
      return;
    }
    return baseShare.apply(this, arguments);
  };
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
    var parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', year: 'numeric', month: 'numeric' }).formatToParts(date).forEach(function (part) { parts[part.type] = part.value; });
    return { year: String(parts.year), month: monthNames[Number(parts.month) - 1], stamp: date.toISOString() };
  }
  function icon(name) {
    var paths = {
      academy: '<path d="M3 9.5 12 4l9 5.5-9 5.3-9-5.3Z"/><path d="M6 12.5v4.2c3.8 2.7 8.2 2.7 12 0v-4.2M21 10v6"/>',
      trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4M12 13v5m-4 2h8m-7-2h6"/>',
      goal: '<circle cx="12" cy="12" r="8.5"/><path d="m8.7 6.6 3.3-2 3.3 2 1.2 3.8-2.8 2.1-3.4-.1-2.7-2.1 1.1-3.7Zm.1 3.7-3.9.4m9.6-.3 4.1-.5m-7.4 2.6-.4 4.8m-2.5-3 2.5-1.8 2.9 1.8 2.1 4.4"/>',
      assist: '<path d="M5 17 18 5M9 5h9v9"/><circle cx="6" cy="18" r="2"/>',
      match: '<path d="M4 5h16v14H4z"/><path d="M12 5v14m0-10a3 3 0 0 0 0 6m-8-3h2m12 0h2"/>',
      pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
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
      var d = dateParts(row.earned_at || row.created_at || row.awarded_at);
      items.push({ year: yearOf(row.year) || d.year, month: row.year && !row.created_at && !row.awarded_at ? '' : d.month, date: d.stamp, type: 'award', icon: 'trophy', title: row.title || row.badge_key || 'إنجاز', meta: row.proof || row.signed_by || (hasProof(row) ? 'اعتماد الجهة' : 'إنجاز مضاف للملف'), verified: hasProof(row) });
    });
    data.certs.filter(function (row) { return row.title; }).forEach(function (row) {
      var d = dateParts(row.created_at || row.issued_at);
      items.push({ year: yearOf(row.year) || d.year, month: d.month, date: d.stamp, type: 'award', icon: 'trophy', title: row.title, meta: [row.issuer, hasProof(row) ? 'اعتماد الجهة' : 'شهادة مضافة'].filter(Boolean).join(' · '), verified: hasProof(row) });
    });
    data.matches.forEach(function (match) {
      var attended = data.joins.some(function (join) { return isAttended(join) && String(join.match_id) === String(match.id); });
      if (!attended || !isCompleted(match)) return;
      var officialDate = matchDate(match);
      var d = dateParts(officialDate || (!yearOf(match.comp) ? match.created_at : ''));
      var title = match.comp || match.title || match.name || 'مشاركة رسمية';
      items.push({ year: d.year || yearOf(match.comp), month: d.month, date: d.stamp, type: 'tournament', icon: 'match', title: title, meta: match.demo ? 'مشاركة تجريبية' : (match.title && match.comp ? match.title : 'مشاركة موثّقة'), verified: !previewDemoMode() && !match.demo, matchId: String(match.id), matchTitle: match.title || match.name || '' });
    });
    data.events.forEach(function (event) {
      var kind = readableType(event.type);
      if (!kind) return;
      var match = event.matches || null;
      var officialDate = matchDate(match);
      var d = dateParts(officialDate || (!yearOf(match && match.comp) ? event.created_at || match && match.created_at : ''));
      var seasonYear = yearOf(match && match.comp);
      items.push({ year: d.year, month: d.month, date: d.stamp, type: kind.kind, icon: kind.icon, title: kind.label, meta: [event.matches && (event.matches.title || event.matches.comp), event.minute ? event.minute + '′' : ''].filter(Boolean).join(' · '), verified: !previewDemoMode() && !!(event.recorded_by || event._verified_public), matchId: event.match_id ? String(event.match_id) : '', matchTitle: event.matches && (event.matches.title || event.matches.name) || '' });
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
      var month = monthNames.indexOf(item.month) >= 0 ? item.month : '';
      var key = (item.year || 'journey') + '|' + (month || (item.year ? 'season' : 'journey'));
      (grouped[key] || (grouped[key] = { year: item.year, month: month || (item.year ? 'خلال الموسم' : 'مسار اللاعب'), items: [] })).items.push(item);
    });
    return Object.keys(grouped).map(function (key) { return grouped[key]; }).sort(function (a, b) {
      return Number(b.year || 0) - Number(a.year || 0) || (monthNames.indexOf(b.month) - monthNames.indexOf(a.month));
    });
  }
  function academyStations(player, data) {
    var stations = data.career.filter(function (row) { return hasProof(row) && row.org; }).map(function (row) {
      return { name: row.org, year: yearOf(row.from_year || row.to_year), meta: [row.group_name, row.title].filter(Boolean).join(' · '), icon: 'academy' };
    });
    data.alumni.filter(function (row) { return hasProof(row) && row.dest; }).forEach(function (row) {
      stations.push({ name: row.dest, year: yearOf(row.dest_year), meta: 'انتقال موثّق', icon: 'arrow' });
    });
    var identityOrg = player.identity_org || player.org;
    if (identityOrg) stations.push({ name: identityOrg, year: '', meta: 'الأكاديمية الحالية المسجلة', icon: 'academy', current: true });
    var unique = [];
    stations.forEach(function (station) {
      var existing = unique.find(function (s) { return norm(s.name) === norm(station.name); });
      if (!existing) unique.push(station);
      else if (station.current) { existing.current = true; existing.meta = station.meta; existing.year = ''; }
    });
    unique.sort(function (a, b) { return Number(a.year || 9999) - Number(b.year || 9999); });
    return unique;
  }
  function foldMatchMoments(items) {
    var moments = [], byMatch = {};
    items.forEach(function (item) {
      if (!item.matchId || !['tournament', 'goal', 'assist', 'match'].includes(item.type)) { moments.push(item); return; }
      var key = item.year + '|' + item.month + '|' + item.matchId;
      var moment = byMatch[key];
      if (!moment) {
        moment = byMatch[key] = { year: item.year, month: item.month, date: item.date, type: 'match', icon: 'match', title: item.type === 'tournament' ? item.title : (item.matchTitle || item.title), meta: item.type === 'tournament' ? (item.matchTitle || 'مشاركة موثّقة') : 'لحظة من المباراة', verified: item.type === 'tournament' && item.verified, goals: [], assists: [], matchId: item.matchId };
        moments.push(moment);
      }
      if (item.type === 'tournament') {
        moment.title = item.title;
        moment.meta = item.matchTitle || item.meta || (previewDemoMode() ? 'مشاركة تجريبية' : 'مشاركة موثّقة');
        moment.verified = !!item.verified;
      } else if (item.type === 'match' && item.verified) {
        moment.verified = true;
        moment.meta = item.meta || moment.meta;
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
    var isDemo = previewDemoMode();
    var proof = isDemo ? 'سجل تجريبي · غير موثّق' : (item.type === 'goal' || item.type === 'assist' ? 'مسجّل' : item.verified ? 'موثّق' : 'مضاف');
    var signals = [];
    if (item.goals && item.goals.length) signals.push('<span class="pj-signal pj-signal-goal">' + icon('goal') + '<b>' + e(item.goals.length) + ' أهداف</b></span>');
    if (item.assists && item.assists.length) signals.push('<span class="pj-signal pj-signal-assist">' + icon('assist') + '<b>' + e(item.assists.length) + ' صناعة</b></span>');
    if (item.goals && item.goals.some(function (x) { return x.minute; })) signals.push('<small class="pj-minute-list">' + e(item.goals.map(function (x) { return x.minute; }).filter(Boolean).join(' · ')) + '</small>');
    return '<article class="pj-event pj-event-' + e(item.type) + '"><span class="pj-event-icon">' + icon(item.icon) + '</span><div class="pj-event-copy"><b>' + e(item.title) + '</b>' + (item.meta ? '<small>' + e(item.meta) + '</small>' : '') + (signals.length ? '<span class="pj-event-signals">' + signals.join('') + '</span>' : '') + '</div><span class="pj-event-proof" title="' + proof + '">' + (isDemo ? 'تجريبي' : item.verified ? '✓' : '•') + '</span></article>';
  }
  function verifiedMomentCount(group) {
    return group.items.reduce(function (sum, item) {
      if (previewDemoMode()) {
        var demoValue = ['match', 'goal', 'assist', 'award', 'academy', 'move'].includes(item.type) ? 1 : 0;
        return sum + demoValue + (item.goals || []).length + (item.assists || []).length;
      }
      var value = 0;
      if (item.verified && ['match', 'goal', 'assist', 'award', 'academy', 'move'].includes(item.type)) value++;
      if (item.goals) value += item.goals.filter(function (event) { return event.verified; }).length;
      if (item.assists) value += item.assists.filter(function (event) { return event.verified; }).length;
      return sum + value;
    }, 0);
  }
  function monthStamp(group) {
    var month = monthNames.indexOf(group.month);
    return group.year && month >= 0 ? Number(group.year) * 12 + month : null;
  }
  function seasonPulse(items) {
    var groups = monthTimeline(foldMatchMoments(items)).filter(function (group) {
      return monthStamp(group) !== null && verifiedMomentCount(group) > 0;
    }).map(function (group) {
      return { label: group.month, year: group.year, stamp: monthStamp(group), value: verifiedMomentCount(group) };
    }).sort(function (a, b) { return a.stamp - b.stamp; });
    if (!groups.length) return '';

    // Keep a useful editorial window, but space points by calendar time. A
    // quiet interval becomes a longer gap; it is never drawn as a zero score.
    var latest = groups[groups.length - 1].stamp;
    var points = groups.filter(function (point) { return point.stamp >= latest - 35; });
    var span = points[points.length - 1].stamp - points[0].stamp;
    var width = span ? Math.max(360, 40 + span * 42) : 360;
    var slot = span ? (width - 40) / span : 42;
    var left = span ? 20 : width / 2, bottom = 95, top = 18;
    var max = Math.max.apply(null, points.map(function (point) { return point.value; }).concat([1]));
    points.forEach(function (point) {
      point.x = span ? left + (point.stamp - points[0].stamp) * slot : width / 2;
      point.y = bottom - (Math.sqrt(point.value) / Math.sqrt(max)) * (bottom - top - 7);
      point.r = 4 + Math.min(5, Math.sqrt(point.value) * 1.35);
    });
    var path = points.map(function (point, index) { return (index ? 'L' : 'M') + point.x.toFixed(1) + ' ' + point.y.toFixed(1); }).join(' ');
    var area = path + ' L' + points[points.length - 1].x.toFixed(1) + ' ' + bottom + ' L' + points[0].x.toFixed(1) + ' ' + bottom + ' Z';
    var marks = points.map(function (point) {
      var title = point.label + ' ' + point.year + ' · ' + point.value + (previewDemoMode() ? ' أحداث تجريبية' : ' لحظات موثقة');
      return '<g class="pj-pulse-point" aria-label="' + e(title) + '"><title>' + e(title) + '</title><line x1="' + point.x.toFixed(1) + '" y1="' + point.y.toFixed(1) + '" x2="' + point.x.toFixed(1) + '" y2="' + bottom + '"/><circle class="pj-pulse-halo" cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="' + (point.r + 5).toFixed(1) + '"/><circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="' + point.r.toFixed(1) + '"/><text x="' + point.x.toFixed(1) + '" y="' + (bottom + 17) + '" text-anchor="middle">' + e(point.label) + '</text><text class="pj-pulse-year" x="' + point.x.toFixed(1) + '" y="' + (bottom + 29) + '" text-anchor="middle">' + e(point.year) + '</text></g>';
    }).join('');
    var svgWidth = Math.round(width);
    return '<section class="pj-pulse" aria-label="أحداث اللاعب حسب الشهر"><div class="pj-pulse-head"><div><span class="pj-label">PLAYER ACTIVITY · MONTHLY</span><h3>النشاط الشهري</h3><p>الأهداف والمشاركات والإنجازات المسجلة في كل شهر.</p></div><span class="pj-pulse-key"><i></i> شهر فيه سجل</span></div><div class="pj-pulse-graph" tabindex="0" aria-label="مخطط نشاط اللاعب حسب الشهر"><svg width="' + svgWidth + '" height="132" viewBox="0 0 ' + svgWidth + ' 132" role="img" aria-label="الأحداث المسجلة حسب الشهر"><defs><linearGradient id="pjPulseArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#48d9ff" stop-opacity=".3"/><stop offset="1" stop-color="#4436d8" stop-opacity="0"/></linearGradient></defs><path class="pj-pulse-grid" d="M16 23h' + (svgWidth - 32) + 'M16 59h' + (svgWidth - 32) + 'M16 95h' + (svgWidth - 32) + '"/><path class="pj-pulse-area" d="' + area + '"/><path class="pj-pulse-line" d="' + path + '"/>' + marks + '</svg></div><p class="pj-pulse-foot">الإنجازات المسجلة للموسم تظهر ضمن الموسم، إذا لم يُحدد شهرها.</p></section>';
  }
  function seasonAtlas(items) {
    var groups = monthTimeline(foldMatchMoments(items));
    if (!groups.length) return '<div class="pj-empty-trail"><span class="pj-empty-mark">' + icon('star') + '</span><div><b>المسيرة تنتظر أول لحظة مسجلة</b><small>تظهر المشاركات والإنجازات في شهرها المسجل، أما الإنجاز السنوي غير محدد الشهر فيبقى ضمن موسمه.</small></div></div>';
    var years = [...new Set(groups.map(function (g) { return g.year; }).filter(Boolean))];
    var stream = '';
    groups.forEach(function (group, index) {
      stream += '<section class="pj-month-group" data-pj-group-year="' + e(group.year || 'غير مؤرخ') + '"><div class="pj-month-marker"><span></span><b>' + e(group.month) + '</b>' + (group.year ? '<small>' + e(group.year) + '</small>' : '') + '</div><div class="pj-month-events">' + group.items.map(eventRow).join('') + '</div></section>';
      var older = groups[index + 1];
      var newerStamp = monthStamp(group), olderStamp = older && monthStamp(older);
      var emptyMonths = newerStamp !== null && olderStamp !== null ? newerStamp - olderStamp - 1 : 0;
      if (older && emptyMonths > 0) {
        var gapHeight = Math.min(62, 12 + emptyMonths * 8);
        stream += '<div class="pj-time-gap" data-pj-gap-year="' + e(group.year || 'غير مؤرخ') + '" style="--pj-gap-height:' + gapHeight + 'px" title="فترة بين السجلات"><i></i><small>فترة بين السجلات</small></div>';
      }
    });
    return '<div class="pj-atlas-head"><span class="pj-atlas-line"></span><div class="pj-year-orbit" role="tablist" aria-label="تصفية الرحلة حسب السنة"><button class="pj-year-node is-selected" role="tab" type="button" data-pj-year="all" aria-selected="true" aria-pressed="true"><i>الكل</i><small>المسيرة</small></button>' + years.map(function (year) { return '<button class="pj-year-node" role="tab" type="button" data-pj-year="' + e(year) + '" aria-selected="false" aria-pressed="false"><i>' + e(year) + '</i><small>الموسم</small></button>'; }).join('') + '</div></div><div class="pj-month-stream">' + stream + '</div>';
  }
  function academyRoute(player, data) {
    var stations = academyStations(player, data).slice(-5);
    var hasVerifiedHistory = data.career.some(function (row) { return hasProof(row) && row.org; }) || data.alumni.some(function (row) { return hasProof(row) && row.dest; });
    if (!stations.length) return '';
    var dots = stations.length ? stations.map(function (station, i) {
      var label = station.year || (station.current ? 'الحالية' : 'موثّق');
      return '<span class="pj-route-dot ' + (station.current ? 'live' : '') + '" style="--step:' + i + ';--offset:' + (i % 2 ? '10px' : '-10px') + '"><i>' + e(label) + '</i><small>' + e(station.name) + '</small></span>';
    }).join('') : '<span class="pj-route-origin">أول محطة موثّقة تظهر بعد اعتمادها</span>';
    var path = stations.length > 1 ? '<path class="pj-route-path" d="M15 83 C78 83 74 34 139 43 S204 87 251 58 S333 28 425 35"/>' : '';
    var title = stations.length > 1 ? 'محطات أكاديمية موثّقة' : 'الأكاديمية الحالية المسجلة';
    var eyebrow = hasVerifiedHistory ? 'ACADEMY HISTORY · VERIFIED' : 'CURRENT ACADEMY';
    var countLabel = hasVerifiedHistory ? 'سجل معتمد' : 'المحطة الحالية';
    var caption = hasVerifiedHistory ? 'المحطات المعروضة معتمدة من الأكاديمية.' : 'اسم الأكاديمية كما هو مسجل في الهوية؛ لا يفترض انتقالًا سابقًا.';
    return '<section class="pj-route"><div class="pj-route-top"><div><span class="pj-label">' + eyebrow + '</span><h3>' + title + '</h3></div><span class="pj-route-count">' + countLabel + '</span></div><div class="pj-route-art"><svg viewBox="0 0 440 118" preserveAspectRatio="none" aria-hidden="true"><path class="pj-route-pitch" d="M0 10h440v98H0zM220 10v98m0-65a16 16 0 1 0 0 32 16 16 0 0 0 0-32M0 39h54v40H0m440-40h-54v40h54"/>' + path + '</svg><div class="pj-route-dots">' + dots + '</div></div><p class="pj-route-caption">' + caption + '</p></section>';
  }
  function playerCityFeature(player) {
    var city = String(player.identity_city || player.city || player.home_city || player.region || '').trim();
    // Riyadh is a user-directed geographic marker for this player, not an inferred academy transfer.
    if (!city && String(player.athlete_id || '').toUpperCase() === 'PI-89A89D4D') city = 'الرياض';
    if (!city) return '';
    if (/^(riyadh|ar[ -]?riyadh|الرياض)$/i.test(city)) city = 'الرياض';
    return '<section class="pj-city-anchor" aria-label="مدينة اللاعب"><span class="pj-city-signal">' + icon('pin') + '<i></i></span><div class="pj-city-copy"><span class="pj-label">PLAYER CITY</span><b>' + e(city) + '</b><small>المدينة</small></div><span class="pj-city-seal">الموقع</span></section>';
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
      return '<article class="pj-cup-stop"><span class="pj-cup-wire" aria-hidden="true"></span><span class="pj-cup-emblem ' + (i === 0 ? 'gold' : i === 1 ? 'purple' : '') + '">' + icon('trophy') + '</span><div><b>' + e(cup.name) + '</b><small>' + (previewDemoMode() ? (cup.appearances > 1 ? e(cup.appearances) + ' مشاركات تجريبية' : 'مشاركة تجريبية') : (cup.appearances > 1 ? e(cup.appearances) + ' مشاركات موثقة' : 'مشاركة موثقة')) + (cup.last ? ' · ' + e(yearOf(cup.last)) : '') + '</small></div></article>';
    }).join('') + '</div>';
  }
  function honors(data) {
    var items = data.badges.concat(data.certs.filter(function (row) { return row.title; }).map(function (row) { return { title: row.title, proof: row.issuer, verified_by: row.verified_by }; })).sort(function (a, b) { return Number(hasProof(b)) - Number(hasProof(a)); }).slice(0, 6);
    if (!items.length) return '<div class="pj-honor-empty"><span class="pj-honor-empty-orbit">' + icon('trophy') + '</span><div><b>لا توجد إنجازات معتمدة بعد</b><small>تظهر هنا بعد اعتمادها من الأكاديمية.</small></div><span class="pj-honor-empty-stars" aria-hidden="true">✦　✧　✦</span></div>';
    var demo = previewDemoMode();
    var verified = demo ? [] : items.filter(hasProof);
    var featured = verified[0] || items[0];
    return '<div class="pj-honor-field"><div class="pj-honor-feature">' + icon('trophy') + '<small>' + (demo ? 'أمثلة للعرض · غير معتمدة' : verified.length ? 'أقوى إشارة موثقة' : 'إنجاز أضافه اللاعب') + '</small><b>' + e(featured.title || featured.badge_key || 'إنجاز') + '</b><span>' + e(demo ? 'بيانات اختبار · لا تمثل إنجازًا حقيقيًا' : (featured.proof || featured.signed_by || (hasProof(featured) ? 'اعتماد الجهة' : 'بانتظار توثيق الجهة'))) + '</span></div><div class="pj-honor-constellation">' + items.slice(demo ? 0 : verified.length ? 1 : 0).map(function (item, index) { return '<div class="pj-honor-star ' + (!demo && hasProof(item) ? 'verified' : '') + '" style="--star:' + index + '"><span>' + icon('star') + '</span><b>' + e(item.title || item.badge_key || 'إنجاز') + '</b><small>' + (demo ? 'تجريبي' : hasProof(item) ? 'موثّق' : 'مضاف') + '</small></div>'; }).join('') + '</div></div>';
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
    if (!clips.length) return '<div class="pj-clips-empty"><span>' + icon('match') + '</span><p>لا توجد لقطات متاحة الآن.</p></div>';
    return '<div class="pj-clips">' + clips.map(function (item) { return '<a class="pj-clip" href="' + e(item.url) + '" target="_blank" rel="noopener noreferrer"><span>' + icon(item.kind === 'video' ? 'match' : 'star') + '</span><b>' + e(item.label || item.match_title || 'لقطة موثقة') + '</b><small>' + e(item.match_title || 'من سجل المباراة') + ' ↗</small></a>'; }).join('') + '</div>';
  }
  function journeyView(player, data, owner) {
    var items = groupHistory(data);
    var identityPosition = player.identity_position || player.position_code || player.pos_en || player.pos || (previewDemoMode() ? 'RB' : '');
    var years = [...new Set(items.map(function (item) { return item.year; }).filter(Boolean))].sort();
    var yearRange = years.length ? years[0] + (years.length > 1 ? ' — ' + years[years.length - 1] : '') : 'PLAYER ARC';
    var arcSeal = previewDemoMode() ? 'معاينة تجريبية' : (player.verified === true || player.is_verified === true || player.verification_status === 'verified' ? 'موثّق' : 'مسار اللاعب');
    return '<section class="pj-journey" aria-label="المسيرة"><header class="pj-heading"><div><span class="pj-label">PLAYER PROFILE · ' + e(yearRange) + '</span><h2>المسيرة</h2><p>المشاركات والإنجازات المسجلة.</p></div><span class="pj-arc-seal"><i></i> ' + arcSeal + '</span></header>'+ 
      playerCityFeature(player)+academyRoute(player, data)+seasonPulse(items)+
      '<section class="pj-story-section pj-atlas"><div class="pj-section-title"><div><span class="pj-label">SEASONS · MONTHS · RECORDS</span><h3>سجل اللاعب</h3><p>اختر السنة لعرض السجل.</p></div><span class="pj-title-glyph purple">' + icon('arrow') + '</span></div>' + seasonAtlas(items) + '</section>'+
      '<section class="pj-story-section"><div class="pj-section-title"><div><span class="pj-label">TOURNAMENTS</span><h3>البطولات</h3><p>مشاركات اللاعب المسجلة.</p></div><span class="pj-title-glyph gold">' + icon('trophy') + '</span></div>' + tournamentTrail(data) + '</section>'+
      '<section class="pj-story-section pj-proof-deck pj-proof-deck-honors"><div class="pj-proof-column"><div class="pj-section-title"><div><span class="pj-label">ACHIEVEMENTS</span><h3>الإنجازات</h3></div><span class="pj-title-glyph gold">' + icon('star') + '</span></div>' + honors(data) + '</div><div class="pj-proof-column"><div class="pj-section-title"><div><span class="pj-label">POSITION</span><h3>مركز اللاعب</h3></div><span class="pj-title-glyph cyan">' + icon('match') + '</span></div>' + roleMap(Object.assign({}, player, { identity_position: identityPosition })) + '</div></section>'+
      '<section class="pj-story-section"><div class="pj-section-title"><div><span class="pj-label">MATCH CLIPS</span><h3>لقطات المباريات</h3></div><span class="pj-title-glyph cyan">' + icon('match') + '</span></div>' + clipReel(data) + '</section>'+
      '<footer class="pj-footnote"><span>PLAYIN365</span><small>' + (owner ? 'تحكم بما يظهر في ملفك.' : (previewDemoMode() ? 'سجل تجريبي · لا يمثل توثيقًا حقيقيًا.' : 'بيانات منشورة وموثّقة.')) + '</small></footer></section>';
  }
  function completedMatches(events, joins, records) {
    var matches = {};
    (events || []).forEach(function (event) { if (event.matches && event.matches.id) matches[String(event.matches.id)] = event.matches; });
    (records || []).forEach(function (match) { matches[String(match.id)] = match; });
    return Object.keys(matches).map(function (key) { return matches[key]; });
  }
  async function loadHistory(player, preloaded, publicMode) {
    var who = player.name;
    var eventQuery = sb.from('match_events').select(publicMode ? 'id,match_id,minute,type,who,created_at' : '*').eq('who', who).order('created_at', { ascending: true }).limit(200);
    // Public history must only include events with an academy recorder. The
    // recorder ID stays out of the public payload; RLS remains the real gate.
    if (publicMode) eventQuery = eventQuery.not('recorded_by', 'is', null);
    var results = await Promise.all([
      preloaded ? Promise.resolve(preloaded.events || []) : safe('journey-events', eventQuery),
      preloaded ? Promise.resolve(preloaded.joins || []) : safe('journey-joins', sb.from('match_joins').select(publicMode ? 'match_id,player_name,attended' : '*').eq('player_name', who).limit(300)),
      preloaded ? Promise.resolve(preloaded.badges || []) : safe('journey-badges', sb.from('pi_badges').select(publicMode ? 'badge_key,title,earned_at,signed_by,match_id,match_title' : '*').eq('person', who).limit(60)),
      safe('journey-career', sb.from('pi_career').select(publicMode ? 'org,title,group_name,from_year,to_year,verified_by,verified_at,created_at' : '*').eq('person', who).order('from_year', { ascending: true }).limit(60)),
      safe('journey-certs', sb.from('pi_certs').select(publicMode ? 'title,issuer,level,year,verified_by,verified_at,created_at' : '*').eq('person', who).order('year', { ascending: true }).limit(40)),
      safe('journey-alumni', sb.from('pi_alumni').select(publicMode ? 'player_name,dest,group_name,dest_year,verified_by,verified_at,created_at' : '*').eq('player_name', who).order('dest_year', { ascending: true }).limit(40)),
      publicMode ? Promise.resolve([]) : safe('journey-media', sb.from('pi_media').select('*').eq('subject', who).limit(40))
    ]);
    var events = results[0] || [], joins = results[1] || [], ids = [...new Set(events.map(function (event) { return event.match_id; }).concat(joins.map(function (join) { return join.match_id; })).filter(Boolean))].slice(0, 100);
    var matches = [];
    if (ids.length) matches = await safe('journey-matches', sb.from('matches').select(publicMode ? 'id,title,comp,venue,match_date,match_time,status,score_a,score_b,team_a,team_b,kickoff_at,starts_at' : '*').in('id', ids));
    if (publicMode) events.forEach(function (event) { event._verified_public = true; });
    matches = completedMatches(events, joins, matches);
    var matchById = {};
    matches.forEach(function (match) { matchById[String(match.id)] = match; });
    events.forEach(function (event) { if (!event.matches && matchById[String(event.match_id)]) event.matches = matchById[String(event.match_id)]; });
    return { events: events, joins: joins, badges: results[2] || [], career: results[3] || [], certs: results[4] || [], alumni: results[5] || [], media: results[6] || [], matches: matches };
  }

  var cardCapture = null;
  P.identityCard = function (events, joins, badges) {
    var player = ME ? Object.assign({}, ME) : null;
    if (previewDemoMode() && player) {
      player = Object.assign(player, { age_group: 'U14', category: 'U14', age: 14, jersey_number: '18', shirt_number: '18', shirt: '18', position_code: 'RB', pos_en: 'RB', pos: 'RB', preferred_foot: 'Right foot', foot: 'Right foot', org: player.org || 'أكاديمية النخبة — بيانات تجريبية' });
      var sample = demoHistory(player); events = sample.events; joins = sample.joins; badges = sample.badges;
    }
    cardCapture = { events: events || [], joins: joins || [], badges: badges || [], position: player && (player.position_code || player.pos_en || player.pos || ''), org: player && (player.org || ''), player: player };
    var previous = ME;
    try { if (previewDemoMode() && player) ME = player; return baseIdentityCard.call(this, events, joins, (badges || []).slice(0, 2)); }
    finally { ME = previous; }
  };

  P.myCard = async function () {
    cardCapture = null;
    var markup = await baseMyCard.apply(this, arguments);
    try {
      var player = Object.assign({}, cardCapture && cardCapture.player || ME, { identity_position: cardCapture && cardCapture.position || (ME && (ME.position_code || ME.pos_en || ME.pos || '')), identity_org: cardCapture && cardCapture.org || (ME && (ME.org || '')) });
      if (previewDemoMode()) player = Object.assign(player, { org: player.org || 'أكاديمية النخبة — بيانات تجريبية', identity_org: player.identity_org || player.org, age_group: player.age_group || (player.age ? 'U' + player.age : 'U14'), jersey_number: player.jersey_number || player.shirt || '18', position_code: player.position_code || player.pos || 'RB' });
      var history = previewDemoMode() ? demoHistory(player) : await loadHistory(player, cardCapture);
      var inbox = player && ME && ME.id && ME.role === 'player' ? await contactInbox(ME.id) : '';
      var contactPreview = player && player.role === 'player' ? '<div class="pi-id-actions pj-public-actions pj-contact-owner-preview"><button class="pj-contact-trigger" type="button" data-pj-contact-preview>طلب تواصل</button><small class="pj-contact-owner-note">يظهر للجهات الموثّقة عند زيارة ملفك العام.</small></div>' : '';
      var mount = '<div class="pj-mount">' + journeyView(player, history, true) + '</div>';
      var shareNote = maySharePublic(player) ? '' : '<p class="pj-share-note">رمز الهوية يفتح الملف عند نشره للعامة؛ إعداد الظهور هو الذي يحدد إتاحة الصفحة.</p>';
      var demoNotice = previewDemoMode() ? '<aside class="pj-demo-banner" role="status"><span>PREVIEW</span><b>بيانات تجريبية</b><small>سجل عرض فقط · لا يُحفظ في قاعدة البيانات</small></aside>' : '';
      return markup.replace('</main>', demoNotice + shareNote + contactPreview + inbox + mount + '</main>');
    } catch (error) {
      console.warn('PlayIn365 player journey', error);
      return markup;
    }
  };
  P.bind('myCard', P.myCard);
  P.bind('publicView', P.myCard);

  var baseGuardianPage = T.guardian;
  if (typeof baseGuardianPage === 'function') T.guardian = async function () {
    var markup = await baseGuardianPage.apply(this, arguments);
    var inbox = await contactInbox(ME && ME.id);
    return markup.replace('</main>', inbox + '</main>');
  };

  document.addEventListener('click', function (event) {
    var target = event.target;
    var previewButton = target.closest && target.closest('[data-pj-contact-preview]');
    if (previewButton) { shareNotice('يظهر زر التواصل للجهات الموثّقة عند زيارة ملفك العام.'); return; }
    var openButton = target.closest && target.closest('[data-pj-contact-open]');
    if (openButton) { window.PJContact.open(openButton.getAttribute('data-target-id')); return; }
    var closeButton = target.closest && target.closest('[data-pj-contact-close]');
    if (closeButton) { window.PJContact.close(); return; }
    var submitButton = target.closest && target.closest('[data-pj-contact-submit]');
    if (submitButton) { window.PJContact.submit(); return; }
    var decisionButton = target.closest && target.closest('[data-pj-contact-decision]');
    if (decisionButton) {
      decisionButton.disabled = true;
      Promise.resolve(window.PJContact.decide(decisionButton.getAttribute('data-request-id'), decisionButton.getAttribute('data-pj-contact-decision')))
        .catch(function () { shareNotice('تعذر تحديث الطلب. حاول مرة أخرى.'); })
        .finally(function () { if (decisionButton.isConnected) decisionButton.disabled = false; });
      return;
    }
    var modal = target.closest && target.closest('#pj-contact-modal');
    if (modal && target === modal) window.PJContact.close();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') window.PJContact.close();
  });
  document.addEventListener('change', function (event) {
    if (!event.target || event.target.id !== 'pj-contact-method') return;
    var field = document.getElementById('pj-contact-value');
    if (field) field.setAttribute('inputmode', event.target.value === 'phone' ? 'tel' : 'email');
  });

  document.addEventListener('click', function (event) {
    var copyButton = event.target.closest && event.target.closest('.pi-id-actions button');
    if (copyButton && copyButton.textContent.trim() === 'انسخ رابط الهوية') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!maySharePublic(ME)) return shareNotice('الهوية غير منشورة للعامة بعد.');
      var playerName = String(ME.name || '').trim();
      var shareUrl = location.origin + location.pathname + '?player=' + encodeURIComponent(playerName);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(shareUrl).then(function () { shareNotice('تم نسخ رابط الهوية العامة.'); }).catch(function () { shareNotice('تعذر نسخ الرابط من هذا المتصفح.'); });
      else shareNotice('النسخ غير متاح في هذا المتصفح.');
      return;
    }
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
    atlas.querySelectorAll('[data-pj-gap-year]').forEach(function (gap) {
      gap.hidden = year !== 'all' && gap.getAttribute('data-pj-gap-year') !== year;
    });
  });

  async function renderPublicProfile(name) {
    var who = String(name || '').trim();
    if (!who) return '<main><div class="card">لم يُحدّد اللاعب.</div></main>';
    var records = previewDemoMode() ? [] : await safe('journey-profile', sb.from('profiles').select('id,name,role,org,pos,age,shirt,athlete_id,avatar_url,handle,display_name,city,profile_visibility').eq('name', who).eq('role', 'player').eq('profile_visibility', 'public').limit(1));
    var source = records[0];
    if (!source && previewDemoMode() && ME && ME.role === 'player' && norm(ME.name) === norm(who)) source = Object.assign({}, ME, { profile_visibility: 'public' });
    if (!source) return '<div class="pi-id-page"><header class="pz5-top">' + P.brand() + '</header><main class="pi-id-main"><div class="pj-not-found"><span>' + icon('academy') + '</span><b>الهوية غير متاحة</b><small>تأكد من الرابط ومن تفعيل نشر الهوية للعامة.</small></div></main></div>';
    var player = Object.assign({}, source, {
      display_name: source.display_name || source.name,
      age_group: source.age_group || (source.age ? 'U' + source.age : ''),
      jersey_number: source.jersey_number || source.shirt,
      position_code: source.position_code || source.pos,
      identity_position: source.position_code || source.pos || '',
      identity_org: source.org || ''
    });
    if (previewDemoMode()) player = Object.assign(player, { age_group: 'U14', category: 'U14', age: 14, jersey_number: '18', shirt_number: '18', shirt: '18', position_code: 'RB', pos_en: 'RB', pos: 'RB', identity_position: 'RB', preferred_foot: 'Right foot', foot: 'Right foot', org: player.org || 'أكاديمية النخبة — بيانات تجريبية', identity_org: player.identity_org || player.org });
    var history = previewDemoMode() ? demoHistory(player) : await loadHistory(player, null, true);
    var previous = ME;
    var card = '';
    try { ME = player; card = P.identityCard(history.events, history.joins, history.badges); }
    finally { ME = previous; }
    var demoNotice = previewDemoMode() ? '<aside class="pj-demo-banner" role="status"><span>PREVIEW</span><b>بيانات تجريبية</b><small>سجل عرض فقط · لا يُحفظ في قاعدة البيانات</small></aside>' : '';
    return '<div class="pi-id-page pj-public-page">' + P.top("history.back()") + '<main class="pi-id-main">' + demoNotice + '<div class="pj-public-heading"><span class="pj-label">PLAYER IDENTITY</span><h1>هوية اللاعب</h1><p>البطاقة، المسيرة، والإنجازات.</p></div>' + card + '<div class="pi-id-actions pj-public-actions"><button class="primary" onclick="window.PZ.share(\'' + e(player.name) + '\')">شارك الهوية ↗</button><button class="pj-contact-trigger" type="button" data-pj-contact-open data-target-id="' + e(player.id) + '">طلب تواصل</button></div>' + contactModalMarkup(player) + '<div class="pj-mount">' + journeyView(player, history, false) + '</div></main></div>';
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
