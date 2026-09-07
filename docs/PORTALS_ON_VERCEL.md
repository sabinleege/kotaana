# Three portals

One codebase serves three audiences. It can run **combined** (one host, three
sign-in paths) or **split** (each portal on its own host/port).

| Portal  | Role    | Sign-in       | After login | Google sign-in |
| ------- | ------- | ------------- | ----------- | -------------- |
| Athlete | `user`  | `/auth`       | `/app`      | yes            |
| Coach   | `coach` | `/coach-auth` | `/coach`    | yes            |
| Owner   | `admin` | `/owner-auth` | `/admin`    | no (password)  |

Same database, same env vars, same repo.

## Local development — split (each portal on its own port)

```bash
npm run dev:all        # all three at once
```

| Portal  | URL                     | Notes                          |
| ------- | ----------------------- | ------------------------------ |
| Athlete | http://localhost:8080   | **hosts the landing page** `/` |
| Coach   | http://localhost:8081   | `/` → `/coach-auth`            |
| Owner   | http://localhost:8082   | `/` → `/owner-auth`            |

Run one at a time with `npm run dev:athlete`, `dev:coach`, `dev:owner`.

Each portal only serves its own area. Requests for another portal's pages are
redirected to this portal's own entry point.

### Two things that bite

**Cookies ignore the port.** A session created on `:8080` is also sent to
`:8081` and `:8082`, because browsers scope cookies by host only. So a portal
must expect a signed-in user holding the *wrong* role. It sends them to its own
login with `?error=WrongPortal` (see `PortalNotice`) rather than to "their"
home — bouncing to a home that this portal doesn't serve is an infinite
redirect loop. To be genuinely separate, deploy on different hostnames.

**`NEXT_PUBLIC_*` is inlined at build time.** Three dev servers sharing one
`.next` directory would all inherit whichever portal compiled first, so each
script sets its own `NEXT_DIST_DIR` (`.next-athlete`, `.next-coach`,
`.next-owner`).

## Combined (default, and what Vercel uses)

Leave `NEXT_PUBLIC_PORTAL` unset and everything is reachable from one host:

- https://YOUR-DOMAIN/auth
- https://YOUR-DOMAIN/coach-auth
- https://YOUR-DOMAIN/owner-auth

You do **not** need three Vercel projects. To split in production, deploy the
same project three times with `NEXT_PUBLIC_PORTAL` set per deployment, and give
each its own domain.

## Google sign-in

Athlete and coach portals both offer "Continue with Google". The owner portal is
password-only on purpose — it is the control plane.

Google returns the same profile whichever portal you start from, so the button
records which door was used (`kotaana_role_intent` cookie) and `auth.ts` reads
it when **creating** a new account. An existing account's role is never changed
by that cookie.

Set up credentials at
<https://console.cloud.google.com/apis/credentials> → *Create OAuth client ID* →
*Web application*, then add **one authorized redirect URI per portal host**:

```
http://localhost:8080/api/auth/callback/google
http://localhost:8081/api/auth/callback/google
```

(The owner portal needs none.) Then set in `.env`:

```
AUTH_GOOGLE_ID="…"
AUTH_GOOGLE_SECRET="…"
```

Until those are set, the Google button renders but Google rejects the request —
email/password sign-in works regardless.

## Env reference

| Variable                   | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_PORTAL`       | `athlete` \| `coach` \| `owner`; unset = combined  |
| `NEXT_DIST_DIR`            | Per-portal build dir (split mode only)             |
| `AUTH_URL`                 | This instance's own origin — must match the port   |
| `NEXT_PUBLIC_ATHLETE_URL`  | Where cross-portal links point                     |
| `NEXT_PUBLIC_COACH_URL`    | ”                                                  |
| `NEXT_PUBLIC_OWNER_URL`    | ”                                                  |
