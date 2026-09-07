# Publish checklist — Kotaana / Coach Connect

## Live project (already on Vercel)

- Project: **coach-connect**
- Production URL: https://coach-connect-snowy.vercel.app
- GitHub: `sabinleege/coach-connect`
- Team: sabinleeges-projects

## A. Environment variables (Vercel → Project → Settings → Environment Variables)

Set for **Production** (and Preview if you want):

| Name | Example / notes |
|------|------------------|
| `DATABASE_URL` | Neon/Supabase Postgres connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://coach-connect-snowy.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `GEMINI_API_KEY` | From Google AI Studio |
| `AUTH_GOOGLE_ID` | Optional Google OAuth |
| `AUTH_GOOGLE_SECRET` | Optional |
| `CRON_SECRET` | Random string for job routes |
| `STRIPE_SECRET_KEY` | When enabling payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook |
| `S3_*` | When enabling object storage |

After changing env: **Redeploy**.

## B. Database

```bash
# Locally, pointed at PRODUCTION DATABASE_URL (careful):
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
# or: npx prisma db push
npx prisma generate

# Exercise library (one-time)
export DATASET=/path/to/exercises.json
npx tsx prisma/seed-exercises.ts
```

Owner bootstrap (optional):

```bash
OWNER_EMAIL=you@example.com OWNER_PASSWORD='long-password' OWNER_NAME='Owner' npx tsx prisma/seed.ts
```

Or use **First-time owner setup** at `/owner-auth`.

## C. Smoke test

1. Open https://coach-connect-snowy.vercel.app  
2. Athlete: `/auth` → `/app` — generate workout, mark Done  
3. Coach: `/coach-auth` → `/coach`  
4. Owner: `/owner-auth` → `/admin` metrics  
5. Nutrition photo / AI chat if `GEMINI_API_KEY` set  

## D. After pushing market-ready code

```bash
git add -A && git commit -m "feat: market-ready + product UI"
git push origin main   # Vercel redeploys automatically
```

## E. Next (commercial)

- Stripe webhooks → Vercel URL `/api/payments/...`
- Vercel Cron → `POST /api/jobs/daily-analysis` with header `x-cron-secret: $CRON_SECRET`
- Custom domain → Project → Domains; update `AUTH_URL`
