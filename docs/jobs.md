# Background Jobs

## Current implementation
In-process queue (`src/lib/jobs/queue.ts`) with:
- enqueue + delayed run
- one automatic retry
- handler registry

## Registered jobs
| Name | Purpose |
|------|---------|
| `profile-report.refresh` | Rebuild 3-day AI profile report (via workflow) |
| `photo.comparison` | Monthly progress photo comparison |
| `health.sync` | Pull Google Health / cache distance |
| `credit.reset` | Clean expired rate counters |
| `notification.dispatch` | Create a notification row |

## Admin API
- `GET /api/admin/jobs` — list recent jobs
- `POST /api/admin/jobs` — `{ name, payload?, delayMs? }`

## Production upgrade path
1. **Inngest** — serverless, great with Vercel  
2. **BullMQ + Redis** — classic reliable queues  
3. **pg_cron** — simple scheduled SQL jobs  

Replace `enqueue` / `registerJob` internals; keep the same job names and handlers.
