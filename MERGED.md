# Kotaana — Fully Merged App

This package is your original **coach-connect-main** repo plus all new systems connected.

## Two portals (separate login)

| Who | Login | Home |
|-----|-------|------|
| Athlete | `/auth` | `/app` |
| Coach | `/coach-auth` | `/coach` |
| Admin | `/auth` | `/admin` |

Middleware enforces roles. Coaches cannot use `/app`; athletes cannot use `/coach`.

## Coach → athlete notifications

`POST /api/coach/follow-ups` creates a `FollowUp` and a `Notification` for the athlete.
Athletes see it in their existing notifications UI.

## New modules added

- `src/lib/ai-system` — RAG, scope guard, agents, context builder
- `src/lib/workflow` — workflow engine
- `src/lib/payments` — Stripe + MoMo + credits
- `src/lib/health` — Track Me / Google Health
- `src/lib/storage` — local + S3/R2
- `src/lib/jobs` — background jobs
- `src/lib/coach` — recommendations engine, access, plans ($40/$80/$200)
- Coach pages: `/coach/statistics`, `/coach/recommendations`, `/coach/settings/members`, `/coach/settings/payment`
- APIs under `/api/coach/*`, `/api/workflow/*`, `/api/payments/*`, `/api/health/*`, `/api/storage/*`, `/api/ai/agents/*`

## Run

```bash
cp .env.example .env.local
# fill DATABASE_URL, AUTH_SECRET, GEMINI_API_KEY
npm install   # or bun install
npx prisma generate
npx prisma migrate dev
npm run dev
```
