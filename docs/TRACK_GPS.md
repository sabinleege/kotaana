# GPS distance tracking (Option A)

## Already in the app
- Athlete nav → **Track** (`/app/track`)
- Start / Finish run, walk, or ride
- Browser Geolocation + haversine distance
- Saves to `run_activities` via `POST /api/runs`
- Calories estimate → daily activity totals
- Daily report includes km when you tracked that day

## What you must do to make it work

1. **Deploy on HTTPS** (Vercel already is). GPS is blocked on insecure http except localhost.
2. **Allow location** in the browser/phone when prompted.
3. Open **https://YOUR-APP/app/track** while logged in as athlete.
4. Ensure DB has `run_activities` table (`npx prisma db push`).
5. (Optional) Google Maps route drawing:
   - Google Cloud → enable **Maps JavaScript API**
   - Create key, restrict to your domain
   - Vercel env: `NEXT_PUBLIC_GOOGLE_MAPS_KEY=...`
   - Redeploy (map UI can be extended to use the key)

## Not required
- Google Health Connect / Fit (mobile wrapper later)
- OpenRouter / Gemini (unrelated to GPS)

## Test checklist
- [ ] Login as athlete
- [ ] /app/track → Start → walk a short path → Finish & save
- [ ] Activity appears under Recent
- [ ] Distance today updates
