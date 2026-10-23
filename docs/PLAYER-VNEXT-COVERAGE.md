# PlayIn365 — Player VNext Coverage

Status: production architecture baseline + Player VNext rollout
Owner surface: player
Canonical product: https://playin365.app

## Recovery and release anchors
- Production baseline branch: `baseline-prod-2026-10-23`
- Baseline commit: `9453e73158ae05f187d3632eedf4feb5c4c49798`
- First Player VNext production merge: `49b3ce6bf735d06484e9ff2b238773df422bd138`
- Runtime database: Supabase `qmpwekibhdzmpmdbuvxz`
- Vercel project: `prj_Qr0tlaNo3bnuLCxzAxxTmoRBuUEf`

## Player service map
| Surface | Route | Visibility | Core operations preserved |
|---|---|---|---|
| هويتي الرياضية | publicView / myCard | public profile + owner controls | share identity, media, visitor view |
| السجل والأداء | records | private | verified matches/events, goals, assists |
| تفاصيل التقييم | ratingDetail | private | rating method and breakdown |
| خزانة الإنجازات | cabinet | private / selected public evidence | badges and achievements |
| الفرص والدعوات | opps | private | opportunities and responses |
| الجدول والمحفظة | wallet / calendar | private | schedule, subscriptions, payment state |
| الصحة والجاهزية | health | private | readiness and return-to-play status |
| الرسائل | messages | shared with permissions | messaging |
| من رأى ملفك | viewLog | private | visitor/access log |
| الخصوصية | privacy | private | visibility and access controls |
| اكتشف حولك | explore | shared | matches, venues and discovery |
| البحث | find | shared | people, organizations, venues, events |
| المجتمع الرياضي | pitch | shared | community interactions |
| الأخبار | news | shared | sports/news feed |
| السوق والخدمات | market | shared | marketplace/services |
| الإعدادات | settings | private | account and identity preferences |

## VNext shell
- Sports pulse ticker: `نبضك الرياضي`
- Persistent player navigation: مساحتي / اكتشف / أدائي / فرصي / هويتي
- Floating quick-action button: media / academy link / share identity / opportunities / all services
- Player home: identity hero, next action, performance pulse, opportunities, private zone, story/media, complete service map
- Public identity: public sports passport, verified record, performance, achievements, career map, selected media
- Public identity must never show: health, messages, wallet, private appointments, account settings

## Compatibility rule
Detailed legacy service screens remain functionally intact during migration and are rendered inside the Player VNext visual shell. A route is not removed until its replacement preserves every existing operation and passes browser QA.

## Release rule
1. Change on a feature branch.
2. Vercel Preview must be READY.
3. Browser QA on demo player.
4. Merge to main.
5. Verify production deployment, official domain, and post-deploy smoke test.
