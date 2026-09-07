# Three portals only (no demo accounts)

## Logins

| Who | Sign-in URL | After login |
|-----|-------------|-------------|
| **Athlete** | http://localhost:8080/auth | `/app` |
| **Coach** | http://localhost:8080/coach-auth | `/coach` |
| **App owner** | http://localhost:8080/owner-auth | `/admin` (metrics) |

Landing: http://localhost:8080/

## No demo users
Seed does **not** create demo coach/athletes.
- Athletes: register on `/auth`
- Coaches: register on `/coach-auth`
- Owner: **First-time owner setup** on `/owner-auth` (only if no owner exists yet), or set `OWNER_EMAIL` + `OWNER_PASSWORD` and run `npx prisma db seed`

## Run
```bash
npm install && npx prisma generate && npx prisma migrate dev
npm run dev
```
