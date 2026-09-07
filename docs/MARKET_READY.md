# Market-ready extensions

## Shipped in this build

| System | Paths |
|--------|--------|
| Persistent AI memory | `lib/profile-report.ts`, `lib/memory/weekly-summary.ts`, chat uses `getAiMemoryContext` |
| Recommendation Done/Skip | `POST /api/recommendations` → `RecommendationEvent` + adherence |
| Nutrition adherence | `GET /api/nutrition/stats` |
| Injury timeline | `POST /api/injuries/timeline`, `lib/injury/timeline.ts` |
| Pregnancy rules | `lib/pregnancy/workflow.ts` (injected into chat) |
| Health risk engine | `GET /api/ai/risk`, daily job |
| Goal planner | `POST/GET /api/ai/goal-plan` |
| Monthly progress | `POST/GET /api/ai/monthly-progress` |
| Medical docs AI | `POST/GET /api/ai/medical-doc` |
| Coach learning | `POST /api/coach/learning` |
| Cost helpers | `lib/cache/simple-cache.ts`, report TTL |
| Daily agent | `POST /api/jobs/daily-analysis` (header `x-cron-secret` if `CRON_SECRET` set) |

## Not removed
Workflow engine, jobs, payments, orgs scaffolds remain for later.

## DB
Apply migration folder `prisma/migrations/20260730120000_market_ready` or:

```bash
npx prisma db push
npx prisma generate
```

## Portals
Athlete `/auth` · Coach `/coach-auth` · Owner `/owner-auth` — no demo users.
