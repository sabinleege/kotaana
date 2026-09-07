# Product-ready checklist

## Portals (one Vercel app)

See `docs/PORTALS_ON_VERCEL.md`.

- Athlete: `/auth` → `/app`
- Coach: `/coach-auth` → `/coach`
- Owner: `/owner-auth` → `/admin`

## Block 3 UI completed in package

- [x] Risk score + goal plan on home; `/app/goals`
- [x] Injury timeline on Health
- [x] Nutrition week adherence
- [x] Monthly progress intelligence on Progress
- [x] Medical documents page `/app/medical`
- [x] EmptyState component + coach recommendations empty
- [x] Legal pages + landing links
- [x] PUBLISH.md + PORTALS_ON_VERCEL.md

## You still do

- [ ] Env + DB migrate + seed on Vercel
- [ ] Push this zip to GitHub `coach-connect`
- [ ] Smoke test three portal URLs on same domain
