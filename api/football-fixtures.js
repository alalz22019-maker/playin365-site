const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function riyadhDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function json(res, status, body, cacheSeconds = 30) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${Math.max(60, cacheSeconds * 4)}`);
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('x-playin-fixtures-source', body.source || 'unknown');
  res.end(JSON.stringify(body));
}

function emptyPayload(date, source, configured, warning) {
  return {
    ok: true,
    configured,
    live: false,
    source,
    date,
    results: 0,
    fixtures: [],
    matches: [],
    response: [],
    data: [],
    warning: warning || null,
    message_ar: configured
      ? 'تعذر تحديث المباريات الخارجية مؤقتًا؛ بقية تجربة PlayIn365 مستمرة.'
      : 'الربط الخارجي للمباريات في الحالة التجريبية ولم يُفعّل بعد.'
  };
}

function mapFixture(row) {
  const fixture = row && row.fixture || {};
  const teams = row && row.teams || {};
  return {
    id: fixture.id || row.id || null,
    kickoff_at: fixture.date || row.date || null,
    timestamp: fixture.timestamp || null,
    timezone: fixture.timezone || 'UTC',
    venue: fixture.venue || row.venue || null,
    referee: fixture.referee || row.referee || null,
    status: fixture.status || row.status || null,
    league: row.league || null,
    home: teams.home || row.home || null,
    away: teams.away || row.away || null,
    goals: row.goals || null,
    score: row.score || null,
    events: row.events || []
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET');
    return json(res, 405, { ok: false, source: 'playin', error: 'method_not_allowed' }, 0);
  }

  const requested = String(req.query && req.query.date || '').trim();
  const date = DATE_RE.test(requested) ? requested : riyadhDate();
  const key = process.env.API_FOOTBALL_KEY || process.env.APISPORTS_KEY || process.env.API_SPORTS_KEY || '';
  if (!key) return json(res, 200, emptyPayload(date, 'experimental_fallback', false), 20);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const upstream = await fetch(`https://v3.football.api-sports.io/fixtures?date=${encodeURIComponent(date)}`, {
      headers: { 'x-apisports-key': key, accept: 'application/json' },
      signal: controller.signal
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || !payload || !Array.isArray(payload.response)) {
      return json(res, 200, emptyPayload(date, 'provider_fallback', true, `upstream_${upstream.status}`), 15);
    }
    const mapped = payload.response.map(mapFixture);
    return json(res, 200, {
      ok: true,
      configured: true,
      live: true,
      source: 'api-football',
      date,
      results: mapped.length,
      fixtures: mapped,
      matches: mapped,
      response: payload.response,
      data: mapped,
      paging: payload.paging || null,
      errors: payload.errors || []
    }, 60);
  } catch (error) {
    const reason = error && error.name === 'AbortError' ? 'provider_timeout' : 'provider_unavailable';
    return json(res, 200, emptyPayload(date, 'provider_fallback', true, reason), 15);
  } finally {
    clearTimeout(timer);
  }
};
