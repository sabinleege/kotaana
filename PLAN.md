# Migration Plan — Unify kotaana-ai + coach-connect on Next.js + Prisma + Postgres

**Goal:** Merge `C:\xampp\htdocs\kotaana-ai` (athlete app) into this repo (`coach-connect`, coach app),
convert the whole thing to **Next.js 15 (App Router) + Prisma + local PostgreSQL**, and **remove Supabase and
Lovable entirely**.

**The product idea:** A person uses **kotaana** to track their own fitness data (workouts, meals, weight,
activity, injuries). They may use it purely solo. If they accept a **coach** invite, that coach can *follow up*
on them — read their tracked data, add notes, injuries, follow-ups, and schedule sessions. One athlete → at
most the coaches they've linked to; a coach → many athletes. The link row is `CoachAthleteRelation`.

## Decisions (locked)
- **Auth:** Auth.js (NextAuth v5) + Prisma adapter. Email/password (Credentials) now; OAuth (Google/Apple) later.
- **AI:** Keep **Gemini** (`gemini-2.5-flash`) but call **Google's Gemini API directly** (drop Lovable gateway).
  Env: `GEMINI_API_KEY`. Four functions to port: workout-plan, meal-vision, analyze, chat.
- **Shape:** Single Next.js app, role-based areas. After login: `role=user` → `/app` (athlete),
  `role=coach` → `/coach`, `role=admin` → `/admin`.
- **DB:** local Postgres 18 on 127.0.0.1:5432. Prisma-managed database (fresh, e.g. `kotaana`).
  Postgres superuser password is known to the operator.

## Source apps (as-found)
### coach-connect (this repo — destination)
- TanStack Start + React 19 + Vite, file-based routing. shadcn/ui + Tailwind v4.
- Data: React Query hooks calling supabase-js client-side (RLS) + some `createServerFn` server functions
  using a service-role admin client (`integrations/supabase/client.server`).
- Auth gate: `src/routes/_authenticated/route.tsx` via `supabase.auth.getUser()`.
- Tables: user_roles, profiles, coach_athlete_relations, weight_history, workout_logs, activity_data,
  meal_logs, notifications, injuries, coach_notes, follow_ups, coach_invites, sessions, subscriptions.
- Screens: coach overview, athletes (+ $athleteId), analytics, injuries, follow-ups, sessions, invites,
  notifications, subscription, settings.
- NOTE: migration `accept_coach_invite` inserts notifications(type,title,body,data) but the notifications
  table is (title,message,type,read). Reconcile in Prisma: notifications = {title, message, type, read, data?}.

### kotaana-ai (source — to merge in)
- Vite + React 18 + React Router SPA (client-only). shadcn/ui + Tailwind. Uses `@lovable.dev/cloud-auth-js`.
- Already has a local-Postgres path: `database/local_init.sql` + `server/local-api.mjs` (a Supabase REST shim).
- AI edge functions (Supabase/Deno): `generate-workout-plan`, `ai-vision-meal`, `ai-analyze`, `ai-chat`
  → all via `https://ai.gateway.lovable.dev` with `google/gemini-2.5-flash` + `LOVABLE_API_KEY`.
- Tables: profiles (rich onboarding), meal_logs, workout_logs, workout_plans, goal_progress, notifications,
  weight_history, activity_data, ai_usage. Storage buckets: avatars (public), meals (private).
- Screens: Auth, Onboarding, Dashboard(Index), Workout, Nutrition, FollowUp, Progress, Profile,
  Subscription, Settings, Admin.

## Merged data model (Prisma) — ~17 models
- **User** (NEW, replaces Supabase auth.users): id, email(unique), passwordHash, role(user|coach|admin), timestamps.
- **Profile** (1:1 User): union of both profile tables — kotaana onboarding fields (age, height, weight,
  goals[], injuries jsonb, dietary/equipment/training prefs, consent flags, profile_hash, onboarding_completed…)
  + coach-connect roster fields (adherence_percentage, last_active_at, primary_goal, fitness/recovery/consistency).
- **Athlete tracking:** MealLog, WorkoutLog, WorkoutPlan, GoalProgress, WeightHistory, ActivityData, AiUsage.
- **Coaching:** CoachAthleteRelation (coachId, athleteId, status, covered_by_coach), CoachNote, FollowUp,
  Injury, Session (athleteIds uuid[]), CoachInvite (invite_code, accept flow).
- **Shared:** Notification, Subscription.
- **Dropped Supabase constructs:** storage.* (file uploads → local disk or S3 later), auth.uid(), RLS policies,
  realtime publications. Realtime → React Query refetch/polling (SSE later if needed).

## Authorization (replaces RLS — enforced in server layer)
Every RLS policy becomes a Prisma query scope in the API route/handler:
- Owner access: `where: { userId: session.user.id }`.
- Coach read of athlete data: allowed iff an active `CoachAthleteRelation(coachId=session.user, athleteId)` exists.
- Coach-note visibility, follow-up ownership, invite accept, admin overrides — all as explicit checks.
- Central helper: `lib/authz.ts` (`requireUser`, `requireRole`, `coachesAthlete(coachId, athleteId)`).

## Phases
1. **Scaffold** — Next.js 15 + TS + Tailwind v4 + shadcn in this repo. Keep old code until cutover.
   Install prisma, @prisma/client, next-auth@5, bcrypt, @google/generative-ai, zod, @tanstack/react-query.
2. **DB + schema** — write prisma/schema.prisma; `prisma migrate dev`; port `demo.functions.ts` → seed script
   (demo coach + 6 athletes with tracking data).
3. **Auth** — Auth.js config, register/login/logout, middleware role-gating, session helpers.
4. **Data API + hooks** — `/api/*` route handlers with authz; rewrite React Query hooks to hit them
   (replace all supabase-js calls in both apps).
5. **Port UI** — athlete screens (kotaana pages → App Router under /app), coach screens (already close;
   swap data layer + routing from TanStack to Next).
6. **AI routes** — `/api/ai/{workout,meal,analyze,chat}` calling Gemini API directly.
7. **Cutover** — delete supabase/, Lovable configs, TanStack config, vite config, old client files.
   Update .env. Run `/verify` on athlete solo flow, coach follow-up flow, invite-accept link flow.

## Env (target .env)
```
DATABASE_URL="postgresql://postgres:<pw>@127.0.0.1:5432/kotaana?schema=public"
AUTH_SECRET="<generated>"
GEMINI_API_KEY="<google ai studio key>"
```

## Risks / watch-items
- Two React majors (18 vs 19) — Next 15 standardizes on React 19; audit kotaana deps (framer-motion,
  react-day-picker v8 vs v9, date-fns v3 vs v4) during port.
- RLS → server authz is the highest-risk surface (security-sensitive). Review each resource's access rules.
- File uploads (avatars, meal photos) currently use Supabase Storage → need local/S3 replacement.
- Notifications column drift (body/message) — normalize.
- No Supabase realtime → convert subscriptions to polling.
