function envKey(provider, prefix) {
  return `${prefix}_${provider.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
}
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('allow', 'GET'); return json(res, 405, { error: 'method_not_allowed' }); }
  const provider = String((req.query && req.query.provider) || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(provider)) return json(res, 400, { error: 'invalid_provider' });
  const secret = process.env[envKey(provider, 'PLAYIN_WEBHOOK_SECRET')] || process.env.PLAYIN_WEBHOOK_SECRET;
  const verify = process.env[envKey(provider, 'PLAYIN_WEBHOOK_VERIFY')] || process.env.PLAYIN_WEBHOOK_VERIFY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.PLAYIN_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PLAYIN_SUPABASE_SERVICE_ROLE_KEY;
  return json(res, 200, {
    provider,
    ready: Boolean(secret && url && key),
    webhook_secret_configured: Boolean(secret),
    verification_token_configured: Boolean(verify),
    server_database_configured: Boolean(url && key),
    endpoint: `/api/integrations/webhook?provider=${encodeURIComponent(provider)}&integration_id=<integration_uuid>`
  });
};
