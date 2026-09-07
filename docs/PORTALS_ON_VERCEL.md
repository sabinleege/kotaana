# Three portals, one Vercel project

You do **not** need three Vercel apps.

One deployment hosts everything:

| Portal | Sign-in URL | After login |
|--------|-------------|-------------|
| Athlete | `https://YOUR-DOMAIN/auth` | `/app` |
| Coach | `https://YOUR-DOMAIN/coach-auth` | `/coach` |
| Owner | `https://YOUR-DOMAIN/owner-auth` | `/admin` |

Same database, same env vars, same GitHub repo.

Example (current):
- https://coach-connect-snowy.vercel.app/auth
- https://coach-connect-snowy.vercel.app/coach-auth
- https://coach-connect-snowy.vercel.app/owner-auth

Optional later: custom subdomains (`athlete.`, `coach.`, `owner.`) pointing at the **same** project with redirects — not required.
