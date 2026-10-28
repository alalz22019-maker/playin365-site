'use strict';

function todayInRiyadh(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value || new Date());
  const values = {};
  parts.forEach(function (part) { values[part.type] = part.value; });
  return values.year + '-' + values.month + '-' + values.day;
}

function fallbackFixtures(date) {
  const liveKickoff = new Date(Date.now() - 62 * 60 * 1000);
  const liveStillToday = todayInRiyadh(liveKickoff) === date;
  const laLigaKickoff = new Date(date + 'T16:15:00+03:00');
  const laLigaElapsed = Math.floor((Date.now() - laLigaKickoff.getTime()) / 60000);
  const laLigaStatus = laLigaElapsed < 0 ? 'NS' : (laLigaElapsed < 90 ? 'LIVE' : 'FT');
  const laLigaGoals = laLigaStatus === 'NS' ? { home: null, away: null } : { home: 1, away: 1 };
  return [
    { id: 'fallback-roshn-' + date, date: liveStillToday ? liveKickoff.toISOString() : date + 'T18:00:00+03:00', status: liveStillToday ? 'LIVE' : 'NS', elapsed: liveStillToday ? 62 : null, home: 'الهلال', away: 'النصر', league_name: 'Saudi Pro League', country: 'Saudi Arabia', goals: liveStillToday ? { home: 2, away: 1 } : { home: null, away: null }, demo: true },
    { id: 'fallback-ucl-' + date, date: date + 'T20:30:00+03:00', status: 'NS', elapsed: null, home: 'ريال مدريد', away: 'بايرن ميونخ', league_name: 'UEFA Champions League', country: 'Europe', goals: { home: null, away: null }, demo: true },
    { id: 'fallback-epl-' + date, date: date + 'T22:00:00+03:00', status: 'NS', elapsed: null, home: 'أرسنال', away: 'مانشستر سيتي', league_name: 'Premier League', country: 'England', goals: { home: null, away: null }, demo: true },
    { id: 'fallback-laliga-' + date, date: laLigaKickoff.toISOString(), status: laLigaStatus, elapsed: laLigaStatus === 'LIVE' ? Math.min(laLigaElapsed, 90) : (laLigaStatus === 'FT' ? 90 : null), home: 'برشلونة', away: 'أتلتيكو مدريد', league_name: 'La Liga', country: 'Spain', goals: laLigaGoals, demo: true }
  ];
}

function sendFallback(res, date, reason) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    date: date,
    updated_at: new Date().toISOString(),
    mode: 'demo_fallback',
    source: 'synthetic',
    configured: false,
    reason: reason,
    fixtures: fallbackFixtures(date)
  });
}

module.exports = async function footballFixtures(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ error: 'method_not_allowed', fixtures: [] });
  }

  const today = todayInRiyadh();
  const requested = String((req.query && req.query.date) || '');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested === today ? requested : today;
  const explicitDemo = String((req.query && req.query.demo) || '') === '1';
  if (explicitDemo) return sendFallback(res, date, 'explicit_demo');

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return sendFallback(res, date, 'provider_not_configured');

  const url = new URL('https://v3.football.api-sports.io/fixtures');
  url.searchParams.set('date', date);
  url.searchParams.set('timezone', 'Asia/Riyadh');

  const controller = new AbortController();
  const timeout = setTimeout(function () { controller.abort(); }, 8000);

  try {
    const upstream = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'x-apisports-key': apiKey },
      signal: controller.signal
    });

    if (!upstream.ok) return sendFallback(res, date, 'provider_http_' + upstream.status);

    const payload = await upstream.json();
    if (payload.errors && Object.keys(payload.errors).length) return sendFallback(res, date, 'provider_error');

    const fixtures = (Array.isArray(payload.response) ? payload.response : [])
      .map(function (row) {
        const fixture = row && row.fixture || {};
        const teams = row && row.teams || {};
        const league = row && row.league || {};
        const goals = row && row.goals || {};
        return {
          id: fixture.id == null ? '' : String(fixture.id),
          date: fixture.date || '',
          status: fixture.status && fixture.status.short || '',
          elapsed: fixture.status && fixture.status.elapsed || null,
          home: teams.home && teams.home.name || '',
          away: teams.away && teams.away.name || '',
          league_name: league.name || '',
          country: league.country || '',
          goals: { home: goals.home == null ? null : goals.home, away: goals.away == null ? null : goals.away }
        };
      })
      .filter(function (fixture) { return fixture.id && fixture.home && fixture.away && fixture.date; });

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=300');
    return res.status(200).json({ date: date, updated_at: new Date().toISOString(), mode: 'live', source: 'api-football', configured: true, fixtures: fixtures });
  } catch (error) {
    return sendFallback(res, date, error && error.name === 'AbortError' ? 'provider_timeout' : 'provider_unavailable');
  } finally {
    clearTimeout(timeout);
  }
};
