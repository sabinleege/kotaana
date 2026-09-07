# Daily cycle workflow

## Day change (login / open app)

1. `GET /api/me` calls `ensureDayRollover`.
2. If `lastDayKey !== today (YYYY-MM-DD)`:
   - `waterGlasses = 0`
   - `lastDayKey = today`
3. **Calories / meals:** stored per date on `MealLog`. UI loads `date=today` → new day shows **0** until the user logs food. History of other days is kept.
4. Daily report for the new day is ensured (`ensureDailyReport`).

## Once per day report

- Built from profile report + meals (today/yesterday) + check-in + water/calorie targets.
- Cached on profile: `dailyReportDate` + `dailyReportText`.
- Cron optional: `POST /api/jobs/daily-cycle` with `x-cron-secret`.

## Session → cards

- `GET /api/ai/daily-session` → algorithm scores dataset exercises → warmup / work / **break** / finisher.
- Saved as `dailySessionJson` for the day.
- `TodayWorkoutCard` renders the list; break rows highlighted.

## Reset summary

| Metric | New day behavior |
|--------|------------------|
| Water glasses | Reset to 0 |
| Calories / protein today | Empty meal log for new date → 0 |
| Workout session | New session for new dayKey |
| Daily report | Rebuilt for new dayKey |
| Past meal logs | Kept by date |
