# Coach Dashboard (separate portal)

## Entry
- Athletes: `/auth` → `/app/*`
- Coaches: `/coach-auth` → `/coach/*`
- Register coach: `POST /api/auth/register-coach` (role=coach)

## Pages
| Path | Purpose |
|------|---------|
| `/coach` | Home KPIs + at-risk |
| `/coach/athletes` | Managed players table |
| `/coach/athletes/[id]` | Deep dive |
| `/coach/statistics` | Full numbers table |
| `/coach/recommendations` | AI/rules flags + follow-up |
| `/coach/injuries` | Injuries + illness |
| `/coach/sessions` | Sessions scaffold |
| `/coach/settings/members` | On/off manage + invite |
| `/coach/settings/payment` | $40 / $80 / $200 + MoMo |

## APIs
- `GET /api/coach/overview`
- `GET /api/coach/athletes`
- `GET /api/coach/athletes/:id`
- `GET /api/coach/recommendations`
- `POST /api/coach/follow-ups` → FollowUp + Notification to athlete
- `GET/POST/PATCH /api/coach/members`
- `GET /api/coach/injuries`
- `GET /api/coach/billing`

## Plans
- $40 → up to 100 seats
- $80 → up to 200 seats
- $200 enterprise → 200+

## Middleware (add when merging)
```ts
// if path starts with /coach and role !== coach → redirect /coach-auth
// if path starts with /app and role === coach → redirect /coach
```
