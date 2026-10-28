const crypto = require('crypto');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROVIDER_RE = /^[a-z0-9][a-z0-9-]{1,79}$/;

function envKey(provider, prefix) {
  return `${prefix}_${provider.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
}

function providerSecret(provider) {
  return process.env[envKey(provider, 'PLAYIN_WEBHOOK_SECRET')] || process.env.PLAYIN_WEBHOOK_SECRET || '';
}

function verifyToken(provider) {
  return process.env[envKey(provider, 'PLAYIN_WEBHOOK_VERIFY')] || process.env.PLAYIN_WEBHOOK_VERIFY || '';
}

function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.PLAYIN_SUPABASE_URL || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PLAYIN_SUPABASE_SERVICE_ROLE_KEY || ''
  };
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function signatureMatches(raw, secret, signature) {
  const supplied = String(signature || '').trim().replace(/^sha256=/i, '');
  if (!supplied) return false;
  const digest = crypto.createHmac('sha256', secret).update(raw).digest();
  const hex = digest.toString('hex');
  const base64 = digest.toString('base64');
  return safeEqual(supplied.toLowerCase(), hex.toLowerCase()) || safeEqual(supplied, base64);
}

async function readRaw(req, limit = 1024 * 1024) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('payload_too_large'), { statusCode: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function getHeader(req, name) {
  const value = req.headers && req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

async function handler(req, res) {
  const provider = String((req.query && req.query.provider) || '').trim().toLowerCase();
  const integrationId = String((req.query && req.query.integration_id) || '').trim();

  if (!PROVIDER_RE.test(provider)) return json(res, 400, { error: 'invalid_provider' });

  if (req.method === 'GET') {
    const mode = String((req.query && (req.query['hub.mode'] || req.query.mode)) || '');
    const token = String((req.query && (req.query['hub.verify_token'] || req.query.verify_token)) || '');
    const challenge = String((req.query && (req.query['hub.challenge'] || req.query.challenge)) || '');
    const expected = verifyToken(provider);
    if (mode === 'subscribe' && expected && safeEqual(token, expected)) {
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      return res.end(challenge);
    }
    return json(res, 403, { error: 'verification_failed' });
  }

  if (req.method !== 'POST') {
    res.setHeader('allow', 'GET, POST');
    return json(res, 405, { error: 'method_not_allowed' });
  }
  if (!UUID_RE.test(integrationId)) return json(res, 400, { error: 'invalid_integration_id' });

  const secret = providerSecret(provider);
  const { url, key } = supabaseConfig();
  if (!secret || !url || !key) return json(res, 503, { error: 'integration_not_configured' });

  try {
    const raw = await readRaw(req);
    const signature = getHeader(req, 'x-playin-signature') || getHeader(req, 'x-hub-signature-256') || getHeader(req, 'x-webhook-signature') || getHeader(req, 'x-signature');
    if (!signatureMatches(raw, secret, signature)) return json(res, 401, { error: 'invalid_signature' });

    let payload;
    try { payload = raw.length ? JSON.parse(raw.toString('utf8')) : {}; }
    catch (_) { return json(res, 400, { error: 'invalid_json' }); }
    if (!payload || (typeof payload !== 'object')) return json(res, 400, { error: 'invalid_payload' });

    const eventType = String(getHeader(req, 'x-event-type') || payload.type || payload.event_type || payload.event || payload.object || 'event').slice(0, 160);
    const externalEventId = String(getHeader(req, 'x-event-id') || payload.id || payload.event_id || (payload.data && payload.data.id) || crypto.createHash('sha256').update(raw).digest('hex')).slice(0, 300);
    const requestId = String(getHeader(req, 'x-request-id') || getHeader(req, 'x-correlation-id') || crypto.randomUUID()).slice(0, 300);

    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/ingest_integration_webhook`, {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        'x-client-info': 'playin365-integration-webhook/1.0'
      },
      body: JSON.stringify({
        p_integration_id: integrationId,
        p_provider_code: provider,
        p_event_type: eventType,
        p_external_event_id: externalEventId,
        p_payload: payload,
        p_request_id: requestId
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return json(res, response.status >= 500 ? 502 : 400, { error: 'event_rejected', detail: result.message || result.error || 'unknown' });
    return json(res, 202, { accepted: true, event_id: result.event_id, request_id: requestId });
  } catch (error) {
    console.error('integration webhook', error);
    return json(res, error.statusCode || 500, { error: error.message === 'payload_too_large' ? error.message : 'internal_error' });
  }
};

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
