'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const base = process.env.BASE_URL || 'https://playin365.app';
const contract = require(path.join(process.cwd(), 'three-pillars-contract.json'));
const expectedPath = 'M500 0 A500 500 0 0 1 1000 500 L1000 750 A250 250 0 0 1 750 1000 L500 1000 A500 500 0 0 1 500 0 Z';
const expectedOrientation = { academy: 'TL', coach: 'BL', player: 'BR' };
const publicSlugs = ['org-c9884592', 'person-2915eb9f', 'person-b96eb24e', 'person-6510ef52', 'event-three-pillars-training'];
const ignoredUrl = (url) => /vercel\.live|googleapis\.com\/css|fonts\.gstatic\.com/.test(url);

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const report = {
    at: new Date().toISOString(),
    base,
    release: null,
    fixtures: null,
    roles: {},
    responsibilities: [],
    publicIdentities: [],
    errors: [],
    missing: [],
    unavailable: []
  };

  async function roleContext(role) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'ar-SA',
      timezoneId: 'Asia/Riyadh',
      serviceWorkers: 'block'
    });
    const page = await context.newPage();
    let current = 'boot';
    const errors = [];
    page.on('pageerror', (error) => errors.push({ route: current, type: 'pageerror', message: error.message }));
    page.on('console', (message) => {
      if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) {
        errors.push({ route: current, type: 'console', message: message.text() });
      }
    });
    page.on('requestfailed', (request) => {
      if (!ignoredUrl(request.url())) errors.push({ route: current, type: 'requestfailed', url: request.url(), message: request.failure() && request.failure().errorText });
    });
    page.on('response', (response) => {
      if (response.status() >= 400 && !ignoredUrl(response.url())) errors.push({ route: current, type: 'http', url: response.url(), message: String(response.status()) });
    });
    await page.goto(base + '/?p3production=' + role + '&t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(900);
    await page.evaluate((requestedRole) => demoLogin(requestedRole, null), role);
    await page.waitForFunction((requestedRole) => ME && ME.role === requestedRole, role, { timeout: 30000 });
    await page.waitForTimeout(1200);
    return { context, page, errors, setCurrent: (route) => { current = route; } };
  }

  const metaContext = await browser.newContext({ serviceWorkers: 'block' });
  const metaPage = await metaContext.newPage();
  await metaPage.goto(base + '/?p3meta=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
  report.release = await metaPage.evaluate(async () => {
    const response = await fetch('/release.json', { cache: 'no-store' });
    return { status: response.status, data: await response.json() };
  });
  report.fixtures = await metaPage.evaluate(async () => {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const response = await fetch('/api/football-fixtures?date=' + date, { cache: 'no-store' });
    const data = await response.json();
    return { status: response.status, data };
  });
  await metaContext.close();

  for (const [role, spec] of Object.entries(contract.roles)) {
    const session = await roleContext(role);
    const routes = [...new Set(contract.foundationRoutes.concat(spec.requiredRoutes))];
    const rows = [];
    for (const route of routes) {
      session.setCurrent(route);
      const before = session.errors.length;
      let evalError = null;
      try {
        await session.page.evaluate(async (targetRoute) => {
          VIEW = targetRoute;
          PARAM = null;
          await render();
        }, route);
      } catch (error) {
        evalError = error.message;
        session.errors.push({ route, type: 'eval', message: error.message });
      }
      await session.page.waitForTimeout(220);
      const state = await session.page.evaluate(() => {
        const main = document.querySelector('main');
        const text = (main && main.innerText || '').replace(/\s+/g, ' ').trim();
        const shape = document.querySelector('.p3-geometry');
        return {
          view: VIEW,
          length: text.length,
          text: text.slice(0, 500),
          heading: main && main.querySelector('h1,h2') && main.querySelector('h1,h2').innerText || '',
          inlineError: document.getElementById('__piErr') && document.getElementById('__piErr').innerText || '',
          contextTrigger: Boolean(document.querySelector('[data-p3-context]')),
          identityKind: document.querySelector('.p3-identity') && document.querySelector('.p3-identity').dataset.identityKind || '',
          shape: shape ? {
            tag: shape.tagName,
            orientation: shape.dataset.o,
            path: shape.querySelector('path') && shape.querySelector('path').getAttribute('d') || ''
          } : null
        };
      });
      const unavailable = /غير متاحة لهذا الدور|المسار غير متاح|route unavailable/i.test(state.text);
      const missing = state.length < 20 || Boolean(state.inlineError) || Boolean(evalError);
      rows.push({ route, ...state, unavailable, errors: session.errors.slice(before) });
      if (unavailable) report.unavailable.push({ role, route, text: state.text });
      if (missing) report.missing.push({ role, route, length: state.length, inlineError: state.inlineError, evalError });
      if (route === 'smartHome') {
        if (!state.shape || state.shape.tag.toLowerCase() !== 'svg') throw new Error(role + ': smart home is missing approved SVG geometry');
        if (state.shape.orientation !== expectedOrientation[role]) throw new Error(role + ': wrong geometry orientation ' + state.shape.orientation);
        if (state.shape.path !== expectedPath) throw new Error(role + ': geometry path differs from approved archive');
      }
    }
    report.roles[role] = {
      routes: rows,
      contextOptions: await session.page.evaluate(async () => {
        const center = await PI3.loadContext(true);
        return PI3.contextOptions(center).map((option) => ({ title: option.title, sub: option.sub, type: option.type, responsibility: option.resp }));
      }),
      errors: session.errors
    };
    report.errors.push(...session.errors.map((error) => ({ role, ...error })));
    await session.context.close();
  }

  const academy = await roleContext('academy');
  const contextCenter = await academy.page.evaluate(() => PI3.loadContext(true));
  const organization = contextCenter.organizations[0];
  const requiredResponsibilities = ['owner', 'executive', 'academy_admin', 'finance', 'hr', 'operations', 'registration', 'marketing', 'cashier', 'gate', 'content'];
  const actualResponsibilities = organization.responsibilities.map((item) => item.code);
  for (const required of requiredResponsibilities) {
    if (!actualResponsibilities.includes(required)) throw new Error('missing responsibility ' + required);
  }
  for (const responsibility of organization.responsibilities) {
    academy.setCurrent('responsibility:' + responsibility.code);
    await academy.page.evaluate(async ({ organizationId, code }) => {
      await PI3.rpc('save_my_context_preference', { p_context_type: 'organization', p_organization_id: organizationId, p_responsibility_code: code });
      PI3.clear();
      VIEW = 'smartHome';
      PARAM = null;
      await render();
    }, { organizationId: organization.organization_id, code: responsibility.code });
    await academy.page.waitForTimeout(180);
    report.responsibilities.push(await academy.page.evaluate((item) => ({
      code: item.code,
      label: item.label_ar,
      decisions: [...document.querySelectorAll('.p3-decision b')].map((element) => element.innerText),
      quick: [...document.querySelectorAll('.p3-route b')].map((element) => element.innerText),
      metrics: [...document.querySelectorAll('.p3-metric span')].map((element) => element.innerText)
    }), responsibility));
  }
  await academy.page.evaluate(async ({ organizationId }) => {
    await PI3.rpc('save_my_context_preference', { p_context_type: 'organization', p_organization_id: organizationId, p_responsibility_code: 'owner' });
    PI3.clear();
  }, { organizationId: organization.organization_id });
  report.errors.push(...academy.errors.map((error) => ({ role: 'academy-matrix', ...error })));
  await academy.context.close();

  const publicContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar-SA', timezoneId: 'Asia/Riyadh', serviceWorkers: 'block' });
  const publicPage = await publicContext.newPage();
  const publicErrors = [];
  publicPage.on('pageerror', (error) => publicErrors.push(error.message));
  publicPage.on('response', (response) => {
    if (response.status() >= 400 && !ignoredUrl(response.url())) publicErrors.push(response.status() + ' ' + response.url());
  });
  for (const slug of publicSlugs) {
    await publicPage.goto(base + '/?identity=' + slug + '&t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await publicPage.waitForTimeout(650);
    report.publicIdentities.push({
      slug,
      heading: await publicPage.locator('.p3-public h1').first().innerText().catch(() => ''),
      achievementCount: await publicPage.locator('.p3-achievement').count(),
      emptyText: await publicPage.locator('.p3-empty').first().innerText().catch(() => '')
    });
  }
  report.errors.push(...publicErrors.map((message) => ({ role: 'public', message })));
  await publicContext.close();

  fs.writeFileSync(process.env.REPORT_PATH || '/tmp/three-pillars-production-acceptance.json', JSON.stringify(report, null, 2));
  const expectedRouteChecks = Object.values(contract.roles).reduce((sum, spec) => sum + spec.legacyRouteCount + contract.foundationRoutes.length, 0);
  const actualRouteChecks = Object.values(report.roles).reduce((sum, value) => sum + value.routes.length, 0);
  const success =
    report.release.status === 200 &&
    report.release.data.version === '2026.10.28-three-pillars-foundation-rc3' &&
    report.fixtures.status === 200 &&
    ['live', 'demo_fallback'].includes(report.fixtures.data.mode) &&
    expectedRouteChecks === 91 &&
    actualRouteChecks === 91 &&
    report.errors.length === 0 &&
    report.missing.length === 0 &&
    report.unavailable.length === 0 &&
    report.publicIdentities.length === 5 &&
    report.publicIdentities.every((item) => item.heading) &&
    report.responsibilities.length >= 11;

  console.log(JSON.stringify({
    release: report.release,
    fixtures: { status: report.fixtures.status, mode: report.fixtures.data.mode, source: report.fixtures.data.source },
    routeChecks: actualRouteChecks,
    errors: report.errors,
    missing: report.missing,
    unavailable: report.unavailable,
    responsibilities: report.responsibilities.map((item) => ({ code: item.code, decisions: item.decisions, metrics: item.metrics })),
    publicIdentities: report.publicIdentities
  }, null, 2));
  await browser.close();
  if (!success) process.exit(2);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
